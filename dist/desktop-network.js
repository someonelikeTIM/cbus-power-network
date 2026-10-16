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
// A record click always leaves the overview at a readable scale. Preserve a
// closer manual zoom and move only the camera, centered in the available space.
export function entityFocusCamera(point,current,viewport){
  const z=Math.max(1,current.z);
  return {z,x:viewport.left+viewport.width/2-point.x*z,y:viewport.top+viewport.height/2-point.y*z};
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
// Place only newly revealed neighbors. Previously placed entities are immutable.
export function orbitalBranch(graph,anchor,positions,placed=new Set(),{radius=240,ringStep=140,gap=112,parent=''}={}){
  const center=positions.get(anchor);if(!center)return {positions:new Map(),placed:new Set(placed)};
  const locked=new Set([...placed,anchor]),added=new Map(),neighbors=[...directConnections(graph,anchor).nodes].filter(id=>!locked.has(id)).sort();
  const fresh=placed.size===0;
  const previous=positions.get(parent),outward=previous?Math.atan2(center.y-previous.y,center.x-previous.x):-Math.PI/2;
  const occupied=[...locked].filter(id=>id!==anchor).map(id=>positions.get(id)).filter(Boolean);
  for(const id of neighbors){let best=null;
    for(let ring=0;ring<12&&!best;ring++){
      const r=radius+ring*ringStep,capacity=Math.max(1,Math.floor(2*Math.PI*r/gap)),earlier=Array.from({length:ring},(_,i)=>Math.floor(2*Math.PI*(radius+i*ringStep)/gap)).reduce((sum,n)=>sum+n,0),slots=fresh?Math.max(1,Math.min(capacity,neighbors.length-earlier)):Math.max(16,Math.ceil(2*Math.PI*r/(gap*.5))),choices=[];
      for(let i=0;i<slots;i++){const angle=outward+i*2*Math.PI/slots,point={x:center.x+Math.cos(angle)*r,y:center.y+Math.sin(angle)*r};
        const clearance=occupied.length?Math.min(...occupied.map(p=>Math.hypot(p.x-point.x,p.y-point.y))):r*2;
        if(clearance<gap)continue;choices.push({point,score:Math.min(clearance,r*2)+(previous?Math.cos(angle-outward)*42:0),i});
      }
      choices.sort((a,b)=>b.score-a.score||a.i-b.i);best=choices[0]?.point||null;
    }
    if(best){const point={x:Math.round(best.x*100)/100,y:Math.round(best.y*100)/100};added.set(id,point);occupied.push(point);locked.add(id);}
  }
  return {positions:added,placed:locked};
}
const lineInRect=(a,b,r)=>{
  let lo=0,hi=1;const dx=b.x-a.x,dy=b.y-a.y;
  for(const [p,q]of [[-dx,a.x-r.left],[dx,r.right-a.x],[-dy,a.y-r.top],[dy,r.bottom-a.y]]){if(!p){if(q<0)return false;continue;}const t=q/p;if(p<0)lo=Math.max(lo,t);else hi=Math.min(hi,t);if(lo>hi)return false;}return true;
};
export function flyoutPlacement({width,height,size,preferred,obstacles=[],points=[],segments=[]}){
  const w=Math.min(size.width,width-16),h=Math.min(size.height,height-72),clamp=(v,min,max)=>Math.max(min,Math.min(max,v)),choices=[];
  const add=(left,top)=>choices.push({left:clamp(left,8,width-w-8),top:clamp(top,8,height-h-56)});
  add(preferred.left,preferred.top);for(const left of [8,width-w-8])for(const top of [70,8,height-h-56])add(left,top);
  for(let left=8;left<=width-w;left+=80)for(let top=8;top<=height-h-56;top+=60)add(left,top);
  const score=p=>{const box={...p,right:p.left+w,bottom:p.top+h},padded={left:box.left-12,right:box.right+12,top:box.top-12,bottom:box.bottom+12};
    const hits=points.reduce((sum,point)=>{const x=clamp(point.x,box.left,box.right),y=clamp(point.y,box.top,box.bottom);return sum+(Math.hypot(point.x-x,point.y-y)<(point.r||24)?1:0);},0);
    const pathHits=segments.filter(([a,b])=>lineInRect(a,b,padded)).length;
    const panels=obstacles.reduce((sum,b)=>sum+Math.max(0,Math.min(box.right,b.right)-Math.max(box.left,b.left))*Math.max(0,Math.min(box.bottom,b.bottom)-Math.max(box.top,b.top)),0);
    return hits*1e10+pathHits*1e7+panels*.02+Math.hypot(p.left-preferred.left,p.top-preferred.top);
  };
  let best=choices[0],bestScore=Infinity;
  for(const choice of choices){const value=score(choice);if(value<bestScore){best=choice;bestScore=value;}}
  return {...best,right:best.left+w,bottom:best.top+h};
}
export function explorationSpace(width,height,obstacles=[]){
  let spaces=[{left:18,top:70,right:width-18,bottom:height-56}];
  for(const b of obstacles){const next=[];
    for(const r of spaces){if(r.right<=b.left||r.left>=b.right||r.bottom<=b.top||r.top>=b.bottom){next.push(r);continue;}
      next.push({...r,right:Math.min(r.right,b.left-16)},{...r,left:Math.max(r.left,b.right+16)},{...r,bottom:Math.min(r.bottom,b.top-16)},{...r,top:Math.max(r.top,b.bottom+16)});
    }
    spaces=next.filter(r=>r.right-r.left>=180&&r.bottom-r.top>=160);
  }
  const best=spaces.sort((a,b)=>(b.right-b.left)*(b.bottom-b.top)-(a.right-a.left)*(a.bottom-a.top))[0]||{left:18,top:70,right:width-18,bottom:height-56};
  return {...best,width:best.right-best.left,height:best.bottom-best.top};
}
export function clearNodeCamera(target,ids,positions,{width,height,obstacles=[],center={x:width/2,y:height/2}}={}){
  const points=[...ids].map(id=>positions.get(id)).filter(Boolean);let best={...target},bestScore=Infinity;
  for(const scale of [1,.96,.92,.88,.84,.8])for(const dx of [0,24,-24,48,-48,72,-72,96,-96])for(const dy of [0,24,-24,48,-48,72,-72]){
    const z=target.z*scale,x=center.x-(center.x-target.x)*scale+dx,y=center.y-(center.y-target.y)*scale+dy;let blocked=0,outside=0;
    for(const p of points){const sx=p.x*z+x,sy=p.y*z+y;if(sx<26||sx>width-26||sy<26||sy>height-26)outside++;
      for(const b of obstacles){const px=Math.max(b.left,Math.min(sx,b.right)),py=Math.max(b.top,Math.min(sy,b.bottom));if(Math.hypot(sx-px,sy-py)<24)blocked++;}
    }
    const score=outside*1e9+blocked*1e8+Math.hypot(dx,dy)+(1-scale)*10000;if(score<bestScore){bestScore=score;best={x,y,z};}
  }
  return best;
}
