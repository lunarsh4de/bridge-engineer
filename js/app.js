"use strict";
(() => {
  const $ = (id) => document.getElementById(id),
    P = BridgePhysics,
    M = BridgeModel,
    L = BridgeLevels,
    renderer = new BridgeRenderer($("scene")),
    STORAGE = "bridge-engineer-workshop-v2";
  const state = {
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
  };
  let saved = { level: 0, completed: [false, false, false], designs: {} },
    down = null,
    accumulator = 0,
    lastTime = 0,
    metricsAt = 0,
    briefExpanded = innerWidth > 760;
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE));
    if (
      value &&
      Array.isArray(value.completed) &&
      value.completed.length === 3 &&
      value.designs &&
      typeof value.designs === "object"
    ) {
      saved = {
        level: Number.isInteger(value.level)
          ? Math.max(0, Math.min(2, value.level))
          : 0,
        completed: value.completed.map((x) => x === true),
        designs: value.designs,
      };
    }
  } catch {
    state.storageOK = false;
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
  function save() {
    saved.level = state.index;
    saved.designs[state.index] = state.editor.design;
    try {
      localStorage.setItem(STORAGE, JSON.stringify(saved));
      state.storageOK = true;
    } catch {
      state.storageOK = false;
    }
  }
  function modal(title, body, eyebrow = "RIVERBEND WORKSHOP") {
    $("modal-body").innerHTML =
      `<div class="eyebrow">${eyebrow}</div><h2 class="modal-title" id="modal-title">${title}</h2>${body}`;
    if (!$("modal").open) $("modal").showModal();
  }
  function closeModal() {
    $("modal").close();
  }
  $("close-modal").onclick = closeModal;
  $("modal").addEventListener("click", (e) => {
    if (e.target === $("modal")) {
      const r = $("modal").getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        closeModal();
    }
  });
  // Freeze the experiment when a modal or another browser tab covers it.
  $("modal").addEventListener("close", () => {
    lastTime = performance.now();
  });
  document.addEventListener("visibilitychange", () => {
    lastTime = performance.now();
    accumulator = 0;
  });
  function note(s) {
    $("instruction").textContent = s;
  }
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
    $("next").hidden = type !== "success";
    $("next").textContent =
      state.index === 2 ? "Your field report →" : "Next crossing →";
    $("simulation-panel").classList.add("under-feedback");
  }
  function setBrief(expanded) {
    briefExpanded = expanded;
    $("brief-content").hidden = !expanded;
    document
      .querySelector(".mission-panel")
      .classList.toggle("collapsed", !expanded);
    $("brief-toggle").setAttribute("aria-expanded", String(expanded));
    $("brief-chevron").textContent = expanded ? "−" : "+";
  }
  $("brief-toggle").onclick = () => setBrief(!briefExpanded);
  function controls() {
    const used = M.usage(state.editor.design),
      running = state.mode !== "build";
    $("materials").innerHTML = Object.entries(P.MATERIALS)
      .map(([key, m], i) => {
        const available = state.level.inventory[key] > 0;
        return `<button class="material ${state.material === key && state.tool === "build" ? "selected" : ""} ${available ? "" : "locked"}" data-material="${key}" draggable="${available && !running}" aria-pressed="${state.material === key && state.tool === "build"}" aria-label="${m.name}: ${available ? (state.level.inventory[key] - used[key]).toFixed(1) + " metres left" : "unlocks in mission 3"}" title="${escapeHTML(m.description)}. Maximum member length ${m.maxLength} m." ${!available || running ? "disabled" : ""}><span class="material-top"><span class="material-icon ${key}"></span><span class="material-key">${i + 1}</span></span><span class="material-name">${m.name}</span><span class="material-amount">${available ? Math.max(0, state.level.inventory[key] - used[key]).toFixed(1) + " / " + state.level.inventory[key] + " m" : "Mission 03"}</span></button>`;
      })
      .join("");
    for (const id of ["move", "erase", "clear", "starter"])
      $(id).disabled = running;
    for (const id of ["move", "erase"]) {
      $(id).classList.toggle("active", state.tool === id && !running);
      $(id).setAttribute("aria-pressed", String(state.tool === id && !running));
    }
    $("undo").disabled = running || !state.editor.undoStack.length;
    $("redo").disabled = running || !state.editor.redoStack.length;
    $("test").disabled = running;
    $("gravity").textContent = running ? "↶ Edit design" : "↓ Gravity lab";
    $("simulation-panel").hidden = !running;
    $("mode-text").textContent = running
      ? state.paused
        ? "EXPERIMENT PAUSED"
        : state.mode === "gravity"
          ? "GRAVITY LAB"
          : "CROSSING TEST"
      : "BUILD MODE";
    $("mode-detail").textContent = running
      ? "9.81 m/s² · real-time model"
      : "Gravity waits until you test";
    $("connection-count").textContent =
      `${state.editor.design.members.length} members · ${state.editor.design.nodes.length - 2} free joints · 2 fixed anchors`;
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
  }
  function enter(index) {
    state.index = index;
    state.level = L.levels[index];
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
    $("mission-label").textContent = `0${index + 1} / ${state.level.place}`;
    $("place-label").textContent =
      `MISSION 0${index + 1} · ${state.level.place.toUpperCase()}`;
    $("mission-title").textContent = state.level.name;
    $("story").textContent = state.level.story;
    $("span-value").textContent =
      (state.level.right - state.level.left) / 100 + " m";
    $("load-value").textContent =
      state.level.truckMass.toLocaleString() + " kg";
    $("concept").textContent = state.level.concept;
    setBrief(innerWidth > 760);
    controls();
    note(
      "Choose Road, then drag from an orange anchor. No fixed building points.",
    );
    save();
  }
  function afterEdit(problem) {
    cancelPlacement();
    if (problem) {
      note(problem);
      controls();
      return false;
    }
    hideFeedback();
    save();
    controls();
    note("Design updated. Test gravity, then improve what you observe.");
    return true;
  }
  function chooseMaterial(key) {
    if (state.mode !== "build" || !state.level.inventory[key]) return;
    state.material = key;
    state.tool = "build";
    cancelPlacement();
    controls();
    note(
      `${P.MATERIALS[key].name}: drag to place a member. Ends snap together; crossing lines do not join.`,
    );
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
    if (state.mode === "build") {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  });
  $("scene").addEventListener("drop", (e) => {
    e.preventDefault();
    if (state.mode !== "build") return;
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
      dist = 25;
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
  const canvas = $("scene");
  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || state.mode !== "build") return;
    e.preventDefault();
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(e.pointerId);
    state.keyboard = false;
    const raw = renderer.toWorld(e.clientX, e.clientY),
      p = snap(raw);
    down = { x: e.clientX, y: e.clientY, start: state.seed || p, raw };
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
  canvas.addEventListener("pointermove", (e) => {
    if (state.mode !== "build") {
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
          `${P.MATERIALS[member.material].name} · ${member.length.toFixed(2)} m · ${member.broken ? "broken" : Math.abs(member.force) < 10 ? "nearly unloaded" : (Math.abs(member.force) / 1000).toFixed(1) + " kN " + (member.force > 0 ? "tension" : "compression")}`,
        );
      } else state.hoverMember = null;
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
  canvas.addEventListener("pointerup", (e) => {
    if (!down || state.mode !== "build") return;
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
  canvas.addEventListener("pointercancel", () => {
    cancelPlacement();
    controls();
  });
  canvas.addEventListener("lostpointercapture", () => {
    if (down) {
      cancelPlacement();
      controls();
    }
  });
  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (state.mode !== "build") return;
    cancelPlacement();
    const beam = hitMember(renderer.toWorld(e.clientX, e.clientY));
    if (beam) afterEdit(state.editor.remove(beam.id));
  });
  for (const id of ["move", "erase"])
    $(id).onclick = () => {
      if (state.mode !== "build") return;
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
    if (state.mode === "build" && state.editor.undo()) afterEdit(null);
  };
  $("redo").onclick = () => {
    if (state.mode === "build" && state.editor.redo()) afterEdit(null);
  };
  function clearDesign() {
    modal(
      "A fresh drawing board?",
      '<p>Return all placed materials to your toolkit. You can undo this action afterwards. Completed missions stay recorded.</p><button class="primary" id="confirm-clear">Clear design</button>',
    );
    $("confirm-clear").onclick = () => {
      afterEdit(state.editor.commit(M.fresh(state.level)));
      closeModal();
    };
  }
  $("clear").onclick = clearDesign;
  function loadStarter() {
    const apply = () => {
      afterEdit(state.editor.commit(L.starter(state.level)));
      note(
        "A starter truss is ready. Try gravity, then move a joint or remove a diagonal to compare.",
      );
    };
    if (state.editor.design.members.length) {
      modal(
        "Try a different starting point?",
        '<p>The starter replaces this design. Undo will restore your previous work. It is an example to explore, not a required answer.</p><button id="confirm-starter" class="primary">Load starter design</button>',
      );
      $("confirm-starter").onclick = () => {
        apply();
        closeModal();
      };
    } else apply();
  }
  $("starter").onclick = loadStarter;
  function startExperiment(vehicle) {
    if (state.mode !== "build") return;
    if (!state.editor.design.members.length) {
      note("Place a member first—or try the starter design.");
      return;
    }
    cancelPlacement();
    hideFeedback();
    state.mode = vehicle ? "crossing" : "gravity";
    state.world = new P.World(state.editor.design, state.level, { vehicle });
    state.paused = false;
    state.speed = 1;
    accumulator = 0;
    lastTime = performance.now();
    controls();
    setBrief(false);
    note(
      vehicle
        ? "The bridge settles under its own weight before the delivery starts."
        : "Gravity is on. Unanchored members fall; connected members transfer their weight.",
    );
    if (vehicle && !state.world.route)
      note(
        "The road is not connected yet. Watch what happens at the gap, then return to build.",
      );
  }
  function edit() {
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
  }
  $("gravity").onclick = () =>
    state.mode === "build" ? startExperiment(false) : edit();
  $("test").onclick = () => startExperiment(true);
  $("back-build").onclick = edit;
  $("result-edit").onclick = edit;
  $("dismiss-feedback").onclick = hideFeedback;
  $("pause").onclick = () => {
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
  function experimentResult() {
    const w = state.world;
    if (w.status === "passed") {
      saved.completed[state.index] = true;
      save();
      feedback(
        "A way across. Built by you.",
        `The delivery reached the other bank. Maximum deck drop: ${(w.maxSag * 100).toFixed(1)} cm. No member failed. What would you change to use less material?`,
        "success",
      );
    } else {
      const reason = w.firstBreak
        ? `${P.MATERIALS[w.firstBreak.material].name} failed in ${w.firstBreak.force > 0 ? "tension" : "compression"} at ${w.firstBreak.time.toFixed(1)} s. Change the member’s material, length or load path.`
        : !w.route
          ? "The delivery needs a connected road between the orange bank anchors. Road sections must meet at their endpoints."
          : "The deck exceeded the 12 cm drop limit or became too steep for the vehicle. Add a stable load path and compare the result.";
      feedback("Now you have evidence.", reason, "failure");
    }
    state.paused = true;
    controls();
    note(
      "Return to build to change your design. The experiment did not alter your saved structure.",
    );
  }
  function showMissions() {
    modal(
      "One crossing at a time.",
      `<p>Build from scratch, or use a starter to explore. Each new mission introduces different material choices.</p>${L.levels.map((l, i) => `<button class="mission-card ${i && !saved.completed[i - 1] ? "locked" : ""}" data-mission="${i}"><span class="num">0${i + 1}</span><span><strong>${l.name}</strong><small>${l.newMaterial} · ${(l.right - l.left) / 100} m span</small></span><span class="mission-status">${saved.completed[i] ? "✓ COMPLETE" : i && !saved.completed[i - 1] ? "PREVIEW" : "BUILD ↗"}</span></button>`).join("")}<p class="toolbar-explanation">Your design is saved separately for each mission in this browser. ${state.storageOK ? "Completed crossings unlock the next mission." : "Browser storage is unavailable; keep this tab open to retain your work."}</p><button class="reset-progress" id="reset-progress">Reset all designs and progress</button>`,
      "YOUR ROUTE THROUGH RIVERBEND",
    );
    $("modal-body")
      .querySelectorAll("[data-mission]")
      .forEach(
        (b) =>
          (b.onclick = () => {
            const i = Number(b.dataset.mission);
            if (i && !saved.completed[i - 1]) {
              modal(
                L.levels[i].name,
                `<p>${L.levels[i].story}</p><p>Complete mission ${i} to unlock <strong>${L.levels[i].newMaterial.toLowerCase()}</strong>.</p><button id="back-missions" class="primary">Back to missions</button>`,
                "A LOOK AHEAD",
              );
              $("back-missions").onclick = showMissions;
            } else {
              save();
              enter(i);
              closeModal();
            }
          }),
      );
    $("reset-progress").onclick = () => {
      modal(
        "Start a new journey?",
        '<p>This removes saved designs and completed crossings from this browser.</p><button id="confirm-reset" class="primary">Reset workshop</button>',
      );
      $("confirm-reset").onclick = () => {
        saved = { level: 0, completed: [false, false, false], designs: {} };
        enter(0);
        closeModal();
      };
    };
  }
  $("missions").onclick = showMissions;
  $("brand").onclick = (e) => {
    e.preventDefault();
    showMissions();
  };
  $("next").onclick = () => {
    if (state.world?.status !== "passed") return;
    if (state.index < 2) {
      enter(state.index + 1);
      return;
    }
    modal(
      "Riverbend, reconnected.",
      '<p>You connected the garden, the farms and the community workshop. You explored geometry, weight, stiffness and material choice through structures of your own.</p><h3>Your next experiment</h3><p>Return to a crossing. Keep the same vehicle and remove one member, change a material, or move one joint. Predict what changes before you test.</p><p class="model-note">A successful delivery records this design’s result in a simplified model. It is not proof of conceptual mastery or a real engineering safety assessment.</p><button class="primary" id="report-map">Choose an experiment ↗</button>',
      "FIELD REPORT · THREE CROSSINGS",
    );
    $("report-map").onclick = showMissions;
  };
  $("help").onclick = () =>
    modal(
      "Build something. See what happens.",
      `<ol><li><strong>Place a road.</strong> Select Road and drag between positions. A long road gesture creates joined sections.</li><li><strong>Place supports anywhere.</strong> Choose timber, steel or cable. Drag from one position to another, or click two endpoints. No numbered building points are required.</li><li><strong>Join at the ends.</strong> Endpoints close to another joint snap together. Members that cross in the middle are not connected.</li><li><strong>Shape your idea.</strong> Move drags free joints and their attached members. Erase, right-click or Undo returns material.</li><li><strong>Try gravity first.</strong> Members have weight. Floating parts fall, pin-jointed frames can fold, and overloaded members can break.</li><li><strong>Test the crossing.</strong> The structure settles, then a moving delivery load follows the road. Compare results and improve.</li></ol><p>You can also drag a material card onto the scene to place a 1.5 m piece, then reshape it with Move.</p><h3>Keyboard controls</h3><p><span class="key">1–4</span> Materials · <span class="key">M</span> Move · <span class="key">X</span> Erase · <span class="key">Esc</span> Cancel · <span class="key">Ctrl/Cmd Z</span> Undo · <span class="key">Ctrl/Cmd Shift Z</span> Redo</p><p>Focus the canvas, use arrow keys to move the placement cursor, and press Enter to set each endpoint. Space pauses an experiment. H opens help.</p><p class="model-note">The workspace fills your browser. Use ⛶ for optional browser full screen. Gravity values are fixed at Earth gravity (9.81 m/s²).</p>`,
      "A QUICK FIELD GUIDE",
    );
  $("about").onclick = () =>
    modal(
      "Ideas become structures.",
      `<h3>STEM topic</h3><p><strong>Bridge structures under gravity:</strong> triangulation, load paths, tension, compression, material properties and design iteration.</p><h3>Story</h3><p>You are Riverbend’s new bridge engineer. A school garden, hillside farms and community workshop need reliable crossings. Start with limited timber, gain more material, and unlock steel and cables as the challenge grows.</p><h3>Engineering within STEM</h3><p><strong>Civil and structural engineering.</strong> Define a need, work within material limits, build your own structure, test it, interpret evidence and improve.</p><div class="modal-grid"><div><strong>Science</strong><p>Gravity, weight, force and deformation.</p></div><div><strong>Technology</strong><p>A real-time digital experiment with measurable feedback.</p></div><div><strong>Engineering</strong><p>Design, test and revise under constraints.</p></div><div><strong>Mathematics</strong><p>Geometry, length, mass and comparative measurements.</p></div></div><h3>Learning objectives</h3><ul><li>Build a triangulated structure that supports its own weight and a specified delivery.</li><li>Use observed deformation or failure to justify a change in geometry or material.</li><li>Compare designs while changing one variable and keeping the test conditions fixed.</li></ul><h3>How the game teaches</h3><p><strong>Chunking:</strong> three missions introduce geometry, load paths and material roles. <strong>Storytelling:</strong> each crossing serves the community. <strong>Inquiry:</strong> predict, build, observe and revise. <strong>Scaffolding:</strong> optional starter designs and field notes. <strong>Transfer:</strong> apply earlier ideas to wider spans and heavier loads.</p><h3>What is simulated</h3><p>Every member contributes mass. A fixed-step, compliant position-based solver applies gravity, axial stiffness, damping and a simplified strength/buckling limit. Cables carry tension only. The delivery is a prescribed moving load while supported by the road; it falls under gravity when the road becomes unusable. It is not a full wheel-contact vehicle simulation.</p><p class="model-note">The model uses idealised pin joints and preset members. It omits beam bending, joint failure, self-collision between crossing members, fatigue, wind and real material variability. It is an educational model, not a bridge safety or design tool. Current learning targets are introductory; the intended age group remains to be confirmed.</p><h3>Architecture references and originality</h3><p>Architecture research included <a href="https://github.com/liabru/matter-js/blob/master/examples/bridge.js" target="_blank" rel="noopener noreferrer">Matter.js’s bridge example</a> and <a href="https://github.com/subprotocol/verlet-js" target="_blank" rel="noopener noreferrer">verlet-js</a>. This demo uses independently written code and original illustrations, with no copied game levels or embedded third-party physics runtime.</p><p class="model-note">Designs and progress are stored in this browser when available. The game runs offline without accounts, analytics, remote APIs or CDN dependencies.</p>`,
      "ABOUT THE COURSE",
    );
  $("case").onclick = () =>
    modal(
      "Notice. Predict. Build.",
      `<h3>${state.level.concept}</h3><p>${state.level.lesson}</p><div class="hint-example"><p><strong>Try it here:</strong> ${state.level.hint}</p></div><h3>Real-world case · The Forth Bridge, Scotland</h3><svg class="case-sketch" viewBox="0 0 600 170" role="img" aria-label="Conceptual illustration of a cantilever bridge with triangular framing"><path d="M15 130H585" stroke="#5a6553" stroke-width="5"/><path d="M30 130L170 40 170 130 300 100 430 130 430 40 570 130M170 40L300 100 430 40M80 98L110 130 140 60 170 130 205 56 240 116 270 87M330 87L360 116 395 56 430 130 460 60 490 130 520 98" fill="none" stroke="#b46a49" stroke-width="4"/><path d="M170 135v25m260-25v25" stroke="#5b7451" stroke-width="12"/></svg><p>The Forth Bridge opened in 1890. This steel cantilever railway bridge is a UNESCO World Heritage Site. Its exposed framework includes large compression members and lighter tension members.</p><p>Look for repeated triangular shapes and follow how the members connect. Then use the Forces view on your own design: which members pull, and which push?</p><p><a href="https://whc.unesco.org/en/list/1485/" target="_blank" rel="noopener noreferrer">Read the UNESCO bridge case ↗</a></p><p class="model-note">This is a conceptual sketch, not a measured plan. The game’s small trusses do not reproduce the real bridge’s cantilever system. Changing a single variable while keeping the same load makes comparisons more informative.</p>`,
      "ENGINEER’S FIELD NOTE",
    );
  $("fullscreen").onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen)
        await document.documentElement.requestFullscreen();
      else
        note(
          "Your browser does not support this full-screen control. The workshop already fills the viewport.",
        );
    } catch {
      note(
        "Full-screen mode was unavailable. You can keep playing in this window.",
      );
    }
  };
  document.addEventListener("fullscreenchange", () => {
    $("fullscreen").setAttribute(
      "aria-label",
      document.fullscreenElement ? "Exit full screen" : "Enter full screen",
    );
  });
  document.addEventListener("keydown", (e) => {
    if ($("modal").open) return;
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
      note("Placement cancelled. Choose a material and try a new idea.");
      return;
    }
    if (e.code === "Space" && state.mode !== "build") {
      e.preventDefault();
      $("pause").click();
      return;
    }
    if (state.mode !== "build") return;
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
            state.preview = { start: state.seed, end: state.pointer };
          }
        }
      }
    }
  });
  function frame(t) {
    const dt = Math.min(0.05, Math.max(0, (t - lastTime) / 1000));
    lastTime = t;
    state.elapsed += dt;
    if (state.world && !state.paused && !$("modal").open && !document.hidden) {
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
          note("Return to build to change one variable and test again.");
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
    renderer.draw({ ...state, editor: state.editor });
    requestAnimationFrame(frame);
  }
  enter(saved.level);
  requestAnimationFrame((t) => {
    lastTime = t;
    frame(t);
  });
})();
