const test = require("node:test");
const assert = require("node:assert");
const S = require("../site/js/core/progress.js");
const L = require("../site/js/core/levels.js");
const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v) }; };
test("blank save when nothing stored or data damaged", () => {
  const st = mem();
  assert.strictEqual(S.load(st, L.newWorld).world.node, "prologue");
  st.setItem(S.KEY, "{bad json");
  assert.strictEqual(S.load(st, L.newWorld).world.node, "prologue");
});
test("save, export and import round trip", () => {
  const st = mem();
  const d = S.blank(L.newWorld);
  d.world.node = "echo"; d.world.materials.push("steel");
  S.save(st, d);
  assert.strictEqual(S.load(st, L.newWorld).world.node, "echo");
  const r = S.importText(S.exportText(d));
  assert.ok(r.ok);
  assert.deepStrictEqual(r.data.world.materials, ["road", "timber", "steel"]);
  assert.strictEqual(S.importText("hello").ok, false);
  assert.strictEqual(S.importText('{"version":0}').ok, false);
});
