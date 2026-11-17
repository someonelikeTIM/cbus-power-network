import assert from 'node:assert/strict';
import {nodes,categories,relationships} from '../dist/data.js';
import {knownParty,connectionParty,normalizeColorMode} from '../dist/party-colors.js';
import {encodeState,decodeState} from '../dist/routing.js';

const byId=new Map(nodes.map(node=>[node.id,node]));
assert.equal(knownParty(byId.get('amy-acton')),'Democratic');
assert.equal(knownParty(byId.get('vivek')),'Republican');
assert.equal(knownParty(byId.get('ohio-democrats')),'Democratic');
assert.equal(knownParty(byId.get('ohio-gop')),'Republican');
for(const id of ['aep','city','anduril','don-kissick','greg-levy','timothy-grady'])assert.equal(knownParty(byId.get(id)),null,id+' must not acquire a major-party affiliation');
const link=(source,target)=>connectionParty({source,target},byId);
assert.equal(link('amy-acton','aep'),'Democratic');
assert.equal(link('aep','vivek'),'Republican');
assert.equal(link('amy-acton','vivek'),null,'Cross-party links stay neutral');
assert.equal(link('city','aep'),null,'Unknown endpoints stay neutral');
assert.equal(link('ohio-gop','vivek'),'Republican');
assert.equal(knownParty(byId.get('aep')),null,'Link coloring never changes an endpoint affiliation');
const defaults={view:'network',caseId:'all',categories:new Set(Object.keys(categories)),relationships:new Set(Object.keys(relationships)),connectionDistance:1,history:true,colorMode:'type'};
for(const colorMode of ['party','type'])for(const connectionDistance of [1,2,3,4,5,6,'all']){
  const restored=decodeState(encodeState('https://example.test/',{...defaults,colorMode,connectionDistance},'local'),defaults);
  assert.equal(restored.colorMode,colorMode);assert.equal(restored.connectionDistance,connectionDistance);
}
assert.equal(decodeState('https://example.test/?colors=invalid',defaults).colorMode,'type');
assert.equal(decodeState('https://example.test/?colors=type',{...defaults,colorMode:'party'}).colorMode,'type');
assert.equal(decodeState(encodeState('https://example.test/',{...defaults,colorMode:'type'},'local'),{...defaults,colorMode:'party'}).colorMode,'type','Saved type colors override another browser preference');
assert.equal(normalizeColorMode(null),'type');
console.log('PASS party colors: sourced affiliation, unknown/other/cross-party neutrality, no propagation, URL and depth round trips.');
