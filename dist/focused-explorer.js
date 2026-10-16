// Focus is an explicit request to see records, independent of overview zoom thresholds.
export function connectionSummary(graph,id){
  const links=graph.edges.filter(edge=>edge.source===id||edge.target===id);
  const neighbors=new Set(links.map(edge=>edge.source===id?edge.target:edge.source));
  return {links,neighbors,types:[...new Set(links.map(edge=>edge.type))].map(type=>({type,count:links.filter(edge=>edge.type===type).length})).sort((a,b)=>b.count-a.count||a.type.localeCompare(b.type))};
}

export function focusedStyle(degree,{anchor=false,pinned=false,density=1}={}){
  return {detail:1,bubble:false,cloud:false,opacity:1,threshold:0,font:Math.max(anchor?12:7.5, (anchor?16:12)*density),radius:Math.max(anchor?18:8,(anchor?34:17+Math.min(10,Math.sqrt(degree||0)*1.7))*(pinned?1.15:1)*density)};
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
  const clear=({x,y})=>{
    const box={left:x-size,right:x+size,top:y-size,bottom:y+size};
    if(box.left<8||box.right>width-8||box.top<8||box.bottom>height-8)return null;
    if(occupied.some(r=>box.left<r.right+3&&box.right>r.left-3&&box.top<r.bottom+3&&box.bottom>r.top-3))return null;
    return {x,y,box};
  };
  const samples=[.5,.38,.62,.26,.74,.16,.84,.1,.9];
  for(const t of samples){const point=clear(at(t));if(point)return point;}
  return null;
}

export function extendTrail(trail,graph,{from='',to='',path=null}={}){
  const ids=new Set(graph.nodes.map(node=>node.id)),edgeById=new Map(graph.edges.map(edge=>[edge.id,edge]));
  const nodeIds=new Set([...(trail?.nodes||[])].filter(id=>ids.has(id))),edgeIds=new Set([...(trail?.edges||[])].filter(id=>edgeById.has(id)));
  for(const id of edgeIds){const edge=edgeById.get(id);nodeIds.add(edge.source);nodeIds.add(edge.target);}
  for(const id of path?.nodes||[])if(ids.has(id))nodeIds.add(id);
  for(const id of path?.edges||[])if(edgeById.has(id)){edgeIds.add(id);const edge=edgeById.get(id);nodeIds.add(edge.source);nodeIds.add(edge.target);}
  for(const id of [from,to])if(ids.has(id))nodeIds.add(id);
  if(from&&to&&from!==to)for(const edge of graph.edges)if(edge.source===from&&edge.target===to||edge.source===to&&edge.target===from)edgeIds.add(edge.id);
  return {nodes:nodeIds,edges:edgeIds};
}

// One port per endpoint pair and type. Its reserved space travels with its entity.
export function badgePorts(edges,center,styleFor,density=1){
  const groups=new Map(),owners=new Map(),ports=new Map(),scale=Math.max(.28,Math.min(.85,density*.85)),size=44*scale;
  for(const edge of edges){const key=[edge.source,edge.target].sort().join('|')+'|'+edge.type;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(edge);}
  for(const peers of groups.values()){
    const edge=peers[0],owner=edge.source===center?edge.target:edge.target===center?edge.source:(owners.get(edge.source)?.length||0)<(owners.get(edge.target)?.length||0)?edge.source:edge.target;
    if(!owners.has(owner))owners.set(owner,[]);owners.get(owner).push(peers);
  }
  for(const [owner,rows]of owners)rows.forEach((peers,index)=>{const radius=styleFor(owner).radius;ports.set(peers[0].id,{owner,peers:peers.map(edge=>edge.id),x:-radius-size/2-7-index*(size+3),y:0,index,size,scale});});
  return ports;
}

const intersects=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
const contains=(a,b)=>a.left<=b.left&&a.right>=b.right&&a.top<=b.top&&a.bottom>=b.bottom;
// Rectangle packing uses the fixed viewport, including room reserved for type icons.
export function packFocus(items,{width,height,obstacles=[],center='',current=new Map(),gap=6.5}={}){
  let free=[{left:8,top:8,right:width-8,bottom:height-8}];const positions=new Map(),latent=[];
  const subtract=box=>{free=free.flatMap(r=>!intersects(r,box)?[r]:[
    {left:r.left,top:r.top,right:box.left,bottom:r.bottom},
    {left:box.right,top:r.top,right:r.right,bottom:r.bottom},
    {left:r.left,top:r.top,right:r.right,bottom:box.top},
    {left:r.left,top:box.bottom,right:r.right,bottom:r.bottom}
  ]).filter(r=>r.right-r.left>2&&r.bottom-r.top>2);free=free.filter((r,i)=>!free.some((other,j)=>j!==i&&contains(other,r)&&(j<i||!contains(r,other))));};
  for(const box of obstacles)subtract({left:box.left-gap,top:box.top-gap,right:box.right+gap,bottom:box.bottom+gap});
  const sorted=[...items].sort((a,b)=>Number(b.id===center)-Number(a.id===center)||Number(!!b.required)-Number(!!a.required)||(b.box.right-b.box.left)*(b.box.bottom-b.box.top)-(a.box.right-a.box.left)*(a.box.bottom-a.box.top)||a.id.localeCompare(b.id));
  for(const item of sorted){
    const w=item.box.right-item.box.left+gap,h=item.box.bottom-item.box.top+gap,preferred=current.get(item.id)||{x:width/2,y:height/2};let best=null,score=Infinity;
    for(const r of free){if(r.right-r.left<w||r.bottom-r.top<h)continue;
      const left=Math.max(r.left,Math.min(r.right-w,preferred.x+item.box.left-gap/2)),top=Math.max(r.top,Math.min(r.bottom-h,preferred.y+item.box.top-gap/2));
      const corners=item.id===center?[[left,top]]:[[r.left,r.top],[r.right-w,r.top],[r.left,r.bottom-h],[r.right-w,r.bottom-h]];
      for(const [x,y]of corners){const point={x:x-item.box.left+gap/2,y:y-item.box.top+gap/2},distance=Math.hypot(point.x-preferred.x,point.y-preferred.y),waste=Math.min(r.right-r.left-w,r.bottom-r.top-h),value=item.id===center?distance:waste*1000+distance*.01;
        if(value<score){score=value;best={point,box:{left:x,top:y,right:x+w,bottom:y+h}};}
      }
    }
    if(best){positions.set(item.id,best.point);subtract(best.box);}else{positions.set(item.id,{x:width/2,y:height/2});latent.push(item.id);}
  }
  return {positions,latent};
}
