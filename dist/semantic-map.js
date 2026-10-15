// Zoom changes presentation, never the underlying records.
export const smooth = value => { const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t); };
export function semanticStyle(degree,zoom,{protectedNode=false,small=false}={}){
  const detail=smooth((zoom-.85)/.55);
  const threshold=Math.max(1,Math.ceil(4/Math.pow(Math.max(.2,zoom),2.5)));
  const revealAt=(protectedNode||small) ? .35 : Math.max(.32,Math.min(2.8,Math.pow(4/(Math.max(0,degree)+1),.4)));
  const opacity=protectedNode||small?1:smooth((zoom-revealAt+.12)/.28);
  const importance=Math.sqrt(Math.max(0,degree));
  const font=(18+Math.min(25,importance*2))*(1-detail)+(13+Math.min(7,importance*.55))*detail;
  const bubble=detail<.5;
  const overviewRadius=7+Math.pow(Math.max(0,degree),.85)*4.1;
  return {detail,bubble,threshold,opacity,font:(bubble?11+Math.min(11,importance*1.4):font)*(protectedNode?1.08:1),radius:(overviewRadius*(1-detail)+(17+Math.min(20,importance*2))*detail)*(protectedNode?1.2:1)};
}
export const overlaps=(a,b,gap=8)=>a.left<b.right+gap&&a.right>b.left-gap&&a.top<b.bottom+gap&&a.bottom>b.top-gap;
export function footprintsOverlap(a,b,gap=0){
  if(a.circle&&b.circle)return Math.hypot(a.circle.x-b.circle.x,a.circle.y-b.circle.y)<a.circle.r+b.circle.r+gap-.01;
  if(a.circle||b.circle){const c=(a.circle?a:b).circle,r=(a.circle?b:a).box;return Math.hypot(c.x-Math.max(r.left,Math.min(c.x,r.right)),c.y-Math.max(r.top,Math.min(c.y,r.bottom)))<c.r+gap-.01;}
  return overlaps(a.box,b.box,gap);
}
export function visibleEntities(candidates,{width,height,obstacles=[],gap=10}){
  const accepted=[],hidden=[];
  const sorted=[...candidates].sort((a,b)=>(b.priority||0)-(a.priority||0)||(b.degree||0)-(a.degree||0)||a.id.localeCompare(b.id));
  for(const item of sorted){
    const b=item.box;
    const fits=item.opacity>.03&&b.left>=8&&b.right<=width-8&&b.top>=8&&b.bottom<=height-8;
    if(!fits||obstacles.some(other=>footprintsOverlap(item,{box:other},gap))||accepted.some(other=>footprintsOverlap(item,other,gap)))hidden.push(item.id);
    else accepted.push(item);
  }
  return {items:accepted,ids:new Set(accepted.map(item=>item.id)),hidden};
}

