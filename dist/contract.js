import { nodes,edges,sources,meta,evidenceStatuses } from './data.js';
import { sourceArchives } from './archives.js';
import { sourceLiveEvidence } from './live-sources.js';
import { buildTimelineEvents, validateEventDate } from './timeline.js';
import { mediaLeads } from './media.js';
import { entityIdentifiers,leadDetails } from './curation.js';
import { validityFor } from './reporting.js';
import { acceptedCorrections } from './corrections.js';
import { inheritedEntityIds,inheritedRelationshipIds } from './inherited.js';
import { validISO } from './timeline.js';

export const release = { schemaVersion:'1.0.0',releaseId:'2026-10-16-explorer-rc1',status:'local-candidate',preparedOn:'2026-10-16',publishedAt:null,dataRevision:meta.version,codeLicense:'MIT',dataLicense:'CC-BY-4.0',sourceCheckIds:[] };
export const reviewFor = record => record.claimReview || { status:'legacy-unrecorded',reviewedAt:null,reviewer:{type:'unknown',identity:null},note:'Inherited curated record. Previous substantive review identity and claim-level date were not recorded; source content checks are separate. Independent editorial review is pending.' };
export function publicSource(source) {
  const {url,archiveUrl,archiveBrowseUrl,...record}=source;
  const check=archiveUrl?sourceArchives[source.id]:sourceLiveEvidence[source.id];
  return {...record,url:archiveUrl||url,publicationDate:{value:source.date,precision:!source.date?'unknown':source.date.length===4?'year':source.date.length===7?'month':'day'},
    contentCheck:{verified:!!check?.contentVerified,checkedAt:check?.checkedAt||null,method:check?.contentCheckMethod|| (archiveUrl?'Archived content retrieval with source-specific checks':'Method not recorded'),reviewer:check?.reviewer||{type:'unknown',identity:null},sha256:check?.sha256||null,checks:check?.contentChecks||[],note:check?.contentCheckNote||'Initial review attribution is unavailable. Content availability / matching is separate from claim review.'},
    archiveCapture:source.archiveTimestamp||null};
}
export const leads = mediaLeads.map((question,index)=>({id:`lead-media-${String(index+1).padStart(2,'0')}`,question,...leadDetails[index],identifiers:leadDetails[index].identifiers||[],status:'open',lastAttempt:null,resultingRecordIds:[],note:'Research question, not an accepted relationship. No new retrieval was performed for this release preparation.'}));
export function datasetFor(graph={nodes,edges}, events=null) {
  const links=graph.edges.map(e=>({...e,publicationState:e.publicationState||'accepted',claimReview:reviewFor(e),validity:validityFor(e),evidenceStatus:{code:e.status,label:evidenceStatuses[e.status]},evidenceEntries:e.evidenceEntries||e.sourceIds.map(sourceId=>({sourceId,role:'support',locator:e.locator||null,excerpt:null,note:e.locator?'Inherited source reference; see qualification text.':'Precise locator not recorded; follow-up needed.'}))}));
  const entities=graph.nodes.map(n=>({...n,externalIdentifiers:entityIdentifiers[n.id]||n.externalIdentifiers||[],publicationState:n.publicationState||'accepted',claimReview:reviewFor(n)}));
  const edgeIds=new Set(links.map(e=>e.id));
  const chronology=(events||buildTimelineEvents(edges,sources)).filter(e=>e.edgeIds.some(id=>edgeIds.has(id))).map(e=>{
    const edgeIdsInView=e.edgeIds.filter(id=>edgeIds.has(id)),selected=links.filter(r=>edgeIdsInView.includes(r.id));
    const retainsAmount=edgeIdsInView.includes(e.primaryEdgeId);
    return {...e,edgeIds:edgeIdsInView,primaryEdgeId:retainsAmount?e.primaryEdgeId:edgeIdsInView[0],actorIds:[...new Set(selected.flatMap(r=>[r.source,r.target]))],sourceIds:[...new Set(selected.flatMap(r=>r.sourceIds))],amount:retainsAmount?e.amount:null,amountLabel:retainsAmount?e.amountLabel:'',metric:retainsAmount?e.metric:null};
  });
  const sourceIds=new Set([...entities.flatMap(n=>[...n.sourceIds,...n.externalIdentifiers.flatMap(i=>i.sourceIds)]),...links.flatMap(e=>e.sourceIds),...chronology.flatMap(e=>e.sourceIds)]);
  const relevantLeads=graph.nodes.length===nodes.length?leads:leads.filter(l=>l.entityIds.length&&l.entityIds.every(id=>entities.some(n=>n.id===id)));
  // Include the lead's existing supporting references as well as claim citations.
  relevantLeads.forEach(l=>l.sourceIds.forEach(id=>sourceIds.add(id)));
  const references=links.flatMap(edge=>[edge.amountIncludedIn?{id:edge.amountIncludedIn,role:'containing-amount'}:null,edge.modifiesRelationshipId?{id:edge.modifiesRelationshipId,role:'modified-contract'}:null].filter(ref=>ref&&!edgeIds.has(ref.id)));
  const output={release,meta,entities,relationships:links,sources:sources.filter(s=>sourceIds.has(s.id)).map(publicSource),events:chronology,leads:relevantLeads,relatedLeadIds:leads.filter(l=>l.entityIds.some(id=>entities.some(n=>n.id===id))).map(l=>l.id),externalRelationshipReferences:[...new Map(references.map(ref=>[ref.role+':'+ref.id,{...ref,releaseId:release.releaseId}])).values()],corrections:acceptedCorrections.filter(c=>[...entities,...links].some(r=>r.id===c.recordId)),limitations:[meta.limitations,'Claim-level review metadata is incomplete for inherited records.','Dates usually describe events or observations; relationship validity is largely unknown.','Filtered packets include complete lead records only when all their entities are present; relatedLeadIds and externalRelationshipReferences refer to the full release.']};
  validateDataset(output);return output;
}
export function validateDataset(data) {
  const unique=(list,label)=>{if(new Set(list.map(r=>r.id)).size!==list.length)throw Error(`Duplicate ${label} ID`);};
  for(const name of ['entities','relationships','sources','events','leads'])unique(data[name],name);
  const ids=new Set(data.entities.map(n=>n.id)),sourceIds=new Set(data.sources.map(s=>s.id)),edgeIds=new Set(data.relationships.map(e=>e.id));
  for(const s of data.sources)if(!s.contentCheck.verified||!s.contentCheck.checkedAt||!/^https:/.test(s.url))throw Error(`Unchecked source ${s.id}`);
  for(const n of data.entities){if(n.publicationState!=='accepted'||!n.sourceIds.length||n.sourceIds.some(id=>!sourceIds.has(id))||!['legacy-unrecorded','reviewed'].includes(n.claimReview?.status)||(n.claimReview.status==='legacy-unrecorded'&&!inheritedEntityIds.includes(n.id)))throw Error(`Unpublishable entity ${n.id}`);for(const identifier of n.externalIdentifiers)if(identifier.sourceIds.some(id=>!sourceIds.has(id)))throw Error(`Unchecked identifier ${n.id}`);}
  for(const e of data.relationships){
    if(e.publicationState!=='accepted'||!ids.has(e.source)||!ids.has(e.target)||!e.evidence||!evidenceStatuses[e.status]||!e.sourceIds.length||e.sourceIds.some(id=>!sourceIds.has(id)))throw Error(`Unpublishable relationship ${e.id}`);
    if(!['legacy-unrecorded','reviewed'].includes(e.claimReview.status))throw Error(`Unreviewed proposal ${e.id}`);
    if(e.claimReview.status==='legacy-unrecorded'&&!inheritedRelationshipIds.includes(e.id))throw Error(`New record lacks substantive review ${e.id}`);
    if(e.claimReview.status==='reviewed'&&(!e.claimReview.reviewedAt||!['unknown','human'].includes(e.claimReview.reviewer.type)||!e.claimReview.reviewer.identity))throw Error(`Incomplete reviewer ${e.id}`);
    for(const entry of e.evidenceEntries)if(!sourceIds.has(entry.sourceId)||!['support','qualify','contradict','supersede'].includes(entry.role))throw Error(`Invalid evidence entry ${e.id}`);
    const v=e.validity;
    if((v.start&&!validISO(v.start))||(v.end&&!validISO(v.end))||(v.start&&v.end&&v.start>v.end)||v.sourceIds?.some(id=>!sourceIds.has(id)))throw Error(`Invalid relationship validity ${e.id}`);
    if(e.amountIncludedIn&&!edgeIds.has(e.amountIncludedIn)){
      // A filtered export may omit the containing amount; retain an explicit external reference.
      if(!edges.some(r=>r.id===e.amountIncludedIn))throw Error(`Unknown containing amount ${e.id}`);
    }
    if(e.modifiesRelationshipId&&!edgeIds.has(e.modifiesRelationshipId)&&!edges.some(record=>record.id===e.modifiesRelationshipId))throw Error(`Unknown modified contract ${e.id}`);
  }
  for(const event of data.events)if(!validateEventDate(event.date)||event.edgeIds.some(id=>!edgeIds.has(id))||event.sourceIds.some(id=>!sourceIds.has(id))||event.actorIds.some(id=>!ids.has(id)))throw Error(`Invalid event ${event.id}`);
  for(const lead of data.leads)if(lead.entityIds.some(id=>!ids.has(id))||lead.sourceIds.some(id=>!sourceIds.has(id))||lead.status!=='open')throw Error(`Invalid lead ${lead.id}`);
  return true;
}
export function evidencePacket(selection,graph={nodes,edges}) {
  const all=datasetFor(),kind=selection.kind,id=selection.id;
  let chosen;
  if(kind==='node')chosen=graph.edges.filter(e=>e.source===id||e.target===id);
  else if(kind==='edge')chosen=edges.filter(e=>e.id===id);
  else if(kind==='source')chosen=graph.edges.filter(e=>e.sourceIds.includes(id));
  else if(kind==='event')chosen=edges.filter(e=>all.events.find(v=>v.id===id)?.edgeIds.includes(e.id));
  else if(kind==='path')chosen=edges.filter(e=>selection.edges.includes(e.id));
  else throw Error('Unknown packet selection');
  const actors=new Set(chosen.flatMap(e=>[e.source,e.target]));if(kind==='node')actors.add(id);
  const output=datasetFor({nodes:nodes.filter(n=>actors.has(n.id)),edges:chosen});
  if(kind==='source'&&!output.sources.some(s=>s.id===id))output.sources.push(publicSource(sources.find(s=>s.id===id)));
  output.selection=selection;output.packetType='evidence';output.thirdPartyDocumentsIncluded=false;
  return output;
}
