# Bridge Engineer — Riverbend Workshop

An English-language STEM game powered by Phaser 3.90.0, with free construction and gravity-based structural experiments.

**Play:** https://lunarsh4de.github.io/bridge-engineer/

## Run offline

Open `index.html` directly. No build, installation, account, server or network connection is needed. In the downloadable game package, `index.html` is at the top level.

The game opens directly into a workshop that fills the browser. Use the top-right full-screen button for optional browser full screen.

[中文运行与教师说明](docs/RUNNING_zh.md)

## Play

1. Select **Road**. Drag from one orange bank anchor to the other to create joined road sections, or place shorter sections yourself.
2. Select **Timber** and drag anywhere on the grid to add supports. Two clicks also set a member's endpoints. Nearby endpoints join; mid-member intersections do not.
3. Use **Move** to drag free joints, **Erase** to reuse material, or Undo/Redo to compare alternatives. A material card can also be dragged onto the scene to place a loose piece.
4. Enter **Gravity lab** to observe self-weight, falling pieces and deformation without a vehicle.
5. Select **Test crossing** to settle the structure and apply a moving delivery load. A successful crossing has no failed members and a maximum deck drop below 12 cm.
6. Return to **Edit design** to restore the unaltered construction and change one variable. Three missions gradually add more timber, steel and tension-only cables.

Optional starter designs, field notes and a Forth Bridge case provide teaching support. **About** explains the STEM topic, story, engineering focus, learning objectives and model boundaries.

Completed missions and editable designs are saved separately in this browser when storage is available. The previous prototype's completion record is not reused because its levels and physics were different.

## Architecture

| File                 | Responsibility                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| `index.html`    | Full-screen workshop shell, accessible controls and dialogs                                     |
| `styles.css`    | Responsive UI, interaction states and visual hierarchy                                          |
| `js/levels.js`  | Mission data, material limits and optional starter structures                                   |
| `js/model.js`   | Editable design, geometry validation, material use, welding and undo/redo                       |
| `js/physics.js` | Independent fixed-step compliant position-based structural simulation                           |
| `js/engine.js`  | Phaser Boot/Workshop/HUD scenes, native objects, input, camera, animation, audio and game clock |
| `js/art.js`     | Original procedural texture painting at boot; no live render loop                               |
| `vendor/`       | Locally bundled Phaser 3.90.0 and its MIT license                                               |
| `js/app.js`     | Editor commands, keyboard controls, persistence, fixed-step advancement and learning flow       |

Phaser owns the game loop, scene lifecycle, live rendering, pointer input and visual effects. The accessible HTML interface remains above its canvas. WebGL is selected when available, with a Canvas renderer fallback. Bridge members, joints, truck and effects are native Phaser objects; the former hand-written Canvas render loop has been removed. Original artwork is baked into textures once at boot.

Placement sparks, animated wheels and water, mission transitions, break shake, success particles and procedural tones provide feedback. The sound button persists its mute setting. Reduced-motion preference suppresses decorative motion and effects.

Construction is kept separate from simulation. Tests clone the design into a new physics world; returning to edit restores the original geometry. Physics advances in fixed 1/120 s increments, independently of rendering. Modal dialogs and hidden tabs suspend simulation advancement. Native full-screen mode is entered only through a user action.

## Physics scope

The teaching model includes Earth gravity, member self-weight, joint masses, axial compliance, damping, simplified tensile/compressive capacity, a length-dependent compression limit, and tension-only cables. Unconnected members fall. Overloaded members can break.

The delivery is a prescribed moving load while supported by a continuous road. It falls under gravity if the road breaks or becomes unusable. This is not a complete rigid-body wheel-contact simulation.

Units are metres, kilograms and seconds. Material properties are game presets, not specifications for real timber or steel products. Nodes are idealised pins; member bending, realistic buckling shapes, joint failure, member-to-member collision, fatigue, wind and real material variability are omitted. Simple ground contact exists at the banks and river floor. Do not use this model to assess real bridges. Completion is not a formal assessment of conceptual mastery.

## Tests

Node.js 20+:

```sh
npm test
```

The physics and editor tests have no third-party dependencies. Optional browser verification requires the development dependency Playwright:

```sh
npm install
npx playwright install chromium
python3 -m http.server 8766
# In another terminal:
npm run test:browser
npm run test:engine
```

`BASE_URL` can select another local test URL. `BROWSER_EXECUTABLE` can select an installed Chromium executable. Browser tests write screenshots to ignored `work/`.

## Sources and originality

See [architecture research](docs/research/bridge-workshop-architecture.md) and [verification record](docs/TEST_REPORT.md). Matter.js, verlet-js and Excalidraw informed architectural choices; their source was inspected but not embedded in this game. The physics implementation, illustrations, scenarios and UI are independently written. Phaser is the only runtime library, bundled locally under its MIT license in `vendor/PHASER-LICENSE.md`. There are no CDN dependencies. Phaser supplies the game framework; the bridge solver is independently written and does not use Arcade or Matter physics.
