import { relationshipValidity } from './curation.js';
import { validISO } from './timeline.js';

export const connectionModes = {
  all: { label:'All documented relationships', types:null },
  ownership: { label:'Ownership / voting', types:['ownership','voting'] },
  governance: { label:'Governance / appointments', types:['board','control'] },
  leadership: { label:'Leadership / public office', types:['leadership'] },
  money: { label:'Money / contracts', types:['money','funding','contract','influence'] },
  content: { label:'Content / programming', types:['content','affiliation','editorial'] }
};
export const unknownValidity = () => ({start:null,end:null,startPrecision:'unknown',endPrecision:'unknown',certainty:'unknown',note:'Relationship validity not established. Event, source and observation dates do not establish a term.'});
export const validityFor = edge => edge.validity || relationshipValidity[edge.id] || unknownValidity();
export function validateRange(from, to) {
  if ((from && !validISO(from)) || (to && !validISO(to)) || (from && to && from > to)) throw Error('Use valid dates with From on or before To.');
}
export function validityInRange(edge, from, to) {
  validateRange(from,to);
  const v=validityFor(edge);
  if (!from && !to) return v.certainty==='documented' ? 'supported' : 'uncertain';
  if ((v.end && from && v.end < from) || (v.start && to && v.start > to)) return 'outside';
  // Day bounds establish validity throughout the requested interval; coarse bounds do not.
  if (from && to && v.certainty==='documented' && v.startPrecision==='day' && v.endPrecision==='day' && v.start<=from && v.end>=to) return 'supported';
  return 'uncertain';
}
export function reportingEdges(edges, { connectionMode='all', from='', to='', includeUncertain=true }={}) {
  validateRange(from,to);
  const mode=connectionModes[connectionMode] || connectionModes.all;
  return edges.filter(e => (!mode.types || mode.types.includes(e.type)) && (!(from || to) || (validityInRange(e,from,to)!=='outside' && (includeUncertain || validityInRange(e,from,to)==='supported'))));
}
export function pathDates(path, edgeById) {
  const records=path.edges.map(id=>validityFor(edgeById.get(id)));
  const starts=records.map(v=>v.start).filter(Boolean),ends=records.map(v=>v.end).filter(Boolean);
  const start=starts.sort().at(-1)||null,end=ends.sort()[0]||null;
  return { start,end,status:start&&end&&start>end?'non-overlapping':records.length&&records.every(v=>v.certainty==='documented'&&v.start&&v.end&&v.startPrecision==='day'&&v.endPrecision==='day')?'established-overlap':'overlap-unknown', note:'A path joins separate records; it does not establish causation, wrongdoing or story control.' };
}
export function findPaths(graph,start,end,{directed=true,limit=3,maxDepth=6,maxVisits=10000}={}) {
  const ids=new Set(graph.nodes.map(n=>n.id)); if(!ids.has(start)||!ids.has(end))return [];
  const queue=[{nodes:[start],edges:[]}],results=[];let visits=0;
  for(let i=0;i<queue.length&&results.length<limit&&visits++<maxVisits;i++){
    const path=queue[i],last=path.nodes.at(-1);
    if(last===end){results.push({...path,dates:pathDates(path,new Map(graph.edges.map(e=>[e.id,e])))});continue;}
    if(path.edges.length>=maxDepth)continue;
    for(const e of graph.edges){const next=e.source===last?e.target:e.target===last&&(!directed||!e.directional)?e.source:null;if(next&&!path.nodes.includes(next))queue.push({nodes:[...path.nodes,next],edges:[...path.edges,e.id]});}
  }
  return results;
}
