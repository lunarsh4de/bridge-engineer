/* Versioned local progress and immutable experiment evidence. No browser dependency. */
(function (root) {
  "use strict";
  const M =
    typeof module !== "undefined" && module.exports
      ? require("./model.js")
      : root.BridgeModel;
  const VERSION = 6;
  const COST = { road: 1, wood: 1, steel: 3, cable: 1.2 };
  const clone = (value) => structuredClone(value);
  function empty(levels) {
    return {
      version: VERSION,
      level: 0,
      completed: levels.map(() => false),
      visited: levels.map(() => false),
      delivered: levels.map(() => false),
      designs: {},
      records: {},
    };
  }
  function conditions(level, mode) {
    const supports = (level.piers || [])
      .map((p) => [p.x, p.y])
      .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const signature = [
      "axial-v1",
      level.left,
      level.right,
      level.deckY,
      mode,
      mode === "crossing" ? level.truckMass : 0,
      9.81,
      0.12,
    ];
    if (supports.length) signature.push(["supports", ...supports]);
    return JSON.stringify(signature);
  }
  function fingerprint(design) {
    const points = new Map(
      design.nodes.map((n) => [n.id, [n.x, n.y, !!n.fixed].join(",")]),
    );
    return JSON.stringify(
      design.members
        .map((e) => [e.material, ...[points.get(e.a), points.get(e.b)].sort()])
        .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
    );
  }
  function cost(design) {
    return Object.entries(M.usage(design)).reduce(
      (sum, [key, length]) => sum + length * COST[key],
      0,
    );
  }
  function normalize(value, levels, sandbox) {
    const data = empty(levels);
    if (!value || typeof value !== "object") return data;
    data.level = Number.isInteger(value.level)
      ? Math.max(0, Math.min(levels.length - 1, value.level))
      : 0;
    const normalizeKey = (key, level, variableSandboxLoad = false) => {
      const design = value.designs?.[key];
      try {
        if (design && !M.validate(design, level))
          data.designs[key] = clone(design);
      } catch {}
      const records = Array.isArray(value.records?.[key])
        ? value.records[key]
        : [];
      data.records[key] = records.slice(-8).flatMap((r) => {
        try {
          let validConditions = r.conditions === conditions(level, r.mode);
          if (variableSandboxLoad && typeof r.conditions === "string") {
            try {
              const parsed = JSON.parse(r.conditions),
                expectedSupports = (level.piers || [])
                  .map((p) => [p.x, p.y])
                  .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
              validConditions =
                Array.isArray(parsed) &&
                parsed[0] === "axial-v1" &&
                parsed[1] === level.left &&
                parsed[2] === level.right &&
                parsed[3] === level.deckY &&
                parsed[4] === r.mode &&
                (parsed[4] === "gravity"
                  ? parsed[5] === 0
                  : (level.truckMassOptions || [level.truckMass]).includes(
                      parsed[5],
                    )) &&
                parsed[6] === 9.81 &&
                parsed[7] === 0.12 &&
                (expectedSupports.length === 0
                  ? parsed.length === 8
                  : JSON.stringify(parsed[8]) ===
                    JSON.stringify(["supports", ...expectedSupports]));
            } catch {
              validConditions = false;
            }
          }
          if (
            !r ||
            M.validate(r.design, level) ||
            !["crossing", "gravity"].includes(r.mode) ||
            !validConditions ||
            !["passed", "failed", "observed"].includes(r.result) ||
            ![r.drop, r.time, r.broken].every(
              (n) => Number.isFinite(n) && n >= 0,
            )
          )
            return [];
          return [
            {
              design: clone(r.design),
              key: fingerprint(r.design),
              conditions: r.conditions,
              mode: r.mode,
              result: r.result,
              drop: r.drop,
              time: r.time,
              broken: r.broken,
              cost: cost(r.design),
              prediction: String(r.prediction || "").slice(0, 240),
              reflection: String(r.reflection || "").slice(0, 600),
              reason: String(r.reason || "").slice(0, 500),
              firstBreak:
                r.firstBreak && typeof r.firstBreak.id === "string"
                  ? {
                      id: r.firstBreak.id,
                      time: Number(r.firstBreak.time) || 0,
                      material: String(r.firstBreak.material),
                      force: Number(r.firstBreak.force) || 0,
                    }
                  : null,
            },
          ];
        } catch {
          return [];
        }
      });
    };
    levels.forEach((level, i) => {
      data.completed[i] = value.completed?.[i] === true;
      data.visited[i] = value.visited?.[i] === true || data.completed[i];
      data.delivered[i] = data.completed[i];
      normalizeKey(i, level);
    });
    if (sandbox) normalizeKey("sandbox", sandbox, true);
    return data;
  }
  function record(data, index, level, design, world, mode, prediction, reason) {
    const list = (data.records[index] ||= []);
    const item = {
      design: clone(design),
      key: fingerprint(design),
      conditions: conditions(level, mode),
      mode,
      result: world.status === "running" ? "observed" : world.status,
      drop: world.maxSag,
      time: world.time,
      broken: world.breakCount,
      cost: cost(design),
      prediction: String(prediction || "").slice(0, 240),
      reflection: "",
      reason,
      firstBreak: world.firstBreak ? clone(world.firstBreak) : null,
    };
    // Identical reruns are useful, but never accumulate extra evidence or rewards.
    const duplicateIndex = list.findIndex(
      (r) => r.key === item.key && r.conditions === item.conditions,
    );
    if (duplicateIndex !== -1) {
      const existing = list.splice(duplicateIndex, 1)[0];
      list.push(existing);
      return { item: existing, duplicate: true, saver: false };
    }
    const previousPass = [...list]
      .reverse()
      .find((r) => r.result === "passed" && r.conditions === item.conditions);
    const saver =
      item.result === "passed" &&
      !!previousPass &&
      item.cost < previousPass.cost - 0.05;
    list.push(item);
    if (list.length > 8) list.shift();
    return { item, duplicate: false, saver };
  }
  function comparison(records) {
    const latest = records.at(-1);
    if (!latest) return null;
    const previous = records
      .slice(0, -1)
      .reverse()
      .find((r) => r.conditions === latest.conditions && r.key !== latest.key);
    return previous
      ? {
          previous,
          latest,
          dropDelta: latest.drop - previous.drop,
          costDelta: latest.cost - previous.cost,
        }
      : null;
  }
  const api = {
    empty,
    normalize,
    conditions,
    fingerprint,
    cost,
    record,
    comparison,
    VERSION,
    COST,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.BridgeProgress = api;
})(typeof window !== "undefined" ? window : globalThis);
