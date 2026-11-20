const hearings = 'https://search-prod.lis.state.oh.us/api/v2/general_assembly_136/committees/';
const houseHearing = hearings+'cmte_h_pub_safety_1/meetings/cmte_h_pub_safety_1_2026-11-17-0930_1530/testimony/';
const senateHearing = hearings+'cmte_s_judiciary_1/meetings/cmte_s_judiciary_1_2025-06-18-0945_609/testimony/';

export const policySources = [
  {id:'policy-dovilla-sb243',title:'2014 legislation extending the data-center tax deadline',publisher:'Ohio Senate',url:'https://ohiosenate.gov/legislation/130/sb243',date:'2014',kind:'Enacted bill and cosponsor list',note:'The 130th General Assembly’s SB 243 temporarily extended the investment deadline for eligible data centers. The legislature lists Michael D. Dovilla as a House cosponsor.'},
  {id:'policy-flock-hb725',title:'Flock Safety testimony supporting Ohio HB 725',publisher:'Ohio House Public Safety Committee',url:houseHearing+'19973/flock_safety_11_17_2026_testimony.pdf',date:'2026-11-17',kind:'Written proponent testimony',note:'Government affairs director Vaughn Roland described the company’s position on license plate reader searches, data sales and oversight.'},
  {id:'policy-aclu-hb725',title:'ACLU of Ohio testimony opposing substitute HB 725',publisher:'Ohio House Public Safety Committee',url:houseHearing+'19899/sub_hb_725_testimony___aclu_of_ohio___11_17_26.pdf',date:'2026-11-17',kind:'Written opponent testimony',note:'Legislative director Gary Daniels challenged the proposed treatment of search inquiries and access to license plate reader data.'},
  {id:'policy-cisco-dues',title:'Cisco’s 2025 trade association lobbying disclosure',publisher:'Cisco',url:'https://www.cisco.com/c/dam/en_us/about/government-affairs/trade-association-payments.pdf',date:'2025',kind:'Company lobbying disclosure',note:'The table reports the lobbying portion of contributions for qualifying trade associations. TechNet’s entry is $40,590.'},
  {id:'policy-verizon-dues',title:'Verizon 2024 political engagement report',publisher:'Verizon',url:'https://www.verizon.com/about/sites/default/files/2024-Political-Engagement.pdf',date:'2024',kind:'Company lobbying disclosure',note:'The memberships table gives the portion identified for lobbying and lists $47,753 for Technology Network (TechNet).'},
  {id:'policy-google-groups',title:'Trade groups supported by Google’s U.S. public policy team',publisher:'Google',url:'https://services.google.com/fh/files/misc/trade_association_and_third_party_groups.pdf',date:null,kind:'Company disclosure',note:'Google includes TechNet in its list of trade associations and membership organizations receiving substantial support. It gives no amount for the group.'},
  {id:'policy-technet-sb163',title:'TechNet’s proposed changes to Ohio Senate Bill 163',publisher:'Ohio Senate Judiciary Committee',url:senateHearing+'10406/oh_sb163_technet_comments_oppose_final.pdf',date:'2025-06-17',kind:'Written opponent testimony',note:'TechNet’s letter for the June 18 hearing discusses liability for deceptive AI content and how to identify the origin of AI-generated images.'}
];

export const policyChecks = {
  'policy-dovilla-sb243':['130th General Assembly','temporarily allow computer data centers','capital investment','Michael D. Dovilla','March 23, 2015'],
  'policy-flock-hb725':['Vaughn Roland','November 17, 2026','HB 725','auditable logs'],
  'policy-aclu-hb725':['Gary Daniels','Opponent Testimony','House Bill 725','search inquiries'],
  'policy-cisco-dues':['2025','Trade Association','TechNet','40,590'],
  'policy-verizon-dues':['Technology Network','47,753','used for lobbying'],
  'policy-google-groups':['Government Affairs','Trade Associations','TechNet'],
  'policy-technet-sb163':['June 17, 2025','SB 163','assigns liability','provenance','must oppose']
};

