const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const posix = path.posix;
const { pathToFileURL } = require("node:url");

const zipPath = path.resolve(
  process.env.PACKAGE_ZIP ||
    "outputs/bridge-engineer-v0.6-candidate.zip",
);
const extractRoot = path.resolve(
  process.env.PACKAGE_EXTRACT_DIR ||
    "work/Package Smoke/Relocated Riverbend v0.6",
);

function extract() {
  assert.ok(fs.statSync(zipPath).size > 0, "candidate ZIP is non-empty");
  fs.rmSync(extractRoot, { recursive: true, force: true });
  fs.mkdirSync(extractRoot, { recursive: true });
  const result = childProcess.spawnSync(
    "python3",
    [
      "-c",
      "import pathlib,sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); root=pathlib.Path(sys.argv[2]).resolve(); [(_ for _ in ()).throw(SystemExit('unsafe ZIP path')) for n in z.namelist() if pathlib.Path(root,n).resolve()!=root and root not in pathlib.Path(root,n).resolve().parents]; z.extractall(root)",
      zipPath,
      extractRoot,
    ],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

(async () => {
  extract();
  const expected = [
    "index.html",
    "styles.css",
    "README.txt",
    "vendor/phaser-3.90.0.min.js",
    "vendor/PHASER-LICENSE.md",
    "assets/ART-PROVENANCE.md",
    "teacher-docs/README.md",
    "teacher-docs/TEST_REPORT.md",
    "teacher-docs/LEVEL_AUDIT_v06.json",
    "teacher-docs/V06_LEVEL_DIVERSITY_zh.md",
    "teacher-docs/V06_INDEPENDENT_ACCEPTANCE_61_zh.md",
    "teacher-docs/V06_DELIVERY_MATRIX_zh.md",
    "teacher-docs/research/bridge-games-comparison.md",
    "teacher-docs/research/bridge-workshop-architecture.md",
    "teacher-docs/research/riverbend-v04-decisions.md",
    "teacher-docs/research/riverbend-v05-design-review.md",
    ...Array.from({ length: 4 }, (_, i) => `assets/story-panel-${i + 1}.png`),
  ];
  for (const relative of expected)
    assert.ok(fs.statSync(path.join(extractRoot, relative)).size > 0, relative);
  const packageFiles = childProcess
    .execFileSync("python3", [
      "-c",
      "import sys,zipfile; print('\\n'.join(zipfile.ZipFile(sys.argv[1]).namelist()))",
      zipPath,
    ], { encoding: "utf8" })
    .trim()
    .split("\n");
  assert.equal(packageFiles[0], "README.txt");
  assert.ok(!packageFiles.some((name) => /(^|\/)(node_modules|work|\.git)(\/|$)/.test(name)));
  assert.ok(!packageFiles.some((name) => /(auth\.json|config\.toml|\.env$)/i.test(name)));
  const packaged = new Set(packageFiles);
  for (const name of packageFiles.filter((entry) => entry.endsWith(".md"))) {
    const markdown = fs.readFileSync(path.join(extractRoot, name), "utf8");
    for (const match of markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const target = match[1].split("#")[0];
      if (!target || /^(https?:|mailto:)/i.test(target)) continue;
      const resolved = posix.normalize(posix.join(posix.dirname(name), target));
      assert.ok(packaged.has(resolved), `${name} has dangling link ${target}`);
    }
  }
  const packagedReadme = fs.readFileSync(
      path.join(extractRoot, "teacher-docs/README.md"),
      "utf8",
    ),
    learningDesign = fs.readFileSync(
      path.join(extractRoot, "teacher-docs/RIVERBEND_v06_LEARNING_DESIGN_zh.md"),
      "utf8",
    );
  assert.doesNotMatch(packagedReadme, /\]\((?:docs|site)\//);
  assert.match(packagedReadme, /\]\(research\/riverbend-v04-decisions\.md\)/);
  assert.match(packagedReadme, /\]\(\.\.\/assets\/ART-PROVENANCE\.md\)/);
  assert.match(learningDesign, /`research\/riverbend-v04-decisions\.md`/);

  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_EXECUTABLE
      ? { executablePath: process.env.BROWSER_EXECUTABLE }
      : {}),
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      offline: true,
    });
    const page = await context.newPage(),
      errors = [],
      remoteRequests = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      if (/^https?:/i.test(request.url())) remoteRequests.push(request.url());
    });
    await page.goto(pathToFileURL(path.join(extractRoot, "index.html")).href);
    await page.waitForFunction(() => document.body.dataset.engineReady === "true");
    assert.equal(await page.locator("script[src]").count(), 9);
    assert.equal(
      await page.evaluate(() =>
        ["BridgePhysics", "BridgeLevels", "BridgeModel", "BridgeProgress", "BridgeContent", "BridgeEngine"].every(
          (name) => typeof window[name] !== "undefined",
        ),
      ),
      true,
    );
    await page.locator("#select-level").click();
    assert.equal(await page.locator("[data-mission]").count(), 8);
    assert.equal(await page.locator("[data-sandbox]").count(), 1);
    await page.locator("#selection-back").click();
    await page.locator("#start").click();
    assert.equal(await page.locator("#story").isVisible(), true);
    assert.equal(await page.locator("#story figure").count(), 4);
    assert.equal(
      await page.locator("#story img").evaluateAll((images) =>
        images.every(
          (image) => image.complete && image.naturalWidth === 1536 && image.naturalHeight === 1024,
        ),
      ),
      true,
    );
    assert.equal(await page.locator("#story figcaption span").count(), 4);
    await page.locator("#story-continue").click();
    assert.equal(await page.locator("#tutorial-coach").isVisible(), true);
    assert.match(await page.locator("#tutorial-title").innerText(), /Choose Road/);
    const resourceUrls = await page.evaluate(() =>
      performance.getEntriesByType("resource").map((entry) => entry.name),
    );
    assert.ok(resourceUrls.every((url) => /^(file|data|blob):/i.test(url)));
    assert.deepEqual(remoteRequests, []);
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        result: "PASS",
        zip: zipPath,
        relocated: extractRoot,
        entries: packageFiles.length,
        campaignCards: 8,
        sandboxCards: 1,
        storyImages: 4,
        offlineRemoteRequests: remoteRequests.length,
        pageErrors: errors.length,
      }),
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
