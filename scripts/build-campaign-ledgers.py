"""Build privacy-reduced, source-linked campaign ledgers from official exports.

Original inputs live in artifacts/campaign-ledger, outside the public checkout.
Amounts are integer cents. Repeated real rows survive; superseded FEC reports do
not contribute to totals. Source IDs and report IDs are preserved separately.
"""
import codecs, collections, csv, datetime, decimal, gzip, hashlib, json, pathlib, re

ROOT = pathlib.Path('artifacts/campaign-ledger')
OUT = pathlib.Path('dist/finance/2026')
OUT.mkdir(parents=True, exist_ok=True)
ASOF = '2026-10-15'
COLUMNS = ['id','date','category','name','amountCents','memo','form','employer','occupation','reference','election','locator']
D = decimal.Decimal
def cents(value):
    return None if value is None or str(value).strip()=='' else int(D(str(value).replace('$','').replace(',',''))*100)
def cash(value): return cents(value) or 0
def date(value):
    if not value:return None
    for fmt in ['%d-%b-%y','%m/%d/%Y','%Y%m%d','%Y-%m-%d']:
        try:return datetime.datetime.strptime(value[:10],fmt).strftime('%Y-%m-%d')
        except ValueError:pass
    raise ValueError('Unrecognized date '+value)
def clean(value):
    text=re.sub(r'\s+',' ',str(value or '')).strip()
    text=re.sub(r'[\w.+%-]+@[\w.-]+\.[A-Za-z]{2,}','[contact omitted]',text)
    text=re.sub(r'(?<!\d)(?:\+?1[-. ]?)?\(?\d{3}\)?[-. ]\d{3}[-. ]\d{4}(?!\d)','[phone omitted]',text)
    text=re.sub(r'\b\d+\s+(?:[NSEW]\.?\s+)?(?:[A-Za-z]+\s+){1,5}(?:Street|St\.|Road|Rd\.|Avenue|Ave\.|Drive|Dr\.|Lane|Ln\.|Boulevard|Blvd\.)\b','[address omitted]',text,flags=re.I)
    return text
def decode_legacy(error):
    return (error.object[error.start:error.end].decode('cp1252',errors='replace'),error.end)
codecs.register_error('campaign_legacy',decode_legacy)
def readcsv(path):
    # Current bulk exports use UTF-8, while some per-report exports contain
    # legacy Windows-1252 characters. Decode those bytes without discarding rows.
    with path.open(encoding='utf-8-sig',errors='campaign_legacy',newline='') as f:yield from csv.DictReader(f)
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def dump(path,value):path.write_bytes((json.dumps(value,ensure_ascii=False,separators=(',',':'))+'\n').encode('utf-8'))
sources={};units={};reports=[]
def source(id,path,url,publisher,title):
    sources[id]={'id':id,'url':url,'publisher':publisher,'title':title,'sha256':sha(path),'checkedAt':datetime.datetime.fromtimestamp(path.stat().st_mtime,datetime.timezone.utc).isoformat(),'bytes':path.stat().st_size}
    return id
def newunit(id,name,candidates,jurisdiction):
    units[id]={'id':id,'name':name,'candidateIds':candidates,'jurisdiction':jurisdiction,'reportIds':[]}
    return units[id]
def row(report,dt,category,name,amount,form,employer='',occupation='',reference='',election='',locator='',memo=False,identity=None):
    r=[None,dt,category,clean(name) or 'Name not supplied',amount,bool(memo),form,clean(employer),clean(occupation),clean(reference),election,locator]
    key=identity or hashlib.sha256(json.dumps(r[1:11],ensure_ascii=False).encode()).hexdigest()[:16]
    occurrence=report['_ids'][key];report['_ids'][key]+=1
    r[0]=report['id']+':'+key+(':'+str(occurrence) if occurrence else '')
    report['_rows'].append(r)
    return r
def newreport(id,unit,title,sourceId,start=None,end=None,filed=None):
    r={'id':id,'unitId':unit,'title':title,'sourceId':sourceId,'period':{'start':start,'end':end},'filedAt':filed,'metrics':{},'_rows':[],'_ids':collections.Counter(),'notes':[]}
    units[unit]['reportIds'].append(id);reports.append(r);return r

