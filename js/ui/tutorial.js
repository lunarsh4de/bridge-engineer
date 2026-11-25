/* In-scene demonstrations. Ghosts never enter the editable design or physics. */
(function(root){
  'use strict';
  const NS='http://www.w3.org/2000/svg';
  let holes,shade,mask,dragStart=null,cameraBase=null,cameraTouched=false,focusRects=[];
  let options=null,svg,cursor,path,progress,points=[],ripples=[],group,beams=[],target=null,time=0,quiet=0,held=false,phase='',lastFeedback=null;
  const reduced=()=>root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch=()=>root.matchMedia('(pointer: coarse)').matches||navigator.maxTouchPoints>0;
  const pair=[[0,-2],[4,0]],other=[[8,-2],[4,0]];
  function el(tag,attrs,parent){const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs||{}))n.setAttribute(k,v);if(parent)parent.append(n);return n;}
  function attrs(n,values){for(const [k,v]of Object.entries(values))n.setAttribute(k,v);}
  function ensure(){
    if(svg)return;
    svg=el('svg',{'class':'tutorial-overlay','aria-hidden':'true','data-no-i18n':''});svg.setAttribute('hidden','');document.body.append(svg);
    const defs=el('defs',{},svg);mask=el('mask',{id:'tutorial-focus-mask',maskUnits:'userSpaceOnUse'},defs);
    el('rect',{x:0,y:0,width:'100%',height:'100%',fill:'white'},mask);holes=el('g',{fill:'black'},mask);
    shade=el('rect',{'class':'tutorial-shade',x:0,y:0,width:'100%',height:'100%',fill:'#3b4248','fill-opacity':'.76',mask:'url(#tutorial-focus-mask)'},svg);
    path=el('path',{'class':'tutorial-path'},svg);progress=el('path',{'class':'tutorial-progress'},svg);
    points=[1,2].map(n=>{const g=el('g',{},svg);el('circle',{r:15},g);const t=el('text',{'text-anchor':'middle',y:5},g);t.textContent=n;return g;});
    ripples=[0,1,2].map(()=>el('circle',{'class':'tutorial-ripple',r:0,opacity:0},svg));
    cursor=el('g',{'class':'tutorial-pointer'},svg);
    const mouse=el('g',{'class':'tutorial-mouse'},cursor);
    el('path',{d:'M2 2 5 36 13 27 20 42 28 38 20 23 33 22Z'},mouse);
    const finger=el('g',{'class':'tutorial-finger'},cursor);
    el('path',{d:'M1 28V7a5 5 0 0 1 10 0v14-6a4 4 0 0 1 8 0v7-3a4 4 0 0 1 8 0v7-2a4 4 0 0 1 8 0v10c0 12-9 18-17 13L5 43l-9-10a4 4 0 0 1 5-5l7 5'},finger);
    const label=el('g',{'class':'tutorial-mouse-key'},cursor);el('rect',{x:35,y:30,width:30,height:39,rx:13},label);el('path',{d:'M35 46h30M50 31v15'},label);el('path',{'class':'tutorial-left-key',d:'M49 32h-2a11 11 0 0 0-11 11v2h13Z'},label);
    document.addEventListener('pointerdown',actualDown,true);document.addEventListener('pointerup',actualUp,true);document.addEventListener('pointercancel',cancel,true);root.addEventListener('blur',cancel);
  }
  function geometry(){
    if(group||!root.BridgeScene.scene)return;
    const T=root.THREE,U=root.ThreeTools;group=new T.Group();group.name='tutorial-ghost-bridge';root.BridgeScene.scene.add(group);
    [pair,other].forEach((ends,i)=>{
      const material=new T.MeshBasicMaterial({color:0x8be6d2,transparent:true,opacity:.22,depthWrite:false,depthTest:false});
      const meshes=[.055,-.975].map(z=>{const m=new T.Mesh(new T.BoxGeometry(.115,1,.115),material);m.renderOrder=8;group.add(m);return{mesh:m,z};});
      beams.push({ends,material,meshes,index:i});
    });
  }
  function clear(){
    if(options&&options.cameraPhase)root.BridgeScene.setNavigation(false);
    options=null;cameraBase=null;cameraTouched=false;dragStart=null;focusRects=[];time=quiet=0;held=false;phase='';lastFeedback=null;
    if(svg)svg.setAttribute('hidden','');
    if(group)root.ThreeTools.dispose(group);group=null;beams=[];
    highlight(null);
  }
  function configure(next){
    if(!next){clear();return;}
    ensure();
    if(!options||options.step!==next.step||options.undone!==next.undone||options.testing!==next.testing||options.cameraPhase!==next.cameraPhase){time=0;phase='';cameraBase=null;cameraTouched=false;}
    options=next;
  }
  function highlight(button){
    if(target===button)return;
    if(target)target.classList.remove('tutorial-target');target=button;if(target)target.classList.add('tutorial-target');
  }
  function replay(){time=0;quiet=0;held=false;cameraTouched=false;cameraBase=null;root.BridgeScene.cancel();if(options&&options.cameraPhase==='turn'){root.BridgeScene.frontView();root.BridgeScene.setNavigation(true);}}
  function pulse(x,y,success=false){lastFeedback={x,y,age:0,success};}
  function actualDown(e){
    if(!options||!document.getElementById('modal').hidden||root.__GAME_STATE__.screen!=='build')return;
    cursor.style.display='none';
    quiet=1.2;time=0;held=e.target.id==='game-canvas';if(held&&options.cameraPhase==='turn'){cameraTouched=true;dragStart={x:e.clientX,y:e.clientY,position:root.BridgeScene.camera.position.clone()};}pulse(e.clientX,e.clientY);
  }
  function actualUp(e){if(!options)return;held=false;quiet=1.1;time=0;pulse(e.clientX,e.clientY);if(dragStart){const d=dragStart;dragStart=null;if(options.cameraPhase==='turn'&&Math.hypot(e.clientX-d.x,e.clientY-d.y)>12&&root.BridgeScene.camera.position.distanceTo(d.position)>.02)options.onRotate&&options.onRotate();}}
  function cancel(){dragStart=null;held=false;quiet=1.1;time=0;}
  function connected(){if(!options)return;const R=root.BridgeScene,p=R.toScreen(2,0),r=document.getElementById('stage').getBoundingClientRect();pulse(r.x+p[0],r.y+p[1],true);quiet=.75;}
  function setPhase(value){if(phase===value)return;phase=value;const n=document.getElementById('tutorial-action');if(n)n.textContent=value;}
  function screen(p){const r=document.getElementById('stage').getBoundingClientRect(),q=root.BridgeScene.toScreen(p[0]*.5,p[1]*.5);return{x:r.left+q[0],y:r.top+q[1]};}
  function buttonPoint(selector){const b=document.querySelector(selector);if(!b||b.hidden||!b.getClientRects().length){highlight(null);return null;}const r=b.getBoundingClientRect();highlight(b);return{x:r.left+r.width*.55,y:r.top+r.height*.45};}
  function ring(i,p,age,color='#e4ac47'){const n=ripples[i],life=1-Math.min(1,Math.max(0,age));attrs(n,{cx:p.x,cy:p.y,r:13+23*(1-life),opacity:life*.9,stroke:color});}
  function focus(cameraPhase,step,testing){
    const rects=[];
    const add=(n,pad=5)=>{if(!n||!n.getClientRects().length)return;const r=n.getBoundingClientRect();rects.push({x:r.x-pad,y:r.y-pad,width:r.width+pad*2,height:r.height+pad*2});};
    add(document.getElementById('coach'),3);
    document.querySelectorAll('.topbar [data-open="help"],.topbar .language-switch,.topbar [data-sound-toggle],#btn-menu').forEach(n=>add(n,1));
    add(target,7);
    if(cameraPhase==='turn'||testing){add(document.getElementById('stage'),-2);if(testing)add(document.getElementById('test-hud'),3);}
    else if(!cameraPhase&&step>0){
      const ps=[[0,-2],[4,0],[8,-2]].map(screen),r=document.getElementById('stage').getBoundingClientRect();
      const left=Math.max(r.left+2,Math.min(...ps.map(p=>p.x))-45),top=Math.max(r.top+45,Math.min(...ps.map(p=>p.y))-45);
      rects.push({x:left,y:top,width:Math.min(r.right-2,Math.max(...ps.map(p=>p.x))+45)-left,height:Math.min(r.bottom-2,Math.max(...ps.map(p=>p.y))+45)-top});
    }
    attrs(mask,{x:0,y:0,width:innerWidth,height:innerHeight});
    while(holes.children.length<rects.length)el('rect',{rx:10},holes);
    [...holes.children].forEach((n,i)=>{n.style.display=i<rects.length?'':'none';if(rects[i])attrs(n,rects[i]);});focusRects=rects;
  }
  function update(dt){
    if(!options||!svg)return;
    const R=root.BridgeScene,S=root.__GAME_STATE__;
    const show=S.screen==='build'&&document.getElementById('modal').hidden&&!document.hidden&&!R.contextLost&&['edit','test'].includes(S.mode);
    svg.toggleAttribute('hidden',!show);if(group)group.visible=show&&S.mode==='edit';
    if(!show){highlight(null);return;}
    geometry();group.visible=S.mode==='edit';
    quiet=Math.max(0,quiet-dt);
    const interacting=held||R.state.drag||R.state.pending||quiet>0;
    if(!interacting)time+=dt;
    ripples.forEach(n=>n.setAttribute('opacity',0));
    const t=time%5.4,step=options.step,cam=options.cameraPhase,isReduced=reduced();if(cam)R.stopIntro();
    let pointer=null,press=false,amount=0,endpoints=null,current=null,completed=false;
    path.style.display=progress.style.display='none';points.forEach(n=>n.style.display='none');
    if(cam==='orbit'){pointer=buttonPoint('[data-view=orbit]');press=t>.9&&t<1.5;setPhase('Tap Orbit view.');}
    else if(cam==='front'){pointer=buttonPoint('[data-view=front]');press=t>.9&&t<1.5;setPhase('Tap Front view to build.');}
    else if(cam==='turn'){
      highlight(null);const r=document.getElementById('stage').getBoundingClientRect(),a={x:r.x+r.width*.35,y:r.y+r.height*.55},b={x:r.x+r.width*.68,y:a.y};
      const p=isReduced?0:Math.max(0,Math.min(1,(t-1.2)/2.2));pointer={x:a.x+(b.x-a.x)*p,y:a.y};press=t>.7&&t<3.5;
      path.style.display='';path.setAttribute('d',`M${a.x} ${a.y}L${b.x} ${b.y}`);
      setPhase(cameraTouched?'Now tap Front view.':isReduced?'Drag sideways to turn.':'Hold and drag sideways.');
      if(!cameraBase)cameraBase=R.camera.position.clone().sub(R.controls.target);
      if(!interacting&&!cameraTouched&&!isReduced)R.demonstrateOrbit(cameraBase,Math.sin(p*Math.PI)*.32);
    }
    else if(options.testing){pointer=buttonPoint('#btn-pause');press=t>.9&&t<1.4;setPhase('Pause to watch the forces.');}
    else if(step===0){pointer=buttonPoint('#materials [data-tool="timber"]');press=t>.8&&t<1.5;setPhase('Choose Timber below.');}
    else if(step===1||step===3){
      highlight(null);endpoints=step===1?pair:other;const a=screen(endpoints[0]),b=screen(endpoints[1]);
      path.style.display='';path.setAttribute('d',`M${a.x} ${a.y}L${b.x} ${b.y}`);
      points.forEach((n,i)=>{n.style.display='';attrs(n,{transform:`translate(${i?b.x:a.x} ${i?b.y:a.y})`});});
      if(isReduced){pointer=a;amount=1;setPhase(step===1?'Hold, drag, release.':'Tap 1, then tap 2.');}
      else if(step===1){
        const p=Math.max(0,Math.min(1,(t-1.5)/1.8)),ease=p*p*(3-2*p);pointer={x:a.x+(b.x-a.x)*ease,y:a.y+(b.y-a.y)*ease};amount=ease;press=t>=.8&&t<3.4;
        setPhase(t<.8?'Watch the pointer.':t<1.5?'Demo · hold':t<3.3?'Demo · drag':t<4.25?'Demo · release':'Your turn · drag the same way');
        if(t>=.8&&t<1.5)ring(0,a,(t-.8)/.7);if(t>=3.4&&t<4.25)ring(1,b,(t-3.4)/.85);
      }else{
        const p=Math.max(0,Math.min(1,(t-1.6)/1.3));pointer={x:a.x+(b.x-a.x)*p,y:a.y+(b.y-a.y)*p};amount=t>3.05?1:0;press=t>.8&&t<1.2||t>3&&t<3.4;
        setPhase(t<1.6?'Demo · tap 1':t<3?'Demo · move':t<4.1?'Demo · tap 2':'Your turn · tap both dots');
        if(t>=.8&&t<1.5)ring(0,a,(t-.8)/.7);if(t>=3&&t<3.8)ring(1,b,(t-3)/.8);
      }
      current={x:a.x+(b.x-a.x)*amount,y:a.y+(b.y-a.y)*amount};
      progress.style.display=amount>0?'':'none';progress.setAttribute('d',`M${a.x} ${a.y}L${current.x} ${current.y}`);
      completed=amount===1;
    }else if(step===2){pointer=buttonPoint(options.undone?'#btn-redo':'#btn-undo');press=t>.9&&t<1.5;setPhase(options.undone?'Redo brings your support back.':'Undo removes your last support.');}
    else{pointer=buttonPoint('#btn-test');press=t>.9&&t<1.5;setPhase('Your bridge is ready. Test it.');}
    // Static translucent members show the target; the brighter portion follows the demonstration.
    beams.forEach(beam=>{
      const exists=beam.index===0?options.hasLeft:options.hasRight;
      const grow=endpoints&&(beam.index===(step===1?0:1));
      beam.material.opacity=grow?(completed?.5:.27):.13;
      beam.meshes.forEach(({mesh,z})=>{
        mesh.visible=S.mode==='edit'&&!cam&&!exists&&step!==0;
        if(!mesh.visible)return;
        const T=root.THREE,a=new T.Vector3(beam.ends[0][0]*.5,beam.ends[0][1]*.5,z),b=new T.Vector3(beam.ends[1][0]*.5,beam.ends[1][1]*.5,z);
        root.ThreeTools.segment(mesh,a,b);mesh.visible=true;
      });
    });
    focus(cam,step,options.testing);svg.dataset.camera=cam||'';
    svg.dataset.step=String(step);svg.dataset.phase=phase;svg.dataset.pressed=String(press&&!interacting&&!isReduced);svg.dataset.touch=String(touch());
    cursor.style.display=pointer&&!interacting?'':'none';
    if(pointer){
      const x=Math.max(3,Math.min(innerWidth-3,pointer.x)),y=Math.max(3,Math.min(innerHeight-3,pointer.y));
      cursor.classList.toggle('near-bottom',y>innerHeight-85);
      attrs(cursor,{transform:`translate(${x} ${y}) scale(${press&&!isReduced?.92:1})`});
      cursor.classList.toggle('pressed',press&&!isReduced);
      if(press&&!interacting&&!isReduced&&!endpoints)ring(0,pointer,Math.max(0,(t-.9)/.6));
    }
    if(interacting){ripples.forEach(n=>n.setAttribute('opacity',0));progress.style.display='none';}
    if(lastFeedback){lastFeedback.age+=dt;ring(2,lastFeedback,Math.min(1,lastFeedback.age/1.0),lastFeedback.success?'#137d64':'#fff4b0');if(lastFeedback.age>=1)lastFeedback=null;}
  }
  root.TutorialGuide={configure,update,clear,replay,connected,get state(){return{active:!!options,step:options&&options.step,time,phase,held,cameraPhase:options&&options.cameraPhase,focusRects,ghostMembers:beams.length,visible:!!svg&&!svg.hasAttribute('hidden')};}};
})(typeof self!=='undefined'?self:this);
