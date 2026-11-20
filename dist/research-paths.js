// A research path is a reader's selection of existing, sourced records.
export const researchFormat='columbus-research-path';
export const researchVersion=1;
export const emptyResearch=()=>({id:'',title:'Untitled research path',createdAt:'',steps:[]});
export function validateResearch(value,nodeIds,edgeIds){
  if(value==null)return emptyResearch();
  if(typeof value!=='object'||!Array.isArray(value.steps)||value.steps.length>200)throw Error('This research path has too many steps or an invalid format.');
  if(typeof value.title!=='string'||!value.title.trim()||value.title.length>100)throw Error('Give the research path a name of 1–100 characters.');
  const seen=new Set();
  const steps=value.steps.map(step=>{
    if(!step||!['entity','connection'].includes(step.kind)||typeof step.id!=='string'||!(step.kind==='entity'?nodeIds:edgeIds).has(step.id))throw Error('A research step references a record unavailable in this edition.');
    const key=step.kind+':'+step.id;if(seen.has(key))throw Error('A research step is repeated.');seen.add(key);
    if(step.note!=null&&(typeof step.note!=='string'||step.note.length>1000))throw Error('A step note must be text of up to 1,000 characters.');
    return {kind:step.kind,id:step.id,note:step.note||''};
  });
  return {id:typeof value.id==='string'?value.id.slice(0,80):'',title:value.title.trim(),createdAt:typeof value.createdAt==='string'?value.createdAt.slice(0,40):'',steps};
}
function adjacency(graph){
  const links=new Map(graph.nodes.map(node=>[node.id,[]]));
  for(const edge of graph.edges){links.get(edge.source)?.push([edge.target,edge.id]);links.get(edge.target)?.push([edge.source,edge.id]);}
  return links;
}
function predecessors(links,from,to=null){
  const previous=new Map([[from,null]]),queue=[from];
  for(let i=0;i<queue.length&&!previous.has(to);i++)for(const [id,edge]of links.get(queue[i])||[])if(!previous.has(id)){previous.set(id,{id:queue[i],edge});queue.push(id);}
  return previous;
}
function routeBetween(links,from,to){
  if(from===to)return {nodes:[from],edges:[]};
  const previous=predecessors(links,from,to);
  if(!previous.has(to))return null;
  const nodes=[to],edges=[];let id=to;
  while(id!==from){const step=previous.get(id);edges.unshift(step.edge);nodes.unshift(step.id);id=step.id;}
  return {nodes,edges};
}
export function researchConnections(steps,graph){
  const byEdge=new Map(graph.edges.map(edge=>[edge.id,edge])),anchors=new Set(),pinnedEntities=new Set(),pinnedEdges=new Set(),nodeIds=new Set(),edgeIds=new Set(),segments=[];
  const links=steps.length>1?adjacency(graph):null;
  let previous=null;
  for(const step of steps){
    if(step.kind==='entity')pinnedEntities.add(step.id);
    const edge=step.kind==='connection'?byEdge.get(step.id):null;
    const endpoints=step.kind==='entity'?[step.id]:edge?[edge.source,edge.target]:[];
    endpoints.forEach(id=>{anchors.add(id);nodeIds.add(id);});
    if(previous&&endpoints.length){
      const route=routeBetween(links,previous,endpoints[0]);segments.push({from:previous,to:endpoints[0],route,kind:'connecting-route'});
      route?.nodes.forEach(id=>nodeIds.add(id));route?.edges.forEach(id=>edgeIds.add(id));
    }
    if(edge){pinnedEdges.add(edge.id);edgeIds.add(edge.id);}
    if(endpoints.length)previous=endpoints.at(-1);
  }
  return {anchors,pinnedEntities,pinnedEdges,nodeIds,edgeIds,segments};
}
// Fit every pin, even when a disconnected pin falls between two related steps.
export function networkForPins(graph,pinnedEntities,pinnedEdges){
  const anchors=new Set(pinnedEntities),edgeIds=new Set(pinnedEdges),links=adjacency(graph);
  for(const edge of graph.edges)if(edgeIds.has(edge.id)){anchors.add(edge.source);anchors.add(edge.target);}
  for(const edge of graph.edges)if(anchors.has(edge.source)&&anchors.has(edge.target))edgeIds.add(edge.id);
  const nodesOnRoutes=new Set(),visited=new Set();let components=0;
  for(const root of anchors){
    if(visited.has(root)||!links.has(root))continue;
    components++;const tree=predecessors(links,root);nodesOnRoutes.add(root);
    for(const id of anchors){
      if(!tree.has(id))continue;
      visited.add(id);
      for(let node=id;!nodesOnRoutes.has(node);){
        nodesOnRoutes.add(node);const step=tree.get(node);edgeIds.add(step.edge);node=step.id;
      }
    }
  }
  return {nodes:graph.nodes.filter(node=>nodesOnRoutes.has(node.id)),edges:graph.edges.filter(edge=>edgeIds.has(edge.id)),components};
}
export function researchFile(research,snapshot,release,records,graph){
  const route=researchConnections(research.steps,graph);
  const query=new URLSearchParams(snapshot.query);
  query.set('view','network');query.set('map','explore');query.set('focus','0');query.delete('record');query.delete('center');query.delete('pinsView');
  query.set('path',[...route.edgeIds].join(','));query.set('seeded',[...route.nodeIds].join(','));query.set('explored',[...route.nodeIds].join(','));query.set('expanded','');query.set('starts',[...route.anchors].join(','));query.set('startOnly','1');
  const {returnMap,pinFrame,...presentation}=snapshot;
  const pathSnapshot={...presentation,...(snapshot.desk?{desk:{...snapshot.desk,active:'research'}}:{}),query:'?'+query.toString(),research:structuredClone(research),details:{...snapshot.details,open:false}};
  return {format:researchFormat,version:researchVersion,id:research.id,title:research.title,createdAt:research.createdAt,savedAt:new Date().toISOString(),release,research,snapshot:pathSnapshot,connectingRoutes:route.segments.map(segment=>({from:segment.from,to:segment.to,kind:segment.kind,entityIds:segment.route?.nodes||[],relationshipIds:segment.route?.edges||[]})),records,interpretation:'Pinned steps are the reader’s research choices. Connecting routes use recorded relationships; they do not establish causation or wrongdoing.'};
}
export function researchSnapshot(file,{nodeIds,edgeIds,validateSnapshot}){
  if(file?.format!==researchFormat||file.version!==researchVersion)throw Error('Choose a research path file exported by this explorer.');
  const research=validateResearch(file.research,nodeIds,edgeIds);
  if(!research.steps.length)throw Error('This research path has no pinned steps.');
  // Embedded records accompany a saved artifact for citation; the current map
  // always resolves IDs against its own dataset instead of importing facts.
  return validateSnapshot({...file.snapshot,research},nodeIds);
}
