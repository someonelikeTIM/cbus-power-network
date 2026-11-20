import {explorerSearch} from './explorer-search.js';
import {normalizeText} from './search.js';
import {readerField} from './reader-copy.js';

// A tool result opens its control. Search never applies a setting on its own.
export const deskCommands = [
  {id:'filters', label:'Filter the network', terms:'filters topic categories dates history relationship type', panel:'filters', target:'topic-select'},
  {id:'dates', label:'Filter by date', terms:'date dates time period historical', panel:'filters', target:'valid-from'},
  {id:'path', label:'Find a path between entities', terms:'paths shortest route from to connection', panel:'path', target:'path-to'},
  {id:'show-pins', label:'SHOW PINNED', terms:'show all pins on the map pinned entities connections zoom fit overview research'},
  {id:'research', label:'Open research path', terms:'notebook notes pins bookmark saved research', panel:'research', target:'research-name'},
  {id:'record', label:'Open selected record', terms:'details inspector evidence sources selected', panel:'record'},
  {id:'settings', label:'Open map tools', terms:'settings controls display legend layout actions preferences', panel:'settings'},
  {id:'colors', label:'Change map colors', terms:'color colour colors party political affiliation legend', panel:'settings', target:'canvas-color-mode'},
  {id:'legend', label:'Read the connection key', terms:'legend key lines types symbols arrows dashed', panel:'settings', target:'legend-summary'},
  {id:'distance', label:'Change connection distance', terms:'distance visibility steps degree radius neighbors', panel:'settings', target:'connection-distance'},
  {id:'labels', label:'Change map labels', terms:'labels names captions', panel:'settings', target:'label-toggle'},
  {id:'amounts', label:'Show dollar amounts', terms:'amounts money dollars financial labels', panel:'settings', target:'toggle-amounts'},
  {id:'layout', label:'Group by connection type', terms:'sort group layout arrange buckets natural', panel:'settings', target:'group-connections'},
  {id:'selection', label:'Change selection mode', terms:'selection select pan drag multiselect', panel:'settings', target:'selection-mode'},
  {id:'placement', label:'Dock or float the panel', terms:'dock left right undock panel window float move position', panel:'record', target:'dock-placement'},
  {id:'download', label:'Download records in this view', terms:'download export data json records'},
  {id:'finance', label:'Browse campaign money', terms:'finance filings contributions spending expenditures ledgers campaign money'},
  {id:'save-view', label:'Save this workspace view', terms:'save view tab workspace'},
  {id:'load-view', label:'Open a saved view', terms:'load saved views library tabs workspace'},
  {id:'import-views', label:'Import views or research paths', terms:'import file views research paths'},
  {id:'split-views', label:'Compare tabs side by side', terms:'split side by side compare single view'},
  {id:'rename-view', label:'Rename this tab', terms:'rename tab workspace title'},
  {id:'export-view', label:'Export this workspace view', terms:'export file workspace view tab'},
  {id:'export-workspace', label:'Export all workspace tabs', terms:'export all workspace tabs views'},
  {id:'new-view', label:'Start a new workspace tab', terms:'new tab start separate search branch'}
];

const wordsMatch=(text,words)=>words.every(word=>text.includes(word));

export function searchDesk(graph, sources, byId, query, tags) {
  const text=normalizeText(query).trim();
  if(!text)return [];
  const words=text.split(/\s+/);
  const tools=deskCommands.filter(tool=>wordsMatch(normalizeText(tool.label+' '+tool.terms),words))
    .map(tool=>({kind:'tool',id:tool.id,label:tool.label,description:'Explorer tool'}));
  const matches=explorerSearch(graph,query,tags);
  const entities=matches.filter(item=>item.kind==='entity').map(item=>({...item,description:item.role}));
  const topics=matches.filter(item=>item.kind==='tag').map(item=>({...item,description:item.entityCount+' entities · '+item.connectionCount+' connections'}));
  const sourceIds=new Set([...graph.edges.flatMap(edge=>edge.sourceIds),...graph.nodes.flatMap(node=>node.sourceIds||[])]);
  const documents=sources.filter(source=>sourceIds.has(source.id)&&wordsMatch(normalizeText([source.title,source.publisher,source.id].join(' ')),words))
    .slice(0,3).map(source=>({kind:'source',id:source.id,label:source.title,description:source.publisher}));
  const links=[];
  for(const edge of graph.edges){
    const label=readerField(edge,'label'),ends=byId.get(edge.source).name+' · '+byId.get(edge.target).name;
    if(wordsMatch(normalizeText([label,ends,edge.id].join(' ')),words))links.push({kind:'edge',id:edge.id,label,description:ends});
    if(links.length===3)break;
  }
  const exactEntity=entities.find(item=>normalizeText(item.label)===text);
  return exactEntity||!tools.length?[...entities,...topics,...tools,...links,...documents]:[...tools,...entities,...topics,...links,...documents];
}
