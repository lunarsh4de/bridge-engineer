"use strict";
(() => {
  const $ = (id) => document.getElementById(id),
    P = BridgePhysics,
    M = BridgeModel,
    L = BridgeLevels,
    E = BridgeProgress,
    C = BridgeContent,
    renderer = new BridgeEngine($("scene")),
    STORAGE = "bridge-engineer-workshop-v2",
    ONBOARDING = "bridge-engineer-onboarding-v1";
  const state = {
    screen: "home",
    prediction: "",
    recorded: false,
    level: L.levels[0],
    index: 0,
    editor: null,
    material: "road",
    tool: "build",
    mode: "build",
    world: null,
    paused: false,
    speed: 1,
    grid: true,
    forces: false,
    seed: null,
    preview: null,
    pointer: { x: 440, y: 430 },
    hoverNode: null,
    hoverMember: null,
    moving: null,
    keyboard: false,
    elapsed: 0,
    reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
    storageOK: true,
    sandbox: false,
    training: false,
    tested: false,
    tutorialStep: -1,
    trainingTarget: null,
    communityConnected: false,
    hintStage: 0,
    pendingBriefing: false,
  };
  let saved = E.empty(L.levels, L.sandbox),
    down = null,
    accumulator = 0,
    lastTime = 0,
    metricsAt = 0,
    noteTimer = null,
    modalFocus = null,
    selectFrom = "home",
    exploreAll = false,
    storyDone = null,
    transitionTimer = null;
  try {
    saved = E.normalize(
      JSON.parse(localStorage.getItem(STORAGE)),
      L.levels,
      L.sandbox,
    );
  } catch {
    state.storageOK = false;
  }
  const previewEditor = { design: L.starter(L.levels[0]) };
  const tutorial = [
    ["Choose Road.", "Select Road in the toolkit. Materials change what each member can do."],
    ["Connect the banks.", "Drag between the two orange anchors, or tap one anchor and then the other."],
    ["Choose Timber.", "Your guide adds a practice frame. Select Timber to finish its last connection."],
    ["Complete the triangle.", "Connect the two glowing joints to finish this frame. We added the other supports for practice."],
    ["Run a real test.", "Select Test crossing. The same physics used in every mission will run."],
    ["Return to the drawing.", "Watch the result, then select Edit design. Tests never erase your editable bridge."],
    ["Training complete.", "Now start with a clean campaign crossing and build your own solution."],
  ];
  function canBuild() {
    return (
      state.screen === "workshop" && state.mode === "build" && !$("modal").open
    );
  }
  function showScreen(screen) {
    state.screen = screen;
    document.body.dataset.screen = screen;
    for (const [id, visible] of [
      ["main-menu", screen === "home"],
      ["level-select", screen === "select"],
      ["play-ui", screen === "workshop"],
      ["workshop-nav", screen === "workshop"],
      ["play-nav", screen === "workshop"],
    ]) {
      $(id).hidden = !visible;
      $(id).inert = !visible;
    }
    $("scene").tabIndex = screen === "workshop" ? 0 : -1;
    $("final-report-screen").hidden = screen !== "report";
    $("final-report-screen").inert = screen !== "report";
    $("field-report").hidden = !saved.completed.some(Boolean);
    cancelPlacement();
    note("");
    renderTutorial();
    renderer.refreshViewport?.();
    if (screen === "workshop" && state.pendingBriefing && !state.training) {
      if (saved.visited && Number.isInteger(state.index)) {
        saved.visited[state.index] = true;
        save();
      }
      state.pendingBriefing = false;
      queueMicrotask(() => showTask("NEW CROSSING"));
    }
  }
  function learning(level = state.level) {
    if (typeof C.getLearning === "function") return C.getLearning(level) || {};
    return level?.learning || {
      delivery: level?.place ? `Reconnect ${level.place}.` : "Complete the delivery.",
      goal: level?.constraint || "Build a continuous road between both banks.",
      decision: level?.concept || "Choose a connected load path.",
      newConstraint: level?.newMaterial || "Use the available materials.",
      hints: [
        { kind: "observe", text: level?.hint || "Look for gaps and unsupported road joints." },
        { kind: "principle", text: level?.lesson || "Trace forces from the road to fixed supports." },
      ],
      consequence: `The route through ${level?.place || "Riverbend"} is open.`,
    };
  }
  function pulse(label) {
    clearTimeout(transitionTimer);
    $("transition-label").textContent = label;
    $("scene-transition").hidden = false;
    transitionTimer = setTimeout(() => ($("scene-transition").hidden = true), 430);
  }
  function hasOnboarded() {
    try {
      return localStorage.getItem(ONBOARDING) === "complete";
    } catch {
      return false;
    }
  }
  function markOnboarded() {
    try {
      localStorage.setItem(ONBOARDING, "complete");
    } catch {}
  }
  function showStory(onDone) {
    storyDone = onDone || null;
    $("story").hidden = false;
    $("story").inert = false;
    $("story-continue").focus({ preventScroll: true });
  }
  function closeStory() {
    $("story").hidden = true;
    $("story").inert = true;
    const done = storyDone;
    storyDone = null;
    done?.();
  }
  $("story-continue").onclick = closeStory;
  $("story-skip").onclick = closeStory;
  $("replay-story").onclick = () => showStory(() => $("start").focus());
  $("story").querySelectorAll("img").forEach((img) => {
    img.addEventListener("error", () => img.classList.add("broken-image"));
  });
  if (Array.isArray(C.storyPanels))
    $("story")
      .querySelectorAll("figcaption span")
      .forEach((caption, i) => {
        if (C.storyPanels[i]) caption.textContent = C.storyPanels[i];
      });
  if (L.sandbox?.truckMassOptions) {
    $("sandbox-load").innerHTML = L.sandbox.truckMassOptions
      .map(
        (mass) =>
          `<option value="${mass}">${mass.toLocaleString()} kg</option>`,
      )
      .join("");
    $("sandbox-load").value = String(L.sandbox.truckMass);
  }
  function escapeHTML(s) {
    return String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  }
  function save(userEdit = false) {
    if (state.training || state.level?.id === "training" || !state.editor)
      return;
    if (!state.sandbox) saved.level = state.index;
    saved.designs[String(state.index)] = structuredClone(state.editor.design);
    try {
      localStorage.setItem(STORAGE, JSON.stringify(saved));
      state.storageOK = true;
    } catch {
      state.storageOK = false;
    }
    if (userEdit) $("storage-status").hidden = state.storageOK;
  }
  function modal(title, body, eyebrow = "RIVERBEND WORKSHOP") {
    if (!$("modal").open) modalFocus = document.activeElement;
    cancelPlacement();
    if (state.world) {
      state.paused = true;
      accumulator = 0;
      controls();
    }
    $("modal-body").innerHTML =
      `<div class="eyebrow">${eyebrow}</div><h2 class="modal-title" id="modal-title">${title}</h2>${body}`;
    if (!$("modal").open) $("modal").showModal();
  }
  function closeModal() {
    $("modal").close();
  }
  $("close-modal").onclick = closeModal;
  $("modal").addEventListener("click", (e) => {
    if (e.target !== $("modal")) return;
    const r = $("modal").getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      closeModal();
  });
  $("modal").addEventListener("close", () => {
    lastTime = performance.now();
    accumulator = 0;
    if (modalFocus?.isConnected && !modalFocus.closest("[hidden]"))
      modalFocus.focus({ preventScroll: true });
  });
  document.addEventListener("visibilitychange", () => {
    lastTime = performance.now();
    accumulator = 0;
    cancelPlacement();
    if (document.hidden && state.world) {
      state.paused = true;
      controls();
    }
  });
  function note(message, error = false) {
    clearTimeout(noteTimer);
    $("instruction").textContent = message;
    $("instruction").hidden = !message;
    $("instruction").classList.toggle("error", error);
    if (message)
      noteTimer = setTimeout(
        () => {
          $("instruction").hidden = true;
        },
        error ? 6500 : 4200,
      );
  }
  function renderTutorial() {
    const active = state.tutorialStep >= 0;
    const visible = active && state.screen === "workshop";
    $("tutorial-coach").hidden = !visible;
    document.body.classList.toggle("tutorial-active", visible);
    if (active) document.body.dataset.tutorialStep = String(state.tutorialStep);
    else delete document.body.dataset.tutorialStep;
    if (!active) return;
    const [title, copy] = tutorial[state.tutorialStep];
    $("tutorial-title").textContent = title;
    $("tutorial-copy").textContent = copy;
    $("tutorial-progress").textContent =
      state.tutorialStep === tutorial.length - 1
        ? "DONE"
        : `${state.tutorialStep + 1} / ${tutorial.length - 1}`;
    $("tutorial-continue").hidden = state.tutorialStep !== tutorial.length - 1;
    $("tutorial-skip").hidden = state.tutorialStep === tutorial.length - 1;
  }
  function tutorialStep(step) {
    if (state.tutorialStep < 0 || step <= state.tutorialStep) return;
    state.tutorialStep = Math.min(step, tutorial.length - 1);
    renderTutorial();
  }
  function finishTraining() {
    markOnboarded();
    state.tutorialStep = -1;
    state.training = false;
    renderTutorial();
    enter(saved.level);
    showScreen("workshop");
    pulse("Opening your first crossing...");
    showTask("YOUR FIRST MISSION");
  }
  function beginTraining() {
    const base = L.levels[0];
    state.training = true;
    state.communityConnected = false;
    state.sandbox = false;
    state.index = 0;
    state.level = {
      ...base,
      id: "training",
      name: "Training Yard",
      place: "Training Yard",
      truckMass: 300,
      inventory: { road: 20, wood: 20, steel: 0, cable: 0 },
    };
    state.editor = new M.Editor(state.level, M.fresh(state.level));
    state.material = "wood";
    state.tool = "build";
    state.mode = "build";
    state.world = null;
    state.paused = false;
    state.speed = 1;
    state.tested = false;
    state.trainingTarget = null;
    state.pointer = { x: state.level.left, y: state.level.deckY };
    renderer.zoom = 1;
    cancelPlacement();
    hideFeedback();
    showScreen("workshop");
    $("mission-label").textContent = "Training Yard";
    $("span-value").textContent =
      (state.level.right - state.level.left) / 100 + " m";
    $("load-value").textContent = state.level.truckMass.toLocaleString() + " kg";
    $("sandbox-load-wrap").hidden = true;
    $("result-reference").hidden = true;
    $("result-compare").hidden = true;
    state.tutorialStep = 0;
    controls();
    renderTutorial();
    pulse("Setting up the training yard...");
  }
  $("tutorial-skip").onclick = finishTraining;
  $("tutorial-continue").onclick = finishTraining;
  function hideFeedback() {
    $("feedback-panel").hidden = true;
    $("simulation-panel").classList.remove("under-feedback");
  }
  function feedback(title, body, type = "observation") {
    const box = $("feedback-panel");
    box.hidden = false;
    box.className = "feedback panel " + type;
    $("feedback-title").textContent = title;
    $("feedback-body").textContent = body;
    $("feedback-label").textContent =
      type === "success"
        ? "CROSSING COMPLETE"
        : type === "failure"
          ? "A USEFUL FAILURE"
          : "FIELD OBSERVATION";
    $("next").hidden =
      type !== "success" || state.sandbox || state.training;
    $("next").textContent =
      !state.sandbox && state.index === L.levels.length - 1
        ? "Your field report →"
        : "Next crossing →";
    $("next").className = type === "success" ? "primary" : "small-button";
    $("result-edit").className = type === "failure" ? "primary" : "small-button";
    $("simulation-panel").classList.add("under-feedback");
  }
  function controls() {
    const used = M.usage(state.editor.design),
      running = state.mode !== "build";
    $("materials").innerHTML = Object.entries(P.MATERIALS)
      .filter(([key]) => state.level.inventory[key] > 0)
      .map(([key, m]) => {
        const i = Object.keys(P.MATERIALS).indexOf(key);
        const available = state.level.inventory[key] > 0;
        return `<button class="material ${state.material === key && state.tool === "build" ? "selected" : ""} ${available ? "" : "locked"}" data-material="${key}" draggable="${available && !running}" aria-pressed="${state.material === key && state.tool === "build"}" aria-label="${m.name}: ${available ? (state.level.inventory[key] - used[key]).toFixed(1) + " metres left" : "unlocks in mission 3"}" title="${escapeHTML(m.description)}. Maximum member length ${m.maxLength} m." ${!available || running ? "disabled" : ""}><span class="material-top"><span class="material-icon ${key}"></span><span class="material-key">${i + 1}</span></span><span class="material-name">${m.name}</span><span class="material-amount">${available ? Math.max(0, state.level.inventory[key] - used[key]).toFixed(1) + " / " + state.level.inventory[key] + " m" : "Mission 03"}</span></button>`;
      })
      .join("");
    for (const id of ["move", "erase", "clear"]) $(id).disabled = running;
    for (const id of ["move", "erase"]) {
      $(id).classList.toggle("active", state.tool === id && !running);
      $(id).setAttribute("aria-pressed", String(state.tool === id && !running));
    }
    $("undo").disabled = running || !state.editor.undoStack.length;
    $("redo").disabled = running || !state.editor.redoStack.length;
    $("test").disabled = running;
    $("notebook").disabled = state.training;
    $("gravity").textContent = running ? "Edit design" : "Self-weight";
    $("simulation-panel").hidden = !running;
    $("mode-text").textContent = running
      ? state.paused
        ? "EXPERIMENT PAUSED"
        : state.mode === "gravity"
          ? "GRAVITY LAB"
          : "CROSSING TEST"
      : "BUILD MODE";
    $("pause").disabled = !!state.world && state.world.status !== "running";
    $("pause").textContent = state.paused ? "Resume" : "Pause";
    $("speed").textContent = "Speed " + state.speed + "×";
    $("scene").style.cursor = running
      ? "default"
      : state.tool === "move"
        ? "grab"
        : state.tool === "erase"
          ? "not-allowed"
          : "crosshair";
  }
  function cancelPlacement() {
    state.seed = null;
    state.preview = null;
    state.moving = null;
    down = null;
    $("cancel-placement").hidden = true;
  }
  function enter(index) {
    state.training = false;
    state.sandbox = false;
    state.tutorialStep = -1;
    state.trainingTarget = null;
    state.index = index;
    const firstVisit = saved.visited?.[index] !== true;
    state.pendingBriefing = firstVisit;
    state.hintStage = 0;
    state.prediction = "";
    state.recorded = false;
    state.tested = (saved.records[index] || []).length > 0;
    state.level = L.levels[index];
    state.communityConnected = saved.completed[index] === true;
    state.editor = new M.Editor(state.level, saved.designs[index]);
    state.material = "road";
    state.tool = "build";
    state.mode = "build";
    state.world = null;
    state.paused = false;
    state.speed = 1;
    state.pointer = { x: state.level.left, y: state.level.deckY };
    state.hoverNode = null;
    state.hoverMember = null;
    renderer.zoom = 1;
    cancelPlacement();
    hideFeedback();
    $("mission-label").textContent = `${String(index + 1).padStart(2, "0")} / ${state.level.place}`;
    $("span-value").textContent =
      (state.level.right - state.level.left) / 100 + " m";
    $("load-value").textContent =
      state.level.truckMass.toLocaleString() + " kg";
    $("result-reward").hidden = true;
    $("result-reference").hidden = !state.tested;
    $("result-compare").hidden = false;
    $("sandbox-load-wrap").hidden = true;
    $("storage-status").hidden = true;
    $("objective-text").textContent = learning(state.level).goal || "Connect both banks with a usable road.";
    $("mission-objective").classList.toggle("delivered", saved.completed[index]);
    if (saved.completed[index]) $("objective-text").textContent = `Route open: ${learning(state.level).consequence || "delivery completed"}`;
    controls();
    note("");
    renderTutorial();
    save();
  }
  function enterSandbox() {
    if (!L.sandbox) return;
    state.training = false;
    state.sandbox = true;
    state.communityConnected = false;
    state.tutorialStep = -1;
    state.trainingTarget = null;
    state.index = "sandbox";
    state.pendingBriefing = false;
    state.hintStage = 0;
    state.prediction = "";
    state.recorded = false;
    state.tested = (saved.records.sandbox || []).length > 0;
    const load = Number($("sandbox-load").value) || L.sandbox.truckMass;
    state.level = { ...L.sandbox, truckMass: load };
    state.editor = new M.Editor(state.level, saved.designs.sandbox);
    state.material = "road";
    state.tool = "build";
    state.mode = "build";
    state.world = null;
    state.paused = false;
    state.speed = 1;
    state.pointer = { x: state.level.left, y: state.level.deckY };
    renderer.zoom = 1;
    cancelPlacement();
    hideFeedback();
    $("mission-label").textContent = "Sandbox / Free build";
    $("span-value").textContent =
      (state.level.right - state.level.left) / 100 + " m";
    $("load-value").textContent = load.toLocaleString() + " kg";
    $("result-reward").hidden = true;
    $("result-reference").hidden = true;
    $("result-compare").hidden = false;
    $("sandbox-load-wrap").hidden = false;
    $("sandbox-load").value = String(load);
    $("storage-status").hidden = true;
    $("objective-text").textContent = "Build freely, choose a load, and compare your tests.";
    controls();
    note("");
    renderTutorial();
    save();
  }
  $("sandbox-load").onchange = () => {
    if (!state.sandbox || state.mode !== "build") return;
    save();
    const design = structuredClone(state.editor.design);
    const load = Number($("sandbox-load").value);
    state.level = { ...L.sandbox, truckMass: load };
    state.editor = new M.Editor(state.level, design);
    $("load-value").textContent = load.toLocaleString() + " kg";
    controls();
    note(`Test load set to ${load.toLocaleString()} kg. Your design is unchanged.`);
  };
  function afterEdit(problem) {
    cancelPlacement();
    if (problem) {
      renderer.effect("reject");
      note(problem, true);
      controls();
      return false;
    }
    hideFeedback();
    state.prediction = "";
    save(true);
    controls();
    renderer.effect("place");
    note("");
    if (state.training) {
      if (state.tutorialStep === 1 && trainingRoadComplete()) {
        prepareTrainingFrame();
        tutorialStep(2);
      }
      if (state.tutorialStep === 3) {
        if (trainingMemberComplete()) tutorialStep(4);
        else note("Connect the two highlighted joints to complete the triangle.", true);
      }
    }
    return true;
  }
  function connectedByMaterial(material, from, to) {
    const adjacency = new Map();
    for (const edge of state.editor.design.members) {
      if (edge.material !== material) continue;
      if (!adjacency.has(edge.a)) adjacency.set(edge.a, []);
      if (!adjacency.has(edge.b)) adjacency.set(edge.b, []);
      adjacency.get(edge.a).push(edge.b);
      adjacency.get(edge.b).push(edge.a);
    }
    const seen = new Set([from]), queue = [from];
    while (queue.length) {
      const id = queue.shift();
      if (id === to) return true;
      for (const next of adjacency.get(id) || [])
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
    }
    return false;
  }
  function trainingRoadComplete() {
    return connectedByMaterial("road", "left", "right");
  }
  function prepareTrainingFrame() {
    const reference = L.starter(state.level),
      points = new Map(reference.nodes.map((n) => [n.id, n]));
    const missing = [...reference.members].reverse().find((edge) => {
      const a = points.get(edge.a), b = points.get(edge.b);
      return edge.material === "wood" && a && b && a.y !== b.y;
    });
    if (!missing) return;
    state.trainingTarget = {
      a: { x: points.get(missing.a).x, y: points.get(missing.a).y },
      b: { x: points.get(missing.b).x, y: points.get(missing.b).y },
    };
    reference.members = reference.members.filter((edge) => edge.id !== missing.id);
    state.editor.commit(reference);
    controls();
    renderer.effect("place", state.trainingTarget.a);
  }
  function trainingMemberComplete() {
    const target = state.trainingTarget;
    if (!target) return false;
    const points = new Map(state.editor.design.nodes.map((n) => [n.id, n]));
    return state.editor.design.members.some((edge) => {
      if (edge.material !== "wood") return false;
      const a = points.get(edge.a), b = points.get(edge.b);
      const near = (p, q) => Math.hypot(p.x - q.x, p.y - q.y) < 2;
      return (near(a, target.a) && near(b, target.b)) ||
        (near(a, target.b) && near(b, target.a));
    });
  }
  function chooseMaterial(key) {
    if (!canBuild() || !state.level.inventory[key]) return;
    state.material = key;
    state.tool = "build";
    cancelPlacement();
    controls();
    note("");
    if (state.training && key === "road" && state.tutorialStep === 0)
      tutorialStep(1);
    if (state.training && key === "wood" && state.tutorialStep === 2)
      tutorialStep(3);
  }
  $("materials").onclick = (e) => {
    const b = e.target.closest("[data-material]");
    if (b && !b.disabled) chooseMaterial(b.dataset.material);
  };
  $("materials").addEventListener("dragstart", (e) => {
    const b = e.target.closest("[data-material]");
    if (!b || b.disabled) {
      e.preventDefault();
      return;
    }
    chooseMaterial(b.dataset.material);
    e.dataTransfer.setData("text/plain", b.dataset.material);
    e.dataTransfer.effectAllowed = "copy";
    note(
      "Drop a member anywhere in the build area. Move its joints to reshape it.",
    );
  });
  $("scene").addEventListener("dragover", (e) => {
    if (canBuild()) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  });
  $("scene").addEventListener("drop", (e) => {
    e.preventDefault();
    if (!canBuild()) return;
    const material = e.dataTransfer.getData("text/plain");
    if (!P.MATERIALS[material] || !state.level.inventory[material]) return;
    const p = snap(renderer.toWorld(e.clientX, e.clientY));
    state.material = material;
    afterEdit(
      state.editor.add(
        { x: p.x - 75, y: p.y },
        { x: p.x + 75, y: p.y },
        material,
      ),
    );
  });
  function hitNode(p) {
    let best = null,
      dist = Math.max(18, 18 / renderer.view.scale);
    for (const n of state.editor.design.nodes) {
      const d = Math.hypot(n.x - p.x, n.y - p.y);
      if (d < dist) {
        best = n;
        dist = d;
      }
    }
    return best;
  }
  function snap(p) {
    const n = hitNode(p);
    return n
      ? { x: n.x, y: n.y }
      : {
          x: state.level.left + Math.round((p.x - state.level.left) / 25) * 25,
          y:
            state.level.deckY + Math.round((p.y - state.level.deckY) / 25) * 25,
        };
  }
  function segmentDistance(p, a, b) {
    const dx = b.x - a.x,
      dy = b.y - a.y,
      L = dx * dx + dy * dy,
      t = L
        ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / L))
        : 0;
    return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
  }
  function hitMember(p) {
    return state.editor.design.members
      .slice()
      .reverse()
      .find((e) => {
        const a = state.editor.design.nodes.find((n) => n.id === e.a),
          b = state.editor.design.nodes.find((n) => n.id === e.b);
        return segmentDistance(p, a, b) < Math.max(9, 5 / renderer.view.scale);
      });
  }
  function addMember(a, b) {
    if (Math.hypot(a.x - b.x, a.y - b.y) < 24) {
      afterEdit("Drag farther, or click a second position.");
      return;
    }
    // A long road gesture becomes joined deck sections in one undoable operation.
    if (state.material === "road" && Math.hypot(a.x - b.x, a.y - b.y) > 210) {
      const count = Math.ceil(Math.hypot(a.x - b.x, a.y - b.y) / 200),
        draft = new M.Editor(state.level, state.editor.design);
      for (let i = 0; i < count; i++) {
        const p = {
            x: a.x + ((b.x - a.x) * i) / count,
            y: a.y + ((b.y - a.y) * i) / count,
          },
          q = {
            x: a.x + ((b.x - a.x) * (i + 1)) / count,
            y: a.y + ((b.y - a.y) * (i + 1)) / count,
          };
        const problem = draft.add(p, q, "road");
        if (problem) {
          afterEdit(problem);
          return;
        }
      }
      afterEdit(state.editor.commit(draft.design));
    } else afterEdit(state.editor.add(a, b, state.material));
  }
  function inspectMember(e) {
    const p = renderer.toWorld(e.clientX, e.clientY),
      w = state.world;
    const member = w?.members.find((edge) => {
      const a = w.byId.get(edge.a),
        b = w.byId.get(edge.b);
      return (
        segmentDistance(
          p,
          { x: a.x * 100, y: a.y * 100 },
          { x: b.x * 100, y: b.y * 100 },
        ) < Math.max(10, 7 / renderer.view.scale)
      );
    });
    if (member) {
      state.hoverMember = member.id;
      note(
        `${P.MATERIALS[member.material].name} · ${member.length.toFixed(2)} m · ${member.broken ? "broken" : Math.abs(member.force) < 10 ? (member.material === "cable" ? "slack · tension only" : "nearly unloaded") : (Math.abs(member.force) / 1000).toFixed(1) + " kN " + (member.force > 0 ? "tension" : "compression")}`,
      );
    } else state.hoverMember = null;
  }
  const canvas = $("scene");
  renderer.onPointer("pointerdown", (e) => {
    if (
      state.screen === "workshop" &&
      state.mode !== "build" &&
      !$("modal").open
    ) {
      inspectMember(e);
      return;
    }
    if (e.button !== 0 || !canBuild() || down) return;
    e.preventDefault();
    canvas.focus({ preventScroll: true });
    state.keyboard = false;
    const raw = renderer.toWorld(e.clientX, e.clientY),
      p = snap(raw);
    down = {
      x: e.clientX,
      y: e.clientY,
      start: state.seed || p,
      raw,
      pointerId: e.pointerId,
    };
    $("cancel-placement").hidden = false;
    state.pointer = p;
    if (state.tool === "move") {
      const n = hitNode(raw);
      if (n && !n.fixed) {
        state.moving = { id: n.id, start: { x: n.x, y: n.y } };
        canvas.style.cursor = "grabbing";
      } else
        note(
          "Drag a free joint to move it. The orange bank anchors stay fixed.",
        );
    }
  });
  renderer.onPointer("pointermove", (e) => {
    if (
      state.screen !== "workshop" ||
      $("modal").open ||
      (down && down.pointerId !== e.pointerId)
    )
      return;
    if (state.mode !== "build") {
      inspectMember(e);
      return;
    }
    const raw = renderer.toWorld(e.clientX, e.clientY);
    state.pointer = snap(raw);
    state.hoverNode = hitNode(raw)?.id || null;
    state.hoverMember = hitMember(raw)?.id || null;
    if (state.moving) {
      state.pointer = {
        x: state.level.left + Math.round((raw.x - state.level.left) / 25) * 25,
        y:
          state.level.deckY + Math.round((raw.y - state.level.deckY) / 25) * 25,
      };
    } else if (state.tool === "build" && (state.seed || down))
      state.preview = { start: state.seed || down.start, end: state.pointer };
  });
  renderer.onPointer("pointerup", (e) => {
    if (!down || !canBuild() || down.pointerId !== e.pointerId) return;
    const bounds = canvas.getBoundingClientRect();
    if (
      e.clientX < bounds.left ||
      e.clientX > bounds.right ||
      e.clientY < bounds.top ||
      e.clientY > bounds.bottom
    ) {
      cancelPlacement();
      note("Placement cancelled.");
      return;
    }
    const raw = renderer.toWorld(e.clientX, e.clientY),
      p = snap(raw),
      moved = Math.hypot(e.clientX - down.x, e.clientY - down.y) > 7;
    const start = down.start;
    down = null;
    if (state.tool === "erase") {
      const beam = hitMember(raw);
      if (beam) afterEdit(state.editor.remove(beam.id));
      else note("Click a member to return its material.");
      return;
    }
    if (state.tool === "move") {
      if (state.moving) {
        const id = state.moving.id,
          target = state.pointer;
        state.moving = null;
        afterEdit(state.editor.move(id, target));
      }
      return;
    }
    if (moved || state.seed) {
      addMember(start, p);
    } else {
      state.seed = p;
      state.preview = { start: p, end: p };
      note(
        "Choose a second position, or drag from this point. Escape cancels.",
      );
    }
  });
  renderer.onPointer("pointercancel", () => {
    if (!down && !state.seed && !state.moving) return;
    cancelPlacement();
    canvas.style.cursor = state.tool === "move" ? "grab" : "crosshair";
  });
  $("cancel-placement").onclick = () => {
    cancelPlacement();
    note("Placement cancelled.");
  };
  canvas.addEventListener("pointercancel", () => {
    cancelPlacement();
    controls();
  });
  // Phaser handles touchend after native implicit pointer capture is released.
  // Cancelling on lostpointercapture would discard every ordinary touch tap.
  // Actual cancellation is handled by pointercancel / pointerupoutside above.
  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (!canBuild()) return;
    cancelPlacement();
    const beam = hitMember(renderer.toWorld(e.clientX, e.clientY));
    if (beam) afterEdit(state.editor.remove(beam.id));
  });
  for (const id of ["move", "erase"])
    $(id).onclick = () => {
      if (!canBuild()) return;
      state.tool = state.tool === id ? "build" : id;
      cancelPlacement();
      controls();
      note(
        id === "move"
          ? "Drag any free joint. Attached members move with it."
          : "Click a member to remove it and reuse its material.",
      );
    };
  $("undo").onclick = () => {
    if (canBuild() && state.editor.undo()) afterEdit(null);
  };
  $("redo").onclick = () => {
    if (canBuild() && state.editor.redo()) afterEdit(null);
  };
  function clearDesign() {
    modal(
      "Restart this bridge?",
      '<p>Return every placed member to the toolkit. Restart is one undoable edit, and completed missions stay recorded.</p><div class="notebook-actions"><button class="small-button" id="keep-design">Keep building</button><button class="primary" id="confirm-clear">Restart bridge</button></div>',
    );
    $("keep-design").onclick = closeModal;
    $("confirm-clear").onclick = () => {
      closeModal();
      afterEdit(state.editor.commit(M.fresh(state.level)));
    };
  }
  $("clear").onclick = clearDesign;
  function loadStarter() {
    if (!state.tested) {
      note("Run one of your own tests before opening the reference design.", true);
      return;
    }
    const apply = () => {
      closeModal();
      afterEdit(state.editor.commit(L.starter(state.level)));
      note(
        "Reference loaded as one reversible edit. It is one possible design, not an optimal answer.",
      );
    };
    if (state.editor.design.members.length) {
      modal(
        "Inspect one possible design?",
        `<p>The reference replaces this design as one reversible edit. Undo restores your work. It is one example to test, never a claim of an optimal bridge.</p>${C.debrief ? C.debrief(state.level) : ""}<button id="confirm-starter" class="primary">Load reference design</button>`,
      );
      $("confirm-starter").onclick = () => {
        apply();
      };
    } else apply();
  }
  function startExperiment(vehicle) {
    if (!canBuild()) return;
    if (state.training && (!vehicle || state.tutorialStep !== 4)) {
      note("Complete the highlighted training step before testing.", true);
      return;
    }
    if (!state.editor.design.members.length) {
      note("Place a road or member first.", true);
      return;
    }
    cancelPlacement();
    hideFeedback();
    renderer.effect("start");
    state.mode = vehicle ? "crossing" : "gravity";
    state.world = new P.World(state.editor.design, state.level, { vehicle });
    state.recorded = false;
    $("result-reward").hidden = true;
    state.paused = false;
    state.speed = 1;
    accumulator = 0;
    lastTime = performance.now();
    controls();
    note(
      vehicle
        ? "The bridge settles under its own weight before the delivery starts."
        : "Gravity is on. Unanchored members fall; connected members transfer their weight.",
    );
    if (vehicle && !state.world.route)
      note(
        "The road is not connected yet. Watch what happens at the gap, then return to build.",
      );
    if (state.training && vehicle && state.tutorialStep === 4) tutorialStep(5);
  }
  function edit() {
    if (
      state.training &&
      state.tutorialStep === 5 &&
      state.world?.status === "running"
    ) {
      note("Let the training test finish so you can observe its result.", true);
      return;
    }
    state.mode = "build";
    state.world = null;
    state.paused = false;
    accumulator = 0;
    cancelPlacement();
    hideFeedback();
    controls();
    note(
      "Back to your saved design. Adjust the structure and run the same experiment again.",
    );
    if (state.training && state.tutorialStep === 5) tutorialStep(6);
  }
  $("gravity").onclick = () =>
    state.mode === "build" ? startExperiment(false) : edit();
  $("test").onclick = () => startExperiment(true);
  $("back-build").onclick = edit;
  $("result-edit").onclick = edit;
  $("result-reference").onclick = () => {
    edit();
    loadStarter();
  };
  $("dismiss-feedback").onclick = hideFeedback;
  $("pause").onclick = () => {
    if (!state.world || state.world.status !== "running") return;
    state.paused = !state.paused;
    controls();
  };
  $("speed").onclick = () => {
    state.speed = state.speed === 1 ? 0.5 : state.speed === 0.5 ? 2 : 1;
    controls();
  };
  $("grid").onclick = () => {
    state.grid = !state.grid;
    $("grid").classList.toggle("active", state.grid);
    $("grid").setAttribute("aria-pressed", String(state.grid));
  };
  $("stress").onclick = () => {
    state.forces = !state.forces;
    $("stress").classList.toggle("active", state.forces);
    $("stress").setAttribute("aria-pressed", String(state.forces));
  };
  $("zoom-in").onclick = () =>
    (renderer.zoom = Math.min(1.5, renderer.zoom + 0.1));
  $("zoom-out").onclick = () =>
    (renderer.zoom = Math.max(0.65, renderer.zoom - 0.1));
  function captureEvidence(reason) {
    if (state.recorded) return;
    state.tested = true;
    $("result-reference").hidden = state.sandbox || state.training;
    if (state.training) {
      state.recorded = true;
      return;
    }
    const result = E.record(
      saved,
      state.index,
      state.level,
      state.editor.design,
      state.world,
      state.mode,
      state.prediction,
      reason,
    );
    state.recorded = true;
    $("result-reward").hidden = !result.saver;
    $("result-reward").textContent = result.saver
      ? "Material saver · a lower-cost successful design"
      : "";
    save(true);
  }
  function experimentResult() {
    const w = state.world;
    let reason;
    state.tested = true;
    $("result-reference").hidden = state.sandbox || state.training;
    if (w.status === "passed") {
      renderer.effect("success");
      if (!state.sandbox && !state.training) {
        saved.completed[state.index] = true;
        if (saved.delivered) saved.delivered[state.index] = true;
        state.communityConnected = true;
      }
      reason = `Maximum deck drop: ${(w.maxSag * 100).toFixed(1)} cm. No member failed.`;
      if (!state.training && !state.sandbox && C.transition) {
        const next = L.levels[state.index + 1] || null;
        reason += " " + C.transition(state.level, next).replace(/<[^>]+>/g, "");
      }
      const consequence = learning(state.level).consequence;
      if (consequence) reason += " " + consequence;
      feedback(learning(state.level).success?.title || "Crossing complete.", reason, "success");
    } else {
      const failureGuide = learning(state.level).failure;
      reason = w.events.includes(
        "The simulation could not resolve this design.",
      )
        ? "The simulation could not resolve this design. Your editable bridge is safe; this is not a learning assessment."
        : w.firstBreak
          ? `${P.MATERIALS[w.firstBreak.material].name} failed in ${w.firstBreak.force > 0 ? "tension" : "compression"} at ${w.firstBreak.time.toFixed(1)} s. Inspect the highlighted member and its load path.`
          : !w.route
            ? "Road endpoints do not form a continuous route between the banks. Find the gap, then edit your design."
            : `Maximum deck drop: ${(w.maxSag * 100).toFixed(1)} cm. ${failureGuide?.next || "Compare a different support arrangement."}`;
      if (failureGuide?.body) reason += " " + failureGuide.body;
      feedback(failureGuide?.title || "A clue for your next design.", reason, "failure");
      if (w.firstBreak) state.hoverMember = w.firstBreak.id;
    }
    if (!w.events.includes("The simulation could not resolve this design."))
      captureEvidence(reason);
    state.paused = true;
    controls();
    note("");
  }

  function designSketch(design, level, className = "record-design") {
    const points = new Map(design.nodes.map((n) => [n.id, n]));
    const colors = {
      road: "#344f45",
      wood: "#b07843",
      steel: "#557f87",
      cable: "#687e70",
    };
    const lines = design.members
      .map((e) => {
        const a = points.get(e.a),
          b = points.get(e.b);
        return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${colors[e.material]}" stroke-width="${e.material === "cable" ? 5 : 10}" />`;
      })
      .join("");
    const piers = (level.piers || [])
      .map(
        (pier) =>
          `<path d="M${pier.x - 18} ${pier.y + 8}H${pier.x + 18}L${pier.x + 24} 650H${pier.x - 24}Z" fill="#668174"/><rect x="${pier.x - 27}" y="${pier.y}" width="54" height="13" rx="3" fill="#81978a"/>`,
      )
      .join("");
    return `<svg class="${className}" viewBox="${level.left - 80} 200 ${level.right - level.left + 160} 460" role="img" aria-label="Bridge design diagram"><path d="M${level.left - 80} 440H${level.left}V650H${level.left - 80}M${level.right + 80} 440H${level.right}V650H${level.right + 80}" fill="#719482"/>${piers}${lines}<circle cx="${level.left}" cy="430" r="10" fill="#edb578"/><circle cx="${level.right}" cy="430" r="10" fill="#edb578"/></svg>`;
  }
  function showMissions() {
    if (state.screen !== "select") selectFrom = state.screen;
    if (state.world) {
      state.paused = true;
      accumulator = 0;
    }
    save();
    const campaignCards = L.levels
      .map((level, i) => {
        const locked = i > 0 && !saved.completed[i - 1] && !saved.completed[i];
        return `<button class="level-card ${locked && !exploreAll ? "locked" : ""}" data-mission="${i}">${designSketch(L.starter(level), level, "card-sketch")}<span class="card-body"><span class="card-number"><span>${String(i + 1).padStart(2, "0")}</span><span>${saved.completed[i] ? "COMPLETE" : locked && !exploreAll ? "LOCKED" : exploreAll && locked ? "EXPLORE" : "READY"}</span></span><strong>${level.place}</strong><small>${(level.right - level.left) / 100} m · ${level.truckMass.toLocaleString()} kg</small><small>${level.newMaterial}</small><span class="card-action">${locked && !exploreAll ? "Preview crossing" : "Build here →"}</span></span></button>`;
      })
      .join("");
    const sandboxCard = L.sandbox
      ? `<button class="level-card sandbox-card" data-sandbox="true">${designSketch(L.starter(L.sandbox), L.sandbox, "card-sketch")}<span class="card-body"><span class="card-number"><span>FREE BUILD</span><span>ALWAYS OPEN</span></span><strong>${L.sandbox.place || "Riverbend Lab"}</strong><small>Adjustable load · generous material supply</small><small>Does not affect campaign completion</small><span class="card-action">Open sandbox →</span></span></button>`
      : "";
    $("level-cards").innerHTML = campaignCards + sandboxCard;
    $("route-progress").innerHTML = `<span class="eyebrow">RIVERBEND ROUTE</span><div class="route-stops">${L.levels.map((level, i) => { const status = saved.completed[i] ? "delivered" : i === 0 || saved.completed[i - 1] ? "ready" : "locked"; return `<span class="route-stop ${status} ${saved.level === i ? "current" : ""}" aria-label="${escapeHTML(level.place)}: ${status}"><b>${i + 1}</b><small>${escapeHTML(level.place)}</small><em>${status}</em></span>`; }).join("")}</div>`;
    $("explore-toggle").setAttribute("aria-pressed", String(exploreAll));
    $("explore-toggle").textContent = exploreAll
      ? "Return to campaign order"
      : "Explore all levels";
    showScreen("select");
    $("level-cards")
      .querySelectorAll("[data-mission]")
      .forEach(
        (button) =>
          (button.onclick = () => {
            const i = Number(button.dataset.mission);
            if (
              i &&
              !saved.completed[i - 1] &&
              !saved.completed[i] &&
              !exploreAll
            ) {
              modal(
                L.levels[i].name,
                `${C.task(L.levels[i])}<p>Complete crossing ${i} first, or choose Explore all levels on the selection screen for independent practice.</p>`,
                "CROSSING PREVIEW",
              );
            } else {
              enter(i);
              showScreen("workshop");
              $("scene").focus({ preventScroll: true });
            }
          }),
      );
    const sandboxButton = $("level-cards").querySelector("[data-sandbox]");
    if (sandboxButton)
      sandboxButton.onclick = () => {
        enterSandbox();
        showScreen("workshop");
        pulse("Opening free build...");
        $("scene").focus({ preventScroll: true });
      };
  }
  $("start").onclick = () => {
    if (hasOnboarded()) {
      enter(saved.level);
      showScreen("workshop");
      pulse("Opening crossing...");
      $("scene").focus({ preventScroll: true });
    } else showStory(beginTraining);
  };
  $("select-level").onclick = showMissions;
  $("free-build").onclick = () => {
    enterSandbox();
    showScreen("workshop");
    pulse("Opening free build...");
    $("scene").focus({ preventScroll: true });
  };
  $("missions").onclick = showMissions;
  $("selection-back").onclick = () => {
    showScreen(selectFrom);
    controls();
  };
  $("explore-toggle").onclick = () => {
    exploreAll = !exploreAll;
    showMissions();
  };
  $("home").onclick = () => {
    if (state.training || state.level?.id === "training") {
      state.tutorialStep = -1;
      state.trainingTarget = null;
      state.training = false;
      enter(saved.level);
    } else {
      save();
      edit();
    }
    showScreen("home");
    $("start").focus();
  };
  function showTask(eyebrow = state.level.place.toUpperCase()) {
    const guide = learning(state.level);
    const firstBrief = eyebrow === "NEW CROSSING" || eyebrow === "YOUR FIRST MISSION";
    const compact = `<div class="mission-brief"><p>${escapeHTML(guide.delivery || "Complete this crossing.")}</p><div class="brief-chips"><span>${(state.level.right - state.level.left) / 100} m span</span><span>${state.level.truckMass.toLocaleString()} kg load</span><span>Drop below 12 cm</span></div><p><strong>Your decision:</strong> ${escapeHTML(guide.decision || "Trace a continuous load path.")}</p><details><summary>New constraint</summary><p>${escapeHTML(guide.newConstraint || guide.goal || "Use the available materials.")}</p></details></div>`;
    modal(
      state.level.name,
      `${firstBrief ? compact : C.task(state.level)}<div class="brief-action"><button id="begin-building" class="primary">Build my bridge →</button></div>`,
      eyebrow,
    );
    $("begin-building").onclick = closeModal;
  }
  function showFinalReport() {
    const completeCount = saved.completed.filter(Boolean).length;
    const allComplete = completeCount === L.levels.length;
    $("final-report-title").textContent = allComplete ? "Riverbend, reconnected." : `${completeCount} of ${L.levels.length} crossings connected.`;
    $("final-report-subtitle").textContent = allComplete ? "Your tested structures opened the full community route." : "Your completed deliveries remain open; continue the route when ready.";
    $("report-route-summary").innerHTML = `<div class="route-progress"><span class="eyebrow">${allComplete ? "ALL EIGHT DELIVERIES" : `${completeCount} DELIVERIES COMPLETE`}</span><div class="route-stops">${L.levels.map((level, i) => { const status = saved.completed[i] ? "delivered" : i === 0 || saved.completed[i - 1] ? "ready" : "locked"; return `<span class="route-stop ${status} ${saved.level === i ? "current" : ""}"><b>${i + 1}</b><small>${escapeHTML(level.place)}</small><em>${status}</em></span>`; }).join("")}</div></div>`;
    $("report-crossings").innerHTML = L.levels.map((level, i) => {
      const passed = [...(saved.records[i] || [])].reverse().find((r) => r.result === "passed" && r.mode === "crossing");
      const completed = saved.completed[i];
      const unlocked = i === 0 || saved.completed[i - 1] || completed || exploreAll;
      return `<article class="report-crossing ${unlocked ? "" : "locked"}"><span class="eyebrow">CROSSING ${String(i + 1).padStart(2, "0")}</span><h3>${escapeHTML(level.place)}</h3>${passed ? designSketch(passed.design, level) : '<div class="report-no-design">No passing test retained</div>'}<p>${passed ? `${(passed.drop * 100).toFixed(1)} cm maximum drop · ${passed.broken} broken · ${passed.cost.toFixed(1)} credits` : completed ? "Completion is saved; no passing measurements are retained." : "Awaiting delivery."}</p>${completed ? `<p>${escapeHTML(learning(level).consequence || "Community route restored.")}</p>` : ""}<button class="small-button" data-improve="${i}" ${unlocked ? "" : "disabled"}>${completed ? "Improve" : unlocked ? "Build" : "Locked"}</button></article>`;
    }).join("");
    showScreen("report");
    $("report-crossings").querySelectorAll("[data-improve]").forEach((button) => button.onclick = () => { enter(Number(button.dataset.improve)); showScreen("workshop"); });
  }
  $("field-report").onclick = showFinalReport;
  $("report-menu").onclick = () => showScreen("home");
  $("report-improve").onclick = showMissions;
  $("report-free-build").onclick = () => $("free-build").click();
  $("task").onclick = () => showTask();
  $("hint").onclick = () => {
    const text = typeof C.hint === "function"
      ? C.hint(state.level, Math.min(state.hintStage, 1))
      : learning(state.level).hints?.[Math.min(state.hintStage, 1)]?.text;
    const label = state.hintStage++ === 0 ? "Observe" : "Principle";
    if (text) note(`${label}: ${text}`);
  };
  $("next").onclick = () => {
    if (state.world?.status !== "passed" || state.sandbox || state.training)
      return;
    if (state.index < L.levels.length - 1) {
      enter(state.index + 1);
      showScreen("workshop");
      pulse("Opening the next crossing...");
      return;
    }
    showFinalReport();
  };
  function showHelp(tab = "controls") {
    const tabs = {
      controls: "Controls",
      structures: "Structures",
      cases: "Real bridges",
      settings: "Settings",
    };
    const settings = `<h3>Your workshop</h3><div class="notebook-actions"><button id="sound" class="small-button" aria-pressed="${renderer.muted}">${renderer.muted ? "Enable sound" : "Mute sound"}</button><button id="fullscreen" class="small-button">${document.fullscreenElement ? "Exit full screen" : "Full screen"}</button><button id="replay-training" class="small-button">Replay training</button></div><h3>Keep your work</h3><p>${state.storageOK ? "Campaign and sandbox designs, plus the last eight distinct tests per crossing, are saved in this browser." : "Browser storage is unavailable. Keep this tab open, or export your work before leaving."}</p><div class="notebook-actions"><button id="export" class="small-button">Export progress</button><button id="import" class="small-button">Import progress</button></div><p>Import replaces local designs and records after confirmation. An exported file lets you move your work to another computer.</p><details><summary>Reset workshop</summary><p>Remove all saved designs, test records and completed crossings.</p><button id="reset-progress" class="small-button">Reset all progress</button></details>`;
    modal(
      "Field guide",
      `<nav class="guide-tabs" aria-label="Help sections">${Object.entries(tabs)
        .map(
          ([key, label]) =>
            `<button data-guide="${key}" ${key === tab ? 'aria-current="page"' : ""}>${label}</button>`,
        )
        .join(
          "",
        )}</nav>${tab === "controls" ? C.controls : tab === "structures" ? C.structures(state.level, state.tested) : tab === "cases" ? C.cases(state.level) : settings}`,
      "OPEN WHEN YOU NEED IT",
    );
    $("modal-body")
      .querySelectorAll("[data-guide]")
      .forEach((b) => (b.onclick = () => showHelp(b.dataset.guide)));
    if (tab === "structures") {
      if ($("starter")) {
        $("starter").disabled = state.mode !== "build";
        $("starter").onclick = loadStarter;
      }
    }
    if (tab === "settings") {
      $("sound").onclick = () => {
        renderer.toggleSound();
        showHelp("settings");
      };
      $("fullscreen").onclick = async () => {
        try {
          if (document.fullscreenElement) await document.exitFullscreen();
          else await document.documentElement.requestFullscreen();
        } catch {
          note("Full screen is unavailable in this browser.", true);
        }
        showHelp("settings");
      };
      $("export").onclick = () => {
        save();
        const blob = new Blob(
          [
            JSON.stringify(
              { format: "riverbend-progress", data: saved },
              null,
              2,
            ),
          ],
          { type: "application/json" },
        );
        const url = URL.createObjectURL(blob),
          link = document.createElement("a");
        link.href = url;
        link.download = "riverbend-progress.json";
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      };
      $("import").onclick = () => $("import-file").click();
      $("replay-training").onclick = () => {
        closeModal();
        beginTraining();
      };
      $("reset-progress").onclick = () => {
        modal(
          "Start a new journey?",
          '<p>This removes all local designs, test records and completions. Export first if you want a backup.</p><button id="confirm-reset" class="primary">Reset workshop</button>',
        );
        $("confirm-reset").onclick = () => {
          saved = E.empty(L.levels, L.sandbox);
          closeModal();
          enter(0);
          showScreen("home");
        };
      };
    }
  }
  $("help").onclick = () => showHelp();
  $("about").onclick = () =>
    modal(
      "Engineering through play.",
      C.about,
      "STEM EDUCATION · COURSE PROJECT",
    );
  $("import-file").onchange = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      if (file.size > 2000000) throw new Error("File is too large.");
      const value = JSON.parse(await file.text());
      if (
        value.format !== "riverbend-progress" ||
        !value.data ||
        !value.data.designs ||
        !Array.isArray(value.data.completed)
      )
        throw new Error("Choose a Riverbend progress export.");
      const incoming = E.normalize(value.data, L.levels, L.sandbox);
      // Reject an invalid imported design rather than silently discarding the player's work.
      for (const [key, design] of Object.entries(value.data.designs)) {
        const level = key === "sandbox" ? L.sandbox : L.levels[key];
        if (!level || M.validate(design, level))
          throw new Error("This file contains an invalid design.");
      }
      modal(
        "Replace local progress?",
        '<p>This imports the selected file and replaces your current designs, records and completions.</p><button id="confirm-import" class="primary">Import progress</button>',
      );
      $("confirm-import").onclick = () => {
        saved = incoming;
        closeModal();
        enter(saved.level);
        showScreen("workshop");
        note("Progress imported.");
      };
    } catch (error) {
      modal(
        "Could not import",
        `<p class="error-note">${escapeHTML(error.message)}</p><p>Your current designs have not changed.</p>`,
      );
    }
  };
  function showNotebook() {
    const records = saved.records[state.index] || [],
      pair = E.comparison(records);
    const testedLoad = (record) => {
      try {
        return JSON.parse(record.conditions)[5];
      } catch {
        return state.level.truckMass;
      }
    };
    const metric = (r) =>
      `<tr><th>Result</th><td>${r.previous.result}</td><td>${r.latest.result}</td></tr><tr><th>Max. drop</th><td>${(r.previous.drop * 100).toFixed(1)} cm</td><td>${(r.latest.drop * 100).toFixed(1)} cm</td></tr><tr><th>Broken members</th><td>${r.previous.broken}</td><td>${r.latest.broken}</td></tr><tr><th>Material cost</th><td>${r.previous.cost.toFixed(1)}</td><td>${r.latest.cost.toFixed(1)}</td></tr>`;
    const comparison = pair
      ? `<h3>Same conditions. Different designs.</h3><p>${pair.latest.mode === "crossing" ? Number(testedLoad(pair.latest)).toLocaleString() + " kg crossing" : "15-second self-weight observation"} · ${(state.level.right - state.level.left) / 100} m span</p><div class="modal-grid"><div><strong>Earlier design</strong>${designSketch(pair.previous.design, state.level)}</div><div><strong>Latest design</strong>${designSketch(pair.latest.design, state.level)}</div></div><table class="compare-table"><thead><tr><th>Measure</th><th>Earlier</th><th>Latest</th></tr></thead><tbody>${metric(pair)}</tbody></table><p>${Math.abs(pair.dropDelta * 100).toFixed(1)} cm ${pair.dropDelta > 0 ? "more" : "less"} maximum drop; ${Math.abs(pair.costDelta).toFixed(1)} ${pair.costDelta > 0 ? "more" : "fewer"} material credits. Several changes may affect this result: it does not establish a single cause.</p>`
      : `<p>Save a test, change your design, then repeat the same kind of test. A comparison appears after two different designs are tested under matching conditions. Identical reruns do not create extra records.</p>`;
    modal(
      "Your engineering notebook",
      `${state.mode === "build" ? '<details class="notebook-prediction"><summary>Make a prediction (optional)</summary><label class="form-label" for="prediction">What do you expect before the next test?</label><textarea id="prediction" maxlength="240" placeholder="Which part might move or fail? What will you change?"></textarea><button id="save-prediction" class="small-button">Save prediction</button></details>' : ""}${comparison}<p class="cer-prompt"><strong>Evidence question:</strong> ${escapeHTML(learning(state.level).cerPrompt || "What changed, and which measurement supports your explanation?")}</p><h3>${records.length > 2 ? "Latest tests first" : "Recent tests"} · ${records.length} / 8</h3>${records.length ? records.map((r, i) => ({ r, i })).reverse().map(({ r, i }, position) => `<details class="evidence-record" ${position < 2 ? "open" : ""}><summary><span>Test ${i + 1} · ${r.mode === "crossing" ? "Crossing" : "Self-weight"}</span><span>${r.result}</span></summary>${designSketch(r.design, state.level)}<p>${escapeHTML(r.reason)}</p><p><strong>Prediction:</strong> ${escapeHTML(r.prediction || "Not recorded")}</p><label class="form-label" for="reflection-${i}">What does this evidence suggest?</label><textarea id="reflection-${i}" data-reflection="${i}" maxlength="600"></textarea><div class="notebook-actions"><button class="small-button" data-reflect-save="${i}">Save reflection</button><button class="small-button" data-restore="${i}">Use this design</button></div></details>`).join("") : "<p>No completed tests yet. Your first result will appear here.</p>"}<details><summary>Model notes and material costs</summary><p class="model-note">Material cost: Road 1, Timber 1, Steel 3, Cable 1.2 credits per metre. These are game values. Predictions and reflections are evidence for discussion, not automatically marked answers.</p></details>`,
      state.level.place.toUpperCase(),
    );
    if ($("prediction")) {
      $("prediction").value = state.prediction;
      $("save-prediction").onclick = () => {
        state.prediction = $("prediction").value.trim();
        closeModal();
        note("Prediction saved for this design.");
      };
    }
    records.forEach((r, i) => {
      $("reflection-" + i).value = r.reflection;
      $("modal-body").querySelector(`[data-reflect-save="${i}"]`).onclick =
        () => {
          r.reflection = $("reflection-" + i).value.trim();
          save(true);
          closeModal();
          note("Reflection saved.");
        };
      $("modal-body").querySelector(`[data-restore="${i}"]`).onclick = () => {
        modal(
          "Use this tested design?",
          '<p>This replaces the editable bridge. Undo restores your current design.</p><button id="confirm-restore" class="primary">Use design</button>',
        );
        $("confirm-restore").onclick = () => {
          closeModal();
          edit();
          afterEdit(state.editor.commit(structuredClone(r.design)));
        };
      };
    });
  }
  $("notebook").onclick = showNotebook;
  $("result-compare").onclick = showNotebook;

  document.addEventListener("keydown", (e) => {
    if ($("modal").open || state.screen !== "workshop") return;
    if (e.target.matches("input,textarea,select")) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (state.mode === "build") {
        const changed = e.shiftKey ? state.editor.redo() : state.editor.undo();
        if (changed) afterEdit(null);
      }
      return;
    }
    if (e.key.toLowerCase() === "h") {
      e.preventDefault();
      $("help").click();
      return;
    }
    if (e.key === "Escape") {
      cancelPlacement();
      note("Placement cancelled.");
      return;
    }
    if (e.code === "Space" && state.mode !== "build") {
      e.preventDefault();
      $("pause").click();
      return;
    }
    if (!canBuild()) return;
    if (["1", "2", "3", "4"].includes(e.key)) {
      chooseMaterial(Object.keys(P.MATERIALS)[Number(e.key) - 1]);
      return;
    }
    if (e.key.toLowerCase() === "m") {
      $("move").click();
      return;
    }
    if (e.key.toLowerCase() === "x") {
      $("erase").click();
      return;
    }
    if (document.activeElement === canvas) {
      const arrows = {
        ArrowLeft: [-25, 0],
        ArrowRight: [25, 0],
        ArrowUp: [0, -25],
        ArrowDown: [0, 25],
      };
      if (arrows[e.key]) {
        e.preventDefault();
        state.keyboard = true;
        const [dx, dy] = arrows[e.key];
        state.pointer = {
          x: Math.max(
            state.level.left - 150,
            Math.min(state.level.right + 150, state.pointer.x + dx),
          ),
          y: Math.max(155, Math.min(655, state.pointer.y + dy)),
        };
        if (state.seed)
          state.preview = { start: state.seed, end: state.pointer };
      } else if (e.key === "Enter") {
        e.preventDefault();
        state.keyboard = true;
        if (state.tool === "erase") {
          const beam = hitMember(state.pointer);
          if (beam) afterEdit(state.editor.remove(beam.id));
        } else if (state.tool === "build") {
          if (state.seed) addMember(state.seed, state.pointer);
          else {
            state.seed = { ...state.pointer };
            $("cancel-placement").hidden = false;
            state.preview = { start: state.seed, end: state.pointer };
          }
        }
      }
    }
  });
  function frame(t) {
    if ($("free-build").disabled && document.body.dataset.engineReady === "true")
      $("free-build").disabled = false;
    const dt = Math.min(0.05, Math.max(0, (t - lastTime) / 1000));
    lastTime = t;
    state.elapsed += dt;
    if (
      state.screen === "workshop" &&
      state.world &&
      !state.paused &&
      !$("modal").open &&
      !document.hidden
    ) {
      accumulator += dt * state.speed;
      let count = 0;
      while (accumulator >= P.STEP && count++ < 16) {
        state.world.step();
        accumulator -= P.STEP;
        if (state.world.status !== "running") {
          experimentResult();
          break;
        }
        if (state.mode === "gravity" && state.world.time >= 15) {
          state.paused = true;
          controls();
          feedback(
            "Take a closer look.",
            "The gravity experiment paused at 15 seconds. Look at what moved, then edit your design and compare.",
          );
          captureEvidence("Self-weight observation at 15 seconds.");
          note("");
          break;
        }
      }
    }
    if (state.world && t - metricsAt > 100) {
      metricsAt = t;
      $("time-value").innerHTML =
        state.world.time.toFixed(1) + " <small>s</small>";
      $("sag-value").innerHTML =
        (state.world.maxSag * 100).toFixed(1) + " <small>cm</small>";
      $("broken-value").textContent = state.world.breakCount;
    }
    renderer.draw(
      state.screen === "workshop"
        ? state
        : {
            ...state,
            level: L.levels[0],
            editor: previewEditor,
            world: null,
            mode: "build",
            grid: false,
            forces: false,
            preview: null,
            moving: null,
            hoverNode: null,
            hoverMember: null,
            keyboard: false,
          },
    );
  }
  enter(saved.level);
  showScreen("home");
  $("story").hidden = true;
  $("story").inert = true;
  renderTutorial();
  renderer.start(frame);
})();
