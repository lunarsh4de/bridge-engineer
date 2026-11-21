/* Engineering investigations and evidence. Pure data; no renderer, DOM or solver mutation. */
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('../core/physics.js'):root.BridgePhysics,typeof module==='object'&&module.exports?require('../core/levels.js'):root.BridgeLevels);
 if(typeof module==='object'&&module.exports)module.exports=api;else root.EngineeringLab=api;
})(typeof self!=='undefined'?self:this,function(P,L){
 'use strict';
 const KEY='riverbend.v1.engineering-notebook',VERSION=1,MAX_RUNS=60;
 const copy=x=>JSON.parse(JSON.stringify(x)),own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const missions={
  tabletop:{question:'How can a road carry a load to the fixed banks?',try:'Test the prelaid road before adding supports. Locate the largest drop, then brace the middle and test again.',why:'Triangles can carry push and pull to fixed supports. An unbraced row of pinned road sections can sag.',transfer:'Trace a route from a road joint through connected members to a fixed bank. A crossing of lines is not a joint.',example:'A simple truss uses connected triangles. This game models pinned axial members, rather than a continuous bending beam.'},
  willow:{question:'Can short, braced members carry the same cart more effectively?',try:'Inspect a compressed member. Compare a long strut with a braced row of triangles under the same 900 kg load.',why:'The game limits compression by both material strength and a length-dependent buckling rule. Shorter members need braced joints, not just extra dots.',transfer:'Keep the load and anchors fixed. Compare drop, compression utilization and cost before claiming an improvement.',example:'A deck truss carries the road above its triangles; a through truss places its main trusses beside the road. Both are possible here.'},
  clinic:{question:'Where can a cable help when there are no supports below?',try:'Connect high anchors to road joints. Inspect which cables pull and which are seen slack.',why:'A cable carries tension only. When its ends move together, it goes slack instead of resisting compression.',transfer:'Trace a connected route up to a high fixed anchor. A low load reading alone does not prove a cable is unnecessary.',example:'Cable-stayed bridges connect a deck to towers with direct stays. The high anchors here simplify that arrangement.'},
  mill:{question:'Where is the extra cost of steel worth paying?',try:'Test a timber design. Select the first failed member and change only its material, then retest.',why:'Steel has different strength, stiffness, self-weight and cost in this model. A failure location is evidence; the full cause needs a controlled test.',transfer:'Keep the same geometry and load. Does a targeted substitution complete the crossing within budget?',example:'Trusses often use different member sizes or materials for different demands. More material everywhere is not automatically efficient.'},
  echo:{question:'How do two feasible structures trade stiffness, load and cost?',try:'Compare two designs with the same load and supports. Change one design choice at a time.',why:'There can be several feasible designs. A low recorded drop from an early failure is not evidence of a better bridge.',transfer:'Record the full crossing outcome and test duration alongside drop, member utilization and cost.',example:'A truss and a stayed deck can both provide a connected load path. Compare evidence instead of searching for one required silhouette.'},
  finale:{question:'How do support conditions change your design?',try:'Use the town’s chosen anchors. Apply a principle you tested earlier, then explain it with this crossing’s data.',why:'An interior support or a high anchor changes the possible load paths. Data from different supports are not a controlled design comparison.',transfer:'Explain one design choice, cite a measurement, and name a limitation of the simulation.',example:'A pier provides an intermediate support; stays offer routes to high anchors. The 3D picture still represents a two-dimensional structural model.'}
 };
 function blank(){return{version:VERSION,progressStamp:'',runs:[],drafts:{}};}
 function progressStamp(save){let h=2166136261;const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;const s=JSON.stringify(canonical(save));for(let n=0;n<s.length;n++){h^=s.charCodeAt(n);h=Math.imul(h,16777619);}return(h>>>0).toString(16);}
 function designKey(ms){return JSON.stringify(ms.map(m=>{const a=m.a.join(','),b=m.b.join(',');return[a<b?a:b,a<b?b:a,m.m];}).sort((a,b)=>JSON.stringify(a)<JSON.stringify(b)?-1:JSON.stringify(a)>JSON.stringify(b)?1:0));}
 function conditions(level){return{levelId:level.id,span:level.span,mass:level.mass,anchors:level.anchors.map(a=>a.slice()).sort((a,b)=>a[0]-b[0]||a[1]-b[1]),materials:level.materials.slice().sort(),budget:level.totalBudget,sagLimit:level.sagLimit,mode:'prescribed-crossing',model:level.chapter==='advanced'?'XPBD-fleet-nav-v1':'XPBD-v1',...(level.chapter==='advanced'?{deckY:level.deckY||0,traffic:copy(level.traffic),waterY:level.waterY??null,navigation:copy(level.navigation||[]),island:copy(level.island||[])}:{})};}
 const conditionKey=l=>JSON.stringify(conditions(l));
 function connected(members,anchors,memberIndex){
  const key=P.keyOf,graph=new Map(),fixed=new Set(anchors.map(key));
  members.forEach((m,i)=>{for(const [a,b]of[[m.a,m.b],[m.b,m.a]]){const k=key(a);if(!graph.has(k))graph.set(k,[]);graph.get(k).push({to:key(b),i});}});
  const route=p=>{const queue=[key(p)],seen=new Set(queue),previous=new Map();for(let q=0;q<queue.length;q++){const k=queue[q];if(fixed.has(k)){const path=[];let at=k;while(previous.has(at)){const v=previous.get(at);path.push(v.i);at=v.from;}return path.reverse();}for(const e of graph.get(k)||[])if(!seen.has(e.to)){seen.add(e.to);previous.set(e.to,{from:k,i:e.i});queue.push(e.to);}}return null;};
  const deck=new Map();members.filter(m=>m.m==='road').forEach(m=>[m.a,m.b].forEach(p=>deck.set(key(p),p)));
  const unsupported=[...deck.values()].filter(p=>route(p)===null);
  const chosen=members[memberIndex],paths=chosen?[route(chosen.a),route(chosen.b)]:[];
  return{unsupported,route:[...new Set(paths.filter(Boolean).flat().concat(chosen&&paths.some(p=>p!==null)?[memberIndex]:[]))],hasRoute:!!chosen&&paths.some(p=>p!==null)};
 }
 function record(level,members,sim,result,prediction,slackObserved){
  const valid=Number.isFinite(sim.maxSag)&&sim.nodes.every(n=>Number.isFinite(n.x)&&Number.isFinite(n.y))&&sim.mems.every(m=>Number.isFinite(m.peak)&&Number.isFinite(m.ratio));
  const states=sim.mems.map((m,i)=>({i,type:m.type,len:m.rest,peak:valid?Math.max(m.peak,m.broken?m.ratio:0):0,mode:m.peakMode||(m.fs>=0?'tension':'compression'),broken:m.broken,slack:!!(slackObserved&&slackObserved.has(i)),tension:m.mat.tension,compression:m.comp}));
  return{...(level.chapter==='advanced'?{trafficResult:P.summary(sim).vehicles,navigationResult:P.summary(sim).navigation}:{}),levelId:level.id,condition:conditions(level),conditionKey:conditionKey(level),design:copy(members),designKey:designKey(members),prediction:String(prediction||'').slice(0,400),example:false,valid,duration:sim.t,crossingDuration:Math.max(0,sim.t-sim.settle),settle:sim.settle,pass:valid&&result.pass,outcome:sim.outcome,reason:valid?sim.reason:'The simulation produced invalid data; no numerical evidence was recorded.',cost:P.costOf(members),maxSagCm:valid?sim.maxSag*100:null,peakRatio:valid?Math.max(0,...states.map(s=>s.peak)):null,firstBreak:sim.firstBreak?copy(sim.firstBreak):null,slackCount:states.filter(s=>s.slack).length,members:states,connections:connected(members,level.anchors,-1).unsupported.length};
 }
 function add(lab,run){run.id=(lab.runs.reduce((m,r)=>Math.max(m,r.id||0),0)+1);lab.runs.push(run);if(lab.runs.length>MAX_RUNS)lab.runs.splice(0,lab.runs.length-MAX_RUNS);return run;}
 function changes(a,b){
  const map=ms=>new Map(ms.map(m=>{const x=m.a.join(','),y=m.b.join(',');return[[x,y].sort().join('|'),m.m];})),am=map(a.design),bm=map(b.design);let added=0,removed=0,material=0;
  for(const[k,v]of am){if(!bm.has(k))removed++;else if(bm.get(k)!==v)material++;}for(const[k]of bm)if(!am.has(k))added++;
  return{added,removed,material,total:added+removed+material};
 }
 function compare(a,b){
  if(!a||!b)return{ok:false,reason:'Choose two recorded tests.'};if(a.id===b.id)return{ok:false,reason:'Choose two different tests.'};
  if(a.conditionKey!==b.conditionKey)return{ok:false,reason:'Different span, traffic, height, navigation, supports, materials, budget or model. These tests are not a controlled comparison.'};
  if(!a.valid||!b.valid)return{ok:false,reason:'Invalid solver data cannot be compared.'};
  return{ok:true,cost:b.cost-a.cost,drop:b.maxSagCm-a.maxSagCm,peak:(b.peakRatio-a.peakRatio)*100,duration:b.duration-a.duration,completedBoth:a.pass&&b.pass,changes:changes(a,b),sameDesign:a.designKey===b.designKey};
 }
 function validateSave(raw){
  const fail=()=>({ok:false,error:'That progress file has invalid journey or bridge data. Your current work is unchanged.'});
  if(!raw||raw.version!==1||!raw.world||!raw.designs||typeof raw.designs!=='object'||Array.isArray(raw.designs))return fail();
  const w=raw.world;if(!own(L.NODES,w.node)||!Array.isArray(w.materials)||!w.materials.every(m=>own(P.MATERIALS,m)))return fail();
  const data={version:1,started:!!raw.started,reflection:typeof raw.reflection==='string'?raw.reflection.slice(0,10000):'',designs:{},world:Object.assign(L.newWorld(),copy(w))};
  const v=data.world;if(!Number.isFinite(v.reserve)||v.reserve<0||v.reserve>1e6||!Number.isFinite(v.tests)||v.tests<0||!Array.isArray(v.helped)||!v.helped.every(x=>['school','clinic','mill'].includes(x))||!Array.isArray(v.log)||!v.checks||typeof v.checks!=='object'||Array.isArray(v.checks)||!v.results||typeof v.results!=='object'||Array.isArray(v.results)||!v.choices||typeof v.choices!=='object'||Array.isArray(v.choices))return fail();
  if(typeof v.shared!=='boolean'||!Number.isInteger(v.tests)||!v.materials.includes('road')||!v.materials.includes('timber')||!Object.values(v.checks).every(x=>typeof x==='boolean'))return fail();
  if(v.support!==null&&!['none','pier','towers'].includes(v.support)||v.firstHelp!==null&&!['clinic','mill'].includes(v.firstHelp))return fail();
  if(!v.log.every(x=>x&&typeof x==='object'&&!Array.isArray(x)))return fail();
  for(const[id,choice]of Object.entries(v.choices))if(!own(L.NODES,id)||!L.NODES[id].options||!L.NODES[id].options.some(o=>o.id===choice))return fail();
  for(const[id,res]of Object.entries(v.results))if(!own(L.LEVELS,id)||!res||!Number.isInteger(res.stars)||res.stars<0||res.stars>3||!['cost','maxSagCm','peakRatio'].every(k=>Number.isFinite(res[k])&&res[k]>=0)||!Array.isArray(res.badges))return fail();
  if(['echo','finale'].includes(v.node)&&!v.materials.some(m=>m==='steel'||m==='cable'))return fail();
  if(v.challengeOptions!==undefined){
   if(!v.challengeOptions||typeof v.challengeOptions!=='object'||Array.isArray(v.challengeOptions))return fail();
   for(const[id,o]of Object.entries(v.challengeOptions))if(!own(L.LEVELS,id)||!L.LEVELS[id].heights||!o||!L.LEVELS[id].heights.includes(o.deckY))return fail();
  }
  if(v.chapter==='advanced'&&!['convoy','harbor','island','shipping','riverport','advanced-report'].includes(v.node))return fail();
  if(v.chapter!=='advanced'&&L.LEVELS[v.node]&&L.LEVELS[v.node].chapter==='advanced')return fail();
  for(const[id,ms]of Object.entries(raw.designs)){
   if(!own(L.LEVELS,id)||!Array.isArray(ms)||ms.length>500)return fail();const lv=L.LEVELS[id],seen=new Set();
   for(const m of ms){if(!m||!own(P.MATERIALS,m.m)||![m.a,m.b].every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isInteger)&&p[0]>=0&&p[0]<=lv.N&&p[1]>=lv.yMin&&p[1]<=(lv.heights?Math.max(...lv.heights)+9:lv.yMax))||P.lengthOf(m)<.01||P.lengthOf(m)>P.MATERIALS[m.m].maxLen+1e-6||m.m==='road'&&(m.a[1]!==m.b[1]||!(lv.heights||[0]).includes(m.a[1])))return fail();const k=[m.a.join(','),m.b.join(',')].sort().join('|');if(seen.has(k))return fail();seen.add(k);}
   data.designs[id]=ms.map(m=>({a:m.a.slice(),b:m.b.slice(),m:m.m}));
  }
  return{ok:true,data};
 }
 function load(store,save){try{const l=JSON.parse(store.getItem(KEY)||'null');if(l&&l.progressStamp===progressStamp(save)){const checked=importBook(JSON.stringify({type:'riverbend-engineering-notebook',version:1,progress:save,notebook:l}));if(checked.ok){checked.notebook.runs.forEach((r,i)=>r.imported=!!l.runs[i].imported);return checked.notebook;}}}catch(e){}return blank();}
 function save(store,lab,progress){lab.progressStamp=progressStamp(progress);try{store.setItem(KEY,JSON.stringify(lab));return true;}catch(e){return false;}}
 function exportBook(lab,progress,inquiry){return JSON.stringify({type:'riverbend-engineering-notebook',version:1,progress,notebook:lab,...(inquiry?{inquiry}: {})},null,2);}
 function importBook(text){
  try{const b=JSON.parse(text),p=validateSave(b.progress),l=b.notebook;if(b.type!=='riverbend-engineering-notebook'||b.version!==1||!p.ok||!l||l.version!==1||!Array.isArray(l.runs)||l.runs.length>MAX_RUNS||!l.drafts||typeof l.drafts!=='object'||Array.isArray(l.drafts))return{ok:false,error:'That file is not a supported engineering notebook.'};
   const Notes=typeof module==='object'&&module.exports?require('./inquiry.js'):globalThis.InquiryNotes;
   const notes=b.inquiry===undefined?null:Notes.validate(b.inquiry);if(notes&&!notes.ok)return{ok:false,error:'The notebook contains invalid inquiry notes.'};
   const ids=new Set(),noteIds=new Set();
   for(const r of l.runs){
    if(r.noteIndex!==undefined&&(!Number.isSafeInteger(r.noteIndex)||r.noteIndex<1||r.noteIndex>1e9))return{ok:false,error:'The notebook contains an invalid inquiry index.'};
    if(r.noteIndex!==undefined){const nk=r.levelId+':'+r.noteIndex;if(noteIds.has(nk))return{ok:false,error:'The notebook repeats an inquiry index.'};noteIds.add(nk);}
    const source=validateSave({version:1,started:true,world:p.data.world,designs:{[r.levelId]:r.design}}),c=r.condition;
    if(!source.ok||!c||c.levelId!==r.levelId||!Array.isArray(c.anchors)||!c.anchors.every(a=>Array.isArray(a)&&a.length===2&&a.every(Number.isFinite))||!['span','mass','budget','sagLimit'].every(k=>Number.isFinite(c[k])&&c[k]>0)||!Array.isArray(c.materials)||!c.materials.every(m=>own(P.MATERIALS,m))||c.mode!=='prescribed-crossing'||!['XPBD-v1','XPBD-fleet-nav-v1'].includes(c.model)||!Number.isInteger(r.id)||r.id<1||ids.has(r.id)||!Array.isArray(r.members)||r.members.length!==r.design.length||!['duration','crossingDuration','settle','cost'].every(k=>Number.isFinite(r[k])&&r[k]>=0)||typeof r.valid!=='boolean'||typeof r.pass!=='boolean'||typeof r.reason!=='string'||r.valid&&!['maxSagCm','peakRatio'].every(k=>Number.isFinite(r[k])&&r[k]>=0))return{ok:false,error:'The notebook contains invalid experiment data.'};
    if(c.model==='XPBD-fleet-nav-v1'){
     const lv=L.LEVELS[r.levelId];
     if(lv.chapter!=='advanced'||!Number.isInteger(c.deckY)||!(lv.heights||[0]).includes(c.deckY)||!Array.isArray(c.traffic)||c.traffic.length<1||c.traffic.length>2||!c.traffic.every(v=>v&&Number.isFinite(v.mass)&&v.mass>0&&Number.isFinite(v.offset)&&v.offset>=0)||!Array.isArray(c.navigation)||c.navigation.length>2||!c.navigation.every(n=>n&&['x1','x2','requiredClearance'].every(k=>Number.isFinite(n[k]))&&n.x1>=0&&n.x1<n.x2&&n.x2<=c.span&&n.requiredClearance>0)||c.navigation.length&&!Number.isFinite(c.waterY)||!Array.isArray(c.island))return{ok:false,error:'The notebook contains invalid traffic or navigation conditions.'};
    }
    ids.add(r.id);
    for(let i=0;i<r.members.length;i++){const m=r.members[i];if(!m||m.type!==r.design[i].m||!['len','peak','tension','compression'].every(k=>Number.isFinite(m[k])&&m[k]>=0)||Math.abs(m.len-P.lengthOf(r.design[i]))>1e-5||!['tension','compression'].includes(m.mode)||typeof m.broken!=='boolean')return{ok:false,error:'The notebook contains invalid member measurements.'};}
    if(r.firstBreak&&(!Number.isInteger(r.firstBreak.i)||r.firstBreak.i<0||r.firstBreak.i>=r.members.length||!Number.isFinite(r.firstBreak.t)))return{ok:false,error:'The notebook contains an invalid failure record.'};
    r.designKey=designKey(r.design);r.condition=conditions({id:r.levelId,span:c.span,mass:c.mass,anchors:c.anchors,materials:c.materials,totalBudget:c.budget,sagLimit:c.sagLimit,...(c.model==='XPBD-fleet-nav-v1'?{chapter:'advanced',deckY:c.deckY,traffic:c.traffic,waterY:c.waterY,navigation:c.navigation,island:c.island}:{})});r.conditionKey=JSON.stringify(r.condition);r.imported=true;r.prediction=String(r.prediction||'').slice(0,400);r.reason=r.reason.slice(0,2000);
   }
   const drafts={};for(const[id,d]of Object.entries(l.drafts)){if(own(L.LEVELS,id)&&d&&typeof d==='object'){drafts[id]={};for(const key of ['prediction','claim','evidence','reasoning'])drafts[id][key]=String(d[key]||'').slice(0,key==='prediction'?400:600);}}l.drafts=drafts;
   return{ok:true,progress:p.data,notebook:l,inquiry:notes?notes.data:undefined};
  }catch(e){return{ok:false,error:'That file is not a readable engineering notebook.'};}
 }
 return{KEY,VERSION,MAX_RUNS,missions,blank,copy,progressStamp,designKey,conditions,conditionKey,connected,record,add,compare,changes,validateSave,load,save,exportBook,importBook};
});
