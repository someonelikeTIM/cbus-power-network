import { writeFile, mkdir, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { pythonExecutable } from './runtime.mjs';
import { allDeclaredSources } from '../dist/data.js';
import { sourceLiveEvidence } from '../dist/live-sources.js';
import { enrichmentChecks } from '../dist/enrichment.js';
import { infrastructureChecks } from '../dist/infrastructure.js';
import { politicalChecks } from '../dist/politics.js';
import { flowChecks } from '../dist/flows.js';
import { trailChecks } from '../dist/trails.js';
import { mediaChecks } from '../dist/media.js';
import { civicChecks } from '../dist/civic-enrichment.js';
import { donationChecks } from '../dist/donation-enrichment.js';

const checks={...enrichmentChecks,...infrastructureChecks,...politicalChecks,...flowChecks,...trailChecks,...mediaChecks,...civicChecks,...donationChecks};
const requested=new Set(process.argv.slice(2));
const selected=allDeclaredSources.filter(s=>(!requested.size||requested.has(s.id))&&!s.archiveUrl);
if([...requested].some(id=>!allDeclaredSources.some(s=>s.id===id)))throw Error('Unknown source ID');
const records={...sourceLiveEvidence},outcomes={},cache=resolve('artifacts/live-content');
await mkdir(cache,{recursive:true});
const python=pythonExecutable;
const normalize=t=>t.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[\u2010-\u2015]/g,'-').replace(/[\u2018\u2019]/g,"'").replace(/\s+/g,' ').toLowerCase();
const htmlText=html=>html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<img\b[^>]*\balt="([^"]*)"[^>]*>/gi,' $1 ').replace(/<[^>]*>/g,' ').replace(/&#x([\da-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&nbsp;|&amp;|&quot;|&rsquo;|&ndash;|&mdash;/g,m=>({'&nbsp;':' ','&amp;':'&','&quot;':'"','&rsquo;':"'",'&ndash;':'-','&mdash;':'-'}[m]));
let cursor=0;
async function worker(){while(cursor<selected.length){const s=selected[cursor++];try{
  if(records[s.id]?.originalUrl===s.url&&records[s.id].contentVerified&&checks[s.id]?.every(term=>records[s.id].contentChecks?.includes(term))){outcomes[s.id]='already-verified';continue;}
  if(!checks[s.id]?.length)throw Error('Missing source-specific checks');
  const response=await fetch(s.url,{signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error(`Original HTTP ${response.status}`);
  const bytes=Buffer.from(await response.arrayBuffer()),pdf=bytes.subarray(0,5).toString()==='%PDF-';
  const file=resolve(cache,`${s.id}.${pdf?'pdf':'html'}`);await writeFile(file,bytes);
  const text=pdf?execFileSync(python,['-c','import sys; from pypdf import PdfReader; print("\\n".join(p.extract_text() or "" for p in PdfReader(sys.argv[1]).pages))',file],{encoding:'utf8',maxBuffer:10000000,env:{...process.env,PYTHONIOENCODING:'utf-8'}}):htmlText(bytes.toString('utf8'));
  await writeFile(resolve(cache,`${s.id}.txt`),text);
  const normalized=normalize(text),missing=checks[s.id].filter(term=>!normalized.includes(normalize(term)));
  records[s.id]={originalUrl:s.url,finalUrl:response.url,contentVerified:missing.length===0,checkedAt:new Date().toISOString(),sha256:createHash('sha256').update(bytes).digest('hex'),contentCheckMethod:'Original content fetch',contentChecks:checks[s.id],missingChecks:missing};
  outcomes[s.id]=missing.length?'content-check-needed':'verified';console.log(`${s.id}: ${outcomes[s.id]}${missing.length?' ['+missing.join(', ')+']':''}`);
}catch(error){outcomes[s.id]=error.message;console.error(`${s.id}: ${error.message}`);}}}
await Promise.all([worker(),worker(),worker()]);
const target=resolve('dist/live-sources.js');await writeFile(target+'.tmp','// Original sources checked when a dated archive is unavailable. Archives stay preferred.\nexport const sourceLiveEvidence = '+JSON.stringify(records,null,2)+';\n');await rename(target+'.tmp',target);
console.log(JSON.stringify({verified:Object.values(records).filter(r=>r.contentVerified).length,outcomes}));
