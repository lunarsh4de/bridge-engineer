# Bridge Engineer

An English-language, offline-capable STEM bridge-building demo.

## Play

Open `index.html` in a modern browser. No installation or server is needed.

Build connections between numbered points, test your bridge, and use the feedback to improve it. Complete three missions to progress from limited timber to a larger toolkit and steel members.

The top-right About button introduces the STEM topic, Riverbend story, civil and structural engineering focus, learning objectives and model limitations.

## Structure

- `index.html`: home page, workshop and dialogs
- `styles.css`: responsive visual design
- `js/levels.js`: mission definitions and material progression
- `js/physics.js`: simplified linear 2D truss solver
- `js/app.js`: interaction, rendering, test animation and local progress

## Teaching scope

Triangulation, load paths, tension, compression and design iteration. The built-in Forth Bridge case links to https://whc.unesco.org/en/list/1485/ . Artwork is an original conceptual illustration, not a measured drawing.

The teaching model uses pin joints, preset axial stiffness/capacity and a moving static point load. It omits bending, self-weight, dynamic impact, wind, fatigue and joint failure. It is not an engineering design or safety tool. Completion is not a formal assessment of learning.

## Originality

Bridge-building is an established game genre. This demo's code, illustrations, scenarios and learning sequence were created for this project. No third-party game code or artwork is included.

## Progress

Completed missions are stored locally if browser storage is available. Refreshing clears the current design. The prototype has no accounts, tracking, remote services or runtime dependencies.
