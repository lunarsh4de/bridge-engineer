/* Three.js renderer adapter. The solver and saved grid geometry stay independent. */
(function (root) {
  "use strict";
  const T = root.THREE, G = root.BridgePhysics.G;
  const S = { level:null, design:null, sim:null, mode:"edit", tool:"road", forces:true, inspect:null, highlight:-1, hover:-1, cursor:null, pending:null, drag:null, trace:[], guide:[] };
  let renderer, scene, camera, orbit, stage, hooks={}, raf=0, last=0, active=false, lost=false, observer, elapsed=0, shaking=0, nav=false;
  let terrain, bridge, vehicle, input, grid, fx, label, notice, dimension, bar;
  let blocked=false,introSeen=false,introPending=false,intro=null;
  const reduced = () => root.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function dispose(group) {
    if (!group) return;
    group.removeFromParent();
    const geometries=new Set(), materials=new Set();
    group.traverse(o=>{ if(o.shadow)o.shadow.dispose(); if(o.geometry) geometries.add(o.geometry); if(o.material) (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m)); });
    geometries.forEach(g=>g.dispose()); materials.forEach(m=>m.dispose());
  }
  function mat(color, extra) { return new T.MeshStandardMaterial(Object.assign({color,roughness:.8},extra)); }
  function mesh(parent, geometry, material, x=0,y=0,z=0) {
    const m=new T.Mesh(geometry,material); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; parent.add(m); return m;
  }
  const up=new T.Vector3(0,1,0), direction=new T.Vector3();
  function segment(m,a,b) { direction.subVectors(b,a); const len=direction.length(); m.visible=len>.00001; m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(up,direction.normalize()); m.scale.y=Math.max(.00001,len); }
  root.ThreeTools={dispose,mat,mesh,segment};
  function editingPlaneZ(){return camera&&camera.position.z<-.46?-.92:0;}
  function project(x,y,z=null) { if(!camera||!stage)return[0,0]; camera.updateMatrixWorld(); const p=new T.Vector3(x,y,z===null?editingPlaneZ():z).project(camera); return[(p.x+1)*stage.clientWidth/2,(1-p.y)*stage.clientHeight/2]; }
  function fit(front=false) {
    if(!camera||!S.level||!stage.clientWidth||!stage.clientHeight)return;
    const l=S.level, center=new T.Vector3(l.span/2,(l.yMin+l.yMax)*G/2,0);
    const height=(l.yMax-l.yMin)*G+1.8, width=l.span+(stage.clientWidth<=1024?2.0:3.5);
    const distance=Math.max(height,width/camera.aspect)/(2*Math.tan(camera.fov*Math.PI/360))*1.16;
    const damping=orbit.enableDamping; orbit.enableDamping=false; orbit.update();
    camera.position.copy(center).add(new T.Vector3(front?0:distance*.14,front?0:distance*.30,distance));
    orbit.target.copy(center); orbit.minDistance=distance*.55; orbit.maxDistance=distance*2.4; orbit.update(); orbit.enableDamping=damping; camera.updateMatrixWorld();
  }
  function resize() {
    if(!renderer||!stage.clientWidth||!stage.clientHeight)return;
    renderer.setSize(stage.clientWidth,stage.clientHeight,false); camera.aspect=stage.clientWidth/stage.clientHeight; camera.updateProjectionMatrix(); fit();
  }
  function makeGrid() {
    dispose(grid); if(!scene||!S.level)return;
    grid=new T.Group(); scene.add(grid); const l=S.level, dots=[];
    for(let x=0;x<=l.N;x++)for(let y=l.yMin;y<=l.yMax;y++) dots.push(x*G,y*G,.012);
    const geo=new T.BufferGeometry(); geo.setAttribute("position",new T.Float32BufferAttribute(dots,3));
    grid.add(new T.Points(geo,new T.PointsMaterial({color:0x336b73,size:3,sizeAttenuation:false,transparent:true,opacity:.65,depthTest:false})));
    const line=[]; for(let x=0;x<l.N;x+=.5)line.push(x*G,(l.deckY||0)*G+.012,0,Math.min(l.N,x+.24)*G,(l.deckY||0)*G+.012,0);
    const lg=new T.BufferGeometry(); lg.setAttribute("position",new T.Float32BufferAttribute(line,3));
    grid.add(new T.LineSegments(lg,new T.LineBasicMaterial({color:0x306865,transparent:true,opacity:.7,depthTest:false})));
    grid.renderOrder=3;
  }
  function rebuild() {
    if(!scene||!S.level)return;
    root.Terrain3D.clear(terrain); terrain=root.Terrain3D.build(S.level,scene); makeGrid(); rebuildBridge(); fit();
    dimension.textContent=S.level.span+" m crossing · 0.5 m grid";
  }
  function rebuildBridge() { if(!scene||!S.design)return; root.Bridge3D.clear(bridge); bridge=root.Bridge3D.build(S.design,scene); }
  function setNavigation(on) {
    nav=!!on; if(!orbit)return;
    orbit.mouseButtons.LEFT=nav?T.MOUSE.ROTATE:null; orbit.touches.ONE=nav?T.TOUCH.ROTATE:null;
    const button=bar.querySelector("[data-view=orbit]"); button.setAttribute("aria-pressed",String(nav));
    input&&input.cancel();
  }
  function stopIntro(){intro=null;introPending=false;if(bar)bar.classList.remove("show-orbit-hint");}
  function userCameraInput(){if(active){introSeen=true;stopIntro();}}
  function setBlocked(on){blocked=!!on;if(orbit)orbit.enabled=!blocked&&(S.mode==="edit"||S.mode==="inspect");input&&input.cancel();}
  function introFrame(dt){
    if(!orbit||blocked||S.mode!=="edit")return;
    if(reduced()){stopIntro();return;}
    if(introPending&&!introSeen){introPending=false;introSeen=true;intro={time:0,offset:camera.position.clone().sub(orbit.target)};bar.classList.add("show-orbit-hint");}
    if(!intro)return;
    intro.time+=dt;const t=Math.min(1,intro.time/3.2),theta=Math.sin(Math.PI*t)*.16;
    camera.position.copy(intro.offset.clone().applyAxisAngle(up,theta)).add(orbit.target);camera.lookAt(orbit.target);camera.updateMatrixWorld();
    if(t===1){intro=null;bar.classList.remove("show-orbit-hint");}
  }
  function setMode(mode) {
    S.mode=mode; if(mode!=="edit")stopIntro(); input&&input.cancel();
    if(orbit){ orbit.enabled=!blocked&&(mode==="edit"||mode==="inspect"); setNavigation(false); }
    if(bar)bar.hidden=mode!=="edit"&&mode!=="inspect";
    if(grid)grid.visible=mode==="edit";
    if(mode==="edit"||mode==="inspect")fit();
  }
  function tick(ts) {
    raf=0; if(!active||lost)return;
    const dt=last?Math.min((ts-last)/1000,.05):0;last=ts;elapsed+=dt;
    if(!document.hidden) { hooks.frame&&hooks.frame(dt); render(dt); }
    raf=requestAnimationFrame(tick);
  }
  function wake(){ active=true;last=0;resize();if(!raf&&!lost)raf=requestAnimationFrame(tick); }
  function sleep(){active=false;cancelAnimationFrame(raf);raf=0;last=0;input&&input.cancel();}
  function render(dt) {
    if(!renderer||!S.level||lost)return;
    root.Bridge3D.update(bridge,S.sim,S.inspect,S.forces,S.highlight,S.hover,S.trace);
    root.Vehicle3D.update(vehicle,S.sim,dt); root.Terrain3D.update(terrain,elapsed,reduced(),S.sim);
    input&&input.update();
    if(grid)grid.position.z=editingPlaneZ();
    if(grid)grid.visible=S.mode==="edit";
    introFrame(dt);
    if(orbit.enabled)orbit.update();
    else if(S.sim&&!blocked) {
      const l=S.level, center=l.span/2, distance=Math.max((l.yMax-l.yMin)*G+1.8,(l.span+4)/camera.aspect)/(2*Math.tan(camera.fov*Math.PI/360))*1.16;
      const targetX=center+Math.max(-l.span*.22,Math.min(l.span*.22,(S.sim.vehicle.front-center)*.22));
      const y=(l.yMax+l.yMin)*G/2;
      const desired=new T.Vector3(targetX,y+Math.min(2,distance*.14),distance);
      camera.position.lerp(desired,reduced()?1:Math.min(1,dt*5)); camera.lookAt(targetX,y,0);
    }
    if(shaking>0){shaking-=dt;if(!reduced())camera.position.y+=Math.sin(elapsed*90)*.012;}
    if(fx) {for(let i=fx.children.length-1;i>=0;i--){const p=fx.children[i];p.userData.life-=dt;if(p.userData.life<=0){dispose(p);continue;}p.userData.v.y-=4*dt;p.position.addScaledVector(p.userData.v,dt);p.scale.setScalar(p.userData.life);}}
    renderer.render(scene,camera);
  }
  function mount(parent,h) {
    hooks=h||{}; stage=document.getElementById(parent); stage.classList.add("three-stage");
    const canvas=document.createElement("canvas");canvas.id="game-canvas";canvas.setAttribute("aria-label","3D bridge workshop");canvas.tabIndex=0;canvas.setAttribute("aria-describedby","keyboard-build-help");stage.append(canvas);
    notice=document.createElement("div");notice.className="render-notice";notice.hidden=true;notice.setAttribute("role","status");stage.append(notice);
    label=document.createElement("div");label.className="build-preview";label.hidden=true;stage.append(label);
    dimension=document.createElement("div");dimension.className="scene-dimension";stage.append(dimension);
    bar=document.createElement("div");bar.className="camera-tools";const V=root.VisualGuide;
    bar.innerHTML=`<button class="btn small" data-view="orbit" aria-label="Orbit view" title="Orbit view: drag with one finger" aria-pressed="false">${V.icon('orbit')}<span class="view-label">Orbit view</span></button><button class="btn small" data-view="front" aria-label="Front view" title="Front view">${V.icon('front')}<span class="view-label">Front view</span></button><button class="btn small" data-view="reset" aria-label="Reset view" title="Reset view">${V.icon('reset')}<span class="view-label">Reset view</span></button><span class="orbit-cue">${V.icon('orbit')}<span class="gesture-touch">2 fingers · turn</span><span class="gesture-mouse">Right-drag · turn</span></span>`;stage.append(bar);
    stage.addEventListener('pointerdown',userCameraInput,true);stage.addEventListener('wheel',userCameraInput,{capture:true,passive:true});stage.addEventListener('keydown',userCameraInput,true);
    try {renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:"high-performance"});}
    catch(err){notice.textContent="3D needs WebGL 2. Enable hardware acceleration in your browser, then reload.";notice.hidden=false;return{loop:{wake(){},sleep(){}},destroy};}
    renderer.setPixelRatio(Math.min(root.devicePixelRatio||1,1.75)); renderer.shadowMap.enabled=true; renderer.shadowMap.type=T.PCFSoftShadowMap;
    renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
    scene=new T.Scene();scene.background=new T.Color(0xcce3e6);scene.fog=new T.Fog(0xcce3e6,30,85);
    camera=new T.PerspectiveCamera(45,1,.1,180);
    scene.add(new T.AmbientLight(0xffffff,.6));scene.add(new T.HemisphereLight(0xe7faff,0x6e6652,1.1));
    const sun=new T.DirectionalLight(0xffefd5,2.2);sun.position.set(-3,14,9);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-18;sun.shadow.camera.right=18;sun.shadow.camera.top=14;sun.shadow.camera.bottom=-14;sun.shadow.normalBias=.04;scene.add(sun);
    orbit=new root.OrbitControls(camera,canvas);orbit.enableDamping=true;orbit.dampingFactor=.12;orbit.minPolarAngle=Math.PI/36;orbit.maxPolarAngle=Math.PI*85/180;orbit.enablePan=false;
    orbit.mouseButtons.RIGHT=T.MOUSE.ROTATE;orbit.mouseButtons.MIDDLE=T.MOUSE.DOLLY;orbit.touches.TWO=T.TOUCH.DOLLY_ROTATE;setNavigation(false);
    bar.addEventListener("click",e=>{const action=e.target.closest("[data-view]")?.dataset.view;stopIntro();if(action==="orbit")setNavigation(!nav);else if(action){setNavigation(false);fit(action==="front");}});
    vehicle=root.Vehicle3D.create(scene);fx=new T.Group();scene.add(fx);
    input=root.Controls3D.init({camera,canvas,state:S,project,label,getPlaneZ:editingPlaneZ,isNavigating:()=>nav||blocked,onChange:()=>{}});
    canvas.addEventListener("webglcontextlost",onLost);canvas.addEventListener("webglcontextrestored",onRestored);
    introPending=!introSeen;
    observer=new ResizeObserver(resize);observer.observe(stage);rebuild();resize();setMode(S.mode);wake();hooks.ready&&hooks.ready();
    return{loop:{wake,sleep},destroy,renderer};
  }
  function onLost(e){e.preventDefault();stopIntro();lost=true;root.TutorialGuide&&root.TutorialGuide.update(0);cancelAnimationFrame(raf);raf=0;input.cancel();notice.textContent="3D view paused while graphics recover…";notice.hidden=false;}
  function onRestored(){lost=false;notice.hidden=true;last=0;if(active&&!raf)raf=requestAnimationFrame(tick);}
  function destroy(){root.TutorialGuide&&root.TutorialGuide.clear();sleep();stopIntro();stage&&stage.removeEventListener("pointerdown",userCameraInput,true);stage&&stage.removeEventListener("wheel",userCameraInput,true);stage&&stage.removeEventListener("keydown",userCameraInput,true);observer&&observer.disconnect();input&&input.destroy();orbit&&orbit.dispose();if(renderer){renderer.domElement.removeEventListener("webglcontextlost",onLost);renderer.domElement.removeEventListener("webglcontextrestored",onRestored);}dispose(scene);renderer&&renderer.dispose();stage&&stage.replaceChildren();renderer=scene=camera=orbit=null;}
  function burst(x,y,color,n,speed){if(!fx||reduced())return;for(let k=0;k<n;k++){const a=k*2.4;const p=mesh(fx,new T.BoxGeometry(.045,.045,.045),mat(color),x,y,.08);p.userData={life:.65,v:new T.Vector3(Math.cos(a),Math.abs(Math.sin(a))*2,Math.sin(a)*.5).multiplyScalar(speed/120)};}}
  const api={state:S,mount,setMode,setBlocked,stopIntro,interact:userCameraInput,render,destroy,refresh:resize,
    frontView(){stopIntro();setNavigation(false);fit(true);},
    setLevel(l,d){stopIntro();introPending=!introSeen;S.level=l;S.design=d;S.sim=null;S.inspect=null;S.highlight=S.hover=-1;S.trace=[];S.guide=[];S.mode="edit";rebuild();},
    setDesign(d){S.design=d;rebuildBridge();},setSim(s){S.sim=s;root.Vehicle3D&&root.Vehicle3D.reset(vehicle);},
    setTool(t){S.tool=t;input&&input.cancel();},setForces(on){S.forces=on;},setInspect(list){S.inspect=list;},setHighlight(i){S.highlight=i;},setTrace(indices){S.trace=indices||[];},setGuide(points){S.guide=points||[];},
    cancel(){input&&input.cancel();},burst,shake(){shaking=.15;},toScreen:project,colorFor:(type,r)=>root.Stress3D.color(r),
    get introActive(){return !!intro;},get introPending(){return introPending;},get blocked(){return blocked;},get editingPlaneZ(){return editingPlaneZ();},get scene(){return scene;},get camera(){return camera;},get renderer(){return renderer;},get controls(){return orbit;},get bridge(){return bridge;},get vehicle(){return vehicle;},get input(){return input;},get active(){return active;},get contextLost(){return lost;}
  };
  root.BridgeScene=root.Scene3D=api;
})(typeof self!=="undefined"?self:this);
