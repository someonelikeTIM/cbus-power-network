import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { nodes, edges, sources, categories, relationships, cases, evidenceStatuses, meta } from '../dist/data.js';
import { enrichmentNodes, enrichmentEdges, enrichmentSources } from '../dist/enrichment.js';
import { infrastructureNodes, infrastructureEdges, infrastructureSources, infrastructureRelease } from '../dist/infrastructure.js';
import { politicalNodes, politicalEdges, politicalSources, politicalRelease } from '../dist/politics.js';
import { flowNodes, flowEdges, flowSources, flowRelease } from '../dist/flows.js';
import { trailNodes, trailEdges, trailSources, trailRelease } from '../dist/trails.js';
import {mediaNodes,mediaEdges,mediaSources,mediaRelease,mediaProfiles} from '../dist/media.js';
import {civicNodes,civicEdges,civicRelease} from '../dist/civic-enrichment.js';
import {donationRelease} from '../dist/donation-enrichment.js';
import {campaignRelease} from '../dist/campaigns-2026.js';
import {epsteinRelease} from '../dist/epstein-enrichment.js';
import {redflexRelease} from '../dist/redflex-enrichment.js';
import { buildTimelineEvents, filterTimelineEvents, validateEventDate, validISO, sortTimelineEvents } from '../dist/timeline.js';
import { filterGraph, shortestPath, matches } from '../dist/core.js';

