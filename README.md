# Riverbend: Bridge Engineer — Two chapters · 中文 / English · 1.4.1

Offline STEM bridge-building game for ages 11–14. Open `index.html` (or
`site/index.html`) in a browser with WebGL 2. No server, install, build step,
network connection or API key is needed to play. Chapter I has six level definitions and five crossings on each story path; finale supports create eight scene configurations. Chapter II adds five harder commissions: two trucks, tall-ship clearance, island-separated spans, shipping convoy, and a combined riverport finale.

The workshop uses local Three.js r165 for a real 3D valley, bridge members,
shadows and delivery truck. The structural simulation remains the original 2D
fixed-step XPBD model. Chapter I retains its original structural cases and version-1 progress. Chapter II adds simultaneous prescribed axle loads and a 2D swept navigation envelope. Neither is a real bridge-safety model.

- 中文 / English: switch from the menu or workshop. The choice saves locally. Menus, story, tasks, hints, quizzes, evidence and reports are translated; your own notes retain their original writing.
- Two independent chapters: select **I · Valley journey** or **II · River challenges** on the menu. Changing chapters preserves each journey and notebook.
- Advanced navigation: choose +0 / +1 / +2 m deck height. Applying a different height rebuilds the road and clears supports, with an explicit label; old tests stay in the Notebook. Both trucks and every boat must finish. A blocked lane identifies the obstructing member.
- Real bridge cases: all eleven level definitions include a local photo with attribution, an engineering connection and a clear model difference. See `docs/BRIDGE-CASES.md` and `assets/bridges/SOURCES.json` for licenses and sources.
- First-chapter balance update: tighter per-crossing drop limits and budgets, with investigation prompts in both languages. See `docs/RELEASE-NOTES-v1.4.1_zh.md`.
- Expansion specification, teaching flow and limitations: `docs/EXPANSION-v1.4_zh.md`.
- Mobile: pictorial controls and mission cards, compact touch tools, an instruction strip outside the scene, and expandable explanations. First workshop entry gently turns once to reveal the 3D view; touch stops it immediately and reduced-motion settings disable it. See `docs/MOBILE-UPDATE_zh.md`.
- First crossing: a real controls practice teaches orbit/front view, two-end construction, undo/redo, pause and force reading before the first scored crossing.
- Build: the road is prelaid, budgeted and locked. Drag between grid dots, tap two points, or use Arrow keys + Enter to build support members.
- Camera: right-drag to orbit; wheel to zoom. Use **Orbit view** for left-drag or
  one-finger rotation; two fingers rotate/zoom. **Front view** restores the elevation;
  **Reset view** restores the initial perspective. Tests lock to a side-following view.
- Forces: member bodies show green → yellow → red load utilization; blue/red end
  bands show tension/compression. Slack cable is pale and dashed; fractures have gaps.
- Editable runtime source: `site/`. Root files mirror it for GitHub Pages.
  After edits: `python scripts/sync-pages.py`; verify with `--check`. The current workshop prelays and locks the road; players build the support trusses.
  These commands only copy local files and never publish.
- Tests (Node 20+): `node --test tests/*.test.cjs scripts/verify-learning.cjs scripts/verify-teaching.cjs`
- Teaching stages: task and Bloom tag at entry, character explanation after the first failed test, and real-world connection after passing.
- Per-test notes: Predict before testing, then Claim/Evidence/Reasoning; automatic 500ms saving and previous/next history.
- Engineering evidence: the optional Notebook records matched tests, observations, one-variable material changes and claim/evidence/reasoning notes.
- Portable release: `python scripts/package-release.py`
- Optional browser verification: `node scripts/verify-3d.cjs [project-directory]`.
  Set `RIVERBEND_PLAYWRIGHT_MODULE` to an external Playwright installation if needed.
  This is developer tooling, not a game dependency.
- Saves use browser localStorage. Help → Settings exports/imports version-1 JSON.
  Export before moving folders because browsers can separate local-file storage.
- Teaching update and acceptance: `docs/TEACHING-UPDATE_zh.md`.
- Advanced numerical checks: `node --test tests/expansion.test.cjs`; full bilingual/touch progression: `node scripts/verify-expansion.cjs [project-directory]`. Reference fixtures and accelerated solver checks are identified in its report.
- Optional touch/layout checks: `node scripts/verify-mobile.cjs [project-directory]`.
- Optional teaching browser checks: `node scripts/verify-pedagogy.cjs [project-directory]`.
- Upgrade, acceptance and limitations: `docs/3D-UPGRADE_zh.md`.
- Teacher guide: `docs/TEACHER_PLAYTEST_zh.md`; learning evidence map: `docs/STEM_ALIGNMENT_zh.md`.
- Architecture/story: `docs/ARCHITECTURE.md`, `docs/BRANCHING-DESIGN.md`.
- Original visual update and art provenance: `docs/VISUAL-UPDATE_zh.md`,
  `assets/ART-PROVENANCE.md`. Three.js license/source hashes: `vendor/three/`.

If WebGL 2 is unavailable, the workshop shows a recovery message. Enable browser
hardware acceleration and reload. No 2D physics or saved design becomes a 3D safety model.
