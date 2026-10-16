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
import {arrangeCanvas,scopedConnections,connectionGroups} from './canvas-layout.js';
import {validateView} from './saved-views.js';
import {semanticStyle,visibleEntities,overlaps,connectionRoute,packBubbleCloud,bubbleLabel,fullBubbleLabel,footprintsOverlap} from './semantic-map.js';
import {emptyResearch,validateResearch,researchConnections} from './research-paths.js';
import {mountResearchUI} from './research-ui.js';

const $ = id => document.getElementById(id);
const nodeById = new Map(nodes.map(n => [n.id, n]));
const edgeById = new Map(edges.map(e => [e.id, e]));
const sourceById = new Map(sources.map(s => [s.id, s]));
const degrees = new Map(nodes.map(n => [n.id, edges.filter(e => e.source === n.id || e.target === n.id).length]));
const edgePairs=new Map(),edgeBends=new Map();
edges.forEach(edge=>{const key=[edge.source,edge.target].sort().join('|');if(!edgePairs.has(key))edgePairs.set(key,[]);edgePairs.get(key).push(edge);});
edges.forEach((edge,index)=>{const parallel=edgePairs.get([edge.source,edge.target].sort().join('|'));edgeBends.set(edge.id,parallel.length>1?(parallel.indexOf(edge)-(parallel.length-1)/2)*90*(edge.source<edge.target?1:-1):(index%3-1)*12);});
const positions = new Map(nodes.map(n => [n.id, { x: n.x, y: n.y }]));
const nodeEls = new Map();
const edgeEls = new Map();
const markerEls = new Map();
const caseNodes = new Set(edges.filter(e => e.caseId).flatMap(e => [e.source, e.target]));
const svgNS = 'http://www.w3.org/2000/svg';
const timelineEvents=buildTimelineEvents(edges,sources);
const state = { view: 'network', caseId: 'all', categories: new Set(Object.keys(categories)), relationships: new Set(Object.keys(relationships)), history: true, query: '', selected: null, focus: false, path: null, labels: 'auto', timelineEntity:'jobsohio',timelineScope:'nearby',timelineMoney:'all',timelineUndated:true };
const distancePreferenceKey='columbus-network:reveal-distance-v2';
let preferredConnectionDistance=1;
try{preferredConnectionDistance=normalizeConnectionDistance(localStorage.getItem(distancePreferenceKey),1);}catch{}
Object.assign(state,{connectionMode:'all',from:'',to:'',includeUncertain:true,mapMode:'explore',exploreRoot:'',exploredIds:new Set(),explorationSeeds:new Set(),openNodes:new Set(),startingIds:new Set(),customStart:true,detailsOpen:false,connectionDistance:preferredConnectionDistance});
state.pinnedIds=new Set();state.pinnedEdgeIds=new Set();state.research=emptyResearch();
let researchUI=null,recordMenuOpen=false,semanticNodes=new Set(),semanticEdges=new Set(),legendSignature='',semanticStyles=new Map(),legendReflow=false;
let workspaceTimer=null,entityScale=1,entityTooltipId=null,cloudSceneIds=new Set(),cloudNeedsFit=false;
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
let startingSearchResults=[],indirectRoutes=[],comparison={direct:[],indirect:[],disconnected:[]},windowOrder=10;
const routeEls=new Map();
let previewTag='',tagPreviewOwner=null,tagStatsCache=new Map();
const connectionIcons=new Map(),panelAnimations=new Map();
let hoveredEdge=null;
const detailsPreferenceKey='columbus-network:details-layout';
let detailsLayout={docked:false,floatingWidth:420,dockedWidth:420};
try{const saved=JSON.parse(localStorage.getItem(detailsPreferenceKey));if(saved){detailsLayout.docked=saved.docked===true;for(const key of ['floatingWidth','dockedWidth'])if(Number.isFinite(saved[key]))detailsLayout[key]=saved[key];}}catch{}
let floatingDetailsPosition=null,mobileDetailsPosition=null,detailsResize=null,mobileDetailsWidth=null;
function focusEntityId(){return state.focus?(state.selected?.kind==='node'?state.selected.id:state.focusEntity||null):null;}
const explorationHistory=[];
function copyViewState(value){return {...value,research:structuredClone(value.research),pinnedEdgeIds:new Set(value.pinnedEdgeIds),pinnedIds:new Set(value.pinnedIds),tags:new Set(value.tags),categories:new Set(value.categories),relationships:new Set(value.relationships),startingIds:new Set(value.startingIds),exploredIds:new Set(value.exploredIds),explorationSeeds:new Set(value.explorationSeeds),openNodes:new Set(value.openNodes),selected:value.selected?{...value.selected}:null,path:value.path?{...value.path,nodes:[...value.path.nodes],edges:[...value.path.edges]}:null};}
function rememberView(){
  if(state.view!=='network'||restoringURL)return;
  explorationHistory.push({state:copyViewState(state),graph:{...graph,nodes:[...graph.nodes],edges:[...graph.edges]},positions:new Map([...positions].map(([id,p])=>[id,{...p}])),camera:{...camera},dimensions:{...dimensions},entityScale,overviewIds:[...cloudSceneIds]});
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
  const currentPositions=keepFrame?new Map(positions):null,currentCamera={...camera};Object.assign(state,copyViewState(previous.state));positions.clear();previous.positions.forEach((p,id)=>positions.set(id,{...(currentPositions?.get(id)||p)}));hoveredNode=null;hoveredEdge=null;edgeEls.forEach(({group})=>group.classList.remove('hovered'));connectionIcons.forEach(({group})=>group.classList.remove('hovered'));
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

const topicRoots={all:'city',money:'city',cityhall:'city',jobsohio:'jobsohio',media:'wsyx',politics:'vivek',sports:'hsg',datacenters:'google',alpr:'flock',hb6:'aep',epstein:'les',redflex:'redflex'};
function seedMap(preferred=state.exploreRoot){const seed=seedExploration(baseGraph(),preferred);state.exploreRoot=seed.root;state.explorationSeeds=new Set(seed.ids);state.openNodes=new Set();state.exploredIds=seed.ids;state.startingIds=new Set(seed.root?[seed.root]:[]);state.customStart=false;}
function currentResearch(){return researchConnections(state.research.steps,{nodes,edges});}
function syncResearchPins(){const path=currentResearch();state.pinnedIds=path.anchors;state.pinnedEdgeIds=path.pinnedEdges;}
function networkGraph(){
  const available=filterGraph(state),research=currentResearch();let result=available;
  const center=focusEntityId();
  if(state.path){const ids=new Set(state.path.nodes);result={...available,nodes:available.nodes.filter(node=>ids.has(node.id)),edges:available.edges.filter(edge=>state.path.edges.includes(edge.id))};}
  else if(center)result=scopedConnections(available,new Set([center]),state.connectionDistance);
  else if(state.tags.size)result=taggedGraph(available,state.tags);
  else if(state.mapMode!=='full'&&!state.query.trim()){
    state.exploredIds=branchExploration(available,state.explorationSeeds,state.openNodes);result=exploredGraph(available,state.exploredIds);
  }
  const ids=new Set([...result.nodes.map(node=>node.id),...research.nodeIds,...state.pinnedIds]);
  hiddenByDistance=available.nodes.length-result.nodes.length;
  return {...result,nodes:nodes.filter(node=>ids.has(node.id)),edges:[...new Map([...result.edges,...available.edges.filter(edge=>research.edgeIds.has(edge.id))].map(edge=>[edge.id,edge])).values()]};
}
function refreshMapScope(){state.selected=null;state.path=null;state.focus=false;hoveredNode=null;if(state.mapMode==='explore'&&!state.customStart)seedMap(topicRoots[state.caseId]||state.exploreRoot);applyCaseLayout();}
function toggleNode(id){
  if(!nodeById.has(id))return;
  if(state.selected?.kind==='node'&&state.selected.id===id&&state.focus){recordMenuOpen=true;state.detailsOpen=false;render(true);return;}
  settleExpansion();rememberView();rememberOpener();
  const startCamera={...camera},beforePositions=new Map([...positions].map(([key,p])=>[key,{...p}]));
  const anchor=semanticNodes.has(id)?{...positions.get(id)}:{x:(dimensions.width/2-camera.x)/camera.z,y:(dimensions.height/2-camera.y)/camera.z};
  state.tags=new Set();hideTagPreview();state.query='';$('search').value='';state.focus=true;state.focusEntity=id;state.path=null;
  state.mapMode='explore';state.customStart=true;state.connectionDistance=1;state.exploreRoot=id;state.explorationSeeds=new Set([id]);state.openNodes=new Set([id]);state.exploredIds=new Set([id]);state.startingIds=new Set([id]);state.selected={kind:'node',id};state.detailsOpen=false;recordMenuOpen=true;$('guided-search').value='';
  syncReportingControls();$('starting-results').hidden=true;if(state.view!=='network')setView('network');else render();
  const bounds=$('canvas-area').getBoundingClientRect();dimensions={width:bounds.width,height:bounds.height};const endCamera=fittedCamera(),targets=new Map(graph.nodes.map(node=>[node.id,{...positions.get(node.id)}]));
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){camera=endCamera;positionGraph();}
  else{const starts=new Map();targets.forEach((_,key)=>{const p=semanticNodes.has(key)?beforePositions.get(key)||anchor:anchor;starts.set(key,{...p});positions.set(key,{...p});});camera=startCamera;expansionAnimation={targets,starts,revealing:new Set(),anchor,startCamera,endCamera,sharedScale:false,start:null,frame:null};$('graph').setAttribute('aria-busy','true');positionGraph();expansionAnimation.frame=requestAnimationFrame(animateExpansion);}
}
function settleExpansion(finish=true){
  if(!expansionAnimation)return;
  const animation=expansionAnimation;cancelAnimationFrame(animation.frame);
  if(finish){animation.targets.forEach((point,id)=>positions.set(id,{...point}));camera={...animation.endCamera};}
  animation.revealing.forEach(id=>{nodeEls.get(id).group.classList.remove('revealing');nodeEls.get(id).core.setAttribute('tabindex','0');});
  if(animation.undoSnapshot){nodeEls.forEach(({group})=>{group.style.opacity='';group.style.pointerEvents='';});edgeEls.forEach(({group})=>group.style.opacity='');connectionIcons.forEach(({group})=>group.style.opacity='');delete $('graph').dataset.undoMotion;$('undo-map').removeAttribute('aria-busy');}
  expansionAnimation=null;
  $('graph').removeAttribute('aria-busy');$('graph').classList.remove('animating');if(animation.undoSnapshot)applyUndoSnapshot(animation.undoSnapshot,!finish);else {positionGraph();repairFocusedPlacement();}
}
function animateExpansion(time){
  const animation=expansionAnimation;if(!animation)return;
  animation.start??=time;const progress=Math.min(1,(time-animation.start)/800),eased=progress*progress*(3-2*progress);
  animation.targets.forEach((target,id)=>{
    const start=animation.starts.get(id);positions.set(id,{x:start.x+(target.x-start.x)*eased,y:start.y+(target.y-start.y)*eased});
  });
  if(animation.undoSnapshot){
    for(const [ids,amount]of [[animation.outgoing,1-eased],[animation.incoming,eased]])ids.forEach(id=>{const group=nodeEls.get(id).group;group.style.opacity=amount*(group.classList.contains('context-node')?.5:1);});
    for(const [ids,amount]of [[animation.outgoingEdges,1-eased],[animation.incomingEdges,eased]])ids.forEach(id=>{const group=edgeEls.get(id).group;group.style.opacity=amount*(group.classList.contains('context-link')?.5:1);});
    connectionIcons.forEach(({group,peerIds})=>{if(peerIds.length&&peerIds.every(id=>animation.outgoingEdges.has(id)))group.style.opacity=1-eased;else if(peerIds.length&&peerIds.every(id=>animation.incomingEdges.has(id)))group.style.opacity=eased;});
  }
  camera=transitionCamera(animation.startCamera,animation.endCamera,animation.anchor,eased);
  animation.pinnedScreens?.forEach((point,id)=>positions.set(id,{x:(point.x-camera.x)/camera.z,y:(point.y-camera.y)/camera.z}));
  positionGraph();
  if(progress>=1)settleExpansion();else animation.frame=requestAnimationFrame(animateExpansion);
}
function expansionAnchor(){if(focusEntityId())return focusEntityId();return state.selected?.kind==='node'&&graph.nodes.some(n=>n.id===state.selected.id)?state.selected.id:state.exploreRoot;}
function branchAction(id){const count=baseGraph().edges.filter(edge=>edge.source===id||edge.target===id).length;return {opened:false,count,disabled:!count,label:'Explore '+count+' connections'};}
function togglePin(id){settleExpansion();researchUI.toggle('entity',id);}
function renderPins(){
  const tray=$('pinned-anchors');tray.hidden=!state.pinnedIds.size;
  tray.innerHTML=state.pinnedIds.size?'<span class="anchor-label">Pinned anchors</span>'+[...state.pinnedIds].map(id=>'<span class="anchor-chip"><button data-anchor-focus="'+id+'" title="Explore this anchor">'+escape(nodeById.get(id)?.name||id)+'</button><button data-toggle-pin="'+id+'" aria-label="Unpin '+escape(nodeById.get(id)?.name||id)+'">×</button></span>').join(''):'';
}
function renderConnectionLegend(){
  const signature=[...semanticEdges].join(',')+'|'+[...state.relationships].join(',')+'|'+state.connectionMode+'|'+focusEntityId();if(signature===legendSignature)return;legendSignature=signature;
  const unfiltered=filterGraph({...state,query:'',relationships:new Set(Object.keys(relationships)),connectionMode:'all'}),center=focusEntityId(),shown=new Set(graph.nodes.map(node=>node.id));
  const relevant=unfiltered.edges.filter(edge=>center?edge.source===center||edge.target===center:shown.has(edge.source)||shown.has(edge.target));
  const modeTypes=connectionModesForLegend();
  $('legend-types').innerHTML=connectionGroups.flatMap(group=>group.types).map(id=>{const count=graph.edges.filter(edge=>semanticEdges.has(edge.id)&&edge.type===id).length,available=relevant.filter(edge=>edge.type===id).length,enabled=state.relationships.has(id)&&(!modeTypes||modeTypes.includes(id));if(!count&&(enabled||!available))return '';return '<li data-legend-type="'+id+'" class="'+(!enabled?'legend-filtered':'')+'"><span class="legend-line" style="--color:'+relationships[id].color+'" aria-hidden="true"></span><span class="legend-type-label">'+escape(relationships[id].label)+'</span><small>'+(!enabled?available+' hidden':count)+'</small>'+(!enabled?'<button class="legend-show" data-show-type="'+id+'" aria-label="Show '+escape(relationships[id].label)+'">Show</button>':'')+'</li>';}).join('');
}
function connectionModesForLegend(){return {ownership:['ownership','voting'],governance:['board','control'],leadership:['leadership'],money:['money','funding','contract','influence'],content:['content','affiliation','editorial']}[state.connectionMode]||null;}
function renderConnectionKey(){const displayed=graph.edges.filter(edge=>semanticEdges.has(edge.id));$('legend-key').textContent=displayed.length?[displayed.some(edge=>edge.directional)?'Arrow = direction':'',displayed.some(edge=>edge.historical)?'Dashed = past':''].filter(Boolean).join(' · '):'Connections appear as you explore.';}
function renderMapScope(){
  const available=baseGraph(),isSmall=state.mapMode==='explore'&&!state.query.trim(),anchor=expansionAnchor();
  $('map-scope').hidden=!!state.tags.size||!nodeById.has(anchor);$('map-scope').textContent=nodeById.has(anchor)?nodeById.get(anchor).name+' · Details':'';
  $('map-scope').setAttribute('aria-expanded',String(!$('inspector').hidden));
  $('map-full').hidden=!isSmall||graph.nodes.length===available.nodes.length;
  $('map-full').textContent=state.caseId==='all'?'Show whole network':'Show whole topic';
  $('map-small').hidden=false;
  const center=focusEntityId(),focused=!!center;document.querySelector('.distance-control').hidden=state.view!=='network'||!focused;
  $('distance-summary').textContent=focused?(state.connectionDistance==='all'?'All connected entities':'Connections up to '+state.connectionDistance+' step'+(state.connectionDistance===1?'':'s'))+' from '+nodeById.get(center).name+(state.pinnedIds.size?'. Pinned research stays alongside.':'.'):'Choose an entity, then adjust the distance to reveal its neighborhood. Pins stay visible.';
  $('legend-context').textContent=semanticEdges.size?'Only connections between visible entities are drawn.':'Overview: choose an entity to explore its connections.';
  $('connection-legend').querySelector('h2').textContent='Connection types';
  $('fit').title=focused?'Fit direct connections':'Fit all visible nodes';$('fit').setAttribute('aria-label',focused?'Fit direct connections':'Fit the network');
  renderConnectionLegend();renderPins();syncFilterGroups();
  renderConnectionKey();
  $('indirect-key').hidden=!indirectRoutes.length;
  const chosen=[...state.startingIds].filter(id=>nodeById.has(id)).map(id=>nodeById.get(id).name);
  $('starting-summary').textContent=chosen.length?'Starting with '+chosen.join(' + ')+(indirectRoutes.length?' · '+indirectRoutes.length+' indirect path'+(indirectRoutes.length===1?'':'s')+' to explore':'')+(comparison.disconnected.length?' · '+comparison.disconnected.length+' pair'+(comparison.disconnected.length===1?'':'s')+' with no route in these filters':''):'';
  const mobileDetails=!$('inspector').hidden&&!detailsLayout.docked&&matchMedia('(max-width:720px)').matches;
  if(!$('connection-legend').style.top)$('connection-legend').style.bottom=mobileDetails?($('inspector').offsetLeft+$('inspector').offsetWidth>$('canvas-area').clientWidth-135?$('inspector').offsetHeight+24+'px':'78px'):focused&&matchMedia('(max-width:720px)').matches?Math.max(128,$('map-status').offsetHeight+24)+'px':'';
  if(mobileDetails)document.querySelector('.secondary-actions>div').append($('map-small'));else document.querySelector('#map-status .map-exploration-controls').prepend($('map-small'));
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
  if(!route)return;
  settleExpansion(false);rememberView();const shown=new Set(graph.nodes.map(node=>node.id)),startCamera={...camera},beforePositions=new Map([...positions].map(([id,point])=>[id,{...point}])),newPositions=revealedPathPositions(route,positions,shown),revealing=new Set(newPositions.keys());
  if(startingIds){state.startingIds=new Set(startingIds);state.customStart=true;}
  newPositions.forEach((point,id)=>positions.set(id,point));const anchor={...positions.get(route.nodes[0])};
  route.nodes.forEach(id=>state.explorationSeeds.add(id));
  state.query='';$('search').value='';state.selected=null;state.focus=false;state.path=route;state.tags=new Set();hideTagPreview();render();
  const bounds=$('canvas-area').getBoundingClientRect();dimensions={width:bounds.width,height:bounds.height};const endCamera=fittedCamera(),targets=new Map([...new Set([...route.nodes,...state.pinnedIds])].filter(id=>positions.has(id)).map(id=>[id,{...positions.get(id)}]));
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){camera=endCamera;positionGraph();}
  else{const starts=new Map();targets.forEach((_,id)=>{const point=revealing.has(id)?anchor:beforePositions.get(id)||anchor;starts.set(id,{...point});positions.set(id,{...point});if(revealing.has(id))nodeEls.get(id).group.classList.add('revealing');});camera=startCamera;expansionAnimation={targets,starts,revealing,anchor,startCamera,endCamera,sharedScale:false,start:null,frame:null};$('graph').setAttribute('aria-busy','true');positionGraph();expansionAnimation.frame=requestAnimationFrame(animateExpansion);}
  toast(route.edges.length+' recorded links revealed');
}

