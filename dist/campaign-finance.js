// These groups describe the text reported in filings, not resolved identities.
export function groupReportedNames(rows,reportIds){
  const groups=new Map();
  for(const [name,category,reportId,amountCents,count] of rows){
    if(!reportIds.has(reportId))continue;
    const key=JSON.stringify([name,category]);
    if(!groups.has(key))groups.set(key,{name,category,amountCents:0,count:0,reportIds:new Set()});
    const group=groups.get(key);group.amountCents+=amountCents;group.count+=count;group.reportIds.add(reportId);
  }
  return [...groups.values()].map(group=>({...group,reportIds:[...group.reportIds]})).sort((a,b)=>Math.abs(b.amountCents)-Math.abs(a.amountCents)||a.name.localeCompare(b.name));
}
export function spreadsheetCell(value){return typeof value==='string'&&/^[=+@\-\t\r]/.test(value)?"'"+value:value;}
export function financeCSV(headers,rows){const quote=value=>'"'+String(value??'').replaceAll('"','""')+'"';return [headers.map(quote).join(','),...rows.map(row=>row.map(value=>quote(spreadsheetCell(value))).join(','))].join('\r\n')+'\r\n';}
