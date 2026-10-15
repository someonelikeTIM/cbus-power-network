import { sources } from './data.js';
import { entityIdentifiers } from './curation.js';
export const normalizeText = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const flattened = value => typeof value === 'object' && value !== null ? Object.values(value).map(flattened).join(' ') : String(value ?? '');
export const textMatches = (value, query) => {
  const q=query.trim();
  const cleaned=/^\$?[\d,]+(?:\.\d+)?$/.test(q)?String(Number(q.replace(/[$,]/g,''))):normalizeText(q);
  return normalizeText(flattened(value)).includes(cleaned);
};
const indexedSources = new Map(sources.map(s => [s.id, s]));
export const entityMatches = (entity, query) => textMatches([entity.id,entity.name,entity.role,entity.description,entity.aliases,entity.externalIdentifiers,entityIdentifiers[entity.id]], query);
export const sourceMatches = (source, query) => textMatches([source.id,source.title,source.publisher,source.note,source.kind,source.date], query);
export function relationshipMatches(edge, query, nodeById) {
  const text = [edge, nodeById?.get(edge.source), nodeById?.get(edge.target), ...edge.sourceIds.map(id => indexedSources.get(id))];
  return textMatches(text, query);
}
