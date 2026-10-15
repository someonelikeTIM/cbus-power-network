// A presentation subset of existing records; expanding never creates a relationship.
export function connectedNeighbors(graph,id,visible=new Set()){
  const ids=new Set(graph.nodes.map(n=>n.id));
  const linked=new Set(graph.edges.flatMap(e=>e.source===id?[e.target]:e.target===id?[e.source]:[]));
  return graph.nodes.filter(n=>ids.has(n.id)&&linked.has(n.id)&&!visible.has(n.id)).sort((a,b)=>a.name.localeCompare(b.name,'en')||a.id.localeCompare(b.id));
}
export function seedExploration(graph,preferred='city',limit=4){
  const connected=new Set(graph.edges.flatMap(e=>[e.source,e.target]));
  const root=graph.nodes.find(n=>n.id===preferred&&connected.has(n.id))||graph.nodes.filter(n=>connected.has(n.id)).sort((a,b)=>a.name.localeCompare(b.name,'en'))[0]||graph.nodes[0];
  return {root:root?.id||'',ids:new Set(root?[root.id,...connectedNeighbors(graph,root.id).slice(0,limit).map(n=>n.id)]:[])};
}
export function exploredGraph(graph,ids){
  const visible=new Set(graph.nodes.filter(n=>ids.has(n.id)).map(n=>n.id));
  return {...graph,nodes:graph.nodes.filter(n=>visible.has(n.id)),edges:graph.edges.filter(e=>visible.has(e.source)&&visible.has(e.target)),matches:(graph.matches||[]).filter(id=>visible.has(id))};
}
export function normalizeConnectionDistance(value,fallback=6){
  if(value==='all')return 'all';
  const distance=Number(value);
  return Number.isInteger(distance)&&distance>=1&&distance<=12?distance:fallback;
}
// Distance is the shortest number of recorded links, regardless of their direction.
// Restrict presentation only; the original graph and exploration history remain intact.
export function connectionNeighborhood(graph,id,limit=6){
  const distance=normalizeConnectionDistance(limit);
  if(distance==='all')return graph;
  const neighbors=new Map(graph.nodes.map(node=>[node.id,new Set()]));
  if(!neighbors.has(id))return exploredGraph(graph,new Set());
  for(const edge of graph.edges){
    if(!neighbors.has(edge.source)||!neighbors.has(edge.target))continue;
    neighbors.get(edge.source).add(edge.target);neighbors.get(edge.target).add(edge.source);
  }
  const visible=new Set([id]);let frontier=[id];
  for(let step=0;step<distance&&frontier.length;step++){
    const next=[];
    for(const current of frontier)for(const neighbor of neighbors.get(current))if(!visible.has(neighbor)){visible.add(neighbor);next.push(neighbor);}
    frontier=next;
  }
  return exploredGraph(graph,visible);
}
// Starting records and explored anchors stay; each open branch also keeps its neighbors.
export function branchExploration(graph,seeds,opened){
  const available=new Set(graph.nodes.map(node=>node.id));
  const ids=new Set([...seeds,...opened].filter(id=>available.has(id)));
  for(const edge of graph.edges){
    if(opened.has(edge.source)&&available.has(edge.target))ids.add(edge.target);
    if(opened.has(edge.target)&&available.has(edge.source))ids.add(edge.source);
  }
  return ids;
}
export function toggleExploration(graph,seeds,opened,id){
  const nextSeeds=new Set(seeds),nextOpened=new Set(opened),before=branchExploration(graph,seeds,opened);
  if(graph.nodes.some(node=>node.id===id)){
    nextSeeds.add(id);
    if(nextOpened.has(id))nextOpened.delete(id);
    else if(graph.edges.some(edge=>edge.source===id||edge.target===id))nextOpened.add(id);
  }
  const ids=branchExploration(graph,nextSeeds,nextOpened);
  return {seeds:nextSeeds,opened:nextOpened,ids,expanded:nextOpened.has(id),added:[...ids].filter(id=>!before.has(id)),removed:[...before].filter(id=>!ids.has(id))};
}

