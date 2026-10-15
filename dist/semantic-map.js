// Zoom changes presentation, never the underlying records.
export const smooth = value => { const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t); };
export function semanticStyle(degree,zoom,{protectedNode=false,small=false}={}){
  const detail=smooth((zoom-.85)/.55);
  const threshold=Math.max(1,Math.ceil(4/Math.pow(Math.max(.2,zoom),2.5)));
  const revealAt=(protectedNode||small) ? .35 : Math.max(.32,Math.min(2.8,Math.pow(4/(Math.max(0,degree)+1),.4)));
  const opacity=protectedNode||small?1:smooth((zoom-revealAt+.12)/.28);
  const importance=Math.sqrt(Math.max(0,degree));
  const font=(18+Math.min(25,importance*2))*(1-detail)+(13+Math.min(7,importance*.55))*detail;
  return {detail,threshold,opacity,font:font*(protectedNode?1.08:1),radius:(17+Math.min(20,importance*2))*(protectedNode?1.2:1)*detail};
}
export const overlaps=(a,b,gap=8)=>a.left<b.right+gap&&a.right>b.left-gap&&a.top<b.bottom+gap&&a.bottom>b.top-gap;
export function visibleEntities(candidates,{width,height,obstacles=[],gap=10}){
  const accepted=[],hidden=[];
  const sorted=[...candidates].sort((a,b)=>(b.priority||0)-(a.priority||0)||(b.degree||0)-(a.degree||0)||a.id.localeCompare(b.id));
  for(const item of sorted){
    const b=item.box;
    const fits=item.opacity>.03&&b.left>=8&&b.right<=width-8&&b.top>=8&&b.bottom<=height-8;
    if(!fits||obstacles.some(other=>overlaps(b,other,gap))||accepted.some(other=>overlaps(b,other.box,gap)))hidden.push(item.id);
    else accepted.push(item);
  }
  return {items:accepted,ids:new Set(accepted.map(item=>item.id)),hidden};
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
