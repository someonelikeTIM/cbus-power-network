// Affiliation is recorded for the named entity, never inferred from donors or neighbors.
export const affiliationSources=[
  {id:'pa26-dewine',title:'Mike DeWine — party affiliation',publisher:'National Governors Association',url:'https://www.nga.org/governors/ohio/',date:null,kind:'Governor directory',note:'The profile explicitly lists Party Republican.'},
  {id:'pa26-state-roster',title:'Franklin County roster of elected officials — state offices',publisher:'Franklin County Board of Elections',url:'https://www.vote.franklincountyohio.gov/candidates/elected-officials',date:'2026-08-17',kind:'Official roster',note:'Governor and lieutenant governor rows have a separate party column. Nonpartisan municipal ballots are not treated as proof of no party affiliation.'},
  {id:'pa26-federal-ballot',title:'2024 statewide candidates and political parties',publisher:'Ohio Secretary of State',url:'https://www.ohiosos.gov/office/media-center/categories/press-releases/2024-08-23',date:'2024-08-23',kind:'Official candidate certification',note:'Names Trump and Vance as the Republican ticket and Moreno as the Republican Senate candidate. Used for affiliation, not present office or 2026 results.'},
  {id:'pa26-huffman',title:'Matt Huffman — District 78 profile',publisher:'Ohio House of Representatives',url:'https://www.ohiohouse.gov/members/matt-huffman',date:null,kind:'Official member profile',note:'The named member header identifies party R.'},
  {id:'pa26-dovilla',title:'Mike Dovilla — official legislative biography',publisher:'Ohio House of Representatives',url:'https://www.ohiohouse.gov/members/michael-d-dovilla/biography',date:null,kind:'Official biography',note:'The biography documents House Republican Policy Committee leadership.'},
  {id:'pa26-householder',title:'Larry Householder elected speaker in 2019',publisher:'Ohio House of Representatives',url:'https://ohiohouse.gov/news/republican/representative-larry-householder-elected-speaker-99231',date:'2019-01-29',kind:'Historical official statement',note:'Identifies Householder as R-Glenford. Historical affiliation is separate from officeholding and legal findings.'},
  {id:'pa26-kasich',title:'John Kasich — historical party affiliation',publisher:'National Governors Association',url:'https://www.nga.org/governor/john-kasich/',date:null,kind:'Former governor directory',note:'Lists Party Republican for the 2011–2019 gubernatorial profile.'},
  {id:'pa26-yost',title:'2022 general-election candidates — party labels',publisher:'Trumbull County Board of Elections',url:'https://boe.co.trumbull.oh.gov/pdfs/CANDIDATES%202022G.pdf',date:'2022',kind:'Official candidate list',note:'Attorney general row identifies Dave Yost as Republican. This does not assert current officeholding.'},
  {id:'pa26-columbus-party',title:'Ohio Democratic Party statement on Columbus council elections',publisher:'Ohio Democratic Party',url:'https://ohiodems.org/ohio-democratic-party-congratulates-columbus-city-council-candidates-on-their-successful-elections-and-reelections-to-council/',date:'2021-11-02',kind:'Party statement',note:'Names Bankston and Hardin as part of continued Democratic leadership. Used as a dated affiliation record.'},
  {id:'pa26-dorans',title:'Dorans appointed to Columbus City Council',publisher:'Columbus/Central Ohio Building & Construction Trades Council',url:'https://columbusconstruction.org/dorans-appointed-to-columbus-city-council/',date:'2019',kind:'Participant account',note:'Describes Dorans and his council slate as Democrats. The union itself does not receive a party affiliation.'},
  {id:'pa26-columbus-pac-labels',title:'HBI-PAC disbursement reports — candidate party column',publisher:'Huntington Bancshares',url:'https://d1io3yog0oux5.cloudfront.net/_edad57643dd595f16ed5c186c719ce3e/huntington/db/2715/27579/file/HBI-PAC_Disbursement_Reports_2020-2024_FINAL.pdf',date:null,kind:'Issuer political contribution report',note:'The party column explicitly labels Andrew Ginther and Zach Klein Democrat. Only affiliation is added here; no additional payment or influence relationship is created.'},
  {id:'pa26-mitchell-brown',title:'2017 Columbus council results — candidate affiliations',publisher:'Patch',url:'https://patch.com/ohio/columbus/columbus-election-results-city-council-city-attorney',date:'2017-11-07',kind:'Election reporting',note:'Identifies Mitchell J. Brown and Shannon Hardin as Democrats. Brown is the Columbus official, not a same-name individual elsewhere.'},
  {id:'pa26-gop-chair',title:'Alex Triantafilou — Ohio Republican Party chairman',publisher:'Ohio Republican Party',url:'https://ohiogop.org/about-the-chairman/',date:null,kind:'Party biography',note:'Explicit party leadership and membership; not inferred from endorsements.'}
];
export const affiliationChecks={
  'pa26-dewine':['mike dewine','party republican'],
  'pa26-state-roster':['roster of elected officials','mike dewine','jim tressel','(r)'],
  'pa26-federal-ballot':['donald j. trump and jd vance (republican)','bernie moreno (republican)'],
  'pa26-huffman':['matt huffman','district 78','matt huffman (r-lima)'],
  'pa26-dovilla':['mike dovilla','house republican policy committee'],
  'pa26-householder':['householder (r-glenford)','january 29, 2019'],
  'pa26-kasich':['john kasich','party republican'],
  'pa26-yost':['dave yost - republican'],
  'pa26-columbus-party':['continued democratic leadership','nick bankston','shannon hardin'],
  'pa26-dorans':['dorans will run','fellow democrat'],
  'pa26-columbus-pac-labels':['andrew ginther','zach klein','democrat'],
  'pa26-mitchell-brown':['mitchell j. brown','all three are democrats'],
  'pa26-gop-chair':['alex triantafilou','chairman of the ohio republican party']
};
const row=(entityId,party,sourceId,period,locator)=>({entityId,party,sourceIds:[sourceId],period,locator});
export const affiliationRecords=[
  row('dewine','Republican','pa26-dewine','Gubernatorial profile checked November 2026','Profile: Party field'),
  row('tressel','Republican','pa26-state-roster','Roster revised August 17, 2026','Lieutenant governor row: party (R)'),
  ...['trump','jd-vance','moreno'].map(id=>row(id,'Republican','pa26-federal-ballot','2024 general election','Presidential ticket and U.S. Senate candidate list')),
  row('huffman','Republican','pa26-huffman','136th General Assembly profile','Member header: Matt Huffman, District 78, R'),
  row('mike-dovilla','Republican','pa26-dovilla','Legislative biography checked November 2026','Biography: Republican Policy Committee leadership'),
  row('householder','Republican','pa26-householder','2019 speaker election','Opening paragraph: R-Glenford'),
  row('kasich','Republican','pa26-kasich','2011–2019 gubernatorial terms','Profile: Party field'),
  row('dave-yost','Republican','pa26-yost','2022 general election','Attorney general candidate row'),
  ...['hardin','bankston'].map(id=>row(id,'Democratic','pa26-columbus-party','2021 council election','Statement identifying continued Democratic leadership')),
  row('dorans','Democratic','pa26-dorans','2019 council election','Paragraph describing Dorans and fellow Democrat council members'),
  row('ginther','Democratic','pa26-columbus-pac-labels','2020 contribution report','PDF page 34: Andrew Ginther row, Party Affiliation column Democrat'),
  row('zach-klein','Democratic','pa26-columbus-pac-labels','2021 contribution report','PDF page 25: Zach Klein row, party column Democrat'),
  row('mitchell-j-brown','Democratic','pa26-mitchell-brown','2017 council election','Opening results paragraph: all three are Democrats'),
  row('triantafilou','Republican','pa26-gop-chair','Chairmanship from 2023; biography checked November 2026','Party chairman biography')
];
export function applyPartyAffiliations(nodes,verified){
  for(const record of affiliationRecords){
    if(!record.sourceIds.every(id=>verified.has(id)))continue;
    const node=nodes.find(node=>node.id===record.entityId);if(!node)continue;
    if(node.party&&node.party!==record.party)throw Error('Conflicting affiliation for '+node.id);
    node.party=record.party;
    node.partyAffiliation={party:record.party,sourceIds:[...record.sourceIds],period:record.period,locator:record.locator,checkedOn:'2026-11-16',note:'Dated documented affiliation; does not assign a party to a public office, employer, donor, or connected entity.'};
    node.sourceIds=[...new Set([...node.sourceIds,...record.sourceIds])];
  }
}
