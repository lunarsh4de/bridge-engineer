const { test } = require("node:test");
const assert = require("node:assert/strict");
const E = require("../js/progress.js"),
  L = require("../js/levels.js"),
  P = require("../js/physics.js");
const l = L.levels[0];
function world() {
  return {
    status: "passed",
    maxSag: 0.03,
    time: 9,
    breakCount: 0,
    firstBreak: null,
  };
}
test("three-level saves migrate without losing designs and corrupt entries are isolated", () => {
  const d = L.starter(l);
  const saved = E.normalize(
    {
      level: 2,
      completed: [true, true, true],
      designs: { 0: d, 1: { nodes: [null], members: [] } },
    },
    L.levels,
  );
  assert.deepEqual(saved.completed, [true, true, true, false]);
  assert.deepEqual(saved.designs[0], d);
  assert.equal(saved.designs[1], undefined);
});
test("evidence owns an immutable design and equivalent IDs do not generate duplicate records", () => {
  const data = E.empty(L.levels),
    d = L.starter(l);
  E.record(data, 0, l, d, world(), "crossing", "It will hold.", "Passed");
  const copy = structuredClone(d);
  const ids = new Map(copy.nodes.map((n, i) => [n.id, "alias" + i]));
  copy.nodes.forEach((n) => (n.id = ids.get(n.id)));
  copy.members.forEach((e) => {
    e.a = ids.get(e.a);
    e.b = ids.get(e.b);
  });
  assert.equal(E.fingerprint(d), E.fingerprint(copy));
  assert.equal(
    E.record(data, 0, l, copy, world(), "crossing", "", "Passed").duplicate,
    true,
  );
  d.nodes[2].y += 25;
  assert.notDeepEqual(data.records[0][0].design, d);
  assert.equal(data.records[0].length, 1);
});
test("comparison rejects different load or mode; resource reward requires two successful comparable designs", () => {
  const data = E.empty(L.levels),
    d = L.starter(l);
  E.record(data, 0, l, d, world(), "crossing", "", "Passed");
  const lean = structuredClone(d);
  lean.members.pop();
  assert.equal(
    E.record(
      data,
      0,
      { ...l, truckMass: 700 },
      lean,
      world(),
      "crossing",
      "",
      "Passed",
    ).saver,
    false,
  );
  assert.equal(E.comparison(data.records[0]), null);
  assert.equal(
    E.record(
      data,
      0,
      l,
      lean,
      { ...world(), status: "failed" },
      "crossing",
      "",
      "Failed",
    ).saver,
    false,
  );
  const improved = structuredClone(lean);
  improved.members.pop();
  assert.equal(
    E.record(data, 0, l, improved, world(), "crossing", "", "Passed").saver,
    true,
  );
  assert.ok(E.comparison(data.records[0]));
});
test("normalization bounds histories and recomputes costs instead of trusting imported rewards", () => {
  const d = L.starter(l),
    data = E.empty(L.levels);
  E.record(data, 0, l, d, world(), "crossing", "", "Passed");
  const r = data.records[0][0];
  r.cost = -1000;
  data.records[0] = Array.from({ length: 30 }, () => r);
  const parsed = E.normalize(data, L.levels);
  assert.equal(parsed.records[0].length, 8);
  assert.equal(parsed.records[0][0].cost, E.cost(d));
});
test("new cable challenge has a tension-carrying solution and its inverted compression chord fails", () => {
  const level = L.levels[3],
    d = L.starter(level);
  const run = (design) => {
    const w = new P.World(design, level, { vehicle: true });
    for (let i = 0; i < 23 / P.STEP && w.status === "running"; i++) w.step();
    return w;
  };
  const good = run(d);
  assert.equal(good.status, "passed");
  assert.ok(
    good.members
      .filter((e) => e.material === "cable")
      .every((e) => e.force > 0),
  );
  const inverted = structuredClone(d);
  inverted.nodes.forEach((n) => {
    n.y = 2 * level.deckY - n.y;
  });
  assert.equal(run(inverted).status, "failed");
});
