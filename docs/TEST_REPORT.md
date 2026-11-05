# Verification record — Riverbend v0.6

Date: 2026-11-06. This record concerns the local v0.6 candidate. The frozen runtime has passed independent source and relocated-package acceptance. Final archive metadata is recorded in the release verification JSON. No public deployment was performed.

## G0: preserved baseline

Before new implementation, the existing modified/untracked working tree was recorded and source files were copied into `work/v06-baseline/source-snapshot.zip`. Git status, a binary diff and file hashes were saved alongside it. No reset, clean or bulk formatting was performed. The frozen v0.5 snapshot was extracted and tested separately from the changing v0.6 source.

The frozen baseline passed 27 numerical/editor/save tests, the eight-crossing browser suite, the Canvas/reduced-motion engine suite and the touch/keyboard/onboarding input suite. The first browser attempts exposed missing development dependencies, not a gameplay failure. The installed npm/npx shim points to a missing application resource; the bundled Playwright library and official Chromium installer were used, then package.json-equivalent `node` commands with `NODE_PATH`.

## New numerical content audit

`node scripts/audit-v06.cjs` produced `LEVEL_AUDIT_v06.json`: 16 inventory-valid passing geometries across eight crossings; eight unsupported-road failures; four role probes (compression-role cables in levels 4/6 and disconnected fixed piers in levels 5/8) fail as expected. The solver and level numerical parameters were not changed. Alternative designs use the actual editor grid.

The audit also checks 56 forward transfers by span-scaling earlier designs while keeping material roles and relative height. Six are legal under target geometry/material limits; one, a deeper level-4 design transferred to level 6, passes. Legal reuse is not prohibited: the test distinguishes transferable principles from a claim that eight differently named levels necessarily teach eight strategies. Invalid inventory is not recorded as structural failure. See `V06_LEVEL_DIVERSITY_zh.md`.

## Independent browser construction

GPT-6.1 independently authored and ran `tests/review-v06.e2e.cjs` with file://, offline mode, Canvas fallback, reduced motion and 1366×768. Every member of all eight alternative designs was placed with real material buttons and mouse drags. Each resulting design was validated and its ID-independent fingerprint exactly matched the audited alternative geometry, materials and connectivity. No reference was loaded and no design was assigned into runtime state. The test exercised pause/resume, completion/delivery persistence, the final report and reopening it after reload.

Simulation time was explicitly advanced through solver steps after starting experiments via UI; this is not a claim of real-time campaign pacing or a learner playtime study. An initial default-WebGL run timed out under concurrent browser load; this alone was not classified as a game defect. Canvas and default-renderer coverage are reported separately.

The root agent also actually operated the interactive tutorial with pointer gestures, observed a completed crossing in normal browser time, returned to editing and entered the first mission. On a fresh source it placed road-only geometry, observed the failure diagnosis and verified first-entry task/objective presentation. This narrower check is not described as an independent eight-level playthrough.

Evidence is in `work/review-v06/` and the independent acceptance report. Static images are reviewed for clipping and overlap; they are not a substitute for input checks.

## Defect and repair loop

Independent review found success-result controls overlapped by the view toolbar. The implementation hides that toolbar while results are visible. Review also found the partial field report claiming the full route was open; title, subtitle, locked cards and consequences were made conditional on actual completion. A later 1024×600 check found a long result panel extending below the usable region and was returned for repair. Each closure must be supported by the independent report, not by this description of the change request.

Notebook-specific checks include matched comparisons after failure, retained historical completion, saved reflection, restoring a history design and undo, and malformed JSON import without overwriting current progress. Their final scope and results are recorded by the independent reviewer.

## Current release verification

The current source passed 28 numerical/editor/save tests. GPT-6.1 independently ran the full browser suite to exit 0, including all eight campaign crossings, responsive states, blocked storage, export/import and migration. The engine suite and touch/keyboard/onboarding input suite independently exited 0. The implementation agent's separate browser run timed out on a final migrated-page navigation after the earlier checks; it is retained as an incomplete run, not relabeled Pass. The independent complete run supplies the full-suite result.

The fixed success-card overlay and low-height sticky-action defects were independently retested at 1366×768, 1280×720, 1024×768, 1024×600, 390×844 and 319×768 where applicable. The low-height/narrow result card can scroll to a fully clickable primary action; its action surface is opaque and avoids the dock. This is a targeted screen matrix, not every-state-at-every-resolution certification.

v3/v4/v5 save samples retained geometry and completion when migrated to v6. Partial report wording, locked routes, teacher exploration, first-visit persistence and malformed import were checked. Independent four-load sandbox experiments do not award campaign completion or compare mismatched loads. Eight community waiting/restored textures were checked; a floating-building/double-building issue was fixed, then the right-bank placement was visually rechecked at levels 1/4/8. Missing-vendor loading was intentionally induced, and the explanation plus real Retry restored the menu after the resource became available.

The independently checked runtime candidate was `bridge-engineer-v0.6-candidate.zip`, 3,784,004 bytes / 35 entries, SHA-256 `9fb7a4f64369d712208fc4942c5cd26c451ecff5d923535928d9943ab36a63ac`. A fresh relocated extraction passed package checks with zero required remote requests and zero normal-flow page errors. On that extracted top-level file:// entry, GPT-6.1 again built **all eight audited alternative geometries through actual buttons and mouse drags**, validated exact ID-independent geometry/material/connectivity fingerprints, completed deliveries and reopened the final report after reload. Notebook, damage/retry, restore/undo, four sandbox loads and narrow/low-height result actions were also rerun against the extracted runtime.

Evidence: `work/review-v06/` (standard and specialist logs/screenshots), its `offline-eight/` evidence and `offline-eight.log`; implementation evidence: `work/v06-final-logs/`. These are development-workspace evidence paths, not required runtime resources. See `V06_INDEPENDENT_ACCEPTANCE_61_zh.md` for independent scope and exclusions. After teacher/report documents are finalized, the release archive is rebuilt; its runtime entries must match this accepted candidate byte-for-byte, and the final archive is relocated and smoke-tested again. Final archive size/hash belong to its external release verification JSON to avoid a self-referential archive hash.


## Boundaries

The structural model is an idealized axial-member system with a prescribed moving load. It omits beam bending, realistic buckling shapes, joint failure, fatigue, wind and full wheel contact. Game material presets and the 12 cm rule are not engineering standards or calibration.

Chromium/Canvas and emulated touch coverage do not certify Safari, Firefox, screen-reader usability or every physical device. No target-age learner study, classroom validation, measured 45–75-minute pacing, fun score, learning gain, rubric grade guarantee or originality certification is claimed. Completion, a saved reflection and Material saver are not mastery scores.

Original story art and community markers are project-authored code/vector visuals. No new image-service output or remote media dependency is required. The runtime includes Phaser's MIT notice and contains no API credentials.
