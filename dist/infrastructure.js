// Infrastructure and surveillance intake. Unpinned claims stay out of the graph.
export const infrastructureSources = [
  {id:'flock-contract-2024',title:'3181-2024: Flock camera lease and bid waiver',publisher:'City of Columbus',url:'https://columbus.legistar.com/LegislationDetail.aspx?From=RSS&FullText=1&GUID=76B3DB80-9EF4-4657-A21F-24773FB0E5DD&ID=7043675',date:'2024-12-11',note:'38 fixed readers; two-year $228,000 authorization; compatibility with 32 existing cameras cited for bidding waiver.'},
  {id:'forcemetrics-trial-2025',title:'1510-2025: ForceMetrics trial added to Flock agreement',publisher:'City of Columbus',url:'https://columbus.legistar.com/LegislationDetail.aspx?FullText=1&GUID=32C056FC-D5FD-4C8D-B6BF-E903E6B5A7F6&ID=7444898',date:'2025-06-27',note:'Free one-year trial for up to 500 users. Later prices are options, not approved expenditures.'},
  {id:'vigilant-contract-2026',title:'1499-2026: Motorola / Vigilant subscriptions and bid waiver',publisher:'City of Columbus',url:'https://columbus.legistar.com/LegislationDetail.aspx?FullText=1&G=4F637594-17B0-4E92-8196-37F14328D337&GUID=A8F3E788-159E-4DE6-91FF-E78CA8517CE0&ID=8042678&Options=&Search=',date:'2026-06-04',note:'$103,990 authorization for Investigative Data Platform subscriptions; unbudgeted General Fund expense and interoperability rationale.'},
  {id:'flock-financing-2025',title:'Flock announces $275m financing and its backers',publisher:'Flock Safety',url:'https://www.flocksafety.com/blog/flock-safety-secures-major-funding',date:'2025-03-13',kind:'Company announcement',note:'Round led by Andreessen Horowitz; $7.5bn company valuation. Investor allocations and ownership shares are not given.'},
  {id:'google-incentive-2018',title:'New Albany R-50-2018: Montauk / Google incentive agreements',publisher:'City of New Albany',url:'https://newalbanyohio.org/wp-content/uploads/2016/04/Council-Minutes-12-10-18-Regular-Meeting.pdf',date:'2018-12-10',note:'Google subsidiary; 100% / 15-year real-property abatement, fee waiver, minimum city revenue and infrastructure agreements.'},
  {id:'new-albany-budget-2024',title:'New Albany 2024 budget: data-center investments',publisher:'City of New Albany',url:'https://newalbanyohio.org/wp-content/uploads/2024/09/2024-Adopted-Annual-Budget_New-Albany-Ohio.pdf',date:'2024',note:'2023 announced projects: AWS $3.5bn, QTS $3.6bn and Edged $246m. Announced project costs are not municipal payments.'},
  {id:'aep-data-tariff',title:'Ohio Power data-center tariff requirements',publisher:'AEP Ohio / Ohio Power Company',url:'https://www.aepohio.com/company/about/rates/data-center-tariff/',date:null,note:'Adopted July 9, effective July 23, 2025; demand obligations, ramp period, term and study fees.'},
  {id:'aep-ohio-plan-2024',title:'AEP Ohio tariff filing and corporate relationship',publisher:'AEP Ohio',url:'https://www.aepohio.com/company/news/view?releaseID=9539',date:'2024-05-13',kind:'Company announcement',note:'AEP Ohio identifies itself as an AEP unit and Marc Reitter as president / COO. Its original 90% proposal is not the adopted tariff.'}
];

export const infrastructureChecks = {
  'flock-contract-2024':['3181-2024','passed','38 fixed','32 flock','228,000','two years','competitive bidding','office of criminal justice services'],
  'forcemetrics-trial-2025':['1510-2025','passed','forcemetrics','500 users','non-renewable','209,999','220,499','ownership of all data'],
  'vigilant-contract-2026':['1499-2026','passed','motorola','vigilant','103,990','not originally budgeted','share important information','competitive bidding'],
  'flock-financing-2025':['march 13, 2025','275 million','7.5 billion','andreessen horowitz','greenoaks','founders fund','garrett langley','ceo and founder'],
  'google-incentive-2018':['r-50-2018','montauk innovations','subsidiary of google','100%','15 years','250,000','750,000','six yes votes'],
  'new-albany-budget-2024':['qts','3.6 billion','amazon web services','3.5 billion','edged','246 million'],
  'aep-data-tariff':['july 9, 2025','july 23, 2025','85%','plus eight years','load study','100,000'],
  'aep-ohio-plan-2024':['may 13, 2024','unit of american electric power','marc reitter','president and chief operating officer']
};

