/* Riverbend: Bridge Engineer - orchestrator.
 * State machine menu -> comic -> level/choice nodes -> report. Owns the fixed-step loop. */
(function (root) {
  "use strict";
  const P = root.BridgePhysics, L = root.BridgeLevels, M = root.BridgeModel, Pr = root.BridgeProgress, Sc = root.BridgeScoring;
  const Bus = root.BridgeBus, E = root.BridgeEvents, C = root.BridgeConstants, T = root.BridgeContent, R = root.BridgeScene;
  const $ = (id) => document.getElementById(id);
  const esc = T.esc, Lab = root.EngineeringLab, Notes=root.InquiryNotes;
  let notebook = Lab.blank(), inquiry={}, storageVolatile = false;

  // ---------- GameState ----------
  const GS = {
    screen: "menu", save: null, level: null, design: null, sim: null, mode: "edit",
    tool: "road", forces: true, slowmo: 0, endHold: 0, accum: 0, lastSummary: null, hintStep: 0,
    teaching:{block2:false,block3:false}, teachingNotice:null, savings:null, testNoteIndex:null, comicIndex: 0, coachStep: 0, firstBreakShown: false, practice: false, practiceStep: 0, practiceUndone: false, paused: false, observedSlack: new Set(), testDesign: null, lastRecord: null,
    reset() { this.teaching={block2:false,block3:false};this.teachingNotice=null;this.savings=null;this.testNoteIndex=null; this.level = null; this.design = null; this.sim = null; this.mode = "edit"; this.slowmo = 0; this.endHold = 0; this.accum = 0; this.lastSummary = null; this.hintStep = 0; this.firstBreakShown = false; this.breakText = ""; this.seenEvents = 0; this.practice=false; this.practiceStep=0; this.practiceUndone=false; this.paused = false; this.inspectList = null; this.testDesign = null; this.lastRecord = null; this.observedSlack = new Set(); },
  };
  const store = (() => { try { const s = root.localStorage; s.setItem("rb.t", "1"); s.removeItem("rb.t"); return s; } catch (e) { storageVolatile = true; const m = {}; return { getItem: (k) => m[k] || null, setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; } }; } })();
  const world = () => GS.save.world;
  function storageText() { return storageVolatile ? "Storage is unavailable or full. Work is kept for this session; export your notebook before closing." : "Progress and the optional Notebook save locally in this browser."; }
  function saveBook() { if (!Lab.save(store, notebook, GS.save)) storageVolatile = true; if(!Notes.save(store,inquiry,Lab.progressStamp(GS.save)))storageVolatile=true; }
  function persist() { if (GS.design && GS.level && !GS.practice) GS.save.designs[GS.level.id] = M.clone(GS.design.members); if (!Pr.save(store, GS.save)) storageVolatile = true; saveBook(); }
  function download(name, text) { const a = document.createElement("a"), url = URL.createObjectURL(new Blob([text], {type:"application/json"})); a.href=url; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); }
  function resetWorkshop() { GS.reset(); R.setGuide([]); R.setSim(null); R.setInspect(null); R.setHighlight(-1); R.setTrace([]); Edu.reset(); }
  function installSave(data, book, notes) { resetWorkshop(); GS.save=data; notebook=book||Lab.blank(); inquiry=Notes.migrate(notebook,notes||{}); persist(); closeModal(false); renderMenu(); toast("Progress loaded."); }

  // ---------- screens ----------
  function show(id) {
    GS.screen = id;
    document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === id));
    // Pause the renderer and fixed-step simulation outside the visible workshop.
    const g = root.__GAME__;
    if (g && g.loop) {
      if (id === "build") { g.loop.wake(); R.refresh(); }
      else g.loop.sleep();
    }
    const focus = document.querySelector(`#${id} .btn.primary:not([hidden]):not(:disabled)`) || document.querySelector(`#${id} button:not([hidden]):not(:disabled)`);
    focus && setTimeout(() => focus.focus({ preventScroll: true }), 30);
  }
  let toastTimer = 0;
  function toast(msg, kind) {
    const t = $("toast"); t.textContent = msg; t.className = "toast show " + (kind || "");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.className = "toast"), C.TOAST_MS);
  }

  // ---------- menu ----------
  function renderMenu() {
    const w = world(), started = GS.save.started && w.node !== "prologue";
    $("btn-continue").hidden = !started;
    $("btn-select").hidden = !started;
    $("btn-new").textContent = started ? "Start over" : "New journey";
    $("btn-new").classList.toggle("primary", !started);
    const done = Object.keys(w.results).filter(id => id !== "tabletop").length, stars = Object.values(w.results).reduce((a, r) => a + (r.stars || 0), 0);
    $("menu-progress").textContent = started ? `${done} of ${Object.keys(L.LEVELS).length - 1} crossings built · ${stars} stars · ${w.reserve} credits saved` : "";
    $("menu-storage").textContent = storageText();
    show("menu");
  }
  function newJourney() {
    if (GS.save.started && !confirm("Start a new journey? Your current progress will be replaced. (Help → Settings can export it first.)")) return;
    resetWorkshop(); notebook = Lab.blank(); inquiry={}; GS.save = Pr.blank(L.newWorld); GS.save.started = true; persist();
    GS.comicIndex = 0; renderComic(); show("comic");
  }
  function cont() { goNode(world().node); }

  // ---------- comic ----------
  function renderComic() {
    const p = T.storyPanels[GS.comicIndex];
    $("comic-img").src = p.img; $("comic-img").alt = p.alt; $("comic-text").textContent = p.text;
    $("comic-dots").innerHTML = T.storyPanels.map((_, i) => `<i class="${i === GS.comicIndex ? "on" : ""}"></i>`).join("");
    $("comic-next").textContent = GS.comicIndex === T.storyPanels.length - 1 ? "Begin" : "Next";
  }
  function comicNext() { if (GS.comicIndex < T.storyPanels.length - 1) { GS.comicIndex++; renderComic(); } else advance("prologue"); }

  // ---------- story nodes ----------
  function goNode(id) {
    const w = world(); w.node = id; persist();
    Bus.emit(E.STORY_NODE, { id });
    const n = L.NODES[id];
    if (n.type === "comic") { GS.comicIndex = 0; renderComic(); show("comic"); }
    else if (n.type === "choice") renderChoice(id);
    else if (n.type === "level") openLevel(n.level);
    else renderReport();
  }
  function advance(fromId) { goNode(L.NODES[fromId].next); }
  function renderChoice(id) {
    const n = L.NODES[id], w = world();
    $("choice-title").textContent = n.title; $("choice-text").textContent = n.text(w);
    $("choice-options").innerHTML = n.options.map((o) => {
      const ok = !o.requires || o.requires(w);
      return `<button class="choice-opt" data-opt="${o.id}" ${ok ? "" : "disabled aria-disabled=true"}><strong>${esc(o.label)}</strong><span>${esc(ok ? o.detail : o.lockedText)}</span></button>`;
    }).join("");
    $("choice-options").querySelectorAll("[data-opt]").forEach((b) => b.addEventListener("click", () => choose(id, b.dataset.opt)));
    show("choice");
  }
  function choose(id, optId) {
    const n = L.NODES[id], o = n.options.find((x) => x.id === optId), w = world();
    if (o.requires && !o.requires(w)) return;
    const before = { mats: w.materials.slice(), reserve: w.reserve };
    o.effect(w); w.choices[id] = optId;
    w.log.push({ node: id, choice: optId, label: o.label });
    const gained = w.materials.filter((m) => !before.mats.includes(m)).map((m) => P.MATERIALS[m].name);
    const msg = [gained.length ? `New material: ${gained.join(", ")}` : "", w.reserve !== before.reserve ? `Saved credits: ${before.reserve} → ${w.reserve}` : ""].filter(Boolean).join(" · ");
    goNode(o.next);
    if (msg) toast(msg, "good");
  }
  // ---------- level ----------
  const COACH = [
    "Step 1: the road is ready and locked. Pick Timber to design its supports.",
    "Step 2: the road alone will sag. Pick Timber and drag from a square anchor below the bank up to the road.",
    "Step 3: press Test crossing. Member colors show load. Blue end bands = pulled (tension), red end bands = pushed (compression).",
  ];
  function fixedRoad(level) { return M.clone(level.refs[0].members.filter(m=>m.m==='road')); }
  function withFixedRoad(level,members) { return fixedRoad(level).concat(M.clone(members||[]).filter(m=>m.m!=='road')); }
  function openLevel(id,options={}) {
    const previous=GS.level&&GS.level.id===id&&!GS.practice&&!options.practice?GS.teaching:null;
    GS.reset(); if(previous)GS.teaching=previous; Edu.reset();
    const w = world(), lv = L.resolveLevel(id, w);
    GS.level = lv; GS.practice=!!options.practice || id==='tabletop'&&!w.checks['controls:offered'];
    GS.design = M.create(lv, withFixedRoad(lv, GS.practice?[]:GS.save.designs[id]||[]));
    GS.tool = lv.materials.find(m=>m!=="road");
    R.setLevel(lv, GS.design); R.setTool(GS.tool); R.setForces(GS.forces); R.setInspect(null);
    $("lv-place").textContent = lv.place; $("lv-title").textContent = lv.title;
    $("result").hidden = true; $("result").innerHTML = ""; $("test-hud").hidden = true; hideTip();
    GS.inspectList = null;
    buildMaterials(); renderWorldStrip(); setMode("edit"); refreshBudget();
    GS.coachStep = id === "tabletop" && !GS.design.members.some(m=>m.m!=="road") ? 1 : -1;
    renderCoach();
    show("build");
    if (!root.__GAME__) root.__GAME__ = R.mount("stage", { frame });
    if (GS.practice) { w.checks['controls:offered']=true; persist(); practiceIntro(); return; }
    if (!w.checks["seen:" + id]) { w.checks["seen:" + id] = true; persist(); openModal("brief"); }
    if (lv.newMaterial) toast(`New material here: ${P.MATERIALS[lv.newMaterial].name}`, "good");
  }
  function renderCoach() {
    const c = $("coach");
    if(GS.practice){
      const steps=["Rotate with right-drag, or choose Orbit view and drag. Front view returns to a clear building view.","Road is already laid and locked. Pick Timber. Connect the two gold rings: the lower left support and the middle road joint. Drag, or tap both ends.","Undo your new brace, then Redo it. One construction action is one undo step.","Connect the lower right support to the middle road joint. The matching truss on the far side appears automatically.","Test crossing. Try Pause test to freeze the load, read the colors, then Resume. Green/yellow/red = utilization; blue/red end bands = pull/push."];
      c.hidden=false;c.innerHTML=`<strong>Controls practice · ${Math.min(5,GS.practiceStep+1)} / 5</strong><br>${steps[Math.min(4,GS.practiceStep)]}<div class="tip-row">${GS.practiceStep===0?'<button class="btn small" id="practice-next">Next: connect</button>':''}<button class="btn ghost small" id="practice-skip">Skip practice</button></div>`;
      R.setGuide(GS.practiceStep===1?[[0,-2],[4,0]]:GS.practiceStep===3?[[8,-2],[4,0]]:[]);
      if($('practice-next'))$('practice-next').onclick=()=>{GS.practiceStep=1;renderCoach();};$('practice-skip').onclick=()=>endPractice(false);return;
    }
    R.setGuide([]);
    if (GS.coachStep < 0 || GS.coachStep >= COACH.length) { c.hidden = true; return; }
    c.hidden = false;
    c.innerHTML = `<strong>Getting started</strong><br>${COACH[GS.coachStep]}<div class="tip-row"><button class="btn ghost small" id="coach-skip">Hide tips</button></div>`;
    $("coach-skip").onclick = () => { GS.coachStep = -1; renderCoach(); };
  }
  function coachAfterEdit() {
    if(GS.practice){const has=(a,b)=>GS.design.members.some(m=>(P.keyOf(m.a)===P.keyOf(a)&&P.keyOf(m.b)===P.keyOf(b))||(P.keyOf(m.a)===P.keyOf(b)&&P.keyOf(m.b)===P.keyOf(a)));if(GS.practiceStep===1&&has([0,-2],[4,0]))GS.practiceStep=2;if(GS.practiceStep===3&&has([8,-2],[4,0]))GS.practiceStep=4;renderCoach();return;}
    if (GS.coachStep < 0) return;
    const ms = GS.design.members, hasRoad = ms.some((m) => m.m === "road"), hasSup = ms.some((m) => m.m !== "road");
    const step = !hasRoad ? 0 : !hasSup ? 1 : 2;
    if (step !== GS.coachStep) { GS.coachStep = step; renderCoach(); }
  }
  function buildMaterials() {
    const lv = GS.level;
    $("materials").innerHTML = `<span class="fixed-road" title="Road is prelaid, locked and included in your budget">Road ready · locked</span>` + lv.materials.filter(m=>m!=="road").map((m, i) => {
      const mat = P.MATERIALS[m], col = "#" + C.COLORS[m].toString(16).padStart(6, "0");
      return `<button class="tool" role="radio" data-tool="${m}" title="${esc(mat.role)} (${i + 1})"><i class="swatch" style="background:${col}"></i>${mat.name} <span class="cost">${mat.cost}/m</span>${lv.newMaterial === m ? '<span class="new">NEW</span>' : ""}</button>`;
    }).join("");
    $("materials").querySelectorAll("[data-tool]").forEach((b) => b.addEventListener("click", () => setTool(b.dataset.tool)));
    setTool(GS.tool);
  }
  function setTool(t) {
    if (t === "road") { toast("Road is already laid and locked. Build its supports."); return; }
    if (t !== "erase" && !GS.level.materials.includes(t)) return;
    GS.tool = t; R.setTool(t);
    document.querySelectorAll("#toolbar [data-tool]").forEach((b) => { const on = b.dataset.tool === t; b.setAttribute(b.getAttribute("role") === "radio" ? "aria-checked" : "aria-pressed", String(on)); b.classList.toggle("on", on); });
  }
  function renderWorldStrip() {
    const w = world();
    const chips = [`<span class="chip">${w.reserve} saved credits</span>`];
    chips.push(`<span class="chip">${w.materials.map((m) => P.MATERIALS[m].name).join(", ")}</span>`);
    for (const h of w.helped) chips.push(`<span class="chip good">${esc(L.NAMES[h] || h)}</span>`);
    if (w.support) chips.push(`<span class="chip">${esc(L.LEVELS.finale.variants[w.support].label)}</span>`);
    $("world-strip").innerHTML = chips.join("");
  }
  function cost() { return P.costOf(GS.design.members); }
  function refreshBudget() {
    const lv = GS.level, c = cost(), total = lv.totalBudget, over = c > total;
    const pct = (v) => Math.min(100, (v / total) * 100).toFixed(1);
    const res = lv.totalBudget - lv.budget;
    $("budget").className = "budget" + (over ? " over" : "");
    $("budget").innerHTML = `<strong>${c}</strong> / ${lv.budget}${res ? ` + ${res} saved` : ""} credits · ${GS.design.members.length} members
      <div class="bar"><i class="res" style="width:${pct(Math.max(c, 0))}%"></i><i style="width:${pct(Math.min(c, lv.budget))}%"></i></div>`;
    $("btn-undo").disabled = !GS.design.undo.length; $("btn-redo").disabled = !GS.design.redo.length;
    $("btn-clear").disabled = !GS.design.members.some(m=>m.m!=="road");
  }
  function changed() { GS.savings=null; GS.lastSummary=null; GS.inspectList=null; GS.lastRecord=null; R.setDesign(GS.design); R.setInspect(null); R.setTrace([]); R.setHighlight(-1); hideTip(); $("btn-results").hidden=true; refreshBudget(); coachAfterEdit(); persist(); Bus.emit(E.DESIGN_CHANGED, {}); }
  let lastAddOk = false;
  Bus.on(E.DESIGN_ADD, ({ a, b, type }) => {
    if (GS.mode !== "edit" || type === "road" || !GS.level.materials.includes(type)) return;
    const r = M.add(GS.design, a, b, type);
    lastAddOk = r.ok;
    if (!r.ok) { toast(r.error, "warn"); Bus.emit(E.DESIGN_REJECTED, { error: r.error }); return; }
    changed();
  });
  Bus.on(E.DESIGN_ERASE, ({ i }) => { if (GS.mode!=="edit") return; if(GS.design.members[i]&&GS.design.members[i].m==="road"){toast("Road is locked; erase or change a support instead.");return;}if(M.removeAt(GS.design,i))changed(); });
  function undo() { if (GS.mode === "edit" && M.undo(GS.design)) {if(GS.practice&&GS.practiceStep===2)GS.practiceUndone=true;changed();} }
  function redo() { if (GS.mode === "edit" && M.redo(GS.design)) {if(GS.practice&&GS.practiceStep===2&&GS.practiceUndone)GS.practiceStep=3;changed();} }
  function clearAll() { if(GS.mode==="edit"&&GS.design.members.some(m=>m.m!=="road")){M.load(GS.design,fixedRoad(GS.level));changed();toast("Supports cleared. The road stays. Undo brings the supports back.");} }
  function practiceIntro(){
    openModal('practice','<p class="lead">Try the real building controls before the first crossing.</p><ol class="practice-list"><li><strong>Look:</strong> rotate the bridge, then return to Front view.</li><li><strong>Build:</strong> choose Timber and connect the highlighted joints. Drag, or tap two ends.</li><li><strong>Recover:</strong> Undo and Redo a brace.</li><li><strong>Test:</strong> pause the moving load and read the forces.</li></ol><p>The road is already laid and locked. Build one side elevation; a matching truss is shown on the other side. Both represent the same 2D simulation. Practice does not change journey scores or recorded experiments.</p><div class="result-actions"><button class="btn" id="practice-intro-skip">Skip to first crossing</button><button class="btn primary" id="practice-start">Practice in 3D</button></div>');
    $('practice-intro-skip').textContent=world().node==='tabletop'?'Skip to first crossing':'Skip practice & return';
    $('practice-start').onclick=()=>{closeModal();GS.practiceStep=0;renderCoach();};$('practice-intro-skip').onclick=()=>endPractice(false);
  }
  function endPractice(done,toMenu=false){world().checks[done?'controls:done':'controls:skipped']=true;persist();GS.practice=false;resetWorkshop();closeModal(false);if(toMenu)renderMenu();else goNode(world().node);}
  function renderPracticeResult(){const {rec,s}=GS.lastSummary;$('coach').hidden=true;$('test-hud').hidden=true;const box=$('result');box.className='result '+(rec.pass?'pass':'fail');box.innerHTML=`<h3 id="result-title">${rec.pass?'Controls practice complete':'Try the practice again'}</h3><p>${esc(s.reason)}</p><p>You built braces, used the real controls and observed a test. The road remains prelaid in the journey. Your bridge designs will be stored separately from this practice.</p><div class="result-actions"><button class="btn" id="practice-edit">Edit practice bridge</button><button class="btn primary" id="practice-finish">${rec.pass?'Start first crossing':'Skip to first crossing'}</button></div>`;box.hidden=false;$('practice-finish').textContent=world().node==='tabletop'?(rec.pass?'Start first crossing':'Skip to first crossing'):'Return to journey';$('practice-edit').onclick=backToEdit;$('practice-finish').onclick=()=>endPractice(rec.pass);$('practice-finish').focus();}
  // ---------- test run (fixed 1/60 s steps, same as the Node tests) ----------
  function setMode(mode) {
    GS.mode = mode; R.setMode(mode);
    $("build").dataset.mode = mode;
    const testing = mode !== "edit";
    $("btn-test").hidden = testing; $("btn-edit").hidden = !testing;
    $("btn-pause").hidden = mode !== "test"; $("btn-results").hidden = mode !== "inspect";
    document.querySelectorAll("#materials .tool, #tool-erase, #btn-undo, #btn-redo, #btn-clear, #btn-hint").forEach((b) => (b.disabled = testing));
    if (!testing) refreshBudget();
  }
  function startTest() {
    if (GS.mode !== "edit") return;
    const warn = M.warnings(GS.design);
    if (warn.length) toast(warn[0], "warn");
    if(!GS.practice)world().tests++;
    Edu.flush(); GS.testNoteIndex=null; GS.teachingNotice=null; GS.savings=null;
    GS.testDesign=M.clone(GS.design.members); GS.observedSlack=new Set(); GS.paused=false; GS.prediction=GS.practice?"":Notes.get(inquiry,GS.level.id,0).predict;
    $("btn-pause").textContent="Pause test"; $("btn-pause").setAttribute("aria-pressed","false"); persist();
    GS.sim = P.createSim(GS.design.members, GS.level, GS.level.mass);
    GS.accum = 0; GS.slowmo = 0; GS.endHold = 0; GS.firstBreakShown = false; GS.seenEvents = 0; GS.breakText = "";
    R.setSim(GS.sim); R.setInspect(null); R.setHighlight(-1);
    $("result").hidden = true; $("coach").hidden = true; hideTip();
    setMode("test");
    $("test-hud").hidden = false; renderHud(); if(GS.practice)renderCoach();
    Bus.emit(E.TEST_STARTED, {});
  }
  function backToEdit() {
    GS.paused=false; GS.sim = null; R.setSim(null); R.setInspect(null); R.setTrace([]); R.setHighlight(-1); hideTip();
    $("test-hud").hidden = true; $("result").hidden = true;
    setMode("edit"); renderCoach();
  }
  function returnToResults() { if (GS.mode!=="inspect" || !GS.lastSummary || !GS.sim) return; R.setInspect(null); R.setTrace([]); R.setSim(GS.sim); hideTip(); setMode("result"); renderResult(); }
  function togglePause() { if (GS.mode!=="test") return; GS.paused=!GS.paused; $("btn-pause").textContent=GS.paused?"Resume test":"Pause test"; $("btn-pause").setAttribute("aria-pressed",String(GS.paused)); renderHud(); }
  function frame(dt) {
    if (GS.mode !== "test" || !GS.sim || GS.paused || !$("modal").hidden) return;
    const sim = GS.sim;
    let scale = 1;
    if (GS.slowmo > 0) { GS.slowmo -= dt; scale = C.SLOWMO_SCALE; }
    if (!sim.outcome) {
      GS.accum += dt * scale;
      let n = 0;
      while (GS.accum >= P.FRAME && !sim.outcome && n++ < 6) { P.step(sim, P.FRAME); for(const m of sim.mems) if(m.slack) GS.observedSlack.add(m.i); GS.accum -= P.FRAME; }
      if (n >= 6) GS.accum = 0;
      handleEvents();
      renderHud();
    } else {
      GS.endHold += dt;
      if (GS.endHold >= C.END_HOLD && GS.slowmo <= 0) finishTest();
    }
  }
  function memberInfo(i) {
    const m = GS.sim.mems[i], mat = P.MATERIALS[m.type];
    return { name: mat.name, len: m.rest, tension: mat.tension, comp: m.comp, buckles: m.type !== "cable" && m.comp < mat.compression - 1 };
  }
  function explainBreak(fb) {
    const k = memberInfo(fb.i), kN = (v) => (v / 1000).toFixed(1) + " kN";
    if (fb.mode === "tension") return `${k.name} was pulled apart (tension). This ${k.len.toFixed(1)} m piece can hold ${kN(k.tension)} of pull.`;
    if (fb.type === "cable") return `A cable cannot push.`;
    if (k.buckles) return `${k.name} buckled under compression. It is ${k.len.toFixed(1)} m long, so it can only take ${kN(k.comp)} of push. Shorter pieces resist buckling much better.`;
    return `${k.name} was crushed (compression). This piece can take ${kN(k.comp)} of push.`;
  }
  function handleEvents() {
    const sim = GS.sim;
    while (GS.seenEvents < sim.events.length) {
      const ev = sim.events[GS.seenEvents++];
      if (ev.type === "break") {
        const m = sim.mems[ev.i], xm = (m.a.x + m.b.x) / 2, ym = (m.a.y + m.b.y) / 2;
        R.burst(xm, ym, C.COLORS[m.type], 14, 180);
        Bus.emit(E.SIM_BREAK, ev);
        if (!GS.firstBreakShown) {
          GS.firstBreakShown = true; GS.slowmo = C.SLOWMO_SECONDS; R.setHighlight(ev.i);
          GS.breakText = explainBreak({ ...sim.firstBreak, i: ev.i });
          R.shake(1);
        }
      } else if (ev.type === "fall") { R.burst(sim.vehicle.front, -1, 0xffffff, 18, 220); Bus.emit(E.SIM_FALL, ev); }
      else if (ev.type === "sag") Bus.emit(E.SIM_SAG, ev);
    }
  }
  function renderHud() {
    const sim = GS.sim; if (!sim) return;
    let now = 0, peak = 0; for (const m of sim.mems) { if (!m.broken && m.ratio > now) now = m.ratio; if (m.peak > peak) peak = m.peak; }
    const sag = sim.maxSag * 100, lim = sim.sagLimit * 100;
    $("test-hud").innerHTML = `<strong>${GS.paused ? "Paused — inspect the evidence" : GS.slowmo > 0 ? "Slow motion: first failure" : sim.outcome ? "Test finished" : sim.t < sim.settle ? "Settling under self-weight…" : "Crossing…"}</strong>
      <div>Max road drop: ${sag.toFixed(1)} / ${lim} cm</div><div class="bar"><i class="${sag > lim ? "hot" : ""}" style="width:${Math.min(100, (sag / lim) * 100)}%"></i></div>
      <div>Busiest member now: ${Math.round(now * 100)}% (peak ${Math.round(peak * 100)}%)</div><div class="bar"><i class="${peak > 0.85 ? "hot" : ""}" style="width:${Math.min(100, peak * 100)}%"></i></div>
      ${GS.breakText ? `<p class="small">${esc(GS.breakText)}</p>` : ""}
      <div class="load-legend"><span>Load</span><i></i><span>0 → 100%</span></div><div class="legend"><span><b style="background:#2e7dd1"></b>tension bands</span><span><b style="background:#d2452f"></b>compression bands</span></div>`;
  }
  // ---------- result: stars, badges, inspect, check question ----------
  function finishTest() {
    const sim = GS.sim, lv = GS.level, s = P.summary(sim);
    const rec = Sc.runRecord(GS.design.members, s, P.costOf);
    rec.pass = rec.pass && rec.cost <= lv.totalBudget;
    const par = Sc.par(lv.refs, P.costOf);
    rec.stars = Sc.stars(rec.pass, rec.cost, par, lv.totalBudget);
    rec.badges = Sc.badges(lv.badges, rec);
    if(GS.practice){GS.lastSummary={s,rec,par};setMode("result");renderPracticeResult();return;}
    GS.lastRecord=Lab.add(notebook,Lab.record(lv,GS.testDesign||GS.design.members,sim,rec,GS.prediction,GS.observedSlack)); if(!GS.lastRecord.valid){rec.pass=false;rec.stars=0;rec.badges=[];} GS.lastRecord.example=!!world().checks["example:"+lv.id];
    GS.lastRecord.noteIndex=GS.testNoteIndex;
    GS.lastSummary = { s, rec, par }; persist();
    GS.inspectList = sim.mems.map((m) => ({ peak: m.peak, mode: m.peakMode || (m.fs >= 0 ? "tension" : "compression"), broken: m.broken, slack: GS.observedSlack.has(m.i) && m.peak < 0.001 }));
    setMode("result");
    Bus.emit(E.TEST_FINISHED, { outcome: rec.pass ? "pass" : "fail", rec });
    renderResult();
  }
  function renderResult() {
    const { s, rec, par } = GS.lastSummary, lv = GS.level;
    const valid=!!(GS.lastRecord&&GS.lastRecord.valid);
    let reason = s.reason;
    if (!rec.pass && !s.firstBreak && s.maxSagCm > lv.sagLimit * 100 && /^The road dropped/.test(reason)) reason = `The road dropped ${s.maxSagCm.toFixed(1)} cm. The limit is ${Math.round(lv.sagLimit * 100)} cm.`;
    if (s.outcome === "pass" && !rec.pass) reason = `The bridge held, but it costs ${rec.cost} credits. You have ${lv.totalBudget}.`;
    const star = (n) => "★".repeat(n) + "☆".repeat(3 - n);
    const badgeHtml = (lv.badges || []).map((b) => { const d = Sc.describe(b), got = rec.badges.includes(d.id); return `<span class="chip ${got ? "good" : ""}" title="${esc(d.text)}">${got ? "✓" : "○"} ${esc(d.name)}: ${esc(d.text)}</span>`; }).join(" ");
    const next = [];
    if (!rec.pass && s.firstBreak) next.push(GS.breakText);
    if (valid && !rec.pass && s.maxSagCm > lv.sagLimit * 100) next.push(`The road dropped most near ${(GS.sim.sagX).toFixed(1)} m. Support that point with a triangle.`);
    if (rec.pass && rec.stars < 3) next.push(`A tested design costs ${par} credits. Inspect your bridge: green members carried a low fraction of their limit.`);
    const box = $("result");
    $("test-hud").hidden = true;
    box.className = "result " + (rec.pass ? "pass" : "fail");
    box.innerHTML = `<h3 id="result-title">${rec.pass ? "Delivered! " + star(rec.stars) : "Not yet"}</h3>
      <p>${esc(reason)}</p>
      <div class="stats"><div><strong>${valid?s.maxSagCm+" cm":"Unavailable"}</strong>max drop (limit ${Math.round(lv.sagLimit * 100)})</div><div><strong>${valid?Math.round(s.peakRatio * 100)+"%":"Unavailable"}</strong>busiest member</div><div><strong>${rec.cost}</strong>credits (budget ${lv.totalBudget})</div><div><strong>${rec.members}</strong>members</div></div>
      ${next.length ? `<p class="small">${next.map(esc).join(" ")}</p>` : ""}
      ${GS.lastRecord ? Edu.resultHtml(GS.lastRecord) : ""}
      ${Edu.revealHtml()}
      <div class="world-strip">${badgeHtml}</div>
      <div class="result-actions">
        <button class="btn" id="res-inspect">Inspect forces</button>
        <button class="btn ${rec.pass ? "" : "primary"}" id="res-edit">Edit design</button>
        ${rec.pass ? '<button class="btn primary" id="res-go">Deliver &amp; continue</button>' : ""}
      </div><div id="quiz-slot"></div>`;
    box.hidden = false;
    $("res-inspect").onclick = inspect;
    $("res-edit").onclick = backToEdit;
    if (rec.pass) $("res-go").onclick = showCheck;
    Edu.wireResult();
    (rec.pass ? $("res-go") : $("res-edit")).focus();
  }
  function inspect() {
    if (GS.mode !== "result" || !GS.inspectList) return;
    R.setSim(null); R.setInspect(GS.inspectList); R.setHighlight(-1); R.setTrace([]);
    setMode("inspect");
    $("result").hidden = true; $("test-hud").hidden = true;
    toast("Hover or tap a member to see its highest load. Press Back to results to continue, or Edit design to change it.");
  }
  // Inspect tooltip
  Bus.on(E.MEMBER_HOVER, ({ i, x, y }) => {
    const tip = $("inspect-tip");
    if (!GS.inspectList || i < 0 || !R.state.inspect || !GS.design.members[i]) { tip.hidden = true; return; }
    const m = GS.design.members[i], d = GS.inspectList[i], mat = P.MATERIALS[m.m], len = P.lengthOf(m);
    const cap = d.mode === "tension" ? mat.tension : P.compCapacity(mat, len);
    tip.innerHTML = `<strong>${mat.name}, ${len.toFixed(1)} m</strong><br>${d.broken ? "Broke" : `Peak ${Math.round(d.peak * 100)}% of limit`} · ${d.mode === "tension" ? "pulled (tension)" : "pushed (compression)"}<br>Peak ≈ ${((d.peak * cap) / 1000).toFixed(1)} kN of ${(cap / 1000).toFixed(1)} kN`;
    tip.hidden = false;
    const stage = $("stage").getBoundingClientRect();
    tip.style.left = Math.max(8, Math.min(stage.width - tip.offsetWidth - 8, x + 14)) + "px";
    tip.style.top = Math.max(8, Math.min(stage.height - tip.offsetHeight - 8, y + 14)) + "px";
  });
  function hideTip() { const t = $("inspect-tip"); if (t) t.hidden = true; }

  function showCheck() {
    if (GS.mode !== "result" || !GS.lastSummary || !GS.lastSummary.rec.pass) return;
    const q = GS.level.check, slot = $("quiz-slot");
    $("res-go").disabled = true;
    slot.innerHTML = `<div class="quiz"><strong>Quick check:</strong> ${esc(q.q)}${q.options.map((o, i) => `<button class="quiz-opt" data-i="${i}">${esc(o)}</button>`).join("")}<p id="quiz-why" class="small" hidden></p></div>`;
    slot.querySelectorAll(".quiz-opt").forEach((b) => b.addEventListener("click", () => {
      const i = +b.dataset.i, right = i === q.answer, w = world();
      if (w.checks[GS.level.id] == null) w.checks[GS.level.id] = right;
      slot.querySelectorAll(".quiz-opt").forEach((x) => { x.disabled = true; x.classList.toggle("right", +x.dataset.i === q.answer); x.classList.toggle("wrong", +x.dataset.i === i && !right); });
      $("quiz-why").hidden = false; $("quiz-why").textContent = (right ? "Yes. " : "Not quite. ") + q.why;
      const go = $("res-go"); go.disabled = false; go.textContent = "Continue the journey"; go.onclick = completeLevel; go.focus();
    }));
  }
  function completeLevel() {
    if (GS.mode !== "result" || !GS.lastSummary || !GS.lastSummary.rec.pass) return;
    const { rec } = GS.lastSummary, w = world(), id = GS.level.id;
    const prev = w.results[id];
    const r = L.applyResult(w, id, { cost: rec.cost, pass: true, stars: rec.stars, badges: rec.badges, members: rec.members, maxSagCm: rec.maxSagCm, peakRatio: rec.peakRatio, tests: w.tests });
    if (prev) w.results[id].stars = Math.max(prev.stars || 0, rec.stars);
    w.log.push({ node: id, level: true, stars: rec.stars, cost: rec.cost });
    persist();
    if (r.carry || r.usedReserve) toast(`${r.carry ? `+${r.carry} credits saved for later` : ""}${r.carry && r.usedReserve ? " · " : ""}${r.usedReserve ? `${r.usedReserve} saved credits spent` : ""}`, "good");
    GS.sim = null; R.setSim(null);
    advance(id);
  }
  // ---------- hints ----------
  function hint() {
    const lv = GS.level, hs = lv.hints || [];
    if (GS.hintStep < hs.length) { openModal("hint", `<p>${esc(hs[GS.hintStep])}</p><p class="small muted">Hint ${GS.hintStep + 1} of ${hs.length}. Press Hint again for the next one.</p>`); GS.hintStep++; return; }
    if (!notebook.runs.some(r=>r.levelId===lv.id)) { openModal("hint", "<p>Try a test of your own design before loading an example. An empty or incomplete bridge is also an experiment.</p>"); return; }
    const ref = lv.refs[0];
    openModal("hint", `<p>You have seen every hint. You can load one tested example design (<em>${esc(ref.name)}</em>, ${P.costOf(ref.members)} credits). It is one way that works, not the only or the best one.</p>
      <p class="small muted">Your current design is kept in Undo, so you can go back.</p><div class="result-actions"><button class="btn primary" id="load-ref">Load the example</button></div>`);
    $("load-ref").onclick = () => { M.load(GS.design, withFixedRoad(GS.level,ref.members)); changed(); closeModal(); world().checks["example:" + lv.id] = true; persist(); toast("Example loaded. Test it, then try to make it cheaper."); };
  }

  // ---------- modals ----------
  let lastFocus = null;
  function openModal(kind, html) {
    lastFocus = document.activeElement;
    const titles = { about: "About this game", help: "Help", brief: GS.level ? GS.level.title : "Task", hint: "Hint", map: "Journey map" };
    titles.notebook="Engineering notebook"; titles.practice="Before the first crossing: controls practice";
    $("modal").classList.remove("notebook-modal"); $("modal").dataset.kind=kind;
    $("modal-title").textContent = titles[kind] || kind;
    $("modal-body").innerHTML = html || (kind === "about" ? T.about.replace("Rendering uses Phaser 3.90 (MIT).", "Rendering uses Three.js r165 and OrbitControls (MIT).") : kind === "help" ? helpHtml() : kind === "brief" ? Edu.taskHtml(GS.level) : kind === "map" ? mapHtml() : "");
    hideTip(); R.cancel();
    $("modal").hidden = false;
    if (kind === "help") wireHelp();
    if (kind === "brief") Edu.wireTask();
    $("modal-close").focus();
  }
  function closeModal(restore=true) { Edu.flush(); $("modal").hidden = true; $("modal").classList.remove("notebook-modal"); if(GS.practice&&GS.screen==="build")renderCoach(); if (restore && lastFocus && lastFocus.isConnected && lastFocus.getClientRects().length && !lastFocus.disabled) lastFocus.focus(); }
  function helpHtml() {
    return `<div class="tabs"><button class="btn small primary" data-tab="controls">How to play</button><button class="btn small" data-tab="settings">Settings</button></div>
      <div data-pane="controls"><p class="small">3D view: right-drag to orbit, scroll to zoom, or use Orbit view and drag with one finger. Use two fingers to rotate and zoom. Front view restores the building elevation. During tests, green → yellow → red shows the fraction of each member’s load limit; blue/red end bands show tension/compression. Slack cables are pale and dashed.</p>${T.controls.replace("<h3>Draw road</h3><p>Pick <strong>Road</strong>, then drag from one bank to the other along the dotted line. You can also tap one point, then another.</p>","<h3>Road is ready</h3><p>The prelaid road is locked and counted in your budget. Pick a support material, then drag between existing joints or tap both endpoints. Both truss sides update together.</p>").replace("Blue members are pulled (tension), red members are pushed (compression).", "Blue end bands are pulled (tension), red end bands are pushed (compression). Member bodies show load from green through yellow to red.").replace("Remove members that stayed pale, strengthen the red ones.", "Compare lightly loaded green members with highly loaded red ones, then test your changes. A low reading alone does not prove a member is unnecessary.").replace("1–4 materials · X erase", "1–3 support materials · Arrow keys + Enter build · P pause · X erase")}</div>
      <div data-pane="settings" hidden>
        <p class="small">${esc(storageText())} Use Notebook → Export notebook to include your experiment records and notes.</p><h3>Save progress</h3><p>Progress saves automatically in this browser. To move it to another computer, copy the text below and paste it there.</p>
        <textarea id="save-text" readonly aria-label="Exported progress">${esc(Pr.exportText(GS.save))}</textarea>
        <div class="result-actions"><button class="btn" id="save-copy">Copy</button><button class="btn" id="save-file">Download file</button></div>
        <h3>Load progress</h3><textarea id="load-text" aria-label="Paste progress here" placeholder="Paste exported progress here"></textarea>
        <div class="result-actions"><button class="btn" id="load-go">Load pasted progress</button></div>
        <h3>Tips</h3><div class="result-actions"><button class="btn" id="tips-reset">Show getting-started tips again</button></div>
      </div>`;
  }
  function wireHelp() {
    const tabs = $("modal-body").querySelectorAll("[data-tab]");
    tabs.forEach((t) => t.addEventListener("click", () => {
      tabs.forEach((x) => x.classList.toggle("primary", x === t));
      $("modal-body").querySelectorAll("[data-pane]").forEach((p) => (p.hidden = p.dataset.pane !== t.dataset.tab));
    }));
    $("save-copy").onclick = () => { $("save-text").select(); (navigator.clipboard ? navigator.clipboard.writeText($("save-text").value) : Promise.reject()).then(() => toast("Copied."), () => { document.execCommand && document.execCommand("copy"); toast("Selected. Press Ctrl+C to copy."); }); };
    $("save-file").onclick = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([Pr.exportText(GS.save)], { type: "application/json" })); a.download = "riverbend-progress.json"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
    $("load-go").onclick = () => {
      const text=$("load-text").value.trim();
      if(text.length>2*1024*1024){toast("That progress file is too large.","warn");return;}
      const parsed = Pr.importText(text), r=parsed.ok ? Lab.validateSave(parsed.data) : parsed;
      if (!r.ok) { toast(r.error, "warn"); return; }
      if (!confirm("Replace your current progress with the pasted one? The optional Notebook will start empty; export it separately first.")) return;
      installSave(r.data);
    };
    $("tips-reset").onclick = () => { if (GS.level && GS.level.id === "tabletop") { GS.coachStep = 0; coachAfterEdit(); renderCoach(); } toast("Tips will show on the first crossing."); };
  }
  const ORDER = ["prologue", "tabletop", "willow", "route", "clinic", "mill", "share", "echo", "support", "finale", "report"];
  function mapHtml() {
    const w = world(), cur = ORDER.indexOf(w.node);
    const label = (id) => { const n = L.NODES[id]; return n.type === "level" ? L.LEVELS[n.level].title : n.type === "choice" ? n.title : id === "prologue" ? "Prologue" : "Field report"; };
    const rows = ORDER.filter((id) => !(id === "clinic" && w.firstHelp === "mill") && !(id === "mill" && w.firstHelp === "clinic")).map((id) => {
      const n = L.NODES[id], i = ORDER.indexOf(id);
      let state = i < cur ? "✔" : i === cur ? "▶" : "·", extra = "";
      if (n.type === "level" && w.results[n.level]) extra = " " + "★".repeat(w.results[n.level].stars || 0);
      if (n.type === "choice" && w.choices[id]) extra = " → " + esc(n.options.find((o) => o.id === w.choices[id]).label);
      if ((id === "clinic" || id === "mill") && !w.firstHelp) extra = " (one of these, your choice)";
      return `<li><strong>${state}</strong> ${esc(label(id))}${extra}</li>`;
    });
    return `<ol class="timeline">${rows.join("")}</ol><p class="small muted">Saved credits: ${w.reserve} · Materials: ${w.materials.map((m) => P.MATERIALS[m].name).join(", ")} · Helped: ${w.helped.map((h) => esc(L.NAMES[h] || h)).join(", ") || "nobody yet"}</p>`;
  }
  // ---------- field report ----------
  function renderReport() {
    const w = world();
    const rows = ["tabletop", "willow", w.firstHelp || "clinic", "echo", "finale"].filter((id) => w.results[id]).map((id) => {
      const r = w.results[id], st = r.stars || 0;
      const chk = w.checks[id] === true ? "✔" : w.checks[id] === false ? "worth revisiting" : "-";
      return `<tr><td>${esc(L.LEVELS[id].title)}</td><td>${"★".repeat(st)}${"☆".repeat(3 - st)}</td><td>${r.cost}</td><td>${r.maxSagCm} cm</td><td>${Math.round((r.peakRatio || 0) * 100)}%</td><td>${(r.badges || []).length}</td><td>${chk}</td></tr>`;
    });
    const stars = Object.values(w.results).reduce((a, r) => a + (r.stars || 0), 0);
    const badges = Object.values(w.results).reduce((a, r) => a + (r.badges || []).length, 0);
    const missed = w.firstHelp === "clinic" ? "Stony Ford mill" : "Fern Hollow clinic";
    const extra = w.materials.filter((m) => m === "steel" || m === "cable").map((m) => P.MATERIALS[m].name.toLowerCase()).join(" and ");
    const consequences = [
      `You went to ${esc(L.NAMES[w.firstHelp] || "")} first, so ${esc(missed)} waited${w.shared ? " until you sent them your saved credits." : " and patched their own crossing."}`,
      w.shared ? "Sharing cost your savings but brought a second material and a second community's trust." : `Keeping the credits gave Riverbend a bigger budget, but beyond timber you only had ${esc(extra)}.`,
      `Riverbend was built with: ${esc(L.LEVELS.finale.variants[w.support || "none"].label)}.`,
    ];
    $("report-body").innerHTML = `<p class="eyebrow">Field report</p><h2 id="report-title">Riverbend is connected</h2>
      <p class="lead">The seedlings crossed. ${stars} stars and ${badges} badges over ${w.tests} tests.</p>
      <h3>What your choices changed</h3><ul class="timeline">${consequences.map((c) => `<li>${c}</li>`).join("")}</ul>
      <h3>Your crossings</h3><div class="report-table" role="region" aria-label="Crossing results" tabindex="0"><table><thead><tr><th>Crossing</th><th>Stars</th><th>Credits</th><th>Max drop</th><th>Busiest member</th><th>Badges</th><th>Check</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>
      <div class="engineering-feedback"><strong>Your engineering evidence</strong><p>${notebook.runs.length} recorded tests. Revisit your designs, compare matching conditions, and export your observations and explanation. Stars and quiz answers do not establish engineering mastery.</p><button class="btn" id="rep-notebook">Open engineering notebook</button></div>
      <h3>Final question</h3><p>If you played again, which decision would you change, and how would it change the Riverbend bridge? Use one number from the table as evidence.</p>
      <textarea id="reflection" aria-label="Your answer">${esc(GS.save.reflection || "")}</textarea>
      <div class="result-actions"><button class="btn" id="rep-print">Print / save as PDF</button><button class="btn" id="rep-menu">Main menu</button><button class="btn primary" id="rep-again">Try another path</button></div>`;
    $("reflection").addEventListener("input", (e) => { GS.save.reflection = e.target.value; persist(); });
    $("rep-notebook").onclick=()=>Edu.open("finale");
    $("rep-print").onclick = () => root.print();
    $("rep-menu").onclick = renderMenu;
    $("rep-again").onclick = newJourney;
    show("report");
  }

  // ---------- wiring ----------
  function wire() {
    $("btn-new").onclick = newJourney; $("btn-continue").onclick = cont;
    $("btn-select").onclick = () => openModal("map");
    $("comic-next").onclick = comicNext; $("comic-skip").onclick = () => advance("prologue");
    $("btn-menu").onclick = () => { if(GS.practice){endPractice(false,true);return;} if (GS.mode !== "edit") backToEdit(); persist(); renderMenu(); };
    $("menu-practice").onclick=()=>{persist();openLevel("tabletop",{practice:true});};
    $("btn-notebook").onclick = ()=>Edu.open(GS.level.id); $("menu-notebook").onclick=()=>Edu.open();
    $("btn-pause").onclick=togglePause; $("btn-results").onclick=returnToResults;
    $("btn-map").onclick = () => openModal("map");
    $("tool-erase").onclick = () => setTool(GS.tool === "erase" ? GS.level.materials.find(m=>m!=="road") : "erase");
    $("btn-undo").onclick = undo; $("btn-redo").onclick = redo; $("btn-clear").onclick = clearAll;
    $("btn-hint").onclick = hint;
    $("btn-forces").onclick = () => { GS.forces = !GS.forces; R.setForces(GS.forces); $("btn-forces").setAttribute("aria-pressed", String(GS.forces)); };
    $("btn-forces").setAttribute("aria-pressed", "true");
    $("btn-test").onclick = startTest; $("btn-edit").onclick = backToEdit;
    document.querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () => openModal(b.dataset.open)));
    $("modal-close").onclick = closeModal;
    $("modal").addEventListener("click", (e) => { if (e.target === $("modal")) closeModal(); });
    document.addEventListener("keydown", onKey);
  }
  function onKey(e) {
    if (!$("modal").hidden) {
      if(e.key==="Escape")closeModal();
      if(e.key==="Tab"){const nodes=[...$("modal").querySelectorAll('button:not(:disabled),input,select,textarea,[tabindex="0"]')].filter(n=>n.getClientRects().length);if(nodes.length){const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}return;
    }
    if (GS.screen !== "build" || /input|textarea|select/i.test(e.target.tagName)) return;
    const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
    if (mod && k === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if (mod && k === "y") { e.preventDefault(); redo(); return; }
    if (e.key === "Escape") { R.cancel(); return; }
    if (e.key === " " && e.target.tagName !== "BUTTON") { e.preventDefault(); GS.mode === "edit" ? startTest() : backToEdit(); return; }
    if (k === "f") { $("btn-forces").click(); return; }
    if (k === "p" && GS.mode === "test") { togglePause(); return; }
    if (GS.mode !== "edit") return;
    const n = parseInt(e.key, 10), materials=GS.level.materials.filter(m=>m!=="road");
    if (n >= 1 && n <= materials.length) setTool(materials[n - 1]);
    else if (k === "x") setTool("erase");
    else if (k === "f") $("btn-forces").click();
  }

  // ---------- QA hooks (game-qa skill) ----------
  root.__GAME_STATE__ = GS; root.__EVENT_BUS__ = Bus; root.__EVENTS__ = E;
  root.render_game_to_text = () => {
    const out = { coords: "grid units of 0.5 m; origin at left deck end; x right, y up", screen: GS.screen, mode: GS.mode };
    if (GS.save) { const w = world(); out.node = w.node; out.world = { reserve: w.reserve, materials: w.materials, helped: w.helped, support: w.support, choices: w.choices }; }
    if (GS.screen === "build" && GS.level) {
      out.level = { id: GS.level.id, span_m: GS.level.span, budget: GS.level.totalBudget, materials: GS.level.materials };
      out.design = { members: GS.design.members.length, cost: cost(), warnings: M.warnings(GS.design) };
      out.tool = GS.tool; out.paused=GS.paused; out.notebookRuns=notebook.runs.length;
      if (GS.sim) out.sim = { t: +GS.sim.t.toFixed(2), vehicle_x_m: +GS.sim.vehicle.front.toFixed(2), maxSagCm: Math.round(GS.sim.maxSag * 1000) / 10, broken: GS.sim.mems.filter((m) => m.broken).length, outcome: GS.sim.outcome, slowmo: GS.slowmo > 0 };
      if (GS.lastSummary && GS.mode !== "test") out.result = GS.lastSummary.rec;
    }
    if (GS.screen === "choice") out.options = L.NODES[world().node].options.map((o) => ({ id: o.id, available: !o.requires || o.requires(world()) }));
    return JSON.stringify(out);
  };
  root.__ENGINEERING_NOTEBOOK__=()=>notebook; root.__INQUIRY_NOTES__=()=>inquiry;
  root.advanceTime = (ms) => new Promise((resolve) => { const t0 = performance.now(); (function f() { if (performance.now() - t0 >= ms) resolve(); else requestAnimationFrame(f); })(); });
  // Test-only helper: load the first example design for the current level.
  root.__loadExample = () => { if (GS.level && GS.mode === "edit") { M.load(GS.design, withFixedRoad(GS.level,GS.level.refs[0].members)); changed(); return true; } return false; };

  const Edu=root.EngineeringUI.create({GS,P,L,M,R,Lab,esc,getBook:()=>notebook,getNotes:()=>inquiry,Notes,saveBook,storageText,persist,toast,download,withFixedRoad,openModal,closeModal,backToEdit,changed,startTest,importBook:r=>installSave(r.progress,r.notebook,r.inquiry)});
  // Adapt presentation events without changing the original event definitions.
  Bus.on(E.TEST_STARTED,()=>Bus.emit('test:start',{levelId:GS.level&&GS.level.id,practice:GS.practice}));
  Bus.on('test:start',({levelId,practice})=>{
    if(practice||GS.practice||!GS.level||GS.mode!=='test'||GS.level.id!==levelId||GS.testNoteIndex!==null)return;
    GS.testNoteIndex=Notes.start(inquiry,levelId,Date.now());persist();
  });
  Bus.on(E.TEST_FINISHED,({outcome,rec})=>{
    if(GS.practice||!GS.level)return;
    Bus.emit(outcome==='pass'?'level:pass':'test:fail',{levelId:GS.level.id,rec});
  });
  function refreshTask(){if(!$('modal').hidden&&$('modal').dataset.kind==='brief'){$('modal-body').innerHTML=Edu.taskHtml(GS.level);Edu.wireTask();}}
  Bus.on('test:fail',({levelId})=>{
    if(GS.practice||!GS.level||GS.level.id!==levelId||GS.teaching.block2)return;
    GS.teaching.block2=true;GS.teachingNotice='block2';refreshTask();
  });
  Bus.on('level:pass',({levelId,rec})=>{
    if(GS.practice||!GS.level||GS.level.id!==levelId||!rec||!rec.pass)return;
    const preview=Lab.copy(world()),brought=world().reserve,delta=L.applyResult(preview,levelId,rec);
    GS.savings={carry:delta.carry,used:delta.usedReserve,brought,total:preview.reserve};
    if(!GS.teaching.block3){GS.teaching.block3=true;GS.teachingNotice='block3';refreshTask();}
  });
  root.addEventListener("beforeunload",()=>Edu.flush());
  root.addEventListener("pagehide",()=>Edu.flush());
  // ---------- boot ----------
  function boot() {
    const loaded=Pr.load(store,L.newWorld),checked=Lab.validateSave(loaded);
    GS.save=checked.ok?checked.data:Pr.blank(L.newWorld); notebook=Lab.load(store,GS.save); inquiry=Notes.migrate(notebook,Notes.load(store,Lab.progressStamp(GS.save)));saveBook();
    wire();
    renderMenu();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})(typeof self !== "undefined" ? self : this);