for (const file of ['dist/app.js','dist/core.js','dist/data.js','dist/city-hall.js','dist/enrichment.js','dist/infrastructure.js','dist/politics.js','dist/flows.js','dist/trails.js','dist/timeline.js','dist/archives.js','dist/live-sources.js','scripts/serve.mjs','scripts/archive-sources.mjs','scripts/verify-live-sources.mjs']) execFileSync(process.execPath,['--check',file]);
const nodeIds = new Set(nodes.map(n => n.id)), edgeIds = new Set(edges.map(e => e.id)), sourceIds = new Set(sources.map(s => s.id));
assert.equal(nodeIds.size, nodes.length); assert.equal(edgeIds.size, edges.length); assert.equal(sourceIds.size, sources.length);
for (const n of nodes) { assert.ok(categories[n.category]); assert.ok(n.sourceIds.length); for (const s of n.sourceIds) assert.ok(sourceIds.has(s)); }
for (const e of edges) { assert.ok(nodeIds.has(e.source) && nodeIds.has(e.target)); assert.ok(relationships[e.type]); assert.ok(e.evidence && e.period && e.sourceIds.length); assert.ok(evidenceStatuses[e.status]); for (const s of e.sourceIds) assert.ok(sourceIds.has(s)); if (e.type === 'history') assert.equal(e.historical, true); if (e.caseId) assert.ok(cases[e.caseId]); if (e.amount) assert.ok(e.amount>0 && e.unit && e.directional); }
for(const s of sources) { assert.equal(new URL(s.url).protocol,'https:'); assert.ok(s.archiveUrl||s.liveVerified,`No content verification: ${s.id}`); if(s.archiveUrl){assert.ok(/^\d{14}$/.test(s.archiveTimestamp));assert.ok(s.archiveUrl.startsWith(`https://web.archive.org/web/${s.archiveTimestamp}/`));assert.equal(s.sourceFormat,'archive');}else{assert.equal(s.sourceFormat,'original');assert.ok(s.contentCheckedAt);} }
const options = { categories: new Set(Object.keys(categories)), relationships: new Set(Object.keys(relationships)), history: true };
const full = filterGraph(options); assert.ok(full.nodes.length>=104); assert.ok(full.edges.length>=158); assert.ok(sources.length>=46);
const infrastructurePublished=infrastructureRelease(sourceIds,nodeIds);
const politicalPublished=politicalRelease(sourceIds,nodes.filter(n=>!politicalNodes.some(p=>p.id===n.id)).map(n=>n.id));
const flowsPublished=flowRelease(sourceIds,nodeIds);
if(meta.enrichmentState==='complete'){assert.equal(full.edges.length,170+infrastructurePublished.edges.length+politicalPublished.edges.length+flowsPublished.edges.length+trailRelease(sourceIds,nodeIds).edges.length+mediaRelease(sourceIds,nodeIds).edges.length+civicRelease(sourceIds,nodeIds).edges.length+donationRelease(sourceIds,nodeIds).edges.length+campaignRelease(sourceIds,nodeIds).edges.length+epsteinRelease(sourceIds,nodeIds).edges.length+redflexRelease(sourceIds,nodeIds).edges.length);}
const current = filterGraph({ ...options, history: false }); assert.ok(current.edges.every(e => !e.historical)); assert.ok(!current.nodes.some(n => ['abigail', 'foundation', 'lbrands'].includes(n.id)));assert.ok(current.nodes.some(n=>n.id==='les'));
const search = filterGraph({ ...options, query: 'Ginther' }); assert.deepEqual(search.matches, ['ginther','ginther-campaign','ginther-fund']); assert.ok(search.nodes.some(n => n.id === 'city')); assert.ok(!search.nodes.some(n => n.id === 'les'));
assert.equal(filterGraph({ ...options, query: 'not-an-entity-xyz' }).nodes.length, 0);
assert.ok(matches(nodes.find(n => n.id === 'monica'), 'Tellez'));
const route = shortestPath(full, 'ginther', 'nationwide'); assert.ok(route); assert.equal(route.nodes[0], 'ginther'); assert.equal(route.nodes.at(-1), 'nationwide'); assert.equal(route.edges.length, 3);
assert.ok(shortestPath(current, 'les', 'nationwide'));
assert.deepEqual(shortestPath(full, 'city', 'city'), { nodes: ['city'], edges: [] });
const officials = filterGraph({ ...options, categories: new Set(['politician']) }); assert.ok(officials.nodes.length>=6); assert.ok(officials.nodes.every(node=>node.category==='politician'));assert.ok(officials.edges.every(edge=>officials.nodes.some(node=>node.id===edge.source)&&officials.nodes.some(node=>node.id===edge.target))); assert.equal(shortestPath(officials, 'ginther', 'hardin'), null);
const money=filterGraph({...options,caseId:'money'}); assert.ok(money.nodes.length>=77); assert.ok(money.edges.length>=108);
const hb6=filterGraph({...options,caseId:'hb6'}); assert.equal(hb6.edges.length,17); assert.ok(hb6.edges.every(e=>e.caseId==='hb6'));
const epstein=filterGraph({...options,caseId:'epstein'}); assert.equal(epstein.edges.length,9+epsteinRelease(sourceIds,nodeIds).edges.length); assert.ok(!epstein.nodes.some(n=>n.id==='aep'));
assert.ok(matches(nodes.find(n=>n.id==='aep'),'AEP'));
const moneyTrail=shortestPath(hb6,'aep','hb6',{directed:true}); assert.deepEqual(moneyTrail.nodes,['aep','empowering','generation-now','hb6']);
assert.equal(shortestPath(hb6,'sec','aep',{directed:true}),null);
assert.ok(shortestPath(hb6,'sec','aep',{directed:false}));
assert.deepEqual(shortestPath(epstein,'les','ylk',{directed:true}).nodes,['les','epstein','financial-trust','ylk']);
assert.deepEqual(shortestPath(money,'aep','epstein',{directed:false}).nodes,['aep','bill-byers','partnership','les','epstein']);
const cityHall=filterGraph({...options,caseId:'cityhall'});assert.ok(cityHall.nodes.length>=39);assert.ok(cityHall.edges.length>=55);
assert.deepEqual(shortestPath(cityHall,'pizzuti-pac','ginther-fund',{directed:true}).nodes,['pizzuti-pac','ginther-fund']);
assert.equal(edges.find(e=>e.id==='e94').amount,undefined);assert.equal(edges.find(e=>e.id==='e94').appropriationTotal,400000);
assert.equal(edges.find(e=>e.id==='e117').amountIsLowerBound,true);assert.equal(edges.find(e=>e.id==='e118').amountIsLowerBound,true);
assert.ok(edges.find(e=>e.id==='e91').context.includes('execution'));assert.equal(edges.find(e=>e.id==='e101').status,'registered');
assert.equal(edges.find(e=>e.id==='e102').source,'charter-operating');
const sports=filterGraph({...options,caseId:'sports'});assert.ok(sports.nodes.length>=21);assert.ok(sports.edges.length>=24);
assert.deepEqual(shortestPath(sports,'dee-haslam','city',{directed:false}).nodes,['dee-haslam','ginther-fund','ginther','city']);
assert.ok(Math.abs(['e139','e140','e141'].reduce((sum,id)=>sum+edges.find(e=>e.id===id).amount,0)-32615.67)<.005);
assert.equal(edges.find(e=>e.id==='e139').transactionDate,'2026-07-16');assert.equal(edges.find(e=>e.id==='e141').reportedContributorName,'James Johnson');
assert.ok(matches(nodes.find(n=>n.id==='dee-haslam'),'Susan Haslam'));assert.ok(matches(nodes.find(n=>n.id==='jw-johnson'),'James Johnson'));
assert.equal(enrichmentEdges.find(e=>e.id==='e157').targetRole,'funding purpose');assert.equal(enrichmentEdges.find(e=>e.id==='e161').amountIncludedIn,'e160');
assert.equal(enrichmentEdges.find(e=>e.id==='e162').amount,841900);assert.equal(enrichmentEdges.find(e=>e.id==='e162').appropriationTotal,843900);
assert.equal(enrichmentEdges.find(e=>e.id==='e156').requiresFurtherAuthorization,true);
assert.ok(meta.pendingSourceIds.every(id=>!sources.some(s=>s.id===id)));
assert.equal(new Set(enrichmentNodes.map(n=>n.id)).size,enrichmentNodes.length);assert.equal(new Set(enrichmentEdges.map(e=>e.id)).size,enrichmentEdges.length);
const intakeSourceIds=new Set([...sourceIds,...enrichmentSources.map(s=>s.id),...infrastructureSources.map(s=>s.id),...politicalSources.map(s=>s.id),...flowSources.map(s=>s.id),...trailSources.map(s=>s.id)]),intakeNodeIds=new Set([...nodeIds,...enrichmentNodes.map(n=>n.id),...infrastructureNodes.map(n=>n.id),...politicalNodes.map(n=>n.id),...flowNodes.map(n=>n.id),...trailNodes.map(n=>n.id)]);
for(const e of enrichmentEdges){assert.ok(intakeNodeIds.has(e.source)&&intakeNodeIds.has(e.target));assert.ok(e.sourceIds.every(id=>intakeSourceIds.has(id)));}
for(const e of infrastructureEdges){assert.ok(intakeNodeIds.has(e.source)&&intakeNodeIds.has(e.target));assert.ok(e.sourceIds.every(id=>intakeSourceIds.has(id)));assert.ok(relationships[e.type]&&evidenceStatuses[e.status]);}
assert.equal(new Set(infrastructureNodes.map(n=>n.id)).size,infrastructureNodes.length);assert.equal(new Set(infrastructureEdges.map(e=>e.id)).size,infrastructureEdges.length);
assert.equal(infrastructureRelease(new Set(),[]).nodes.length,0);assert.equal(infrastructureRelease(new Set(),[]).edges.length,0);
assert.equal(politicalRelease(new Set(),[]).nodes.length,0);assert.equal(politicalRelease(new Set(),[]).edges.length,0);
assert.equal(flowRelease(new Set(),[]).nodes.length,0);assert.equal(flowRelease(new Set(),[]).edges.length,0);
assert.equal(trailRelease(new Set(),[]).nodes.length,0);assert.equal(trailRelease(new Set(),[]).edges.length,0);
assert.equal(new Set(trailNodes.map(n=>n.id)).size,trailNodes.length);assert.equal(new Set(trailEdges.map(e=>e.id)).size,trailEdges.length);
for(const e of trailEdges){assert.ok(intakeNodeIds.has(e.source)&&intakeNodeIds.has(e.target));assert.ok(e.sourceIds.every(id=>intakeSourceIds.has(id)));assert.ok(relationships[e.type]&&evidenceStatuses[e.status]);}
for(const e of flowEdges){assert.ok(intakeNodeIds.has(e.source)&&intakeNodeIds.has(e.target),`Missing endpoint for ${e.id}`);assert.ok(e.sourceIds.every(id=>intakeSourceIds.has(id)));assert.ok(relationships[e.type]&&evidenceStatuses[e.status]);}
assert.equal(new Set(flowNodes.map(n=>n.id)).size,flowNodes.length);assert.equal(new Set(flowEdges.map(e=>e.id)).size,flowEdges.length);
if(meta.flowState==='complete'){
 const jobs=filterGraph({...options,caseId:'jobsohio'});
 assert.ok(shortestPath(jobs,'jobsohio','flock',{directed:false}));
 assert.deepEqual(shortestPath(jobs,'anduril','city',{directed:false}).nodes,['anduril','bill-byers','city']);
 assert.deepEqual(shortestPath(datacentersForCheck(),'vistra','vivek',{directed:false}).nodes,['vistra','vistra-pac','vivek-rob-campaign','vivek']);
 assert.equal(edges.find(e=>e.id==='j45').amount,16615);assert.equal(edges.find(e=>e.id==='j45').transactionDate,'2026-05-07');
 assert.equal(edges.find(e=>e.id==='j03').amount,280000000);assert.ok(edges.find(e=>e.id==='j03').context.includes('Eliminated'));
 assert.equal(edges.find(e=>e.id==='j29').amount,310000000);assert.equal(edges.find(e=>e.id==='j29').payableYears,10);assert.ok(edges.find(e=>e.id==='j29').context.includes('actual paid'));
 assert.equal(edges.find(e=>e.id==='j11').amount,undefined);assert.equal(edges.find(e=>e.id==='j11').flaggedExpenseAmount,59747);
 assert.ok(edges.find(e=>e.id==='j10').context.includes('de minimis'));assert.ok(edges.find(e=>e.id==='j16').context.includes('no university funds'));
}
function datacentersForCheck(){return filterGraph({...options,caseId:'datacenters'});}
for(const e of politicalEdges){assert.ok(intakeNodeIds.has(e.source)&&intakeNodeIds.has(e.target));assert.ok(e.sourceIds.every(id=>intakeSourceIds.has(id)));assert.ok(relationships[e.type]&&evidenceStatuses[e.status]);}
assert.equal(new Set(politicalNodes.map(n=>n.id)).size,politicalNodes.length);assert.equal(new Set(politicalEdges.map(e=>e.id)).size,politicalEdges.length);
assert.ok(!politicalEdges.some(e=>e.source==='vivek'&&e.type==='control'));
assert.ok(politicalEdges.filter(e=>e.target==='strive-round-2024').every(e=>!e.amount));
assert.equal(politicalEdges.find(e=>e.id==='p25').target,'v-pac');assert.equal(politicalEdges.find(e=>e.id==='p31').source,'timashev-foundation');
const politics=filterGraph({...options,caseId:'politics'});
if(sourceIds.has('political-strive')&&sourceIds.has('political-narya')&&sourceIds.has('political-vance')&&sourceIds.has('political-vivek'))assert.deepEqual(shortestPath(politics,'jd-vance','vivek',{directed:false}).nodes.length<=3,true);
if(meta.politicalState==='complete'){assert.ok(politics.nodes.some(n=>n.id==='vivek'));assert.ok(politics.nodes.some(n=>n.id==='jd-vance'));assert.ok(shortestPath(politics,'jd-vance','city',{directed:false}));assert.ok(politics.nodes.some(n=>n.id==='amy-acton'));assert.equal(shortestPath({...politics,edges:politics.edges.filter(e=>e.type==='control')},'vivek','jobsohio',{directed:true}),null);}
assert.ok(politicalRelease(new Set(politicalSources.map(s=>s.id)),['founders-fund']).nodes.every(n=>n.id!=='founders-fund'));
assert.ok(!infrastructureRelease(new Set(['flock-contract-2024']),['city','council']).nodes.some(n=>n.id==='flock')); // City-client identity evidence is independently required.
assert.ok(edges.every(e=>e.sourceIds.every(id=>!meta.pendingSourceIds.includes(id))));
const alpr=filterGraph({...options,caseId:'alpr'}),datacenters=filterGraph({...options,caseId:'datacenters'});
assert.deepEqual(shortestPath(alpr,'flock','city',{directed:true}).nodes,['flock','capobianco','council','city']);
assert.deepEqual(shortestPath(datacenters,'google','city',{directed:true}).nodes,['google','stanley-gates','council','city']);
assert.ok(edges.find(e=>e.id==='e213').context.includes('no particular meeting'));assert.ok(edges.find(e=>e.id==='e177').requiresFurtherAuthorization);
assert.equal(infrastructureEdges.find(e=>e.id==='e179').amount,228000);assert.equal(infrastructureEdges.find(e=>e.id==='e179').termYears,2);
assert.equal(infrastructureEdges.find(e=>e.id==='e182').amount,undefined);assert.equal(infrastructureEdges.find(e=>e.id==='e182').optionalYearTwoPrice,209999);
assert.equal(infrastructureEdges.find(e=>e.id==='e186').amount,275000000);assert.equal(infrastructureEdges.find(e=>e.id==='e186').valuation,7500000000);
assert.ok(infrastructureEdges.filter(e=>/^e(18[7-9]|19[0-6])$/.test(e.id)).every(e=>!e.amount));
assert.equal(edges.find(e=>e.id==='e59').amount+edges.find(e=>e.id==='e60').amount,46657998);
assert.equal(edges.find(e=>e.id==='e62').status,'allegation'); assert.equal(edges.find(e=>e.id==='e49').status,'finding');
const redflex=filterGraph({...options,caseId:'redflex'});assert.equal(redflex.edges.length,7+redflexRelease(sourceIds,nodeIds).edges.length);assert.deepEqual(shortestPath(redflex,'redflex','ginther-campaign',{directed:true}).nodes,['redflex','raphael','ohio-democrats','ginther-campaign']);
assert.equal(edges.find(e=>e.id==='e73').status,'reported');assert.ok(edges.find(e=>e.id==='e73').context.includes('did not name him'));
assert.ok(edges.find(e=>e.id==='e49').context.includes('without admitting or denying'));
const html = readFileSync('dist/index.html', 'utf8'); const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]); assert.equal(new Set(ids).size, ids.length);
const timeline=buildTimelineEvents(edges,sources),timelineById=new Map(timeline.map(e=>[e.id,e]));
if(sourceIds.has('trail-vpac-q2')){
  assert.equal(edges.filter(e=>e.id==='p25').length,1);assert.equal(edges.find(e=>e.id==='p25').transactionDate,'2026-05-08');
  assert.equal(timelineById.get('event-p25').date.precision,'day');assert.equal(timelineById.get('event-p25').moneyKind,'contribution');
  assert.equal(['t21','t22'].reduce((sum,id)=>sum+edges.find(e=>e.id===id).amount,0),8182282);
}
if(sourceIds.has('trail-vance-oge')){
  assert.equal(edges.find(e=>e.id==='t24').amount,undefined);assert.equal(edges.find(e=>e.id==='t24').valueRange.min,500001);
  assert.equal(timelineById.get('event-t24').moneyKind,'interest');assert.equal(timelineById.get('event-t24').amount,null);
  assert.equal(timelineById.get('event-t29').moneyKind,'commitment');assert.equal(edges.find(e=>e.id==='t29').amount,525000);
  assert.equal(timelineById.get('event-t30').date.end,'2025-12-31');
}
if(sourceIds.has('trail-vivek-fds')){
  assert.equal(edges.find(e=>e.id==='t05').source,'8vc-fund-iii');assert.equal(timelineById.get('event-t05').moneyKind,'income-source');
  assert.equal(timelineById.get('event-t18').moneyKind,'gift-source');assert.ok(!edges.some(e=>e.source==='vivek'&&e.target==='anduril'));
}
if(sourceIds.has('trail-pov-2021')&&sourceIds.has('trail-pov-2022'))assert.equal(['t31','t32','t33'].reduce((sum,id)=>sum+edges.find(e=>e.id===id).amount,0),15000000);
if(sourceIds.has('trail-oshp-flock')){assert.equal(edges.find(e=>e.id==='t36').status,'authorized');assert.equal(edges.find(e=>e.id==='t36').annualCeilings.FY2025,90000);assert.equal(timelineById.get('event-t36').moneyKind,'authorization');}
if(sourceIds.has('trail-pickaway-infrastructure'))assert.equal(edges.find(e=>e.id==='t39').amountIncludedIn,'t38');
if(sourceIds.has('trail-oshp-agreement')){assert.equal(edges.find(e=>e.id==='t40').target,'aws');assert.equal(edges.find(e=>e.id==='t40').status,'acknowledged');assert.equal(timelineById.get('event-t40').date.precision,'unknown');}
assert.equal(timelineById.size,timeline.length);assert.ok(timeline.every(e=>validateEventDate(e.date)&&e.edgeIds.every(id=>edgeIds.has(id))&&e.sourceIds.every(id=>sourceIds.has(id))));
assert.ok(validISO('2024-02-29'));assert.equal(validISO('2025-02-29'),false);assert.equal(validISO('2026-13-01'),false);
assert.equal(timelineById.get('event-j45').date.start,'2026-05-07');assert.equal(sources.find(s=>s.id==='flow-vistra-fec').date,'2026-06-02');
assert.equal(timelineById.get('event-j03').date.precision,'period');assert.equal(timelineById.get('event-j03').date.start,'2025-07-01');assert.equal(timelineById.get('event-j03').date.end,'2026-06-30');
assert.equal(timelineById.get('event-j04').moneyKind,'credit');assert.equal(timelineById.get('event-j29').moneyKind,'conditional');
assert.equal(timelineById.get('event-j20').date.precision,'year');assert.equal(timelineById.get('podcast-recovery-review').amount,null);
assert.equal(timeline.filter(e=>e.amount===60000&&e.edgeIds.includes('j20')).length,1); // Recovery review does not repeat the paid amount.
assert.equal(timelineById.get('event-j51').date.precision,'unknown');assert.equal(timelineById.get('event-j51').date.start,null);assert.ok(timelineById.get('event-j51').date.observedOn);
assert.equal(timelineById.get('event-p19').date.precision,'unknown'); // The press-release date is not a seed-investment date.
assert.equal(timeline.filter(e=>e.edgeIds.includes('e186')).length,1);assert.equal(timelineById.get('flock-financing-2025').amount,275000000);
const jobsTimeline=filterTimelineEvents(timeline,filterGraph({...options,caseId:'jobsohio'}));assert.ok(jobsTimeline.some(e=>e.id==='event-j05'));assert.ok(jobsTimeline.some(e=>e.id==='jobs-audit-2013'));
const cash=filterTimelineEvents(timeline,full,{entityId:'jobsohio',scope:'case',moneyGroup:'cash'});assert.ok(cash.some(e=>e.id==='event-j45'));assert.ok(cash.every(e=>!['event-j04','event-j29','podcast-recovery-review'].includes(e.id)));
assert.ok(filterTimelineEvents(timeline,full,{scope:'case',includeUndated:false}).every(e=>e.date.precision!=='unknown'));
assert.equal(filterTimelineEvents(timeline,full,{entityId:'not-a-node'}).length,0);
assert.ok(filterTimelineEvents(timeline,full,{scope:'case',query:'16615'}).some(e=>e.id==='event-j45'));
assert.ok(filterTimelineEvents(timeline,full,{scope:'case',query:'credit'}).some(e=>e.id==='event-j04'));
const yearKnown=sortTimelineEvents(timeline).filter(e=>e.date.precision!=='unknown');assert.ok(yearKnown.every((e,i)=>i===0||e.date.end>=yearKnown[i-1].date.end));
// Media checks target the distinctions most likely to create misleading paths.
execFileSync(process.execPath,['--check','dist/media.js']);
assert.equal(meta.mediaState,'complete');assert.ok(mediaSources.every(s=>sourceIds.has(s.id)));
assert.equal(new Set(mediaNodes.map(n=>n.id)).size,mediaNodes.length);assert.equal(new Set(mediaEdges.map(e=>e.id)).size,mediaEdges.length);
assert.equal(mediaRelease(new Set(),[]).edges.length,0);assert.equal(mediaRelease(new Set(),[]).nodes.length,0);
const media=filterGraph({...options,caseId:'media'});
assert.ok(shortestPath(media,'smith-brothers','wsyx',{directed:true}));
assert.ok(shortestPath(media,'wsyx','smith-brothers',{directed:false}));
assert.equal(shortestPath(media,'abc-network','sinclair-inc',{directed:true}),null);
assert.deepEqual(shortestPath(media,'wosu','jobsohio',{directed:false}).nodes,['wosu','ohio-state','ted-carter','jobsohio']);
assert.equal(edges.find(e=>e.id==='m50').source,'osu-trustees');assert.equal(edges.find(e=>e.id==='m54').type,'board');
assert.ok(shortestPath(media,'business-first','generation-now',{directed:false}));
assert.equal(edges.find(e=>e.id==='m07').type,'contract');assert.equal(edges.find(e=>e.id==='m06').source,'cunningham');
assert.ok(!edges.some(e=>e.source==='sinclair-group'&&e.target==='wtte'&&e.type==='ownership'));
assert.equal(edges.find(e=>e.id==='m08').mediaKind,'nonvoting-interest');assert.equal(edges.find(e=>e.id==='m29').type,'voting');
assert.equal(timelineById.get('event-m09').date.precision,'month');assert.equal(timelineById.get('event-m09').date.start,'2025-10-01');
assert.equal(timelineById.get('event-m20').date.start,'2026-03-19');assert.equal(timelineById.get('media-injunction-start').date.start,'2026-04-17');assert.equal(timelineById.get('event-m23').date.start,'2026-08-06');
assert.equal(timelineById.get('event-m61').date.precision,'unknown');
assert.equal(timelineById.get('event-m57').date.end,'2024-06-30');assert.equal(timelineById.get('event-m57').moneyKind,'recognized-revenue');
assert.equal(edges.find(e=>e.id==='m65').amount,undefined);assert.ok(!media.edges.some(e=>e.source==='wyss-foundation'&&e.target==='ocj'));
assert.ok(filterTimelineEvents(timeline,media,{scope:'case'}).some(e=>e.id==='event-m47'));
assert.ok(!filterTimelineEvents(timeline,media,{scope:'case',moneyGroup:'cash'}).some(e=>e.id==='event-m57'));
assert.ok(mediaProfiles.every(p=>nodeIds.has(p.outlet)&&p.authority.every(id=>nodeIds.has(id))));
const withheld=mediaRelease(new Set([...sourceIds].filter(id=>id!=='media-smith')),nodes.filter(n=>!mediaNodes.some(m=>m.id===n.id)).map(n=>n.id));assert.ok(!withheld.edges.some(e=>e.id==='m04'));
const app = readFileSync('dist/app.js', 'utf8'); for (const [, id] of app.matchAll(/\$\('([^']+)'\)/g)) if (id!=='show-path') assert.ok(ids.includes(id), `Missing HTML element: ${id}`);
assert.ok(JSON.parse(readFileSync('public-release.config.json', 'utf8')).basePath.startsWith('/'));
console.log(`PASS: syntax, ${nodes.length} entities, ${edges.length} sourced relationships, ${sources.length} source records, historical filters, accent search, shortest paths, and DOM references.`);
