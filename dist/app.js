import { meta, nodes, edges, sources, categories, relationships, cases, evidenceStatuses } from './data.js';
import { filterGraph, shortestPath, matches, normalize } from './core.js';
import { seedExploration,exploredGraph,branchExploration,nodeNeighborhood,transitionCamera,normalizeConnectionDistance,connectionNeighborhood } from './exploration.js';
import {partyColors,knownParty,connectionParty,normalizeColorMode} from './party-colors.js';
import { repositoryURL } from './project-links.js';
import { startingConnections,pathForeground,revealedPathPositions } from './exploration-paths.js';
import { mediaProfiles,mediaLeads } from './media.js';
import { readerField,profileCopy,leadStories,overlapLabel,hearingTestimony,plateReaderHearing } from './reader-copy.js';
import {buildEntitySummaries} from './entity-summaries.js';
import {starterProjects,isProjectMap,addProjectToResearch} from './starter-projects.js';
import {investigations} from './investigations.js';
import { datasetFor, evidencePacket, publicSource, release } from './contract.js';
import { validityFor, validityInRange, findPaths, validateRange } from './reporting.js';
import { relationshipMatches, sourceMatches } from './search.js';
import { encodeState, decodeState, recordURL, recordKind } from './routing.js';
import {pairedRelationships,relationshipIcons} from './explorer-ui.js';
import {tagDefinitions,recordTags,tagForeground,taggedGraph,tagSelection} from './tags.js';
import {deskCommands,searchDesk} from './desk-search.js';
import {mountDesk} from './exploration-desk.js';
import {scopedConnections,connectionGroups} from './canvas-layout.js';
import {validateView,recordDeskForView} from './saved-views.js';
import {overlaps,bubbleLabel} from './semantic-map.js';
import {emptyResearch,validateResearch,researchConnections,networkForPins} from './research-paths.js';
import {mountResearchUI} from './research-ui.js';
import {campaignRoster} from './campaigns-2026.js';
import {campaignMoneyCard,mountCampaignMoney} from './campaign-finance-ui.js';
import {campaignFinanceIndex} from './campaign-finance-index.js';
import {connectionSummary,focusFlight,extendTrail} from './focused-explorer.js';
import {bucketLayout,selectionGraph,segmentInBox,circleInBox,dollarLabel} from './map-actions.js';
import {networkPositions,frameNetwork,entityFocusCamera,networkStyle,showNetworkLabel,connectedCanvas,directConnections,labelPlacements,appendWalk,walkConnection,orbitalBranch,explorationSpace,clearNodeCamera,resizeCamera} from './desktop-network.js';

const $ = id => document.getElementById(id);
const campaignMoneyUI=mountCampaignMoney({openEntity:id=>{resetFilters(false);toggleNode(id);state.detailsOpen=true;render();}});
const nodeById = new Map(nodes.map(n => [n.id, n]));
const edgeById = new Map(edges.map(e => [e.id, e]));
const sourceById = new Map(sources.map(s => [s.id, s]));
const recordsByKind={node:nodeById,edge:edgeById,source:sourceById};
const entitySummaries = buildEntitySummaries(nodes,edges,sources);
const projects=starterProjects(nodes,edges,sources);
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
const state = { view: 'network', caseId: 'all', categories: new Set(Object.keys(categories)), relationships: new Set(Object.keys(relationships)), history: true, query: '', selected: null, focus: false, path: null, labels: 'auto' };
const distancePreferenceKey='columbus-network:reveal-distance-v2';
let preferredConnectionDistance=1;
try{preferredConnectionDistance=normalizeConnectionDistance(localStorage.getItem(distancePreferenceKey),1);}catch{}
Object.assign(state,{connectionMode:'all',from:'',to:'',includeUncertain:true,mapMode:'explore',exploreRoot:'',exploredIds:new Set(),explorationSeeds:new Set(),openNodes:new Set(),startingIds:new Set(),customStart:true,detailsOpen:false,connectionDistance:preferredConnectionDistance});
state.pinnedIds=new Set();state.pinnedEdgeIds=new Set();state.research=emptyResearch();
state.trailNodes=new Set();state.trailEdges=new Set();state.collapsedNodes=new Set();
state.walk=[];state.pinOverview=false;state.pinFrame=null;state.showDirect=false;state.orbitIds=new Set();
state.projectId='';state.projectStep='';state.projectPlace=null;
state.colorMode='type';
const colorPreferenceKey='cbus-power:canvas-colors';
try{state.colorMode=normalizeColorMode(localStorage.getItem(colorPreferenceKey));}catch{}
state.multiNodes=new Set();state.multiEdges=new Set();state.bucketMode=false;state.bucketIds=null;state.showAmounts=false;
let boxSelectMode=false,spaceToPan=false;
let networkReturn=null;
let pathContext=null,pathScope='',pathSubmitted=false;
let researchUI=null,semanticNodes=new Set(),semanticEdges=new Set(),legendSignature='',semanticStyles=new Map(),legendReflow=false,focusDensity=1,focusMenuRect=null,popoverSignature='';
let focusPorts=new Map(),compactFocusNames=false;
let workspaceTimer=null,entityScale=1,entityTooltipId=null,cloudSceneIds=new Set(),cloudNeedsFit=false;
const defaults={...state};
state.tags=new Set();defaults.tags=new Set();
let restoringURL=true,selectionOpener=null,listPlace=null;
function syncURL(){if(!restoringURL){history.replaceState(null,'',encodeState(location.href,state,release.releaseId));if(state.requestedRelease&&state.requestedRelease!==release.releaseId){state.requestedRelease=release.releaseId;$('route-warning').hidden=true;}scheduleWorkspaceState();}}
function downloadJSON(output,name){const url=URL.createObjectURL(new Blob([JSON.stringify(output,null,2)],{type:'application/json'}));const anchor=document.createElement('a');anchor.href=url;anchor.download=name;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function rememberOpener(){const element=document.activeElement;selectionOpener=element?.dataset?.edge?`[data-edge="${CSS.escape(element.dataset.edge)}"]`:element?.dataset?.source?`[data-source="${CSS.escape(element.dataset.source)}"]`:element?.dataset?.nodeDetail?`[data-node-detail="${CSS.escape(element.dataset.nodeDetail)}"]`:element?.dataset?.node?`.node-core[data-node="${CSS.escape(element.dataset.node)}"]`:'#search';}
function restoreFocus(){const target=[...document.querySelectorAll(selectionOpener||'#search')].find(el=>!el.closest('[hidden]')&&el.getClientRects().length);(target||$('search')).focus({preventScroll:true});}
let graph,hiddenByDistance=0;
let camera = { x: 0, y: 0, z: 1 };
let lastScopeFit=null;
let dimensions = { width: 800, height: 570 };
let drag = null;
let cameraMotion=null,miniSignature='',overviewTransform=null,walkSignature='',miniWalkSignature='';
const labelMeasurements=new Map();

let suppressClick = false;
let toastTimer;
let hoveredNode=null;
let expansionAnimation=null;
let indirectRoutes=[],comparison={direct:[],indirect:[],disconnected:[]};
const routeEls=new Map();
let previewTag='',tagPreviewOwner=null,tagStatsCache=new Map();
const connectionIcons=new Map();
let hoveredEdge=null;
const desk=mountDesk({
  nodes,edges,sources,search:query=>searchDesk(baseGraph(),sources,nodeById,query,state.tags,projects.values()).filter(hit=>hit.id!=='show-pins'||state.research.steps.length),
  choose:chooseSearchResult,start:id=>{toggleNode(id);focusRecordHeading();},launch:launchPanel,changed:scheduleWorkspaceState,
  projects,openProject:openStarterProject,returnToList,beforeCompact:()=>rememberProjectPlace('',true),navigate:navigateSection,
  presentationChanged:()=>{if(graph){render(document.body.dataset.emptyStart==='true');measureWorkspace();}}
});
function focusEntityId(){return state.focus&&!state.pinOverview?(state.focusEntity||(state.selected?.kind==='node'?state.selected.id:null)):null;}
const explorationHistory=[];
function copyViewState(value){return {...value,orbitIds:new Set(value.orbitIds||[]),walk:(value.walk||[]).map(step=>({...step})),multiNodes:new Set(value.multiNodes),multiEdges:new Set(value.multiEdges),bucketIds:value.bucketIds?new Set(value.bucketIds):null,trailNodes:new Set(value.trailNodes),trailEdges:new Set(value.trailEdges),collapsedNodes:new Set(value.collapsedNodes),research:structuredClone(value.research),pinnedEdgeIds:new Set(value.pinnedEdgeIds),pinnedIds:new Set(value.pinnedIds),tags:new Set(value.tags),categories:new Set(value.categories),relationships:new Set(value.relationships),startingIds:new Set(value.startingIds),exploredIds:new Set(value.exploredIds),explorationSeeds:new Set(value.explorationSeeds),openNodes:new Set(value.openNodes),selected:value.selected?{...value.selected}:null,path:value.path?{...value.path,nodes:[...value.path.nodes],edges:[...value.path.edges]}:null};}
function rememberView(reason='',edgeId=''){
  if(state.view!=='network'||restoringURL)return;
  rememberProjectPlace(edgeId);
  explorationHistory.push({reason,state:copyViewState(state),desk:desk.snapshot(),readingPlace:desk.readingPlace,positions:new Map([...positions].map(([id,p])=>[id,{...p}])),camera:{...camera},dimensions:{...dimensions},entityScale,overviewIds:[...cloudSceneIds],focusDensity,focusPorts:new Map(focusPorts),focusMenuRect:focusMenuRect?{...focusMenuRect}:null,compactFocusNames});
  if(explorationHistory.length>30)explorationHistory.shift();$('undo-map').disabled=false;document.body.dataset.canUndo='true';
}
function undoExploration(){
  if(!explorationHistory.length)return;settleExpansion(false);hideTagPreview();const previous=explorationHistory.pop(),start={...camera};
  applyUndoSnapshot(previous);const target={...camera};camera=start;moveCamera(target);
}
function applyUndoSnapshot(previous,keepFrame=false){
  entityScale=previous.entityScale||1;$('graph').style.setProperty('--entity-label-size',Math.max(11,13*entityScale)+'px');
  const currentPositions=keepFrame?new Map(positions):null,currentCamera={...camera};Object.assign(state,copyViewState(previous.state));focusDensity=previous.focusDensity||1;compactFocusNames=!!previous.compactFocusNames;focusPorts=new Map(previous.focusPorts||[]);focusMenuRect=previous.focusMenuRect;desk.restore(previous.desk,state.selected,previous.readingPlace);positions.clear();previous.positions.forEach((p,id)=>positions.set(id,{...(currentPositions?.get(id)||p)}));hoveredNode=null;hoveredEdge=null;edgeEls.forEach(({group})=>group.classList.remove('hovered'));connectionIcons.forEach(({group})=>group.classList.remove('hovered'));
  $('list-search').value=state.query;$('topic-select').value=state.caseId;syncReportingControls();$('history').checked=state.history;
  defaults.connectionDistance=state.connectionDistance;try{localStorage.setItem(distancePreferenceKey,String(state.connectionDistance));}catch{}
  defaults.colorMode=state.colorMode;try{localStorage.setItem(colorPreferenceKey,state.colorMode);}catch{}
  $('filters').querySelectorAll('[data-category]').forEach(input=>input.checked=state.categories.has(input.dataset.category));$('filters').querySelectorAll('[data-relationship]').forEach(input=>input.checked=state.relationships.has(input.dataset.relationship));
  cloudSceneIds=new Set(previous.overviewIds||[]);desk.dismiss();render();
  const bounds=$('canvas-area').getBoundingClientRect();dimensions={width:bounds.width,height:bounds.height};
  camera=keepFrame?currentCamera:resizeCamera(previous.camera,previous.dimensions,dimensions,positions.get(focusEntityId()));
  positionGraph();$('undo-map').disabled=!explorationHistory.length;document.body.dataset.canUndo=String(!!explorationHistory.length);syncURL();toast('Previous map restored');
  if(previous.readingPlace?.expanded)$('dock-content').scrollTop=previous.readingPlace.scroll;
  restoreProjectReading(true);
}

const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
function recordTopicTools(tags){
  if(!tags.length)return '';
  const choices=tags.map(tag=>`<button type="button" data-tag="${tag}" aria-pressed="${state.view==='network'&&state.tags.has(tag)}">${escape(tagDefinitions[tag].label)}</button>`);
  return '<p class="source-caption">Explore by topic</p><div class="record-tags" aria-label="Record tags">'+choices.join('')+'</div>';
}
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
  if(!toggle&&state.tags.has(id)){state.query='';$('search').value='';desk.dismiss();return;}
  rememberView();state.pinOverview=false;state.pinFrame=null;const startCamera={...camera},anchor={...(positions.get(focusEntityId()||state.exploreRoot)||{x:0,y:0})};
  state.tags=new Set(state.tags);if(toggle&&state.tags.has(id))state.tags.delete(id);else state.tags.add(id);
  state.query='';$('search').value='';state.selected=null;state.path=null;state.focus=false;state.focusEntity='';desk.dismiss();render();
  const bounds=$('canvas-area').getBoundingClientRect();dimensions={width:bounds.width,height:bounds.height};const endCamera=fittedCamera();
  if(!graph.nodes.length||matchMedia('(prefers-reduced-motion: reduce)').matches){camera=endCamera;positionGraph();}
  else{camera=startCamera;expansionAnimation={targets:new Map(),starts:new Map(),revealing:new Set(),anchor,startCamera,endCamera,sharedScale:graph.nodes.length>80,start:null,frame:null};$('graph').setAttribute('aria-busy','true');$('graph').classList.toggle('animating',expansionAnimation.sharedScale);positionGraph();expansionAnimation.frame=requestAnimationFrame(animateExpansion);}
}
function partyDetails(node){
  if(!node.party)return '';
  const affiliation=node.partyAffiliation;
  return '<div class="party-affiliation"><strong>Party affiliation: '+escape(node.party)+'</strong>'+(affiliation?'<small>'+escape(affiliation.period)+'</small><small>'+escape(affiliation.locator)+'</small>'+citationRefs(affiliation.sourceIds||[],node.sourceIds):'')+'</div>';
}
const dot = category => `<span class="category-dot" style="--color:${categories[category].color}"></span>`;
const initials = node => node.category === 'person' || node.category === 'politician' ? node.name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('') : node.id === 'partnership' ? 'CP' : node.id === 'smart-columbus' ? 'SC' : node.id === 'city' ? 'C' : node.name.split(' ').filter(n => !['&', 'of', 'the'].includes(n.toLowerCase())).map(n => n[0]).slice(0, 2).join('');
const friendlyDate = date => !date ? 'Undated page' : date.length === 4 ? date : date.length===7?new Intl.DateTimeFormat('en-US',{month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(date+'-01T12:00:00Z'))+' · month only':new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(date + 'T12:00:00Z'));
const baseGraph = () => filterGraph({ ...state, query: '' });

