/* Procedural, texture-free valley: all geometry works with file:// offline. */
(function(root){
  "use strict";
  const T=root.THREE,U=root.ThreeTools,G=root.BridgePhysics.G;
  function build(level,scene){
    const group=new T.Group();group.name="valley";scene.add(group);const span=level.span,depth=level.waterY??(level.yMin-.9)*G,bank=7,deckY=(level.deckY||0)*G;
    const grass=U.mat(0x789565),rock=U.mat(0x9b896f),edge=U.mat(0xb4aa88),asphalt=U.mat(0xccc4a4);
    function box(w,h,d,material,x,y,z){return U.mesh(group,new T.BoxGeometry(w,h,d),material,x,y,z);}
    [-bank/2,span+bank/2].forEach((x,side)=>{
      box(bank,deckY-depth+1,13,rock,x,(depth-1+deckY)/2-.20,-4.5);
      box(bank,.16,13,grass,x,deckY-.13,-4.5);
      box(bank,.07,1.02,asphalt,x,deckY-.045,-.46);
      box(.16,deckY-depth+.1,1.25,edge,side?span+.06:-.06,(depth+deckY)/2-.08,-.45);
      // Layered cliff seams; horizontal layers remain behind the editing plane.
      for(let k=0;k<5;k++)box(bank,.035,.018,U.mat(k%2?0x8c7a63:0xb2a184),x,depth*(k+1)/6,2.005);
      for(let n=0;n<8;n++){
        const px=(side?span+.8:-bank+.6)+(n*1.93)%(bank-1.4),pz=-2.4-(n%3)*2.1,h=.9+(n%4)*.24;
        U.mesh(group,new T.CylinderGeometry(.055,.09,h*.6,6),U.mat(0x755b3f),px,deckY+h*.27-.04,pz);
        for(let k=0;k<3;k++)U.mesh(group,new T.ConeGeometry(h*(.37-k*.055),h*.64,6),U.mat([0x426a50,0x56815c,0x668c61][k]),px,deckY+h*(.48+k*.2),pz);
      }
      // Low-poly boulders along the riverbanks.
      for(let n=0;n<5;n++){const b=U.mesh(group,new T.DodecahedronGeometry(.38+n%2*.12,0),rock,side?span+.15:-.15,depth+.12,-1-n*1.7);b.scale.set(1,.7,1.2);}
    });
    const waterMat=U.mat(0x4b9ead,{roughness:.3,metalness:.25,transparent:true,opacity:.88});
    const water=U.mesh(group,new T.PlaneGeometry(span+.1,38,1,1),waterMat,span/2,depth,-5);water.rotation.x=-Math.PI/2;water.castShadow=false;
    box(span+14,.2,38,U.mat(0x657d79),span/2,depth-.32,-5);
    const waves=new T.Group();group.add(waves);
    const waveMat=new T.MeshBasicMaterial({color:0xc6e4dd,transparent:true,opacity:.32});
    for(let n=0;n<28;n++){const w=U.mesh(waves,new T.PlaneGeometry(.25+(n%4)*.18,.025),waveMat,((n*1.81)%span),depth+.015,-19+(n*2.31)%32);w.rotation.x=-Math.PI/2;w.userData.start=w.position.z;w.castShadow=false;}
    if(level.island){
      const [a,b]=level.island.map(x=>x*G),cx=(a+b)/2;
      box(b-a,deckY-depth+.7,5,rock,cx,(deckY+depth-.7)/2,-.46);
      box(b-a,.16,5,grass,cx,deckY-.13,-.46);box(b-a,.07,1.02,asphalt,cx,deckY-.045,-.46);
    }
    const channels=(level.navigation||[]).map((n,i)=>{
      const x=(n.x1+n.x2)/2,height=n.requiredClearance;
      const envelope=U.mesh(group,new T.BoxGeometry(n.x2-n.x1,height,1.6),U.mat(0x299dd0,{transparent:true,opacity:.07,depthWrite:false}),x,depth+height/2,-.46);envelope.castShadow=false;
      const edges=new T.LineSegments(new T.EdgesGeometry(envelope.geometry),new T.LineBasicMaterial({color:0x217ca4,transparent:true,opacity:.55}));edges.position.copy(envelope.position);group.add(edges);
      const boat=new T.Group();boat.name='navigation-boat-'+i;group.add(boat);boat.position.set(x,depth,-4);
      const width=Math.min(1.35,n.x2-n.x1-.2);
      U.mesh(boat,new T.BoxGeometry(width,.28,1.9),U.mat(0xf6e4bd),0,.07,0);
      U.mesh(boat,new T.BoxGeometry(width*.7,.4,.7),U.mat(0x346c83),0,.39,-.25);
      U.mesh(boat,new T.CylinderGeometry(.028,.035,height-.4,6),U.mat(0xf0ece2),0,(height+.4)/2,0);
      const flag=U.mesh(boat,new T.BoxGeometry(.3,.17,.018),U.mat(0xe6a144),.15,height-.12,0);flag.castShadow=false;
      U.mesh(boat,new T.BoxGeometry(.09,.09,width*.7),U.mat(0xf0ece2),0,height-.04,0);
      return{boat,envelope,edges,n};
    });
    // Support columns match actual anchor positions, including the finale pier.
    const columns=new Map();level.anchors.forEach(a=>{const x=a[0]*G,y=a[1]*G;if(y>deckY||a[0]>0&&a[0]<level.N)columns.set(x,Math.max(columns.get(x)||0,y));});
    columns.forEach((top,x)=>{box(.34,top-depth+.2,1.2,U.mat(0x8c9c99),x,(top+depth)/2-.1,-.46);box(.5,.13,1.4,edge,x,top-.09,-.46);});
    // Distant silhouettes are actual faceted meshes, safely behind all bridge input.
    for(let n=0;n<13;n++){
      const h=3.5+(Math.sin(n*5.1)+1)*2.5;
      const mountain=U.mesh(group,new T.ConeGeometry(4+n%3,h,5),U.mat(n%2?0x8facaa:0x9eb9b3),-20+n*4.3,depth+h/2,-23-n%3*3);mountain.castShadow=false;
      mountain.rotation.y=n*.8;
    }
    return{group,waves,depth,channels};
  }
  function update(t,time,reduced,sim){if(!t)return;if(!reduced)t.waves.children.forEach((w,n)=>{w.position.z=-20+((w.userData.start+20+time*(.25+n%3*.05))%36);});t.channels.forEach((c,i)=>{const n=sim&&sim.navigation[i];c.boat.position.z=n?n.z:-4;c.envelope.material.color.setHex(n&&n.blocked?0xd45b40:0x299dd0);c.edges.material.color.setHex(n&&n.blocked?0xd45b40:0x217ca4);});}
  root.Terrain3D={build,update,clear:t=>t&&U.dispose(t.group)};
})(typeof self!=="undefined"?self:this);
