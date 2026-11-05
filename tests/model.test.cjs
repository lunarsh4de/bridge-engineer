const { test } = require("node:test");
const assert = require("node:assert/strict");
const { Editor, usage, validate, fresh } = require("../site/js/model.js");
const { levels, sandbox, starter } = require("../site/js/levels.js");
const l = levels[0];
test("free placement creates joints anywhere and nearby endpoints weld", () => {
  const e = new Editor(l);
  assert.equal(e.add({ x: 440, y: 430 }, { x: 590, y: 330 }, "wood"), null);
  const node = e.design.nodes.find((n) => n.x === 590);
  assert.ok(node);
  assert.equal(e.add({ x: 595, y: 335 }, { x: 740, y: 330 }, "wood"), null);
  assert.equal(e.design.nodes.filter((n) => n.x === 590).length, 1);
  assert.equal(e.design.members[0].b, e.design.members[1].a);
});
test("validation rejects locked materials, excessive length, duplicate members and overspending atomically", () => {
  const e = new Editor(l),
    before = JSON.stringify(e.design);
  assert.match(
    e.add({ x: 440, y: 430 }, { x: 640, y: 430 }, "steel"),
    /Not enough/,
  );
  assert.equal(JSON.stringify(e.design), before);
  assert.match(
    e.add({ x: 440, y: 430 }, { x: 840, y: 430 }, "wood"),
    /at most/,
  );
  e.add({ x: 440, y: 430 }, { x: 640, y: 430 }, "road");
  assert.match(
    e.add({ x: 640, y: 430 }, { x: 440, y: 430 }, "wood"),
    /already/,
  );
});
test("moving a joint changes attached lengths and fixed supports cannot be moved", () => {
  const e = new Editor(l);
  e.add({ x: 440, y: 430 }, { x: 590, y: 330 }, "wood");
  const id = e.design.members[0].b,
    old = usage(e.design).wood;
  assert.equal(e.move(id, { x: 640, y: 330 }), null);
  assert.ok(usage(e.design).wood > old);
  assert.match(e.move("left", { x: 450, y: 430 }), /fixed/);
});
test("undo and redo restore complete editable structures and clear is undoable", () => {
  const e = new Editor(l);
  e.commit(starter(l));
  const original = JSON.stringify(e.design);
  e.commit(fresh(l));
  assert.equal(e.design.members.length, 0);
  assert.ok(e.undo());
  assert.equal(JSON.stringify(e.design), original);
  assert.ok(e.redo());
  assert.equal(e.design.members.length, 0);
});
test("removing a loose member returns material and removes its unused joints", () => {
  const e = new Editor(l);
  e.add({ x: 640, y: 220 }, { x: 790, y: 220 }, "wood");
  e.remove(e.design.members[0].id);
  assert.equal(e.design.nodes.length, 2);
  assert.equal(usage(e.design).wood, 0);
});
test("invalid saved designs fall back to a safe blank design", () => {
  const e = new Editor(l, { nodes: [], members: [] });
  assert.equal(e.design.nodes.length, 2);
  assert.equal(validate(e.design, l), null);
});
test("pier levels include an immutable fixed support while sandbox uses campaign-independent limits", () => {
  const pierLevel = levels[4],
    editor = new Editor(pierLevel),
    pier = editor.design.nodes.find((n) => n.id === "pier");
  assert.deepEqual(pier, { id: "pier", x: 800, y: 430, fixed: true });
  assert.match(editor.move("pier", { x: 825, y: 430 }), /fixed/);
  const changed = structuredClone(editor.design);
  changed.nodes.find((n) => n.id === "pier").x += 25;
  assert.match(validate(changed, pierLevel), /supports/);
  assert.equal(validate(starter(sandbox), sandbox), null);
  assert.equal(sandbox.sandbox, true);
});
