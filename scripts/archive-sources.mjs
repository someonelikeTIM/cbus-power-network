// Read-only CDX and archived-content queries. Never uploads the local Site.
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { pythonExecutable } from './runtime.mjs';
import { allDeclaredSources as sources } from '../dist/data.js';
import { sourceArchives } from '../dist/archives.js';
import { cityHallSourceChecks } from '../dist/city-hall.js';
import { enrichmentChecks } from '../dist/enrichment.js';
import { infrastructureChecks, municipalInfrastructureChecks } from '../dist/infrastructure.js';
import { politicalChecks } from '../dist/politics.js';
import { flowChecks } from '../dist/flows.js';
import { trailChecks } from '../dist/trails.js';
import { mediaChecks } from '../dist/media.js';
import { civicChecks } from '../dist/civic-enrichment.js';
import { donationChecks } from '../dist/donation-enrichment.js';
import { campaignChecks } from '../dist/campaigns-2026.js';

const checks = {
  mayor:['ginther','third term'], council:['hardin','rob dorans','bankston','district 9'],
  linkus:['monica','tellez','murdock','crawley','columbus partnership'],
  burger:['corrine burger','september 10, 2026','chief executive','kirt walker','nationwide children'],
  steinour:['steinour','battelle','bath','wexner medical','co-chair'],
  fehrman:['fehrman','chief executive','columbus partnership'],
  smart:['corrine','william murdock','collaborators'],
  'wexner-story':['abigail','co-chairmen','1990'], 'wexner-structure':['leslie','early 1980','abigail'],
  'lbrands-2020':['wexner','1963'], 'lbrands-2021':['wexner','may 20, 2021','retire'],
  rename:['l brands','august 2, 2021','name change'],
  'aep-order':['empowering','controlled','19,000,000','january 17, 2025'],
  'aep-sec':['empowering','19 million','without admitting'],
  'eoe-money':['8.7 million','700,000','uncashed'], 'gn-bank':['700,000','six checks','generation now'],
  'hb6-verdict':['march 9, 2023','proved beyond a reasonable doubt','61 million','householder'],
  'householder-sentence':['june 29, 2023','240 months','half a million'],
  'fe-admission':['july 22, 2021','230 million','admits'],
  'les-letter':['power of attorney','managing my personal finances','trustee of the wexner foundation','misappropriated vast sums','2007'],
  'wexner-review':['12,377,844','34,280,154','december 15, 1992','december 20, 2007'],
  'epstein-charges':['july 8, 2019','sex trafficking','minors'],
  'epstein-plea':['june 2008','pleaded guilty','18-month'],
  'epstein-death':['august 10, 2019','pronounced dead','sex trafficking'],
  'redflex-plea':['june 19, 2015','karen','pleaded guilty','columbus','false invoices'],
  'redflex-npa':['raphael','pleaded guilty','non-prosecution'],
  'redflex-ginther':['ginther','21,000','ohio democratic party','twice asked'],
  ...cityHallSourceChecks, ...enrichmentChecks, ...infrastructureChecks, ...politicalChecks, ...flowChecks, ...trailChecks, ...mediaChecks, ...civicChecks, ...donationChecks, ...campaignChecks,
  'city-lobbyists-2025':[...cityHallSourceChecks['city-lobbyists-2025'],...municipalInfrastructureChecks]
};
const records={...sourceArchives}, outcomes={};
const checkedAt=new Date().toISOString(), before=checkedAt.replace(/[-:TZ.]/g,'').slice(0,14);
const cachedOnly=process.argv.includes('--cached');
const requested=new Set(process.argv.slice(2).filter(arg=>arg!=='--cached'));
const selected=sources.filter(s=>!requested.size||requested.has(s.id));
if(requested.size&&selected.length!==requested.size) throw new Error('Use source IDs from dist/data.js.');
const target=resolve('dist/archives.js'), cache=resolve('artifacts/archive-content');
await mkdir(cache,{recursive:true});
const python=pythonExecutable;
let cursor=0, failed=0, stop=false;
const normalize=t=>t.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[\u2010-\u2015]/g,'-').replace(/[\u2018\u2019]/g,"'").replace(/\s+/g,' ').toLowerCase();
const htmlText=html=>html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<img\b[^>]*\balt="([^"]*)"[^>]*>/gi,' $1 ').replace(/<[^>]*>/g,' ').replace(/&#x([\da-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&nbsp;|&amp;|&quot;|&rsquo;|&ndash;|&mdash;/g,m=>({'&nbsp;':' ','&amp;':'&','&quot;':'"','&rsquo;':"'",'&ndash;':'-','&mdash;':'-'}[m]));
async function save(){const temporary=target+'.tmp';const state={checkedAt,method:cachedOnly?'SHA256-matched archived PDF cache + content checks':'Wayback CDX + content checks',state:cursor<selected.length?'in-progress':'complete',verified:Object.values(records).filter(r=>r.contentVerified).length,outcomes};await writeFile(temporary,`// Dated captures checked against the cited source facts.\nexport const sourceArchives = ${JSON.stringify(records,null,2)};\nexport const archiveLookup = ${JSON.stringify(state,null,2)};\n`);await rename(temporary,target);}
async function worker(){
  while(!stop&&cursor<selected.length){
    const s=selected[cursor++];
    if(records[s.id]?.contentVerified&&records[s.id].originalUrl===s.url&&checks[s.id]?.every(term=>records[s.id].contentChecks?.includes(term))){outcomes[s.id]='verified';continue;}
    try{
      let timestamp,original,digest,mime,url;
      const candidate=records[s.id];
      if(cachedOnly&&(!candidate?.contentVerified||candidate.originalUrl!==s.url))throw new Error('No previously verified matching capture for cache check');
      if(candidate?.originalUrl===s.url&&/^\d{14}$/.test(candidate.timestamp||'')&&candidate.url?.startsWith(`https://web.archive.org/web/${candidate.timestamp}/`)){
        ({timestamp,url}=candidate);original=s.url;digest=candidate.cdxDigest||null;mime=candidate.mime||null;
      }else{
        const query=new URL('https://web.archive.org/cdx/search/cdx');
        // Latest-row lookup avoids the expensive full-history digest-collapse pass.
        for(const [key,value] of Object.entries({url:s.url.replace(/^https?:\/\//,''),output:'json',filter:'statuscode:200',fl:'timestamp,original,digest,mimetype',limit:'-1',to:before}))query.searchParams.set(key,value);
        const response=await fetch(query,{signal:AbortSignal.timeout(25000)});
        if(!response.ok)throw new Error(`CDX HTTP ${response.status}`);
        const rows=await response.json();
        if(rows.length<2){outcomes[s.id]='no-capture';console.log(`${s.id}: no capture`);continue;}
        [timestamp,original,digest,mime]=rows.at(-1);url=`https://web.archive.org/web/${timestamp}/${original}`;
      }
      if(!/^\d{14}$/.test(timestamp)||timestamp>before)throw new Error('Invalid capture timestamp');
      let bytes,contentCheckMethod='Archived content fetch';
      if(cachedOnly){
        if(!candidate?.contentVerified||!candidate.sha256)throw new Error('No previously verified capture for cache check');
        bytes=await readFile(resolve(cache,`${s.id}-${timestamp}.pdf`));
        if(createHash('sha256').update(bytes).digest('hex')!==candidate.sha256)throw new Error('Archive cache hash differs from verified capture');
        contentCheckMethod='SHA256-matched archived PDF cache';
      }else{
        const archived=await fetch(url,{signal:AbortSignal.timeout(30000)});
        if(!archived.ok||new URL(archived.url).hostname!=='web.archive.org')throw new Error(`Capture HTTP ${archived.status}`);
        bytes=Buffer.from(await archived.arrayBuffer());
      }
      let text;
      if(bytes.subarray(0,5).toString()==='%PDF-'){
        const file=resolve(cache,`${s.id}-${timestamp}.pdf`);await writeFile(file,bytes);
        text=execFileSync(python,['-c','import sys; from pypdf import PdfReader; print("\\n".join(p.extract_text() or "" for p in PdfReader(sys.argv[1]).pages))',file],{encoding:'utf8',maxBuffer:10000000,env:{...process.env,PYTHONIOENCODING:'utf-8'}});
      }else{text=htmlText(bytes.toString('utf8'));}
      if(!checks[s.id]?.length)throw new Error('Define source content checks before pinning.');
      const normalized=normalize(text), missing=checks[s.id].filter(term=>!normalized.includes(normalize(term)));
      records[s.id]={originalUrl:s.url,url,timestamp,contentVerified:missing.length===0,checkedAt,cdxDigest:digest,mime,sha256:createHash('sha256').update(bytes).digest('hex'),contentCheckMethod,contentChecks:checks[s.id]||[],missingChecks:missing};
      outcomes[s.id]=missing.length?'content-check-needed':'verified';
      console.log(`${s.id}: ${timestamp} ${outcomes[s.id]}${missing.length?' ['+missing.join(', ')+']':''}`);
    }catch(error){failed++;outcomes[s.id]='lookup-failed';console.error(`${s.id}: ${error.cause?.code||error.message}`);if(failed>=3)stop=true;}
  }
}
await worker();await save();
console.log(JSON.stringify({verified:Object.values(records).filter(r=>r.contentVerified).length,failed,outcomes}));
if(failed)process.exitCode=1;