# Candidate-to-committee identities are taken from the official register, with
# a shared ledger for each governor/lieutenant-governor ticket.
OHIO={
 '16171':['amy-acton','david-pepper'],'16178':['vivek','mccolley'],
 '16349':['don-kissick','james-mills'],'15123':['timothy-grady','andrea-neutzling'],
 '15017':['renea-turner','jalen-turner'],'16307':['annette-blackwell'],
 '7400':['keith-faber'],'14441':['jay-edwards'],'16229':['john-kulewicz'],
 '12883':['larose'],'16299':['seth-walsh'],'13504':['sprague'],
 '14814':['allison-russo'],'16484':['tom-pruss'],'16150':['heather-hill','patrick-manley']}
register={r['MASTER_KEY']:r for r in readcsv(ROOT/'ACT_CAN_LIST.CSV')}
for record in readcsv(ROOT/'CAN_COVER.CSV'):
    if record['MASTER_KEY'] in OHIO and record['MASTER_KEY'] not in register:register[record['MASTER_KEY']]=record
base='https://www6.ohiosos.gov/ords/'
source('finance-ohio-register',ROOT/'ACT_CAN_LIST.CSV',base+'f?p=CFDISCLOSURE:72:::NO::P72_GETID:120','Ohio Secretary of State','Active candidate committee register')
coverSource=source('finance-ohio-covers',ROOT/'CAN_COVER.CSV',base+'f?p=CFDISCLOSURE:72:::NO::P72_GETID:123','Ohio Secretary of State','Candidate report cover pages')
for key,candidates in OHIO.items():
    newunit('oh-'+key,register[key]['COM_NAME'],candidates,'Ohio state filings')
ohReports={}
for r in readcsv(ROOT/'CAN_COVER.CSV'):
    if r['MASTER_KEY'] not in OHIO or r['RPT_YEAR'] not in ['2025','2026']:continue
    unit='oh-'+r['MASTER_KEY'];key=r['REPORT_KEY'];title=r['RPT_YEAR']+' '+r['REPORT_DESCRIPTION'].strip()
    # The bulk cover export retains the current version of a report key.
    assert key not in ohReports,'Duplicate current Ohio cover page'
    rep=newreport('oh-'+key,unit,title,coverSource,filed=date(r['DATE_REPORT_FILED']))
    rep['reportKey']=key;rep['year']=int(r['RPT_YEAR'])
    rep['metrics']={label:cents(r[field]) for label,field in {'contributions':'TOTAL_CONTRIBUTIONS','otherReceipts':'TOTAL_OTHER_INCOME','disbursements':'TOTAL_EXPENDITURES','inKind':'VALUE_INKIND_RECEIVED','beginningCash':'AMT_FORWARD','endingCash':'BALANCE_ON_HAND','loansOutstanding':'OUTSTANDING_LOANS_OWED','debtsOutstanding':'OUTSTANDING_DEBT_OWED'}.items()}
    rep['notes'].append('Monthly reports disclose receipts; a blank or zero expenditure field does not establish that no spending occurred that month. Report year is retained; cash balances and outstanding debts are not additive.')
    ohReports[key]=rep