export const municipalInfrastructureChecks=['louis capobianco','flock safety','verizon communications','stanley e. gates ii','google llc','jon lee','data centers','commercial rates','2027','cp hardin'];
const n=(id,name,category,role,sourceIds,description='')=>({id,name,category,role,sourceIds,description,x:3000,y:2000,historical:false});
const municipal=['city-lobbyists-2025'];
export const infrastructureNodes = [
  n('flock','Flock Safety','corporation','Registered municipal lobbying client',municipal),
  n('capobianco','Louis Capobianco','person','Registered Columbus legislative agent',municipal),
  n('google','Google LLC','corporation','Registered municipal lobbying client',municipal),
  n('stanley-gates','Stanley E. Gates II','person','Registered Columbus legislative agent',municipal),
  n('verizon','Verizon Communications','corporation','Registered municipal lobbying client',municipal),
  n('city-water-power','Columbus Water and Power','institution','City utility department in 2025 hearing',municipal),
  {...n('jon-lee','Jon Lee','person','Deputy director in 2025 utility hearing',municipal),historical:true},
  n('large-water-users','Large commercial water users','institution','Customer category discussed at utility hearing',municipal,'Grouped customer category, including data centers and breweries; no individual company account is identified.'),
  {...n('water-rate-review','2026–27 water rate proposal','initiative','2025 hearing / proposed commercial-rate changes',municipal),historical:true},
  n('columbus-police','Columbus Division of Police','institution','Municipal police agency',['flock-contract-2024']),
  n('ocjs','Ohio Office of Criminal Justice Services','institution','Grantor identified for LPR project',['flock-contract-2024']),
  n('forcemetrics','ForceMetrics','corporation','Informed Responder software provider',['forcemetrics-trial-2025']),
  n('motorola-vigilant','Motorola Solutions / Vigilant','corporation','Named ALPR subscription contractor',['vigilant-contract-2026']),
  n('garrett-langley','Garrett Langley','person','Flock founder / CEO in financing announcement',['flock-financing-2025']),
  {...n('flock-round-2025','Flock March 2025 financing','initiative','$275m company financing round',['flock-financing-2025']),historical:true},
  ...[['a16z','Andreessen Horowitz'],['greenoaks','Greenoaks Capital'],['bedrock','Bedrock Capital'],['meritech','Meritech Capital'],['matrix','Matrix Partners'],['sands','Sands Capital'],['founders-fund','Founders Fund'],['kleiner','Kleiner Perkins'],['tiger-global','Tiger Global'],['y-combinator','Y Combinator']].map(([id,name])=>n(id,name,'corporation','Named Flock financing participant',['flock-financing-2025'])),
  n('new-albany-city','City of New Albany','institution','Municipal incentive-agreement party',['google-incentive-2018']),
  n('montauk','Montauk Innovations LLC','corporation','Google subsidiary named in 2018 minutes',['google-incentive-2018']),
  n('aws','Amazon Web Services','corporation','Data-center investor named in city budget',['new-albany-budget-2024']),
  n('qts','QTS','corporation','Data-center developer named in city budget',['new-albany-budget-2024']),
  n('edged','Edged','corporation','Data-center developer named in city budget',['new-albany-budget-2024']),
  ...[['aws-na-project','AWS New Albany expansion'],['qts-na-project','QTS New Albany phases'],['edged-na-project','Edged New Albany data center']].map(([id,name])=>n(id,name,'initiative','Announced investment reported in 2024 budget',['new-albany-budget-2024'])),
  n('aep-ohio','AEP Ohio / Ohio Power','corporation','AEP utility unit',['aep-ohio-plan-2024','aep-data-tariff']),
  {...n('marc-reitter','Marc Reitter','person','AEP Ohio president / COO in May 2024',['aep-ohio-plan-2024']),historical:true},
  n('puco','Public Utilities Commission of Ohio','institution','Electric-utility regulator',['aep-data-tariff']),
  n('dct','Ohio Power data-center tariff','initiative','Schedule DCT / large-load service requirements',['aep-data-tariff']),
  n('dct-customers','Qualifying new data-center loads','institution','Customer category under Schedule DCT',['aep-data-tariff'],'Grouped tariff category; does not identify contracts or bills for specific operators.')
];
infrastructureNodes.find(n=>n.id==='google').aliases=['Google'];
infrastructureNodes.find(n=>n.id==='stanley-gates').aliases=['Stanley Gates'];
infrastructureNodes.find(n=>n.id==='aws').aliases=['AWS'];
infrastructureNodes.find(n=>n.id==='flock-round-2025').valuation=7500000000;
const e=(id,source,target,type,label,evidence,sourceIds,period,details={})=>({id,source,target,type,label,evidence,sourceIds,period,caseId:'datacenters',historical:true,status:'documented',directional:true,...details});
const registered={status:'registered',locator:'November 15, 2025 bulletin, PN0349-2025 attachment'};
export const infrastructureEdges = [
  e('e171','flock','capobianco','lobbying','Registered city lobbyist','City client roster lists Flock Safety.',municipal,'City roster November 15, 2025',{...registered,caseId:'alpr',locator:'Bulletin PDF p. 58'}),
  e('e172','google','stanley-gates','lobbying','Registered city lobbyist','City roster lists Google LLC.',municipal,'City roster November 15, 2025',{...registered,locator:'Bulletin PDF p. 61'}),
  e('e173','verizon','capobianco','lobbying','Registered city lobbyist','City client roster lists Verizon Communications.',municipal,'City roster November 15, 2025',{...registered,caseId:'alpr',locator:'Bulletin PDF p. 58'}),
  e('e174','large-water-users','water-rate-review','influence','Customer category in rate proposal','Hearing includes data centers and breweries as large users.',municipal,'2025 hearing printed November 15',{directional:false,locator:'Bulletin PDF pp. 52–53',context:'No named operator’s water use or allocation of infrastructure cost is established.'}),
  e('e175','city','city-water-power','leadership','Municipal utility department','Bulletin records the City utility presentation.',municipal,'2025 utility hearing',{locator:'Bulletin PDF pp. 51–53'}),
  e('e176','jon-lee','city-water-power','leadership','Deputy director in hearing','Hearing identifies Lee as deputy director.',municipal,'2025 utility hearing',{locator:'Bulletin PDF p. 52'}),
  e('e177','city-water-power','water-rate-review','influence','Commercial-rate changes proposed for 2027','Lee describes targeting high users and a 2027 implementation plan.',municipal,'2025 proposal',{status:'commitment',requiresFurtherAuthorization:true,locator:'Bulletin PDF pp. 52–53',context:'Hearing proposal; enactment and implemented rates are not established.'}),
  e('e178','hardin','water-rate-review','influence','Questioned delay for high-user rates','Hardin asks why commercial rates cannot be updated sooner.',municipal,'2025 utility hearing',{locator:'Bulletin PDF p. 53'}),
  e('e179','city','flock','contract','$228,000 camera lease; bidding waived','Council authorized 38 fixed readers for a two-year term.',['flock-contract-2024'],'Approved December 9, 2024',{caseId:'alpr',status:'authorized',amount:228000,amountIsUpperBound:true,amountLabel:'Up to $228k',unit:'USD two-year contract authorization ceiling',readerCount:38,existingReaderCount:32,termYears:2,locator:'3181-2024, Background and §§1–5',context:'City cited compatibility with 32 existing Flock cameras. Term starts when the purchase order is certified; actual spending is not shown.'}),
  e('e180','columbus-police','flock','contract','Authorized ALPR lessee','Ordinance names the Police Division as user.',['flock-contract-2024'],'December 2024 authorization',{caseId:'alpr',status:'authorized',amountIncludedIn:'e179'}),
  e('e181','ocjs','city','money','LPR grant source','City identifies OCJS as grantor.',['flock-contract-2024'],'FY24 Columbus LPR Project',{caseId:'alpr',context:'Grant total not stated. The $228,000 contract ceiling is not a separate grant payment.'}),
  e('e182','city','forcemetrics','contract','Authorized free one-year trial','Council authorized adding ForceMetrics to its Flock agreement.',['forcemetrics-trial-2025'],'Approved June 23, 2025',{caseId:'alpr',status:'authorized',trialMonths:12,userLimit:500,optionalYearTwoPrice:209999,optionalYearThreePrice:220499,locator:'1510-2025',context:'Non-renewable trial; later price options are not awards. City retains its source data; third-party sharing requires permission.'}),
  e('e183','flock','forcemetrics','partnership','Software added through City amendment','City amended its Flock agreement to include this trial.',['forcemetrics-trial-2025'],'June 2025 amendment',{caseId:'alpr',status:'authorized',directional:false,context:'Contract linkage, not a corporate ownership claim.'}),
  e('e184','city','motorola-vigilant','contract','$103,990 subscriptions; bidding waived','Council authorized Investigative Data Platform licenses.',['vigilant-contract-2026'],'Approved June 1, 2026',{caseId:'alpr',status:'authorized',amount:103990,amountIsUpperBound:true,amountLabel:'Up to $103.99k',unit:'USD subscription authorization ceiling',locator:'1499-2026, Background and §§1–3',context:'Unbudgeted General Fund expense. City cited existing software and cross-agency compatibility. Payments and data-sharing recipients are not supplied.'}),
  e('e185','garrett-langley','flock','leadership','Founder / CEO in announcement','Flock identifies Langley in these roles.',['flock-financing-2025'],'March 13, 2025',{caseId:'alpr',status:'acknowledged'}),
  e('e186','flock-round-2025','flock','money','$275m announced financing','Company announces total round funding.',['flock-financing-2025'],'Announced March 13, 2025',{caseId:'alpr',status:'acknowledged',amount:275000000,amountLabel:'$275m round',unit:'USD total announced company financing',valuation:7500000000,context:'Company-wide financing, not money paid by Columbus. Valuation is separate from funds raised.'}),
  ...['a16z','greenoaks','bedrock','meritech','matrix','sands','founders-fund','kleiner','tiger-global','y-combinator'].map((id,i)=>e('e'+(187+i),id,'flock-round-2025','money',i===0?'Led financing round':'Participated in financing round','Company names this round participant.',['flock-financing-2025'],'Announced March 13, 2025',{caseId:'alpr',status:'acknowledged',context:'Individual investment amount and ownership share not supplied; do not repeat the entire round amount for each investor.'})),
  e('e197','google','montauk','control','Parent / subsidiary in city minutes','Minutes identify Montauk as a Google subsidiary.',['google-incentive-2018'],'December 10, 2018 minutes'),
  e('e198','new-albany-city','montauk','influence','100% / 15-year property abatement authorized','Council approved R-50-2018.',['google-incentive-2018'],'Approved December 10, 2018',{status:'authorized',ratePercent:100,termYears:15,context:'Agreement authorization; realized tax savings and present compliance are not established.'}),
  e('e199','new-albany-city','montauk','influence','Up to $250,000 permit-fee waiver','Minutes describe the building / permitting fee waiver.',['google-incentive-2018'],'December 2018 approval',{status:'authorized',amount:250000,amountIsUpperBound:true,amountLabel:'Up to $250k waived',unit:'USD authorized fee-waiver ceiling'}),
  e('e200','montauk','new-albany-city','money','$750,000 minimum annual city revenue required','Minutes describe the negotiated city revenue requirement.',['google-incentive-2018'],'Starting 2021 under 2018 agreement',{status:'authorized',amount:750000,amountLabel:'$750k annual minimum',unit:'USD minimum annual city-revenue requirement',context:'Agreement requirement across revenue sources; actual annual collections are not established.'}),
  e('e201','new-albany-city','montauk','contract','Infrastructure delivery agreement authorized','Minutes describe the development and supply agreement.',['google-incentive-2018'],'December 2018 approval',{status:'authorized',context:'Infrastructure timetable; expenditures and executed agreement not supplied.'}),
  ...[['aws','aws-na-project',3500000000,'$3.5bn'],['qts','qts-na-project',3600000000,'$3.6bn'],['edged','edged-na-project',246000000,'$246m']].map(([source,target,amount,amountLabel],i)=>e('e'+(202+i),source,target,'money','Announced data-center project investment','City budget reports the announced project.',['new-albany-budget-2024'],'2023 announcement reported in 2024 budget',{status:'commitment',amount,amountLabel,unit:'USD announced private project investment',context:'Announced project cost, not municipal funding or verified spending.'})),
  ...['aws-na-project','qts-na-project','edged-na-project'].map((id,i)=>e('e'+(205+i),id,'new-albany-city','partnership','Project location in city budget','Budget names these New Albany projects.',['new-albany-budget-2024'],'2024 budget',{directional:false,status:'acknowledged'})),
  e('e208','aep','aep-ohio','control','Utility unit','AEP Ohio identifies itself as an AEP unit.',['aep-ohio-plan-2024'],'Company statement May 13, 2024',{status:'acknowledged'}),
  e('e209','marc-reitter','aep-ohio','leadership','President / COO in 2024 statement','Company identifies Reitter in these roles.',['aep-ohio-plan-2024'],'May 13, 2024',{status:'acknowledged'}),
  e('e210','puco','dct','influence','Adopted data-center tariff settlement','Utility states the adoption and effective dates.',['aep-data-tariff'],'Adopted July 9; effective July 23, 2025',{status:'acknowledged',context:'Utility explanation of approved tariff; not an individually inspected customer contract.'}),
  e('e211','aep-ohio','dct','control','Filed / administers Schedule DCT','Ohio Power describes its tariff and service process.',['aep-data-tariff'],'Effective July 23, 2025',{status:'acknowledged'}),
  e('e212','dct','dct-customers','influence','Minimum demand / long-term obligations','Tariff explanation sets minimum demand and contract terms.',['aep-data-tariff'],'Requirements in dated source',{status:'acknowledged',context:'Initial term is ramp period (up to four years) plus eight years. Minimum-demand formulas are capped at 85% of total contract capacity. This does not establish any named company’s bill.'}),
  e('e213','capobianco','council','lobbying','Municipal legislative-agent registration','City publishes Capobianco as an active registered agent.',municipal,'City roster November 15, 2025',{...registered,caseId:'alpr',locator:'Bulletin PDF p. 58',context:'Registration record; no particular meeting, official contact or policy outcome is established.'}),
  e('e214','stanley-gates','council','lobbying','Municipal legislative-agent registration','City publishes Gates as an active registered agent.',municipal,'City roster November 15, 2025',{...registered,locator:'Bulletin PDF p. 61',context:'Registration record; no particular meeting, official contact or policy outcome is established.'})
];