function renderEntitySearch(){
  hideTagPreview();
  const query=$('search').value.trim();startingSearchResults=explorerSearch(baseGraph(),query,state.tags);
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
  settleExpansion();rememberView();resetFilters(false);state.caseId='all';$('topic-select').value='all';$('graph-title').textContent='Columbus network';state.startingIds=new Set();state.explorationSeeds=new Set();state.exploredIds=new Set();state.openNodes=new Set();state.customStart=true;
  state.mapMode='explore';state.selected=null;state.path=null;state.focus=false;state.query='';$('search').value='';
  closeFloatingPanel('filters');closeFloatingPanel('path-dialog');setView('network');renderEntitySearch();$('search').focus({preventScroll:true});
}
function addStartingEntity(id){toggleNode(id);}

const panelLaunchers={filters:'mobile-filters','path-dialog':'path-open','connection-legend':'legend-open','guided-panel':'guided-open','research-panel':'research-open'};
function floatingPanelOpen(id){return !$(id).hidden&&$(id).dataset.motion!=='closing';}
function animateFloatingPanel(id,opening){
  const panel=$(id),launcher=$(panelLaunchers[id]),previous=panelAnimations.get(id);
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
  const animation=panel.animate(frames,{duration:opening?380:320,easing:'cubic-bezier(.22,.7,.2,1)',fill:'both'});panelAnimations.set(id,animation);
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
    [ $('search-window'),document.querySelector('.exploration-tools'),$('filters'),$('connection-legend'),$('map-status'),$('active-filters'),$('path-dialog') ].forEach(element=>$('canvas-area').append(element));stage.append($('inspector'));
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

function applyCaseLayout() {
  settleExpansion();
  nodes.forEach(n => positions.set(n.id, {x:n.x, y:n.y}));
  const small=networkGraph().nodes;
  if(state.customStart&&state.mapMode==='explore'&&!state.query&&small.length<=8&&!state.openNodes.size){
    const narrow=matchMedia('(max-width:720px)').matches;
    if(state.path){
      state.path.nodes.forEach((id,index)=>positions.set(id,{x:narrow?0:(index-(state.path.nodes.length-1)/2)*240,y:narrow?(index-(state.path.nodes.length-1)/2)*220:0}));
      small.filter(node=>!state.path.nodes.includes(node.id)).forEach((node,index)=>positions.set(node.id,{x:narrow?(index%2?-1:1)*220:index*240,y:narrow?Math.floor(index/2)*180:200}));
    }else if(small.length<=2)small.forEach((node,index)=>positions.set(node.id,{x:narrow?0:(index-(small.length-1)/2)*300,y:narrow?(index-(small.length-1)/2)*220:0}));
    else small.forEach((node,index)=>{const angle=-Math.PI/2+index*2*Math.PI/small.length;positions.set(node.id,{x:Math.cos(angle)*(narrow?150:260),y:Math.sin(angle)*(narrow?240:190)});});
    return;
  }
  if (state.caseId === 'all') { compactConnectedLayout(); return; }
  const placed = new Set();
  for (const [id, record] of Object.entries(cases)) {
    if (state.caseId !== 'money' && state.caseId !== id) continue;
    const offset = state.caseId==='money' ? ({hb6:[0,0],epstein:[1750,-350],redflex:[1750,450],cityhall:[0,1800]}[id]||[0,0]) : [0,0];
    for (const [nodeId, [x, y]] of Object.entries(record.positions)) {
      if(state.caseId==='money'&&placed.has(nodeId))continue;
      positions.set(nodeId,{x:x+offset[0],y:y+offset[1]});placed.add(nodeId);
    }
  }
  if(['money','cityhall','sports','datacenters','alpr','politics','jobsohio','media'].includes(state.caseId)) compactConnectedLayout();
}
function compactConnectedLayout() {
  const active=networkGraph();
  const points=active.nodes.map((n,i)=>({id:n.id,x:Math.cos(i*2.399963)*Math.sqrt(i+1)*48,y:Math.sin(i*2.399963)*Math.sqrt(i+1)*38}));
  const byId=new Map(points.map(p=>[p.id,p]));
  const springs=new Map();
  for(const e of active.edges){const key=[e.source,e.target].sort().join('|');if(!springs.has(key))springs.set(key,e);}
  for(let step=0;step<180;step++){
    const force=new Map(points.map(p=>[p.id,{x:-p.x*.02,y:-p.y*.02}]));
    for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
      const a=points[i],b=points[j],dx=a.x-b.x,dy=a.y-b.y,d=Math.max(1,Math.hypot(dx,dy)),f=9200/d;
      const fa=force.get(a.id),fb=force.get(b.id);fa.x+=dx/d*f;fa.y+=dy/d*f;fb.x-=dx/d*f;fb.y-=dy/d*f;
    }
    for(const e of springs.values()){
      const a=byId.get(e.source),b=byId.get(e.target),dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy)),f=d*d/120;
      const fa=force.get(a.id),fb=force.get(b.id);fa.x+=dx/d*f;fa.y+=dy/d*f;fb.x-=dx/d*f;fb.y-=dy/d*f;
    }
    const temperature=18*(1-step/180)+1;
    for(const p of points){const f=force.get(p.id),d=Math.max(1,Math.hypot(f.x,f.y));p.x+=f.x/d*Math.min(d,temperature);p.y+=f.y/d*Math.min(d,temperature);}
  }
  const narrow=matchMedia('(max-width:720px)').matches;
  for(const p of points)positions.set(p.id,{x:p.x*(narrow?.8:1.7),y:p.y*(narrow?2:.75)});
}
function setCase(id) {
  startingSearchResults=[];$('starting-results').hidden=true;
  state.customStart=false;
  if(id==='media'&&state.caseId!=='media'){state.timelineScope='case';state.timelineEntity='wsyx';}
  state.caseId = id; state.mapMode='explore';state.exploredIds=new Set();state.exploreRoot=topicRoots[id]||'city'; state.query = ''; $('search').value = ''; state.selected = null; state.path = null; state.focus = false;
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
  state.selected=null;state.path=null;state.focus=false;refreshMapScope();render(true);
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
  const tooltip=$('entity-tooltip');if(!entityTooltipId||!semanticNodes.has(entityTooltipId)||state.view!=='network'){tooltip.hidden=true;return;}
  tooltip.hidden=false;const surface=$('canvas-area').getBoundingClientRect(),core=nodeEls.get(entityTooltipId).core.getBoundingClientRect();
  const x=event?.clientX!==undefined?event.clientX-surface.left:(core.left+core.right)/2-surface.left,y=event?.clientY!==undefined?event.clientY-surface.top:core.top-surface.top;
  tooltip.style.left=Math.max(8,Math.min(dimensions.width-tooltip.offsetWidth-8,x-tooltip.offsetWidth/2))+'px';
  const above=y-tooltip.offsetHeight-12;tooltip.style.top=Math.max(8,Math.min(dimensions.height-tooltip.offsetHeight-8,above>=8?above:core.bottom-surface.top+12))+'px';
}
function raisePathForeground(){
  if(!state.path)return;
  for(const id of state.path.edges){const edge=edgeEls.get(id);if(edge&&edge.group.style.display!=='none')$('edge-layer').append(edge.group);const icon=connectionIcons.get(id);if(icon&&icon.group.style.display!=='none')$('connection-icon-layer').append(icon.group);}
  for(const id of state.path.nodes){const node=nodeEls.get(id);if(node&&node.group.style.display!=='none')$('node-layer').append(node.group);}
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
    group.addEventListener('pointerenter',event=>{hoveredNode=n.id;renderGraph();showEntityTooltip(n.id,event);});
    group.addEventListener('pointermove',positionEntityTooltip);
    group.addEventListener('pointerleave',()=>{if(group.contains(document.activeElement)){positionEntityTooltip();return;}hoveredNode=null;hideEntityTooltip();renderGraph();});
    group.addEventListener('focusin',()=>{hoveredNode=n.id;renderGraph();showEntityTooltip(n.id);});
    group.addEventListener('focusout',event=>{if(group.contains(event.relatedTarget)||group.matches(':hover'))return;hoveredNode=null;hideEntityTooltip();renderGraph();});
  });
  $('graph').addEventListener('click', event => {
    if (suppressClick) { suppressClick = false; return; }
    const pin=event.target.closest('[data-pin]');if(pin){togglePin(pin.dataset.pin);return;}
    const target = event.target.closest('[data-node],[data-edge],[data-route]');
    if(target?.dataset.route!==undefined)showExplorationPath(indirectRoutes[Number(target.dataset.route)]);
    else if (target?.dataset.node) toggleNode(target.dataset.node);
    else if (target?.dataset.edge) selectEdge(target.dataset.edge);
    else if (!target) {recordMenuOpen=false;positionGraph();}
  });
  $('graph').addEventListener('keydown', event => {
    const pin=event.target.closest('[data-pin]');if(pin&&(event.key==='Enter'||event.key===' ')){event.preventDefault();if(!event.repeat)togglePin(pin.dataset.pin);return;}
    const target = event.target.closest('[data-node],[data-edge],[data-route]');
    if ((event.key === 'Enter' || event.key === ' ') && target) { event.preventDefault(); if(!event.repeat){if(target.dataset.route!==undefined)showExplorationPath(indirectRoutes[Number(target.dataset.route)]);else target.dataset.node ? toggleNode(target.dataset.node) : selectEdge(target.dataset.edge);} }
    if (event.target === $('graph')) {
      const moves = { ArrowLeft: [35, 0], ArrowRight: [-35, 0], ArrowUp: [0, 35], ArrowDown: [0, -35] };
      if (moves[event.key]) { event.preventDefault();settleExpansion(false);camera.x += moves[event.key][0]; camera.y += moves[event.key][1]; positionGraph(); }
      if (event.key === '+' || event.key === '=') { event.preventDefault(); zoom(1.25); }
      if (event.key === '-') { event.preventDefault(); zoom(.8); }
      if (event.key === '0') { event.preventDefault(); fitGraph(); }
    }
  });
  $('graph').addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    if(event.target.closest('[data-pin]'))return;
    const target = event.target.closest('[data-node],[data-edge],[data-route]');
    drag = { route:target?.dataset.route,id: target?.dataset.node, edge: target?.dataset.edge, pointer: event.pointerId, startX: event.clientX, startY: event.clientY, lastX: event.clientX, lastY: event.clientY, moved: false };
    $('graph').setPointerCapture(event.pointerId);
  });
  $('graph').addEventListener('pointermove', event => {
    if (!drag || drag.pointer !== event.pointerId) return;
    const dx = event.clientX - drag.lastX, dy = event.clientY - drag.lastY;
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 4) drag.moved = true;
    if (drag.moved) {
      if(!drag.stoppedAnimation){settleExpansion(false);drag.stoppedAnimation=true;}
      if (drag.id) { const p = positions.get(drag.id); p.x += dx / camera.z; p.y += dy / camera.z; }
      else { camera.x += dx; camera.y += dy; }
      positionGraph();
    }
    drag.lastX = event.clientX; drag.lastY = event.clientY;
  });
  $('graph').addEventListener('pointerup', event => {
    if (!drag) return;
    if (drag.moved) suppressClick = true;
    // Pointer capture retargets the click to the canvas; activate a stationary node here.
    else if(drag.route!==undefined){showExplorationPath(indirectRoutes[Number(drag.route)]);suppressClick=true;}
    else if (drag.id) { toggleNode(drag.id); suppressClick = true; }
    else if (drag.edge) { selectEdge(drag.edge); suppressClick = true; }
    drag = null;
    if ($('graph').hasPointerCapture(event.pointerId)) $('graph').releasePointerCapture(event.pointerId);
  });
  $('graph').addEventListener('pointercancel', () => { drag = null; suppressClick = false; });
  $('graph').addEventListener('wheel', event => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault(); const rect = $('graph').getBoundingClientRect();
    zoom(Math.exp(-event.deltaY * .0015), event.clientX - rect.left, event.clientY - rect.top);
  }, { passive: false });
  new ResizeObserver(entries => {
    const rect = entries[0].contentRect;
    if (!rect.width || !rect.height) return;
    if(rect.width<1||rect.height<1||Math.abs(rect.width-dimensions.width)<1&&Math.abs(rect.height-dimensions.height)<1)return;
    settleExpansion();dimensions = { width: rect.width, height: rect.height };
    $('graph-stage').dataset.compact=String(rect.width<650);$('graph-stage').dataset.tiny=String(rect.width<350);updateTagWindowSpace();camera=fittedCamera(camera.z);positionGraph();repairFocusedPlacement();if(graph)renderMapScope();positionInspector();
  }).observe($('canvas-area'));
}