const topicRoots={all:'city',money:'city',cityhall:'city',jobsohio:'jobsohio',media:'wsyx',politics:'vivek',campaigns2026:'ohio-governor-election',sports:'hsg',datacenters:'google',alpr:'flock',hb6:'aep',epstein:'les',redflex:'redflex'};
function seedMap(preferred=state.exploreRoot){const seed=seedExploration(baseGraph(),preferred);state.exploreRoot=seed.root;state.explorationSeeds=new Set(seed.ids);state.openNodes=new Set();state.exploredIds=seed.ids;state.startingIds=new Set(seed.root?[seed.root]:[]);state.customStart=false;}
let researchKeys=null,researchRoutes=null;
function currentResearch(){
  if(researchKeys!==state.research.steps){researchKeys=state.research.steps;researchRoutes=researchConnections(researchKeys,{nodes,edges});}
  return researchRoutes;
}
function exploredForeground(){
  const ids=new Set([...state.trailEdges,...(state.path?.edges||[]),...currentResearch().edgeIds]);
  const links=graph.edges.filter(edge=>ids.has(edge.id));
  return {edges:new Set(links.map(edge=>edge.id)),nodes:new Set(links.flatMap(edge=>[edge.source,edge.target]))};
}
function syncResearchPins(){const path=currentResearch();state.pinnedIds=path.anchors;state.pinnedEdgeIds=path.pinnedEdges;}
function mappedProject(){
  const project=projects.get(state.projectId);
  return state.view==='network'&&!state.pinOverview&&isProjectMap(project,state.path)?project:null;
}
function atScopeFit(id){
  return !!id&&lastScopeFit?.id===id&&Math.abs(camera.x-lastScopeFit.x)<1&&Math.abs(camera.y-lastScopeFit.y)<1&&Math.abs(camera.z-lastScopeFit.z)<.001;
}
function rememberProjectPlace(edgeId,keepStep=false){
  const project=mappedProject();
  if(!project||state.selected||$('project-report').hidden)return;
  const dock=$('dock-content'),bounds=dock.getBoundingClientRect();
  const visible=bounds.height>0;
  const step=project.steps.find(item=>item.records.some(edge=>edge.id===edgeId));
  let row=step?$('project-step-'+step.id):null;
  if(!row&&(!visible||keepStep))row=$('project-step-'+state.projectStep);
  if(!row&&visible&&!keepStep){
    const rows=[...$('project-steps').children].filter(item=>{
      const rect=item.getBoundingClientRect();return rect.bottom>bounds.top+8&&rect.top<bounds.bottom-8;
    });
    row=rows.find(item=>item.dataset.projectStep===state.projectStep)||(dock.scrollTop>0?rows[0]:null);
  }
  state.projectStep=row?.dataset.projectStep||'';
  const top=row?.querySelector('h4').getBoundingClientRect().top;
  const offset=visible?(top>=bounds.top&&top<bounds.bottom-24?top-bounds.top:8):(state.projectPlace?.offset??8);
  const scroll=visible?Math.max(0,dock.scrollTop):(state.projectPlace?.scroll??0);
  state.projectPlace={project:project.id,offset,scroll,fitted:atScopeFit(project.id),
    camera:{...camera},dimensions:{...dimensions},positions:project.route.nodes.map(id=>{const p=positions.get(id);return [id,p.x,p.y];})};
}
function restoreProjectReading(focus=false){
  if(!mappedProject()||state.selected||$('project-report').hidden)return;
  const dock=$('dock-content'),place=state.projectPlace;
  const heading=$('project-step-'+state.projectStep)?.querySelector('h4');
  if(heading){
    const offset=Math.max(8,Math.min(place?.offset??8,dock.clientHeight-heading.offsetHeight-12));
    dock.scrollTop+=heading.getBoundingClientRect().top-dock.getBoundingClientRect().top-offset;
  }else dock.scrollTop=place?.scroll||0;
  if(focus)(heading||$('project-heading')).focus({preventScroll:true});
}
function arrangeProject(project){
  const ids=project.route.nodes;
  const center=ids.reduce((sum,id)=>{const point=naturalLayout.get(id);return {x:sum.x+point.x/ids.length,y:sum.y+point.y/ids.length};},{x:0,y:0});
  const coords=ids.map(id=>project.positions[id]);
  const offsetX=(Math.min(...coords.map(p=>p[0]))+Math.max(...coords.map(p=>p[0])))/2;
  const offsetY=(Math.min(...coords.map(p=>p[1]))+Math.max(...coords.map(p=>p[1])))/2;
  // Choose an orientation on opening, allowing room for the expanded reader.
  // Later divider changes frame these same world positions.
  const surfaceWidth=document.documentElement.clientWidth;
  const vertical=!desk.stacked&&surfaceWidth-Math.min(680,surfaceWidth*.55)<(innerHeight-120)*1.08;
  ids.forEach((id,index)=>{
    const x=coords[index][0]-offsetX,y=coords[index][1]-offsetY;
    positions.set(id,{x:center.x+(vertical?y*175:x*250),y:center.y+(vertical?x*195:y*155)});
  });
}
function scopeProject(project,place=null){
  resetFilters(false);
  state.projectId=project.id;state.projectStep='';state.projectPlace=place;state.mapMode='explore';state.customStart=false;
  state.exploreRoot=project.route.nodes[0];state.explorationSeeds=new Set(project.route.nodes);
  state.startingIds=new Set();state.exploredIds=new Set(project.route.nodes);state.openNodes=new Set();
  state.pinOverview=false;state.pinFrame=null;state.focusEntity='';state.focusType='';
  state.walk=[];state.trailNodes.clear();state.trailEdges.clear();state.collapsedNodes.clear();state.orbitIds.clear();
  state.path={nodes:[...project.route.nodes],edges:[...project.route.edges]};state.detailsOpen=true;
  if(place){
    for(const [id,x,y] of place.positions)if(project.route.nodes.includes(id))positions.set(id,{x,y});
  }else arrangeProject(project);
}
function openStarterProject(id,resume=false,finding=''){
  const project=projects.get(id);if(!project)return;
  const place=resume&&state.projectId===id?state.projectPlace:null;
  const step=resume&&state.projectId===id?state.projectStep:finding||(desk.stacked?project.steps[0].id:'');
  if(state.view!=='network')navigateSection('network');
  settleExpansion(false);rememberView();scopeProject(project,place);state.projectStep=step;
  desk.dismiss();desk.showRecord('evidence');render();
  if(place&&!place.fitted){
    const bounds=$('canvas-area').getBoundingClientRect();dimensions={width:bounds.width,height:bounds.height};
    camera=resizeCamera(place.camera,place.dimensions,dimensions);positionGraph();
  }else fitGraph();
  restoreProjectReading(true);
}
function networkGraph(){
  if(state.pinOverview&&state.research.steps.length){
    hiddenByDistance=0;
    return {...networkForPins({nodes,edges},currentResearch().pinnedEntities,state.pinnedEdgeIds),pinNetwork:true,matches:[]};
  }
  const available=connectedCanvas(filterGraph(state));let result=available;
  if(desk.phone&&isEmptyStart()&&state.mapMode==='explore'&&!state.bucketMode&&available.edges.length===edges.length){
    // Use the first four distinct city connections in published order. Keep their world positions.
    const ids=new Set(['city']);
    for(const edge of available.edges){
      if(edge.source==='city')ids.add(edge.target);
      if(edge.target==='city')ids.add(edge.source);
      if(ids.size===5)break;
    }
    hiddenByDistance=0;
    return {...exploredGraph(available,ids),phoneIntro:true,totalEntities:available.nodes.length};
  }
  if(state.path){const ids=new Set(state.path.nodes);result={...available,nodes:available.nodes.filter(node=>ids.has(node.id)),edges:available.edges.filter(edge=>state.path.edges.includes(edge.id))};}
  else if(state.tags.size)result=taggedGraph(available,state.tags);
  const roots=visibilityRoots(available);hiddenByDistance=0;
  if(!state.path&&roots.length){
    // Depth spans the filtered dataset, not only previously opened branches.
    if(!state.tags.size)result=available;
    const before=result.nodes.length;result=connectionNeighborhood(result,roots,state.connectionDistance);hiddenByDistance=before-result.nodes.length;
  }
  if(state.bucketMode&&state.bucketIds){const ids=state.bucketIds;result={...result,nodes:result.nodes.filter(node=>ids.has(node.id)),edges:result.edges.filter(edge=>ids.has(edge.source)&&ids.has(edge.target))};}
  return {...connectedCanvas(result),totalEntities:available.nodes.length};
}
function showAllPins(){
  if(!state.research.steps.length)return;
  if(desk.tool&&$('desk-body').dataset.overlay==='true')desk.closeTool(false);
  if(state.view!=='network')navigateSection('network');
  settleExpansion(false);
  if(!state.pinOverview){
    rememberView();state.pinFrame={camera:{...camera},dimensions:{...dimensions}};state.pinOverview=true;
  }
  desk.dismiss();render();moveCamera(fittedCamera());
}
function leavePins(remember=true){
  if(!state.pinOverview)return;
  settleExpansion(false);if(remember)rememberView();
  const previous=state.pinFrame;state.pinOverview=false;state.pinFrame=null;
  render();
  const rect=$('canvas-area').getBoundingClientRect();
  if(rect.width&&rect.height)dimensions={width:rect.width,height:rect.height};
  moveCamera(previous?resizeCamera(previous.camera,previous.dimensions,dimensions,positions.get(focusEntityId())):fittedCamera());
}
function visibilityRoots(available){
  const center=focusEntityId();
  const roots=state.multiNodes.size>1?[...state.multiNodes]:center?[center]:[...state.startingIds];
  const visible=new Set(available.nodes.map(node=>node.id));
  return roots.filter(id=>visible.has(id));
}
function prepareOrbitalBranch(id){
  if(state.bucketMode)return;const parent=state.walk.at(-1)?.id===id&&state.walk.at(-1)?.via?state.walk.at(-2)?.id:'';
  const branch=orbitalBranch(connectedCanvas(baseGraph()),id,positions,state.orbitIds,{parent});
  branch.positions.forEach((point,key)=>positions.set(key,{...point}));state.orbitIds=branch.placed;if(branch.positions.size)miniSignature='';
}
function retainExploredPath(to=''){
  const trail=extendTrail({nodes:state.trailNodes,edges:state.trailEdges},{nodes,edges},{from:focusEntityId(),to,path:state.path});state.trailNodes=trail.nodes;state.trailEdges=trail.edges;
}
function refreshMapScope(){state.selected=null;state.path=null;state.focus=false;hoveredNode=null;if(state.mapMode==='explore'&&!state.customStart)seedMap(topicRoots[state.caseId]||state.exploreRoot);applyCaseLayout();}
function toggleNode(id,{from='',via='',resume=false}={}){
  if(!nodeById.has(id))return;
  if(state.view!=='network')navigateSection('network');
  settleExpansion(false);rememberView('',via);rememberOpener();
  state.pinOverview=false;state.pinFrame=null;
  if(!baseGraph().nodes.some(node=>node.id===id)){
    resetFilters(false);toast('Showing all topics to include '+nodeById.get(id).name);
  }
  $('neighbor-choice').hidden=true;
  const firstStep=!state.walk.length;
  if(!resume)state.walk=appendWalk(state.walk,id,{from,via,edges});
  if(via){state.trailNodes.add(from);state.trailNodes.add(id);state.trailEdges.add(via);}
  state.multiNodes=new Set([id]);state.multiEdges.clear();state.selected={kind:'node',id};
  state.focus=true;state.focusEntity=id;state.focusType='';state.showDirect=!!via||resume||firstStep;state.detailsOpen=true;state.path=null;
  state.query='';desk.dismiss();$('neighbor-search').value='';desk.showRecord('connections');state.openNodes.add(id);state.explorationSeeds.add(id);state.startingIds=new Set([id]);
  hoveredNode=null;hideEntityTooltip();if(state.showDirect)prepareOrbitalBranch(id);render();
  focusExploration(id,state.showDirect);
}
function showDirectConnections(type=state.focusType||''){
  const id=state.selected?.kind==='node'?state.selected.id:focusEntityId();if(!id)return;
  rememberView();state.pinOverview=false;state.pinFrame=null;state.focus=true;state.focusEntity=id;state.focusType=type;state.showDirect=true;state.connectionDistance=1;
  desk.showRecord('connections');state.walk=appendWalk(state.walk,id,{edges});state.trailNodes.add(id);prepareOrbitalBranch(id);render();focusExploration(id,true);
}

