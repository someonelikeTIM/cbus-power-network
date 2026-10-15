// Routes are presentation guides made entirely from existing relationship IDs.
export function pathCamera(positions,ids,viewport){
  const points=[...ids].map(id=>positions.get(id)).filter(Boolean);if(!points.length)return null;
  const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
  const z=Math.max(.02,Math.min(2,(viewport.width-120)/Math.max(120,maxX-minX),(viewport.height-120)/Math.max(120,maxY-minY)));
  return {z,x:viewport.left+viewport.width/2-(minX+maxX)/2*z,y:viewport.top+viewport.height/2-(minY+maxY)/2*z};
}
export function shortestExplorationPath(graph,start,end){
  const available=new Set(graph.nodes.map(node=>node.id));
  if(!available.has(start)||!available.has(end))return null;
  const links=new Map([...available].map(id=>[id,[]]));
  for(const edge of graph.edges){if(links.has(edge.source)&&links.has(edge.target)){links.get(edge.source).push([edge.target,edge.id]);links.get(edge.target).push([edge.source,edge.id]);}}
  const previous=new Map([[start,null]]),queue=[start];
  for(let index=0;index<queue.length&&!previous.has(end);index++)for(const [next,edge]of links.get(queue[index]))if(!previous.has(next)){previous.set(next,{node:queue[index],edge});queue.push(next);}
  if(!previous.has(end))return null;
  const nodes=[end],edges=[];let current=end;
  while(current!==start){const step=previous.get(current);edges.unshift(step.edge);nodes.unshift(step.node);current=step.node;}
  return {nodes,edges};
}
export function startingConnections(graph,startingIds){
  const ids=[...new Set(startingIds)].filter(id=>graph.nodes.some(node=>node.id===id)),direct=[],indirect=[],disconnected=[];
  for(let a=0;a<ids.length;a++)for(let b=a+1;b<ids.length;b++){
    const from=ids[a],to=ids[b],links=graph.edges.filter(edge=>(edge.source===from&&edge.target===to)||(edge.source===to&&edge.target===from));
    if(links.length){direct.push({from,to,edgeIds:links.map(edge=>edge.id)});continue;}
    const route=shortestExplorationPath(graph,from,to);
    if(route)indirect.push({from,to,...route});else disconnected.push({from,to});
  }
  return {direct,indirect,disconnected};
}
export function pathForeground(graph,startingIds,path){
  if(!path&&!startingIds.size)return {nodes:new Set(graph.nodes.map(node=>node.id)),edges:new Set(graph.edges.map(edge=>edge.id))};
  const nodes=new Set(path?.nodes||startingIds);
  const edges=new Set(path?.edges||graph.edges.filter(edge=>nodes.has(edge.source)&&nodes.has(edge.target)).map(edge=>edge.id));
  if(!path)for(const route of startingConnections(graph,startingIds).indirect){route.nodes.forEach(id=>nodes.add(id));route.edges.forEach(id=>edges.add(id));}
  return {nodes,edges};
}

export function revealedPathPositions(route,positions,visible){
  const targets=new Map(),placed=[...visible].map(id=>positions.get(id)).filter(Boolean);
  const place=(id,desired,perpendicular={x:0,y:1})=>{
    if(visible.has(id)||targets.has(id))return;
    let point;
    for(let attempt=0;attempt<40;attempt++){
      const offset=attempt?(attempt%2?1:-1)*Math.ceil(attempt/2)*160:0;
      point={x:desired.x+perpendicular.x*offset,y:desired.y+perpendicular.y*offset};
      if(placed.every(other=>Math.hypot(point.x-other.x,point.y-other.y)>130))break;
    }
    targets.set(id,point);placed.push(point);
  };
  const first=route.nodes[0],last=route.nodes.at(-1);
  const originalA=visible.has(first)?positions.get(first):{x:-200,y:0};
  place(first,originalA);place(last,visible.has(last)?positions.get(last):{x:originalA.x+400,y:originalA.y});
  const a=targets.get(first)||positions.get(first),b=targets.get(last)||positions.get(last),dx=b.x-a.x,dy=b.y-a.y,distance=Math.hypot(dx,dy)||1;
  route.nodes.slice(1,-1).forEach((id,index)=>{const t=(index+1)/(route.nodes.length-1);place(id,{x:a.x+dx*t,y:a.y+dy*t},{x:-dy/distance,y:dx/distance});});
  return targets;
}
