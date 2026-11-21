# UI specification — visual update 1.1

Runtime: `site/css/styles.css`, `site/js/render/scene.js`, `site/index.html`.
Audience: ages 11–14. English game text. No build or network required.

## Visual system

| Token | Value | Role |
|---|---|---|
| ink | #223b40 | body text and controls |
| muted | #597176 | supporting copy |
| card | #fafdfc | UI surfaces |
| accent-d | #135a54 | primary actions |
| sky | #deedf1 | loading/background fallback |
| water | #52aeb7 | valley palette |
| ok | #246e50 | passing result and budget |
| bad | #b44335 | failure and over-budget feedback |

Segoe UI / system font. App controls have explicit sizes. The main menu uses
an oversized title on an open landscape; workshop controls use quiet header
and footer rails rather than panels across the bridge.

## Presentation and interaction geometry

Background mountains, textured banks, trees and the vehicle use local WebP
art. Three.js draws the engineering grid, mirrored members, supports and feedback. The road is prelaid and locked; supports remain editable.
Member tops/sides and support columns create shallow 2.5D depth. Road-front
joints remain on the original side-view coordinate plane. Projection does not
change simulation coordinates, forces, member length or cost.

A native vehicle image follows the simulated axles. This is deliberate:
WebGL texture uploads of local file images can be blocked by browser origin
rules. The native image layer preserves offline file:// play.

Force colors remain blue #2e7dd1 for tension and red #d2452f for compression.
Inspect text names the material, push/pull mode, percentage and approximate
kN. Broken members have separated ends and a break marker. Slack cable is
pale and dashed. Color is supported by words and shapes.

## Responsive behavior

- Desktop: title/header, full stage, compact footer.
- Below 1190 px: footer uses two rows and world-state chips move to a horizontal
  strip. On phones, materials wrap above edit controls, budget and test action.
- Short landscape: world-state chips hide to free space; Map retains details.
- Canvas scale fits the actual visible stage and all anchors, including tall
  cliff anchors and middle piers.
- Result and quiz panels scroll within the stage. Reports scroll as a screen;
  the wide results table has its own horizontal scroll container.
- Comic images use available height and object-fit contain.
- Drag labels and Inspect tooltips clamp inside the stage.

## Accessibility and motion

- Hidden UI explicitly uses `[hidden] { display:none !important; }`.
- Focus outlines remain visible; initial screen focus prefers a primary action.
- Erase/undo/redo/clear retain accessible names when their text is hidden on phones.
- Story, coach, budget and toast keep their existing live regions.
- Reduced-motion disables CSS transitions, moving water, particles and shake.
- Keyboard shortcuts remain 1–4, X, F, Space, Ctrl+Z / Ctrl+Shift+Z and Esc.
- Drawing still requires a pointer. No keyboard-only bridge editor was added.

## Verification limits

Playwright Chromium checks include desktop, small phone, tablet and short
landscape, a complete reference-design story route, real mouse drag and
emulated touch building/Inspect. Physical devices, screen readers, Safari and
Firefox were not tested. See `VISUAL-UPDATE_zh.md` for detailed scope.
