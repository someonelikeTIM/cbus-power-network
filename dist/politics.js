// State / federal politics. Release each record only after its dated copy is checked.
export const politicalSources = [
  {id:'political-vivek',title:'Ramaswamy campaign biography',publisher:'Vivek for Ohio',url:'https://vivekforohio.com/meet-vivek/',date:null,kind:'Campaign statement',note:'2026 Republican nominee; greater-Columbus family residence. Candidate, not incumbent governor.'},
  {id:'political-vance',title:'Vice President JD Vance',publisher:'White House',url:'https://www.whitehouse.gov/administration/jd-vance/',date:null,note:'Official vice-presidential biography.'},
  {id:'political-allies',title:'Moreno and state officials support Ramaswamy',publisher:'WOSU / Statehouse News Bureau',url:'https://www.wosu.org/2025-03-24/moreno-state-senators-add-to-list-of-endorsements-for-ramaswamy-over-yost-for-ohio-governor',date:'2025-03-24',kind:'Reporting',note:'Named endorsements and offices at that date.'},
  {id:'political-husted',title:'Husted and Ramaswamy exchange endorsements in Columbus',publisher:'WOSU / Statehouse News Bureau',url:'https://www.wosu.org/2025-09-23/ramaswamy-husted-endorse-each-other-in-races-months-out-from-ohio-elections',date:'2025-09-23',kind:'Reporting',note:'September 22 event at The Boat House; endorsements are not payments.'},
  {id:'political-gop',title:'Ohio GOP endorses Husted and Ramaswamy',publisher:'Ohio Republican Party',url:'https://ohiogop.org/ohio-gop-endorses-trump-endorsed-candidates-in-key-2026-races-2/',date:'2025-05-09',kind:'Party statement',note:'State Central Committee vote and chairman Alex Triantafilou.'},
  {id:'political-coalition',title:'Campaign lists Vance, Trump and Huffman as supporters',publisher:'Vivek for Ohio',url:'https://vivekforohio.com/portman-wenstrup-back-vivek-ramaswamy-for-governor/',date:'2025-11-11',kind:'Campaign statement',note:'Supporter list is attributed to the campaign.'},
  {id:'political-strive',title:'Strive announces $30m Series B',publisher:'Strive Enterprises / PR Newswire',url:'https://www.prnewswire.com/news-releases/strive-raises-30-million-in-series-b-funding-round-302204180.html',date:'2024-07-23',kind:'Company statement',note:'Ramaswamy founding, named seed investors and round participants; no individual allocations.'},
  {id:'political-narya',title:'Narya investors',publisher:'Axios',url:'https://www.axios.com/2020/01/09/jd-vance-venture-capital-fund-ohio-silicon-valley-peter-thiel',date:'2020-01-09',kind:'Reporting',note:''},
  {id:'political-narya-filing',title:'JD Vance 2021 Form 4',publisher:'SEC',url:'https://www.sec.gov/Archives/edgar/data/1807707/000120919121006496/xslF345X03/doc4.xml',date:'2021-02-01',note:'Footnote 2: managing partner of Narya Capital Management LLC; no current role inferred.'},
  {id:'political-vpac',title:'Reported donations to pro-Ramaswamy V-PAC',publisher:'Ohio Capital Journal',url:'https://ohiocapitaljournal.com/2026/07/22/elon-musk-3-other-billionaires-put-12-million-behind-pro-ramaswamy-super-pac-in-ohio-governor-race/',date:'2026-07-22',kind:'Reporting / campaign-finance records',note:'PAC receipts, not receipts by the candidate committee; source links the FEC report.'},
  {id:'political-osu',title:'Timashev family announces $110m Ohio State gift',publisher:'Ohio State College of Engineering',url:'https://engineering.osu.edu/news/2023/02/record-setting-110m-gift-will-launch-center-software-innovation-ohio-state',date:'2023-02-16',note:'Gift is attributed to the family foundation, separate from personal political donations.'},
  {id:'political-intel',title:'DeWine and Husted announce Intel with regional partners',publisher:'Ohio Governor',url:'https://governor.ohio.gov/media/news-and-media/governor-dewine-announces-monumental-investment-by-intel-to-bring-their-most-advanced-semiconductor-manufacturing-plants-to-ohio-01212022',date:'2022-01-21',note:'Historical central-Ohio project announcement; collaboration does not establish equity or present spending.'},
  {id:'political-jobsohio',title:'ORC 187.01: JobsOhio governance',publisher:'Ohio Laws',url:'https://codes.ohio.gov/ohio-revised-code/section-187.01',date:'2013-09-04',note:'Statutory appointment powers of the governor’s office, not a claim about an individual decision.'},
  {id:'political-administration',title:'DeWine and Tressel launch opportunity tour',publisher:'Ohio Governor / GovDelivery',url:'https://content.govdelivery.com/accounts/OHIOGOVERNOR/bulletins/4255251',date:'2026-08-17',note:'Official release identifies Governor Mike DeWine and Lieutenant Governor Jim Tressel.'},
  {id:'political-house',title:'Matt Huffman official biography',publisher:'Ohio House of Representatives',url:'https://ohiohouse.gov/members/matt-huffman/biography',date:null,note:'Speaker in the 136th General Assembly.'},
  {id:'political-senate',title:'Rob McColley official biography',publisher:'Ohio Senate',url:'https://ohiosenate.gov/members/rob-mccolley/biography',date:null,note:'Senate president elected January 2025.'},
  {id:'political-rickenbacker',title:'COTA Rickenbacker mobility-center groundbreaking',publisher:'COTA',url:'https://www.cota.com/blog/cota-and-columbus-regional-airport-authority-celebrate-groundbreaking-of-new-mobility-center-at-rickenbacker/',date:'2023-10-04',note:'Congressional funding support, project partners, construction lead and Beatty’s stated $3m role.'}
];

