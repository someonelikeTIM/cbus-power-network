// Read affiliation only from the entity's own sourced record, never its neighbors.
export const partyColors={Democratic:'#2463b4',Republican:'#c43c3c',neutral:'#747b80'};
export function normalizeParty(value){
  const party=String(value||'').trim().toLowerCase();
  if(['d','(d)','dem','democrat','democratic','democratic party'].includes(party))return 'Democratic';
  if(['r','(r)','rep','republican','republican party'].includes(party))return 'Republican';
  return null;
}
export function knownParty(node){
  if(!node)return null;
  const recorded=String(node.party||'').trim();
  if(recorded)return normalizeParty(recorded);
  if(node.partyAffiliation?.party)return normalizeParty(node.partyAffiliation.party);
  if(node.category==='institution'){
    if(/\bDemocratic Party\b/.test(node.name)||node.role==='Democratic Senatorial Campaign Committee')return 'Democratic';
    if(/\bRepublican Party\b/.test(node.name))return 'Republican';
  }
  return null;
}
export function connectionParty(edge,nodeById){
  const source=knownParty(nodeById.get(edge.source)),target=knownParty(nodeById.get(edge.target));
  return source&&target&&source!==target?null:source||target;
}
export const normalizeColorMode=value=>value==='party'?'party':'type';
