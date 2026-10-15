import {entityMatches,normalizeText} from './search.js';
import {tagDefinitions,normalizeTags,tagSelection} from './tags.js';

// Search the filtered dataset, including records outside the current explored map.
export function explorerSearch(graph,query,activeTags=[]){
  const text=normalizeText(query).trim().replace(/^#\s*/,''),words=text.split(/\s+/);
  if(!text)return [];
  const active=new Set(normalizeTags(activeTags));
  const tags=Object.entries(tagDefinitions).filter(([,tag])=>words.every(word=>normalizeText(tag.label).includes(word)))
    .map(([id,tag])=>{const selection=tagSelection(graph,[...active,id]),matches=selection.byTag.find(tag=>tag.id===id);return {kind:'tag',id,label:tag.label,active:active.has(id),combined:active.size>0&&!active.has(id),entityCount:matches.entityIds.length,connectionCount:matches.relationshipIds.length};})
    .filter(tag=>active.size||tag.entityCount||tag.connectionCount)
    .sort((a,b)=>rank(a.label,text)-rank(b.label,text)||a.label.localeCompare(b.label)).slice(0,4);
  const entities=graph.nodes.filter(node=>entityMatches(node,text)).sort((a,b)=>rank(a.name,text)-rank(b.name,text)||a.name.localeCompare(b.name)).slice(0,8)
    .map(node=>({kind:'entity',id:node.id,label:node.name,role:node.role}));
  return [...tags,...entities];
}
function rank(label,text){const value=normalizeText(label);return value===text?0:value.startsWith(text)?1:2;}
