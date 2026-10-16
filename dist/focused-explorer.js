// Focus is an explicit request to see records, independent of overview zoom thresholds.
export function connectionSummary(graph,id){
  const links=graph.edges.filter(edge=>edge.source===id||edge.target===id);
  const neighbors=new Set(links.map(edge=>edge.source===id?edge.target:edge.source));
  return {links,neighbors,types:[...new Set(links.map(edge=>edge.type))].map(type=>({type,count:links.filter(edge=>edge.type===type).length})).sort((a,b)=>b.count-a.count||a.type.localeCompare(b.type))};
}

export function focusedStyle(degree,{anchor=false,pinned=false,density=1}={}){
  return {detail:1,bubble:false,cloud:false,opacity:1,threshold:0,font:(anchor?17:13)*density,radius:(anchor?40:19+Math.min(12,Math.sqrt(degree||0)*2))*(pinned?1.15:1)*density};
}

// A short pullback gives long flights breathing room before settling into focus.
export function focusFlight(from,to,anchor,progress,travel=0){
  const t=Math.max(0,Math.min(1,progress));if(!t)return {...from};if(t===1)return {...to};
  const z=from.z*Math.pow(to.z/from.z,t)*Math.exp(-(Math.sin(Math.PI*t)**2)*Math.min(.38,travel/1800));
  const a={x:from.x+anchor.x*from.z,y:from.y+anchor.y*from.z},b={x:to.x+anchor.x*to.z,y:to.y+anchor.y*to.z};
  return {z,x:a.x+(b.x-a.x)*t-anchor.x*z,y:a.y+(b.y-a.y)*t-anchor.y*z};
}

export function badgePosition(route,{occupied=[],width,height,size=18}={}){
  const {start:a,control:b,end:c}=route;
  const at=t=>({x:(1-t)**2*a.x+2*(1-t)*t*b.x+t*t*c.x,y:(1-t)**2*a.y+2*(1-t)*t*b.y+t*t*c.y});
  const clear=({x,y},leader=null)=>{
    const box={left:x-size,right:x+size,top:y-size,bottom:y+size};
    if(box.left<8||box.right>width-8||box.top<8||box.bottom>height-8)return null;
    if(occupied.some(r=>box.left<r.right+3&&box.right>r.left-3&&box.top<r.bottom+3&&box.bottom>r.top-3))return null;
    return {x,y,box,leader};
  };
  const samples=[.5,.38,.62,.26,.74,.16,.84,.1,.9];
  for(const t of samples){const point=clear(at(t));if(point)return point;}
  // Short leaders keep every type identifiable when several lines share a tight space.
  for(const distance of [24,42,64,88,116])for(const t of samples){const anchor=at(t);for(let angle=0;angle<8;angle++){
    const a=angle*Math.PI/4,point=clear({x:anchor.x+Math.cos(a)*distance,y:anchor.y+Math.sin(a)*distance},anchor);if(point)return point;
  }
  }
  let best=null,score=Infinity;
  for(let y=size+10;y<height-size-10;y+=24)for(let x=size+10;x<width-size-10;x+=24){
    const point=clear({x,y});if(!point)continue;
    for(const t of samples){const anchor=at(t),distance=Math.hypot(anchor.x-x,anchor.y-y);if(distance<score){score=distance;best={...point,leader:anchor};}}
  }
  return best;
}