function animateFocusChange(change,id=focusEntityId(),remember=true){
  settleExpansion(false);if(remember)rememberView();change();if(state.view!=='network')setView('network');else render();
  positionGraph();scheduleWorkspaceState();
}
function settleExpansion(finish=true){
  stopCameraMotion();
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
function renderConnectionLegend(){
  const scene=false,displayed=graph.edges.filter(edge=>semanticEdges.has(edge.id));
  const signature=displayed.map(edge=>edge.id).join(',')+'|'+[...state.relationships].join(',')+'|'+state.connectionMode+'|'+focusEntityId()+'|'+state.focusType;if(signature===legendSignature)return;legendSignature=signature;
  const unfiltered=graph.pinNetwork?graph:filterGraph({...state,query:'',relationships:new Set(Object.keys(relationships)),connectionMode:'all'}),center=focusEntityId(),shown=new Set(graph.nodes.map(node=>node.id));
  const relevant=unfiltered.edges.filter(edge=>center?edge.source===center||edge.target===center:shown.has(edge.source)||shown.has(edge.target));
  const modeTypes=connectionModesForLegend();
  const shortLabels={leadership:'Leadership',board:'Boards',control:'Control',candidacy:'Candidates',ownership:'Ownership',voting:'Voting',affiliation:'Affiliation',partnership:'Programs',history:'Past affiliation',money:'Money',funding:'Funding',contract:'Contracts',influence:'Public benefits',lobbying:'Lobbying',endorsement:'Support',opposition:'Opposition',content:'Media',editorial:'Editorial',allegation:'Allegations'};
  $('legend-types').innerHTML=connectionGroups.flatMap(group=>group.types).map(id=>{const count=displayed.filter(edge=>edge.type===id).length,available=relevant.filter(edge=>edge.type===id).length,enabled=!!count||state.relationships.has(id)&&(!modeTypes||modeTypes.includes(id))&&(!center||!state.focusType||state.focusType===id);if(!count&&(enabled||!available))return '';return '<li data-legend-type="'+id+'" title="'+escape(relationships[id].label)+'" class="'+(!enabled?'legend-filtered':'')+'"><span class="legend-line" style="--color:'+relationships[id].color+'" aria-hidden="true"></span><span class="legend-type-label">'+escape(relationships[id].label)+'</span><small>'+(!enabled?available+' hidden':count)+'</small>'+(!enabled?'<button class="legend-show" data-show-type="'+id+'" aria-label="Show '+escape(relationships[id].label)+'">Show</button>':'')+'</li>';}).join('');
}
function connectionModesForLegend(){return {ownership:['ownership','voting'],governance:['board','control'],leadership:['leadership'],money:['money','funding','contract','influence'],content:['content','affiliation','editorial']}[state.connectionMode]||null;}
function renderConnectionKey(){const displayed=graph.edges.filter(edge=>semanticEdges.has(edge.id));$('legend-key').textContent=displayed.length?[displayed.some(edge=>edge.directional)?'Arrow = direction':'',displayed.some(edge=>edge.historical)?'Dashed = past':''].filter(Boolean).join(' · '):'Connections appear as you explore.';}
function renderMapScope(){
  renderCampaignCoverage();
  const anchor=expansionAnchor();
  $('map-scope').hidden=!!state.tags.size||!nodeById.has(anchor);$('map-scope').textContent=nodeById.has(anchor)?nodeById.get(anchor).name+' · Details':'';
  $('map-scope').setAttribute('aria-expanded',String(!$('inspector').hidden));
  $('map-full').hidden=state.view!=='network'||!graph.pinNetwork&&state.mapMode==='full'&&!state.focus&&!state.path;
  $('map-full').textContent=state.caseId==='all'?'Browse network overview':'Browse topic overview';

  const roots=visibilityRoots(connectedCanvas(baseGraph()));document.querySelector('.distance-control').hidden=false;
  $('connection-distance').disabled=!!graph.pinNetwork||!!state.path||!roots.length;
  $('connection-distance').value=state.connectionDistance==='all'?'7':String(state.connectionDistance);
  $('connection-distance').setAttribute('aria-valuetext',state.connectionDistance==='all'?'Show all':state.connectionDistance+' connection step'+(state.connectionDistance===1?'':'s'));
  $('distance-value').textContent=state.connectionDistance==='all'?'Show all':state.connectionDistance===1?'1 · Direct links':state.connectionDistance+' steps';
  $('distance-summary').textContent=graph.pinNetwork?'The pin overview includes every research pin.':state.path?'Showing the selected path. Choose an entity to adjust visibility.':roots.length?(state.connectionDistance==='all'?'All entities in the current filters.':state.connectionDistance+' connection step'+(state.connectionDistance===1?'':'s')+' from '+roots.map(id=>nodeById.get(id).name).join(' + ')+'.')+' '+graph.nodes.length+' entities shown.':'Choose an entity to adjust visibility, or show all.';
  $('canvas-color-mode').value=state.colorMode;$('party-color-key').hidden=state.colorMode!=='party';
  document.body.dataset.canvasColors=state.colorMode;
  $('legend-context').textContent=focusEntityId()||state.path?'Select a connection on the map or in Details to read its evidence.':semanticEdges.size?'Only connections between visible entities are drawn.':'Overview: choose an entity to explore its connections.';
  $('connection-legend').querySelector('h2').textContent='Legend & visibility';
  $('fit').title='Fit the current network without rearranging entities';$('fit').setAttribute('aria-label','Fit the network');
  renderConnectionLegend();syncFilterGroups();
  renderConnectionKey();
  $('indirect-key').hidden=!indirectRoutes.length;
  const chosen=[...state.startingIds].filter(id=>nodeById.has(id)).map(id=>nodeById.get(id).name);
  $('starting-summary').textContent=chosen.length?'Starting with '+chosen.join(' + ')+(indirectRoutes.length?' · '+indirectRoutes.length+' indirect path'+(indirectRoutes.length===1?'':'s')+' to explore':'')+(comparison.disconnected.length?' · '+comparison.disconnected.length+' pair'+(comparison.disconnected.length===1?'':'s')+' with no route in these filters':''):'';

}

function renderIndirectRoutes(){
  const shown=new Set(graph.nodes.map(node=>node.id));
  comparison=startingConnections(baseGraph(),state.startingIds);
  indirectRoutes=state.view==='network'&&!graph.pinNetwork&&!(state.path&&state.research.steps.length)?comparison.indirect.filter(route=>shown.has(route.from)&&shown.has(route.to)&&!route.nodes.every(id=>shown.has(id))):[];
  $('route-layer').replaceChildren();routeEls.clear();
  indirectRoutes.forEach((route,index)=>{
    const group=svgEl('g',{class:'indirect-route',role:'button',tabindex:'0','data-route':index,'aria-label':`Show path from ${nodeById.get(route.from).name} to ${nodeById.get(route.to).name}, ${route.edges.length} recorded links`}),line=svgEl('path',{class:'indirect-line'});
    const hit=svgEl('path',{class:'indirect-hit'});
    const label=svgEl('text',{class:'indirect-label'});label.textContent=route.edges.length+' links · '+(state.path?'Show another path':'Show path');
    group.append(line,hit,label);$('route-layer').append(group);routeEls.set(index,{line,hit,label,route});
  });
}
function showExplorationPath(route,startingIds=null,{trace=true}={}){
  if(!route)return;
  if(state.view!=='network')navigateSection('network');
  settleExpansion(false);rememberView();
  const trail=extendTrail({nodes:state.trailNodes,edges:state.trailEdges},{nodes,edges},{path:route});state.trailNodes=trail.nodes;state.trailEdges=trail.edges;
  state.pinOverview=false;state.pinFrame=null;
  if(startingIds)state.startingIds=new Set(startingIds);
  state.query='';desk.dismiss();state.selected=null;state.focus=false;state.path=route;
  state.customStart=false;state.multiNodes.clear();state.multiEdges.clear();
  if(trace)state.walk=route.nodes.map((id,i)=>({id,via:i?route.edges[i-1]:''}));
  state.tags.clear();render(true);
  toast(route.edges.length+' recorded '+(route.edges.length===1?'link':'links')+' in this path');
}
function launchPanel(name){
  const fromEntry=document.body.dataset.landing==='true';
  if(name==='path')openPathFinder();
  else{if(name==='research')researchUI?.refreshLibrary();desk.setPanel(name);}
  if(fromEntry&&graph)fitGraph();
}
function inspectSource(id){
  if(!sourceById.has(id))return;
  rememberView();rememberOpener();state.multiNodes.clear();state.multiEdges.clear();
  state.detailsOpen=true;state.selected={kind:'source',id};
  desk.showRecord('evidence');render();revealInspector();
}
function chooseSearchResult(result){
  if(result.kind==='project'){openStarterProject(result.id,false,result.step);return;}
  if(result.kind==='entity'){toggleNode(result.id);focusRecordHeading();return;}
  if(result.kind==='tag'){applyTag(result.id,{toggle:false});return;}
  if(result.kind==='source'){inspectSource(result.id);return;}
  if(result.kind==='investigation'){
    const report=investigations.find(item=>item.id===result.id);
    if(report)window.open(report.href,'_blank','noopener,noreferrer');
    return;
  }
  if(result.kind==='edge'){
    if(document.body.dataset.landing==='true'||desk.phone&&isEmptyStart())showConnectionOnMap(result.id);
    else selectEdge(result.id);
    focusRecordHeading();return;
  }
  const command=deskCommands.find(item=>item.id===result.id);
  if(!command)return;
  if(command.panel){
    launchPanel(command.panel);
    let control=command.target&&$(command.target);
    if(control?.closest('#settings-selection[hidden]'))control=$('open-network-tools');
    if(control){
      for(let parent=control.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
      control.focus({preventScroll:true});control.scrollIntoView({block:'nearest'});
    }
  }else if(command.id==='download')openDataDownload();
  else if(command.id==='show-pins')showAllPins();
  else if(command.id==='finance')document.querySelector('[data-campaign-money]').click();
  else window.parent.postMessage({channel:'columbus-explorer',type:'workspace-action',action:command.id},location.origin);
}
function focusRecordHeading(){
  const heading=desk.section==='connections'&&state.selected?.kind==='node'?$('popover-name'):$('inspector').querySelector('h2');
  if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
}

function recordHref(kind,id){return escape(recordURL(location.href,kind,id,release.releaseId));}
function plainLinkClick(event){return event.button===0&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey&&!event.defaultPrevented;}
function sourceTitleLink(source){
  return `<a class="citation-title citation-original" href="${escape(source.url)}" target="_blank" rel="noopener noreferrer" aria-label="${escape(source.title)} (opens in a new tab)">${escape(source.title)}</a>`;
}
function alternateSourceLinks(source){
  const testimony=hearingTestimony[source.id];
  const archiveDate=source.archiveTimestamp?.slice(0,8);
  const date=archiveDate?friendlyDate(archiveDate.slice(0,4)+'-'+archiveDate.slice(4,6)+'-'+archiveDate.slice(6)):'';
  if(!testimony&&!source.archiveUrl)return '';
  return `<div class="citation-actions">${testimony?hearingLink(testimony):''}
    ${source.archiveUrl?`<a class="citation-archive" href="${escape(source.archiveUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Archived copy of ${escape(source.title)}" title="Wayback snapshot ${escape(date)}">Archived copy</a>`:''}</div>`;
}
const shortSourceTitles={'flock-contract-2024':'Columbus camera lease ordinance','city-lobbyists-2025':'Columbus city bulletin (PDF)','nwsl-agreement-2026':'City’s soccer development agreement','nwsl-ownership':'Columbus women’s soccer franchise announcement'};
function hearingLink(testimony){
  return `<a class="claim-ref" href="${plateReaderHearing}#:~:text=${encodeURIComponent(testimony.witness)}" target="_blank" rel="noopener noreferrer">View the House hearing and witness list</a>`;
}
function investigationLink(recordId){
  const report=investigations.find(item=>item.records.includes(recordId)||item.relatedRecords?.[recordId]);
  if(!report)return '';
  const label=escape(report.relatedRecords?.[recordId]||`Related ${report.category||'investigation'}`);
  return `<aside class="related-investigation" aria-label="${label}"><span>${label}</span><a href="${escape(report.href)}" target="_blank" rel="noopener noreferrer" aria-label="${escape(report.title)} (opens in a new tab)">${escape(report.title)}</a></aside>`;
}
function citationRefs(ids){
  return [...new Set(ids)].map(id=>{
    const source=sourceById.get(id),testimony=hearingTestimony[id];
    const text=testimony?.download||shortSourceTitles[id]||source.title;
    return `<a class="claim-ref" href="${escape(source.url)}" target="_blank" rel="noopener noreferrer" title="${escape(source.publisher+' · '+source.title)}">${escape(text)}</a>${testimony?` <span class="testimony-pages">${escape(testimony.pages)}</span>`:''}`;
  }).join(' ');
}
function entitySummaryHTML(node,includeSources=true) {
  const summary=entitySummaries.get(node.id);
  if(!summary)return '';
  const edge=summary.edge;
  const context=edge?`<div class="summary-context">${statusBadge(edge)} <a href="${recordHref('edge',edge.id)}" target="_top" data-edge="${escape(edge.id)}">${escape(nodeById.get(edge.source).name)} · ${escape(nodeById.get(edge.target).name)}</a></div>`:'';
  return `<section class="entity-intro" aria-label="About ${escape(node.name)}">
    <p class="intro-statement">${escape(summary.text)}</p>${context}
    ${includeSources?`<div class="intro-sources"><span class="source-caption">${summary.sourceIds.length===1?'Source':'Sources'}</span>${citationRefs(summary.sourceIds)}</div>`:''}
  </section>`;
}
function sourceLinks(ids,owner='',entries=[],sharedLocator=''){
  const ordered=[...new Set(ids)];
  return ordered.map(id=>{
    const source=sourceById.get(id),target=owner?` id="${escape('cite-'+owner+'-'+id)}"`:'';
    const locators=[...new Set(entries.filter(entry=>entry.sourceId===id).map(entry=>entry.locator).filter(place=>place&&place!==sharedLocator))];
    return `<article class="citation-card" data-cited-source="${escape(id)}"${target}>
      ${sourceTitleLink(source)}
      <div class="citation-publisher">${escape(source.publisher)} · ${escape(friendlyDate(source.date))}</div>
      ${alternateSourceLinks(source)}
      ${locators.map(place=>`<p class="citation-locator">${escape(place)}</p>`).join('')}
    </article>`;
  }).join('');
}
function evidenceBlock(edge){
  const ids=edge.sourceIds,owner='edge-'+edge.id;
  const locator=readerField(edge,'locator');
  return `<section class="evidence-box cited-claim" aria-label="Evidence and cited sources">
    <p class="claim-text">${escape(readerField(edge,'evidence'))}</p>
    ${edge.context?`<p class="record-context">${escape(readerField(edge,'context'))}</p>`:''}
    <div class="claim-source-block"><h3 class="citation-heading">${ids.length===1?'Source':'Sources'}</h3>
      ${sourceLinks(ids,owner,edge.evidenceEntries||[],edge.locator)}
      ${locator?`<p class="citation-locator">${escape(locator)}</p>`:''}
    </div>
  </section>`;
}

const adjacent = (id, list = graph.edges) => list.filter(e => e.source === id || e.target === id);
const other = (edge, id) => edge.source === id ? edge.target : edge.source;
const statusBadge = e => `<span class="status-badge status-${e.status}">${escape(evidenceStatuses[e.status] || e.status)}</span>`;
function connectionRow(edge,id){
  const who=id?nodeById.get(other(edge,id)).name:`${nodeById.get(edge.source).name} ${edge.directional?'to':'and'} ${nodeById.get(edge.target).name}`;
  return `<div class="connection-row"><a href="${recordHref('edge',edge.id)}" target="_top" data-edge="${edge.id}">${escape(readerField(edge,'label'))}</a><span>${escape(who)}</span>${edge.caseId?`<small>${escape(evidenceStatuses[edge.status])}</small>`:''}</div>`;
}

function applyCaseLayout(){settleExpansion(false);}
function setCase(id,{keepRecord=false}={}) {
  desk.dismiss();
  state.customStart=id==='campaigns2026';
  state.caseId = id; state.mapMode=id==='campaigns2026'?'full':'explore';state.exploredIds=new Set();state.exploreRoot=topicRoots[id]||'city';state.query='';$('search').value='';$('list-search').value='';state.path=null;
  if(!keepRecord){state.selected=null;state.focus=false;}
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
  if(state.from||state.to)chips.push(['dates',(state.from||'Any date')+' to '+(state.to||'Any date')]);
  if(!state.history)chips.push(['history','Past records hidden']);
  if(!state.includeUncertain&&(state.from||state.to))chips.push(['uncertain','Known dates only']);
  $('active-filters').hidden=!chips.length;
  $('active-filters').innerHTML=chips.map(([key,label])=>'<button data-clear-filter="'+key+'" aria-label="Remove '+escape(label)+' filter">'+escape(label)+' <span aria-hidden="true">×</span></button>').join('');
}
function updateTagWindowSpace(){
  document.body.dataset.hasTags=String(state.view==='network'&&!!state.tags.size);
}
$('active-filters').addEventListener('click',event=>{
  const button=event.target.closest('[data-clear-filter]');if(!button)return;
  rememberView();const key=button.dataset.clearFilter;
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
  render();
});

function svgEl(tag, attributes = {}) { const el = document.createElementNS(svgNS, tag); for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, value); return el; }
function emphasizeConnection(id,event){
  if(id&&(drag||cameraMotion))return;
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
  const tooltip=$('entity-tooltip');if(!entityTooltipId||!semanticNodes.has(entityTooltipId)||state.view!=='network'||entityTooltipId===focusEntityId()){tooltip.hidden=true;return;}
  tooltip.hidden=false;const surface=$('canvas-area').getBoundingClientRect(),core=nodeEls.get(entityTooltipId).core.getBoundingClientRect();
  const x=event?.clientX!==undefined?event.clientX-surface.left:(core.left+core.right)/2-surface.left,y=event?.clientY!==undefined?event.clientY-surface.top:core.top-surface.top;
  tooltip.style.left=Math.max(8,Math.min(dimensions.width-tooltip.offsetWidth-8,x-tooltip.offsetWidth/2))+'px';
  const above=y-tooltip.offsetHeight-12;tooltip.style.top=Math.max(8,Math.min(dimensions.height-tooltip.offsetHeight-8,above>=8?above:core.bottom-surface.top+12))+'px';
}
// Reparenting a focused SVG element drops its keyboard focus in Chromium.
function bringForward(entry){
  const group=entry?.group,parent=group?.parentElement;
  if(parent&&parent.lastElementChild!==group&&!group.contains(document.activeElement))parent.append(group);
}
function raisePathForeground(){
  const explored=exploredForeground();
  for(const id of explored.edges){const edge=edgeEls.get(id),icon=connectionIcons.get(id);if(edge?.group.style.display!=='none')bringForward(edge);if(icon?.group.style.display!=='none')bringForward(icon);}
  for(const id of explored.nodes){const node=nodeEls.get(id);if(node?.group.style.display!=='none')bringForward(node);}
}
function positionConnectionBadges(){
  if(mappedProject())return;
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
  for(const [id,color] of Object.entries(partyColors)){
    const marker=svgEl('marker',{id:'arrow-party-'+id,viewBox:'0 0 8 8',refX:'8',refY:'4',markerUnits:'userSpaceOnUse',orient:'auto'});
    marker.append(svgEl('path',{d:'M0,0 L8,4 L0,8 Z',fill:color}));defs.append(marker);markerEls.set('party-'+id,marker);
  }
  $('graph').prepend(defs);
  edges.forEach(e => {
    const a = nodeById.get(e.source), b = nodeById.get(e.target);
    const group = svgEl('g');
    const line = svgEl('path', { class: `graph-edge${e.caseId ? ' case-link' : ''}`, stroke: relationships[e.type].color, ...(e.historical ? { 'stroke-dasharray': '5 5' } : {}), ...(e.directional ? {'marker-end':`url(#arrow-${e.type})`} : {}) });
    const hit = svgEl('path', { class: 'edge-hit', role: 'button', tabindex: '0', 'data-edge': e.id, 'aria-label': `Relationship: ${a.name} to ${b.name}, ${readerField(e,'label')}${e.historical ? ', historical' : ''}` });
    const title = svgEl('title'); title.textContent = `${relationships[e.type].label} · ${a.name} ${e.directional?'to':'and'} ${b.name}: ${readerField(e,'label')}`; hit.append(title);
    const graphLabels={e45:'Power of attorney',e46:'Managed finances',e47:'Trustee 1992–2007',e49:'Spending control',e51:'Political control',e54:'Passage / repeal blockade',e55:'AEP benefit',e57:'Sole shareholder',e58:'Foundation link',e59:'$34.28m in shares',e60:'$12.38m in assets',e61:'Founded 2007',e62:'Misappropriation claim'};
    const label = svgEl('text', {class:'edge-label',fill:relationships[e.type].color,'data-edge':e.id,'aria-hidden':'true'}); label.textContent=graphLabels[e.id]||e.amountLabel||e.graphLabel||'';
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
    group.addEventListener('pointerenter',event=>{if(event.pointerType==='touch'||drag||cameraMotion)return;hoveredNode=n.id;renderGraph();if(state.selected?.kind!=='node'||state.selected.id!==n.id)showEntityTooltip(n.id,event);});
    group.addEventListener('pointermove',positionEntityTooltip);
    group.addEventListener('pointerleave',()=>{if(drag)return;if(group.contains(document.activeElement)){positionEntityTooltip();return;}hoveredNode=null;hideEntityTooltip();renderGraph();});
    group.addEventListener('focusin',()=>{hoveredNode=n.id;renderGraph();if(state.selected?.id!==n.id)showEntityTooltip(n.id);});
    group.addEventListener('focusout',event=>{if(group.contains(event.relatedTarget)||group.matches(':hover'))return;hoveredNode=null;hideEntityTooltip();renderGraph();});
  });
  $('graph').addEventListener('click', event => {
    if (suppressClick&&event.detail!==0) { suppressClick = false; return; }
    const pin=event.target.closest('[data-pin]');if(pin){togglePin(pin.dataset.pin);return;}
    const target = event.target.closest('[data-node],[data-edge],[data-route]');
    if(!target||!desk.phone)desk.focusWidth(false);
    if(target?.dataset.route!==undefined)showExplorationPath(indirectRoutes[Number(target.dataset.route)]);
    else if (target?.dataset.node) selectRecord('node',target.dataset.node,event.ctrlKey||event.metaKey);
    else if (target?.dataset.edge) selectRecord('edge',target.dataset.edge,event.ctrlKey||event.metaKey);
    else if (!target) positionGraph();
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
  const touches=new Map();
  let multiTouch=false,pinch=null;
  function touchSpan(){
    const [a,b]=touches.values(),rect=$('graph').getBoundingClientRect();
    return {x:(a.x+b.x)/2-rect.left,y:(a.y+b.y)/2-rect.top,distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y))};
  }
  $('graph').addEventListener('pointerdown', event => {
    if (![0,1].includes(event.button)) return;
    suppressClick=false;
    const pin=event.target.closest('[data-pin]');
    if(event.pointerType==='touch'){
      touches.set(event.pointerId,{x:event.clientX,y:event.clientY});
      $('graph').setPointerCapture(event.pointerId);
      if(touches.size>1||multiTouch){
        event.preventDefault();settleExpansion(false);drag=null;multiTouch=true;
        pinch=touches.size===2?touchSpan():null;clearMarquee();hideEntityTooltip();$('graph').dataset.panning='true';return;
      }
    }else if(pin)return;
    stopCameraMotion();
    const target = event.target.closest('[data-node],[data-edge],[data-route]');
    const pan=event.pointerType==='touch'||spaceToPan||event.button===1||(!boxSelectMode&&!event.shiftKey&&!event.altKey);
    drag = { pan,route:target?.dataset.route,id:target?.dataset.node,edge:target?.dataset.edge, box:!pan&&(event.shiftKey||!target?.dataset.node&&target?.dataset.route===undefined&&boxSelectMode),additive:event.ctrlKey||event.metaKey,pointer: event.pointerId, startX: event.clientX, startY: event.clientY, lastX: event.clientX, lastY: event.clientY, moved: false };
    drag.screenToCanvas=$('graph').getScreenCTM().inverse();
    drag.pin=pin?.dataset.pin;
    hideEntityTooltip();
    $('graph').dataset.panning=String(pan||!boxSelectMode);
    event.preventDefault();
    $('graph').setPointerCapture(event.pointerId);
  });
  $('graph').addEventListener('pointermove', event => {
    if(touches.has(event.pointerId)){
      touches.set(event.pointerId,{x:event.clientX,y:event.clientY});
      if(multiTouch){
        if(pinch&&touches.size===2){
          const next=touchSpan();
          camera.x+=next.x-pinch.x;camera.y+=next.y-pinch.y;
          zoom(next.distance/pinch.distance,next.x,next.y);pinch=next;
        }
        return;
      }
    }
    if (!drag || drag.pointer !== event.pointerId) return;
    const dx = event.clientX - drag.lastX, dy = event.clientY - drag.lastY;
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 4) drag.moved = true;
    if (drag.moved) {
      if(!drag.stoppedAnimation){settleExpansion(false);drag.stoppedAnimation=true;}
      if(drag.box){const bounds=marqueeBounds(drag.startX,drag.startY,event.clientX,event.clientY),box=$('selection-box');box.removeAttribute('hidden');box.setAttribute('x',bounds.left);box.setAttribute('y',bounds.top);box.setAttribute('width',bounds.right-bounds.left);box.setAttribute('height',bounds.bottom-bounds.top);$('graph').dataset.selecting='true';previewMarquee(bounds);}
      else if (drag.id&&!drag.pan) { const moving=state.multiNodes.has(drag.id)?state.multiNodes:new Set([drag.id]);for(const id of moving){const p=positions.get(id);p.x+=dx/camera.z;p.y+=dy/camera.z;} }
      else { camera.x += dx; camera.y += dy; }
      if(!drag.box){if(drag.id&&!drag.pan)positionGraph();else{$('graph-world').setAttribute('transform',`translate(${camera.x} ${camera.y}) scale(${camera.z})`);updateOverviewViewport();}}
    }
    drag.lastX = event.clientX; drag.lastY = event.clientY;
  });
  $('graph').addEventListener('pointerup', event => {
    touches.delete(event.pointerId);
    if(multiTouch){
      pinch=null;multiTouch=touches.size>0;suppressClick=true;
      $('graph').dataset.panning=String(multiTouch);scheduleWorkspaceState();return;
    }
    if (!drag||drag.pointer!==event.pointerId) return;
    if(drag.moved&&drag.box){
      const box=marqueeBounds(drag.startX,drag.startY,event.clientX,event.clientY),candidates=marqueeEntities(box);
      rememberView();if(!drag.additive){state.multiNodes.clear();state.multiEdges.clear();}
      for(const id of candidates)state.multiNodes.add(id);
      for(const id of semanticEdges){const edge=edgeById.get(id);if(candidates.size){if(candidates.has(edge.source)&&candidates.has(edge.target))state.multiEdges.add(id);continue;}const path=edgeEls.get(id).hit,length=path.getTotalLength();let previous=null;for(let i=0;i<=24;i++){const p=path.getPointAtLength(length*i/24),point={x:camera.x+p.x*camera.z,y:camera.y+p.y*camera.z};if(previous&&segmentInBox(previous,point,box)){state.multiEdges.add(id);break;}previous=point;}}
      clearMarquee();showSelection();
    }
    if(drag.moved){suppressClick=true;if(drag.id&&!drag.pan)miniSignature='';if(!drag.box)positionGraph();scheduleWorkspaceState();}
    // Pointer capture retargets the click to the canvas; activate a stationary node here.
    else if(drag.pin){togglePin(drag.pin);suppressClick=true;}
    else if(drag.route!==undefined){showExplorationPath(indirectRoutes[Number(drag.route)]);suppressClick=true;}
    else if (drag.id) { selectRecord('node',drag.id,drag.additive); suppressClick = true; }
    else if (drag.edge) { selectRecord('edge',drag.edge,drag.additive); suppressClick = true; }
    if(!drag.moved&&event.button===0&&(!desk.phone||!drag.pin&&!drag.id&&!drag.edge&&drag.route===undefined))desk.focusWidth(false);
    drag = null;
    $('graph').dataset.panning='false';
    if ($('graph').hasPointerCapture(event.pointerId)) $('graph').releasePointerCapture(event.pointerId);
  });
  function cancelPointer(event){
    if(!touches.delete(event.pointerId)&&drag?.pointer!==event.pointerId)return;
    drag=null;pinch=null;multiTouch=touches.size>0;suppressClick=true;
    clearMarquee();$('graph').dataset.panning=String(multiTouch);
  }
  $('graph').addEventListener('pointercancel',cancelPointer);
  $('graph').addEventListener('lostpointercapture',cancelPointer);
  $('graph').addEventListener('wheel', event => {
    event.preventDefault(); const rect = $('graph').getBoundingClientRect();
    zoom(Math.exp(-event.deltaY * .0015), event.clientX - rect.left, event.clientY - rect.top);
  }, { passive: false });
  new ResizeObserver(entries => {
    const rect = entries[0].contentRect;
    if (!rect.width || !rect.height) return;
    if(rect.width<1||rect.height<1||Math.abs(rect.width-dimensions.width)<1&&Math.abs(rect.height-dimensions.height)<1)return;
    settleExpansion(false);
    const next={width:rect.width,height:rect.height};
    const stillFitted=atScopeFit(graph?.pinNetwork?'pins':mappedProject()?.id);
    camera=stillFitted?fittedCamera():resizeCamera(camera,dimensions,next,positions.get(focusEntityId()));dimensions=next;
    positionGraph();if(graph)renderMapScope();
  }).observe($('canvas-area'));
}