export const politicalChecks = {
  'political-vivek':['republican nominee','2026','greater columbus'],
  'political-vance':['jd vance','vice president','senate'],
  'political-allies':['bernie moreno','rob mccolley','frank larose','robert sprague','endorsed'],
  'political-husted':['september 23, 2025','endorsed each other','boat house','sen. jon husted'],
  'political-gop':['may 9, 2025','triantafilou','husted','ramaswamy','state central committee'],
  'political-coalition':['november 11, 2025','vice president vance','matt huffman','support'],
  'political-strive':['jul 23, 2024','30 million','cantor fitzgerald','deason capital','narya capital','peter thiel','bill ackman','founders fund','co-founded in 2022 by vivek'],
  'political-narya':['vance','narya capital','co-founder','battelle','one of the fund'],
  'political-narya-filing':['vance jd','02/01/2021','narya capital management','managing partner','disclaims beneficial ownership'],
  'political-vpac':['july 22, 2026','musk','5 million','timashev','ackman','stevens','20 million','super pac'],
  'political-osu':['february 16, 2023','110 million','timashev family foundation','center for software innovation'],
  'political-intel':['january 21, 2022','dewine','husted','jobsohio','one columbus','intel'],
  'political-jobsohio':['september 4, 2013','nine directors','appointed by the governor','chairperson'],
  'political-administration':['august 17, 2026','mike dewine','jim tressel','lt. governor'],
  'political-house':['matt huffman','136th general assembly','elected speaker'],
  'political-senate':['rob mccolley','president','january of 2025'],
  'political-rickenbacker':['10/4/2023','joyce beatty','mike carey','sherrod brown','3 million','marker, inc.']
};

