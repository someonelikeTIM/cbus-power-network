import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {nodes,edges,categories,relationships} from '../dist/data.js';
import {filterGraph} from '../dist/core.js';
import {tagDefinitions,entityTags,connectionTags,recordTags,tagMatches,tagForeground,taggedGraph,tagSelection,normalizeTags} from '../dist/tags.js';
import {pathCamera} from '../dist/exploration-paths.js';
import {encodeState,decodeState} from '../dist/routing.js';
import {explorerSearch} from '../dist/explorer-search.js';
import {donationEdges} from '../dist/donation-enrichment.js';
const defaults={view:'network',caseId:'all',connectionMode:'all',history:true,categories:new Set(Object.keys(categories)),relationships:new Set(Object.keys(relationships)),tag:''},full=filterGraph(defaults),before=JSON.stringify(full);
assert.deepEqual(explorerSearch(full,'  '),[]);
for(const query of ['Lobbyist','  # LOBBYIST  ']){const result=explorerSearch(full,query)[0];assert.equal(result.kind,'tag');assert.equal(result.id,'topic-lobbyist');assert.equal(result.entityCount,14);}
assert.ok(explorerSearch(full,'lobby').some(result=>result.id==='topic-lobbyist'),'Partial tag names are searchable');
for(const query of ['campaign donations','donations campaign','campaign donation']){const result=explorerSearch(full,query)[0];assert.equal(result.id,'topic-donations');assert.equal(result.connectionCount,tagMatches(full,'topic-donations').edges.size);}
assert.equal(explorerSearch(full,'waived competitive bidding')[0].id,'topic-bidding');
assert.equal(explorerSearch(full,'Bill Byers')[0].id,'bill-byers');
assert.ok(explorerSearch(full,'lobbyist').some(result=>result.kind==='entity'),'Roles remain searchable alongside tags');
assert.deepEqual(explorerSearch({nodes:[],edges:[]},'lobbyist'),[],'Tag search respects current dataset filters');
assert.ok(!explorerSearch({...full,edges:full.edges.filter(edge=>edge.type!=='money')},'campaign donations').some(result=>result.kind==='tag'),'Tags with no filtered matches are absent');
assert.deepEqual(explorerSearch(full,'there-is-no-such-tag'),[]);
for(const node of nodes){assert.ok(recordTags('entity',node.id).length);for(const tag of recordTags('entity',node.id))assert.ok(tagDefinitions[tag]);}
for(const node of nodes.filter(node=>node.historical))assert.ok(recordTags('entity',node.id).includes('topic-historical'));
for(const edge of edges){assert.ok(recordTags('connection',edge.id).length);for(const tag of recordTags('connection',edge.id))assert.ok(tagDefinitions[tag]);}
assert.ok(entityTags(nodes.find(node=>node.id==='bill-byers')).includes('topic-lobbyist'));assert.ok(!entityTags(nodes.find(node=>node.id==='aep')).includes('topic-lobbyist'));
for(const id of ['andrew-minton','george-mccue','capobianco'])assert.ok(entityTags(nodes.find(node=>node.id===id)).includes('topic-lobbyist'),'An explicit registered-agent role or relationship supplies the tag');
for(const label of ['Competitive bidding not waived','Competitive bidding never waived','Waiver of competitive bidding requested'])assert.ok(!connectionTags({id:'fixture',type:'contract',label}).includes('topic-bidding'));
assert.ok(connectionTags({id:'fixture',type:'contract',label:'Competitive bidding waived'}).includes('topic-bidding'));
const charity=edges.find(edge=>/charity donation/i.test(edge.label));assert.ok(charity);assert.ok(!connectionTags(charity).includes('topic-donations'));
const lobbying=taggedGraph(full,'topic-lobbyist'),foreground=tagForeground(lobbying,'topic-lobbyist');assert.ok(lobbying.nodes.some(node=>node.id==='aep'));assert.ok(!foreground.nodes.has('aep'),'Employers stay context, not classified as lobbyists');assert.ok(foreground.nodes.has('bill-byers'));
for(const tag of Object.keys(tagDefinitions)){const graph=taggedGraph(full,tag);assert.ok(graph.nodes.every(node=>nodes.includes(node)));assert.ok(graph.edges.every(edge=>edges.includes(edge)));}
assert.equal(JSON.stringify(full),before,'Tag discovery does not mutate raw records or the explored graph');
const state={...defaults,tags:new Set(['topic-lobbyist']),mapMode:'explore',customStart:true,startingIds:new Set(['aep']),explorationSeeds:new Set(['aep']),exploredIds:new Set(['aep']),openNodes:new Set()};
const restored=decodeState(encodeState('https://example.test/',state,'local'),defaults);assert.deepEqual(restored.tags,state.tags);assert.deepEqual(restored.explorationSeeds,state.explorationSeeds);
const tagOnly=decodeState('https://example.test/?tag=topic-lobbyist',defaults);assert.equal(tagOnly.caseId,'all');assert.equal(tagOnly.connectionMode,'all');assert.equal(tagOnly.startingIds.size,0);assert.deepEqual([...tagOnly.tags],['topic-lobbyist']);
assert.equal(decodeState('https://example.test/?tag=unknown',defaults).tags.size,0);
assert.deepEqual(normalizeTags(['topic-lobbyist','unknown','topic-lobbyist','__proto__']),['topic-lobbyist']);
const pair=['topic-lobbyist','topic-donations'],legacyFixture={...full,edges:full.edges.filter(edge=>!donationEdges.some(added=>added.id===edge.id))},combined=taggedGraph(legacyFixture,pair),selection=tagSelection(legacyFixture,pair);
assert.deepEqual(combined.nodes.map(node=>node.id),['raphael','ohio-democrats','ginther-campaign']);assert.deepEqual(combined.edges.map(edge=>edge.id),['e72','e73']);assert.deepEqual([...selection.matches.nodes],['raphael']);assert.deepEqual([...selection.matches.edges],['e73']);assert.deepEqual([...selection.connectors],['e72']);
assert.deepEqual(taggedGraph(legacyFixture,[...pair].reverse()).edges,combined.edges,'Tag order cannot alter matched paths');
assert.deepEqual(taggedGraph(full,['entity-person','topic-lobbyist']).matches,[...tagMatches(full,'topic-lobbyist').nodes],'Two entity tags apply to the same entity');
assert.deepEqual([...tagSelection(full,['connection-money','topic-donations']).matches.edges],[...tagMatches(full,'topic-donations').edges],'Two connection tags apply to the same record');
assert.equal(taggedGraph(full,['entity-person','entity-corporation']).nodes.length,0,'Conflicting categories have no match');
assert.equal(taggedGraph({...legacyFixture,edges:legacyFixture.edges.filter(edge=>edge.id!=='e72')},pair).nodes.length,0,'Removing the bridge removes the original indirect match');
assert.equal(taggedGraph({...legacyFixture,edges:legacyFixture.edges.filter(edge=>edge.id!=='e73')},pair).nodes.length,0,'A different contribution is not substituted across a longer path');
const directFixture={...full,edges:full.edges.map(edge=>edge.id==='e73'?{...edge,source:'raphael'}:edge)};assert.ok(taggedGraph(directFixture,pair).edges.some(edge=>edge.id==='e73'),'Direct connections also qualify');
assert.ok(taggedGraph(full,[...pair,'topic-historical']).edges.some(edge=>edge.id==='e73'),'Shared record tags can match an anchor or its selected relationship');
const narrowed=explorerSearch(full,'campaign donations',['topic-lobbyist'])[0];assert.equal(narrowed.connectionCount,tagSelection(full,pair).matches.edges.size);assert.equal(narrowed.combined,true);
assert.equal(explorerSearch(full,'Lobbyist',pair)[0].active,true);
const comboState={...state,tags:new Set(pair)},comboURL=encodeState('https://example.test/',comboState,'local');assert.deepEqual(decodeState(comboURL,defaults).tags,comboState.tags);assert.ok(new URL(comboURL).searchParams.has('tags'));
assert.deepEqual([...decodeState('https://example.test/?tags=topic-lobbyist,unknown,topic-donations,topic-lobbyist',defaults).tags],pair);
assert.ok(!new URL(encodeState('https://example.test/',{...comboState,tags:new Set()},'local')).searchParams.has('tags'));
assert.ok(!new URL(encodeState('https://example.test/',{...comboState,view:'sources'},'local')).searchParams.has('tags'));
assert.equal(JSON.stringify(full),before,'Combined search never modifies raw records');
await writeFile('artifacts/combined-tags-checks.json',JSON.stringify({tags:pair,entities:combined.nodes.map(node=>node.id),relationships:combined.edges.map(edge=>edge.id),matches:selection.byTag,connectors:[...selection.connectors],connectionLimit:selection.connectionLimit,sameRecordIntersections:true,directAndIntermediaryPaths:true,filterGaps:true,incompatibleCombinations:true,orderIndependent:true,legacyAndCombinedURLs:true,rawDataPreserved:true},null,2)+'\n');
const points=new Map([['start',{x:-100,y:0}],['end',{x:100,y:0}],['context',{x:100000,y:-100000}]]),viewport={left:40,top:100,width:600,height:400},camera=pathCamera(points,['start','end'],viewport);
assert.equal(camera.z,2,'Distant explored context does not determine path zoom');
for(const id of ['start','end']){const p=points.get(id),x=p.x*camera.z+camera.x,y=p.y*camera.z+camera.y;assert.ok(x>=viewport.left+60&&x<=viewport.left+viewport.width-60);assert.ok(y>=viewport.top+60&&y<=viewport.top+viewport.height-60);}
const result={taggedEntities:nodes.length,taggedConnections:edges.length,labels:Object.keys(tagDefinitions).length,lobbyists:tagMatches(full,'topic-lobbyist').nodes.size,campaignDonations:tagMatches(full,'topic-donations').edges.size,biddingWaivers:edges.filter(edge=>connectionTags(edge).includes('topic-bidding')).map(edge=>({id:edge.id,label:edge.label})),scope:'matches plus one-step context; original objects and record IDs',pathCamera:'fits route only, ignoring distant context',urlState:'tag and exploration seeds round-trip; fresh tag link starts with all topics and connections'};
await writeFile('artifacts/tags-path-focus-checks.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
