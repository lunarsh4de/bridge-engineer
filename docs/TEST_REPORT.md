# Verification record — Riverbend v0.4

Date: 2026-11-05. Local macOS host, Node.js v24.14.0, Playwright Chromium 153.0.8010.12. This report covers local v0.4 development, not the existing public website. No deployment was performed.

## Numerical/editor/evidence checks

`node --test tests/physics.test.cjs tests/model.test.cjs tests/progress.test.cjs`: **21 passed**.

The original editor and physics checks remain: placement/welding, atomic rejected edits, fixed supports, move/remove/undo/redo, validation fallback, self-weight and gravity, cable slack/tension, break evidence, road connectivity, deterministic fixed steps, and material differences. All **four** reference designs fit inventory and pass.

New checks verify migration from a three-level save, independent immutable evidence snapshots, geometry identity independent of generated node IDs, exclusion of mismatched conditions, cost rewards only for comparable successful designs, bounded records and recomputed import cost. The new lower cable chord passes in tension; reflecting the same structure above the deck fails. A separate numerical probe also confirmed a mixed timber/steel diagonal variant passes the fourth level.

These checks establish modeled behavior and internal consistency. They do not validate the solver against real bridges or establish student learning outcomes.

## Full browser regression

`tests/browser.e2e.cjs`: **passed** using the local file entry point. Its fresh primary context is offline.

- Home shows only the game title, Start, Select level and About; workshop controls are hidden/inert and no automatic dialog opens.
- Selection has four crossings, locked previews and explicit return.
- Start opens a clean editable scene with Help accessible and no initial instruction bar.
- Actual mouse gestures construct the first bridge; duplicate members reject atomically, and outside release cancels.
- A road-only design fails; Edit design preserves the original geometry and material usage.
- Manually adding supports, moving a joint and undoing leads to a successful crossing.
- Prediction and reflection are stored; different designs under the same conditions produce a comparison table.
- Repeated Test commands create one experiment; identical reruns do not add evidence records.
- Opening Help pauses the experiment; closing leaves an explicit Resume.
- All four crossings complete, including the new cable challenge. The final report is available only after the result action.
- Reload returns to the menu; Start restores the last editable bridge without reopening help/results.
- Real-bridge content, persistent mute, fullscreen entry/exit and JSON export/import work.
- Active controls fit 1440×900, 1024×768, 844×390 and 390×844 viewports.
- Blocked localStorage remains playable, and save failure is visible after an edit.
- Old three-level progress migrates without deleting valid designs.
- No uncaught page errors were recorded.

## Canvas fallback and input

`tests/engine.e2e.cjs`: **passed** with WebGL disabled, reduced motion and an offline file entry. It verifies Phaser Canvas, no decorative Workshop tweens, force legend, a successful crossing and return to editing.

`tests/input.e2e.cjs`: **passed** with Chromium touch/mobile emulation at 390×844. It places a full-span road and a timber member through two taps, cancels an unfinished member, then constructs a member with keyboard arrows/Enter. This is input emulation, not a physical phone test.

Two bugs exposed during development were fixed: unconditional outside-up cancellation rebuilt the material dock and swallowed button clicks; native lostpointercapture arrived before Phaser touchend and cancelled normal taps. The updated input tests exercise the corrected paths.

## Visual checks and portable package

Inspected actual desktop and mobile home/workshop screenshots, desktop/mobile level selection and the fourth-crossing success state. Home uses the existing original landscape with an independent decorative bridge, which never enters the player's saved design. Mobile Help remains visible. The mobile result panel was moved below the bridge area and given bounded scrolling; measurements/force legend were positioned independently from controls.

The runtime uses relative local script/style paths. No required network fetch, CDN, login or key is introduced. External URLs are optional reference links in user-opened educational content. The local Phaser MIT notice is retained. Final package extraction and relocated offline smoke verification are recorded with the release artifact.

## Limits

Chromium only; no Safari/Firefox or physical touch device certification. No formal screen-reader audit, course-rubric certification, user learning study, engineering calibration, plagiarism assessment or subjective audio-quality evaluation. The current scenario and material cost are game presets. The delivery remains a prescribed moving load rather than full wheel-contact dynamics.

The browser tests require a development Playwright installation (or an available runtime package). The game itself does not. The host's default npm launcher pointed to an obsolete app path, so development checks used the equivalent direct Node commands and an available Playwright runtime without changing game dependencies.

## GitHub distribution layout

The GitHub repository serves runtime files from its root. The verified site files are copied unchanged from the local site directory; test entry points and README paths are adapted to the root layout. GitHub synchronization is a subsequent user-authorized action; the numerical and browser checks above describe the preceding v0.4 validation.
