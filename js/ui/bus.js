/* EventBus (domain:action) and shared constants. Loaded before render/ui/features. */
(function (root) {
  "use strict";
  const map = new Map();
  const Bus = {
    on(e, f) { if (!map.has(e)) map.set(e, new Set()); map.get(e).add(f); return () => Bus.off(e, f); },
    off(e, f) { map.get(e) && map.get(e).delete(f); },
    emit(e, data) { (map.get(e) || []).forEach((f) => { try { f(data || {}); } catch (err) { console.error(e, err); } }); },
    clear() { map.clear(); },
  };
  const Events = {
    DESIGN_ADD: "design:add", DESIGN_ERASE: "design:erase", DESIGN_CHANGED: "design:changed", DESIGN_REJECTED: "design:rejected",
    TOOL_CHANGED: "tool:changed", MEMBER_HOVER: "member:hover",
    TEST_STARTED: "test:started", SIM_BREAK: "sim:break", SIM_FALL: "sim:fall", SIM_SAG: "sim:sag", TEST_FINISHED: "test:finished",
    STORY_NODE: "story:node",
  };
  const Constants = {
    COLORS: { road: 0x46555a, timber: 0xaf7947, steel: 0x6a8798, cable: 0x294c53, sky: 0xcfe6ee, skyLow: 0xeaf4f1, bank: 0x8c6a4a, grass: 0x7fae6a,
      water: 0x3f86a6, waterDeep: 0x2f6a86, stone: 0x9a948a, anchor: 0x1f2a30, dot: 0x6d7f88, ok: 0x2f8a4c, bad: 0xc0392b, cart: 0xe0782f, seed: 0x4f9a3a },
    WIDTH: { road: 9, timber: 6, steel: 6, cable: 2.5 },
    SNAP_PX: 22, ERASE_PX: 14, PAD_GRID: 3,
    SLOWMO_SCALE: 0.2, SLOWMO_SECONDS: 1.6, END_HOLD: 0.9, MAX_FRAME: 0.1,
    TOAST_MS: 2600,
  };
  root.BridgeBus = Bus; root.BridgeEvents = Events; root.BridgeConstants = Constants;
})(typeof self !== "undefined" ? self : this);
