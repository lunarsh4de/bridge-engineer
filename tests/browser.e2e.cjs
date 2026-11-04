const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const path = require("node:path");
const { levels } = require("../js/levels.js");
const EXE = process.env.BROWSER_EXECUTABLE;
const BASE_URL = process.env.BASE_URL || "http://localhost:8766";
require("node:fs").mkdirSync("work", { recursive: true });
(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(EXE ? { executablePath: EXE } : {}),
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const p = await context.newPage(),
    errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(BASE_URL);
  await p.waitForFunction(() => document.body.dataset.engineReady === "true");
  assert.deepEqual(
    await p.evaluate(() => ({
      version: BridgeRuntime.version,
      scenes: BridgeRuntime.game.scene
        .getScenes(true)
        .map((s) => s.sys.settings.key),
      native: BridgeRuntime.game.scene.getScene("Workshop").vehicle.type,
    })),
    { version: "3.90.0", scenes: ["Workshop", "HUD"], native: "Container" },
  );
  await p.locator("#sound").click();
  assert.equal(await p.evaluate(() => BridgeRuntime.game.sound.mute), true);
  await p.reload();
  await p.waitForFunction(() => document.body.dataset.engineReady === "true");
  assert.equal(await p.locator("#sound").getAttribute("aria-pressed"), "true");
  await p.locator("#sound").click();
  console.log("Engine ready; checking construction");
  const read = () =>
    p.evaluate(() =>
      JSON.parse(localStorage.getItem("bridge-engineer-workshop-v2")),
    );
  async function coords(x, y, index = 0) {
    const l = levels[index];
    return p.locator("#scene").evaluate(
      (e, { x, y, l }) => {
        const r = e.getBoundingClientRect(),
          mobile = r.width < 761,
          scale = Math.max(
            0.19,
            Math.min(
              (r.width - (mobile ? 65 : 400)) / (l.right - l.left + 180),
              (r.height - (mobile ? 300 : 190)) / 430,
            ),
          );
        return {
          x:
            r.left +
            r.width / 2 +
            (mobile ? 0 : 70) +
            (x - (l.left + l.right) / 2) * scale,
          y: r.top + r.height * 0.52 + (y - l.deckY) * scale,
        };
      },
      { x, y, l },
    );
  }
  async function drag(a, b, index = 0) {
    const s = await coords(...a, index),
      e = await coords(...b, index);
    await p.mouse.move(s.x, s.y);
    await p.mouse.down();
    await p.mouse.move(e.x, e.y, { steps: 9 });
    await p.mouse.up();
  }
  assert.equal(await p.locator("#scene").isVisible(), true);
  assert.ok((await p.locator("#scene").boundingBox()).height > 800);
  assert.equal(await p.locator("dialog[open]").count(), 0);
  await p.locator("#about").click();
  assert.match(
    await p.locator("#modal-body").innerText(),
    /Engineering within STEM/i,
  );
  await p.keyboard.press("Escape");
  // Free construction: a single road gesture splits into joined deck pieces.
  await drag([440, 430], [1040, 430]);
  let d = (await read()).designs[0];
  assert.equal(d.members.length, 3);
  assert.equal(d.nodes.filter((n) => !n.fixed).length, 2);
  await p.locator('[data-material="wood"]').click();
  for (const [a, b] of [
    [
      [440, 430],
      [540, 330],
    ],
    [
      [540, 330],
      [640, 430],
    ],
    [
      [640, 430],
      [740, 330],
    ],
    [
      [740, 330],
      [840, 430],
    ],
    [
      [840, 430],
      [940, 330],
    ],
    [
      [940, 330],
      [1040, 430],
    ],
    [
      [540, 330],
      [740, 330],
    ],
    [
      [740, 330],
      [940, 330],
    ],
  ])
    await drag(a, b);
  d = (await read()).designs[0];
  assert.equal(d.members.length, 11);
  assert.equal(d.nodes.length, 7);
  // Moving an arbitrary joint updates attached members; undo restores the exact geometry.
  await p.locator("#move").click();
  await drag([740, 330], [740, 305]);
  assert.equal((await read()).designs[0].nodes.find((n) => n.x === 740).y, 305);
  await p.locator("#undo").click();
  assert.equal((await read()).designs[0].nodes.find((n) => n.x === 740).y, 330);
  await p.locator("#redo").click();
  await p.locator("#undo").click();
  await p.reload();
  await p.waitForFunction(() => document.body.dataset.engineReady === "true");
  assert.equal((await read()).designs[0].members.length, 11);
  console.log("Manual construction completed");
  await p.locator("#test").click();
  await p.locator("#speed").click();
  await p.locator("#speed").click();
  await p.locator("#feedback-panel.success").waitFor({ timeout: 20000 });
  assert.match(
    await p.locator("#feedback-body").innerText(),
    /No member failed/,
  );
  assert.equal(await p.locator("#pause").isDisabled(), true);
  await p.screenshot({ path: "work/v3-manual-crossing.png" });
  for (let i = 1; i < 3; i++) {
    await p.locator("#next").click();
    await p.locator("#starter").click();
    await p.locator("#test").click();
    await p.locator("#speed").click();
    await p.locator("#speed").click();
    await p.locator("#feedback-panel.success").waitFor({ timeout: 20000 });
  }
  await p.locator("#next").click();
  assert.match(
    await p.locator("#modal-body").innerText(),
    /Riverbend, reconnected/,
  );
  assert.deepEqual((await read()).completed, [true, true, true]);
  await p.keyboard.press("Escape");
  await p.locator("#result-edit").click();
  await p.locator("#missions").click();
  await p.locator('[data-mission="0"]').click();
  await p.locator("#clear").click();
  await p.locator("#confirm-clear").click();
  assert.equal((await read()).designs[0].members.length, 0);
  // Palette drag-and-drop places a physical piece without predefined connection points.
  const spot = await coords(740, 230);
  const dt = await p.evaluateHandle(() => {
    const data = new DataTransfer();
    data.setData("text/plain", "wood");
    return data;
  });
  await p.locator("#scene").dispatchEvent("drop", {
    dataTransfer: dt,
    clientX: spot.x,
    clientY: spot.y,
  });
  d = (await read()).designs[0];
  assert.equal(d.members.length, 1);
  assert.ok(d.nodes.some((n) => n.y === 230));
  await p.locator("#gravity").click();
  await p.waitForFunction(
    () => parseFloat(document.querySelector("#time-value").textContent) > 0.4,
  );
  await p.locator("#pause").click();
  const paused = await p.locator("#time-value").innerText();
  await p.locator("#about").click();
  assert.match(
    await p.locator("#modal-body").innerText(),
    /prescribed moving load/,
  );
  await p.keyboard.press("Escape");
  assert.equal(await p.locator("#time-value").innerText(), paused);
  await p.screenshot({ path: "work/v3-gravity-drop.png" });
  await p.locator("#back-build").click();
  assert.equal((await read()).designs[0].members.length, 1);
  // Clear is reversible, and keyboard placement remains usable.
  await p.locator("#clear").click();
  await p.locator("#confirm-clear").click();
  await p.locator("#undo").click();
  assert.equal((await read()).designs[0].members.length, 1);
  await p.locator("#redo").click();
  await p.locator('[data-material="wood"]').click();
  await p.locator("#scene").focus();
  await p.keyboard.press("Enter");
  for (let i = 0; i < 4; i++) await p.keyboard.press("ArrowUp");
  await p.keyboard.press("Enter");
  assert.equal((await read()).designs[0].members.length, 1);
  // Fullscreen can be entered and exited by an explicit user action.
  await p.locator("#fullscreen").click();
  await p.waitForFunction(() => !!document.fullscreenElement);
  await p.locator("#fullscreen").click();
  await p.waitForFunction(() => !document.fullscreenElement);
  await p.locator("#clear").click();
  await p.locator("#confirm-clear").click();
  for (const size of [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 844, height: 390 },
    { width: 390, height: 844 },
  ]) {
    await p.setViewportSize(size);
    await p.evaluate(() => window.dispatchEvent(new Event("resize")));
    assert.equal(
      await p.evaluate(
        () =>
          document.documentElement.scrollWidth <= innerWidth &&
          document.documentElement.scrollHeight <= innerHeight,
      ),
      true,
    );
    const buttons = await p
      .locator("#materials button, #test, #gravity, #about")
      .evaluateAll((es) =>
        es
          .filter((e) => !e.disabled)
          .map((e) => {
            const r = e.getBoundingClientRect();
            return {
              id: e.id || e.dataset.material,
              x: r.x,
              y: r.y,
              right: r.right,
              bottom: r.bottom,
            };
          }),
      );
    for (const r of buttons) {
      assert.ok(
        r.x >= 0 &&
          r.y >= 0 &&
          r.right <= size.width + 1 &&
          r.bottom <= size.height + 1,
        JSON.stringify({ size, r }),
      );
    }
    if (size.width === 390) {
      await p.screenshot({ path: "work/v3-mobile-build.png" });
      await p.locator("#brief-toggle").click();
      await p.screenshot({ path: "work/v3-mobile-brief.png" });
      await p.locator("#brief-toggle").click();
    }
  }
  const offline = await browser.newContext({
    offline: true,
    viewport: { width: 1280, height: 900 },
  });
  const off = await offline.newPage();
  off.on("pageerror", (e) => errors.push(e.message));
  await off.goto("file://" + path.resolve("index.html"));
  await off.waitForFunction(() => document.body.dataset.engineReady === "true");
  await off.locator("#starter").click();
  await off.locator("#test").click();
  await off.locator("#speed").click();
  await off.locator("#speed").click();
  await off.locator("#feedback-panel.success").waitFor({ timeout: 20000 });
  const blocked = await browser.newContext();
  await blocked.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("storage blocked");
      },
    }),
  );
  const bp = await blocked.newPage();
  bp.on("pageerror", (e) => errors.push(e.message));
  await bp.goto(BASE_URL);
  await bp.waitForFunction(() => document.body.dataset.engineReady === "true");
  await bp.locator("#starter").click();
  await bp.locator("#gravity").click();
  assert.equal(await bp.locator("#simulation-panel").isVisible(), true);
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        status: "PASS",
        browser: await browser.version(),
        checks: [
          "Phaser scenes, native game objects and persistent mute",
          "direct-to-play viewport",
          "English About",
          "free road drag and automatic segmentation",
          "free timber placement and endpoint welding",
          "move/undo/redo",
          "design persistence",
          "manual first-level construction and test",
          "three gravity-based crossings",
          "palette drop at arbitrary coordinates",
          "pause and edit restore",
          "keyboard construction",
          "full-screen entry/exit",
          "four viewport sizes",
          "offline file:// crossing",
          "blocked storage fallback",
          "no uncaught page errors",
        ],
      },
      null,
      2,
    ),
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
