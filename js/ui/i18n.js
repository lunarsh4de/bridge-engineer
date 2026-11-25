/* Offline bilingual presentation. Original text is retained per node; user notes are excluded. */
(function(root){'use strict';
 const dict=new Map(),templates=[],seen=new Map();let language='en',observer,queued=false;
 const norm=s=>String(s).replace(/\s+/g,' ').trim();
 function add(en,zh){if(en&&zh)dict.set(norm(en),zh);}
 function pairs(text){for(const line of text.trim().split('\n')){const i=line.indexOf('|');if(i>0)add(line.slice(0,i),line.slice(i+1));}}
 pairs(`
Riverbend|河湾
Bridge Engineer|桥梁工程师
A bridge-building story|一段架桥的旅程
Chapter I · A bridge-building story|第一章 · 河谷架桥之旅
Chapter II · Design for a working river|第二章 · 河港工程挑战
I · Valley journey|I · 河谷旅程
II · River challenges|II · 进阶挑战
Valley journey|河谷旅程
Choose chapter|选择章节
The flood took the valley’s bridges. Build new ones, choose who to help first, and live with what your choices change.|洪水冲毁了河谷的桥。重建道路，决定先帮助谁，让每次选择影响后续旅程。
Two trucks. Tall boats. Two spans. Meet every constraint in five new engineering commissions.|双车、高船、双跨。用五项新工程，挑战同时满足多种条件。
New expedition|开启进阶旅程
New journey|开启旅程
Start over|重新开始
Continue|继续
Continue to Chapter II|继续第二章
View chapter report|查看本章报告
Chapter I complete. Chapter II brings new river challenges.|第一章已完成，接下来进入第二章河港工程挑战。
This is the final crossing of Chapter I. Chapter II follows.|这是第一章的最后一座桥，完成后将继续第二章。
Complete Chapter I to continue straight into Chapter II, where two trucks, boat clearance and multiple spans add new constraints.|完成第一章后将直接进入第二章，继续挑战双车荷载、船舶净空与多跨结构。
About|关于
How to play|玩法
Controls practice|操作练习
Engineering notebook|工程笔记
Journey map|旅程地图
Progress and the optional Notebook save locally in this browser.|进度与工程笔记自动保存在当前浏览器。
Storage is unavailable or full. Work is kept for this session; export your notebook before closing.|存储不可用或已满。关闭页面前，请导出笔记。
Menu|菜单
Main menu|主菜单
Map|地图
Notebook|笔记
Task|任务
Help|帮助
Hint|提示
Close|关闭
Next|下一步
Begin|开始
Skip|跳过
Decision|决定
Prologue|序章
Field report|工程报告
Materials|材料
Road|道路
Timber|木材
Steel|钢材
Cable|拉索
Erase|擦除
Undo|撤销
Redo|重做
Clear|清空
Forces|受力
Test crossing|测试过桥
Pause test|暂停测试
Resume test|继续测试
Back to results|返回结果
Edit design|修改设计
Inspect forces|查看受力
Deliver & continue|交付并继续
Continue the journey|继续旅程
Delivered!|送达！
Not yet|还需改进
Delivered safely.|成功送达。
No breaks|无断杆
In budget|预算内
Load|载荷
Gap|跨度
Credits|预算
credits|预算点
members|构件
pull|拉
push|压
tension|拉伸
compression|压缩
pulled (tension)|受拉（拉伸）
pushed (compression)|受压（压缩）
Broke|已断裂
BROKE|已断裂
Unavailable|不可用
unavailable|不可用
Settling|自重稳定中
Crossing|过桥
Paused|已暂停
Finished|已结束
First failure|首次断裂
Road ready · locked|道路已铺好 · 已锁定
Road ready and locked|道路已铺好并锁定
Road is prelaid, locked and included in your budget|道路已预铺并锁定，计入预算
Road is prelaid, locked and included in the budget.|道路已预铺并锁定，计入预算。
Road is already laid and locked. Build its supports.|道路已铺好并锁定，请搭建支撑。
Road is locked; erase or change a support instead.|道路已锁定，请擦除或修改支撑。
Supports cleared. The road stays. Undo brings the supports back.|支撑已清空。撤销可恢复支撑。
NEW|新
Build & investigate|搭建并探索
Plan in Notebook|在笔记中规划
Story, goal & rules|故事、目标与规则
Materials and limits|材料与限制
Test your idea. Retries are free.|测试你的想法，可以反复尝试。
Your challenge · Engage & explore|你的挑战 · 尝试与探索
Goal:|目标：
Load:|载荷：
Span:|跨度：
Budget:|预算：
Pass:|通过条件：
Skill:|思维练习：
continuous road · no broken members · maximum drop under|道路连续 · 无断杆 · 最大下挠小于
cost within budget|费用不超预算
every truck delivered|所有车辆送达
every boat lane clear|所有船道畅通
Real bridge|真实桥梁
Photo source|照片来源
How the model differs|与游戏模型的差异
Bridge information|桥梁资料
Deck height|桥面抬高
Apply height & clear supports|应用高度并清空支撑
Changing height rebuilds the road and clears supports. Past tests stay in the Notebook.|变更高度会重铺道路、清空支撑。历史测试保留在笔记中。
Height applied. Road rebuilt; supports cleared. Previous tests stay in the Notebook.|高度已应用，道路已重铺、支撑已清空。历史测试保留在笔记中。
Show obstruction|查看阻挡构件
Highlighted member occupies the boat envelope.|高亮构件占用了船舶通行空间。
Traffic, fixed supports and navigation envelopes for this crossing|本关的车辆、固定支座与船舶通行包络
One crossing. Many designs.|同一条河，多种设计。
Beyond this crossing|联系现实工程
What happened? · guide & rewards|发生了什么？提示与奖励
What might explain the result?|什么可能解释这个结果？
Hear the guide · investigate|听听向导 · 继续研究
Try observing:|试着观察：
Use your test evidence to investigate. The first break locates a failure; it does not establish the whole cause.|用测试证据研究。首次断裂指出了位置，尚不能说明全部原因。
Your design is not the only solution. The reference bridge shows one tested approach — not the best, not the only one.|设计不只有一种。参考桥展示一种经过测试的方法，不代表唯一或最优解。
Watch the middle drop.|观察中部的下挠。
Compare long and short members.|比较长杆与短杆。
Cable pulls. It cannot push.|拉索只能拉，不能压。
Change one member. Test again.|改变一根构件，再次测试。
Compare designs under the same load.|在相同载荷下比较设计。
Follow the fixed supports.|沿固定支座追踪传力。
Satisfy every constraint together.|同时满足全部条件。
Create — satisfy combined constraints|创造 — 满足组合约束
Move the toolbox cart|运送工具车
Reconnect the school|重新连接学校
Deliver the medicine|送达药品
Bring grain to the valley|为河谷送粮
Reach Riverbend|抵达河湾
Deliver before the frost|在霜冻前送达
Turn the view|转动视角
Tap two dots|点选两个节点
Undo, then redo|撤销，再重做
Connect the other side|连接另一侧
Test, pause, look|测试、暂停、观察
Your next move|下一步操作
Test your design|测试你的设计
Join the gold dots|连接金色节点
Turn|转动
Connect|连接
Undo / redo|撤销 / 重做
Test / pause|测试 / 暂停
Try the controls. No score, no risk.|先练习操作，这里不计分。
Road ready · both sides build together|道路已铺好 · 桥梁两侧同步搭建
Try it in 3D|在3D中试一试
Practice in 3D|开始3D练习
Skip to first crossing|跳到第一关
Skip practice & return|跳过练习并返回
Skip practice|跳过练习
Next: connect|下一步：连接
Start first crossing|进入第一关
Return to journey|返回旅程
Controls practice complete|操作练习完成
Try the practice again|再试一次操作练习
Edit practice bridge|修改练习桥
Connect · undo · test|连接 · 撤销 · 测试
Hide tips|隐藏提示
Orbit view|旋转视角
Front view|正面视角
Reset view|重置视角
Orbit view: drag with one finger|旋转视角：单指拖动
2 fingers · turn|双指 · 旋转
Right-drag · turn|右键拖动 · 旋转
3D bridge workshop|3D桥梁工坊
Bridge workshop|桥梁工坊
3D bridge building area. Drag between dots to build. Right-drag or use Orbit view to rotate. Scroll to zoom.|3D桥梁搭建区。连接节点来搭建。右键拖动或启用旋转视角来转动，滚轮缩放。
Arrow keys move the grid cursor. Enter selects each end. Escape cancels. Space tests the bridge. P pauses a test. F toggles force colors.|方向键移动网格光标；回车选择端点；Esc取消；空格测试；P暂停；F切换受力颜色。
Two fingers turn the 3D scene. Use Front view to build.|双指转动3D场景。搭建时可切换到正面视角。
Tap the two highlighted endpoints to add one member.|点选两个高亮端点，添加一根构件。
Connect the other highlighted pair; both bridge sides update together.|连接另一组高亮节点，桥梁两侧会同步更新。
Undo removes your last member. Redo puts it back.|撤销移除最近的构件，重做将其恢复。
Run the cart, pause, and read the load colors.|让车辆过桥，暂停并观察受力颜色。
Cable carries pull; a pushed cable goes slack.|拉索承受拉力，受压时会松弛。
Compare a long compressed member with short braced members.|比较长压杆与有支撑的短杆。
Change one member, then compare the tests.|改变一根构件，然后比较测试。
Use the available fixed supports; compare their load paths.|使用可用的固定支座，比较传力路径。
Observe the bridge, revise one feature, and test again.|观察桥梁，修改一项设计，再次测试。
Test evidence|测试证据
Investigate:|继续研究：
Compare in Notebook|在笔记中比较
What happened and why?|发生了什么，为什么？
Numbers and observations from this test.|本次测试的数字与观察。
Why does the evidence support your claim?|证据为何能支持你的观点？
What consequence do you expect from your change?|你预计这项改动会带来什么变化？
Predict|预测
Claim|观点
Evidence|证据
Reasoning|推理
Plan your next test|规划下一次测试
Notes for|笔记对应的测试
Next test · prediction draft|下次测试 · 预测草稿
Prediction saved before this test; plan the next test to write a new one.|此预测已在测试前保存；规划下次测试时可写新预测。
Autosaves · optional notes.|自动保存 · 笔记为可选项。
Saving…|正在保存…
Saved locally.|已保存到本地。
Kept for this session. Export the notebook before closing.|仅为本次会话保存，关闭前请导出笔记。
← Previous test|← 上次测试
Next test →|下次测试 →
Plan next test|规划下次测试
Test my design|测试我的设计
Evidence from previous tests|以往测试的证据
Evidence for this investigation|本次研究的证据
A — earlier test|A — 较早的测试
B — test to investigate|B — 要研究的测试
Choose a test|选择测试
Choose two recorded tests.|选择两次已记录的测试。
Choose two different tests.|请选择两次不同的测试。
Different span, traffic, height, navigation, supports, materials, budget or model. These tests are not a controlled comparison.|跨度、车辆、高度、航道、支座、材料、预算或模型不同，不能作为控制变量比较。
Invalid solver data cannot be compared.|无法比较无效的模拟数据。
No tests recorded here yet. Build your own bridge and test it; the Notebook keeps the evidence automatically.|尚无测试记录。搭桥并测试，笔记会自动保存证据。
PASS|通过
NOT YET|待改进
pass|通过
not yet|待改进
Example assisted|使用过参考方案
Imported observations — not independently verified|导入的观察记录 · 未独立验证
Your prediction before this test:|本次测试前的预测：
Restore tested design|恢复该测试的设计
Inspect a member|检查构件
Member|构件
Try a material change|尝试更换材料
Change this member|更换此构件
Trace support connection|追踪支承连接
This makes one undoable material change to the matching design. Check length, self-weight and budget, then retest.|对相同设计更换一根构件的材料，可撤销。检查长度、自重和预算后，再测试。
Explain the engineering|解释工程原理
Transfer:|迁移应用：
Try a test first. Structural explanations and the material laboratory follow your observations.|先做一次测试，再根据观察探索结构解释与材料实验室。
Material and length laboratory|材料与长度实验室
Material|材料
Pull limit|抗拉上限
Push limit at 1 m|1米时抗压上限
Cost|费用
Mass|质量
Cannot push|不能受压
Export notebook|导出笔记
Import notebook|导入笔记
Notebook and progress exported together.|笔记与进度已一起导出。
That file is too large.|文件过大。
Progress loaded.|进度已载入。
Tested design restored. Undo returns to your previous design.|已恢复测试过的设计，撤销可返回原设计。
Choose a different material to make a comparison.|请选择另一种材料进行比较。
No connected support route found.|未发现连接到支座的路径。
Outlined: one connected route to a fixed support. This is not a force diagram.|描边显示一条通向固定支座的连接路径，并非受力图。
Settings|设置
Get a hint|获取提示
Full controls & force colors|完整操作与受力颜色
Save progress|保存进度
Progress saves automatically in this browser. To move it to another computer, copy the text below and paste it there.|进度自动保存在浏览器。可复制下面的文本，到另一台设备粘贴导入。
Exported progress|导出的进度
Copy|复制
Download file|下载文件
Load progress|载入进度
Paste progress here|在此粘贴进度
Paste exported progress here|在此粘贴导出的进度
Load pasted progress|载入粘贴的进度
Tips|提示
Show getting-started tips again|再次显示入门提示
Copied.|已复制。
Selected. Press Ctrl+C to copy.|已选中，请按Ctrl+C复制。
Tips will show on the first crossing.|第一关会显示提示。
About this game|关于游戏
Road is ready|道路已铺好
Add supports|添加支撑
Test and read the evidence|测试并阅读证据
Improve|改进
Keyboard and mistakes|键盘与纠错
Remove supports; keep the road|移除支撑，保留道路
Clear design|清空设计
Pick two different points.|请选择两个不同的节点。
That point is outside the building area.|该点超出搭建范围。
Start from an existing joint (a dot).|请从已有节点开始。
Road must stay level with the riverbanks.|道路需与河岸同高。
There is already a member there.|此处已有构件。
The road has a gap. The vehicle will fall through it.|道路有缺口，车辆会掉下去。
The road was not continuous, so the vehicle fell.|道路不连续，车辆掉落。
The test timed out.|测试超时。
Quick check:|小测验：
Yes.|答对了。
Not quite.|再想一想。
Your crossings|你的桥梁
Stars|星级
Max drop|最大下挠
Busiest member|最忙构件
Badges|徽章
Check|小测验
Your engineering evidence|你的工程证据
Open engineering notebook|打开工程笔记
What your choices changed|你的选择改变了什么
Final question|最后的问题
Your answer|你的回答
Print / save as PDF|打印 / 存为PDF
Try another path|尝试另一条路线
Riverbend is connected|河湾已连通
The river is connected|河流两岸已连通
Chapter II · Field report|第二章 · 工程报告
Five commissions: traffic, navigation and connected spans.|五项工程：交通、通航与多跨连接。
Compare tests only when traffic, height, water, navigation lanes and supports match. Explain a change using measurements from a complete test.|仅在车辆、高度、水位、航道与支座相同时比较测试。用完整测试的测量结果解释一项改动。
Minimalist|精简设计
Cool Head|从容承载
Steady Road|平稳桥面
Penny Pincher|精打细算
No timber|不用木材
No cable|不用拉索
No steel|不用钢材
max drop (limit|最大下挠（上限
busiest member|最忙构件
credits (budget|费用（预算
Game values: real bridge design needs many more checks. Lower utilization does not by itself mean a member can be removed.|以下为游戏数值。真实桥梁需要更多检验，利用率低并不自动意味着可以拆除。
Member length = 0.5 × √(horizontal grid steps² + vertical grid steps²) metres. Total price is rounded after summing member length × price per metre.|构件长度＝0.5×√(水平格数²＋竖直格数²)米。先累加各杆件长度×单价，再对总费用取整。
Compression limit = the smaller of material strength and the game buckling constant ÷ length². Shortening a compressed member can raise its limit, up to the material cap. A new unbraced joint can still leave an unstable structure.|抗压上限取材料强度与“游戏屈曲常数÷长度²”中较小值。缩短压杆可提高上限，但不超过材料上限。增加无支撑节点仍可能使结构不稳定。
A connected path does not calculate how load divides. Low utilization alone does not prove a member is unnecessary. This remains a 2D axial-member simulation with a prescribed moving load.|连通路径不能计算荷载如何分配，低利用率也不能证明构件无用。模型仍是具有规定移动荷载的二维轴向杆件模拟。
There is a connected route from this member to a fixed support. Connectivity alone does not prove stability or strength.|该构件有通往固定支座的路径。连通并不能证明稳定性或强度。
No connected route from this member to a fixed support was found.|未发现该构件通往固定支座的路径。
A crossing of lines only joins when both share an endpoint.|两条线仅在共用端点时连接。
A completed test with members makes the member inspector available.|完成一次包含构件的测试后，可使用构件检查器。
Controls practice does not create formal test records or notes. Return to the journey to keep an engineering investigation.|操作练习不产生正式记录或笔记。返回旅程后可保存工程研究。
If I change [X], the bridge will...|如果改变[X]，桥梁会……
My design failed/worked because...|设计失败/成功是因为……
The member at [position] broke first. Max drop was [X] cm.|[位置]的构件首先断裂，最大下挠为[X]厘米。
This happened because the force path went through...|出现这个结果，是因为传力路径经过……
`);
 // Templates use braces for variable fragments; values are translated recursively.
 function pattern(en,zh){
  const keys=[],numeric=new Set(['n','total','stars','credits','budget','cost','drop','limit','x','lane','member','length','force','time','mass','span','anchors','before','after','required','clearance','tests','badges']);
  const parts=en.split(/(\{\w+\})/g).map(p=>{
   if(!/^\{\w+\}$/.test(p))return p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
   const k=p.slice(1,-1);keys.push(k);return numeric.has(k)?'([-+]?\\d[\\d,]*(?:\\.\\d+)?|—)':'(.+?)';
  });
  let partial=null;
  if(en.length>35&&/[.!?]$/.test(en)&&(parts[0]!==''||numeric.has(keys[0])||['mat','material'].includes(keys[0]))){
   const source=parts.join('');partial=new RegExp(parts[0]===''&&['mat','material'].includes(keys[0])?source.replace('(.+?)','((?:Road|Timber|Steel|Cable|road|timber|steel|cable))'):source,'g');
  }
  templates.push({re:new RegExp('^'+parts.join('')+'$'),keys,zh,part:partial});
 }

 function text(source,depth=0){const n=norm(source);if(!n||language==='en'||!/[A-Za-z]/.test(n)||/^[-+\d\s.,%/×→↑★☆✓·:()mkgcns²]+$/i.test(n))return source;let result=dict.get(n);if(result===undefined&&depth<3){for(const t of templates){const m=n.match(t.re);if(m){result=t.zh.replace(/\{(\w+)\}/g,(_,k)=>text(m[t.keys.indexOf(k)+1],depth+1));break;}}}
  if(result===undefined){
   let v=n;
   if(depth<3){for(const t of templates)if(t.part)v=v.replace(t.part,(...args)=>t.zh.replace(/\{(\w+)\}/g,(_,k)=>text(args[t.keys.indexOf(k)+1],depth+1)));if(v!==n)v=text(v,depth+1);}
   // Translate complete long passages before splitting sentences, so a suffix
   // such as a shortcut cannot break a multi-sentence catalogue entry.
   for(const [en,zh] of phraseList)if(en.source.length>=28)v=v.replace(en,()=>zh);
   const chunks=v.split(/(?<=[.!?]) (?=[A-Z])/);
   if(depth<3&&chunks.length>1)v=chunks.map(c=>text(c,depth+1)).join(' ');
   for(const [en,zh] of phraseList)v=v.replace(en,()=>zh);
   result=v;
   if(/[A-Za-z]{3}/.test(result)&&!/^[-+\d\s.,%/×→↑★☆✓·:()mkgcns²]+$/i.test(result))seen.set(n,result);
  }
  result=result.replace(/(\d+) brought forward\b/g,'前关携入$1点').replace(/(\d+) brought\b/g,'携入$1点');
  return source.match(/^\s*/)[0]+result+source.match(/\s*$/)[0];
 }
 let phraseList=[];
 function prepare(){phraseList=[...dict].sort((a,b)=>b[0].length-a[0].length).map(([a,b])=>[new RegExp('(?<![A-Za-z])'+a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?![A-Za-z])','g'),b]);}
 const original=new WeakMap(),attrs=new WeakMap();
 function update(){queued=false;if(!document.body)return;const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
  while(node=walker.nextNode()){const parent=node.parentElement;if(!parent||parent.closest('script,style,textarea,[data-no-i18n]'))continue;let r=original.get(node);if(!r||node.nodeValue!==r.last)r={source:node.nodeValue,last:node.nodeValue};const v=text(r.source);if(node.nodeValue!==v)node.nodeValue=v;r.last=v;original.set(node,r);}
  for(const el of document.querySelectorAll('[title],[aria-label],[placeholder],[alt]')){if(el.closest('[data-no-i18n]'))continue;let map=attrs.get(el)||{};for(const k of ['title','aria-label','placeholder','alt']){if(!el.hasAttribute(k))continue;let r=map[k],v=el.getAttribute(k);if(!r||v!==r.last)r={source:v,last:v};v=text(r.source);if(el.getAttribute(k)!==v)el.setAttribute(k,v);r.last=v;map[k]=r;}attrs.set(el,map);}
 }
 function schedule(){if(!queued){queued=true;queueMicrotask(update);}}
 function setLanguage(lang){language=lang==='zh'?'zh':'en';try{localStorage.setItem('riverbend.language',language);}catch(e){}document.documentElement.lang=language==='zh'?'zh-CN':'en';document.title=language==='zh'?'河湾：桥梁工程师':'Riverbend: Bridge Engineer';update();}
 function registerLevel(id,zh){const l=root.BridgeLevels.LEVELS[id];if(!l)return;for(const k of ['title','place','brief','goal','concept','cargo'])add(l[k],zh[k]);(zh.hints||[]).forEach((v,i)=>add(l.hints[i],v));if(zh.check){add(l.check.q,zh.check[0]);zh.check[1].forEach((v,i)=>add(l.check.options[i],v));add(l.check.why,zh.check[2]);}}
 function start(){registerContent();prepare();let selected;try{selected=localStorage.getItem('riverbend.language');}catch(e){}language=selected||(/^zh/i.test(navigator.language)?'zh':'en');setLanguage(language);observer=new MutationObserver(schedule);observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','placeholder','alt']});const nativeConfirm=root.confirm.bind(root);root.confirm=s=>nativeConfirm(text(s));}
 root.BridgeI18n={start,setLanguage,toggle:()=>setLanguage(language==='en'?'zh':'en'),text,add,pattern,registerLevel,get language(){return language;},untranslated:()=>Object.fromEntries(seen)};
 function registerContent(){
   Object.values(root.BridgeAtlas.cases).forEach(c=>{for(const k of ['name','location','idea','difference'])add(c[k],c['zh'+k[0].toUpperCase()+k.slice(1)]);});
   registerLevels();registerMore();
 }
 function registerLevels(){
registerLevel("tabletop",{"title": "桌面模型", "place": "工坊", "cargo": "工具手推车", "brief": "向导玛拉在工坊摆上峡谷模型：“先证明只有道路还不够，我们再去真正架桥。”", "goal": "让小车跨过4米缺口。", "concept": "仅由两端支承的道路会在中部下挠。三角形支撑把荷载转化为拉力和压力。", "hints": ["先只测试道路，记录哪里下挠最大、下挠了多少。", "从低处锚点向桥面中部加一根木杆，再测试并观察这根杆的受力颜色。", "两根斜杆形成两个三角形。比较一根与两根支撑时的受力峰值。"], "check": ["斜木杆向上支撑桥面时，承受哪种力？", ["压力（被挤压）", "拉力（被拉长）", "没有受力"], "它们被挤在河岸和桥面之间，因而受压。较长的压杆可能发生屈曲。"]});
registerLevel("willow",{"title": "柳溪", "place": "上学小路", "cargo": "学校的图书车", "brief": "洪水冲毁了柳溪学校的步行桥。孩子们每天绕行一小时，仓库里只剩木材。", "goal": "只用木材跨越6米，并控制预算。", "concept": "长压杆容易屈曲，分担同一荷载的短杆则更能抵抗屈曲。桥下和桥上桁架都用三角形跨越缺口，但构件的受拉、受压分工不同，费用也因此不同。", "hints": ["先试两根长斜撑。观察失效时的颜色，判断它们为何失效。", "把同一条传力路径拆成短杆。记录需要多加多少构件、增加多少费用。", "在相同条件下比较桥下和桥上两种布置。哪种更省预算？"], "check": ["为什么把一根长斜撑拆成短杆后更有效？", ["短压杆更能抵抗屈曲", "短杆更重", "短杆不受力"], "构件越长，屈曲承载力下降越快。游戏中按长度平方的反比简化计算。"]});
registerLevel("clinic",{"title": "蕨谷", "place": "诊所道路", "cargo": "药品运输车", "brief": "蕨谷诊所的胰岛素即将用完。峡谷岩壁陡峭，桥下无处支撑，但两岸高处都有固定锚环。", "goal": "跨越8米。没有低处支座，只有高处锚点。", "concept": "拉索只能受拉，受压就会松弛。因此可以从高处用索悬吊桥面，也可以在桥面上方建木桁架。两条路线在构件数量、自重和费用上各有取舍。", "hints": ["没有低处锚点。先决定：从崖顶锚环悬吊桥面，还是在桥面上方搭建桁架。", "测试第一版设计，检查哪些构件松弛或过载，再据此决定下一步修改。", "如果用了拉索，试把其中一根换成木材并比较下挠与费用；如果用了桁架，试把受拉构件换成拉索。"], "check": ["测试中拉索变成淡色虚线，说明什么？", ["拉索受压后松弛，不能反向推回", "即将因拉力断裂", "变成了钢材"], "拉索只能承受拉力。需要抵抗压力的位置，应考虑木材或钢材。"]});
registerLevel("mill",{"title": "石滩", "place": "磨坊渡口", "cargo": "满载谷物的货车", "brief": "磨坊供应整个河谷的粮食，但货车重达3.2吨。能承载图书车的木桁架未必够用，磨坊主借给你钢材。", "goal": "让3.2吨货车跨越6米。钢材单价是木材的三倍，预算很紧。", "concept": "每根构件的受力需求不同。钢材单价是木材的三倍，全桥用钢既浪费也会超预算。挑战在于读出哪些构件过载，只升级这些位置。", "hints": ["先建全木桁架并测试。观察各类构件的受力峰值颜色：哪类最先失效，受拉还是受压？", "只替换失效构件，再测试。若别处出现新的失效，就重复这一过程。", "比较选择性升级与全钢方案的费用。哪种能在预算内通过？"], "check": ["只把斜杆换为钢材就通过，体现了什么思路？", ["按构件受力分配材料", "所有位置用钢总是最好", "桥越重越安全"], "在需要的地方投入强度。低受力处额外用钢会增加自重与费用，却未必带来有效改善。"]});
registerLevel("echo",{"title": "回声峡谷", "place": "河谷主路", "cargo": "前往河湾的补给车", "brief": "所有前往河湾的道路都经过回声峡谷。你在上一座桥学会的材料和方法，将影响这里的选择。", "goal": "在预算内跨越10米，这里的下挠上限比之前更严格。", "concept": "10米跨度对结构要求更高。钢材和拉索都能形成可行方案，但传力机制不同：选择性使用钢斜杆增强受压能力，斜拉索则改变传力路径。预算不够把两种完整方案同时堆上去。", "hints": ["把之前最好的设计用于这里，测试能否满足更严格的下挠上限。当前主要受强度还是刚度限制？", "有钢材：先只把斜杆换成钢材并读取下挠。有拉索：测试斜拉索方案，核对费用条。", "一次只改变材料、构件数量或桁架深度中的一项。每次测试记录下挠与费用，再做下一次修改。"], "check": ["朋友的桥型与你不同，两座桥都通过，说明什么？", ["都可能有效，应比较下挠、受力与费用", "只有较便宜的才是真桥", "其中一人一定发现了漏洞"], "工程问题通常有多种可行解，要用证据和权衡进行比较。"]});
registerLevel("finale",{"title": "河湾大桥", "place": "河湾", "cargo": "树苗运输队", "brief": "河湾中央的桥已毁，树苗必须在霜冻前运到远岸。这座12米的桥，是整个河谷等待的连接。", "goal": "让3吨运输载荷跨越12米。下挠限制严格，请利用小镇提供的支承条件。", "concept": "同一个12米缺口，会因之前的选择出现三种不同锚点布置。每种布置适合的结构不同，必须同时满足跨度、锚点与预算条件，没有一套方案适用于所有变体。", "hints": ["放置构件前，先研究现有锚点，想清楚桥面荷载如何传到固定支座。", "先搭出能连接道路的最少结构并测试，读取下挠与费用。这些证据能帮助你决定先解决哪个限制。", "每次只加一根杆、换一种材料或调整一次深度，然后复测。保留各次证据，比较哪项改动最有效。"], "check": ["哪项改动最直接地降低跨内构件的受力需求？", ["增加支座以缩短跨度", "给桥涂漆", "把道路画得比缺口更长"], "跨度增加会显著提高结构需求。桥墩或斜拉索可以缩短每部分实际承担的跨越长度。"]});
registerLevel("convoy",{"title": "双车同渡", "place": "II · 1 / 5 · 车队", "cargo": "两辆补给车", "brief": "学校与诊所同时派车。两辆车可能同时停留在桥上，只考虑单车的设计可能错过荷载最大的时刻。", "goal": "让两辆各1.6吨的车送达，且没有构件断裂。", "concept": "两辆车的荷载共同作用于桥梁，观察它们同时接近中部的时刻。", "hints": ["两车车轴同时位于桥面时，荷载会叠加。", "使用有支撑的短钢压杆；上部桁架也是另一种可行路径。", "比较设计时保持车辆、间距和锚点相同，单车测试属于不同条件。"], "check": ["桥为何可能通过单车，却无法承受双车？", ["两车荷载会同时作用于结构", "第二辆车改变了重力", "两车会消除桥梁自重"], "多个车轴可能同时位于桥面上。车辆位置与间距会影响最大受力需求。"]});
registerLevel("harbor",{"title": "给高船留出空间", "place": "II · 2 / 5 · 港口", "cargo": "港口货车", "brief": "港口需要道路，也需要高船通道。选择桥面高度，避开标出的船道。桥足够结实，也可能挡住船。", "goal": "让货车送达、船从桥下通过。先选择桥面高度。", "concept": "净空从水面量到航道上方最低障碍物，既要考虑支撑构件，也要考虑桥面下挠。", "hints": ["蓝色框是船舶包络，桥面过低时，再强的支撑也不能创造净空。", "搭建前可选抬高1米或2米，道路与岸上引道会随之抬升。", "把桁架布置在桥面两侧上方，或使用斜拉索。桥下斜杆可能挡住船。"], "check": ["车已通过，但一根斜杆挡船，需要改变什么？", ["让整个通航包络保持畅通，不能只看桥面", "原位置换更强的钢材", "只减轻货车"], "承载与通航是两种不同条件。很强的构件也可能占用船舶所需的空间。"]});
registerLevel("island",{"title": "一座岛，两段桥", "place": "II · 3 / 5 · 岛上双跨", "cargo": "岛上运输车", "brief": "小岛把水面分为两个6米缺口。岛上道路已固定，但两段水上桥面都需要各自通往支座的传力路径。", "goal": "支撑两段跨度，让2.6吨货车走完全程。", "concept": "中间的小岛形成两个较短的跨度。第一段通过，并不能证明第二段也能承载。", "hints": ["小岛两侧的菱形是固定支座，两段水上跨度都要搭建支撑。", "左段再牢固，也不能挽救没有支撑的右段桥面。", "可以先在两侧使用类似桁架，再改变一根构件，比较完整过桥结果。"], "check": ["加强第一段后，为何还要测试完整过桥？", ["第二段也必须承受荷载", "小岛会自动支撑所有桥面节点", "第一段会永久承担第二段上的车重"], "每个独立跨度都需要稳定的传力路径，两段都必须满足相同的游戏判定条件。"]});
registerLevel("shipping",{"title": "通航与车队", "place": "II · 4 / 5 · 共用河流", "cargo": "一辆重载车与一辆服务车", "brief": "重载货车和较轻的服务车共同过桥，同时船要通过中央航道。桥面也要足够刚，维持通航净空。", "goal": "在预算内完成两车送达与船舶通行。", "concept": "车队可能在船通过时压低桥面，需要检查加载后的净空，不能只看初始图形。", "hints": ["车重分别为2.1吨和1.5吨，间距3.4米，每次测试都会计入两辆车。", "抬高桥面有助于净空，但支撑构件同样必须避开蓝色包络。", "在笔记中比较时，要匹配高度、车辆、水位和航道条件。"], "check": ["为何需要在移动荷载测试中检查净空？", ["车辆可能把桥面压入船舶包络", "测试中水面总会消失", "拉索在卸载后总会缩短"], "加载后的最低净空可能不同于初始图形。游戏会在船通过时检查构件位置。"]});
registerLevel("riverport",{"title": "河港综合工程", "place": "II · 5 / 5 · 最终委托", "cargo": "两辆河港货车", "brief": "两段桥经小岛连接两岸。双车同渡，两条船道都要畅通。把之前的证据用于一个完整设计。", "goal": "完成两个8米水上跨度、两车送达，以及两条船道通行。", "concept": "可行设计必须同时满足所有条件：两跨承载、完整车队、两条通航包络与预算。", "hints": ["从四处固定河岸开始：左岸、小岛两侧、右岸。", "选择能保留通航净空的高度；每段可尝试斜拉索或上部桁架。", "只有所有车辆和航道都成功才会通过，查看证据里最先未满足的条件。"], "check": ["哪些证据能支持河港设计成功？", ["两车和两船都通过，无断杆、下挠达标且费用合规", "只有第一辆车到达小岛", "图形看起来对称"], "外观不足以判断成功，指定的交通、通航、结构和预算条件必须在同一次完整测试中全部满足。"]});
 }
 function registerMore(){

 pairs(`
The flood took the valley's bridges. Seedlings, medicine and grain are stuck on the wrong side of the river.|洪水冲毁了河谷的桥。树苗、药品与粮食滞留在河对岸。
Mara the guide trains two apprentices. Every bridge starts as a test on the workshop table.|向导玛拉带着两名学徒。每座桥都从工坊桌上的一次试验开始。
Each community needs a different crossing. You cannot reach them all at once, so you will have to choose.|每个社区需要不同的桥。你不能同时抵达所有地方，必须作出选择。
Your choices decide what you carry to Riverbend: materials, savings, and the trust of the people you helped.|你的选择决定带到河湾的资源：材料、积蓄，以及人们的信任。
A broken bridge over a flooded river; seedlings wait on the bank.|洪水中的断桥，树苗等待在岸边。
Two apprentices and their guide test triangles on a tabletop model.|两名学徒与向导在桌面模型上测试三角结构。
The crew builds one half of a crossing from the safe bank.|施工队从安全河岸开始搭建桥梁的一侧。
An orange cart carries seedlings across a finished bridge.|橙色小车载着树苗驶过建成的桥。
The valley council|河谷议事会
A request from the other side|来自另一边的请求
How will Riverbend be supported?|河湾大桥如何支承？
Choose who to reach first.|选择先去帮助谁。
Trade savings for materials and trust?|用积蓄换取材料与信任？
Choose the supports for your final bridge.|选择最后一座桥的支承条件。
The valley’s request|河谷的请求
Go to Fern Hollow clinic|先去蕨谷诊所
Medicine first. You will learn to build with cable. The mill's grain waits.|先送药。你将学会使用拉索，磨坊的粮食需要等待。
Go to Stony Ford mill|先去石滩磨坊
Food for the whole valley. You will learn to build with steel. The clinic waits.|先顾及整个河谷的粮食。你将学会使用钢材，诊所需要等待。
Send the spare credits|送出积蓄
Lose your saved credits. Gain the other community's material and their trust.|花掉积蓄，获得另一个社区的材料与信任。
Keep the credits for Riverbend|为河湾保留积蓄
Keep your savings for the big crossing. Bring only the material you know.|为大桥保留积蓄，仅携带已掌握的材料。
Build a stone pier in the river|在河中建石墩
Halves the span. Stony Ford's quarry crew must agree.|缩短跨度，需要石滩采石队同意。
Needs the trust of Stony Ford mill.|需要石滩磨坊的信任。
Raise cliff towers|架设崖顶高塔
High anchors for cable stays. Fern Hollow's riggers must agree.|提供高处拉索锚点，需要蕨谷吊装队同意。
Needs the trust of Fern Hollow clinic.|需要蕨谷诊所的信任。
No extra support|无额外支座
Nothing in the river. The town adds 300 credits, but the truss must span all 12 m.|河中不加支座。小镇多给300点预算，但桁架必须跨越全部12米。
River pier|河中桥墩
Cliff towers|崖顶高塔
Fern Hollow clinic|蕨谷诊所
Stony Ford mill|石滩磨坊
Willow Creek School|柳溪学校
Willow Creek's children walk to school again. That evening two messages arrive at once, and the crew can only reach one place first. Whoever waits will remember it.|柳溪的孩子们又能步行上学了。当晚两个地方同时来信，施工队只能先去一个。等待的一方会记住你的选择。
The town gathers on the riverbank. What they can offer depends on who you helped along the way.|小镇居民聚集在河岸。一路上帮助过谁，会影响他们能提供什么支承。
Choices change which materials, supports and credits you have later. Every path can reach Riverbend.|选择影响后续材料、支座和预算，每条路线都能抵达河湾。
Light and cheap. Pulls and pushes, but long pieces buckle.|轻巧便宜，能受拉也能受压，长杆受压时容易屈曲。
Strong and stiff. Heavy and costly.|强度与刚度高，但较重、较贵。
Very strong in tension only. Goes slack when pushed.|抗拉强，但只能受拉；受压就会松弛。
Carries the vehicle. Pinned ends, so it needs support.|承载车辆，两端为理想铰接，因此需要支撑。
For ages 11–14 with adult facilitation. No bridge-design experience needed. Expected play time is about 45–75 minutes; actual time varies.|适合11—14岁，在成人引导下游玩。无需桥梁设计经验，预计45—75分钟，实际用时因人而异。
STEM focus|STEM学习重点
Engineering:|工程：
structural design under budget.|预算约束下的结构设计。
Science:|科学：
gravity, self-weight, tension and compression.|重力、自重、拉力与压力。
Mathematics:|数学：
length, cost, load and measured comparison.|长度、费用、荷载与测量比较。
Technology:|技术：
an inspectable simulation.|可检查的模拟系统。
Learning goals|学习目标
Compare two tests under the same load using maximum drop, peak member load and cost, then explain one change through the load path.|在相同荷载下，用最大下挠、构件峰值受力与费用比较两次测试，并通过传力路径解释一项改动。
Choose timber, steel or cable for a role and justify it with tension/compression, strength, buckling and self-weight evidence.|按用途选择木材、钢材或拉索，用拉压、强度、屈曲与自重证据解释选择。
Make a community decision, predict what it changes later, and evaluate the outcome in the Field report.|作出社区选择，预测其后续影响，并在工程报告中评估结果。
How the game teaches|游戏如何引导学习
A branch-and-bottleneck story: community and support decisions change the materials, credits and support options you have at Riverbend. Every path can be finished; each has trade-offs. After each crossing a short check asks you to explain the forces you just saw. Stars reward an efficient design and badges set optional extra goals.|分支故事通过社区与支承选择改变河湾可用的材料、预算和支座。每条路线都能完成，也各有取舍。过桥后的小测验帮助解释观察到的受力，星级与徽章提供可选挑战。
Goal, rules, rewards, challenge|目标、规则、奖励与挑战
Goal:|目标：
deliver across each river.|完成每次渡河运输。
Rules:|规则：
continuous road, no broken members, maximum road drop under that crossing's limit, cost within budget.|道路连续、无断杆、最大下挠符合本关上限，并控制预算。
Rewards:|奖励：
stars, badges, saved credits, unlocked materials and trust.|星级、徽章、积蓄、解锁材料与信任。
Challenge:|挑战：
longer spans and heavier loads with limited credits.|在有限预算下承受更长跨度与更重荷载。
Model limits, sources and teaching methods|模型限制、资料与教学方法
The vehicle is a moving load on the road, not a full wheel-contact model. Joints are ideal pins and members carry axial force only, so bending, joint failure, fatigue and wind are left out. Drop limits, material values and credit prices are game rules, not engineering standards. Example designs are one tested solution, never the only or the best one.|车辆采用规定移动荷载，不模拟完整轮地接触。节点为理想铰，杆件仅承受轴向力，省略抗弯、节点破坏、疲劳与风。下挠上限、材料数值与价格是游戏规则，不是工程标准。参考方案只是一个经测试的解。
References:|参考资料：
Rendering uses Three.js r165 and OrbitControls (MIT). Artwork is original to this project; see assets/ART-PROVENANCE.md.|渲染使用本地Three.js r165与OrbitControls（MIT）。原创美术见assets/ART-PROVENANCE.md，实桥照片署名见照片卡与assets/bridges/SOURCES.json。
Teaching methods used|采用的教学方法
Task information comes first, a character explanation follows the first failed test, and a real-world connection follows a successful test.|先给任务，首次失败后给角色解释，通过后联系现实工程。
Learners try a design before its automatic structural explanation appears. This follows the Explore → Explain sequence in 5E; requested hints remain available.|先尝试设计，再呈现结构解释，遵循5E的“探索→解释”顺序，主动请求的提示始终可用。
Controls practice guides an action with highlighted endpoints, then learners use the real controls and receive test feedback.|操作练习用高亮端点引导，玩家随后实际操作并得到测试反馈。
Predict a consequence before testing, then record a Claim, Evidence and Reasoning for that numbered test.|测试前预测，测试后为该编号记录观点、证据与推理。
Characters connect observations to ideas; materials, trust and saved credits affect later choices.|角色把观察与原理联系起来，材料、信任和积蓄影响后续选择。
Skill tags describe the intended thinking demand: Apply → Analyse → Evaluate → Create. A tag or pass does not establish mastery.|技能标签描述预期思维要求：应用→分析→评价→创造。标签或通关并不证明已掌握。
Route and sharing decisions change materials and credits. The story converges at Echo Gorge, then a support decision shapes the Riverbend finale.|路线与分享选择改变材料和预算；故事汇聚于回声峡谷，再由支承选择塑造最终河湾大桥。
Teaching design intent, not a measured learning outcome. Teachers can review matched tests and explanations as evidence for further questions.|这些是教学设计意图，尚非经测量的学习成效。教师可用匹配测试与解释继续追问。
The prelaid road is locked and counted in your budget. Pick a support material, then drag between joints or tap both endpoints. Both truss sides update together.|道路已预铺并锁定，计入预算。选择支撑材料后拖动连接节点，或依次点选两端。桥梁两侧同步更新。
Pick Timber, Steel or Cable and drag from an existing joint. Lines only join where they share a dot.|选择木材、钢材或拉索，从已有节点拖出构件。线条仅在共用端点时连接。
Press|点击
Test crossing|测试过桥
. Green → yellow → red bodies show utilization; blue/red end bands show tension/compression. If something breaks, the game slows down and shows which piece failed and why.|。构件绿→黄→红表示利用率，端部蓝/红表示受拉/受压。首次断裂时会慢放并显示位置与受力形式。
After a test,|测试后，
Inspect|检查
shows the highest load each member reached. Make one change, predict its consequence, then compare tests under matching conditions. Low utilization alone does not prove a member can be removed.|可显示构件最高受力。修改一项、预测结果，并在相同条件下比较测试。低利用率不足以证明构件可以移除。
1–3 support materials · Arrow keys + Enter build · P pause · X erase · Ctrl+Z undo · Ctrl+Shift+Z redo · Esc cancel the current line · Space test or edit · F forces. Right-click also cancels. Nothing you do is permanent: Undo, Clear and Edit design always bring you back.|1—3选材料；方向键＋回车搭建；P暂停；X擦除；Ctrl+Z撤销；Ctrl+Shift+Z重做；Esc或右键取消；空格测试/修改；F受力。可以随时撤销或修改设计。
3D view: right-drag to orbit, scroll to zoom, or use Orbit view and drag with one finger. Use two fingers to rotate and zoom. Front view restores the building elevation. During tests, green → yellow → red shows the fraction of each member’s load limit; blue/red end bands show tension/compression. Slack cables are pale and dashed.|3D视角：右键拖动旋转，滚轮缩放；也可启用旋转视角后单指拖动，双指旋转缩放。正面视角回到搭建立面。测试中，绿→黄→红表示受力利用率，蓝/红端带表示拉/压，淡色虚线表示松索。
Use Notebook → Export notebook to include your experiment records and notes.|通过“笔记→导出笔记”一起保存实验记录与文字笔记。
Try a test of your own design before loading an example. An empty or incomplete bridge is also an experiment.|先测试自己的设计，再载入参考方案。空桥或未完成的桥也可以是一次实验。
Your current design is kept in Undo, so you can go back.|当前设计保留在撤销历史中，可以恢复。
Load the example|载入参考方案
Example loaded. Test it, then try to make it cheaper.|参考方案已载入。测试后，试着降低费用。
Hover or tap a member to see its highest load. Press Back to results to continue, or Edit design to change it.|悬停或点选构件查看最高受力。可返回结果继续，或修改设计。
First observed failure: member|首次观察到的断裂：构件
The structure completed the test, but exceeded the available budget.|结构完成了测试，但费用超过预算。
The crossing met the game criteria.|过桥满足游戏条件。
The crossing did not meet all game criteria.|过桥未满足全部游戏条件。
This test is paused while the Notebook is open. Continue the test to collect its outcome.|打开笔记时测试暂停，继续测试后可获得结果。
Use the measurements from this test below. Your pre-test prediction is preserved.|使用下方本次测试的测量结果，测试前的预测已保留。
This test was started without a completed result. Numerical measurements are unavailable; describe only what you observed.|本次测试已开始但未完成，没有数值结果，只描述实际观察。
Write Predict before starting the test. Claim, Evidence and Reasoning become available afterwards.|测试开始前写预测，测试后可填写观点、证据与推理。
All notes are optional.|所有笔记均为可选项。
Choose a different material to make a comparison.|选择不同材料进行比较。
A connected path does not calculate how load divides.|连通路径无法计算荷载如何分配。
First or later observed fracture.|观察到的首次或后续断裂。
Seen slack: cable cannot resist pushing.|曾观察到松索：拉索无法抵抗压力。
Peak utilization:|峰值利用率：
B minus A:|B减去A：
Same design: this is a repeatability check.|相同设计，这是重复性检查。
More than one member changed; avoid attributing the result to a single change.|改变了多根构件，请勿把结果仅归因于单项修改。
Both completed and met the game criteria. Compare trade-offs; the numbers alone do not prove the cause.|两次均完成且满足游戏条件。比较权衡，数字本身不能证明原因。
At least one did not pass. A shorter failed run may miss later loads. A smaller recorded drop or peak is not enough to call that design better.|至少一次未通过，过早结束可能错过后续荷载。记录的下挠或峰值更小，并不足以证明设计更好。
Recording times:|记录时长：
Earlier choices shape what reaches Riverbend.|前面的选择影响抵达河湾时的资源。
This is the final crossing.|这是最后一座桥。
How can a road carry a load to the fixed banks?|道路如何把荷载传到固定河岸？
Real bridges face additional demands. This game checks axial members, prescribed axle loads and a two-dimensional swept boat envelope.|真实桥梁面临更多需求。游戏仅检验轴向杆件、规定车轴荷载与二维船舶扫掠包络。
Start a new journey? Your current progress will be replaced. (Help → Settings can export it first.)|重新开始当前章节？当前进度会被替换，可先在“帮助→设置”导出。
Replace your current progress with the pasted one? The optional Notebook will start empty; export it separately first.|用粘贴内容替换当前进度？工程笔记将清空，请先单独导出。
Replace your current journey and notebook with this file?|用此文件替换当前旅程与笔记？
`);
 pattern('{n} of {total} crossings built · {stars} stars · {credits} credits saved','已建成{n}/{total}座桥 · {stars}星 · 积蓄{credits}点');
 pattern('{n} m crossing · 0.5 m grid','跨度{n}米 · 每格0.5米');
 pattern('II · {n} / 5 · {place}','II · {n} / 5 · {place}');
 pattern('Navigation lane {lane} blocked by member {member}. Raise the deck or keep supports above the channel.','第{lane}条航道被构件{member}阻挡。抬高桥面，或将支撑布置到航道上方。');
 pattern('{n} · {mass} kg {status}','{n} · {mass}千克 {status}');
 pattern('{n} / {required} m','{n} / {required}米');
 pattern('{n} · {clearance} / {required} m','{n} · {clearance} / {required}米');
 pattern('The road dropped {drop} cm. The limit is {limit} cm.','道路下挠{drop}厘米，上限为{limit}厘米。');
 pattern('The road dropped most near {x} m. Support that point with a triangle.','道路在约{x}米处下挠最大，尝试用三角形支撑。');
 pattern('The bridge held, but it costs {cost} credits. You have {budget}.','桥承住了荷载，但费用为{cost}点，预算仅{budget}点。');
 pattern('{material} failed in {mode} and the road lost support.','{material}构件因{mode}失效，道路失去支撑。');
 pattern('The vehicle crossed, but {material} failed in {mode}.','车辆通过了，但{material}构件因{mode}失效。');
 pattern('Too long. {material} pieces can be at most {length} m.','构件过长：{material}最多{length}米。');
 pattern('{material} is not available here.','本关不能使用{material}。');
 pattern('Hint {n} of {total}. Press Hint again for the next one.','第{n}/{total}条提示，再点提示可看下一条。');
 pattern('Test {n}: {outcome}','测试{n}：{outcome}');
 pattern('Your explanation · test {n}','你的解释 · 测试{n}');
 pattern('Test {n} · {status} · {mass} kg · {time} s','测试{n} · {status} · {mass}千克 · {time}秒');
 pattern('Test {n} · no completed result','测试{n} · 无完整结果');
 pattern('Test {n}','测试{n}');
 pattern('Use at most {n} members','最多使用{n}根构件');
 pattern('Keep every member below {n}% of its limit','全部构件利用率低于{n}%');
 pattern('Keep the road drop under {n} cm','桥面下挠小于{n}厘米');
 pattern('Spend at most {n} credits','最多花费{n}点');
 pattern('Pass without {mat}','不用{mat}通过');
 pattern('New material here: {mat}','本关新材料：{mat}');
 pattern('New material: {mat}','新材料：{mat}');
 pattern('{n} saved credits','积蓄{n}点');
 pattern('After delivery:','交付后：');
 pattern('{n} credits in reserve','积蓄{n}点');
 pattern('The simulation produced invalid data; no numerical evidence was recorded.','模拟产生无效数据，未记录数值证据。');
 pattern('Recorded maximum road drop: {drop} cm over {time} s. {result}','记录时长{time}秒，最大下挠{drop}厘米。{result}');
 pattern('{n} kg · {span} m span · {anchors} fixed anchors · {budget} credits available. Includes {time} s settling.','载荷{n}千克 · 跨度{span}米 · {anchors}个固定锚点 · 预算{budget}点。含{time}秒自重稳定。');
 pattern('{n} recorded tests. Revisit your designs, compare matching conditions, and export your observations and explanation. Stars and quiz answers do not establish engineering mastery.','已记录{n}次测试。回看设计、匹配条件比较，并导出观察与解释。星级和答题结果并不能证明工程能力。');
 pattern('Predict → test → explain · optional','预测→测试→解释 · 可选');
 pattern('Notes are not required to play and are not a mastery score. The last {n} completed experiments keep numerical evidence; per-test notes also keep started tests.','笔记不影响游玩，也不用于能力评分。保留最近{n}次完整实验的数值证据，文字笔记也保留未完成测试。');
 pattern('{storage} Export this notebook to move progress, measurements and all inquiry notes together. The usual progress export keeps its version-1 format.','{storage} 导出工程笔记可一起迁移进度、测量数据和所有文字笔记。普通进度导出保留版本1格式。');
 pattern('You have seen every hint. You can load one tested example design (','已查看全部提示，可载入一种经过测试的参考方案（');
 pairs(`
credits). It is one way that works, not the only or the best one.|点）。这是一种可行方案，不是唯一或最优方案。
max drop|最大下挠
peak utilization|峰值利用率
s recorded|秒记录时长
grid points|网格节点
in reserve|积蓄
credits/m|点/米
up to|最长
approximately|约
peak|峰值
fixed anchors|固定锚点
recorded|已记录
no completed result|无完整结果
During self-weight settling|自重稳定期间
 during self-weight settling|自重稳定期间
 during the crossing|过桥期间
percentage points peak utilization.|个百分点的峰值利用率。
Design edits:|设计改动：
added,|新增，
removed,|移除，
material substitutions.|处材料更换。
Test|测试
`);


 pairs(`
Journey state|旅程状态
Show forces during tests (F)|显示受力颜色（F）
The flood took the valley's bridges. Build new ones, choose who to help first, and live with what your choices change.|洪水冲毁了河谷的桥。重建道路，选择先帮助谁，并承担选择带来的改变。
road|道路
timber|木材
steel|钢材
cable|拉索
about|关于
Workshop|工坊
Convoy|车队
Harbor|港口
Island links|岛上双跨
Shared river|共用河流
Final commission|最终委托
compression members|压杆
self-weight settling|自重稳定
s during the crossing|秒，过桥期间
Apply — build a triangulated support|应用 — 搭建三角支撑
Analyse — compare long beam vs triangulated span|分析 — 比较长杆与三角桁架
Analyse — identify tension/compression member roles|分析 — 识别拉压构件的作用
Evaluate — choose materials with test evidence|评价 — 根据测试证据选择材料
Evaluate — compare two structural approaches|评价 — 比较两种结构思路
Create — design for new load and span constraints|创造 — 针对新的荷载与跨度设计
Mara:|玛拉：
Dr. Yao:|姚医生：
Mill foreman:|磨坊领班：
Town engineer:|小镇工程师：
"Watch how the road sags when nothing supports it. Add a timber below — a triangle turns that bending into push and pull."|“看看没有支撑时桥面如何下挠。加一根木杆，用三角形把荷载转化为拉力和压力。”
"Long members can buckle under compression. Keep each section short and brace it into triangles."|“长构件受压可能屈曲。每段保持较短，并用三角形支撑。”
"A cable can only pull. If you use it to push, it just goes slack and carries nothing."|“拉索只能拉，受压时只会松弛，无法传递压力。”
"Investigate the one that broke first, then try a stronger material there. Change one thing at a time so you can compare what the fix changed."|“研究先断裂的构件，再尝试更强材料。每次只改一项，便于比较改动带来的结果。”
"Different structures can carry the same load. Use the materials you earned, then compare drop, member load and cost under the same conditions."|“不同结构能承担相同荷载。使用得到的材料，在相同条件下比较下挠、受力和费用。”
"A pier or high anchor changes the paths that carry load to the ground. Design for the supports the town chose, then test your idea."|“桥墩或高锚点改变荷载通向地面的路径。按小镇选定的支座设计，并测试想法。”
Real railway bridges use triangular bracing to keep spans stiff under heavy loads.|真实铁路桥用三角支撑在重载下维持刚度。
Highway truss bridges divide long spans into short triangulated panels.|公路桁架桥把长跨分成较短的三角格间。
Suspension bridges use cables for tension only — a cable cannot push, only pull. Here, direct stays connect road joints to high anchors.|悬索桥的索仅承受拉力，不能受压。这里采用直接连接桥面与高锚点的斜拉索。
Engineers can strengthen selected members when repairing a bridge; evidence helps them decide where a change is needed.|维修桥梁时可以针对特定构件加强，证据帮助工程师决定修改的位置。
Arch bridges and truss bridges suit different conditions — both are still built today. Here, compare the truss and stayed-deck approaches available to you.|拱桥与桁架桥适应不同条件，今天仍在建造。这里可比较桁架和斜拉桥面的思路。
Real engineers compare multiple designs before choosing; cost, weight and safety all matter.|真实工程师会比较多个方案，综合考虑费用、重量与安全。
If you played again, which decision would you change, and how would it change the Riverbend bridge? Use one number from the table as evidence.|再玩一次，你会改变哪个选择？它会怎样影响河湾大桥？请用表中一个数字作为证据。
Sharing cost your savings but brought a second material and a second community's trust.|分享花掉了积蓄，但带来了第二种材料和另一个社区的信任。
(school)|（学校）
nobody yet|尚无
(one of these, your choice)|（二选一）
Try observing:|试着观察：
Small-step XPBD|小步长XPBD
`);
 pattern('First observed failure: member {n}, {type}, in {mode}, at {time} s during the crossing.','首次观察到断裂：构件{n}，{type}，{mode}，发生于{time}秒过桥期间。');
 pattern('First observed failure: member {n}, {type}, in {mode}, at {time} s during self-weight settling.','首次观察到断裂：构件{n}，{type}，{mode}，发生于{time}秒自重稳定期间。');
 pattern('{mat} was pulled apart (tension). This {length} m piece can hold {force} kN of pull.','{mat}被拉断（受拉）。这根{length}米构件的抗拉上限为{force}千牛。');
 pattern('{mat} was crushed (compression). This {length} m piece can hold {force} kN of push.','{mat}受压失效。这根{length}米构件的抗压上限为{force}千牛。');
 pattern('{mat} buckled (compression). This {length} m piece can hold {force} kN of push.','{mat}发生屈曲（受压）。这根{length}米构件的抗压上限为{force}千牛。');
 pattern('○ Steady Road: Keep the road drop under {n} cm','○ 平稳桥面：下挠小于{n}厘米');
 pattern('✓ Steady Road: Keep the road drop under {n} cm','✓ 平稳桥面：下挠小于{n}厘米');
 pattern('○ Cool Head: Keep every member below {n}% of its limit','○ 从容承载：全部构件利用率小于{n}%');
 pattern('✓ Cool Head: Keep every member below {n}% of its limit','✓ 从容承载：全部构件利用率小于{n}%');
 pattern('A tested design costs {cost} credits. Inspect your bridge: green members carried a low fraction of their limit.','一种参考设计费用为{cost}点。检查绿色构件：它们的受力利用率较低。');
 pattern('{other} sends a runner. They are patching a crossing themselves and ask for your spare credits ({credits} saved so far). In return they will teach your crew their material.','{other}派人请求积蓄（目前{credits}点）来修补渡口，作为交换，他们会传授另一种材料的使用方法。');
 pattern('Saved credits: {credits} · Materials: {materials} · Helped: {helped}','积蓄：{credits} · 材料：{materials} · 已帮助：{helped}');
 pattern('Saved credits: {before} → {after}','积蓄：{before}→{after}');
 pattern('+{n} credits saved for later','为后续积累{n}点');
 pattern('{n} saved credits spent','使用积蓄{n}点');
 pattern('{n} brought','携入{n}点');
 pattern('{n} brought forward','前关携入{n}点');
 pattern('{n} members','{n}根构件');
 pattern('You have seen every hint. You can load one tested example design ({name}, {cost} credits). It is one way that works, not the only or the best one.','已查看全部提示，可载入一种经过测试的方案（{name}，{cost}点）。它是一个可行解，不代表唯一或最优。');
 pairs(`
Two struts|双斜撑
Deck truss|桥下桁架
Through truss|上部桁架
Cable stays|斜拉索
Timber through truss|木制上部桁架
Steel diagonals|钢斜杆
Steel web|钢腹杆
Steel-diagonal deck truss|钢斜杆桥下桁架
Steel struts on the pier|桥墩上的钢斜撑
Deep truss, cable bottom chord|深桁架与拉索下弦
Braced spans|有支撑的多跨桁架
Upper steel trusses|上部钢桁架
Direct stays over each channel|每条船道上方的直连拉索
`);
 const missions=[
 ['tabletop',['道路如何把荷载传到固定河岸？','添加支撑前测试预铺道路，找到最大下挠位置，再支撑中部重新测试。','三角形可以把拉力和压力传向固定支座，未支撑的铰接道路会下垂。','从桥面节点沿连接杆件追踪到河岸，线条相交不一定形成节点。','简单桁架由三角形组成，游戏模拟轴向铰接杆件，不模拟连续梁抗弯。']],
 ['willow',['短而有支撑的构件能否更有效地承载同一辆车？','检查受压构件，在同样900千克荷载下比较长斜撑与三角桁架。','游戏同时按材料强度与长度相关的屈曲规则限制压力。短构件需要节点支撑，不只是增加节点。','保持荷载与锚点相同，比较下挠、压力利用率和费用后再判断改进。','桥下桁架把道路放在三角形上方；上部桁架位于道路两侧，这里两种都能尝试。']],
 ['clinic',['桥下没有支座时，拉索能在哪些位置发挥作用？','把高锚点连接到桥面，观察哪些索受拉、哪些曾经松弛。','拉索只能受拉，端点靠近时会松弛，不能抵抗压力。','沿连接路径追踪到高锚点，低受力读数不足以证明索可以拆除。','斜拉桥用索直接连接桥面和桥塔，这里的高锚点简化了桥塔。']],
 ['mill',['在哪些地方值得投入更昂贵的钢材？','测试木结构，选择首次断裂的构件，只更换材料后重测。','钢材的强度、刚度、自重与费用都不同。断裂位置是证据，完整原因需要控制变量测试。','保持几何与荷载相同，针对性替换能否在预算内完成过桥？','桁架可按不同需求采用不同截面或材料，每处增加材料不一定有效。']],
 ['echo',['两种可行结构在刚度、受力与费用间如何权衡？','在相同荷载与支座下比较两种方案，每次改变一个设计要素。','可以存在多个可行解。过早失败的测试下挠较小，不代表桥更好。','除下挠、利用率与费用外，还要记录完整过桥结果与测试时长。','桁架与斜拉桥面都能形成连通的传力路径，应比较证据而非寻找唯一外形。']],
 ['finale',['支承条件如何改变设计？','利用小镇选定的锚点，应用前面测试的原理，并用本关数据解释。','中间支座或高锚点改变可用传力路径。不同支承条件的数据不能用作控制变量比较。','解释一个设计选择，引用一项测量，并说明模型的一项限制。','桥墩提供中间支承，斜拉索提供通向高锚点的路径。3D图像仍代表二维结构模型。']]
 ];
 for(const [id,values] of missions){const m=root.EngineeringLab.missions[id];['question','try','why','transfer','example'].forEach((k,i)=>add(m[k],values[i]));}


 pairs(`
Deliver this bridge to carry|交付后可带走本关节省的
saved here into later crossings.|用于后续工程。
After delivery, your reserve will be|交付后积蓄将达到
You brought|已携入
into this crossing|用于本关
this design uses|本设计使用了其中
of them|点
Diamonds show the available fixed supports.|菱形标记表示可用固定支座。
Add your own support design.|请设计自己的支撑。
Light and cheap.|轻巧便宜。
Pulls and pushes, but long pieces buckle.|可受拉受压，长杆容易屈曲。
Strong and stiff.|强度与刚度高。
Heavy and costly.|较重且较贵。
Very strong in tension only.|抗拉强，但只能受拉。
Goes slack when pushed.|受压时会松弛。
Connectivity alone does not prove stability or strength.|连通并不能证明稳定性或强度。
Use the measurements from this test below.|使用下方本次测试的数据。
Your pre-test prediction is preserved.|测试前的预测已保留。
`);
 pattern('{cargo}, {mass} kilograms, crossing {span} metres. Diamonds show the available fixed supports. Add your own support design.','{cargo}，{mass}千克，跨度{span}米。菱形表示固定支座，请设计自己的支撑。');
 pattern('You went to {place} first, so {other} waited until you sent them your saved credits.','你先帮助{place}，因此{other}一直等到收到你的积蓄。');
 pattern('You went to {place} first, so {other} waited and patched their own crossing.','你先帮助{place}，因此{other}等待后自行修补渡口。');
 pattern('Keeping the credits gave Riverbend a bigger budget, but beyond timber you only had {material}.','保留积蓄增加了河湾的预算，但除木材外你只有{material}。');
 pattern('Riverbend was built with: {support}.','河湾采用的支承：{support}。');
 pattern('The seedlings crossed. {stars} stars and {badges} badges over {tests} tests.','树苗已送达。经过{tests}次测试，获得{stars}星和{badges}枚徽章。');


 pairs(`
Chunking (Factual):|分块呈现（事实性知识）：
Bottom-up Discovery (Conceptual):|自下而上的发现（概念性知识）：
Demonstration → Practice → Feedback (Procedural):|示范→练习→反馈（程序性知识）：
CER + Inquiry (Problem-solving):|观点－证据－推理与探究（问题解决）：
Storytelling + SBL:|故事与情境学习：
Bloom's Taxonomy:|布鲁姆分类法：
Branch and Bottleneck (SBL):|分支与汇聚（情境学习）：
CMU learning principles|卡内基梅隆大学学习原则
How can a road carry a load to the fixed banks?|道路如何把荷载传到固定河岸？
A cable cannot push.|拉索不能承受压力。
Shorter pieces resist buckling much better.|较短构件更能抵抗屈曲。
worth revisiting|值得复习
`);
 pattern('{mat} buckled under compression. It is {length} m long, so it can only take {force} kN of push. Shorter pieces resist buckling much better.','{mat}受压屈曲。长度为{length}米，抗压上限为{force}千牛。短构件更能抵抗屈曲。');
 pattern('{mat} was crushed (compression). This piece can take {force} kN of push.','{mat}受压破坏，此构件的抗压上限为{force}千牛。');
 pattern('Grid {point}. Start selected. Move and press Enter to connect.','网格{point}。已选起点，移动后按回车连接。');
 pattern('Grid {point}. Press Enter to select a start.','网格{point}。按回车选择起点。');

pairs(`
Rendering uses Three.js r165 and OrbitControls (MIT). Original artwork: assets/ART-PROVENANCE.md. Real bridge photographs: visible credits and licenses in each case card; full sources in assets/bridges/SOURCES.json.|渲染使用本地Three.js r165与OrbitControls（MIT）。原创美术见assets/ART-PROVENANCE.md；实桥照片署名与许可见各照片卡，完整来源见assets/bridges/SOURCES.json。
`);
pairs(`
and|和
`);

pairs(`
First crossing|第一关
Build your first bridge|搭建你的第一座桥
First crossing · Tutorial|第一关 · 新手教程
Choose a material|选择材料
Choose Timber below.|点击下方的木材。
Hold → drag → release|按住 → 拖动 → 松开
Hold, drag, release.|按住起点，拖到终点，再松开。
Tap 1, then tap 2|点①，再点②
Tap 1, then tap 2.|先点起点①，再点终点②。
Test your bridge|测试你的桥
Watch the pointer.|跟着半透明指针看一遍。
Demo · hold|演示 · 按住
Demo · drag|演示 · 拖动
Demo · release|演示 · 松开
Your turn · drag the same way|轮到你了 · 沿路径拖动
Demo · tap 1|演示 · 点击①
Demo · move|演示 · 移到②
Demo · tap 2|演示 · 点击②
Your turn · tap both dots|轮到你了 · 依次点两个圆点
Undo removes your last support.|点击撤销，移除刚搭的支撑。
Redo brings your support back.|点击重做，恢复刚才的支撑。
Your bridge is ready. Test it.|桥已搭好，点击测试过桥。
Pause to watch the forces.|点击暂停，观察受力颜色。
Pause and read the colors|暂停，观察受力
Replay demonstration|重播操作演示
Replay|重播
Skip tutorial|跳过教程
`);

pairs(`
Turn the 3D scene|转动3D场景
Drag to look around|拖动，换个角度看
Return to Front view|回到正面，开始搭桥
Tap Orbit view.|点击「旋转」按钮。
Tap Front view to build.|点击「正面」，回到搭建视角。
Hold and drag sideways.|按住场景，向左右拖动。
Drag sideways to turn.|在场景中左右拖动即可旋转。
Now tap Front view.|转动成功，再点击「正面」。
Next: front view|下一步：正面
Enable sound|开启音效
Mute sound|关闭音效
`);
// EXTRA_TRANSLATIONS
 }
})(typeof self!=='undefined'?self:this);
