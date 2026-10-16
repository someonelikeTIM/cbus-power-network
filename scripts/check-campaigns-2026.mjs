import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {nodes,edges,sources,categories,relationships} from '../dist/data.js';
import {campaignSources,campaignNodes,campaignEdges,campaignRoster,campaignRelease,campaignUpdatedNodeIds,campaign2026EdgeIds} from '../dist/campaigns-2026.js';
import {sourceLiveEvidence} from '../dist/live-sources.js';
import {tagSelection,recordTags} from '../dist/tags.js';
import {explorerSearch} from '../dist/explorer-search.js';
import {filterGraph,shortestPath} from '../dist/core.js';
import {datasetFor,validateDataset} from '../dist/contract.js';
import {buildTimelineEvents,formatEventDate,timelineLanes,moneyKinds} from '../dist/timeline.js';
const sourceIds=new Set(sources.map(source=>source.id)),newIds=new Set(campaignNodes.map(node=>node.id)),baseIds=nodes.filter(node=>!newIds.has(node.id)||campaignUpdatedNodeIds.has(node.id)).map(node=>node.id);
assert.equal(campaignSources.length,15);assert.equal(campaignRoster.length,40);assert.equal(campaignEdges.length,79);
for(const source of campaignSources){assert.ok(sourceIds.has(source.id));assert.ok(sourceLiveEvidence[source.id].contentVerified);}
for(const source of campaignSources){const without=new Set(sourceIds);without.delete(source.id);const subset=campaignRelease(without,baseIds);assert.equal(subset.complete,false);assert.ok(subset.nodes.every(node=>!node.sourceIds.includes(source.id)));assert.ok(subset.edges.every(edge=>!edge.sourceIds.includes(source.id)));const ids=new Set([...baseIds,...subset.nodes.map(node=>node.id)]);assert.ok(subset.nodes.every(node=>(node.candidateIds||[]).every(id=>ids.has(id))));}
for(const row of campaignRoster){const node=nodes.find(node=>node.id===row.id);assert.ok(node);assert.equal(node.party,row.party);assert.equal(node.writeIn,row.writeIn);assert.equal(node.historical,false);assert.ok(node.sourceIds.includes('pc26-ballot'));assert.ok(recordTags('entity',row.id).includes('topic-campaigns-2026'));}
for(const edge of campaignEdges){assert.ok(relationships[edge.type]);assert.ok(edge.evidenceEntries.every(entry=>entry.locator));assert.equal(edge.claimReview.reviewer.type,'unknown');}
const options={categories:new Set(Object.keys(categories)),relationships:new Set(Object.keys(relationships)),history:true};
const view=filterGraph({...options,caseId:'campaigns2026'}),current=filterGraph({...options,caseId:'campaigns2026',history:false});
for(const id of ['amy-acton','vivek','don-kissick','sherrod-brown','husted','william-redpath','greg-levy','stephen-faris','renea-turner']){assert.ok(view.nodes.some(node=>node.id===id));assert.ok(current.nodes.some(node=>node.id===id));}
assert.ok(view.edges.some(edge=>edge.id==='t21'));assert.ok(view.edges.some(edge=>edge.id==='pc26-vpac-opposition'));assert.equal(edges.find(edge=>edge.id==='pc26-vpac-opposition').amount,undefined,'Opposition purpose does not create another payment');assert.deepEqual(edges.find(edge=>edge.id==='pc26-vpac-opposition').spendingRecordIds,['t21','t22']);
const money=tagSelection({nodes,edges},['topic-campaigns-2026','topic-donations']);
for(const id of ['pc26-aep-husted','pc26-kidspac-primary','pc26-kidspac-general','p25','d26-05'])assert.ok(money.matches.edges.has(id));
for(const id of ['pc26-thrive-gift','e73','t17','pc26-vpac-opposition','pc26-vivek-personal'])assert.ok(!money.matches.edges.has(id),'Non-campaign gifts, earlier elections and unclassified financing stay distinct');
assert.ok(explorerSearch({nodes,edges},'2026 political campaigns').some(item=>item.kind==='tag'&&item.id==='topic-campaigns-2026'));
assert.ok(shortestPath(view,'amy-acton','thrive-companies',{directed:false}),'Historical charitable context is explorable');
const aep=edges.filter(edge=>edge.source==='aep-pac'&&edge.target==='husted-campaign-2026');assert.equal(aep.length,1);assert.equal(aep[0].amount,5000);assert.equal(aep[0].fecTransactionId,'8AD73BC61A');assert.ok(aep[0].context.includes('void'));
const kids=edges.filter(edge=>edge.source==='kidspac'&&edge.target==='brown-campaign-2026');assert.equal(kids.length,2);assert.equal(kids.reduce((sum,row)=>sum+row.amount,0),10000);assert.equal(new Set(kids.map(row=>row.fecTransactionId)).size,2);
const cash=edges.find(edge=>edge.id==='pc26-vivek-personal');assert.equal(cash.status,'acknowledged');assert.equal(cash.timeline.date.precision,'unknown');assert.equal(cash.transactionDate,undefined);assert.ok(cash.context.includes('attributed statement')&&cash.context.includes('official filing ledger'));
for(const id of ['pc26-redpath-contributions','pc26-redpath-loans']){const edge=edges.find(edge=>edge.id===id);assert.equal(edge.timeline.date.precision,'period');assert.equal(edge.transactionDate,undefined);}
const brown=nodes.find(node=>node.id==='brown-campaign-2026');assert.equal(brown.externalIdentifiers[0].value,'C00916288');assert.equal(brown.financeSummaries[0].period.end,'2026-06-30');assert.equal(nodes.find(node=>node.id==='acton-campaign').committeeNameVerified,false);assert.equal(nodes.find(node=>node.id==='acton-campaign').financeSummaries[0].basis,'Campaign announcement');
for(const event of buildTimelineEvents(edges,sources)){assert.ok(timelineLanes[event.lane],event.id);assert.ok(moneyKinds[event.moneyKind],event.id);assert.ok(formatEventDate(event.date));}
validateDataset(datasetFor());
try{const before=JSON.parse(await readFile('artifacts/campaigns-2026/before.json','utf8'));for(const edge of before.edges)assert.deepEqual(edges.find(record=>record.id===edge.id),edge);for(const source of before.sources)assert.deepEqual(sources.find(record=>record.id===source.id),source);for(const node of before.nodes){const after=nodes.find(record=>record.id===node.id);assert.ok(after);if(!campaignUpdatedNodeIds.has(node.id))assert.deepEqual(after,node);else{for(const field of ['id','name','category','x','y'])assert.deepEqual(after[field],node[field]);assert.ok(node.sourceIds.every(id=>after.sourceIds.includes(id)));}}}catch(error){if(error.code!=='ENOENT')throw error;}
const result={roster:campaignRoster.length,newNodes:nodes.length-316,newConnections:campaignEdges.length,newCheckedSources:campaignSources.length,candidates:{amyActon:edges.filter(edge=>edge.source==='amy-acton'||edge.target==='amy-acton').length,vivekRamaswamy:edges.filter(edge=>edge.source==='vivek'||edge.target==='vivek').length},taggedConnections:edges.filter(edge=>campaign2026EdgeIds.has(edge.id)).length,coverage:'All listed candidates in the explicitly covered races; selective finance, not a complete donor ledger',distinctions:'Charity, candidate financing, PAC receipts, vendor payments, opposition and endorsements stay separate',preservation:'Earlier record IDs, relationship values and sources retained'};
await mkdir('artifacts/campaigns-2026',{recursive:true});await writeFile('artifacts/campaigns-2026/checks.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