function mapObstacles(){
  const canvas=$('canvas-area').getBoundingClientRect();
  const panels=desk.phone?[...document.querySelectorAll('#phone-sheet,#phone-menu,#phone-search,#phone-notice,#phone-map-controls')]:[$('map-status'),document.querySelector('.graph-controls')];
  if($('desk-body').dataset.dock==='floating')panels.push($('record-dock'));
  return panels.filter(el=>el.getClientRects().length).map(el=>{
    const r=el.getBoundingClientRect();
    return {left:r.left-canvas.left-6,top:r.top-canvas.top-6,right:r.right-canvas.left+6,bottom:r.bottom-canvas.top+6};
  });
}
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
  if(entry.labelKey!==labelKey){bubbleTextMeasure.font='700 '+style.font+'px '+getComputedStyle(document.documentElement).getPropertyValue('--sans');const lines=style.fullName?style.fullLines:style.bubble?(style.radius<19?[initials(nodeById.get(id))]:bubbleLabel(nodeById.get(id).name,style.radius,style.font,text=>bubbleTextMeasure.measureText(text).width)):entry.normalLines;entry.label.replaceChildren(...lines.map(line=>{const span=svgEl('tspan',{x:0});span.textContent=line;return span;}));entry.labelKey=labelKey;}
  entry.label.style.fontSize=style.font+'px';entry.label.style.fontWeight=protectedNode?'700':'500';entry.label.querySelectorAll('tspan').forEach((span,index)=>span.setAttribute('dy',index?String(style.font*1.12):'0'));
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
  if(graph.phoneIntro||graph.pinNetwork||state.path){
    const project=mappedProject(),space=explorationViewport();
    const padding=graph.phoneIntro?Math.min(70,space.width*.2,space.height*.2):project?Math.max(20,Math.min(88,space.width/5,space.height/5)):Math.max(10,Math.min(44,space.width/7,space.height/7));
    const fit=frameNetwork(graph.nodes.map(node=>node.id),positions,{width:space.width,height:space.height,padding});
    const result={x:fit.x+space.left,y:fit.y+space.top,z:fit.z};
    if(project||graph.pinNetwork)lastScopeFit={id:project?.id||'pins',...result};
    return result;
  }
  if(state.bucketMode)return fitBucketCamera();
  $('bucket-layer').replaceChildren();focusPorts.clear();focusMenuRect=null;cloudNeedsFit=false;
  return frameNetwork(graph.nodes.map(node=>node.id),positions,dimensions);
}

function repairFocusedPlacement(){}

function fitGraph() {
  settleExpansion();camera=fittedCamera();positionGraph();repairFocusedPlacement();
}
function stopCameraMotion(){if(cameraMotion){cancelAnimationFrame(cameraMotion.frame);cameraMotion=null;}}
function moveCamera(target){
  stopCameraMotion();emphasizeConnection(null);hideEntityTooltip();if(matchMedia('(prefers-reduced-motion:reduce)').matches){camera=target;positionGraph();scheduleWorkspaceState();return;}
  const start={...camera},began=performance.now(),motion={frame:null,target};cameraMotion=motion;
  const step=now=>{if(cameraMotion!==motion)return;const t=Math.min(1,(now-began)/180),ease=1-(1-t)**3;
    camera={x:start.x+(target.x-start.x)*ease,y:start.y+(target.y-start.y)*ease,z:start.z*Math.pow(target.z/start.z,ease)};positionGraph();
    if(t<1)motion.frame=requestAnimationFrame(step);else{cameraMotion=null;scheduleWorkspaceState();}
  };motion.frame=requestAnimationFrame(step);
}
function explorationViewport(){
  if(desk.phone){
    const canvas=$('canvas-area').getBoundingClientRect(),sheet=$('phone-sheet').getBoundingClientRect();
    const top=Math.max(8,$('phone-controls').getBoundingClientRect().bottom-canvas.top+8);
    const bottom=Math.max(top+1,sheet.top-canvas.top-10),left=12,right=Math.max(left+1,canvas.width-12);
    return {left,top,right,bottom,width:right-left,height:bottom-top};
  }
  return explorationSpace(dimensions.width,dimensions.height,mapObstacles(),desk.stacked);
}
function focusExploration(id,direct=false){
  if(state.view!=='network')return;
  // Opening docked Details changes the canvas synchronously. Use its new size
  // now so ResizeObserver does not cancel this flight on the following frame.
  const bounds=$('canvas-area').getBoundingClientRect();if(bounds.width&&bounds.height)dimensions={width:bounds.width,height:bounds.height};
  const viewport=explorationViewport(),p=positions.get(id);if(!p)return;
  let target,focusIds=new Set([id]);if(direct){const ids=directConnections(graph,id,state.focusType).nodes,previous=state.walk.at(-1)?.id===id&&state.walk.at(-1)?.via?state.walk.at(-2)?.id:null;if(previous&&positions.has(previous))ids.add(previous);focusIds=ids;const fit=frameNetwork(ids,positions,{width:viewport.width,height:viewport.height,padding:75}),z=Math.min(state.orbitIds.size?1.1:.85,fit.z),cx=(viewport.width/2-fit.x)/fit.z,cy=(viewport.height/2-fit.y)/fit.z;target={z,x:viewport.width/2-cx*z,y:viewport.height/2-cy*z};}
  else target=entityFocusCamera(p,camera,viewport);
  if(direct){target.x+=viewport.left;target.y+=viewport.top;}
  const blocks=mapObstacles();
  // The selected record already fits the open space; do not let branch fitting
  // dilute a plain click's focus zoom. Only expanded branches need that fitting.
  moveCamera(direct?clearNodeCamera(target,focusIds,positions,{...dimensions,obstacles:blocks,center:{x:viewport.left+viewport.width/2,y:viewport.top+viewport.height/2}}):target);
}
function centerOnEntity(id){focusExploration(id,true);}

