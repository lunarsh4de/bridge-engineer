/* GPT-6.1 independent review. Designs are entered by mouse, never assigned to runtime. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const audit=require('../docs/LEVEL_AUDIT_v06.json');
const E=require('../site/js/progress.js'),M=require('../site/js/model.js'),L=require('../site/js/levels.js');
const URL=process.env.BASE_URL || 'file://'+path.resolve('site/index.html');
const out=process.env.REVIEW_OUT || 'work/review-v06';fs.mkdirSync(out,{recursive:true});
(async()=>{
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
const logs=[],errors=[];
try {
const ctx=await browser.newContext({viewport:{width:1366,height:768},offline:URL.startsWith('file:'),reducedMotion:'reduce'});
await ctx.addInitScript(()=>{const orig=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){return /webgl/.test(t)?null:orig.call(this,t,...a)}});
await ctx.addInitScript(()=>localStorage.setItem('bridge-engineer-onboarding-v1','complete'));
const p=await ctx.newPage();p.setDefaultTimeout(30000);p.on('pageerror',e=>errors.push(e.message));
const host='BridgeRuntime.game.scene.getScene("Workshop").host';
async function ready(){await p.goto(URL);await p.waitForFunction(()=>document.body.dataset.engineReady==='true');}
async function shot(name){await p.screenshot({path:`${out}/${name}.png`,fullPage:true});}
async function brief(){if(await p.locator('#begin-building').isVisible())await p.locator('#begin-building').click();}
async function point(n){return p.evaluate(({x,y})=>{const h=BridgeRuntime.game.scene.getScene('Workshop').host,r=document.querySelector('#scene').getBoundingClientRect();return{x:r.left+h.view.x+x*h.view.scale,y:r.top+h.view.y+y*h.view.scale}},n);}
async function drag(a,b){const u=await point(a),v=await point(b);await p.mouse.move(u.x,u.y);await p.mouse.down();await p.mouse.move(v.x,v.y,{steps:4});await p.mouse.up();}
async function crossing(result){await p.locator('#test').click();await p.locator('#pause').click();await shot(`level-${logs.length+1}-paused`);await p.locator('#pause').click();
// Deliberate deterministic acceleration: real UI launch, solver steps advanced here; no realtime pacing claim.
await p.evaluate(()=>{const h=BridgeRuntime.game.scene.getScene('Workshop').host;for(let n=0;n<10000&&h.state.world.status==='running';n++)h.state.world.step()});
await p.locator('#feedback-panel.'+result).waitFor({timeout:10000});}
await ready();await shot('menu');await p.locator('#select-level').click();await shot('route-empty');
assert.equal(await p.locator('[data-mission]').count(),8);await p.locator('[data-mission="0"]').click();await brief();
for(let i=0;i<8;i++){
const row=audit.rows.find(r=>r.level===i+1&&r.name==='alternative');const d=row.design;const nodes=new Map(d.nodes.map(n=>[n.id,n]));
if(i>0){await p.locator('#next').click();await brief();}
await shot(`level-${i+1}-task-dismissed`);
// Actual material buttons and mouse drags for every member of a distinct audited geometry.
for(const edge of d.members){console.log('input',i+1,edge.id,edge.material);await p.locator(`[data-material="${edge.material}"]`).click();await drag(nodes.get(edge.a),nodes.get(edge.b));}
const actual=await p.evaluate(()=>structuredClone(BridgeRuntime.game.scene.getScene('Workshop').host.state.editor.design));
assert.equal(actual.members.length,d.members.length,`level ${i+1}: physical input member count`);
assert.equal(M.validate(actual,L.levels[i]),null,`level ${i+1}: valid inventory and geometry`);
assert.equal(E.fingerprint(actual),E.fingerprint(d),`level ${i+1}: actual geometry/materials match alternative independently of IDs`);
await shot(`level-${i+1}-built`);await crossing('success');
assert.equal(await p.locator('#next').evaluate(el=>el.classList.contains('primary')),true,'success next primary');
await shot(`level-${i+1}-success`);
const save=await p.evaluate(()=>JSON.parse(localStorage.getItem('bridge-engineer-workshop-v2')));
assert.equal(save.completed[i],true);assert.equal(save.delivered[i],true);
logs.push({level:i+1,method:'material-button + actual mouse drags, audited non-reference geometry',members:actual.members.length,actualDesign:actual,fingerprintMatchesAudit:true,solverAcceleration:true,passed:true});
}
await p.locator('#next').click();assert.equal(await p.locator('#final-report-screen').isVisible(),true);assert.equal(await p.locator('.report-crossing').count(),8);await shot('ending');
await p.locator('#report-menu').click();await p.reload();await p.waitForFunction(()=>document.body.dataset.engineReady==='true');await p.locator('#field-report').click();assert.equal(await p.locator('#final-report-screen').isVisible(),true);await shot('ending-after-reload');
fs.writeFileSync(`${out}/completed-save.json`,JSON.stringify(await p.evaluate(()=>JSON.parse(localStorage.getItem('bridge-engineer-workshop-v2'))),null,2));
assert.deepEqual(errors,[]);fs.writeFileSync(`${out}/independent-eight-input.json`,JSON.stringify({url:URL,viewport:'1366x768',evidence:'agent actual browser inputs; no learner or realtime pacing claims',logs,errors},null,2));console.log('PASS independent eight alternative builds entered by real mouse; completion/delivery/ending/reload');
} finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