// Layout changes belong only to newly revealed entities. Existing positions are retained.
export function fanOutPositions(positions,visible,added,anchorId,bounds=null){
  const anchor=positions.get(anchorId)||{x:0,y:0};
  const placed=[...visible].map(id=>positions.get(id)).filter(Boolean),targets=new Map();
  added.forEach((id,index)=>{
    let point,fallback;
    for(let attempt=0;attempt<240;attempt++){
      const angle=(index+attempt)*2.399963,radius=190+Math.floor(attempt/10)*80;
      point={x:anchor.x+Math.cos(angle)*radius,y:anchor.y+Math.sin(angle)*radius};
      if(!placed.every(p=>Math.hypot(p.x-point.x,p.y-point.y)>135))continue;
      fallback??=point;
      if(!bounds||(point.x>=bounds.minX&&point.x<=bounds.maxX&&point.y>=bounds.minY&&point.y<=bounds.maxY)){fallback=point;break;}
    }
    point=fallback||point;
    targets.set(id,point);placed.push(point);
  });
  return targets;
}

// Fit revealed records while retaining the clicked entity's screen position.
export function anchoredCamera(points,anchor,camera,dimensions,padding=38){
  const screen={x:camera.x+anchor.x*camera.z,y:camera.y+anchor.y*camera.z};
  let z=camera.z;
  for(const point of points){
    const dx=point.x-anchor.x,dy=point.y-anchor.y;
    if(dx>0)z=Math.min(z,(dimensions.width-padding-screen.x)/dx);
    if(dx<0)z=Math.min(z,(screen.x-padding)/-dx);
    if(dy>0)z=Math.min(z,(dimensions.height-65-screen.y)/dy);
    if(dy<0)z=Math.min(z,(screen.y-padding)/-dy);
  }
  z=Math.max(.05,z);
  return {z,x:screen.x-anchor.x*z,y:screen.y-anchor.y*z};
}

export function nodeNeighborhood(graph,id){
  const links=graph.edges.filter(edge=>edge.source===id||edge.target===id);
  return {nodes:new Set([id,...links.flatMap(edge=>[edge.source,edge.target])]),edges:new Set(links.map(edge=>edge.id))};
}
export function neighborhoodPositions(positions,id,ids){
  const anchor=positions.get(id),neighbors=[...ids].filter(other=>other!==id);if(!anchor)return new Map();
  const targets=new Map();let placed=0,ring=0;
  while(placed<neighbors.length){
    const count=Math.min(neighbors.length-placed,ring?14:neighbors.length>12?8:12),radius=180+ring*170;
    for(let index=0;index<count;index++){const angle=-Math.PI/2+index*2*Math.PI/count;targets.set(neighbors[placed+index],{x:anchor.x+Math.cos(angle)*radius,y:anchor.y+Math.sin(angle)*radius});}
    placed+=count;ring++;
  }
  return targets;
}
export function neighborhoodCamera(positions,id,ids,viewport){
  const anchor=positions.get(id);if(!anchor)return null;
  const points=[...ids].map(id=>positions.get(id)).filter(Boolean);
  const extentX=Math.max(60,...points.map(point=>Math.abs(point.x-anchor.x))),extentY=Math.max(60,...points.map(point=>Math.abs(point.y-anchor.y)));
  const z=Math.max(.02,Math.min(2,(viewport.width/2-55)/extentX,(viewport.height/2-60)/extentY));
  return {z,x:viewport.left+viewport.width/2-anchor.x*z,y:viewport.top+viewport.height/2-anchor.y*z};
}
export function transitionCamera(from,to,anchor,progress){
  const t=Math.min(1,Math.max(0,progress));if(!t)return {...from};if(t===1)return {...to};
  const z=from.z*Math.pow(to.z/from.z,t),start={x:from.x+anchor.x*from.z,y:from.y+anchor.y*from.z},end={x:to.x+anchor.x*to.z,y:to.y+anchor.y*to.z};
  return {z,x:start.x+(end.x-start.x)*t-anchor.x*z,y:start.y+(end.y-start.y)*t-anchor.y*z};
}

export function connectionLegend(graph,types){
  return Object.entries(types).flatMap(([id,type])=>{
    const shown=graph.edges.filter(edge=>edge.type===id);
    return shown.length?[{id,...type,count:shown.length,allHistorical:shown.every(edge=>edge.historical)}]:[];
  });
}
