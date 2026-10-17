// Check current originals without changing accepted evidence or published data.
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {allDeclaredSources} from '../dist/data.js';
import {campaignFinanceIndex} from '../dist/campaign-finance-index.js';

export async function checkSource(source, previous = {}, fetcher = fetch) {
  const result = {id:source.id, url:source.url, attemptedAt:new Date().toISOString(),
    lastSuccessfulAt:previous.lastSuccessfulAt || null, sha256:previous.sha256 || null,
    contentHash:previous.contentHash || null};
  try {
    const response = await fetcher(source.url, {
      signal:AbortSignal.timeout(20000),
      headers:{'User-Agent':'Mozilla/5.0 (compatible; source availability check)', 'Accept':'text/html,application/pdf,*/*;q=0.8'},
    });
    if (!response.ok) throw Error(`HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length) throw Error('Empty response');
    // A successful HTTP response can still be an access challenge.
    const opening = bytes.subarray(0,12000).toString('utf8');
    if (/just a moment\.\.\.|<title>[^<]*(?:access denied|captcha|robot check)|cf-chl-|verify you are human/i.test(opening)) {
      throw Error('Access challenge; inspect in a browser');
    }
    const digest = createHash('sha256').update(bytes).digest('hex');
    const html = /text\/html/i.test(response.headers.get('content-type') || '') || /<!doctype html|<html[\s>]/i.test(opening);
    const content = html ? bytes.toString('utf8').replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi,' ')
      .replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim() : bytes;
    const contentHash = createHash('sha256').update(content).digest('hex');
    return {...result, status:!previous.contentHash?'baseline':previous.contentHash===contentHash?'unchanged':'changed',
      previousSha256:previous.sha256 || null, sha256:digest, contentHash, lastSuccessfulAt:result.attemptedAt,
      finalUrl:response.url || source.url, bytes:bytes.length};
  } catch (error) {
    return {...result, status:'failed', error:error.message};
  }
}

export async function refreshData(ids = []) {
  const requested = new Set(ids);
  const unknown = ids.filter(id=>!allDeclaredSources.some(source=>source.id===id));
  if (unknown.length) throw Error(`Unknown source IDs: ${unknown.join(', ')}`);
  const selected = allDeclaredSources.filter(source=>!requested.size || requested.has(source.id));
  const directory = 'artifacts/data-refresh';
  await mkdir(directory,{recursive:true});
  let state;
  try { state = JSON.parse(await readFile(`${directory}/state.json`,'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; state = {}; }
  const results = new Array(selected.length);
  let cursor = 0;
  async function worker() {
    while (cursor < selected.length) {
      const index = cursor++, source = selected[index];
      const result = await checkSource(source,state[source.id]?.url===source.url?state[source.id]:{});
      state[source.id] = result;
      results[index] = result;
      console.log(`${source.id}: ${result.status}${result.error?' ('+result.error+')':''}`);
    }
  }
  await Promise.all([worker(),worker(),worker()]);
  const report = {checkedAt:new Date().toISOString(),
    scope:requested.size?'Selected original source URLs':'All original source URLs',
    note:'Availability and content changes only (HTML text; other files compared as bytes). A baseline or unchanged response is not a substantive claim review. Archives and accepted evidence are untouched.',
    counts:Object.fromEntries(['baseline','unchanged','changed','failed'].map(status=>[status,results.filter(row=>row.status===status).length])),
    sources:results,
    campaignCoverage:{asOf:campaignFinanceIndex.asOf,
      note:'Existing edition coverage; this command does not discover or download new filings.',
      gaps:campaignFinanceIndex.candidateCoverage.filter(row=>row.status!=='Filings indexed')},
  };
  const save = async (path,value) => {
    await writeFile(path+'.tmp',JSON.stringify(value,null,2)+'\n');
    await rename(path+'.tmp',path);
  };
  // Dated reports retain earlier change signals even after a later unchanged check.
  const stamp = report.checkedAt.replace(/[:.]/g,'-');
  await save(`${directory}/${stamp}.json`,report);
  await save(`${directory}/latest.json`,report);
  await save(`${directory}/state.json`,state);
  console.log(`Report: ${directory}/latest.json ${JSON.stringify(report.counts)}`);
  return report;
}

if (process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  refreshData(process.argv.slice(2)).catch(error=>{console.error(error.message);process.exitCode=1;});
}
