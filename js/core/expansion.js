/* Chapter II: controlled traffic, navigation and independent spans. */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BridgeExpansion=api;
})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const IDS=['convoy','harbor','island','shipping','riverport'];
 function newWorld(L){return{...L.newWorld(),node:'convoy',chapter:'advanced',materials:['road','timber','steel','cable'],challengeOptions:{}};}
 function install(L,Lab){
  if(L.LEVELS.convoy)return;
  const B=L.builders,T={chord:'timber',vert:'timber',web:'timber'},S={chord:'steel',vert:'timber',web:'steel'};
  const move=(ms,x=0,y=0)=>ms.map(m=>({a:[m.a[0]+x,m.a[1]+y],b:[m.b[0]+x,m.b[1]+y],m:m.m}));
  const cases={
   convoy:{title:'Two Trucks, One Bridge',place:'II · 1 / 5 · Convoy',N:16,mass:1600,budget:580,traffic:[{mass:1600,offset:0},{mass:1600,offset:3}],
    brief:'The school and clinic send two trucks together. Both can be on the bridge at once. A design for just one moving load may miss the busiest moment.',goal:'Deliver both 1.6 t trucks with no broken members.',concept:'Loads from both trucks act on the same bridge. Watch the moment when both are near the middle.',cargo:'two supply trucks',
    hints:['Watch the two trucks enter the bridge. Loads add when their axles are on the deck together.','Use short braced steel compression members. An upper truss is another possible route.','Keep the same traffic and anchors when comparing designs. A single-truck test is a different condition.'],
    check:{q:'Why can a bridge pass one truck but fail with two?',options:['Their loads act together on the structure','The second truck changes gravity','Two trucks remove the bridge self-weight'],answer:0,why:'Multiple axle loads can be on the bridge simultaneously. Their position and spacing affect the maximum demand.'}},
   harbor:{title:'Room for a Tall Ship',place:'II · 2 / 5 · Harbor',N:20,mass:1800,budget:640,heights:[0,2,4],defaultDeckY:2,waterY:-3,navigation:[{x1:4,x2:6,requiredClearance:3.6}],
    brief:'The harbor needs a road and a route for a tall boat. Choose the road height and keep the marked channel clear. A strong bridge can still block the boat.',goal:'Deliver the truck and let the boat pass beneath the bridge. Choose a deck height.',concept:'Clearance is measured from the water to the lowest obstruction over the channel, including supports and road sag.',cargo:'a harbor truck',
    hints:['The blue box is the boat envelope. Low road height leaves too little room, even with strong supports.','Choose +1 m or +2 m before building. The road is rebuilt at that height; the banks rise with it.','Keep compression trusses beside and above the road, or use stays. An under-deck diagonal can block the boat.'],
    check:{q:'The truck passed, but a diagonal blocked the boat. What must change?',options:['Keep the whole navigation envelope clear, not just the road','Use stronger steel in the same place','Make the truck lighter only'],answer:0,why:'Traffic capacity and navigation clearance are separate constraints. A strong member can still occupy the space a boat needs.'}},
   island:{title:'Two Spans, One Island',place:'II · 3 / 5 · Island links',N:28,mass:2600,budget:800,island:[12,16],
    brief:'A small island divides the crossing into two 6 m water gaps. The road over the island is fixed, but both water spans need their own route to a support.',goal:'Support both spans and get the 2.6 t truck all the way across.',concept:'An intermediate island creates two shorter spans. Passing the first span does not prove the second can carry the truck.',cargo:'an island delivery truck',
    hints:['Diamonds on both edges of the island are fixed supports. Build each water span.','A good left span cannot rescue a road with no supporting structure on the right.','Try similar trusses on both sides, then compare how a one-member change affects the complete crossing.'],
    check:{q:'Why test the complete crossing after strengthening the first span?',options:['The second span must also carry the load','The island automatically supports every road joint','The first span carries the second span’s truck forever'],answer:0,why:'Each independent span needs stable load paths. Completion requires both spans to meet the same game criteria.'}},
   shipping:{title:'Shipping and Supply Convoy',place:'II · 4 / 5 · Shared river',N:24,mass:2100,budget:760,traffic:[{mass:2100,offset:0},{mass:1500,offset:3.4}],heights:[0,2,4],defaultDeckY:2,waterY:-3,navigation:[{x1:5,x2:7,requiredClearance:3.6}],
    brief:'A loaded truck and a lighter service truck must cross while a boat uses the central channel. The road must stay stiff enough to preserve clearance.',goal:'Deliver both trucks and the boat within budget.',concept:'The trucks can lower the road while the boat passes. Check loaded clearance as well as the unloaded geometry.',cargo:'a loaded truck and service truck',
    hints:['The traffic is 2.1 t plus 1.5 t, separated by 3.4 m. Both loads are included in every test.','A higher deck helps clearance, but supports must also stay out of the blue envelope.','Use the Notebook to compare matching height, traffic, water and channel conditions.'],
    check:{q:'Why check clearance during the moving-load test?',options:['Truck loads can lower the road into the boat envelope','Water always vanishes during a test','Cables always get shorter when unloaded'],answer:0,why:'The lowest loaded clearance can differ from the initial drawing. The game checks member positions while the boat crosses.'}},
   riverport:{title:'The Riverport Commission',place:'II · 5 / 5 · Final commission',N:36,mass:2400,budget:1150,island:[16,20],traffic:[{mass:2400,offset:0},{mass:1800,offset:3.6}],heights:[0,2,4],defaultDeckY:2,waterY:-3,navigation:[{x1:3,x2:5,requiredClearance:3.6},{x1:13,x2:15,requiredClearance:3.6}],
    brief:'Two road spans link the banks through an island. Two trucks travel together, and boats need both channels. Bring your earlier evidence to one final design.',goal:'Complete two 8 m water spans, two truck deliveries and two clear navigation lanes.',concept:'A feasible design must satisfy every constraint together: both spans, the full convoy, both navigation envelopes and the budget.',cargo:'two riverport trucks',
    hints:['Work from the four fixed banks: left shore, both island edges and right shore.','Choose a height that preserves boat clearance. Use stays or upper trusses on each span.','The green tick appears only when every vehicle and every navigation lane succeeds. Check the evidence for the first unmet condition.'],
    check:{q:'Which evidence supports a successful riverport design?',options:['Both trucks and both boats finish, with no breaks, limited drop and acceptable cost','Only the first truck reaches the island','The drawing looks symmetrical'],answer:0,why:'Appearance alone is insufficient. All specified traffic, navigation, structure and budget conditions must be met in the same complete test.'}}
  };
  IDS.forEach((id,i)=>{
   const c=cases[id];Object.assign(c,{id,chapter:'advanced',deckStep:4,span:c.N*.5,sagLimit:.12,materials:['road','timber','steel','cable'],badges:[{kind:'stiff',cm:4},{kind:'cool',max:.75}]});
   const config=(w)=>{
    const raw=w.challengeOptions&&w.challengeOptions[id],d=c.heights&&c.heights.includes(raw&&raw.deckY)?raw.deckY:c.defaultDeckY||0;
    const xs=c.island?[0,...c.island,c.N]:[0,c.N],spans=c.island?[[0,c.island[0]],[c.island[1],c.N]]:[[0,c.N]];
    const anchors=xs.flatMap(x=>c.navigation?[[x,d],[x,d-4],[x,d+8]]:[[x,d],[x,d-4]]);
    const road=move(B.deck(c.N,4),0,d);
    const stays=spans.flatMap(([a,b])=>move(B.stays(b-a,4,8),a,d));
    const truss=spans.flatMap(([a,b])=>move(B.over(b-a,4,4,S),a,d));
    const under=spans.flatMap(([a,b])=>move(B.withDiag(B.under(b-a,4,4,T),'steel'),a,d));
    const refs=c.navigation?[{name:'Direct stays over each channel',members:[...road,...stays]},{name:'Upper steel trusses',members:[...road,...truss]}]:[{name:'Braced spans',members:[...road,...under]},{name:'Upper steel trusses',members:[...road,...truss]}];
    const reserve=w.reserve||0;
    return{...c,resolve:undefined,deckY:d,anchors,refs,yMin:-6,yMax:d+9,totalBudget:c.budget+reserve,reserve,traffic:c.traffic||[{mass:c.mass,offset:0}],navigation:c.navigation?c.navigation.map(n=>({...n})):undefined};
   };
   Object.assign(c,config({reserve:0,challengeOptions:{}}));c.resolve=config;L.LEVELS[id]=c;
   L.NODES[id]={type:'level',level:id,next:IDS[i+1]||'advanced-report'};
   if(Lab)Lab.missions[id]={question:c.goal,try:c.hints[0],why:c.concept,transfer:c.hints[2],example:'Real bridges face additional demands. This game checks axial members, prescribed axle loads and a two-dimensional swept boat envelope.'};
  });
  L.NODES['advanced-report']={type:'report'};
 }
 return{IDS,newWorld,install};
});
