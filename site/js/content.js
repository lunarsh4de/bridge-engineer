/* On-demand teaching content. Alignment describes design intent, not measured learning. */
(function (root) {
  "use strict";

  const storyPanels = [
    "The middle bridge is gone, and seedlings are waiting on the riverbank.",
    "Two apprentices and their guide test triangles on a tabletop model.",
    "From the safe bank, they build and test one half of the new crossing.",
    "An orange cart carries the seedlings across the completed bridge.",
  ];

  const about = `
    <p class="lead">Designed for ages 11–14 with adult facilitation and no prior bridge-design experience required. Estimated playtime is 45–75 minutes; actual playtime varies.</p>
    <h3>STEM focus</h3><p><strong>Engineering:</strong> civil and structural design. <strong>Science:</strong> gravity, self-weight, tension and compression. <strong>Mathematics:</strong> geometry, length, load and measured comparison. <strong>Technology:</strong> an inspectable digital simulation.</p>
    <h3>Measurable learning goals</h3><ol><li>Given two tests under the same load, compare maximum drop, failure evidence and material use, then explain one structural change using a connected load path.</li><li>Given timber, steel and cable, choose a material for an axial-force role and justify the choice using tension/compression, stiffness, strength and self-weight evidence.</li><li>After a failed or inefficient test, revise a design and record a prediction supported by prior evidence.</li></ol>
    <h3>Learning design</h3><p>The campaign moves through the 5E pattern: story and prediction <strong>Engage</strong>; free construction <strong>Explore</strong>; force feedback and field notes <strong>Explain</strong>; new spans, supports and loads <strong>Elaborate</strong>; matched Notebook comparisons <strong>Evaluate</strong>. This combines chunking, demonstration–practice–feedback, inquiry, problem solving and situated consequences. It targets Bloom levels from understand to apply, analyse and create.</p>
    <h3>Evidence and consequences</h3><p>A disconnected or overloaded design delays the story delivery but never removes retries. Successful crossings unlock the next community. The Notebook preserves predictions, designs and measured outcomes; completion alone is not evidence of conceptual mastery.</p>
    <details><summary>Model boundaries, sources & scope</summary><p>The vehicle is a prescribed moving load while supported by a road, not a full wheel-contact simulation. Ideal pin joints and axial members omit beam bending, realistic buckling shapes, joint failure, fatigue and wind. The 12 cm drop limit and material properties are game rules, not engineering standards. A reference is one tested example, never a mathematically optimal or real-world-safe design.</p><p>The design is aligned with the course-provided STEM mind map and game rubric reviewed on 5 November 2026, including ABCD goals, Bloom verbs, 5E, inquiry, practice, feedback, scenario consequences and facilitation. Alignment is not a grade guarantee or a learning-effectiveness study.</p><p>Further references: <a href="https://users.cs.northwestern.edu/~hunicke/MDA.pdf" target="_blank" rel="noopener">Hunicke, LeBlanc & Zubek — MDA</a>; <a href="https://www.cmu.edu/teaching/principles/learning.html" target="_blank" rel="noopener">CMU learning principles</a>; <a href="https://www.nextgenscience.org/pe/ms-ets1-3-engineering-design" target="_blank" rel="noopener">NGSS MS-ETS1-3</a> as an external comparison.</p><p>Phaser 3.90.0 handles rendering and input; an independent fixed-step solver handles the bridge. The game runs offline without accounts, CDN assets or API keys.</p></details>`;

  const controls = `<div class="guide-step"><span>01</span><div><h3>Make a connection</h3><p>Select Road. Drag between joints, or tap two endpoints. Long road placements become joined sections.</p></div></div><div class="guide-step"><span>02</span><div><h3>Support your idea</h3><p>Add Timber, Steel or Cable. Ends snap to nearby joints; crossing lines are not joined unless they share a joint.</p></div></div><div class="guide-step"><span>03</span><div><h3>Test, observe, adjust</h3><p>Use Self-weight or Test crossing. Forces reveals tension, compression and overload. Edit design returns to the untested bridge.</p></div></div><details><summary>Editing & keyboard controls</summary><p>Move adjusts free joints. Erase returns materials. Undo and Redo restore edits. Escape or Cancel abandons an unfinished member.</p><p>1–4: materials · M: move · X: erase · H: help · Ctrl/Cmd Z: undo · Ctrl/Cmd Shift Z: redo · Space: pause. On touch screens, tap two endpoints.</p></details>`;

  function task(level) {
    const learning = getLearning(level);
    return `<p class="lead">${level.story}</p><div class="modal-grid"><div><strong>${level.constraint}</strong><p>${level.truckMass.toLocaleString()} kg delivery</p></div><div><strong>Pass condition</strong><p>Continuous road · no broken members · maximum drop below 12 cm</p></div></div><h3>${learning.goal || level.concept}</h3><p>${learning.decision || level.lesson}</p><p>There is no required bridge shape. Test freely; failed attempts do not consume material.</p><details><summary>Material accounting</summary><p>Inventory is limited by length. Removing a member returns it. Comparison cost uses game credits per metre: Road 1, Timber 1, Steel 3, Cable 1.2. These are not market prices.</p></details>`;
  }

  function getLearning(level) {
    return level && level.learning ? level.learning : {
      delivery: level?.story || "Campaign delivery",
      goal: level?.concept || "Build a connected crossing.",
      decision: level?.lesson || "Trace the load path and test your idea.",
      newConstraint: level?.constraint || "Use the available materials.",
      hints: [{ kind: "observe", text: level?.hint || "Observe the test before changing one feature." }, { kind: "principle", text: level?.lesson || "Connected members carry force to fixed supports." }],
      misconception: "A nearby member is not connected unless it shares a joint.",
      failure: { title: "Delivery delayed", body: "The crossing did not meet the model limit.", next: "Use the evidence to change one feature and retest." },
      success: { title: "Delivery complete", body: "The community route is open.", route: "The route advances." },
      forceExplanation: level?.explanation || "Trace connected members from the loaded road to fixed supports.",
      cerPrompt: "What changed, what evidence did you observe, and why did it help?",
      notebook: { prediction: "Where will the bridge move first?", evidence: "Record drop and failure evidence.", comparison: "Change one feature and retest under the same condition." },
      consequence: "The next delivery can begin.",
    };
  }

  function hint(level, index = 0) {
    const item = getLearning(level).hints[index] || getLearning(level).hints[0];
    return item ? item.text : "Observe the test, then change one connected feature.";
  }

  function failure(level) { return getLearning(level).failure; }
  function success(level) { return getLearning(level).success; }
  function notebookGuide(level) { return getLearning(level).notebook; }

  function structures(level, referenceUnlocked = false) {
    const reference = level.sandbox
      ? "<p>Free Build has no reference answer. Define your own comparison.</p>"
      : referenceUnlocked
        ? '<p>This is one independently tested starting point, not an optimal answer. Loading it replaces the current design as one reversible edit.</p><button id="starter" class="primary">Load reference design</button>'
        : "<p>Run one test of your own bridge to unlock the optional reference design.</p>";
    return `<h3>${level.concept}</h3><p class="lead">${level.lesson}</p><div class="hint-example"><strong>A small investigation</strong><p>${level.hint}</p><p>Predict first. Keep the load fixed, change one feature, and compare the evidence.</p></div><details><summary>Reference design</summary>${reference}</details><h3>Read the forces</h3><p><strong>Tension:</strong> pulling. <strong>Compression:</strong> pushing. <strong>Slack:</strong> a cable carrying no tension. Steel is stiffer and stronger in this model but adds more self-weight. Every member still needs a connected route to a fixed support.</p>`;
  }

  function debrief(level) {
    return `<h3>Trace the load</h3><p>${level.explanation}</p><div class="hint-example"><strong>Engineering limit</strong><p>This explanation describes the simplified model. A passing bridge is not certified safe, and the reference design is not claimed to be mathematically optimal. Compare it with your own successful design under the same conditions.</p></div>`;
  }

  function transition(level, next) {
    if (!next)
      return `<strong>Riverbend is connected.</strong> The relief convoy arrived. Your campaign evidence remains in the Notebook, and Free Build is open for a new investigation.`;
    return `<strong>${level.place} is connected.</strong> The delivery arrived. Next, ${next.place} changes the problem: ${next.newMaterial.toLowerCase()}.`;
  }

  function cases(level) {
    if (level.id >= 3 || level.sandbox)
      return `<p class="eyebrow">REAL BRIDGE · SCOTLAND</p><h3>Queensferry Crossing</h3><p class="lead">Opened to traffic on 30 August 2017, this is a three-tower cable-stayed bridge.</p><p>Cables link its deck to towers. A cable needs a pulling role, while towers and supports complete the load path.</p><div class="hint-example"><strong>Transfer the principle</strong><p>Find one tensile member in your model. Could cable do that job? Replace only that member and compare under the same load.</p></div><p>The game's small trusses do not reproduce this cable-stayed bridge.</p><a href="https://www.theforthbridges.org/about-the-forth-bridges/queensferry-crossing/" target="_blank" rel="noopener">Source: Forth Bridges / Transport Scotland ↗</a><p class="model-note">Facts checked 4 November 2026. The summary works offline; the source link needs a connection.</p>`;
    return `<p class="eyebrow">REAL BRIDGE · SCOTLAND</p><h3>The Forth Bridge</h3><p class="lead">Opened in 1890, the Forth Bridge is a steel cantilever railway bridge.</p><p>Follow its connected framework from the railway toward the supports. Repeated triangles can stabilise a pin-jointed arrangement, but connections and supports matter too.</p><div class="hint-example"><strong>Transfer the principle</strong><p>Choose one loaded road joint. Trace connected members toward a bank. If the path stops, revise one connection and retest.</p></div><p>Your short truss is not a scale model of the Forth Bridge.</p><a href="https://www.theforthbridges.org/about-the-forth-bridges/forth-bridge/" target="_blank" rel="noopener">Source: Forth Bridges / Transport Scotland ↗</a><p class="model-note">Facts checked 4 November 2026. No third-party photographs or plans are embedded.</p>`;
  }

  const api = {
    about,
    controls,
    storyPanels,
    task,
    getLearning,
    hint,
    failure,
    success,
    notebookGuide,
    structures,
    debrief,
    transition,
    cases,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.BridgeContent = api;
})(typeof window !== "undefined" ? window : globalThis);