bulkIds={('CON','2025'):'6130',('EXP','2025'):'6131',('CON','2026'):'6768',('EXP','2026'):'6769'}
ohCategories={'31-A  Stmt of Contribution':'contribution','31-E FR Contributions':'contribution','31-J-1 In-Kind Cont Rcvd':'in-kind','31-A-2  Other Income':'other-receipt','31-B  Stmt of Expenditures':'spending','31-F  FR Expenditures':'spending'}
for (kind,year),downloadId in bulkIds.items():
    filename='CAC_'+kind+'_'+year+'.CSV';sid='finance-ohio-'+kind.lower()+'-'+year
    source(sid,ROOT/filename,base+'f?p=CFDISCLOSURE:72:::NO::P72_GETID:'+downloadId,'Ohio Secretary of State','Candidate '+('receipts' if kind=='CON' else 'expenditures')+' — '+year)
    for index,r in enumerate(readcsv(ROOT/filename),start=2):
        rep=ohReports.get(r['REPORT_KEY'])
        if not rep:continue
        form=r['SHORT_DESCRIPTION'];category=ohCategories[form]
        name=r.get('NON_INDIVIDUAL','').strip() or ' '.join(r.get(k,'').strip() for k in ['FIRST_NAME','MIDDLE_NAME','LAST_NAME','SUFFIX_NAME'])
        dt=date(r.get('FILE_DATE') if kind=='CON' else r.get('EXPEND_DATE'))
        ref=r.get('OTHER_INCOME_TYPE') or r.get('PURPOSE') or r.get('INKIND_DESCRIPTION') or ''
        item=row(rep,dt,category,name,cash(r['AMOUNT']),form,r.get('EMP_OCCUPATION',''),reference=ref,locator=sid+':CSV row '+str(index))
        if r.get('PAC_REG_NO'):item[9]=clean(r['PAC_REG_NO']+' '+ref)

# Report-level loan schedules are absent from Ohio's bulk contribution files.
# OTHER is cross-checked; loan rows are recorded from 31-C once, and balances
# stay separate from new cash, so carried loans never become new donations.
supplements=json.loads((ROOT/'ohio-supplements.json').read_text())
for entry in supplements:
    key,kind=entry['id'].split('-');rep=ohReports[key];path=ROOT/'supplements'/(entry['id']+'.csv')
    sid=source('finance-oh-'+entry['id'].lower(),path,entry['url'],'Ohio Secretary of State',rep['title']+' · '+kind)
    if kind!='31C':continue
    for index,r in enumerate(readcsv(path),start=2):
        name=r['Non Individual'] or r['Name'];amount=cash(r['Amount Incurred']);paid=cash(r['Payment Amount'])
        if amount:row(rep,date(r['Date Incurred']),'loan',name,amount,'31-C',r['Employer/Occupation'],locator=sid+':CSV row '+str(index))
        if paid:row(rep,date(r['Payment Date']),'loan-repayment',name,paid,'31-C',r['Employer/Occupation'],locator=sid+':CSV row '+str(index))
        row(rep,date(r['Date Incurred']),'loan-balance',name,cash(r['Outstanding Balance']),'31-C',locator=sid+':CSV row '+str(index))
for rep in ohReports.values():
    totals=collections.Counter()
    for r in rep['_rows']:totals[r[2]]+=r[4]
    rep['metrics']['loans']=totals['loan'] if totals['loan'] or rep['metrics']['otherReceipts'] is not None else None
    rep['metrics']['loanRepayments']=totals['loan-repayment'] if totals['loan-repayment'] or rep['metrics']['disbursements'] is not None else None
    expected={'contributions':totals['contribution'],'otherReceipts':totals['other-receipt']+totals['loan'],'disbursements':totals['spending']+totals['loan-repayment'],'inKind':totals['in-kind']}
    rep['reconciliation']={k:{'reportedCents':rep['metrics'][k],'itemizedCents':v,'differenceCents':None if rep['metrics'][k] is None else rep['metrics'][k]-v} for k,v in expected.items()}
    assert all(x['differenceCents'] in [None,0] for x in rep['reconciliation'].values()),'Ohio report does not reconcile '+rep['id']
    rep['coverage']='Exported rows reconcile to reported categories' if all(rep['metrics'][k] is not None for k in expected) else 'Blank summary categories retained'

# Federal financial reports, including authorized nominee committees. Only the
# latest non-superseded report in each amendment chain is included.
candidateMap={'S6OH00163':'sherrod-brown','S6OH00304':'husted','S6OH00429':'william-redpath','S6OH00395':'greg-levy','S8OH00144':'stephen-faris','S6OH00437':'anthony-holliman','H6OH15138':'brennan-barrington','H2OH03125':'beatty','H2OH15228':'carey','H0OH03137':'cleophus-dulaney','H6OH15112':'don-leonard','H6OH01088':'samuel-ronan'}
committees=json.loads((ROOT/'fec-committees.json').read_text())['results']+json.loads((ROOT/'fec-ronan-committees.json').read_text())['results']
for r in committees:
    if r['designation'] not in ['A','P']:continue
    newunit(r['committee_id'],r['name'],[candidateMap[x] for x in r['candidate_ids'] if x in candidateMap],'Federal filings')
    units[r['committee_id']]['designation']=r['designation']
