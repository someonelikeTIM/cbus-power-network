// Homepage headlines point to published connection IDs. The records supply the
// endpoints, evidence classification, period and original document.
export const featuredHeadlines = {
  e52: 'FirstEnergy admitted paying millions for help passing Ohio’s nuclear bailout.',
  e53: 'Larry Householder used more than $500,000 for personal expenses.',
  e56: 'AEP agreed to a $19 million penalty over misleading disclosures about political spending.',
  e71: 'John Raphael pleaded guilty to extorting Redflex over red-light camera contracts.',
  j16: 'Ohio State found that Ted Carter used his office to seek resources for a personal associate.',
  e179: 'Columbus waived bidding for a license plate reader lease of up to $228,000.',
  j29: 'JobsOhio signed a $310 million grant tied to Anduril’s hiring and investment commitments.',
  e45: 'Les Wexner said he gave Jeffrey Epstein power of attorney over his finances.'
};

function shuffled(items, random) {
  const deck = [...items];
  for (let end = deck.length - 1; end > 0; end--) {
    const pick = Math.floor(random() * (end + 1));
    [deck[end], deck[pick]] = [deck[pick], deck[end]];
  }
  return deck;
}

export function entrySampler(nodes, edges, headlines = featuredHeadlines, random = Math.random) {
  const byId = new Map(nodes.map(node => [node.id, node]));
  const connected = new Set();
  const featured = [];
  for (const edge of edges) {
    const source = byId.get(edge.source), target = byId.get(edge.target);
    if (!source || !target || source === target || !edge.sourceIds?.length) continue;
    connected.add(source.id);
    connected.add(target.id);
    if (Object.hasOwn(headlines, edge.id)) {
      featured.push({edge, source, target, headline: headlines[edge.id]});
    }
  }
  const deck = shuffled(featured, random);
  let position = 0, remaining = [], lastEntity = null;
  return {
    featuredCount: deck.length,
    entityCount: connected.size,
    current() { return deck[position] ?? null; },
    move(direction) {
      if (deck.length) position = (position + direction + deck.length) % deck.length;
      return deck[position] ?? null;
    },
    nextEntity() {
      if (!connected.size) return null;
      if (!remaining.length) {
        remaining = shuffled(connected, random);
        const end = remaining.length - 1;
        if (end > 0 && remaining[end] === lastEntity) {
          const pick = Math.floor(random() * end);
          [remaining[end], remaining[pick]] = [remaining[pick], remaining[end]];
        }
      }
      lastEntity = remaining.pop();
      return lastEntity;
    }
  };
}
