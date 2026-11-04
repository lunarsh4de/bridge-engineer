/* Bridge Engineer: independently implemented compliant position-based dynamics.
   Metres, kilograms, seconds; y points down. Fixed step; axial pin-jointed members. */
(function (root) {
  "use strict";
  const SCALE = 100,
    GRAVITY = 9.81,
    STEP = 1 / 120;
  const MATERIALS = {
    road: {
      name: "Road",
      color: "#595d55",
      density: 42,
      EA: 9e6,
      tension: 90000,
      compression: 90000,
      buckling: 900000,
      maxLength: 2.6,
      unit: "m",
      description: "Drivable deck · carries its own weight",
    },
    wood: {
      name: "Timber",
      color: "#c68d55",
      density: 20,
      EA: 4e6,
      tension: 30000,
      compression: 30000,
      buckling: 120000,
      maxLength: 3,
      unit: "m",
      description: "Light members · tension + compression",
    },
    steel: {
      name: "Steel",
      color: "#8ba7ad",
      density: 56,
      EA: 18e6,
      tension: 110000,
      compression: 110000,
      buckling: 650000,
      maxLength: 3.5,
      unit: "m",
      description: "Stiffer and stronger · also heavier",
    },
    cable: {
      name: "Cable",
      color: "#b1bfbd",
      density: 3,
      EA: 5e6,
      tension: 48000,
      compression: 0,
      buckling: 0,
      maxLength: 6,
      unit: "m",
      description: "Lightweight · pulls, never pushes",
    },
  };
  function roadRoute(design, leftId, rightId) {
    const adj = new Map(design.nodes.map((n) => [n.id, []]));
    for (const e of design.members.filter((e) => e.material === "road")) {
      adj.get(e.a)?.push({ next: e.b, edge: e });
      adj.get(e.b)?.push({ next: e.a, edge: e });
    }
    const queue = [leftId],
      prev = new Map([[leftId, null]]);
    for (let k = 0; k < queue.length; k++) {
      const id = queue[k];
      if (id === rightId) break;
      for (const item of adj.get(id) || [])
        if (!prev.has(item.next)) {
          prev.set(item.next, { id, edge: item.edge });
          queue.push(item.next);
        }
    }
    if (!prev.has(rightId)) return null;
    const path = [];
    let id = rightId;
    while (id !== leftId) {
      const p = prev.get(id);
      path.unshift({ a: p.id, b: id, edge: p.edge.id });
      id = p.id;
    }
    return path;
  }
  class World {
    constructor(design, level, { vehicle = false, gravity = GRAVITY } = {}) {
      this.level = level;
      this.gravity = gravity;
      this.time = 0;
      this.steps = 0;
      this.firstBreak = null;
      this.breakCount = 0;
      this.maxForceRatio = 0;
      this.maxSag = 0;
      this.status = "running";
      this.events = [];
      const active = new Set(design.members.flatMap((m) => [m.a, m.b]));
      this.nodes = design.nodes
        .filter((n) => n.fixed || active.has(n.id))
        .map((n) => ({
          id: n.id,
          x: n.x / SCALE,
          y: n.y / SCALE,
          ox: n.x / SCALE,
          oy: n.y / SCALE,
          px: n.x / SCALE,
          py: n.y / SCALE,
          vx: 0,
          vy: 0,
          mass: 8,
          fixed: !!n.fixed,
        }));
      this.byId = new Map(this.nodes.map((n) => [n.id, n]));
      this.members = design.members.map((e) => {
        const a = this.byId.get(e.a),
          b = this.byId.get(e.b),
          m = MATERIALS[e.material],
          length = Math.hypot(b.x - a.x, b.y - a.y);
        const mass = length * m.density;
        a.mass += mass / 2;
        b.mass += mass / 2;
        return {
          ...e,
          length,
          lambda: 0,
          force: 0,
          ratio: 0,
          overload: 0,
          broken: false,
        };
      });
      for (const n of this.nodes) n.inv = n.fixed ? 0 : 1 / n.mass;
      this.route = roadRoute(design, "left", "right");
      let distance = 0;
      if (this.route)
        this.route = this.route.map((s) => {
          const a = this.byId.get(s.a),
            b = this.byId.get(s.b),
            length = Math.hypot(b.ox - a.ox, b.oy - a.oy);
          const seg = { ...s, length, start: distance };
          distance += length;
          return seg;
        });
      this.routeLength = distance;
      this.vehicle = vehicle
        ? {
            x: level.left / SCALE - 0.55,
            y: level.deckY / SCALE - 0.16,
            vy: 0,
            angle: 0,
            s: -0.55,
            mass: level.truckMass,
            falling: false,
            finished: false,
          }
        : null;
    }
    routePoint(s) {
      if (!this.route) return null;
      const seg =
        this.route.find((e) => s <= e.start + e.length) || this.route.at(-1);
      const a = this.byId.get(seg.a),
        b = this.byId.get(seg.b),
        edge = this.members.find((e) => e.id === seg.edge),
        t = Math.max(0, Math.min(1, (s - seg.start) / seg.length));
      return {
        a,
        b,
        edge,
        t,
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        angle: Math.atan2(b.y - a.y, b.x - a.x),
      };
    }
    step(dt = STEP) {
      if (this.status !== "running") return;
      this.time += dt;
      this.steps++;
      const forces = new Map(this.nodes.map((n) => [n.id, { x: 0, y: 0 }]));
      const v = this.vehicle;
      if (v) {
        if (this.time > 1.5 && !v.falling && !v.finished) {
          v.s += 0.95 * dt;
          if (v.s < 0) {
            v.x = this.level.left / SCALE + v.s;
            v.y = this.level.deckY / SCALE - 0.16;
          } else if (!this.route) {
            v.falling = true;
            this.events.push("The road does not connect both banks.");
          } else if (v.s > this.routeLength + 0.45) {
            v.finished = true;
          } else if (v.s > this.routeLength) {
            v.x = this.level.right / SCALE + (v.s - this.routeLength);
            v.y = this.level.deckY / SCALE - 0.16;
          } else {
            const p = this.routePoint(v.s);
            if (
              !p ||
              p.edge.broken ||
              Math.abs(p.angle) > 0.7 ||
              p.y > this.level.deckY / SCALE + 0.65
            ) {
              v.falling = true;
              this.events.push("The vehicle lost a usable road surface.");
            } else {
              v.x = p.x;
              v.y = p.y - 0.16;
              v.angle = p.angle;
              for (const offset of [-0.24, 0.24]) {
                const axle = this.routePoint(
                  Math.max(0, Math.min(this.routeLength, v.s + offset)),
                );
                forces.get(axle.a.id).y +=
                  v.mass * this.gravity * 0.5 * (1 - axle.t);
                forces.get(axle.b.id).y += v.mass * this.gravity * 0.5 * axle.t;
              }
            }
          }
        }
        if (v.falling) {
          v.vy += this.gravity * dt;
          v.y += v.vy * dt;
          v.angle += dt * 0.8;
        }
      }
      for (const n of this.nodes) {
        n.px = n.x;
        n.py = n.y;
        if (n.fixed) continue;
        const f = forces.get(n.id);
        n.vx = (n.vx + f.x * n.inv * dt) * Math.exp(-1.7 * dt);
        n.vy = (n.vy + (this.gravity + f.y * n.inv) * dt) * Math.exp(-1.7 * dt);
        n.x += n.vx * dt;
        n.y += n.vy * dt;
      }
      for (const e of this.members) e.lambda = 0;
      for (let iter = 0; iter < 40; iter++) {
        // Alternate ordering to avoid a one-sided iteration bias.
        for (let j = 0; j < this.members.length; j++) {
          const e = this.members[iter % 2 ? this.members.length - 1 - j : j];
          if (e.broken) continue;
          const a = this.byId.get(e.a),
            b = this.byId.get(e.b),
            m = MATERIALS[e.material];
          const dx = b.x - a.x,
            dy = b.y - a.y,
            d = Math.hypot(dx, dy) || 1e-9,
            C = d - e.length,
            inv = a.inv + b.inv;
          if (!inv) continue;
          if (e.material === "cable" && C <= 0) {
            e.lambda = 0;
            continue;
          }
          const alpha = e.length / m.EA / (dt * dt),
            dl = (-C - alpha * e.lambda) / (inv + alpha);
          e.lambda += dl;
          const cx = (dx / d) * dl,
            cy = (dy / d) * dl;
          a.x -= a.inv * cx;
          a.y -= a.inv * cy;
          b.x += b.inv * cx;
          b.y += b.inv * cy;
        }
      }
      for (const e of this.members) {
        if (e.broken) continue;
        const m = MATERIALS[e.material],
          f = -e.lambda / (dt * dt);
        e.force = f;
        const capacity =
          f >= 0
            ? m.tension
            : Math.min(m.compression, m.buckling / (e.length * e.length));
        e.ratio = capacity > 0 ? Math.abs(f) / capacity : 0;
        this.maxForceRatio = Math.max(this.maxForceRatio, e.ratio);
        e.overload =
          e.ratio > 1 ? e.overload + dt : Math.max(0, e.overload - dt * 2);
        if (e.overload > 0.06) {
          e.broken = true;
          this.breakCount++;
          if (!this.firstBreak)
            this.firstBreak = {
              id: e.id,
              material: e.material,
              force: f,
              time: this.time,
              ratio: e.ratio,
              a: e.a,
              b: e.b,
            };
          this.events.push(
            `${m.name} member failed in ${f >= 0 ? "tension" : "compression"}.`,
          );
        }
      }
      for (const n of this.nodes) {
        if (n.fixed) continue;
        // Ground contact on the banks; the river has a simple floor below the water.
        const onBank =
          n.x < this.level.left / SCALE - 0.06 ||
          n.x > this.level.right / SCALE + 0.06;
        const floor = onBank ? this.level.deckY / SCALE + 0.08 : 7.65;
        if (n.y > floor) {
          n.y = floor;
          n.x = n.px + (n.x - n.px) * 0.6;
        }
        n.vx = (n.x - n.px) / dt;
        n.vy = (n.y - n.py) / dt;
        if (!Number.isFinite(n.x + n.y + n.vx + n.vy)) {
          this.status = "failed";
          this.events.push("The simulation could not resolve this design.");
          return;
        }
      }
      for (const e of this.members.filter((e) => e.material === "road"))
        for (const id of [e.a, e.b]) {
          const n = this.byId.get(id);
          this.maxSag = Math.max(this.maxSag, Math.max(0, n.y - n.oy));
        }
      if (v) {
        if (v.finished)
          this.status =
            this.breakCount === 0 && this.maxSag < 0.12 ? "passed" : "failed";
        else if (v.y > 6.8 || this.time > 22) this.status = "failed";
      }
    }
  }
  const api = { SCALE, GRAVITY, STEP, MATERIALS, World, roadRoute };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.BridgePhysics = api;
})(typeof window !== "undefined" ? window : globalThis);
