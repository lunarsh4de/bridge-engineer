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
        "The school garden is across the creek. Build a crossing so a small delivery can reach it.",
      concept: "Geometry before strength",
      lesson:
        "A pin-jointed rectangle can fold. A diagonal creates triangles that resist changing shape. Try both arrangements under gravity.",
      hint: "Lay three road sections between the orange bank anchors. Build a row of triangles above or below the deck. Connect all your joints.",
      caseTitle: "Triangles at work",
      newMaterial: "Start with timber",
      guideY: 330,
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
        "The hillside farms need a wider crossing. You have more timber, but the delivery is heavier too.",
      concept: "Follow the load",
      lesson:
        "Loads need a continuous route to the banks. Extra members also add weight. Where does one well-placed diagonal help most?",
      hint: "Use four road sections. A connected row of triangles can spread the load. A floating triangle still needs a route to both bank supports.",
      caseTitle: "A connected structure",
      newMaterial: "More timber, a wider river",
      guideY: 330,
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
        "The community workshop is waiting for its first heavy delivery. Steel and cables open new ways to cross the high pass.",
      concept: "Different jobs. Different materials.",
      lesson:
        "Steel is stronger and stiffer in this model, but heavier. A cable can carry tension; when pushed, it goes slack. Test the difference.",
      hint: "Start with a continuous deck and truss. Use steel where compressed members carry high loads. Cables can pull a deck toward a higher anchored structure; they cannot replace compression struts.",
      caseTitle: "Tension and compression",
      newMaterial: "Steel + cables unlocked",
      guideY: 305,
    },
  ];
  function starter(level) {
    const nodes = [
        { id: "left", x: level.left, y: level.deckY, fixed: true },
        { id: "right", x: level.right, y: level.deckY, fixed: true },
      ],
      members = [];
    let serial = 0;
    const add = (a, b, material) =>
      members.push({ id: "m" + ++serial, a, b, material });
    const cells = Math.round((level.right - level.left) / 200),
      deck = ["left"];
    for (let i = 1; i < cells; i++) {
      const id = "d" + i;
      nodes.push({ id, x: level.left + i * 200, y: level.deckY });
      deck.push(id);
    }
    deck.push("right");
    for (let i = 0; i < cells; i++) {
      add(deck[i], deck[i + 1], "road");
      const id = "t" + i;
      nodes.push({ id, x: level.left + i * 200 + 100, y: level.guideY });
      add(deck[i], id, level.id === 3 && i === 0 ? "steel" : "wood");
      add(
        id,
        deck[i + 1],
        level.id === 3 && i === cells - 1 ? "steel" : "wood",
      );
      if (i) add("t" + (i - 1), id, level.id === 3 ? "steel" : "wood");
    }
    return { nodes, members };
  }
  const api = { levels, starter };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.BridgeLevels = api;
})(typeof window !== "undefined" ? window : globalThis);
