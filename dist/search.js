import { sources } from './data.js';
import { entityIdentifiers } from './curation.js';
export const normalizeText = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const flattened = value => typeof value === 'object' && value !== null ? Object.values(value).map(flattened).join(' ') : String(value ?? '');
// Reader vocabulary for existing records. These aliases are navigation aids.
const aliases={
  'columbus-photo-red-light':['red light cameras','traffic cameras','red light tickets'],
  'redflex-ohio-proceedings':['red light camera bribery case','traffic camera corruption case','red light camera scandal'],
  redflex:['red light camera vendor','traffic camera company']
};
const civicPlurals=/\b(cameras|tickets|contracts|payments|contributions|donations|grants|records|filings|loans|agreements|permits|elections|laws|rates|projects|schools|boards|vendors|officials|readers|utilities|companies)\b/g;
export function discoveryText(value){
  return normalizeText(flattened(value)).replace(/(?<=\d),(?=\d)/g,'').replace(/['’]/g,'')
    .replace(/\bredlight\b/g,'red light').replace(/[^\p{L}\p{N}]+/gu,' ').trim()
    .replace(civicPlurals,word=>word.endsWith('ies')?word.slice(0,-3)+'y':word.slice(0,-1));
}
export function discoveryRank(words,label,detail=[],otherNames=[]){
  const phrase=words.join(' '),name=discoveryText(label);
  if(!phrase)return Infinity;
  if(name===phrase||otherNames.some(alias=>discoveryText(alias)===phrase))return 0;
  if(name.startsWith(phrase))return 1;
  if(name.includes(phrase))return 2;
  if(words.every(word=>name.includes(word)))return 3;
  const content=[name,discoveryText(otherNames),discoveryText(detail)].join(' ');
  if(content.includes(phrase))return 4;
  return words.every(word=>content.includes(word))?5:Infinity;
}
export const entityRank=(node,words)=>discoveryRank(words,node.name,[node.role,node.description,node.externalIdentifiers,entityIdentifiers[node.id]],[node.id,...(node.aliases||[]),...(aliases[node.id]||[])]);
export const textMatches = (value, query) => {
  const q=query.trim();
  const cleaned=/^\$?[\d,]+(?:\.\d+)?$/.test(q)?String(Number(q.replace(/[$,]/g,''))):normalizeText(q);
  const raw=flattened(value);
  if(normalizeText(raw).includes(cleaned))return true;
  const normalized=discoveryText(q),content=discoveryText(raw);
  return !!normalized&&normalized.split(' ').every(word=>content.includes(word));
};
const indexedSources = new Map(sources.map(s => [s.id, s]));
export const entityMatches = (entity, query) => textMatches([entity.id,entity.name,entity.role,entity.description,entity.aliases,aliases[entity.id],entity.externalIdentifiers,entityIdentifiers[entity.id]], query);
export const sourceMatches = (source, query) => textMatches([source.id,source.title,source.publisher,source.note,source.kind,source.date], query);
export function relationshipMatches(edge, query, nodeById) {
  const text = [edge, nodeById?.get(edge.source), nodeById?.get(edge.target), ...edge.sourceIds.map(id => indexedSources.get(id))];
  return textMatches(text, query);
}
