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
function routeBetween(graph,from,to){
  if(from===to)return {nodes:[from],edges:[]};
  const links=new Map(graph.nodes.map(node=>[node.id,[]]));
  for(const edge of graph.edges){links.get(edge.source)?.push([edge.target,edge.id]);links.get(edge.target)?.push([edge.source,edge.id]);}
  const previous=new Map([[from,null]]),queue=[from];
  for(let i=0;i<queue.length&&!previous.has(to);i++)for(const [id,edge]of links.get(queue[i])||[])if(!previous.has(id)){previous.set(id,{id:queue[i],edge});queue.push(id);}
  if(!previous.has(to))return null;
  const nodes=[to],edges=[];let id=to;
  while(id!==from){const step=previous.get(id);edges.unshift(step.edge);nodes.unshift(step.id);id=step.id;}
  return {nodes,edges};
}
export function researchConnections(steps,graph){
  const byEdge=new Map(graph.edges.map(edge=>[edge.id,edge])),anchors=new Set(),pinnedEdges=new Set(),nodeIds=new Set(),edgeIds=new Set(),segments=[];
  let previous=null;
  for(const step of steps){
    const edge=step.kind==='connection'?byEdge.get(step.id):null;
    const endpoints=step.kind==='entity'?[step.id]:edge?[edge.source,edge.target]:[];
    endpoints.forEach(id=>{anchors.add(id);nodeIds.add(id);});
    if(previous&&endpoints.length){
      const route=routeBetween(graph,previous,endpoints[0]);segments.push({from:previous,to:endpoints[0],route,kind:'connecting-route'});
      route?.nodes.forEach(id=>nodeIds.add(id));route?.edges.forEach(id=>edgeIds.add(id));
    }
    if(edge){pinnedEdges.add(edge.id);edgeIds.add(edge.id);}
    if(endpoints.length)previous=endpoints.at(-1);
  }
  return {anchors,pinnedEdges,nodeIds,edgeIds,segments};
}
export function researchFile(research,snapshot,release,records,graph){
  const route=researchConnections(research.steps,graph);
  const query=new URLSearchParams(snapshot.query);
  query.set('view','network');query.set('map','explore');query.set('focus','0');query.delete('record');query.delete('center');
  query.set('path',[...route.edgeIds].join(','));query.set('seeded',[...route.nodeIds].join(','));query.set('explored',[...route.nodeIds].join(','));query.set('expanded','');query.set('starts',[...route.anchors].join(','));query.set('startOnly','1');
  const pathSnapshot={...snapshot,query:'?'+query.toString(),research:structuredClone(research),details:{...snapshot.details,open:false}};
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
