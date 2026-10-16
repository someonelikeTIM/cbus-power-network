"""Prepare ledger metadata from original FEC electronic covers, without API lag.

The reviewed filing inventory records committee, current version, period and
filed date. Original CSV files belong in ignored artifacts/campaign-ledger/fec/.
"""
import csv,datetime,decimal,json,pathlib
ROOT=pathlib.Path('artifacts/campaign-ledger')
inventory=json.loads(pathlib.Path('content/campaigns/federal-disclosure-index-2026.json').read_text(encoding='utf-8'))
fields={'total_contributions_period':38,'transfers_from_other_authorized_committee_period':39,'total_loans_received_period':42,'offsets_to_operating_expenditures_period':43,'other_receipts_period':44,'total_receipts_period':45,'total_disbursements_period':56,'total_contribution_refunds_period':54,'cash_on_hand_beginning_period':57,'cash_on_hand_end_period':61,'individual_unitemized_contributions_period':33,'debts_owed_by_committee':31}
reports=[]
for item in inventory['financialFilings']:
    with (ROOT/'fec'/f"{item['file']}.csv").open(encoding='utf-8-sig',newline='') as file:
        reader=csv.reader(file);header=next(reader);cover=next(reader)
    assert header[0]=='HDR' and header[2] in ['8.4','8.5']
    assert cover[0] in ['F3N','F3A','F3T'] and cover[1]==item['committeeId']
    date=lambda value:datetime.datetime.strptime(value,'%Y%m%d').strftime('%Y-%m-%d')
    assert date(cover[15])==item['start'] and date(cover[16])==item['end']
    record={'file_number':item['file'],'committee_id':item['committeeId'],'committee_name':cover[2],'coverage_start_date':item['start'],'coverage_end_date':item['end'],'receipt_date':item['filedAt'],'csv_url':f"https://docquery.fec.gov/csv/{str(item['file'])[-3:]}/{item['file']}.csv",'report_year':int(item['end'][:4]),'document_description':item['title']+' '+item['end'][:4],'amendment_chain':[str(number) for number in item['amendmentChain']],'is_amended':False,'most_recent':True,'metadataBasis':'Original electronic F3 cover and original filing index'}
    for field,position in fields.items():record[field]=cover[position] or '0'
    number=lambda key:decimal.Decimal(record[key])
    assert number('cash_on_hand_beginning_period')+number('total_receipts_period')-number('total_disbursements_period')==number('cash_on_hand_end_period')
    reports.append(record)
(ROOT/'fec-selected-reports.json').write_bytes((json.dumps(reports,indent=2)+'\n').encode('utf-8'))
print('Read original financial covers:',len(reports))
