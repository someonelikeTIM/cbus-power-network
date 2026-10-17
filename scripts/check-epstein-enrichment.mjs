import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {nodes,edges,sources,categories,relationships,meta} from '../dist/data.js';
import {epsteinNodes,epsteinEdges,epsteinSources,epsteinRelease} from '../dist/epstein-enrichment.js';
import {datasetFor,evidencePacket,validateDataset,release} from '../dist/contract.js';
import {filterGraph,shortestPath} from '../dist/core.js';
import {buildTimelineEvents,moneyKinds} from '../dist/timeline.js';

const sourceIds=new Set(sources.map(source=>source.id)),nodeIds=new Set(nodes.map(node=>node.id));
assert.equal(meta.epsteinState,'complete');
assert.ok(epsteinSources.every(source=>sourceIds.has(source.id)));
assert.equal(epsteinRelease(sourceIds,nodeIds).edges.length,12);
const withoutAgreement=new Set([...sourceIds].filter(id=>id!=='ep26-osu-agreement'));
const gated=epsteinRelease(withoutAgreement,nodes.filter(node=>!epsteinNodes.some(added=>added.id===node.id)).map(node=>node.id));
assert.equal(gated.complete,false);
assert.ok(!gated.edges.some(edge=>['ep26-04','ep26-05','ep26-08','ep26-09'].includes(edge.id)),'Unverified scans cannot release their relationships');
const record=id=>edges.find(edge=>edge.id===id),events=buildTimelineEvents(edges,sources),event=id=>events.find(event=>event.primaryEdgeId===id);
assert.equal(record('ep26-01').amount,260000);
assert.ok(!epsteinEdges.some(edge=>edge.amount===75000||edge.amount===335000||edge.amount===5000000),'Unconfirmed pledges and the fulfilled agreement are not added as receipts');
assert.equal(record('ep26-04').source,'couq');assert.equal(record('ep26-05').source,'les-wexner-charitable-fund');
assert.equal(record('ep26-04').amount+record('ep26-05').amount,5000000);
assert.equal(record('ep26-04').evidenceEntries.find(entry=>entry.sourceId==='ep26-osu-review').role,'qualify');
assert.equal(record('ep26-06').amount,undefined);assert.equal(record('ep26-07').amount,undefined,'The two origin records do not create extra transfers');
assert.equal(event('ep26-04').date.precision,'month');assert.equal(event('ep26-04').date.start,'2007-05-01');
assert.equal(record('ep26-04').checkDate,'2007-05-02');assert.equal(record('ep26-04').transactionDate,undefined);
assert.equal(event('ep26-05').date.role,'Check dated');
assert.equal(event('ep26-10').moneyKind,'commitment');assert.equal(moneyKinds[event('ep26-10').moneyKind].group,'commitments');
assert.equal(event('ep26-12').date.start,'2026-02-18');assert.equal(sources.find(source=>source.id==='ep26-house-deposition').date,'2026-02-19');
assert.equal(record('ep26-12').type,'affiliation');assert.equal(record('ep26-12').status,'documented');
const graph=filterGraph({categories:new Set(Object.keys(categories)),relationships:new Set(Object.keys(relationships)),caseId:'epstein',history:true});
assert.equal(graph.edges.length,21);assert.equal(graph.nodes.length,15);
assert.ok(shortestPath(graph,'epstein','ohio-state'));
const packet=evidencePacket({kind:'edge',id:'ep26-04'});validateDataset(packet);
assert.deepEqual(new Set(packet.sources.map(source=>source.id)),new Set([...record('ep26-04').sourceIds,...packet.entities.flatMap(node=>node.sourceIds)]),'Packets retain both relationship evidence and entity provenance');
assert.equal(packet.relationships[0].claimReview.reviewer.type,'unknown');
assert.ok(['local-candidate','published'].includes(release.status));
if(release.status==='published')assert.ok(Number.isFinite(Date.parse(release.publishedAt)),'Published editions require a publication timestamp');else assert.equal(release.publishedAt,null);
const data=datasetFor();
// An optional local receipt compares the complete preceding edition without shipping private artifacts.
try{
  const before=JSON.parse(await readFile('artifacts/epstein-enrichment/baseline.json','utf8'));
  for(const name of ['entities','relationships','sources','events'])for(const old of before[name])assert.deepEqual(data[name].find(record=>record.id===old.id),old,`${name}: preserve ${old.id}`);
}catch(error){if(error.code!=='ENOENT')throw error;}
const result={edition:release.releaseId,added:{entities:epsteinNodes.length,relationships:epsteinEdges.length,sources:epsteinSources.length},case:{entities:graph.nodes.length,relationships:graph.edges.length,sources:new Set(graph.edges.flatMap(edge=>edge.sourceIds)).size},distinctions:['Confirmed receipts versus unconfirmed pledge','COUQ route versus the two origin funds','Separate payments versus the fulfilled $5m agreement','Check dates versus receipt and settlement dates','Announced remediation versus completed payment','Deposition date versus release date and findings'],publicationPerformed:false};
await mkdir('artifacts/epstein-enrichment',{recursive:true});await writeFile('artifacts/epstein-enrichment/checks.json',JSON.stringify(result,null,2)+'\n');console.log('PASS Epstein enrichment: '+JSON.stringify(result));
