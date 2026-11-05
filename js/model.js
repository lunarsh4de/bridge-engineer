/* Editable design: state snapshots, material accounting and endpoint welding. */
(function (root) {
  "use strict";
  const P =
    typeof module !== "undefined" && module.exports
      ? require("./physics.js")
      : root.BridgePhysics;
  function supports(level) {
    return [
      { id: "left", x: level.left, y: level.deckY },
      { id: "right", x: level.right, y: level.deckY },
      ...(level.piers || []),
    ];
  }
  function fresh(level) {
    return {
      nodes: supports(level).map((n) => ({ ...n, fixed: true })),
      members: [],
    };
  }
  function usage(design) {
    const used = { road: 0, wood: 0, steel: 0, cable: 0 };
    for (const e of design.members) {
      const a = design.nodes.find((n) => n.id === e.a),
        b = design.nodes.find((n) => n.id === e.b);
      if (a && b && used[e.material] !== undefined)
        used[e.material] += Math.hypot(a.x - b.x, a.y - b.y) / 100;
    }
    return used;
  }
  function validate(design, level) {
    if (
      !design ||
      !Array.isArray(design.nodes) ||
      !Array.isArray(design.members) ||
      design.nodes.length > 150 ||
      design.members.length > 130
    )
      return "This design is too large or invalid.";
    const fixed = new Map(supports(level).map((n) => [n.id, n])),
      ids = new Set(),
      memberIds = new Set(),
      edges = new Set();
    for (const n of design.nodes) {
      if (
        !n ||
        typeof n.id !== "string" ||
        ids.has(n.id) ||
        !Number.isFinite(n.x + n.y) ||
        n.x < level.left - 180 ||
        n.x > level.right + 180 ||
        n.y < 130 ||
        n.y > 680
      )
        return "Keep joints inside the build area.";
      ids.add(n.id);
      if (n.fixed && !fixed.has(n.id))
        return "Only the orange supports are fixed.";
    }
    for (const support of fixed.values()) {
      const n = design.nodes.find((n) => n.id === support.id);
      if (!n?.fixed || n.x !== support.x || n.y !== support.y)
        return "The orange supports must stay in place.";
    }
    for (const e of design.members) {
      if (
        !e ||
        typeof e.id !== "string" ||
        memberIds.has(e.id) ||
        !Object.hasOwn(P.MATERIALS, e.material) ||
        !ids.has(e.a) ||
        !ids.has(e.b) ||
        e.a === e.b
      )
        return "Choose two different, valid endpoints.";
      memberIds.add(e.id);
      const k = [e.a, e.b].sort().join("|");
      if (edges.has(k)) return "A member already connects those joints.";
      edges.add(k);
      const a = design.nodes.find((n) => n.id === e.a),
        b = design.nodes.find((n) => n.id === e.b),
        length = Math.hypot(a.x - b.x, a.y - b.y) / 100;
      if (length < 0.24) return "Give the member at least 0.25 m of length.";
      if (length > P.MATERIALS[e.material].maxLength + 0.001)
        return `${P.MATERIALS[e.material].name} members can be at most ${P.MATERIALS[e.material].maxLength} m long.`;
    }
    const used = usage(design);
    for (const [m, len] of Object.entries(used))
      if (len > level.inventory[m] + 0.001)
        return `Not enough ${P.MATERIALS[m].name.toLowerCase()}. Shorten a member or reuse material.`;
    return null;
  }
  class Editor {
    constructor(level, design) {
      this.level = level;
      this.design =
        design && !validate(design, level)
          ? structuredClone(design)
          : fresh(level);
      this.undoStack = [];
      this.redoStack = [];
      this.serial = Date.now();
    }
    commit(next) {
      const problem = validate(next, this.level);
      if (problem) return problem;
      this.undoStack.push(structuredClone(this.design));
      if (this.undoStack.length > 60) this.undoStack.shift();
      this.redoStack = [];
      this.design = next;
      return null;
    }
    add(start, end, material) {
      const next = structuredClone(this.design);
      const weld = (p) => {
        const node = next.nodes.find(
          (n) => Math.hypot(n.x - p.x, n.y - p.y) < 18,
        );
        if (node) return node.id;
        const id = "n" + ++this.serial;
        next.nodes.push({ id, x: p.x, y: p.y });
        return id;
      };
      const a = weld(start),
        b = weld(end);
      next.members.push({ id: "e" + ++this.serial, a, b, material });
      return this.commit(next);
    }
    move(id, p) {
      const next = structuredClone(this.design),
        n = next.nodes.find((n) => n.id === id);
      if (!n || n.fixed) return "The orange anchors stay fixed.";
      const target = next.nodes.find(
        (n) => n.id !== id && Math.hypot(n.x - p.x, n.y - p.y) < 16,
      );
      if (target) {
        next.members = next.members.map((e) => ({
          ...e,
          a: e.a === id ? target.id : e.a,
          b: e.b === id ? target.id : e.b,
        }));
        next.nodes = next.nodes.filter((n) => n.id !== id);
      } else Object.assign(n, { x: p.x, y: p.y });
      return this.commit(next);
    }
    remove(id) {
      const next = structuredClone(this.design);
      next.members = next.members.filter((e) => e.id !== id);
      const used = new Set(next.members.flatMap((e) => [e.a, e.b]));
      next.nodes = next.nodes.filter((n) => n.fixed || used.has(n.id));
      return this.commit(next);
    }
    undo() {
      if (!this.undoStack.length) return false;
      this.redoStack.push(structuredClone(this.design));
      this.design = this.undoStack.pop();
      return true;
    }
    redo() {
      if (!this.redoStack.length) return false;
      this.undoStack.push(structuredClone(this.design));
      this.design = this.redoStack.pop();
      return true;
    }
  }
  const api = { supports, fresh, usage, validate, Editor };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.BridgeModel = api;
})(typeof window !== "undefined" ? window : globalThis);
