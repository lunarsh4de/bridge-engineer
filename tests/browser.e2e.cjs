const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { levels, starter } = require("../site/js/levels.js");
const URL = process.env.BASE_URL || "file://" + path.resolve("site/index.html");
fs.mkdirSync("work", { recursive: true });
(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_EXECUTABLE
      ? { executablePath: process.env.BROWSER_EXECUTABLE }
      : {}),
  });
  try {
    const errors = [];
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      offline: URL.startsWith("file:"),
      reducedMotion: "reduce",
    });
    await ctx.addInitScript(() =>
      localStorage.setItem("bridge-engineer-onboarding-v1", "complete"),
    );
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    const ready = async (page) => {
      await page.goto(URL);
      await page.waitForFunction(
        () => document.body.dataset.engineReady === "true",
      );
    };
    const read = () =>
      p.evaluate(() =>
        JSON.parse(localStorage.getItem("bridge-engineer-workshop-v2")),
      );
    async function point(x, y) {
      return p.evaluate(
        ({ x, y }) => {
          const host = BridgeRuntime.game.scene.getScene("Workshop").host;
          const r = document.querySelector("#scene").getBoundingClientRect();
          return {
            x: r.left + host.view.x + x * host.view.scale,
            y: r.top + host.view.y + y * host.view.scale,
          };
        },
        { x, y },
      );
    }
    async function drag(a, b) {
      const s = await point(...a),
        e = await point(...b);
      await p.mouse.move(s.x, s.y);
      await p.mouse.down();
      await p.mouse.move(e.x, e.y, { steps: 2 });
      await p.mouse.up();
    }
    async function example(page = p) {
      await page.locator("#help").click();
      await page.locator('[data-guide="structures"]').click();
      await page.locator("summary").first().click();
      await page.locator("#starter").click();
      if (await page.locator("#confirm-starter").count())
        await page.locator("#confirm-starter").click();
    }
    async function crossing(page = p, result = "success") {
      await page.locator("#test").click();
      await page.locator("#speed").click();
      await page.locator("#speed").click();
      await page.evaluate(() => {
        const host = BridgeRuntime.game.scene.getScene("Workshop").host;
        for (let i = 0; i < 4000 && host.state.world.status === "running"; i++)
          host.state.world.step();
      });
      await page
        .locator("#feedback-panel." + result)
        .waitFor({ timeout: 10000 });
    }
    await ready(p);
    assert.equal(await p.locator("dialog[open]").count(), 0);
    const buttons = await p.locator("button:visible").allTextContents();
    assert.deepEqual(
      buttons.map((s) => s.replace(/\s+/g, " ").trim()),
      ["About", "Start →", "Select level", "Free build", "Replay story"],
    );
    assert.equal(await p.locator("#play-ui").isVisible(), false);
    await p.screenshot({ path: "work/v4-home-desktop.png" });
    await p.locator("#about").click();
    assert.match(await p.locator("#modal-body").innerText(), /learning goals/i);
    assert.match(await p.locator("#modal-body").innerText(), /STEM EDUCATION/i);
    await p.keyboard.press("Escape");
    await p.locator("#select-level").click();
    assert.equal(await p.locator("[data-mission]").count(), levels.length);
    assert.equal(await p.locator("[data-sandbox]").count(), 1);
    await p.locator('[data-mission="3"]').click();
    assert.match(
      await p.locator("#modal-body").innerText(),
      /Complete crossing 3/,
    );
    await p.locator("#close-modal").click();
    await p.locator("#selection-back").click();
    await p.locator("#start").click();
    assert.match(await p.locator("#modal-body").innerText(), /New constraint/i);
    await p.locator("#begin-building").click();
    assert.equal(await p.locator("#instruction").isVisible(), false);
    assert.equal(await p.locator("#help").isVisible(), true);
    await p.locator("#test").click();
    assert.match(await p.locator("#instruction").innerText(), /Place a road/);
    // Real gestures create the first bridge. Duplicate and invalid edits do not spend material.
    await drag([440, 430], [1040, 430]);
    let d = (await read()).designs[0];
    assert.equal(d.members.length, 3);
    await drag([440, 430], [640, 430]);
    assert.equal((await read()).designs[0].members.length, 3);
    assert.match(await p.locator("#instruction").innerText(), /already/);
    await p.locator('[data-material="wood"]').click();
    const anchor = await point(440, 430);
    await p.mouse.move(anchor.x, anchor.y);
    await p.mouse.down();
    await p.mouse.move(400, -20, { steps: 6 });
    await p.mouse.up();
    assert.equal((await read()).designs[0].members.length, 3);
    // A road-only design fails; returning restores the original editable geometry.
    const roadOnly = JSON.stringify((await read()).designs[0]);
    await crossing(p, "failure");
    assert.equal((await read()).records[0].length, 1);
    await p.locator("#result-edit").click();
    assert.equal(JSON.stringify((await read()).designs[0]), roadOnly);
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
    assert.equal((await read()).designs[0].members.length, 11);
    await p.locator("#move").click();
    await drag([740, 330], [740, 305]);
    assert.equal(
      (await read()).designs[0].nodes.find((n) => n.x === 740).y,
      305,
    );
    await p.locator("#undo").click();
    assert.equal(
      (await read()).designs[0].nodes.find((n) => n.x === 740).y,
      330,
    );
    await p.locator("#notebook").click();
    await p.locator(".notebook-prediction summary").click();
    await p.locator("#prediction").fill("The triangles will reduce deck drop.");
    await p.locator("#save-prediction").click();
    await crossing();
    assert.equal((await read()).records[0].length, 2);
    assert.match((await read()).records[0][1].prediction, /triangles/);
    await p.locator("#result-compare").click();
    assert.match(await p.locator("#modal-body").innerText(), /Same conditions/);
    assert.equal(await p.locator(".compare-table tbody tr").count(), 4);
    await p
      .locator("#reflection-1")
      .fill("The same load passed after adding connected diagonals.");
    await p.locator('[data-reflect-save="1"]').click();
    assert.equal(await p.locator(".view-controls").isVisible(), false);
    await p.locator("#result-edit").click();
    for (let i = 0; i < 20; i++)
      await p.locator("#test").dispatchEvent("click");
    assert.equal(await p.locator("#test").isDisabled(), true);
    await p.locator("#help").click();
    const t = await p.evaluate(
      () => BridgeRuntime.game.scene.getScene("Workshop").host.state.world.time,
    );
    await p.keyboard.press("Escape");
    assert.equal(await p.locator("#pause").innerText(), "Resume");
    assert.equal(
      await p.evaluate(
        () =>
          BridgeRuntime.game.scene.getScene("Workshop").host.state.world.time,
      ),
      t,
    );
    await p.locator("#pause").click();
    await p.locator("#speed").click();
    await p.locator("#speed").click();
    await p.locator("#feedback-panel.success").waitFor({ timeout: 30000 });
    assert.equal((await read()).records[0].length, 2);
    console.log(
      "PASS: menu, manual construction, failure/retry, evidence, comparison, duplicate tests and modal pause",
    );
    for (let i = 1; i < levels.length; i++) {
      console.log(`CHECK: entering campaign level ${i + 1}/${levels.length}`);
      await p.locator("#next").click();
      if (await p.locator("#begin-building").count())
        await p.locator("#begin-building").click();
      const ends = await p.evaluate(() => {
        const h = BridgeRuntime.game.scene.getScene("Workshop").host;
        return [h.state.level.left, h.state.level.right, h.state.level.deckY];
      });
      await drag([ends[0], ends[2]], [ends[1], ends[2]]);
      await crossing(p, "failure");
      await p.locator("#result-edit").click();
      await example();
      await crossing();
      assert.equal((await read()).completed[i], true);
      console.log(`PASS: campaign level ${i + 1}/${levels.length}`);
    }
    await p.screenshot({ path: "work/v4-cable-success.png" });
    await p.locator("#next").click();
    assert.equal(await p.locator("#final-report-screen").isVisible(), true);
    assert.match(await p.locator("#final-report-title").innerText(), /reconnected/i);
    assert.equal(await p.locator(".report-crossing").count(), levels.length);
    await p.locator("#report-menu").click();
    console.log("CHECK: campaign completion and reload");
    await p.reload();
    await p.waitForFunction(() => document.body.dataset.engineReady === "true");
    assert.equal(await p.locator("#main-menu").isVisible(), true);
    assert.equal(await p.locator("dialog[open]").count(), 0);
    await p.locator("#start").click();
    assert.equal(await p.locator("#instruction").isVisible(), false);
    assert.equal((await read()).designs[3].members.length, 15);
    await p.locator("#help").click();
    await p.locator('[data-guide="cases"]').click();
    assert.match(await p.locator("#modal-body").innerText(), /Queensferry/);
    await p.locator('[data-guide="settings"]').click();
    await p.locator("#sound").click();
    assert.equal(
      await p.locator("#sound").getAttribute("aria-pressed"),
      "true",
    );
    const download = p.waitForEvent("download");
    await p.locator("#export").click();
    const exported = await download;
    await exported.saveAs("work/v4-export.json");
    const exportData = JSON.parse(fs.readFileSync("work/v4-export.json"));
    assert.equal(exportData.data.completed.length, levels.length);
    await p.locator("#fullscreen").click();
    await p.waitForFunction(() => !!document.fullscreenElement);
    await p.locator("#fullscreen").click();
    await p.waitForFunction(() => !document.fullscreenElement);
    await p.keyboard.press("Escape");
    for (const size of [
      { width: 1440, height: 900 },
      { width: 1024, height: 768 },
      { width: 844, height: 390 },
      { width: 390, height: 844 },
      { width: 319, height: 700 },
    ]) {
      await p.setViewportSize(size);
      await p.waitForFunction(
        ({ w, h }) =>
          Math.abs(
            document.querySelector("#scene").getBoundingClientRect().width - w,
          ) < 1 &&
          Math.abs(
            document.querySelector("#scene").getBoundingClientRect().height - h,
          ) < 1,
        { w: size.width, h: size.height },
      );
      const rects = await p
        .locator("#materials button, #test, #gravity, #help, #about, #notebook")
        .evaluateAll((es) =>
          es.map((e) => {
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
      for (const r of rects)
        assert.ok(
          r.x >= 0 &&
            r.y >= 0 &&
            r.right <= size.width + 1 &&
            r.bottom <= size.height + 1,
          JSON.stringify({ size, r }),
        );
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
      if (size.width === 390)
        await p.screenshot({ path: "work/v4-workshop-mobile.png" });
    }
    await p.locator("#home").click();
    await p.screenshot({ path: "work/v4-home-mobile.png" });
    await p.locator("#select-level").click();
    await p.screenshot({ path: "work/v4-select-mobile.png" });
    await p.setViewportSize({ width: 1440, height: 900 });
    await p.screenshot({ path: "work/v4-select-desktop.png" });
    console.log("CHECK: responsive layouts complete");
    await ctx.close();
    // Storage failure remains playable and can be exported; importing is validated and confirmed.
    const blocked = await browser.newContext({
      offline: URL.startsWith("file:"),
    });
    await blocked.addInitScript(() =>
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new Error("blocked");
        },
      }),
    );
    const bp = await blocked.newPage();
    bp.on("pageerror", (e) => errors.push(e.message));
    await ready(bp);
    await bp.locator("#start").click();
    await bp.locator("#story-skip").click();
    await bp.locator("#tutorial-skip").click();
    await bp.locator("#begin-building").click();
    const blockedEnds = await bp.evaluate(() => {
      const h = BridgeRuntime.game.scene.getScene("Workshop").host;
      const r = document.querySelector("#scene").getBoundingClientRect();
      const toScreen = (x, y) => ({
        x: r.left + h.view.x + x * h.view.scale,
        y: r.top + h.view.y + y * h.view.scale,
      });
      return [
        toScreen(h.state.level.left, h.state.level.deckY),
        toScreen(h.state.level.right, h.state.level.deckY),
      ];
    });
    await bp.mouse.move(blockedEnds[0].x, blockedEnds[0].y);
    await bp.mouse.down();
    await bp.mouse.move(blockedEnds[1].x, blockedEnds[1].y, { steps: 8 });
    await bp.mouse.up();
    assert.equal(await bp.locator("#storage-status").isVisible(), true);
    await bp.locator("#gravity").click();
    assert.equal(await bp.locator("#simulation-panel").isVisible(), true);
    console.log("CHECK: blocked-storage flow complete");
    await blocked.close();
    // Old saved progress must survive the additional mission.
    const migrated = await browser.newContext();
    await migrated.addInitScript(
      (data) => {
        localStorage.setItem(
          "bridge-engineer-workshop-v2",
          JSON.stringify(data),
        );
        localStorage.setItem("bridge-engineer-onboarding-v1", "complete");
      },
      {
        level: 1,
        completed: [true, false, false],
        designs: { 0: starter(levels[0]) },
      },
    );
    const mp = await migrated.newPage();
    await ready(mp);
    assert.deepEqual(
      await mp.evaluate(
        () =>
          JSON.parse(localStorage.getItem("bridge-engineer-workshop-v2"))
            .completed,
      ),
      [true, false, false, false, false, false, false, false],
    );
    await mp.locator("#start").click();
    if (await mp.locator("#begin-building").count()) await mp.locator("#begin-building").click();
    await mp.locator("#help").click();
    await mp.locator('[data-guide="settings"]').click();
    await mp
      .locator("#import-file")
      .setInputFiles(path.resolve("work/v4-export.json"));
    await mp.locator("#confirm-import").click();
    assert.equal(
      await mp.locator("#mission-label").innerText(),
      "08 / Riverbend Crossing",
    );
    assert.deepEqual(errors, []);
    await migrated.close();
    console.log(
      JSON.stringify(
        {
          status: "PASS",
          browser: await browser.version(),
          checks: [
            "eight campaign crossings and sandbox",
            "offline local files",
            "responsive home/select/workshop",
            "old-save migration",
            "export/import",
            "blocked storage",
            "keyboard-accessible Help/About",
            "preserved designs and evidence",
            "no uncaught errors",
          ],
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
