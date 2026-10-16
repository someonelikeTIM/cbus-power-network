import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {nodes,edges} from '../dist/data.js';
import {networkPositions,frameNetwork,networkStyle,showNetworkLabel} from '../dist/desktop-network.js';
import {researchConnections,validateResearch,researchFile,researchSnapshot} from '../dist/research-paths.js';
import {validateView,workspaceFile,parseWorkspace} from '../dist/saved-views.js';
import {encodeState,decodeState} from '../dist/routing.js';
const original=JSON.stringify({nodes,edges}),positions=networkPositions({nodes,edges}),before=[...positions].map(([id,p])=>[id,{...p}]);
assert.equal(positions.size,nodes.length,'The network layout includes every entity, without a selective overview cap');
assert.deepEqual(networkPositions({nodes:[...nodes].reverse(),edges:[...edges].reverse()}),positions,'Layout is deterministic and independent of record ordering');
assert.equal(JSON.stringify({nodes,edges}),original,'World layout never mutates source records');
for(const [width,height]of [[1280,720],[1600,900],[1920,1080]]){
 const camera=frameNetwork(positions.keys(),positions,{width,height});
 for(const point of positions.values()){assert.ok(Number.isFinite(point.x)&&Number.isFinite(point.y));assert.ok(point.x*camera.z+camera.x>=54&&point.x*camera.z+camera.x<=width-54);assert.ok(point.y*camera.z+camera.y>=54&&point.y*camera.z+camera.y<=height-54);}
}
for(const zoom of [.08,.2,.5,1,2,3.5])for(const degree of [0,1,4,20,100]){assert.ok(networkStyle(degree,zoom).radius>=3);assert.equal(networkStyle(degree,zoom).opacity,1,'Zoom never suppresses entities');assert.equal(showNetworkLabel(degree,zoom,{selected:true}),true);}
assert.deepEqual([...positions],before,'Framing and semantic labels leave all world coordinates untouched');
const desktopSnapshot=validateView({query:'',positions:[],camera:{x:0,y:0,z:.2},mapLayout:'stable-network-v1',details:{open:true,width:500,height:350}},new Set(nodes.map(n=>n.id)));
assert.equal(desktopSnapshot.mapLayout,'stable-network-v1');assert.equal(desktopSnapshot.details.height,350);
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
const result={presentation:'Desktop network: all '+nodes.length+' entities and '+edges.length+' connections, stable world coordinates, label detail changes with zoom',layout:'Deterministic world layout; explicit framing at 1280, 1600 and 1920 pixels; no viewport packing',research:'Original record IDs, notes, source paths and honest gaps preserved',artifacts:'Legacy saved views remain valid; new desktop layout and context height round-trip'};
await mkdir('artifacts',{recursive:true});await writeFile('artifacts/semantic-checks.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
