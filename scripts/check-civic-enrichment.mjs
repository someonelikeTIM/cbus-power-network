import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {nodes,edges,sources} from '../dist/data.js';
import {civicNodes,civicEdges,civicSources,civicChecks,civicRelease} from '../dist/civic-enrichment.js';
import {sourceLiveEvidence} from '../dist/live-sources.js';
import {datasetFor,release} from '../dist/contract.js';
import {taggedGraph} from '../dist/tags.js';
const ids=new Set(sources.map(source=>source.id)),baseIds=nodes.filter(node=>!civicNodes.some(added=>added.id===node.id)).map(node=>node.id);
assert.deepEqual([civicNodes.length,civicEdges.length,civicSources.length],[7,13,5]);
assert.deepEqual(civicRelease(new Set(),baseIds),{nodes:[],edges:[],complete:false});
for(const source of civicSources){const missing=new Set(ids);missing.delete(source.id);const subset=civicRelease(missing,baseIds);assert.ok(subset.edges.every(edge=>!edge.sourceIds.includes(source.id)));assert.ok(subset.nodes.every(node=>!node.sourceIds.includes(source.id)));const check=sourceLiveEvidence[source.id];assert.equal(check.originalUrl,source.url);assert.equal(check.contentVerified,true);assert.deepEqual(check.contentChecks,civicChecks[source.id]);assert.match(check.sha256,/^[a-f0-9]{64}$/);}
const published=civicRelease(ids,baseIds);assert.equal(published.nodes.length,7);assert.equal(published.edges.length,13);assert.equal(published.complete,true);
for(const record of [...civicNodes,...civicEdges]){assert.equal(record.claimReview.status,'reviewed');assert.equal(record.claimReview.reviewer.type,'unknown');assert.ok(record.claimReview.reviewer.identity);assert.ok(record.sourceIds.length);}
for(const edge of civicEdges){assert.ok(edge.locator);assert.ok(edge.evidenceEntries.every(entry=>entry.locator&&entry.sourceId));}
const byId=new Map(civicEdges.map(edge=>[edge.id,edge]));
assert.equal(byId.get('c26-01').amount,60000);assert.equal(byId.get('c26-01').status,'authorized');assert.equal(byId.get('c26-01').amountIsUpperBound,true);assert.equal(byId.get('c26-01').timeline.moneyKind,'authorization');
assert.equal(byId.get('c26-02').amount,undefined);assert.equal(byId.get('c26-02').status,'documented');assert.equal(byId.get('c26-02').timeline.date.role,'Contract referenced on agenda');
for(const id of ['c26-03','c26-04','c26-05','c26-13'])assert.equal(byId.get(id).amount,undefined,'Percentages, job counts and stated fees are not payments');
assert.equal(byId.get('c26-05').historical,true);assert.equal(byId.get('c26-05').timeline.date.precision,'year');assert.ok(byId.get('c26-04').context.includes('90 days'));
for(const id of ['c26-06','c26-07','c26-08','c26-09','c26-10','c26-11','c26-12'])assert.equal(byId.get(id).historical,false);
assert.ok(taggedGraph({nodes,edges},'topic-bidding').edges.some(edge=>edge.id==='c26-01'));assert.ok(taggedGraph({nodes,edges},'topic-incentives').nodes.some(node=>node.id==='pizzuti-short-north-office'));
const data=datasetFor();for(const edge of civicEdges)assert.equal(data.relationships.find(record=>record.id===edge.id).claimReview.reviewer.type,'unknown');
const preservation='Stable IDs, source gates, record semantics and generated-field round trips checked.';
const result={releaseId:release.releaseId,added:{entities:civicNodes.length,relationships:civicEdges.length,sources:civicSources.length,events:data.events.filter(event=>event.edgeIds.some(id=>byId.has(id))).length},counts:{entities:nodes.length,relationships:edges.length,sources:sources.length,events:data.events.length},preservation,review:'Source-supported additions; existing review/evidence distinctions retained',sourceChecks:'Only the five new originals; archive lookups returned HTTP 429',sourceGate:true,publicationPerformed:false};
await writeFile('artifacts/civic-enrichment-checks.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
