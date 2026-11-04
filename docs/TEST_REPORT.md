# Verification record — gravity workshop v0.2

Date: 2026-11-04. Tested on this macOS host with Node.js v24.14.0 and Playwright Chromium 153.0.8010.12. The first demo's screenshots and tests are superseded by this record for the updated workshop.

## Physics and editor

Command: `npm test` (equivalent to `node --test tests/physics.test.cjs tests/model.test.cjs`).

**16 tests passed.**

- All three starter designs fit their material limits and carry the delivery under gravity.
- Unanchored members fall; bank anchors remain fixed. Zero gravity leaves an initially motionless member still.
- Members contribute mass; equal-length steel members are heavier than timber in the game presets.
- A road without effective supports sags beyond the 12 cm task limit; the triangulated comparison passes.
- Compressed cables go slack and stretched cables develop tension.
- Excessive delivery loads cause member failure, with the first failed member and force recorded.
- The final all-timber comparison fails while the mixed-material design passes.
- Missing road connections cannot pass.
- Identical designs and fixed time steps produce identical numerical results.
- Free placement, endpoint welding, material use, maximum lengths, fixed anchors, invalid design fallback and atomic rejected edits are checked.
- Move, remove, undo, redo and undoable clearing preserve complete editable structures.

These tests verify behavior and internal consistency. They do not calibrate the model against a structural-engineering solver or real-world experiments.

## Browser interaction

Command: `npm run test:browser` with an existing local server.

**Passed** in Chromium:

- Direct entry into a viewport-filling canvas; no landing-page gate or automatic dialog.
- English About content including STEM topic, story and engineering.
- Manually drawn full-span road splits into connected deck sections.
- Timber supports placed at arbitrary grid positions; endpoints weld.
- Move, undo/redo and editable-design persistence after reload.
- Full three-mission progression, including a manually constructed first bridge.
- Palette drag/drop creates a loose member away from predefined points.
- Gravity experiment, pause, modal handling and restoration of the original design on returning to edit.
- Keyboard construction and explicit native full-screen entry/exit.
- No document overflow and important active controls remain within the viewport at 1440×900, 1024×768, 844×390 and 390×844.
- Complete first-level test from an offline `file://` page.
- Graceful fallback when localStorage access is blocked.
- No uncaught JavaScript page errors during the suite.

## Visual inspection

Reviewed desktop construction, crossing results, mobile construction and expanded mobile mission brief. Updated the scene to distinguish warm outlined bridge members from cool distant mountains and a blue river. Reviewed material states, grouping, foreground shadows, mobile toolbar layout and contextual result panels. Result feedback replaces the redundant live HUD to avoid overlapping panels.

## Limits

Only Chromium was exercised in these browser tests; Safari, Firefox and physical touch devices have not been tested. The tested viewports are emulated sizes. No formal accessibility audit, student learning evaluation, real structural validation or originality certification has been conducted. Vehicle travel uses a supported moving-load approximation, not full wheel-contact dynamics.
