import { meta, nodes, edges, sources, categories, relationships, cases, evidenceStatuses } from './data.js';
import { filterGraph, shortestPath, matches, normalize } from './core.js';
import { seedExploration,exploredGraph,branchExploration,nodeNeighborhood,transitionCamera,normalizeConnectionDistance } from './exploration.js';
import { repositoryURL } from './project-links.js';
import { startingConnections,pathForeground,revealedPathPositions } from './exploration-paths.js';
import { buildTimelineEvents, filterTimelineEvents, formatEventDate, timelineYear, timelineLanes, moneyKinds } from './timeline.js';
import { mediaProfiles,mediaLeads } from './media.js';
import { readerField,profileCopy,leadStories,overlapLabel } from './reader-copy.js';
import { datasetFor, evidencePacket, publicSource, release, reviewFor } from './contract.js';
import { validityFor, validityInRange, findPaths, validateRange } from './reporting.js';
import { relationshipMatches, sourceMatches } from './search.js';
import { encodeState, decodeState, recordURL, recordKind } from './routing.js';
import {detailsWidth,pairedRelationships,relationshipIcons} from './explorer-ui.js';
import {tagDefinitions,recordTags,tagForeground,taggedGraph,tagSelection} from './tags.js';
import {explorerSearch} from './explorer-search.js';
import {scopedConnections,connectionGroups} from './canvas-layout.js';
import {validateView} from './saved-views.js';
import {overlaps,bubbleLabel} from './semantic-map.js';
import {emptyResearch,validateResearch,researchConnections} from './research-paths.js';
import {mountResearchUI} from './research-ui.js';
import {campaignRoster} from './campaigns-2026.js';
import {campaignMoneyCard,mountCampaignMoney} from './campaign-finance-ui.js';
import {campaignFinanceIndex} from './campaign-finance-index.js';
import {connectionSummary,focusFlight,extendTrail} from './focused-explorer.js';
import {bucketLayout,selectionGraph,segmentInBox,circleInBox,dollarLabel} from './map-actions.js';
import {networkPositions,frameNetwork,networkStyle,showNetworkLabel} from './desktop-network.js';

const $ = id => document.getElementById(id);
const campaignMoneyUI=mountCampaignMoney({openEntity:id=>{resetFilters(false);toggleNode(id);state.detailsOpen=true;render();}});
const nodeById = new Map(nodes.map(n => [n.id, n]));
const edgeById = new Map(edges.map(e => [e.id, e]));
const sourceById = new Map(sources.map(s => [s.id, s]));
const degrees = new Map(nodes.map(n => [n.id, edges.filter(e => e.source === n.id || e.target === n.id).length]));
const edgePairs=new Map(),edgeBends=new Map();
edges.forEach(edge=>{const key=[edge.source,edge.target].sort().join('|');if(!edgePairs.has(key))edgePairs.set(key,[]);edgePairs.get(key).push(edge);});
edges.forEach((edge,index)=>{const parallel=edgePairs.get([edge.source,edge.target].sort().join('|'));edgeBends.set(edge.id,parallel.length>1?(parallel.indexOf(edge)-(parallel.length-1)/2)*90*(edge.source<edge.target?1:-1):(index%3-1)*12);});
const naturalLayout=networkPositions({nodes,edges});
const positions = new Map([...naturalLayout].map(([id,p])=>[id,{...p}]));
const nodeEls = new Map();
const edgeEls = new Map();
const markerEls = new Map();
const caseNodes = new Set(edges.filter(e => e.caseId).flatMap(e => [e.source, e.target]));
const svgNS = 'http://www.w3.org/2000/svg';
const timelineEvents=buildTimelineEvents(edges,sources);
const state = { view: 'network', caseId: 'all', categories: new Set(Object.keys(categories)), relationships: new Set(Object.keys(relationships)), history: true, query: '', selected: null, focus: false, path: null, labels: 'auto', timelineEntity:'jobsohio',timelineScope:'direct',timelineMoney:'all',timelineUndated:true };
const distancePreferenceKey='columbus-network:reveal-distance-v2';
let preferredConnectionDistance=1;
try{preferredConnectionDistance=normalizeConnectionDistance(localStorage.getItem(distancePreferenceKey),1);}catch{}
Object.assign(state,{connectionMode:'all',from:'',to:'',includeUncertain:true,mapMode:'explore',exploreRoot:'',exploredIds:new Set(),explorationSeeds:new Set(),openNodes:new Set(),startingIds:new Set(),customStart:true,detailsOpen:false,connectionDistance:preferredConnectionDistance});
state.pinnedIds=new Set();state.pinnedEdgeIds=new Set();state.research=emptyResearch();
state.trailNodes=new Set();state.trailEdges=new Set();state.collapsedNodes=new Set();
state.multiNodes=new Set();state.multiEdges=new Set();state.bucketMode=false;state.bucketIds=null;state.showAmounts=false;
let boxSelectMode=false,spaceToPan=false;
let quickCollapsed=true;
let researchUI=null,recordMenuOpen=false,semanticNodes=new Set(),semanticEdges=new Set(),legendSignature='',semanticStyles=new Map(),legendReflow=false,focusDensity=1,focusMenuRect=null,popoverSignature='';
let focusPorts=new Map(),compactFocusNames=false;
let workspaceTimer=null,entityScale=1,entityTooltipId=null,cloudSceneIds=new Set(),cloudNeedsFit=false,canvasBaseHeight=null;
const defaults={...state};
state.tags=new Set();defaults.tags=new Set();
let restoringURL=true,selectionOpener=null;
function syncURL(){if(!restoringURL){history.replaceState(null,'',encodeState(location.href,state,release.releaseId));if(state.requestedRelease&&state.requestedRelease!==release.releaseId){state.requestedRelease=release.releaseId;$('route-warning').hidden=true;}scheduleWorkspaceState();}}
function downloadJSON(output,name){const url=URL.createObjectURL(new Blob([JSON.stringify(output,null,2)],{type:'application/json'}));const anchor=document.createElement('a');anchor.href=url;anchor.download=name;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function rememberOpener(){const element=document.activeElement;selectionOpener=element?.dataset?.edge?`[data-edge="${CSS.escape(element.dataset.edge)}"]`:element?.dataset?.source?`[data-source="${CSS.escape(element.dataset.source)}"]`:element?.dataset?.timelineEvent?`[data-timeline-event="${CSS.escape(element.dataset.timelineEvent)}"]`:element?.dataset?.nodeDetail?`[data-node-detail="${CSS.escape(element.dataset.nodeDetail)}"]`:element?.dataset?.node?`.node-core[data-node="${CSS.escape(element.dataset.node)}"]`:'#search';}
function restoreFocus(){const target=[...document.querySelectorAll(selectionOpener||'#search')].find(el=>!el.closest('[hidden]')&&el.getClientRects().length);(target||$('search')).focus({preventScroll:true});}
let shownTimelineEvents=[];
let graph,hiddenByDistance=0;
let camera = { x: 0, y: 0, z: 1 };
let dimensions = { width: 800, height: 570 };
let drag = null;
let suppressClick = false;
let toastTimer;
let hoveredNode=null;
let expansionAnimation=null;
let startingSearchResults=[],indirectRoutes=[],comparison={direct:[],indirect:[],disconnected:[]},windowOrder=40;
const routeEls=new Map();
let previewTag='',tagPreviewOwner=null,tagStatsCache=new Map();
const connectionIcons=new Map(),panelAnimations=new Map();
let hoveredEdge=null;
const detailsPreferenceKey='columbus-network:details-layout';
let detailsLayout={docked:false,floatingWidth:380,dockedWidth:380,floatingHeight:430};
try{const saved=JSON.parse(localStorage.getItem(detailsPreferenceKey));if(saved){detailsLayout.docked=saved.docked===true;for(const key of ['floatingWidth','dockedWidth','floatingHeight'])if(Number.isFinite(saved[key]))detailsLayout[key]=saved[key];}}catch{}
let floatingDetailsPosition=null,detailsResize=null;
let quickPosition=null,quickDocked=false,quickSize=null,windowResize=null;
function focusEntityId(){return state.focus?(state.focusEntity||(state.selected?.kind==='node'?state.selected.id:null)):null;}
const explorationHistory=[];
function copyViewState(value){return {...value,multiNodes:new Set(value.multiNodes),multiEdges:new Set(value.multiEdges),bucketIds:value.bucketIds?new Set(value.bucketIds):null,trailNodes:new Set(value.trailNodes),trailEdges:new Set(value.trailEdges),collapsedNodes:new Set(value.collapsedNodes),research:structuredClone(value.research),pinnedEdgeIds:new Set(value.pinnedEdgeIds),pinnedIds:new Set(value.pinnedIds),tags:new Set(value.tags),categories:new Set(value.categories),relationships:new Set(value.relationships),startingIds:new Set(value.startingIds),exploredIds:new Set(value.exploredIds),explorationSeeds:new Set(value.explorationSeeds),openNodes:new Set(value.openNodes),selected:value.selected?{...value.selected}:null,path:value.path?{...value.path,nodes:[...value.path.nodes],edges:[...value.path.edges]}:null};}
function rememberView(){
  if(state.view!=='network'||restoringURL)return;
  explorationHistory.push({state:copyViewState(state),graph:{...graph,nodes:[...graph.nodes],edges:[...graph.edges]},positions:new Map([...positions].map(([id,p])=>[id,{...p}])),camera:{...camera},dimensions:{...dimensions},entityScale,overviewIds:[...cloudSceneIds],focusDensity,focusPorts:new Map(focusPorts),focusMenuRect:focusMenuRect?{...focusMenuRect}:null,compactFocusNames,recordMenuOpen});
  if(explorationHistory.length>30)explorationHistory.shift();$('undo-map').disabled=false;document.body.dataset.canUndo='true';
}
function undoExploration(){
  if(!explorationHistory.length)return;settleExpansion(false);hideTagPreview();const previous=explorationHistory.pop();
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){applyUndoSnapshot(previous);return;}
  const currentIds=new Set(graph.nodes.map(node=>node.id)),previousIds=new Set(previous.graph.nodes.map(node=>node.id)),currentEdges=new Set(graph.edges.map(edge=>edge.id)),previousEdges=new Set(previous.graph.edges.map(edge=>edge.id));
  const sharedId=state.selected?.kind==='node'&&previousIds.has(state.selected.id)?state.selected.id:previous.state.selected?.kind==='node'?previous.state.selected.id:previous.graph.nodes[0]?.id||state.exploreRoot;
  const anchor={...(positions.get(sharedId)||{x:0,y:0})},startCamera={...camera},targets=new Map(),starts=new Map();
  const outgoing=new Set([...currentIds].filter(id=>!previousIds.has(id))),incoming=new Set([...previousIds].filter(id=>!currentIds.has(id))),outgoingEdges=new Set([...currentEdges].filter(id=>!previousEdges.has(id))),incomingEdges=new Set([...previousEdges].filter(id=>!currentEdges.has(id)));
  graph={...graph,nodes:[...new Map([...graph.nodes,...previous.graph.nodes].map(node=>[node.id,node])).values()],edges:[...new Map([...graph.edges,...previous.graph.edges].map(edge=>[edge.id,edge])).values()]};
  for(const node of graph.nodes){const start=incoming.has(node.id)?anchor:positions.get(node.id),target=previousIds.has(node.id)?previous.positions.get(node.id):anchor;starts.set(node.id,{...start});targets.set(node.id,{...target});positions.set(node.id,{...start});}
  expansionAnimation={targets,starts,revealing:incoming,anchor,startCamera,endCamera:{...previous.camera},sharedScale:false,start:null,frame:null,undoSnapshot:previous,outgoing,incoming,outgoingEdges,incomingEdges};
  renderGraph();incoming.forEach(id=>nodeEls.get(id).group.classList.add('revealing'));outgoing.forEach(id=>nodeEls.get(id).group.style.pointerEvents='none');
  $('graph').dataset.undoMotion='true';$('graph').setAttribute('aria-busy','true');$('undo-map').setAttribute('aria-busy','true');$('graph').classList.toggle('animating',expansionAnimation.sharedScale);positionGraph();expansionAnimation.frame=requestAnimationFrame(animateExpansion);
}
function applyUndoSnapshot(previous,keepFrame=false){
  entityScale=previous.entityScale||1;$('graph').style.setProperty('--entity-label-size',Math.max(11,13*entityScale)+'px');
  const currentPositions=keepFrame?new Map(positions):null,currentCamera={...camera};Object.assign(state,copyViewState(previous.state));focusDensity=previous.focusDensity||1;compactFocusNames=!!previous.compactFocusNames;focusPorts=new Map(previous.focusPorts||[]);focusMenuRect=previous.focusMenuRect;recordMenuOpen=previous.recordMenuOpen;positions.clear();previous.positions.forEach((p,id)=>positions.set(id,{...(currentPositions?.get(id)||p)}));hoveredNode=null;hoveredEdge=null;edgeEls.forEach(({group})=>group.classList.remove('hovered'));connectionIcons.forEach(({group})=>group.classList.remove('hovered'));
  $('search').value=state.query;$('topic-select').value=state.caseId;syncReportingControls();$('history').checked=state.history;
  defaults.connectionDistance=state.connectionDistance;try{localStorage.setItem(distancePreferenceKey,String(state.connectionDistance));}catch{}
  $('filters').querySelectorAll('[data-category]').forEach(input=>input.checked=state.categories.has(input.dataset.category));$('filters').querySelectorAll('[data-relationship]').forEach(input=>input.checked=state.relationships.has(input.dataset.relationship));
  cloudSceneIds=new Set(previous.overviewIds||[]);renderEntitySearch();render();const bounds=$('canvas-area').getBoundingClientRect();dimensions={width:bounds.width,height:bounds.height};camera=keepFrame?currentCamera:Math.abs(dimensions.width-previous.dimensions.width)<1&&Math.abs(dimensions.height-previous.dimensions.height)<1?previous.camera:fittedCamera();positionGraph();$('undo-map').disabled=!explorationHistory.length;document.body.dataset.canUndo=String(!!explorationHistory.length);syncURL();toast('Previous map restored');
}

const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
function tagButtons(kind,id){return '<div class="record-tags" aria-label="Record tags">'+recordTags(kind,id).map(tag=>'<button type="button" data-tag="'+tag+'" aria-pressed="'+String(state.view==='network'&&state.tags.has(tag))+'">'+escape(tagDefinitions[tag].label)+'</button>').join('')+'</div>';}
function tagCountText(matches){return [matches.nodes.size?matches.nodes.size+' '+(matches.nodes.size===1?'entity':'entities'):'',matches.edges.size?matches.edges.size+' '+(matches.edges.size===1?'connection':'connections'):''].filter(Boolean).join(' · ')||'No matching records';}
function tagStats(id){const ids=state.view==='network'?[...state.tags,id]:[id],key=[...new Set(ids)].sort().join(',')+'|'+id;if(!tagStatsCache.has(key)){const match=tagSelection(baseGraph(),ids).byTag.find(tag=>tag.id===id);tagStatsCache.set(key,{nodes:new Set(match.entityIds),edges:new Set(match.relationshipIds)});}return tagStatsCache.get(key);}
function showTagPreview(button){
  const id=button.dataset.tag;if(!tagDefinitions[id])return;if(tagPreviewOwner&&tagPreviewOwner!==button)tagPreviewOwner.removeAttribute('aria-describedby');tagPreviewOwner=button;previewTag=id;
  const tooltip=$('tag-tooltip');tooltip.innerHTML='<strong>'+escape(tagDefinitions[id].label)+'</strong><p>'+escape(tagDefinitions[id].description)+'</p><small>'+escape(tagCountText(tagStats(id)))+(state.view==='network'&&state.tags.size?' with active tags':' in the current filters')+'</small>';tooltip.hidden=false;button.setAttribute('aria-describedby','tag-tooltip');
  const bounds=button.getBoundingClientRect(),width=document.documentElement.clientWidth,height=document.documentElement.clientHeight;tooltip.style.left=Math.max(12,Math.min(bounds.left,width-tooltip.offsetWidth-12))+'px';tooltip.style.top=(bounds.bottom+tooltip.offsetHeight+12<height?bounds.bottom+8:Math.max(8,bounds.top-tooltip.offsetHeight-8))+'px';
  if(state.view==='network'&&graph)renderGraph();
}
function hideTagPreview(){
  const hadPreview=!!previewTag;previewTag='';tagPreviewOwner?.removeAttribute('aria-describedby');tagPreviewOwner=null;$('tag-tooltip').hidden=true;if(hadPreview&&state.view==='network'&&graph)renderGraph();
}
function applyTag(id,{toggle=true}={}){
  if(!tagDefinitions[id])return;settleExpansion(false);hideTagPreview();if(state.view!=='network')setView('network');
  if(!toggle&&state.tags.has(id)){state.query='';$('search').value='';renderEntitySearch();return;}
  rememberView();const startCamera={...camera},anchor={...(positions.get(focusEntityId()||state.exploreRoot)||{x:0,y:0})};
  state.tags=new Set(state.tags);if(toggle&&state.tags.has(id))state.tags.delete(id);else state.tags.add(id);
  state.query='';$('search').value='';state.selected=null;state.path=null;state.focus=false;state.focusEntity='';renderEntitySearch();render();
  const bounds=$('canvas-area').getBoundingClientRect();dimensions={width:bounds.width,height:bounds.height};const endCamera=fittedCamera();
  if(!graph.nodes.length||matchMedia('(prefers-reduced-motion: reduce)').matches){camera=endCamera;positionGraph();}
  else{camera=startCamera;expansionAnimation={targets:new Map(),starts:new Map(),revealing:new Set(),anchor,startCamera,endCamera,sharedScale:graph.nodes.length>80,start:null,frame:null};$('graph').setAttribute('aria-busy','true');$('graph').classList.toggle('animating',expansionAnimation.sharedScale);positionGraph();expansionAnimation.frame=requestAnimationFrame(animateExpansion);}
}
const dot = category => `<span class="category-dot" style="--color:${categories[category].color}"></span>`;
const initials = node => node.category === 'person' || node.category === 'politician' ? node.name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('') : node.id === 'partnership' ? 'CP' : node.id === 'smart-columbus' ? 'SC' : node.id === 'city' ? 'C' : node.name.split(' ').filter(n => !['&', 'of', 'the'].includes(n.toLowerCase())).map(n => n[0]).slice(0, 2).join('');
const friendlyDate = date => !date ? 'Undated page' : date.length === 4 ? date : date.length===7?new Intl.DateTimeFormat('en-US',{month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(date+'-01T12:00:00Z'))+' · month only':new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(date + 'T12:00:00Z'));
const baseGraph = () => filterGraph({ ...state, query: '' });

