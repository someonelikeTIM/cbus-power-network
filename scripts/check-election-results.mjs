import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {nodes,edges,sources,cases} from '../dist/data.js';
import {campaignRoster} from '../dist/campaigns-2026.js';
import {electionResults,electionResultSources,applyElectionResults} from '../dist/election-results-2026.js';
import {buildTimelineEvents} from '../dist/timeline.js';
const byId=new Map(nodes.map(node=>[node.id,node])),sourceIds=new Set(sources.map(source=>source.id));
assert.equal(electionResults.races.length,10);assert.equal(electionResults.certified,false);
assert.equal(electionResults.electionDate,'2026-11-03');
for(const row of campaignRoster){const result=byId.get(row.id).electionResult;assert.ok(result);assert.equal(result.status,'unofficial');assert.equal(result.certified,false);assert.equal(result.officeAssumed,false);assert.equal(result.electionDate,'2026-11-03');assert.ok(sourceIds.has(result.sourceId));}
assert.equal(byId.get('don-leonard').electionResult.votes,149287,'Use full OH-15 district votes, not Franklin County-only 122451');
assert.equal(byId.get('carey').electionResult.votes,130225,'Use full OH-15 district votes, not Franklin County-only 69270');
assert.equal(byId.get('amy-acton').electionResult.votes,2404178);
assert.deepEqual(byId.get('amy-acton').electionResult.selectionCandidateIds,['amy-acton','david-pepper']);
assert.equal(byId.get('david-pepper').electionResult.votes,2404178,'One shared ticket count');
assert.equal(byId.get('larose').electionResult.standing,'leading');
assert.equal(byId.get('annette-blackwell').electionResult.standing,'trailing');
assert.equal(byId.get('gary-josephson').writeIn,true,'Official result classification corrects the current display while retaining the original roster');
assert.equal(campaignRoster.find(row=>row.id==='gary-josephson').writeIn,false);
for(const id of ['ron-ula','michael-lehnerd']){assert.equal(byId.get(id).electionResult.votes,null);assert.equal(byId.get(id).electionResult.standing,'not-reported');}
const results=edges.filter(edge=>edge.id.startsWith('er26-'));assert.equal(results.length,10);
for(const edge of results){assert.equal(edge.amount,undefined,'Votes never become financial amounts');assert.equal(edge.timeline.moneyKind,'none');assert.equal(edge.timeline.date.start,'2026-11-03');assert.equal(edge.claimReview.reviewer.type,'unknown');assert.ok(edge.label.includes('unofficial'));}
assert.equal(buildTimelineEvents(edges,sources).filter(event=>event.lane==='elections').length,10);
assert.ok(cases.campaigns2026.summary.includes('certification remains pending'));
for(const omitted of electionResultSources){
 const fresh=nodes.map(node=>({...node,role:'baseline',description:'baseline',sourceIds:['pc26-ballot'],electionResult:undefined})),links=[];
 applyElectionResults(fresh,links,new Set(electionResultSources.filter(source=>source.id!==omitted.id).map(source=>source.id)));
 if(omitted.id==='er26-results-notice'){assert.equal(links.length,0);assert.ok(fresh.every(node=>!node.electionResult));}
 else for(const race of electionResults.races.filter(race=>race.sourceId===omitted.id)){assert.ok(fresh.filter(node=>node.campaignRaceId===race.raceId).every(node=>!node.electionResult));assert.ok(!links.some(edge=>edge.target===race.raceId));}
}
try{
 const before=JSON.parse(await readFile('artifacts/research/baseline-dataset.json','utf8'));
 for(const old of before.entities){const node=byId.get(old.id);assert.ok(node);assert.equal(node.x,old.x);assert.equal(node.y,old.y);assert.ok(old.sourceIds.every(id=>node.sourceIds.includes(id)));}
 for(const old of before.relationships){const current=edges.find(edge=>edge.id===old.id);assert.ok(current);for(const key of Object.keys(current))assert.deepEqual(current[key],old[key],old.id+' '+key);}
 const rawBefore=JSON.parse(await readFile('dist/downloads/2026-11-02/sources.json','utf8')).records;
 const {publicSource}=await import('../dist/contract.js');for(const old of rawBefore)assert.deepEqual(publicSource(sources.find(source=>source.id===old.id)),old);
}catch(error){if(error.code!=='ENOENT')throw error;}
console.log('PASS post-election results: 10 scoped unofficial races, 40 ballot records, ticket counts, unknown results, source gates and preserved prior records.');