function zoom(factor,x=null,y=null){
  if(x===null||y===null){const anchor=positions.get(focusEntityId()),viewport=explorationViewport();x=anchor?camera.x+anchor.x*camera.z:viewport.left+viewport.width/2;y=anchor?camera.y+anchor.y*camera.z:viewport.top+viewport.height/2;}
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

function placeProjectCaption(entry,occupied,viewport){
  const {start,control,end}=entry.route;
  for(const offset of [-9,17,-25,33,-43,51]){
    for(const t of [.5,.38,.62,.27,.73]){
      const u=1-t,x=u*u*start.x+2*u*t*control.x+t*t*end.x;
      const y=u*u*start.y+2*u*t*control.y+t*t*end.y+offset/camera.z;
      entry.label.setAttribute('transform',`translate(${x} ${y}) scale(${1/camera.z})`);
      const rect=entry.label.getBoundingClientRect();
      const box={left:rect.left-viewport.left,right:rect.right-viewport.left,top:rect.top-viewport.top,bottom:rect.bottom-viewport.top};
      if(box.left<3||box.top<3||box.right>viewport.width-3||box.bottom>viewport.height-3||occupied.some(other=>overlaps(box,other,5)))continue;
      occupied.push(box);return;
    }
  }
  // A manually panned or very narrow view can leave no clear space for a caption.
  // Its edge and the corresponding record in the evidence trail remain selectable.
  entry.label.classList.remove('project-edge-label','dollar-label');entry.label.style.display='none';
}
function drawAmountLabels(){
  const project=mappedProject();
  if(!state.showAmounts&&!project){edgeEls.forEach(entry=>{entry.label.style.display='none';entry.label.classList.remove('dollar-label','project-edge-label');});return;}
  const viewport=$('graph').getBoundingClientRect(),occupied=project?mapObstacles():[];
  for(const id of semanticNodes){const r=nodeEls.get(id).group.getBoundingClientRect();occupied.push({left:r.left-viewport.left,right:r.right-viewport.left,top:r.top-viewport.top,bottom:r.bottom-viewport.top});}
  const links=[...graph.edges].sort((a,b)=>Number(state.multiEdges.has(b.id))-Number(state.multiEdges.has(a.id)));
  for(const edge of links){const entry=edgeEls.get(edge.id),label=entry.label,amount=state.showAmounts?dollarLabel(edge):'';
    const caption=state.labels!=='off'?project?.labels.get(edge.id):'',text=amount||caption;
    label.classList.toggle('dollar-label',!!amount);label.classList.toggle('project-edge-label',!!caption);label.style.display='none';
    if(!text||!semanticEdges.has(edge.id))continue;
    label.replaceChildren();const words=text.split(/\s+/),lines=[];let line='';for(const word of words){if(line.length+word.length>33&&line){lines.push(line);line='';}line+=(line?' ':'')+word;}if(line)lines.push(line);
    lines.forEach((text,index)=>{const span=svgEl('tspan',{x:0,dy:index?14:0});span.textContent=text;label.append(span);});label.style.display='';
    if(project&&entry.route){placeProjectCaption(entry,occupied,viewport);continue;}
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
  document.body.dataset.focusMenu=String(!!focusEntityId());
  $('graph-world').setAttribute('transform', `translate(${camera.x} ${camera.y}) scale(${camera.z})`);
  const z = camera.z;
  for(const node of graph.nodes)nodeEls.get(node.id).group.style.display='';
  if(expansionAnimation?.sharedScale){$('graph').style.setProperty('--camera-inverse',1/z);$('graph').style.setProperty('--radius-factor',Math.min(1,Math.max(.45,z/.45)));}
  markerEls.forEach(marker => { marker.setAttribute('markerWidth',5/z); marker.setAttribute('markerHeight',5/z); });
  const shownIds=new Set(graph.nodes.map(n=>n.id)),radiusFor=id=>nodePresentation(id,z).radius;
  nodeEls.forEach(({ group,hit, halo, core, letter, label,pin }, id) => {
    if(!shownIds.has(id))return;
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
    const el = edgeEls.get(e.id);el.route={start,control,end}; el.line.setAttribute('d',path); el.hit.setAttribute('d',path);
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
  if(!graph||state.view!=='network'&&!desk.phone)return;
  semanticNodes=new Set(graph.nodes.map(n=>n.id));semanticEdges=new Set(graph.edges.map(e=>e.id));
  const center=focusEntityId(),neighbors=center?directConnections(graph,center,state.focusType).nodes:new Set(),pathIds=new Set(state.walk.map(step=>step.id));
  for(const id of state.multiEdges){const edge=edgeById.get(id);if(edge){neighbors.add(edge.source);neighbors.add(edge.target);}}
  const obstacles=mapObstacles(),project=mappedProject();
  const candidates=[];
  for(const node of graph.nodes){const entry=nodeEls.get(node.id),style=styleNode(node.id,camera.z);semanticStyles.set(node.id,style);
    entry.group.style.display='';entry.group.style.opacity='1';entry.group.setAttribute('aria-hidden','false');entry.core.setAttribute('tabindex','0');entry.group.dataset.semanticHidden='false';
    entry.group.classList.toggle('origin-node',state.walk[0]?.id===node.id);entry.letter.style.display=style.radius>=11?'':'none';
    const selected=state.multiNodes.has(node.id)||graph.pinNetwork&&state.pinnedIds.has(node.id),neighbor=state.showDirect&&neighbors.has(node.id),show=state.labels!=='off'&&showNetworkLabel(degrees.get(node.id),camera.z,{selected:selected||hoveredNode===node.id||pathIds.has(node.id),neighbor,all:!!project||graph.phoneIntro||state.labels==='all'||state.bucketMode});
    if(!show){entry.label.style.display='none';continue;}
    const key=node.id+'|'+style.font;let measure=labelMeasurements.get(key);if(!measure){bubbleTextMeasure.font='700 '+style.font+'px '+getComputedStyle(document.documentElement).getPropertyValue('--sans');measure={w:Math.max(...entry.normalLines.map(line=>bubbleTextMeasure.measureText(line).width))+6,h:entry.normalLines.length*style.font*1.12+2};labelMeasurements.set(key,measure);}
    const p=positions.get(node.id);candidates.push({id:node.id,x:camera.x+p.x*camera.z,y:camera.y+p.y*camera.z,r:style.radius,...measure,priority:selected?10000:hoveredNode===node.id?9500:state.walk[0]?.id===node.id?9000:pathIds.has(node.id)?8000:neighbor?6000:degrees.get(node.id)*10});
  }
  if(graph.phoneIntro)for(const point of candidates)obstacles.push({left:point.x-point.r,top:point.y-point.r,right:point.x+point.r,bottom:point.y+point.r});
  const labels=labelPlacements(candidates,{...dimensions,obstacles,gap:3});
  for(const item of candidates){const entry=nodeEls.get(item.id),box=labels.get(item.id);entry.label.style.display=box?'':'none';if(box){const style=semanticStyles.get(item.id);entry.label.setAttribute('transform',`translate(${(box.left+item.w/2-item.x)/camera.z} ${(box.top+style.font-item.y)/camera.z}) scale(${1/camera.z})`);}}
  for(const [id,entry]of edgeEls){const shown=semanticEdges.has(id);entry.group.style.display=shown?'':'none';entry.hit.setAttribute('tabindex',shown?'0':'-1');entry.hit.setAttribute('aria-hidden',String(!shown));entry.label.style.display='none';}
  $('graph').dataset.zoomLayer='network';$('graph').dataset.visibleEntities=String(semanticNodes.size);$('graph').dataset.trailHighlight='false';$('graph').dataset.visibleLabels=String(labels.size);
  const total=graph.totalEntities>semanticNodes.size?'/'+graph.totalEntities:'';
  $('visible-count').textContent=semanticNodes.size+total+(semanticNodes.size===1&&!total?' entity':' entities')+' · '+semanticEdges.size+(semanticEdges.size===1?' link':' links');
  $('visible-count').title=semanticNodes.size+' visible out of '+(graph.totalEntities||semanticNodes.size)+' entities in scope';
  $('semantic-summary').textContent='';renderConnectionLegend();renderConnectionKey();positionConnectionTooltip();positionEntityTooltip();drawAmountLabels();renderOverview();renderWalk();
}
function updateRecordMenu(){
  if(state.selected?.kind!=='node')return;
  const id=state.selected.id,node=nodeById.get(id),summary=connectionSummary(graph.pinNetwork?graph:baseGraph(),id);
  const term=normalize($('neighbor-search').value.trim());
  const pinned=currentResearch().pinnedEntities.has(id);
  const signature=[id,term,state.focusType,state.showDirect,pinned,...summary.links.map(e=>e.id)].join('|');
  if(signature===popoverSignature)return;
  popoverSignature=signature;
  $('popover-name').textContent=node.name;
  const intro=$('popover-summary');
  if(intro.dataset.entity!==id){
    intro.innerHTML=entitySummaryHTML(node);intro.dataset.entity=id;
    $('record-filter').open=!!(term||state.focusType);
  }
  $('popover-kind').textContent=categories[node.category]?.short||'Entity';
  $('popover-stats').textContent=summary.neighbors.size===summary.links.length?summary.links.length+(summary.links.length===1?' connection':' connections'):summary.neighbors.size+' connected entities · '+summary.links.length+' records';
  $('popover-collapse').textContent=state.showDirect?'Fit connections on map':'Show direct connections on map';
  $('popover-collapse').disabled=!summary.links.length;
  $('popover-pin').setAttribute('aria-pressed',String(pinned));$('popover-pin').textContent=pinned?'Unpin from research':'Pin to research';
  $('record-types').innerHTML=[{type:'',count:summary.links.length},...summary.types].map(({type,count})=>`<label><input type="radio" name="connection-type" value="${escape(type)}"${(state.focusType||'')===type?' checked':''}> ${escape(type?relationships[type].label:'All types')} (${count})</label>`).join('');
  const links=summary.links.filter(edge=>(!state.focusType||edge.type===state.focusType)&&normalize([nodeById.get(other(edge,id)).name,relationships[edge.type].label,readerField(edge,'label')].join(' ')).includes(term));
  $('record-neighbors').innerHTML=links.length?links.map(edge=>{
    const next=nodeById.get(other(edge,id)),label=readerField(edge,'label');
    return `<article class="neighbor-row"><div><a class="neighbor-follow" href="${recordHref('node',next.id)}" target="_top" data-follow-node="${next.id}" data-follow-edge="${edge.id}" aria-label="Follow ${escape(next.name)} via ${escape(label)}">${escape(next.name)}</a><span class="neighbor-relation">${escape(label)}</span></div><a class="neighbor-evidence" href="${recordHref('edge',edge.id)}" target="_top" data-edge="${edge.id}" aria-label="Read evidence for ${escape(label)}">Evidence</a></article>`;
  }).join(''):'<p class="desk-empty">'+(term?'No matching direct connections.':'No connections in these filters.')+'</p>';
}
function renderOverview(){
  const canvas=$('network-overview'),signature=[state.caseId,[...state.categories].join(','),[...state.relationships].join(','),state.connectionMode,state.history,state.from,state.to,state.includeUncertain,graph.pinNetwork?'pins/'+graph.nodes.map(n=>n.id).join(',')+'/'+graph.edges.map(e=>e.id).join(','):state.bucketMode?graph.nodes.map(n=>n.id).join(','):'network'].join('|');
  if(signature!==miniSignature){miniSignature=signature;const overview=graph.pinNetwork||state.bucketMode?graph:connectedCanvas(baseGraph()),w=184,h=96,ctx=canvas.getContext('2d'),fit=frameNetwork(overview.nodes.map(n=>n.id),positions,{width:w,height:h,padding:7});overviewTransform=fit;canvas.width=w;canvas.height=h;ctx.clearRect(0,0,w,h);
    ctx.lineWidth=.45;ctx.strokeStyle='#797a8070';for(const e of overview.edges){const a=positions.get(e.source),b=positions.get(e.target);ctx.beginPath();ctx.moveTo(fit.x+a.x*fit.z,fit.y+a.y*fit.z);ctx.lineTo(fit.x+b.x*fit.z,fit.y+b.y*fit.z);ctx.stroke();}
    for(const n of overview.nodes){const p=positions.get(n.id);ctx.fillStyle=categories[n.category].color;ctx.beginPath();ctx.arc(fit.x+p.x*fit.z,fit.y+p.y*fit.z,1.2,0,Math.PI*2);ctx.fill();}
  }
  const pathKey=miniSignature+'|'+state.walk.map(step=>step.id).join(',');if(pathKey!==miniWalkSignature){miniWalkSignature=pathKey;const f=overviewTransform,marks=[];state.walk.forEach((step,i)=>{const p=positions.get(step.id);if(!p)return;const previous=positions.get(state.walk[i-1]?.id);if(step.via&&previous)marks.push(svgEl('line',{x1:f.x+previous.x*f.z,y1:f.y+previous.y*f.z,x2:f.x+p.x*f.z,y2:f.y+p.y*f.z,class:'overview-trail-line'}));marks.push(svgEl('circle',{cx:f.x+p.x*f.z,cy:f.y+p.y*f.z,r:i?2.2:3.2,class:i?'overview-step':'overview-origin'}));});$('overview-path').replaceChildren(...marks);}
  updateOverviewViewport();
}
function updateOverviewViewport(){
  if(!overviewTransform)return;const f=overviewTransform,rect=$('overview-viewport');
  rect.setAttribute('x',f.x-camera.x/camera.z*f.z);rect.setAttribute('y',f.y-camera.y/camera.z*f.z);rect.setAttribute('width',dimensions.width/camera.z*f.z);rect.setAttribute('height',dimensions.height/camera.z*f.z);

}
function renderWalk(){
  const last=state.walk.at(-1);
  const current=state.selected?.kind==='node'?state.selected.id:
    state.selected?.kind==='edge'&&last?.via===state.selected.id?last.id:focusEntityId();
  const signature=state.walk.map(step=>step.id+':'+step.via).join('|')+'|'+current+'|'+state.selected?.kind;
  if(signature===walkSignature)return;
  walkSignature=signature;
  const arrival=$('arrival-record'),step=state.walk.findLast(item=>item.id===current),edge=step&&edgeById.get(step.via);
  arrival.hidden=!edge||state.selected?.kind!=='node';
  arrival.innerHTML=arrival.hidden?'':`<span>Arrived from ${escape(nodeById.get(other(edge,current)).name)}</span><a href="${recordHref('edge',edge.id)}" target="_top" data-edge="${edge.id}">${escape(readerField(edge,'label'))}</a>`;
  const nav=$('exploration-trail'),lastCurrent=state.walk.findLastIndex(step=>step.id===current);
  nav.hidden=!state.walk.length;$('trail-empty').hidden=!!state.walk.length;
  nav.innerHTML=state.walk.map((step,index)=>{
    const name=nodeById.get(step.id)?.name||step.id,edge=edgeById.get(step.via);
    const separator=index?(edge?'<span class="trail-step" title="'+escape(readerField(edge,'label'))+'" aria-label="Connected by '+escape(readerField(edge,'label'))+'">·</span>':'<span class="trail-branch" title="Separate starting point">New start</span>'):'';
    return separator+'<button data-walk-node="'+step.id+'" aria-current="'+(lastCurrent===index?'step':'false')+'" title="'+escape(name)+'">'+escape(name)+'</button>';
  }).join('');
  const link=nav.querySelector('[aria-current="step"]');
  if(link)nav.scrollLeft=Math.max(0,link.offsetLeft-nav.offsetLeft-nav.clientWidth+link.offsetWidth+12);

}


function isEmptyStart(){
  return !state.research.steps.length&&!state.pinOverview&&!state.tags.size&&state.customStart&&!state.startingIds.size&&!state.query&&!state.selected&&!state.path&&!state.walk.length;
}
function renderGraph(position=true) {
  $('graph').dataset.projectMap=String(!!mappedProject());
  document.body.dataset.grouped=String(state.bucketMode&&!graph.pinNetwork);
  $('bucket-layer').style.display=graph.pinNetwork?'none':'';
  const center=focusEntityId();document.body.dataset.focusScene='false';document.body.dataset.nodeFocus=String(!!center);document.body.dataset.focusMenu=String(!!center);
  const shownNodes = new Set(graph.nodes.map(n => n.id)), shownEdges = new Set(graph.edges.map(e => e.id));
  document.body.dataset.directExploration=String(state.showDirect);
  const tags=graph.pinNetwork?[]:previewTag?[...state.tags,previewTag]:state.tags,tagFocus=tags.size||tags.length?tagForeground(graph,tags):null,baseForeground=graph.pinNetwork?{nodes:shownNodes,edges:shownEdges}:center?(()=>{const local=directConnections(graph,center,state.focusType);return {nodes:local.nodes,edges:new Set(local.edges.map(e=>e.id))};})():pathForeground(graph,state.startingIds,state.path),foreground=tagFocus||baseForeground;
  const highlightedNodes = new Set(), highlightedEdges = new Set();
  const explored=exploredForeground(),selectedConnections=new Set(state.selected?.kind==='edge'?pairedRelationships(graph.edges,edgeById.get(state.selected.id)).map(edge=>edge.id):[]);
  if(graph.pinNetwork){state.pinnedIds.forEach(id=>highlightedNodes.add(id));state.pinnedEdgeIds.forEach(id=>highlightedEdges.add(id));}
  else if(tagFocus){tagFocus.nodes.forEach(id=>highlightedNodes.add(id));tagFocus.edges.forEach(id=>highlightedEdges.add(id));}
  else if (state.path) { state.path.nodes.forEach(id => highlightedNodes.add(id)); state.path.edges.forEach(id => highlightedEdges.add(id)); }
  else if ((hoveredNode&&shownNodes.has(hoveredNode))||(state.selected?.kind==='node'&&shownNodes.has(state.selected.id))) {
    const id = hoveredNode&&shownNodes.has(hoveredNode)?hoveredNode:state.selected.id; highlightedNodes.add(id);
    adjacent(id).filter(e=>id!==center||!state.focusType||e.type===state.focusType).forEach(e => { highlightedEdges.add(e.id); highlightedNodes.add(other(e, id)); });
  } else if (state.selected?.kind === 'edge') { const e = edgeById.get(state.selected.id);pairedRelationships(graph.edges,e).forEach(edge=>highlightedEdges.add(edge.id));highlightedNodes.add(e.source);highlightedNodes.add(e.target); }
  else if (state.query) graph.matches.forEach(id => highlightedNodes.add(id));
  const entityPins=currentResearch().pinnedEntities;
  nodeEls.forEach(({ group, core,label,pin }, id) => {
    const node=nodeById.get(id),party=knownParty(node);
    group.style.setProperty('--color',state.colorMode==='party'?(partyColors[party]||partyColors.neutral):categories[node.category].color);
    core.setAttribute('aria-label','Explore '+node.name+(state.colorMode==='party'?' · '+(party||node.party||'Party not recorded'):''));
    const visible = shownNodes.has(id);
    group.style.display = visible ? '' : 'none';
    group.classList.toggle('context-node',!foreground.nodes.has(id)&&!state.pinnedIds.has(id)&&!state.trailNodes.has(id));group.classList.toggle('trail-node',state.trailNodes.has(id)||explored.nodes.has(id));
    group.classList.toggle('pinned-node',state.pinnedIds.has(id));
    pin.setAttribute('aria-label',(entityPins.has(id)?'Unpin ':'Pin ')+nodeById.get(id).name+(entityPins.has(id)?'':' as anchor'));pin.setAttribute('aria-pressed',String(entityPins.has(id)));pin.setAttribute('tabindex',visible?'0':'-1');
    group.classList.toggle('path-node',!!state.path?.nodes.includes(id));group.classList.toggle('multi-selected',state.multiNodes.has(id));
    group.classList.toggle('highlight', highlightedNodes.has(id)); group.classList.toggle('selected', state.selected?.kind === 'node' && state.selected.id === id);
    group.classList.toggle('expanded',state.openNodes.has(id));
    core.setAttribute('aria-pressed', state.selected?.kind === 'node' && state.selected.id === id ? 'true' : 'false');
    core.setAttribute('aria-expanded',String(state.openNodes.has(id)));
    core.setAttribute('aria-description',degrees.get(id)+' recorded connections. '+(state.pinnedIds.has(id)?'Pinned research anchor. ':'')+'Select to highlight connections and open details. The network stays in place.');
    label.style.display = state.labels === 'off' ? 'none' : '';
  });
  edgeEls.forEach(({ group, line, label }, id) => {
    const edge=edgeById.get(id),party=connectionParty(edge,nodeById),color=state.colorMode==='party'?(partyColors[party]||partyColors.neutral):relationships[edge.type].color;
    line.setAttribute('stroke',color);label.style.fill=color;
    if(edge.directional)line.setAttribute('marker-end','url(#arrow-'+(state.colorMode==='party'?'party-'+(party||'neutral'):edge.type)+')');
    connectionIcons.get(id).group.style.setProperty('--connection-color',color);
    delete label.dataset.badgeAnchored;
    group.style.display = shownEdges.has(id) ? '' : 'none';
    group.classList.toggle('pinned-connection',!!graph.pinNetwork&&state.pinnedEdgeIds.has(id));
    group.classList.toggle('context-link',!foreground.edges.has(id)&&!state.trailEdges.has(id));group.classList.toggle('trail-link',explored.edges.has(id));group.classList.toggle('selected-connection',selectedConnections.has(id)||state.multiEdges.has(id));
    line.classList.toggle('active', highlightedEdges.has(id));
    line.classList.toggle('path-line',!!state.path?.edges.includes(id));
    label.style.display = state.labels === 'off' ? 'none' : '';
  });
  const tagScope=!graph.pinNetwork&&state.tags.size?tagSelection(graph,state.tags):null,iconEdges=graph.pinNetwork?new Set(shownEdges):tagScope?new Set([...tagScope.matches.edges,...tagScope.connectors]):center?baseForeground.edges:state.path?new Set(state.path.edges):state.selected?.kind==='node'?nodeNeighborhood(graph,state.selected.id).edges:state.selected?.kind==='edge'?pairedRelationships(graph.edges,edgeById.get(state.selected.id)).reduce((ids,edge)=>ids.add(edge.id),new Set()):new Set();
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
    foreground.edges.forEach(id=>bringForward(edgeEls.get(id)));
    foreground.nodes.forEach(id=>bringForward(nodeEls.get(id)));
    bringForward(nodeEls.get(center));
  }
  raisePathForeground();
  if(tagFocus){tagFocus.edges.forEach(id=>bringForward(edgeEls.get(id)));tagFocus.nodes.forEach(id=>bringForward(nodeEls.get(id)));}
  const emptyStart=isEmptyStart();
  document.body.dataset.emptyStart=String(emptyStart);
  $('graph-empty').hidden = graph.nodes.length > 0||emptyStart&&!desk.phone;
  $('graph-empty').querySelector('h2').textContent=state.tags.size?'No records match these tags':'No entities found';$('graph-empty').querySelector('p').textContent=state.tags.size?'Remove a tag or change the filters to explore more. Combined entity and connection tags follow up to two recorded links.':'Try a different search or reset the filters.';
  $('visible-count').textContent = `${graph.nodes.length} ${graph.nodes.length===1?'entity':'entities'} · ${graph.edges.length} ${graph.edges.length===1?'connection':'connections'}`+(hiddenByDistance&&state.view==='network'?` · ${hiddenByDistance} hidden`:'');
  $('selection-chip').hidden = !state.focus && !state.path;
  if (state.path) $('selection-chip').innerHTML = `<span>${state.path.edges.length} sourced link${state.path.edges.length === 1 ? '' : 's'} in this path</span><button data-clear-highlight aria-label="Clear highlighted path">×</button>`;
  else if (center) $('selection-chip').innerHTML = `<span>${nodeNeighborhood(graph,center).edges.size} direct connections · ${escape(nodeById.get(center).name)}</span><button data-clear-highlight aria-label="Clear neighborhood focus">×</button>`;
  if(position)positionGraph();
}

function selectionCount(){return state.multiNodes.size+state.multiEdges.size;}
function selectRecord(kind,id,additive=false){
  if(!additive){
    if(kind==='edge'){selectEdge(id);return;}
    const from=focusEntityId();
    const direct=(edgePairs.get([from,id].sort().join('|'))||[]).filter(edge=>semanticEdges.has(edge.id));
    const via=direct.length===1?direct[0]:direct.find(edge=>state.selected?.kind==='edge'&&state.selected.id===edge.id);
    if(via){toggleNode(id,{from,via:via.id});return;}
    if(direct.length>1&&state.selected?.kind==='node'&&state.selected.id===from){
      desk.showRecord('connections');
      $('record-filter').open=true;$('neighbor-search').value=nodeById.get(id).name;updateRecordMenu();
      const note=$('neighbor-choice');note.textContent=direct.length+' records connect these entities. Choose the record to follow.';note.hidden=false;
      $('record-neighbors').querySelector('[data-follow-node="'+CSS.escape(id)+'"]')?.focus();return;
    }
    toggleNode(id);return;
  }
  settleExpansion(false);rememberView();
  const selected=kind==='node'?state.multiNodes:state.multiEdges;
  if(selected.has(id))selected.delete(id);else selected.add(id);
  showSelection();
}
function showSelection(){
  // Changing the selection must keep the explored neighborhood in place.
  state.focusEntity=focusEntityId()||'';
  state.selected=state.multiNodes.size?{kind:'node',id:[...state.multiNodes][0]}:state.multiEdges.size?{kind:'edge',id:[...state.multiEdges][0]}:null;
  state.detailsOpen=!!selectionCount();if(selectionCount())desk.showRecord('evidence');if(!selectionCount()){state.focus=false;state.focusEntity='';}hoveredNode=null;hideEntityTooltip();render();
}
function renderQuickMenu(){
  const count=selectionCount(),n=state.multiNodes.size,e=state.multiEdges.size;
  $('settings-selection').hidden=state.view!=='network';
  $('open-network-tools').hidden=state.view==='network';
  $('graph').dataset.selectionMode=String(boxSelectMode&&!spaceToPan);
  $('group-connections').setAttribute('aria-pressed',String(state.bucketMode));$('group-connections').textContent=state.bucketMode?'Natural layout':'Sort by connection type';
  $('toggle-amounts').setAttribute('aria-pressed',String(state.showAmounts));$('toggle-amounts').textContent=state.showAmounts?'Hide dollar amounts':'Show dollar amounts';
  $('selection-mode').setAttribute('aria-pressed',String(boxSelectMode));$('selection-mode').textContent=boxSelectMode?'Drag to select':'Drag to pan';
  $('quick-selection').textContent=count?`${n} ${n===1?'entity':'entities'} · ${e} ${e===1?'connection':'connections'} selected`:'Explore the map';
  const actions=[];const action=(id,label)=>actions.push(`<button type="button" data-quick-action="${id}">${label}</button>`);
  if(n===1&&!e){action('explore','Center on entity');}
  if(n===2&&!e)action('path','Find path between these');
  if(e)action('endpoints','Select endpoints');
  if(count){action('isolate','Show only selection');const allPinned=[...[...state.multiNodes].map(id=>['entity',id]),...[...state.multiEdges].map(id=>['connection',id])].every(([kind,id])=>state.research.steps.some(step=>step.kind===kind&&step.id===id));action('pin',allPinned?'Unpin selection':'Pin selection');action('export','Export selection');action('clear','Clear selection');}
  $('quick-actions').innerHTML=actions.join('');
  $('quick-hint').textContent=state.bucketMode?'Buckets use each entity’s strongest recorded type. Other links remain.':'Drag to pan · scroll to zoom. Shift-drag selects; Ctrl/Cmd-click adds records. Alt-drag moves entities.';
}
$('group-connections').addEventListener('click',()=>{settleExpansion(false);rememberView();state.orbitIds=new Set();state.bucketMode=!state.bucketMode;state.bucketIds=state.bucketMode?new Set(semanticNodes):null;if(!state.bucketMode){naturalLayout.forEach((p,id)=>positions.set(id,{...p}));$('bucket-layer').replaceChildren();}render(true);});
$('toggle-amounts').addEventListener('click',()=>{rememberView();state.showAmounts=!state.showAmounts;render();});
$('selection-mode').addEventListener('click',()=>{boxSelectMode=!boxSelectMode;renderQuickMenu();});
$('quick-actions').addEventListener('click',event=>{
  const action=event.target.closest('[data-quick-action]')?.dataset.quickAction;if(!action)return;
  const ids=[...state.multiNodes],selected=selectionGraph(graph,state.multiNodes,state.multiEdges);
  if(action==='clear'){state.multiNodes.clear();state.multiEdges.clear();state.selected=null;state.detailsOpen=false;state.showDirect=false;state.focus=false;state.focusEntity='';render();return;}
  if(action==='explore'){centerOnEntity(ids[0]);return;}
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
  if(state.view==='network'&&selectionCount()>1){
    panel.innerHTML=`<div class="inspector-header"><span class="eyebrow">SELECTION</span></div><h2>${selectionCount()} records selected</h2><p class="selection-counts">${state.multiNodes.size} entities · ${state.multiEdges.size} connections</p><div class="subheading">Entities</div>${[...state.multiNodes].map(id=>`<div class="connection-row"><a href="${recordHref('node',id)}" target="_top" data-node-detail="${id}">${escape(nodeById.get(id).name)}</a><span>${escape(nodeById.get(id).role)}</span></div>`).join('')}${state.multiEdges.size?'<div class="subheading">Connections</div>'+[...state.multiEdges].map(id=>connectionRow(edgeById.get(id))).join(''):''}`;
    return;
  }
  if (state.selected.kind === 'node') {
    const n=nodeById.get(state.selected.id),links=adjacent(n.id),count=degrees.get(n.id),owner='node-'+n.id;
    const summary=entitySummaries.get(n.id),sourceIds=[...new Set([...(summary?.sourceIds||[]),...n.sourceIds])];
    const notes=readerField(n,'description');
    panel.innerHTML=`<div class="inspector-header"><span class="eyebrow">Entity</span></div>
      <h2>${escape(n.name)}</h2>${entitySummaryHTML(n,false)}<div class="entity-role">${escape(n.role)}</div>${partyDetails(n)}
      ${notes&&notes!==summary?.text?`<details class="entity-record-notes"><summary>Record notes</summary><p class="entity-description">${escape(notes)}</p></details>`:''}
      <div class="claim-source-block"><h3 class="citation-heading">Sources</h3>${sourceLinks(sourceIds,owner)}</div>
      ${campaignFinanceHTML(n.id)}<div class="subheading">Connections (${links.length===count?count:links.length+' of '+count})</div>
      ${links.length?links.map(e=>connectionRow(e,n.id)).join(''):'<p>No connections match the filters.</p>'}`;
  }else if(state.selected.kind==='edge'){
    const e=edgeById.get(state.selected.id);
    const endpoint=id=>`<a href="${recordHref('node',id)}" target="_top" data-node-detail="${id}" data-endpoint-of="${e.id}" title="Follow ${escape(nodeById.get(id).name)}">${escape(nodeById.get(id).name)}</a>`;
    panel.innerHTML=`<div class="inspector-header"><span class="eyebrow">Relationship</span></div>
      <h2>${escape(readerField(e,'label'))}</h2>${statusBadge(e)}
      <div class="edge-ends">${endpoint(e.source)}<span class="link-between" aria-hidden="true">${e.directional?'to':'and'}</span>${endpoint(e.target)}</div>
      <div class="period">${escape(e.period)}</div>${e.unit?`<div class="amount-unit">${escape(e.unit)}</div>`:''}
      ${evidenceBlock(e)}`;
    const others=pairedRelationships(baseGraph().edges,e).filter(other=>other.id!==e.id);
    if(others.length)panel.insertAdjacentHTML('beforeend',`<details class="paired-records"><summary>Other connections between these entities (${others.length})</summary>`+
      others.map(other=>`<p class="paired-connection-card" data-paired-record="${other.id}">
        <a href="${recordHref('edge',other.id)}" target="_top" data-edge="${other.id}">${escape(readerField(other,'label'))}</a>
        <small>${escape(evidenceStatuses[other.status])} · ${escape(relationships[other.type].label)} · ${escape(other.period)}</small></p>`).join('')+'</details>');
  }else{
    const source=sourceById.get(state.selected.id),links=baseGraph().edges.filter(e=>e.sourceIds.includes(source.id));
    panel.innerHTML=`<div class="inspector-header"><span class="eyebrow">Source record</span></div><h2>${sourceTitleLink(source)}</h2>
      <div class="citation-card source-access"><div class="citation-publisher">${escape(source.publisher)} · ${escape(friendlyDate(source.date))}</div>${alternateSourceLinks(source)}</div>
      <p>${escape(readerField(source,'note'))}</p><div class="subheading">${links.length} relationships in selected filters</div>
      ${links.map(e=>connectionRow(e)).join('')}`;
  }
}

function renderDirectory() {
  const list = baseGraph().nodes.filter(n => matches(n, state.query)).sort((a, b) => a.name.localeCompare(b.name));
  $('directory-count').textContent = `${list.length} entities`;
  $('directory-list').innerHTML = list.length ? list.map(n => `<button class="directory-row" data-node-detail="${n.id}"><span class="directory-icon" style="--color:${categories[n.category].color}">${escape(initials(n))}</span><span><strong>${escape(n.name)}</strong><small>${escape(n.role)}</small></span></button>`).join('') : '<p class="empty-list">No entities match. Try another search or reset the filters.</p>';
}
function visibleRelations() {
  return baseGraph().edges.filter(e=>relationshipMatches(e,state.query,nodeById));
}
function renderRelations() {
  const list=visibleRelations(); $('relations-count').textContent=`${list.length} links`;
  $('relations-list').innerHTML=list.length?list.map(e=>`<button class="ledger-row" data-edge="${e.id}"><span class="ledger-ends">${escape(nodeById.get(e.source).name)} <b>${e.directional?'to':'and'}</b> ${escape(nodeById.get(e.target).name)}</span><strong>${escape(readerField(e,'label'))}</strong><small>${escape(e.period)}</small>${statusBadge(e)}</button>`).join(''):'<p class="empty-list">No links match.</p>';
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
    return `<article class="source-card"><span class="source-number">${String(sources.indexOf(s)+1).padStart(2,'0')}</span><div><h3>${sourceTitleLink(s)}</h3><p>${escape(readerField(s,'note'))}</p><small>${escape(s.publisher)} · ${friendlyDate(s.date)} · ${escape(s.kind)}<br>${s.archiveUrl?`Pinned Wayback snapshot: ${s.archiveTimestamp}`:'Original source · content checked'}<br>Source checked ${friendlyDate(s.contentCheckedAt?.slice(0,10)||s.reviewed)}</small>${alternateSourceLinks(s)}<a class="source-connections" href="${recordHref('source',s.id)}" target="_top" data-source="${s.id}">View source record · ${count} relationship${count===1?'':'s'}</a></div></article>`;
  }).join('') : '<p class="empty-list">No sources match. Try another search or reset the filters.</p>';
}

function renderMediaOverview(){
  const panel=$('media-overview');panel.hidden=state.caseId!=='media';if(panel.hidden)return;
  // Profiles describe the verified batch, independently of temporary graph filters.
  if(panel.childElementCount)return;
  const link=id=>`<button class="text-button" data-node-detail="${id}">${escape(nodeById.get(id).name)}</button>`;
  const profiles=mediaProfiles.filter(p=>[p.outlet,...p.authority,...p.affiliations].every(id=>nodeById.has(id)));
  panel.innerHTML=`<div class="media-intro"><p class="eyebrow">MEDIA &amp; INFORMATION</p><h2>Who supplies Columbus’s information?</h2><p>Explore the organizations behind local outlets, their funding and the programs they carry. Each connection opens its source records.</p><p class="media-boundary">${profiles.length} outlet profiles · collection updated October 14, 2026</p></div><details class="media-paths"><summary>Outlet authority paths <span>${profiles.length} profiles · select a name for evidence</span></summary><div class="media-profile-grid">${profiles.map(p=>`<article class="media-profile"><h3>${link(p.outlet)}</h3><p class="media-authority"><strong>${['wosu','wcbe','ocj'].includes(p.outlet)?'Governance / organization':'Ownership / parent path'}</strong><span>${p.authority.map(link).join(p.joint?' <span class="media-path-separator">&amp;</span> ':' <span class="media-path-separator" title="Next parent or controlling owner">held by</span> ')}</span></p>${p.affiliations.length?`<p class="media-affiliations"><strong>${p.outlet==='wtvn'?'Program supplier':'Network membership / affiliation'}</strong><span>${p.affiliations.map(link).join(' · ')}</span></p>`:''}<p>${escape(profileCopy[p.outlet]||p.note)}</p></article>`).join('')}</div></details><details class="media-leads"><summary>Remaining research leads <span>Documents that could deepen the picture</span></summary><ul>${leadStories.map(lead=>`<li><strong>${escape(lead.title)}</strong><br>${escape(lead.text)}</li>`).join('')}</ul></details>`;
}
function render(refit = false) {
  tagStatsCache=new Map();
  renderMediaOverview(); renderFilterChips();
  if(state.view==='network')graph=networkGraph();
  else if(!desk.phone||!graph)graph=filterGraph(state);
  if(state.view==='network'&&!graph.pinNetwork){
    state.multiNodes=new Set([...state.multiNodes].filter(id=>graph.nodes.some(node=>node.id===id)));
    state.multiEdges=new Set([...state.multiEdges].filter(id=>graph.edges.some(edge=>edge.id===id)));
  }
  renderIndirectRoutes();renderGraph(false); renderInspector(); decorateInspector();renderMapScope();renderQuickMenu();updateRecordMenu();
  if (state.view === 'directory') renderDirectory();
  if (state.view === 'relations') renderRelations();
  if (state.view === 'sources') renderSources();
  syncDesk();
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
  $('campaign-coverage-list').innerHTML=rows.map(row=>{const committees=campaignFinanceIndex.units.filter(unit=>unit.candidateIds.includes(row.id)),reports=committees.flatMap(unit=>unit.reportIds),label=reports.length?reports.length+' filing reports':'Filing ledger not yet matched';return '<li><button class="explore-button" data-campaign-money="'+row.id+'">'+escape(row.name)+' · campaign money</button><span>'+escape(row.party+' · '+row.office)+(row.writeIn?' · write-in':'')+'</span><small>'+label+'</small></li>';}).join('');
}
function campaignFinanceHTML(id){
  const ledger=campaignMoneyCard(id);if(ledger)return ledger;
  const committees=nodes.filter(node=>node.id===id&&node.financeSummaries?.length||node.candidateIds?.includes(id));
  return committees.map(committee=>(committee.financeSummaries||[]).map(summary=>{
    const source=sourceById.get(summary.sourceId),period=summary.period.start&&summary.period.end?friendlyDate(summary.period.start)+' – '+friendlyDate(summary.period.end):'Reporting window not stated in announcement';
    const amount=metric=>metric.qualifier==='more-than'?'> '+new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',notation:'compact',maximumFractionDigits:2}).format(metric.amount):metric.qualifier==='reported-rounded'?'~'+new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',notation:'compact',maximumFractionDigits:2}).format(metric.amount):new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(metric.amount);
    return '<section class="campaign-finance"><h3>'+escape(committee.name)+'</h3><p>'+escape(summary.basis)+' · '+escape(period)+'</p><table><tbody>'+summary.metrics.map(metric=>'<tr><th scope="row">'+escape(metric.label)+'</th><td>'+escape(amount(metric))+'</td></tr>').join('')+'</tbody></table><p>'+escape(summary.note)+'</p>'+(source?'<div class="claim-source-block"><h3 class="citation-heading">Source</h3>'+sourceLinks([source.id])+'</div>':'')+'</section>';
  }).join('')).join('');
}
function decorateInspector(){
  const options=$('record-options');
  options.hidden=!state.selected||state.view==='network'&&selectionCount()>1;
  $('inspector').querySelector('h2')?.setAttribute('tabindex','-1');
  if(options.hidden){options.open=false;delete options.dataset.record;return;}
  const {kind,id}=state.selected,panel=$('inspector'),record=recordsByKind[kind]?.get(id);
  if(!record){options.hidden=true;return;}
  if(kind==='edge')panel.querySelector('.cited-claim')?.insertAdjacentHTML('afterend',contributionDates(record)+investigationLink(id));
  $('popover-pin').hidden=$('popover-collapse').hidden=kind!=='node';
  const pin=$('record-pin-edge'),map=$('record-map-edge');
  pin.hidden=map.hidden=kind!=='edge';
  if(kind==='edge'){
    const pinned=state.pinnedEdgeIds.has(id);
    pin.dataset.pinConnection=id;map.dataset.mapConnection=id;
    pin.setAttribute('aria-pressed',String(pinned));pin.textContent=pinned?'Unpin from research':'Pin to research';
  }
  const tagKind=kind==='edge'?'connection':'entity';
  $('record-topics').innerHTML=kind==='source'?'':recordTopicTools(recordTags(tagKind,id));
  const identity=kind+'/'+id;
  if(options.dataset.record===identity)return;
  options.open=false;options.dataset.record=identity;
  let evidence='';
  if(kind==='edge'){
    const {start,end}=validityFor(record);
    if(start&&end)evidence='<p>Documented from '+escape(friendlyDate(start))+' through '+escape(friendlyDate(end))+'.</p>';
    else if(start)evidence='<p>Documented from '+escape(friendlyDate(start))+'.</p>';
    else if(end)evidence='<p>Documented through '+escape(friendlyDate(end))+'.</p>';
    const check=record.claimReview;
    if(check?.status==='reviewed'&&check.reviewedAt){
      evidence+='<p>Connection checked against the cited material on '+escape(friendlyDate(check.reviewedAt.slice(0,10)))+'.</p>';
    }
  }
  if(kind==='source'){
    const check=publicSource(record).contentCheck;
    evidence='<details><summary>Source information</summary><p>Content checked '+escape(check.checkedAt?friendlyDate(check.checkedAt.slice(0,10)):'on an unrecorded date')+' using AI-assisted research.</p><p>Method: '+escape(check.method)+'</p>'+(check.sha256?'<details><summary>File fingerprint</summary><code>'+escape(check.sha256)+'</code></details>':'')+'</details>';
  }
  if(kind==='node'){
    const entity=datasetFor({nodes:[record],edges:[]}).entities[0];
    evidence=(record.aliases?.length?'<p>Also known as '+escape(record.aliases.join('; '))+'</p>':'')+entity.externalIdentifiers.map(i=>'<p>'+escape(i.scheme)+' '+escape(i.value)+'</p>').join('');
  }
  $('record-permalink').href=recordURL(location.href,kind,id,release.releaseId);
  const sourceIds=new Set(record.sourceIds||[]);
  for(const citation of panel.querySelectorAll('[data-cited-source]'))sourceIds.add(citation.dataset.citedSource);
  $('record-source-notes').innerHTML=sourceIds.size?'<p class="source-caption">Source records</p>'+[...sourceIds].map(sourceId=>`<a href="${recordHref('source',sourceId)}" target="_top" data-source="${escape(sourceId)}">${escape(sourceById.get(sourceId).title)}</a>`).join(' '):'';
  $('record-metadata').innerHTML=evidence+'<p class="stable-record">Record '+escape(id)+' · edition '+escape(release.releaseId)+'</p>';
}
function renderProjectReport(project){
  const panel=$('project-report');
  if(panel.dataset.project!==project.id){
    panel.dataset.project=project.id;
    $('project-heading').textContent=project.title;
    $('project-finding').textContent=project.finding;
    const hearing=project.sources.map(id=>hearingTestimony[id]).find(Boolean);
    $('project-sources').innerHTML=citationRefs(project.sources)+(hearing?hearingLink(hearing):'');
    $('project-steps').innerHTML=project.steps.map(step=>{
      const records=step.records.map(edge=>`<a class="project-record" href="${recordHref('edge',edge.id)}" target="_top" data-edge="${escape(edge.id)}" aria-label="Inspect ${escape(nodeById.get(edge.source).name)} and ${escape(nodeById.get(edge.target).name)}: ${escape(readerField(edge,'label'))}">${step.records.length===1?'Inspect record':escape(project.labels.get(edge.id))}</a>`).join(' ');
      const via=step.follow&&step.records.find(edge=>edge.source===step.follow||edge.target===step.follow);
      const follow=via?`<a class="project-record" href="${recordHref('node',step.follow)}" target="_top" data-node-detail="${escape(step.follow)}" data-endpoint-of="${escape(via.id)}">Follow ${escape(nodeById.get(step.follow).name)}</a>`:'';
      const excerpt=step.excerpt?`<blockquote>“${escape(step.excerpt.text)}”<cite>${escape(step.excerpt.credit)}</cite></blockquote>`:'';
      const testimony=step.citations.map(id=>hearingTestimony[id]).find(Boolean);
      const paragraphs=step.text.split('\n\n').map(paragraph=>{
        let copy=escape(paragraph);
        for(const phrase of step.emphasis||[]){
          const escaped=escape(phrase);
          copy=copy.replace(escaped,()=>`<strong>${escaped}</strong>`);
        }
        return `<p>${copy}</p>`;
      }).join('');
      const references=(step.references||[]).map(ref=>`<a class="claim-ref" href="${escape(ref.url)}" target="_blank" rel="noopener noreferrer">${escape(ref.label)}</a>`).join(' ');
      return `<li id="project-step-${escape(step.id)}" data-project-step="${escape(step.id)}"><h4 tabindex="-1">${escape(step.title)}</h4>${paragraphs}${excerpt}<div class="intro-sources">${citationRefs(step.citations)}${testimony?hearingLink(testimony):''}${references}</div>${investigationLink(step.id)}<div class="project-records">${follow}${records}</div></li>`;
    }).join('');
  }
  for(const row of $('project-steps').children){
    if(row.dataset.projectStep===state.projectStep)row.setAttribute('aria-current','step');
    else row.removeAttribute('aria-current');
  }
  const alreadyAdded=project.route.edges.every(id=>currentResearch().pinnedEdges.has(id));
  $('project-add').textContent=alreadyAdded?'Added to my research':'Add to my research';
  $('project-add').disabled=alreadyAdded;
}
function syncDesk(){
  const project=projects.get(state.projectId);
  const overview=!!mappedProject()&&!state.selected;
  const step=project?.steps.find(item=>item.id===state.projectStep);
  const record=recordsByKind[state.selected?.kind]?.get(state.selected.id);
  const title=overview?(step?.title||project.title):record?.name||record?.title||(state.selected?.kind==='edge'?readerField(record,'label'):'Choose a record');
  const summary=overview?(step?.text||project.finding):record?.role||record?.note||record?.evidence||'';
  desk.sync({empty:document.body.dataset.emptyStart==='true',selection:state.selected,
    isSingleNode:state.selected?.kind==='node'&&selectionCount()<=1,currentView:state.view,showProject:overview,title,summary});
  $('project-return').hidden=!project||overview||state.view!=='network';
  $('project-return').textContent=step?'Back to “'+step.title+'”':'Back to project overview';
  if(overview)renderProjectReport(project);
  const pins=state.research.steps.length,inPins=!!graph.pinNetwork;
  $('show-all-pins').hidden=!pins;
  $('show-all-pins').title='Fit '+pins+' pinned '+(pins===1?'record':'records')+' on the map';
  $('pins-banner').hidden=!inPins;
  if(inPins){
    const entityPins=currentResearch().pinnedEntities.size,linkPins=state.pinnedEdgeIds.size,related=graph.edges.length-linkPins;
    const counts=[];
    if(entityPins)counts.push(entityPins+(entityPins===1?' pinned entity':' pinned entities'));
    if(linkPins)counts.push(linkPins+(linkPins===1?' pinned connection':' pinned connections'));
    if(related||!linkPins)counts.push(related+(related===1?' related connection':' related connections'));
    if(graph.components>1)counts.push(graph.components+' separate groups');
    $('pins-summary').textContent='Pinned network · '+counts.join(' · ')+' across all topics';
  }else $('pins-summary').textContent='';
  document.body.dataset.pinOverview=String(inPins);
  const selected=state.selected;
  $('record-scope-note').hidden=state.view!=='network'||!selected||
    (selected.kind==='node'?graph.nodes.some(node=>node.id===selected.id):
      selected.kind==='edge'?graph.edges.some(edge=>edge.id===selected.id):true);
  const back=$('record-back'),lastStep=explorationHistory.at(-1),previous=lastStep?.state.selected;
  const inspection=state.view==='network'&&['edge','source'].includes(state.selected?.kind);
  const different=previous&&(previous.kind!==state.selected?.kind||previous.id!==state.selected?.id);
  const previousEdge=previous?.kind==='edge'&&edgeById.get(previous.id);
  const previousName=different&&(previous.kind==='node'?nodeById.get(previous.id)?.name:
    previousEdge?readerField(previousEdge,'label'):sourceById.get(previous.id)?.title);
  const anchor=focusEntityId()||state.walk.at(-1)?.id;
  back.hidden=!inspection||!(previousName||anchor);
  back.dataset.resume=previousName?'':anchor||'';
  back.textContent=back.hidden?'':'Back to '+(previousName||nodeById.get(anchor)?.name);
  if(inspection&&lastStep?.reason==='show-connection'&&state.path?.edges.length===1&&state.path.edges[0]===selected.id){
    back.hidden=false;back.dataset.resume='';back.textContent=lastStep.state.customStart&&!previous&&!lastStep.state.walk.length?'Back to search':'Back to previous map';
  }
  $('trail-empty').textContent=overview?project.title:state.path?'Selected path':state.tags.size?'Tagged records':
    state.view==='network'?'Network overview':'Records';
}
function revealInspector(){desk.showRecord('evidence');focusRecordHeading();}
window.addEventListener('resize',()=>{if(graph)renderMapScope();});
function navigateSection(view){
  if(view===state.view)return;
  if(state.view==='network'){
    networkReturn=null;
    networkReturn=workspaceSnapshot();
  }else if(view==='network'&&networkReturn){
    const snapshot=networkReturn;networkReturn=null;
    snapshot.research=structuredClone(state.research);
    restoreWorkspaceView(snapshot,{keepUndo:true});return;
  }
  desk.closeTool(false);setView(view);
}
function setView(view) {
  if(!['network','relations','directory','sources'].includes(view))view='network';
  const previousView=state.view;
  if(view!=='network'){state.pinOverview=false;state.pinFrame=null;}
  if(previousView!==view){state.multiNodes.clear();state.multiEdges.clear();listPlace=null;if(view!=='network'&&desk.stacked)desk.focusWidth(false);}
  if(view!=='network'){state.tags=new Set();hideTagPreview();}
  if(previousView!==view){state.query='';$('search').value='';$('starting-results').hidden=true;}
  const acceptedSelection={network:['node','edge'],relations:['edge'],directory:['node'],sources:['source']};
  if(previousView!==view&&state.selected&&!acceptedSelection[view]?.includes(state.selected.kind)){
    state.selected=null;state.detailsOpen=false;state.focus=false;
  }
  state.view = view;
  document.querySelectorAll('[data-view]').forEach(el => { const active = el.dataset.view === view; el.classList.toggle('active', active); active ? el.setAttribute('aria-current', 'page') : el.removeAttribute('aria-current'); });
  $('return-map').hidden=view==='network'||!networkReturn;
  for (const name of ['network','relations','directory','sources']) $(`${name}-view`).hidden = name !== view&&!(desk.phone&&name==='network');
  document.querySelector('.workspace').setAttribute('data-current-view', view);
  document.body.dataset.view=view;
  $('list-search').placeholder=view==='sources'?'Title or publisher…':view==='relations'?'Connection or entity…':'Name or role…';
  $('list-search').value=state.query;desk.dismiss();
  render(view === 'network');
  syncURL();
}
function selectEdge(id){
  if(!edgeById.has(id))return;settleExpansion(false);rememberView('',id);rememberOpener();
  state.multiNodes.clear();state.multiEdges=new Set([id]);state.selected={kind:'edge',id};state.detailsOpen=true;desk.showRecord('evidence');hoveredNode=null;render();
}
function scopeToConnection(edge){
  const widened=!baseGraph().edges.some(item=>item.id===edge.id);
  if(widened)resetFilters(false);
  state.query='';state.tags.clear();state.pinOverview=false;state.pinFrame=null;
  state.focus=false;state.focusType='';state.showDirect=false;state.bucketMode=false;state.bucketIds=null;
  state.customStart=false;state.mapMode='explore';state.exploreRoot=edge.source;
  state.startingIds=new Set([edge.source,edge.target]);state.path={nodes:[...state.startingIds],edges:[edge.id]};
  state.walk=walkConnection(state.walk,edge);
  for(const id of state.startingIds){state.trailNodes.add(id);state.explorationSeeds.add(id);}
  state.trailEdges.add(edge.id);state.selected={kind:'edge',id:edge.id};state.detailsOpen=true;
  state.multiNodes.clear();state.multiEdges=new Set([edge.id]);hoveredNode=null;
  return widened;
}
function showConnectionOnMap(id){
  const edge=edgeById.get(id);if(!edge)return;
  if(state.view!=='network')navigateSection('network');
  settleExpansion(false);
  if(!state.pinOverview&&state.selected?.id===id&&state.path?.edges.length===1&&state.path.edges[0]===id){
    moveCamera(fittedCamera());return;
  }
  rememberView('show-connection');rememberOpener();const widened=scopeToConnection(edge);
  desk.dismiss();desk.showRecord('evidence');render();moveCamera(fittedCamera());
  if(widened)toast('Showing this connection across all topics and dates.');
}
function revealNode(id,edgeId){
  const edge=edgeById.get(edgeId);
  if(!edge||(edge.source!==id&&edge.target!==id)){toggleNode(id);return;}
  if(state.walk.at(-1)?.id===id){toggleNode(id,{resume:true});return;}
  toggleNode(id,{from:other(edge,id),via:edge.id});
}
function returnToList(){
  if(!listPlace||listPlace.view!==state.view){$('list-search').focus({preventScroll:true});return;}
  const list=document.querySelector('.workspace');
  list.scrollTop=listPlace.scroll;
  list.querySelector(listPlace.selector)?.focus({preventScroll:true});
}
function clearFilterControls(){
  rememberView();
  Object.assign(state,{categories:new Set(Object.keys(categories)),relationships:new Set(Object.keys(relationships)),
    caseId:'all',history:true,tags:new Set(),connectionMode:'all',from:'',to:'',includeUncertain:true});
  $('topic-select').value='all';$('graph-title').textContent='Columbus network';$('history').checked=true;
  $('query-error').hidden=true;
  $('filters').querySelectorAll('[data-category],[data-relationship]').forEach(input=>input.checked=true);
  syncReportingControls();render();
}
function resetFilters(doRender = true) {
  state.showDirect=false;
  state.multiNodes.clear();state.multiEdges.clear();state.bucketMode=false;state.bucketIds=null;
  state.categories = new Set(Object.keys(categories)); state.relationships = new Set(Object.keys(relationships)); state.history = true; state.query = ''; state.selected = null; state.path = null; state.focus = false;
  state.caseId='all';$('topic-select').value='all';$('graph-title').textContent='Columbus network';state.tags=new Set();state.connectionMode='all';state.from='';state.to='';state.includeUncertain=true;syncReportingControls();
  $('search').value = ''; $('history').checked = true;
  $('filters').querySelectorAll('[data-category],[data-relationship]').forEach(input => input.checked = true);
  if (doRender){refreshMapScope();render(true);}
}

