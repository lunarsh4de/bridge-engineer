/* Raycast onto the visible front/rear XY elevation; both edit one shared design. */
(function(root){
  "use strict";
  const T=root.THREE,P=root.BridgePhysics,M=root.BridgeModel,Bus=root.BridgeBus,E=root.BridgeEvents,U=root.ThreeTools;
  function init({camera,canvas,state:S,project,label,getPlaneZ,isNavigating}){
    const ray=new T.Raycaster(),plane=new T.Plane(new T.Vector3(0,0,1),0),hit=new T.Vector3(),ndc=new T.Vector2();
    const preview=new T.Group();root.BridgeScene.scene.add(preview);
    const previewMat=U.mat(0x2e9780,{transparent:true,opacity:.6,depthTest:false});
    const ghost=U.mesh(preview,new T.CylinderGeometry(.032,.032,1,6),previewMat);
    const cursor=U.mesh(preview,new T.SphereGeometry(.10,10,8),previewMat);
    const start=U.mesh(preview,new T.TorusGeometry(.14,.025,5,16),U.mat(0x176f62,{depthTest:false}));
    const guides=[0,1].map(()=>U.mesh(preview,new T.TorusGeometry(.15,.03,5,18),U.mat(0xe0a932,{depthTest:false})));
    const pointers=new Map();let action=null,multi=false,keyboardPoint=null,keyboardLevel=null;
    const rect=()=>canvas.getBoundingClientRect();
    function coords(e){const r=rect();return[e.clientX-r.left,e.clientY-r.top];}
    function toGrid(e,snap=true){
      const r=rect();if(!r.width||!r.height)return null;
      ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);camera.updateMatrixWorld();ray.setFromCamera(ndc,camera);
      plane.constant=-getPlaneZ();if(!ray.ray.intersectPlane(plane,hit))return null;
      if(!snap)return[hit.x/P.G,hit.y/P.G];
      const [x,y]=coords(e);let best=null,dist=18;
      if(S.design)for(const j of M.joints(S.design)){const p=project(j.p[0]*P.G,j.p[1]*P.G),d=Math.hypot(p[0]-x,p[1]-y);if(d<dist){best=j.p.slice();dist=d;}}
      return best||[Math.round(hit.x/P.G),Math.round(hit.y/P.G)];
    }
    function inArea(p){const l=S.level;return p&&l&&p[0]>=0&&p[0]<=l.N&&p[1]>=l.yMin&&p[1]<=l.yMax;}
    function nearest(e){
      if(!S.design)return-1;const [x,y]=coords(e);let best=-1,distance=16;
      S.design.members.forEach((m,i)=>{const a=project(m.a[0]*P.G,m.a[1]*P.G),b=project(m.b[0]*P.G,m.b[1]*P.G),dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1))),d=Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t);if(d<distance){distance=d;best=i;}});return best;
    }
    function hover(e){const i=(S.mode==="edit"||S.inspect)?nearest(e):-1;S.hover=i;const p=coords(e);Bus.emit(E.MEMBER_HOVER,{i,x:p[0],y:p[1]});}
    function cancel(){S.pending=S.drag=S.cursor=null;label.hidden=true;ghost.visible=cursor.visible=start.visible=false;}
    function finish(a,b){S.pending=null;if(!inArea(b)||a[0]===b[0]&&a[1]===b[1])return;const before=S.design.members.length;Bus.emit(E.DESIGN_ADD,{a,b,type:S.tool});action=S.design.members.length>before?{type:"addMember",a:a.slice(),b:b.slice(),mat:S.tool}:null;}
    function down(e){
      pointers.set(e.pointerId,e);if(pointers.size>1){multi=true;cancel();return;}
      if(e.button===2){cancel();return;}if(e.button!==0||isNavigating()||S.mode!=="edit"&&!S.inspect)return;
      canvas.focus({preventScroll:true});
      if(S.inspect){hover(e);return;}
      if(S.tool==="erase"){const i=nearest(e);if(i>=0)Bus.emit(E.DESIGN_ERASE,{i});return;}
      const p=toGrid(e);if(!inArea(p))return;
      const xy=coords(e);S.drag={a:S.pending||p,sx:xy[0],sy:xy[1],pending:!!S.pending,id:e.pointerId};
      canvas.setPointerCapture(e.pointerId);
    }
    function move(e){if(multi||isNavigating())return;const p=toGrid(e);S.cursor=inArea(p)?p:null;hover(e);}
    function up(e){
      pointers.delete(e.pointerId);if(multi){if(!pointers.size)multi=false;cancel();return;}
      const drag=S.drag;S.drag=null;if(!drag||drag.id!==e.pointerId)return;
      const r=rect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom){cancel();return;}
      const b=toGrid(e),p=coords(e);if(drag.pending||Math.hypot(p[0]-drag.sx,p[1]-drag.sy)>8)finish(drag.a,b);else S.pending=drag.a;
      if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
    }
    function abort(e){pointers.delete(e.pointerId);if(!pointers.size)multi=false;cancel();}
    function leave(){if(!S.drag){S.cursor=null;S.hover=-1;Bus.emit(E.MEMBER_HOVER,{i:-1});}}
    function resetPointers(){pointers.clear();multi=false;cancel();}
    function context(e){e.preventDefault();}
    function key(e){if(e.key==="Escape")cancel();}
    function keyboard(e){
      if(S.mode!=="edit"||isNavigating()||!S.level||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter'].includes(e.key))return;
      e.preventDefault();if(keyboardLevel!==S.level){keyboardPoint=[0,0];keyboardLevel=S.level;}
      if(e.key==='ArrowLeft')keyboardPoint[0]--;if(e.key==='ArrowRight')keyboardPoint[0]++;if(e.key==='ArrowUp')keyboardPoint[1]++;if(e.key==='ArrowDown')keyboardPoint[1]--;
      keyboardPoint[0]=Math.max(0,Math.min(S.level.N,keyboardPoint[0]));keyboardPoint[1]=Math.max(S.level.yMin,Math.min(S.level.yMax,keyboardPoint[1]));S.cursor=keyboardPoint.slice();
      if(e.key==='Enter'){
        if(S.tool==='erase'){const p=project(keyboardPoint[0]*P.G,keyboardPoint[1]*P.G),r=rect(),i=nearest({clientX:p[0]+r.left,clientY:p[1]+r.top});if(i>=0)Bus.emit(E.DESIGN_ERASE,{i});}
        else if(S.pending)finish(S.pending,keyboardPoint.slice());else S.pending=keyboardPoint.slice();
      }
      const status=document.getElementById('construction-status');if(status)status.textContent='Grid '+keyboardPoint.join(', ')+'. '+(S.pending?'Start selected. Move and press Enter to connect.':'Press Enter to select a start.');
    }
    const events={pointerdown:down,pointermove:move,pointerup:up,pointercancel:abort,pointerleave:leave,contextmenu:context,keydown:keyboard};
    Object.entries(events).forEach(([n,f])=>canvas.addEventListener(n,f));root.addEventListener("keydown",key);root.addEventListener("blur",resetPointers);
    function update(){
      const a=S.drag?S.drag.a:S.pending,b=S.cursor;
      preview.position.z=getPlaneZ();guides.forEach((g,i)=>{const p=S.guide&&S.guide[i];g.visible=!!p;if(p)g.position.set(p[0]*P.G,p[1]*P.G,.1);});
      preview.visible=S.mode==="edit"&&!isNavigating();cursor.visible=!!b&&preview.visible&&S.tool!=="erase";start.visible=!!a&&preview.visible;
      if(b)cursor.position.set(b[0]*P.G,b[1]*P.G,.08);if(a)start.position.set(a[0]*P.G,a[1]*P.G,.08);
      ghost.visible=!!(a&&b&&S.tool!=="erase"&&preview.visible);label.hidden=!ghost.visible;
      canvas.style.cursor=isNavigating()?"grab":S.mode==="edit"?(S.tool==="erase"?"pointer":"crosshair"):"default";
      if(ghost.visible){
        const err=M.check(S.design,a,b,S.tool),length=Math.hypot(a[0]-b[0],a[1]-b[1])*P.G;
        U.segment(ghost,new T.Vector3(a[0]*P.G,a[1]*P.G,.08),new T.Vector3(b[0]*P.G,b[1]*P.G,.08));previewMat.color.setHex(err?0xc54d38:0x2c9074);
        label.textContent=err||length.toFixed(1)+" m · "+Math.round(length*P.MATERIALS[S.tool].cost)+" credits";
        const pos=project(b[0]*P.G,b[1]*P.G),w=canvas.clientWidth,h=canvas.clientHeight;
        label.style.left=Math.max(8,Math.min(w-label.offsetWidth-8,pos[0]+12))+"px";label.style.top=Math.max(50,Math.min(h-label.offsetHeight-8,pos[1]-38))+"px";
      }
    }
    cancel();return{cancel,update,toGrid,nearest,getLastAction(){const a=action;action=null;return a;},destroy(){Object.entries(events).forEach(([n,f])=>canvas.removeEventListener(n,f));root.removeEventListener("keydown",key);root.removeEventListener("blur",resetPointers);U.dispose(preview);}};
  }
  root.Controls3D={init};
})(typeof self!=="undefined"?self:this);
