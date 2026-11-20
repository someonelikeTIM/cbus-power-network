// Draw without replacement, including across the boundary between two shuffles.
function shuffledDraw(items,random){
  let remaining=[],last=null;
  return ()=>{
    if(!items.length)return null;
    if(!remaining.length){
      remaining=items.slice();
      for(let i=remaining.length-1;i>0;i--){
        const j=Math.floor(random()*(i+1));
        [remaining[i],remaining[j]]=[remaining[j],remaining[i]];
      }
      if(remaining.length>1&&remaining.at(-1)===last){
        const j=Math.floor(random()*(remaining.length-1)),end=remaining.length-1;
        [remaining[j],remaining[end]]=[remaining[end],remaining[j]];
      }
    }
    last=remaining.pop();
    return last;
  };
}

export function entrySampler(nodes,edges,random=Math.random){
  const byId=new Map(nodes.map(node=>[node.id,node])),connected=new Set(),pairs=new Map();
  for(const edge of edges){
    if(edge.source===edge.target||!edge.sourceIds?.length||!byId.has(edge.source)||!byId.has(edge.target))continue;
    connected.add(edge.source);connected.add(edge.target);
    const key=[edge.source,edge.target].sort().join('|');
    if(!pairs.has(key))pairs.set(key,[]);
    pairs.get(key).push(edge);
  }
  // A highly connected entity has the same chance of being a random start as any other.
  const drawEntity=shuffledDraw([...connected],random),drawPair=shuffledDraw([...pairs.values()],random);
  return {
    pairCount:pairs.size,
    nextEntity:drawEntity,
    nextSample(){
      const pair=drawPair();
      if(!pair)return null;
      const edge=pair[Math.floor(random()*pair.length)];
      return {edge,source:byId.get(edge.source),target:byId.get(edge.target)};
    }
  };
}
