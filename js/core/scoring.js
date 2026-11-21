/* Riverbend: Bridge Engineer - stars and challenge badges. Pure, deterministic. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BridgeScoring = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  // Stars compare cost with "par": the cheapest tested reference available on the
  // player's current path. Budget only decides pass/fail, so no branch is penalised.
  const STAR3 = 1.0, STAR2 = 1.3;
  function par(refs, costOf) { return refs.length ? Math.min(...refs.map((r) => costOf(r.members))) : Infinity; }
  function stars(pass, cost, parCost, budget) {
    if (!pass || cost > budget) return 0;
    if (cost <= parCost * STAR3) return 3;
    if (cost <= parCost * STAR2) return 2;
    return 1;
  }
  // Badge kinds. Each level lists 2-3 with parameters in levels.js `badges`.
  const KINDS = {
    minimal: { name: "Minimalist", text: (p) => `Use at most ${p.n} members`, ok: (r, p) => r.members <= p.n },
    cool: { name: "Cool Head", text: (p) => `Keep every member below ${Math.round(p.max * 100)}% of its limit`, ok: (r, p) => r.peakRatio <= p.max },
    stiff: { name: "Steady Road", text: (p) => `Keep the road drop under ${p.cm} cm`, ok: (r, p) => r.maxSagCm <= p.cm },
    nomat: { name: "Without", text: (p) => `Pass without ${p.mat}`, ok: (r, p) => !r.mats.includes(p.mat) },
    budget: { name: "Penny Pincher", text: (p) => `Spend at most ${p.credits} credits`, ok: (r, p) => r.cost <= p.credits },
  };
  function describe(b) { const k = KINDS[b.kind]; return { id: b.kind + (b.mat || ""), name: b.kind === "nomat" ? `No ${b.mat}` : k.name, text: k.text(b) }; }
  // r: { pass, cost, members, peakRatio, maxSagCm, mats[] }
  function badges(list, r) {
    if (!r.pass) return [];
    return (list || []).filter((b) => KINDS[b.kind].ok(r, b)).map((b) => describe(b).id);
  }
  function runRecord(design, summary, costOf) {
    return {
      pass: summary.outcome === "pass", cost: costOf(design), members: design.length,
      peakRatio: summary.peakRatio, maxSagCm: summary.maxSagCm,
      mats: [...new Set(design.map((m) => m.m))],
    };
  }
  return { STAR2, STAR3, par, stars, KINDS, describe, badges, runRecord };
});