fecReports=json.loads((ROOT/'fec-selected-reports.json').read_text())
receiptFields={'contributions':'total_contributions_period','transfers':'transfers_from_other_authorized_committee_period','loans':'total_loans_received_period','offsets':'offsets_to_operating_expenditures_period','otherReceipts':'other_receipts_period','receipts':'total_receipts_period','disbursements':'total_disbursements_period','refunds':'total_contribution_refunds_period','beginningCash':'cash_on_hand_beginning_period','endingCash':'cash_on_hand_end_period','unitemizedIndividuals':'individual_unitemized_contributions_period','debtsAndLoansOutstanding':'debts_owed_by_committee'}
for r in fecReports:
    file=str(r['file_number']);path=ROOT/'fec'/(file+'.csv');sid=source('finance-fec-'+file,path,r['csv_url'],'Federal Election Commission',r['committee_name']+' · '+r['document_description'])
    rep=newreport('fec-'+file,r['committee_id'],r['document_description'],sid,r['coverage_start_date'][:10],r['coverage_end_date'][:10],r['receipt_date'])
    rep['reportKey']=file;rep['year']=r['report_year'];rep['amendmentChain']=[str(x) for x in r['amendment_chain']];rep['metrics']={k:cents(r.get(v)) for k,v in receiptFields.items()};rep['notes'].append('Memo rows explain transactions and are excluded from cash totals. Prior versions in the amendment chain are excluded. Itemized payee and donor names are reported identities, not independently resolved people.')
    with path.open(encoding='utf-8-sig',newline='') as f:
        reader=csv.reader(f);header=next(reader);assert header[0]=='HDR' and header[2] in ['8.4','8.5']
        for index,x in enumerate(reader,start=2):
            if not x:continue
            code=x[0]
            if code in ['F3N','F3A','F3T']:
                assert x[1]==r['committee_id'],'Filer identity differs from report metadata'
                for field,position in [('contributions',38),('receipts',45),('disbursements',56),('beginningCash',57),('endingCash',61),('unitemizedIndividuals',33)]:
                    assert cash(x[position])==(rep['metrics'][field] or 0),'Original F3 cover differs from API summary: '+rep['id']+' '+field
            if code=='SC/10':
                name=x[5].strip() or ' '.join(x[i].strip() for i in [7,8,6,10]);row(rep,date(x[21]),'loan-balance',name,cash(x[20]),code,reference='Outstanding loan balance; original principal and prior repayments are not new cash',locator='CSV row '+str(index)+' · transaction '+x[2],memo=x[36]=='X',identity=x[2]);continue
            if code=='SD10':
                name=x[4].strip() or ' '.join(x[i].strip() for i in [6,7,5,9]);row(rep,None,'debt-balance',name,cash(x[19]),code,reference=x[15],locator='CSV row '+str(index)+' · transaction '+x[2],identity=x[2]);continue
            if not code.startswith(('SA','SB')):continue
            receipt=code.startswith('SA');memo=x[42 if receipt else 41]=='X'
            category=('contribution' if code.startswith('SA11') else 'transfer-in' if code=='SA12' else 'loan' if code in ['SA13A','SA13B'] else 'offset' if code=='SA14' else 'other-receipt') if receipt else ('refund' if code.startswith('SB20') else 'loan-repayment' if code.startswith('SB19') else 'transfer-out' if code=='SB18' else 'spending')
            name=x[6].strip() or ' '.join(x[i].strip() for i in [8,9,7,11]);identity=x[2]
            row(rep,date(x[19]),category,name,cash(x[20]),code,x[23] if receipt else '',x[24] if receipt else '',reference=x[22],election=x[17],locator='CSV row '+str(index)+' · transaction '+identity,memo=memo,identity=identity)
    sums=collections.Counter()
    for x in rep['_rows']:
        if not x[5]:sums[x[2]]+=x[4]
    receipts=sum(sums[k] for k in ['contribution','transfer-in','loan','offset','other-receipt']);out=sum(sums[k] for k in ['refund','loan-repayment','transfer-out','spending'])
    rep['reconciliation']={k:{'reportedCents':rep['metrics'][k],'itemizedCents':value,'differenceCents':rep['metrics'][k]-value} for k,value in [('receipts',receipts),('disbursements',out)]}
    assert all(v['differenceCents']>=0 for v in rep['reconciliation'].values()),'Itemized rows exceed federal report totals'
    assert rep['reconciliation']['receipts']['differenceCents']>=(rep['metrics']['unitemizedIndividuals'] or 0),'Unitemized receipts were counted as named rows'
    rep['coverage']='All itemized cash schedules; summary remainder shown separately'
    rep['notes'].append('The difference between summary totals and itemized schedules is shown without named attribution. It includes the report’s unitemized individual contributions and other amounts without rows in these schedules; it is not assigned to donors.')

