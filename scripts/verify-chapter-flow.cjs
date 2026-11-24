/* Chapter handoff regression: valid seeded saves, references and fixed-step acceleration are QA fixtures. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.RIVERBEND_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(process.argv[2]||path.join(__dirname,'..')),out=path.resolve(process.argv[3]||path.join(root,'output/playwright/chapter-flow'));
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const report={root,checks:[],errors:[],externalRequests:[],method:'Offline Chrome with external Playwright; Browser plugin not available. Valid saved-state fixtures and example designs isolate the chapter boundary. Result, quiz, menu and notes use actual UI inputs. Crossing simulations use labelled fixed-step acceleration, not learner play.'};
 let context,page;
 const state=()=>page.evaluate(()=>({save:__GAME_STATE__.save,book:__ENGINEERING_NOTEBOOK__(),notes:__INQUIRY_NOTES__(),view:JSON.parse(render_game_to_text())}));
 const check=n=>{report.checks.push(n);console.log('PASS '+n);};
 const shot=n=>page.screenshot({path:path.join(out,n+'.png')});
 const close=async()=>{if(await page.locator('#modal').isVisible())await page.locator('#modal-close').click();};
 async function fresh(zh=false,mobile=false,entry='site/index.html'){
  if(context)await context.close();context=await browser.newContext({locale:zh?'zh-CN':'en-US',viewport:mobile?{width:390,height:844}:{width:1440,height:900},hasTouch:mobile,isMobile:mobile,reducedMotion:'reduce'});await context.setOffline(true);page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});page.on('request',r=>{if(/^https?:/.test(r.url()))report.externalRequests.push(r.url());});
  await page.goto(pathToFileURL(path.join(root,entry)).href);assert.equal(await page.title(),zh?'河湾：桥梁工程师':'Riverbend: Bridge Engineer');assert(await page.locator('#menu-title').isVisible());
 }
 async function seed(advancedNode=null,completed=false){return page.evaluate(({advancedNode,completed})=>{
  const L=BridgeLevels,P=BridgePhysics,Pr=BridgeProgress,Lab=EngineeringLab,N=InquiryNotes;
  function prepare(advanced){const s=Pr.blank(advanced?()=>BridgeExpansion.newWorld(L):L.newWorld);s.started=true;s.reflection=advanced?'Preserve Part II reflection':'Preserve Part I reflection';s.world.materials=['road','timber','steel','cable'];s.world.checks['controls:offered']=true;return s;}
  function record(s,id,book,notes){const w=s.world,lv=L.resolveLevel(id,w),design=lv.refs[0].members,sim=P.runToEnd(design,lv,lv.mass),summary=P.summary(sim);if(sim.outcome!=='pass')throw Error(sim.reason);s.designs[id]=design;w.tests++;L.applyResult(w,id,{pass:true,stars:2,cost:P.costOf(design),badges:[],members:design.length,maxSagCm:summary.maxSagCm,peakRatio:summary.peakRatio});const r=Lab.record(lv,design,sim,{pass:true},'Seeded prediction');r.noteIndex=1;Lab.add(book,r);N.get(notes,id,1).claim='Preserve '+id+' evidence';}
  function store(prefix,s,book,notes){const st={setItem:(k,v)=>localStorage.setItem(prefix+k,v)};Pr.save(st,s);Lab.save(st,book,s);N.save(st,notes,Lab.progressStamp(s));}
  const s=prepare(false),book=Lab.blank(),notes={};s.world.helped=['school','clinic','mill'];s.world.firstHelp='clinic';s.world.shared=true;s.world.support='towers';s.world.node=completed?'report':'finale';s.world.checks['seen:finale']=true;record(s,'willow',book,notes);if(completed)record(s,'finale',book,notes);store('',s,book,notes);
  let advanced=null;if(advancedNode){advanced=prepare(true);advanced.world.node=advancedNode;const b=Lab.blank(),n={};for(const id of advancedNode==='advanced-report'?BridgeExpansion.IDS:['convoy'])record(advanced,id,b,n);if(advancedNode==='harbor'){advanced.world.challengeOptions.harbor={deckY:4};advanced.designs.harbor=L.resolveLevel('harbor',advanced.world).refs[1].members;}store('riverbend.advanced.',advanced,b,n);}
  localStorage.setItem('riverbend.chapter','foundation');return{foundation:s,advanced};
 },{advancedNode,completed});}
 async function enterFinale(){await page.reload();await page.locator('#btn-continue').click();await close();assert.equal((await state()).view.level.id,'finale');}
 async function deliverFinale(notes=false){
  await page.evaluate(()=>__loadExample());if(notes){await page.locator('#btn-notebook').click();await page.locator('#lab-prediction').fill('Two supports should share the final load.');await close();}
  await page.locator('#btn-test').click();await page.evaluate(()=>{const s=__GAME_STATE__.sim;while(!s.outcome&&s.t<35)BridgePhysics.step(s);});await page.waitForSelector('#result:not([hidden])');assert.equal(await page.evaluate(()=>__GAME_STATE__.lastSummary.rec.pass),true);
  if(notes){await page.locator('#result-notebook').click();await page.locator('#lab-claim').fill('Preserve my final claim.');await close();}
  await page.locator('#res-go').click();assert.equal((await state()).view.chapter,'foundation');const answer=await page.evaluate(()=>__GAME_STATE__.level.check.answer);await page.locator('.quiz-opt').nth(answer).click();await page.locator('#res-go').click();
 }
 async function advanced(node){const s=await state();assert.equal(s.view.chapter,'advanced');assert.equal(s.save.world.node,node);assert.equal(s.save.started,true);assert.equal(await page.evaluate(()=>localStorage.getItem('riverbend.chapter')),'advanced');return s;}
 try{
  await fresh();const original=await seed();await enterFinale();await deliverFinale(true);await advanced('convoy');assert(await page.locator('#task-start').isVisible());await shot('part2-automatic-task');await close();assert.equal((await state()).book.runs.length,0);assert.deepEqual((await state()).notes,{});
  const stored=await page.evaluate(()=>({save:JSON.parse(localStorage.getItem(BridgeProgress.KEY)),book:JSON.parse(localStorage.getItem(EngineeringLab.KEY)),notes:JSON.parse(localStorage.getItem(InquiryNotes.KEY))}));assert.equal(stored.save.world.node,'report');assert(stored.save.world.results.finale.pass);assert.equal(stored.save.reflection,original.foundation.reflection);assert.deepEqual(stored.save.designs.willow,original.foundation.designs.willow);assert(stored.book.runs.some(r=>r.levelId==='finale'));assert.equal(stored.notes.finale[1].predict,'Two supports should share the final load.');assert.equal(stored.notes.finale[1].claim,'Preserve my final claim.');
  check('Final delivery automatically opens Part II; Part I designs, results, reflection, measurements and CER remain saved separately');
  await page.reload();await page.locator('#btn-continue').click();await close();await advanced('convoy');await page.locator('#btn-menu').click();await page.locator('[data-chapter="foundation"]').click();await page.locator('#btn-report').click();assert(await page.locator('#report.active').isVisible());await page.locator('#rep-notebook').click();assert.equal(await page.locator('#lab-claim').inputValue(),'Preserve my final claim.');await close();await page.locator('#rep-advanced').click();await advanced('convoy');
  check('Reload resumes Part II; Part I report and notes can be reviewed with a direct return to Part II');
  await fresh();const existing=await seed('harbor');await enterFinale();await deliverFinale();const resumed=await advanced('harbor');assert.equal(resumed.save.reflection,existing.advanced.reflection);assert.deepEqual(resumed.save.designs,existing.advanced.designs);assert.deepEqual(resumed.save.world.results,existing.advanced.world.results);assert.equal(resumed.save.world.challengeOptions.harbor.deckY,4);assert(resumed.book.runs.some(r=>r.levelId==='convoy'));assert.equal(resumed.notes.convoy[1].claim,'Preserve convoy evidence');
  check('An existing Part II save resumes its current level with height, geometry, results, notes and reflection intact');
  await fresh(false,false,'index.html');await seed(null,true);await page.reload();assert.equal(await page.locator('#btn-continue').innerText(),'Continue to Chapter II');await page.locator('#btn-continue').click();await advanced('convoy');check('Older completed Part I saves continue directly through the offline root entry');
  await fresh();await seed('advanced-report');await enterFinale();await deliverFinale();await advanced('advanced-report');assert(await page.locator('#report.active').isVisible());assert.equal((await state()).book.runs.length,5);check('A finished Part II journey retains its report and five experiment records');
  await fresh(true,true);await seed();await enterFinale();await deliverFinale();await advanced('convoy');assert.equal(await page.locator('html').getAttribute('lang'),'zh-CN');assert.match(await page.locator('#lv-title').innerText(),/双车/);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await shot('part2-automatic-mobile-zh');await close();await page.locator('#btn-menu').click();await page.locator('[data-chapter="foundation"]').click();assert.equal(await page.locator('#btn-report').innerText(),'查看本章报告');assert.equal(await page.locator('#btn-continue').innerText(),'继续第二章');await page.locator('#btn-report').click();assert.equal(await page.locator('#rep-advanced').innerText(),'继续第二章');await shot('part1-report-mobile-zh');
  check('Chinese mobile progression and report buttons are translated, with no horizontal overflow');
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.externalRequests,[]);report.passed=true;
 }catch(e){report.passed=false;report.failure=e.stack;if(page)await shot('failure').catch(()=>{});throw e;}
 finally{fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2));await browser.close();}
 console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,report:path.join(out,'verification.json')}));
})().catch(e=>{console.error(e);process.exitCode=1;});