const claimReview={status:'reviewed',reviewedAt:'2026-11-20',reviewer:{type:'unknown',identity:null},note:'Checked against the cited original document on November 20, 2026.'};
const node=(id,name,category,role,description,sourceId,x,y,historical=false)=>({id,name,category,role,description,sourceIds:[sourceId],x,y,historical,publicationState:'accepted',claimReview});
const policyNodes=[
  node('ohio-sb243-data-tax','Ohio Senate Bill 243 (2014)','case','Data-center tax exemption deadline','This 2014 law temporarily gave qualifying data centers more time to make the investment required for a sales and use tax exemption. The legislature lists Mike Dovilla as a House cosponsor.','policy-dovilla-sb243',1800,3370,true),
  node('ohio-hb725-alpr','Ohio House Bill 725','case','License plate reader proposal','Ohio lawmakers considered rules for automatic license plate readers. Flock Safety filed written testimony in support at the November 17, 2026 House Public Safety hearing.','policy-flock-hb725',-1900,2900),
  node('aclu-ohio','ACLU of Ohio','institution','Civil liberties organization','The ACLU of Ohio challenged proposed limits on public access to police license plate search records in testimony about Ohio House Bill 725.','policy-aclu-hb725',-1600,2900),
  node('cisco-systems','Cisco Systems','corporation','Technology company','Cisco discloses the lobbying portion of its contributions to trade associations. Its 2025 report lists $40,590 for TechNet.','policy-cisco-dues',2450,2970),
  node('technet','TechNet','institution','Technology industry advocacy group','TechNet advocates for technology companies. In June 2025 it asked an Ohio Senate committee to revise liability and image-origin provisions in an artificial intelligence bill.','policy-technet-sb163',2700,3150),
  node('ohio-sb163-ai','Ohio Senate Bill 163','case','Artificial intelligence legislation','Ohio’s Senate Judiciary Committee heard testimony on proposed rules for deceptive AI-generated media. TechNet submitted written objections to the June 2025 draft and offered amendments.','policy-technet-sb163',2900,3350)
];
const hearing=(day,role)=>({lane:'lobbying',moneyKind:'none',date:{precision:'day',start:day,end:day,role}});
const year=(value,role)=>({precision:'year',start:value+'-01-01',end:value+'-12-31',role});
const policyEvents={
  'policy-01':hearing('2026-11-17','Flock testimony'),
  'policy-02':hearing('2026-11-17','ACLU testimony'),
  'policy-03':{lane:'lobbying',moneyKind:'lobbying-portion',date:year('2025','Company reporting year')},
  'policy-04':{lane:'lobbying',moneyKind:'lobbying-portion',date:year('2024','Company reporting year')},
  'policy-05':{lane:'lobbying',moneyKind:'none',date:{precision:'unknown',start:null,end:null,role:'Undated company support list',observedOn:'2026-11-20',observationRole:'Disclosure checked'}},
  'policy-06':hearing('2025-06-17','Date of TechNet’s letter'),
  'policy-07':{lane:'oversight',moneyKind:'none',date:year('2014','Legislative action')}
};
function edge(id,source,target,type,label,evidence,sourceId,period,locator,caseId,extra={}){
  return {id,source,target,type,label,evidence,sourceIds:[sourceId],period,locator,caseId,historical:true,status:'documented',directional:true,publicationState:'accepted',claimReview,timeline:policyEvents[id],evidenceEntries:[{sourceId,role:'support',locator,excerpt:null}],...extra};
}
const policyEdges=[
  edge('policy-07','mike-dovilla','ohio-sb243-data-tax','influence','Dovilla cosponsored the 2014 tax measure','Ohio’s official bill record lists Michael D. Dovilla as a House cosponsor. SB 243 temporarily extended the capital-investment deadline for qualifying data centers.','policy-dovilla-sb243','130th General Assembly · 2014','Long title, House cosponsors and effective-date note','datacenters'),
  edge('policy-01','flock','ohio-hb725-alpr','influence','Flock supported the plate-reader bill','Vaughn Roland submitted proponent testimony for Flock Safety. He endorsed limits on selling plate data, documented reasons for searches and audit logs.','policy-flock-hb725','November 17, 2026 hearing','Written proponent testimony, opening and closing policy recommendations','alpr'),
  edge('policy-02','aclu-ohio','ohio-hb725-alpr','influence','ACLU opposed the substitute bill','Gary Daniels argued that the public should be able to learn how often and why officials search plate records. He opposed the proposed exemption for those search inquiries.','policy-aclu-hb725','November 17, 2026 hearing','Opponent testimony, discussion of the public-records exemption for search inquiries','alpr'),
  edge('policy-03','cisco-systems','technet','money','Cisco disclosed $40,590 for lobbying','Cisco identified $40,590 of its 2025 TechNet contribution as lobbying spending. The disclosure covers the association overall.','policy-cisco-dues','Calendar year 2025','PDF p. 1, TechNet row and scope note','politics',{status:'acknowledged',amount:40590,amountLabel:'$40,590',unit:'USD · lobbying portion of 2025 association contribution',context:'Cisco gives an annual association-wide amount. An Ohio or bill-specific allocation is unknown.'}),
  edge('policy-04','verizon','technet','money','Verizon disclosed $47,753 for lobbying','Verizon’s 2024 membership disclosure attributes $47,753 to the lobbying portion of its contribution to Technology Network (TechNet).','policy-verizon-dues','Calendar year 2024','PDF p. 37 (printed p. 36), Technology Network row and memberships scope note','politics',{status:'acknowledged',amount:47753,amountLabel:'$47,753',unit:'USD · lobbying portion of 2024 association contribution',context:'The company reports an association-wide amount for 2024. The report gives no allocation to Ohio SB 163.'}),
  edge('policy-05','google','technet','affiliation','Google lists TechNet as a supported trade group','Google lists TechNet among the trade associations supported by its U.S. Government Affairs and Public Policy team. The disclosure does not assign a dollar amount to TechNet.','policy-google-groups','Undated disclosure checked November 20, 2026','PDF pp. 1–2, introductory scope and TechNet entry','politics',{status:'acknowledged'}),
  edge('policy-06','technet','ohio-sb163-ai','influence','TechNet sought changes to Ohio’s AI bill','TechNet opposed the draft of SB 163 in a letter for the Senate Judiciary Committee. It asked lawmakers to place liability on those who misuse AI and proposed changes to how images identify their origin.','policy-technet-sb163','Letter June 17, 2025 · hearing June 18, 2025','Sections on intermediary liability, provenance data and conclusion','politics',{context:'The letter records the association’s position on that draft. It identifies no company payment tied to the testimony.'})
];
// Withhold a record whenever the edition lacks a supporting document or endpoint.
export function policyRelease(verified,existingIds){
  const nodes=policyNodes.filter(n=>n.sourceIds.every(id=>verified.has(id)));
  const ids=new Set([...existingIds,...nodes.map(n=>n.id)]);
  const edges=policyEdges.filter(e=>ids.has(e.source)&&ids.has(e.target)&&e.sourceIds.every(id=>verified.has(id)));
  return {nodes,edges};
}
