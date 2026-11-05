const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const path = require("node:path");
(async () => {
  const b = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_EXECUTABLE
      ? { executablePath: process.env.BROWSER_EXECUTABLE }
      : {}),
  });
  try {
    const ctx = await b.newContext({
      viewport: { width: 1280, height: 900 },
      reducedMotion: "reduce",
      offline: true,
    });
    await ctx.addInitScript(() =>
      localStorage.setItem("bridge-engineer-onboarding-v1", "complete"),
    );
    await ctx.addInitScript(() => {
      const native = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        return /webgl/.test(type) ? null : native.call(this, type, ...args);
      };
    });
    const p = await ctx.newPage(),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto("file://" + path.resolve("site/index.html"));
    await p.waitForFunction(() => document.body.dataset.engineReady === "true");
    assert.equal(
      await p.evaluate(() => BridgeRuntime.game.config.renderType),
      1,
    );
    await p.locator("#start").click();
    if (await p.locator("#begin-building").count()) await p.locator("#begin-building").click();
    const point = (x, y) =>
      p.evaluate(
        ({ x, y }) => {
          const host = BridgeRuntime.game.scene.getScene("Workshop").host;
          return {
            x: host.view.x + x * host.view.scale,
            y: host.view.y + y * host.view.scale,
          };
        },
        { x, y },
      );
    const left = await point(440, 430),
      right = await point(1040, 430);
    await p.mouse.move(left.x, left.y);
    await p.mouse.down();
    await p.mouse.move(right.x, right.y, { steps: 8 });
    await p.mouse.up();
    await p.locator("#test").click();
    await p.locator("#speed").click();
    await p.locator("#speed").click();
    await p.locator("#feedback-panel.failure").waitFor({ timeout: 30000 });
    await p.locator("#result-edit").click();
    await p.locator("#help").click();
    await p.locator('[data-guide="structures"]').click();
    await p.locator("summary").first().click();
    await p.locator("#starter").click();
    await p.locator("#confirm-starter").click();
    assert.equal(
      await p.evaluate(
        () =>
          BridgeRuntime.game.scene.getScene("Workshop").tweens.getTweens()
            .length,
      ),
      0,
    );
    await p.locator("#test").click();
    await p.locator("#stress").click();
    await p.waitForFunction(
      () => BridgeRuntime.game.scene.getScene("HUD").legend.visible,
    );
    await p.locator("#speed").click();
    await p.locator("#speed").click();
    await p.locator("#feedback-panel.success").waitFor({ timeout: 30000 });
    await p.locator("#result-edit").click();
    assert.equal(await p.locator("#materials button:enabled").count(), 2);
    assert.deepEqual(errors, []);
    console.log(
      "PASS: offline Canvas fallback, reduced motion, force legend, successful crossing and edit restore",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
