/* Riverbend: Bridge Engineer - player-facing text. Alignment describes design intent, not measured learning. */
(function (root) {
  "use strict";
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const storyPanels = [
    { img: "assets/story-panel-1.png", alt: "A broken bridge over a flooded river; seedlings wait on the bank.", text: "The flood took the valley's bridges. Seedlings, medicine and grain are stuck on the wrong side of the river." },
    { img: "assets/story-panel-2.png", alt: "Two apprentices and their guide test triangles on a tabletop model.", text: "Mara the guide trains two apprentices. Every bridge starts as a test on the workshop table." },
    { img: "assets/story-panel-3.png", alt: "The crew builds one half of a crossing from the safe bank.", text: "Each community needs a different crossing. You cannot reach them all at once, so you will have to choose." },
    { img: "assets/story-panel-4.png", alt: "An orange cart carries seedlings across a finished bridge.", text: "Your choices decide what you carry to Riverbend: materials, savings, and the trust of the people you helped." },
  ];

  const about = `
    <p class="lead">For ages 11–14 with adult facilitation. No bridge-design experience needed. Expected play time is about 45–75 minutes; actual time varies.</p>
    <h3>STEM focus</h3><p><strong>Engineering:</strong> structural design under budget. <strong>Science:</strong> gravity, self-weight, tension and compression. <strong>Mathematics:</strong> length, cost, load and measured comparison. <strong>Technology:</strong> an inspectable simulation.</p>
    <p>Complete Chapter I to continue straight into Chapter II, where two trucks, boat clearance and multiple spans add new constraints.</p>
    <h3>Learning goals</h3><ol>
      <li>Compare two tests under the same load using maximum drop, peak member load and cost, then explain one change through the load path.</li>
      <li>Choose timber, steel or cable for a role and justify it with tension/compression, strength, buckling and self-weight evidence.</li>
      <li>Make a community decision, predict what it changes later, and evaluate the outcome in the Field report.</li></ol>
    <h3>How the game teaches</h3><p>A branch-and-bottleneck story: community and support decisions change the materials, credits and support options you have at Riverbend. Every path can be finished; each has trade-offs. After each crossing a short check asks you to explain the forces you just saw. Stars reward an efficient design and badges set optional extra goals.</p>
    <h3>Goal, rules, rewards, challenge</h3><p><strong>Goal:</strong> deliver across each river. <strong>Rules:</strong> continuous road, no broken members, maximum road drop under that crossing's limit, cost within budget. <strong>Rewards:</strong> stars, badges, saved credits, unlocked materials and trust. <strong>Challenge:</strong> longer spans and heavier loads with limited credits.</p>
    <details><summary>Model limits, sources and teaching methods</summary><p>The vehicle is a moving load on the road, not a full wheel-contact model. Joints are ideal pins and members carry axial force only, so bending, joint failure, fatigue and wind are left out. Drop limits, material values and credit prices are game rules, not engineering standards. Example designs are one tested solution, never the only or the best one.</p>
    <p>References: <a href="https://users.cs.northwestern.edu/~hunicke/MDA.pdf" target="_blank" rel="noopener">Hunicke, LeBlanc &amp; Zubek, MDA</a>; <a href="https://www.cmu.edu/teaching/principles/learning.html" target="_blank" rel="noopener">CMU learning principles</a>; <a href="https://www.nextgenscience.org/pe/ms-ets1-3-engineering-design" target="_blank" rel="noopener">NGSS MS-ETS1-3</a>. Rendering uses Three.js r165 and OrbitControls (MIT). Original artwork: assets/ART-PROVENANCE.md. Real bridge photographs: visible credits and licenses in each case card; full sources in assets/bridges/SOURCES.json.</p><h3>Teaching methods used</h3><ul class="teaching-methods">
      <li><strong>Chunking (Factual):</strong> Task information comes first, a character explanation follows the first failed test, and a real-world connection follows a successful test.</li>
      <li><strong>Bottom-up Discovery (Conceptual):</strong> Learners try a design before its automatic structural explanation appears. This follows the Explore → Explain sequence in 5E; requested hints remain available.</li>
      <li><strong>Demonstration → Practice → Feedback (Procedural):</strong> Controls practice guides an action with highlighted endpoints, then learners use the real controls and receive test feedback.</li>
      <li><strong>CER + Inquiry (Problem-solving):</strong> Predict a consequence before testing, then record a Claim, Evidence and Reasoning for that numbered test.</li>
      <li><strong>Storytelling + SBL:</strong> Characters connect observations to ideas; materials, trust and saved credits affect later choices.</li>
      <li><strong>Bloom's Taxonomy:</strong> Skill tags describe the intended thinking demand: Apply → Analyse → Evaluate → Create. A tag or pass does not establish mastery.</li>
      <li><strong>Branch and Bottleneck (SBL):</strong> Route and sharing decisions change materials and credits. The story converges at Echo Gorge, then a support decision shapes the Riverbend finale.</li>
      </ul><p class="small">Teaching design intent, not a measured learning outcome. Teachers can review matched tests and explanations as evidence for further questions.</p></details>`;

  const controls = `
    <div class="guide-step"><span>01</span><div><h3>Road is ready</h3><p>The prelaid road is locked and counted in your budget. Pick a support material, then drag between joints or tap both endpoints. Both truss sides update together.</p></div></div>
    <div class="guide-step"><span>02</span><div><h3>Add supports</h3><p>Pick Timber, Steel or Cable and drag from an existing joint. Lines only join where they share a dot.</p></div></div>
    <div class="guide-step"><span>03</span><div><h3>Test and read the evidence</h3><p>Press <strong>Test crossing</strong>. Green → yellow → red bodies show utilization; blue/red end bands show tension/compression. If something breaks, the game slows down and shows which piece failed and why.</p></div></div>
    <div class="guide-step"><span>04</span><div><h3>Improve</h3><p>After a test, <strong>Inspect</strong> shows the highest load each member reached. Make one change, predict its consequence, then compare tests under matching conditions. Low utilization alone does not prove a member can be removed.</p></div></div>
    <details><summary>Keyboard and mistakes</summary><p>1–3 support materials · Arrow keys + Enter build · P pause · X erase · Ctrl+Z undo · Ctrl+Shift+Z redo · Esc cancel the current line · Space test or edit · F forces. Right-click also cancels. Nothing you do is permanent: Undo, Clear and Edit design always bring you back.</p></details>`;

  const CONCEPT_DIALOGUE_MAP = {
    tabletop: '<span class="speaker">Mara:</span> "Watch how the road sags when nothing supports it. Add a timber below — a triangle turns that bending into push and pull."',
    willow: '<span class="speaker">Mara:</span> "Long members can buckle under compression. Keep each section short and brace it into triangles."',
    clinic: '<span class="speaker">Dr. Yao:</span> "A cable can only pull. If you use it to push, it just goes slack and carries nothing."',
    mill: '<span class="speaker">Mill foreman:</span> "Investigate the one that broke first, then try a stronger material there. Change one thing at a time so you can compare what the fix changed."',
    echo: '<span class="speaker">Mara:</span> "Different structures can carry the same load. Use the materials you earned, then compare drop, member load and cost under the same conditions."',
    finale: '<span class="speaker">Town engineer:</span> "A pier or high anchor changes the paths that carry load to the ground. Design for the supports the town chose, then test your idea."'
  };
  const REAL_WORLD_MAP = {
    tabletop: 'Real railway bridges use triangular bracing to keep spans stiff under heavy loads.',
    willow: 'Highway truss bridges divide long spans into short triangulated panels.',
    clinic: 'Suspension bridges use cables for tension only — a cable cannot push, only pull. Here, direct stays connect road joints to high anchors.',
    mill: 'Engineers can strengthen selected members when repairing a bridge; evidence helps them decide where a change is needed.',
    echo: 'Arch bridges and truss bridges suit different conditions — both are still built today. Here, compare the truss and stayed-deck approaches available to you.',
    finale: 'Real engineers compare multiple designs before choosing; cost, weight and safety all matter.'
  };
  const BLOOM_MAP = {
    tabletop: 'Apply — build a triangulated support',
    willow: 'Analyse — compare long beam vs triangulated span',
    clinic: 'Analyse — identify tension/compression member roles',
    mill: 'Evaluate — choose materials with test evidence',
    echo: 'Evaluate — compare two structural approaches',
    finale: 'Create — design for new load and span constraints'
  };
  const ILL_STRUCTURED = 'Your design is not the only solution. The reference bridge shows one tested approach — not the best, not the only one.';

  function taskBlock1(level) {
    const mats = level.materials.map(m => root.BridgePhysics.MATERIALS[m]);
    const brought = level.id === 'tabletop' ? 0 : level.reserve || 0;
    const visual=root.VisualGuide?root.VisualGuide.task(level):"";
    return `<section class="task-block" data-task-block="1">${visual}${root.BridgeAtlas?root.BridgeAtlas.card(level.id):''}${level.heights?`<div class="height-control"><label for="deck-height">Deck height</label><select id="deck-height" ${root.__GAME_STATE__&&root.__GAME_STATE__.mode!=='edit'?'disabled':''}>${level.heights.map(d=>`<option value="${d}" ${d===level.deckY?'selected':''}>+${d*.5} m</option>`).join('')}</select><button class="btn small" id="apply-height" ${root.__GAME_STATE__&&root.__GAME_STATE__.mode!=='edit'?'disabled':''}>Apply height &amp; clear supports</button><p class="small muted">Changing height rebuilds the road and clears supports. Past tests stay in the Notebook.</p></div>`:''}<details class="task-story"><summary>Story, goal &amp; rules</summary><span class="bloom-tag">Skill: ${esc(BLOOM_MAP[level.id] || 'Create — satisfy combined constraints')}</span>
      <p class="eyebrow">Your challenge · Engage & explore</p><p class="lead">${esc(level.brief)}</p>
      <p><strong>Goal:</strong> ${esc(level.goal)}</p>
      <p><strong>Load:</strong> ${(level.traffic||[{mass:level.mass}]).map(v=>v.mass.toLocaleString('en')).join(' + ')} kg (${esc(level.cargo)}) · <strong>Span:</strong> ${level.span} m · <strong>Budget:</strong> ${level.budget} credits${brought ? ` + ${brought} brought forward` : ''}</p>
      <p><strong>Pass:</strong> continuous road · no broken members · maximum drop under ${Math.round((level.sagLimit || .12) * 100)} cm · cost within budget${level.chapter==='advanced'?' · every truck delivered'+(level.navigation?' · every boat lane clear':''):''}</p>
      </details><details class="task-materials"><summary>Materials and limits</summary><ul>${mats.map(m => `<li><strong>${esc(m.name)}</strong> · ${m.cost} credits/m · up to ${m.maxLen} m</li>`).join('')}</ul><p class="small">Road is prelaid, locked and included in the budget.</p></details>
      <p class="small muted task-assurance">Test your idea. Retries are free.</p></section>`;
  }
  function taskBlock2(level) {
    return `<section class="task-block concept-dialogue" data-task-block="2"><div class="concept-visual">${root.VisualGuide?root.VisualGuide.concept(level):""}<h3>${root.VisualGuide?root.VisualGuide.shortConcept(level):"What might explain the result?"}</h3></div><details class="concept-more"><summary>Hear the guide · investigate</summary><p>${CONCEPT_DIALOGUE_MAP[level.id] || esc(level.concept)}</p><p><strong>Try observing:</strong> ${esc(level.hints[0] || '')}</p><p class="small muted">Use your test evidence to investigate. The first break locates a failure; it does not establish the whole cause.</p></details></section>`;
  }
  function taskBlock3(level, savings) {
    let world = '';
    if (savings && level.id !== 'tabletop') {
      if (savings.carry > 0) world += `Deliver this bridge to carry <strong>${savings.carry} credits</strong> saved here into later crossings. `;
      if (savings.brought > 0) world += `You brought <strong>${savings.brought} saved credits</strong> into this crossing${savings.used ? `; this design uses ${savings.used} of them` : ''}. `;
      if (world) world += `After delivery, your reserve will be <strong>${savings.total} credits</strong>. ${level.id === 'finale' ? 'This is the final crossing of Chapter I. Chapter II follows.' : 'Earlier choices shape what reaches Riverbend.'}`;
    }
    return `<section class="task-block real-world" data-task-block="3"><div class="concept-visual">${root.VisualGuide?root.VisualGuide.concept(level):""}<h3>One crossing. Many designs.</h3></div>${savings&&level.id!=="tabletop"?`<p class="reserve-preview">After delivery: <strong>${savings.total} credits</strong> in reserve</p>`:""}<details class="transfer-more"><summary>Beyond this crossing</summary><p>${esc(REAL_WORLD_MAP[level.id] || '')}</p><p class="ill-structured">${esc(ILL_STRUCTURED)}</p>${world ? `<p class="world-state-hint">${world}</p>` : ''}</details></section>`;
  }
  // Compatibility for callers of the old task API: entry information only.
  const task = taskBlock1;
  root.BridgeContent = { esc, storyPanels, about, controls, task, taskBlock1, taskBlock2, taskBlock3, CONCEPT_DIALOGUE_MAP, REAL_WORLD_MAP, BLOOM_MAP };
})(typeof self !== "undefined" ? self : this);
