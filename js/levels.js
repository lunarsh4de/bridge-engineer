(function (root) {
  "use strict";

  const levels = [
    {
      id: 1,
      name: "The first crossing",
      place: "Willow Creek",
      left: 440,
      right: 1040,
      deckY: 430,
      truckMass: 600,
      inventory: { road: 6.2, wood: 14, steel: 0, cable: 0 },
      story:
        "The school garden is cut off. Build a crossing before tomorrow's seed delivery is cancelled.",
      constraint: "6 m span · timber only",
      concept: "Geometry before strength",
      lesson:
        "A pin-jointed rectangle can fold. A diagonal creates triangles that resist changing shape.",
      hint: "Build a continuous road, then connect a row of timber triangles to both banks.",
      caseTitle: "Triangles at work",
      newMaterial: "Start with timber",
      guideY: 330,
      reference: { diagonal: "wood", chord: "wood" },
      explanation:
        "The delivery load enters the road joints. The diagonals and upper chord share axial forces and carry them to both fixed banks.",
    },
    {
      id: 2,
      name: "Room to grow",
      place: "Fern Valley",
      left: 340,
      right: 1140,
      deckY: 430,
      truckMass: 1000,
      inventory: { road: 8.2, wood: 19, steel: 0, cable: 0 },
      story:
        "The hillside farms need a wider route. The harvest cart is heavier, so every disconnected member wastes scarce timber.",
      constraint: "8 m span · heavier delivery",
      concept: "Follow the load",
      lesson:
        "Loads need a continuous route to the banks. Extra members add weight unless they join that route.",
      hint: "Trace connected members from each road joint toward a bank. A floating triangle carries no load away.",
      caseTitle: "A connected structure",
      newMaterial: "More timber, a wider river",
      guideY: 330,
      reference: { diagonal: "wood", chord: "wood" },
      explanation:
        "A longer deck introduces more loaded joints. The connected triangular frame distributes those forces instead of leaving the jointed road to deform without a supporting load path.",
    },
    {
      id: 3,
      name: "A stronger connection",
      place: "The high pass",
      left: 240,
      right: 1240,
      deckY: 430,
      truckMass: 1800,
      inventory: { road: 10.2, wood: 13, steel: 18, cable: 12 },
      story:
        "The community workshop is waiting for machinery. A long crossing and limited timber make material choice part of the design.",
      constraint: "10 m span · mixed materials",
      concept: "Different jobs, different materials",
      lesson:
        "Steel is stronger and stiffer in this model, but heavier. Cable carries tension only.",
      hint: "Keep timber in moderate-force diagonals. Use steel where the force display shows a demanding role.",
      caseTitle: "Tension and compression",
      newMaterial: "Steel + cables unlocked",
      guideY: 305,
      reference: {
        diagonal: "wood",
        endDiagonal: "steel",
        chord: "steel",
      },
      explanation:
        "The end diagonals transfer much of the truss force into the banks, while the upper chord links the triangular cells. The example uses stronger steel in those roles.",
    },
    {
      id: 4,
      name: "Pulling together",
      place: "Millwater Reach",
      left: 340,
      right: 1140,
      deckY: 430,
      truckMass: 1400,
      inventory: { road: 8.2, wood: 8, steel: 16, cable: 8 },
      story:
        "The riverside mill needs a route before its waterwheel repair stops production. Timber is short, but cable has arrived.",
      constraint: "8 m span · cable must pull",
      concept: "A cable needs a pulling job",
      lesson:
        "A cable becomes slack when pushed. Below this deck, a lower chord can be pulled while steel diagonals carry compression and tension.",
      hint: "Try a truss below the road. Use cable between its lower joints, then inspect whether every cable is in tension.",
      caseTitle: "Cables, towers and load paths",
      newMaterial: "Give cable a tension role",
      guideY: 555,
      reference: { diagonal: "steel", chord: "cable" },
      explanation:
        "The steel diagonals carry forces between the road and lower joints. The lower cable chord ties those joints together in tension; it cannot replace a compressed upper chord.",
    },
    {
      id: 5,
      name: "The stepping stone",
      place: "Alder Ford",
      left: 200,
      right: 1400,
      deckY: 430,
      truckMass: 2400,
      inventory: { road: 12.2, wood: 31, steel: 4, cable: 0 },
      piers: [{ id: "pier", x: 800, y: 430 }],
      story:
        "A repaired stone pier can support the clinic supply route. Use it well or the twelve-metre crossing still acts like one long span.",
      constraint: "12 m crossing · one fixed centre pier",
      concept: "Supports change the load path",
      lesson:
        "A fixed middle support gives the load another route to the ground and divides the crossing into shorter effective spans.",
      hint: "Join the road and frame directly to the orange centre pier. Compare the two halves of the crossing.",
      caseTitle: "Piers and shorter spans",
      newMaterial: "A centre pier changes the problem",
      guideY: 305,
      reference: { diagonal: "wood", chord: "wood" },
      explanation:
        "Some load now reaches the ground through the centre pier instead of travelling all the way to a bank. The frame still needs connected paths on both sides.",
    },
    {
      id: 6,
      name: "The cable line",
      place: "Glen Echo",
      left: 240,
      right: 1240,
      deckY: 430,
      truckMass: 2200,
      inventory: { road: 10.2, wood: 5, steel: 21, cable: 11 },
      story:
        "A rescue radio must reach the far ridge before the next storm. The gorge has no place for a pier, and the cable stock must do real work.",
      constraint: "10 m clear span · cable-and-steel system",
      concept: "Tension needs a complete system",
      lesson:
        "Cable can close a tension chord, but steel struts and fixed banks must complete the force path.",
      hint: "Build below the deck. Check for slack cable and make sure every steel diagonal reaches a road or chord joint.",
      caseTitle: "A tension chord",
      newMaterial: "No pier in the gorge",
      guideY: 565,
      reference: { diagonal: "steel", chord: "cable" },
      explanation:
        "The lower cable chord is pulled as the loaded deck tends to spread the lower joints. Steel diagonals connect that tension system back to the deck and banks.",
    },
    {
      id: 7,
      name: "The heavy convoy",
      place: "Foundry Bend",
      left: 340,
      right: 1140,
      deckY: 430,
      truckMass: 4800,
      inventory: { road: 8.2, wood: 5, steel: 26, cable: 6 },
      story:
        "The foundry can restart only if a heavy generator crosses. A shape that survived a farm cart may overload here.",
      constraint: "8 m span · 4,800 kg delivery",
      concept: "The same shape can meet a different limit",
      lesson:
        "Higher load raises member force and deformation. Stronger material helps, but its extra self-weight still counts.",
      hint: "Start with a deep connected truss. Inspect overload ratios before replacing members at random.",
      caseTitle: "Designing for a heavier load",
      newMaterial: "A much heavier delivery",
      guideY: 300,
      reference: { diagonal: "steel", chord: "steel" },
      explanation:
        "A deeper steel truss spreads the generator load through several triangles. The force display shows which members approach their modeled capacity as the truck moves.",
    },
    {
      id: 8,
      name: "Riverbend restored",
      place: "Riverbend Crossing",
      left: 200,
      right: 1400,
      deckY: 430,
      truckMass: 5000,
      inventory: { road: 12.2, wood: 5, steel: 30, cable: 12 },
      piers: [{ id: "pier", x: 800, y: 430 }],
      story:
        "The final relief convoy links every community. Combine the centre pier, steel and cable so the longest, heaviest route stays open.",
      constraint: "12 m crossing · centre pier · 5,000 kg convoy",
      concept: "Combine evidence, do not copy a shape",
      lesson:
        "Use prior test evidence to choose geometry, support routes and material roles. Every added member has a cost and a force job.",
      hint: "Plan two connected half-spans around the pier. Use cable only where the force remains tensile through the crossing.",
      caseTitle: "A system of supports and members",
      newMaterial: "Capstone: combine the ideas",
      guideY: 570,
      reference: { diagonal: "steel", chord: "cable" },
      explanation:
        "The pier provides a central reaction, the steel diagonals route load from the deck, and the lower cable chord ties each run of joints in tension. Other arrangements can also pass.",
    },
  ];

  const learningById = {
    1: {
      delivery: "Seedlings for Willow Creek School",
      goal: "Create a continuous road that keeps the seed cart within the crossing limit.",
      decision: "What will stop the timber frame from changing shape under the cart?",
      newConstraint: "Only timber can support this short first crossing.",
      hints: [
        { kind: "observe", text: "Watch one road joint during the test. Does its support keep its shape, or fold as the cart arrives?" },
        { kind: "principle", text: "A diagonal can divide a four-sided frame into shapes that resist changing angle. It still needs connections to the road and a fixed bank." },
      ],
      misconception: "A road that reaches the far bank is not necessarily supported; road pieces alone can connect while the frame folds below them.",
      failure: { title: "Seed cart waiting", body: "The crossing could not hold its shape, so the school planting day is delayed.", next: "Inspect the first joint that dropped or broke, then change one connected support." },
      success: { title: "Seedlings delivered", body: "Willow Creek School can plant its garden.", route: "The school route is reconnected." },
      forceExplanation: "The cart pushes down at road joints. Connected timber members carry axial push or pull from those joints to the fixed banks; members that do not join that route cannot support the delivery.",
      cerPrompt: "What change kept the frame stable, and what test evidence supports your claim?",
      notebook: { prediction: "Which joint will move most when the cart reaches it?", evidence: "Record maximum drop and the first broken or overloaded member.", comparison: "Change one connection or diagonal, then retest under the same 600 kg load." },
      consequence: "The first seed delivery starts Riverbend's reconnection.",
    },
    2: {
      delivery: "Harvest crates for Fern Valley farms",
      goal: "Support a longer road with a connected route from every loaded area to the banks.",
      decision: "Which members actually carry the harvest load to a fixed support?",
      newConstraint: "The span is wider and the cart is heavier, while timber remains limited.",
      hints: [
        { kind: "observe", text: "Select a road joint near midspan and trace only shared joints toward a bank. Where does the chain stop?" },
        { kind: "principle", text: "A load path must be continuous. A nearby or crossing member does no work unless it shares joints that connect the load to a fixed support." },
      ],
      misconception: "A floating cluster or two crossing lines may look braced, but proximity is not a structural connection in this model.",
      failure: { title: "Harvest held at the river", body: "The crates cannot reach the market while the longer route has a gap in its support path.", next: "Find the loaded joint whose connected path ends before a bank." },
      success: { title: "Harvest route open", body: "Fern Valley's produce can move through Riverbend again.", route: "The farm route joins the school route." },
      forceExplanation: "Each additional road joint receives part of the moving load. Only members joined through shared nodes can pass that force onward to a fixed bank; disconnected timber adds self-weight without completing the route.",
      cerPrompt: "Which connection completed the load path, and what changed in the result?",
      notebook: { prediction: "Where might the longer bridge's load path become disconnected?", evidence: "Note drop, break location, and whether the suspected joint connects to a bank.", comparison: "Repair one missing connection and compare under the same 1,000 kg load." },
      consequence: "Farm deliveries now follow the seed route into town.",
    },
    3: {
      delivery: "Workshop machinery for the High Pass community",
      goal: "Choose timber, steel, and cable for roles they can perform across the long span.",
      decision: "Where does stronger steel earn its extra self-weight, and where can lighter material remain?",
      newConstraint: "A 10 m crossing must be built with mixed materials and scarce timber.",
      hints: [
        { kind: "observe", text: "Run Forces and look for the members with the highest demand or the first overload. Are they pulling, pushing, or slack?" },
        { kind: "principle", text: "Material choice should follow the force role: cable only pulls, while steel is stiffer and stronger here but also heavier." },
      ],
      misconception: "Replacing every member with steel is not automatically better; added self-weight also travels through the structure.",
      failure: { title: "Machinery paused", body: "The workshop cannot restart because one demanding material role was not resolved.", next: "Use the force display to change one high-demand member rather than replacing everything." },
      success: { title: "Workshop supplied", body: "The High Pass workshop can repair tools for the connected communities.", route: "The workshop becomes the third active stop." },
      forceExplanation: "Forces travel through the long connected frame to both banks. Steel can reduce deformation in demanding axial roles; timber can remain where demand is moderate, and cable contributes only where it stays in tension.",
      cerPrompt: "Which material choice mattered most, and which force or drop evidence justifies it?",
      notebook: { prediction: "Which member role will demand the strongest or stiffest material?", evidence: "Record its force state, overload evidence, and maximum drop.", comparison: "Change one material while keeping geometry and the 1,800 kg load fixed." },
      consequence: "Repair tools can now travel to the school and farms.",
    },
    4: {
      delivery: "Waterwheel parts for Millwater Reach",
      goal: "Make the available cable carry tension as part of a complete steel-and-cable system.",
      decision: "Where will cable be pulled throughout the crossing instead of pushed or left slack?",
      newConstraint: "Timber is scarce; cable must do real work rather than decorate the bridge.",
      hints: [
        { kind: "observe", text: "During the cart run, inspect each cable label. Which one becomes slack, and what motion at its end joints caused that?" },
        { kind: "principle", text: "Cable carries pull only. Place it where the loaded structure tends to separate its end joints, with connected steel members completing the route to the banks." },
      ],
      misconception: "Cable is not a light replacement for every bar; when its ends move closer together, it goes slack instead of resisting compression.",
      failure: { title: "Mill repair delayed", body: "A slack or disconnected cable leaves the waterwheel parts on the near bank.", next: "Find a cable that lost tension and reconsider the motion of its two end joints." },
      success: { title: "Waterwheel parts delivered", body: "Millwater Reach can restart the mill and supply the valley.", route: "The mill route reconnects to the growing network." },
      forceExplanation: "As the deck loads, connected steel diagonals transfer force between road and lower joints. A cable linking joints that tend to spread is pulled in tension; if those joints move together, the cable goes slack.",
      cerPrompt: "Why did your cable carry load rather than go slack, and what did Forces show?",
      notebook: { prediction: "Will each cable be in tension when the cart reaches midspan?", evidence: "Record cable tension or slack plus maximum drop.", comparison: "Move or replace one cable role, keeping geometry elsewhere and the 1,400 kg load fixed." },
      consequence: "The working mill can process grain from Fern Valley.",
    },
    5: {
      delivery: "Medical supplies for Alder Ford clinic",
      goal: "Use the fixed centre pier as a real support for both halves of the 12 m route.",
      decision: "Which loaded joints should send force to the centre pier instead of only to the distant banks?",
      newConstraint: "A fixed stone pier is available at midstream, but it helps only through shared connections.",
      hints: [
        { kind: "observe", text: "Trace connected members from the road near midstream. Do they reach the orange pier joint, or pass beside it?" },
        { kind: "principle", text: "A connected fixed pier provides another reaction and can split one long crossing into shorter load paths. Touching or crossing it without sharing its joint does not use it." },
      ],
      misconception: "A bridge does not gain pier support merely by being drawn over the pier; members must connect to the fixed pier node.",
      failure: { title: "Clinic supplies held back", body: "The long crossing still behaves as if the repaired pier were absent.", next: "Check whether the road and supporting frame share the orange centre joint." },
      success: { title: "Clinic supplied", body: "Alder Ford clinic can serve every reconnected community.", route: "The clinic becomes the network's fifth stop." },
      forceExplanation: "When members share the fixed centre node, part of the load reaches ground through the pier and each side has a shorter route. Without that connection, force must still travel the full distance to the banks.",
      cerPrompt: "How did connecting the pier change the load path, and what result shows the difference?",
      notebook: { prediction: "What will change when the centre pier is connected directly?", evidence: "Compare drop and failures near the centre and on both half-spans.", comparison: "Test connected and unconnected pier designs under the same 2,400 kg load." },
      consequence: "Medical supplies can now follow the restored community route.",
    },
    6: {
      delivery: "Rescue radio equipment for Glen Echo ridge",
      goal: "Complete a clear-span steel-and-cable load path without relying on a centre support.",
      decision: "How can a tension system return every deck load to the two banks when no pier exists?",
      newConstraint: "The gorge has no centre pier; cable must remain tensile within a complete system.",
      hints: [
        { kind: "observe", text: "Follow a loaded road joint through steel and cable toward a bank. Where does tension end, or where does a cable turn slack?" },
        { kind: "principle", text: "A tension chord works only when connected struts transfer deck load into it and the whole chain closes at fixed banks. Cable cannot supply a missing compression member." },
      ],
      misconception: "A long cable below the deck is not enough by itself; without connected struts and bank routes, it cannot receive or return the load.",
      failure: { title: "Radio link still offline", body: "The rescue team cannot reach Glen Echo while the cable system is slack or incomplete.", next: "Trace one continuous route from a loaded road joint through the tension system to a bank." },
      success: { title: "Rescue radio delivered", body: "Glen Echo can contact the other communities before the storm.", route: "The ridge communication route is restored." },
      forceExplanation: "With no pier, all reaction comes from the banks. Steel members transfer deck load into the lower system; cables contribute where joint motion pulls them, and connected members return those forces to fixed supports.",
      cerPrompt: "What completed your no-pier tension system, and what evidence rules out a slack cable?",
      notebook: { prediction: "Which cable could go slack as the cart crosses the clear span?", evidence: "Record tension/slack states, the first overload, and maximum drop.", comparison: "Change one cable or strut connection and retest at 2,200 kg." },
      consequence: "The restored radio links the ridge to the clinic and workshop.",
    },
    7: {
      delivery: "A heavy generator for Foundry Bend",
      goal: "Adapt a connected bridge so it remains within limits under the 4,800 kg convoy.",
      decision: "Which part of a previously workable idea reaches its force or deformation limit first under heavy load?",
      newConstraint: "The generator is far heavier than earlier deliveries; familiar geometry may no longer meet the limit.",
      hints: [
        { kind: "observe", text: "Pause near the first warning. Which member has the highest demand, and where is the largest drop developing?" },
        { kind: "principle", text: "Greater load raises member force and deformation. Revise the demanding load path or its depth and material role; adding mass everywhere can create new demand." },
      ],
      misconception: "A shape that passed a light cart is not proven for a heavier convoy, even when its connections are unchanged.",
      failure: { title: "Generator convoy stopped", body: "Foundry Bend stays dark because the heavy load exceeded a member or drop limit.", next: "Use the first overload and maximum-drop location to target one revision." },
      success: { title: "Generator delivered", body: "Foundry Bend can restart essential equipment for Riverbend.", route: "The heavy-haul route becomes the seventh connection." },
      forceExplanation: "The same connected geometry carries larger axial forces and usually deforms more under the 4,800 kg load. Stiffer or stronger roles can help, while their self-weight remains part of every test.",
      cerPrompt: "Which limit appeared under heavy load, and how did your revision address that evidence?",
      notebook: { prediction: "Where will a former strategy first approach its limit under 4,800 kg?", evidence: "Record maximum drop, overload ratio, and first failure location.", comparison: "Revise one high-demand role and compare under the same heavy load." },
      consequence: "Foundry power supports repairs across the seven connected communities.",
    },
    8: {
      delivery: "The final relief convoy for all eight communities",
      goal: "Combine pier support, material roles, and connected half-spans for the longest heavy route.",
      decision: "Which earlier evidence should guide the pier connections, steel roles, and tensile cable roles here?",
      newConstraint: "A 5,000 kg convoy must cross 12 m using the fixed centre pier and limited mixed materials.",
      hints: [
        { kind: "observe", text: "Inspect each half-span separately: does it connect road load to the pier or bank, and do its cables stay tensile as the convoy moves?" },
        { kind: "principle", text: "Treat the pier as a fixed support shared by two connected systems. Assign steel and cable by observed force role, then check the whole moving-load sequence." },
      ],
      misconception: "Combining every earlier feature does not guarantee success; each member still needs a useful force role and a connection to a fixed support.",
      failure: { title: "Relief convoy rerouted", body: "One unsupported half-span, unused pier connection, or unsuitable material role keeps the full network incomplete.", next: "Identify which half-span and which force role caused the first warning." },
      success: { title: "Riverbend reconnected", body: "The relief convoy reaches every community, completing the seed delivery route begun at Willow Creek.", route: "All eight community links are active." },
      forceExplanation: "The fixed pier can receive load from both half-spans. Connected steel members route compression and tension, while cables help only where they remain pulled; banks and pier together complete the reactions for the heavy convoy.",
      cerPrompt: "Which prior test influenced your final design, and what new evidence shows it worked here?",
      notebook: { prediction: "Which half-span or material role is most likely to control the final test?", evidence: "Record pier-connected paths, cable states, maximum drop, and first overload.", comparison: "Change one support or material decision and retest under the same 5,000 kg condition." },
      consequence: "The school, farms, workshop, mill, clinic, ridge, foundry, and crossing form one restored network.",
    },
  };

  levels.forEach((level) => {
    level.learning = learningById[level.id];
  });

  const sandbox = {
    id: "sandbox",
    sandbox: true,
    name: "Free build",
    place: "Riverbend Lab",
    left: 240,
    right: 1240,
    deckY: 430,
    truckMass: 3200,
    truckMassOptions: [600, 1800, 3200, 4800],
    inventory: { road: 30, wood: 60, steel: 60, cable: 60 },
    story:
      "Build without campaign locks. Change one feature at a time and compare the evidence.",
    constraint: "10 m span · generous materials · no campaign score",
    concept: "Ask your own structural question",
    lesson:
      "The same model rules apply, but there is no required material or reference answer.",
    hint: "Choose a question, predict an outcome, then compare two designs under the same load.",
    caseTitle: "Open investigation",
    newMaterial: "All materials available",
    guideY: 310,
    reference: { diagonal: "steel", chord: "steel" },
    explanation:
      "Use the force and drop evidence to explain your own comparison. A passing result is not proof that a design is optimal or safe in the real world.",
  };

  function fixedNodes(level) {
    return [
      { id: "left", x: level.left, y: level.deckY, fixed: true },
      { id: "right", x: level.right, y: level.deckY, fixed: true },
      ...(level.piers || []).map((p) => ({ ...p, fixed: true })),
    ];
  }

  function starter(level) {
    const nodes = fixedNodes(level),
      members = [],
      reference = level.reference || { diagonal: "wood", chord: "wood" };
    let serial = 0;
    const add = (a, b, material) =>
      members.push({ id: "m" + ++serial, a, b, material });
    const cells = Math.round((level.right - level.left) / 200),
      deck = ["left"];
    for (let i = 1; i < cells; i++) {
      const x = level.left + i * 200,
        support = nodes.find((n) => n.fixed && n.x === x && n.y === level.deckY),
        id = support?.id || "d" + i;
      if (!support) nodes.push({ id, x, y: level.deckY });
      deck.push(id);
    }
    deck.push("right");
    for (let i = 0; i < cells; i++) {
      add(deck[i], deck[i + 1], "road");
      const id = "t" + i;
      nodes.push({ id, x: level.left + i * 200 + 100, y: level.guideY });
      const firstMaterial =
          reference.endDiagonal && i === 0
            ? reference.endDiagonal
            : reference.diagonal,
        secondMaterial =
          reference.endDiagonal && i === cells - 1
            ? reference.endDiagonal
            : reference.diagonal;
      add(deck[i], id, firstMaterial);
      add(id, deck[i + 1], secondMaterial);
      if (i) add("t" + (i - 1), id, reference.chord);
    }
    return { nodes, members };
  }

  const api = { levels, sandbox, fixedNodes, starter };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.BridgeLevels = api;
})(typeof window !== "undefined" ? window : globalThis);
