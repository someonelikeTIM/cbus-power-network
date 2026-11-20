import { categories,relationships,cases,nodes,edges,sources } from './data.js';
import {buildTimelineEvents} from './timeline.js';
import { connectionModes,validateRange } from './reporting.js';
import { normalizeConnectionDistance } from './exploration.js';
import {normalizeTags} from './tags.js';
import {normalizeColorMode} from './party-colors.js';
const views=['network','relations','directory','sources'];
const eventEdges=new Map(buildTimelineEvents(edges,sources).map(event=>[event.id,event.primaryEdgeId]));
function currentSelection(selection){return selection?.kind==='event'?(eventEdges.has(selection.id)?{kind:'edge',id:eventEdges.get(selection.id)}:null):selection;}
const kinds={entity:'node',relationship:'edge',source:'source',event:'event'};
export const recordKind = kind => ({node:'entity',edge:'relationship',source:'source',event:'event'})[kind];
export function recordURL(base,kind,id,releaseId) {
  const selection=currentSelection({kind,id});if(selection)({kind,id}=selection);
  const url=new URL(base);url.search='';url.hash='';
  url.searchParams.set('case','all');url.searchParams.set('view',kind==='source'?'sources':'network');
  url.searchParams.set('record',`${recordKind(kind)}:${id}`);url.searchParams.set('release',releaseId);
  url.searchParams.set('map','explore');if(kind==='node')url.searchParams.set('anchor',id);
  return url.href;
}
export function encodeState(base,state,releaseId) {
  const url=new URL(base);url.search='';const p=url.searchParams;
  const values={case:state.caseId,view:views.includes(state.view)?state.view:'network',q:state.query,history:state.history?'1':'0',categories:[...state.categories].sort().join(','),relationships:[...state.relationships].sort().join(','),mode:state.connectionMode,from:state.from,to:state.to,uncertain:state.includeUncertain?'1':'0',labels:state.labels,focus:state.focus?'1':'0',release:releaseId};
  if(state.mapMode){values.map=state.mapMode;values.anchor=state.exploreRoot;values.explored=[...(state.exploredIds||[])].sort().join(',');}
  if(state.explorationSeeds){values.seeded=[...state.explorationSeeds].sort().join(',');values.expanded=[...(state.openNodes||[])].sort().join(',');}
  if(state.startingIds?.size)values.starts=[...state.startingIds].join(',');
  if(state.customStart)values.startOnly='1';
  if(state.connectionDistance!=null)values.distance=normalizeConnectionDistance(state.connectionDistance);
  values.colors=normalizeColorMode(state.colorMode);
  if(state.pinnedIds?.size)values.pins=[...state.pinnedIds].sort().join(',');
  if(state.pinOverview&&state.view==='network'&&state.research?.steps.length)values.pinsView='1';
  if(state.research?.steps.length)values.research=state.research.steps.map(step=>step.kind+':'+step.id).join('|');
  if(state.focus&&state.focusEntity&&(state.selected?.kind!=='node'||state.selected.id!==state.focusEntity))values.center=state.focusEntity;
  if(state.focus&&Object.hasOwn(relationships,state.focusType))values.focusType=state.focusType;
  if(state.trailNodes?.size)values.trail=[...state.trailNodes].join(',');
  if(state.trailEdges?.size)values.trailEdges=[...state.trailEdges].join(',');
  if(state.collapsedNodes?.size)values.collapsed=[...state.collapsedNodes].join(',');
  const tags=normalizeTags(state.tags??state.tag);if(state.view==='network'&&tags.length){if(tags.length===1)values.tag=tags[0];else values.tags=tags.join(',');}
  const selected=currentSelection(state.selected);if(selected)values.record=`${recordKind(selected.kind)}:${selected.id}`;
  if(state.path)values.path=state.path.edges.join(',');
  if(state.bucketMode)values.group='type';if(state.showAmounts)values.amounts='1';
  for(const [key,value]of Object.entries(values))if(value!==''&&value!=null)p.set(key,value);
  if(state.startingIds&&!state.startingIds.size)p.set('starts','');
  return url.href;
}
export function decodeState(base,defaults) {
  const p=new URL(base).searchParams;
  const list=(key,allowed,original)=>p.has(key)?new Set(p.get(key).split(',').filter(v=>Object.hasOwn(allowed,v))):new Set(original);
  const state={...defaults,categories:list('categories',categories,defaults.categories),relationships:list('relationships',relationships,defaults.relationships)};
  state.connectionDistance=normalizeConnectionDistance(p.has('distance')?p.get('distance'):defaults.connectionDistance);
  state.colorMode=normalizeColorMode(p.has('colors')?p.get('colors'):defaults.colorMode);
  state.pinnedIds=new Set((p.get('pins')||'').split(',').filter(Boolean));
  state.requestedResearch=(p.get('research')||'').split('|').filter(Boolean).map(value=>{const split=value.indexOf(':');return {kind:value.slice(0,split),id:value.slice(split+1),note:''};});
  state.focusEntity=p.get('center')||'';
  state.focusType=Object.hasOwn(relationships,p.get('focusType'))?p.get('focusType'):'';
  state.bucketMode=p.get('group')==='type';state.showAmounts=p.get('amounts')==='1';
  state.trailNodes=new Set((p.get('trail')||'').split(',').filter(Boolean));state.trailEdges=new Set((p.get('trailEdges')||'').split(',').filter(Boolean));state.collapsedNodes=new Set((p.get('collapsed')||'').split(',').filter(Boolean));
  state.tags=new Set(normalizeTags(p.has('tags')?p.get('tags'):p.get('tag')));
  if(['explore','full'].includes(p.get('map')))state.mapMode=p.get('map');
  else if(p.has('case')||p.has('categories')||p.has('relationships'))state.mapMode='full'; // Existing shared views retain their original full context.
  state.exploredIds=new Set(p.has('explored')?p.get('explored').split(',').filter(Boolean):[]);
  state.explorationSeeds=new Set(p.has('seeded')?p.get('seeded').split(',').filter(Boolean):state.exploredIds);
  state.openNodes=new Set((p.get('expanded')||'').split(',').filter(Boolean));
  state.exploreRoot=p.get('anchor')||p.get('starts')?.split(',').filter(Boolean)[0]||((p.has('starts')&&!p.get('starts'))||p.get('startOnly')==='1'?'':defaults.exploreRoot||'city');
  state.startingIds=new Set((p.has('starts')?p.get('starts'):p.get('startOnly')==='1'?'':state.exploreRoot).split(',').filter(Boolean));
  state.customStart=p.get('startOnly')==='1';
  if(['all','money',...Object.keys(cases)].includes(p.get('case')))state.caseId=p.get('case');
  state.view=views.includes(p.get('view'))?p.get('view'):views.includes(defaults.view)?defaults.view:'network';
  for(const [param,key]of [['q','query'],['from','from'],['to','to']])if(p.has(param))state[key]=p.get(param);
  for(const [param,key]of [['history','history'],['uncertain','includeUncertain'],['focus','focus']])if(p.has(param))state[key]=p.get(param)!=='0';
  if(Object.hasOwn(connectionModes,p.get('mode')))state.connectionMode=p.get('mode');
  if(['auto','all','off'].includes(p.get('labels')))state.labels=p.get('labels');
  const raw=p.get('record'),split=raw?.indexOf(':');
  if(split>0&&kinds[raw.slice(0,split)])state.selected={kind:kinds[raw.slice(0,split)],id:raw.slice(split+1)};
  state.requestedRelease=p.get('release');state.requestedPath=p.has('path')?p.get('path').split(',').filter(Boolean):null;
  const hasMapContext=['case','map','record','path','starts','seeded','expanded','explored','anchor','q','categories','relationships','mode','from','to','history','focus','startOnly','pins','trail','trailEdges','collapsed'].some(key=>p.has(key));
  if(!hasMapContext){state.mapMode='explore';state.exploreRoot='';state.startingIds=new Set();state.explorationSeeds=new Set();state.exploredIds=new Set();state.openNodes=new Set();state.customStart=true;state.selected=null;state.path=null;state.query='';state.focus=false;}
  const legacyEvent=state.selected?.kind==='event';
  if(legacyEvent){state.selected=currentSelection(state.selected);if(!state.selected)state.routeWarning='This event record is unavailable in this edition.';}
  if(p.get('view')==='timeline'||legacyEvent){
    state.view='network';state.query='';state.path=null;
    const entity=nodes.find(node=>node.id===(p.get('entity')||''));
    if(!state.selected&&entity)state.selected={kind:'node',id:entity.id};
    const edge=state.selected?.kind==='edge'?edges.find(edge=>edge.id===state.selected.id):null;
    const root=state.selected?.kind==='node'?state.selected.id:edge?.source;
    if(root){state.exploreRoot=root;state.startingIds=new Set([root]);state.explorationSeeds=new Set([root]);state.customStart=false;state.focus=state.selected.kind==='node';state.focusEntity=state.focus?root:'';}
  }
  state.pinOverview=state.view==='network'&&p.get('pinsView')==='1'&&!!(state.requestedResearch.length||state.pinnedIds.size);
  try{validateRange(state.from,state.to);}catch{state.from='';state.to='';state.routeWarning='Invalid historical date range was cleared.';}
  return state;
}
