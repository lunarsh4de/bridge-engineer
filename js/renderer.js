/* Canvas presentation and camera only. No game or simulation state is mutated here. */
(function (root) {
  "use strict";
  const P = root.BridgePhysics;
  class Renderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.zoom = 1;
      this.width = 0;
      this.height = 0;
      this.view = { scale: 1, x: 0, y: 0 };
    }
    resize() {
      const rect = this.canvas.getBoundingClientRect(),
        dpr = Math.min(devicePixelRatio || 1, 2);
      if (
        this.width !== rect.width ||
        this.height !== rect.height ||
        this.dpr !== dpr
      ) {
        this.width = rect.width;
        this.height = rect.height;
        this.dpr = dpr;
        this.canvas.width = Math.round(rect.width * dpr);
        this.canvas.height = Math.round(rect.height * dpr);
      }
    }
    camera(level) {
      const w = this.width,
        h = this.height,
        mobile = w < 761,
        span = level.right - level.left;
      let scale = Math.min(
        (w - (mobile ? 65 : 400)) / (span + 180),
        (h - (mobile ? 300 : 190)) / 430,
      );
      scale = Math.max(0.19, scale) * this.zoom;
      const centerX = w / 2 + (mobile ? 0 : 70),
        deckY = h * (mobile ? 0.52 : 0.52);
      this.view = {
        scale,
        x: centerX - ((level.left + level.right) / 2) * scale,
        y: deckY - level.deckY * scale,
      };
    }
    toWorld(clientX, clientY) {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: (clientX - rect.left - this.view.x) / this.view.scale,
        y: (clientY - rect.top - this.view.y) / this.view.scale,
      };
    }
    toScreen(x, y) {
      return {
        x: x * this.view.scale + this.view.x,
        y: y * this.view.scale + this.view.y,
      };
    }
    line(a, b, color, width = 2, dash = []) {
      const c = this.ctx;
      c.beginPath();
      c.setLineDash(dash);
      c.moveTo(a.x, a.y);
      c.lineTo(b.x, b.y);
      c.strokeStyle = color;
      c.lineWidth = width;
      c.stroke();
      c.setLineDash([]);
    }
    text(
      str,
      x,
      y,
      size = 12,
      color = "#405a41",
      align = "left",
      font = "Arial",
    ) {
      const c = this.ctx;
      c.fillStyle = color;
      c.font = `${size}px ${font}`;
      c.textAlign = align;
      c.fillText(str, x, y);
    }
    poly(points, color) {
      const c = this.ctx;
      c.beginPath();
      points.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p)));
      c.closePath();
      c.fillStyle = color;
      c.fill();
    }
    round(x, y, w, h, r, color) {
      const c = this.ctx;
      c.beginPath();
      c.roundRect(x, y, w, h, r);
      c.fillStyle = color;
      c.fill();
    }
    scenery(level, time) {
      const c = this.ctx,
        v = this.view,
        w = this.width,
        h = this.height;
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      const gradient = c.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, "#d6e8ec");
      gradient.addColorStop(0.58, "#eef1e5");
      gradient.addColorStop(1, "#c0d5cf");
      c.fillStyle = gradient;
      c.fillRect(0, 0, w, h);
      c.save();
      c.translate(v.x, v.y);
      c.scale(v.scale, v.scale);
      c.save();
      c.globalAlpha = 0.35;
      this.round(level.left + 80, 85, 155, 13, 7, "#ffffff");
      this.round(level.left + 110, 75, 75, 14, 7, "#ffffff");
      this.round(level.right - 240, 155, 120, 9, 5, "#ffffff");
      c.restore();
      c.fillStyle = "#fff0bb";
      c.beginPath();
      c.arc(level.right - 15, 110, 49, 0, Math.PI * 2);
      c.fill();
      this.poly(
        [
          [-1800, 430],
          [-1800, 70],
          [level.left - 70, 100],
          [level.left + 180, 260],
          [level.left + 390, 80],
          [level.right - 70, 270],
          [level.right + 210, 90],
          [2300, 180],
          [2600, 500],
        ],
        "#bccfd0",
      );
      this.poly(
        [
          [-1000, 440],
          [level.left - 290, 235],
          [level.left - 100, 310],
          [level.left + 210, 185],
          [level.left + 420, 330],
          [level.right - 20, 230],
          [level.right + 190, 310],
          [2400, 160],
          [2600, 550],
        ],
        "#9bb9bb",
      );
      this.poly(
        [
          [-1200, 540],
          [level.left - 120, 310],
          [level.left + 180, 390],
          [level.left + 420, 290],
          [level.right - 150, 380],
          [level.right + 210, 260],
          [2500, 350],
          [2500, 800],
        ],
        "#7e9f9b",
      );
      const l = level.left,
        r = level.right,
        d = level.deckY;
      const water = c.createLinearGradient(0, d, 0, 1000);
      water.addColorStop(0, "#4b939f");
      water.addColorStop(0.42, "#6bb1b7");
      water.addColorStop(1, "#aad5ce");
      this.poly(
        [
          [l, d + 10],
          [r, d + 10],
          [r + 30, 530],
          [r + 250, 1100],
          [l - 240, 1100],
          [l - 20, 560],
        ],
        water,
      );
      this.poly(
        [
          [-1800, d - 5],
          [l - 15, d - 5],
          [l + 2, d + 38],
          [l - 20, d + 90],
          [l - 70, d + 125],
          [l - 200, d + 165],
          [-1800, d + 165],
        ],
        "#6b705b",
      );
      this.poly(
        [
          [r + 15, d - 5],
          [2600, d - 5],
          [2600, d + 200],
          [r + 200, d + 165],
          [r + 55, d + 110],
          [r - 2, d + 38],
        ],
        "#777865",
      );
      for (const [x, y, len] of [
        [l - 100, d + 47, 57],
        [l - 140, d + 83, 65],
        [l - 245, d + 118, 100],
        [r + 35, d + 54, 66],
        [r + 90, d + 98, 95],
      ])
        this.line({ x, y }, { x: x + len, y: y + 5 }, "#b8ac8b55", 3);
      this.poly(
        [
          [-1800, d - 18],
          [l - 13, d - 18],
          [l, d + 5],
          [-1800, d + 5],
        ],
        "#98b476",
      );
      this.poly(
        [
          [r + 13, d - 18],
          [2600, d - 18],
          [2600, d + 5],
          [r, d + 5],
        ],
        "#acc48b",
      );
      this.line({ x: -1800, y: d - 4 }, { x: l, y: d - 4 }, "#cecba9", 16);
      this.line({ x: r, y: d - 4 }, { x: 2500, y: d - 4 }, "#cecba9", 16);
      for (const [x, sz] of [
        [l - 115, 1],
        [l - 190, 0.7],
        [r + 125, 1.3],
        [r + 235, 0.75],
        [l - 370, 1.2],
      ]) {
        c.save();
        c.translate(x, d - 20);
        c.scale(sz, sz);
        this.line({ x: 0, y: 3 }, { x: 0, y: -54 }, "#58734f", 5);
        this.poly(
          [
            [-23, -15],
            [0, -83],
            [23, -15],
          ],
          "#507b59",
        );
        this.poly(
          [
            [-17, -41],
            [0, -95],
            [17, -41],
          ],
          "#61875c",
        );
        c.restore();
      }
      // Riverbend's destination: a small community greenhouse.
      c.save();
      c.translate(r + 180, d - 22);
      this.round(-30, -37, 60, 37, 2, "#d3d8b4");
      this.poly(
        [
          [-37, -37],
          [0, -62],
          [37, -37],
        ],
        "#677c5d",
      );
      this.line({ x: 0, y: -55 }, { x: 0, y: 0 }, "#819572", 3);
      this.line({ x: -18, y: -36 }, { x: -18, y: 0 }, "#819572", 2);
      this.line({ x: 18, y: -36 }, { x: 18, y: 0 }, "#819572", 2);
      c.restore();
      for (let i = 0; i < 11; i++) {
        const x = l + 40 + ((i * 89) % Math.max(1, r - l - 80)),
          y = d + 90 + i * 26;
        this.line(
          { x: x + Math.sin(time * 0.6 + i) * 8, y },
          { x: x + 35 + Math.sin(time * 0.6 + i) * 8, y },
          "#e7f5edaa",
          2,
        );
      }
      c.restore();
    }
    member(
      a,
      b,
      material,
      {
        force = 0,
        ratio = 0,
        forces = false,
        broken = false,
        selected = false,
        preview = false,
      } = {},
    ) {
      if (broken) {
        const mid1 = {
            x: a.x + (b.x - a.x) * 0.43,
            y: a.y + (b.y - a.y) * 0.43,
          },
          mid2 = { x: a.x + (b.x - a.x) * 0.57, y: a.y + (b.y - a.y) * 0.57 };
        this.member(a, mid1, material, { force, ratio, forces, selected });
        this.member(mid2, b, material, { force, ratio, forces, selected });
        return;
      }
      const c = this.ctx,
        dx = b.x - a.x,
        dy = b.y - a.y,
        L = Math.hypot(dx, dy),
        angle = Math.atan2(dy, dx);
      c.save();
      c.translate(a.x, a.y);
      c.rotate(angle);
      c.lineCap = "round";
      if (selected) {
        this.line({ x: 0, y: 0 }, { x: L, y: 0 }, "#edf4b480", 18);
      }
      c.shadowColor = "#143c3e45";
      c.shadowOffsetY = 3;
      c.shadowBlur = 3;
      let color = P.MATERIALS[material].color;
      if (forces && Math.abs(force) > 30)
        color = ratio > 1 ? "#d65741" : force > 0 ? "#4a9cae" : "#d18050";
      if (broken) color = "#ab6751";
      c.globalAlpha = preview ? 0.65 : 1;
      if (material === "road") {
        this.round(0, -6, L, 12, 2, color);
        this.line({ x: 0, y: -5 }, { x: L, y: -5 }, "#c8ceab", 2);
        for (let x = 10; x < L; x += 16)
          this.line({ x, y: -3 }, { x, y: 5 }, "#2e3f2a60", 1);
      } else if (material === "cable") {
        c.strokeStyle = color;
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(0, 0);
        c.quadraticCurveTo(
          L / 2,
          force < 10 && !preview ? Math.min(25, L * 0.08) : 1,
          L,
          0,
        );
        c.stroke();
      } else {
        const thick = material === "steel" ? 9 : 8;
        this.round(
          -1,
          -thick / 2 - 1,
          L + 2,
          thick + 2,
          2,
          material === "wood" ? "#795d3d" : "#41686d",
        );
        this.round(0, -thick / 2, L, thick, 1, color);
        this.line(
          { x: 2, y: -thick / 2 + 1 },
          { x: L - 2, y: -thick / 2 + 1 },
          material === "wood" ? "#e3b97e" : "#cedfce",
          1.5,
        );
        if (material === "wood")
          for (let x = 15; x < L; x += 37)
            this.line({ x, y: 1 }, { x: x + 15, y: 1 }, "#9e6a4260", 1);
        else
          this.line(
            { x: 1, y: thick / 2 - 1 },
            { x: L - 1, y: thick / 2 - 1 },
            "#456667",
            1.5,
          );
      }
      if (broken) {
        c.clearRect(L * 0.45, -9, L * 0.1, 18);
        this.line(
          { x: L * 0.45 - 2, y: -8 },
          { x: L * 0.45 + 3, y: 8 },
          "#f2c2a1",
          2,
        );
      }
      c.restore();
    }
    truck(v, level) {
      const c = this.ctx;
      const x = v ? v.x * 100 : level.left - 62,
        y = v ? v.y * 100 : level.deckY - 16;
      c.save();
      c.translate(x, y);
      c.rotate(v?.angle || 0);
      c.fillStyle = "#304c36";
      c.beginPath();
      c.arc(-22, 9, 8, 0, Math.PI * 2);
      c.arc(22, 9, 8, 0, Math.PI * 2);
      c.fill();
      this.round(-39, -22, 42, 27, 3, "#d97f4a");
      this.round(4, -16, 29, 22, 3, "#eabb6d");
      this.poly(
        [
          [8, -12],
          [21, -12],
          [28, -4],
          [8, -4],
        ],
        "#d5e5c9",
      );
      this.line({ x: -38, y: 5 }, { x: 36, y: 5 }, "#4c6042", 4);
      for (const wx of [-22, 22]) {
        c.fillStyle = "#c7cfb5";
        c.beginPath();
        c.arc(wx, 9, 3, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
      if (v && !v.finished) {
        this.line({ x, y: y - 75 }, { x, y: y - 46 }, "#466b4c", 2);
        this.poly(
          [
            [x - 5, y - 52],
            [x + 5, y - 52],
            [x, y - 43],
          ],
          "#466b4c",
        );
        this.text(
          `${level.truckMass.toLocaleString()} kg`,
          x,
          y - 85,
          11,
          "#365d43",
          "center",
        );
      }
    }
    draw(state) {
      this.resize();
      this.camera(state.level);
      const c = this.ctx,
        v = this.view;
      this.scenery(state.level, state.reduced ? 0 : state.elapsed);
      c.save();
      c.translate(v.x, v.y);
      c.scale(v.scale, v.scale);
      const d = state.editor.design,
        world = state.world;
      if (state.grid && state.mode === "build") {
        c.fillStyle = "#486c4640";
        for (
          let x = state.level.left - 150;
          x <= state.level.right + 150;
          x += 25
        )
          for (let y = 155; y <= 655; y += 25) {
            c.beginPath();
            c.arc(x, y, 1 / Math.sqrt(v.scale), 0, Math.PI * 2);
            c.fill();
          }
      }
      if (!d.members.length && state.mode === "build") {
        this.line(
          { x: state.level.left, y: state.level.deckY },
          { x: state.level.right, y: state.level.deckY },
          "#718658",
          2,
          [8, 8],
        );
        this.text(
          "YOUR ROAD GOES HERE",
          (state.level.left + state.level.right) / 2,
          state.level.deckY + 33,
          10,
          "#5b7555",
          "center",
        );
      }
      const pos = (id) => {
        const n = world?.byId.get(id);
        if (n) return { x: n.x * 100, y: n.y * 100 };
        const edit = d.nodes.find((n) => n.id === id);
        if (state.moving && state.moving.id === id) return state.pointer;
        return edit;
      };
      for (const e of world?.members || d.members) {
        const a = pos(e.a),
          b = pos(e.b);
        if (!a || !b) continue;
        this.member(a, b, e.material, {
          force: e.force,
          ratio: e.ratio,
          forces: state.forces,
          broken: e.broken,
          selected: state.hoverMember === e.id,
        });
      }
      if (state.preview && state.mode === "build") {
        const a = state.preview.start,
          b = state.preview.end;
        this.member(a, b, state.material, { preview: true });
        const length = Math.hypot(b.x - a.x, b.y - a.y) / 100;
        this.text(
          `${length.toFixed(2)} m`,
          (a.x + b.x) / 2,
          (a.y + b.y) / 2 - 16,
          12,
          "#294e37",
          "center",
        );
        c.strokeStyle = "#f2edce";
        c.lineWidth = 2;
        c.beginPath();
        c.arc(b.x, b.y, 7, 0, Math.PI * 2);
        c.stroke();
      }
      for (const n of d.nodes) {
        const p = pos(n.id);
        if (!p) continue;
        if (n.fixed) {
          this.poly(
            [
              [p.x, p.y + 6],
              [p.x - 11, p.y + 23],
              [p.x + 11, p.y + 23],
            ],
            "#b97746",
          );
          this.line(
            { x: p.x - 17, y: p.y + 27 },
            { x: p.x + 17, y: p.y + 27 },
            "#c7b486",
            3,
          );
        }
        const active = state.hoverNode === n.id || state.moving?.id === n.id;
        c.beginPath();
        c.arc(p.x, p.y, active ? 8 : 5, 0, Math.PI * 2);
        c.fillStyle = n.fixed ? "#f2af70" : active ? "#f4f3d1" : "#e4e5c1";
        c.fill();
        c.strokeStyle = n.fixed ? "#b07341" : "#4c6b48";
        c.lineWidth = 2;
        c.stroke();
        if (n.fixed)
          this.text("FIXED ANCHOR", p.x, p.y + 52, 9, "#e5e5c9", "center");
      }
      if (state.keyboard) {
        const p = state.pointer;
        this.line(
          { x: p.x - 12, y: p.y },
          { x: p.x + 12, y: p.y },
          "#d25d3e",
          1.5,
        );
        this.line(
          { x: p.x, y: p.y - 12 },
          { x: p.x, y: p.y + 12 },
          "#d25d3e",
          1.5,
        );
      }
      this.truck(world?.vehicle, state.level);
      // Span annotation stays below the work, away from the material dock.
      const sy = state.level.deckY + 115;
      this.line(
        { x: state.level.left, y: sy },
        { x: state.level.right, y: sy },
        "#496d4b50",
        1,
      );
      for (const x of [state.level.left, state.level.right])
        this.line({ x, y: sy - 5 }, { x, y: sy + 5 }, "#496d4b70", 1);
      this.text(
        `${((state.level.right - state.level.left) / 100).toFixed(1)} m`,
        (state.level.left + state.level.right) / 2,
        sy + 21,
        12,
        "#4e7451",
        "center",
      );
      c.restore();
      if (state.forces) {
        this.round(this.width / 2 - 120, 76, 240, 29, 14, "#eff3e2dd");
        [
          ["#4a9cae", "Tension"],
          ["#d18050", "Compression"],
          ["#d65741", "Failure"],
        ].forEach(([color, label], i) => {
          const x = this.width / 2 - 108 + i * 81;
          this.ctx.beginPath();
          this.ctx.arc(x, 90, 3, 0, Math.PI * 2);
          this.ctx.fillStyle = color;
          this.ctx.fill();
          this.text(label, x + 8, 94, 9, "#4c6a55");
        });
      }
    }
  }
  root.BridgeRenderer = Renderer;
})(window);