function openPathFinder(focus=true) {
  const selected=state.selected;
  const selectedEdge=selected?.kind==='edge'?edgeById.get(selected.id):null;
  const context=[selected?.kind,selected?.id,...state.startingIds].join('|');
  const filtered=baseGraph(),scope=filtered.nodes.map(node=>node.id).join('|')+'/'+filtered.edges.map(edge=>edge.id).join('|');
  if(pathContext===context&&pathScope===scope){desk.setPanel('path',{focus});return;}
  const retainFields=pathContext===context;pathContext=context;pathScope=scope;pathSubmitted=false;
  const available = filtered.nodes.slice().sort((a, b) => a.name.localeCompare(b.name));
  $('path-entities').innerHTML=available.map(node=>`<option value="${escape(node.name)}">${escape(node.role)}</option>`).join('');
  const chosen=[...state.startingIds].filter(id=>available.some(node=>node.id===id));
  const first=selected?.kind==='node'?selected.id:selectedEdge?.source||chosen[0];
  const second=selectedEdge?.target||chosen.find(id=>id!==first)||'';
  if(!retainFields){$('path-from').value=nodeById.get(first)?.name||'';$('path-to').value=nodeById.get(second)?.name||'';}
  $('path-form').querySelector('button').disabled = !available.length;
  $('path-result').innerHTML = available.length ? (retainFields?'<p class="path-result">Filters changed. Find the path again in this scope.</p>':'') : '<p class="path-result">No entities match the current filters. Reset filters to find a path.</p>';
  desk.setPanel('path',{focus});
}

