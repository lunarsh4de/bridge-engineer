/* A small, deterministic, pin-jointed 2D truss teaching model. SI units internally. */
(function(root){
'use strict';
const MATERIALS={wood:{name:'Timber',EA:12e6,tension:40000,buckling:180000,cost:1},steel:{name:'Steel',EA:90e6,tension:110000,buckling:1400000,cost:3},deck:{name:'Deck',EA:120e6,tension:180000,buckling:1800000,cost:0}};
function solve(matrix,vector){
 const a=matrix.map((r,i)=>[...r,vector[i]]),n=vector.length;
 const scale=Math.max(...matrix.map((r,i)=>Math.abs(r[i])),1);
 for(let k=0;k<n;k++){
  let p=k;for(let j=k+1;j<n;j++)if(Math.abs(a[j][k])>Math.abs(a[p][k]))p=j;
  if(Math.abs(a[p][k])<scale*1e-10)return null;
  [a[k],a[p]]=[a[p],a[k]];
  for(let j=k+1;j<n;j++){const f=a[j][k]/a[k][k];for(let c=k;c<=n;c++)a[j][c]-=f*a[k][c];}
 }
 const x=Array(n).fill(0);for(let i=n-1;i>=0;i--){let v=a[i][n];for(let j=i+1;j<n;j++)v-=a[i][j]*x[j];x[i]=v/a[i][i];}return x;
}
function analyze(level,beams,position=.5){
 const deck=level.nodes.filter(n=>n.deck),members=[...deck.slice(1).map((n,i)=>({a:deck[i].id,b:n.id,material:'deck',id:'deck-'+i})),...beams];
 const used=new Set(members.flatMap(e=>[e.a,e.b]));const nodes=level.nodes.filter(n=>used.has(n.id));const index=new Map(nodes.map((n,i)=>[n.id,i]));const dim=nodes.length*2;
 const K=Array.from({length:dim},()=>Array(dim).fill(0)),F=Array(dim).fill(0);
 const geometry=[];
 for(const e of members){const i=index.get(e.a),j=index.get(e.b),a=nodes[i],b=nodes[j];if(!a||!b||i===j)return {stable:false,reason:'invalid'};
  const dx=(b.x-a.x)/100,dy=(a.y-b.y)/100,L=Math.hypot(dx,dy),c=dx/L,s=dy/L,q=[-c,-s,c,s],d=[2*i,2*i+1,2*j,2*j+1],m=MATERIALS[e.material];if(!m)return {stable:false,reason:'invalid'};
  for(let r=0;r<4;r++)for(let col=0;col<4;col++)K[d[r]][d[col]]+=m.EA/L*q[r]*q[col];geometry.push({e,L,q,d,m});
 }
 const x=deck[0].x+(deck.at(-1).x-deck[0].x)*Math.max(0,Math.min(1,position));
 let segment=deck.length-2;for(let i=0;i<deck.length-1;i++)if(x<=deck[i+1].x){segment=i;break;}
 const left=deck[segment],right=deck[segment+1],t=(x-left.x)/(right.x-left.x);
 F[index.get(left.id)*2+1]-=level.load*(1-t);F[index.get(right.id)*2+1]-=level.load*t;
 const fixed=new Set([index.get(deck[0].id)*2,index.get(deck[0].id)*2+1,index.get(deck.at(-1).id)*2+1]);
 const free=Array.from({length:dim},(_,i)=>i).filter(i=>!fixed.has(i));const answer=solve(free.map(i=>free.map(j=>K[i][j])),free.map(i=>F[i]));
 if(!answer)return {stable:false,reason:'mechanism',maxRatio:Infinity};
 const u=Array(dim).fill(0);free.forEach((d,i)=>u[d]=answer[i]);
 const forces=geometry.map(({e,L,q,d,m})=>{const force=m.EA/L*q.reduce((v,z,i)=>v+z*u[d[i]],0);const capacity=force>=0?m.tension:Math.min(m.tension,m.buckling/(L*L));return {...e,force,ratio:Math.abs(force)/capacity};});
 const maxRatio=Math.max(0,...forces.map(f=>f.ratio));const deflections=Object.fromEntries(nodes.map((n,i)=>[n.id,{x:u[i*2],y:u[i*2+1]}]));const maxDeflection=Math.max(...nodes.filter(n=>n.deck).map(n=>Math.abs(deflections[n.id].y)));
 return {stable:true,forces,maxRatio,maxDeflection,deflections,passes:maxRatio<=1&&maxDeflection<=.04};
}
function testBridge(level,beams){let peak=null;for(let i=0;i<=24;i++){const r=analyze(level,beams,i/24);if(!r.stable)return {...r,passes:false};if(!peak||r.maxRatio>peak.maxRatio)peak=r;if(!r.passes)return {...r,position:i/24};}return peak;}
const api={MATERIALS,analyze,testBridge};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.BridgePhysics=api;
})(typeof window!=='undefined'?window:globalThis);