const topicRoots={all:'city',money:'city',cityhall:'city',jobsohio:'jobsohio',media:'wsyx',politics:'vivek',campaigns2026:'ohio-governor-election',sports:'hsg',datacenters:'google',alpr:'flock',hb6:'aep',epstein:'les',redflex:'redflex'};
function seedMap(preferred=state.exploreRoot){const seed=seedExploration(baseGraph(),preferred);state.exploreRoot=seed.root;state.explorationSeeds=new Set(seed.ids);state.openNodes=new Set();state.exploredIds=seed.ids;state.startingIds=new Set(seed.root?[seed.root]:[]);state.customStart=false;}
function currentResearch(){return researchConnections(state.research.steps,{nodes,edges});}
function exploredForeground(){
  const ids=new Set([...state.trailEdges,...(state.path?.edges||[]),...currentResearch().edgeIds]);
  const links=graph.edges.filter(edge=>ids.has(edge.id));
  return {edges:new Set(links.map(edge=>edge.id)),nodes:new Set(links.flatMap(edge=>[edge.source,edge.target]))};
}
function syncResearchPins(){const path=currentResearch();state.pinnedIds=path.anchors;state.pinnedEdgeIds=path.pinnedEdges;}
function networkGraph(){
  const available=filterGraph(state);let result=available;
  if(state.path){const ids=new Set(state.path.nodes);result={...available,nodes:available.nodes.filter(node=>ids.has(node.id)),edges:available.edges.filter(edge=>state.path.edges.includes(edge.id))};}
  else if(state.tags.size)result=taggedGraph(available,state.tags);
  hiddenByDistance=0;
  if(state.bucketMode&&state.bucketIds){const ids=state.bucketIds;result={...result,nodes:result.nodes.filter(node=>ids.has(node.id)),edges:result.edges.filter(edge=>ids.has(edge.source)&&ids.has(edge.target))};}
  return result;
}
function retainExploredPath(to=''){
  const trail=extendTrail({nodes:state.trailNodes,edges:state.trailEdges},{nodes,edges},{from:focusEntityId(),to,path:state.path});state.trailNodes=trail.nodes;state.trailEdges=trail.edges;
}
function refreshMapScope(){state.selected=null;state.path=null;state.focus=false;hoveredNode=null;if(state.mapMode==='explore'&&!state.customStart)seedMap(topicRoots[state.caseId]||state.exploreRoot);applyCaseLayout();}
function toggleNode(id){
  if(!nodeById.has(id))return;
  settleExpansion(false);rememberView();rememberOpener();retainExploredPath(id);
  state.multiNodes=new Set([id]);state.multiEdges.clear();state.selected={kind:'node',id};
  state.focus=true;state.focusEntity=id;state.detailsOpen=true;state.path=null;recordMenuOpen=false;
  state.query='';$('search').value='';$('starting-results').hidden=true;state.openNodes.add(id);state.explorationSeeds.add(id);state.startingIds=new Set([id]);
  hoveredNode=null;hideEntityTooltip();render();
}
function animateFocusChange(change,id=focusEntityId(),remember=true){
  settleExpansion(false);if(remember)rememberView();change();if(state.view!=='network')setView('network');else render();
  positionGraph();scheduleWorkspaceState();
}
function settleExpansion(finish=true){
  if(!expansionAnimation)return;
  const animation=expansionAnimation;cancelAnimationFrame(animation.frame);
  if(finish){animation.targets.forEach((point,id)=>positions.set(id,{...point}));camera={...animation.endCamera};}
  animation.revealing.forEach(id=>{nodeEls.get(id).group.classList.remove('revealing');nodeEls.get(id).core.setAttribute('tabindex','0');});
  if(animation.undoSnapshot){nodeEls.forEach(({group})=>{group.style.opacity='';group.style.pointerEvents='';});edgeEls.forEach(({group})=>group.style.opacity='');connectionIcons.forEach(({group})=>group.style.opacity='');delete $('graph').dataset.undoMotion;$('undo-map').removeAttribute('aria-busy');}
  expansionAnimation=null;
  $('graph').classList.remove('animating');if(animation.undoSnapshot)applyUndoSnapshot(animation.undoSnapshot,!finish);else {positionGraph();if(finish)repairFocusedPlacement();}
  if(finish)publishWorkspaceState();$('graph').removeAttribute('aria-busy');
}
function animateExpansion(time){
  const animation=expansionAnimation;if(!animation)return;
  animation.start??=time;const progress=Math.min(1,(time-animation.start)/(animation.duration||240)),eased=progress*progress*(3-2*progress);
  animation.targets.forEach((target,id)=>{
    const start=animation.starts.get(id);positions.set(id,{x:start.x+(target.x-start.x)*eased,y:start.y+(target.y-start.y)*eased});
  });
  camera=animation.flightTravel!==undefined?focusFlight(animation.startCamera,animation.endCamera,animation.anchor,eased,animation.flightTravel):transitionCamera(animation.startCamera,animation.endCamera,animation.anchor,eased);
  animation.pinnedScreens?.forEach((point,id)=>positions.set(id,{x:(point.x-camera.x)/camera.z,y:(point.y-camera.y)/camera.z}));
  positionGraph();
  if(animation.undoSnapshot){
    for(const [ids,amount]of [[animation.outgoing,1-eased],[animation.incoming,eased]])ids.forEach(id=>{const group=nodeEls.get(id).group;group.style.opacity=amount*(group.classList.contains('context-node')?.5:1);});
    for(const [ids,amount]of [[animation.outgoingEdges,1-eased],[animation.incomingEdges,eased]])ids.forEach(id=>{const group=edgeEls.get(id).group;group.style.opacity=amount*(group.classList.contains('context-link')?.5:1);});
    connectionIcons.forEach(({group,peerIds})=>{if(peerIds.length&&peerIds.every(id=>animation.outgoingEdges.has(id)))group.style.opacity=1-eased;else if(peerIds.length&&peerIds.every(id=>animation.incomingEdges.has(id)))group.style.opacity=eased;});
  }
  if(progress>=1)settleExpansion();else animation.frame=requestAnimationFrame(animateExpansion);
}
function expansionAnchor(){if(focusEntityId())return focusEntityId();return state.selected?.kind==='node'&&graph.nodes.some(n=>n.id===state.selected.id)?state.selected.id:state.exploreRoot;}
function branchAction(id){const count=baseGraph().edges.filter(edge=>edge.source===id||edge.target===id).length;return {opened:false,count,disabled:!count,label:'Center on map · '+count+' connections'};}
function togglePin(id){settleExpansion(false);researchUI.toggle('entity',id);}
function renderPins(){
  const tray=$('pinned-anchors');tray.hidden=!state.pinnedIds.size;
  tray.innerHTML=state.pinnedIds.size?'<span class="anchor-label">Pinned anchors</span>'+[...state.pinnedIds].map(id=>'<span class="anchor-chip"><button data-anchor-focus="'+id+'" title="Explore this anchor">'+escape(nodeById.get(id)?.name||id)+'</button><button data-toggle-pin="'+id+'" aria-label="Unpin '+escape(nodeById.get(id)?.name||id)+'">×</button></span>').join(''):'';
}
function renderConnectionLegend(){
  const scene=false,displayed=graph.edges.filter(edge=>semanticEdges.has(edge.id));
  const signature=displayed.map(edge=>edge.id).join(',')+'|'+[...state.relationships].join(',')+'|'+state.connectionMode+'|'+focusEntityId()+'|'+state.focusType;if(signature===legendSignature)return;legendSignature=signature;
  const unfiltered=filterGraph({...state,query:'',relationships:new Set(Object.keys(relationships)),connectionMode:'all'}),center=focusEntityId(),shown=new Set(graph.nodes.map(node=>node.id));
  const relevant=unfiltered.edges.filter(edge=>center?edge.source===center||edge.target===center:shown.has(edge.source)||shown.has(edge.target));
  const modeTypes=connectionModesForLegend();
  const shortLabels={leadership:'Leadership',board:'Boards',control:'Control',candidacy:'Candidates',ownership:'Ownership',voting:'Voting',affiliation:'Affiliation',partnership:'Programs',history:'Past affiliation',money:'Money',funding:'Funding',contract:'Contracts',influence:'Public benefits',lobbying:'Lobbying',endorsement:'Support',opposition:'Opposition',content:'Media',editorial:'Editorial',allegation:'Allegations'};
  $('legend-types').innerHTML=connectionGroups.flatMap(group=>group.types).map(id=>{const count=displayed.filter(edge=>edge.type===id).length,available=relevant.filter(edge=>edge.type===id).length,enabled=!!count||state.relationships.has(id)&&(!modeTypes||modeTypes.includes(id))&&(!center||!state.focusType||state.focusType===id);if(!count&&(enabled||!available))return '';return '<li data-legend-type="'+id+'" title="'+escape(relationships[id].label)+'" class="'+(!enabled?'legend-filtered':'')+'"><span class="legend-line" style="--color:'+relationships[id].color+'" aria-hidden="true"></span><span class="legend-type-label">'+escape(relationships[id].label)+'</span><small>'+(!enabled?available+' hidden':count)+'</small>'+(!enabled?'<button class="legend-show" data-show-type="'+id+'" aria-label="Show '+escape(relationships[id].label)+'">Show</button>':'')+'</li>';}).join('');
}
function connectionModesForLegend(){return {ownership:['ownership','voting'],governance:['board','control'],leadership:['leadership'],money:['money','funding','contract','influence'],content:['content','affiliation','editorial']}[state.connectionMode]||null;}
function renderConnectionKey(){const displayed=graph.edges.filter(edge=>semanticEdges.has(edge.id));$('legend-key').textContent=displayed.length?[displayed.some(edge=>edge.directional)?'Arrow = direction':'',displayed.some(edge=>edge.historical)?'Dashed = past':''].filter(Boolean).join(' · '):'Connections appear as you explore.';}
function renderMapScope(){
  renderCampaignCoverage();
  const available=baseGraph(),isSmall=state.mapMode==='explore'&&!state.query.trim(),anchor=expansionAnchor();
  $('map-scope').hidden=!!state.tags.size||!nodeById.has(anchor);$('map-scope').textContent=nodeById.has(anchor)?nodeById.get(anchor).name+' · Details':'';
  $('map-scope').setAttribute('aria-expanded',String(!$('inspector').hidden));
  $('map-full').hidden=!isSmall||graph.nodes.length===available.nodes.length;
  $('map-full').textContent=state.caseId==='all'?'Browse network overview':'Browse topic overview';
  $('map-small').hidden=false;$('map-small').textContent='New search';
  const center=focusEntityId(),focused=!!center;document.querySelector('.distance-control').hidden=true;
  $('distance-summary').textContent=focused?(state.connectionDistance==='all'?'All connected entities':'Connections up to '+state.connectionDistance+' step'+(state.connectionDistance===1?'':'s'))+' from '+nodeById.get(center).name+(state.pinnedIds.size?'. Pinned research stays alongside.':'.'):'Choose an entity, then adjust the distance to reveal its neighborhood. Pins stay visible.';
  $('legend-context').textContent=focusEntityId()||state.path?'Select a connection on the map or in Details to read its evidence.':semanticEdges.size?'Only connections between visible entities are drawn.':'Overview: choose an entity to explore its connections.';
  $('connection-legend').querySelector('h2').textContent='Connection types';
  $('fit').title='Fit the current network without rearranging entities';$('fit').setAttribute('aria-label','Fit the network');
  renderConnectionLegend();renderPins();syncFilterGroups();
  renderConnectionKey();
  $('indirect-key').hidden=!indirectRoutes.length;
  const chosen=[...state.startingIds].filter(id=>nodeById.has(id)).map(id=>nodeById.get(id).name);
  $('starting-summary').textContent=chosen.length?'Starting with '+chosen.join(' + ')+(indirectRoutes.length?' · '+indirectRoutes.length+' indirect path'+(indirectRoutes.length===1?'':'s')+' to explore':'')+(comparison.disconnected.length?' · '+comparison.disconnected.length+' pair'+(comparison.disconnected.length===1?'':'s')+' with no route in these filters':''):'';

}

function renderIndirectRoutes(){
  const shown=new Set(graph.nodes.map(node=>node.id));
  comparison=startingConnections(baseGraph(),state.startingIds);
  indirectRoutes=state.view==='network'&&!(state.path&&state.research.steps.length)?comparison.indirect.filter(route=>shown.has(route.from)&&shown.has(route.to)&&!route.nodes.every(id=>shown.has(id))):[];
  $('route-layer').replaceChildren();routeEls.clear();
  indirectRoutes.forEach((route,index)=>{
    const group=svgEl('g',{class:'indirect-route',role:'button',tabindex:'0','data-route':index,'aria-label':`Show path from ${nodeById.get(route.from).name} to ${nodeById.get(route.to).name}, ${route.edges.length} recorded links`}),line=svgEl('path',{class:'indirect-line'});
    const hit=svgEl('path',{class:'indirect-hit'});
    const label=svgEl('text',{class:'indirect-label'});label.textContent=route.edges.length+' links · '+(state.path?'Show another path':'Show path');
    group.append(line,hit,label);$('route-layer').append(group);routeEls.set(index,{line,hit,label,route});
  });
}
function showExplorationPath(route,startingIds=null){
  if(!route)return;settleExpansion(false);rememberView();
  const trail=extendTrail({nodes:state.trailNodes,edges:state.trailEdges},{nodes,edges},{path:route});state.trailNodes=trail.nodes;state.trailEdges=trail.edges;
  if(startingIds)state.startingIds=new Set(startingIds);
  state.query='';$('search').value='';state.selected=null;state.focus=false;state.path=route;state.tags.clear();recordMenuOpen=false;render(true);
  toast(route.edges.length+' recorded '+(route.edges.length===1?'link':'links')+' in this path');
}
function renderEntitySearch(){
  hideTagPreview();
  const query=$('search').value.trim();startingSearchResults=explorerSearch(baseGraph(),query,state.tags);
  $('start-guide').hidden=!!query;$('start-overview-note').hidden=!!query;
  if(query)$('search-window').style.zIndex=++windowOrder;
  $('starting-results').hidden=!query;
  $('search').setAttribute('aria-expanded',String(!!query));
  const tags=startingSearchResults.filter(result=>result.kind==='tag'),entities=startingSearchResults.filter(result=>result.kind==='entity');
  $('starting-results').innerHTML=startingSearchResults.length?(tags.length?'<div class="search-results-heading">Tags</div>'+tags.map(tag=>`<button data-start-tag="${tag.id}" data-tag="${tag.id}" aria-pressed="${tag.active}"><strong><span class="search-tag-mark" aria-hidden="true">#</span>${escape(tag.label)}<span class="search-result-kind">${tag.active?'Active':tag.combined?'Add tag':'Tag'}</span></strong><small>${escape(tagCountText({nodes:{size:tag.entityCount},edges:{size:tag.connectionCount}}))}${tag.combined?' · with active tags':''}</small></button>`).join(''):'')+(entities.length?'<div class="search-results-heading">People &amp; organizations</div>'+entities.map(node=>`<button data-start-entity="${node.id}"><strong>${escape(node.label)}</strong><small>${escape(node.role)}</small></button>`).join(''):''):query?'<p role="status">No matching names or tags in the current filters.</p>':'';
}
function chooseStartingResult(result){
  if(!result)return;
  if(result.kind==='tag'){applyTag(result.id,{toggle:false});$('search').focus({preventScroll:true});}
  else addStartingEntity(result.id);
}
function openStartingEntities(){
  settleExpansion();rememberView();resetFilters(false);state.trailNodes=new Set();state.trailEdges=new Set();state.collapsedNodes=new Set();state.caseId='all';$('topic-select').value='all';$('graph-title').textContent='Columbus network';state.startingIds=new Set();state.explorationSeeds=new Set();state.exploredIds=new Set();state.openNodes=new Set();state.customStart=true;
  state.mapMode='explore';state.selected=null;state.path=null;state.focus=false;state.query='';$('search').value='';
  closeFloatingPanel('filters');closeFloatingPanel('path-dialog');setView('network');renderEntitySearch();$('search').focus({preventScroll:true});
}
function addStartingEntity(id){toggleNode(id);}

const panelLaunchers={filters:'mobile-filters','path-dialog':'path-open','connection-legend':'legend-open','guided-panel':'guided-open','research-panel':'research-open'};
function floatingPanelOpen(id){return !$(id).hidden&&$(id).dataset.motion!=='closing';}
function animateFloatingPanel(id,opening){
  const panel=$(id),launcher=$(panelLaunchers[id]),previous=panelAnimations.get(id);
  if(id==='connection-legend'){panel.hidden=!opening;launcher.setAttribute('aria-expanded',String(opening));measureWorkspace();return;}
  const current=previous?{transform:getComputedStyle(panel).transform,opacity:getComputedStyle(panel).opacity}:null;
  previous?.cancel();panelAnimations.delete(id);panel.hidden=false;
  panel.inert=!opening;panel.setAttribute('aria-hidden',String(!opening));panel.dataset.motion=opening?'opening':'closing';
  launcher.setAttribute('aria-expanded',String(opening));
  const finish=()=>{panel.hidden=!opening;panel.inert=false;panel.removeAttribute('aria-hidden');delete panel.dataset.motion;if(graph&&state.view==='network'){if(opening)zoom(1);else positionGraph();}};
  if(state.view!=='network'||matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return;}
  const bounds={left:panel.parentElement.getBoundingClientRect().left+panel.offsetLeft,top:panel.parentElement.getBoundingClientRect().top+panel.offsetTop,width:panel.offsetWidth,height:panel.offsetHeight},button=launcher.getBoundingClientRect();
  const dx=button.left+button.width/2-(bounds.left+bounds.width/2),dy=button.top+button.height/2-(bounds.top+bounds.height/2);
  const tiny={transform:`translate(${dx}px,${dy}px) scale(.04,.015)`,opacity:0},ribbon={transform:`translate(${dx*.32}px,${dy*.7}px) scale(.7,.13)`,opacity:.55},full={transform:'translate(0,0) scale(1)',opacity:1};
  const frames=opening?[current||tiny,{...ribbon,offset:.45},full]:[current||full,{...ribbon,offset:.55},tiny];
  const animation=panel.animate(frames,{duration:opening?140:100,easing:'cubic-bezier(.22,.7,.2,1)',fill:'both'});panelAnimations.set(id,animation);
  animation.finished.then(()=>{if(panelAnimations.get(id)!==animation)return;finish();animation.cancel();panelAnimations.delete(id);}).catch(()=>{});
}
function closeFloatingPanel(id){if($(id).hidden)return;const returnFocus=$(id).contains(document.activeElement);animateFloatingPanel(id,false);if(returnFocus)$(panelLaunchers[id]).focus({preventScroll:true});}
function openFloatingPanel(id){if(['guided-panel','research-panel'].includes(id)){recordMenuOpen=false;for(const other of ['guided-panel','research-panel'])if(other!==id&&!$(other).hidden)closeFloatingPanel(other);}$(id).style.zIndex=++windowOrder;animateFloatingPanel(id,true);$(id).querySelector('.floating-panel-header')?.focus({preventScroll:true});}
function mountCanvasWindows(){
  const stage=$('graph-stage'),workspace=document.querySelector('.workspace'),explorer=$('explorer');
  document.body.dataset.view=state.view;document.documentElement.style.setProperty('--masthead-height',document.querySelector('.masthead').getBoundingClientRect().height+'px');
  document.querySelector('.secondary-actions>div').append($('map-full'));explorer.append($('media-overview'));
  $('search-window').append(document.querySelector('.distance-control'),$('pinned-anchors'));
  if(state.view==='network'){
    [ $('search-window'),document.querySelector('.exploration-tools'),$('quick-menu'),$('filters'),$('connection-legend'),$('map-status'),$('active-filters'),$('path-dialog') ].forEach(element=>$('canvas-area').append(element));stage.append($('inspector'));
  }else{
    [$('search-window'),document.querySelector('.exploration-tools'),$('filters'),$('active-filters')].forEach(element=>explorer.insertBefore(element,workspace));workspace.append($('inspector'));
  }
}

const eventTitle=event=>{const edge=edgeById.get(event.primaryEdgeId);return edge&&event.title===edge.label?readerField(edge,'label'):event.title;};
const sourceLinks = ids => [...new Set(ids)].map(id => {
  const s = sourceById.get(id);
  return `<div class="source-record"><a class="source-link" href="${escape(s.archiveUrl||s.url)}" target="_blank" rel="noopener noreferrer"><span class="external" aria-hidden="true">↗</span>${escape(s.title)}<small>${escape(s.publisher)} · ${friendlyDate(s.date)}<br>${s.archiveUrl?`Wayback snapshot ${s.archiveTimestamp.slice(0,8)}`:'Original source · content checked'}</small></a><button class="small-link" data-source="${escape(s.id)}">About this source ↗</button></div>`;
}).join('');
const adjacent = (id, list = graph.edges) => list.filter(e => e.source === id || e.target === id);
const other = (edge, id) => edge.source === id ? edge.target : edge.source;
const statusBadge = e => `<span class="status-badge status-${e.status}">${escape(evidenceStatuses[e.status] || e.status)}</span>`;
const connectionRow = (e, id) => `<button class="connection-row" data-edge="${e.id}"><strong>${escape(id ? nodeById.get(other(e, id)).name : `${nodeById.get(e.source).name} ${e.directional ? '→' : '↔'} ${nodeById.get(e.target).name}`)}</strong><span><span class="relationship-swatch ${e.historical ? 'history' : ''}" style="--color:${relationships[e.type].color}"></span>${escape(readerField(e,'label'))}</span>${e.caseId ? `<small>${escape(evidenceStatuses[e.status])}</small>` : ''}</button>`;

function applyCaseLayout(){settleExpansion(false);}
function setCase(id) {
  startingSearchResults=[];$('starting-results').hidden=true;
  state.customStart=id==='campaigns2026';
  if(id==='media'&&state.caseId!=='media'){state.timelineScope='case';state.timelineEntity='wsyx';}
  state.caseId = id; state.mapMode=id==='campaigns2026'?'full':'explore';state.exploredIds=new Set();state.exploreRoot=topicRoots[id]||'city'; state.query = ''; $('search').value = ''; state.selected = null; state.path = null; state.focus = false;
  $('topic-select').value=id;
  $('graph-title').textContent = id === 'money' ? 'Money & control' : id === 'all' ? 'Columbus network' : cases[id].title;
  applyCaseLayout(); render(true);
  syncURL();
}

