// Sports ownership, campaign transactions, and public capital records.
export const enrichmentSources = [
  {id:'haslam-gifts-2026',title:'July 2026 Haslam-linked contributions to Friends for Ginther',publisher:'WSYX / ABC 6 / Lisa Rantala',url:'https://abc6onyourside.com/news/local/over-32k-in-contributions-to-columbus-mayor-ginther-from-haslam-donors-after-soccer-deal-andrew-ginther-jimmy-haslam-donation-campaign-political-politics',date:'2026-08-03',kind:'Reporting / campaign-finance filings',note:'Three dated contributions totaling $32,615.67; motives are not established by the filing.'},
  {id:'hsg-leadership',title:'Haslam Sports Group founders, leaders and operating portfolio',publisher:'Haslam Sports Group',url:'https://haslamsports.com/about/',date:null,kind:'Company statement',note:'Haslam/Johnson managing partners; Browns ownership and Crew operating rights.'},
  {id:'jw-johnson-profile',title:'James Wood (JW) Johnson III — HSG partner',publisher:'Columbus Crew',url:'https://www.columbuscrew.com/club/staff/jw-johnson',date:null,kind:'Company biography',note:'Full name and managing-partner role used to resolve the reported James Johnson contribution.'},
  {id:'nwsl-ownership',title:'Columbus NWSL franchise award and ownership group',publisher:'Columbus Crew / NWSL',url:'https://www.columbuscrew.com/news/nwsl-awards-expansion-franchise-18th-club-to-columbus',date:'2026-04-21',kind:'Company / league announcement',note:'HSG, Nationwide, Christine and Pete Edwards; play planned for 2028.'},
  {id:'confluence-jv',title:'HSG, Edwards family and Pizzuti Confluence Village joint venture',publisher:'Columbus Crew',url:'https://www.columbuscrew.com/news/haslam-sports-group-edwards-family-and-pizzuti-companies-announce-joint-venture',date:'2020-05-04',kind:'Company announcement',note:'Named JV parties and the mixed-use development beside the stadium. Equity shares are not supplied.'},
  {id:'nwsl-agreement-2026',title:'Ordinance 1112-2026: NWSL development agreement, land and funding plan',publisher:'City of Columbus',url:'https://columbus.legistar.com/LegislationDetail.aspx?From=RSS&FullText=1&GUID=AAB5C0B4-18BC-48F7-868F-667B3EAA3F8E&ID=7995215',date:'2026-04-23',note:'Amended agreement; contemplated $25m city/county commitments, land leases, admissions revenue and future-appropriation conditions.'},
  {id:'city-capital-2025',title:'July 28, 2025 approvals: municipal court and One Columbus',publisher:'City of Columbus / August 2 City Bulletin',url:'https://www.columbus.gov/files/sharedassets/city/v/1/city-council/documents/city-bulletins/2025/bulletin20250802.pdf',date:'2025-08-02',note:'1872-2025: court contract modification. 2100-2025: $1.3m One Columbus grant, including housing-coalition support.'}
];

export const enrichmentChecks = {
  'haslam-gifts-2026':['susan haslam','16,615.67','july 16, 2026','whitney haslam johnson','july 20, 2026','james johnson','july 21, 2026','32,615.67'],
  'hsg-leadership':['dee and jimmy','whitney','jw johnson','managing partners','cleveland browns','operating rights','columbus crew'],
  'jw-johnson-profile':['james wood','johnson iii','haslam sports group','partner'],
  'nwsl-ownership':['18th franchise','2028','haslam sports group','nationwide','christine','pete edwards'],
  'confluence-jv':['joint venture','haslam sports group','edwards family','pizzuti','confluence village'],
  'nwsl-agreement-2026':['1112-2026','approved as amended','25,000,000','no immediate funding','future appropriation','faithful implementation','mccoy park','seven percent'],
  'city-capital-2025':['1872-2025','841,900','gilbane-smoot','2100-2025','1,300,000','regional housing coalition','private nonprofit']
};

