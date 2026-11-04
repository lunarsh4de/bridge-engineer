const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    ...(process.env.BROWSER_EXECUTABLE
      ? { executablePath: process.env.BROWSER_EXECUTABLE }
      : {}),
    headless: true,
  });
  const ctx = await b.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  await ctx.addInitScript(() => {
    const native = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return /webgl/.test(type) ? null : native.call(this, type, ...args);
    };
  });
  const p = await ctx.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(process.env.BASE_URL || "http://localhost:8766");
  await p.waitForFunction(() => document.body.dataset.engineReady === "true");
  assert.equal(await p.evaluate(() => BridgeRuntime.game.config.renderType), 1);
  await p.locator("#starter").click();
  assert.equal(
    await p.evaluate(
      () =>
        BridgeRuntime.game.scene.getScene("Workshop").tweens.getTweens().length,
    ),
    0,
  );
  await p.locator("#test").click();
  await p.locator("#stress").click();
  await p.waitForFunction(
    () => BridgeRuntime.game.scene.getScene("HUD").legend.visible,
  );
  assert.equal(
    await p.evaluate(
      () =>
        BridgeRuntime.game.scene
          .getScene("HUD")
          .legend.list.filter((x) => x.type === "Text").length,
    ),
    3,
  );
  await p.locator("#stress").click();
  await p.locator("#speed").click();
  await p.locator("#speed").click();
  await p.locator("#feedback-panel.success").waitFor({ timeout: 20000 });
  await p.locator("#result-edit").click();
  await p.locator("#clear").click();
  await p.locator("#confirm-clear").click();
  const r = await p.locator("#scene").boundingBox();
  const sc = Math.min((r.width - 400) / 780, (r.height - 190) / 430);
  const pt = (x) => ({
    x: r.width / 2 + 70 + (x - 740) * sc,
    y: r.y + r.height * 0.52,
  });
  let a = pt(440),
    z = pt(1040);
  await p.mouse.move(a.x, a.y);
  await p.mouse.down();
  await p.mouse.move(z.x, z.y, { steps: 6 });
  await p.mouse.up();
  await p.locator("#test").click();
  await p.locator("#speed").click();
  await p.locator("#speed").click();
  await p.locator("#feedback-panel.failure").waitFor({ timeout: 20000 });
  await p.locator("#result-edit").click();
  await p.locator("#brief-toggle").click();
  await p.locator("#starter").click();
  await p.locator("#confirm-starter").click();
  await p.locator("#test").click();
  await p.locator("#speed").click();
  await p.locator("#speed").click();
  await p.locator("#feedback-panel.success").waitFor({ timeout: 20000 }); // Rapid repeated commands must not duplicate a running experiment.
  await p.locator("#result-edit").click();
  for (let i = 0; i < 12; i++) await p.locator("#test").dispatchEvent("click");
  assert.equal(await p.locator("#simulation-panel").isVisible(), true);
  assert.ok(
    await p.evaluate(() =>
      BridgeRuntime.game.scene
        .getScene("Workshop")
        .cache.audio.exists("tone-place"),
    ),
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: Canvas fallback, reduced motion, crossing, road-only failure and successful redesign",
  );
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