function toast(message) { $('toast').textContent = message; $('toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 2800); }

function syncFilterGroups(){
  $('filters').querySelectorAll('[data-category]').forEach(input=>input.checked=state.categories.has(input.dataset.category));
  $('filters').querySelectorAll('[data-relationship]').forEach(input=>input.checked=state.relationships.has(input.dataset.relationship));
  for(const group of connectionGroups){const input=$('filters').querySelector('[data-type-group="'+group.id+'"]');if(!input)continue;const count=group.types.filter(id=>state.relationships.has(id)).length;input.checked=count===group.types.length;input.indeterminate=count>0&&count<group.types.length;input.closest('summary').querySelector('small').textContent=count+'/'+group.types.length;}
}
function buildFilters() {
  $('category-filters').innerHTML='<div class="filter-bulk"><button data-filter-bulk="entities-all">All</button><button data-filter-bulk="entities-none">None</button></div>'+Object.entries(categories).map(([id,c])=>'<label class="filter-row"><input type="checkbox" data-category="'+id+'" checked>'+dot(id)+'<span>'+escape(c.label)+'</span></label>').join('');
  $('relationship-filters').innerHTML='<div class="filter-bulk"><button data-filter-bulk="all">Select all</button><button data-filter-bulk="none">Deselect all</button></div>'+connectionGroups.map(group=>'<details class="filter-type-group"><summary><input type="checkbox" data-type-group="'+group.id+'" aria-label="Include '+escape(group.label)+'" checked><span>'+escape(group.label)+'</span><small></small></summary><div>'+group.types.map(id=>'<label class="filter-row"><input type="checkbox" data-relationship="'+id+'" checked><span class="relationship-swatch" style="--color:'+relationships[id].color+'"></span><span>'+escape(relationships[id].label)+'</span></label>').join('')+'</div></details>').join('');
  $('filters').addEventListener('click',event=>{const input=event.target.closest('[data-type-group]');if(input)event.stopPropagation();const button=event.target.closest('[data-filter-bulk]');if(!button)return;rememberView();const kind=button.dataset.filterBulk;if(kind.startsWith('entities'))state.categories=new Set(kind==='entities-all'?Object.keys(categories):[]);else{state.relationships=new Set(kind==='all'?Object.keys(relationships):[]);state.connectionMode='all';}syncReportingControls();render(true);});
  $('filters').addEventListener('change',event=>{const input=event.target;if(!input.dataset.category&&!input.dataset.relationship&&!input.dataset.typeGroup&&input.id!=='history')return;rememberView();if(input.dataset.category)input.checked?state.categories.add(input.dataset.category):state.categories.delete(input.dataset.category);if(input.dataset.relationship)input.checked?state.relationships.add(input.dataset.relationship):state.relationships.delete(input.dataset.relationship);if(input.dataset.typeGroup){for(const id of connectionGroups.find(group=>group.id===input.dataset.typeGroup).types)input.checked?state.relationships.add(id):state.relationships.delete(id);state.connectionMode='all';}if(input.id==='history')state.history=input.checked;state.path=null;syncReportingControls();render(true);});
  syncFilterGroups();
}

function renderFilterChips(){
  const chips=[];
  const tags=state.view==='network'?[...state.tags]:[],selection=tags.length?tagSelection(baseGraph(),tags):null;
  $('active-tags').hidden=!tags.length;
  $('active-tags').innerHTML=tags.length?'<span class="active-tags-label">Active tags</span><div class="active-tag-list">'+tags.map(id=>'<button class="active-tag-chip" data-remove-tag="'+id+'" aria-label="Remove '+escape(tagDefinitions[id].label)+' tag">'+escape(tagDefinitions[id].label)+' <span aria-hidden="true">×</span></button>').join('')+'<button class="add-tag-button" data-add-tag>+ Add tag</button></div><p class="tag-combination-scope">'+(selection.mode==='connected'?'Connected matches · up to 2 recorded links':tags.length>1?'Matches all tags':'Search another tag to narrow this view')+'</p>':'';
  updateTagWindowSpace();
  if(state.connectionMode!=='all')chips.push(['mode',$('connection-mode').selectedOptions[0].textContent]);
  if(state.categories.size!==Object.keys(categories).length)chips.push(['categories',state.categories.size+' entity types']);
  if(state.relationships.size!==Object.keys(relationships).length)chips.push(['relationships',state.relationships.size+' connection types']);
  if(state.from||state.to)chips.push(['dates',(state.from||'Any date')+' → '+(state.to||'Any date')]);
  if(!state.history)chips.push(['history','Past records hidden']);
  if(!state.includeUncertain&&(state.from||state.to))chips.push(['uncertain','Known dates only']);
  $('active-filters').hidden=!chips.length;
  $('active-filters').innerHTML=chips.map(([key,label])=>'<button data-clear-filter="'+key+'" aria-label="Remove '+escape(label)+' filter">'+escape(label)+' <span aria-hidden="true">×</span></button>').join('');
}
function updateTagWindowSpace(){
  const active=state.view==='network'&&state.tags.size;document.body.dataset.hasTags=String(!!active);
  const height=$('search-window').offsetHeight,canvas=$('canvas-area');
  canvas.style.setProperty('--tag-search-height',height+'px');canvas.style.setProperty('--tag-controls-bottom',(height+document.querySelector('.exploration-tools').offsetHeight+28)+'px');
  positionQuickMenu();
}
$('active-filters').addEventListener('click',event=>{
  const button=event.target.closest('[data-clear-filter]');if(!button)return;
  const key=button.dataset.clearFilter;
  if(key==='mode')state.connectionMode='all';
  if(key==='categories')state.categories=new Set(Object.keys(categories));
  if(key==='relationships')state.relationships=new Set(Object.keys(relationships));
  if(key==='dates'){state.from='';state.to='';}
  if(key==='history')state.history=true;
  if(key==='uncertain')state.includeUncertain=true;
  syncReportingControls();$('history').checked=state.history;
  $('query-error').hidden=true;
  $('filters').querySelectorAll('[data-category]').forEach(input=>input.checked=state.categories.has(input.dataset.category));
  $('filters').querySelectorAll('[data-relationship]').forEach(input=>input.checked=state.relationships.has(input.dataset.relationship));
  state.selected=null;state.path=null;state.focus=false;refreshMapScope();render();
});

function svgEl(tag, attributes = {}) { const el = document.createElementNS(svgNS, tag); for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, value); return el; }
function emphasizeConnection(id,event){
  const previous=hoveredEdge;hoveredEdge=id;
  if(previous&&previous!==id){edgeEls.get(previous)?.group.classList.remove('hovered');connectionIcons.get(previous)?.group.classList.remove('hovered');}
  if(!id){$('connection-tooltip').hidden=true;raisePathForeground();return;}
  const edge=edgeEls.get(id),icon=connectionIcons.get(id);edge.group.classList.add('hovered');icon.group.classList.add('hovered');
  if(!edge.group.contains(document.activeElement)&&$('edge-layer').lastElementChild!==edge.group)$('edge-layer').append(edge.group);if(!icon.group.contains(document.activeElement)&&$('connection-icon-layer').lastElementChild!==icon.group)$('connection-icon-layer').append(icon.group);
  positionConnectionTooltip(event);
}
function positionConnectionTooltip(event){
  const tooltip=$('connection-tooltip'),edge=edgeById.get(hoveredEdge);tooltip.hidden=!edge||!semanticEdges.has(edge.id);if(tooltip.hidden)return;
  tooltip.textContent=relationships[edge.type].label+(edge.historical?' · Historical':'');
  const bounds=$('canvas-area').getBoundingClientRect(),point=edgeEls.get(edge.id).midpoint,x=event?.clientX!==undefined?event.clientX-bounds.left:camera.x+point.x*camera.z,y=event?.clientY!==undefined?event.clientY-bounds.top:camera.y+point.y*camera.z;
  tooltip.style.left=Math.max(8,Math.min(dimensions.width-tooltip.offsetWidth-8,x+14))+'px';tooltip.style.top=Math.max(8,Math.min(dimensions.height-tooltip.offsetHeight-8,y-tooltip.offsetHeight-12))+'px';
}
function hideEntityTooltip(){if(entityTooltipId)nodeEls.get(entityTooltipId)?.core.removeAttribute('aria-describedby');entityTooltipId=null;$('entity-tooltip').hidden=true;}
function showEntityTooltip(id,event){
  if(entityTooltipId!==id)hideEntityTooltip();entityTooltipId=id;
  const node=nodeById.get(id),count=degrees.get(id)||0,tooltip=$('entity-tooltip');
  tooltip.querySelector('strong').textContent=node.name;tooltip.querySelector('span').textContent=count+' recorded connection'+(count===1?'':'s');
  nodeEls.get(id).core.setAttribute('aria-describedby','entity-tooltip');positionEntityTooltip(event);
}
function positionEntityTooltip(event){
  const tooltip=$('entity-tooltip');if(!entityTooltipId||!semanticNodes.has(entityTooltipId)||state.view!=='network'||recordMenuOpen&&entityTooltipId===focusEntityId()){tooltip.hidden=true;return;}
  tooltip.hidden=false;const surface=$('canvas-area').getBoundingClientRect(),core=nodeEls.get(entityTooltipId).core.getBoundingClientRect();
  const x=event?.clientX!==undefined?event.clientX-surface.left:(core.left+core.right)/2-surface.left,y=event?.clientY!==undefined?event.clientY-surface.top:core.top-surface.top;
  tooltip.style.left=Math.max(8,Math.min(dimensions.width-tooltip.offsetWidth-8,x-tooltip.offsetWidth/2))+'px';
  const above=y-tooltip.offsetHeight-12;tooltip.style.top=Math.max(8,Math.min(dimensions.height-tooltip.offsetHeight-8,above>=8?above:core.bottom-surface.top+12))+'px';
}
function raisePathForeground(){
  const explored=exploredForeground();
  for(const id of explored.edges){const edge=edgeEls.get(id);if(edge&&edge.group.style.display!=='none'&&!edge.group.contains(document.activeElement))$('edge-layer').append(edge.group);const icon=connectionIcons.get(id);if(icon&&icon.group.style.display!=='none'&&!icon.group.contains(document.activeElement))$('connection-icon-layer').append(icon.group);}
  for(const id of explored.nodes){const node=nodeEls.get(id);if(node&&node.group.style.display!=='none'&&!node.group.contains(document.activeElement))$('node-layer').append(node.group);}
}
function positionConnectionBadges(){
  connectionIcons.forEach(({group,peerIds},id)=>{
    if(group.style.display==='none')return;const points=peerIds.map(peer=>edgeEls.get(peer).iconPoint).filter(Boolean);if(!points.length)return;
    const point={x:points.reduce((sum,p)=>sum+p.x,0)/points.length,y:points.reduce((sum,p)=>sum+p.y,0)/points.length};group.setAttribute('transform',`translate(${point.x} ${point.y}) scale(${1/camera.z})`);
    for(const peer of peerIds){const label=edgeEls.get(peer).label;label.style.display=state.labels==='off'||peer!==id?'none':'';label.dataset.badgeAnchored='true';label.dataset.x=point.x;label.dataset.y=point.y+27/camera.z;label.setAttribute('transform',`translate(${label.dataset.x} ${label.dataset.y}) scale(${1/camera.z})`);}
  });
}
function buildGraph() {
  const defs = svgEl('defs');
  for (const [id, relation] of Object.entries(relationships)) {
    const marker = svgEl('marker', {id:`arrow-${id}`, viewBox:'0 0 8 8', refX:'8', refY:'4', markerUnits:'userSpaceOnUse', orient:'auto'});
    marker.append(svgEl('path',{d:'M0,0 L8,4 L0,8 Z',fill:relation.color})); defs.append(marker); markerEls.set(id,marker);
  }
  $('graph').prepend(defs);
  edges.forEach(e => {
    const a = nodeById.get(e.source), b = nodeById.get(e.target);
    const group = svgEl('g');
    const line = svgEl('path', { class: `graph-edge${e.caseId ? ' case-link' : ''}`, stroke: relationships[e.type].color, ...(e.historical ? { 'stroke-dasharray': '5 5' } : {}), ...(e.directional ? {'marker-end':`url(#arrow-${e.type})`} : {}) });
    const hit = svgEl('path', { class: 'edge-hit', role: 'button', tabindex: '0', 'data-edge': e.id, 'aria-label': `Relationship: ${a.name} to ${b.name}, ${readerField(e,'label')}${e.historical ? ', historical' : ''}` });
    const title = svgEl('title'); title.textContent = `${relationships[e.type].label} · ${a.name} → ${b.name}: ${readerField(e,'label')}`; hit.append(title);
    const graphLabels={e45:'Power of attorney',e46:'Managed finances',e47:'Trustee 1992–2007',e49:'Spending control',e51:'Political control',e54:'Passage / repeal blockade',e55:'AEP benefit',e57:'Sole shareholder',e58:'Foundation link',e59:'$34.28m in shares',e60:'$12.38m in assets',e61:'Founded 2007',e62:'Misappropriation claim'};
    const label = svgEl('text', {class:'edge-label',fill:relationships[e.type].color}); label.textContent=graphLabels[e.id]||e.amountLabel||e.graphLabel||'';
    group.append(line, hit, label); $('edge-layer').append(group); edgeEls.set(e.id, { group, line, hit, label });
    const icon=svgEl('g',{class:'connection-icon',role:'button',tabindex:'-1','data-edge':e.id,'aria-hidden':'true','aria-label':`Connection icon: ${relationships[e.type].label}, ${readerField(e,'label')}, ${a.name} to ${b.name}`,style:`display:none;--connection-color:${relationships[e.type].color}`});
    const iconTitle=svgEl('title');iconTitle.textContent=`${relationships[e.type].label} · ${readerField(e,'label')} · Select for Pin and Details`;
    icon.append(iconTitle,svgEl('rect',{x:-22,y:-22,width:44,height:44,fill:'transparent',class:'connection-icon-hit'}),svgEl('rect',{x:-14,y:-13,width:28,height:26,rx:6,class:'connection-icon-card'}),svgEl('path',{d:relationshipIcons[e.type]||relationshipIcons.affiliation,transform:'translate(-9,-9) scale(.75)',class:'connection-icon-glyph'}));
    const count=svgEl('text',{class:'connection-icon-count',x:13,y:-10,'text-anchor':'middle'});icon.append(count);
    $('connection-icon-layer').append(icon);connectionIcons.set(e.id,{group:icon,count,peerIds:[e.id]});
    for(const element of [hit,icon]){element.addEventListener('pointerenter',event=>emphasizeConnection(e.id,event));element.addEventListener('pointermove',positionConnectionTooltip);element.addEventListener('pointerleave',()=>{if(hoveredEdge===e.id)emphasizeConnection(null);});element.addEventListener('focus',()=>emphasizeConnection(e.id));element.addEventListener('blur',()=>{if(hoveredEdge===e.id)emphasizeConnection(null);});}
  });
  nodes.forEach(n => {
    const group = svgEl('g', { class: 'graph-node', 'data-node': n.id, style: `--color:${categories[n.category].color};--base-radius:${8+Math.min(9,degrees.get(n.id)*.85)}px` });
    const title = svgEl('title'); title.textContent = `${n.name} · ${degrees.get(n.id)} recorded connection${degrees.get(n.id)===1?'':'s'} · ${n.role}`;
    const hit=svgEl('circle',{class:'node-hit',fill:'transparent'});
    const halo = svgEl('circle', { class: 'node-halo' });
    const core = svgEl('circle', { class: 'node-core',role:'button',tabindex:'0','data-node':n.id,'aria-label':`Explore ${n.name}` });
    const letter = svgEl('text', { class: 'node-letter' }); letter.textContent = initials(n);
    const label = svgEl('text', { class: 'node-label' });
    const words = n.name.split(' '); const lines = [];
    if (n.name.length > 21 && words.length > 2) { let current = ''; for (const word of words) { if ((current + ' ' + word).trim().length > 20 && current) { lines.push(current); current = word; } else current = (current + ' ' + word).trim(); } if (current) lines.push(current); } else lines.push(n.name);
    lines.forEach((line, index) => { const span = svgEl('tspan', { x: '0', dy: index ? '13' : '0' }); span.textContent = line; label.append(span); });
    const pin=svgEl('g',{class:'node-pin-control',role:'button',tabindex:'0','data-pin':n.id,'aria-label':`Pin ${n.name} as anchor`});
    pin.append(svgEl('circle',{r:22,fill:'transparent'}),svgEl('circle',{r:10,class:'node-pin-disc'}),svgEl('path',{d:'M-3 -6h6l-1 5 3 3H-5l3-3zM0 2v6',class:'node-pin-glyph'}));
    group.append(title, hit,halo, core, letter, label,pin); $('node-layer').append(group); nodeEls.set(n.id, { group, hit,halo, core, letter, label,pin,normalLines:lines });
    group.addEventListener('pointerenter',event=>{if(drag)return;hoveredNode=n.id;renderGraph();showEntityTooltip(n.id,event);});
    group.addEventListener('pointermove',positionEntityTooltip);
    group.addEventListener('pointerleave',()=>{if(drag)return;if(group.contains(document.activeElement)){positionEntityTooltip();return;}hoveredNode=null;hideEntityTooltip();renderGraph();});
    group.addEventListener('focusin',()=>{hoveredNode=n.id;renderGraph();showEntityTooltip(n.id);});
    group.addEventListener('focusout',event=>{if(group.contains(event.relatedTarget)||group.matches(':hover'))return;hoveredNode=null;hideEntityTooltip();renderGraph();});
  });
  $('graph').addEventListener('click', event => {
    if (suppressClick) { suppressClick = false; return; }
    const pin=event.target.closest('[data-pin]');if(pin){togglePin(pin.dataset.pin);return;}
    const target = event.target.closest('[data-node],[data-edge],[data-route]');
    if(target?.dataset.route!==undefined)showExplorationPath(indirectRoutes[Number(target.dataset.route)]);
    else if (target?.dataset.node) selectRecord('node',target.dataset.node,event.ctrlKey||event.metaKey);
    else if (target?.dataset.edge) selectRecord('edge',target.dataset.edge,event.ctrlKey||event.metaKey);
    else if (!target) {recordMenuOpen=false;positionGraph();}
  });
  $('graph').addEventListener('keydown', event => {
    const pin=event.target.closest('[data-pin]');if(pin&&(event.key==='Enter'||event.key===' ')){event.preventDefault();if(!event.repeat)togglePin(pin.dataset.pin);return;}
    const target = event.target.closest('[data-node],[data-edge],[data-route]');
    if ((event.key === 'Enter' || event.key === ' ') && target) { event.preventDefault(); if(!event.repeat){if(target.dataset.route!==undefined)showExplorationPath(indirectRoutes[Number(target.dataset.route)]);else selectRecord(target.dataset.node?'node':'edge',target.dataset.node||target.dataset.edge,event.ctrlKey||event.metaKey);} }
    if (event.target === $('graph')) {
      const moves = { ArrowLeft: [35, 0], ArrowRight: [-35, 0], ArrowUp: [0, 35], ArrowDown: [0, -35] };
      if (moves[event.key]) { event.preventDefault();settleExpansion(false);camera.x += moves[event.key][0]; camera.y += moves[event.key][1]; positionGraph(); }
      if (event.key === '+' || event.key === '=') { event.preventDefault(); zoom(1.25); }
      if (event.key === '-') { event.preventDefault(); zoom(.8); }
      if(event.key==='0'){event.preventDefault();fitGraph();}
    }
  });
  $('graph').addEventListener('pointerdown', event => {
    if (![0,1].includes(event.button)) return;
    if(event.target.closest('[data-pin]'))return;
    const target = event.target.closest('[data-node],[data-edge],[data-route]');
    const pan=spaceToPan||event.button===1||(!boxSelectMode&&!event.shiftKey&&!event.altKey);
    drag = { pan,route:target?.dataset.route,id:target?.dataset.node,edge:target?.dataset.edge, box:!pan&&(event.shiftKey||!target?.dataset.node&&target?.dataset.route===undefined&&boxSelectMode),additive:event.ctrlKey||event.metaKey,pointer: event.pointerId, startX: event.clientX, startY: event.clientY, lastX: event.clientX, lastY: event.clientY, moved: false };
    drag.screenToCanvas=$('graph').getScreenCTM().inverse();
    hideEntityTooltip();
    $('graph').dataset.panning=String(pan||!boxSelectMode);
    event.preventDefault();
    $('graph').setPointerCapture(event.pointerId);
  });
  $('graph').addEventListener('pointermove', event => {
    if (!drag || drag.pointer !== event.pointerId) return;
    const dx = event.clientX - drag.lastX, dy = event.clientY - drag.lastY;
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 4) drag.moved = true;
    if (drag.moved) {
      if(!drag.stoppedAnimation){settleExpansion(false);drag.stoppedAnimation=true;}
      if(drag.box){const bounds=marqueeBounds(drag.startX,drag.startY,event.clientX,event.clientY),box=$('selection-box');box.removeAttribute('hidden');box.setAttribute('x',bounds.left);box.setAttribute('y',bounds.top);box.setAttribute('width',bounds.right-bounds.left);box.setAttribute('height',bounds.bottom-bounds.top);$('graph').dataset.selecting='true';previewMarquee(bounds);}
      else if (drag.id&&!drag.pan) { const moving=state.multiNodes.has(drag.id)?state.multiNodes:new Set([drag.id]);for(const id of moving){const p=positions.get(id);p.x+=dx/camera.z;p.y+=dy/camera.z;} }
      else { camera.x += dx; camera.y += dy; }
      if(!drag.box){if(drag.id&&!drag.pan)positionGraph();else $('graph-world').setAttribute('transform',`translate(${camera.x} ${camera.y}) scale(${camera.z})`);}
    }
    drag.lastX = event.clientX; drag.lastY = event.clientY;
  });
  $('graph').addEventListener('pointerup', event => {
    if (!drag) return;
    if(drag.moved&&drag.box){
      const box=marqueeBounds(drag.startX,drag.startY,event.clientX,event.clientY),candidates=marqueeEntities(box);
      rememberView();if(!drag.additive){state.multiNodes.clear();state.multiEdges.clear();}
      for(const id of candidates)state.multiNodes.add(id);
      for(const id of semanticEdges){const edge=edgeById.get(id);if(candidates.size){if(candidates.has(edge.source)&&candidates.has(edge.target))state.multiEdges.add(id);continue;}const path=edgeEls.get(id).hit,length=path.getTotalLength();let previous=null;for(let i=0;i<=24;i++){const p=path.getPointAtLength(length*i/24),point={x:camera.x+p.x*camera.z,y:camera.y+p.y*camera.z};if(previous&&segmentInBox(previous,point,box)){state.multiEdges.add(id);break;}previous=point;}}
      clearMarquee();showSelection();
    }
    if (drag.moved){suppressClick=true;if(!drag.box)positionGraph();scheduleWorkspaceState();}
    // Pointer capture retargets the click to the canvas; activate a stationary node here.
    else if(drag.route!==undefined){showExplorationPath(indirectRoutes[Number(drag.route)]);suppressClick=true;}
    else if (drag.id) { selectRecord('node',drag.id,drag.additive); suppressClick = true; }
    else if (drag.edge) { selectRecord('edge',drag.edge,drag.additive); suppressClick = true; }
    drag = null;
    $('graph').dataset.panning='false';
    if ($('graph').hasPointerCapture(event.pointerId)) $('graph').releasePointerCapture(event.pointerId);
  });
  $('graph').addEventListener('pointercancel', () => { drag = null; suppressClick = false;clearMarquee();$('graph').dataset.panning='false'; });
  $('graph').addEventListener('wheel', event => {
    event.preventDefault(); const rect = $('graph').getBoundingClientRect();
    zoom(Math.exp(-event.deltaY * .0015), event.clientX - rect.left, event.clientY - rect.top);
  }, { passive: false });
  new ResizeObserver(entries => {
    const rect = entries[0].contentRect;
    if (!rect.width || !rect.height) return;
    if(rect.width<1||rect.height<1||Math.abs(rect.width-dimensions.width)<1&&Math.abs(rect.height-dimensions.height)<1)return;
    settleExpansion();dimensions = { width: rect.width, height: rect.height };
    updateTagWindowSpace();positionGraph();if(graph)renderMapScope();positionInspector();
  }).observe($('canvas-area'));
}

