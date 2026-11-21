const test = require("node:test");
const assert = require("node:assert");
const P = require("../site/js/core/physics.js");
const L = require("../site/js/core/levels.js");
const S = require("../site/js/core/scoring.js");

function play(w, nodeId, optionId) {
  const n = L.NODES[nodeId];
  const o = n.options.find((x) => x.id === optionId);
  if (o.requires) assert.ok(o.requires(w), `${optionId} should be available`);
  o.effect(w);
  return o.next;
}
function runRefs(w, id) {
  const lv = L.resolveLevel(id, w);
  assert.ok(lv.refs.length > 0, `${id} has a usable reference`);
  for (const r of lv.refs) {
    for (const m of r.members) {
      assert.ok(lv.materials.includes(m.m), `${id}/${r.name}: ${m.m} allowed`);
      assert.ok(P.lengthOf(m) <= P.MATERIALS[m.m].maxLen + 1e-9, `${id}/${r.name}: member length`);
    }
    const s = P.summary(P.runToEnd(r.members, lv, lv.mass));
    assert.strictEqual(s.outcome, "pass", `${id}/${r.name}: ${s.reason}`);
    assert.ok(P.costOf(r.members) <= lv.totalBudget, `${id}/${r.name} cost ${P.costOf(r.members)} > ${lv.totalBudget}`);
  }
  // Every badge is reachable by at least one reference on this path, and the par design earns 3 stars.
  const recs = lv.refs.map((r) => S.runRecord(r.members, P.summary(P.runToEnd(r.members, lv, lv.mass)), P.costOf));
  const par = S.par(lv.refs, P.costOf);
  assert.ok(recs.some((x) => S.stars(x.pass, x.cost, par, lv.totalBudget) === 3), `${id}: par gives 3 stars`);
  for (const b of lv.badges || []) {
    const bid = S.describe(b).id;
    assert.ok(recs.some((x) => S.badges([b], x).includes(bid)), `${id}: badge ${bid} reachable`);
  }
  const best = lv.refs.map((r) => P.costOf(r.members)).sort((a, b) => a - b)[0];
  L.applyResult(w, id, { cost: best, pass: true });
}

const PATHS = [];
for (const route of ["clinic", "mill"]) for (const share of ["share", "keep"]) for (const sup of ["pier", "towers", "none"]) PATHS.push([route, share, sup]);

for (const [route, share, sup] of PATHS) {
  test(`path ${route}/${share}/${sup}`, (t) => {
    const w = L.newWorld();
    runRefs(w, "tabletop");
    runRefs(w, "willow");
    play(w, "route", route);
    runRefs(w, route);
    play(w, "share", share);
    runRefs(w, "echo");
    const opt = L.NODES.support.options.find((o) => o.id === sup);
    if (opt.requires && !opt.requires(w)) { t.diagnostic("locked on this path (expected)"); return; }
    play(w, "support", sup);
    runRefs(w, "finale");
  });
}

test("no extra support is always available", () => {
  const w = L.newWorld();
  assert.ok(!L.NODES.support.options.find((o) => o.id === "none").requires);
});

test("timber alone fails the heavy crossings", () => {
  const T = { chord: "timber", vert: "timber", web: "timber" };
  const B = L.builders;
  for (const [id, N, p, d] of [["mill", 12, 3, 3], ["echo", 20, 4, 4]]) {
    const lv = L.resolveLevel(id, L.newWorld());
    const s = P.summary(P.runToEnd([...B.deck(N, p), ...B.under(N, p, d, T)], lv, lv.mass));
    assert.strictEqual(s.outcome, "fail", id);
  }
});

test("road alone fails Willow Creek on drop", () => {
  const lv = L.resolveLevel("willow", L.newWorld());
  const s = P.summary(P.runToEnd(L.builders.deck(12, 2), lv, lv.mass));
  assert.strictEqual(s.outcome, "fail");
  assert.ok(s.maxSagCm > 12);
});

test("cable goes slack under compression", () => {
  const lv = { span: 2, anchors: [[0, 0], [4, 0]] };
  const sim = P.createSim([{ a: [0, 0], b: [2, 1], m: "cable" }, { a: [4, 0], b: [2, 1], m: "cable" }], lv, 0);
  for (let i = 0; i < 20; i++) P.step(sim);
  assert.ok(sim.mems.every((m) => m.slack || m.broken || Math.abs(m.fs) < 1));
});

test("cost and capacity helpers", () => {
  assert.strictEqual(P.costOf([{ a: [0, 0], b: [2, 0], m: "timber" }]), 6);
  assert.ok(P.compCapacity(P.MATERIALS.timber, 3) < P.compCapacity(P.MATERIALS.timber, 1));
  assert.strictEqual(P.compCapacity(P.MATERIALS.cable, 1), 0);
});

test("world reserve: half of savings carries forward, never negative", () => {
  const w = L.newWorld();
  L.applyResult(w, "willow", { cost: 120, pass: true });
  assert.strictEqual(w.reserve, 50);
  L.applyResult(w, "clinic", { cost: 300, pass: true });
  assert.ok(w.reserve >= 0);
});

test("stars: fail or over budget = 0, par = 3, within 30% = 2, else 1", () => {
  assert.strictEqual(S.stars(false, 50, 100, 200), 0);
  assert.strictEqual(S.stars(true, 250, 100, 200), 0);
  assert.strictEqual(S.stars(true, 100, 100, 200), 3);
  assert.strictEqual(S.stars(true, 125, 100, 200), 2);
  assert.strictEqual(S.stars(true, 180, 100, 200), 1);
});
