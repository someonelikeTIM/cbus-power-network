// Presentation copy only. The original source assertions and qualifications remain in data exports.
const investmentContext='The announcement gives the total financing round. Individual investment amounts and ownership shares were not disclosed.';
export const readerOverrides={
  wtte:{description:'WTTE is a Cunningham station with Sinclair service agreements. The FOX 28 brand and WSYX have separate records; WTTE’s current FOX affiliation is an open reporting question.'},
  ...Object.fromEntries(Array.from({length:10},(_,i)=>['e'+(187+i),{context:investmentContext}])),
  t19:{context:'The announcement describes a historical assistance plan. Execution and payments remain undocumented here. State grants, federal CHIPS funding and later project revisions have separate records.'},
  t35:{context:'This payment is already included in the report’s $11,880,698.25 primary-election total. It is an outside-group payment, separate from candidate receipts.'},
  m07:{context:'Sinclair provides services to the Cunningham station. The available records leave station-specific fees and shared-newsroom staffing unresolved.'},
  m23:{label:'Court requires separate, independent operations'},
  m24:{context:'The Attorney General announced the agreement. Its signed text, duration and compliance history remain reporting questions, alongside the separate federal injunction.'},
  m39:{context:'Advance discloses a Charter shareholding without a percentage. The cited records describe ownership and Charter’s political activities; shareholder involvement in those activities or Business First coverage remains undocumented.'},
  m61:{context:'The general manager announced a programming change for October 26. The year and implementation status remain unresolved.'},
  m63:{context:'Sinclair’s filings and the FCC notice connect its broadcast group to the WSYX license company. Some intermediate subsidiaries remain unresolved.'},
  'media-kimmel':{note:'Sinclair announced a programming decision and a September 19 special. The source includes the company’s explanation; a quid pro quo remains undocumented.'},
  'media-close':{note:'Nexstar announced the completed acquisition and identified Perry Sook as founder, chairman and CEO. Subsequent court orders restrict integration and appear in related records.'}
  ,'trail-oshp-agreement':{note:'DPS020262 attachment: supplier signature April 24, 2024; Ohio signature fields are blank on the posted copy. The agreement takes effect upon a purchase order and lists AWS regions in North Virginia, Ohio and Gov-Cloud West. A specific Columbus facility and payment record remain unresolved.'}
  ,'trail-vivek-fds':{note:'Filed April 6, 2026 for calendar 2025. The scanned pages list income, investments, capital commitments and gift sources, including assets held through a disclosed trust. The filing describes that reporting year; current values and purchase dates remain unresolved.'}
};
export const readerField=(record,field)=>readerOverrides[record.id]?.[field]??record[field]??'';
export const leadStories=[
  {title:'The legal owners behind local TV',text:'Current FCC ownership filings and operating agreements could fill gaps in the license-company chains for six Columbus stations, including the timing of the FOX 28 subchannel change.'},
  {title:'What happened after the Nexstar–TEGNA order?',text:'The latest included court clarification was filed August 6, 2026. Later docket entries and the signed Ohio agreement could show how the companies’ separate operations developed.'},
  {title:'More of Columbus’s media landscape',text:'Ownership and governance records for additional outlets would broaden the picture, including Axios Columbus, WBNS Radio, Spectrum News, Matter News, The Rooster and community media.'},
  {title:'The Dispatch’s corporate chain',text:'Current legal-entity filings, voting disclosures and local newsroom leadership records could connect the newspaper’s publishing group to the organizations operating it today.'},
  {title:'Public-media funding and board appointments',text:'Station financial reports, trustee appointments and underwriting agreements could add current funding and governance detail beyond the included FY2024 accounts.'},
  {title:'Who buys local media advertising?',text:'Political files, advertising invoices and sponsorship agreements could identify named buyers, recipients and amounts. These documents would add a payment trail to the existing organizational records.'},
  {title:'How national programming reaches local stations',text:'Local airing logs, staffing records, news-share agreements and syndication invoices could explain when and how particular programs reached Columbus audiences.'}
];
export const profileCopy={
  wsyx:'The records connect the FCC license company, Sinclair’s corporate group and the Smith voting bloc. Some intermediate subsidiaries remain unresolved.',
  wtte:'Cunningham owns the station; Sinclair provides services under a separate agreement. The Smith-child trusts’ disclosed interests are non-voting, with voting control unresolved.',
  wbns:'TEGNA’s acquisition by Nexstar is accompanied by court restrictions on integration. The included clarification was signed August 5 and filed August 6, 2026.',
  wtvn:'WTVN identifies iHeartMedia as its operating group. Premiere supplies syndicated programming. Current license-company filings would fill in the intermediate ownership chain.',
  dispatch:'The Dispatch appears in USA TODAY Co.’s publication directory. The 2015 newspaper sale and 2019 broadcast sale are separate transactions; the intermediate publishing entities remain unresolved.',
  wcbe:'WCBE is a Columbus City Schools service and NPR member. Its general manager announced a music-format change for October 26, with the year still unresolved.'
};
export function caseHighlights(id,outcomes){
  const omitted=new Set(['Select a link for the dated role, evidence and direction.','Endorsements, public authority, investments and donations are separate records.','Candidates do not acquire the governor’s powers before taking office.','Audits and institutional findings are distinct from criminal convictions.','Ownership, network affiliation, content carriage, funding and editorial action are separate relationship types.','Connections to JobsOhio, Anduril, Charter and Ohio State combine distinct records. No owner/funder direction of a particular local story is inferred.']);
  const readable={
    'Ramaswamy: 2026 gubernatorial nominee; no incumbent governor authority.':'Ramaswamy: nominee in the 2026 governor’s race.',
    'Separate state-award review: 39 of 60 recipients noncompliant; this is not an individual JobsOhio / Anduril finding.':'The Department of Development’s state-award review found 39 of 60 recipients noncompliant.',
    'Vance’s 2025 annual disclosure reports Narya interests and an LLC cash account at Huntington; ranges are not transfers.':'Vance’s 2025 annual disclosure lists value ranges for Narya interests and an LLC cash account at Huntington.',
    'Microsoft names Ames as New Albany contractor; July 2026 site-preparation update does not establish operation.':'Microsoft names Ames as its New Albany contractor; the July 2026 update describes site preparation.'
  };
  return outcomes.filter(text=>!omitted.has(text)).map(text=>readable[text]||text);
}
export const overlapLabel=status=>({'overlap-unknown':'Not established across these links','non-overlapping':'The connections cover different periods','established-overlap':'The recorded periods overlap'})[status]||status;
