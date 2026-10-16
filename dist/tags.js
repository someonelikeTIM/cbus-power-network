import {nodes,edges,categories,relationships} from './data.js';
import {campaign2026EdgeIds,campaign2026EntityIds} from './campaigns-2026.js';

// Descriptive navigation labels derived from existing record fields. Raw records stay unchanged.
const kinds={politician:'Official / candidate',person:'Person',corporation:'Corporation',institution:'Organization / committee',initiative:'Initiative',case:'Law / proceeding'};
const specific={
  lobbyist:{label:'Lobbyist',description:'People explicitly identified as lobbyists or registered legislative/executive agents in a role or relationship record.'},
  mayor:{label:'Mayor',description:'Entities with a recorded mayoral role.'},
  council:{label:'Council member',description:'People whose recorded role explicitly identifies council service.'},
  utility:{label:'Utility',description:'Entities described as a utility or utility unit in the record.'},
  media:{label:'Media organization',description:'Organizations described as news, broadcast, radio or publishing operations.'},
  education:{label:'Higher education',description:'Entities whose recorded name or role identifies a university or college connection.'},
  campaign:{label:'Campaign / political committee',description:'Recorded campaign organizations and political committees.'},
  donations:{label:'Campaign donations',description:'Recorded contributions to campaigns or political committees. Each record retains its own recipient, dates and amount.'},
  spending:{label:'Campaign spending',description:'Records explicitly describing independent spending or campaign-supporting/opposition media payments.'},
  'campaigns-2026':{label:'2026 political campaigns',description:'2026 election-cycle candidacies, committees, donations, self-financing, support and opposition. Earlier fundraising for these elections is included; dated background roles remain context.'},
  bidding:{label:'Waived competitive bidding',description:'Connections whose recorded label explicitly says bidding was waived.'},
  grants:{label:'Grants',description:'Records describing grant awards, commitments or payments. The individual record identifies which applies.'},
  incentives:{label:'Tax incentives',description:'Records explicitly describing tax credits or tax abatements.'},
  appointments:{label:'Appointments',description:'Records explicitly describing an appointment or appointment authority.'},
  historical:{label:'Past record',description:'Records marked historical in this edition.'}
};
export const tagDefinitions=Object.fromEntries([
  ...Object.keys(categories).map(id=>['entity-'+id,{label:kinds[id],recordKind:'entity',description:'Entities in the '+kinds[id].toLowerCase()+' category.'}]),
  ...Object.entries(relationships).map(([id,type])=>['connection-'+id,{label:type.label,recordKind:'connection',description:'Connections classified as '+type.label.toLowerCase()+' in this edition.'}]),
  ...Object.entries(specific).map(([id,tag])=>['topic-'+id,{...tag,recordKind:['historical','campaigns-2026'].includes(id)?'both':['lobbyist','mayor','council','utility','media','education','campaign'].includes(id)?'entity':'connection'}])
]);
const nodeById=new Map(nodes.map(node=>[node.id,node]));
const registeredAgents=new Set(edges.filter(edge=>edge.type==='lobbying'&&/registered.{0,50}agent/i.test(edge.label)).map(edge=>edge.target).filter(id=>['person','politician'].includes(nodeById.get(id)?.category)));
const campaignRecipient=node=>node&&/campaign|political.action.committee|\bpac\b|candidate committee|friends for/i.test(node.name+' '+node.role);
export function entityTags(node){
  const tags=['entity-'+node.category],role=node.role||'',text=node.name+' '+role,person=['person','politician'].includes(node.category);
  if(person&&(/\blobbyist\b|\blobbying agent\b|\blegislative(?:\s*\/\s*executive)?\s+agent\b/i.test(role)||registeredAgents.has(node.id)))tags.push('topic-lobbyist');
  if(person&&/\bmayor\b/i.test(role))tags.push('topic-mayor');
  if(person&&/councilmember|council member|council president|president pro tem/i.test(role))tags.push('topic-council');
  if(/\butility\b/i.test(role))tags.push('topic-utility');
  if(!person&&/news|broadcast|radio|newspaper|publisher|publishing/i.test(role))tags.push('topic-media');
  if(!person&&/\buniversity\b|\bcollege\b/i.test(text))tags.push('topic-education');
  if(!person&&campaignRecipient(node))tags.push('topic-campaign');
  if(node.historical)tags.push('topic-historical');
  if(campaign2026EntityIds.has(node.id))tags.push('topic-campaigns-2026');
  return tags;
}
export function connectionTags(edge){
  const tags=['connection-'+edge.type],label=edge.label||'';
  if(edge.type==='money'&&campaignRecipient(nodeById.get(edge.target))&&/contribut|receipt|donation/i.test(label)&&!/charity/i.test(label))tags.push('topic-donations');
  if(/independent.spending|opposition.media|supporting.messaging/i.test(label))tags.push('topic-spending');
  if(/bidding.{0,24}\bwaived\b|\bwaived\b.{0,24}bidding/i.test(label)&&!/\b(?:not|never)\s+waived\b/i.test(label))tags.push('topic-bidding');
  if(/\bgrants?\b/i.test(label))tags.push('topic-grants');
  if(/tax.credit|tax abatement|property abatement/i.test(label))tags.push('topic-incentives');
  if(/\bappoint(?:s|ed|ment|ments)?\b/i.test(label))tags.push('topic-appointments');
  if(edge.historical)tags.push('topic-historical');
  if(campaign2026EdgeIds.has(edge.id))tags.push('topic-campaigns-2026');
  return tags;
}
const entityIndex=new Map(nodes.map(node=>[node.id,entityTags(node)])),connectionIndex=new Map(edges.map(edge=>[edge.id,connectionTags(edge)]));
export function recordTags(kind,id){return (kind==='entity'?entityIndex:connectionIndex).get(id)||[];}
export function tagMatches(graph,tag){
  return {nodes:new Set(graph.nodes.filter(node=>recordTags('entity',node.id).includes(tag)).map(node=>node.id)),edges:new Set(graph.edges.filter(edge=>recordTags('connection',edge.id).includes(tag)).map(edge=>edge.id))};
}
export function normalizeTags(value){return [...new Set((typeof value==='string'?value.split(','):Array.from(value||[])).filter(id=>Object.hasOwn(tagDefinitions,id)))];}
const selectionCache=new WeakMap();
export function tagSelection(graph,value){
  const ids=normalizeTags(value),key=ids.join(',');let cache=selectionCache.get(graph);if(!cache){cache=new Map();selectionCache.set(graph,cache);}if(cache.has(key))return cache.get(key);
  const entityTags=ids.filter(id=>tagDefinitions[id].recordKind==='entity'),edgeTags=ids.filter(id=>tagDefinitions[id].recordKind==='connection'),shared=ids.filter(id=>tagDefinitions[id].recordKind==='both');
  const matches={nodes:new Set(),edges:new Set()},connectors=new Set(),contextNodes=new Set(),contextEdges=new Set(),all=(kind,id,tags)=>tags.every(tag=>recordTags(kind,id).includes(tag));
  const connected=!!(entityTags.length&&edgeTags.length);
  if(ids.length&&connected){
    const people=graph.nodes.filter(node=>all('entity',node.id,entityTags)),links=graph.edges.filter(edge=>all('connection',edge.id,edgeTags));
    const adjacency=new Map(graph.nodes.map(node=>[node.id,[]]));for(const edge of graph.edges){adjacency.get(edge.source)?.push(edge);adjacency.get(edge.target)?.push(edge);}
    for(const node of people)for(const edge of links){
      if(!shared.every(tag=>recordTags('entity',node.id).includes(tag)||recordTags('connection',edge.id).includes(tag)))continue;
      const direct=edge.source===node.id||edge.target===node.id,bridges=direct?[]:(adjacency.get(node.id)||[]).filter(link=>[link.source,link.target].some(id=>id!==node.id&&(id===edge.source||id===edge.target)));
      if(!direct&&!bridges.length)continue;
      matches.nodes.add(node.id);matches.edges.add(edge.id);contextNodes.add(node.id);contextNodes.add(edge.source);contextNodes.add(edge.target);contextEdges.add(edge.id);
      for(const bridge of bridges){connectors.add(bridge.id);contextEdges.add(bridge.id);contextNodes.add(bridge.source);contextNodes.add(bridge.target);}
    }
  }else if(ids.length){
    for(const node of graph.nodes)if(all('entity',node.id,ids)){matches.nodes.add(node.id);contextNodes.add(node.id);}
    for(const edge of graph.edges)if(all('connection',edge.id,ids))matches.edges.add(edge.id);
    for(const edge of graph.edges)if(matches.edges.has(edge.id)||matches.nodes.has(edge.source)||matches.nodes.has(edge.target)){contextEdges.add(edge.id);contextNodes.add(edge.source);contextNodes.add(edge.target);}
  }
  for(const id of matches.edges)connectors.delete(id); // A matching receipt is not also labeled as contextual evidence.
  const byTag=ids.map(id=>({id,label:tagDefinitions[id].label,entityIds:[...matches.nodes].filter(node=>recordTags('entity',node).includes(id)),relationshipIds:[...matches.edges].filter(edge=>recordTags('connection',edge).includes(id))}));
  const result={ids,matches,connectors,contextNodes,contextEdges,byTag,mode:connected?'connected':'same-record',connectionLimit:connected?2:null};cache.set(key,result);return result;
}
export function tagForeground(graph,value){
  const selection=tagSelection(graph,value),nodes=new Set(selection.matches.nodes);
  for(const edge of graph.edges)if(selection.matches.edges.has(edge.id)){nodes.add(edge.source);nodes.add(edge.target);}
  if(selection.mode==='connected')selection.contextNodes.forEach(id=>nodes.add(id));
  return {nodes,edges:selection.contextEdges,matches:selection.matches,contextNodes:selection.contextNodes,selection};
}
export function taggedGraph(graph,value){
  const selection=tagSelection(graph,value),ids=selection.contextNodes;
  return {...graph,nodes:graph.nodes.filter(node=>ids.has(node.id)),edges:graph.edges.filter(edge=>selection.mode==='connected'?selection.contextEdges.has(edge.id):ids.has(edge.source)&&ids.has(edge.target)),matches:[...selection.matches.nodes],tagMatches:selection.matches};
}