function mapObstacles(){const surface=$('canvas-area').getBoundingClientRect();return [...$('graph-stage').querySelectorAll('#search-window,#quick-menu:not([hidden]),.exploration-tools,.floating-panel:not([hidden]),#inspector:not([hidden]),#map-status,.graph-controls,#active-filters:not([hidden])')].filter(panel=>panel.getClientRects().length&&panel.dataset.motion!=='closing').map(panel=>{const r=panel.getBoundingClientRect();return {left:r.left-surface.left-7,top:r.top-surface.top-7,right:r.right-surface.left+7,bottom:r.bottom-surface.top+7};});}
function marqueeBounds(startX,startY,endX,endY){
  const start=new DOMPoint(startX,startY).matrixTransform(drag.screenToCanvas),end=new DOMPoint(endX,endY).matrixTransform(drag.screenToCanvas);
  return {left:Math.min(start.x,end.x),right:Math.max(start.x,end.x),top:Math.min(start.y,end.y),bottom:Math.max(start.y,end.y)};
}
function marqueeEntities(box){
  const hits=new Set();
  for(const id of semanticNodes){const p=positions.get(id);if(p&&circleInBox({x:camera.x+p.x*camera.z,y:camera.y+p.y*camera.z},(semanticStyles.get(id)?.radius||18)*camera.z,box))hits.add(id);}
  return hits;
}
let marqueePreview=new Set();
function previewMarquee(box){
  const next=marqueeEntities(box);
  for(const id of marqueePreview)if(!next.has(id))nodeEls.get(id)?.group.classList.remove('marquee-preview');
  for(const id of next)if(!marqueePreview.has(id))nodeEls.get(id)?.group.classList.add('marquee-preview');
  marqueePreview=next;
}
function clearMarquee(){
  $('selection-box').setAttribute('hidden','');$('graph').dataset.selecting='false';
  for(const id of marqueePreview)nodeEls.get(id)?.group.classList.remove('marquee-preview');marqueePreview.clear();
}
const bubbleTextMeasure=document.createElement('canvas').getContext('2d');
const fullNameLayouts=new Map(),cloudView=()=>!focusEntityId()&&!state.path;
function nodePresentation(id,zoom){
  if(state.bucketMode)return {detail:1,bubble:false,cloud:false,opacity:1,threshold:0,font:12,radius:12};
  return networkStyle(degrees.get(id),zoom,{selected:state.multiNodes.has(id)||hoveredNode===id});
}
function styleNode(id,zoom){
  const entry=nodeEls.get(id),protectedNode=state.pinnedIds.has(id)||state.selected?.kind==='node'&&state.selected.id===id||state.path?.nodes.includes(id);
  const style=nodePresentation(id,zoom);
  if(style.bubble&&!style.cloud)style.font=Math.min(style.font,Math.max(8,style.radius*.27));
  entry.group.dataset.bubble=String(style.bubble);
  const labelKey=style.bubble?'bubble:'+Math.round(style.radius)+':'+Math.round(style.font*2)+':'+style.fullName:'detail';
  if(entry.labelKey!==labelKey){bubbleTextMeasure.font='600 '+style.font+'px '+getComputedStyle(document.documentElement).getPropertyValue('--sans');const lines=style.fullName?style.fullLines:style.bubble?(style.radius<19?[initials(nodeById.get(id))]:bubbleLabel(nodeById.get(id).name,style.radius,style.font,text=>bubbleTextMeasure.measureText(text).width)):entry.normalLines;entry.label.replaceChildren(...lines.map(line=>{const span=svgEl('tspan',{x:0});span.textContent=line;return span;}));entry.labelKey=labelKey;}
  entry.label.style.fontSize=style.font+'px';entry.label.style.fontWeight=protectedNode||entry.group.classList.contains('trail-node')?'750':'600';entry.label.querySelectorAll('tspan').forEach((span,index)=>span.setAttribute('dy',index?String(style.font*1.12):'0'));
  const count=entry.label.children.length,y=style.bubble?-((count-1)*style.font*1.12)/2+style.font*.32:style.radius+style.font+7;
  entry.label.setAttribute('transform','translate(0 '+y/zoom+') scale('+1/zoom+')');
  entry.core.style.opacity='1';entry.halo.style.opacity=String(style.bubble?.12:style.detail);
  entry.core.setAttribute('r',style.radius/zoom);entry.halo.setAttribute('r',(style.radius+3)/zoom);entry.hit.setAttribute('r',Math.max(7,style.radius+3)/zoom);entry.letter.style.opacity=style.bubble?'0':String(style.detail);entry.letter.setAttribute('transform','scale('+1/zoom+')');entry.pin.style.display='none';
  return style;
}
function focusEdges(){
  const center=focusEntityId(),research=currentResearch();
  return graph.edges.filter(edge=>edge.source===center||edge.target===center||state.path?.edges.includes(edge.id)||state.trailEdges.has(edge.id)||research.edgeIds.has(edge.id)||state.selected?.kind==='edge'&&state.selected.id===edge.id);
}
function fittedCamera(){
  if(!graph?.nodes.length)return {...camera};
  const bounds=$('canvas-area').getBoundingClientRect();if(bounds.width<1||bounds.height<1)return {...camera};dimensions={width:bounds.width,height:bounds.height};
  if(state.bucketMode)return fitBucketCamera();
  $('bucket-layer').replaceChildren();focusPorts.clear();focusMenuRect=null;cloudNeedsFit=false;
  return frameNetwork(graph.nodes.map(node=>node.id),positions,dimensions);
}

function repairFocusedPlacement(){}

function fitGraph() {
  settleExpansion();camera=fittedCamera();positionGraph();repairFocusedPlacement();
}
function centerOnEntity(id){const p=positions.get(id);if(!p)return;const z=Math.max(.7,camera.z);camera={z,x:dimensions.width/2-p.x*z,y:dimensions.height/2-p.y*z};positionGraph();scheduleWorkspaceState();}
function zoom(factor,x=dimensions.width/2,y=dimensions.height/2){
  settleExpansion(false);const z=Math.min(3.5,Math.max(.04,camera.z*factor)),ratio=z/camera.z;
  camera={x:x-(x-camera.x)*ratio,y:y-(y-camera.y)*ratio,z};positionGraph();scheduleWorkspaceState();
}
function fitBucketCamera(){
  const layout=bucketLayout(graph,{anchor:'',width:1800});layout.positions.forEach((p,id)=>positions.set(id,{...p}));
  const layer=$('bucket-layer');layer.replaceChildren();
  for(const bucket of layout.buckets){const group=svgEl('g',{'data-bucket':bucket.type}),color=relationships[bucket.type]?.color||'var(--muted)';
    group.append(svgEl('rect',{x:bucket.left,y:bucket.top,width:bucket.width,height:bucket.height,rx:10,fill:'var(--paper)',stroke:'var(--line)'}));
    const label=svgEl('text',{x:bucket.left+14,y:bucket.top+27,fill:color,class:'bucket-heading'});label.textContent=(relationships[bucket.type]?.label||'Other')+' · '+bucket.nodes.length;group.append(label);layer.append(group);
  }
  focusPorts.clear();return frameNetwork(graph.nodes.map(node=>node.id),positions,dimensions);
}

function drawAmountLabels(){
  if(!state.showAmounts){edgeEls.forEach(entry=>{entry.label.style.display='none';entry.label.classList.remove('dollar-label');});return;}
  const occupied=[];
  for(const id of semanticNodes){const r=nodeEls.get(id).group.getBoundingClientRect(),s=$('graph').getBoundingClientRect();occupied.push({left:r.left-s.left,right:r.right-s.left,top:r.top-s.top,bottom:r.bottom-s.top});}
  const links=[...graph.edges].sort((a,b)=>Number(state.multiEdges.has(b.id))-Number(state.multiEdges.has(a.id)));
  for(const edge of links){const entry=edgeEls.get(edge.id),label=entry.label,text=dollarLabel(edge);label.classList.toggle('dollar-label',state.showAmounts&&!!text&&semanticEdges.has(edge.id));label.style.display='none';
    if(!state.showAmounts||!text||!semanticEdges.has(edge.id))continue;
    label.replaceChildren();const words=text.split(/\s+/),lines=[];let line='';for(const word of words){if(line.length+word.length>33&&line){lines.push(line);line='';}line+=(line?' ':'')+word;}if(line)lines.push(line);
    lines.forEach((text,index)=>{const span=svgEl('tspan',{x:0,dy:index?14:0});span.textContent=text;label.append(span);});label.style.display='';
    const mid=entry.midpoint;if(!mid)continue;const x=camera.x+mid.x*camera.z,y=camera.y+mid.y*camera.z;
    const bounds=label.getBBox(),w=bounds.width,h=bounds.height;
    let best={x,y:y-22};
    for(const dy of [-22,28,-48,54,-75,80]){const box={left:x-w/2-5,right:x+w/2+5,top:y+dy-12,bottom:y+dy+h};if(box.left<5||box.right>dimensions.width-5||occupied.some(other=>overlaps(box,other,3)))continue;best={x,y:y+dy};occupied.push(box);break;}
    label.setAttribute('transform',`translate(${(best.x-camera.x)/camera.z} ${(best.y-camera.y)/camera.z}) scale(${1/camera.z})`);
  }
}
function placeBucketLabels(){
  semanticNodes=new Set(graph.nodes.map(node=>node.id));semanticEdges=new Set(graph.edges.map(edge=>edge.id));
  for(const node of graph.nodes){const entry=nodeEls.get(node.id);styleNode(node.id,camera.z);entry.group.style.display='';entry.group.style.opacity='1';entry.group.setAttribute('aria-hidden','false');entry.core.setAttribute('tabindex','0');entry.label.style.display='';entry.letter.style.display='';}
  for(const [id,entry]of edgeEls){const shown=semanticEdges.has(id);entry.group.style.display=shown?'':'none';entry.hit.setAttribute('tabindex',shown?'0':'-1');entry.hit.setAttribute('aria-hidden',String(!shown));connectionIcons.get(id).group.style.display='none';}
  $('entity-popover').hidden=true;$('visible-count').textContent=semanticNodes.size+' grouped entities · '+semanticEdges.size+' connections';
  $('semantic-summary').textContent='One bucket per entity. All original connection types remain available.';
  drawAmountLabels();renderConnectionLegend();renderConnectionKey();
}
function positionGraph() {
  document.body.dataset.focusMenu=String(!!focusEntityId()&&recordMenuOpen);
  $('graph-world').setAttribute('transform', `translate(${camera.x} ${camera.y}) scale(${camera.z})`);
  const z = camera.z;
  for(const node of graph.nodes)nodeEls.get(node.id).group.style.display='';
  if(expansionAnimation?.sharedScale){$('graph').style.setProperty('--camera-inverse',1/z);$('graph').style.setProperty('--radius-factor',Math.min(1,Math.max(.45,z/.45)));}
  markerEls.forEach(marker => { marker.setAttribute('markerWidth',5/z); marker.setAttribute('markerHeight',5/z); });
  const radiusFor = id => nodePresentation(id,z).radius;
  nodeEls.forEach(({ group,hit, halo, core, letter, label,pin }, id) => {
    if(!graph.nodes.some(node=>node.id===id))return;
    const p = positions.get(id), radius = radiusFor(id);
    if(expansionAnimation?.sharedScale){
      if(expansionAnimation.targets.has(id))group.setAttribute('transform',`translate(${p.x} ${p.y})`);
      const display=radius<6?'none':'';if(letter.style.display!==display)letter.style.display=display;
      return;
    }
    group.setAttribute('transform', `translate(${p.x} ${p.y})`);
    hit.setAttribute('r',Math.max(7,radius+3)/z);
    halo.setAttribute('r', (radius + 5) / z); core.setAttribute('r', radius / z); core.style.strokeWidth = '1.3px';
    letter.setAttribute('transform', `scale(${1 / z})`); letter.style.display = radius < 6 ? 'none' : '';
    label.setAttribute('transform', `translate(0 ${(radius + 17) / z}) scale(${1 / z})`);
    pin?.setAttribute('transform',`translate(${(radius+10)/z} ${(-radius-3)/z}) scale(${1/z})`);
  });
  edges.forEach(e => {
    if(edgeEls.get(e.id).group.style.display==='none')return;
    const a = positions.get(e.source), b = positions.get(e.target);
    const bend = edgeBends.get(e.id);
    const dx = b.x-a.x, dy = b.y-a.y, distance = Math.hypot(dx,dy)||1;
    const padA = (radiusFor(e.source)+3)/z, padB = (radiusFor(e.target)+5)/z;
    const start = {x:a.x+dx/distance*padA,y:a.y+dy/distance*padA}, end = {x:b.x-dx/distance*padB,y:b.y-dy/distance*padB};
    const control = {x:(a.x+b.x)/2-dy/distance*bend,y:(a.y+b.y)/2+dx/distance*bend};
    const path = `M${start.x},${start.y} Q${control.x},${control.y} ${end.x},${end.y}`;
    const el = edgeEls.get(e.id); el.line.setAttribute('d',path); el.hit.setAttribute('d',path);
    const icon=connectionIcons.get(e.id).group,midpoint={x:.25*start.x+.5*control.x+.25*end.x,y:.25*start.y+.5*control.y+.25*end.y};el.midpoint=midpoint;
    const center=focusEntityId()||(state.selected?.kind==='node'?state.selected.id:null),t=e.source===center ? .62 : e.target===center ? .38 : .5;
    el.iconPoint={x:(1-t)*(1-t)*start.x+2*(1-t)*t*control.x+t*t*end.x,y:(1-t)*(1-t)*start.y+2*(1-t)*t*control.y+t*t*end.y};
    el.label.dataset.x=midpoint.x;el.label.dataset.y=midpoint.y-(icon.style.display==='none'?7:27)/z;
    el.label.setAttribute('transform',`translate(${el.label.dataset.x} ${el.label.dataset.y}) scale(${1/z})`);
  });
  positionConnectionBadges();
  routeEls.forEach(({line,hit,label,route},index)=>{
    const a=positions.get(route.from),b=positions.get(route.to),bend=(index%2?1:-1)*100/z,dx=b.x-a.x,dy=b.y-a.y,distance=Math.hypot(dx,dy)||1;
    const control={x:(a.x+b.x)/2-dy/distance*bend,y:(a.y+b.y)/2+dx/distance*bend};
    const path=`M${a.x},${a.y} Q${control.x},${control.y} ${b.x},${b.y}`;line.setAttribute('d',path);hit.setAttribute('d',path);
    label.setAttribute('transform',`translate(${.25*a.x+.5*control.x+.25*b.x} ${.25*a.y+.5*control.y+.25*b.y-15/z}) scale(${1/z})`);
  });
  placeLabels();
}

function placeLabels(){
  if(state.view!=='network'||!graph)return;
  semanticNodes=new Set(graph.nodes.map(node=>node.id));semanticEdges=new Set(graph.edges.map(edge=>edge.id));
  const center=hoveredNode||focusEntityId(),neighbors=center?nodeNeighborhood(graph,center).nodes:new Set();
  for(const id of state.multiEdges){const edge=edgeById.get(id);if(edge){neighbors.add(edge.source);neighbors.add(edge.target);}}
  for(const node of graph.nodes){const entry=nodeEls.get(node.id),style=styleNode(node.id,camera.z);semanticStyles.set(node.id,style);
    entry.group.style.display='';entry.group.style.opacity='1';entry.group.setAttribute('aria-hidden','false');entry.core.setAttribute('tabindex','0');entry.group.dataset.semanticHidden='false';
    const label=state.labels!=='off'&&showNetworkLabel(degrees.get(node.id),camera.z,{selected:state.multiNodes.has(node.id)||hoveredNode===node.id,neighbor:neighbors.has(node.id),all:state.labels==='all'||state.bucketMode});
    entry.label.style.display=label?'':'none';entry.letter.style.display=style.radius>=11?'':'none';
  }
  for(const [id,entry]of edgeEls){const shown=semanticEdges.has(id);entry.group.style.display=shown?'':'none';entry.hit.setAttribute('tabindex',shown?'0':'-1');entry.hit.setAttribute('aria-hidden',String(!shown));entry.label.style.display='none';}
  $('entity-popover').hidden=true;
  $('graph').dataset.zoomLayer='network';$('graph').dataset.visibleEntities=String(semanticNodes.size);$('graph').dataset.trailHighlight='false';
  $('visible-count').textContent=semanticNodes.size+' entities · '+semanticEdges.size+' connections';
  $('semantic-summary').textContent=state.path?'Showing the selected path. Clear it to return to the network.':center?'Selection highlights connections. The wider network stays in place.':'Drag to pan · scroll to zoom · Shift-drag to select';
  renderConnectionLegend();renderConnectionKey();positionConnectionTooltip();positionEntityTooltip();drawAmountLabels();
}

function updateRecordMenu(){
  const selection=state.selected;if(!selection)return;
  const edge=selection.kind==='edge'?edgeById.get(selection.id):null,node=selection.kind==='node'?nodeById.get(selection.id):null;
  if(!edge&&!node)return;
  const summary=node?connectionSummary(baseGraph(),node.id):null,signature=selection.kind+'|'+selection.id+'|'+(state.focusType||'')+'|'+state.collapsedNodes.has(selection.id)+'|'+state.trailNodes.size+'|'+summary?.links.map(edge=>edge.id).join(',');
  if(popoverSignature===signature)return;popoverSignature=signature;
  $('popover-name').textContent=node?.name||relationships[edge.type].label;
  $('popover-stats').textContent=node?summary.neighbors.size+' neighbors · '+summary.links.length+' links':nodeById.get(edge.source).name+' → '+nodeById.get(edge.target).name;
  $('popover-type-menu').hidden=!node;$('guided-open').hidden=!node;$('popover-collapse').hidden=!node;$('popover-collapse-path').hidden=!node||state.trailNodes.size<2;
  $('popover-type-menu').querySelector('summary').textContent=state.trailNodes.size>1?'Connections & trail':'Connection types';
  $('popover-collapse').querySelector('span').textContent=state.collapsedNodes.has(selection.id)?'Expand':'Collapse';$('popover-collapse').setAttribute('aria-label',state.collapsedNodes.has(selection.id)?'Expand direct connections':'Collapse direct connections');
  $('popover-types').innerHTML=node?'<p>Explore by connection type</p><button data-focus-type="" aria-pressed="'+String(!state.focusType)+'"><span>All connections</span><b>'+summary.links.length+'</b></button>'+summary.types.map(({type,count})=>'<button data-focus-type="'+type+'" aria-pressed="'+String(state.focusType===type)+'" style="--type-color:'+relationships[type].color+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+relationshipIcons[type]+'"/></svg><span>'+escape(relationships[type].label)+'</span><b>'+count+'</b></button>').join(''):'';
}
function reserveFocusMenu(){
  const menu=$('entity-popover');menu.hidden=false;
  const w=menu.offsetWidth,h=menu.offsetHeight,obstacles=mapObstacles(),choices=[];
  for(let top=12;top+h<=dimensions.height-12;top+=20)for(const left of [dimensions.width-w-16,16]){
    const box={left,top,right:left+w,bottom:top+h};if(!obstacles.some(other=>overlaps(box,other,10)))choices.push(box);
  }
  const middle=Math.min(dimensions.height,canvasBaseHeight||dimensions.height)/2;
  return choices.sort((a,b)=>Math.abs((a.top+a.bottom)/2-middle)-Math.abs((b.top+b.bottom)/2-middle)||b.left-a.left)[0]||null;
}
function positionRecordMenu(items,obstacles){
  const menu=$('entity-popover'),selection=state.selected;menu.hidden=!recordMenuOpen||!selection||!['node','edge'].includes(selection.kind);if(menu.hidden)return;
  const edge=selection.kind==='edge'?edgeById.get(selection.id):null,id=edge?edge.source:selection.id;
  const point=edge?edgeEls.get(edge.id)?.midpoint:positions.get(id);if(!point||!items.some(item=>item.id===id)){menu.hidden=true;return;}
  updateRecordMenu();
  const isPinned=state.research.steps.some(step=>step.kind===(edge?'connection':'entity')&&step.id===selection.id);$('popover-pin').querySelector('span').textContent=isPinned?'Pinned':'Pin';$('popover-pin').setAttribute('aria-pressed',String(isPinned));$('popover-pin').setAttribute('aria-label',isPinned?'Unpin from research path':'Pin to research path');
  if(focusEntityId()&&focusMenuRect){menu.style.left=focusMenuRect.left+'px';menu.style.top=focusMenuRect.top+'px';return;}
  const x=camera.x+point.x*camera.z,y=camera.y+point.y*camera.z,w=menu.offsetWidth,h=menu.offsetHeight;
  const anchorBox=edge?{left:x,right:x,top:y,bottom:y}:items.find(item=>item.id===id).box;const choices=[{left:anchorBox.right+12,top:y-h/2},{left:anchorBox.left-w-12,top:y-h/2},{left:x-w/2,top:anchorBox.top-h-12},{left:x-w/2,top:anchorBox.bottom+12}];
  for(let top=15;top<dimensions.height-h-10;top+=60)for(let left=15;left<dimensions.width-w-10;left+=90)choices.push({left,top});
  const allowed=choices.filter(p=>p.left>=8&&p.top>=8&&p.left+w<=dimensions.width-8&&p.top+h<=dimensions.height-8&&!obstacles.some(other=>overlaps({...p,right:p.left+w,bottom:p.top+h},other,6))&&!items.filter(item=>item.id===id||state.pinnedIds.has(item.id)||edge&&[edge.source,edge.target].includes(item.id)).some(item=>overlaps({...p,right:p.left+w,bottom:p.top+h},item.box,8)));
  const score=p=>items.filter(item=>overlaps({left:p.left,top:p.top,right:p.left+w,bottom:p.top+h},item.box,8)).length*100000+Math.hypot(p.left+w/2-x,p.top+h/2-y);const best=allowed.sort((a,b)=>score(a)-score(b))[0];if(!best){menu.hidden=true;return;}
  menu.style.left=best.left+'px';menu.style.top=best.top+'px';
  const pinned=state.research.steps.some(step=>step.kind===(edge?'connection':'entity')&&step.id===selection.id);$('popover-pin').setAttribute('aria-label',pinned?'Unpin from research path':'Pin to research path');$('popover-pin').setAttribute('aria-pressed',String(pinned));$('popover-pin').querySelector('span').textContent=pinned?'Pinned':'Pin';$('guided-open').hidden=!!edge;
}


