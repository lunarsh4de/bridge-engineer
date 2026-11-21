/* Riverbend: Bridge Engineer - levels, branching story graph and world-state rules.
 * Grid units: 1 step = 0.5 m. Deck runs along y = 0 from x = 0 to x = N. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BridgeLevels = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  // ---------- reference design builders (one tested example, never "the answer") ----------
  const deck = (N, p) => { const r = []; for (let x = 0; x < N; x += p) r.push({ a: [x, 0], b: [x + p, 0], m: "road" }); return r; };
  const isDiag = (m) => m.a[0] !== m.b[0] && m.a[1] !== m.b[1];
  function under(N, p, d, mat) {
    const o = [], xs = [], mid = N / 2;
    for (let x = 0; x <= N; x += p) xs.push(x);
    for (let i = 0; i < xs.length - 1; i++) o.push({ a: [xs[i], -d], b: [xs[i + 1], -d], m: mat.chord });
    for (let i = 1; i < xs.length - 1; i++) o.push({ a: [xs[i], 0], b: [xs[i], -d], m: mat.vert });
    for (let i = 0; i < xs.length - 1; i++) {
      if (xs[i + 1] <= mid) o.push({ a: [xs[i], -d], b: [xs[i + 1], 0], m: mat.web });
      else o.push({ a: [xs[i + 1], -d], b: [xs[i], 0], m: mat.web });
    }
    return o;
  }
  function over(N, p, h, mat) {
    const o = [], xs = [], mid = N / 2;
    for (let x = 0; x <= N; x += p) xs.push(x);
    const L = xs.length;
    for (let i = 1; i < L - 2; i++) o.push({ a: [xs[i], h], b: [xs[i + 1], h], m: mat.chord });
    for (let i = 1; i < L - 1; i++) o.push({ a: [xs[i], 0], b: [xs[i], h], m: mat.web });
    o.push({ a: [0, 0], b: [xs[1], h], m: mat.chord }, { a: [N, 0], b: [xs[L - 2], h], m: mat.chord });
    for (let i = 1; i < L - 2; i++) {
      if (xs[i + 1] <= mid) o.push({ a: [xs[i], h], b: [xs[i + 1], 0], m: mat.web });
      else o.push({ a: [xs[i + 1], h], b: [xs[i], 0], m: mat.web });
    }
    return o;
  }
  function stays(N, p, H) {
    const o = [];
    for (let x = p; x < N; x += p) o.push({ a: x <= N / 2 ? [0, H] : [N, H], b: [x, 0], m: "cable" });
    return o;
  }
  const T = { chord: "timber", vert: "timber", web: "timber" };
  const withDiag = (list, m) => list.map((x) => (isDiag(x) ? { ...x, m } : x));
  const banks = (N, d) => [[0, 0], [N, 0], [0, -d], [N, -d]];

  // ---------- levels ----------
  // budget: credits for this crossing. refs: tested examples kept for tests and the "show an example" hint.
  const LEVELS = {
    tabletop: {
      id: "tabletop", title: "The Tabletop Model", place: "Workshop", N: 8, deckStep: 2, anchors: banks(8, 2),
      mass: 700, cargo: "a toolbox cart", budget: 120, materials: ["road", "timber"], sagLimit: 0.12,
      brief: "Mara the guide sets a model gorge on the workshop table. \"Before we build for real, show me that a road alone is not enough.\"",
      goal: "Get the cart across a 4 m gap.",
      concept: "A road resting on two ends bends in the middle. A triangle turns that bending into push and pull.",
      hints: ["Run a road-only test first. Notice which point drops furthest and by how much.", "A single piece from a lower anchor to the mid-road reduces drop. Test it and read the force colour on that piece.", "Two slanted pieces make two triangles. Compare the peak force with one piece versus two."],
      check: { q: "Your slanted timber pieces push up on the road. Which force are they carrying?", options: ["Compression (being pushed)", "Tension (being pulled)", "No force"], answer: 0, why: "They are squeezed between the bank and the road, so they carry compression. Compression members can buckle if they are long." },
      refs: [{ name: "Two struts", members: [...deck(8, 2), { a: [0, -2], b: [4, 0], m: "timber" }, { a: [8, -2], b: [4, 0], m: "timber" }] }],
    },
    willow: {
      id: "willow", title: "Willow Creek", place: "School path", N: 12, deckStep: 2, anchors: banks(12, 3),
      mass: 900, cargo: "the school book cart", budget: 220, materials: ["road", "timber"], sagLimit: 0.10,
      brief: "The flood took the footbridge to Willow Creek School. Children walk an hour around the valley. Only timber is left in the shed.",
      goal: "Cross 6 m with timber only. Stay inside the budget.",
      concept: "A long compressed piece buckles; short ones sharing the same load do not. Under-deck and over-deck trusses both triangulate the same gap — they differ in which members carry tension versus compression, and therefore in cost.",
      hints: ["Try two long diagonal struts first. Watch the colour when they fail — that tells you the failure mode.", "Break the same path into shorter pieces. Notice how many extra members you need and what that costs.", "Compare an under-deck arrangement with an over-deck one on the same test conditions. Which uses fewer credits?"],
      check: { q: "Why did breaking one long strut into short pieces help?", options: ["Short pieces in compression resist buckling better", "Short pieces weigh more", "Short pieces carry no force"], answer: 0, why: "Buckling capacity falls quickly as a compressed member gets longer. In this game it falls with length squared." },
      refs: [
        { name: "Deck truss", members: [...deck(12, 4), ...under(12, 4, 3, T)] },
        { name: "Through truss", members: [...deck(12, 4), ...over(12, 4, 3, T)] },
      ],
    },
    clinic: {
      id: "clinic", title: "Fern Hollow", place: "Clinic road", N: 16, deckStep: 2, anchors: [[0, 0], [16, 0], [0, 8], [16, 8]],
      mass: 1300, cargo: "the medicine van", budget: 210, materials: ["road", "timber", "cable"], newMaterial: "cable", sagLimit: 0.10,
      brief: "Fern Hollow's clinic is out of insulin. The gorge walls are sheer rock, so there is nothing to brace against below the road. There are anchor rings high on both cliffs.",
      goal: "Cross 8 m. You have no low supports, only high cliff anchors.",
      concept: "Cable carries tension only — it goes slack when pushed. That constraint shapes two valid routes: hang the road from above with cables, or build a timber truss over the road. Each trades member count, weight and cost differently.",
      hints: ["There are no lower anchors. Decide: suspend the road from the cliff rings, or build structure above the road between them.", "Run a test on your first attempt and check which members are slack or over-stressed. That evidence should guide your next change.", "If you used cables: try replacing one with timber and compare drop and cost. If you used a truss: try replacing the tension members with cable."],
      check: { q: "A cable turns dashed and pale during the test. What does that mean?", options: ["It is slack: something pushed it, and cable cannot push back", "It is about to snap from pulling", "It became steel"], answer: 0, why: "Cable carries tension only. Use cable where the structure pulls, and timber or steel where it pushes." },
      refs: [
        { name: "Cable stays", members: [...deck(16, 4), ...stays(16, 4, 8)] },
        { name: "Timber through truss", members: [...deck(16, 4), ...over(16, 4, 3, T)] },
      ],
    },
    mill: {
      id: "mill", title: "Stony Ford", place: "Mill crossing", N: 12, deckStep: 2, anchors: banks(12, 3),
      mass: 3200, cargo: "the loaded grain wagon", budget: 290, materials: ["road", "timber", "steel"], newMaterial: "steel", sagLimit: 0.09,
      brief: "The mill feeds the whole valley, but its wagon weighs 3.2 tonnes. A timber truss that would carry a book cart will fold under it. The miller lends you steel.",
      goal: "Cross 6 m with a 3.2 t wagon. Steel costs three times as much as timber. The budget is tight.",
      concept: "Every member carries a different force. Steel is three times the cost of timber — placing it everywhere is wasteful and exceeds the budget. The challenge is reading which specific members are overloaded, then upgrading only those.",
      hints: ["Build a full timber truss and test it. Read the peak-force colour on each member type — which category fails first, and in which mode?", "Replace only the members that failed. Test again. If new failures appear in a different location, repeat the process.", "Compare the cost of your selective design against one where all members are steel. Which passes within budget?"],
      check: { q: "You swapped only the slanted members to steel and it passed. What design idea is this?", options: ["Match material to the force each member carries", "Steel everywhere is always best", "Heavier bridges are always safer"], answer: 0, why: "Engineers spend strength where it is needed. Extra steel adds weight and cost without helping where force is low." },
      refs: [
        { name: "Steel diagonals", members: withDiag([...deck(12, 3), ...under(12, 3, 3, T)], "steel") },
      ],
    },
    echo: {
      id: "echo", title: "Echo Gorge", place: "Valley road", N: 20, deckStep: 2, anchors: [...banks(20, 4), [0, 8], [20, 8]],
      mass: 1800, cargo: "the supply truck for Riverbend", budget: 465, materials: ["road", "timber"], sagLimit: 0.08,
      brief: "Every road to Riverbend runs through Echo Gorge. Whatever you learned at your last crossing is what you bring here.",
      goal: "Cross 10 m within budget. The sag limit is tighter than before.",
      concept: "A 10 m span demands more from your structure. Steel and cable each enable a valid solution, but through different mechanisms — selective steel diagonals reduce buckling cost, while cable stays shift load paths entirely. The budget does not allow both strategies at full scale.",
      hints: ["Run your best design from earlier levels and check whether it still passes the tighter sag limit here. Note which constraint — strength or stiffness — is now the binding one.", "If you have steel: test with only the diagonals in steel and read the drop value. If you have cable: test a stays-only layout and check cost against the bar.", "Change one variable at a time — material type, member count, or depth — and record drop and cost for each test before changing anything else."],
      check: { q: "A friend solved Echo Gorge with a different structure from yours. Both passed. Which is true?", options: ["Both can be valid; compare drop, peak force and cost", "Only the cheaper one is a real bridge", "One of you must have found a bug"], answer: 0, why: "Design problems usually have many valid answers. Engineers compare them with evidence and trade-offs." },
      refs: [
        { name: "Steel-diagonal deck truss", needs: ["steel"], members: withDiag([...deck(20, 4), ...under(20, 4, 4, T)], "steel") },
        { name: "Cable stays", needs: ["cable"], members: [...deck(20, 4), ...stays(20, 4, 8)] },
      ],
    },
    finale: {
      id: "finale", title: "Riverbend Crossing", place: "Riverbend", N: 24, deckStep: 2, anchors: banks(24, 4),
      mass: 3000, cargo: "the seedling convoy", budget: 380, materials: ["road", "timber", "steel", "cable"], sagLimit: 0.08,
      brief: "The middle bridge of Riverbend is gone, and the seedlings must reach the far fields before the frost. This is the 12 m crossing the whole valley has waited for.",
      goal: "Cross 12 m with a 3 t convoy. The sag limit is strict. Use the support the town chose.",
      concept: "The same 12 m gap has three different anchor configurations depending on your earlier choices. Each changes which structural type is viable. Span length, available anchors and budget must all be satisfied together — no single approach works for every variant.",
      hints: ["Study the anchors you have before placing a single member. Sketch the load path from road to anchor for your specific variant.", "Build the minimum structure that closes the road, test it, and read the two key numbers: drop and cost. That evidence tells you which constraint to address first.", "Change one thing — add a member, change a material, adjust depth — then test again. Keep the evidence from each test so you can compare which change had the most effect."],
      check: { q: "Which change reduces force in a bridge's members most directly?", options: ["Adding a support that shortens the span", "Painting the bridge", "Making the road longer than the gap"], answer: 0, why: "Bending effects grow fast with span. A pier or stay shortens the length each part must carry." },
      // finale refs depend on the support variant
      variants: {
        pier: { anchorsAdd: [[12, 0], [12, -4]], label: "River pier", refs: [{ name: "Steel struts on the pier", members: [...deck(24, 4), { a: [0, -4], b: [4, 0], m: "steel" }, { a: [12, -4], b: [8, 0], m: "steel" }, { a: [12, -4], b: [16, 0], m: "steel" }, { a: [24, -4], b: [20, 0], m: "steel" }] }] },
        towers: { anchorsAdd: [[0, 8], [24, 8]], label: "Cliff towers", refs: [{ name: "Cable stays", members: [...deck(24, 4), ...stays(24, 4, 8)] }] },
        none: { anchorsAdd: [], label: "No extra support", budgetAdd: 300, refs: [{ name: "Deep truss, cable bottom chord", members: [...deck(24, 4), ...under(24, 4, 4, { chord: "cable", vert: "steel", web: "steel" })] }] },
      },
    },
  };
  // Optional challenge badges. tests/campaign.test.cjs proves each one is reachable on every path.
  const BADGES = {
    tabletop: [{ kind: "minimal", n: 6 }, { kind: "stiff", cm: 8 }],
    willow: [{ kind: "minimal", n: 9 }, { kind: "cool", max: 0.5 }, { kind: "budget", credits: 140 }],
    clinic: [{ kind: "nomat", mat: "timber" }, { kind: "cool", max: 0.3 }, { kind: "minimal", n: 7 }],
    mill: [{ kind: "cool", max: 0.45 }, { kind: "budget", credits: 280 }, { kind: "stiff", cm: 1 }],
    echo: [{ kind: "stiff", cm: 1.5 }, { kind: "cool", max: 0.5 }],
    finale: [{ kind: "stiff", cm: 4 }, { kind: "cool", max: 0.7 }],
  };
  for (const id of Object.keys(BADGES)) LEVELS[id].badges = BADGES[id];
  for (const L of Object.values(LEVELS)) {
    L.span = L.N * 0.5;
    const ys = L.anchors.map((a) => a[1]).concat(L.variants ? Object.values(L.variants).flatMap((v) => v.anchorsAdd.map((a) => a[1])) : []);
    L.yMin = Math.min(-2, ...ys) - 2;
    L.yMax = Math.max(4, ...ys) + 1;
  }

  // ---------- world state ----------
  // Persistent across the run. Choices write it; levels and later choices read it.
  function newWorld() {
    return {
      node: "prologue", materials: ["road", "timber"], reserve: 0,
      helped: [], shared: false, support: null, firstHelp: null,
      log: [], results: {}, checks: {}, tests: 0, choices: {},
    };
  }
  const NAMES = { clinic: "Fern Hollow clinic", mill: "Stony Ford mill", school: "Willow Creek School" };

  // ---------- story graph: branch and bottleneck ----------
  // prologue -> tabletop -> willow -> [choice:route] -> clinic | mill -> [choice:share]
  //   -> echo (bottleneck) -> [choice:support] -> finale -> report
  const NODES = {
    prologue: { type: "comic", next: "tabletop" },
    tabletop: { type: "level", level: "tabletop", next: "willow" },
    willow: { type: "level", level: "willow", next: "route" },
    route: {
      type: "choice", title: "The valley council",
      text: (w) => "Willow Creek's children walk to school again. That evening two messages arrive at once, and the crew can only reach one place first. Whoever waits will remember it.",
      options: [
        { id: "clinic", label: "Go to Fern Hollow clinic", detail: "Medicine first. You will learn to build with cable. The mill's grain waits.", effect: (w) => { w.firstHelp = "clinic"; w.helped.push("clinic"); add(w.materials, "cable"); }, next: "clinic" },
        { id: "mill", label: "Go to Stony Ford mill", detail: "Food for the whole valley. You will learn to build with steel. The clinic waits.", effect: (w) => { w.firstHelp = "mill"; w.helped.push("mill"); add(w.materials, "steel"); }, next: "mill" },
      ],
    },
    clinic: { type: "level", level: "clinic", next: "share" },
    mill: { type: "level", level: "mill", next: "share" },
    share: {
      type: "choice", title: "A request from the other side",
      text: (w) => {
        const other = w.firstHelp === "clinic" ? "Stony Ford mill" : "Fern Hollow clinic";
        return `${other} sends a runner. They are patching a crossing themselves and ask for your spare credits (${w.reserve} saved so far). In return they will teach your crew their material.`;
      },
      options: [
        { id: "share", label: "Send the spare credits", detail: "Lose your saved credits. Gain the other community's material and their trust.", effect: (w) => { w.shared = true; w.reserve = 0; const other = w.firstHelp === "clinic" ? "mill" : "clinic"; w.helped.push(other); add(w.materials, other === "mill" ? "steel" : "cable"); }, next: "echo" },
        { id: "keep", label: "Keep the credits for Riverbend", detail: "Keep your savings for the big crossing. Bring only the material you know.", effect: (w) => { w.shared = false; }, next: "echo" },
      ],
    },
    echo: { type: "level", level: "echo", next: "support" },
    support: {
      type: "choice", title: "How will Riverbend be supported?",
      text: () => "The town gathers on the riverbank. What they can offer depends on who you helped along the way.",
      options: [
        { id: "pier", label: "Build a stone pier in the river", detail: "Halves the span. Stony Ford's quarry crew must agree.", requires: (w) => w.helped.includes("mill"), lockedText: "Needs the trust of Stony Ford mill.", effect: (w) => { w.support = "pier"; }, next: "finale" },
        { id: "towers", label: "Raise cliff towers", detail: "High anchors for cable stays. Fern Hollow's riggers must agree.", requires: (w) => w.helped.includes("clinic"), lockedText: "Needs the trust of Fern Hollow clinic.", effect: (w) => { w.support = "towers"; }, next: "finale" },
        { id: "none", label: "No extra support", detail: "Nothing in the river. The town adds 300 credits, but the truss must span all 12 m.", effect: (w) => { w.support = "none"; }, next: "finale" },
      ],
    },
    finale: { type: "level", level: "finale", next: "report" },
    report: { type: "report" },
  };
  function add(list, x) { if (!list.includes(x)) list.push(x); }

  // Level config resolved against the world state.
  function resolveLevel(id, w) {
    const L = LEVELS[id];
    if(L.resolve)return L.resolve(w);
    const out = { ...L, anchors: L.anchors.slice(), refs: (L.refs || []).slice() };
    if (id === "echo") out.materials = ["road", "timber", ...w.materials.filter((m) => m === "steel" || m === "cable")];
    if (id === "finale") {
      const v = L.variants[w.support || "none"];
      out.anchors = L.anchors.concat(v.anchorsAdd);
      out.refs = v.refs;
      out.supportLabel = v.label;
      out.budget = L.budget + (v.budgetAdd || 0);
    }
    out.refs = out.refs.filter((r) => !r.needs || r.needs.every((m) => out.materials.includes(m)));
    out.reserve = w.reserve;
    out.totalBudget = out.budget + (id === "tabletop" ? 0 : w.reserve);
    return out;
  }

  // Savings: half of what you did not spend carries forward as reserve.
  function applyResult(w, levelId, res) {
    const L = resolveLevel(levelId, w);
    const spentReserve = Math.max(0, res.cost - L.budget);
    const usedReserve = levelId === "tabletop" ? 0 : Math.min(w.reserve, spentReserve);
    w.reserve -= usedReserve;
    const saved = Math.max(0, L.budget - res.cost);
    const carry = levelId === "tabletop" ? 0 : Math.floor(saved / 2);
    w.reserve += carry;
    w.results[levelId] = { ...res, carry, usedReserve };
    if (levelId === "willow") w.helped.includes("school") || w.helped.push("school");
    return { carry, usedReserve };
  }

  return { LEVELS, NODES, NAMES, newWorld, resolveLevel, applyResult, builders: { deck, under, over, stays, withDiag } };
});