function mapObstacles(){const surface=$('canvas-area').getBoundingClientRect();return [...$('graph-stage').querySelectorAll('#search-window,.exploration-tools,.floating-panel:not([hidden]),#inspector:not([hidden]),#map-status,.graph-controls,#active-filters:not([hidden])')].filter(panel=>panel.getClientRects().length&&panel.dataset.motion!=='closing').map(panel=>{const r=panel.getBoundingClientRect();return {left:r.left-surface.left-7,top:r.top-surface.top-7,right:r.right-surface.left+7,bottom:r.bottom-surface.top+7};});}
const bubbleTextMeasure=document.createElement('canvas').getContext('2d');
const fullNameLayouts=new Map(),cloudView=()=>!focusEntityId()&&!state.path;
function nodePresentation(id,zoom){
  const protectedNode=state.pinnedIds.has(id)||state.selected?.kind==='node'&&state.selected.id===id||state.path?.nodes.includes(id);
  const style=semanticStyle(degrees.get(id),zoom,{protectedNode,small:graph.nodes.length<=10,cloud:cloudView()});
  if(style.cloud){
    const font=Math.ceil(Math.max(12,style.font)*2)/2,key=id+'|'+font+'|'+Number(!!protectedNode);
    if(!fullNameLayouts.has(key)){bubbleTextMeasure.font=(protectedNode?'750 ':'600 ')+font+'px '+getComputedStyle(document.documentElement).getPropertyValue('--sans');fullNameLayouts.set(key,fullBubbleLabel(nodeById.get(id).name,font,text=>bubbleTextMeasure.measureText(text).width));}
    const full=fullNameLayouts.get(key),base=semanticStyle(degrees.get(id),.72,{protectedNode,cloud:true}).radius;
    style.radius=Math.max(style.radius,base+(full.radius-base)*style.readability);style.fullLines=full.lines;
    style.font=style.fullName?font:Math.min(style.font,Math.max(8,style.radius*.27));
  }else if(dimensions.width<650&&style.detail>.5)style.font=Math.min(16,style.font);
  return style;
}
function styleNode(id,zoom){
  const entry=nodeEls.get(id),protectedNode=state.pinnedIds.has(id)||state.selected?.kind==='node'&&state.selected.id===id||state.path?.nodes.includes(id);
  const style=nodePresentation(id,zoom);
  if(style.bubble&&!style.cloud)style.font=Math.min(style.font,Math.max(8,style.radius*.27));
  entry.group.dataset.bubble=String(style.bubble);
  const labelKey=style.bubble?'bubble:'+Math.round(style.radius)+':'+Math.round(style.font*2)+':'+style.fullName:'detail';
  if(entry.labelKey!==labelKey){bubbleTextMeasure.font='600 '+style.font+'px '+getComputedStyle(document.documentElement).getPropertyValue('--sans');const lines=style.fullName?style.fullLines:style.bubble?(style.radius<19?[initials(nodeById.get(id))]:bubbleLabel(nodeById.get(id).name,style.radius,style.font,text=>bubbleTextMeasure.measureText(text).width)):entry.normalLines;entry.label.replaceChildren(...lines.map(line=>{const span=svgEl('tspan',{x:0});span.textContent=line;return span;}));entry.labelKey=labelKey;}
  entry.label.style.fontSize=style.font+'px';entry.label.style.fontWeight=protectedNode?'750':'600';entry.label.querySelectorAll('tspan').forEach((span,index)=>span.setAttribute('dy',index?String(style.font*1.12):'0'));
  const count=entry.label.children.length,y=style.bubble?-((count-1)*style.font*1.12)/2+style.font*.32:style.radius+style.font+7;
  entry.label.setAttribute('transform','translate(0 '+y/zoom+') scale('+1/zoom+')');
  entry.core.style.opacity='1';entry.halo.style.opacity=String(style.bubble?.12:style.detail);
  entry.core.setAttribute('r',style.radius/zoom);entry.halo.setAttribute('r',(style.radius+3)/zoom);entry.hit.setAttribute('r',(style.bubble?style.radius+2:Math.max(22,style.radius+4))/zoom);entry.letter.style.opacity=style.bubble?'0':String(style.detail);entry.letter.setAttribute('transform','scale('+1/zoom+')');entry.pin.style.display='none';
  return style;
}
function fittedCamera(zoomOverride=null,retain=false,relocate=false,zoomAnchor='') {
  if (!graph?.nodes.length) return {...camera};
  const endZoom=zoomOverride??(focusEntityId()||state.path?1.4:.72),current=new Map([...positions].map(([id,p])=>[id,{x:camera.x+p.x*camera.z,y:camera.y+p.y*camera.z}])),measurements=new Map();
  for(const node of graph.nodes){const entry=nodeEls.get(node.id);entry.group.style.display='';const style=styleNode(node.id,endZoom),label=entry.label.getBBox(),baseline=entry.label.transform.baseVal.consolidate().matrix.f*endZoom;measurements.set(node.id,{left:Math.min(-style.radius-8,label.x),right:Math.max(style.radius+8,label.x+label.width),top:Math.min(-style.radius-8,label.y+baseline),bottom:Math.max(style.radius+8,label.y+label.height+baseline)});}
  if(recordMenuOpen&&state.selected?.kind==='node'&&dimensions.width<650){const box=measurements.get(state.selected.id);if(box&&box.right-box.left+148<dimensions.width-24)box.right+=148;}
  const bubble=cloudView()||semanticStyle(0,endZoom).bubble,center=focusEntityId();
  const arranged=bubble?packBubbleCloud(graph.nodes.map(node=>({id:node.id,degree:degrees.get(node.id),radius:nodePresentation(node.id,endZoom).radius,priority:node.id===center?1e9:state.pinnedIds.has(node.id)?9e8:node.id===zoomAnchor?8e8:state.path?.nodes.includes(node.id)?7e8:retain&&semanticNodes.has(node.id)?1e5:0})),{...dimensions,obstacles:mapObstacles(),current,retained:retain?semanticNodes:new Set(),limit:Math.floor(14+Math.max(0,endZoom-.72)*30)})
    :arrangeCanvas(graph,{...dimensions,obstacles:mapObstacles(),current:relocate?new Map():current,pins:state.pinnedIds,center:focusEntityId()||state.exploreRoot,degrees,measurements,retained:retain?semanticNodes:new Set(),flow:!!state.path&&dimensions.width<650});
  if(cloudView()){cloudSceneIds=arranged.visible;cloudNeedsFit=false;}
  arranged.positions.forEach((point,id)=>positions.set(id,{x:point.x/endZoom,y:point.y/endZoom}));entityScale=1;
  return {x:0,y:0,z:endZoom};
}