function renderGraph() {
  document.body.dataset.grouped=String(state.bucketMode);
  const center=focusEntityId();document.body.dataset.focusScene='false';document.body.dataset.nodeFocus=String(!!center);document.body.dataset.focusMenu=String(!!center&&recordMenuOpen);
  const shownNodes = new Set(graph.nodes.map(n => n.id)), shownEdges = new Set(graph.edges.map(e => e.id));
  const tags=previewTag?[...state.tags,previewTag]:state.tags,tagFocus=tags.size||tags.length?tagForeground(graph,tags):null,baseForeground=center?nodeNeighborhood(graph,center):pathForeground(graph,state.startingIds,state.path),foreground=tagFocus||baseForeground;
  const highlightedNodes = new Set(), highlightedEdges = new Set();
  const explored=exploredForeground(),selectedConnections=new Set(state.selected?.kind==='edge'?pairedRelationships(graph.edges,edgeById.get(state.selected.id)).map(edge=>edge.id):[]);
  if(tagFocus){tagFocus.nodes.forEach(id=>highlightedNodes.add(id));tagFocus.edges.forEach(id=>highlightedEdges.add(id));}
  else if (state.path) { state.path.nodes.forEach(id => highlightedNodes.add(id)); state.path.edges.forEach(id => highlightedEdges.add(id)); }
  else if ((hoveredNode&&shownNodes.has(hoveredNode))||(state.selected?.kind==='node'&&shownNodes.has(state.selected.id))) {
    const id = hoveredNode&&shownNodes.has(hoveredNode)?hoveredNode:state.selected.id; highlightedNodes.add(id);
    adjacent(id).forEach(e => { highlightedEdges.add(e.id); highlightedNodes.add(other(e, id)); });
  } else if (state.selected?.kind === 'edge') { const e = edgeById.get(state.selected.id);pairedRelationships(graph.edges,e).forEach(edge=>highlightedEdges.add(edge.id));highlightedNodes.add(e.source);highlightedNodes.add(e.target); }
  else if (state.query) graph.matches.forEach(id => highlightedNodes.add(id));
  nodeEls.forEach(({ group, core,label,pin }, id) => {
    const visible = shownNodes.has(id);
    group.style.display = visible ? '' : 'none';
    group.classList.toggle('context-node',!foreground.nodes.has(id)&&!state.pinnedIds.has(id)&&!state.trailNodes.has(id));group.classList.toggle('trail-node',state.trailNodes.has(id)||explored.nodes.has(id));
    group.classList.toggle('pinned-node',state.pinnedIds.has(id));
    pin.setAttribute('aria-label',(state.pinnedIds.has(id)?'Unpin ':'Pin ')+nodeById.get(id).name+(state.pinnedIds.has(id)?'':' as anchor'));pin.setAttribute('aria-pressed',String(state.pinnedIds.has(id)));pin.setAttribute('tabindex',visible?'0':'-1');
    group.classList.toggle('path-node',!!state.path?.nodes.includes(id));group.classList.toggle('multi-selected',state.multiNodes.has(id));
    group.classList.toggle('highlight', highlightedNodes.has(id)); group.classList.toggle('selected', state.selected?.kind === 'node' && state.selected.id === id);
    group.classList.toggle('expanded',state.openNodes.has(id));
    core.setAttribute('aria-pressed', state.selected?.kind === 'node' && state.selected.id === id ? 'true' : 'false');
    core.setAttribute('aria-expanded',String(state.openNodes.has(id)));
    core.setAttribute('aria-description',degrees.get(id)+' recorded connections. '+(state.pinnedIds.has(id)?'Pinned research anchor. ':'')+'Select to highlight connections and open details. The network stays in place.');
    label.style.display = state.labels === 'off' ? 'none' : '';
  });
  edgeEls.forEach(({ group, line, label }, id) => {
    delete label.dataset.badgeAnchored;
    group.style.display = shownEdges.has(id) ? '' : 'none';
    group.classList.toggle('context-link',!foreground.edges.has(id)&&!state.trailEdges.has(id));group.classList.toggle('trail-link',explored.edges.has(id));group.classList.toggle('selected-connection',selectedConnections.has(id)||state.multiEdges.has(id));
    line.classList.toggle('active', highlightedEdges.has(id));
    line.classList.toggle('path-line',!!state.path?.edges.includes(id));
    label.style.display = state.labels === 'off' ? 'none' : '';
  });
  const tagScope=state.tags.size?tagSelection(graph,state.tags):null,iconEdges=tagScope?new Set([...tagScope.matches.edges,...tagScope.connectors]):center?baseForeground.edges:state.path?new Set(state.path.edges):state.selected?.kind==='node'?nodeNeighborhood(graph,state.selected.id).edges:state.selected?.kind==='edge'?pairedRelationships(graph.edges,edgeById.get(state.selected.id)).reduce((ids,edge)=>ids.add(edge.id),new Set()):new Set();
  state.trailEdges.forEach(id=>iconEdges.add(id));const eligible=graph.edges.filter(edge=>iconEdges.has(edge.id)),seenPairs=new Set();
  connectionIcons.forEach(({group,count},id)=>{
    const edge=edgeById.get(id),key=[edge.source,edge.target].sort().join('|')+'|'+edge.type,visible=shownEdges.has(id)&&iconEdges.has(id)&&!seenPairs.has(key);if(visible)seenPairs.add(key);
    const peers=visible?pairedRelationships(eligible,edge).filter(other=>other.type===edge.type):[];connectionIcons.get(id).peerIds=peers.map(other=>other.id);count.textContent=peers.length>1?String(peers.length):'';
    group.classList.toggle('trail-icon',peers.some(peer=>explored.edges.has(peer.id)));
    group.style.display=visible?'':'none';group.setAttribute('tabindex',visible?'0':'-1');group.setAttribute('aria-hidden',String(!visible));group.classList.toggle('selected',state.selected?.kind==='edge'&&highlightedEdges.has(id));
    if(visible){group.setAttribute('aria-label',peers.length>1?`Connection icon: ${peers.length} connections between ${nodeById.get(edge.source).name} and ${nodeById.get(edge.target).name}, ${peers.map(other=>relationships[other.type].label).join(', ')}`:`Connection icon: ${relationships[edge.type].label}, ${readerField(edge,'label')}, ${nodeById.get(edge.source).name} to ${nodeById.get(edge.target).name}`);group.querySelector('title').textContent=peers.map(other=>relationships[other.type].label+' · '+readerField(other,'label')).join('\n')+'\nSelect for Pin and Details';}
  });
  positionConnectionBadges();
  if(center){
    foreground.edges.forEach(id=>{const entry=edgeEls.get(id);if(entry)$('edge-layer').append(entry.group);});
    foreground.nodes.forEach(id=>{const entry=nodeEls.get(id);if(entry)$('node-layer').append(entry.group);});
    $('node-layer').append(nodeEls.get(center).group);
  }
  raisePathForeground();
  if(tagFocus){tagFocus.edges.forEach(id=>{const edge=edgeEls.get(id);if(edge)$('edge-layer').append(edge.group);});tagFocus.nodes.forEach(id=>{const node=nodeEls.get(id);if(node)$('node-layer').append(node.group);});}
  const emptyStart=!state.tags.size&&state.customStart&&!state.startingIds.size&&!state.query&&!state.selected;
  document.body.dataset.emptyStart=String(emptyStart);
  $('graph-empty').hidden = graph.nodes.length > 0||emptyStart;
  $('graph-empty').querySelector('h2').textContent=state.tags.size?'No records match these tags':'No entities found';$('graph-empty').querySelector('p').textContent=state.tags.size?'Remove a tag or change the filters to explore more. Combined entity and connection tags follow up to two recorded links.':'Try a different search or reset the filters.';
  $('visible-count').textContent = `${graph.nodes.length} ${graph.nodes.length===1?'entity':'entities'} · ${graph.edges.length} ${graph.edges.length===1?'connection':'connections'}`+(hiddenByDistance&&state.view==='network'?` · ${hiddenByDistance} hidden`:'');
  $('selection-chip').hidden = !state.focus && !state.path;
  if (state.path) $('selection-chip').innerHTML = `<span>${state.path.edges.length} sourced link${state.path.edges.length === 1 ? '' : 's'} in this path</span><button data-clear-highlight aria-label="Clear highlighted path">×</button>`;
  else if (center) $('selection-chip').innerHTML = `<span>${nodeNeighborhood(graph,center).edges.size} direct connections · ${escape(nodeById.get(center).name)}</span><button data-clear-highlight aria-label="Clear neighborhood focus">×</button>`;
  positionGraph();
}

function selectionCount(){return state.multiNodes.size+state.multiEdges.size;}
function selectRecord(kind,id,additive=false){
  if(!additive){kind==='node'?toggleNode(id):selectEdge(id);return;}
  settleExpansion(false);rememberView();
  const selected=kind==='node'?state.multiNodes:state.multiEdges;
  if(selected.has(id))selected.delete(id);else selected.add(id);
  showSelection();
}
function showSelection(){
  // Changing the selection must keep the explored neighborhood in place.
  state.focusEntity=focusEntityId()||'';
  state.selected=state.multiNodes.size?{kind:'node',id:[...state.multiNodes][0]}:state.multiEdges.size?{kind:'edge',id:[...state.multiEdges][0]}:null;
  state.detailsOpen=!!selectionCount();if(!selectionCount()){state.focus=false;state.focusEntity='';}recordMenuOpen=false;hoveredNode=null;hideEntityTooltip();render();
}
function renderQuickMenu(){
  const count=selectionCount(),n=state.multiNodes.size,e=state.multiEdges.size;
  $('quick-menu').hidden=state.view!=='network'||document.body.dataset.emptyStart==='true';
  $('quick-menu').dataset.collapsed=String(quickCollapsed);$('quick-minimize').setAttribute('aria-expanded',String(!quickCollapsed));$('quick-minimize').textContent=quickCollapsed?'Actions ▾':'Close ▴';$('quick-title').textContent=count?`${count} selected`:'Map tools';
  $('graph').dataset.selectionMode=String(boxSelectMode&&!spaceToPan);
  $('group-connections').setAttribute('aria-pressed',String(state.bucketMode));$('group-connections').textContent=state.bucketMode?'Natural layout':'Sort by connection type';
  $('toggle-amounts').setAttribute('aria-pressed',String(state.showAmounts));$('toggle-amounts').textContent=state.showAmounts?'Hide dollar amounts':'Show dollar amounts';
  $('selection-mode').setAttribute('aria-pressed',String(boxSelectMode));$('selection-mode').textContent=boxSelectMode?'Drag to select':'Drag to pan';
  $('quick-selection').textContent=count?`${n} ${n===1?'entity':'entities'} · ${e} ${e===1?'connection':'connections'} selected`:'Explore the map';
  const actions=[];const action=(id,label)=>actions.push(`<button type="button" data-quick-action="${id}">${label}</button>`);
  if(n===1&&!e){action('explore','Center on entity');action('timeline','Timeline');}
  if(n===2&&!e)action('path','Find path between these');
  if(e)action('endpoints','Select endpoints');
  if(count){action('isolate','Show only selection');const allPinned=[...[...state.multiNodes].map(id=>['entity',id]),...[...state.multiEdges].map(id=>['connection',id])].every(([kind,id])=>state.research.steps.some(step=>step.kind===kind&&step.id===id));action('pin',allPinned?'Unpin selection':'Pin selection');action('export','Export selection');action('clear','Clear selection');}
  $('quick-actions').innerHTML=actions.join('');
  $('quick-hint').textContent=state.bucketMode?'Buckets use each entity’s strongest recorded type. Other links remain.':'Drag to pan · scroll to zoom. Shift-drag selects; Ctrl/Cmd-click adds records. Alt-drag moves entities.';
  positionQuickMenu();
}
function positionQuickMenu(){
  const menu=$('quick-menu');if(menu.hidden)return;
  const search=$('search-window'),top=search.offsetTop+search.offsetHeight+8;
  menu.style.left=(quickPosition&&!quickDocked?quickPosition.left:14)+'px';menu.style.top=(quickPosition&&!quickDocked?quickPosition.top:top)+'px';menu.style.width=(quickSize?.width||310)+'px';menu.style.height=!quickCollapsed&&quickSize?quickSize.height+'px':'auto';$('quick-dock').textContent=quickDocked?'Undock':'Dock';
  const legend=$('connection-legend');legend.style.top=top+44+8+'px';legend.style.bottom='auto';legend.style.maxHeight=Math.max(180,$('canvas-area').clientHeight-top-68)+'px';
}
window.addEventListener('resize',positionQuickMenu);
document.addEventListener('pointerdown',event=>{const panel=event.target.closest('#quick-menu,#inspector');if(panel)panel.style.zIndex=++windowOrder;},{capture:true});
$('quick-dock').addEventListener('click',()=>{quickDocked=!quickDocked;positionQuickMenu();});
document.addEventListener('dblclick',event=>{const header=event.target.closest('.floating-panel-header');if(!header||event.target.closest('button'))return;if(header.parentElement.id==='inspector')toggleDetailsDock();else if(header.parentElement.id==='quick-menu'){quickDocked=!quickDocked;positionQuickMenu();}});
$('quick-minimize').addEventListener('click',()=>{quickCollapsed=!quickCollapsed;if(!quickCollapsed)closeFloatingPanel('connection-legend');renderQuickMenu();});
$('group-connections').addEventListener('click',()=>{settleExpansion(false);rememberView();state.bucketMode=!state.bucketMode;state.bucketIds=state.bucketMode?new Set(semanticNodes):null;if(!state.bucketMode){naturalLayout.forEach((p,id)=>positions.set(id,{...p}));$('bucket-layer').replaceChildren();}render(true);});
$('toggle-amounts').addEventListener('click',()=>{rememberView();state.showAmounts=!state.showAmounts;render();});
$('selection-mode').addEventListener('click',()=>{boxSelectMode=!boxSelectMode;renderQuickMenu();});
$('quick-actions').addEventListener('click',event=>{
  const action=event.target.closest('[data-quick-action]')?.dataset.quickAction;if(!action)return;
  const ids=[...state.multiNodes],selected=selectionGraph(graph,state.multiNodes,state.multiEdges);
  if(action==='clear'){state.multiNodes.clear();state.multiEdges.clear();state.selected=null;state.detailsOpen=false;recordMenuOpen=false;state.focus=false;state.focusEntity='';render();return;}
  if(action==='explore'){centerOnEntity(ids[0]);return;}
  if(action==='timeline'){state.timelineEntity=ids[0];state.timelineScope='direct';setView('timeline');return;}
  if(action==='path'){openPathFinder();$('path-from').value=nodeById.get(ids[0]).name;$('path-to').value=nodeById.get(ids[1]).name;return;}
  if(action==='endpoints'){for(const id of state.multiEdges){const edge=edgeById.get(id);state.multiNodes.add(edge.source);state.multiNodes.add(edge.target);}showSelection();return;}
  if(action==='isolate'){rememberView();state.path={nodes:selected.nodes.map(node=>node.id),edges:selected.edges.map(edge=>edge.id)};state.focus=false;state.bucketIds=null;render(true);return;}
  if(action==='export'){downloadJSON({...datasetFor(selected),selection:{entityIds:ids,relationshipIds:[...state.multiEdges]}},`cbus-power-selection-${release.releaseId}.json`);toast('Selection exported with sources and original record IDs');return;}
  if(action==='pin'){
    const records=[...ids.map(id=>({kind:'entity',id,note:''})),...[...state.multiEdges].map(id=>({kind:'connection',id,note:''}))];
    const allPinned=records.every(record=>state.research.steps.some(step=>step.kind===record.kind&&step.id===record.id));
    const steps=allPinned?state.research.steps.filter(step=>!records.some(record=>step.kind===record.kind&&step.id===record.id)):[...state.research.steps,...records.filter(record=>!state.research.steps.some(step=>step.kind===record.kind&&step.id===record.id))];
    if(steps.length>200){toast('A research path can hold up to 200 records. Export this selection to keep it.');return;}
    rememberView();state.research=validateResearch({...state.research,steps},new Set(nodeById.keys()),new Set(edgeById.keys()));syncResearchPins();render();toast(allPinned?'Selection unpinned':'Selection pinned to research path');
  }
});

function renderInspector() {
  const panel = $('inspector');
  panel.hidden=!state.selected||(state.view==='network'&&!state.detailsOpen);
  document.body.dataset.detailsOpen=String(!panel.hidden);
  document.querySelector('.workspace').dataset.hasSelection=String(!panel.hidden);
  if (panel.hidden) {
    panel.innerHTML='';
    return;
  }
  const close = '<button class="close-inspector" data-close-inspector aria-label="Close details">×</button>';
  if(state.view==='network'&&selectionCount()>1){
    panel.innerHTML=`<div class="inspector-header"><span class="eyebrow">SELECTION</span>${close}</div><h2>${selectionCount()} records selected</h2><p>Use the quick menu to compare, pin, isolate or export this selection. Each relationship retains its own evidence and amount qualification.</p><div class="subheading">ENTITIES</div>${[...state.multiNodes].map(id=>`<button class="connection-row" data-node-detail="${id}"><strong>${escape(nodeById.get(id).name)}</strong><span>${escape(nodeById.get(id).role)}</span></button>`).join('')}${state.multiEdges.size?'<div class="subheading">CONNECTIONS</div>'+[...state.multiEdges].map(id=>connectionRow(edgeById.get(id))).join(''):''}`;
    return;
  }
  if(state.selected.kind==='event'){
    const event=shownTimelineEvents.find(e=>e.id===state.selected.id);if(!event)return;
    const edge=edgeById.get(event.primaryEdgeId),date=event.date,lane=timelineLanes[event.lane];
    const range=date.precision==='period'?`${friendlyDate(date.start)} – ${friendlyDate(date.end)}`:'';
    const published=event.sourceIds.map(id=>sourceById.get(id)).map(s=>`<div><span>${escape(s.publisher)}</span><strong>${friendlyDate(s.date)}</strong><small>${s.publisher==='Ohio Laws'?'Cited law version effective':'Publication / document date'}</small></div>`).join('');
    panel.innerHTML=`<div class="inspector-header"><span class="eyebrow">TIMELINE EVENT</span>${close}</div><span class="timeline-lane-badge" style="--lane:${lane.color}">${lane.label}</span>${tagButtons('connection',event.primaryEdgeId)}<h2>${escape(eventTitle(event))}</h2>${statusBadge(edge)}<div class="event-dates"><span>${escape(date.role)}</span><strong>${escape(formatEventDate(date))}</strong>${range?`<small>${range}</small>`:''}${date.note?`<p>${escape(date.note)}</p>`:''}${date.observedOn?`<small>${escape(date.observationRole)}: ${friendlyDate(date.observedOn)}</small>`:''}</div><div class="event-money"><span>${moneyKinds[event.moneyKind].label}</span>${timelineAmount(event)}${event.unit?`<small>${escape(event.unit)}</small>`:''}${event.amountIncludedIn?'<p>Part of a larger authorization.</p>':''}</div><div class="edge-ends"><button data-node-detail="${edge.source}">${escape(nodeById.get(edge.source).name)} ↗</button><span class="link-between">${edge.directional?'↓':'↕'}</span><button data-node-detail="${edge.target}">${escape(nodeById.get(edge.target).name)} ↗</button></div><button class="focus-button" data-timeline-network="${event.id}">Show network connection <span>↗</span></button><div class="evidence-box"><span class="eyebrow">EVIDENCE</span><p>${escape(readerField(edge,'evidence'))}</p>${edge.locator?`<small>${escape(edge.locator)}</small>`:''}</div>${edge.context?`<p class="record-context">${escape(readerField(edge,'context'))}</p>`:''}${event.edgeIds.length>1?`<div class="subheading">RELATED RECORDS</div>${event.edgeIds.map(id=>connectionRow(edgeById.get(id))).join('')}`:''}<div class="subheading">SOURCE DATES</div><div class="event-publications">${published}</div><div class="subheading">SOURCES</div>${sourceLinks(event.sourceIds)}`;
    return;
  }
  if (state.selected.kind === 'node') {
    const n = nodeById.get(state.selected.id); const links = adjacent(n.id); const count = degrees.get(n.id);const action=branchAction(n.id);
    panel.innerHTML = `<div class="inspector-header"><span class="eyebrow">ENTITY</span>${close}</div>${tagButtons('entity',n.id)}<h2>${escape(n.name)}</h2><div class="entity-role">${escape(n.role)}</div>${campaignFinanceHTML(n.id)}${caseNodes.has(n.id)?`<p>${escape(readerField(n,'description'))}</p>`:''}<div class="entity-metrics"><div><b>${count}</b><span>dataset links</span></div><div><b>${links.length}</b><span>visible links</span></div></div><button class="focus-button" data-expand-node="${n.id}" aria-expanded="${action.opened}" ${action.disabled?'disabled':''}>${action.label}</button><button class="timeline-entity-link" data-timeline-entity="${n.id}">Follow the money over time ↗</button><div class="subheading">RELATIONSHIPS</div>${links.length ? links.map(e => connectionRow(e, n.id)).join('') : '<p>No links match the filters.</p>'}<div class="subheading">SOURCES</div>${sourceLinks(n.sourceIds)}`;
  } else if (state.selected.kind === 'edge') {
    const e = edgeById.get(state.selected.id);
    panel.innerHTML = `<div class="inspector-header"><span class="eyebrow">RELATIONSHIP</span>${close}</div>${tagButtons('connection',e.id)}<h2>${escape(readerField(e,'label'))}</h2>${statusBadge(e)}<div class="edge-ends"><button data-node-detail="${e.source}">${escape(nodeById.get(e.source).name)} ↗</button><span class="link-between" aria-hidden="true">${e.directional?'↓':'↕'}</span><button data-node-detail="${e.target}">${escape(nodeById.get(e.target).name)} ↗</button></div><div class="period">${escape(e.period)}</div>${e.unit?`<div class="amount-unit">${escape(e.unit)}</div>`:''}<div class="evidence-box"><span class="eyebrow">EVIDENCE</span><p>${escape(readerField(e,'evidence'))}</p>${e.locator?`<small>${escape(e.locator)}</small>`:''}</div>${e.context?`<p class="record-context">${escape(readerField(e,'context'))}</p>`:''}<div class="subheading">SOURCES</div>${sourceLinks(e.sourceIds)}`;
  } else {
    const s = sourceById.get(state.selected.id); const links = baseGraph().edges.filter(e => e.sourceIds.includes(s.id));
    panel.innerHTML = `<div class="inspector-header"><span class="eyebrow">SOURCE RECORD</span>${close}</div><h2>${escape(s.title)}</h2><p>${escape(readerField(s,'note'))}</p>${sourceLinks([s.id])}<div class="subheading">${links.length} RELATIONSHIPS IN SELECTED FILTERS</div>${links.map(e => connectionRow(e)).join('')}`;
  }
  if(state.selected.kind==='edge'){
    const edge=edgeById.get(state.selected.id),others=pairedRelationships(baseGraph().edges,edge).filter(other=>other.id!==edge.id);
    if(others.length)panel.insertAdjacentHTML('beforeend','<div class="subheading">'+(others.length+1)+' CONNECTIONS BETWEEN THESE ENTITIES</div>'+others.map(other=>'<article class="paired-connection-card" data-paired-record="'+other.id+'"><button data-edge="'+other.id+'">'+escape(readerField(other,'label'))+' ↗</button><small>'+escape(relationships[other.type].label)+' · '+escape(other.period)+'</small>'+tagButtons('connection',other.id)+statusBadge(other)+'<p>'+escape(readerField(other,'evidence'))+'</p>'+sourceLinks(other.sourceIds)+'</article>').join(''));
  }
  if(state.selected.kind==='node')panel.querySelector('h2').insertAdjacentHTML('afterend','<button class="pin-entity-button" data-toggle-pin="'+state.selected.id+'" aria-pressed="'+state.pinnedIds.has(state.selected.id)+'">'+(state.pinnedIds.has(state.selected.id)?'◆ Pinned anchor · Unpin':'◇ Pin as anchor')+'</button>');
}

