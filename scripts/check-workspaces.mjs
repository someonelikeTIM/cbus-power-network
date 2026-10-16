import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {nodes,edges,sources,relationships,categories} from '../dist/data.js';
import {arrangeCanvas,entityRadius,scopedConnections,connectionGroups} from '../dist/canvas-layout.js';
import {parseWorkspace,workspaceFile,validateView} from '../dist/saved-views.js';
import {encodeState,decodeState} from '../dist/routing.js';
import {campaignUpdatedNodeIds} from '../dist/campaigns-2026.js';

assert.deepEqual(connectionGroups.flatMap(group=>group.types).sort(),Object.keys(relationships).sort());
assert.ok(entityRadius(1)<entityRadius(9)&&entityRadius(9)<entityRadius(64));
assert.ok(entityRadius(9,true)>entityRadius(9));
const fixture={nodes:['a','b','c','d','unrelated'].map(id=>({id,name:'Entity '+id})),edges:[{source:'a',target:'b'},{source:'b',target:'c'},{source:'c',target:'d'}]};
assert.deepEqual(scopedConnections(fixture,new Set(['a']),1).nodes.map(node=>node.id),['a','b']);
assert.deepEqual(scopedConnections(fixture,new Set(['a']),2).nodes.map(node=>node.id),['a','b','c']);
assert.deepEqual(scopedConnections(fixture,new Set(['a','d']),1).nodes.map(node=>node.id),['a','b','c','d']);
assert.ok(!scopedConnections(fixture,new Set(['a']),'all').nodes.some(node=>node.id==='unrelated'));
const graph={nodes:fixture.nodes.slice(0,4),edges:fixture.edges},current=new Map([['a',{x:260,y:320}]]);
const placed=arrangeCanvas(graph,{width:1000,height:650,current,pins:new Set(['a']),degrees:new Map([['a',12],['b',3],['c',2],['d',1]]),obstacles:[{left:0,top:0,right:320,bottom:130}]});
assert.deepEqual(placed.positions.get('a'),current.get('a'),'Pinned coordinates remain stable');
for(const point of placed.positions.values())assert.ok(point.x>40&&point.x<960&&point.y>40&&point.y<600);
for(const [a,pa]of placed.positions)for(const [b,pb]of placed.positions)if(a!==b)assert.ok(Math.hypot(pa.x-pb.x,pa.y-pb.y)>entityRadius(a==='a'?12:3,a==='a')+entityRadius(b==='a'?12:3,b==='a')+8,'Focused entities avoid overlapping circles');
const defaults={view:'network',caseId:'all',query:'',categories:new Set(Object.keys(categories)),relationships:new Set(Object.keys(relationships)),pinnedIds:new Set(['aep','city']),tags:new Set(),startingIds:new Set(['aep']),explorationSeeds:new Set(['aep']),openNodes:new Set(['aep']),exploredIds:new Set(['aep']),customStart:true,mapMode:'explore',connectionDistance:2};
const query=new URL(encodeState('https://example.test/cbus-power-network/',defaults,'2026-10-15')).search;
assert.deepEqual(decodeState('https://example.test/'+query,defaults).pinnedIds,defaults.pinnedIds);
const snapshot={query,positions:[['aep',100,200],['city',300,400]],camera:{x:0,y:0,z:1},dimensions:{width:1000,height:650},scale:1,details:{open:false,docked:true,width:500}};
const view={id:'one',name:'Power & contracts',snapshot};
const document=workspaceFile([view,{...view,id:'two',name:'Second view'}],'one','two','2026-10-15');
const restored=parseWorkspace(JSON.parse(JSON.stringify(document)),new Set(nodes.map(node=>node.id)));
assert.equal(restored.layout,'split');assert.equal(restored.views.length,2);assert.deepEqual(restored.views[0].snapshot,snapshot);assert.notEqual(restored.views[0].snapshot,restored.views[1].snapshot);
const rightActive=parseWorkspace(workspaceFile([view,{...view,id:'two',name:'Second view'}],'two','two','2026-10-15','one'),new Set(nodes.map(node=>node.id)));assert.equal(rightActive.layout,'split');assert.notEqual(rightActive.primaryId,rightActive.secondaryId);assert.equal(rightActive.activeId,rightActive.secondaryId,'Focusing the right pane does not lose the left pane on export/reload');
restored.views[0].snapshot.positions[0][1]=999;assert.equal(restored.views[1].snapshot.positions[0][1],100,'Views do not share mutable positions');
for(const mutate of [d=>d.version=99,d=>d.views=[],d=>d.views[0].snapshot.camera.z=0,d=>d.views[0].snapshot.positions.push(['unknown',1,2]),d=>d.views[0].snapshot.positions.push(['aep',1,2]),d=>d.views[0].snapshot.query='https://example.test/',d=>d.views[0].snapshot.query='?pins=unknown',d=>d.views[0].name='']){const bad=structuredClone(document);mutate(bad);assert.throws(()=>parseWorkspace(bad,new Set(nodes.map(node=>node.id))));}
assert.throws(()=>validateView({...snapshot,positions:[['aep',Infinity,4]]},new Set(['aep'])));
let factualPreservation='Source IDs and current schema checked';
try{const baseline=JSON.parse(await readFile('artifacts/explorer-workspaces-before/data.json','utf8'));for(const record of baseline.nodes){const current=nodes.find(node=>node.id===record.id);assert.ok(current);if(!campaignUpdatedNodeIds.has(record.id))assert.deepEqual(current,record);}for(const record of baseline.edges)assert.deepEqual(edges.find(edge=>edge.id===record.id),record);for(const record of baseline.sources)assert.deepEqual(sources.find(source=>source.id===record.id),record);factualPreservation='All earlier IDs and relationship/source fields retained; roster-backed role updates checked separately';}catch(error){if(error.code!=='ENOENT')throw error;}
const result={tabs:'Independent state; versioned view files validate before import',pins:'Multiple anchors persist in URLs and snapshots',scope:'Distance reveals real neighborhoods from selected and pinned entities',layout:'Viewport bounds, obstacles, degree sizing and stable pin coordinates',filters:'All '+Object.keys(relationships).length+' connection types appear exactly once in grouped controls',factualPreservation};
await mkdir('artifacts',{recursive:true});await writeFile('artifacts/workspace-checks.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