# Franklin County reports are scanned originals. The privacy-reduced
# transcription is kept as reviewable source data; originals remain excluded.
county=json.loads(pathlib.Path('content/campaigns/county-ledgers-2026.json').read_text(encoding='utf-8'))
for candidate,name in [('michael-stinziano','Citizens for Stinziano'),('crawley','Friends of Erica Crawley')]:newunit('franklin-'+candidate,name,[candidate],'Franklin County filings')
for index,entry in enumerate(county):
    sid='finance-franklin-'+entry['candidate']+'-'+entry['title'].lower().replace(' ','-')
    sources[sid]={'id':sid,'url':entry['url'],'publisher':'Franklin County Board of Elections','title':entry['title']+' · '+entry['candidate'],'sha256':entry['sourceSha256'],'checkedAt':ASOF,'method':'Scanned original, text recognition and page-image checks; cash rows reconcile to the cover.'}
    rep=newreport('franklin-'+entry['candidate']+'-'+entry['title'].lower().replace(' ','-'),'franklin-'+entry['candidate'],entry['title'],sid,filed=entry['filedAt'])
    rep['year']=int(entry['title'][:4]);rep['metrics']=entry['metrics'];rep['reportKey']=rep['id'];rep['notes']=[entry['note'],'Accounting carry-over subtotals between forms are not additional transactions. Dates are retained as filed, including rows dated after the nominal reporting period. Blank summary fields remain blank.']
    if entry.get('amended'):rep['notes'].append('July 9 amendment replaces the original June 12 report; the original is not added to totals.')
    if index==4:rep['notes'].append('The second printed 31-F subtotal differs from its individual rows. The individual cash rows reconcile to the cover; the inconsistent printed subtotal is not counted as another expense.')
    sums=collections.Counter()
    for ordinal,item in enumerate(entry['rows'],1):
        form=item['form'];category='contribution' if form in ['31A','31E'] else 'spending' if form in ['31B','31F'] else 'in-kind' if form=='31J1' else 'other-receipt'
        row(rep,date(item['date']),category,item['name'],item['amountCents'],form,reference=item.get('reference',''),locator='PDF page '+str(item['page'])+' · transcribed cash row '+str(ordinal),identity='p'+str(item['page'])+'-r'+str(ordinal));sums[category]+=item['amountCents']
    rep['reconciliation']={key:{'reportedCents':rep['metrics'][key],'itemizedCents':sums[category],'differenceCents':None if rep['metrics'][key] is None else rep['metrics'][key]-sums[category]} for key,category in [('contributions','contribution'),('otherReceipts','other-receipt'),('disbursements','spending'),('inKind','in-kind')]}
    assert all(v['differenceCents'] in [None,0] for v in rep['reconciliation'].values()),'County report does not reconcile'
    rep['coverage']='All transcribed cash rows reconcile to the scanned cover'