$('undo-map').addEventListener('click',undoExploration);
$('graph-stage').addEventListener('click',event=>{if(!desk.stacked&&event.target.closest('.graph-controls,.overview-map'))desk.focusWidth(false);});
buildFilters(); buildGraph();
researchUI=mountResearchUI({state,nodes,edges,relationships,release,snapshot:workspaceSnapshot,remember:rememberView,
  changed:(redraw=true)=>{if(redraw===false){syncURL();return;}syncResearchPins();if(state.pinOverview&&!state.research.steps.length){leavePins(false);return;}render();if(state.pinOverview)moveCamera(fittedCamera());},
  openPanel:()=>desk.setPanel('research'),focusNode:id=>toggleNode(id),focusEdge:selectEdge,showPins:showAllPins,
  download:(file,name)=>window.parent.postMessage({channel:'columbus-explorer',type:'download-research',file,name},location.origin),
  importPath:()=>window.parent.postMessage({channel:'columbus-explorer',type:'import-research'},location.origin),
  openView:(snapshot,name)=>window.parent.postMessage({channel:'columbus-explorer',type:'open-research',snapshot,name},location.origin),
  notify:toast,records:()=>{const route=currentResearch();return datasetFor({nodes:nodes.filter(node=>route.nodeIds.has(node.id)),edges:edges.filter(edge=>route.edgeIds.has(edge.id))});}});
