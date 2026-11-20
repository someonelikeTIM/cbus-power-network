import {discoveryText,discoveryRank,entityRank} from './search.js';
import {tagDefinitions,normalizeTags,tagSelection} from './tags.js';

// Search the filtered dataset, including records outside the current explored map.
export function explorerSearch(graph,query,activeTags=[]){
  const text=discoveryText(query),words=text.split(' ');
  if(!text)return [];
  const active=new Set(normalizeTags(activeTags));
  const tags=Object.entries(tagDefinitions).filter(([,tag])=>Number.isFinite(discoveryRank(words,tag.label)))
    .map(([id,tag])=>{const selection=tagSelection(graph,[...active,id]),matches=selection.byTag.find(tag=>tag.id===id);return {kind:'tag',id,label:tag.label,rank:discoveryRank(words,tag.label),active:active.has(id),combined:active.size>0&&!active.has(id),entityCount:matches.entityIds.length,connectionCount:matches.relationshipIds.length};})
    .filter(tag=>active.size||tag.entityCount||tag.connectionCount)
    .sort((a,b)=>a.rank-b.rank||a.label.localeCompare(b.label)).slice(0,4);
  const entities=graph.nodes.map(node=>({kind:'entity',id:node.id,label:node.name,role:node.role,category:node.category,rank:entityRank(node,words)}))
    .filter(item=>Number.isFinite(item.rank)).sort((a,b)=>a.rank-b.rank||a.label.localeCompare(b.label)).slice(0,8);
  return [...tags,...entities];
}
