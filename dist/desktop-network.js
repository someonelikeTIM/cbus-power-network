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
  return {detail:zoom>.5?1:0,bubble:false,cloud:false,opacity:1,threshold:0,font:11,radius:Math.max(3,(4+Math.min(11,Math.sqrt(degree||0)*1.6))*Math.min(1.6,Math.sqrt(zoom/.3))+(selected?2:0))};
}
export function showNetworkLabel(degree,zoom,{selected=false,neighbor=false,all=false}={}){
  return all||selected||neighbor||degree>=(zoom<.35?8:zoom<.65?4:zoom<1?2:0);
}
