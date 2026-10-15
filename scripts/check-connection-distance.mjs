import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {categories,relationships} from '../dist/data.js';
import {filterGraph} from '../dist/core.js';
import {connectionNeighborhood,normalizeConnectionDistance,branchExploration} from '../dist/exploration.js';
import {encodeState,decodeState} from '../dist/routing.js';

const chain={nodes:[...Array.from({length:9},(_,index)=>({id:String(index)})),{id:'isolated'}],edges:Array.from({length:8},(_,index)=>({id:'link-'+index,source:String(index%2?index+1:index),target:String(index%2?index:index+1)}))};
chain.edges.push({...chain.edges[0],id:'parallel'});
const before=structuredClone(chain),ids=graph=>graph.nodes.map(node=>node.id);
const six=connectionNeighborhood(chain,'0');
assert.deepEqual(ids(six),['0','1','2','3','4','5','6'],'Exactly six steps, including incoming edges; no seventh-step or disconnected nodes');
assert.deepEqual(six.edges.map(edge=>edge.id),['link-0','link-1','link-2','link-3','link-4','link-5','parallel']);
assert.ok(six.nodes.every(node=>chain.nodes.includes(node))&&six.edges.every(edge=>chain.edges.includes(edge)),'Visible records retain their original objects and stable IDs');
assert.deepEqual(ids(connectionNeighborhood(chain,'6',1)),['5','6','7'],'Moving the center reveals nodes hidden by the previous center');
assert.deepEqual(ids(connectionNeighborhood(chain,'0',1)),['0','1']);
assert.deepEqual(ids(connectionNeighborhood(chain,'0',8)),['0','1','2','3','4','5','6','7','8']);
assert.deepEqual(connectionNeighborhood(chain,'0','all'),chain,'Unlimited view restores disconnected explored records too');
assert.equal(connectionNeighborhood(chain,'missing',6).nodes.length,0);
assert.deepEqual(chain,before,'Distance filtering does not delete or modify exploration history');
const shortcut={...chain,edges:[...chain.edges,{id:'shortcut',source:'0',target:'8'},{id:'cycle',source:'2',target:'0'}]};
assert.ok(ids(connectionNeighborhood(shortcut,'0',2)).includes('7'),'Distance follows the shortest route through cycles and alternate connections');
const cut={...chain,edges:chain.edges.filter(edge=>edge.id!=='link-3')};
assert.deepEqual(ids(connectionNeighborhood(cut,'0',6)),['0','1','2','3'],'Unavailable/filtered connections do not bridge a gap');
const seeds=new Set(ids(chain)),opened=new Set(['0','6']),history=branchExploration(chain,seeds,opened);
connectionNeighborhood(chain,'0',1);assert.deepEqual(branchExploration(chain,seeds,opened),history,'Presentation changes leave protected seeds and open branches untouched');
for(const value of [null,'',0,-1,13,1.5,'bogus'])assert.equal(normalizeConnectionDistance(value),6);
for(const value of [1,6,12,'all'])assert.equal(normalizeConnectionDistance(value),value);

const defaults={view:'network',caseId:'all',history:true,categories:new Set(Object.keys(categories)),relationships:new Set(Object.keys(relationships)),connectionDistance:6};
for(const distance of [1,6,12,'all']){
  const state={...defaults,connectionDistance:distance,focus:true,selected:{kind:'node',id:'aep'},exploredIds:seeds,explorationSeeds:seeds,openNodes:opened};
  const restored=decodeState(encodeState('https://example.test/cbus-power-network/',state,'local'),defaults);
  assert.equal(restored.connectionDistance,distance);assert.deepEqual(restored.explorationSeeds,seeds);assert.deepEqual(restored.openNodes,opened);assert.equal(restored.selected.id,'aep');
}
for(const value of ['0','-1','13','1.5','bogus'])assert.equal(decodeState('https://example.test/?distance='+value,defaults).connectionDistance,6);
assert.equal(decodeState('https://example.test/?distance=1',{...defaults,connectionDistance:3}).connectionDistance,1,'A shared URL overrides the local preference');
assert.equal(decodeState('https://example.test/',{...defaults,connectionDistance:3}).connectionDistance,3,'Fresh views can use the saved preference without preloading nodes');

const full=filterGraph(defaults),actual=[1,2,3,6,12,'all'].map(distance=>{const visible=connectionNeighborhood(full,'aep',distance);return {distance,entities:visible.nodes.length,connections:visible.edges.length,hidden:full.nodes.length-visible.nodes.length};});
const result={defaultDistance:6,adjustable:'1 through 12, or all explored nodes',traversal:'shortest undirected route in the explored, filtered graph',boundary:'six included; seven hidden',records:'original IDs and objects',history:'preserved across center and distance changes',urls:'distance, seeds and open branches round-trip; invalid values fall back safely',aepWholeNetwork:actual};
await writeFile('artifacts/connection-distance-checks.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
