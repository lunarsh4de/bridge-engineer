# Bridge workshop architecture and UI research

Research date: 2026-11-04. Scope: public GitHub repository metadata, selected source files and an academic method reference. No existing game was downloaded and repackaged.

## Relevant references

### Matter.js — bridge example

- Repository: https://github.com/liabru/matter-js
- Inspected example: https://github.com/liabru/matter-js/blob/b8ee71cd7f9b49f53639ddaedd6254f1929bcbe5/examples/bridge.js
- License: MIT (verified in repository LICENSE).
- Observed: independent engine, renderer and runner; bridge built from rigid bodies and constraints; fixed supports and mouse interaction.
- Useful principle: keep physical state, interaction and rendering separate; use a fixed simulation world with explicit supports.
- Decision: do not embed Matter.js or copy its bridge. A custom axial-member solver makes member mass, compliance and estimated tension/compression directly available for the lesson. A full rigid-body vehicle/contact model remains a possible future extension, not a feature claimed here.

### verlet-js

- Repository: https://github.com/subprotocol/verlet-js
- Inspected README, `lib/verlet.js`, `lib/constraint.js`, and LICENSE.
- Revision observed: `3293d409aafe3adfd56811849b9168cb84599c28`.
- License: MIT (verified in the actual LICENSE; GitHub metadata returned NOASSERTION).
- Observed: particles, pin/distance/angle constraints, gravity, relaxation, selection and bounds; simulation and drawing have separate methods.
- Useful principle: editable joint networks can be simulated through particle state and geometric constraints without predefined node locations.
- Decision: independently implement compliant distance constraints, fixed-step integration, mass weighting, member failure and cable slackness. No source is copied or included as a runtime dependency.

### Excalidraw — canvas editor UI organisation

- Repository: https://github.com/excalidraw/excalidraw
- Inspected file: https://github.com/excalidraw/excalidraw/blob/master/packages/excalidraw/components/LayerUI.tsx
- Observed: grouped toolbars and action islands; distinct canvas actions and selected-shape actions; compact/mobile handling.
- Useful principle: keep the canvas primary, group editing actions spatially, reveal contextual feedback, and adapt tool groups for small screens.
- Applied interpretation: a persistent workshop canvas, mission card, material dock, separate edit/test actions, contextual simulation HUD, and a compact mobile brief. No React components, CSS or artwork copied.

### Bridge-builder game — unsuitable physics reference

- Repository: https://github.com/chadsansing/bridge-builder-game
- Revision observed: `a2005c0cad2194c8773fbddaff0bfc9dd3c55110`.
- License reported by GitHub: MPL-2.0.
- README explicitly describes teaching CSS positioning by building bridges for sprites. It was excluded as a physical bridge simulation reference. No source used.

### XPBD method

Miles Macklin, Matthias Müller and Nuttapong Chentanez, **XPBD: Position-Based Simulation of Compliant Constrained Dynamics**, MiG 2016. DOI: https://doi.org/10.1145/2994258.2994272

Author-hosted paper: https://matthias-research.github.io/pages/publications/XPBD.pdf

The paper describes compliance and constraint-force estimation in position-based simulation. The demo independently implements an axial distance-constraint subset with compliance `L / EA`, accumulated constraint multipliers, and fixed time steps. It does not claim to implement all features or reproduce the paper's validation. The paper PDF is not redistributed.

## Visual and interaction decisions

- Cool, lower-contrast sky and distant mountains recede behind a warmer, outlined timber/steel structure.
- A blue river, earthy cliff faces and distinct bank surfaces make the work area legible.
- Dark panels frame pale scene colours; selected materials have explicit outlines and pressed states.
- Materials, edit actions and experiments form separate groups. Results replace redundant HUD panels to avoid overlap.
- The workshop opens directly; a landing page is no longer required to begin playing.
- Full viewport layout and optional native browser full screen are separate features.
- Drag-to-build, click-to-build, palette drag/drop and keyboard placement are supported. Gravity only runs when the player starts an experiment, allowing deliberate construction.
- Mobile controls stack; the mission brief collapses. Important active controls retain explicit labels, focus styles and touch targets.

## Originality boundary

These are architectural and interaction references. They do not establish that the overall game concept is unique, and they do not guarantee an academic originality outcome. The independently authored implementation, level conditions and teaching flow are the project's concrete contribution. Existing bridge-building games remain disclosed in the earlier comparison report.
