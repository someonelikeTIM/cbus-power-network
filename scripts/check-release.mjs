import assert from 'node:assert/strict';
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { nodes,edges,sources,categories,relationships } from '../dist/data.js';
import { datasetFor,validateDataset,release,evidencePacket } from '../dist/contract.js';
import { findPaths,pathDates,reportingEdges,validityInRange } from '../dist/reporting.js';
import { filterGraph } from '../dist/core.js';
import { encodeState,decodeState,recordURL } from '../dist/routing.js';
import { transitionProposal,acceptedPatch } from '../dist/contributions.js';
import { validateSchema } from './schema-check.mjs';
import { parseCSV,toCSV } from './csv.mjs';
import { hash,filesUnder,inputFingerprint } from './public-files.mjs';
import { civicNodes,civicEdges,civicSources } from '../dist/civic-enrichment.js';
import { donationNodes,donationEdges,donationSources } from '../dist/donation-enrichment.js';

for(const file of [...await filesUnder('dist'),...await filesUnder('scripts')].filter(p=>/\.(js|mjs)$/.test(p)))execFileSync(process.execPath,['--check',file]);
const data=datasetFor();validateDataset(data);
const directory=`dist/downloads/${release.releaseId}`,readJSON=async path=>JSON.parse(await readFile(path,'utf8'));
assert.deepEqual(await readJSON(`${directory}/dataset.json`),data,'Generated dataset is stale');
const schema=await readJSON(`${directory}/schema.json`);validateSchema(data,schema);
const fixture=structuredClone(data);fixture.events[0].date={precision:'unknown',start:'2026-01-01',end:null,role:'Not known'};assert.throws(()=>validateSchema(fixture,schema));
for(const name of ['entities','relationships','sources','events','leads']){
  const table=await readJSON(`${directory}/${name}.json`);validateSchema(table,await readJSON(`${directory}/${name}.schema.json`));assert.deepEqual(table.records,data[name]);
  const rows=parseCSV(await readFile(`${directory}/${name}.csv`,'utf8'));assert.equal(rows.length,data[name].length);
  for(let i=0;i<rows.length;i++){
    assert.equal(rows[i].id,data[name][i].id);assert.equal(rows[i].releaseId,release.releaseId);
    for(const [key,value]of Object.entries(data[name][i])){
      const expected=value===null?'':typeof value==='object'?JSON.stringify(value):typeof value==='string'&&/^[=+@-]/.test(value)?"'"+value:String(value);
      assert.equal(rows[i][key],expected,`${name} ${rows[i].id} ${key}`);
    }
  }
}
assert.equal(parseCSV(toCSV([{id:'fixture',note:'line 1\nline 2, "quote"',formula:'=1+1'}]))[0].formula,"'=1+1");
for(const name of ['packet-m63','packet-flock','packet-anduril-city']){const packet=await readJSON(`${directory}/${name}.json`);validateDataset(packet);validateSchema(packet,schema);assert.equal(packet.thirdPartyDocumentsIncluded,false);}
const manifest=await readJSON(`${directory}/manifest.json`);assert.equal(manifest.inputFingerprint,(await inputFingerprint()).fingerprint,'Release inputs changed; rebuild');
for(const file of manifest.files){const bytes=await readFile(`${directory}/${file.path}`);assert.equal(hash(bytes),file.sha256,file.path);assert.equal(bytes.length,file.bytes);}
const options={categories:new Set(Object.keys(categories)),relationships:new Set(Object.keys(relationships)),caseId:'all',history:true};
for(const q of ['56549','B800A74A5ED6648F1AD7','$228,000','SEC order','non-voting'])assert.ok(filterGraph({...options,query:q}).edges.length||filterGraph({...options,query:q}).nodes.length,q);
const ownership=filterGraph({...options,caseId:'media',connectionMode:'ownership'});assert.ok(ownership.edges.length);assert.ok(ownership.edges.every(e=>['ownership','voting'].includes(e.type)));assert.ok(!ownership.edges.some(e=>e.type==='affiliation'));
const term=edges.find(e=>e.id==='e47');assert.equal(validityInRange(term,'2000-01-01','2000-12-31'),'supported');assert.equal(validityInRange(term,'2020-01-01','2020-12-31'),'outside');assert.equal(validityInRange(edges.find(e=>e.id==='m63'),'2020-01-01','2020-12-31'),'uncertain');
assert.throws(()=>reportingEdges(edges,{from:'2026-10-01',to:'2025-01-01'}));assert.equal(reportingEdges(edges,{from:'2000-01-01',to:'2000-12-31',includeUncertain:false}).length,1);
const routes=findPaths({nodes,edges},'anduril','city',{directed:false});assert.ok(routes.length);assert.equal(routes[0].dates.status,'overlap-unknown');assert.equal(findPaths(ownership,'npr','wosu',{directed:true}).length,0);
const synthetic=new Map([['a',{validity:{start:'2000-01-01',end:'2001-01-01',certainty:'documented',startPrecision:'day',endPrecision:'day'}}],['b',{validity:{start:'2002-01-01',end:'2003-01-01',certainty:'documented',startPrecision:'day',endPrecision:'day'}}]]);assert.equal(pathDates({edges:['a','b']},synthetic).status,'non-overlapping');
const state={...options,view:'timeline',query:'ABC & FOX',selected:{kind:'event',id:'event-m09'},connectionMode:'ownership',from:'2025-01-01',to:'2026-01-01',includeUncertain:true,labels:'off',focus:false,timelineEntity:'wwho',timelineScope:'case',timelineMoney:'all',timelineUndated:false,path:null};
const decoded=decodeState(encodeState('https://example.test/cbus-power-network/',state,release.releaseId),state);
for(const key of ['view','caseId','query','from','to','timelineEntity','timelineScope','timelineMoney','timelineUndated','labels','connectionMode','includeUncertain'])assert.equal(decoded[key],state[key],key);assert.deepEqual(decoded.selected,state.selected);assert.deepEqual(decoded.categories,state.categories);
assert.ok(recordURL('https://example.test/cbus-power-network/','edge','m63',release.releaseId).startsWith('https://example.test/cbus-power-network/'));
for(const selection of [{kind:'node',id:'wsyx'},{kind:'edge',id:'m63'},{kind:'source',id:'media-fcc-wsyx'},{kind:'event',id:'event-m09'},{kind:'path',...routes[0]}])validateDataset(evidencePacket(selection));
validateDataset(datasetFor({nodes:nodes.filter(n=>n.id==='wsyx'),edges:[]}));
assert.throws(()=>datasetFor({nodes,edges:edges.map((e,i)=>i===0?{...e,publicationState:'proposed'}:e)}));
for(const mutate of [d=>d.relationships[0].publicationState='proposed',d=>d.relationships[0].sourceIds.push('absent'),d=>d.sources[0].contentCheck.verified=false,d=>d.relationships[0].claimReview.status='submitted',d=>d.relationships[0].id='new-unreviewed',d=>d.relationships[0].validity.start='2026-02-30']){const bad=structuredClone(data);mutate(bad);assert.throws(()=>validateDataset(bad));}
// Examples prove attribution/disposition without changing accepted application data.
const proposal={id:'test-proposal',kind:'new-evidence',recordKind:'relationship',recordId:'m63',releaseId:release.releaseId,proposedChange:'Retain the existing intermediate-chain qualification.',attribution:'Test fixture contributor',state:'submitted',evidence:[{sourceId:'media-fcc-wsyx',locator:'WSYX renewal row',role:'qualify'}],history:[]};
const reviewer={type:'human',identity:'Fixture reviewer (test only)'},review={reviewer,reviewedAt:'2026-10-14',reason:'Fixture verifies review transitions only; no actual factual correction.'};
const underReview=transitionProposal(proposal,'under-review',review),accepted=transitionProposal(underReview,'accepted',review),declined=transitionProposal(underReview,'declined',review);
assert.equal(declined.history.at(-1).to,'declined');assert.throws(()=>transitionProposal(proposal,'accepted',review));
const correction=acceptedPatch({...accepted,patch:{context:edges.find(e=>e.id==='m63').context}},edges.find(e=>e.id==='m63'),new Set(sources.map(s=>s.id)));assert.equal(correction.attribution,proposal.attribution);assert.equal(correction.patch.claimReview.reviewer.type,'human');assert.equal(correction.before.context,correction.after.context);
assert.throws(()=>acceptedPatch({...accepted,patch:{id:'replacement'}},edges.find(e=>e.id==='m63'),new Set(sources.map(s=>s.id))));
const preservation='Stable IDs, source gates, record semantics and generated-field round trips checked.';
const result={releaseId:release.releaseId,counts:manifest.counts,preservation,checks:['syntax','schema and failure fixtures','accepted-record and checked-source gates','JSON/CSV full-field round trips','joins and packets','stable URL state','identifier/evidence/amount search','typed and directed paths','validity and non-overlap','correction acceptance/decline attribution','input and download checksums'],sourceChecksReperformed:!!release.sourceCheckIds?.length,sourceCheckScope:release.sourceCheckIds||[],publicationPerformed:false};
await mkdir('artifacts',{recursive:true});await writeFile('artifacts/release-checks.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