const n=(id,name,category,role,sourceIds,description='')=>({id,name,category,role,sourceIds,description,x:3000,y:2000,historical:false});
export const enrichmentNodes = [
  n('hsg','Haslam Sports Group','corporation','Sports ownership / operating group',['hsg-leadership','nwsl-ownership']),
  n('dee-haslam','Dee Haslam','person','HSG managing partner · reported donor',['hsg-leadership','partnership-founders','haslam-gifts-2026']),
  n('jimmy-haslam','Jimmy Haslam','person','HSG managing partner',['hsg-leadership']),
  n('whitney-johnson','Whitney Haslam Johnson','person','HSG managing partner · reported donor',['hsg-leadership','nwsl-ownership','haslam-gifts-2026']),
  n('jw-johnson','JW Johnson','person','HSG managing partner · reported donor',['jw-johnson-profile','haslam-gifts-2026']),
  n('crew','Columbus Crew','corporation','MLS club / investor-operator rights',['hsg-leadership','nwsl-ownership','byers-register']),
  n('browns','Cleveland Browns','corporation','NFL club / HSG ownership interest',['hsg-leadership','byers-register']),
  n('pete-edwards','Dr. Pete Edwards','person','Crew investor / NWSL ownership participant',['nwsl-ownership','nwsl-agreement-2026']),
  n('christine-edwards','Dr. Christine Edwards','person','Crew / NWSL ownership participant',['nwsl-ownership','nwsl-agreement-2026']),
  n('nwsl-club','Columbus NWSL 2028','initiative','Awarded franchise; play planned for 2028',['nwsl-ownership']),
  n('nwsl-newco','NWSL ownership group (NEWCO)','institution','Collective agreement-party definition',['nwsl-agreement-2026','nwsl-ownership'],'Grouped record for the contracting ownership parties and affiliates, not one legal corporation.'),
  n('confluence-authority','Confluence Community Authority','institution','Public authority / soccer-facility owner',['nwsl-agreement-2026']),
  n('mccoy-land','McCoy Park training site','institution','City-owned proposed training-facility land',['nwsl-agreement-2026'],'Agreement describes an approximately 28-acre site encompassing McCoy Park.'),
  n('nwsl-training','NWSL training facility','initiative','Planned facility / lease structure',['nwsl-agreement-2026']),
  n('nwsl-projects','NWSL facilities projects','initiative','Training facility and stadium-enhancement program',['nwsl-agreement-2026']),
  n('crew-stadium','ScottsMiracle-Gro Field','institution','Stadium owned by Confluence authority',['nwsl-agreement-2026','nwsl-ownership']),
  n('confluence-village','Confluence Village JV','corporation','Announced mixed-use development joint venture',['confluence-jv'],'Legal entity name and equity shares are not supplied in the announcement.'),
  n('edwards-sports-family','Edwards family (sports JV)','institution','Family party named in development venture',['confluence-jv'],'This group is distinct from the Edwards Companies record.'),
  n('parks-foundation','Columbus Recreation & Parks Foundation','institution','Beneficiary of recorded future park contribution',['nwsl-agreement-2026']),
  n('gilbane-smoot-jv','Gilbane-Smoot Columbus JV','corporation','Municipal-court construction manager at risk',['city-capital-2025']),
  n('municipal-court-project','New municipal court building','initiative','City construction project',['city-capital-2025']),
  n('housing-coalition','Regional Housing Coalition','institution','Operating support in One Columbus grant',['city-capital-2025']),
  n('caa-pac','Columbus Apartment Association PAC','institution','Reported campaign donor',['campaign-developers-2025']),
  n('realtors-pac','Central Ohio Realtors PAC','institution','Reported campaign donor',['campaign-developers-2025']),
  n('moun-dioun','Moun Dioun','person','Developer associated with Stonehenge',['campaign-developers-2025']),
  n('stonehenge','The Stonehenge Company','corporation','Development company named in campaign reporting',['campaign-developers-2025'])
];
enrichmentNodes.find(n=>n.id==='dee-haslam').aliases=['Susan Haslam','Susan (Dee) B. Haslam'];
enrichmentNodes.find(n=>n.id==='jw-johnson').aliases=['James Johnson','James Wood Johnson III'];
enrichmentNodes.find(n=>n.id==='nwsl-newco').aliases=['NEWCO','NWSL Columbus LLC','Columbus Women’s Soccer Holding Company LLC'];
enrichmentNodes.find(n=>n.id==='crew-stadium').aliases=['Lower.com Field'];

