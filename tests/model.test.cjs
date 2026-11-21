const test = require("node:test");
const assert = require("node:assert");
const M = require("../site/js/core/model.js");
const L = require("../site/js/core/levels.js");
const lv = () => L.resolveLevel("willow", L.newWorld());
test("long road splits into 2 m sections", () => {
  const d = M.create(lv());
  assert.ok(M.add(d, [0, 0], [12, 0], "road").ok);
  assert.strictEqual(d.members.length, 3);
});
test("rejects bad members with a reason", () => {
  const d = M.create(lv());
  assert.match(M.add(d, [3, -1], [5, 0], "timber").error, /existing joint/);
  assert.match(M.add(d, [0, -3], [12, 0], "timber").error, /Too long/);
  assert.match(M.add(d, [0, 0], [4, -2], "road").error, /level/);
  assert.match(M.add(d, [0, 0], [4, 0], "steel").error, /not available/);
  assert.match(M.add(d, [0, 0], [0, 0], "timber").error, /different/);
  assert.match(M.add(d, [0, 0], [40, 0], "road").error, /outside/);
});
test("undo and redo restore edits", () => {
  const d = M.create(lv());
  M.add(d, [0, 0], [4, 0], "road");
  M.add(d, [0, -3], [4, 0], "timber");
  M.undo(d); assert.strictEqual(d.members.length, 1);
  M.redo(d); assert.strictEqual(d.members.length, 2);
  M.clear(d); assert.strictEqual(d.members.length, 0);
  M.undo(d); assert.strictEqual(d.members.length, 2);
});
test("warnings catch gaps and loose ends", () => {
  const d = M.create(lv());
  assert.match(M.warnings(d)[0], /no road/);
  M.add(d, [0, 0], [6, 0], "road");
  M.add(d, [0, -3], [2, -1], "timber");
  const w = M.warnings(d).join(" ");
  assert.match(w, /gap/); assert.match(w, /connected to nothing/);
});
