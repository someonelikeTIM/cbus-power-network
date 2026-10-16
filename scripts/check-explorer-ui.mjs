import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {relationships,categories,edges} from '../dist/data.js';
import {detailsWidth,pairedRelationships,relationshipIcons} from '../dist/explorer-ui.js';
import {encodeState,decodeState} from '../dist/routing.js';

assert.equal(detailsWidth(420,1280),420);
assert.equal(detailsWidth(-100,1280),320);
assert.equal(detailsWidth(5000,1280),1256);
assert.equal(detailsWidth(5000,1280,true),1000,'Docking reserves map space');
assert.equal(detailsWidth(5000,375,true),225,'Narrow docking still leaves a usable map strip');
assert.equal(detailsWidth(-100,375),180);
for(const width of [375,720,1280])for(const docked of [false,true])for(const request of [-50,180,420,1500]){
  const actual=detailsWidth(request,width,docked);assert.ok(actual>=160&&actual<=width-16);
}
for(const id of Object.keys(relationships))assert.ok(relationshipIcons[id]?.length>5,`Missing semantic icon for ${id}`);
const fixture=[{id:'money',source:'a',target:'b'},{id:'control',source:'a',target:'b'},{id:'reverse',source:'b',target:'a'},{id:'other',source:'b',target:'c'}];
const paired=pairedRelationships(fixture,fixture[0]);assert.deepEqual(paired.map(edge=>edge.id),['money','control','reverse']);assert.ok(paired.every(edge=>fixture.includes(edge)),'Parallel details preserve individual records');
assert.deepEqual(pairedRelationships(edges,edges.find(edge=>edge.id==='e48')).map(edge=>edge.id),['e48','e49']);
const state={view:'network',caseId:'all',history:true,categories:new Set(Object.keys(categories)),relationships:new Set(Object.keys(relationships)),selected:{kind:'edge',id:'e48'},focus:true,focusEntity:'aep',connectionDistance:6};
const restored=decodeState(encodeState('https://example.test/cbus-power-network/',state,'local'),state);assert.equal(restored.focusEntity,'aep');assert.equal(restored.selected.id,'e48');assert.equal(restored.focus,true);assert.equal(restored.connectionDistance,6);
const selectedNeighbor={...state,selected:{kind:'node',id:'city'}};
const restoredNeighbor=decodeState(encodeState('https://example.test/cbus-power-network/',selectedNeighbor,'local'),state);assert.equal(restoredNeighbor.focusEntity,'aep');assert.equal(restoredNeighbor.selected.id,'city');
const result={details:'420px default; bounded resizing in floating and docked modes',icons:Object.keys(relationshipIcons).length,parallelRecords:'e48 and e49 remain separate, with original IDs',connectionView:'selected relationship and centered entity round-trip without losing distance'};
await writeFile('artifacts/explorer-ui-checks.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