function repairFocusedPlacement(){const bounds=$('canvas-area').getBoundingClientRect();if(bounds.width<1||bounds.height<1)return;const center=focusEntityId(),wanted=state.path?state.path.nodes:center?[center]:[];if(wanted.some(id=>!semanticNodes.has(id))&&!drag){camera=fittedCamera(camera.z,false,!!state.path);positionGraph();}}
function fitGraph() {
  settleExpansion();camera=fittedCamera();positionGraph();repairFocusedPlacement();
}
function zoom(factor,x=dimensions.width/2,y=dimensions.height/2){
  settleExpansion(false);recordMenuOpen=false;const startCamera={...camera},before=new Map([...positions].map(([id,p])=>[id,{...p}])),z=Math.min(3.5,Math.max(.3,camera.z*factor)),ratio=z/camera.z;
  const zoomAnchor=[...semanticNodes].sort((a,b)=>{const distance=id=>{const p=positions.get(id);return Math.hypot(camera.x+p.x*camera.z-x,camera.y+p.y*camera.z-y);};return distance(a)-distance(b);})[0]||'';
  camera={x:x-(x-camera.x)*ratio,y:y-(y-camera.y)*ratio,z};const endCamera=fittedCamera(z,true,false,zoomAnchor),targets=new Map(graph.nodes.map(node=>[node.id,{...positions.get(node.id)}]));
  const anchor={x:(x-startCamera.x)/startCamera.z,y:(y-startCamera.y)/startCamera.z};
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){camera=endCamera;positionGraph();scheduleWorkspaceState();return;}
  const starts=new Map();targets.forEach((_,id)=>{const p=before.get(id)||anchor;starts.set(id,{...p});positions.set(id,{...p});});camera=startCamera;expansionAnimation={targets,starts,revealing:new Set(),anchor,startCamera,endCamera,sharedScale:false,start:null,frame:null};$('graph').setAttribute('aria-busy','true');positionGraph();expansionAnimation.frame=requestAnimationFrame(animateExpansion);scheduleWorkspaceState();
}
function positionGraph() {
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
    hit.setAttribute('r',Math.max(22,radius+4)/z);
    halo.setAttribute('r', (radius + 5) / z); core.setAttribute('r', radius / z); core.style.strokeWidth = `${1.6 / z}px`;
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

function placeLabels() {
  if(state.view!=='network'||!graph)return;
  const surface=$('canvas-area').getBoundingClientRect(),center=focusEntityId(),route=currentResearch(),candidates=[];
  const nearby=graph.nodes.filter(node=>node.id!==center).sort((a,b)=>(degrees.get(b.id)||0)-(degrees.get(a.id)||0)).slice(0,center?5:6).map(node=>node.id);
  const cloud=cloudView(),bubble=cloud||semanticStyle(0,camera.z).bubble,maxOrdinary=center?Math.floor(5+Math.max(0,camera.z-1.4)*16):Math.floor(14+Math.max(0,camera.z-.72)*30);
  for(const node of graph.nodes){
    const entry=nodeEls.get(node.id),style=styleNode(node.id,camera.z);semanticStyles.set(node.id,style);entry.label.style.display='';entry.letter.style.display='';
    const label=entry.label.getBoundingClientRect(),core=entry.core.getBoundingClientRect(),protectedNode=state.pinnedIds.has(node.id)||node.id===center||state.path?.nodes.includes(node.id);
    const boxes=[label,core];
    const box={left:Math.min(...boxes.map(r=>r.left))-surface.left-4,right:Math.max(...boxes.map(r=>r.right))-surface.left+4,top:Math.min(...boxes.map(r=>r.top))-surface.top-4,bottom:Math.max(...boxes.map(r=>r.bottom))-surface.top+4};
    const circle=bubble?{x:(core.left+core.right)/2-surface.left,y:(core.top+core.bottom)/2-surface.top,r:core.width/2+2}:null;
    candidates.push({id:node.id,box:bubble?{left:circle.x-circle.r,right:circle.x+circle.r,top:circle.y-circle.r,bottom:circle.y+circle.r}:box,circle,degree:degrees.get(node.id),opacity:cloud&&cloudSceneIds.size&&!cloudSceneIds.has(node.id)?0:protectedNode||nearby.includes(node.id)||bubble?1:style.opacity,priority:node.id===center?1e6:state.pinnedIds.has(node.id)?9e5:state.path?.nodes.includes(node.id)?8e5:nearby.includes(node.id)?1e4:0,protectedNode});
  }
  const ranked=[...candidates].sort((a,b)=>b.priority-a.priority||b.degree-a.degree||a.id.localeCompare(b.id));let count=0;
  for(const item of ranked)if(!cloud&&!item.protectedNode&&++count>maxOrdinary&&(!bubble||item.degree>4))item.opacity=0;
  const obstacles=mapObstacles(),gap=bubble?3:6;let visible=visibleEntities(ranked,{...dimensions,gap,obstacles});
  positionRecordMenu(visible.items,obstacles);
  if(!$('entity-popover').hidden){const r=$('entity-popover').getBoundingClientRect();visible=visibleEntities(ranked,{...dimensions,gap,obstacles:[...obstacles,{left:r.left-surface.left,top:r.top-surface.top,right:r.right-surface.left,bottom:r.bottom-surface.top}]});}
  semanticNodes=visible.ids;
  for(const [id,entry]of nodeEls){const item=visible.items.find(item=>item.id===id),shown=!!item;entry.group.style.display=shown?'':'none';entry.group.style.opacity=String(item?.opacity||0);entry.group.setAttribute('aria-hidden',String(!shown));entry.core.setAttribute('tabindex',shown?'0':'-1');entry.group.dataset.semanticHidden=shown?'false':'true';}
  semanticEdges=new Set();
  for(const edge of graph.edges){const shown=semanticNodes.has(edge.source)&&semanticNodes.has(edge.target)&&(edge.source===center||edge.target===center||state.path?.edges.includes(edge.id)||route.edgeIds.has(edge.id)||state.selected?.kind==='edge'&&state.selected.id===edge.id);if(shown)semanticEdges.add(edge.id);}
  const occupied=visible.items.map(item=>item.box);
  for(const [id,entry]of edgeEls){const shown=semanticEdges.has(id);entry.group.style.display=shown?'':'none';entry.group.style.opacity='1';entry.hit.setAttribute('tabindex',shown?'0':'-1');entry.hit.setAttribute('aria-hidden',String(!shown));entry.label.style.display='none';
    if(shown){
      const edge=edgeById.get(id),a=positions.get(edge.source),b=positions.get(edge.target),dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy)||1,z=camera.z;
      const from=semanticStyles.get(edge.source).radius+3,to=semanticStyles.get(edge.target).radius+5;
      const start={x:camera.x+a.x*z+dx/length*from,y:camera.y+a.y*z+dy/length*from},end={x:camera.x+b.x*z-dx/length*to,y:camera.y+b.y*z-dy/length*to};
      const routed=connectionRoute(start,end,{...dimensions,bend:edgeBends.get(id)*z,obstacles:[...obstacles,...visible.items.filter(item=>item.id!==edge.source&&item.id!==edge.target).map(item=>item.box)]});
      const world=p=>({x:(p.x-camera.x)/z,y:(p.y-camera.y)/z}),p=world(start),q=world(routed.control),r=world(end),mid=world(routed.midpoint),path='M'+p.x+','+p.y+' Q'+q.x+','+q.y+' '+r.x+','+r.y;
      entry.line.setAttribute('d',path);entry.hit.setAttribute('d',path);entry.midpoint=mid;entry.iconPoint=mid;entry.group.dataset.routeClear=String(!routed.collisions&&!routed.outside);connectionIcons.get(id).group.setAttribute('transform','translate('+mid.x+' '+mid.y+') scale('+1/z+')');
    }
    const icon=connectionIcons.get(id).group,active=shown&&(hoveredEdge===id||state.selected?.kind==='edge'&&state.selected.id===id);icon.style.display=active?'':'none';icon.setAttribute('tabindex',active?'0':'-1');
    if(active){const r=icon.getBoundingClientRect(),box={left:r.left-surface.left,top:r.top-surface.top,right:r.right-surface.left,bottom:r.bottom-surface.top};if([...occupied,...obstacles].some(other=>overlaps(box,other,6)))icon.style.display='none';else occupied.push(box);}
  }
  routeEls.forEach(({line,hit,label,route})=>{const shown=semanticNodes.has(route.from)&&semanticNodes.has(route.to);line.parentElement.style.display=shown?'':'none';label.style.display='none';hit.setAttribute('tabindex',shown?'0':'-1');});
  $('graph').dataset.zoomLayer=bubble?'overview':'connections';$('graph').dataset.minimumConnections=String(semanticStyle(0,camera.z).threshold);$('graph').dataset.visibleEntities=String(semanticNodes.size);
  $('visible-count').textContent=semanticNodes.size+' of '+graph.nodes.length+' entities · '+semanticEdges.size+' connections';
  $('semantic-summary').textContent=graph.nodes.length>semanticNodes.size?(graph.nodes.length-semanticNodes.size)+' more in this scope · zoom in or follow a connection':'All entities in this scope are visible';
  renderConnectionKey();
  renderConnectionLegend();
  const legend=$('connection-legend'),legendRect=legend.getBoundingClientRect(),legendBox={left:legendRect.left-surface.left,top:legendRect.top-surface.top,right:legendRect.right-surface.left,bottom:legendRect.bottom-surface.top};
  if(!legendReflow&&!expansionAnimation&&!legend.hidden&&legendRect.width&&visible.items.some(item=>footprintsOverlap(item,{box:legendBox},gap))){legendReflow=true;camera=fittedCamera(camera.z,true);positionGraph();legendReflow=false;}
  positionConnectionTooltip();
  positionEntityTooltip();
}

