// One deterministic world layout, independent of viewport, selection and zoom.
// Coordinates are presentation only; records and relationships remain unchanged.
export function networkPositions(graph){
  const ordered=[...graph.nodes].sort((a,b)=>a.id.localeCompare(b.id));
  const points=ordered.map((node,i)=>({id:node.id,x:(node.x||0)*1.15+Math.sin(i*2.399)*19,y:(node.y||0)*1.15+Math.cos(i*2.399)*19}));
  const index=new Map(points.map((p,i)=>[p.id,i]));
  const links=graph.edges.map(edge=>[index.get(edge.source),index.get(edge.target)]).filter(pair=>pair.every(i=>i!==undefined));
  for(let pass=0;pass<150;pass++){
    const forces=points.map(()=>({x:0,y:0})),cool=.8*(1-pass/180);
    for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
      const a=points[i],b=points[j],dx=a.x-b.x,dy=a.y-b.y,d=Math.max(1,Math.hypot(dx,dy));
      const push=Math.min(28,4200/(d*d));
      forces[i].x+=dx/d*push;forces[i].y+=dy/d*push;forces[j].x-=dx/d*push;forces[j].y-=dy/d*push;
    }
    for(const [i,j]of links){const a=points[i],b=points[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy)),pull=(d-155)*.012;forces[i].x+=dx/d*pull;forces[i].y+=dy/d*pull;forces[j].x-=dx/d*pull;forces[j].y-=dy/d*pull;}
    points.forEach((point,i)=>{point.x+=Math.max(-24,Math.min(24,forces[i].x))*cool;point.y+=Math.max(-24,Math.min(24,forces[i].y))*cool;});
  }
  return new Map(points.map(p=>[p.id,{x:Math.round(p.x*100)/100,y:Math.round(p.y*.72*100)/100}]));
}
export function frameNetwork(ids,positions,{width,height,padding=55}={}){
  const points=[...ids].map(id=>positions.get(id)).filter(Boolean);if(!points.length)return {x:0,y:0,z:1};
  const left=Math.min(...points.map(p=>p.x)),right=Math.max(...points.map(p=>p.x)),top=Math.min(...points.map(p=>p.y)),bottom=Math.max(...points.map(p=>p.y));
  const z=Math.max(.04,Math.min(2,(width-padding*2)/Math.max(100,right-left),(height-padding*2)/Math.max(100,bottom-top)));
  return {z,x:width/2-(left+right)/2*z,y:height/2-(top+bottom)/2*z};
}
export function networkStyle(degree,zoom,{selected=false}={}){
  return {detail:selected||zoom>.5?1:0,bubble:false,cloud:false,opacity:1,threshold:0,font:selected?13:12,radius:selected?18:Math.max(6,Math.min(15,6+Math.sqrt(degree||0)*1.5)*Math.min(1.3,Math.sqrt(zoom/.25)))};
}
export function showNetworkLabel(degree,zoom,{selected=false,neighbor=false,all=false}={}){
  return all||selected||neighbor||degree>=(zoom<.35?8:zoom<.65?4:zoom<1?2:0);
}
export function connectedCanvas(graph){
  const available=new Set(graph.nodes.map(n=>n.id)),edges=graph.edges.filter(e=>available.has(e.source)&&available.has(e.target)),linked=new Set(edges.flatMap(e=>[e.source,e.target]));
  return {...graph,nodes:graph.nodes.filter(n=>linked.has(n.id)),edges};
}
export function directConnections(graph,id,type=''){
  const edges=graph.edges.filter(e=>(e.source===id||e.target===id)&&(!type||e.type===type));
  return {edges,nodes:new Set([id,...edges.flatMap(e=>[e.source,e.target])])};
}
// Labels yield to one another; entity positions never participate in decluttering.
export function labelPlacements(items,{width,height,obstacles=[],gap=3}={}){
  const grid=new Map(),placed=new Map(),cell=64;
  const keys=b=>{const out=[];for(let x=Math.floor(b.left/cell);x<=Math.floor(b.right/cell);x++)for(let y=Math.floor(b.top/cell);y<=Math.floor(b.bottom/cell);y++)out.push(x+':'+y);return out;};
  const overlaps=(a,b)=>a.left<b.right+gap&&a.right>b.left-gap&&a.top<b.bottom+gap&&a.bottom>b.top-gap;
  for(const item of [...items].sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id))){
    const {x,y,r,w,h}=item,candidates=[[x-w/2,y+r+5],[x-w/2,y-r-h-5],[x+r+7,y-h/2],[x-r-w-7,y-h/2],[x+r+8,y+r+3],[x-r-w-8,y+r+3],[x-w/2,y+r+h+10],[x-w/2,y-r-h*2-10]];
    for(const [left,top]of candidates){const box={left,top,right:left+w,bottom:top+h};
      if(left<8||top<8||box.right>width-8||box.bottom>height-8||obstacles.some(o=>overlaps(box,o)))continue;
      const cells=keys(box),near=new Set(cells.flatMap(k=>grid.get(k)||[]));if([...near].some(o=>overlaps(box,o)))continue;
      placed.set(item.id,box);for(const k of cells){if(!grid.has(k))grid.set(k,[]);grid.get(k).push(box);}break;
    }
  }
  return placed;
}
export function appendWalk(walk,id,{from='',via='',edges=[]}={}){
  const result=walk.map(step=>({...step}));if(!result.length)result.push({id:from||id,via:''});
  if(via){const edge=edges.find(e=>e.id===via);if(!edge||!((edge.source===from&&edge.target===id)||(edge.target===from&&edge.source===id)))throw Error('The selected relationship does not connect these entities.');
    if(result.at(-1).id!==from)result.push({id:from,via:''});result.push({id,via});
  }else if(result.at(-1).id!==id)result.push({id,via:''});
  return result.length>30?[result[0],{...result.at(-28),via:''},...result.slice(-27)]:result;
}
