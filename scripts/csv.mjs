// RFC 4180, UTF-8. Nested values are JSON; risky spreadsheet-leading text is escaped.
export function toCSV(records){
  const headers=[...new Set(records.flatMap(Object.keys))].sort();
  const cell=value=>{let text=value===null||value===undefined?'':typeof value==='object'?JSON.stringify(value):String(value);if(typeof value==='string'&&/^[=+@-]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"';};
  return [headers.map(cell).join(','),...records.map(r=>headers.map(h=>cell(r[h])).join(','))].join('\r\n')+'\r\n';
}
export function parseCSV(text){
  const rows=[];let row=[],value='',quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(value);value='';}else if(c==='\n'&&!quoted){row.push(value.replace(/\r$/,''));rows.push(row);row=[];value='';}else value+=c;}
  if(quoted)throw Error('Unterminated CSV field');if(row.length||value){row.push(value);rows.push(row);}
  const [headers,...records]=rows;
  return records.filter(r=>r.length>1||r[0]!=='').map(r=>{if(r.length!==headers.length)throw Error('CSV column mismatch');return Object.fromEntries(headers.map((h,i)=>[h,r[i]]));});
}