function positionRecordMenu(items,obstacles){
  const menu=$('entity-popover'),selection=state.selected;menu.hidden=!recordMenuOpen||!selection||!['node','edge'].includes(selection.kind);if(menu.hidden)return;
  const edge=selection.kind==='edge'?edgeById.get(selection.id):null,id=edge?edge.source:selection.id;
  const point=edge?edgeEls.get(edge.id)?.midpoint:positions.get(id);if(!point||!items.some(item=>item.id===id)){menu.hidden=true;return;}
  $('guided-open').hidden=!!edge;const isPinned=state.research.steps.some(step=>step.kind===(edge?'connection':'entity')&&step.id===selection.id);$('popover-pin').querySelector('span').textContent=isPinned?'Pinned':'Pin';const x=camera.x+point.x*camera.z,y=camera.y+point.y*camera.z,w=menu.offsetWidth,h=menu.offsetHeight;
  const anchorBox=edge?{left:x,right:x,top:y,bottom:y}:items.find(item=>item.id===id).box;const choices=[{left:anchorBox.right+12,top:y-h/2},{left:anchorBox.left-w-12,top:y-h/2},{left:x-w/2,top:anchorBox.top-h-12},{left:x-w/2,top:anchorBox.bottom+12}];
  for(let top=15;top<dimensions.height-h-10;top+=60)for(let left=15;left<dimensions.width-w-10;left+=90)choices.push({left,top});
  const allowed=choices.filter(p=>p.left>=8&&p.top>=8&&p.left+w<=dimensions.width-8&&p.top+h<=dimensions.height-8&&!obstacles.some(other=>overlaps({...p,right:p.left+w,bottom:p.top+h},other,6))&&!items.filter(item=>item.id===id||state.pinnedIds.has(item.id)||edge&&[edge.source,edge.target].includes(item.id)).some(item=>overlaps({...p,right:p.left+w,bottom:p.top+h},item.box,8)));
  const score=p=>items.filter(item=>overlaps({left:p.left,top:p.top,right:p.left+w,bottom:p.top+h},item.box,8)).length*100000+Math.hypot(p.left+w/2-x,p.top+h/2-y);const best=allowed.sort((a,b)=>score(a)-score(b))[0];if(!best){menu.hidden=true;return;}
  menu.style.left=best.left+'px';menu.style.top=best.top+'px';
  const pinned=state.research.steps.some(step=>step.kind===(edge?'connection':'entity')&&step.id===selection.id);$('popover-pin').setAttribute('aria-label',pinned?'Unpin from research path':'Pin to research path');$('popover-pin').setAttribute('aria-pressed',String(pinned));$('popover-pin').querySelector('span').textContent=pinned?'Pinned':'Pin';$('guided-open').hidden=!!edge;
}