function renderDirectory() {
  const list = baseGraph().nodes.filter(n => matches(n, state.query)).sort((a, b) => a.name.localeCompare(b.name));
  $('directory-count').textContent = `${list.length} entities`;
  $('directory-list').innerHTML = list.length ? list.map(n => `<button class="directory-row" data-node-detail="${n.id}"><span class="directory-icon" style="--color:${categories[n.category].color}">${escape(initials(n))}</span><span><strong>${escape(n.name)}</strong><small>${escape(n.role)}</small></span><span class="row-arrow" aria-hidden="true">↗</span></button>`).join('') : '<p class="empty-list">No entities match. Try another search or reset the filters.</p>';
}
function visibleRelations() {
  return baseGraph().edges.filter(e=>relationshipMatches(e,state.query,nodeById));
}
function renderRelations() {
  const list=visibleRelations(); $('relations-count').textContent=`${list.length} links`;
  $('relations-list').innerHTML=list.length?list.map(e=>`<button class="ledger-row" data-edge="${e.id}"><span class="ledger-ends">${escape(nodeById.get(e.source).name)} <b>${e.directional?'→':'↔'}</b> ${escape(nodeById.get(e.target).name)}</span><strong>${escape(readerField(e,'label'))}</strong><small>${escape(e.period)}</small>${statusBadge(e)}</button>`).join(''):'<p class="empty-list">No links match.</p>';
}
function visibleSources() {
  const base = baseGraph(); const used = new Set([...base.nodes.flatMap(n => n.sourceIds), ...base.edges.flatMap(e => e.sourceIds)]);
  return sources.filter(s => used.has(s.id) && sourceMatches(s,state.query));
}
function renderSources() {
  const base = baseGraph(); const list = visibleSources();
  const pinned=sources.filter(s=>s.archiveUrl).length;
  $('archive-summary').textContent = `${sources.length} sources · ${pinned} archived copies · ${sources.length-pinned} original pages`;
  $('source-list').innerHTML = list.length ? list.map(s => {
    const count = base.edges.filter(e => e.sourceIds.includes(s.id)).length;
    return `<article class="source-card"><span class="source-number">${String(sources.indexOf(s)+1).padStart(2,'0')}</span><div><h3><a href="${escape(s.archiveUrl||s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.title)} ↗</a></h3><p>${escape(readerField(s,'note'))}</p><small>${escape(s.publisher)} · ${friendlyDate(s.date)} · ${escape(s.kind)}<br>${s.archiveUrl?`Pinned Wayback snapshot: ${s.archiveTimestamp}`:'Original source · content checked'}<br>Source checked ${friendlyDate(s.contentCheckedAt?.slice(0,10)||s.reviewed)}</small><button class="source-connections" data-source="${s.id}">${count} relationship${count===1?'':'s'} →</button></div></article>`;
  }).join('') : '<p class="empty-list">No sources match. Try another search or reset the filters.</p>';
}

function timelineAmount(event){
  if(event.metric)return `<strong>${escape(new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(event.metric.value))}</strong><small>${escape(event.metric.label)}</small>`;
  if(event.amount!==null)return `<strong>${escape(event.amountLabel||new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(event.amount))}</strong>`;
  return '';
}
function prepareTimeline(){
  const base=baseGraph(),available=base.nodes.slice().sort((a,b)=>a.name.localeCompare(b.name));
  if(!available.some(n=>n.id===state.timelineEntity))state.timelineEntity=({'jobsohio':'jobsohio',alpr:'flock',datacenters:'google',politics:'vivek',hb6:'aep',epstein:'les',sports:'hsg'}[state.caseId])||available[0]?.id||'';
  if(!available.some(n=>n.id===state.timelineEntity))state.timelineEntity=available[0]?.id||'';
  $('timeline-entity').innerHTML=available.map(n=>`<option value="${n.id}">${escape(n.name)}</option>`).join('');
  $('timeline-entity').disabled=state.timelineScope==='case'||!available.length;
  $('timeline-entity').value=state.timelineEntity;$('timeline-scope').value=state.timelineScope;$('timeline-money').value=state.timelineMoney;$('timeline-undated').checked=state.timelineUndated;
  shownTimelineEvents=filterTimelineEvents(timelineEvents,base,{entityId:state.timelineEntity,scope:state.timelineScope,moneyGroup:state.timelineMoney,includeUndated:state.timelineUndated,query:state.query});
  if(state.selected?.kind==='event'&&!shownTimelineEvents.some(e=>e.id===state.selected.id))state.selected=null;
}
function timelineInclusion(event,timelineGraph){
  if(state.timelineScope!=='nearby'||event.actorIds.includes(state.timelineEntity))return '';
  const paths=event.actorIds.map(id=>shortestPath(timelineGraph,state.timelineEntity,id)).filter(Boolean).sort((a,b)=>a.edges.length-b.edges.length);
  const path=paths[0];if(!path||!path.edges.length||path.edges.length>2)return '';
  return `Included via ${path.edges.length} recorded link${path.edges.length===1?'':'s'}: ${path.nodes.map(id=>nodeById.get(id)?.name||id).join(' ↔ ')}`;
}
function renderTimeline(){
  const title=state.timelineScope==='case'?(cases[state.caseId]?.title||'Selected case'):nodeById.get(state.timelineEntity)?.name||'Selected entity';
  $('timeline-title').textContent=title;
  $('timeline-scope-explanation').textContent=state.timelineScope==='direct'
    ?`Entity only shows events whose records directly name ${title}.`
    :state.timelineScope==='nearby'
      ?`Connected entities includes events involving entities within two recorded links of ${title}. Indirect cards show why they appear; a connection does not establish causation.`
      :`Entire case shows all matching events in ${title}, including events that do not name one selected entity.`;
  const undated=shownTimelineEvents.filter(e=>e.date.precision==='unknown').length;
  $('timeline-count').textContent=`${shownTimelineEvents.length} event${shownTimelineEvents.length===1?'':'s'} · ${shownTimelineEvents.length-undated} dated · ${undated} undated`;
  const lanes=Object.entries(timelineLanes).filter(([id])=>id!=='media'||state.caseId==='media'||shownTimelineEvents.some(e=>e.lane==='media'));
  $('timeline-view').style.setProperty('--timeline-columns',lanes.length);
  $('timeline-lane-headings').innerHTML=lanes.map(([id,lane])=>`<div style="--lane:${lane.color}"><strong>${lane.label}</strong><small>${lane.description}</small></div>`).join('');
  if(!shownTimelineEvents.length){$('timeline-year-nav').innerHTML='';$('timeline-events').innerHTML='<div class="timeline-empty"><h3>No events match</h3><p>Try another entity or change the case, history, or money filters.</p><button class="small-link" data-reset-timeline>Reset timeline filters</button></div>';return;}
  const years=[...new Set(shownTimelineEvents.map(timelineYear))];
  $('timeline-year-nav').innerHTML='<span>Jump to</span>'+years.map(year=>`<button data-timeline-year="${year}">${year==='undated'?'Undated':year}</button>`).join('');
  const timelineGraph=baseGraph();
  $('timeline-events').innerHTML=years.map(year=>{
    const list=shownTimelineEvents.filter(e=>timelineYear(e)===year);
    return `<section class="timeline-year" data-timeline-year-section="${year}" aria-label="${year==='undated'?'Undated events':year+' events'}"><div class="timeline-year-label"><strong>${year==='undated'?'Date not established':year}</strong><span>${year==='undated'?'The source describes the record; its event date is still unresolved.':'Each card shows the date or reporting period available.'}</span></div><div class="timeline-year-lanes">${lanes.map(([id,lane])=>`<div class="timeline-lane" style="--lane:${lane.color}" aria-label="${lane.label}">${list.filter(e=>e.lane===id).map(event=>{
      const edge=edgeById.get(event.primaryEdgeId);
      const dateLabel=formatEventDate(event.date),observed=event.date.observedOn?`${event.date.observationRole}: ${friendlyDate(event.date.observedOn)}`:'';
      const inclusion=timelineInclusion(event,timelineGraph);
      return `<button class="timeline-card ${state.selected?.kind==='event'&&state.selected.id===event.id?'selected':''}" data-timeline-event="${event.id}" data-precision="${event.date.precision}" data-money-group="${moneyKinds[event.moneyKind].group}" aria-pressed="${state.selected?.kind==='event'&&state.selected.id===event.id}" aria-label="Timeline event: ${escape(eventTitle(event))}, ${escape(dateLabel)}"><span class="timeline-card-date">${escape(dateLabel)}</span><small class="timeline-card-role">${escape(event.date.role)}</small><strong class="timeline-card-title">${escape(eventTitle(event))}</strong><span class="timeline-card-actors">${escape(nodeById.get(edge.source).name)} ${edge.directional?'→':'↔'} ${escape(nodeById.get(edge.target).name)}</span>${inclusion?`<small class="timeline-inclusion">${escape(inclusion)}</small>`:''}<span class="timeline-card-amount">${timelineAmount(event)}</span><span class="timeline-money-kind">${moneyKinds[event.moneyKind].label}</span>${observed?`<small class="timeline-observed">${escape(observed)}</small>`:''}<small class="timeline-proof">${escape(evidenceStatuses[edge.status])} · ${event.sourceIds.length} source${event.sourceIds.length===1?'':'s'}${event.edgeIds.length>1?` · ${event.edgeIds.length} linked records`:''}</small></button>`;
    }).join('')}</div>`).join('')}</div></section>`;
  }).join('');
}

function renderMediaOverview(){
  const panel=$('media-overview');panel.hidden=state.caseId!=='media';if(panel.hidden)return;
  // Profiles describe the verified batch, independently of temporary graph filters.
  if(panel.childElementCount)return;
  const link=id=>`<button class="text-button" data-node-detail="${id}">${escape(nodeById.get(id).name)}</button>`;
  const profiles=mediaProfiles.filter(p=>[p.outlet,...p.authority,...p.affiliations].every(id=>nodeById.has(id)));
  panel.innerHTML=`<div class="media-intro"><p class="eyebrow">MEDIA &amp; INFORMATION</p><h2>Who supplies Columbus’s information?</h2><p>Explore the organizations behind local outlets, their funding and the programs they carry. Each connection opens its source records.</p><p class="media-boundary">${profiles.length} outlet profiles · collection updated October 14, 2026</p></div><details class="media-paths"><summary>Outlet authority paths <span>${profiles.length} profiles · select a name for evidence</span></summary><div class="media-profile-grid">${profiles.map(p=>`<article class="media-profile"><h3>${link(p.outlet)}</h3><p class="media-authority"><strong>${['wosu','wcbe','ocj'].includes(p.outlet)?'Governance / organization':'Ownership / parent path'}</strong><span>${p.authority.map(link).join(p.joint?' <span class="media-path-separator">&amp;</span> ':' <span class="media-path-separator" title="Next parent or controlling owner">←</span> ')}</span></p>${p.affiliations.length?`<p class="media-affiliations"><strong>${p.outlet==='wtvn'?'Program supplier':'Network membership / affiliation'}</strong><span>${p.affiliations.map(link).join(' · ')}</span></p>`:''}<p>${escape(profileCopy[p.outlet]||p.note)}</p><button class="small-link" data-timeline-entity="${p.outlet}">View timeline</button></article>`).join('')}</div></details><details class="media-leads"><summary>Remaining research leads <span>Documents that could deepen the picture</span></summary><ul>${leadStories.map(lead=>`<li><strong>${escape(lead.title)}</strong><br>${escape(lead.text)}</li>`).join('')}</ul></details>`;
}
function render(refit = false) {
  tagStatsCache=new Map();
  renderMediaOverview(); renderFilterChips();
  graph = state.view==='network'?networkGraph():state.view==='timeline'?baseGraph():filterGraph(state);
  if(state.view==='network'){
    state.multiNodes=new Set([...state.multiNodes].filter(id=>graph.nodes.some(node=>node.id===id)));
    state.multiEdges=new Set([...state.multiEdges].filter(id=>graph.edges.some(edge=>edge.id===id)));
  }
  if(state.view==='timeline'){prepareTimeline();renderTimeline();}
  renderIndirectRoutes();renderGraph(); renderInspector(); decorateInspector();renderMapScope();renderQuickMenu();
  if (state.view === 'directory') renderDirectory();
  if (state.view === 'relations') renderRelations();
  if (state.view === 'sources') renderSources();
  positionInspector();
  if(refit)fitGraph();
  researchUI?.render();if(state.view==='network')positionGraph();syncURL();
}

function contributionDates(edge){
  if(!edge?.contributionBreakdown?.length)return '';
  const rows=edge.contributionBreakdown,total=rows.reduce((sum,row)=>sum+row.amount,0),currency=value=>value.toLocaleString('en-US',{style:'currency',currency:'USD'});
  return '<section class="contribution-dates"><h3>Reported contribution dates</h3><table aria-label="Reported contribution dates"><thead><tr><th scope="col">Date</th><th scope="col">Amount</th></tr></thead><tbody>'+rows.map(row=>'<tr><td>'+escape(friendlyDate(row.date))+'</td><td>'+escape(currency(row.amount))+'</td></tr>').join('')+'</tbody></table><p>These '+rows.length+' dates make up the reported '+escape(currency(total))+' total.</p></section>';
}
function renderCampaignCoverage(){
  const panel=$('campaign-coverage');panel.hidden=state.caseId!=='campaigns2026'&&!state.tags.has('topic-campaigns-2026');if(panel.hidden)return;
  const rows=campaignRoster.filter(row=>nodeById.has(row.id));
  $('campaign-coverage-list').innerHTML=rows.map(row=>{const committees=campaignFinanceIndex.units.filter(unit=>unit.candidateIds.includes(row.id)),reports=committees.flatMap(unit=>unit.reportIds),label=reports.length?reports.length+' filing reports':'Filing ledger not yet matched';return '<li><button class="explore-button" data-campaign-money="'+row.id+'">'+escape(row.name)+' · campaign money →</button><span>'+escape(row.party+' · '+row.office)+(row.writeIn?' · write-in':'')+'</span><small>'+label+'</small></li>';}).join('');
}
function campaignFinanceHTML(id){
  const ledger=campaignMoneyCard(id);if(ledger)return ledger;
  const committees=nodes.filter(node=>node.id===id&&node.financeSummaries?.length||node.candidateIds?.includes(id));
  return committees.map(committee=>(committee.financeSummaries||[]).map(summary=>{
    const source=sourceById.get(summary.sourceId),period=summary.period.start&&summary.period.end?friendlyDate(summary.period.start)+' – '+friendlyDate(summary.period.end):'Reporting window not stated in announcement';
    const amount=metric=>metric.qualifier==='more-than'?'> '+new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',notation:'compact',maximumFractionDigits:2}).format(metric.amount):metric.qualifier==='reported-rounded'?'~'+new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',notation:'compact',maximumFractionDigits:2}).format(metric.amount):new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(metric.amount);
    return '<section class="campaign-finance"><h3>'+escape(committee.name)+'</h3><p>'+escape(summary.basis)+' · '+escape(period)+'</p><table><tbody>'+summary.metrics.map(metric=>'<tr><th scope="row">'+escape(metric.label)+'</th><td>'+escape(amount(metric))+'</td></tr>').join('')+'</tbody></table><p>'+escape(summary.note)+'</p>'+(source?'<a href="'+escape(source.archiveUrl||source.url)+'" target="_blank" rel="noopener noreferrer">'+escape(source.publisher)+' · source ↗</a>':'')+'</section>';
  }).join('')).join('');
}
function decorateInspector(){
  if(!state.selected)return;
  if(state.view==='network'&&selectionCount()>1){$('inspector').querySelector('h2')?.setAttribute('tabindex','-1');return;}
  const {kind,id}=state.selected,panel=$('inspector'),record=kind==='node'?nodeById.get(id):kind==='edge'?edgeById.get(id):kind==='source'?sourceById.get(id):timelineEvents.find(e=>e.id===id);
  if(!record)return;panel.querySelector('h2')?.setAttribute('tabindex','-1');
  if(kind==='edge'||kind==='event')panel.querySelector('.evidence-box')?.insertAdjacentHTML('beforebegin',contributionDates(kind==='edge'?record:edgeById.get(record.primaryEdgeId)));
  const details=document.createElement('div');details.className='record-tools';let evidence='';
  if(kind==='edge'){
    const review=reviewFor(record),validity=validityFor(record);
    const dates=validity.start&&validity.end?friendlyDate(validity.start)+' – '+friendlyDate(validity.end):validity.start?'From '+friendlyDate(validity.start):validity.end?'Through '+friendlyDate(validity.end):'Dates of the relationship are not recorded.';
    const reviewText=review.status==='reviewed'?'Source-support check recorded '+friendlyDate(review.reviewedAt?.slice(0,10))+'. Independent editorial review is pending.':'Review attribution is unavailable for this entry. Independent editorial review is pending.';
    evidence='<details><summary>Dates and review history</summary><p>'+escape(dates)+'</p><p>'+escape(reviewText)+'</p></details>';
  }
  if(kind==='source'){
    const check=publicSource(record).contentCheck;
    evidence='<details><summary>Source information</summary><p>Content checked '+escape(check.checkedAt?friendlyDate(check.checkedAt.slice(0,10)):'on an unrecorded date')+' using AI-assisted research.</p><p>Method: '+escape(check.method)+'</p>'+(check.sha256?'<details><summary>File fingerprint</summary><code>'+escape(check.sha256)+'</code></details>':'')+'</details>';
  }
  if(kind==='node'){
    const entity=datasetFor({nodes:[record],edges:[]}).entities[0];
    evidence=(record.aliases?.length?'<p>Also known as '+escape(record.aliases.join('; '))+'</p>':'')+entity.externalIdentifiers.map(i=>'<p>'+escape(i.scheme)+': <strong>'+escape(i.value)+'</strong></p>').join('');
  }
  const url=recordURL(location.href,kind,id,release.releaseId);
  details.innerHTML=evidence+'<p class="stable-record">Record <strong>'+escape(id)+'</strong> · edition '+release.releaseId+'</p><div class="record-actions"><a href="'+escape(url)+'">Record link ↗</a><button class="small-link" data-copy-citation>Copy citation</button><details><summary>Data file</summary><button class="small-link" data-evidence-packet>Download record JSON</button></details></div>';
  panel.append(details);
}
// Context windows keep their geometry when the selected record changes.
function positionInspector(){
  const panel=$('inspector');panel.style.marginBlockStart='';
  if(state.view!=='network'){$('graph-stage').style.setProperty('--docked-width','0px');for(const key of ['width','maxWidth','height','left','right','top','bottom','maxHeight'])panel.style[key]='';delete panel.dataset.docked;return;}
  const stage=$('graph-stage'),docked=detailsLayout.docked&&!panel.hidden,width=detailsWidth(docked?detailsLayout.dockedWidth:detailsLayout.floatingWidth,stage.clientWidth,docked);
  stage.style.setProperty('--docked-width',docked?width+'px':'0px');panel.dataset.docked=String(docked);
  if(!panel.hidden&&!panel.querySelector('.inspector-scroll')){
    const content=document.createElement('div');content.className='inspector-scroll';while(panel.firstChild)content.append(panel.firstChild);panel.append(content);
    const header=content.querySelector('.inspector-header');header.classList.add('floating-panel-header');header.tabIndex=0;header.title='Drag to move · double-click to dock or undock';panel.prepend(header);
    const heading=header.querySelector('.eyebrow');if(heading)heading.textContent='Details';
    const dock=document.createElement('button');dock.dataset.dockDetails='';dock.className='dock-details';header.insertBefore(dock,header.querySelector('button'));
    const resize=document.createElement('div');resize.className='details-resizer';resize.setAttribute('role','separator');resize.setAttribute('aria-label','Resize details width');resize.setAttribute('aria-orientation','vertical');resize.tabIndex=0;panel.append(resize);
    const corner=document.createElement('div');corner.className='window-corner-resizer';corner.tabIndex=0;corner.setAttribute('role','separator');corner.setAttribute('aria-label','Resize details window');corner.title='Drag to resize width and height';panel.append(corner);
  }
  const dock=panel.querySelector('[data-dock-details]');if(dock){dock.textContent=docked?'Undock':'Dock right';dock.setAttribute('aria-label',docked?'Undock details':'Dock details to the right');}
  const resize=panel.querySelector('.details-resizer');if(resize)resize.setAttribute('aria-valuenow',width);
  const corner=panel.querySelector('.window-corner-resizer');if(corner)corner.hidden=docked;
  panel.style.width=width+'px';panel.style.maxWidth='none';panel.style.maxHeight='none';
  if(docked){Object.assign(panel.style,{left:'auto',right:'0px',top:'0px',bottom:'0px',height:'100%'});}
  else{const height=Math.max(180,Math.min(detailsLayout.floatingHeight,stage.clientHeight-24)),left=floatingDetailsPosition?.left??stage.clientWidth-width-16,top=floatingDetailsPosition?.top??62;
    Object.assign(panel.style,{left:Math.max(8,Math.min(left,stage.clientWidth-width-8))+'px',top:Math.max(8,Math.min(top,stage.clientHeight-height-8))+'px',right:'auto',bottom:'auto',height:height+'px'});
  }
}
function toggleDetailsDock(){
  if(!detailsLayout.docked){const rect=$('inspector').getBoundingClientRect(),stage=$('graph-stage').getBoundingClientRect();floatingDetailsPosition={left:rect.left-stage.left,top:rect.top-stage.top};}
  detailsLayout.docked=!detailsLayout.docked;saveDetailsLayout();positionInspector();scheduleWorkspaceState();
}

