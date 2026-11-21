# Architecture (3D presentation and engineering evidence v1.3.1; simulation/save v1)

Static offline page. `site/` is runtime source; root `index.html css js assets vendor favicon.svg` is a local mirror maintained by `python scripts/sync-pages.py`. No build or game runtime npm dependency.

## Layers

- `core/physics.js levels.js model.js progress.js scoring.js`: original deterministic 2D simulation, levels, design history, version-1 journey saves and scoring. Protected and unchanged.
- `learning/engineering.js`: pure experiment snapshots, condition matching, graph connectivity, import validation and an independent notebook sidecar store.
- `render/scene3d.js`: Three.js lifecycle, camera, RAF, HTML camera controls and render adapter `BridgeScene`/`Scene3D`. `terrain3d`, `bridge3d`, `vehicle3d`, `stress3d`, `controls3d` own scene components and picking.
- `ui/bus.js content.js`: original protected events/content. `ui/engineering-ui.js`: optional investigation prompts, evidence comparison, member diagnostics and CER UI.
- `app.js`: state transitions, original fixed 1/60 s simulation steps, road policy, practice isolation, pause/modal policy and DOM orchestration.

## Teaching presentation

`content.js` exposes `taskBlock1/2/3`, dialogue/real-world/Bloom maps and teacher-facing method descriptions. App adapters listen to original test events and emit presentation-only `test:start/test:fail/level:pass`; no original event definitions change. Stage flags persist within a level visit, including menu return, and reset at a different level or fresh session.

`learning/inquiry.js` owns optional per-level test notes under `riverbend_notebook` plus a journey context stamp. Entry0 is the next prediction draft; started tests get positive indices. Predictions freeze on start; later CER is independently editable. UI debounces 500ms and flushes on navigation/unload. Combined notebook exports optionally carry inquiry records, while old journey and notebook files remain readable.

## Geometry and editor

One design contains one 2D elevation. Grid endpoints convert by G=0.5; simulation nodes/vehicle are already metres. Non-road render meshes are mirrored to z=0 and z=-0.92, with road centred at z=-0.46. Raycasting projects onto whichever elevation faces the camera. These are two views of one model, not independent 3D simulation members.

Road segments are taken from the current resolved reference deck. They remain budgeted and simulated but cannot be edited. Clear/recovery always preserve them. Using arbitrary finer road segmentation would change the pinned topology, so it is intentionally avoided.

## State and evidence

First Tabletop entry offers optional real-controls practice before the scored crossing. It has a disposable design and never writes journey geometry, tests or notebook records. Menu replay returns to the current story node.

Formal tests freeze a design snapshot and capture a prediction, elapsed time, drop, current/peak utilization and observed events. Inspect keeps the test result separately; returning to edit clears rendering inspection state. Live force colors use current ratio, while Inspect uses peak ratio.

The independent notebook key `riverbend.v1.engineering-notebook` carries its own version and a canonical progress stamp. Existing journey exports remain version 1. Notebook exports combine journey plus experiments, validate on import, and label imported measurements as not independently verified.

## Lifecycle and verification

A single RAF drives rendering and calls the app fixed-step hook. Menu sleeps it; pause, modal or context loss freezes simulation. Rebuild disposes shared geometry/materials once. Context recovery resumes drawing with a fresh clock.

`tests/*.test.cjs` are protected original checks; `scripts/verify-learning.cjs` covers pure evidence semantics; `scripts/verify-3d.cjs` exercises offline browser input, eight scene configurations and resource recovery. See `3D-UPGRADE_zh.md` for evidence and limits.
