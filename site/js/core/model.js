/* Riverbend: Bridge Engineer - editable design model with undo/redo.
 * The editor copy is never touched by the simulation. */
(function (root, factory) {
  const api = factory(typeof require === "function" ? require("./physics.js") : root.BridgePhysics);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BridgeModel = api;
})(typeof self !== "undefined" ? self : this, function (P) {
  "use strict";
  const same = (p, q) => p[0] === q[0] && p[1] === q[1];
  const clone = (ms) => ms.map((m) => ({ a: [m.a[0], m.a[1]], b: [m.b[0], m.b[1]], m: m.m }));

  function create(level, members) {
    return { level, members: clone(members || []), undo: [], redo: [] };
  }
  function joints(d) {
    const map = new Map();
    for (const a of d.level.anchors) map.set(P.keyOf(a), { p: a, anchor: true });
    for (const m of d.members) for (const p of [m.a, m.b]) if (!map.has(P.keyOf(p))) map.set(P.keyOf(p), { p, anchor: false });
    return [...map.values()];
  }
  function inBounds(d, p) {
    const L = d.level;
    return p[0] >= 0 && p[0] <= L.N && p[1] >= L.yMin && p[1] <= L.yMax;
  }
  function find(d, a, b) { return d.members.findIndex((m) => (same(m.a, a) && same(m.b, b)) || (same(m.a, b) && same(m.b, a))); }
  function snapshot(d) { d.undo.push(clone(d.members)); if (d.undo.length > 200) d.undo.shift(); d.redo = []; }

  // Validate one member. Returns null if fine, otherwise a short player-facing reason.
  function check(d, a, b, type) {
    if (same(a, b)) return "Pick two different points.";
    if (!inBounds(d, a) || !inBounds(d, b)) return "That point is outside the building area.";
    if (!d.level.materials.includes(type)) return `${P.MATERIALS[type].name} is not available here.`;
    const isJoint = (p) => joints(d).some((j) => same(j.p, p));
    if (!isJoint(a)) return "Start from an existing joint (a dot).";
    if (type === "road" && (a[1] !== 0 || b[1] !== 0)) return "Road must stay level with the riverbanks.";
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]) * P.G;
    if (type !== "road" && L > P.MATERIALS[type].maxLen + 1e-9) return `Too long. ${P.MATERIALS[type].name} pieces can be at most ${P.MATERIALS[type].maxLen} m.`;
    if (find(d, a, b) >= 0) return "There is already a member there.";
    return null;
  }

  // Road is split into sections no longer than its max length.
  function pieces(a, b, type) {
    if (type !== "road") return [{ a, b, m: type }];
    const step = Math.round(P.MATERIALS.road.maxLen / P.G);
    const dir = Math.sign(b[0] - a[0]);
    const out = [];
    let x = a[0];
    while (x !== b[0]) {
      const nx = Math.abs(b[0] - x) > step ? x + dir * step : b[0];
      out.push({ a: [x, 0], b: [nx, 0], m: "road" });
      x = nx;
    }
    return out;
  }

  function add(d, a, b, type) {
    const err = check(d, a, b, type);
    if (err) return { ok: false, error: err };
    const list = pieces(a, b, type).filter((m) => find(d, m.a, m.b) < 0);
    if (!list.length) return { ok: false, error: "There is already a member there." };
    snapshot(d);
    d.members.push(...list);
    return { ok: true, added: list.length };
  }
  function removeAt(d, i) {
    if (i < 0 || i >= d.members.length) return false;
    snapshot(d);
    d.members.splice(i, 1);
    return true;
  }
  function clear(d) { if (!d.members.length) return false; snapshot(d); d.members = []; return true; }
  function load(d, members) { snapshot(d); d.members = clone(members); }
  function undo(d) { if (!d.undo.length) return false; d.redo.push(clone(d.members)); d.members = d.undo.pop(); return true; }
  function redo(d) { if (!d.redo.length) return false; d.undo.push(clone(d.members)); d.members = d.redo.pop(); return true; }

  // Distance from point (grid units) to a member, for hit-testing.
  function nearest(d, p, maxDist) {
    let best = -1, bd = maxDist;
    d.members.forEach((m, i) => {
      const ax = m.a[0], ay = m.a[1], bx = m.b[0], by = m.b[1];
      const vx = bx - ax, vy = by - ay;
      const t = Math.max(0, Math.min(1, ((p[0] - ax) * vx + (p[1] - ay) * vy) / (vx * vx + vy * vy)));
      const dist = Math.hypot(p[0] - ax - vx * t, p[1] - ay - vy * t);
      if (dist < bd) { bd = dist; best = i; }
    });
    return best;
  }

  // Warnings shown before a test, so random clicking still produces useful feedback.
  function warnings(d) {
    const w = [];
    const L = d.level;
    const roadX = new Set();
    for (const m of d.members) if (m.m === "road") for (let x = Math.min(m.a[0], m.b[0]); x < Math.max(m.a[0], m.b[0]); x++) roadX.add(x);
    let gaps = 0;
    for (let x = 0; x < L.N; x++) if (!roadX.has(x)) gaps++;
    if (gaps === L.N) w.push("There is no road yet. Draw road from one bank to the other.");
    else if (gaps) w.push("The road has a gap. The vehicle will fall through it.");
    const deg = new Map();
    for (const m of d.members) for (const p of [m.a, m.b]) deg.set(P.keyOf(p), (deg.get(P.keyOf(p)) || 0) + 1);
    const anchorKeys = new Set(L.anchors.map(P.keyOf));
    const loose = [...deg.entries()].filter(([k, n]) => n === 1 && !anchorKeys.has(k)).length;
    if (loose) w.push(`${loose} member end${loose > 1 ? "s are" : " is"} connected to nothing. It will flop.`);
    return w;
  }

  return { create, joints, check, add, removeAt, clear, load, undo, redo, nearest, warnings, pieces, clone };
});
