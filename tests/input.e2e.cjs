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
    const p = await ctx.newPage();
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto("file://" + path.resolve("index.html"));
    await p.waitForFunction(() => document.body.dataset.engineReady === "true");
    await p.locator("#start").tap();
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
    assert.deepEqual(errors, []);
    console.log(
      "PASS: emulated touch two-endpoint road/timber placement, cancellation, and keyboard placement",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
