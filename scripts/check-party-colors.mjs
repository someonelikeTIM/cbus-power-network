import assert from 'node:assert/strict';
import {nodes,sources,categories,relationships} from '../dist/data.js';
import {knownParty,connectionParty,normalizeColorMode,normalizeParty} from '../dist/party-colors.js';
import {affiliationRecords,affiliationSources,applyPartyAffiliations} from '../dist/party-affiliations.js';
import {encodeState,decodeState} from '../dist/routing.js';

const byId=new Map(nodes.map(node=>[node.id,node]));
assert.equal(knownParty(byId.get('amy-acton')),'Democratic');
assert.equal(knownParty(byId.get('vivek')),'Republican');
assert.equal(knownParty(byId.get('ohio-democrats')),'Democratic');
assert.equal(knownParty(byId.get('ohio-gop')),'Republican');
for(const id of ['dewine','tressel','jd-vance','trump','moreno','huffman','dave-yost','kasich','householder','mike-dovilla','triantafilou'])assert.equal(knownParty(byId.get(id)),'Republican',id);
for(const id of ['ginther','hardin','dorans','bankston','zach-klein','mitchell-j-brown'])assert.equal(knownParty(byId.get(id)),'Democratic',id);
for(const value of [' R ','(R)','Republican Party','REP'])assert.equal(normalizeParty(value),'Republican');
for(const value of [' D ','(D)','Democrat','DEM','Democratic Party'])assert.equal(normalizeParty(value),'Democratic');
const verified=new Set(sources.map(source=>source.id));
for(const source of affiliationSources)assert.ok(verified.has(source.id),'Checked source '+source.id);
for(const record of affiliationRecords){
  const node=byId.get(record.entityId);assert.equal(node.party,record.party);
  assert.ok(node.partyAffiliation.period&&node.partyAffiliation.locator);
  assert.ok(record.sourceIds.every(id=>node.sourceIds.includes(id)&&verified.has(id)));
  const fixture=[{id:node.id,sourceIds:[],role:'Original role',historical:true}];
  applyPartyAffiliations(fixture,new Set());assert.equal(fixture[0].party,undefined,'Unverified source cannot assign a party');
  applyPartyAffiliations(fixture,verified);assert.equal(fixture[0].party,node.party);assert.equal(fixture[0].role,'Original role');assert.equal(fixture[0].historical,true);
  assert.throws(()=>applyPartyAffiliations([{...fixture[0],party:node.party==='Republican'?'Democratic':'Republican'}],verified),/Conflicting affiliation/);
}
assert.ok(nodes.filter(node=>node.category==='politician').every(node=>typeof node.party==='string'),'Every official/candidate has an explicit party value or the roster’s unlisted/other-party qualification');
for(const id of ['aep','city','anduril','don-kissick','greg-levy','timothy-grady'])assert.equal(knownParty(byId.get(id)),null,id+' must not acquire a major-party affiliation');
const link=(source,target)=>connectionParty({source,target},byId);
assert.equal(link('amy-acton','aep'),'Democratic');
assert.equal(link('aep','vivek'),'Republican');
assert.equal(link('amy-acton','vivek'),null,'Cross-party links stay neutral');
assert.equal(link('city','aep'),null,'Unknown endpoints stay neutral');
assert.equal(link('ohio-gop','vivek'),'Republican');
assert.equal(link('dewine','amy-acton'),null,'Known cross-party appointment stays neutral');
assert.equal(link('dewine','aep'),'Republican','DeWine links use his recorded party');
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
