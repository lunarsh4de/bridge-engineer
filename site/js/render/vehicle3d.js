/* Prescribed visual vehicle; its axles follow the existing solver, not 3D physics. */
(function(root){
  "use strict";
  const T=root.THREE,U=root.ThreeTools;
  function create(scene){
    const group=new T.Group();group.name="delivery-truck";scene.add(group);
    const orange=U.mat(0xe19740),dark=U.mat(0x283f46),bed=U.mat(0x957448),glass=U.mat(0xa8d3d5,{metalness:.2,roughness:.2});
    const box=(w,h,d,m,x,y,z)=>U.mesh(group,new T.BoxGeometry(w,h,d),m,x,y,z);
    box(2.15,.15,.72,dark,0,.34,0);box(.68,.67,.72,orange,.65,.76,0);
    box(.50,.27,.74,glass,.68,.87,0);box(.7,.07,.77,orange,.64,1.12,0);
    box(1.35,.17,.76,bed,-.4,.5,0);box(1.4,.3,.05,bed,-.4,.7,.37);box(1.4,.3,.05,bed,-.4,.7,-.37);
    box(.055,.31,.76,bed,-1.07,.7,0);box(.12,.12,.52,U.mat(0xffe5a4),1.02,.6,0);
    const wheels=[];
    for(const x of[-.8,.8])for(const z of[-.4,.4]){
      const wheel=U.mesh(group,new T.CylinderGeometry(.22,.22,.15,14),dark,x,.22,z);wheel.rotation.x=Math.PI/2;wheels.push(wheel);
      const hub=U.mesh(group,new T.CylinderGeometry(.11,.11,.158,10),U.mat(0xb9c1b5,{metalness:.6}),x,.22,z);hub.rotation.x=Math.PI/2;
    }
    for(let n=0;n<5;n++){
      const x=-.9+(n%3)*.39,z=n<3?-.19:.16;
      box(.26,.25,.25,U.mat(0xbaa27a),x,.72,z);
      U.mesh(group,new T.CylinderGeometry(.015,.015,.25,5),U.mat(0x476d3e),x,.96,z);
      for(let k=0;k<2;k++){const leaf=U.mesh(group,new T.SphereGeometry(.11,6,4),U.mat(0x60864b),x+(k?-.06:.06),1.04+k*.09,z);leaf.scale.set(1,.3,.6);}
    }
    group.visible=false;return{group,wheels,sim:null,fallTime:0,fallY:0};
  }
  function reset(v){if(v){v.sim=null;v.fallTime=0;v.group.visible=false;}}
  function update(v,sim,dt){
    if(!v)return;v.group.visible=!!sim;if(!sim)return;
    if(v.sim!==sim){v.sim=sim;v.fallTime=0;}
    const s=sim.vehicle;let y=s.fallen?s.fallY:(s.yf+s.yr)/2;
    // Once the solver stops, continue only the visual fall, never saved simulation state.
    if(s.fallen&&sim.outcome){v.fallTime+=dt;y-=Math.abs(s.fallV)*v.fallTime+4.905*v.fallTime*v.fallTime;}
    v.group.position.set(s.front-s.wheelbase/2,y,-.46);
    v.group.rotation.z=s.fallen?-.15-Math.min(.7,v.fallTime*.4):Math.atan2(s.yf-s.yr,s.wheelbase);
    v.wheels.forEach(w=>w.rotation.y=-s.front/.22);v.fallY=y;
  }
  root.Vehicle3D={create,update,reset,remove:v=>v&&U.dispose(v.group)};
})(typeof self!=="undefined"?self:this);
