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
const clamp = (value, low, high) => Math.max(low, Math.min(Math.max(low, high), value));

export function arrangeCanvas(graph, {width, height, obstacles = [], current = new Map(), pins = new Set(), center = '', degrees = new Map()}) {
  const count = graph.nodes.length;
  const scale = Math.max(.52, Math.min(1, Math.sqrt(width * height / Math.max(1, count * 14000))));
  const targets = new Map(), boxes = [];
  if (!count) return {positions: targets, scale};
  const items = graph.nodes.map(node => {
    const radius = entityRadius(degrees.get(node.id) || 0, pins.has(node.id), scale);
    const longest = Math.min(24, Math.max(...node.name.split(/\s+/).map(word => word.length), Math.min(20, node.name.length)));
    return {id: node.id, radius, width: Math.max(radius * 2 + 24, longest * 7 * Math.max(.82, scale)), height: radius * 2 + (node.name.length > 24 ? 53 : 38)};
  }).sort((a, b) => Number(pins.has(b.id)) - Number(pins.has(a.id)) || Number(b.id === center) - Number(a.id === center) || (degrees.get(b.id) || 0) - (degrees.get(a.id) || 0) || a.id.localeCompare(b.id));
  const boxFor = (item, point) => ({left: point.x - item.width / 2, right: point.x + item.width / 2, top: point.y - item.radius - 10, bottom: point.y - item.radius - 10 + item.height});
  const area = box => Math.max(0, box.right - box.left) * Math.max(0, box.bottom - box.top);
  const overlapArea = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  const cellX = Math.max(34, Math.min(80, width / 10)), cellY = Math.max(32, Math.min(70, height / 8));
  for (const item of items) {
    const constrain = point => ({x: clamp(point.x, item.width / 2 + 12, width - item.width / 2 - 12), y: clamp(point.y, item.radius + 16, height - item.height + item.radius - 8)});
    const old = current.get(item.id);
    // Pins retain their screen location as the view changes, bounded on resize.
    if (pins.has(item.id) && old) {
      const point = constrain(old); targets.set(item.id, point); boxes.push(boxFor(item, point)); continue;
    }
    const linked = graph.edges.filter(edge => edge.source === item.id || edge.target === item.id).flatMap(edge => [edge.source, edge.target]).filter(id => id !== item.id && targets.has(id)).map(id => targets.get(id));
    const retained=old&&old.x>0&&old.x<width&&old.y>0&&old.y<height?old:null;
    const preferred = item.id===center?{x:width/2,y:height/2}:retained || (linked.length ? {x: linked.reduce((s, p) => s + p.x, 0) / linked.length, y: linked.reduce((s, p) => s + p.y, 0) / linked.length} : {x: width / 2, y: height / 2});
    const candidates = [constrain(preferred)];
    for (let y = item.radius + 22; y < height - item.height + item.radius; y += cellY) for (let x = item.width / 2 + 16; x < width - item.width / 2; x += cellX) candidates.push({x, y});
    let best = null;
    for (const point of candidates) {
      const box = boxFor(item, point);
      const collision = boxes.reduce((sum, other) => sum + (intersects(box, other) ? overlapArea(box, {left: other.left - 8, top: other.top - 8, right: other.right + 8, bottom: other.bottom + 8}) : 0), 0);
      const obstruction = obstacles.reduce((sum, other) => sum + overlapArea(box, other), 0);
      const distance = Math.hypot(point.x - preferred.x, point.y - preferred.y);
      const spacing=Math.min(250,Math.max(100,Math.sqrt(width*height/count)*.6));
      const spread=linked.length?linked.reduce((sum,other)=>sum+Math.abs(Math.hypot(point.x-other.x,point.y-other.y)-spacing),0)/linked.length:distance;
      const score = collision * 10000 + obstruction * 15000 + distance*.12+spread + (item.id === center ? Math.hypot(point.x - width / 2, point.y - height / 2) : 0);
      if (!best || score < best.score) best = {point, box, score};
    }
    const chosen = best || {point: constrain(preferred), box: boxFor(item, constrain(preferred)), score: area(boxFor(item, constrain(preferred)))};
    targets.set(item.id, chosen.point); boxes.push(chosen.box);
  }
  return {positions: targets, scale};
}
