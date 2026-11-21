/* Riverbend: Bridge Engineer - structural solver (v1.0).
 * Small-step XPBD: pinned joints, axial members, self-weight and a prescribed
 * moving vehicle load. A simplified learning model, never a real engineering
 * safety tool. Units: metres, kilograms, newtons. y points up, deck at y = 0. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BridgePhysics = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const G = 0.5; // metres per grid step
  const GRAV = 9.81;
  const FRAME = 1 / 60;
  const SUBSTEPS = 40;
  const MATERIALS = {
    road: { name: "Road", density: 60, ea: 2.4e7, tension: 70000, compression: 70000, buckle: 3.0e5, maxLen: 2.0, cost: 10, role: "Carries the vehicle. Pinned ends, so it needs support." },
    timber: { name: "Timber", density: 14, ea: 1.0e7, tension: 30000, compression: 26000, buckle: 1.5e5, maxLen: 3.0, cost: 6, role: "Light and cheap. Pulls and pushes, but long pieces buckle." },
    steel: { name: "Steel", density: 40, ea: 3.0e7, tension: 95000, compression: 85000, buckle: 6.0e5, maxLen: 3.5, cost: 18, role: "Strong and stiff. Heavy and costly." },
    cable: { name: "Cable", density: 3, ea: 1.6e7, tension: 60000, compression: 0, buckle: 0, maxLen: 8.0, cost: 4, role: "Very strong in tension only. Goes slack when pushed." },
  };
  const keyOf = (p) => p[0] + "," + p[1];
  const lengthOf = (m) => Math.hypot(m.b[0] - m.a[0], m.b[1] - m.a[1]) * G;
  const compCapacity = (mat, L) => (mat.compression ? Math.min(mat.compression, mat.buckle / (L * L)) : 0);
  const priceOf = (type, mods) => MATERIALS[type].cost * (mods && mods[type] != null ? mods[type] : 1);
  function costOf(members, mods) {
    let c = 0;
    for (const m of members) c += lengthOf(m) * priceOf(m.m, mods);
    return Math.round(c);
  }

  function createSim(members, level, vehicleMass) {
    const anchorKeys = new Set(level.anchors.map(keyOf));
    const map = new Map();
    const nodes = [];
    const node = (p) => {
      const k = keyOf(p);
      let n = map.get(k);
      if (!n) {
        const x = p[0] * G, y = p[1] * G;
        n = { k, gx: p[0], gy: p[1], x0: x, y0: y, x, y, px: x, py: y, vx: 0, vy: 0, mass: 3, fx: 0, fy: 0, fixed: anchorKeys.has(k), deck: false };
        map.set(k, n);
        nodes.push(n);
      }
      return n;
    };
    const mems = members.map((src, i) => {
      const mat = MATERIALS[src.m];
      const a = node(src.a), b = node(src.b);
      const L = lengthOf(src);
      a.mass += (L * mat.density) / 2;
      b.mass += (L * mat.density) / 2;
      if (src.m === "road") a.deck = b.deck = true;
      return { i, a, b, type: src.m, mat, rest: L, k: mat.ea / L, comp: compCapacity(mat, L), f: 0, fs: 0, ratio: 0, peak: 0, broken: false, slack: false };
    });
    for (const n of nodes) n.w = n.fixed ? 0 : 1 / n.mass;
    const deckY=(level.deckY||0)*G;
    const traffic=level.traffic||[{mass:vehicleMass,offset:0}];
    const vehicles=traffic.map((spec,i)=>({front:-0.4-(spec.offset||0),wheelbase:1.6,speed:spec.speed||2.6,mass:spec.mass||vehicleMass,yf:deckY,yr:deckY,fallen:false,fallT:0,fallY:deckY,fallV:0,index:i}));
    const navigation=level.navigation?level.navigation.map((n,i)=>({...n,index:i,minClearance:Infinity,blocked:null,passed:false,z:-5})):[];
    return {
      vehicles, navigation, deckY,
      nodes, mems, level, span: level.span, t: 0, settle: 0.8,
      sagLimit: level.sagLimit || 0.12,
      vehicle: vehicles[0],
      maxSag: 0, sagX: 0, firstBreak: null, outcome: null, reason: "", events: [],
    };
  }

  // Road member under a horizontal position x, closest to the current axle height.
  function roadAt(sim, x, nearY) {
    let best = null, bestD = Infinity;
    for (const m of sim.mems) {
      if (m.broken || m.type !== "road") continue;
      const dx = m.b.x - m.a.x;
      if (Math.abs(dx) < 0.05) continue;
      const t = (x - m.a.x) / dx;
      if (t < -1e-6 || t > 1 + 1e-6) continue;
      const y = m.a.y + (m.b.y - m.a.y) * t;
      const d = Math.abs(y - nearY);
      if (d < bestD && d < 0.7) { best = { m, t, y }; bestD = d; }
    }
    return best;
  }

  function axleLoad(sim, x, prevY, P) {
    if (x < 0 || x > sim.span) return { y: sim.deckY||0, ok: true };
    const r = roadAt(sim, x, prevY);
    if (!r) return { y: prevY, ok: false };
    r.m.a.fy -= P * (1 - r.t);
    r.m.b.fy -= P * r.t;
    return { y: r.y, ok: true };
  }

  function step(sim, dt) {
    if (sim.outcome) return sim;
    dt = dt || FRAME;
    const h = dt / SUBSTEPS;

    for (let s = 0; s < SUBSTEPS; s++) {
      sim.t += h;
      const moving = sim.t >= sim.settle;
      for (const n of sim.nodes) { n.fx = 0; n.fy = -n.mass * GRAV; }
      for(const v of sim.vehicles){
      const P=(v.mass*GRAV)/2;
      if (!v.fallen) {
        if (moving) v.front += v.speed * h;
        const f = axleLoad(sim, v.front, v.yf, P);
        const r = axleLoad(sim, v.front - v.wheelbase, v.yr, P);
        if (!f.ok || !r.ok) { v.fallen = true; v.fallT = sim.t; v.fallY = Math.min(v.yf, v.yr); sim.events.push({ t: sim.t, type: "fall" }); }
        else { v.yf = f.y; v.yr = r.y; }
      } else {
        v.fallV -= GRAV * h; v.fallY += v.fallV * h; v.front += v.speed * 0.4 * h;
      }
      }
      for (const n of sim.nodes) {
        n.px = n.x; n.py = n.y;
        if (n.fixed) continue;
        n.vx += h * n.fx * n.w; n.vy += h * n.fy * n.w;
        n.x += h * n.vx; n.y += h * n.vy;
      }
      for (const m of sim.mems) {
        if (m.broken) continue;
        const a = m.a, b = m.b;
        const dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1e-9;
        const C = len - m.rest;
        if (m.type === "cable" && C < 0) { m.slack = true; m.f = 0; m.fs *= 0.9; continue; }
        m.slack = false;
        const ws = a.w + b.w;
        if (ws === 0) { m.f = 0; continue; }
        const alpha = 1 / (m.k * h * h);
        const dl = -C / (ws + alpha);
        const nx = dx / len, ny = dy / len;
        a.x -= a.w * dl * nx; a.y -= a.w * dl * ny;
        b.x += b.w * dl * nx; b.y += b.w * dl * ny;
        m.f = -dl / (h * h);
      }
      const damp = 1 - 3 * h;
      for (const n of sim.nodes) {
        if (n.fixed) continue;
        n.vx = ((n.x - n.px) / h) * damp; n.vy = ((n.y - n.py) / h) * damp;
      }
      for (const m of sim.mems) {
        if (m.broken) continue;
        m.fs += (m.f - m.fs) * 0.06;
        const cap = m.fs >= 0 ? m.mat.tension : m.comp;
        m.ratio = cap > 0 ? Math.abs(m.fs) / cap : 0;
        if (moving && m.ratio > m.peak) { m.peak = m.ratio; m.peakMode = m.fs >= 0 ? "tension" : "compression"; }
        if (m.ratio > 1 && sim.t > 0.25) {
          m.broken = true;
          const mode = m.fs >= 0 ? "tension" : "compression";
          if (!sim.firstBreak) sim.firstBreak = { i: m.i, type: m.type, mode, t: sim.t, x: (m.a.x + m.b.x) / 2 };
          sim.events.push({ t: sim.t, type: "break", i: m.i, mode });
        }
      }
      if (moving) {
        for (const n of sim.nodes) {
          if (!n.deck || n.fixed) continue;
          const sag = n.y0 - n.y;
          if (sag > sim.maxSag) { sim.maxSag = sag; sim.sagX = n.x0; }
        }
      }
    }
    checkNavigation(sim);
    finish(sim);
    return sim;
  }

  function finish(sim) {
    const v = sim.vehicles.find(v=>v.fallen)||sim.vehicle;
    if (v.fallen) {
      if (sim.t - v.fallT > 1.2) {
        sim.outcome = "fail";
        sim.reason = sim.firstBreak
          ? `${MATERIALS[sim.firstBreak.type].name} failed in ${sim.firstBreak.mode} and the road lost support.`
          : "The road was not continuous, so the vehicle fell.";
      }
      return;
    }
    if (sim.maxSag > sim.sagLimit && !sim.sagFlag) {
      sim.sagFlag = true;
      sim.events.push({ t: sim.t, type: "sag" });
    }
    if (sim.vehicles.every(v=>v.front-v.wheelbase>sim.span+0.3)) {
      if (sim.navigation.some(n=>n.blocked)) { const n=sim.navigation.find(n=>n.blocked);sim.outcome="fail";sim.reason=`Navigation lane ${n.index+1} blocked by member ${n.blocked.member+1}. Raise the deck or keep supports above the channel.`; }
      else if(sim.navigation.some(n=>!n.passed)){return;}
      else if (sim.firstBreak) { sim.outcome = "fail"; sim.reason = `The vehicle crossed, but ${MATERIALS[sim.firstBreak.type].name.toLowerCase()} failed in ${sim.firstBreak.mode}.`; }
      else if (sim.maxSag > sim.sagLimit) { sim.outcome = "fail"; sim.reason = `The road dropped ${Math.round(sim.maxSag * 100)} cm. The limit is ${Math.round(sim.sagLimit * 100)} cm.`; }
      else { sim.outcome = "pass"; sim.reason = "Delivered safely."; }
    }
    if (sim.t > 30 && !sim.outcome) { sim.outcome = "fail"; sim.reason = "The test timed out."; }
  }

  // Sweep a boat envelope along z through the two mirrored bridge sides. This is
  // an explicit 2D navigation clearance rule, independent from the axial solver.
  function checkNavigation(sim){
    for(const n of sim.navigation){
      if(n.blocked||n.passed)continue;
      const bottom=sim.level.waterY,top=bottom+n.requiredClearance;
      let lowest=Infinity,block=null;
      for(const m of sim.mems){
        if(m.broken)continue;
        const ax=m.a.x,bx=m.b.x,dx=bx-ax;
        let u=0,v=1;
        if(Math.abs(dx)<1e-8){if(ax<n.x1||ax>n.x2)continue;}
        else{const a=(n.x1-ax)/dx,b=(n.x2-ax)/dx;u=Math.max(0,Math.min(a,b));v=Math.min(1,Math.max(a,b));if(u>v)continue;}
        const y1=m.a.y+(m.b.y-m.a.y)*u,y2=m.a.y+(m.b.y-m.a.y)*v;
        const radius=m.type==='road'?.09:m.type==='cable'?.023:m.type==='steel'?.056:.053,lo=Math.min(y1,y2)-radius,hi=Math.max(y1,y2)+radius;
        lowest=Math.min(lowest,lo-bottom);
        if(lo<top-1e-6&&hi>bottom-.12&&!block)block={member:m.i,t:sim.t,clearance:lo-bottom};
      }
      n.minClearance=Math.min(n.minClearance,lowest);
      // The boat enters the bridge sweep after settling and clears it at 5.6 s.
      n.z=-5+Math.max(0,sim.t-sim.settle)*1.35;
      if(sim.t>=sim.settle&&n.z>=-1.6&&n.z<=.8&&block){n.blocked=block;n.z=-1.6;sim.events.push({type:'navigation',t:sim.t,lane:n.index,member:block.member});}
      if(!n.blocked&&n.z>2.2)n.passed=true;
    }
  }

  function runToEnd(members, level, mass, maxT) {
    const sim = createSim(members, level, mass);
    const lim = maxT || 20;
    while (!sim.outcome && sim.t < lim) step(sim, FRAME);
    return sim;
  }

  function summary(sim, mods) {
    let peak = 0, peakI = -1;
    sim.mems.forEach((m) => { if (m.peak > peak) { peak = m.peak; peakI = m.i; } });
    return {
      ...(sim.level.chapter==='advanced'?{
        vehicles:sim.vehicles.map(v=>({mass:v.mass,completed:!v.fallen&&v.front-v.wheelbase>sim.span+.3,fallen:v.fallen})),
        navigation:sim.navigation.map(n=>({index:n.index,requiredClearance:n.requiredClearance,minClearance:Number.isFinite(n.minClearance)?Math.round(n.minClearance*100)/100:null,passed:n.passed,blocked:n.blocked}))
      }:{}),
      outcome: sim.outcome || "fail",
      reason: sim.reason,
      maxSagCm: Math.round(sim.maxSag * 1000) / 10,
      firstBreak: sim.firstBreak,
      peakRatio: Math.round(peak * 100) / 100,
      peakMember: peakI,
      peakType: peakI >= 0 ? sim.mems[peakI].type : null,
      slackCables: sim.mems.filter((m) => m.type === "cable" && m.slack && !m.broken).length,
    };
  }

  return { G, GRAV, FRAME, MATERIALS, keyOf, lengthOf, compCapacity, priceOf, costOf, createSim, checkNavigation, step, runToEnd, summary };
});
