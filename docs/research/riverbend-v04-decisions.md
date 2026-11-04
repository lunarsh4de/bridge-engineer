# Riverbend v0.4 — implementation decisions

Date: 2026-11-05. This revision implements the user's subsequent development request. The latest request explicitly replaces direct-to-construction entry with a normal full-screen game menu, Start, level selection and a top-right About course overview. No public deployment is part of this revision.

## Retained architecture

Phaser 3.90.0 remains the local game framework. The independent axial-member solver remains responsible for structural evidence; its material physics are unchanged. Menu and workshop render through the existing Phaser scene, with a separate non-persistent background design in the menu. HTML screens and dialogs own accessible navigation. Inactive screen controls are inert. Camera layout is refreshed on resize and dock changes instead of reading DOM bounds in every draw call.

`progress.js` isolates legacy-save migration, evidence snapshots, condition signatures, geometry fingerprints and material cost from the DOM. `content.js` isolates on-demand teaching and source summaries. Simulations never mutate the editable design. Modal/visibility changes cancel unfinished gestures and pause simulations. A release outside the canvas cancels placement.

## New content

Millwater Reach adds an 8 m, 1,400 kg challenge with Road 8.2 m, Timber 8 m, Steel 16 m and Cable 8 m. Its independent example uses steel diagonals and a lower cable chord. Numerical verification compares this pulling role with the inverted shape, in which the cable cannot support compression. It is not a replica of Queensferry Crossing. A mixed timber/steel diagonal alternative also passes in the model; no exact-shape requirement is enforced.

The Notebook separates progress from learning evidence. It records predictions, immutable test designs, matched conditions, measured outcomes and optional explanations. Comparing different loads or test modes would make a controlled comparison misleading, so these are excluded. Duplicate geometry is identified independently of generated node IDs. Cost rewards compare successful solutions only; a record does not automatically certify a correct explanation.

## Source-to-design mapping

All sources below were checked during the 2026-11-04 research. No remote SKILL.md was adopted as project instructions, and no game source, templates, art or levels were copied.

- Hunicke, LeBlanc, Zubek, [MDA (2004)](https://users.cs.northwestern.edu/~hunicke/MDA.pdf): mechanics/dynamics/desired experience distinctions. This informed discovery, expression and challenge through construction and evidence. It is a framework, not a learning-effectiveness guarantee.
- Jakob Nielsen, [10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/): visible consequences, undo, error recovery and on-demand help informed the interaction state contract. These are heuristics, not mandatory game standards.
- CMU Eberly Center, [Learning Principles](https://www.cmu.edu/teaching/principles/learning.html): targeted practice, feedback and self-monitoring informed optional prediction/reflection and local examples.
- [NGSS MS-ETS1-3](https://www.nextgenscience.org/pe/ms-ets1-3-engineering-design): an external US grades 6–8 comparison for analyzing tests and combining design strengths. It is not an established requirement of this course.
- Phaser, [selected bridge example at inspected revision](https://github.com/phaserjs/examples/blob/eb87db8355861ae222d0c5cd13aae54c2d7d72ae/public/3.55/src/physics/matterjs/bridge.js): inspected example only, not a full game review or v3.90 compatibility proof. No code copied; example-specific licensing was not established.
- Liam Brummitt and contributors, [Matter.js bridge](https://github.com/liabru/matter-js/blob/b8ee71cd7f9b49f53639ddaedd6254f1929bcbe5/examples/bridge.js), MIT: lifecycle separation informed architecture, but Matter is not embedded.
- efeislekel, [game-forge UI module](https://github.com/efeislekel/game-forge-claude-skill/blob/881af0b776dd7e54668aed8cfff45190d88dabca/skills/game-forge/modules/game-ui-ux/MODULE.md): inspected as author suggestions about responsive layout, screen states and focus. Its mixed upstream licenses were not treated as a blanket reuse license.
- Dry Cactus, [Poly Bridge 3 product description](https://store.steampowered.com/app/1850160/Poly_Bridge_3/): campaign/sandbox and construction-test loops are precedents. No game playthrough or source review was performed.
- Transport Scotland / Forth Bridges, [Forth Bridge](https://www.theforthbridges.org/about-the-forth-bridges/forth-bridge/): 1890 opening, steel cantilever railway bridge. Original explanatory text; no photographs or plans copied.
- Transport Scotland / Forth Bridges, [Queensferry Crossing](https://www.theforthbridges.org/about-the-forth-bridges/queensferry-crossing/): 30 August 2017 opening and three-tower cable-stayed configuration. The game transfers a tension-only principle rather than reproducing its structural system.

The original course attachments have not been re-read. About explains the implemented course-project concept, not verified compliance with an unseen rubric. Runtime dependencies remain local and licensed; external source links are optional further reading.
