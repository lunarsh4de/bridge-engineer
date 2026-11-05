/* Independent numerical content audit: no rendering or browser dependency. */
const fs = require('node:fs');
const assert = require('node:assert/strict');
const P = require('../site/js/physics.js');
const M = require('../site/js/model.js');
const E = require('../site/js/progress.js');
const L = require('../site/js/levels.js');
const alternatives = [355,305,330,580,330,580,330,580];
function simulate(design, level) {
  const invalid=M.validate(design,level);
  if(invalid) return {valid:false,reason:invalid};
  const world=new P.World(design,level,{vehicle:true});
  for(let i=0;i<23/P.STEP && world.status==='running';i++)world.step();
  return {valid:true,result:world.status,drop_cm:+(world.maxSag*100).toFixed(4),time_s:+world.time.toFixed(4),breaks:world.breakCount,firstBreak:world.firstBreak,force_ratio:+world.maxForceRatio.toFixed(4),usage_m:M.usage(design),cost:+E.cost(design).toFixed(4)};
}
function alternative(i){const d=L.starter(L.levels[i]); for(const n of d.nodes)if(n.id.startsWith('t'))n.y=alternatives[i]; return d;}
function transplant(source,target,design){
  // Scale span; keep height and material roles. Fixed supports come only from target.
  const d=M.fresh(target), idMap=new Map();
  for(const n of design.nodes){
    const x=target.left+(n.x-source.left)*(target.right-target.left)/(source.right-source.left);
    const y=target.deckY+n.y-source.deckY;
    const existing=d.nodes.find(p=>Math.hypot(p.x-x,p.y-y)<18);
    if(existing) idMap.set(n.id,existing.id);
    else {const id='from-'+n.id;d.nodes.push({id,x,y});idMap.set(n.id,id);}
  }
  d.members=design.members.map(e=>({...e,a:idMap.get(e.a),b:idMap.get(e.b)}));return d;
}
const rows=[],failures=[],transfers=[],roleProbes=[];
L.levels.forEach((level,i)=>{
  for(const [name,design] of [['reference',L.starter(level)],['alternative',alternative(i)]]){
    const r=simulate(design,level);assert.equal(r.valid,true,`${i+1} ${name} valid`);assert.equal(r.result,'passed',`${i+1} ${name} pass`);
    rows.push({level:i+1,name,conditions:E.conditions(level,'crossing'),design,...r});
  }
  const road=L.starter(level);road.members=road.members.filter(e=>e.material==='road');
  const r=simulate(road,level);assert.equal(r.valid,true);assert.equal(r.result,'failed',`road-only level ${i+1}`);
  failures.push({level:i+1,name:'unsupported-road',explanation:'A continuous pin-jointed roadway alone does not meet the delivery criterion; inspect deformation and support paths.',design:road,...r});
  if([3,5].includes(i)){
    const d=L.starter(level);for(const n of d.nodes)if(n.id.startsWith('t'))n.y=2*level.deckY-n.y;
    roleProbes.push({level:i+1,name:'cable-in-compression-role',...simulate(d,level)});
  }
  if(level.piers?.length){
    const d=L.starter(level);for(const pier of level.piers){
      d.nodes.push({id:'unconnected-'+pier.id,x:pier.x+25,y:pier.y});
      d.members=d.members.map(e=>({...e,a:e.a===pier.id?'unconnected-'+pier.id:e.a,b:e.b===pier.id?'unconnected-'+pier.id:e.b}));
    }
    roleProbes.push({level:i+1,name:'fixed-pier-not-connected-offset-joint',...simulate(d,level)});
  }
});
for(let from=0;from<L.levels.length;from++)for(let to=from+1;to<L.levels.length;to++){
  for(const [variant,design] of [['reference',L.starter(L.levels[from])],['alternative',alternative(from)]]){
    transfers.push({from:from+1,to:to+1,variant,method:'span-scaled, same relative height and material roles, welded to actual target supports',...simulate(transplant(L.levels[from],L.levels[to],design),L.levels[to])});
  }
}
const audit={version:'0.6.0',date:'2026-11-06',solver:'unchanged axial-v1',step_s:P.STEP,pass_rule:'delivery complete, zero breaks, maximum road drop <12 cm',rows,failures,roleProbes,transfers,interpretation:'Internal deterministic model checks. Two passing geometries do not prove multiple strategies, optimality, engineering calibration or learning. Transfer outcomes describe legal scaled designs only; resource invalidity is not structural failure. Interface playability and learner reasoning require separate evidence.'};
fs.writeFileSync('docs/LEVEL_AUDIT_v06.json',JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify({passing:rows.length,expected_failures:failures.length,roleProbes:roleProbes.map(r=>({level:r.level,name:r.name,result:r.result,valid:r.valid})),transfer_checks:transfers.length,legal_transfers:transfers.filter(r=>r.valid).length,passing_transfers:transfers.filter(r=>r.result==='passed').map(r=>`${r.from}->${r.to} ${r.variant}`)},null,2));
