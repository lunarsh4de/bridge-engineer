/* Focus mask, camera lesson and synthesized sound acceptance with real browser input. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.RIVERBEND_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(process.argv[2]||path.join(__dirname,'..')),out=path.resolve(process.argv[3]||path.join(root,'output/playwright/focus-audio'));
const url=process.env.RIVERBEND_BASE_URL||pathToFileURL(path.join(root,'site/index.html')).href;fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.RIVERBEND_BROWSER||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const report={url,checks:[],errors:[],screenshots:[],method:'Fresh saves; actual mouse drag, native CDP touch drag, keyboard controls. Audio analyser samples real Web Audio output. No reference bridge or accelerated solver.'};let context,page;
 const check=n=>{console.log('PASS '+n);report.checks.push(n);};
 async function fresh(size={width:1365,height:900},mobile=false,reduce='no-preference'){
  if(context)await context.close();context=await browser.newContext({viewport:size,isMobile:mobile,hasTouch:mobile,reducedMotion:reduce,locale:mobile?'zh-CN':'en-US'});if(!process.env.RIVERBEND_BASE_URL)await context.setOffline(true);
  await context.addInitScript(()=>{window.__soundGains=[];const A=window.AudioContext||window.webkitAudioContext;if(A){const create=A.prototype.createGain;A.prototype.createGain=function(){const g=create.call(this);window.__soundGains.push(g);return g;};}});
  page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});await page.goto(url);
 }
 const shot=async n=>{await page.screenshot({path:path.join(out,n+'.png')});report.screenshots.push(n+'.png');};
 const enter=async()=>{await page.locator('#btn-new').click();await page.locator('#comic-skip').click();await page.waitForFunction(()=>TutorialGuide.state.visible);};
 const camera=()=>page.evaluate(()=>BridgeScene.camera.position.toArray());
 async function dragCamera(mobile=false){
  const r=await page.locator('#game-canvas').boundingBox(),a={x:r.x+r.width*.38,y:r.y+r.height*.63},b={x:r.x+r.width*.68,y:a.y};
  if(mobile){const cd=await context.newCDPSession(page);await cd.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...a,id:1}]});for(let i=1;i<=15;i++){await cd.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:a.x+(b.x-a.x)*i/15,y:a.y,id:1}]});await page.waitForTimeout(20);}await cd.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(200);}
  else{await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:18});await page.mouse.up();}
 }
 async function targetsClear(){return page.evaluate(()=>{
  const rects=TutorialGuide.state.focusRects,contains=(x,y)=>rects.some(r=>x>=r.x&&x<=r.x+r.width&&y>=r.y&&y<=r.y+r.height);
  const selectors=['#coach','.tutorial-target','#practice-skip','.topbar [data-sound-toggle]','.topbar [data-open="help"]','.topbar .language-switch'];
  return selectors.map(selector=>{const n=document.querySelector(selector);if(!n)return{selector,clear:false};const r=n.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;return{selector,clear:contains(x,y),hit:document.elementFromPoint(x,y)?.closest(selector)===n};});
 });}
 try{
  await fresh();assert.deepEqual(await page.evaluate(()=>GameAudio.state),{muted:false,unlocked:false,available:true,status:'idle',voices:0,played:{}});await enter();
  assert.equal(await page.evaluate(()=>TutorialGuide.state.cameraPhase),'orbit');assert.equal(await page.locator('.tutorial-shade').getAttribute('fill-opacity'),'.76');assert((await targetsClear()).every(x=>x.clear&&x.hit));await shot('desktop-orbit-focus');check('Grey translucent mask leaves the current button, coach and escape controls clear and clickable');
  await page.locator('[data-view=orbit]').click();await page.waitForFunction(()=>TutorialGuide.state.cameraPhase==='turn');const before=await camera();await page.waitForTimeout(2900);assert.notDeepEqual(await camera(),before);await shot('desktop-turn-demo');
  await dragCamera();await page.waitForFunction(()=>TutorialGuide.state.cameraPhase==='front');assert.equal(await page.evaluate(()=>__GAME_STATE__.design.members.length),4);await page.waitForFunction(()=>document.querySelector('[data-view=front]').classList.contains('tutorial-target'));await shot('desktop-front-focus');
  await page.locator('[data-view=front]').click();assert.equal(await page.evaluate(()=>BridgeScene.navigating),false);assert.equal(await page.evaluate(()=>__GAME_STATE__.save.world.checks['tutorial:camera']),true);assert.equal(await page.evaluate(()=>TutorialGuide.state.cameraPhase),null);check('Animated pointer turns the real camera; an actual mouse rotation advances to Front view without building a member');
  await page.evaluate(()=>{const g=__soundGains[0];window.__soundAnalyser=g.context.createAnalyser();g.connect(__soundAnalyser);});
  const levels={};for(const name of ['connect','undo','redo','start','break','pass','fail']){
   await page.evaluate(n=>GameAudio.play(n),name);await page.waitForTimeout(name==='pass'?120:35);levels[name]=await page.evaluate(()=>{const a=new Float32Array(__soundAnalyser.fftSize);__soundAnalyser.getFloatTimeDomainData(a);return Math.sqrt(a.reduce((s,x)=>s+x*x,0)/a.length);});assert(levels[name]>.00001);await page.waitForTimeout(650);
  }report.audioRms=levels;check('Connection, undo/redo, start, fracture and success/failure effects produce nonzero browser audio samples');
  await page.evaluate(()=>GameAudio.play('pass'));await page.locator('.topbar [data-sound-toggle]').click();assert.equal(await page.evaluate(()=>GameAudio.state.muted),true);assert.equal(await page.evaluate(()=>GameAudio.state.voices),0);await page.waitForTimeout(120);const mutedRms=await page.evaluate(()=>{const a=new Float32Array(__soundAnalyser.fftSize);__soundAnalyser.getFloatTimeDomainData(a);return Math.max(...a.map(Math.abs));});assert(mutedRms<.00001);assert.equal(await page.evaluate(()=>GameAudio.play('connect')),false);
  await page.reload();assert.equal(await page.evaluate(()=>GameAudio.state.muted),true);assert.equal(await page.evaluate(()=>GameAudio.state.status),'idle');await page.locator('.menu-settings [data-sound-toggle]').click();await page.waitForFunction(()=>GameAudio.state.status==='running');assert.equal(await page.evaluate(()=>GameAudio.state.muted),false);assert.equal(await page.locator('.menu-settings [data-sound-toggle]').getAttribute('aria-pressed'),'true');check('Mute stops active effects immediately, persists after reload and can be re-enabled by a real gesture');
  for(const size of [{width:320,height:640},{width:390,height:844},{width:844,height:390}]){
   await fresh(size,true);await enter();assert((await targetsClear()).every(x=>x.clear&&x.hit));await page.locator('[data-view=orbit]').tap();await dragCamera(true);await page.waitForFunction(()=>TutorialGuide.state.cameraPhase==='front');await page.locator('[data-view=front]').tap();await page.locator('#materials [data-tool=timber]').tap();await page.waitForTimeout(100);
   const layout=await page.evaluate(()=>{const s=document.querySelector('#stage').getBoundingClientRect(),c=document.querySelector('#coach').getBoundingClientRect();return{overflow:document.documentElement.scrollWidth>innerWidth,stage:s.height,coachClear:c.bottom<=s.top+1,hit:[[0,-2],[4,0],[8,-2]].every(p=>{const q=BridgeScene.toScreen(p[0]*.5,p[1]*.5);return document.elementFromPoint(s.x+q[0],s.y+q[1])?.id==='game-canvas';})};});assert(!layout.overflow&&layout.stage>150&&layout.coachClear&&layout.hit);await shot('phone-focus-'+size.width);
   await page.locator('.topbar [data-open=help]').tap();assert.equal(await page.locator('.tutorial-overlay').isVisible(),false);await page.locator('#modal-close').tap();assert.equal(await page.locator('.tutorial-overlay').isVisible(),true);await page.locator('#practice-skip').tap();assert.equal(await page.locator('.tutorial-overlay').isVisible(),false);
  }check('320px, 390px and landscape support native one-finger rotation, front view, construction targets, help and skip through the focus mask');
  await fresh({width:390,height:844},true,'reduce');await enter();const stationary=await camera();await page.waitForTimeout(500);assert.deepEqual(await camera(),stationary);await page.locator('[data-view=orbit]').tap();await page.waitForTimeout(150);const still=await camera();await page.waitForTimeout(1800);assert.deepEqual(await camera(),still);assert.equal(await page.locator('.tutorial-overlay').getAttribute('data-pressed'),'false');
  await page.locator('#camera-next').focus();await page.keyboard.press('Enter');await page.locator('[data-view=front]').focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>TutorialGuide.state.cameraPhase),null);await shot('reduced-static');check('Reduced motion keeps camera and pointer static; keyboard users can advance to front view without dragging');
  assert.deepEqual(report.errors,[]);report.passed=true;
 }catch(e){report.passed=false;report.failure=e.stack;if(page)await shot('failure').catch(()=>{});throw e;}
 finally{fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2));await browser.close();}
 console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,report:path.join(out,'verification.json')}));
})().catch(e=>{console.error(e);process.exitCode=1;});