export function infrastructureRelease(verifiedSourceIds,baseNodeIds) {
  const nodes=infrastructureNodes.map(n=>n.id==='new-albany-city'&&!verifiedSourceIds.has('google-incentive-2018')&&verifiedSourceIds.has('new-albany-budget-2024')?{...n,role:'Municipal government / city budget publisher',sourceIds:['new-albany-budget-2024']}:{...n}).filter(n=>n.sourceIds.every(id=>verifiedSourceIds.has(id)));
  const ids=new Set([...baseNodeIds,...nodes.map(n=>n.id)]);
  const edges=infrastructureEdges.filter(e=>e.sourceIds.every(id=>verifiedSourceIds.has(id))&&ids.has(e.source)&&ids.has(e.target));
  if(verifiedSourceIds.has('flock-contract-2024')&&nodes.some(n=>n.id==='flock'))Object.assign(nodes.find(n=>n.id==='flock'),{role:'ALPR vendor / registered municipal lobbying client',aliases:['Flock Group, Inc.','Flock Group Inc'],sourceIds:['city-lobbyists-2025','flock-contract-2024']});
  if(verifiedSourceIds.has('google-incentive-2018')&&nodes.some(n=>n.id==='google'))Object.assign(nodes.find(n=>n.id==='google'),{role:'Montauk parent / registered municipal lobbying client',sourceIds:['city-lobbyists-2025','google-incentive-2018']});
  return {nodes,edges,complete:infrastructureSources.every(s=>verifiedSourceIds.has(s.id))};
}

export const infrastructureCases={
  datacenters:{label:'Data centers',title:'Data centers / lobbying / utility costs',summary:'Lobbyists, incentive agreements and utility funding requirements.',outcomes:['Google LLC lists Stanley Gates II as a city lobbyist.','The 2025 utility hearing discusses commercial-rate changes for large users in 2027.'],contextEdgeIds:['e01','e02','e03'],positions:{}},
  alpr:{label:'ALPR',title:'ALPR vendors / lobbying / finance',summary:'Camera contracts, software amendments, bid waivers and investors.',outcomes:['City roster lists Flock Safety and Verizon as clients of Louis Capobianco.'],contextEdgeIds:['e01','e02','e03'],positions:{}}
};
