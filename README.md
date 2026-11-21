# Riverbend: Bridge Engineer — 3D update 1.3.1

Offline STEM bridge-building game for ages 11–14. Open `index.html` (or
`site/index.html`) in a browser with WebGL 2. No server, install, build step,
network connection or API key is needed to play. Six level definitions form
five crossings on each story path; finale supports create eight scene configurations.

The workshop uses local Three.js r165 for a real 3D valley, bridge members,
shadows and delivery truck. The structural simulation remains the original 2D
fixed-step XPBD model. Level rules, teaching concepts and version-1 saves are unchanged.

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
- Optional teaching browser checks: `node scripts/verify-pedagogy.cjs [project-directory]`.
- Upgrade, acceptance and limitations: `docs/3D-UPGRADE_zh.md`.
- Teacher guide: `docs/TEACHER_PLAYTEST_zh.md`; learning evidence map: `docs/STEM_ALIGNMENT_zh.md`.
- Architecture/story: `docs/ARCHITECTURE.md`, `docs/BRANCHING-DESIGN.md`.
- Original visual update and art provenance: `docs/VISUAL-UPDATE_zh.md`,
  `assets/ART-PROVENANCE.md`. Three.js license/source hashes: `vendor/three/`.

If WebGL 2 is unavailable, the workshop shows a recovery message. Enable browser
hardware acceleration and reload. No 2D physics or saved design becomes a 3D safety model.