def finish_report(rep):
    rows=rep.pop('_rows');rep.pop('_ids');rep['rowCount']=len(rows);rep['memoRows']=sum(x[5] for x in rows)
    payload={'schemaVersion':1,'reportId':rep['id'],'sourceId':rep['sourceId'],'columns':COLUMNS,'rows':rows}
    data=json.dumps(payload,ensure_ascii=False,separators=(',',':')).encode('utf-8')
    name=rep['id']+'.json.gz';encoded=gzip.compress(data,mtime=0);(OUT/name).write_bytes(encoded)
    rep['path']=name;rep['sha256']=hashlib.sha256(encoded).hexdigest();rep['bytes']=len(encoded)
    rep['datesInRows']={'start':min((x[1] for x in rows if x[1]),default=None),'end':max((x[1] for x in rows if x[1]),default=None)}
nameGroups=collections.defaultdict(dict)
for rep in reports:
    groups=nameGroups[rep['unitId']]
    for item in rep['_rows']:
        if item[5] or item[2] in ['loan-balance','debt-balance']:continue
        key=(item[3],item[2],rep['id'])
        group=groups.setdefault(key,[item[3],item[2],rep['id'],0,0])
        group[3]+=item[4];group[4]+=1
    finish_report(rep)
for unitId,groups in nameGroups.items():
    payload={'columns':['name','category','reportId','amountCents','transactionCount'],'rows':list(groups.values())}
    encoded=gzip.compress(json.dumps(payload,ensure_ascii=False,separators=(',',':')).encode('utf-8'),mtime=0)
    name='names-'+unitId+'.json.gz';(OUT/name).write_bytes(encoded)
    units[unitId]['nameGroups']={'path':name,'sha256':hashlib.sha256(encoded).hexdigest(),'bytes':len(encoded),'rows':len(groups),'basis':'Groups of identical reported names; not resolved individual identities. Memo and balance rows excluded.'}
roster=json.loads((ROOT/'roster.json').read_text(encoding='utf-8'))
coverage=[{'candidateId':r['id'],'unitIds':[u['id'] for u in units.values() if r['id'] in u['candidateIds']],'status':'Filings indexed' if any(r['id'] in u['candidateIds'] and u['reportIds'] for u in units.values()) else 'Committee identified; no financial report in retrieved listing' if any(r['id'] in u['candidateIds'] for u in units.values()) else 'No matching current financial report in the checked federal, state or county listings; unresolved coverage, not zero fundraising'} for r in roster]
disclosureIndex=json.loads(pathlib.Path('content/campaigns/federal-disclosure-index-2026.json').read_text(encoding='utf-8'))
catalog={'schemaVersion':1,'asOf':ASOF,'activityStart':'2025-01-01','electionCycle':2026,'columns':COLUMNS,'units':list(units.values()),'reports':reports,'sources':list(sources.values()),'candidateCoverage':coverage,'supplementaryDisclosures':disclosureIndex['supplementary'],'filingInventoryBasis':disclosureIndex['basis'],'scope':'Available 2025–2026 candidate committee filings for the covered 2026 races. Committee ledgers are separate from outside spending and the curated graph. Shared tickets use one ledger. Reporting dates, blank fields and filing gaps remain visible.','complete':False,'gaps':['Six listed candidates do not yet have matched financial reports. Two identified federal committees have no financial report in the retrieved listing. Missing filings, blank summaries and money not itemized in a source are not treated as zero.','Outside-group support, independent expenditures and joint fundraising committees are separate from candidate receipts. Their selected records remain on the map; this is not an exhaustive outside-spending ledger.']}
dump(OUT/'index.json',catalog)
pathlib.Path('dist/campaign-finance-index.js').write_bytes(('// Generated by scripts/build-campaign-ledgers.py. Transaction files load on demand.\nexport const campaignFinanceIndex='+json.dumps(catalog,ensure_ascii=False,separators=(',',':'))+';\n').encode('utf-8'))
print(json.dumps({'units':len(units),'reports':len(reports),'rows':sum(x['rowCount'] for x in reports),'compressedBytes':sum(x['bytes'] for x in reports),'sources':len(sources)}))
