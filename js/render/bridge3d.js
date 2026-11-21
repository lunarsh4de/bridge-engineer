/* Static topology, reusable unit geometries. Simulation nodes are already metres. */
(function(root){
  "use strict";
  const T=root.THREE,U=root.ThreeTools,G=root.BridgePhysics.G;
  const colors={road:0xd3c5a0,timber:0xa96d39,steel:0x718d9e,cable:0x344c57};
  function build(design,scene){
    const group=new T.Group();group.name="bridge";scene.add(group);
    const entries=design.members.map((m,i)=>{
      const type=m.m,material=U.mat(colors[type],{roughness:type==="steel"?.3:.83,metalness:type==="steel"?.75:.05});
      const bandMaterial=U.mat(0x2e7dd1), geometry=type==="road"?new T.BoxGeometry(.085,1,.94):type==="timber"?new T.BoxGeometry(.105,1,.105):new T.CylinderGeometry(type==="cable"?.023:.056,type==="cable"?.023:.056,1,8);
      const main=U.mesh(group,geometry,material),parts=[main];
      // Two independently aligned halves leave a visible fracture gap.
      const half=U.mesh(group,geometry,material);half.visible=false;parts.push(half);
      const bands=[U.mesh(group,new T.SphereGeometry(type==="road"?.067:.078,8,6),bandMaterial),U.mesh(group,new T.SphereGeometry(type==="road"?.067:.078,8,6),bandMaterial)];
      bands.forEach(b=>b.visible=false);
      const slack=[];if(type==="cable")for(let n=0;n<8;n++)slack.push(U.mesh(group,geometry,material));
      const rearParts=type==='road'?[]:parts.map(part=>U.mesh(group,part.geometry,material));
      const rearBands=bands.map(part=>U.mesh(group,part.geometry,bandMaterial));
      const rearSlack=slack.map(part=>U.mesh(group,part.geometry,material));
      const e={i,type,source:m,material,bandMaterial,baseColor:colors[type],parts,bands,slack,rearParts,rearBands,rearSlack};main.userData.member=i;return e;
    });
    const nodes=root.BridgeModel.joints(design).map(j=>{
      const material=U.mat(j.anchor?0x274957:0xe8e8d4,{metalness:.35,roughness:.45});
      const mesh=U.mesh(group,j.anchor?new T.CylinderGeometry(.13,.19,.16,4):new T.SphereGeometry(.078,10,8),material,j.p[0]*G,j.p[1]*G,.035);
      if(j.anchor)mesh.rotation.x=Math.PI/2;
      const rear=U.mesh(group,mesh.geometry,material,j.p[0]*G,j.p[1]*G,-.955);rear.rotation.copy(mesh.rotation);
      const tie=U.mesh(group,new T.BoxGeometry(.065,.065,.92),U.mat(j.anchor?0x536c70:0x7c8e85),j.p[0]*G,j.p[1]*G-.09,-.46);
      return{p:j.p,mesh,rear,tie};
    });
    return{group,entries,nodes};
  }
  const a=new T.Vector3(),b=new T.Vector3(),q=new T.Vector3(),r=new T.Vector3();
  function update(bridge,sim,inspect,forces,highlight,hover,trace=[]){
    if(!bridge)return;
    bridge.entries.forEach((e,i)=>{
      const sm=sim&&sim.mems[i],info=sm||(inspect&&inspect[i]),z=e.type==="road"?-.46:0;
      if(sm){a.set(sm.a.x,sm.a.y,z);b.set(sm.b.x,sm.b.y,z);}else{a.set(e.source.a[0]*G,e.source.a[1]*G,z);b.set(e.source.b[0]*G,e.source.b[1]*G,z);}
      if(e.type==="road"){a.y-=.045;b.y-=.045;}
      const broken=info&&info.broken,slack=sm&&sm.slack&&e.type==="cable"&&!broken;
      e.slack.forEach(m=>m.visible=false);
      if(broken){q.copy(a).lerp(b,.43);U.segment(e.parts[0],a,q);r.copy(a).lerp(b,.57);U.segment(e.parts[1],r,b);}
      else if(slack){e.parts.forEach(m=>m.visible=false);e.slack.forEach((m,n)=>{const t=n/8,t2=(n+.62)/8;q.copy(a).lerp(b,t);r.copy(a).lerp(b,t2);q.y-=Math.sin(t*Math.PI)*.13;r.y-=Math.sin(t2*Math.PI)*.13;U.segment(m,q,r);});}
      else{U.segment(e.parts[0],a,b);e.parts[1].visible=false;}
      const width=i===hover?1.5:1;e.parts.forEach(m=>{m.scale.x=width;m.scale.z=width;});
      e.bands[0].position.copy(a).lerp(b,.12);e.bands[1].position.copy(a).lerp(b,.88);e.bands.forEach(m=>m.position.z=e.type==="road"?.035:.07);
      root.Stress3D.update(e,info,forces,i===highlight);
      if(trace.includes(i))e.material.emissive.setHex(0x155a50);
      for(const [front,rear] of [[e.parts,e.rearParts],[e.bands,e.rearBands],[e.slack,e.rearSlack]])rear.forEach((m,j)=>{const src=front[j];m.position.copy(src.position);m.position.z=-.92-src.position.z;m.quaternion.copy(src.quaternion);m.scale.copy(src.scale);m.visible=src.visible;});
    });
    const map=sim?new Map(sim.nodes.map(n=>[n.k,n])):null;
    bridge.nodes.forEach(n=>{const sn=map&&map.get(root.BridgePhysics.keyOf(n.p));n.mesh.position.set(sn?sn.x:n.p[0]*G,sn?sn.y:n.p[1]*G,.035);n.rear.position.copy(n.mesh.position);n.rear.position.z=-.955;n.tie.position.set(n.mesh.position.x,n.mesh.position.y-.09,-.46);});
  }
  root.Bridge3D={build,update,clear:b=>b&&U.dispose(b.group)};
})(typeof self!=="undefined"?self:this);