$('popover-pin').addEventListener('click',()=>{if(state.selected?.kind==='node')researchUI.toggle('entity',state.selected.id);popoverSignature='';updateRecordMenu();});
$('neighbor-search').addEventListener('input',()=>{$('neighbor-choice').hidden=true;updateRecordMenu();});
$('record-types').addEventListener('change',event=>{
  if(!event.target.matches('input[name=connection-type]'))return;
  showDirectConnections(event.target.value);
  $('record-types').querySelector('input:checked')?.focus({preventScroll:true});
});
$('popover-collapse').addEventListener('click',()=>{
  const id=state.selected?.id;if(state.selected?.kind!=='node')return;
  if(state.view!=='network')toggleNode(id);else showDirectConnections();
});
$('record-neighbors').addEventListener('click',event=>{
  const button=event.target.closest('[data-follow-node]');
  if(button&&plainLinkClick(event)){event.preventDefault();toggleNode(button.dataset.followNode,{from:state.selected.id,via:button.dataset.followEdge});focusRecordHeading();}
});
$('entity-popover').addEventListener('pointerenter',hideEntityTooltip);
$('exploration-trail').addEventListener('click',event=>{const button=event.target.closest('[data-walk-node]');if(button)toggleNode(button.dataset.walkNode,{resume:true});});
$('network-overview').addEventListener('click',event=>{if(!overviewTransform)return;const rect=event.currentTarget.getBoundingClientRect(),f=overviewTransform,x=((event.clientX-rect.left)*184/rect.width-f.x)/f.z,y=((event.clientY-rect.top)*96/rect.height-f.y)/f.z;moveCamera({z:camera.z,x:dimensions.width/2-x*camera.z,y:dimensions.height/2-y*camera.z});});
new ResizeObserver(updateTagWindowSpace).observe($('active-tags'));
new ResizeObserver(updateTagWindowSpace).observe($('desk-search'));
$('source-total').textContent = sources.length;
$('dataset-counts').innerHTML = `<span><b>${nodes.length}</b> entities</span><span><b>${edges.length}</b> links</span><span><b>${sources.length}</b> sources</span>`;
$('review-date').textContent = `Evidence updated ${friendlyDate(meta.reviewed)}`;
$('topic-select').addEventListener('change',()=>{rememberView();setCase($('topic-select').value,{keepRecord:true});});
document.querySelector('.view-nav').addEventListener('click',event=>{const button=event.target.closest('[data-view]');if(button)navigateSection(button.dataset.view);});
$('project-steps').addEventListener('click',event=>{
  const row=event.target.closest('[data-project-step]');if(!row)return;
  state.projectStep=row.dataset.projectStep;
  if(event.target.closest('a')){rememberProjectPlace(state.projectStep);syncURL();}
});
$('project-add').addEventListener('click',()=>{
  const project=mappedProject();if(!project)return;
  let next;try{next=addProjectToResearch(project,state.research);}catch(error){toast(error.message);return;}
  if(next===state.research)return;
  rememberView();state.research={...next,id:next.id||crypto.randomUUID(),createdAt:next.createdAt||new Date().toISOString()};
  syncResearchPins();render();toast('Project connections added to your research path.');
});
$('list-search').addEventListener('input',()=>{state.query=$('list-search').value.trim();if(state.view==='directory')renderDirectory();else if(state.view==='relations')renderRelations();else if(state.view==='sources')renderSources();syncURL();});
document.querySelector('.workspace').addEventListener('click',event=>{
  if(!desk.stacked||state.view==='network')return;
  const row=event.target.closest('button[data-node-detail],button[data-edge],a[data-source]');
  if(!row)return;
  if(row.localName==='a'){if(!plainLinkClick(event))return;event.preventDefault();}
  const attribute=['data-node-detail','data-edge','data-source'].find(name=>row.hasAttribute(name));
  listPlace={view:state.view,scroll:event.currentTarget.scrollTop,selector:row.localName+'['+attribute+'="'+CSS.escape(row.getAttribute(attribute))+'"]'};
  event.stopPropagation();
  if(attribute==='data-node-detail'){
    state.selected={kind:'node',id:row.dataset.nodeDetail};state.detailsOpen=true;
    state.multiNodes=new Set([row.dataset.nodeDetail]);state.multiEdges.clear();
    desk.showRecord('evidence');render();
  }else if(attribute==='data-edge')selectEdge(row.dataset.edge);
  else inspectSource(row.dataset.source);
  focusRecordHeading();
});
$('return-map').addEventListener('click',()=>navigateSection('network'));
$('show-all-pins').addEventListener('click',showAllPins);
$('leave-pins').addEventListener('click',()=>leavePins());
$('open-network-tools').addEventListener('click',()=>{navigateSection('network');launchPanel('settings');});
$('record-back').addEventListener('click',()=>{
  const id=$('record-back').dataset.resume;
  if(id)toggleNode(id,{resume:true});else undoExploration();
  if(document.body.dataset.landing==='true')desk.focusSearch();else focusRecordHeading();
});
$('reset-filters').addEventListener('click',clearFilterControls);
$('empty-reset').addEventListener('click',clearFilterControls);
$('zoom-in').addEventListener('click', () => zoom(1.25)); $('zoom-out').addEventListener('click', () => zoom(.8)); $('fit').addEventListener('click',()=>fitGraph());
$('reset-layout').addEventListener('click',()=>{rememberView();state.orbitIds=new Set();state.showDirect=false;state.bucketMode=false;state.bucketIds=null;naturalLayout.forEach((p,id)=>positions.set(id,{...p}));miniSignature='';render(true);toast('Original network positions restored');});
$('label-toggle').addEventListener('click', () => { state.labels = state.labels === 'auto' ? 'all' : state.labels === 'all' ? 'off' : 'auto'; $('label-toggle').textContent = state.labels === 'auto' ? 'Labels auto' : state.labels === 'all' ? 'More labels' : 'Labels off'; renderGraph(); });
document.addEventListener('click', event => {
  const anchorButton=event.target.closest('[data-anchor-focus]');if(anchorButton){toggleNode(anchorButton.dataset.anchorFocus);return;}
  const showType=event.target.closest('[data-show-type]');if(showType){animateFocusChange(()=>{state.focusType='';state.relationships.add(showType.dataset.showType);if(connectionModesForLegend()&&!connectionModesForLegend().includes(showType.dataset.showType))state.connectionMode='all';syncReportingControls();});return;}
  const projectLink=event.target.closest('[data-project-dialog]');
  if(projectLink){event.preventDefault();document.querySelector('dialog[open]')?.close();$(projectLink.dataset.projectDialog).showModal();return;}
  const btn=event.target.closest('button,a[data-node-detail],a[data-edge],a[data-source]');if(!btn)return;
  if(btn.localName==='a'){if(!plainLinkClick(event))return;event.preventDefault();}
  if(btn.id==='project-return'){openStarterProject(state.projectId,true);return;}
  if(btn.dataset.removeTag){applyTag(btn.dataset.removeTag);desk.focusSearch();return;}
  if(btn.hasAttribute('data-add-tag')){desk.focusSearch();return;}
  if(btn.dataset.tag){applyTag(btn.dataset.tag);return;}
  if(btn.dataset.closeFloating){desk.closeTool();return;}
  if (btn.dataset.openCase) { setCase(btn.dataset.openCase); setView('network'); }
  if(btn.hasAttribute('data-copy-citation')){const {kind,id}=state.selected;const citation=`CBUS Power, ${recordKind(kind)} ${id}, release ${release.releaseId}  ${recordURL(location.href,kind,id,release.releaseId)}`;navigator.clipboard.writeText(citation).then(()=>toast('Release-specific citation copied')).catch(()=>{downloadJSON({citation},'record-citation.json');toast('Citation downloaded');});}
  if(btn.hasAttribute('data-evidence-packet'))downloadJSON(evidencePacket(state.selected,baseGraph()),'evidence-'+state.selected.id+'-'+release.releaseId+'.json');
  if (btn.dataset.start) revealNode(btn.dataset.start);
  if(btn.dataset.mapConnection){showConnectionOnMap(btn.dataset.mapConnection);return;}
  if(btn.dataset.nodeDetail){revealNode(btn.dataset.nodeDetail,btn.dataset.endpointOf);if(btn.dataset.endpointOf||btn.localName==='a')focusRecordHeading();return;}
  if (btn.dataset.edge && !btn.closest('#graph')) { selectEdge(btn.dataset.edge);if(btn.localName==='a'||btn.closest('#project-steps'))focusRecordHeading();return; }
  if(btn.dataset.pinConnection){researchUI.toggle('connection',btn.dataset.pinConnection);return;}
  if(btn.dataset.source)inspectSource(btn.dataset.source);
  if (btn.hasAttribute('data-focus')) { state.focus = !state.focus; renderGraph(); renderInspector();decorateInspector();fitGraph();syncURL(); }
  if (btn.hasAttribute('data-clear-highlight')) { settleExpansion(false);const refit=state.focus;state.focus = false; state.path = null; render(refit); }
});
document.addEventListener('keydown', event => {
  if(event.code==='Space'&&!event.target.closest('input,textarea,select,[contenteditable=true]')){spaceToPan=true;$('graph').dataset.selectionMode='false';}
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'&&!event.shiftKey&&state.view==='network'&&!event.target.closest('input,textarea,[contenteditable=true]')&&explorationHistory.length){event.preventDefault();undoExploration();return;}
  const editable=event.target.closest('input,select,textarea,[contenteditable=true]');
  if(document.querySelector('dialog[open]'))return;
  if((event.key==='/'&&!editable)||((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k')){
    event.preventDefault();desk.focusSearch();return;
  }
  if(event.key==='Escape'){
    if(!$('entity-tooltip').hidden)hideEntityTooltip();
    if(desk.tool)desk.closeTool();
    event.preventDefault();
  }
});
document.addEventListener('keyup',event=>{if(event.code==='Space'){spaceToPan=false;$('graph').dataset.selectionMode=String(boxSelectMode);}});
window.addEventListener('blur',()=>{spaceToPan=false;$('graph').dataset.selectionMode=String(boxSelectMode);});
document.addEventListener('pointerover',event=>{const button=event.target.closest('[data-tag]');if(button&&button!==tagPreviewOwner)showTagPreview(button);});
document.addEventListener('pointerout',event=>{const button=event.target.closest('[data-tag]');if(button&&!button.contains(event.relatedTarget)&&document.activeElement!==button)hideTagPreview();});
document.addEventListener('focusin',event=>{const button=event.target.closest('[data-tag]');if(button)showTagPreview(button);});
document.addEventListener('focusout',event=>{if(event.target===tagPreviewOwner)hideTagPreview();});
window.addEventListener('scroll',()=>{if(previewTag)hideTagPreview();},true);

$('path-form').addEventListener('input',()=>{
  pathSubmitted=false;$('path-result').replaceChildren();scheduleWorkspaceState();
});
$('path-form').addEventListener('submit', event => {
  event.preventDefault();pathSubmitted=true;scheduleWorkspaceState();const available=baseGraph(),resolve=value=>available.nodes.find(node=>normalize(node.name)===normalize(value)||node.id===value)?.id;
  const from=resolve($('path-from').value),to=resolve($('path-to').value);
  if(!from||!to||from===to){$('path-result').innerHTML='<p class="path-result" role="alert">Choose two different entities from the suggestions.</p>';return;}
  const routes=findPaths(available,from,to,{directed:$('path-directed').checked});
  if(!routes.length){$('path-result').innerHTML='<p class="path-result">No route found within six steps and the current case, mode, direction and dates. Longer paths may exist.</p>';return;}
  $('path-result').innerHTML=routes.map((route,index)=>`<div class="path-result"><strong>Route ${index+1} · ${route.edges.length} ${route.edges.length===1?'link':'links'}</strong><p>${escape(route.edges.length===1?'Recorded link period: '+edgeById.get(route.edges[0]).period:'Overlapping date range: '+overlapLabel(route.dates.status))}</p>${route.nodes.map((id,i)=>`${i?`<div class="path-edge-label">${escape(edgeById.get(route.edges[i-1]).type)} · ${escape(readerField(edgeById.get(route.edges[i-1]),'label'))}<br>${escape(edgeById.get(route.edges[i-1]).period)} · ${escape(evidenceStatuses[edgeById.get(route.edges[i-1]).status])}</div>`:''}<div class="path-hop"><button data-node-detail="${id}">${escape(nodeById.get(id).name)}</button></div>`).join('')}<button class="explore-button path-show-button" data-show-route="${index}">Show this path</button> <button class="small-link" data-packet-route="${index}">Download path data</button></div>`).join('')+'<p>Up to three routes, at most six steps. </p>';
  $('path-result').querySelectorAll('[data-show-route]').forEach(button=>button.addEventListener('click',()=>{desk.closeTool(false);showExplorationPath(routes[Number(button.dataset.showRoute)],[from,to]);}));
  $('path-result').querySelectorAll('[data-packet-route]').forEach(button=>button.addEventListener('click',()=>{const route=routes[Number(button.dataset.packetRoute)];downloadJSON(evidencePacket({kind:'path',...route}),'path-'+release.releaseId+'.json');}));
});
function currentExport() {
  if(graph.pinNetwork){
    const data=datasetFor(graph);
    const output={...data,view:'network',case:'all',scope:'pinned-network',nodes:data.entities,edges:data.relationships,
      pins:state.research.steps.map(({kind,id})=>({kind,id})),viewURL:encodeState(location.href,state,release.releaseId)};
    return {output,name:'cbus-power-pins-'+release.releaseId+'.json'};
  }
  let exported = graph;
  if(state.view==='relations') { const links=visibleRelations(); const ids=new Set(links.flatMap(e=>[e.source,e.target])); exported={nodes:baseGraph().nodes.filter(n=>ids.has(n.id)),edges:links}; }
  if (state.view === 'directory') { const base = baseGraph(); const list = base.nodes.filter(n => matches(n, state.query)); const ids = new Set(list.map(n => n.id)); exported = { nodes: list, edges: base.edges.filter(e => ids.has(e.source) && ids.has(e.target)) }; }
  if (state.view === 'sources') { const base = baseGraph(); const visible = new Set(visibleSources().map(s => s.id)); const links = base.edges.filter(e => e.sourceIds.some(id => visible.has(id))); const ids = new Set(links.flatMap(e => [e.source, e.target])); exported = { nodes: base.nodes.filter(n => ids.has(n.id) || n.sourceIds.some(id => visible.has(id))), edges: links }; }
  const sourceIds = new Set([...exported.nodes.flatMap(n => n.sourceIds), ...exported.edges.flatMap(e => e.sourceIds)]);
  const output = { meta, view:state.view,case:state.caseId, filters:{categories:[...state.categories],relationships:[...state.relationships],includeHistory:state.history,query:state.query},...(state.caseId==='media'?{outletProfiles:mediaProfiles.filter(p=>[p.outlet,...p.authority,...p.affiliations].every(id=>exported.nodes.some(n=>n.id===id))),researchLeads:mediaLeads}:{}),nodes:exported.nodes,edges:exported.edges,sources:sources.filter(s=>sourceIds.has(s.id)).map(({url,archiveUrl,archiveBrowseUrl,...record})=>({...record,url:archiveUrl||url})) };
  Object.assign(output,datasetFor(exported));
  if(state.view==='network'&&state.tags.size){const selection=tagSelection(exported,state.tags),single=state.tags.size===1;output.tagSelection={...(single?{id:[...state.tags][0],label:tagDefinitions[[...state.tags][0]].label}:{}),tags:selection.byTag,mode:selection.mode,connectionLimit:selection.connectionLimit,entityIds:[...selection.matches.nodes],relationshipIds:[...selection.matches.edges],connectorRelationshipIds:[...selection.connectors]};}
  output.nodes=output.entities;output.edges=output.relationships;output.filters={...output.filters,connectionMode:state.connectionMode,from:state.from,to:state.to,includeUncertain:state.includeUncertain,...(state.view==='network'?{pinnedIds:[...state.pinnedIds],connectionDistance:state.connectionDistance,colorMode:state.colorMode,centerEntity:focusEntityId(),tag:state.tags.size===1?[...state.tags][0]:null,tags:[...state.tags]}:{})};output.viewURL=encodeState(location.href,state,release.releaseId);
  return {output,name:`cbus-power-${state.view}-${release.releaseId}.json`};
}
function openDataDownload(){
  const {output,name}=currentExport();
  const viewNames={network:'Network',relations:'Links',directory:'Entities',sources:'Sources'};
  const scope={network:graph.pinNetwork?'all research pins, their endpoints and the recorded links shown between them':'the entities and connections currently on the map',relations:'the matching links and their endpoints',directory:'the matching entities and links among them',sources:'the matching sources and records they support'}[state.view];
  const counts=[`${output.entities.length} entities`,`${output.relationships.length} links`,`${output.sources.length} sources`,...(output.events?[`${output.events.length} events`]:[])].join(' · ');
  const selectedFilters=graph.pinNetwork?'Pinned network across all topics and dates':[cases[state.caseId]?.title||'All topics',state.query?`Search: ${state.query}`:'No search term',`${state.categories.size} entity categories`,`${state.relationships.size} connection types`].join(' · ');
  $('data-download-summary').textContent=`This file contains ${scope}. Check the selection before saving it.`;
  $('data-download-details').innerHTML=`<dt>View</dt><dd>${escape(viewNames[state.view])}</dd><dt>Edition</dt><dd>${escape(release.releaseId)}</dd><dt>Format</dt><dd>JSON</dd><dt>Records</dt><dd>${escape(counts)}</dd><dt>Active selection</dt><dd>${escape(selectedFilters)}</dd><dt>File name</dt><dd>${escape(name)}</dd>`;
  $('data-download-manifest').href=`./downloads/${encodeURIComponent(release.releaseId)}/manifest.json`;
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
function syncReportingControls(){$('connection-mode').value=state.connectionMode;$('valid-from').value=state.from;$('valid-to').value=state.to;$('include-uncertain').checked=state.includeUncertain;$('connection-distance').value=state.connectionDistance==='all'?'7':String(state.connectionDistance);$('canvas-color-mode').value=state.colorMode;}
function keepMapPreference(key,value){
  if(state.view==='network'||!networkReturn)return;
  const query=new URLSearchParams(networkReturn.query);
  query.set(key,String(value));
  if(key==='distance'&&value==='all')query.delete('path');
  networkReturn.query='?'+query.toString();
}
function setCanvasDistance(distance,{remember=true}={}){
  if(remember){settleExpansion(false);rememberView();}
  state.connectionDistance=distance;defaults.connectionDistance=distance;keepMapPreference('distance',distance);
  if(distance==='all'){state.showDirect=false;state.path=null;}
  try{localStorage.setItem(distancePreferenceKey,String(distance));}catch{}
  render();syncReportingControls();
}
let changingDistance=false;
$('connection-distance').addEventListener('input',()=>{
  const value=$('connection-distance').value;
  setCanvasDistance(value==='7'?'all':normalizeConnectionDistance(value),{remember:!changingDistance});changingDistance=true;
});
$('connection-distance').addEventListener('change',()=>{changingDistance=false;});
$('distance-show-all').addEventListener('click',()=>setCanvasDistance('all'));
$('canvas-color-mode').addEventListener('change',()=>{
  rememberView();state.colorMode=normalizeColorMode($('canvas-color-mode').value);defaults.colorMode=state.colorMode;keepMapPreference('colors',state.colorMode);
  try{localStorage.setItem(colorPreferenceKey,state.colorMode);}catch{}
  render();
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
  const valid=state.selected&&(state.selected.kind==='node'?nodeById.has(state.selected.id):state.selected.kind==='edge'?edgeById.has(state.selected.id):state.selected.kind==='source'?sourceById.has(state.selected.id):false);
  const messages=[];if(state.selected&&!valid){messages.push('Unknown record ID; no record was substituted.');state.selected=null;}
  const project=projects.get(state.projectId);
  if(state.projectId&&!project){messages.push('This research project is unavailable in this edition.');state.projectId='';}
  const projectStep=project?.steps.find(step=>step.id===requested.projectStep)?.id||'';
  state.projectStep=projectStep;
  if(state.requestedRelease&&state.requestedRelease!==release.releaseId)messages.push(`This link cites ${state.requestedRelease}; this site contains ${release.releaseId}. Consult the saved release before citing.`);
  if(state.routeWarning)messages.push(state.routeWarning);
  $('route-warning').textContent=messages.join(' ');$('route-warning').hidden=!messages.length;
  $('list-search').value=state.query;$('history').checked=state.history;syncReportingControls();
  $('filters').querySelectorAll('[data-category]').forEach(input=>input.checked=state.categories.has(input.dataset.category));
  $('filters').querySelectorAll('[data-relationship]').forEach(input=>input.checked=state.relationships.has(input.dataset.relationship));
  $('label-toggle').textContent=state.labels==='auto'?'Labels auto':state.labels==='all'?'More labels':'Labels off';
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
  if(project){
    const entryLink=[...new URLSearchParams(location.search).keys()].every(key=>['project','release','step'].includes(key));
    if(entryLink){scopeProject(project);state.projectStep=projectStep;}
    else if(mappedProject())arrangeProject(project);
  }
  if(focusEntityId()){if(nodeById.has(focusEntityId()))state.explorationSeeds.add(focusEntityId());else state.focus=false;}
  applyCaseLayout();render(true);restoreProjectReading();restoringURL=false;
  // Preserve mismatched release citation in the incoming URL until the reader changes the view.
  if(!state.requestedRelease||state.requestedRelease===release.releaseId)syncURL();
  if(window.parent===window&&state.selected&&!$('inspector').hidden)requestAnimationFrame(revealInspector);
}
$('release-label').textContent=`Edition · ${release.releaseId}`;
window.addEventListener('popstate',restoreURL);restoreURL();
$('label-toggle').addEventListener('click',()=>{keepMapPreference('labels',state.labels);syncURL();});
$('map-full').addEventListener('click',()=>{
  settleExpansion(false);rememberView();state.pinOverview=false;state.pinFrame=null;state.tags.clear();hideTagPreview();state.customStart=false;state.mapMode='full';
  state.focus=false;state.focusType='';state.showDirect=false;state.selected=null;state.path=null;
  state.multiNodes.clear();state.multiEdges.clear();render(true);
});

$('map-scope').addEventListener('click',()=>{const id=expansionAnchor();if(!nodeById.has(id))return;state.selected={kind:'node',id};state.detailsOpen=true;render();revealInspector();});
$('search-show-all').addEventListener('click',()=>{
  settleExpansion();rememberView();resetFilters(false);state.caseId='all';$('topic-select').value='all';$('graph-title').textContent='Columbus network';
  state.startingIds=new Set();state.explorationSeeds=new Set();state.exploredIds=new Set();state.openNodes=new Set();state.exploreRoot='';state.customStart=false;state.mapMode='full';
  desk.dismiss();setView('network');applyCaseLayout();render(true);$('graph').focus({preventScroll:true});
});
if(repositoryURL){
  $('github-contribute').href=repositoryURL+'/blob/main/docs/CONTRIBUTING.md';
  $('github-contact').href=repositoryURL+'/issues';$('github-contact').hidden=false;
}

// Same-origin workspace bridge. Each tab owns an independent explorer instance.
function workspaceSnapshot(){
  const finalPositions=new Map(positions);
  expansionAnimation?.targets.forEach((p,id)=>finalPositions.set(id,p));
  const layout=desk.snapshot();
  return {
    query:location.search,mapLayout:'stable-network-v1',desk:layout,
    ...(state.projectId&&state.projectPlace?{projectPlace:state.projectPlace}:{}),
    ...(state.pinOverview&&state.pinFrame?{pinFrame:state.pinFrame}:{}),
    ...(pathContext!==null?{pathFinder:{from:$('path-from').value,to:$('path-to').value,
      directed:$('path-directed').checked,submitted:pathSubmitted}}:{}),
    ...(networkReturn&&state.view!=='network'?{returnMap:networkReturn}:{}),
    interaction:{orbitIds:[...state.orbitIds],walk:state.walk.map(step=>({...step})),showDirect:state.showDirect,
      entities:[...state.multiNodes],connections:[...state.multiEdges],bucketIds:state.bucketIds?[...state.bucketIds]:null},
    ...(!cloudNeedsFit?{overviewIds:[...cloudSceneIds]}:{}),
    positions:[...finalPositions].map(([id,p])=>[id,p.x,p.y]),
    camera:{...(expansionAnimation?.endCamera||cameraMotion?.target||camera)},dimensions:{...dimensions},scale:entityScale,
    research:structuredClone(state.research),details:{open:!!state.selected,docked:!layout.floating,width:layout.width,height:layout.height}
  };
}
function publishWorkspaceState(requestId=null){
  if(window.parent===window)return;
  window.parent.postMessage({channel:'columbus-explorer',type:'state',snapshot:workspaceSnapshot(),requestId},location.origin);
}
function scheduleWorkspaceState(){clearTimeout(workspaceTimer);workspaceTimer=setTimeout(publishWorkspaceState,180);}
function measureWorkspace(){
  if(window.parent===window)return;
  const height=document.body.dataset.landing==='true'?$('entry').scrollHeight:0;
  window.parent.postMessage({channel:'columbus-explorer',type:'height',height},location.origin);
}
function restoreWorkspaceView(input,{keepUndo=false}={}){
  const saved=validateView(input,new Set(nodeById.keys()));
  settleExpansion(false);history.replaceState(null,'',location.pathname+saved.query);
  networkReturn=saved.returnMap||null;desk.dismiss();restoreURL();restoringURL=true;
  state.detailsOpen=!!state.selected;
  const project=projects.get(state.projectId),place=saved.projectPlace;
  if(place&&project&&project.route.nodes.length===place.positions.length&&place.positions.every(([id])=>project.route.nodes.includes(id)))state.projectPlace=place;
  if(saved.research){state.research=saved.research;syncResearchPins();}
  state.pinOverview=!!(state.pinOverview&&state.research.steps.length);state.pinFrame=saved.pinFrame||null;
  const interaction=saved.interaction||{};
  state.orbitIds=new Set(interaction.orbitIds);
  state.walk=interaction.walk||[];
  if(!state.walk.length&&state.selected?.kind==='node')state.walk=[{id:state.selected.id,via:''}];
  state.showDirect=interaction.showDirect===true;
  state.multiNodes=new Set(interaction.entities);state.multiEdges=new Set(interaction.connections);
  state.bucketIds=interaction.bucketIds?new Set(interaction.bucketIds):null;
  if(!selectionCount()&&state.selected?.kind==='node')state.multiNodes.add(state.selected.id);
  if(!selectionCount()&&state.selected?.kind==='edge')state.multiEdges.add(state.selected.id);
  cloudSceneIds=new Set(saved.overviewIds||[]);cloudNeedsFit=cloudView()&&!saved.overviewIds?.length;
  const hasLayout=saved.mapLayout==='stable-network-v1'&&saved.positions.length>0;
  const selectedEdge=state.selected?.kind==='edge'?edgeById.get(state.selected.id):null;
  if(!hasLayout&&state.view==='network'&&selectedEdge&&!state.pinOverview&&!state.walk.length){
    const route=new URLSearchParams(saved.query);
    if(state.path?.edges.length===1&&state.path.edges[0]===selectedEdge.id)state.walk=walkConnection([],selectedEdge);
    else if(!state.path&&!state.focus&&state.caseId==='all'&&!['starts','seeded','path','categories','relationships','from','to','tag','tags'].some(key=>route.has(key)))scopeToConnection(selectedEdge);
  }
  if(hasLayout){
    saved.positions.forEach(([id,x,y])=>positions.set(id,{x,y}));entityScale=saved.scale;
    $('graph').style.setProperty('--entity-label-size',Math.max(11,13*entityScale)+'px');
  }
  // Open the saved panel before measuring. Changing tabs or reopening a file keeps the same world point in view.
  // Restoring form fields must never focus a background workspace tab.
  pathContext=null;pathScope='';pathSubmitted=false;
  if(saved.pathFinder||saved.desk?.active==='path'){
    openPathFinder(false);
    if(saved.pathFinder){
      $('path-from').value=saved.pathFinder.from;$('path-to').value=saved.pathFinder.to;
      $('path-directed').checked=saved.pathFinder.directed;
      if(saved.pathFinder.submitted)$('path-form').requestSubmit();
    }
  }
  if(saved.desk?.active==='research')researchUI.refreshLibrary();
  desk.restore(recordDeskForView(saved),state.selected);
  render();
  const bounds=$('canvas-area').getBoundingClientRect();
  if(hasLayout){
    dimensions=bounds.width&&bounds.height?{width:bounds.width,height:bounds.height}:{...saved.dimensions};
    camera=resizeCamera(saved.camera,saved.dimensions,dimensions,positions.get(focusEntityId()));
    positionGraph();
  }else if(state.view==='network'&&state.selected?.kind==='node')focusExploration(state.selected.id,true);
  else if(state.view==='network'&&bounds.width)fitGraph();
  restoreProjectReading();
  if(!keepUndo)explorationHistory.length=0;
  $('undo-map').disabled=!explorationHistory.length;
  $('return-map').hidden=state.view==='network'||!networkReturn;
  restoringURL=false;syncURL();publishWorkspaceState();measureWorkspace();
}
window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==window.parent||event.data?.channel!=='columbus-explorer')return;
  if(Number.isFinite(event.data.viewportHeight))document.documentElement.style.setProperty('--desk-height',Math.max(1,event.data.viewportHeight)+'px');
  if(Array.isArray(event.data.safeArea))['top','right','bottom','left'].forEach((edge,i)=>{
    const inset=event.data.safeArea[i];if(Number.isFinite(inset))document.documentElement.style.setProperty('--phone-safe-'+edge,inset+'px');
  });
  if(Number.isFinite(event.data.visibleBottom))desk.setVisibleBottom(event.data.visibleBottom);
  if(event.data.type==='restore'){try{restoreWorkspaceView(event.data.snapshot);if(event.data.focusEntry&&document.body.dataset.landing==='true')desk.focusSearch();}catch{toast('This view could not be restored.');}}
  if(event.data.type==='navigate'&&['network','relations','directory','sources'].includes(event.data.view)){navigateSection(event.data.view);measureWorkspace();publishWorkspaceState();}
  if(event.data.type==='focus-search')desk.focusSearch();
  if(event.data.type==='phone-focus'&&desk.phone)($('phone-tabs').getClientRects().length?$('phone-tabs'):$('phone-menu')).focus({preventScroll:true});
  if(event.data.type==='research-library')researchUI.openSaved();
  if(event.data.type==='capture')publishWorkspaceState(event.data.requestId);if(event.data.type==='measure')requestAnimationFrame(()=>{if(state.view==='network'&&graph&&$('canvas-area').getBoundingClientRect().width>0){positionGraph();}measureWorkspace();});
});
for(const type of ['pointerdown','focusin'])document.addEventListener(type,()=>{if(window.parent!==window)window.parent.postMessage({channel:'columbus-explorer',type:'focus'},location.origin);},true);
document.addEventListener('pointerup',scheduleWorkspaceState);document.addEventListener('change',scheduleWorkspaceState);new ResizeObserver(()=>requestAnimationFrame(measureWorkspace)).observe(document.body);
if(window.parent!==window)window.parent.postMessage({channel:'columbus-explorer',type:'ready'},location.origin);
