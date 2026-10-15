// Event dates are curated separately from source publication and capture dates.
import { relationshipMatches } from './search.js';
export const timelineLanes = {
  campaign: {label:'Campaign money',color:'#ac4933',description:'Contributions and outside political groups'},
  lobbying: {label:'Lobbying',color:'#775882',description:'Registrations and documented activity'},
  contracts: {label:'Contracts & grants',color:'#416d82',description:'Also financing, incentives and borrowing'},
  oversight: {label:'Oversight',color:'#678373',description:'Audits, findings and recovery reviews'},
  media: {label:'Media & information',color:'#9b546e',description:'Acquisitions, programming and governance'}
};
export const moneyKinds = {
  paid:{label:'Payment acknowledged',group:'cash'}, receipt:{label:'Reported receipt',group:'cash'},
  contribution:{label:'Campaign contribution',group:'cash'}, internal:{label:'Internal transfer',group:'cash'},
  borrowed:{label:'Borrowed',group:'cash'}, repaid:{label:'Repaid',group:'cash'},
  authorization:{label:'Authorization ceiling',group:'commitments'}, commitment:{label:'Commitment / plan',group:'commitments'},
  conditional:{label:'Conditional agreement',group:'commitments'}, 'grant-support':{label:'Grant support reported',group:'commitments'},
  financing:{label:'Financing announced',group:'commitments'}, allocation:{label:'Fund allocation',group:'commitments'},
  earmark:{label:'Included earmark',group:'commitments'}, waiver:{label:'Fee waiver authorized',group:'commitments'},
  credit:{label:'Credit limit',group:'credit'}, penalty:{label:'Penalty assessed',group:'other'},
  finding:{label:'Documentation finding',group:'other'}, none:{label:'No transfer amount stated',group:'other'},
  interest:{label:'Disclosed financial interest',group:'other'}, 'income-source':{label:'Income source disclosed',group:'other'},
  'gift-source':{label:'Personal gift source disclosed',group:'other'},
  'recognized-revenue':{label:'Recognized funding revenue',group:'other'},
  'transaction-value':{label:'Asset purchase price disclosed',group:'other'}
};
const day=(value,role='Event date',note='')=>({precision:'day',start:value,end:value,role,note});
const month=(value,role='Event month',note='Day not established')=>({precision:'month',start:value+'-01',end:monthEnd(value),role,note});
const year=(value,role='Event year',note='Month and day not established')=>({precision:'year',start:value+'-01-01',end:value+'-12-31',role,note});
const period=(start,end,label,note='Individual dates within this period are not established')=>({precision:'period',start,end,label,role:'Reporting period',note});
const unknown=(role='Event date',note='Date not established',observedOn=null,observationRole='Record checked')=>({precision:'unknown',start:null,end:null,role,note,observedOn,observationRole});
function monthEnd(value){const [y,m]=value.split('-').map(Number);return new Date(Date.UTC(y,m,0)).toISOString().slice(0,10);}
export function validISO(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;}
export function validateEventDate(date){
  if(date.precision==='unknown')return date.start===null&&date.end===null&&(!date.observedOn||validISO(date.observedOn));
  return ['day','month','year','period'].includes(date.precision)&&validISO(date.start)&&validISO(date.end)&&date.end>=date.start;
}
const fy26=()=>period('2025-07-01','2026-06-30','FY2026','Fiscal-year total; individual transaction dates are not supplied');
const overrides={
  j03:{date:fy26(),moneyKind:'internal'},
  j04:{date:day('2026-06-30','Balance as of','Facility ceiling at year-end; not a transaction on this date'),moneyKind:'credit'},
  j05:{date:fy26(),moneyKind:'borrowed'},j06:{date:fy26(),moneyKind:'repaid'},
  j12:{date:day('2021-09-30','Cited law version effective','Not the original creation date of JobsOhio'),lane:'oversight'},
  j13:{date:day('2013-09-04','Cited law version effective'),lane:'oversight'},
  j14:{date:unknown('Contract execution','Statute requires a contract; execution date not established')},
  j16:{date:day('2026-04-20','Investigation report issued'),lane:'oversight'},
  j17:{date:period('2024-01-01','2026-03-07','2024–26 conduct reviewed','Broad conduct period; individual actions are not dated here'),lane:'oversight'},
  j18:{date:year('2025','Introductions / advocacy period'),lane:'oversight'},
  j19:{date:day('2025-07-10','Meeting date'),lane:'oversight'},
  j20:{date:year('2025','Payment year'),moneyKind:'paid'},
  j23:{date:month('2013-07','Allocation pledged'),moneyKind:'allocation'},
  j29:{date:day('2025-07-09','Executed grant announced','Signature date may precede this announcement; paid amount not established'),moneyKind:'conditional'},
  j39:{date:period('2014-01-01','2015-12-31','2014–15 incentive','Year-level period; award and payment dates not supplied'),moneyKind:'none'},
  j40:{date:day('2026-06-12','Grant support reported','Testimony date, not a payment date'),moneyKind:'grant-support'},
  j41:{date:day('2026-06-12','Grant support reported','Testimony date, not a payment date'),moneyKind:'grant-support'},
  j42:{date:day('2026-06-12','Advisory role described'),lane:'lobbying'},
  j44:{date:day('2026-06-12','Testimony submitted'),lane:'lobbying'},
  j45:{date:day('2026-05-07','Transaction date'),moneyKind:'contribution'},
  j48:{date:day('2026-01-09','Power agreements announced','Power purchases scheduled to begin later; no payment total supplied')},
  j49:{date:day('2026-01-09','Power agreements announced','Energy remains on the shared grid')},
  j50:{date:day('2026-01-09','Supportive statement published'),lane:'contracts'},
  j61:{date:year('2017','Reported receipt year'),lane:'campaign',moneyKind:'receipt'},
  j62:{date:year('2017','Reported funding year'),lane:'campaign',moneyKind:'receipt'},
  j64:{date:year('2018','Reported receipt year'),lane:'campaign',moneyKind:'receipt'},
  e73:{date:day('2011-11-01','Reported contribution date'),lane:'campaign',moneyKind:'receipt'},
  e139:{moneyKind:'receipt'},e140:{moneyKind:'receipt'},e141:{moneyKind:'receipt'},
  e160:{date:day('2025-07-28','Grant authorized'),moneyKind:'authorization'},
  e161:{date:year('2025','Grant allocation year'),moneyKind:'earmark'},
  e162:{date:day('2025-07-28','Contract modification authorized'),moneyKind:'authorization'},
  e177:{date:year('2025','Rate proposal discussed','2027 is a proposed implementation year, not an enacted event date'),moneyKind:'commitment'},
  e184:{date:day('2026-06-01','Subscription spending authorized'),moneyKind:'authorization'},
  e198:{date:day('2018-12-10','Tax benefit authorized'),moneyKind:'authorization'},
  e199:{date:month('2018-12','Fee waiver authorized'),moneyKind:'waiver'},
  e200:{date:year('2021','Revenue requirement starts','Required minimum, not a verified payment'),moneyKind:'commitment'},
  e201:{date:month('2018-12','Infrastructure agreement authorized')},
  e202:{date:year('2023','Project investment announced'),moneyKind:'commitment'},
  e203:{date:year('2023','Project investment announced'),moneyKind:'commitment'},
  e204:{date:year('2023','Project investment announced'),moneyKind:'commitment'},
  e210:{date:day('2025-07-09','Tariff adopted'),lane:'oversight'},
  e211:{date:day('2025-07-23','Tariff effective'),lane:'oversight'},
  p25:{date:month('2026-05','Reported contribution month'),moneyKind:'receipt'},
  p26:{date:month('2026-05','Reported contribution month'),moneyKind:'receipt'},
  p27:{date:month('2026-06','Reported contribution month'),moneyKind:'receipt'},
  p28:{date:month('2026-05','Reported contribution month'),moneyKind:'receipt'},
  p29:{date:unknown('Contribution date','Source says before the 2026 primary; transaction date not established'),moneyKind:'receipt'},
  p30:{date:unknown('Contribution date','Source says early 2025; exact period not established'),moneyKind:'receipt'},
  p31:{date:day('2023-02-16','Gift announced','Gift disbursement schedule not supplied'),moneyKind:'commitment'}
};
const groups=[
  {id:'media-injunction-start',edgeIds:['m23'],primaryEdgeId:'m23',title:'Court issues TEGNA hold-separate injunction',lane:'media',date:day('2026-04-17','Preliminary injunction issued','April 17 issuance; August 6 later clarification is a separate event. Interim order, not final antitrust merits judgment.'),moneyKind:'none',additional:true,suppressAmount:true},
  {id:'jobs-audit-2013',edgeIds:['j09','j10','j11'],primaryEdgeId:'j11',title:'JobsOhio state audit issued',lane:'oversight',date:day('2013-11-15','Audit report issued','Audited activity: July 2011–June 2012'),moneyKind:'finding'},
  {id:'anduril-financing-2024',edgeIds:['j35','j67'],primaryEdgeId:'j67',title:'Anduril Series F financing announced',date:day('2024-08-07','Financing announced'),moneyKind:'financing'},
  {id:'strive-financing-2024',edgeIds:['p15','p16','p17','p18'],primaryEdgeId:'p15',title:'Strive Series B financing announced',date:day('2024-07-23','Financing announced'),moneyKind:'financing'},
  {id:'flock-financing-2025',edgeIds:['e186',...Array.from({length:10},(_,i)=>'e'+(187+i))],primaryEdgeId:'e186',title:'Flock financing round announced',date:day('2025-03-13','Financing announced'),moneyKind:'financing'},
  {id:'flock-city-authorization',edgeIds:['e179','e180'],primaryEdgeId:'e179',title:'Columbus Flock lease authorized',date:day('2024-12-09','Lease spending authorized'),moneyKind:'authorization'},
  {id:'forcemetrics-trial',edgeIds:['e182','e183'],primaryEdgeId:'e182',title:'ForceMetrics free trial authorized',date:day('2025-06-23','Trial authorized'),moneyKind:'authorization'},
  {id:'vistra-meta-agreements',edgeIds:['j48','j49'],primaryEdgeId:'j48',title:'Vistra–Meta power agreements announced',date:day('2026-01-09','Agreements announced','Purchases scheduled to begin later in 2026'),lane:'contracts'},
  {id:'podcast-recovery-review',edgeIds:['j20'],primaryEdgeId:'j20',title:'Podcast clawback review announced',date:month('2026-03','Recovery review announced','Final recovery outcome is not established'),lane:'oversight',moneyKind:'none',suppressAmount:true,additional:true}
];
function laneFor(edge){
  if(edge.status==='audit'||edge.status==='finding'||/penalty/i.test(edge.unit||''))return 'oversight';
  if(edge.type==='lobbying')return 'lobbying';
  if(edge.type==='money'&&/campaign|PAC|contribution/i.test(edge.unit||''))return 'campaign';
  if(edge.type==='money'||edge.type==='contract'||['authorized','commitment'].includes(edge.status))return 'contracts';
  return null;
}
function moneyFor(edge){
  if(edge.flaggedExpenseAmount)return 'finding';
  if(edge.amountIncludedIn)return 'earmark';
  if(/penalty/i.test(edge.unit||''))return 'penalty';
  if(/waiver/i.test(edge.unit||''))return 'waiver';
  if(edge.status==='authorized')return 'authorization';
  if(edge.status==='commitment')return 'commitment';
  if(edge.type==='money'&&edge.amount)return edge.status==='reported'?'receipt':'paid';
  return 'none';
}
function sourceObservation(edge,sourceById){
  const source=edge.sourceIds.map(id=>sourceById.get(id)).find(Boolean);
  if(source?.archiveTimestamp){const v=source.archiveTimestamp.slice(0,8);return unknown('Engagement start','Start date not established',`${v.slice(0,4)}-${v.slice(4,6)}-${v.slice(6,8)}`,'Snapshot captured');}
  return unknown('Engagement start','Start date not established',source?.reviewed||null,'Roster checked');
}
export function buildTimelineEvents(edgeList,sourceList){
  const edgeById=new Map(edgeList.map(e=>[e.id,e])),sourceById=new Map(sourceList.map(s=>[s.id,s]));
  const covered=new Set(groups.filter(g=>!g.additional).flatMap(g=>g.edgeIds)),records=[];
  for(const group of groups){
    const present=group.edgeIds.filter(id=>edgeById.has(id));
    if(present.length)records.push({...group,edgeIds:present});
  }
  for(const edge of edgeList){
    if(covered.has(edge.id))continue;
    const info={...overrides[edge.id],...edge.timeline},lane=info.lane||laneFor(edge);
    if(!lane)continue;
    let date=info.date;
    if(!date&&edge.transactionDate)date=day(edge.transactionDate,'Transaction date');
    if(!date)date=edge.type==='lobbying'?sourceObservation(edge,sourceById):unknown();
    records.push({id:'event-'+edge.id,edgeIds:[edge.id],primaryEdgeId:edge.id,...info,lane,date});
  }
  return records.map(record=>{
    const linked=record.edgeIds.map(id=>edgeById.get(id)),primary=edgeById.get(record.primaryEdgeId)||linked[0];
    const date=record.date||unknown();if(!validateEventDate(date))throw Error(`Invalid event date: ${record.id}`);
    return {...record,title:record.title||primary.label,lane:record.lane||laneFor(primary)||'contracts',date,primaryEdgeId:primary.id,moneyKind:record.moneyKind||moneyFor(primary),
      actorIds:[...new Set(linked.flatMap(e=>[e.source,e.target]))],sourceIds:[...new Set(linked.flatMap(e=>e.sourceIds))],
      amount:record.suppressAmount?null:primary.amount??null,amountLabel:record.suppressAmount?'':primary.amountLabel||'',unit:record.suppressAmount?'':primary.unit||'',
      metric:primary.flaggedExpenseAmount?{value:primary.flaggedExpenseAmount,label:'Sampled costs lacking invoices / receipts'}:null,
      amountIsUpperBound:!!primary.amountIsUpperBound,amountIsLowerBound:!!primary.amountIsLowerBound,amountIncludedIn:primary.amountIncludedIn||null};
  });
}
export function formatEventDate(date){
  const format=value=>new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));
  if(date.precision==='unknown')return 'Date not established';
  if(date.precision==='period')return date.label||`${format(date.start)} – ${format(date.end)}`;
  if(date.precision==='year')return date.start.slice(0,4)+' · year only';
  if(date.precision==='month')return new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(date.start+'T12:00:00Z'))+' · month only';
  return format(date.start);
}
export function timelineYear(event){return event.date.precision==='unknown'?'undated':event.date.end.slice(0,4);}
export function sortTimelineEvents(events){return [...events].sort((a,b)=>{
  if(a.date.precision==='unknown'||b.date.precision==='unknown')return a.date.precision===b.date.precision?a.id.localeCompare(b.id):a.date.precision==='unknown'?1:-1;
  return a.date.end.localeCompare(b.date.end)||a.date.start.localeCompare(b.date.start)||a.id.localeCompare(b.id);
});}
export function filterTimelineEvents(events,graph,{entityId='jobsohio',scope='nearby',moneyGroup='all',includeUndated=true,query=''}={}){
  const nodeIds=new Set(graph.nodes.map(n=>n.id)),edgeIds=new Set(graph.edges.map(e=>e.id));
  let actors=null;
  if(scope!=='case'&&entityId&&nodeIds.has(entityId)){
    actors=new Set([entityId]);
    if(scope==='nearby')for(let i=0;i<2;i++){const next=new Set(actors);for(const e of graph.edges)if(actors.has(e.source)||actors.has(e.target)){next.add(e.source);next.add(e.target);}actors=next;}
  }else if(scope!=='case'&&entityId)return [];
  const names=new Map(graph.nodes.map(n=>[n.id,`${n.name} ${n.role}`]));
  const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),q=normalize(query.trim());
  const result=[];
  for(const event of events){
    const links=event.edgeIds.filter(id=>edgeIds.has(id));if(!links.length)continue;
    const linked=graph.edges.filter(e=>links.includes(e.id));
    if(actors&&!linked.some(e=>actors.has(e.source)||actors.has(e.target)))continue;
    if(!includeUndated&&event.date.precision==='unknown')continue;
    if(moneyGroup!=='all'&&(moneyGroup==='unpriced'?event.amount!==null:moneyKinds[event.moneyKind].group!==moneyGroup))continue;
    const actorIds=[...new Set(linked.flatMap(e=>[e.source,e.target]))];
    if(q&&!normalize([event.id,event.title,formatEventDate(event.date),event.amountLabel,event.amount??'',event.metric?.value??'',moneyKinds[event.moneyKind].label,event.date.role,...actorIds.map(id=>names.get(id)),...linked.map(e=>e.label)].join(' ')).includes(q)&&!linked.some(e=>relationshipMatches(e,query,new Map(graph.nodes.map(n=>[n.id,n])))))continue;
    const primaryEdgeId=links.includes(event.primaryEdgeId)?event.primaryEdgeId:links[0];
    const amountVisible=primaryEdgeId===event.primaryEdgeId;
    result.push({...event,edgeIds:links,primaryEdgeId,actorIds,sourceIds:[...new Set(linked.flatMap(e=>e.sourceIds))],
      amount:amountVisible?event.amount:null,amountLabel:amountVisible?event.amountLabel:'',metric:amountVisible?event.metric:null});
  }
  return sortTimelineEvents(result);
}