const e=(id,source,target,type,label,evidence,sourceIds,period,details={})=>({id,source,target,type,label,evidence,sourceIds,period,caseId:'sports',historical:false,status:'documented',directional:true,...details});
const announced={status:'acknowledged'};
const planned={status:'commitment',historical:false,requiresFurtherAuthorization:true};
const gift={status:'reported',historical:true,unit:'USD reported personal campaign contribution'};
export const enrichmentEdges = [
  ...['dee-haslam','jimmy-haslam','whitney-johnson','jw-johnson'].map((id,i)=>e('e'+(126+i),id,'hsg','leadership','Managing partner','Company lists this managing partner.',['hsg-leadership'], 'Role in dated company roster',announced)),
  e('e130','hsg','crew','control','MLS operating rights','Company lists Crew operating rights.',['hsg-leadership'],'Acquired 2019; portfolio in snapshot',{...announced,graphLabel:'Operating rights'}),
  e('e131','hsg','browns','control','Ownership interest','Company lists Browns ownership.',['hsg-leadership'],'Ownership in source snapshot',{...announced,graphLabel:'Ownership interest',context:'No ownership percentage is supplied here.'}),
  e('e132','pete-edwards','crew','control','Investor-operator','City agreement identifies Pete in the Crew investor-operator group.',['nwsl-ownership','nwsl-agreement-2026'],'Agreement April 2026; family investment since 2019',announced),
  e('e133','christine-edwards','crew','control','Ownership participant','City agreement names Pete and Chris Edwards in the Crew investor-operator group.',['nwsl-agreement-2026'],'Agreement April 2026',{context:'Joint ownership group; individual equity allocation is not supplied.'}),
  ...['hsg','nationwide','pete-edwards','christine-edwards'].map((id,i)=>e('e'+(134+i),id,'nwsl-newco','control','NWSL ownership participant','Franchise announcement names this ownership participant.',['nwsl-ownership'],'Franchise award April 21, 2026',{...announced,context:'Joint ownership; equity share not supplied.'})),
  e('e138','nwsl-newco','nwsl-club','control','Owner / operator group','Agreement and announcement identify the club’s operating ownership group.',['nwsl-agreement-2026','nwsl-ownership'],'2026 award; play planned for 2028',announced),
  e('e139','dee-haslam','ginther-fund','money','$16,615.67 reported contribution','Report names Susan Haslam as donor.',['haslam-gifts-2026','partnership-founders'],'July 16, 2026',{...gift,amount:16615.67,amountLabel:'$16,615.67',transactionDate:'2026-07-16',reportedContributorName:'Susan Haslam',context:'The Partnership roster identifies Susan (Dee) Haslam. The report does not state the donation’s purpose.'}),
  e('e140','whitney-johnson','ginther-fund','money','$8,000 reported contribution','Report names Whitney Haslam Johnson.',['haslam-gifts-2026'],'July 20, 2026',{...gift,amount:8000,amountLabel:'$8k',transactionDate:'2026-07-20'}),
  e('e141','jw-johnson','ginther-fund','money','$8,000 reported contribution','Report names James Johnson, HSG managing partner.',['haslam-gifts-2026','jw-johnson-profile'],'July 21, 2026',{...gift,amount:8000,amountLabel:'$8k',transactionDate:'2026-07-21',reportedContributorName:'James Johnson',context:'Club biography identifies James Wood (JW) Johnson III in that partner role.'}),
  e('e142','crew','bill-byers','lobbying','Registered lobbying agent','Register lists Columbus Crew SC for Byers.',['byers-register'],'Register capture May 19, 2026',{status:'registered',registeredEmployerName:'Columbus Crew SC'}),
  e('e143','browns','bill-byers','lobbying','Registered lobbying agent','Register lists Cleveland Browns for Byers.',['byers-register'],'Register capture May 19, 2026',{status:'registered'}),
  e('e144','dee-haslam','partnership','board','Member company representative','Partnership roster lists Susan (Dee) Haslam with the Crew.',['partnership-founders'],'Membership in dated roster'),
  ...['hsg','edwards-sports-family','pizzuti'].map((id,i)=>e('e'+(145+i),id,'confluence-village','partnership','Joint-venture participant','Announcement names this development partner.',['confluence-jv'],'Announced May 4, 2020',{...announced,historical:true,directional:false,graphLabel:'JV partner'})),
  e('e148','city','confluence-authority','leadership','Established authority','Ordinance dates establishment to 2019.',['nwsl-agreement-2026'],'Established 2019',{historical:true}),
  e('e149','confluence-authority','crew-stadium','control','Owns stadium','City ordinance identifies NCA stadium ownership.',['nwsl-agreement-2026'],'Ownership stated April 2026',{graphLabel:'Owns stadium'}),
  e('e150','crew','crew-stadium','partnership','Home venue','Franchise announcement identifies the Crew’s stadium.',['nwsl-ownership'],'Opened July 2021; source April 2026',{...announced,directional:false}),
  e('e151','city','mccoy-land','control','Owns proposed training site','Ordinance identifies city-owned land encompassing McCoy Park.',['nwsl-agreement-2026'],'Site in April 2026 agreement',{siteAcresApprox:28,graphLabel:'City-owned site'}),
  e('e152','city','confluence-authority','contract','Authorized site lease; realty rules waived','Agreement authorizes leases and waives Chapter 328.',['nwsl-agreement-2026'],'Approved as amended April 20, 2026',{status:'authorized',historical:true,graphLabel:'Lease authorized',locator:'1112-2026: land leases and Chapter 328 (city-owned realty) waiver',context:'This is lease authorization; an executed lease is not supplied by this source.'}),
  e('e153','confluence-authority','nwsl-newco','contract','Planned training-site / facility sublease','Agreement describes subleasing to NEWCO.',['nwsl-agreement-2026'],'Plan in April 2026 agreement',{...planned,graphLabel:'Planned sublease'}),
  e('e154','confluence-authority','nwsl-training','control','Planned facility owner','Agreement says the NCA will own the training facility.',['nwsl-agreement-2026'],'Plan in April 2026 agreement',{...planned,graphLabel:'Planned owner'}),
  e('e155','nwsl-newco','nwsl-training','control','Controls planned design / construction','Agreement assigns project execution to NEWCO.',['nwsl-agreement-2026'],'Plan in April 2026 agreement',{...planned,graphLabel:'Project execution'}),
  e('e156','city','confluence-authority','money','$25m conditional capital commitment','Ordinance describes the City Contribution.',['nwsl-agreement-2026'],'Agreement April 2026',{...planned,amount:25000000,amountLabel:'$25m conditional',unit:'USD contemplated capital commitment',locator:'1112-2026: Fiscal Impact, Contribution Agreement and subsequent-legislation provisions',context:'No immediate funding in this ordinance. Appropriation and expenditure require later legislation and park-planning conditions.'}),
  e('e157','county','nwsl-projects','money','$25m county commitment described','City ordinance describes matching funding for the facilities projects.',['nwsl-agreement-2026'],'Agreement April 2026',{...planned,amount:25000000,amountLabel:'$25m conditional',unit:'USD contemplated county project commitment',targetRole:'funding purpose',context:'Project funding purpose, not a named payee. Separate County authorization, payment route and disbursements are not established by this City source.'}),
  e('e158','crew-stadium','city','money','Planned admissions revenue for debt service','Agreement proposes raising the fee from 5% to 7%.',['nwsl-agreement-2026'],'Plan in April 2026 agreement',{...planned,graphLabel:'Planned admissions revenue',ratePercent:7,incrementPercentagePoints:2,context:'All 7% revenue from team events plus the 2-point increment from other stadium events would support debt service. Fee changes require separate legislation.'}),
  e('e159','nwsl-newco','parks-foundation','money','$3m park-benefit obligation','Amended ordinance stipulates a future foundation contribution.',['nwsl-agreement-2026'],'Payable by December 31, 2029',{...planned,amount:3000000,amountLabel:'$3m obligation',unit:'USD future community-benefit obligation',dueDate:'2029-12-31',context:'Recorded obligation; payment or fulfillment is not demonstrated by this source.'}),
  e('e160','city','one-columbus','money','Up to $1.3m economic-development grant','Approved ordinance authorizes the grant.',['city-capital-2025'],'Approved July 28, 2025',{caseId:'cityhall',status:'authorized',historical:true,amount:1300000,amountIsUpperBound:true,amountLabel:'Up to $1.3m',unit:'USD grant authorization ceiling',locator:'Ordinance 2100-2025',context:'Includes $800,000 General Fund and $500,000 Neighborhood Economic Development Fund authorization. This is not a disbursement record.'}),
  e('e161','one-columbus','housing-coalition','money','$500k support within grant','Ordinance includes coalition operating support.',['city-capital-2025'],'2025 grant allocation',{caseId:'cityhall',status:'authorized',historical:true,amount:500000,amountLabel:'$500k earmark',unit:'USD earmarked support within grant',amountIncludedIn:'e160',context:'Included in the $1.3m grant ceiling; not an additional amount or confirmed onward payment.'}),
  e('e162','city','gilbane-smoot-jv','contract','Up to $841,900 court contract modification','Approved ordinance increases the CMaR agreement.',['city-capital-2025'],'Approved July 28, 2025',{caseId:'cityhall',status:'authorized',historical:true,amount:841900,amountIsUpperBound:true,amountLabel:'Up to $841.9k',unit:'USD contract-modification ceiling',appropriationTotal:843900,locator:'Ordinance 1872-2025',context:'An incremental modification, not the full project cost. The additional $2,000 appropriation is for City prevailing-wage services, not this JV.'}),
  e('e163','gilbane-smoot-jv','municipal-court-project','contract','Construction manager at risk','Ordinance identifies the project and contractor.',['city-capital-2025'],'Agreement modified July 2025',{caseId:'cityhall',status:'authorized',historical:true}),
  e('e164','caa-pac','hardin-fund','money','$5,000 PAC contribution','WOSU reports the PAC contribution.',['campaign-developers-2025'],'2025 reporting through July',{caseId:'cityhall',status:'reported',historical:true,amount:5000,amountLabel:'$5k',unit:'USD reported PAC contribution'}),
  e('e165','realtors-pac','hardin-fund','money','$5,000 PAC contribution','WOSU reports the PAC contribution.',['campaign-developers-2025'],'2025 reporting through July',{caseId:'cityhall',status:'reported',historical:true,amount:5000,amountLabel:'$5k',unit:'USD reported PAC contribution'}),
  e('e166','moun-dioun','hardin-fund','money','More than $15,000 contributions','WOSU reports Dioun’s contributions.',['campaign-developers-2025'],'2025 reporting through July',{caseId:'cityhall',status:'reported',historical:true,amount:15000,amountIsLowerBound:true,amountLabel:'>$15k',unit:'USD reported personal contributions'}),
  e('e167','moun-dioun','stonehenge','partnership','Reported developer affiliation','WOSU identifies Dioun with Stonehenge.',['campaign-developers-2025'],'Report August 2025',{caseId:'cityhall',status:'reported',historical:true,directional:false}),
  e('e168','nwsl-projects','nwsl-training','partnership','Project component','Agreement includes training-facility construction.',['nwsl-agreement-2026'],'Plan April 2026',{...planned,directional:false}),
  e('e169','nwsl-projects','crew-stadium','partnership','Stadium-enhancement component','Agreement includes stadium changes required by the NWSL.',['nwsl-agreement-2026'],'Plan April 2026',{...planned,directional:false})
];
enrichmentEdges.push(e('e170','dee-haslam','crew','leadership','CEO / managing partner in Partnership roster','Roster identifies Susan (Dee) Haslam and the Crew.',['partnership-founders'],'Roster capture October 9, 2026'));