function renderGraph() {
  const center=focusEntityId();document.body.dataset.nodeFocus=String(!!center);
  const shownNodes = new Set(graph.nodes.map(n => n.id)), shownEdges = new Set(graph.edges.map(e => e.id));
  const tags=previewTag?[...state.tags,previewTag]:state.tags,tagFocus=tags.size||tags.length?tagForeground(graph,tags):null,baseForeground=center?nodeNeighborhood(graph,center):pathForeground(graph,state.startingIds,state.path),foreground=tagFocus||baseForeground;
  const highlightedNodes = new Set(), highlightedEdges = new Set();
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
    group.classList.toggle('context-node',!foreground.nodes.has(id)&&!state.pinnedIds.has(id));
    group.classList.toggle('pinned-node',state.pinnedIds.has(id));
    pin.setAttribute('aria-label',(state.pinnedIds.has(id)?'Unpin ':'Pin ')+nodeById.get(id).name+(state.pinnedIds.has(id)?'':' as anchor'));pin.setAttribute('aria-pressed',String(state.pinnedIds.has(id)));pin.setAttribute('tabindex',visible?'0':'-1');
    group.classList.toggle('path-node',!!state.path?.nodes.includes(id));
    group.classList.toggle('highlight', highlightedNodes.has(id)); group.classList.toggle('selected', state.selected?.kind === 'node' && state.selected.id === id);
    group.classList.toggle('expanded',state.openNodes.has(id));
    core.setAttribute('aria-pressed', state.selected?.kind === 'node' && state.selected.id === id ? 'true' : 'false');
    core.setAttribute('aria-expanded',String(state.openNodes.has(id)));
    core.setAttribute('aria-description',degrees.get(id)+' recorded connections. '+(state.pinnedIds.has(id)?'Pinned research anchor. ':'')+'Select to focus this entity and open Pin and Details actions.');
    label.style.display = state.labels === 'off' ? 'none' : '';
  });
  edgeEls.forEach(({ group, line, label }, id) => {
    delete label.dataset.badgeAnchored;
    group.style.display = shownEdges.has(id) ? '' : 'none';
    group.classList.toggle('context-link',!foreground.edges.has(id));
    line.classList.toggle('active', highlightedEdges.has(id));
    line.classList.toggle('path-line',!!state.path?.edges.includes(id));
    label.style.display = state.labels === 'off' ? 'none' : '';
  });
  const tagScope=state.tags.size?tagSelection(graph,state.tags):null,iconEdges=tagScope?new Set([...tagScope.matches.edges,...tagScope.connectors]):center?baseForeground.edges:state.path?new Set(state.path.edges):state.selected?.kind==='node'?nodeNeighborhood(graph,state.selected.id).edges:state.selected?.kind==='edge'?pairedRelationships(graph.edges,edgeById.get(state.selected.id)).reduce((ids,edge)=>ids.add(edge.id),new Set()):new Set();
  const eligible=graph.edges.filter(edge=>iconEdges.has(edge.id)),seenPairs=new Set();
  connectionIcons.forEach(({group,count},id)=>{
    const edge=edgeById.get(id),key=[edge.source,edge.target].sort().join('|'),visible=shownEdges.has(id)&&iconEdges.has(id)&&!seenPairs.has(key);if(visible)seenPairs.add(key);
    const peers=visible?pairedRelationships(eligible,edge):[];connectionIcons.get(id).peerIds=peers.map(other=>other.id);count.textContent=peers.length>1?String(peers.length):'';
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
  const emptyStart=!state.tags.size&&state.customStart&&!state.startingIds.size&&!graph.nodes.length;
  document.body.dataset.emptyStart=String(emptyStart);
  $('graph-empty').hidden = graph.nodes.length > 0||emptyStart;
  $('graph-empty').querySelector('h2').textContent=state.tags.size?'No records match these tags':'No entities found';$('graph-empty').querySelector('p').textContent=state.tags.size?'Remove a tag or change the filters to explore more. Combined entity and connection tags follow up to two recorded links.':'Try a different search or reset the filters.';
  $('visible-count').textContent = `${graph.nodes.length} ${graph.nodes.length===1?'entity':'entities'} · ${graph.edges.length} ${graph.edges.length===1?'connection':'connections'}`+(hiddenByDistance&&state.view==='network'?` · ${hiddenByDistance} hidden`:'');
  $('selection-chip').hidden = !state.focus && !state.path;
  if (state.path) $('selection-chip').innerHTML = `<span>${state.path.edges.length} sourced link${state.path.edges.length === 1 ? '' : 's'} in this path</span><button data-clear-highlight aria-label="Clear highlighted path">×</button>`;
  else if (center) $('selection-chip').innerHTML = `<span>${nodeNeighborhood(graph,center).edges.size} direct connections · ${escape(nodeById.get(center).name)}</span><button data-clear-highlight aria-label="Clear neighborhood focus">×</button>`;
  positionGraph();
}

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
    panel.innerHTML = `<div class="inspector-header"><span class="eyebrow">ENTITY</span>${close}</div>${tagButtons('entity',n.id)}<h2>${escape(n.name)}</h2><div class="entity-role">${escape(n.role)}</div>${caseNodes.has(n.id)?`<p>${escape(readerField(n,'description'))}</p>`:''}<div class="entity-metrics"><div><b>${count}</b><span>dataset links</span></div><div><b>${links.length}</b><span>visible links</span></div></div><button class="focus-button" data-expand-node="${n.id}" aria-expanded="${action.opened}" ${action.disabled?'disabled':''}>${action.label}</button><button class="timeline-entity-link" data-timeline-entity="${n.id}">Follow the money over time ↗</button><div class="subheading">RELATIONSHIPS</div>${links.length ? links.map(e => connectionRow(e, n.id)).join('') : '<p>No links match the filters.</p>'}<div class="subheading">SOURCES</div>${sourceLinks(n.sourceIds)}`;
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
function renderTimeline(){
  const title=state.timelineScope==='case'?(cases[state.caseId]?.title||'Selected case'):nodeById.get(state.timelineEntity)?.name||'Selected entity';
  $('timeline-title').textContent=title;
  const undated=shownTimelineEvents.filter(e=>e.date.precision==='unknown').length;
  $('timeline-count').textContent=`${shownTimelineEvents.length} event${shownTimelineEvents.length===1?'':'s'} · ${shownTimelineEvents.length-undated} dated · ${undated} undated`;
  const lanes=Object.entries(timelineLanes).filter(([id])=>id!=='media'||state.caseId==='media'||shownTimelineEvents.some(e=>e.lane==='media'));
  $('timeline-view').style.setProperty('--timeline-columns',lanes.length);
  $('timeline-lane-headings').innerHTML=lanes.map(([id,lane])=>`<div style="--lane:${lane.color}"><strong>${lane.label}</strong><small>${lane.description}</small></div>`).join('');
  if(!shownTimelineEvents.length){$('timeline-year-nav').innerHTML='';$('timeline-events').innerHTML='<div class="timeline-empty"><h3>No events match</h3><p>Try another entity or change the case, history, or money filters.</p><button class="small-link" data-reset-timeline>Reset timeline filters</button></div>';return;}
  const years=[...new Set(shownTimelineEvents.map(timelineYear))];
  $('timeline-year-nav').innerHTML='<span>Jump to</span>'+years.map(year=>`<button data-timeline-year="${year}">${year==='undated'?'Undated':year}</button>`).join('');
  $('timeline-events').innerHTML=years.map(year=>{
    const list=shownTimelineEvents.filter(e=>timelineYear(e)===year);
    return `<section class="timeline-year" data-timeline-year-section="${year}" aria-label="${year==='undated'?'Undated events':year+' events'}"><div class="timeline-year-label"><strong>${year==='undated'?'Date not established':year}</strong><span>${year==='undated'?'The source describes the record; its event date is still unresolved.':'Each card shows the date or reporting period available.'}</span></div><div class="timeline-year-lanes">${lanes.map(([id,lane])=>`<div class="timeline-lane" style="--lane:${lane.color}" aria-label="${lane.label}">${list.filter(e=>e.lane===id).map(event=>{
      const edge=edgeById.get(event.primaryEdgeId);
      const dateLabel=formatEventDate(event.date),observed=event.date.observedOn?`${event.date.observationRole}: ${friendlyDate(event.date.observedOn)}`:'';
      return `<button class="timeline-card ${state.selected?.kind==='event'&&state.selected.id===event.id?'selected':''}" data-timeline-event="${event.id}" data-precision="${event.date.precision}" data-money-group="${moneyKinds[event.moneyKind].group}" aria-pressed="${state.selected?.kind==='event'&&state.selected.id===event.id}" aria-label="Timeline event: ${escape(eventTitle(event))}, ${escape(dateLabel)}"><span class="timeline-card-date">${escape(dateLabel)}</span><small class="timeline-card-role">${escape(event.date.role)}</small><strong class="timeline-card-title">${escape(eventTitle(event))}</strong><span class="timeline-card-actors">${escape(nodeById.get(edge.source).name)} ${edge.directional?'→':'↔'} ${escape(nodeById.get(edge.target).name)}</span><span class="timeline-card-amount">${timelineAmount(event)}</span><span class="timeline-money-kind">${moneyKinds[event.moneyKind].label}</span>${observed?`<small class="timeline-observed">${escape(observed)}</small>`:''}<small class="timeline-proof">${escape(evidenceStatuses[edge.status])} · ${event.sourceIds.length} source${event.sourceIds.length===1?'':'s'}${event.edgeIds.length>1?` · ${event.edgeIds.length} linked records`:''}</small></button>`;
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
  if(state.view==='timeline'){prepareTimeline();renderTimeline();}
  renderIndirectRoutes();renderGraph(); renderInspector(); decorateInspector();renderMapScope();
  if (state.view === 'directory') renderDirectory();
  if (state.view === 'relations') renderRelations();
  if (state.view === 'sources') renderSources();
  positionInspector();
  if (refit) fitGraph();
  researchUI?.render();if(state.view==='network')positionGraph();syncURL();
}

function contributionDates(edge){
  if(!edge?.contributionBreakdown?.length)return '';
  const rows=edge.contributionBreakdown,total=rows.reduce((sum,row)=>sum+row.amount,0),currency=value=>value.toLocaleString('en-US',{style:'currency',currency:'USD'});
  return '<section class="contribution-dates"><h3>Reported contribution dates</h3><table aria-label="Reported contribution dates"><thead><tr><th scope="col">Date</th><th scope="col">Amount</th></tr></thead><tbody>'+rows.map(row=>'<tr><td>'+escape(friendlyDate(row.date))+'</td><td>'+escape(currency(row.amount))+'</td></tr>').join('')+'</tbody></table><p>These '+rows.length+' dates make up the reported '+escape(currency(total))+' total.</p></section>';
}
function decorateInspector(){
  if(!state.selected)return;
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

// Keep evidence beside the selected record while letting the whole page grow.
function positionInspector() {
  const panel = $('inspector');
  panel.style.marginBlockStart = '';
  if(state.view==='network'){
    const stage=$('graph-stage'),narrow=matchMedia('(max-width:720px)').matches;
    const requested=detailsLayout.docked?detailsLayout.dockedWidth:narrow?(mobileDetailsWidth||Math.min(detailsLayout.floatingWidth,stage.clientWidth*.55)):detailsLayout.floatingWidth,floatingPosition=narrow?mobileDetailsPosition:floatingDetailsPosition;
    const width=detailsWidth(requested,stage.clientWidth,detailsLayout.docked),docked=detailsLayout.docked&&!panel.hidden;
    stage.style.setProperty('--docked-width',docked?width+'px':'0px');stage.style.setProperty('--floating-details-width',width+'px');panel.dataset.docked=String(detailsLayout.docked);
    if(!panel.hidden&&!panel.querySelector('.inspector-scroll')){
      const content=document.createElement('div');content.className='inspector-scroll';while(panel.firstChild)content.append(panel.firstChild);panel.append(content);
      const handle=content.querySelector('.inspector-header');handle.classList.add('floating-panel-header');handle.tabIndex=0;panel.prepend(handle);
      const dock=document.createElement('button');dock.dataset.dockDetails='';dock.className='dock-details';handle.insertBefore(dock,handle.querySelector('button'));
      const resize=document.createElement('div');resize.className='details-resizer';resize.setAttribute('role','separator');resize.setAttribute('aria-orientation','vertical');resize.setAttribute('aria-label','Resize details width');resize.tabIndex=0;panel.append(resize);
    }
    const dock=panel.querySelector('[data-dock-details]');if(dock){dock.textContent=detailsLayout.docked?'Undock':'Dock right';dock.setAttribute('aria-label',detailsLayout.docked?'Undock details':'Dock details to the right');}
    const resize=panel.querySelector('.details-resizer');if(resize){resize.setAttribute('aria-valuenow',width);resize.setAttribute('aria-valuemin',detailsWidth(1,stage.clientWidth,detailsLayout.docked));resize.setAttribute('aria-valuemax',detailsWidth(Infinity,stage.clientWidth,detailsLayout.docked));resize.setAttribute('aria-valuetext',width+' pixels');}
    panel.style.width=width+'px';panel.style.maxWidth='calc(100% - 16px)';panel.style.height=detailsLayout.docked?'100%':'';
    if(detailsLayout.docked){panel.style.left='auto';panel.style.right='0px';panel.style.top='0px';panel.style.bottom='0px';panel.style.maxHeight='100%';}
    else if(floatingPosition){panel.style.left=Math.max(8,Math.min(floatingPosition.left,stage.clientWidth-width-8))+'px';panel.style.top=Math.max(8,Math.min(floatingPosition.top,stage.clientHeight-180))+'px';panel.style.right='auto';panel.style.bottom='auto';panel.style.maxHeight=(narrow?Math.min(300,stage.clientHeight-parseFloat(panel.style.top)-12):stage.clientHeight-parseFloat(panel.style.top)-12)+'px';}
    else{panel.style.left=narrow?'10px':'';panel.style.right=narrow?'auto':'16px';panel.style.top=narrow?'auto':'74px';panel.style.bottom=narrow?'10px':'auto';const legend=$('connection-legend'),bottom=!legend.hidden?legend.offsetTop-12:stage.clientHeight-16;panel.style.maxHeight=narrow?'230px':Math.max(230,bottom-74)+'px';}
    if(narrow&&!$('connection-legend').style.top&&!panel.hidden&&!detailsLayout.docked)$('connection-legend').style.bottom=panel.offsetLeft+width>stage.clientWidth-135?panel.offsetHeight+24+'px':'78px';
    return;
  }
  $('graph-stage').style.setProperty('--docked-width','0px');for(const key of ['width','maxWidth','height','left','right','top','bottom','maxHeight'])panel.style[key]='';delete panel.dataset.docked;
  if (window.matchMedia('(max-width:720px)').matches) return;
  let record;
  if (state.view === 'timeline' && state.selected?.kind === 'event')
    record = document.querySelector(`[data-timeline-event="${CSS.escape(state.selected.id)}"]`);
  if (state.view === 'sources' && state.selected?.kind === 'source')
    record = document.querySelector(`[data-source="${CSS.escape(state.selected.id)}"]`)?.closest('.source-card');
  if (record) panel.style.marginBlockStart = `${Math.max(0, record.getBoundingClientRect().top - document.querySelector('.workspace').getBoundingClientRect().top)}px`;
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
  if(view!=='network'){state.tags=new Set();hideTagPreview();}
  if(previousView!==view){state.query='';$('search').value='';$('starting-results').hidden=true;}
  if(view==='timeline'&&state.selected?.kind==='node')state.timelineEntity=state.selected.id;
  if(view!=='timeline'&&state.selected?.kind==='event')state.selected=null;
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
function selectNode(id) { settleExpansion(false);rememberOpener(); state.selected = { kind: 'node', id }; state.focus = false;state.detailsOpen=true;render(); revealInspector(); }
function selectEdge(id) {if(!edgeById.has(id))return;settleExpansion();rememberView();rememberOpener();const center=state.view==='network'?focusEntityId():null;state.focusEntity=center||'';state.selected={kind:'edge',id};state.focus=!!center;recordMenuOpen=state.view==='network';if(state.view==='network')state.detailsOpen=false;hoveredNode=null;if(state.view!=='network')state.detailsOpen=true;render();if(state.view!=='network')revealInspector();}
function revealNode(id) {
  if (!baseGraph().nodes.some(n => n.id === id)) { resetFilters(false); setCase('all'); }
  settleExpansion();state.query = ''; $('search').value = ''; if(state.mapMode==='explore'&&!state.exploredIds.has(id)){const seed=seedExploration(baseGraph(),id,6);seed.ids.forEach(nodeId=>state.explorationSeeds.add(nodeId));}setView('network'); selectNode(id);
}
function resetFilters(doRender = true) {
  state.categories = new Set(Object.keys(categories)); state.relationships = new Set(Object.keys(relationships)); state.history = true; state.query = ''; state.selected = null; state.path = null; state.focus = false;
  state.timelineMoney='all';state.timelineUndated=true;
  state.caseId='all';$('topic-select').value='all';$('graph-title').textContent='Columbus network';state.tags=new Set();state.connectionMode='all';state.from='';state.to='';state.includeUncertain=true;syncReportingControls();
  $('search').value = ''; $('history').checked = true;
  $('filters').querySelectorAll('[data-category],[data-relationship]').forEach(input => input.checked = true);
  if (doRender){refreshMapScope();render(true);}
}

function openPathFinder() {
  if(state.view!=='network')setView('network');
  const available = baseGraph().nodes.slice().sort((a, b) => a.name.localeCompare(b.name));
  $('path-entities').innerHTML=available.map(node=>`<option value="${escape(node.name)}">${escape(node.role)}</option>`).join('');
  const chosen=[...state.startingIds].filter(id=>available.some(node=>node.id===id));
  const first=chosen[0]||available[0]?.id,second=chosen[1]||available.find(node=>node.id!==first)?.id||first;
  $('path-from').value=nodeById.get(first)?.name||'';$('path-to').value=nodeById.get(second)?.name||'';
  $('path-form').querySelector('button').disabled = !available.length;
  $('path-result').innerHTML = available.length ? '' : '<p class="path-result">No entities match the current filters. Reset filters to find a path.</p>';
  openFloatingPanel('path-dialog');
}

$('undo-map').addEventListener('click',undoExploration);
buildFilters(); buildGraph();
researchUI=mountResearchUI({state,nodes,edges,relationships,release,snapshot:workspaceSnapshot,remember:rememberView,changed:(refit=true)=>{if(refit===false){syncURL();return;}syncResearchPins();render();if(refit){camera=fittedCamera(camera.z,true);positionGraph();scheduleWorkspaceState();}},openPanel:openFloatingPanel,focusNode:id=>{closeFloatingPanel('guided-panel');toggleNode(id);},focusEdge:id=>{closeFloatingPanel('guided-panel');selectEdge(id);},showPath:route=>{closeFloatingPanel('research-panel');showExplorationPath(route);},download:(file,name)=>window.parent.postMessage({channel:'columbus-explorer',type:'download-research',file,name},location.origin),importPath:()=>window.parent.postMessage({channel:'columbus-explorer',type:'import-research'},location.origin),openView:(snapshot,name)=>window.parent.postMessage({channel:'columbus-explorer',type:'open-research',snapshot,name},location.origin),notify:toast,records:kind=>{if(kind==='graph')return baseGraph();const route=currentResearch();return datasetFor({nodes:nodes.filter(node=>route.nodeIds.has(node.id)),edges:edges.filter(edge=>route.edgeIds.has(edge.id))});}});
$('popover-pin').addEventListener('click',()=>{if(!state.selected)return;settleExpansion();researchUI.toggle(state.selected.kind==='edge'?'connection':'entity',state.selected.id);});
$('popover-details').addEventListener('click',()=>{state.detailsOpen=true;render(true);revealInspector();});
$('popover-close').addEventListener('click',()=>{recordMenuOpen=false;positionGraph();});
new ResizeObserver(updateTagWindowSpace).observe($('active-tags'));
new ResizeObserver(updateTagWindowSpace).observe($('search-window'));
$('source-total').textContent = sources.length;
$('dataset-counts').innerHTML = `<span><b>${nodes.length}</b> entities</span><span><b>${edges.length}</b> links</span><span><b>${sources.length}</b> sources</span>`;
$('review-date').textContent = `Updated ${friendlyDate(meta.reviewed)}`;
$('topic-select').addEventListener('change',()=>setCase($('topic-select').value));
document.querySelector('.view-nav').addEventListener('click', event => { const btn = event.target.closest('[data-view]'); if (btn) setView(btn.dataset.view); });
$('search').addEventListener('input', () => { if(state.view==='network'){renderEntitySearch();return;}settleExpansion();state.query = $('search').value.trim(); state.selected = null; state.path = null; state.focus = false;applyCaseLayout();render(true); });
$('starting-results').addEventListener('click',event=>{const result=event.target.closest('[data-start-entity]');if(result)addStartingEntity(result.dataset.startEntity);});
$('search').addEventListener('keydown',event=>{if(state.view!=='network')return;if(event.key==='ArrowDown'&&startingSearchResults.length){event.preventDefault();$('starting-results').querySelector('button')?.focus();}if(event.key==='Enter'&&startingSearchResults.length){event.preventDefault();chooseStartingResult(startingSearchResults[0]);}if(event.key==='Escape'){event.stopPropagation();$('search').value='';renderEntitySearch();}});
$('starting-results').addEventListener('keydown',event=>{
  const buttons=[...$('starting-results').querySelectorAll('button')],index=buttons.indexOf(event.target.closest('button'));if(index<0)return;
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();const next=index+(event.key==='ArrowDown'?1:-1);if(next<0)$('search').focus({preventScroll:true});else buttons[Math.min(next,buttons.length-1)].focus();}
  if(event.key==='Escape'){event.stopPropagation();$('search').value='';renderEntitySearch();$('search').focus({preventScroll:true});}
});
$('reset-filters').addEventListener('click', () => resetFilters());
$('empty-reset').addEventListener('click', () => resetFilters());
$('mobile-filters').addEventListener('click',()=>{floatingPanelOpen('filters')?closeFloatingPanel('filters'):openFloatingPanel('filters');});
$('legend-open').addEventListener('click',()=>{floatingPanelOpen('connection-legend')?closeFloatingPanel('connection-legend'):openFloatingPanel('connection-legend');});
$('zoom-in').addEventListener('click', () => zoom(1.25)); $('zoom-out').addEventListener('click', () => zoom(.8)); $('fit').addEventListener('click', () => fitGraph());
$('reset-layout').addEventListener('click', () => { rememberView();fitGraph();toast('Entities arranged in the available canvas'); });
$('label-toggle').addEventListener('click', () => { state.labels = state.labels === 'auto' ? 'all' : state.labels === 'all' ? 'off' : 'auto'; $('label-toggle').textContent = state.labels === 'auto' ? 'Labels auto' : state.labels === 'all' ? 'All labels' : 'Labels off'; renderGraph(); });
document.addEventListener('click', event => {
  const pinButton=event.target.closest('[data-toggle-pin]');if(pinButton){togglePin(pinButton.dataset.togglePin);return;}
  const anchorButton=event.target.closest('[data-anchor-focus]');if(anchorButton){toggleNode(anchorButton.dataset.anchorFocus);return;}
  const showType=event.target.closest('[data-show-type]');if(showType){rememberView();state.relationships.add(showType.dataset.showType);if(connectionModesForLegend()&&!connectionModesForLegend().includes(showType.dataset.showType))state.connectionMode='all';syncReportingControls();render(true);return;}
  const projectLink=event.target.closest('[data-project-dialog]');
  if(projectLink){event.preventDefault();document.querySelector('dialog[open]')?.close();$(projectLink.dataset.projectDialog).showModal();return;}
  const btn = event.target.closest('button'); if (!btn) return;
  if(btn.dataset.removeTag){applyTag(btn.dataset.removeTag);$('search').focus({preventScroll:true});return;}
  if(btn.hasAttribute('data-add-tag')){$('search').focus({preventScroll:true});return;}
  if(btn.dataset.startTag){chooseStartingResult({kind:'tag',id:btn.dataset.startTag});return;}
  if(btn.dataset.tag){applyTag(btn.dataset.tag);return;}
  if(btn.hasAttribute('data-dock-details')){
    settleExpansion(false);
    if(!detailsLayout.docked){const rect=$('inspector').getBoundingClientRect(),stage=$('graph-stage').getBoundingClientRect(),point={left:rect.left-stage.left,top:rect.top-stage.top};if(matchMedia('(max-width:720px)').matches)mobileDetailsPosition=point;else floatingDetailsPosition=point;}
    detailsLayout.docked=!detailsLayout.docked;saveDetailsLayout();positionInspector();if(graph)renderMapScope();fitGraph();return;
  }
  if(btn.dataset.closeFloating){closeFloatingPanel(btn.dataset.closeFloating);return;}
  if (btn.classList.contains('methodology-open')) $('methodology').showModal();
  if (btn.dataset.openCase) { setCase(btn.dataset.openCase); setView('network'); }
  if (btn.hasAttribute('data-close-inspector')) { if(state.view==='network'){state.detailsOpen=false;render(true);}else{state.selected=null;state.focus=false;render();}restoreFocus(); }
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
  if (btn.dataset.source) { rememberOpener();state.detailsOpen=true; state.selected = { kind: 'source', id: btn.dataset.source }; render(); revealInspector(); }
  if(btn.dataset.expandNode)toggleNode(btn.dataset.expandNode);
  if (btn.hasAttribute('data-focus')) { state.focus = !state.focus; renderGraph(); renderInspector();decorateInspector();fitGraph();syncURL(); }
  if (btn.hasAttribute('data-clear-highlight')) { settleExpansion(false);const refit=state.focus;state.focus = false; state.path = null; render(refit); }
});
for(const id of ['timeline-entity','timeline-scope','timeline-money','timeline-undated'])$(id).addEventListener('change',()=>{
  state.timelineEntity=$('timeline-entity').value;state.timelineScope=$('timeline-scope').value;state.timelineMoney=$('timeline-money').value;state.timelineUndated=$('timeline-undated').checked;state.selected=null;state.path=null;render();
  syncURL();
});
document.addEventListener('keydown', event => {
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'&&!event.shiftKey&&state.view==='network'&&!event.target.closest('input,textarea,[contenteditable=true]')&&explorationHistory.length){event.preventDefault();undoExploration();return;}
  if (event.key === '/' && !['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName) && !document.querySelector('dialog[open]')) { event.preventDefault(); $('search').focus(); }
  if(event.key==='Escape'&&!$('entity-tooltip').hidden){hideEntityTooltip();event.preventDefault();return;}
  if(event.key==='Escape'&&event.target.closest('.floating-panel')){closeFloatingPanel(event.target.closest('.floating-panel').id);return;}
  if (event.key === 'Escape' && !document.querySelector('dialog[open]')) { settleExpansion(false);state.selected = null; state.focus = false; state.path = null; render();restoreFocus(); }
});
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
  $('path-result').innerHTML=routes.map((route,index)=>`<div class="path-result"><strong>Route ${index+1} · ${route.edges.length} links</strong><p>${escape(overlapLabel(route.dates.status))}</p>${route.nodes.map((id,i)=>`${i?`<div class="path-edge-label">${escape(edgeById.get(route.edges[i-1]).type)} · ${escape(readerField(edgeById.get(route.edges[i-1]),'label'))}<br>${escape(edgeById.get(route.edges[i-1]).period)} · ${escape(evidenceStatuses[edgeById.get(route.edges[i-1]).status])}</div>`:''}<div class="path-hop"><button data-node-detail="${id}">${escape(nodeById.get(id).name)}</button></div>`).join('')}<button class="explore-button path-show-button" data-show-route="${index}">Show this path →</button> <button class="small-link" data-packet-route="${index}">Download path data ↓</button></div>`).join('')+'<p>Up to three routes, at most six steps. </p>';
  $('path-result').querySelectorAll('[data-show-route]').forEach(button=>button.addEventListener('click',()=>{closeFloatingPanel('path-dialog');showExplorationPath(routes[Number(button.dataset.showRoute)],[from,to]);}));
  $('path-result').querySelectorAll('[data-packet-route]').forEach(button=>button.addEventListener('click',()=>{const route=routes[Number(button.dataset.packetRoute)];downloadJSON(evidencePacket({kind:'path',...route}),'path-'+release.releaseId+'.json');}));
});
function exportCurrent(asJSON=false) {
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
  const url = URL.createObjectURL(new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = state.view==='timeline'?'columbus-timeline.json':'columbus-network.json'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); if(asJSON)toast('View data saved');
}
$('export').addEventListener('click',()=>exportCurrent(true));
for (const dialog of document.querySelectorAll('dialog')) dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
function syncReportingControls(){$('connection-mode').value=state.connectionMode;$('valid-from').value=state.from;$('valid-to').value=state.to;$('include-uncertain').checked=state.includeUncertain;$('connection-distance').value=String(state.connectionDistance);}
$('connection-distance').addEventListener('change',()=>{
  settleExpansion();rememberView();state.connectionDistance=normalizeConnectionDistance($('connection-distance').value);defaults.connectionDistance=state.connectionDistance;
  const id=focusEntityId()||(state.selected?.kind==='node'?state.selected.id:state.exploreRoot)||[...state.pinnedIds][0];
  if(nodeById.has(id)){state.focusEntity=id;state.focus=true;state.openNodes.add(id);state.explorationSeeds.add(id);}
  try{localStorage.setItem(distancePreferenceKey,String(state.connectionDistance));}catch{}
  render(true);
});
for(const id of ['connection-mode','valid-from','valid-to','include-uncertain'])$(id).addEventListener('change',()=>{
  const from=$('valid-from').value,to=$('valid-to').value;
  try{validateRange(from,to);$('query-error').hidden=true;}catch(error){$('query-error').textContent=error.message;$('query-error').hidden=false;return;}
  rememberView();Object.assign(state,{connectionMode:$('connection-mode').value,from,to,includeUncertain:$('include-uncertain').checked,path:null});render(true);
});
function restoreURL(){
  restoringURL=true;const requested=decodeState(location.href,defaults);
  setCase(requested.caseId);setView(requested.view);Object.assign(state,requested);
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
$('map-full').addEventListener('click',()=>{settleExpansion(false);rememberView();state.tags=new Set();hideTagPreview();state.mapMode='full';state.focus=false;state.selected=null;state.path=null;recordMenuOpen=false;applyCaseLayout();render(true);});
$('map-small').addEventListener('click',openStartingEntities);
$('map-scope').addEventListener('click',()=>{const id=expansionAnchor();if(!nodeById.has(id))return;state.selected={kind:'node',id};state.detailsOpen=true;render(true);revealInspector();});
$('search-show-all').addEventListener('click',()=>{
  settleExpansion();rememberView();resetFilters(false);state.caseId='all';$('topic-select').value='all';$('graph-title').textContent='Columbus network';
  state.startingIds=new Set();state.explorationSeeds=new Set();state.exploredIds=new Set();state.openNodes=new Set();state.exploreRoot='';state.customStart=false;state.mapMode='full';
  renderEntitySearch();setView('network');applyCaseLayout();render(true);$('graph').focus({preventScroll:true});
});
let windowDrag=null;
function windowSurface(panel){return panel.id==='inspector'?$('graph-stage'):$('canvas-area');}
function moveWindow(panel,left,top){const stage=windowSurface(panel);panel.style.left=Math.min(Math.max(8,left),Math.max(8,stage.clientWidth-panel.offsetWidth-8))+'px';panel.style.top=Math.min(Math.max(8,top),Math.max(8,stage.clientHeight-panel.offsetHeight-8))+'px';panel.style.right='auto';panel.style.bottom='auto';if(graph&&state.view==='network')positionGraph();if(panel.id==='inspector'){const point={left:parseFloat(panel.style.left),top:parseFloat(panel.style.top)};if(matchMedia('(max-width:720px)').matches)mobileDetailsPosition=point;else floatingDetailsPosition=point;}}
function saveDetailsLayout(){try{localStorage.setItem(detailsPreferenceKey,JSON.stringify(detailsLayout));}catch{}}
function resizeDetails(requested,right=null,top=null){
  const panel=$('inspector'),stage=$('graph-stage'),narrow=matchMedia('(max-width:720px)').matches,width=detailsWidth(requested,stage.clientWidth,detailsLayout.docked);
  if(detailsLayout.docked)detailsLayout.dockedWidth=width;
  else{if(narrow)mobileDetailsWidth=width;else detailsLayout.floatingWidth=width;if(right!=null){const point={left:Math.max(8,right-width),top};if(narrow)mobileDetailsPosition=point;else floatingDetailsPosition=point;}}
  positionInspector();renderMapScope();if(!detailsLayout.docked)fitGraph();
}
document.addEventListener('pointerdown',event=>{
  const handle=event.target.closest('.details-resizer');if(!handle||event.button!==0)return;
  settleExpansion(false);const rect=$('inspector').getBoundingClientRect(),stage=$('graph-stage').getBoundingClientRect();
  detailsResize={handle,pointer:event.pointerId,x:event.clientX,width:rect.width,right:rect.right-stage.left,top:rect.top-stage.top};handle.setPointerCapture(event.pointerId);document.body.classList.add('resizing-details');event.preventDefault();
});
document.addEventListener('pointermove',event=>{if(detailsResize&&event.pointerId===detailsResize.pointer)resizeDetails(detailsResize.width+detailsResize.x-event.clientX,detailsResize.right,detailsResize.top);});
for(const name of ['pointerup','pointercancel'])document.addEventListener(name,event=>{if(detailsResize&&event.pointerId===detailsResize.pointer){if(detailsResize.handle.hasPointerCapture(event.pointerId))detailsResize.handle.releasePointerCapture(event.pointerId);detailsResize=null;document.body.classList.remove('resizing-details');saveDetailsLayout();}});
document.addEventListener('keydown',event=>{
  if(!event.target.matches('.details-resizer')||!['ArrowLeft','ArrowRight','Home'].includes(event.key))return;
  event.preventDefault();const rect=$('inspector').getBoundingClientRect(),stage=$('graph-stage').getBoundingClientRect();resizeDetails(event.key==='Home'?420:rect.width+(event.key==='ArrowLeft'?20:-20),rect.right-stage.left,rect.top-stage.top);saveDetailsLayout();
});
document.addEventListener('pointerdown',event=>{
  const handle=event.target.closest('.floating-panel-header');if(state.view!=='network'||!handle||event.target.closest('button')||event.button!==0)return;
  const panel=handle.parentElement;if(panel.id==='inspector'&&detailsLayout.docked)return;const stage=windowSurface(panel).getBoundingClientRect(),rect=panel.getBoundingClientRect();
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
  return {query:location.search,mapLayout:'bubble-cloud-v2',...(!cloudNeedsFit?{overviewIds:[...cloudSceneIds]}:{}),positions:[...finalPositions].map(([id,p])=>[id,p.x,p.y]),camera:{...(expansionAnimation?.endCamera||camera)},dimensions:{...dimensions},scale:entityScale,research:structuredClone(state.research),details:{open:state.detailsOpen,docked:detailsLayout.docked,width:detailsLayout.docked?detailsLayout.dockedWidth:detailsLayout.floatingWidth}};
}
function publishWorkspaceState(requestId=null){
  if(window.parent===window)return;
  window.parent.postMessage({channel:'columbus-explorer',type:'state',snapshot:workspaceSnapshot(),requestId},location.origin);
}
function scheduleWorkspaceState(){clearTimeout(workspaceTimer);workspaceTimer=setTimeout(publishWorkspaceState,180);}
function measureWorkspace(){if(window.parent!==window)window.parent.postMessage({channel:'columbus-explorer',type:'height',height:state.view==='network'?innerHeight:document.documentElement.scrollHeight},location.origin);}
function restoreWorkspaceView(input){
  const saved=validateView(input,new Set(nodeById.keys()));settleExpansion();history.replaceState(null,'',location.pathname+saved.query);state.detailsOpen=saved.details.open;detailsLayout={docked:saved.details.docked,floatingWidth:saved.details.width,dockedWidth:saved.details.width};restoreURL();restoringURL=true;if(saved.research){state.research=saved.research;syncResearchPins();}state.detailsOpen=saved.details.open;recordMenuOpen=false;render();
  cloudSceneIds=new Set(saved.overviewIds||[]);cloudNeedsFit=cloudView()&&!saved.overviewIds?.length;
  if(saved.positions.length){saved.positions.forEach(([id,x,y])=>positions.set(id,{x,y}));const r=$('canvas-area').getBoundingClientRect();entityScale=saved.scale;$('graph').style.setProperty('--entity-label-size',Math.max(11,13*entityScale)+'px');if(r.width<1||r.height<1){dimensions={...saved.dimensions};camera={...saved.camera};}else{dimensions={width:r.width,height:r.height};if(cloudNeedsFit||!cloudView()&&semanticStyle(0,saved.camera.z).bubble&&!saved.mapLayout)camera=fittedCamera(saved.camera.z);else if(Math.abs(r.width-saved.dimensions.width)<3&&Math.abs(r.height-saved.dimensions.height)<3)camera={...saved.camera};else camera=fittedCamera();}positionGraph();}
  repairFocusedPlacement();explorationHistory.length=0;$('undo-map').disabled=true;restoringURL=false;publishWorkspaceState();measureWorkspace();
}
window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==window.parent||event.data?.channel!=='columbus-explorer')return;
  if(event.data.type==='restore'){try{restoreWorkspaceView(event.data.snapshot);}catch{toast('This view could not be restored.');}}
  if(event.data.type==='navigate'&&['network','timeline','relations','directory','sources'].includes(event.data.view)){setView(event.data.view);measureWorkspace();publishWorkspaceState();}
  if(event.data.type==='research-library')researchUI.openSaved();
  if(event.data.type==='capture')publishWorkspaceState(event.data.requestId);if(event.data.type==='measure')requestAnimationFrame(()=>{if(state.view==='network'&&graph&&$('canvas-area').getBoundingClientRect().width>0){if(cloudNeedsFit)camera=fittedCamera(camera.z);positionGraph();repairFocusedPlacement();}measureWorkspace();});
});
for(const type of ['pointerdown','focusin'])document.addEventListener(type,()=>{if(window.parent!==window)window.parent.postMessage({channel:'columbus-explorer',type:'focus'},location.origin);},true);
document.addEventListener('pointerup',scheduleWorkspaceState);document.addEventListener('change',scheduleWorkspaceState);new ResizeObserver(()=>requestAnimationFrame(measureWorkspace)).observe(document.body);
if(window.parent!==window)window.parent.postMessage({channel:'columbus-explorer',type:'ready'},location.origin);
