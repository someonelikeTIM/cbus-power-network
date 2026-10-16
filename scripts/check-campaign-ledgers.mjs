import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {campaignFinanceIndex as catalog} from '../dist/campaign-finance-index.js';
import {campaignRoster} from '../dist/campaigns-2026.js';
import {groupReportedNames,financeCSV} from '../dist/campaign-finance.js';

const root='dist/finance/2026/',hash=bytes=>createHash('sha256').update(bytes).digest('hex');
assert.deepEqual(JSON.parse(await readFile(root+'index.json','utf8')),catalog);
assert.equal(catalog.candidateCoverage.length,campaignRoster.length);
assert.equal(catalog.complete,false,'Known filing gaps must remain visible');
assert.equal(new Set(catalog.sources.map(s=>s.id)).size,catalog.sources.length);
const sources=new Map(catalog.sources.map(s=>[s.id,s])),reports=new Map(catalog.reports.map(r=>[r.id,r]));
const cashIn=new Set(['contribution','transfer-in','loan','offset','other-receipt']),cashOut=new Set(['spending','refund','loan-repayment','transfer-out']);
let rows=0,memos=0,unattributed=0,identicalRows=0,blankFields=0;const grouped=new Map();
for(const report of catalog.reports){
  const bytes=await readFile(root+report.path);assert.equal(hash(bytes),report.sha256);assert.equal(bytes.length,report.bytes);
  const data=JSON.parse(gunzipSync(bytes));assert.deepEqual(data.columns,catalog.columns);assert.equal(data.reportId,report.id);assert.equal(data.rows.length,report.rowCount);
  assert.ok(sources.has(report.sourceId));const ids=new Set(),values=new Set(),totals=new Map(),groups=new Map();
  for(const row of data.rows){
    assert.equal(row.length,catalog.columns.length);assert.ok(!ids.has(row[0]),'Duplicate stable transaction ID');ids.add(row[0]);assert.ok(Number.isSafeInteger(row[4]));assert.equal(typeof row[5],'boolean');assert.ok(row[3].trim());assert.ok(row[11]);
    if(row[1])assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(row[1]));
    assert.ok(!/\b(?:PO Box|\d+ (?:[NEWS] )?(?:Town|Spring) St(?:reet)?|\d{5}(?:-\d{4})?)\b/.test(row[3]),'Possible address fragment in a reported name');
    const signature=JSON.stringify(row.slice(1,11));if(values.has(signature))identicalRows++;values.add(signature);
    rows++;if(row[5]){memos++;continue;}totals.set(row[2],(totals.get(row[2])||0)+row[4]);
    if(!['loan-balance','debt-balance'].includes(row[2])){const key=JSON.stringify([row[3],row[2],report.id]);if(!groups.has(key))groups.set(key,[row[3],row[2],report.id,0,0]);const group=groups.get(key);group[3]+=row[4];group[4]++;}
  }
  grouped.set(report.id,[...groups.values()]);
  const incoming=[...totals].filter(([k])=>cashIn.has(k)).reduce((n,[,v])=>n+v,0),outgoing=[...totals].filter(([k])=>cashOut.has(k)).reduce((n,[,v])=>n+v,0);
  if(report.id.startsWith('fec-')){
    assert.equal(report.reconciliation.receipts.itemizedCents,incoming);assert.equal(report.reconciliation.disbursements.itemizedCents,outgoing);
    assert.equal(report.metrics.receipts,incoming+report.reconciliation.receipts.differenceCents);assert.equal(report.metrics.disbursements,outgoing+report.reconciliation.disbursements.differenceCents);unattributed+=report.reconciliation.receipts.differenceCents;
    assert.ok(report.reconciliation.receipts.differenceCents>=(report.metrics.unitemizedIndividuals||0));
  }else{
    const check=(key,value)=>{if(report.metrics[key]===null){blankFields++;return;}assert.equal(report.metrics[key],value,report.id+' '+key)};
    check('contributions',totals.get('contribution')||0);check('otherReceipts',(totals.get('other-receipt')||0)+(totals.get('loan')||0));check('disbursements',outgoing);check('inKind',totals.get('in-kind')||0);
  }
  const m=report.metrics;if(['beginningCash','endingCash','disbursements'].every(k=>m[k]!==null)&& (m.receipts!==undefined||m.contributions!==null&&m.otherReceipts!==null))assert.equal(m.beginningCash+(m.receipts??m.contributions+m.otherReceipts)-m.disbursements,m.endingCash,report.id+' balance equation');
}
for(const unit of catalog.units){
  assert.ok(unit.candidateIds.every(id=>campaignRoster.some(c=>c.id===id)));assert.ok(unit.reportIds.every(id=>reports.get(id)?.unitId===unit.id));
  if(!unit.nameGroups)continue;const bytes=await readFile(root+unit.nameGroups.path);assert.equal(hash(bytes),unit.nameGroups.sha256);const data=JSON.parse(gunzipSync(bytes));
  const expected=unit.reportIds.flatMap(id=>grouped.get(id));assert.deepEqual(groupReportedNames(data.rows,new Set(unit.reportIds)),groupReportedNames(expected,new Set(unit.reportIds)),'Name totals differ from their actual transactions');
}
assert.equal(catalog.reports.filter(r=>r.unitId==='C00916288'&&r.period.end<='2026-06-30').reduce((n,r)=>n+r.metrics.receipts,0),3856623410,'Brown current committee total');
assert.equal(catalog.reports.filter(r=>r.unitId==='C00896019'&&r.period.end<='2026-06-30').reduce((n,r)=>n+r.metrics.receipts,0),1435062446,'Husted principal committee total');
const originalIndex=JSON.parse(await readFile('content/campaigns/federal-disclosure-index-2026.json','utf8'));
assert.deepEqual(catalog.reports.filter(r=>r.id.startsWith('fec-')).map(r=>Number(r.reportKey)).sort((a,b)=>a-b),[...originalIndex.financialFilingIds].sort((a,b)=>a-b),'Original financial filing inventory incomplete');
assert.equal(catalog.reports.find(r=>r.id==='fec-2027030').period.end,'2026-09-30','API processing lag must not omit original third-quarter reports');
assert.equal(catalog.reports.filter(r=>r.unitId==='C00916288').reduce((n,r)=>n+r.metrics.receipts,0),6168681969);
assert.equal(catalog.reports.filter(r=>r.unitId==='C00896019').reduce((n,r)=>n+r.metrics.receipts,0),1919936015);
assert.equal(catalog.supplementaryDisclosures.length,47);
for(const disclosure of catalog.supplementaryDisclosures){assert.ok(/^https:\/\/docquery.fec.gov\//.test(disclosure.url));assert.ok(!reports.has('fec-'+disclosure.file),'Supplementary disclosures were counted as financial reports');}
assert.ok(catalog.units.some(u=>u.id==='C00895276'),'Authorized nominee committee omitted');
assert.ok(!catalog.units.some(u=>u.id==='C00264697'),'Former Brown committee is not the current campaign');
assert.equal(catalog.reports.find(r=>r.id==='oh-491730748').metrics.loans,2514120097,'Loan schedules omitted or balances counted as new receipts');
assert.ok(identicalRows>0,'Real repeated transactions were dropped');assert.ok(memos>0&&blankFields>0&&unattributed>0);
assert.ok(financeCSV(['name','amount'],[['=formula',-125]]).includes("'=formula"));assert.ok(financeCSV(['name'],[['a"b']]).includes('a""b'));
const result={committees:catalog.units.length,reports:catalog.reports.length,rows,memos,identicalRowsRetained:identicalRows,sourceFiles:catalog.sources.length,blankSummaryFieldsRetained:blankFields,unattributedReceiptCents:unattributed,coverage:catalog.candidateCoverage.filter(r=>r.status!=='Filings indexed')};
await writeFile('artifacts/campaign-ledger/checks.json',JSON.stringify(result,null,2)+'\n');console.log('PASS campaign ledgers: '+JSON.stringify({...result,coverageGaps:result.coverage.length,coverage:undefined}));
