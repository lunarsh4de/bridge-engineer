/* Optional per-test inquiry notes. Independent from version-1 journey saves. */
(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('../core/levels.js'):root.BridgeLevels);
  if(typeof module==='object'&&module.exports)module.exports=api;else root.InquiryNotes=api;
})(typeof self!=='undefined'?self:this,function(L){
  'use strict';
  const KEY='riverbend_notebook',CONTEXT_KEY=KEY+'.context',fields=['predict','claim','evidence','reasoning'];
  const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
  const blank=(ts=0)=>({predict:'',claim:'',evidence:'',reasoning:'',ts});
  function validate(raw){
    if(!object(raw))return{ok:false};const data={};let count=0;
    for(const[id,records]of Object.entries(raw)){
      if(!own(L.LEVELS,id)||!object(records))return{ok:false};data[id]={};
      for(const[index,n]of Object.entries(records)){
        if(!/^(0|[1-9]\d*)$/.test(index)||!Number.isSafeInteger(+index)||+index>1e9||!object(n)||++count>10000||!Number.isFinite(n.ts)||n.ts<0||!fields.every(k=>typeof n[k]==='string'&&n[k].length<=(k==='predict'?400:600)))return{ok:false};
        data[id][index]=Object.fromEntries([...fields.map(k=>[k,n[k]]),['ts',n.ts]]);
      }
    }
    return{ok:true,data};
  }
  function indices(notes,id){return Object.keys(notes[id]||{}).map(Number).filter(n=>n>0).sort((a,b)=>a-b);}
  function get(notes,id,index=0){if(!own(L.LEVELS,id))return null;if(!notes[id])notes[id]={};if(!notes[id][index])notes[id][index]=blank();return notes[id][index];}
  function start(notes,id,ts){const n=(indices(notes,id).at(-1)||0)+1,previous=get(notes,id,0),record=get(notes,id,n);record.predict=previous.predict;record.ts=ts;notes[id][0]=blank();return n;}
  function migrate(book,raw){
    const checked=validate(raw||{}),notes=checked.ok?checked.data:{},existing=new Set(Object.keys(notes));
    for(const r of book.runs){
      if(!Number.isInteger(r.noteIndex)||r.noteIndex<1){r.noteIndex=(indices(notes,r.levelId).at(-1)||0)+1;}
      const n=get(notes,r.levelId,r.noteIndex);if(!n.predict)n.predict=String(r.prediction||'').slice(0,400);
    }
    for(const[id,d]of Object.entries(book.drafts||{}))if(own(L.LEVELS,id)&&!existing.has(id)){
      const runs=book.runs.filter(r=>r.levelId===id),latest=runs.at(-1),target=get(notes,id,latest?latest.noteIndex:0);
      for(const f of ['claim','evidence','reasoning'])if(!target[f]&&typeof d[f]==='string')target[f]=d[f].slice(0,600);
      const pending=get(notes,id,0);if(!pending.predict&&typeof d.prediction==='string'&&(!latest||d.prediction!==latest.prediction))pending.predict=d.prediction.slice(0,400);
    }
    return notes;
  }
  function load(store,stamp){try{const context=store.getItem(CONTEXT_KEY);if(context&&context!==stamp)return{};const v=validate(JSON.parse(store.getItem(KEY)||'{}'));return v.ok?v.data:{};}catch(e){return{};}}
  function save(store,notes,stamp){try{store.setItem(KEY,JSON.stringify(notes));store.setItem(CONTEXT_KEY,stamp);return true;}catch(e){return false;}}
  return{KEY,CONTEXT_KEY,fields,blank,validate,indices,get,start,migrate,load,save};
});
