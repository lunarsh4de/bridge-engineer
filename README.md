# Bridge Engineer — Riverbend

An English-language STEM bridge-building game built with **Phaser 3.90.0**, HTML, CSS and JavaScript. Version 0.4 adds a full-screen main menu, four crossings and an engineering notebook. Source and offline release for the v0.4 update.

**Play:** https://lunarsh4de.github.io/bridge-engineer/

[Download the offline game](outputs/bridge-engineer-v0.4-offline-2026-11-05.zip).

## Play offline

Open `index.html`. In the portable game ZIP, open the top-level `index.html`. Keep its `js/` and `vendor/` folders alongside it. No build, server, account, network or API key is required.

The opening screen contains **Start**, **Select level** and a top-right **About** course-project overview. Start opens the last saved crossing in edit mode. Refresh returns to this menu without opening instructions or results. Select level follows campaign progression; **Explore all levels** allows independent practice and teacher inspection.

In a crossing, select **Road** and drag between endpoints, then use **Timber**, **Steel** or **Cable** to add supports. Two taps/clicks can also place endpoints. Nearby endpoints join; mid-member intersections do not. **Move**, **Erase**, **Undo** and **Redo** keep edits reversible. An unfinished drag can be cancelled, including by releasing outside the canvas. **Self-weight** observes gravity without a delivery; **Test crossing** applies the prescribed moving delivery load.

**Task** provides the scenario and limits. **Help** contains controls, structure notes, reversible starter designs, two sourced real-bridge cases, sound/fullscreen controls and progress export/import. No help panel opens automatically. **About** explains the STEM topic, learning goals, methods, evidence and model boundaries. The original course rubric, target age and assessment devices remain unconfirmed.

## Four crossings

| Crossing        | Span / delivery | Materials and question                                              |
| --------------- | --------------- | ------------------------------------------------------------------- |
| Willow Creek    | 6 m / 600 kg    | Limited timber: what makes a connected frame stable?                |
| Fern Valley     | 8 m / 1,000 kg  | More timber: where does the load reach the banks?                   |
| The high pass   | 10 m / 1,800 kg | Steel and cables: which material suits each role?                   |
| Millwater Reach | 8 m / 1,400 kg  | Transfer: give cables a pulling job within a tighter timber supply. |

Crossing success requires a usable road, a completed delivery, no broken members and maximum deck drop below 12 cm. This is a game criterion, not a real bridge standard. Multiple designs can pass; a cable is not mandatory just for the sake of using every material.

## Evidence and progress

The **Notebook** keeps up to eight distinct recent tests per crossing, with immutable design snapshots, conditions, maximum drop, breaks, material cost, optional prediction and reflection. Only different designs under matching conditions are compared. Identical reruns reuse the evidence record. A lower-cost successful design can receive **Material saver**, using explicit game credits per metre (Road 1, Timber 1, Steel 3, Cable 1.2); no speed or retry penalties apply. A saved reflection is not automatically graded.

Tests run on a copy. **Edit design** restores the original construction after a failure. Three-level v0.3 saves migrate to four levels without discarding valid designs or completions. Browser storage failures leave the current session playable; the next attempted save shows a status. Help → Settings offers local JSON export/import for migration and backup. Imported progress replaces current progress only after confirmation.

## Architecture

| File                                 | Responsibility                                                                          |
| ------------------------------------ | --------------------------------------------------------------------------------------- |
| `index.html`, `styles.css` | Main menu, level selection, responsive workshop and accessible DOM controls             |
| `js/levels.js`                  | Crossing conditions and optional independently authored examples                        |
| `js/model.js`                   | Editable geometry, validation, inventory, endpoint welding, undo/redo                   |
| `js/physics.js`                 | Fixed-step compliant axial-member simulation                                            |
| `js/progress.js`                | Save migration, immutable test evidence, condition matching and material cost           |
| `js/content.js`                 | On-demand course overview, instructions, structure notes and sourced cases              |
| `js/app.js`                     | Screen transitions, editor commands, simulation advancement and UI orchestration        |
| `js/engine.js`                  | Phaser scenes, native objects, cached viewport layout, input, camera, effects and sound |
| `js/art.js`                     | Original procedural textures generated once at boot                                     |
| `vendor/`                       | Offline Phaser distribution and its MIT license                                         |

The app explicitly tracks home/selection/workshop separately from editing/testing. Inactive screens are hidden and inert. Help pauses a running experiment; closing it leaves it paused for an explicit Resume. Visibility changes cancel unfinished gestures. Phaser supplies rendering and input; the independent structural solver is not Phaser Arcade or Matter physics.

## Physics scope

The educational model includes gravity, member self-weight, axial compliance, damping, simplified tensile/compressive capacity, a length-dependent compression limit and tension-only cables. Unsupported pieces fall. A prescribed moving load follows a usable road; it falls when the road becomes unusable. This is **not** complete rigid-body wheel-contact dynamics.

Units are metres, kilograms and seconds. Material properties are game presets, not product specifications. Ideal pin joints omit beam bending, realistic buckling shapes, joint failure, member self-collision, fatigue, wind and real material variability. Numerical tests establish internal behavior, not structural-engineering calibration or student learning efficacy.

## Development verification

Node.js 20+:

```sh
node --test tests/physics.test.cjs tests/model.test.cjs tests/progress.test.cjs
```

Optional browser checks use Playwright:

```sh
npm install
npx playwright install chromium
npm run test:browser
npm run test:engine
npm run test:input
```

The browser suite defaults to local `file://` operation. `BASE_URL` can point to a local development server; `BROWSER_EXECUTABLE` can specify an installed Chromium. The engine suite explicitly verifies offline Canvas fallback and reduced motion. Screenshots and temporary exports go to ignored `work/`. See [verification record](docs/TEST_REPORT.md) and [Chinese teaching/run guide](docs/RUNNING_zh.md).

## Sources and originality

[Architecture research](docs/research/bridge-workshop-architecture.md) and [v0.4 implementation decisions](docs/research/riverbend-v04-decisions.md) distinguish external ideas, project choices and verified behavior. The bridge-building loop has existing precedents; no claim of worldwide novelty or academic originality certification is made. Runtime code, levels and art from other games were not imported. Phaser is bundled under MIT with its license intact. Real-world facts are summarized with links; no third-party bridge photographs or plans are embedded.
