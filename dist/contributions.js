export const proposalKinds=['correction','new-evidence','proposed-relationship','identity','ownership-update','changed-source','research-assignment'];
export const proposalStates=['submitted','under-review','accepted','declined','withdrawn'];
export function validateProposal(p,{sourceIds=null}={}) {
  if(!p.id||!proposalKinds.includes(p.kind)||!['entity','relationship','source','event','lead'].includes(p.recordKind)||!p.recordId||!p.proposedChange?.trim()||!p.attribution?.trim()||!proposalStates.includes(p.state))throw Error('Proposal needs an ID, kind, record, change, attribution and state.');
  if(!Array.isArray(p.evidence)||!p.evidence.length)throw Error('At least one evidence reference is required.');
  for(const e of p.evidence)if(!(e.sourceId||e.url)||!e.locator||!['support','qualify','contradict','supersede'].includes(e.role))throw Error('Each reference needs a source ID or URL, locator and evidence role.');
  if(p.state!=='submitted'&&(!p.review?.reason||!p.review.reviewedAt||!['human'].includes(p.review.reviewer?.type)||!p.review.reviewer.identity||p.history?.at(-1)?.to!==p.state))throw Error('Reviewed dispositions require reviewer, date, reason and transition history.');
  if(p.state==='accepted'){
    if(!p.review?.reason||!p.review.reviewedAt||!['human'].includes(p.review.reviewer?.type)||!p.review.reviewer.identity)throw Error('Accepted changes require an identified substantive reviewer, date and reason.');
    if(p.evidence.some(e=>!e.sourceId||(sourceIds&&!sourceIds.has(e.sourceId))))throw Error('Accepted changes must cite checked source IDs already in the dataset.');
  }
  return true;
}
export function transitionProposal(p,next,review) {
  const transitions={submitted:['under-review','withdrawn'],'under-review':['accepted','declined','withdrawn'],accepted:[],declined:[],withdrawn:[]};
  if(!transitions[p.state]?.includes(next))throw Error(`Cannot transition ${p.state} to ${next}`);
  if(!review?.reason||!review.reviewedAt||!review.reviewer?.identity||!['human'].includes(review.reviewer.type))throw Error('Disposition requires an identified reviewer, date and reason.');
  const result={...p,state:next,review,history:[...(p.history||[]),{from:p.state,to:next,...review}]};validateProposal(result);return result;
}
export function acceptedPatch(p,record,sourceIds) {
  validateProposal(p,{sourceIds});if(p.state!=='accepted')throw Error('Only accepted proposals can change accepted data.');
  if(p.recordKind!=='relationship'||p.recordId!==record.id)throw Error('This incremental updater supports existing relationship records. Other kinds require a reviewed data intake.');
  const allowed=new Set(['label','evidence','context','locator','period','status','validity']);
  if(!p.patch||!Object.keys(p.patch).length||Object.keys(p.patch).some(k=>!allowed.has(k)))throw Error('Patch must use supported relationship fields; stable IDs, endpoints and amounts cannot change through this updater.');
  const before=Object.fromEntries(Object.keys(p.patch).map(k=>[k,record[k]??null]));
  const refs=[...new Set([...record.sourceIds,...p.evidence.map(e=>e.sourceId)])];
  const inherited=record.evidenceEntries||record.sourceIds.map(sourceId=>({sourceId,role:'support',locator:record.locator||null,excerpt:null}));
  const entries=p.evidence.map(({sourceId,role,locator,excerpt=null})=>({sourceId,role,locator,excerpt}));
  return {id:p.id,recordId:record.id,recordKind:p.recordKind,attribution:p.attribution,reason:p.review.reason,review:p.review,before,after:p.patch,patch:{...p.patch,sourceIds:refs,evidenceEntries:[...inherited,...entries],claimReview:{status:'reviewed',reviewedAt:p.review.reviewedAt,reviewer:p.review.reviewer,note:p.review.reason}},history:p.history||[]};
}
