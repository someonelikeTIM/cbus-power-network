// Geometry and presentation helpers. These never alter factual records.
export const connectionGroups = [
  {id: 'money', label: 'Money & public decisions', types: ['money', 'funding', 'contract', 'influence']},
  {id: 'governance', label: 'Office & governance', types: ['leadership', 'board', 'control', 'candidacy']},
  {id: 'organizations', label: 'Organizations & affiliations', types: ['ownership', 'voting', 'affiliation', 'partnership', 'history']},
  {id: 'politics', label: 'Lobbying & endorsements', types: ['lobbying', 'endorsement']},
  {id: 'media', label: 'Media & information', types: ['content', 'editorial']},
  {id: 'claims', label: 'Allegations', types: ['allegation']},
];

export function entityRadius(degree, pinned = false, scale = 1) {
  // Area grows with degree; a bounded scale keeps larger maps usable.
  return (12 + Math.min(29, Math.sqrt(Math.max(0, degree)) * 3.5) + (pinned ? 12 : 0)) * scale;
}

export function scopedConnections(graph, anchors, distance) {
  const visible = new Set([...anchors].filter(id => graph.nodes.some(node => node.id === id)));
  const neighbors = new Map(graph.nodes.map(node => [node.id, new Set()]));
  for (const edge of graph.edges) {
    neighbors.get(edge.source)?.add(edge.target);
    neighbors.get(edge.target)?.add(edge.source);
  }
  let frontier = [...visible];
  const limit = distance === 'all' ? graph.nodes.length : Number(distance);
  for (let step = 0; step < limit && frontier.length; step++) {
    const next = [];
    for (const id of frontier) for (const other of neighbors.get(id) || []) {
      if (!visible.has(other)) { visible.add(other); next.push(other); }
    }
    frontier = next;
  }
  return {...graph, nodes: graph.nodes.filter(node => visible.has(node.id)), edges: graph.edges.filter(edge => visible.has(edge.source) && visible.has(edge.target))};
}

const intersects = (a, b, gap = 8) => a.left < b.right + gap && a.right > b.left - gap && a.top < b.bottom + gap && a.bottom > b.top - gap;

export function arrangeCanvas(graph, {width, height, obstacles = [], current = new Map(), pins = new Set(), retained = new Set(), center = '', degrees = new Map(), measurements = new Map(), flow=false}) {
  const positions=new Map(),boxes=[],latent=[];
  const items=[...graph.nodes].sort((a,b)=>Number(b.id===center)-Number(a.id===center)||Number(pins.has(b.id))-Number(pins.has(a.id))||(degrees.get(b.id)||0)-(degrees.get(a.id)||0)||a.id.localeCompare(b.id));
  const boxAt=(size,p)=>({left:p.x+size.left,right:p.x+size.right,top:p.y+size.top,bottom:p.y+size.bottom});
  const fits=box=>box.left>=12&&box.right<=width-12&&box.top>=12&&box.bottom<=height-12&&!obstacles.some(other=>intersects(box,other,12))&&!boxes.some(other=>intersects(box,other,14));
  for(let index=0;index<items.length;index++){
    const node=items[index],radius=entityRadius(degrees.get(node.id)||0,pins.has(node.id));
    const size=measurements.get(node.id)||{left:-Math.max(radius+12,Math.min(210,node.name.length*7)/2),right:Math.max(radius+12,Math.min(210,node.name.length*7)/2),top:-radius-8,bottom:radius+45};
    const old=current.get(node.id),preferred=flow?{x:0,y:0}:(pins.has(node.id)||retained.has(node.id))&&old?old:node.id===center?{x:width/2,y:height/2}:{x:width/2+Math.cos(index*2.399963)*Math.min(width*.34,Math.sqrt(index)*width*.09),y:height/2+Math.sin(index*2.399963)*Math.min(height*.31,Math.sqrt(index)*height*.095)};
    let chosen=null,best=Infinity;
    const consider=point=>{const box=boxAt(size,point);if(!fits(box))return;const score=Math.hypot(point.x-preferred.x,point.y-preferred.y);if(score<best){best=score;chosen={point,box};}};
    consider(preferred);
    for(const box of [...boxes,...obstacles]){
      consider({x:box.right+16-size.left,y:Math.max(16,box.top)-size.top});
      consider({x:Math.max(16,box.left)-size.left,y:box.bottom+16-size.top});
      consider({x:box.left-16-size.right,y:Math.max(16,box.top)-size.top});
    }
    if(!chosen)for(let y=16-size.top;y<height-size.bottom-12;y+=30)for(let x=16-size.left;x<width-size.right-12;x+=36)consider({x,y});
    if(chosen){positions.set(node.id,chosen.point);boxes.push(chosen.box);}
    else{
      // Latent positions are never forced onto an occupied label. The renderer
      // reveals them only when zoom, panning and collision clearance allow it.
      const columns=Math.max(2,Math.floor(width/62)),row=Math.floor(index/columns),rows=Math.max(2,Math.ceil(items.length/columns));
      positions.set(node.id,{x:40+(index%columns)*(width-80)/(columns-1),y:45+row*(height-90)/(rows-1)});latent.push(node.id);
    }
  }
  return {positions,scale:1,latent};
}
