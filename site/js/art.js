/* Procedural asset painter. Runs at boot to bake textures; Phaser owns live rendering. */
(function (root) {
  "use strict";
  const P = root.BridgePhysics;
  class BridgeArt {
    static community(level, connected = false) {
      const id = Number(level?.id) || 1;
      const place = level?.place || "Riverbend";
      const ink = "#294c43";
      const muted = "#8c927f";
      const wall = connected ? "#e7d7a8" : "#c8c5ae";
      const accent = connected ? "#d97845" : "#8e8e7c";
      const green = connected ? "#56865a" : "#879180";
      const shapes = [
        { type: "rect", x: 0, y: 94, width: 176, height: 34, fill: connected ? "#86a66d" : "#929987" },
        { type: "line", x1: 0, y1: 94, x2: 176, y2: 94, stroke: "#657763", width: 3 },
      ];
      const rect = (x, y, width, height, fill = wall, radius = 2) =>
        shapes.push({ type: "rect", x, y, width, height, fill, radius });
      const line = (x1, y1, x2, y2, stroke = ink, width = 3, dash = []) =>
        shapes.push({ type: "line", x1, y1, x2, y2, stroke, width, dash });
      const circle = (x, y, radius, fill = accent, stroke = null) =>
        shapes.push({ type: "circle", x, y, radius, fill, stroke });
      const polygon = (points, fill = wall, stroke = ink) =>
        shapes.push({ type: "polygon", points, fill, stroke });
      const text = (value, x, y, size = 10, fill = ink, align = "center") =>
        shapes.push({ type: "text", text: value, x, y, size, fill, align, weight: 700 });

      if (id === 1) {
        rect(48, 47, 78, 47);
        polygon([[42, 48], [87, 22], [132, 48]], accent);
        rect(78, 67, 18, 27, connected ? "#6d8b75" : muted, 1);
        rect(54, 57, 15, 12, "#b8d5d0", 1);
        rect(105, 57, 15, 12, "#b8d5d0", 1);
        if (connected) {
          for (const x of [22, 35, 141, 154]) {
            line(x, 91, x, 77, "#4f744d", 2);
            circle(x, 75, 4, "#74a95f");
          }
          text("SEEDS ARRIVED", 87, 116, 9);
        } else {
          rect(12, 82, 22, 12, "#a77d55", 1);
          text("SEEDS WAITING", 87, 116, 9, "#555f56");
        }
      } else if (id === 2) {
        rect(108, 51, 48, 43);
        polygon([[102, 52], [132, 32], [162, 52]], accent);
        line(15, 61, 96, 61, muted, 2);
        line(15, 76, 96, 76, muted, 2);
        line(15, 91, 96, 91, muted, 2);
        for (const x of [26, 48, 70, 92]) circle(x, 56, connected ? 5 : 3, green);
        if (connected) {
          rect(116, 68, 15, 12, "#d9914c", 1);
          rect(136, 68, 15, 12, "#d9914c", 1);
          text("HARVEST MOVING", 87, 116, 9);
        } else text("FIELDS WAITING", 87, 116, 9, "#555f56");
      } else if (id === 3) {
        rect(39, 49, 100, 45);
        polygon([[34, 50], [58, 32], [77, 50], [99, 32], [118, 50], [143, 36], [143, 50]], accent);
        rect(52, 64, 27, 30, "#687b75", 1);
        for (const x of [93, 116]) circle(x, 69, 7, connected ? "#d6a75c" : muted, ink);
        if (connected) {
          line(93, 55, 93, 83, ink, 2);
          line(79, 69, 107, 69, ink, 2);
          line(116, 56, 116, 82, ink, 2);
          text("WORKSHOP OPEN", 87, 116, 9);
        } else text("TOOLS WAITING", 87, 116, 9, "#555f56");
      } else if (id === 4) {
        rect(91, 45, 55, 49);
        polygon([[86, 46], [118, 25], [151, 46]], accent);
        circle(53, 70, 25, connected ? "#cf8b4f" : muted, ink);
        circle(53, 70, 6, "#d9d0ab", ink);
        for (let a = 0; a < 8; a++) {
          const dx = Math.cos((a * Math.PI) / 4) * 22;
          const dy = Math.sin((a * Math.PI) / 4) * 22;
          line(53, 70, 53 + dx, 70 + dy, ink, 2);
        }
        if (connected) {
          shapes.push({ type: "arc", x: 53, y: 70, radius: 32, start: 0.2, end: 1.3, stroke: "#4f949b", width: 3 });
          text("MILL TURNING", 87, 116, 9);
        } else text("MILL STOPPED", 87, 116, 9, "#555f56");
      } else if (id === 5) {
        rect(40, 42, 96, 52, "#e4e4d6");
        polygon([[35, 43], [88, 19], [141, 43]], accent);
        rect(77, 65, 22, 29, "#719087", 1);
        rect(109, 55, 11, 27, connected ? "#d85c4e" : muted, 1);
        rect(101, 63, 27, 11, connected ? "#d85c4e" : muted, 1);
        if (connected) {
          rect(15, 78, 23, 16, "#d9a34e", 1);
          line(20, 78, 20, 70, ink, 2);
          text("CLINIC SUPPLIED", 87, 116, 9);
        } else text("SUPPLIES WAITING", 87, 116, 9, "#555f56");
      } else if (id === 6) {
        line(87, 24, 87, 94, ink, 5);
        polygon([[87, 25], [58, 94], [116, 94]], "transparent", ink);
        line(66, 70, 108, 70, ink, 3);
        line(74, 50, 100, 50, ink, 3);
        circle(87, 25, 5, accent);
        if (connected) {
          shapes.push({ type: "arc", x: 87, y: 25, radius: 18, start: -0.8, end: 0.8, stroke: "#d97845", width: 3 });
          shapes.push({ type: "arc", x: 87, y: 25, radius: 30, start: -0.65, end: 0.65, stroke: "#d97845", width: 2 });
          text("RADIO ONLINE", 87, 116, 9);
        } else text("RADIO OFFLINE", 87, 116, 9, "#555f56");
      } else if (id === 7) {
        rect(36, 49, 106, 45, "#aaa897");
        polygon([[31, 50], [55, 33], [73, 50], [97, 31], [116, 50], [147, 38], [147, 50]], accent);
        rect(50, 66, 30, 28, "#596b67", 1);
        rect(112, 19, 15, 31, "#666d67", 1);
        if (connected) {
          circle(92, 72, 10, "#e1b654", ink);
          line(92, 57, 92, 87, ink, 2);
          line(77, 72, 107, 72, ink, 2);
          shapes.push({ type: "arc", x: 119, y: 16, radius: 8, start: 2.5, end: 5.5, stroke: "#d8e1d7", width: 4 });
          text("FOUNDRY POWERED", 87, 116, 9);
        } else text("GENERATOR WAITING", 87, 116, 9, "#555f56");
      } else {
        rect(38, 53, 62, 41);
        polygon([[33, 54], [69, 31], [105, 54]], accent);
        rect(64, 69, 15, 25, "#69867a", 1);
        rect(113, 72, 43, 18, connected ? "#d97845" : muted, 2);
        rect(139, 63, 17, 17, connected ? "#e7b765" : muted, 2);
        circle(123, 92, 5, ink);
        circle(149, 92, 5, ink);
        if (connected) {
          line(46, 53, 46, 24, ink, 2);
          polygon([[46, 24], [66, 30], [46, 37]], "#e6b24e", null);
          rect(103, 76, 12, 10, "#d9a34e", 1);
          text("ALL ROUTES OPEN", 87, 116, 9);
        } else text("CONVOY WAITING", 87, 116, 9, "#555f56");
      }

      return {
        key: `community-${id}-${connected ? "connected" : "waiting"}`,
        width: 176,
        height: 128,
        anchor: { x: (level?.right || 1040) + 52, y: (level?.deckY || 430) - 64 },
        label: place,
        ariaLabel: `${place}: ${connected ? "delivery complete and community restored" : "waiting for delivery"}`,
        background: "transparent",
        connected: Boolean(connected),
        shapes,
      };
    }
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.width = canvas.width;
      this.height = canvas.height;
      this.dpr = 1;
      this.view = { x: 0, y: 0, scale: 1 };
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
  }
  root.BridgeArt = BridgeArt;
})(window);