// Circles describe individual entities, not groups or additional relationships.
// Large entities establish the cluster; small ones may occupy its remaining gaps.
export function packBubbleCloud(items,{width,height,obstacles=[],current=new Map(),retained=new Set(),limit=14,fillerLimit=22}){
  const placed=[],positions=new Map(),latent=[],gap=3,origin={x:width/2,y:height/2};
  const sorted=[...items].sort((a,b)=>(b.priority||0)-(a.priority||0)||b.degree-a.degree||a.id.localeCompare(b.id));
  const primary=sorted.filter((item,index)=>item.priority>0||index<limit),primaryIds=new Set(primary.map(item=>item.id));
  const fillers=sorted.filter(item=>!primaryIds.has(item.id)&&item.degree<=4);
  let extent=null,fillerCount=0;
  for(const item of [...primary,...fillers]){
    const filler=!primaryIds.has(item.id);if(filler&&fillerCount>=fillerLimit)break;
    const r=item.radius+2,preferred=retained.has(item.id)&&current.has(item.id)?current.get(item.id):origin;
    let best=null,bestScore=Infinity;
    const consider=p=>{
      const box={left:p.x-r,right:p.x+r,top:p.y-r,bottom:p.y+r},candidate={circle:{...p,r},box};
      if(box.left<12||box.right>width-12||box.top<12||box.bottom>height-12)return;
      if(filler&&extent&&(box.left<extent.left||box.right>extent.right||box.top<extent.top||box.bottom>extent.bottom))return;
      if(obstacles.some(box=>footprintsOverlap(candidate,{box},5))||placed.some(other=>footprintsOverlap(candidate,other,gap)))return;
      const score=Math.hypot(p.x-preferred.x,p.y-preferred.y);if(score<bestScore){bestScore=score;best={...candidate,id:item.id};}
    };
    consider(preferred);
    for(const other of placed)for(let angle=0;angle<24;angle++){const a=angle*Math.PI/12,d=r+other.circle.r+gap;consider({x:other.circle.x+Math.cos(a)*d,y:other.circle.y+Math.sin(a)*d});}
    // Exact tangencies let small circles nest in the curved spaces between neighbors.
    for(let i=0;i<placed.length;i++)for(let j=i+1;j<placed.length;j++){
      const a=placed[i].circle,b=placed[j].circle,dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),ra=r+a.r+gap,rb=r+b.r+gap;
      if(!d||d>ra+rb||d<Math.abs(ra-rb))continue;
      const along=(ra*ra-rb*rb+d*d)/(2*d),across=Math.sqrt(Math.max(0,ra*ra-along*along)),x=a.x+dx*along/d,y=a.y+dy*along/d;
      consider({x:x-dy*across/d,y:y+dx*across/d});consider({x:x+dy*across/d,y:y-dx*across/d});
    }
    if(!best&&!filler)for(let y=r+12;y<height-r-12;y+=18)for(let x=r+12;x<width-r-12;x+=18)consider({x,y});
    if(best){placed.push(best);positions.set(item.id,{x:best.circle.x,y:best.circle.y});if(filler)fillerCount++;else extent=extent?{left:Math.min(extent.left,best.box.left),right:Math.max(extent.right,best.box.right),top:Math.min(extent.top,best.box.top),bottom:Math.max(extent.bottom,best.box.bottom)}:{...best.box};}
  }
  for(const item of items)if(!positions.has(item.id)){positions.set(item.id,{...origin});latent.push(item.id);}
  return {positions,latent,visible:new Set(placed.map(item=>item.id)),fillers:fillerCount};
}

export function bubbleLabel(name,radius,font,measure=text=>text.length*font*.54){
  const words=name.split(/\s+/),width=Math.max(12,(radius-7)*1.55),lines=[];let line='';
  for(const word of words){const next=(line+' '+word).trim();if(line&&measure(next)>width){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);
  const count=Math.max(1,Math.floor((radius-7)*1.35/(font*1.12))),shown=lines.slice(0,count);
  if(lines.length>count)shown[shown.length-1]+='…';
  return shown.map((line,index)=>{
    const y=(index-(shown.length-1)/2)*font*1.12,halfHeight=font*.58,chord=2*Math.sqrt(Math.max(0,(radius-6)**2-(Math.abs(y)+halfHeight)**2));
    let value=line;while(value.length>1&&measure(value)>chord)value=value.replace(/…$/,'').slice(0,-1)+'…';return value;
  });
}

export function connectionRoute(start,end,{obstacles=[],bend=0,width=Infinity,height=Infinity}={}){
  const dx=end.x-start.x,dy=end.y-start.y,length=Math.hypot(dx,dy)||1;
  let best=null;
  for(const offset of [...new Set([bend,0,80,-80,160,-160,260,-260,400,-400,600,-600])]){
    const control={x:(start.x+end.x)/2-dy/length*offset,y:(start.y+end.y)/2+dx/length*offset};
    const point=t=>({x:(1-t)*(1-t)*start.x+2*(1-t)*t*control.x+t*t*end.x,y:(1-t)*(1-t)*start.y+2*(1-t)*t*control.y+t*t*end.y});
    let collisions=0,outside=0;
    for(let i=1;i<40;i++){const p=point(i/40);collisions+=obstacles.filter(b=>p.x>b.left-7&&p.x<b.right+7&&p.y>b.top-7&&p.y<b.bottom+7).length;if(p.x<8||p.x>width-8||p.y<8||p.y>height-8)outside++;}
    const score=collisions*100000+outside*100000+Math.abs(offset-bend)*.02+Math.abs(offset)*.01;
    if(!best||score<best.score)best={start,end,control,midpoint:point(.5),collisions,outside,score};
  }
  return best;
}
