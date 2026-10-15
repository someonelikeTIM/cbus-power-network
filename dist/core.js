import { nodes, edges, cases } from './data.js';
import { entityMatches, relationshipMatches, normalizeText } from './search.js';
import { reportingEdges } from './reporting.js';

export const normalize = normalizeText;
export const matches = entityMatches;

export function filterGraph({ categories, relationships, history = true, query = '', caseId = 'all', connectionMode='all',from='',to='',includeUncertain=true }) {
  const contextIds = new Set(caseId==='money' ? Object.values(cases).flatMap(c=>c.contextEdgeIds||[]) : cases[caseId]?.contextEdgeIds||[]);
  const caseEdges = edges.filter(e => caseId === 'all' || (caseId === 'money' ? e.caseId : e.caseId === caseId) || contextIds.has(e.id));
  const caseNodes = new Set(caseEdges.flatMap(e => [e.source, e.target]));
  const available = nodes.filter(n => (caseId === 'all' || caseNodes.has(n.id)) && categories.has(n.category) && (history || (!n.historical && edges.some(e => !e.historical && (e.source === n.id || e.target === n.id)))));
  const ids = new Set(available.map(n => n.id));
  const links = reportingEdges(caseEdges.filter(e => ids.has(e.source) && ids.has(e.target) && relationships.has(e.type) && (history || !e.historical)),{connectionMode,from,to,includeUncertain});
  if (!query.trim()) return { nodes: available, edges: links, matches: available.map(n => n.id) };
  const found = available.filter(n => matches(n, query));
  const foundIds = new Set(found.map(n => n.id));
  const context = new Set(foundIds);
  const byId=new Map(available.map(n=>[n.id,n]));
  for(const e of links)if(relationshipMatches(e,query,byId)){context.add(e.source);context.add(e.target);}
  for (const e of links) if (foundIds.has(e.source) || foundIds.has(e.target)) { context.add(e.source); context.add(e.target); }
  return { nodes: available.filter(n => context.has(n.id)), edges: links.filter(e => context.has(e.source) && context.has(e.target)), matches: [...foundIds] };
}

// An undirected path describes shared documented links, never causation or control.
export function shortestPath(graph, start, end, { directed = false } = {}) {
  const ids = new Set(graph.nodes.map(n => n.id));
  if (!ids.has(start) || !ids.has(end)) return null;
  const seen = new Set([start]);
  const queue = [{ nodes: [start], edges: [] }];
  for (let index = 0; index < queue.length; index++) {
    const path = queue[index];
    const last = path.nodes.at(-1);
    if (last === end) return path;
    for (const e of graph.edges) {
      const next = e.source === last ? e.target : e.target === last && (!directed || !e.directional) ? e.source : null;
      if (next && !seen.has(next)) { seen.add(next); queue.push({ nodes: [...path.nodes, next], edges: [...path.edges, e.id] }); }
    }
  }
  return null;
}
