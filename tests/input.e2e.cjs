const { chromium } = require("playwright"),
  assert = require("node:assert/strict"),
  path = require("node:path");
(async () => {
  const b = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_EXECUTABLE
      ? { executablePath: process.env.BROWSER_EXECUTABLE }
      : {}),
  });
  try {
    const ctx = await b.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      offline: true,
    });
    await ctx.addInitScript(() =>
      localStorage.setItem("bridge-engineer-onboarding-v1", "complete"),
    );
    const p = await ctx.newPage();
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto("file://" + path.resolve("site/index.html"));
    await p.waitForFunction(() => document.body.dataset.engineReady === "true");
    await p.locator("#start").tap();
    if (await p.locator("#begin-building").count()) await p.locator("#begin-building").tap();
    await p.waitForFunction(
      () =>
        BridgeRuntime.game.scene.getScene("Workshop").host.state.screen ===
        "workshop",
    );
    const pt = async (x, y) =>
      p.evaluate(
        ({ x, y }) => {
          const h = BridgeRuntime.game.scene.getScene("Workshop").host;
          return {
            x: h.view.x + x * h.view.scale,
            y: h.view.y + y * h.view.scale,
          };
        },
        { x, y },
      );
    const a = await pt(440, 430),
      z = await pt(1040, 430);
    await p.touchscreen.tap(a.x, a.y);
    await p.touchscreen.tap(z.x, z.y);
    assert.equal(
      await p.evaluate(
        () =>
          BridgeRuntime.game.scene.getScene("Workshop").host.state.editor.design
            .members.length,
      ),
      3,
    );
    await p.locator('[data-material="wood"]').tap();
    let u = await pt(540, 330);
    await p.touchscreen.tap(a.x, a.y);
    await p.touchscreen.tap(u.x, u.y);
    assert.equal(
      await p.evaluate(
        () =>
          BridgeRuntime.game.scene.getScene("Workshop").host.state.editor.design
            .members.length,
      ),
      4,
    );
    await p.touchscreen.tap(u.x, u.y);
    await p.locator("#cancel-placement").tap();
    assert.equal(
      await p.evaluate(
        () =>
          BridgeRuntime.game.scene.getScene("Workshop").host.state.editor.design
            .members.length,
      ),
      4,
    );
    await p.locator("#scene").focus();
    await p.keyboard.press("Enter");
    for (let i = 0; i < 4; i++) await p.keyboard.press("ArrowUp");
    await p.keyboard.press("Enter");
    assert.equal(
      await p.evaluate(
        () =>
          BridgeRuntime.game.scene.getScene("Workshop").host.state.editor.design
            .members.length,
      ),
      5,
    );
    const campaignBeforeTraining = await p.evaluate(() =>
      JSON.stringify(
        JSON.parse(localStorage.getItem("bridge-engineer-workshop-v2")).designs[0],
      ),
    );
    await p.locator("#help").click();
    await p.locator('[data-guide="settings"]').click();
    await p.locator("#replay-training").click();
    assert.equal(await p.locator("#tutorial-coach").isVisible(), true);
    await p.locator("#home").click();
    await p.locator("#select-level").click();
    await p.locator("#selection-back").click();
    await p.reload();
    await p.waitForFunction(() => document.body.dataset.engineReady === "true");
    await p.locator("#start").click();
    if (await p.locator("#begin-building").count()) await p.locator("#begin-building").click();
    assert.equal(
      await p.evaluate(() =>
        JSON.stringify(
          JSON.parse(localStorage.getItem("bridge-engineer-workshop-v2"))
            .designs[0],
        ),
      ),
      campaignBeforeTraining,
    );
    const fresh = await b.newContext({
      viewport: { width: 1024, height: 768 },
      hasTouch: true,
      offline: true,
    });
    const fp = await fresh.newPage();
    fp.on("pageerror", (e) => errors.push(e.message));
    await fp.goto("file://" + path.resolve("site/index.html"));
    await fp.waitForFunction(() => document.body.dataset.engineReady === "true");
    await fp.locator("#start").click();
    if (await fp.locator("#begin-building").count()) await fp.locator("#begin-building").click();
    assert.equal(await fp.locator("#story").isVisible(), true);
    assert.equal(await fp.locator(".story-panel").count(), 4);
    await fp.locator("#story-skip").click();
    assert.equal(await fp.locator("#tutorial-coach").isVisible(), true);
    await fp.locator("#tutorial-skip").click();
    await fp.locator("#begin-building").click();
    assert.equal(await fp.locator("#tutorial-coach").isVisible(), false);
    await fp.locator("#home").click();
    await fp.locator("#replay-story").click();
    assert.equal(await fp.locator("#story").isVisible(), true);
    await fp.locator("#story-continue").click();
    await fresh.close();
    assert.deepEqual(errors, []);
    console.log(
      "PASS: touch placement, keyboard input, fresh/skip/replay onboarding, and abandoned-training save isolation",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
