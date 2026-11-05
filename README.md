# Bridge Engineer — Riverbend

An English-language, offline STEM bridge-building game. **v0.6** connects an eight-crossing campaign, an interactive training yard, a separate Free Build laboratory and a personal engineering field report. Build a bridge, test a delivery, follow the evidence and revise your own design.

**Play online:** https://lunarsh4de.github.io/bridge-engineer/

[Download v0.6 offline](outputs/riverbend-v0.6-offline-2026-11-06.zip) · [Editable project](outputs/riverbend-v0.6-editable-project-2026-11-06.zip)

## Play

Open `site/index.html`. In the portable game ZIP, open its top-level `index.html`. Keep `js/`, `vendor/` and `assets/` alongside it. No build, server, account, API key, CDN or connection is needed. Optional reading links work only when opened online.

The main menu provides **Start**, **Select level**, **Free build**, **Replay story** and **About**. Start introduces Riverbend through four illustrated panels and an actual-control tutorial; both can be skipped or replayed. Returning players resume their saved campaign. Each new crossing has a short briefing, a persistent objective and two optional hints. Teacher **Explore all levels** enables inspection without awarding completion.

Select **Road** and drag between endpoints, or tap/click both ends. Add **Timber**, **Steel** or **Cable** supports. Nearby endpoints join; intersecting lines do not join unless they share a joint. Use **Move**, **Erase**, **Undo**, **Redo** and the reversible **Restart** to experiment. **Self-weight** observes gravity; **Test crossing** runs a moving delivery. **Edit design** restores the original construction after a test.

Failure presents measured evidence and makes editing the main action. Success connects the community route and makes advancing the main action. The final **Field report** reviews the eight communities with the player's retained successful bridge designs and measurements. It can be reopened from the menu; partial reports distinguish finished deliveries from those still waiting.

## Eight decisions

| Crossing | Span / delivery | Main engineering decision |
| --- | --- | --- |
| Willow Creek | 6 m / 600 kg | Stabilize a timber frame |
| Fern Valley | 8 m / 1,000 kg | Trace a continuous load path |
| The high pass | 10 m / 1,800 kg | Assign mixed materials to force roles |
| Millwater Reach | 8 m / 1,400 kg | Give cable a tensile role |
| Alder Ford | 12 m / 2,400 kg | Connect a genuine fixed centre pier |
| Glen Echo | 10 m / 2,200 kg | Complete a cable-and-steel system without a pier |
| Foundry Bend | 8 m / 4,800 kg | Identify the limiting member under heavier load |
| Riverbend Crossing | 12 m / 5,000 kg | Combine supports, materials and prior evidence |

A campaign crossing requires a usable road, completed delivery, zero broken members and maximum road drop below 12 cm. That is a game rule, not a real bridge standard. Every crossing has two numerically verified, inventory-valid designs and an unsupported-road failure example. Multiple geometries do not prove optimality or wholly different strategies.

## Learning and evidence

**About** identifies the STEM branches and measurable learning goals. **Help** contains controls, structure principles, sourced real-bridge cases and settings. Hints first invite observation, then explain a principle. The game does not require written answers to advance.

**Notebook** retains up to eight distinct experiments per crossing, including immutable designs, conditions, drop, failure, material cost and optional prediction/reflection. Its comparison uses different designs under matching test conditions. Identical reruns do not farm rewards. **Material saver** compares two successful designs under the same conditions; it does not reward speed or avoiding failure.

Free Build keeps its own design and evidence and offers 600/1,800/3,200/4,800 kg delivery loads. It does not change campaign completion. Changing a load cannot create a matched comparison with an earlier load. Stored v0.3/v0.4/v0.5 progress migrates; browser storage failures leave the current session playable. Help → Settings exports/imports local JSON for moving progress to another computer.

Suggested ages 11–14 with adult facilitation and 45–75 minutes are design estimates, not observed classroom results. Completion and reflections are not automatically scored as mastery. See [teaching design](docs/RIVERBEND_v06_LEARNING_DESIGN_zh.md), [Chinese play guide](docs/RUNNING_zh.md), [numerical audit explanation](docs/V06_LEVEL_DIVERSITY_zh.md) and [verification record](docs/TEST_REPORT.md).

## Architecture

Phaser **3.90.0**, bundled locally under MIT, handles rendering, scenes, cameras, sound and input. The structural simulation and editable design are independent modules.

| Module | Responsibility |
| --- | --- |
| `index.html`, `styles.css` | Menu, route selection, workshop, dialogs and field report |
| `levels.js`, `content.js` | Eight conditions, supports, reference designs, story and layered teaching content |
| `model.js` | Editable geometry, validation, welding, inventory and undo/redo |
| `physics.js` | Fixed-step axial-member simulation |
| `progress.js` | Save migration, immutable evidence, condition matching and material cost |
| `app.js` | Commands, screen transitions, experiments, reports and evidence views |
| `engine.js`, `art.js` | Phaser objects, input, camera, effects and original procedural visuals |

The model uses metres, kilograms and seconds, gravity, self-weight, axial compliance, damping, simplified capacities and tension-only cables. Fixed centre piers are real solver supports. The delivery is a prescribed moving load, not full wheel-contact dynamics. Ideal pin joints omit beam bending, realistic buckling shapes, joint failure, fatigue, wind and real material variability. This is educational software, not a tool for designing safe real bridges.

## Development checks

Node.js 20+ and Playwright are development tools only; the delivered game requires neither. After installing development dependencies and Chromium:

```sh
npm test
npm run test:browser
npm run test:engine
npm run test:input
node scripts/audit-v06.cjs
node tests/review-v06.e2e.cjs
python3 scripts/package-release.py --output work/candidates/riverbend-v0.6-offline.zip
PACKAGE_ZIP=work/candidates/riverbend-v0.6-offline.zip npm run test:package
```

The test record names the commands actually executed and environment workarounds. Browser checks default to local `file://`; `BASE_URL` and `BROWSER_EXECUTABLE` can select a development server or installed Chromium. Numerical tests establish internal behavior only. Automated and agent-operated paths do not replace real learner observation.

## Sources and original work

[Architecture research](docs/research/bridge-workshop-architecture.md), [game comparison](docs/research/bridge-games-comparison.md) and [design decisions](docs/research/riverbend-v04-decisions.md) record precedents and project choices. Bridge-building, limited materials and iteration have established precedents. No global novelty or academic originality certification is claimed. Other games' levels, source and art were not repackaged.

Original story PNGs are local rasterizations of editable project SVG art; they are not successful API-generated images. See [art provenance](site/assets/ART-PROVENANCE.md). The earlier image service returned HTTP 401; no credential or text-model configuration is included. Phaser's MIT notice is in `site/vendor/PHASER-LICENSE.md`. Real-bridge summaries include optional source links; no third-party bridge photos or plans are embedded.

The v0.6 release is published through GitHub Pages at the link above. `site/` is the editable source used by tests and packaging; the repository root contains its byte-identical Pages copy. After editing, run `python3 scripts/sync-pages.py` before publishing, or `python3 scripts/sync-pages.py --check` to verify that copy. The historical test records describe the local acceptance before this publication.