function revealInspector() {
  if(state.view==='network'){$('inspector').style.zIndex=++windowOrder;$('inspector').querySelector('h2')?.focus({preventScroll:true});return;}
  $('inspector').scrollIntoView({block:'start',behavior:'instant'});
  $('inspector').querySelector('h2')?.focus({preventScroll:true});
}
function jumpToTimelineYear(year) {
  const section = document.querySelector(`[data-timeline-year-section="${CSS.escape(year)}"]`);
  if (!section) return;
  const header = document.querySelector('.timeline-header');
  const inset = getComputedStyle(header).position === 'sticky' ? header.getBoundingClientRect().height : 0;
  window.scrollTo({top:window.scrollY + section.getBoundingClientRect().top - inset - 8,behavior:'instant'});
}
window.addEventListener('resize',()=>{document.documentElement.style.setProperty('--masthead-height',document.querySelector('.masthead').getBoundingClientRect().height+'px');if(graph)renderMapScope();positionInspector();});
function setView(view) {
  const previousView=state.view;
  if(previousView!==view){state.multiNodes.clear();state.multiEdges.clear();}
  if(view!=='network'){state.tags=new Set();hideTagPreview();}
  if(previousView!==view){state.query='';$('search').value='';$('starting-results').hidden=true;}
  if(view==='timeline'&&state.selected?.kind==='node'){state.timelineEntity=state.selected.id;state.timelineScope='direct';}
  const acceptedSelection={network:['node','edge'],timeline:['event'],relations:['edge'],directory:['node'],sources:['source']};
  if(previousView!==view&&state.selected&&!acceptedSelection[view]?.includes(state.selected.kind)){
    state.selected=null;state.detailsOpen=false;state.focus=false;recordMenuOpen=false;
  }
  if(previousView==='timeline'&&view!=='timeline'){state.query='';$('search').value='';}
  if(view==='timeline'||previousView==='timeline')state.focus=false;
  state.view = view;
  document.querySelectorAll('[data-view]').forEach(el => { const active = el.dataset.view === view; el.classList.toggle('active', active); active ? el.setAttribute('aria-current', 'page') : el.removeAttribute('aria-current'); });
  for (const name of ['network','timeline','relations','directory','sources']) $(`${name}-view`).hidden = name !== view;
  document.querySelector('.workspace').setAttribute('data-current-view', view);
  mountCanvasWindows();
  $('search').placeholder=view==='timeline'?'Search events, names or amounts…':view==='sources'?'Search sources…':view==='relations'?'Search connections…':view==='network'?'Search names or tags…':'Search people or organizations…';
  $('search').setAttribute('aria-label',view==='timeline'?'Search timeline events':view==='sources'?'Search sources and publishers':view==='relations'?'Search relationships':view==='network'?'Search names or tags':'Search people and organizations');
  render(view === 'network');
  syncURL();
}
function selectEdge(id){
  if(!edgeById.has(id))return;settleExpansion(false);rememberView();rememberOpener();
  state.multiNodes.clear();state.multiEdges=new Set([id]);state.selected={kind:'edge',id};state.detailsOpen=true;recordMenuOpen=false;hoveredNode=null;render();
}

function revealNode(id) {
  if (!baseGraph().nodes.some(n => n.id === id)) { resetFilters(false); setCase('all'); }
  toggleNode(id);
}
function resetFilters(doRender = true) {
  state.multiNodes.clear();state.multiEdges.clear();state.bucketMode=false;state.bucketIds=null;
  state.categories = new Set(Object.keys(categories)); state.relationships = new Set(Object.keys(relationships)); state.history = true; state.query = ''; state.selected = null; state.path = null; state.focus = false;
  state.timelineMoney='all';state.timelineUndated=true;
  state.caseId='all';$('topic-select').value='all';$('graph-title').textContent='Columbus network';state.tags=new Set();state.connectionMode='all';state.from='';state.to='';state.includeUncertain=true;syncReportingControls();
  $('search').value = ''; $('history').checked = true;
  $('filters').querySelectorAll('[data-category],[data-relationship]').forEach(input => input.checked = true);
  if (doRender){refreshMapScope();render(true);}
}

function openPathFinder() {
  const originView=state.view,selected=state.selected;
  const selectedEdge=selected?.kind==='edge'?edgeById.get(selected.id):null;
  if(state.view!=='network')setView('network');
  const available = baseGraph().nodes.slice().sort((a, b) => a.name.localeCompare(b.name));
  $('path-entities').innerHTML=available.map(node=>`<option value="${escape(node.name)}">${escape(node.role)}</option>`).join('');
  const chosen=[...state.startingIds].filter(id=>available.some(node=>node.id===id));
  const first=chosen[0]||(selected?.kind==='node'?selected.id:'')||selectedEdge?.source||(originView==='timeline'?state.timelineEntity:'');
  const second=chosen[1]||selectedEdge?.target||'';
  $('path-from').value=nodeById.get(first)?.name||'';$('path-to').value=nodeById.get(second)?.name||'';
  $('path-form').querySelector('button').disabled = !available.length;
  $('path-result').innerHTML = available.length ? '' : '<p class="path-result">No entities match the current filters. Reset filters to find a path.</p>';
  openFloatingPanel('path-dialog');
}

