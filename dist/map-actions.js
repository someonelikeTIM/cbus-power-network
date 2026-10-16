// Presentation helpers operate only on existing records; grouping never adds a link.
export function connectionBuckets(graph,anchor=''){
  const order=new Map(),groups=new Map();
  for(const edge of graph.edges)if(!order.has(edge.type))order.set(edge.type,order.size);
  for(const node of graph.nodes){
    const incident=graph.edges.filter(edge=>edge.source===node.id||edge.target===node.id);
    const direct=anchor&&node.id!==anchor?incident.filter(edge=>edge.source===anchor||edge.target===anchor):[];
    const counts=new Map();for(const edge of direct.length?direct:incident)counts.set(edge.type,(counts.get(edge.type)||0)+1);
    const type=node.id===anchor?'anchor':[...counts].sort((a,b)=>b[1]-a[1]||order.get(a[0])-order.get(b[0]))[0]?.[0]||'unlinked';
    if(!groups.has(type))groups.set(type,[]);groups.get(type).push(node);
  }
  return [...groups].sort((a,b)=>Number(b[0]==='anchor')-Number(a[0]==='anchor')||a[0].localeCompare(b[0])).map(([type,nodes])=>({type,nodes:[...nodes].sort((a,b)=>a.name.localeCompare(b.name))}));
}
export function bucketLayout(graph,{anchor='',width=800}={}){
  const groups=connectionBuckets(graph,anchor),columns=width>=700?2:1,gap=22,bucketWidth=(width-32-gap*(columns-1))/columns;
  const positions=new Map(),buckets=[];let y=22;
  for(let row=0;row<groups.length;row+=columns){
    const batch=groups.slice(row,row+columns),sizes=batch.map(group=>{const cells=Math.max(1,Math.floor((bucketWidth-24)/145));return {cells,height:64+Math.ceil(group.nodes.length/cells)*100};});
    batch.forEach((group,index)=>{const left=16+index*(bucketWidth+gap),{cells,height}=sizes[index];
      group.nodes.forEach((node,i)=>positions.set(node.id,{x:left+12+(i%cells+.5)*(bucketWidth-24)/cells,y:y+78+Math.floor(i/cells)*100}));
      buckets.push({...group,left,top:y,width:bucketWidth,height});
    });y+=Math.max(...sizes.map(size=>size.height))+gap;
  }
  return {positions,buckets,height:y+14};
}
export function selectionGraph(graph,nodeIds,edgeIds){
  const actors=new Set(nodeIds),links=graph.edges.filter(edge=>edgeIds.has(edge.id)||nodeIds.has(edge.source)&&nodeIds.has(edge.target));
  for(const edge of links){actors.add(edge.source);actors.add(edge.target);}
  return {nodes:graph.nodes.filter(node=>actors.has(node.id)),edges:links};
}
export function segmentInBox(a,b,box){
  let lo=0,hi=1;const dx=b.x-a.x,dy=b.y-a.y;
  for(const [p,q]of [[-dx,a.x-box.left],[dx,box.right-a.x],[-dy,a.y-box.top],[dy,box.bottom-a.y]]){
    if(!p){if(q<0)return false;continue;}const t=q/p;if(p<0)lo=Math.max(lo,t);else hi=Math.min(hi,t);if(lo>hi)return false;
  }return true;
}
export function dollarLabel(edge){
  // Keep the record's own qualifier (ceiling, range, commitment, etc.) in view.
  const label=edge.amountLabel||edge.label||'';
  if(/\$/.test(label))return label;
  if(Number.isFinite(edge.amount)&&/USD|dollar/i.test(edge.unit||''))return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',notation:'compact',maximumFractionDigits:2}).format(edge.amount)+' · '+label;
  return '';
}
