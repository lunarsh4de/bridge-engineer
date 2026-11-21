/* Riverbend: Bridge Engineer - local save (browser localStorage only). */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BridgeProgress = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const KEY = "riverbend.v1.save";
  const VERSION = 1;
  function blank(newWorld) { return { version: VERSION, world: newWorld(), designs: {}, reflection: "", started: false }; }
  function valid(d) {
    return d && d.version === VERSION && d.world && typeof d.world.node === "string" && Array.isArray(d.world.materials) && typeof d.designs === "object";
  }
  function load(store, newWorld) {
    try {
      const raw = store.getItem(KEY);
      if (!raw) return blank(newWorld);
      const d = JSON.parse(raw);
      return valid(d) ? d : blank(newWorld);
    } catch (e) { return blank(newWorld); }
  }
  function save(store, data) {
    try { store.setItem(KEY, JSON.stringify(data)); return true; } catch (e) { return false; }
  }
  function exportText(data) { return JSON.stringify(data); }
  function importText(text) {
    let d;
    try { d = JSON.parse(text); } catch (e) { return { ok: false, error: "That text is not a Riverbend save." }; }
    if (!valid(d)) return { ok: false, error: "That save is from a different version or is damaged." };
    return { ok: true, data: d };
  }
  return { KEY, VERSION, blank, load, save, exportText, importText, valid };
});