$('undo-map').addEventListener('click',undoExploration);
buildFilters(); buildGraph();
researchUI=mountResearchUI({state,nodes,edges,relationships,release,snapshot:workspaceSnapshot,remember:rememberView,changed:(refit=true)=>{if(refit===false){syncURL();return;}syncResearchPins();animateFocusChange(()=>{},focusEntityId(),false);},openPanel:openFloatingPanel,focusNode:id=>{closeFloatingPanel('guided-panel');toggleNode(id);},focusEdge:id=>{closeFloatingPanel('guided-panel');selectEdge(id);},showPath:route=>{closeFloatingPanel('research-panel');showExplorationPath(route);},download:(file,name)=>window.parent.postMessage({channel:'columbus-explorer',type:'download-research',file,name},location.origin),importPath:()=>window.parent.postMessage({channel:'columbus-explorer',type:'import-research'},location.origin),openView:(snapshot,name)=>window.parent.postMessage({channel:'columbus-explorer',type:'open-research',snapshot,name},location.origin),notify:toast,records:kind=>{if(kind==='graph')return baseGraph();const route=currentResearch();return datasetFor({nodes:nodes.filter(node=>route.nodeIds.has(node.id)),edges:edges.filter(edge=>route.edgeIds.has(edge.id))});}});
$('popover-pin').addEventListener('click',()=>{if(!state.selected)return;settleExpansion(false);researchUI.toggle(state.selected.kind==='edge'?'connection':'entity',state.selected.id);});
$('popover-details').addEventListener('click',()=>{animateFocusChange(()=>{state.detailsOpen=true;recordMenuOpen=false;});revealInspector();});
$('popover-close').addEventListener('click',()=>animateFocusChange(()=>{recordMenuOpen=false;}));
$('popover-types').addEventListener('click',event=>{const button=event.target.closest('[data-focus-type]');if(!button)return;const id=focusEntityId();if(!id)return;animateFocusChange(()=>{state.focusType=button.dataset.focusType;state.collapsedNodes.delete(id);state.connectionDistance=1;state.selected={kind:'node',id};state.detailsOpen=false;recordMenuOpen=true;$('popover-type-menu').open=false;syncReportingControls();});});
$('popover-type-menu').addEventListener('toggle',()=>{if(recordMenuOpen&&!expansionAnimation&&graph)animateFocusChange(()=>{},focusEntityId(),false);});
$('popover-collapse').addEventListener('click',()=>{const id=focusEntityId();if(!id)return;animateFocusChange(()=>{if(state.collapsedNodes.has(id))state.collapsedNodes.delete(id);else state.collapsedNodes.add(id);$('popover-type-menu').open=false;});});
$('popover-collapse-path').addEventListener('click',()=>{const id=focusEntityId();if(!id)return;animateFocusChange(()=>{state.trailNodes=new Set([id]);state.trailEdges=new Set();state.path=null;$('popover-type-menu').open=false;});});
$('entity-popover').addEventListener('pointerenter',hideEntityTooltip);
new ResizeObserver(updateTagWindowSpace).observe($('active-tags'));
new ResizeObserver(updateTagWindowSpace).observe($('search-window'));
$('source-total').textContent = sources.length;
$('dataset-counts').innerHTML = `<span><b>${nodes.length}</b> entities</span><span><b>${edges.length}</b> links</span><span><b>${sources.length}</b> sources</span>`;
$('review-date').textContent = `Updated ${friendlyDate(meta.reviewed)}`;
$('topic-select').addEventListener('change',()=>setCase($('topic-select').value));
document.querySelector('.view-nav').addEventListener('click', event => { const btn = event.target.closest('[data-view]'); if (btn) setView(btn.dataset.view); });
$('search').addEventListener('input', () => { if(state.view==='network'){renderEntitySearch();return;}settleExpansion();state.query = $('search').value.trim(); state.selected = null; state.path = null; state.focus = false;applyCaseLayout();render(true); });
$('starting-results').addEventListener('click',event=>{const result=event.target.closest('[data-start-entity]');if(result)addStartingEntity(result.dataset.startEntity);});
$('start-guide').addEventListener('click',event=>{const button=event.target.closest('[data-start-entity]');if(button)addStartingEntity(button.dataset.startEntity);});
$('search').addEventListener('keydown',event=>{if(state.view!=='network')return;if(event.key==='ArrowDown'&&startingSearchResults.length){event.preventDefault();$('starting-results').querySelector('button')?.focus();}if(event.key==='Enter'&&startingSearchResults.length){event.preventDefault();chooseStartingResult(startingSearchResults[0]);}if(event.key==='Escape'){event.stopPropagation();$('search').value='';renderEntitySearch();}});
$('starting-results').addEventListener('keydown',event=>{
  const buttons=[...$('starting-results').querySelectorAll('button')],index=buttons.indexOf(event.target.closest('button'));if(index<0)return;
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();const next=index+(event.key==='ArrowDown'?1:-1);if(next<0)$('search').focus({preventScroll:true});else buttons[Math.min(next,buttons.length-1)].focus();}
  if(event.key==='Escape'){event.stopPropagation();$('search').value='';renderEntitySearch();$('search').focus({preventScroll:true});}
});
$('reset-filters').addEventListener('click', () => resetFilters());
$('empty-reset').addEventListener('click', () => resetFilters());
$('mobile-filters').addEventListener('click',()=>{floatingPanelOpen('filters')?closeFloatingPanel('filters'):openFloatingPanel('filters');});
$('legend-open').addEventListener('click',()=>{quickCollapsed=true;renderQuickMenu();floatingPanelOpen('connection-legend')?closeFloatingPanel('connection-legend'):openFloatingPanel('connection-legend');});
$('zoom-in').addEventListener('click', () => zoom(1.25)); $('zoom-out').addEventListener('click', () => zoom(.8)); $('fit').addEventListener('click',fitGraph);
$('reset-layout').addEventListener('click',()=>{naturalLayout.forEach((p,id)=>positions.set(id,{...p}));fitGraph();toast('Original network positions restored');});
$('label-toggle').addEventListener('click', () => { state.labels = state.labels === 'auto' ? 'all' : state.labels === 'all' ? 'off' : 'auto'; $('label-toggle').textContent = state.labels === 'auto' ? 'Labels auto' : state.labels === 'all' ? 'All labels' : 'Labels off'; renderGraph(); });
document.addEventListener('click', event => {
  const pinButton=event.target.closest('[data-toggle-pin]');if(pinButton){togglePin(pinButton.dataset.togglePin);return;}
  const anchorButton=event.target.closest('[data-anchor-focus]');if(anchorButton){toggleNode(anchorButton.dataset.anchorFocus);return;}
  const showType=event.target.closest('[data-show-type]');if(showType){animateFocusChange(()=>{state.focusType='';state.relationships.add(showType.dataset.showType);if(connectionModesForLegend()&&!connectionModesForLegend().includes(showType.dataset.showType))state.connectionMode='all';syncReportingControls();});return;}
  const projectLink=event.target.closest('[data-project-dialog]');
  if(projectLink){event.preventDefault();document.querySelector('dialog[open]')?.close();$(projectLink.dataset.projectDialog).showModal();return;}
  const btn = event.target.closest('button'); if (!btn) return;
  if(btn.dataset.removeTag){applyTag(btn.dataset.removeTag);$('search').focus({preventScroll:true});return;}
  if(btn.hasAttribute('data-add-tag')){$('search').focus({preventScroll:true});return;}
  if(btn.dataset.startTag){chooseStartingResult({kind:'tag',id:btn.dataset.startTag});return;}
  if(btn.dataset.tag){applyTag(btn.dataset.tag);return;}
  if(btn.hasAttribute('data-dock-details')){toggleDetailsDock();return;}
  if(btn.dataset.closeFloating){closeFloatingPanel(btn.dataset.closeFloating);return;}
  if (btn.classList.contains('methodology-open')) $('methodology').showModal();
  if (btn.dataset.openCase) { setCase(btn.dataset.openCase); setView('network'); }
  if (btn.hasAttribute('data-close-inspector')) { if(state.view==='network'){state.detailsOpen=false;render();}else{state.selected=null;state.focus=false;render();}restoreFocus(); }
  if(btn.hasAttribute('data-copy-citation')){const {kind,id}=state.selected;const citation=`CBUS Power, ${recordKind(kind)} ${id}, release ${release.releaseId}  ${recordURL(location.href,kind,id,release.releaseId)}`;navigator.clipboard.writeText(citation).then(()=>toast('Release-specific citation copied')).catch(()=>{downloadJSON({citation},'record-citation.json');toast('Citation downloaded');});}
  if(btn.hasAttribute('data-evidence-packet'))downloadJSON(evidencePacket(state.selected,baseGraph()),'evidence-'+state.selected.id+'-'+release.releaseId+'.json');
  if(btn.dataset.timelineEvent){rememberOpener();state.selected={kind:'event',id:btn.dataset.timelineEvent};state.path=null;render();revealInspector();}
  if(btn.dataset.timelineYear)jumpToTimelineYear(btn.dataset.timelineYear);
  if(btn.dataset.timelineEntity){state.timelineEntity=btn.dataset.timelineEntity;state.timelineScope='direct';state.selected=null;state.query='';$('search').value='';setView('timeline');}
  if(btn.dataset.timelineNetwork){
    const event=shownTimelineEvents.find(e=>e.id===btn.dataset.timelineNetwork),edge=edgeById.get(event.primaryEdgeId);
    state.query='';$('search').value='';state.selected={kind:'edge',id:edge.id};state.path={nodes:[edge.source,edge.target],edges:[edge.id]};state.focus=false;setView('network');fitGraph(new Set([edge.source,edge.target]));$('network-view').scrollIntoView({block:'start',behavior:'instant'});
  }
  if(btn.hasAttribute('data-reset-timeline')){state.timelineMoney='all';state.timelineUndated=true;state.query='';$('search').value='';state.selected=null;render();}
  if (btn.dataset.start) revealNode(btn.dataset.start);
  if (btn.dataset.nodeDetail) { if (btn.closest('#path-dialog')) closeFloatingPanel('path-dialog'); revealNode(btn.dataset.nodeDetail); }
  if (btn.dataset.edge && !btn.closest('#graph')) { selectEdge(btn.dataset.edge); }
  if (btn.dataset.source) { state.multiNodes.clear();state.multiEdges.clear();rememberOpener();state.detailsOpen=true; state.selected = { kind: 'source', id: btn.dataset.source }; render(); revealInspector(); }
  if(btn.dataset.expandNode)centerOnEntity(btn.dataset.expandNode);
  if (btn.hasAttribute('data-focus')) { state.focus = !state.focus; renderGraph(); renderInspector();decorateInspector();fitGraph();syncURL(); }
  if (btn.hasAttribute('data-clear-highlight')) { settleExpansion(false);const refit=state.focus;state.focus = false; state.path = null; render(refit); }
});
for(const id of ['timeline-entity','timeline-scope','timeline-money','timeline-undated'])$(id).addEventListener('change',()=>{
  state.timelineEntity=$('timeline-entity').value;state.timelineScope=$('timeline-scope').value;state.timelineMoney=$('timeline-money').value;state.timelineUndated=$('timeline-undated').checked;state.selected=null;state.path=null;render();
  syncURL();
});
document.addEventListener('keydown', event => {
  if(event.code==='Space'&&!event.target.closest('input,textarea,select,[contenteditable=true]')){spaceToPan=true;$('graph').dataset.selectionMode='false';}
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'&&!event.shiftKey&&state.view==='network'&&!event.target.closest('input,textarea,[contenteditable=true]')&&explorationHistory.length){event.preventDefault();undoExploration();return;}
  if (event.key === '/' && !['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName) && !document.querySelector('dialog[open]')) { event.preventDefault(); $('search').focus(); }
  if(event.key==='Escape'&&!$('entity-tooltip').hidden){hideEntityTooltip();event.preventDefault();return;}
  if(event.key==='Escape'&&event.target.closest('.floating-panel')){closeFloatingPanel(event.target.closest('.floating-panel').id);return;}
  if (event.key === 'Escape' && !document.querySelector('dialog[open]')) { settleExpansion(false);state.multiNodes.clear();state.multiEdges.clear();state.selected = null;state.detailsOpen=false; state.focus = false; state.path = null; render();restoreFocus(); }
});
document.addEventListener('keyup',event=>{if(event.code==='Space'){spaceToPan=false;$('graph').dataset.selectionMode=String(boxSelectMode);}});
window.addEventListener('blur',()=>{spaceToPan=false;$('graph').dataset.selectionMode=String(boxSelectMode);});
document.addEventListener('pointerover',event=>{const button=event.target.closest('[data-tag]');if(button&&button!==tagPreviewOwner)showTagPreview(button);});
document.addEventListener('pointerout',event=>{const button=event.target.closest('[data-tag]');if(button&&!button.contains(event.relatedTarget)&&document.activeElement!==button)hideTagPreview();});
document.addEventListener('focusin',event=>{const button=event.target.closest('[data-tag]');if(button)showTagPreview(button);});
document.addEventListener('focusout',event=>{if(event.target===tagPreviewOwner)hideTagPreview();});
window.addEventListener('scroll',()=>{if(previewTag)hideTagPreview();},true);
$('path-open').addEventListener('click',()=>{floatingPanelOpen('path-dialog')?closeFloatingPanel('path-dialog'):openPathFinder();});
$('path-form').addEventListener('submit', event => {
  event.preventDefault();const available=baseGraph(),resolve=value=>available.nodes.find(node=>normalize(node.name)===normalize(value)||node.id===value)?.id;
  const from=resolve($('path-from').value),to=resolve($('path-to').value);
  if(!from||!to||from===to){$('path-result').innerHTML='<p class="path-result" role="alert">Choose two different entities from the suggestions.</p>';return;}
  const routes=findPaths(available,from,to,{directed:$('path-directed').checked});
  if(!routes.length){$('path-result').innerHTML='<p class="path-result">No route found within six steps and the current case, mode, direction and dates. Longer paths may exist.</p>';return;}
  $('path-result').innerHTML=routes.map((route,index)=>`<div class="path-result"><strong>Route ${index+1} · ${route.edges.length} ${route.edges.length===1?'link':'links'}</strong><p>${escape(route.edges.length===1?'Recorded link period: '+edgeById.get(route.edges[0]).period:'Overlapping date range: '+overlapLabel(route.dates.status))}</p>${route.nodes.map((id,i)=>`${i?`<div class="path-edge-label">${escape(edgeById.get(route.edges[i-1]).type)} · ${escape(readerField(edgeById.get(route.edges[i-1]),'label'))}<br>${escape(edgeById.get(route.edges[i-1]).period)} · ${escape(evidenceStatuses[edgeById.get(route.edges[i-1]).status])}</div>`:''}<div class="path-hop"><button data-node-detail="${id}">${escape(nodeById.get(id).name)}</button></div>`).join('')}<button class="explore-button path-show-button" data-show-route="${index}">Show this path →</button> <button class="small-link" data-packet-route="${index}">Download path data ↓</button></div>`).join('')+'<p>Up to three routes, at most six steps. </p>';
  $('path-result').querySelectorAll('[data-show-route]').forEach(button=>button.addEventListener('click',()=>{closeFloatingPanel('path-dialog');showExplorationPath(routes[Number(button.dataset.showRoute)],[from,to]);}));
  $('path-result').querySelectorAll('[data-packet-route]').forEach(button=>button.addEventListener('click',()=>{const route=routes[Number(button.dataset.packetRoute)];downloadJSON(evidencePacket({kind:'path',...route}),'path-'+release.releaseId+'.json');}));
});
function currentExport() {
  let exported = graph;
  if(state.view==='timeline'){const ids=new Set(shownTimelineEvents.flatMap(e=>e.edgeIds));const links=baseGraph().edges.filter(e=>ids.has(e.id));const actors=new Set(links.flatMap(e=>[e.source,e.target]));exported={nodes:baseGraph().nodes.filter(n=>actors.has(n.id)),edges:links};}
  if(state.view==='relations') { const links=visibleRelations(); const ids=new Set(links.flatMap(e=>[e.source,e.target])); exported={nodes:baseGraph().nodes.filter(n=>ids.has(n.id)),edges:links}; }
  if (state.view === 'directory') { const base = baseGraph(); const list = base.nodes.filter(n => matches(n, state.query)); const ids = new Set(list.map(n => n.id)); exported = { nodes: list, edges: base.edges.filter(e => ids.has(e.source) && ids.has(e.target)) }; }
  if (state.view === 'sources') { const base = baseGraph(); const visible = new Set(visibleSources().map(s => s.id)); const links = base.edges.filter(e => e.sourceIds.some(id => visible.has(id))); const ids = new Set(links.flatMap(e => [e.source, e.target])); exported = { nodes: base.nodes.filter(n => ids.has(n.id) || n.sourceIds.some(id => visible.has(id))), edges: links }; }
  const sourceIds = new Set([...exported.nodes.flatMap(n => n.sourceIds), ...exported.edges.flatMap(e => e.sourceIds)]);
  const output = { meta, view:state.view,case:state.caseId, filters:{categories:[...state.categories],relationships:[...state.relationships],includeHistory:state.history,query:state.query,...(state.view==='timeline'?{timelineEntity:state.timelineEntity,timelineScope:state.timelineScope,moneyStatus:state.timelineMoney,includeUndated:state.timelineUndated}:{})},...(state.view==='timeline'?{events:shownTimelineEvents}:{}),...(state.caseId==='media'?{outletProfiles:mediaProfiles.filter(p=>[p.outlet,...p.authority,...p.affiliations].every(id=>exported.nodes.some(n=>n.id===id))),researchLeads:mediaLeads}:{}),nodes:exported.nodes,edges:exported.edges,sources:sources.filter(s=>sourceIds.has(s.id)).map(({url,archiveUrl,archiveBrowseUrl,...record})=>({...record,url:archiveUrl||url})) };
  Object.assign(output,datasetFor(exported,state.view==='timeline'?shownTimelineEvents:null));
  if(state.view==='network'&&state.tags.size){const selection=tagSelection(exported,state.tags),single=state.tags.size===1;output.tagSelection={...(single?{id:[...state.tags][0],label:tagDefinitions[[...state.tags][0]].label}:{}),tags:selection.byTag,mode:selection.mode,connectionLimit:selection.connectionLimit,entityIds:[...selection.matches.nodes],relationshipIds:[...selection.matches.edges],connectorRelationshipIds:[...selection.connectors]};}
  output.nodes=output.entities;output.edges=output.relationships;output.filters={...output.filters,connectionMode:state.connectionMode,from:state.from,to:state.to,includeUncertain:state.includeUncertain,...(state.view==='network'?{pinnedIds:[...state.pinnedIds],connectionDistance:state.connectionDistance,centerEntity:focusEntityId(),tag:state.tags.size===1?[...state.tags][0]:null,tags:[...state.tags]}:{})};output.viewURL=encodeState(location.href,state,release.releaseId);
  return {output,name:`cbus-power-${state.view}-${release.releaseId}.json`};
}
function openDataDownload(){
  const {output,name}=currentExport();
  const viewNames={network:'Network',timeline:'Timeline',relations:'Links',directory:'Entities',sources:'Sources'};
  const scope={network:'the entities and connections currently on the map',timeline:'the visible timeline events and their linked records',relations:'the matching links and their endpoints',directory:'the matching entities and links among them',sources:'the matching sources and records they support'}[state.view];
  const counts=[`${output.entities.length} entities`,`${output.relationships.length} links`,`${output.sources.length} sources`,...(output.events?[`${output.events.length} events`]:[])].join(' · ');
  const selectedFilters=[cases[state.caseId]?.title||'All topics',state.query?`Search: “${state.query}”`:'No search term',`${state.categories.size} entity categories`,`${state.relationships.size} connection types`,...(state.view==='timeline'?[`Scope: ${$('timeline-scope').selectedOptions[0]?.textContent||state.timelineScope}`,`Money: ${$('timeline-money').selectedOptions[0]?.textContent||state.timelineMoney}`]:[])].join(' · ');
  $('data-download-summary').textContent=`This file contains ${scope}. Check the selection before saving it.`;
  $('data-download-details').innerHTML=`<dt>View</dt><dd>${escape(viewNames[state.view])}</dd><dt>Edition</dt><dd>${escape(release.releaseId)}</dd><dt>Format</dt><dd>JSON</dd><dt>Records</dt><dd>${escape(counts)}</dd><dt>Active selection</dt><dd>${escape(selectedFilters)}</dd><dt>File name</dt><dd>${escape(name)}</dd>`;
  $('data-download-manifest').href=`./downloads/${encodeURIComponent(release.releaseId)}/manifest.json`;
  document.querySelector('.secondary-actions').open=false;
  $('data-download').showModal();
  positionDataDownload();
}
function positionDataDownload(){
  const dialog=$('data-download');if(!dialog.open)return;
  let visibleTop=0,visibleHeight=window.innerHeight,visibleLeft=0,visibleWidth=window.innerWidth;
  try{
    if(window.frameElement&&window.parent!==window){
      const frame=window.frameElement.getBoundingClientRect();
      visibleTop=Math.max(0,-frame.top);
      visibleHeight=Math.max(0,Math.min(frame.bottom,window.parent.innerHeight)-Math.max(0,frame.top));
      visibleLeft=Math.max(0,-frame.left);
      visibleWidth=Math.max(0,Math.min(frame.right,window.parent.innerWidth)-Math.max(0,frame.left));
    }
  }catch{}
  const width=Math.max(0,Math.min(650,visibleWidth-24));
  dialog.style.width=width+'px';dialog.style.maxWidth=width+'px';dialog.style.maxHeight=Math.max(120,visibleHeight-24)+'px';
  const height=dialog.getBoundingClientRect().height;
  dialog.style.margin='0';dialog.style.right='auto';dialog.style.bottom='auto';
  dialog.style.left=Math.max(12,visibleLeft+Math.max(12,(visibleWidth-width)/2))+'px';
  dialog.style.top=Math.max(12,visibleTop+Math.max(12,(visibleHeight-height)/2))+'px';
}
function exportCurrent(){
  const {output,name}=currentExport();
  downloadJSON(output,name);$('data-download').close();
  toast(`${name} saved · ${output.entities.length} entities · ${output.relationships.length} links · ${output.sources.length} sources`);
}
for(const id of ['export','export-visible'])$(id).addEventListener('click',openDataDownload);
$('data-download-confirm').addEventListener('click',exportCurrent);
window.addEventListener('resize',positionDataDownload);
try{if(window.parent!==window)window.parent.addEventListener('scroll',positionDataDownload,{passive:true});}catch{}
for (const dialog of document.querySelectorAll('dialog')) dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
function syncReportingControls(){$('connection-mode').value=state.connectionMode;$('valid-from').value=state.from;$('valid-to').value=state.to;$('include-uncertain').checked=state.includeUncertain;$('connection-distance').value=String(state.connectionDistance);}
$('connection-distance').addEventListener('change',()=>{
  const distance=normalizeConnectionDistance($('connection-distance').value);
  animateFocusChange(()=>{state.connectionDistance=distance;defaults.connectionDistance=state.connectionDistance;
  const id=focusEntityId()||(state.selected?.kind==='node'?state.selected.id:state.exploreRoot)||[...state.pinnedIds][0];
  if(nodeById.has(id)){state.collapsedNodes.delete(id);state.focusEntity=id;state.focus=true;state.openNodes.add(id);state.explorationSeeds.add(id);}
  try{localStorage.setItem(distancePreferenceKey,String(state.connectionDistance));}catch{}
  syncReportingControls();});
});
for(const id of ['connection-mode','valid-from','valid-to','include-uncertain'])$(id).addEventListener('change',()=>{
  const from=$('valid-from').value,to=$('valid-to').value;
  try{validateRange(from,to);$('query-error').hidden=true;}catch(error){$('query-error').textContent=error.message;$('query-error').hidden=false;return;}
  rememberView();Object.assign(state,{connectionMode:$('connection-mode').value,from,to,includeUncertain:$('include-uncertain').checked,path:null});render(true);
});
function restoreURL(){
  restoringURL=true;const requested=decodeState(location.href,defaults);
  setCase(requested.caseId);setView(requested.view);Object.assign(state,requested);
  state.multiNodes=new Set(requested.selected?.kind==='node'?[requested.selected.id]:[]);state.multiEdges=new Set(requested.selected?.kind==='edge'?[requested.selected.id]:[]);
  state.bucketIds=null;if(requested.selected)state.detailsOpen=true;
  const valid=state.selected&&(state.selected.kind==='node'?nodeById.has(state.selected.id):state.selected.kind==='edge'?edgeById.has(state.selected.id):state.selected.kind==='source'?sourceById.has(state.selected.id):timelineEvents.some(e=>e.id===state.selected.id));
  const messages=[];if(state.selected&&!valid){messages.push('Unknown record ID; no record was substituted.');state.selected=null;}
  if(state.requestedRelease&&state.requestedRelease!==release.releaseId)messages.push(`This link cites ${state.requestedRelease}; this site contains ${release.releaseId}. Consult the saved release before citing.`);
  if(state.routeWarning)messages.push(state.routeWarning);
  $('route-warning').textContent=messages.join(' ');$('route-warning').hidden=!messages.length;
  $('search').value=state.query;$('history').checked=state.history;syncReportingControls();
  $('filters').querySelectorAll('[data-category]').forEach(input=>input.checked=state.categories.has(input.dataset.category));
  $('filters').querySelectorAll('[data-relationship]').forEach(input=>input.checked=state.relationships.has(input.dataset.relationship));
  $('label-toggle').textContent=state.labels==='auto'?'Labels auto':state.labels==='all'?'All labels':'Labels off';
  state.exploredIds=new Set([...state.exploredIds].filter(id=>nodeById.has(id)));
  state.explorationSeeds=new Set([...state.explorationSeeds].filter(id=>nodeById.has(id)));
  state.openNodes=new Set([...state.openNodes].filter(id=>nodeById.has(id)));
  state.startingIds=new Set([...state.startingIds].filter(id=>nodeById.has(id)));
  state.pinnedIds=new Set([...state.pinnedIds].filter(id=>nodeById.has(id)));
  state.trailNodes=new Set([...state.trailNodes].filter(id=>nodeById.has(id)));state.trailEdges=new Set([...state.trailEdges].filter(id=>edgeById.has(id)));state.collapsedNodes=new Set([...state.collapsedNodes].filter(id=>nodeById.has(id)));
  const restoredTrail=extendTrail({nodes:state.trailNodes,edges:state.trailEdges},{nodes,edges});state.trailNodes=restoredTrail.nodes;state.trailEdges=restoredTrail.edges;
  try{state.research=validateResearch({id:'',title:'Untitled research path',createdAt:'',steps:state.requestedResearch?.length?state.requestedResearch:[...state.pinnedIds].map(id=>({kind:'entity',id,note:''}))},new Set(nodeById.keys()),new Set(edgeById.keys()));}catch{state.research=emptyResearch();}syncResearchPins();
  if(state.customStart&&!state.explorationSeeds.size)state.explorationSeeds=new Set(state.startingIds);
  if(state.mapMode==='explore'&&!state.exploredIds.size&&!state.customStart)seedMap(state.selected?.kind==='node'?state.selected.id:state.exploreRoot);
  if(state.mapMode==='explore'&&state.selected?.kind==='node')state.explorationSeeds.add(state.selected.id);
  if(state.mapMode==='explore'&&state.selected?.kind==='edge'){const edge=edgeById.get(state.selected.id);state.explorationSeeds.add(edge.source);state.explorationSeeds.add(edge.target);}
  if(state.requestedPath?.length){const links=state.requestedPath.map(id=>edgeById.get(id));if(links.every(Boolean)){state.path={edges:links.map(e=>e.id),nodes:[...new Set(links.flatMap(e=>[e.source,e.target]))]};}}
  if(focusEntityId()){if(nodeById.has(focusEntityId()))state.explorationSeeds.add(focusEntityId());else state.focus=false;}
  applyCaseLayout();render(true);restoringURL=false;
  // Preserve mismatched release citation in the incoming URL until the reader changes the view.
  if(!state.requestedRelease||state.requestedRelease===release.releaseId)syncURL();
  if(window.parent===window&&state.selected&&!$('inspector').hidden)requestAnimationFrame(revealInspector);
}
$('release-label').textContent=`Edition · ${release.releaseId}`;
window.addEventListener('popstate',restoreURL);restoreURL();
$('label-toggle').addEventListener('click',syncURL);
$('map-full').addEventListener('click',()=>animateFocusChange(()=>{state.tags=new Set();hideTagPreview();state.mapMode='full';state.focus=false;state.focusType='';state.selected=null;state.path=null;recordMenuOpen=false;}));
$('map-small').addEventListener('click',openStartingEntities);
$('map-scope').addEventListener('click',()=>{const id=expansionAnchor();if(!nodeById.has(id))return;state.selected={kind:'node',id};state.detailsOpen=true;render();revealInspector();});
$('search-show-all').addEventListener('click',()=>{
  settleExpansion();rememberView();resetFilters(false);state.caseId='all';$('topic-select').value='all';$('graph-title').textContent='Columbus network';
  state.startingIds=new Set();state.explorationSeeds=new Set();state.exploredIds=new Set();state.openNodes=new Set();state.exploreRoot='';state.customStart=false;state.mapMode='full';
  renderEntitySearch();setView('network');applyCaseLayout();render(true);$('graph').focus({preventScroll:true});
});
let windowDrag=null;
function windowSurface(panel){return panel.id==='inspector'?$('graph-stage'):$('canvas-area');}
function moveWindow(panel,left,top){
  const stage=windowSurface(panel);panel.style.left=Math.min(Math.max(8,left),Math.max(8,stage.clientWidth-panel.offsetWidth-8))+'px';panel.style.top=Math.min(Math.max(8,top),Math.max(8,stage.clientHeight-panel.offsetHeight-8))+'px';panel.style.right='auto';panel.style.bottom='auto';
  const point={left:parseFloat(panel.style.left),top:parseFloat(panel.style.top)};if(panel.id==='inspector')floatingDetailsPosition=point;else if(panel.id==='quick-menu'){quickPosition=point;quickDocked=false;$('quick-dock').textContent='Dock';}
}
function saveDetailsLayout(){try{localStorage.setItem(detailsPreferenceKey,JSON.stringify(detailsLayout));}catch{}}
function resizeDetails(requested,right=null,top=null,height=null){
  const stage=$('graph-stage'),width=detailsWidth(requested,stage.clientWidth,detailsLayout.docked);
  if(detailsLayout.docked)detailsLayout.dockedWidth=width;
  else{detailsLayout.floatingWidth=width;if(height!=null)detailsLayout.floatingHeight=Math.max(180,Math.min(height,stage.clientHeight-(top||8)-8));if(right!=null)floatingDetailsPosition={left:Math.max(8,right-width),top};}
  positionInspector();
}
document.addEventListener('pointerdown',event=>{
  const handle=event.target.closest('.details-resizer,.window-corner-resizer');if(!handle||event.button!==0)return;
  const panel=handle.parentElement,rect=panel.getBoundingClientRect(),stage=windowSurface(panel).getBoundingClientRect();
  detailsResize={panel,handle,corner:handle.classList.contains('window-corner-resizer'),pointer:event.pointerId,x:event.clientX,y:event.clientY,width:rect.width,height:rect.height,right:rect.right-stage.left,left:rect.left-stage.left,top:rect.top-stage.top};
  handle.setPointerCapture(event.pointerId);document.body.classList.add('resizing-details');event.preventDefault();
});
document.addEventListener('pointermove',event=>{
  const r=detailsResize;if(!r||event.pointerId!==r.pointer)return;
  const width=r.width+(r.corner?event.clientX-r.x:r.x-event.clientX),height=r.height+event.clientY-r.y;
  if(r.panel.id==='quick-menu'){quickSize={width:Math.max(250,Math.min(620,width)),height:Math.max(180,Math.min(height,$('canvas-area').clientHeight-r.top-8))};positionQuickMenu();}
  else if(r.corner){floatingDetailsPosition={left:r.left,top:r.top};resizeDetails(width,null,r.top,height);}
  else resizeDetails(width,r.right,r.top);
});
for(const name of ['pointerup','pointercancel'])document.addEventListener(name,event=>{if(detailsResize&&event.pointerId===detailsResize.pointer){if(detailsResize.handle.hasPointerCapture(event.pointerId))detailsResize.handle.releasePointerCapture(event.pointerId);detailsResize=null;document.body.classList.remove('resizing-details');saveDetailsLayout();scheduleWorkspaceState();}});


document.addEventListener('keydown',event=>{
  if(!event.target.matches('.window-corner-resizer')||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
  event.preventDefault();const panel=event.target.parentElement,w=panel.offsetWidth+(event.key==='ArrowLeft'?-20:event.key==='ArrowRight'?20:0),h=panel.offsetHeight+(event.key==='ArrowUp'?-20:event.key==='ArrowDown'?20:0);
  if(panel.id==='quick-menu'){quickSize={width:Math.max(250,Math.min(620,w)),height:Math.max(180,h)};positionQuickMenu();}
  else resizeDetails(w,null,panel.offsetTop,h);saveDetailsLayout();scheduleWorkspaceState();
});

document.addEventListener('keydown',event=>{
  if(!event.target.matches('.details-resizer')||!['ArrowLeft','ArrowRight','Home'].includes(event.key))return;
  event.preventDefault();const rect=$('inspector').getBoundingClientRect(),stage=$('graph-stage').getBoundingClientRect();resizeDetails(event.key==='Home'?380:rect.width+(event.key==='ArrowLeft'?20:-20),rect.right-stage.left,rect.top-stage.top);saveDetailsLayout();
});
document.addEventListener('pointerdown',event=>{
  const handle=event.target.closest('.floating-panel-header');if(state.view!=='network'||!handle||event.target.closest('button')||event.button!==0)return;
  const panel=handle.parentElement;if(panel.id==='connection-legend')return;if(panel.id==='inspector'&&detailsLayout.docked)toggleDetailsDock();if(panel.id==='quick-menu'&&quickDocked){quickDocked=false;$('quick-dock').textContent='Dock';}const stage=windowSurface(panel).getBoundingClientRect(),rect=panel.getBoundingClientRect();
  windowDrag={panel,handle,pointer:event.pointerId,x:event.clientX,y:event.clientY,left:rect.left-stage.left,top:rect.top-stage.top};panel.style.zIndex=++windowOrder;handle.setPointerCapture(event.pointerId);event.preventDefault();
});
document.addEventListener('pointermove',event=>{if(windowDrag&&event.pointerId===windowDrag.pointer)moveWindow(windowDrag.panel,windowDrag.left+event.clientX-windowDrag.x,windowDrag.top+event.clientY-windowDrag.y);});
for(const name of ['pointerup','pointercancel'])document.addEventListener(name,event=>{if(windowDrag&&event.pointerId===windowDrag.pointer){if(windowDrag.handle.hasPointerCapture(event.pointerId))windowDrag.handle.releasePointerCapture(event.pointerId);windowDrag=null;}});
document.addEventListener('keydown',event=>{if(state.view!=='network'||!event.target.matches('.floating-panel-header'))return;const offsets={ArrowLeft:[-20,0],ArrowRight:[20,0],ArrowUp:[0,-20],ArrowDown:[0,20]};if(!offsets[event.key])return;const panel=event.target.parentElement;if(panel.id==='inspector'&&detailsLayout.docked)return;event.preventDefault();const stage=windowSurface(panel).getBoundingClientRect(),rect=panel.getBoundingClientRect();moveWindow(panel,rect.left-stage.left+offsets[event.key][0],rect.top-stage.top+offsets[event.key][1]);});
if(repositoryURL){
  $('github-contribute').href=repositoryURL+'/blob/main/docs/CONTRIBUTING.md';
  $('github-contact').href=repositoryURL+'/issues';$('github-contact').hidden=false;
}

// Same-origin workspace bridge. Each tab owns an independent explorer instance.
function workspaceSnapshot(){
  const finalPositions=new Map(positions);expansionAnimation?.targets.forEach((p,id)=>finalPositions.set(id,p));
  return {query:location.search,mapLayout:'stable-network-v1',interaction:{entities:[...state.multiNodes],connections:[...state.multiEdges],bucketIds:state.bucketIds?[...state.bucketIds]:null},...(!cloudNeedsFit?{overviewIds:[...cloudSceneIds]}:{}),positions:[...finalPositions].map(([id,p])=>[id,p.x,p.y]),camera:{...(expansionAnimation?.endCamera||camera)},dimensions:{...dimensions},scale:entityScale,research:structuredClone(state.research),details:{open:state.detailsOpen,docked:detailsLayout.docked,width:detailsLayout.docked?detailsLayout.dockedWidth:detailsLayout.floatingWidth,height:detailsLayout.floatingHeight}};
}
function publishWorkspaceState(requestId=null){
  if(window.parent===window)return;
  window.parent.postMessage({channel:'columbus-explorer',type:'state',snapshot:workspaceSnapshot(),requestId},location.origin);
}
function scheduleWorkspaceState(){clearTimeout(workspaceTimer);workspaceTimer=setTimeout(publishWorkspaceState,180);}
function measureWorkspace(){if(window.parent!==window)window.parent.postMessage({channel:'columbus-explorer',type:'height',height:state.view==='network'?$('network-view').offsetHeight+16:document.documentElement.scrollHeight},location.origin);}
function restoreWorkspaceView(input){
  const saved=validateView(input,new Set(nodeById.keys()));settleExpansion();history.replaceState(null,'',location.pathname+saved.query);state.detailsOpen=saved.details.open;detailsLayout={docked:saved.details.docked,floatingWidth:saved.details.width,dockedWidth:saved.details.width,floatingHeight:saved.details.height||430};restoreURL();restoringURL=true;if(saved.research){state.research=saved.research;syncResearchPins();}state.detailsOpen=saved.details.open||!!state.selected;recordMenuOpen=false;render();
  cloudSceneIds=new Set(saved.overviewIds||[]);cloudNeedsFit=cloudView()&&!saved.overviewIds?.length;
  if(saved.mapLayout==='stable-network-v1'&&saved.positions.length){saved.positions.forEach(([id,x,y])=>positions.set(id,{x,y}));const r=$('canvas-area').getBoundingClientRect();entityScale=saved.scale;$('graph').style.setProperty('--entity-label-size',Math.max(11,13*entityScale)+'px');if(r.width<1||r.height<1){dimensions={...saved.dimensions};camera={...saved.camera};}else{dimensions={width:r.width,height:r.height};if(Math.abs(r.width-saved.dimensions.width)<3&&Math.abs(r.height-saved.dimensions.height)<3)camera={...saved.camera};else camera=fittedCamera();}positionGraph();}
  state.multiNodes=new Set(saved.interaction?.entities||[]);state.multiEdges=new Set(saved.interaction?.connections||[]);state.bucketIds=saved.interaction?.bucketIds?new Set(saved.interaction.bucketIds):null;
  if(!selectionCount()&&state.selected?.kind==='node')state.multiNodes.add(state.selected.id);
  if(!selectionCount()&&state.selected?.kind==='edge')state.multiEdges.add(state.selected.id);
  if(selectionCount())showSelection();if(state.bucketMode)fitGraph();
  repairFocusedPlacement();explorationHistory.length=0;$('undo-map').disabled=true;restoringURL=false;publishWorkspaceState();measureWorkspace();
}
window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==window.parent||event.data?.channel!=='columbus-explorer')return;
  if(Number.isFinite(event.data.viewportHeight))canvasBaseHeight=Math.max(464,event.data.viewportHeight-16);
  if(event.data.type==='restore'){try{restoreWorkspaceView(event.data.snapshot);}catch{toast('This view could not be restored.');}}
  if(event.data.type==='navigate'&&['network','timeline','relations','directory','sources'].includes(event.data.view)){setView(event.data.view);measureWorkspace();publishWorkspaceState();}
  if(event.data.type==='research-library')researchUI.openSaved();
  if(event.data.type==='capture')publishWorkspaceState(event.data.requestId);if(event.data.type==='measure')requestAnimationFrame(()=>{if(state.view==='network'&&graph&&$('canvas-area').getBoundingClientRect().width>0){positionGraph();}measureWorkspace();});
});
for(const type of ['pointerdown','focusin'])document.addEventListener(type,()=>{if(window.parent!==window)window.parent.postMessage({channel:'columbus-explorer',type:'focus'},location.origin);},true);
document.addEventListener('pointerup',scheduleWorkspaceState);document.addEventListener('change',scheduleWorkspaceState);new ResizeObserver(()=>requestAnimationFrame(measureWorkspace)).observe(document.body);
if(window.parent!==window)window.parent.postMessage({channel:'columbus-explorer',type:'ready'},location.origin);
