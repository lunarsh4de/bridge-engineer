const { test } = require("node:test");
const assert = require("node:assert/strict");
const P = require("../js/physics.js");
const { levels, starter } = require("../js/levels.js");
const M = require("../js/model.js");
function run(world, seconds = 23) {
  for (let i = 0; i < seconds / P.STEP && world.status === "running"; i++)
    world.step();
  return world;
}
function floating(material = "wood") {
  const l = levels[0];
  return {
    nodes: [
      ...M.fresh(l).nodes,
      { id: "a", x: 640, y: 220 },
      { id: "b", x: 790, y: 220 },
    ],
    members: [{ id: "float", a: "a", b: "b", material }],
  };
}
test("all three starter structures fit inventory and carry their delivery under gravity", () => {
  for (const l of levels) {
    const design = starter(l);
    assert.equal(M.validate(design, l), null);
    const world = run(new P.World(design, l, { vehicle: true }));
    assert.equal(world.status, "passed", l.name);
    assert.ok(world.maxSag < 0.12);
    assert.equal(world.breakCount, 0);
  }
});
test("a floating member falls under gravity while both bank anchors remain fixed", () => {
  const l = levels[0],
    w = new P.World(floating(), l);
  run(w, 0.3);
  assert.ok(w.byId.get("a").y > 2.4);
  assert.ok(w.byId.get("a").vy > 0);
  assert.equal(w.byId.get("left").x, l.left / 100);
  assert.equal(w.byId.get("left").y, l.deckY / 100);
  assert.equal(w.byId.get("right").x, l.right / 100);
});
test("zero gravity keeps an initially motionless floating member still", () => {
  const w = run(new P.World(floating(), levels[0], { gravity: 0 }), 2);
  assert.equal(w.byId.get("a").y, 2.2);
  assert.equal(w.byId.get("a").vy, 0);
});
test("self-weight is included and steel contributes more mass than timber", () => {
  const wood = new P.World(floating("wood"), levels[0]),
    steel = new P.World(floating("steel"), levels[0]);
  assert.ok(steel.byId.get("a").mass > wood.byId.get("a").mass);
  assert.equal(
    wood.nodes.reduce((s, n) => s + n.mass, 0),
    4 * 8 + 1.5 * P.MATERIALS.wood.density,
  );
});
test("an unsupported deck sags and fails the same task that a triangulated bridge passes", () => {
  const l = levels[0],
    d = starter(l);
  d.members = d.members.filter((e) => e.material === "road");
  const w = run(new P.World(d, l, { vehicle: true }));
  assert.equal(w.status, "failed");
  assert.ok(w.maxSag > 0.12);
  assert.equal(
    run(new P.World(starter(l), l, { vehicle: true })).status,
    "passed",
  );
});
test("a cable becomes slack in compression and develops force in tension", () => {
  const w = new P.World(floating("cable"), levels[0], { gravity: 0 });
  const b = w.byId.get("b");
  b.x -= 0.5;
  w.step();
  assert.ok(Math.abs(w.members[0].force) < 1e-9);
  const t = new P.World(floating("cable"), levels[0], { gravity: 0 });
  t.byId.get("b").x += 0.1;
  t.step();
  assert.ok(t.members[0].force > 0);
});
test("a heavily overloaded bridge breaks and records the first member and force", () => {
  const l = { ...levels[0], truckMass: 15000 };
  const w = run(new P.World(starter(l), l, { vehicle: true }));
  assert.equal(w.status, "failed");
  assert.ok(w.breakCount > 0);
  assert.ok(w.firstBreak.time > 0);
  assert.ok(w.firstBreak.ratio > 1);
});
test("material choice matters in the final crossing", () => {
  const l = levels[2],
    d = starter(l);
  d.members = d.members.map((e) => ({
    ...e,
    material: e.material === "road" ? "road" : "wood",
  }));
  const w = run(new P.World(d, l, { vehicle: true }));
  assert.equal(w.status, "failed");
  assert.ok(w.firstBreak);
  assert.equal(
    run(new P.World(starter(l), l, { vehicle: true })).status,
    "passed",
  );
});
test("a disconnected road cannot pass simply because it contains enough material", () => {
  const l = levels[0],
    d = starter(l);
  d.members = d.members.filter((e) => e.id !== "m1");
  const w = run(new P.World(d, l, { vehicle: true }));
  assert.equal(w.route, null);
  assert.equal(w.status, "failed");
  assert.ok(w.vehicle.falling);
});
test("repeating the same design and fixed steps produces the same result", () => {
  const a = run(new P.World(starter(levels[1]), levels[1], { vehicle: true })),
    b = run(new P.World(starter(levels[1]), levels[1], { vehicle: true }));
  assert.equal(a.maxSag, b.maxSag);
  assert.equal(a.time, b.time);
  assert.equal(a.maxForceRatio, b.maxForceRatio);
});
