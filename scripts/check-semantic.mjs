import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {nodes,edges} from '../dist/data.js';
import {visibleEntities,semanticStyle,overlaps,connectionRoute,packBubbleCloud,footprintsOverlap,bubbleLabel,fullBubbleLabel} from '../dist/semantic-map.js';
import {arrangeCanvas} from '../dist/canvas-layout.js';
import {researchConnections,validateResearch,researchFile,researchSnapshot} from '../dist/research-paths.js';
import {validateView,workspaceFile,parseWorkspace} from '../dist/saved-views.js';
import {encodeState,decodeState} from '../dist/routing.js';

for(const zoom of [.3,.5,.72,1,1.4,1.75,2.2,3.5]){
  const candidates=nodes.map((node,index)=>{const degree=edges.filter(edge=>edge.source===node.id||edge.target===node.id).length,style=semanticStyle(degree,zoom,{protectedNode:index===100});return {id:node.id,degree,opacity:style.opacity,priority:index===100?1e6:0,box:{left:(index%16)*70,top:Math.floor(index/16)*34,right:(index%16)*70+80+style.font*3,bottom:Math.floor(index/16)*34+style.font*2+style.radius*2}};});
  const obstacles=[{left:0,top:0,right:300,bottom:100},{left:900,top:400,right:1200,bottom:650}],result=visibleEntities(candidates,{width:1200,height:650,obstacles});
  assert.ok(result.ids.size>0&&result.ids.size<nodes.length);
  for(const item of result.items){assert.ok(item.box.left>=8&&item.box.right<=1192&&item.box.top>=8&&item.box.bottom<=642);assert.ok(obstacles.every(box=>!overlaps(item.box,box,10)));for(const other of result.items)if(item.id!==other.id)assert.ok(!overlaps(item.box,other.box,10),'Visible entity footprints must never overlap');}
}
assert.equal(semanticStyle(1,.5).opacity,0);
assert.ok(semanticStyle(1,1.2).opacity>0&&semanticStyle(1,1.2).opacity<1,'A new detail layer fades into focus');
assert.ok(semanticStyle(1,2).opacity>semanticStyle(1,1.2).opacity);
assert.equal(semanticStyle(1,.3,{protectedNode:true}).opacity,1,'Research anchors survive the degree threshold');
assert.ok(semanticStyle(40,.72).font>semanticStyle(4,.72).font);
assert.ok(semanticStyle(1,.72).threshold>semanticStyle(1,2).threshold);
const cloudItems=nodes.map(node=>{const degree=edges.filter(edge=>edge.source===node.id||edge.target===node.id).length;return {id:node.id,degree,radius:semanticStyle(degree,.72).radius};});
for(const [width,height]of [[1240,540],[1080,700],[350,650]]){
  const obstacles=[{left:0,top:0,right:Math.min(320,width-20),bottom:90},{left:0,top:height-105,right:Math.min(260,width*.5),bottom:height}];
  const cloud=packBubbleCloud(cloudItems,{width,height,obstacles});
  assert.ok(cloud.visible.size>=12&&cloud.fillers>=3,'Small bubbles fill the spaces in a compact cluster, including on phones');
  assert.ok(cloud.visible.size<=36,'The overview stays selective rather than showing every record');
  const candidates=cloudItems.filter(item=>cloud.visible.has(item.id)).map(item=>{const p=cloud.positions.get(item.id),r=item.radius+2;return {...item,opacity:1,circle:{...p,r},box:{left:p.x-r,right:p.x+r,top:p.y-r,bottom:p.y+r}};});
  assert.equal(visibleEntities(candidates,{width,height,obstacles,gap:3}).ids.size,cloud.visible.size,'Packed circles remain visible without rectangle-based false collisions');
  for(const item of candidates){assert.ok(item.radius>0,'Overview entities retain visible bubbles');for(const other of candidates)if(item.id!==other.id)assert.ok(!footprintsOverlap(item,other,3),'Packed bubbles and their hit areas never overlap');}
  const small=candidates.filter(item=>item.degree<=4);assert.ok(small.some(item=>candidates.filter(other=>other.id!==item.id&&Math.hypot(item.circle.x-other.circle.x,item.circle.y-other.circle.y)<item.circle.r+other.circle.r+3.1).length>=2),'A small bubble nests between at least two neighboring bubbles');
}
assert.ok(bubbleLabel('Columbus Partnership',65,16).join(' ').includes('Columbus'));
for(const degree of [1,2,4,9,16,32]){
  let previous=0;
  for(const zoom of [.72,.9,1.125,1.4,1.75,2.2,3.5]){const style=semanticStyle(degree,zoom,{cloud:true});assert.ok(style.bubble,'The overview retains bubbles at every zoom');assert.ok(style.radius>previous,'Zoom enlarges bubbles instead of shrinking them');previous=style.radius;assert.equal(style.fullName,zoom>=1.4);}
}
for(const node of nodes)for(const font of [12,16,22]){
  const full=fullBubbleLabel(node.name,font);
  assert.equal(full.lines.join(' '),node.name.trim().replace(/\s+/g,' '),'Every entity name can be displayed without initials or truncation');
  full.lines.forEach((line,index)=>{const y=(index-(full.lines.length-1)/2)*font*1.12;assert.ok(Math.hypot(line.length*font*.54/2,Math.abs(y)+font*.58)<full.radius,'Full labels fit inside their bubble');});
}
const compact={nodes:[{id:'a',name:'American Electric Power'},{id:'b',name:'City of Columbus'},{id:'c',name:'Bill Byers'}],edges:[]};
const compactSizes=new Map([['a',{left:-70,right:70,top:-34,bottom:74}],['b',{left:-63,right:63,top:-35,bottom:60}],['c',{left:-43,right:43,top:-32,bottom:55}]]);
const compactObstacles=[{left:0,top:0,right:340,bottom:200},{left:140,top:390,right:340,bottom:530},{left:0,top:520,right:220,bottom:608},{left:200,top:560,right:340,bottom:608}];
const compactLayout=arrangeCanvas(compact,{width:340,height:608,obstacles:compactObstacles,measurements:compactSizes,pins:new Set(['a','b','c']),flow:true});
const compactVisible=visibleEntities(compact.nodes.map(node=>{const p=compactLayout.positions.get(node.id),b=compactSizes.get(node.id);return {id:node.id,priority:1,opacity:1,box:{left:p.x+b.left,right:p.x+b.right,top:p.y+b.top,bottom:p.y+b.bottom}};}),{width:340,height:608,obstacles:compactObstacles,gap:6});
assert.equal(compactVisible.ids.size,3,'A short research path fits beside phone controls without dropping anchors');
const bypass=connectionRoute({x:260,y:60},{x:260,y:440},{width:520,height:500,obstacles:[{left:210,right:310,top:190,bottom:310}]});
assert.equal(bypass.collisions,0,'A line between two anchors must bypass a third entity instead of implying a connection to it');assert.equal(bypass.outside,0);assert.ok(Math.abs(bypass.control.x-260)>100);
const fixture={nodes:['a','b','c','separate'].map(id=>({id})),edges:[{id:'ab',source:'a',target:'b'},{id:'bc',source:'b',target:'c'}]};
const steps=[{kind:'entity',id:'a',note:'Question to follow'},{kind:'connection',id:'bc',note:'Source page 2'},{kind:'entity',id:'separate',note:''}];
const route=researchConnections(steps,fixture);
assert.deepEqual([...route.edgeIds],['ab','bc']);assert.ok(route.pinnedEdges.has('bc'));assert.equal(route.segments.at(-1).route,null,'Disconnected research steps never acquire a fictional link');
const nodeIds=new Set(nodes.map(node=>node.id)),edgeIds=new Set(edges.map(edge=>edge.id)),edge=edges.find(edge=>edge.source==='city'||edge.target==='city');
const research={id:'test-research',title:'A sourced question',createdAt:'2026-10-15T12:00:00Z',steps:[{kind:'entity',id:'city',note:'My research note'},{kind:'connection',id:edge.id,note:''}]};
assert.deepEqual(validateResearch(research,nodeIds,edgeIds),research);
for(const patch of [{steps:[{kind:'connection',id:'made-up'}]},{steps:[research.steps[0],research.steps[0]]},{steps:[{...research.steps[0],note:42}]},{title:''}])assert.throws(()=>validateResearch({...research,...patch},nodeIds,edgeIds));
const snapshot={query:'?pins=city',positions:[['city',200,250]],camera:{x:0,y:0,z:1.4},dimensions:{width:1200,height:650},scale:1,details:{open:false,docked:false,width:420},research};
const file=researchFile(research,snapshot,{releaseId:'test-edition'},{entities:[{id:'untrusted'}]},{nodes,edges});
const loaded=researchSnapshot(JSON.parse(JSON.stringify(file)),{nodeIds,edgeIds,validateSnapshot:validateView});
assert.deepEqual(loaded.research,research);assert.ok(!loaded.entities&&!loaded.records,'Imported records cannot replace the local dataset');
assert.equal(new URLSearchParams(loaded.query).get('focus'),'0');assert.equal(new URLSearchParams(loaded.query).get('path'),[...researchConnections(research.steps,{nodes,edges}).edgeIds].join(','),'Research artifacts reopen the path rather than the surrounding exploration');
assert.throws(()=>researchSnapshot({...file,version:99},{nodeIds,edgeIds,validateSnapshot:validateView}));
const restored=parseWorkspace(workspaceFile([{id:'one',name:'Research',snapshot}],'one',null,'test-edition'),nodeIds);
assert.deepEqual(restored.views[0].snapshot.research,research,'Notes and the step order survive workspace export/import');
assert.equal(validateView({...snapshot,mapLayout:'bubble-cloud-v1'},nodeIds).mapLayout,'bubble-cloud-v1','Saved packed views retain their layout instead of migrating again');
const detailedSnapshot=validateView({...snapshot,mapLayout:'bubble-cloud-v2',overviewIds:['city']},nodeIds);assert.deepEqual(detailedSnapshot.overviewIds,['city']);assert.equal(detailedSnapshot.mapLayout,'bubble-cloud-v2');
for(const overviewIds of [['unknown'],['city','city'],42])assert.throws(()=>validateView({...snapshot,overviewIds},nodeIds));
const defaults={categories:new Set(),relationships:new Set(),connectionDistance:1,pinnedIds:new Set(['city']),research};
const query=encodeState('https://example.test/',defaults,'test-edition');assert.deepEqual(decodeState(query,defaults).requestedResearch,research.steps.map(step=>({...step,note:''})), 'Shared research URLs retain record IDs while notes stay in saved artifacts');
const result={presentation:'Eight zoom levels: collision-free visible footprints, bounds and floating-window clearance',overview:'Packed degree-sized bubbles with small gap fillers; exact circular clearance at desktop and phone sizes',zoom:'Monotonic bubble growth and complete contained names for all 316 entities at three font sizes',layers:'Degree threshold, size priority, gradual opacity and persistent research anchors',research:'Ordered entity/connection pins, sourced connecting routes, honest gaps and notes',artifacts:'Research and workspace round trips, including visible overview IDs; embedded facts never imported'};
await mkdir('artifacts',{recursive:true});await writeFile('artifacts/semantic-checks.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
