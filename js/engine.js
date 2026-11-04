/* Phaser owns scenes, rendering, input, camera, tweens, sound and the game clock.
   The editor and structural solver remain pure, independently testable subsystems. */
(function (root) {
  "use strict";
  const P = root.BridgePhysics;
  function rendererType() {
    const probe = document.createElement("canvas");
    try {
      const gl =
        probe.getContext("webgl") || probe.getContext("experimental-webgl");
      if (gl) {
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        return Phaser.WEBGL;
      }
    } catch {}
    return Phaser.CANVAS;
  }

  class BootScene extends Phaser.Scene {
    constructor(host) {
      super("Boot");
      this.host = host;
    }
    create() {
      // Original illustrations are baked once, then rendered as native Phaser textures.
      for (const material of Object.keys(P.MATERIALS)) {
        const texture = this.textures.createCanvas(
          "member-" + material,
          256,
          24,
        );
        const painter = new BridgeArt(texture.canvas);
        painter.member({ x: 2, y: 12 }, { x: 254, y: 12 }, material);
        texture.refresh();
      }
      const truck = this.textures.createCanvas("delivery", 100, 80);
      new BridgeArt(truck.canvas).truck(
        { x: 0.5, y: 0.4, angle: 0, finished: true },
        { truckMass: 0 },
      );
      truck.refresh();
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x294238).fillCircle(10, 10, 9);
      g.lineStyle(2, 0xdce5c4)
        .lineBetween(10, 4, 10, 16)
        .lineBetween(4, 10, 16, 10);
      g.fillStyle(0xe8e9cf).fillCircle(10, 10, 3);
      g.generateTexture("wheel", 20, 20).clear();
      g.fillStyle(0xffffff).fillCircle(4, 4, 3);
      g.generateTexture("spark", 8, 8).clear();
      g.fillStyle(0xffffff).fillRoundedRect(0, 0, 36, 3, 2);
      g.generateTexture("ripple", 36, 4).clear();
      g.fillStyle(0xffffff)
        .fillRoundedRect(0, 8, 140, 13, 7)
        .fillRoundedRect(30, 0, 65, 15, 8);
      g.generateTexture("cloud", 140, 24).destroy();
      this.makeSounds();
      this.scene.start("Workshop");
    }
    makeSounds() {
      // Procedurally authored PCM tones: no downloads, audio files or external services.
      const context = this.sound.context;
      if (!context || !this.cache.audio) return;
      const definitions = {
        place: { duration: 0.09, notes: [300] },
        reject: { duration: 0.11, notes: [160] },
        start: { duration: 0.3, notes: [220, 330] },
        snap: { duration: 0.15, notes: [130, 70] },
        success: { duration: 0.65, notes: [523.25, 659.25, 783.99] },
      };
      for (const [key, spec] of Object.entries(definitions)) {
        const buffer = context.createBuffer(
            1,
            Math.ceil(context.sampleRate * spec.duration),
            context.sampleRate,
          ),
          data = buffer.getChannelData(0);
        const segment = spec.duration / spec.notes.length;
        for (let i = 0; i < data.length; i++) {
          const time = i / context.sampleRate,
            n = Math.min(spec.notes.length - 1, Math.floor(time / segment)),
            phase = time - n * segment;
          const envelope =
            Math.min(1, phase / 0.006) * Math.exp(-phase / (segment * 0.24));
          data[i] =
            Math.sin(2 * Math.PI * spec.notes[n] * phase) * envelope * 0.3;
        }
        this.cache.audio.add("tone-" + key, buffer);
      }
    }
  }

  class WorkshopScene extends Phaser.Scene {
    constructor(host) {
      super("Workshop");
      this.host = host;
    }
    create() {
      this.members = new Map();
      this.nodes = new Map();
      this.labels = [];
      this.ripples = [];
      this.clouds = [];
      this.background = null;
      this.lastLevel = null;
      this.lastWorld = null;
      this.brokenSeen = new Set();
      this.grid = this.add.graphics().setDepth(1);
      this.structureGraphics = this.add.graphics().setDepth(5);
      this.preview = this.add
        .image(0, 0, "member-road")
        .setOrigin(0, 0.5)
        .setDepth(9)
        .setVisible(false)
        .setAlpha(0.6);
      this.previewText = this.add
        .text(0, 0, "", {
          fontFamily: "Arial",
          fontSize: "12px",
          color: "#274d3b",
          backgroundColor: "#f0f2dc",
          padding: { x: 6, y: 3 },
        })
        .setOrigin(0.5, 1)
        .setDepth(11)
        .setVisible(false);
      this.guide = this.add.graphics().setDepth(2);
      this.guideText = this.add
        .text(0, 0, "YOUR ROAD GOES HERE", {
          fontFamily: "Arial",
          fontSize: "10px",
          color: "#446c5b",
          letterSpacing: 2,
        })
        .setOrigin(0.5)
        .setDepth(2);
      this.vehicle = this.add.container(0, 0).setDepth(8);
      this.vehicle.add(this.add.image(0, 0, "delivery"));
      this.wheels = [
        this.add.image(-22, 9, "wheel"),
        this.add.image(22, 9, "wheel"),
      ];
      this.vehicle.add(this.wheels);
      this.loadText = this.add
        .text(0, 0, "", {
          fontFamily: "Arial",
          fontSize: "11px",
          color: "#315a46",
        })
        .setOrigin(0.5, 1)
        .setDepth(8);
      this.host.scene = this;
      this.scene.launch("HUD");
      this.input.on("pointerdown", (pointer) => {
        this.sound.unlock?.();
        this.host.dispatchPointer("pointerdown", pointer);
      });
      this.input.on("pointermove", (pointer) =>
        this.host.dispatchPointer("pointermove", pointer),
      );
      this.input.on("pointerup", (pointer) =>
        this.host.dispatchPointer("pointerup", pointer),
      );
      this.input.on("pointerupoutside", (pointer) =>
        this.host.dispatchPointer("pointerup", pointer),
      );
      this.scale.on("resize", () => {
        this.host.width = this.scale.width;
        this.host.height = this.scale.height;
      });
      this.host.canvas.dataset.engine = "phaser-" + Phaser.VERSION;
      document.body.dataset.engineReady = "true";
      document
        .getElementById("engine-status")
        ?.replaceChildren(document.createTextNode("PHASER " + Phaser.VERSION));
      this.events.once("shutdown", () => {
        this.input.removeAllListeners();
      });
    }
    levelChanged(level, reduced) {
      const key = "landscape-" + level.id;
      if (!this.textures.exists(key)) {
        const texture = this.textures.createCanvas(key, 3000, 2400),
          painter = new BridgeArt(texture.canvas);
        painter.view = { x: 800, y: 1000, scale: 1 };
        painter.scenery(level, 0);
        texture.refresh();
      }
      if (this.background) this.background.destroy();
      this.background = this.add
        .image(-800, -1000, key)
        .setOrigin(0)
        .setDepth(-20);
      this.labels.forEach((x) => x.destroy());
      this.labels = [];
      this.clouds.forEach((x) => x.destroy());
      this.clouds = [];
      this.ripples.forEach((x) => x.destroy());
      this.ripples = [];
      for (const x of [level.left, level.right])
        this.labels.push(
          this.add
            .text(x, level.deckY + 49, "FIXED ANCHOR", {
              fontFamily: "Arial",
              fontSize: "9px",
              color: "#eef0d7",
            })
            .setOrigin(0.5)
            .setDepth(2),
        );
      this.labels.push(
        this.add
          .text(
            (level.left + level.right) / 2,
            level.deckY + 132,
            ((level.right - level.left) / 100).toFixed(1) + " m",
            { fontFamily: "Arial", fontSize: "12px", color: "#416c58" },
          )
          .setOrigin(0.5)
          .setDepth(2),
      );
      this.guide
        .clear()
        .lineStyle(1, 0x547969, 0.4)
        .lineBetween(
          level.left,
          level.deckY + 111,
          level.right,
          level.deckY + 111,
        );
      for (let i = 0; i < 6; i++) {
        const x =
            level.left + 50 + ((i * 103) % (level.right - level.left - 90)),
          y = level.deckY + 105 + i * 35;
        const ripple = this.add
          .image(x, y, "ripple")
          .setAlpha(0.45)
          .setDepth(-3);
        this.ripples.push(ripple);
        if (!reduced)
          this.tweens.add({
            targets: ripple,
            x: x + 20,
            alpha: 0.12,
            duration: 2600 + i * 220,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
          });
      }
      for (let i = 0; i < 2; i++) {
        const cloud = this.add
          .image(level.left + 180 + i * 290, 70 + i * 65, "cloud")
          .setAlpha(0.28)
          .setDepth(-5);
        this.clouds.push(cloud);
        if (!reduced)
          this.tweens.add({
            targets: cloud,
            x: cloud.x + 70,
            duration: 22000 + i * 4000,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
          });
      }
      if (!reduced) this.cameras.main.fadeIn(240, 218, 233, 229);
      this.host.events.emit("mission", level);
    }
    update(time, delta) {
      if (this.host.tick) this.host.tick(time, delta);
      if (
        !document.hidden &&
        !document.getElementById("modal").open &&
        this.host.state?.world &&
        !this.host.state.paused
      ) {
        const v = this.host.state.world.vehicle;
        if (v && !v.falling && !v.finished && this.host.state.world.time > 1.5)
          this.wheels.forEach(
            (w) => (w.rotation += delta * 0.004 * this.host.state.speed),
          );
      }
    }
    makeMember() {
      return {
        first: this.add
          .image(0, 0, "member-wood")
          .setOrigin(0, 0.5)
          .setDepth(3),
        second: this.add
          .image(0, 0, "member-wood")
          .setOrigin(0, 0.5)
          .setDepth(3)
          .setVisible(false),
      };
    }
    positionMember(image, a, b, material, alpha = 1) {
      image
        .setTexture("member-" + material)
        .setPosition(a.x, a.y)
        .setRotation(Math.atan2(b.y - a.y, b.x - a.x))
        .setDisplaySize(
          Math.max(0.1, Math.hypot(b.x - a.x, b.y - a.y)),
          material === "road" ? 24 : material === "cable" ? 19 : 22,
        )
        .setAlpha(alpha)
        .setVisible(true);
    }
    renderState(state) {
      if (!state?.editor) return;
      const level = state.level,
        w = state.world,
        d = state.editor.design;
      if (this.lastLevel !== level.id) {
        this.lastLevel = level.id;
        this.levelChanged(level, state.reduced);
      }
      if (this.lastWorld !== w) {
        this.lastWorld = w;
        this.brokenSeen.clear();
      }
      const camera = this.cameras.main,
        view = this.host.calculateView(level),
        width = this.scale.width,
        height = this.scale.height;
      camera
        .setZoom(view.scale)
        .setScroll(
          (width / 2 - view.x) / view.scale - width / 2,
          (height / 2 - view.y) / view.scale - height / 2,
        )
        .setBackgroundColor("#d6e8ec");
      const position = (id) => {
        const physical = w?.byId.get(id);
        if (physical) return { x: physical.x * 100, y: physical.y * 100 };
        if (state.moving?.id === id) return state.pointer;
        return d.nodes.find((n) => n.id === id);
      };
      this.grid.clear();
      if (state.grid && state.mode === "build") {
        this.grid.fillStyle(0x486c46, 0.2);
        for (let x = level.left - 150; x <= level.right + 150; x += 25)
          for (let y = 155; y <= 655; y += 25)
            this.grid.fillCircle(x, y, 1 / Math.sqrt(view.scale));
      }
      const g = this.structureGraphics;
      g.clear();
      const present = new Set();
      for (const edge of w?.members || d.members) {
        const a = position(edge.a),
          b = position(edge.b);
        if (!a || !b) continue;
        present.add(edge.id);
        let object = this.members.get(edge.id);
        if (!object) {
          object = this.makeMember();
          this.members.set(edge.id, object);
        }
        if (edge.broken) {
          const left = {
              x: a.x + (b.x - a.x) * 0.43,
              y: a.y + (b.y - a.y) * 0.43,
            },
            right = {
              x: a.x + (b.x - a.x) * 0.57,
              y: a.y + (b.y - a.y) * 0.57,
            };
          this.positionMember(object.first, a, left, edge.material, 0.8);
          this.positionMember(object.second, right, b, edge.material, 0.8);
          if (!this.brokenSeen.has(edge.id)) {
            this.brokenSeen.add(edge.id);
            this.host.effect("snap", {
              x: (a.x + b.x) / 2,
              y: (a.y + b.y) / 2,
              material: edge.material,
            });
          }
        } else {
          this.positionMember(object.first, a, b, edge.material);
          object.second.setVisible(false);
          if (
            edge.material === "cable" &&
            !(edge.force > 10) &&
            state.mode !== "build"
          ) {
            object.first.setVisible(false);
            g.lineStyle(3, 0xb1bfbd, 1);
            const curve = new Phaser.Curves.QuadraticBezier(
              new Phaser.Math.Vector2(a.x, a.y),
              new Phaser.Math.Vector2(
                (a.x + b.x) / 2,
                (a.y + b.y) / 2 +
                  Math.min(25, Math.hypot(b.x - a.x, b.y - a.y) * 0.08),
              ),
              new Phaser.Math.Vector2(b.x, b.y),
            );
            g.strokePoints(curve.getPoints(15), false);
          }
        }
        if (state.forces && Math.abs(edge.force || 0) > 30) {
          g.lineStyle(
            3,
            edge.ratio > 1 ? 0xd65741 : edge.force > 0 ? 0x4a9cae : 0xd18050,
            0.9,
          ).lineBetween(a.x, a.y, b.x, b.y);
        }
        if (state.hoverMember === edge.id) {
          g.lineStyle(14, 0xeff0b4, 0.25).lineBetween(a.x, a.y, b.x, b.y);
        }
      }
      for (const [id, object] of this.members)
        if (!present.has(id)) {
          object.first.destroy();
          object.second.destroy();
          this.members.delete(id);
        }
      const nodesPresent = new Set();
      for (const n of d.nodes) {
        const p = position(n.id);
        if (!p) continue;
        nodesPresent.add(n.id);
        let circle = this.nodes.get(n.id);
        if (!circle) {
          circle = this.add
            .circle(p.x, p.y, 5, 0xe4e5c1)
            .setStrokeStyle(2, 0x4c6b48)
            .setDepth(7);
          this.nodes.set(n.id, circle);
        }
        const active = state.hoverNode === n.id || state.moving?.id === n.id;
        circle
          .setPosition(p.x, p.y)
          .setRadius(active ? 8 : 5)
          .setFillStyle(n.fixed ? 0xf2af70 : active ? 0xf4f3d1 : 0xe4e5c1)
          .setStrokeStyle(2, n.fixed ? 0xb07341 : 0x4c6b48);
        if (n.fixed) {
          g.fillStyle(0xb97746).fillTriangle(
            p.x,
            p.y + 6,
            p.x - 11,
            p.y + 23,
            p.x + 11,
            p.y + 23,
          );
          g.lineStyle(3, 0xc7b486).lineBetween(
            p.x - 17,
            p.y + 27,
            p.x + 17,
            p.y + 27,
          );
        }
      }
      for (const [id, object] of this.nodes)
        if (!nodesPresent.has(id)) {
          object.destroy();
          this.nodes.delete(id);
        }
      const empty = !d.members.length && state.mode === "build";
      this.guideText
        .setVisible(empty)
        .setPosition((level.left + level.right) / 2, level.deckY + 32);
      if (empty) {
        g.lineStyle(2, 0x718658, 0.7);
        for (let x = level.left; x < level.right; x += 16)
          g.lineBetween(
            x,
            level.deckY,
            Math.min(x + 8, level.right),
            level.deckY,
          );
      }
      const preview = state.preview && state.mode === "build";
      this.preview.setVisible(!!preview);
      this.previewText.setVisible(!!preview);
      if (preview) {
        const a = state.preview.start,
          b = state.preview.end;
        this.positionMember(this.preview, a, b, state.material, 0.6);
        this.previewText
          .setPosition((a.x + b.x) / 2, (a.y + b.y) / 2 - 12)
          .setText((Math.hypot(b.x - a.x, b.y - a.y) / 100).toFixed(2) + " m");
        g.lineStyle(2, 0xf2edce).strokeCircle(b.x, b.y, 7);
      }
      if (state.keyboard) {
        const p = state.pointer;
        g.lineStyle(1.5, 0xd25d3e)
          .lineBetween(p.x - 12, p.y, p.x + 12, p.y)
          .lineBetween(p.x, p.y - 12, p.x, p.y + 12);
      }
      const vehicle = w?.vehicle,
        x = vehicle ? vehicle.x * 100 : level.left - 62,
        y = vehicle ? vehicle.y * 100 : level.deckY - 16;
      this.vehicle.setPosition(x, y).setRotation(vehicle?.angle || 0);
      this.loadText
        .setVisible(!!vehicle && !vehicle.finished)
        .setPosition(x, y - 76)
        .setText(level.truckMass.toLocaleString() + " kg");
      if (vehicle && !vehicle.finished) {
        g.lineStyle(2, 0x466b4c).lineBetween(x, y - 67, x, y - 40);
        g.fillStyle(0x466b4c).fillTriangle(
          x - 5,
          y - 46,
          x + 5,
          y - 46,
          x,
          y - 37,
        );
      }
      this.host.events.emit("state", state);
    }
    burst(x, y, color = 0xd9ac72, quantity = 9) {
      if (this.host.state?.reduced) return;
      const particles = this.add
        .particles(x, y, "spark", {
          speed: { min: 25, max: 95 },
          angle: { min: 0, max: 360 },
          gravityY: 110,
          lifespan: 520,
          scale: { start: 0.75, end: 0 },
          alpha: { start: 0.9, end: 0 },
          tint: color,
          emitting: false,
        })
        .setDepth(12);
      particles.explode(quantity);
      this.time.delayedCall(650, () => particles.destroy());
    }
  }

  class HUDScene extends Phaser.Scene {
    constructor(host) {
      super("HUD");
      this.host = host;
    }
    create() {
      this.intro = this.add
        .text(this.scale.width / 2, 105, "", {
          fontFamily: "Georgia",
          fontSize: "27px",
          color: "#294d42",
          align: "center",
          backgroundColor: "#f1f3e7",
          padding: { x: 22, y: 13 },
        })
        .setOrigin(0.5)
        .setAlpha(0);
      this.legend = this.add
        .container(this.scale.width / 2, this.scale.width < 761 ? 150 : 81)
        .setVisible(false);
      this.legend.add(this.add.rectangle(0, 0, 322, 31, 0xf1f3e7, 0.96));
      [
        ["● TENSION", "#2d7180", -100],
        ["● COMPRESSION", "#a45e2e", 1],
        ["● OVERLOAD", "#b83d2c", 109],
      ].forEach(([label, color, x]) => {
        this.legend.add(
          this.add
            .text(x, 0, label, { fontFamily: "Arial", fontSize: "10px", color })
            .setOrigin(0.5),
        );
      });
      const mission = (level) => {
        if (this.host.state?.reduced) return;
        this.tweens.killTweensOf(this.intro);
        this.intro
          .setText("0" + level.id + " / " + level.place.toUpperCase())
          .setPosition(this.scale.width / 2, 110)
          .setAlpha(0);
        this.tweens.add({
          targets: this.intro,
          alpha: 1,
          y: 100,
          duration: 250,
          hold: 850,
          yoyo: true,
          ease: "Sine.easeInOut",
        });
      };
      this.host.events.on("mission", mission);
      const onState = (state) => {
        this.legend.setVisible(state.forces && state.mode !== "build");
      };
      this.host.events.on("state", onState);
      const victory = () => {
        if (this.host.state?.reduced) return;
        const width = this.scale.width,
          height = this.scale.height;
        const confetti = this.add.particles(width / 2, height * 0.28, "spark", {
          x: { min: -50, max: 50 },
          speed: { min: 90, max: 240 },
          angle: { min: 200, max: 340 },
          gravityY: 200,
          lifespan: 1600,
          scale: { start: 1.1, end: 0.2 },
          alpha: { start: 1, end: 0 },
          tint: [0xf0a36c, 0xc7de93, 0x79b6b7, 0xf8e9af],
          emitting: false,
        });
        confetti.explode(55);
        this.time.delayedCall(1800, () => confetti.destroy());
      };
      this.host.events.on("success", victory);
      this.scale.on("resize", () => {
        this.intro.setX(this.scale.width / 2);
        this.legend.setPosition(
          this.scale.width / 2,
          this.scale.width < 761 ? 150 : 81,
        );
      });
      this.events.once("shutdown", () => {
        this.host.events.off("mission", mission);
        this.host.events.off("state", onState);
        this.host.events.off("success", victory);
      });
    }
  }

  class BridgeEngine {
    constructor(canvas) {
      this.canvas = canvas;
      this.zoom = 1;
      this.width = 0;
      this.height = 0;
      this.view = { scale: 1, x: 0, y: 0 };
      this.events = new Phaser.Events.EventEmitter();
      this.inputHandlers = new Map();
      this.state = null;
      this.scene = null;
      this.game = null;
      this.tick = null;
      this.muted = false;
      try {
        this.muted = localStorage.getItem("bridge-engineer-sound") === "muted";
      } catch {}
    }
    start(tick) {
      this.tick = tick;
      const rect = this.canvas.parentElement.getBoundingClientRect();
      this.game = new Phaser.Game({
        type: rendererType(),
        canvas: this.canvas,
        parent: "workshop",
        width: rect.width,
        height: rect.height,
        resolution: Math.min(devicePixelRatio || 1, 2),
        backgroundColor: "#d6e8ec",
        banner: false,
        render: { antialias: true, roundPixels: false },
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.NO_CENTER,
        },
        input: {
          activePointers: 2,
          keyboard: false,
          mouse: { preventDefaultWheel: false },
        },
        audio: { disableWebAudio: false },
        fps: { target: 60, smoothStep: true },
        scene: [
          new BootScene(this),
          new WorkshopScene(this),
          new HUDScene(this),
        ],
        callbacks: {
          postBoot: (game) => {
            game.sound.mute = this.muted;
          },
        },
      });
      root.BridgeRuntime = {
        engine: "Phaser",
        version: Phaser.VERSION,
        game: this.game,
      };
    }
    calculateView(level) {
      const rect = this.canvas.getBoundingClientRect();
      this.width = rect.width;
      this.height = rect.height;
      const w = rect.width,
        h = rect.height,
        mobile = w < 761;
      let scale = Math.min(
        (w - (mobile ? 65 : 400)) / (level.right - level.left + 180),
        (h - (mobile ? 300 : 190)) / 430,
      );
      scale = Math.max(0.19, scale) * this.zoom;
      this.view = {
        scale,
        x: w / 2 + (mobile ? 0 : 70) - ((level.left + level.right) / 2) * scale,
        y: h * 0.52 - level.deckY * scale,
      };
      return this.view;
    }
    toWorld(clientX, clientY) {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: (clientX - rect.left - this.view.x) / this.view.scale,
        y: (clientY - rect.top - this.view.y) / this.view.scale,
      };
    }
    onPointer(type, callback) {
      this.inputHandlers.set(type, callback);
    }
    dispatchPointer(type, pointer) {
      const e = pointer.event,
        rect = this.canvas.getBoundingClientRect();
      const touch = e?.changedTouches?.[0] || e?.touches?.[0];
      this.inputHandlers.get(type)?.({
        button: e?.button ?? 0,
        clientX: touch?.clientX ?? e?.clientX ?? rect.left + pointer.x,
        clientY: touch?.clientY ?? e?.clientY ?? rect.top + pointer.y,
        preventDefault: () => e?.preventDefault?.(),
      });
    }
    draw(state) {
      this.state = state;
      this.scene?.renderState(state);
    }
    effect(name, data = {}) {
      if (!this.scene) return;
      if (
        !this.muted &&
        !this.game.sound.locked &&
        this.scene.cache.audio.exists("tone-" + name)
      )
        try {
          this.scene.sound.play("tone-" + name, {
            volume: name === "success" ? 0.55 : 0.3,
          });
        } catch {}
      if (name === "place")
        this.scene.burst(
          data.x ?? this.state.pointer.x,
          data.y ?? this.state.pointer.y,
          this.state.material === "steel" ? 0xa8c9c8 : 0xe6ba82,
          6,
        );
      if (name === "snap") {
        this.scene.burst(data.x, data.y, 0xe59b70, 13);
        if (!this.state.reduced) this.scene.cameras.main.shake(100, 0.0025);
      }
      if (name === "success") this.events.emit("success");
    }
    toggleSound() {
      this.muted = !this.muted;
      if (this.game) this.game.sound.mute = this.muted;
      try {
        localStorage.setItem(
          "bridge-engineer-sound",
          this.muted ? "muted" : "on",
        );
      } catch {}
      return this.muted;
    }
  }
  root.BridgeEngine = BridgeEngine;
})(window);