// Pending sources stay in the research intake, never in displayed source links.
export function enrichmentRelease(verifiedSourceIds) {
  const ready=enrichmentSources.every(s=>verifiedSourceIds.has(s.id));
  if(ready)return {nodes:enrichmentNodes,edges:enrichmentEdges,complete:true};
  const overrides={
    hsg:{role:'Sports group / named JV investor-operator',sourceIds:['confluence-jv']},
    'dee-haslam':{role:'Crew leader / reported campaign donor',sourceIds:['partnership-founders','haslam-gifts-2026']},
    'whitney-johnson':{role:'Reported HSG managing partner / donor',sourceIds:['haslam-gifts-2026']},
    crew:{role:'MLS club / registered lobbying employer',sourceIds:['confluence-jv','byers-register']},
    browns:{role:'Named employer in Ohio lobbying register',sourceIds:['byers-register']}
  };
  if(verifiedSourceIds.has('nwsl-ownership')){
    overrides.hsg={role:'Sports ownership / operating group',sourceIds:['confluence-jv','nwsl-ownership']};
    overrides['pete-edwards']={role:'NWSL ownership participant',sourceIds:['nwsl-ownership']};
    overrides['christine-edwards']={role:'NWSL ownership participant',sourceIds:['nwsl-ownership']};
    overrides['nwsl-newco']={name:'Columbus NWSL ownership group',role:'Ownership participants named in franchise announcement',sourceIds:['nwsl-ownership'],aliases:[],description:'Grouped record for HSG, Nationwide, Christine and Pete Edwards; equity shares are not supplied.'};
    overrides.crew={role:'MLS club / HSG operating rights',sourceIds:['confluence-jv','byers-register','nwsl-ownership']};
    overrides.browns={role:'NFL club / HSG ownership interest',sourceIds:['byers-register','nwsl-ownership']};
  }
  const nodes=enrichmentNodes.map(n=>({...n,...overrides[n.id]})).filter(n=>n.sourceIds.every(id=>verifiedSourceIds.has(id)));
  const pendingNodeIds=new Set(enrichmentNodes.filter(n=>!nodes.some(p=>p.id===n.id)).map(n=>n.id));
  const edges=enrichmentEdges.filter(e=>e.sourceIds.every(id=>verifiedSourceIds.has(id))&&!pendingNodeIds.has(e.source)&&!pendingNodeIds.has(e.target));
  const replacements=[
    {...enrichmentEdges.find(e=>e.id==='e128'),sourceIds:['haslam-gifts-2026'],status:'reported',evidence:'Campaign report lists Whitney as an HSG managing partner.',period:'Reported July 2026'},
    {...enrichmentEdges.find(e=>e.id==='e129'),sourceIds:['jw-johnson-profile','haslam-gifts-2026'],status:'reported',evidence:'Club biography and campaign report identify Johnson’s HSG partner role.',period:'Biography April 2026; report July 2026'},
    {...enrichmentEdges.find(e=>e.id==='e130'),sourceIds:['nwsl-ownership'],evidence:'Franchise announcement lists HSG’s Crew operating rights.',period:'Portfolio announced April 21, 2026'},
    {...enrichmentEdges.find(e=>e.id==='e131'),sourceIds:['nwsl-ownership'],evidence:'Franchise announcement lists HSG’s Browns ownership.',period:'Portfolio announced April 21, 2026'},
    {...enrichmentEdges.find(e=>e.id==='e138'),sourceIds:['nwsl-ownership'],evidence:'Franchise announcement names the club’s ownership group.',period:'Award announced April 21, 2026'}
  ];
  for(const edge of replacements)if(!edges.some(e=>e.id===edge.id)&&edge.sourceIds.every(id=>verifiedSourceIds.has(id))&&!pendingNodeIds.has(edge.source)&&!pendingNodeIds.has(edge.target))edges.push(edge);
  return {nodes,edges,complete:false};
}

export const sportsCase={label:'Sports & development',title:'Sports ownership / development / public finance',summary:'Sports owners, campaign transactions, development partners and facility funding plans.',outcomes:['Three reported July 2026 campaign contributions total $32,615.67.','The NWSL agreement contemplates $25m each from City and County; separate funding legislation is required.','HSG and the Edwards family partnered with Pizzuti on Confluence Village.'],contextEdgeIds:['e01','e17','e78','e89','e123'],positions:{}};