const n=(id,name,category,role,sourceIds,description='',historical=false)=>({id,name,category,role,sourceIds,description,x:3000,y:2000,historical});
export const politicalNodes = [
  n('vivek','Vivek Ramaswamy','politician','2026 Republican gubernatorial nominee',['political-vivek'],'Campaign biography places his family in greater Columbus. He does not hold the governor’s office.'),
  {...n('jd-vance','JD Vance','politician','Vice President of the United States',['political-vance']),aliases:['J.D. Vance','James David Vance']},
  n('trump','Donald Trump','politician','President / campaign supporter in 2025 record',['political-coalition']),
  n('husted','Jon Husted','politician','U.S. senator in September 2025 record',['political-husted']),
  n('moreno','Bernie Moreno','politician','U.S. senator in March 2025 record',['political-allies']),
  n('dewine','Mike DeWine','politician','Governor of Ohio',['political-administration']),
  n('tressel','Jim Tressel','politician','Lieutenant Governor of Ohio',['political-administration']),
  n('mccolley','Rob McColley','politician','Ohio Senate president · 136th General Assembly',['political-senate']),
  n('huffman','Matt Huffman','politician','Ohio House speaker · 136th General Assembly',['political-house']),
  n('larose','Frank LaRose','politician','Secretary of state in 2025 endorsement record',['political-allies']),
  n('sprague','Robert Sprague','politician','State treasurer in 2025 endorsement record',['political-allies']),
  n('amy-acton','Amy Acton','politician','2026 Democratic gubernatorial nominee',['political-vpac']),
  n('ohio-governor-election','2026 Ohio governor election','initiative','Gubernatorial contest',['political-vivek','political-vpac']),
  n('beatty','Joyce Beatty','politician','U.S. representative · OH-03 in 2023 project record',['political-rickenbacker']),
  n('carey','Mike Carey','politician','U.S. representative · OH-15 in 2023 project record',['political-rickenbacker']),
  n('sherrod-brown','Sherrod Brown','politician','U.S. senator in 2023 project record',['political-rickenbacker'],'Project-era office; does not assert a current Senate seat.',true),
  n('ohio-executive','Ohio executive branch','institution','Governor and lieutenant governor',['political-administration']),
  n('us-vice-presidency','U.S. vice-presidency','institution','Federal public office',['political-vance']),
  n('ohio-house','Ohio House of Representatives','institution','State legislative chamber',['political-house']),
  n('ohio-senate','Ohio Senate','institution','State legislative chamber',['political-senate']),
  n('ohio-gop','Ohio Republican Party','institution','State party / candidate endorsements',['political-gop']),
  n('triantafilou','Alex Triantafilou','person','Ohio GOP chairman in May 2025 record',['political-gop']),
  n('strive','Strive Enterprises','corporation','Ramaswamy-founded financial-services firm',['political-strive'],'Historical founding and financing records; present headquarters and personal ownership shares are not established.'),
  n('strive-round-2024','Strive 2024 financing','initiative','Announced $30m Series B',['political-strive']),
  n('narya','Narya Capital','corporation','Venture investor named by Strive',['political-strive']),
  n('peter-thiel','Peter Thiel','person','Strive seed investor',['political-strive']),
  n('bill-ackman','Bill Ackman','person','Strive seed investor',['political-strive']),
  n('cantor','Cantor Fitzgerald','corporation','Strive financing lead',['political-strive']),
  n('deason-capital','Deason Capital Services','corporation','Strive financing participant',['political-strive']),
  n('founders-fund','Founders Fund','corporation','Strive seed investor',['political-strive']),
  n('v-pac','V-PAC: Victors, Not Victims','institution','Super PAC supporting Ramaswamy',['political-vpac'],'Separate from the candidate’s campaign committee.'),
  n('elon-musk','Elon Musk','person','Reported V-PAC donor',['political-vpac']),
  n('jeff-yass','Jeffrey Yass','person','Reported V-PAC donor',['political-vpac']),
  n('ratmir-timashev','Ratmir Timashev','person','Reported V-PAC donor',['political-vpac']),
  n('ross-stevens','Ross Stevens','person','Reported V-PAC donor',['political-vpac']),
  n('timashev-foundation','Timashev Family Foundation','institution','Ohio State gift donor',['political-osu']),
  n('ohio-state','The Ohio State University','institution','Software-innovation gift recipient',['political-osu']),
  n('software-center','Ohio State Center for Software Innovation','initiative','Purpose of announced family-foundation gift',['political-osu']),
  n('jobsohio','JobsOhio','institution','State economic-development nonprofit',['political-jobsohio']),
  n('intel','Intel','corporation','Central-Ohio manufacturing project announcement',['political-intel']),
  n('rickenbacker-center','COTA Mobility Center at Rickenbacker','initiative','2023 groundbreaking / funding support',['political-rickenbacker'])
];
const e=(id,source,target,type,label,evidence,sourceId,period,extra={})=>({id,source,target,type,label,evidence,sourceIds:[sourceId],period,historical:false,directional:true,status:'documented',caseId:'politics',locator:'Named record in cited page',...extra});
const support={status:'reported',context:'Dated political endorsement; no payment or government direction is inferred.'};
export const politicalEdges = [
  e('p01','jd-vance','us-vice-presidency','leadership','Vice President','Official biography identifies Vance.','political-vance','Office in dated capture'),
  ...['jd-vance','trump','huffman'].map((id,i)=>e('p'+(2+i).toString().padStart(2,'0'),id,'vivek','endorsement','Campaign-listed support','Ramaswamy’s campaign names this supporter.','political-coalition','Campaign statement November 11, 2025',{status:'acknowledged',context:'Attributed campaign statement; does not establish a donation, coordination or municipal authority.'})),
  ...['moreno','mccolley','larose','sprague'].map((id,i)=>e('p'+(5+i).toString().padStart(2,'0'),id,'vivek','endorsement','Reported endorsement','WOSU names this endorser.','political-allies','Reported March 24, 2025',support)),
  e('p09','husted','vivek','endorsement','Endorsed for governor','Joint public endorsement in Columbus.','political-husted','September 22, 2025',support),
  e('p10','vivek','husted','endorsement','Endorsed for Senate','Reciprocal public endorsement.','political-husted','September 22, 2025',support),
  e('p11','ohio-gop','vivek','endorsement','State party endorsement','Central Committee approved support.','political-gop','May 9, 2025',{status:'acknowledged'}),
  e('p12','ohio-gop','husted','endorsement','State party endorsement','Central Committee approved support.','political-gop','May 9, 2025',{status:'acknowledged'}),
  e('p13','triantafilou','ohio-gop','leadership','Party chairman','Party identifies its chairman.','political-gop','May 9, 2025',{status:'acknowledged'}),
  e('p14','vivek','strive','history','Co-founded in 2022','Company states its founding.','political-strive','2022 founding',{historical:true,status:'acknowledged',context:'Founding does not establish a current executive role or shareholding percentage.'}),
  e('p15','strive-round-2024','strive','money','$30m company financing','Company announced the completed round.','political-strive','July 23, 2024',{historical:true,status:'acknowledged',amount:30000000,amountLabel:'$30m round',unit:'USD announced company financing',context:'Company funding, separate from election donations.'}),
  ...['cantor','deason-capital','narya'].map((id,i)=>e('p'+(16+i),id,'strive-round-2024','money',i===0?'Led Series B':'Participated in Series B','Company names this participant.','political-strive','July 23, 2024',{historical:true,status:'acknowledged',context:'Individual amount and equity share not disclosed.'})),
  ...['peter-thiel','bill-ackman','founders-fund'].map((id,i)=>e('p'+(19+i),id,'strive','money','Named seed investor','Company identifies seed backing.','political-strive','Founding-era investment reported July 2024',{historical:true,status:'acknowledged',context:'No individual amount or current share supplied.'})),
  e('p22','jd-vance','narya','history','Managing partner in filing','Vance’s Form 4 identifies this management role.','political-narya-filing','February 1, 2021',{historical:true,locator:'Footnote 2',context:'Filing identifies Narya Capital Management LLC. Current management and personal holdings are not inferred.'}),
  e('p23','battelle','narya','money','Limited partner','Reported fund investor.','political-narya','2020',{historical:true,status:'reported',locator:''}),
  e('p24','v-pac','vivek','endorsement','Supports gubernatorial election','Reporting identifies the PAC’s purpose.','political-vpac','July 2026 reporting',{status:'reported',context:'PAC support is separate from candidate receipts; coordination is not established.'}),
  ...[['elon-musk',5000000,'May 2026'],['ratmir-timashev',5000000,'May 2026'],['bill-ackman',1000000,'June 2026'],['ross-stevens',1000000,'May 2026'],['jeff-yass',20000000,'Before 2026 primary'],['ross-stevens',5000000,'Early 2025']].map(([id,amount,period],i)=>e('p'+(25+i),id,'v-pac','money',`Reported $${amount/1000000}m PAC contribution`,'Source reports this receipt.','political-vpac',period,{status:'reported',amount,amountLabel:`$${amount/1000000}m`,unit:'USD reported super-PAC contribution',locator:'Named donor paragraph'})),
  e('p31','timashev-foundation','ohio-state','money','$110m gift announced','University announced the family-foundation gift.','political-osu','February 16, 2023',{historical:true,amount:110000000,amountLabel:'$110m gift',unit:'USD announced philanthropic gift',context:'Separate donor entity and purpose from Timashev’s personal PAC receipt; disbursement schedule not verified.'}),
  e('p32','ratmir-timashev','timashev-foundation','partnership','Named donor family','University identifies Ratmir and Angela’s family.','political-osu','February 2023',{historical:true,directional:false,context:'Family association; legal trusteeship and unilateral control are not established.'}),
  e('p33','ohio-state','software-center','partnership','Gift-funded center announced','University describes the intended center.','political-osu','February 2023',{historical:true,context:'Purpose of the same $110m gift; no second transfer amount.'}),
  e('p34','dewine','ohio-executive','leadership','Governor','Official release identifies DeWine.','political-administration','August 17, 2026 official release'),
  e('p35','tressel','ohio-executive','leadership','Lieutenant governor','Official release identifies Tressel.','political-administration','August 17, 2026 official release'),
  e('p36','ohio-executive','jobsohio','control','Governor appoints directors and chair','Statute assigns these appointment powers.','political-jobsohio','ORC 187.01(B)–(D) in dated capture',{locator:'Divisions (B)–(D)',context:'Office-level appointment authority; does not establish orders concerning a particular company.'}),
  ...['dewine','husted','jobsohio','one-columbus'].map((id,i)=>e('p'+(37+i),id,'intel','partnership','Joined project announcement','Governor’s release names these participants.','political-intel','January 21, 2022',{historical:true,directional:false,context:'Historical project collaboration; equity, current project costs and payments are not inferred.'})),
  e('p41','huffman','ohio-house','leadership','House speaker','Official biography identifies the speakership.','political-house','136th General Assembly'),
  e('p42','mccolley','ohio-senate','leadership','Senate president','Official biography records his election.','political-senate','Elected January 2025'),
  ...['beatty','carey','sherrod-brown'].map((id,i)=>e('p'+(43+i),id,'rickenbacker-center','influence','Congressional funding support','COTA names congressional supporters.','political-rickenbacker','October 4, 2023 announcement',{historical:true,context:id==='beatty'?'Beatty states she helped secure $3m for FY2023; her advocacy is not a personal payment.':'No individual amount attributed.'})),
  e('p46','cota','rickenbacker-center','partnership','Project lead','COTA announces its mobility-center project.','political-rickenbacker','October 4, 2023',{historical:true}),
  e('p47','marker-inc','rickenbacker-center','contract','Construction lead announced','COTA names Marker as construction lead.','political-rickenbacker','October 4, 2023',{historical:true,context:'Announcement, not an inspected executed contract or verified payment.'}),
  e('p48','vivek','ohio-governor-election','candidacy','Republican nominee','Campaign biography identifies his candidacy.','political-vivek','2026 election',{status:'acknowledged',context:'Candidacy does not confer the powers of the governor.'}),
  e('p49','amy-acton','ohio-governor-election','candidacy','Democratic nominee','Reporting identifies Acton’s candidacy.','political-vpac','July 2026 reporting',{status:'reported'})
];

export function politicalRelease(verifiedSourceIds,baseNodeIds) {
  const existing=new Set(baseNodeIds);
  const nodes=politicalNodes.filter(n=>!existing.has(n.id)&&n.sourceIds.every(id=>verifiedSourceIds.has(id))).map(n=>({...n}));
  const ids=new Set([...existing,...nodes.map(n=>n.id)]);
  const edges=politicalEdges.filter(e=>e.sourceIds.every(id=>verifiedSourceIds.has(id))&&ids.has(e.source)&&ids.has(e.target));
  return {nodes,edges,complete:politicalSources.every(s=>verifiedSourceIds.has(s.id))};
}
export const politicalCase={label:'State & federal',title:'State / federal political influence',summary:'Campaign support, private investment, state appointments and local project advocacy.',contextEdgeIds:['e01','e02','e03','e08','e10','e12','e21','e22','e29','e38','e103','e104','e105','e107'],positions:{},outcomes:['Select a link for the dated role, evidence and direction.','Endorsements, public authority, investments and donations are separate records.','Candidates do not acquire the governor’s powers before taking office.']};
