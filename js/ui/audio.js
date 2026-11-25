/* Quiet, offline procedural effects. Audio starts only after a real user gesture. */
(function(root){
 'use strict';
 const KEY='riverbend.sound',voices=new Set(),last=new Map(),played={};
 let context=null,master=null,muted=false,unlocked=false,unavailable=false;
 try{muted=localStorage.getItem(KEY)==='off';}catch(_){}
 function sync(){document.querySelectorAll('[data-sound-toggle]').forEach(b=>{
  b.setAttribute('aria-pressed',String(!muted));b.setAttribute('aria-label',muted?'Enable sound':'Mute sound');b.title=muted?'Enable sound':'Mute sound';
  b.innerHTML='<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9h4l5-4v14l-5-4H3Z"/>'+(muted?'<path d="m16 9 6 6m0-6-6 6"/>':'<path d="M16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>')+'</svg>';
 });}
 function stop(){for(const n of voices){try{n.stop();}catch(_){}}voices.clear();}
 function unlock(e){
  if(e&&!e.isTrusted)return;
  unlocked=true;if(muted||unavailable)return;
  try{if(!context){const A=root.AudioContext||root.webkitAudioContext;if(!A){unavailable=true;return;}context=new A();master=context.createGain();master.gain.value=.17;master.connect(context.destination);}if(context.state==='suspended')context.resume().catch(()=>{});}catch(_){unavailable=true;}
 }
 function voice(freq,at,duration,volume=.5,type='sine',end=freq){
  const o=context.createOscillator(),g=context.createGain();o.type=type;o.frequency.setValueAtTime(freq,at);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),at+duration);
  g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(volume,at+.008);g.gain.exponentialRampToValueAtTime(.001,at+duration);o.connect(g);g.connect(master);voices.add(o);o.onended=()=>{voices.delete(o);o.disconnect();g.disconnect();};o.start(at);o.stop(at+duration+.02);
 }
 function crack(at){
  const b=context.createBuffer(1,Math.ceil(context.sampleRate*.16),context.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);
  const n=context.createBufferSource(),f=context.createBiquadFilter(),g=context.createGain();n.buffer=b;f.type='lowpass';f.frequency.value=1500;g.gain.value=.5;n.connect(f);f.connect(g);g.connect(master);voices.add(n);n.onended=()=>{voices.delete(n);n.disconnect();f.disconnect();g.disconnect();};n.start(at);n.stop(at+.17);
 }
 function play(name){
  if(muted||!unlocked||!context||context.state!=='running'||document.hidden||!document.hasFocus())return false;
  const at=context.currentTime,limit=name==='break'||name==='fall'?.45:.045;if(at-(last.get(name)??-10)<limit)return false;last.set(name,at);played[name]=(played[name]||0)+1;
  switch(name){
   case 'connect':voice(420,at,.12,.65,'triangle',620);voice(840,at+.035,.1,.25);break;
   case 'undo':case 'erase':voice(480,at,.12,.4,'triangle',240);break;
   case 'redo':voice(260,at,.13,.4,'triangle',520);break;
   case 'reject':voice(160,at,.15,.3,'triangle',130);break;
   case 'start':[220,330,440].forEach((f,i)=>voice(f,at+i*.065,.18,.35,'triangle'));break;
   case 'break':case 'fall':crack(at);voice(120,at,.18,.4,'triangle',45);break;
   case 'pass':[523.25,659.25,783.99,1046.5].forEach((f,i)=>voice(f,at+i*.09,.38,.35));break;
   case 'fail':voice(294,at,.23,.3,'triangle',220);voice(196,at+.18,.3,.27);break;
   case 'pause':voice(390,at,.09,.25);break;
   default:voice(660,at,.065,.2,'sine',570);
  }return true;
 }
 function toggle(){muted=!muted;try{localStorage.setItem(KEY,muted?'off':'on');}catch(_){}if(master)master.gain.setValueAtTime(muted?0:.17,context.currentTime);if(muted)stop();else{unlock();play('click');}sync();}
 document.addEventListener('pointerdown',unlock,{capture:true,passive:true});document.addEventListener('keydown',e=>{if(!e.repeat)unlock(e);},true);
 document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.hasAttribute('data-sound-toggle'))toggle();else play('click');},true);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();if(context&&context.state==='running')context.suspend().catch(()=>{});}});
 root.addEventListener('blur',stop);
 const B=root.BridgeBus,E=root.BridgeEvents;
 B.on(E.DESIGN_REJECTED,()=>play('reject'));B.on(E.TEST_STARTED,()=>play('start'));B.on(E.SIM_BREAK,()=>play('break'));B.on(E.SIM_FALL,()=>play('fall'));B.on(E.TEST_FINISHED,({outcome})=>play(outcome==='pass'?'pass':'fail'));
 root.GameAudio={play,sync,get state(){return{muted,unlocked,available:!unavailable,status:context?context.state:'idle',voices:voices.size,played:{...played}};}};
 sync();
})(typeof self!=='undefined'?self:this);
