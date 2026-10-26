// Money, authority, legal findings, and affiliations are distinct records.
import { sourceArchives } from './archives.js';
import { acceptedCorrections } from './corrections.js';
import { sourceLiveEvidence } from './live-sources.js';
import { cityHallSources, cityHallNodes, cityHallEdges, cityHallCase } from './city-hall.js';
import { enrichmentSources, enrichmentRelease, sportsCase } from './enrichment.js';
import { infrastructureSources, infrastructureRelease, infrastructureCases } from './infrastructure.js';
import { politicalSources, politicalRelease, politicalCase } from './politics.js';
import { flowSources, flowRelease, jobsOhioCase } from './flows.js';
import { trailSources, trailRelease, applyTrailUpdates } from './trails.js';
import { mediaSources, mediaRelease, mediaCase } from './media.js';
import { civicSources, civicRelease } from './civic-enrichment.js';
import { donationSources, donationRelease } from './donation-enrichment.js';
import { campaignSources,campaignRelease,applyCampaignUpdates,campaignCase } from './campaigns-2026.js';
import { epsteinSources,epsteinRelease } from './epstein-enrichment.js';
import { redflexSources,redflexRelease } from './redflex-enrichment.js';
export const meta = {
  title: 'CBUS Power', reviewed: '2026-10-26', version: 17,
  scope: 'Columbus and Ohio: money, control, public corruption, civic affiliations, and media ownership, governance, funding and information supply.',
  limitations: 'Selected records, not complete coverage. Evidence status, source date, and direction are attached to each case relationship. Assets, cash transfers, and penalties are identified separately.'
};

export const categories = {
  politician: { label: 'Officials & candidates', color: '#b45038', short: 'Political figure' },
  person: { label: 'Business & civic leaders', color: '#b78932', short: 'Leader' },
  corporation: { label: 'Corporations', color: '#416d82', short: 'Corporation' },
  institution: { label: 'Organizations & committees', color: '#678373', short: 'Organization' },
  initiative: { label: 'Initiatives', color: '#8772a2', short: 'Initiative' },
  case: { label: 'Laws & proceedings', color: '#994f55', short: 'Law / proceeding' }
};
export const relationships = {
  leadership: { label: 'Leadership & public office', color: '#b78932' },
  board: { label: 'Board & governance', color: '#678373' },
  partnership: { label: 'Collaboration & programs', color: '#416d82' },
  history: { label: 'Historical affiliations', color: '#8772a2' },
  money: { label: 'Money & assets', color: '#ae3c2d' },
  control: { label: 'Control & authority', color: '#282c2a' },
  influence: { label: 'Policy & public benefits', color: '#926d21' },
  allegation: { label: 'Allegations', color: '#8b6f2e' },
  contract: { label: 'Contracts & procurement', color: '#315c72' },
  lobbying: { label: 'Lobbying representation', color: '#775882' },
  endorsement: { label: 'Campaign support', color: '#ad683f' },
  opposition: { label: 'Campaign opposition', color: '#9a4b63' },
  candidacy: { label: 'Elections & candidacy', color: '#9d7852' },
  ownership: {label:'Ownership & parent companies',color:'#344d5a'},
  voting: {label:'Voting interests',color:'#574d78'},
  affiliation: {label:'Network affiliations',color:'#618d9b'},
  content: {label:'Content supply & distribution',color:'#717e45'},
  editorial: {label:'Editorial actions & policies',color:'#9b546e'},
  funding: {label:'Media funding & support',color:'#9a783f'}
};

export const evidenceStatuses = {
  documented: 'Documented record', acknowledged: 'Acknowledged by participant',
  finding: 'SEC finding · settled', conviction: 'Criminal conviction / guilty plea',
  admission: 'Admitted in federal settlement', reported: 'Sourced reporting',
  review: 'Commissioned review / tax records', allegation: 'Allegation',
  charge: 'Criminal charge · no trial verdict',
  authorized: 'Public authorization', registered: 'Lobbying registration', commitment:'Conditional commitment / plan',
  audit: 'Audit / institutional finding'
};

export const allDeclaredSources = [
  { id: 'mayor', title: 'About Mayor Andrew J. Ginther', publisher: 'City of Columbus', url: 'https://www.columbus.gov/Government/Mayors-Office/About-Mayor-Andrew-J.-Ginther', date: null, note: 'Official biography; also documents his 2007–2015 Council service.' },
  { id: 'council', title: 'Columbus City Council directory', publisher: 'City of Columbus', url: 'https://www.columbus.gov/Government/City-Council/Directory', date: null, note: 'Official directory identifying Council members and their roles.' },
  { id: 'linkus', title: 'LinkUS breaks ground on sidewalks, bikeways and trails', publisher: 'COTA', url: 'https://www.cota.com/blog/linkus-moves-forward-with-groundbreaking-to-celebrate-new-sidewalks-bikeways-and-trails/', date: '2026-06-15', note: 'Names the regional partners, COTA CEO, MORPC director and Commissioner Crawley.' },
  { id: 'burger', title: 'Columbus Partnership names Corrine Burger CEO', publisher: 'The Columbus Region', url: 'https://columbusregion.com/press-release/columbus-partnership-names-corrine-burger-chief-executive-officer/', date: '2026-09-10', note: 'CEO appointment, co-chairs, Burger’s other boards, and Partnership programs.' },
  { id: 'steinour', title: 'Stephen D. Steinour — executive biography', publisher: 'Huntington', url: 'https://www.huntington.com/About-Us/ExecutiveManagementTeam/stephen-d-steinour', date: null, note: 'Corporate leadership and named external board appointments.' },
  { id: 'fehrman', title: 'William J. Fehrman — leadership biography', publisher: 'American Electric Power', url: 'https://www.aep.com/about/leadership/fehrman/', date: null, note: 'AEP leadership and Columbus Partnership board service.' },
  { id: 'smart', title: 'About Smart Columbus', publisher: 'Smart Columbus', url: 'https://smartcolumbus.com/about', date: null, note: 'Board roster, organization structure, and named collaborators. Burger is still described as interim CEO on this page; the September appointment release supersedes that title.' },
  { id: 'wexner-story', title: 'Our story', publisher: 'The Wexner Foundation', url: 'https://www.wexnerfoundation.org/our-story/', date: null, note: 'Foundation history and Les and Abigail Wexner’s past co-chair and funding roles.' },
  { id: 'wexner-structure', title: 'Our structure and funding', publisher: 'The Wexner Foundation', url: 'https://www.wexnerfoundation.org/our-structure/', date: null, note: 'Origins of Leslie Wexner’s foundation initiatives in the early 1980s.' },
  { id: 'lbrands-2020', title: 'L Brands 2020 proxy statement', publisher: 'L Brands / Bath & Body Works investor archive', url: 'https://investors.bbwinc.com/node/7006/html', date: '2020', note: 'Historical founding and director information; not a current board roster.' },
  { id: 'lbrands-2021', title: 'L Brands 2021 proxy statement', publisher: 'L Brands / Bath & Body Works investor archive', url: 'https://investors.bbwinc.com/node/7501/html', date: '2021', note: 'Announces Les and Abigail Wexner’s board retirement effective May 20, 2021.' },
  { id: 'rename', title: 'Bath & Body Works 2021 annual report', publisher: 'Bath & Body Works', url: 'https://investors.bbwinc.com/static-files/c3c3a26a-7533-4870-84ae-5245f5908b43', date: '2021', note: 'L Brands name change, August 2, 2021.' },
  { id: 'aep-order', title: 'SEC order: AEP and Empowering Ohio', publisher: 'SEC', url: 'https://www.sec.gov/Archives/edgar/data/4904/000000490425000015/a01-2025aepex991hb6.htm', date: '2025-01-17', note: 'File 3-22425. Formation, funding, spending control, and political payments. AEP settled without admitting or denying the findings.' },
  { id: 'aep-sec', title: 'AEP fraudulent-disclosure charges and $19m settlement', publisher: 'SEC', url: 'https://www.sec.gov/enforcement-litigation/administrative-proceedings/33-11356-s', date: '2025-01-17', note: 'Misleading disclosures about Empowering Ohio; $19m civil penalty.' },
  { id: 'eoe-money', title: 'Empowering Ohio payments to Generation Now', publisher: 'Energy and Policy Institute', url: 'https://energyandpolicy.org/aep-dark-money/', date: '2020', kind: 'Investigative reporting', note: 'IRS filings: $8.7m AEP funding; $700,000 to Generation Now in 2017–2019. Corrected 2019 total excludes an uncashed $250,000 check.' },
  { id: 'gn-bank', title: 'Generation Now bank records', publisher: 'Energy and Policy Institute', url: 'https://energyandpolicy.org/larry-householder-dark-money/', date: '2023', kind: 'Investigative reporting / bank records', note: 'Six Empowering Ohio checks totaling $700,000; trial bank exhibits.' },
  { id: 'hb6-verdict', title: 'Householder and Borges racketeering verdict', publisher: 'U.S. Department of Justice', url: 'https://www.justice.gov/usao-sdoh/pr/jury-convicts-former-ohio-house-speaker-former-chair-ohio-republican-party', date: '2023-03-09', note: 'Nearly $61m bribery scheme: Speaker election, HB 6 passage, and defeat of repeal petition.' },
  { id: 'householder-sentence', title: 'Householder sentenced to 20 years', publisher: 'U.S. Department of Justice', url: 'https://www.justice.gov/usao-sdoh/pr/former-ohio-house-speaker-sentenced-20-years-prison-leading-racketeering-conspiracy', date: '2023-06-29', note: 'Sentence and trial findings; more than $500,000 for Householder’s personal expenses.' },
  { id: 'fe-admission', title: 'FirstEnergy bribery admission and $230m penalty', publisher: 'U.S. Department of Justice', url: 'https://www.justice.gov/usao-sdoh/pr/firstenergy-charged-federally-agrees-terms-deferred-prosecution-settlement', date: '2021-07-22', note: 'Deferred prosecution agreement; company admitted conspiracy to bribe public officials.' },
  { id: 'les-letter', title: 'Wexner’s statement on Epstein', publisher: 'Les Wexner / Wexner Foundation', url: 'https://www.wexnerfoundation.org/letter-from-les/', date: '2019-08-08', kind: 'Participant statement', note: 'Acknowledges personal financial management, power of attorney, and Foundation trusteeship; alleges misappropriation.' },
  { id: 'wexner-review', title: 'Wexner Foundation commissioned review', publisher: 'Wexner Foundation / Wexner & Epstein review', url: 'https://www.wexnerfoundation.org/wp-content/uploads/Wexner-Foundation-Report-Following-Independent-Review4.pdf', date: '2020', kind: 'Commissioned review', note: 'Printed pages 9 and 13–14: trusteeship and $46,657,998 in assets sent by COUQ and FTC to YLK. Repayment explanation is the Wexners’ account.' },
  { id: 'epstein-charges', title: 'Epstein federal sex-trafficking indictment', publisher: 'U.S. Department of Justice', url: 'https://www.justice.gov/usao-sdny/pr/jeffrey-epstein-charged-manhattan-federal-court-sex-trafficking-minors', date: '2019-07-08', note: 'Charges involving minors; Epstein died before trial.' },
  { id: 'epstein-plea', title: '2008 Epstein state guilty plea — court record', publisher: 'Florida court record / DOJ archive', url: 'https://www.justice.gov/multimedia/Court%20Records/State%20of%20Florida%20v.%20Epstein%2C%20No.%2050-2008-CF-009381-AXXX-MB%20%28Fla.%2015th%20Cir.%20Ct.%202008%29/060.pdf', date: '2008', note: 'Guilty plea to solicitation/procurement charges involving a minor. DOJ archive may require age verification.' },
  { id: 'epstein-death', title: 'Epstein died before federal trial', publisher: 'U.S. Department of Justice', url: 'https://www.justice.gov/usao-sdny/pr/statement-manhattan-us-attorney-death-defendant-jeffrey-epstein', date: '2019-08-10', note: 'Death while federal sex-trafficking charges were pending.' },
  {id:'redflex-plea',title:'Finley guilty plea: camera-contract bribery scheme',publisher:'U.S. Department of Justice',url:'https://www.justice.gov/archives/opa/pr/former-ceo-pleads-guilty-bribery-and-fraud-scheme-involving-red-light-camera-contracts',date:'2015-06-19',note:'Finley admitted conduit contributions, false invoices, and contracts in Columbus and Cincinnati.'},
  {id:'redflex-npa',title:'Redflex non-prosecution agreement; Raphael extortion plea',publisher:'U.S. Department of Justice',url:'https://www.justice.gov/usao-sdoh/pr/redflex-traffic-systems-enters-non-prosecution-agreement-united-states',date:'2016-12-27',note:'DOJ identifies John Raphael and his guilty plea; corporate non-prosecution agreement.'},
  {id:'redflex-ginther',title:'Ginther campaign donation crosscheck and response',publisher:'WOSU Public Media',url:'https://www.wosu.org/news/2015-06-22/ginther-im-not-a-target-of-a-redflex-investigation',date:'2015-06-22',kind:'Reporting / campaign-finance crosscheck',note:'Reported $21,000 ODP contribution in 2011. Ginther denied requesting that contribution; acknowledged asking Redflex for support. Court record did not name him.'},
  ...cityHallSources, ...enrichmentSources, ...infrastructureSources, ...politicalSources, ...flowSources, ...trailSources, ...mediaSources, ...civicSources, ...donationSources, ...campaignSources, ...epsteinSources, ...redflexSources
].map((s,index) => {
  const archived = sourceArchives[s.id];
  const pinned = archived?.contentVerified === true && archived.originalUrl === s.url && /^\d{14}$/.test(archived.timestamp || '') && archived.url?.startsWith(`https://web.archive.org/web/${archived.timestamp}/`);
  const live=sourceLiveEvidence[s.id];
  const liveVerified=live?.contentVerified===true&&live.originalUrl===s.url;
  const contentCheckedAt=pinned?archived.checkedAt:liveVerified?live.checkedAt:null;
  return {...s,reviewed:s.reviewed||(index<12?'2026-10-11':contentCheckedAt?.slice(0,10)||meta.reviewed),kind:s.kind||'Primary source',archiveUrl:pinned?archived.url:null,archiveTimestamp:pinned?archived.timestamp:null,archiveBrowseUrl:`https://web.archive.org/web/*/${s.url}`,archiveStatus:pinned?'pinned':'pending',liveVerified,sourceFormat:pinned?'archive':liveVerified?'original':'unverified',contentCheckedAt};
});
export const sources=allDeclaredSources.filter(s=>s.archiveUrl||s.liveVerified);
const verifiedSourceIds=new Set(sources.map(s=>s.id));
const release=enrichmentRelease(verifiedSourceIds);
meta.enrichmentState=release.complete?'complete':'verified subset';
meta.pendingSourceIds=[...enrichmentSources,...infrastructureSources,...politicalSources,...flowSources,...trailSources,...mediaSources,...civicSources,...donationSources,...epsteinSources,...redflexSources].filter(s=>!verifiedSourceIds.has(s.id)).map(s=>s.id);
const capitalReady=verifiedSourceIds.has('city-capital-2025');

// Positions are an editorial layout only; distance does not encode relationship strength.
const n = (id, name, category, role, description, x, y, sourceIds, historical = false) => ({ id, name, category, role, description, x, y, sourceIds, historical });
export const nodes = [
  n('city', 'City of Columbus', 'institution', 'Municipal government', '', 250, 350, ['mayor', 'council', 'linkus']),
  n('ginther', 'Andrew Ginther', 'politician', 'Mayor of Columbus', 'The city’s official biography lists Ginther as its 53rd mayor, serving his third term.', 100, 460, ['mayor']),
  n('council', 'Columbus City Council', 'institution', 'City Council', 'The city’s elected Council. This starting map includes three members from the official directory.', 180, 170, ['council']),
  n('hardin', 'Shannon Hardin', 'politician', 'Council president · District 9', 'Listed as president of Columbus City Council in the city’s directory.', 60, 70, ['council']),
  n('dorans', 'Rob Dorans', 'politician', 'Council president pro tem · District 3', 'Listed as president pro tem of Columbus City Council.', 250, 45, ['council']),
  n('bankston', 'Nicholas Bankston', 'politician', 'Councilmember · District 5', 'Listed as the District 5 Councilmember in the city’s directory.', 355, 140, ['council']),
  n('county', 'Franklin County', 'institution', 'Board of Commissioners', 'The county’s Board of Commissioners is named as a LinkUS partner.', 110, 650, ['linkus']),
  n('crawley', 'Erica Crawley', 'politician', 'Franklin County commissioner', 'Identified as a county commissioner in COTA’s June 2026 LinkUS announcement.', 55, 780, ['linkus']),
  n('linkus', 'LinkUS', 'initiative', 'Regional transportation initiative', 'COTA documents a regional collaboration involving city, county, planning and business institutions.', 325, 690, ['linkus']),
  n('cota', 'COTA', 'institution', 'Central Ohio Transit Authority', 'The transit authority publishing the LinkUS project announcement and a named initiative partner.', 400, 835, ['linkus']),
  n('monica', 'Monica Téllez-Fowler', 'person', 'COTA president & CEO', 'Named as COTA president and CEO in its June 2026 announcement.', 585, 875, ['linkus']),
  n('morpc', 'MORPC', 'institution', 'Mid-Ohio Regional Planning Commission', 'The regional planning commission appears in both LinkUS and Smart Columbus relationships.', 545, 725, ['linkus', 'smart']),
  n('murdock', 'William Murdock', 'person', 'MORPC executive director', 'Named as MORPC executive director and listed on the Smart Columbus board.', 745, 825, ['linkus', 'smart']),
  n('partnership', 'Columbus Partnership', 'institution', 'Business & civic leadership organization', 'Founded in 2002 by Les Wexner, Jack Kessler, and John F. Wolfe.', 670, 350, ['burger', 'fehrman', 'linkus','partnership-founders']),
  n('burger', 'Corrine Burger', 'person', 'Columbus Partnership CEO', 'Appointed CEO effective September 10, 2026. The appointment release also lists four external boards.', 850, 180, ['burger', 'smart']),
  n('one-columbus', 'One Columbus', capitalReady?'institution':'initiative', capitalReady?'Private economic-development nonprofit · formerly Columbus 2020':'Regional economic development', capitalReady?'The city authorized up to $1.3m in 2025 grant support.':'Named as part of the Columbus Partnership team in its September 2026 announcement.', 515, 180, capitalReady?['burger','city-capital-2025']:['burger']),
  n('smart-columbus', 'Smart Columbus', 'initiative', 'Civic innovation lab', 'Part of the Columbus Partnership, with its own board and public, private and nonprofit collaborators.', 470, 495, ['smart', 'burger']),
  n('nationwide', 'Nationwide', 'corporation', 'Insurance & financial services', 'Mapped through its CEO, Corrine Burger’s board service and Smart Columbus collaboration.', 930, 355, ['burger', 'smart']),
  n('walker', 'Kirt Walker', 'person', 'Nationwide CEO · Partnership co-chair', 'The September 2026 Partnership announcement identifies both leadership roles.', 850, 520, ['burger']),
  n('huntington', 'Huntington', 'corporation', 'Huntington Bancshares Incorporated', 'The bank holding company led by Stephen Steinour; also listed as a Smart Columbus collaborator.', 895, 750, ['steinour', 'smart']),
  n('steinour', 'Stephen Steinour', 'person', 'Huntington chairman & CEO', 'His official biography records several board appointments alongside his corporate leadership.', 1070, 605, ['steinour']),
  n('aep', 'American Electric Power', 'corporation', 'Utility · Empowering Ohio’s sole funder', 'The SEC found AEP formed, funded, and controlled Empowering Ohio’s spending.', 635, 540, ['fehrman', 'smart', 'aep-order', 'aep-sec', 'eoe-money']),
  n('fehrman', 'Bill Fehrman', 'person', 'AEP chairman, president & CEO', 'AEP’s official biography also lists him on the Columbus Partnership board.', 710, 650, ['fehrman']),
  n('battelle', 'Battelle', 'institution', 'Battelle Memorial Institute', 'Mapped through Steinour’s board service and Smart Columbus’s collaborator list.', 1210, 410, ['steinour', 'smart']),
  n('bbw', 'Bath & Body Works', 'corporation', 'Bath & Body Works, Inc.', 'Steinour’s biography lists board service. The company’s annual report records its 2021 name change from L Brands.', 1210, 730, ['steinour', 'rename']),
  n('medical', 'OSU Wexner Medical Center', 'institution', 'University medical center', 'Mapped through Steinour’s documented trustee appointment.', 1280, 555, ['steinour']),
  n('children', 'Nationwide Children’s', 'institution', 'Nationwide Children’s Hospital', 'Burger’s September 2026 appointment announcement lists her on the hospital’s board.', 1130, 245, ['burger']),
  n('cstate', 'Columbus State', 'institution', 'Columbus State Community College', 'Burger’s September 2026 announcement lists her on the college’s board.', 1020, 50, ['burger']),
  n('airport', 'Regional Airport Authority', 'institution', 'Columbus Regional Airport Authority', 'Burger’s September 2026 announcement lists her on the authority’s board.', 1220, 95, ['burger']),
  n('lbrands', 'L Brands', 'corporation', 'Historical company name · through 2021', 'The company changed its name to Bath & Body Works, Inc. in August 2021. Historical affiliations are attached to this historical entity.', 1280, 875, ['lbrands-2020', 'lbrands-2021', 'rename'], true),
  n('les', 'Les Wexner', 'person', 'Partnership chairman emeritus · L Brands founder', 'Wexner acknowledged giving Epstein power of attorney and control of his personal finances; says he severed ties in 2007.', 1090, 945, ['lbrands-2020', 'les-letter','partnership-founders','new-albany-company']),
  n('abigail', 'Abigail Wexner', 'person', 'Philanthropist · former L Brands director', 'Foundation history records her funding and past co-chair role. The 2021 proxy announced her retirement from the L Brands board.', 850, 1000, ['wexner-story', 'lbrands-2021']),
  n('foundation', 'Wexner Foundation', 'institution', 'Foundation · Epstein trustee, 1992–2007', 'Corporate records reviewed in the commissioned report place Epstein on the board from December 15, 1992 to September 4, 2007.', 1010, 1100, ['wexner-story', 'wexner-structure', 'wexner-review']),
  n('epstein', 'Jeffrey Epstein', 'person', 'Wexner money manager · convicted sex offender', '2008 guilty plea involving a minor. Federal sex-trafficking charges in 2019; died before trial.', 1480, 1000, ['les-letter', 'epstein-plea', 'epstein-charges', 'epstein-death'], true),
  n('empowering', 'Empowering Ohio’s Economy', 'institution', 'AEP-funded 501(c)(4)', 'AEP formed and controlled this nonprofit; its payments reached Householder’s political network.', 400, 1240, ['aep-order', 'eoe-money', 'gn-bank'], true),
  n('generation-now', 'Generation Now', 'institution', 'Householder-controlled 501(c)(4) · RICO guilty plea', 'Political spending conduit in the HB 6 bribery scheme. Pleaded guilty to racketeering.', 740, 1260, ['aep-order', 'hb6-verdict'], true),
  n('householder', 'Larry Householder', 'politician', 'Former Ohio House Speaker · racketeering conviction', 'Convicted March 9, 2023; sentenced to 20 years on June 29, 2023.', 1070, 1280, ['hb6-verdict', 'householder-sentence'], true),
  n('firstenergy', 'FirstEnergy', 'corporation', 'Utility · admitted bribery conspiracy', 'Admitted conspiracy to bribe officials; agreed to a $230m federal penalty in 2021.', 720, 1490, ['fe-admission', 'hb6-verdict']),
  n('hb6', 'Ohio House Bill 6', 'case', '2019 energy bailout legislation', 'Passage and protection from repeal were objectives of the proven Householder bribery scheme.', 1150, 1490, ['hb6-verdict', 'aep-order'], true),
  n('sec', 'SEC', 'institution', 'Securities and Exchange Commission', 'Ordered a $19m civil penalty against AEP in January 2025.', 250, 1480, ['aep-sec']),
  n('financial-trust', 'Financial Trust Company', 'corporation', 'Epstein-owned financial company', 'The commissioned review identifies Epstein as sole shareholder and records the transfer of Apple shares to YLK.', 1660, 1270, ['wexner-review'], true),
  n('couq', 'C.O.U.Q. Foundation', 'institution', 'Epstein-associated foundation', 'Transferred assets to YLK in January 2008.', 1510, 1500, ['wexner-review'], true),
  n('ylk', 'YLK Charitable Fund', 'institution', 'Abigail Wexner’s private foundation', 'Formed December 20, 2007; received $46,657,998 in asset book value from COUQ and Financial Trust Company in 2008.', 1850, 1490, ['wexner-review'], true),
  n('resource-fuels','Resource Fuels','corporation','Donor company','',360,1660,['gn-bank'],true),
  n('boich-donors','Wayne & Cynthia Boich','person','Donors named on check','',620,1680,['gn-bank'],true),
  n('karen-trust','Karen Buchwald Wright trust','institution','Revocable trust; donor','Karen Buchwald Wright led Ariel in 2018.',920,1700,['gn-bank'],true),
  n('penn-national','Penn National Gaming','corporation','Gaming company; donor','',1270,1690,['gn-bank'],true),
  n('fair-gaming','Fair Gaming Coalition of Ohio','institution','Gaming advocacy group; donor','',1520,1670,['gn-bank'],true),
  n('jack-entertainment','Jack Entertainment','corporation','Gaming company; donor','',1800,1660,['gn-bank'],true),
  n('charter','Charter Communications','corporation','Telecommunications company; donor','',1350,1900,['gn-bank'],true),
  n('att','AT&T','corporation','Telecommunications company; donor','',900,1900,['gn-bank'],true),
  n('redflex','Redflex Traffic Systems','corporation','Camera vendor · corporate NPA in 2016','',350,2100,['redflex-plea','redflex-npa'],true),
  n('raphael','John Raphael','person','Columbus lobbyist · extortion guilty plea','DOJ describes cash extorted for campaign conduits and camera contracts.',680,2100,['redflex-npa'],true),
  n('finley','Karen Finley','person','Former Redflex CEO · bribery/fraud guilty plea','Pleaded guilty June 19, 2015.',350,2360,['redflex-plea'],true),
  n('ohio-democrats','Ohio Democratic Party','institution','Party campaign-funding route','',1050,2100,['redflex-ginther'],true),
  n('ginther-campaign','Ginther campaign (2011)','institution','Council campaign; reported party contribution','WOSU compared campaign reports with court records.',1370,2100,['redflex-ginther'],true),
  ...cityHallNodes, ...release.nodes
];

const e = (id, source, target, type, label, evidence, sourceIds, period = 'Listed in reviewed source', historical = false, details = {}) => ({ id, source, target, type, label, evidence, sourceIds, period, historical, status: 'documented', directional: false, ...details });
nodes.find(n => n.id === 'aep').aliases = ['AEP', 'AEP Ohio'];
nodes.find(n => n.id === 'empowering').aliases = ['Empower Ohio'];
nodes.find(n=>n.id==='boich-donors').aliases=['Wayne Boich','Cynthia Boich'];
export const edges = [
  e('e01', 'ginther', 'city', 'leadership', 'Mayor', 'The city biography identifies Ginther as mayor, serving his third term.', ['mayor']),
  e('e02', 'council', 'city', 'leadership', 'City Council', 'The official city government directory identifies Columbus City Council.', ['council']),
  e('e03', 'hardin', 'council', 'leadership', 'Council president', 'Listed as Council president for District 9.', ['council']),
  e('e04', 'dorans', 'council', 'leadership', 'President pro tem', 'Listed as president pro tem for District 3.', ['council']),
  e('e05', 'bankston', 'council', 'leadership', 'Councilmember', 'Listed as the District 5 Councilmember.', ['council']),
  e('e06', 'ginther', 'council', 'history', 'Former Councilmember', 'The mayor’s biography records Council service from 2007 to 2015, including five years as president.', ['mayor'], '2007–2015', true),
  e('e07', 'crawley', 'county', 'leadership', 'County commissioner', 'COTA’s June 2026 release names Erica Crawley as county commissioner.', ['linkus'], 'Documented June 2026'),
  e('e08', 'city', 'linkus', 'partnership', 'Regional partner', 'COTA names the City of Columbus as a LinkUS partner.', ['linkus'], 'Documented June 2026'),
  e('e09', 'county', 'linkus', 'partnership', 'Regional partner', 'COTA names the Franklin County Board of Commissioners as a LinkUS partner.', ['linkus'], 'Documented June 2026'),
  e('e10', 'cota', 'linkus', 'partnership', 'Transit partner', 'COTA describes its role alongside the regional LinkUS partners.', ['linkus'], 'Documented June 2026'),
  e('e11', 'morpc', 'linkus', 'partnership', 'Planning partner', 'COTA names the Mid-Ohio Regional Planning Commission as a LinkUS partner.', ['linkus'], 'Documented June 2026'),
  e('e12', 'partnership', 'linkus', 'partnership', 'Regional partner', 'COTA names the Columbus Partnership among the LinkUS partners.', ['linkus'], 'Documented June 2026'),
  e('e13', 'monica', 'cota', 'leadership', 'President & CEO', 'The release identifies Monica Téllez-Fowler as COTA president and CEO.', ['linkus'], 'Documented June 2026'),
  e('e14', 'murdock', 'morpc', 'leadership', 'Executive director', 'COTA’s release and Smart Columbus’s board roster identify Murdock’s MORPC role.', ['linkus', 'smart']),
  e('e15', 'burger', 'partnership', 'leadership', 'CEO', 'The appointment announcement names Burger CEO, effective immediately on September 10, 2026.', ['burger'], 'Appointed September 10, 2026'),
  e('e16', 'walker', 'partnership', 'board', 'Co-chair', 'The September 2026 announcement identifies Walker as Partnership co-chair.', ['burger'], 'Documented September 2026'),
  e('e17', 'walker', 'nationwide', 'leadership', 'CEO', 'The same announcement identifies Walker as Nationwide CEO.', ['burger'], 'Documented September 2026'),
  e('e18', 'steinour', 'partnership', 'board', 'Co-chair & governing board', 'Huntington’s biography lists Partnership co-chair and governing board service.', ['steinour']),
  e('e19', 'steinour', 'huntington', 'leadership', 'Chairman & CEO', 'Huntington’s executive biography identifies Steinour’s leadership role.', ['steinour']),
  e('e20', 'fehrman', 'aep', 'leadership', 'Chairman, president & CEO', 'AEP’s biography lists Fehrman’s corporate leadership roles.', ['fehrman']),
  e('e21', 'fehrman', 'partnership', 'board', 'Board member', 'AEP’s biography lists the Columbus Partnership among Fehrman’s boards.', ['fehrman']),
  e('e22', 'steinour', 'battelle', 'board', 'Director', 'Huntington’s biography lists Battelle Memorial Institute board service.', ['steinour']),
  e('e23', 'steinour', 'bbw', 'board', 'Director', 'Huntington’s biography lists Bath & Body Works board service.', ['steinour']),
  e('e24', 'steinour', 'medical', 'board', 'Trustee', 'Huntington’s biography lists medical center trustee service and audit committee chairmanship.', ['steinour']),
  e('e25', 'burger', 'nationwide', 'board', 'Board member', 'The appointment announcement lists Nationwide among Burger’s boards.', ['burger'], 'Documented September 2026'),
  e('e26', 'burger', 'children', 'board', 'Board member', 'The announcement lists Nationwide Children’s Hospital among Burger’s boards.', ['burger'], 'Documented September 2026'),
  e('e27', 'burger', 'cstate', 'board', 'Board member', 'The announcement lists Columbus State Community College among Burger’s boards.', ['burger'], 'Documented September 2026'),
  e('e28', 'burger', 'airport', 'board', 'Board member', 'The announcement lists Columbus Regional Airport Authority among Burger’s boards.', ['burger'], 'Documented September 2026'),
  e('e29', 'partnership', 'one-columbus', 'partnership', 'Organizational program', 'The September 2026 announcement places One Columbus within the Partnership team.', ['burger'], 'Documented September 2026'),
  e('e30', 'partnership', 'smart-columbus', 'partnership', 'Organizational program', 'Smart Columbus describes itself as part of the Columbus Partnership; the appointment announcement also names the program.', ['smart', 'burger']),
  e('e31', 'burger', 'smart-columbus', 'board', 'Board co-chair', 'Smart Columbus’s board roster lists Burger as co-chair. Its interim CEO title is superseded by the September appointment release.', ['smart', 'burger']),
  e('e32', 'murdock', 'smart-columbus', 'board', 'Board member', 'Murdock is named on the Smart Columbus board roster.', ['smart']),
  e('e33', 'city', 'smart-columbus', 'partnership', 'Listed collaborator', 'Smart Columbus includes the City of Columbus in its collaborator list.', ['smart']),
  e('e34', 'county', 'smart-columbus', 'partnership', 'Listed collaborator', 'Smart Columbus includes the county Board of Commissioners in its collaborator list.', ['smart']),
  e('e35', 'aep', 'smart-columbus', 'partnership', 'Listed collaborator', 'Smart Columbus includes AEP in its collaborator list. This does not specify a financial relationship.', ['smart']),
  e('e36', 'huntington', 'smart-columbus', 'partnership', 'Listed collaborator', 'Smart Columbus includes Huntington in its collaborator list.', ['smart']),
  e('e37', 'nationwide', 'smart-columbus', 'partnership', 'Listed collaborator', 'Smart Columbus includes Nationwide in its collaborator list.', ['smart']),
  e('e38', 'battelle', 'smart-columbus', 'partnership', 'Listed collaborator', 'Smart Columbus includes Battelle in its collaborator list.', ['smart']),
  e('e39', 'morpc', 'smart-columbus', 'partnership', 'Listed collaborator', 'Smart Columbus includes MORPC in its collaborator list.', ['smart']),
  e('e40', 'les', 'lbrands', 'history', 'Founder', 'The 2020 proxy records Wexner’s founding of the company in 1963.', ['lbrands-2020'], 'Founded 1963 · historical entity', true),
  e('e41', 'abigail', 'lbrands', 'history', 'Former director', 'The 2021 proxy announced Abigail Wexner’s retirement from the L Brands board effective May 20, 2021.', ['lbrands-2021'], 'Retired May 20, 2021', true),
  e('e42', 'lbrands', 'bbw', 'history', 'Corporate name change', 'The annual report records that L Brands changed its corporate name to Bath & Body Works, Inc. effective August 2, 2021.', ['rename'], 'August 2, 2021', true),
  e('e43', 'les', 'foundation', 'history', 'Founding initiatives', 'The foundation describes Leslie Wexner initiating its leadership development work in the early 1980s.', ['wexner-structure'], 'Early 1980s', true),
  e('e44', 'abigail', 'foundation', 'history', 'Past co-chair & funding', 'The foundation’s history describes Abigail and Les as co-chairs providing strategic direction and funding during its 1990–2011 growth period.', ['wexner-story'], 'Described in 1990–2011 history', true),
  e('e45', 'les', 'epstein', 'control', 'Granted power of attorney', 'Wexner acknowledged granting Epstein broad authority over his personal finances.', ['les-letter'], 'Before 2007 · acknowledged August 2019', true, {caseId:'epstein',status:'acknowledged',directional:true,locator:'Letter, paragraphs 4–6'}),
  e('e46', 'epstein', 'les', 'control', 'Managed personal finances', 'Wexner says Epstein managed his personal finances until they severed ties in early fall 2007.', ['les-letter'], 'Relationship ended 2007, per Wexner', true, {caseId:'epstein',status:'acknowledged',directional:true}),
  e('e47', 'epstein', 'foundation', 'board', 'Foundation trustee', 'The commissioned review records Epstein’s trustee term from December 15, 1992 to September 4, 2007.', ['wexner-review', 'les-letter'], '1992–2007', true, {caseId:'epstein',status:'review',locator:'Printed page 9'}),
  e('e48', 'aep', 'empowering', 'money', '$8.7m in funding', 'Investigative reporting, IRS filings, and a cited AEP CEO statement identify $8.7m in funding since 2015.', ['eoe-money'], '2015–2019, as reported in 2020', true, {caseId:'hb6',status:'reported',directional:true,amount:8700000,amountLabel:'$8.7m',unit:'USD funding'}),
  e('e49', 'aep', 'empowering', 'control', 'Formed & controlled spending', 'The SEC found AEP formed Empowering Ohio, fully funded it, and directed its political spending.', ['aep-order'], 'December 2014–July 2020', true, {caseId:'hb6',status:'finding',directional:true,locator:'SEC order §§5–8',context:'AEP settled without admitting or denying the SEC findings.'}),
  e('e50', 'empowering', 'generation-now', 'money', '$700,000 in payments', 'IRS filings and trial bank records identify six checks totaling $700,000. The 2019 total excludes an uncashed $250,000 check.', ['gn-bank', 'eoe-money', 'aep-order'], '2017–2019', true, {caseId:'hb6',status:'reported',directional:true,amount:700000,amountLabel:'$700k',unit:'USD payments',locator:'Bank checks; 2019 amended Form 990; SEC order §§8–9'}),
  e('e51', 'householder', 'generation-now', 'control', 'Controlled political spending', 'The SEC identifies Generation Now as controlled by Householder. Trial findings describe its spending to elect him Speaker and pass HB 6.', ['aep-order', 'hb6-verdict'], '2017–2020 · verdict 2023', true, {caseId:'hb6',status:'conviction',directional:true}),
  e('e52', 'firstenergy', 'generation-now', 'money', 'Bribery payments · admitted', 'FirstEnergy admitted paying millions through the official’s 501(c)(4) for nuclear legislation. The nearly $61m verdict figure describes the overall scheme, not this donor’s bank-deposit total.', ['fe-admission', 'hb6-verdict'], 'Scheme 2017–2020 · admission July 2021', true, {caseId:'hb6',status:'admission',directional:true,graphLabel:'Bribery payments'}),
  e('e53', 'generation-now', 'householder', 'money', '> $500,000 personal expenses', 'Trial findings identify more than $500,000 spent on Householder’s credit cards, Florida home repairs, and a business lawsuit.', ['householder-sentence'], 'Scheme 2017–2020 · sentencing June 2023', true, {caseId:'hb6',status:'conviction',directional:true,amountLabel:'>$500k',unit:'USD · lower bound'}),
  e('e54', 'generation-now', 'hb6', 'influence', 'Funded passage & blocked repeal', 'The proven scheme funded passage of HB 6 and efforts to defeat the ballot petition to overturn it.', ['hb6-verdict'], '2019–2020 · verdict March 2023', true, {caseId:'hb6',status:'conviction',directional:true}),
  e('e55', 'hb6', 'aep', 'influence', 'Legislation benefited AEP', 'The SEC found HB 6 included provisions beneficial to AEP when its employee directed political payments.', ['aep-order'], '2019 legislation · SEC findings 2025', true, {caseId:'hb6',status:'finding',directional:true,locator:'SEC order §8',context:'AEP settled without admitting or denying the SEC findings.'}),
  e('e56', 'aep', 'sec', 'money', '$19m civil penalty', 'AEP agreed to a $19m penalty for misleading disclosures and related securities-law violations.', ['aep-sec'], 'January 17, 2025 settlement', true, {caseId:'hb6',status:'finding',directional:true,amount:19000000,amountLabel:'$19m',unit:'USD civil penalty',context:'Settlement without admission or denial; this was a civil SEC proceeding.'}),
  e('e57', 'epstein', 'financial-trust', 'control', 'Sole shareholder', 'The commissioned review cites court records identifying Epstein as sole shareholder of Financial Trust Company.', ['wexner-review'], 'Recorded in review of 2008 transfers', true, {caseId:'epstein',status:'review',directional:true,locator:'Printed page 14'}),
  e('e58', 'epstein', 'couq', 'control', 'Associated foundation', 'The review identifies COUQ as Epstein’s charitable foundation.', ['wexner-review'], 'Documented for January 2008 transfer', true, {caseId:'epstein',status:'review',directional:true,locator:'Printed page 13'}),
  e('e59', 'financial-trust', 'ylk', 'money', '$34.28m in Apple shares', 'YLK’s 2008 tax return, as reviewed in the commissioned report, records 201,939 Apple shares with book value $34,280,154.', ['wexner-review'], 'January 2008', true, {caseId:'epstein',status:'review',directional:true,amount:34280154,amountLabel:'$34.28m',unit:'USD book value · shares',locator:'Printed page 14'}),
  e('e60', 'couq', 'ylk', 'money', '$12.38m in assets', 'The report records $12,377,844 in asset value transferred to YLK on January 1, 2008.', ['wexner-review'], 'January 1, 2008', true, {caseId:'epstein',status:'review',directional:true,amount:12377844,amountLabel:'$12.38m',unit:'USD asset value',locator:'Printed pages 13–14'}),
  e('e61', 'abigail', 'ylk', 'control', 'Founded private foundation', 'The report records Abigail Wexner’s formation of YLK on December 20, 2007.', ['wexner-review'], 'December 20, 2007', true, {caseId:'epstein',status:'review',directional:true,locator:'Printed page 13'}),
  e('e62', 'les', 'epstein', 'allegation', 'Misappropriation alleged by Wexner', 'Wexner alleged Epstein misappropriated family money and described the charitable-fund transfers as partial recovery.', ['les-letter'], 'Alleged discovery in 2007 · statement August 2019', true, {caseId:'epstein',status:'allegation',directional:false}),
  e('e63','resource-fuels','generation-now','money','$250,000 wire','Bank records identify this wire payment.', ['gn-bank'],'April 2018',true,{caseId:'hb6',status:'reported',directional:true,amount:250000,amountLabel:'$250k',unit:'USD wire',locator:'Resource Fuels bank exhibit'}),
  e('e64','boich-donors','generation-now','money','$25,000 check','Bank records identify a check from both named donors.', ['gn-bank'],'2017',true,{caseId:'hb6',status:'reported',directional:true,amount:25000,amountLabel:'$25k',unit:'USD check',locator:'Wayne and Cynthia Boich check'}),
  e('e65','karen-trust','generation-now','money','$250,000 wire','Bank records name the trust as the payer.', ['gn-bank'],'October 2018',true,{caseId:'hb6',status:'reported',directional:true,amount:250000,amountLabel:'$250k',unit:'USD wire',locator:'Karen Buchwald Wright Revocable Trust wire'}),
  e('e66','penn-national','generation-now','money','$125,000 in checks','Bank records total several company checks.', ['gn-bank'],'October 2017–September 2019',true,{caseId:'hb6',status:'reported',directional:true,amount:125000,amountLabel:'$125k',unit:'USD payments'}),
  e('e67','fair-gaming','generation-now','money','$100,000 check','Bank records identify this coalition check.', ['gn-bank'],'November 2019',true,{caseId:'hb6',status:'reported',directional:true,amount:100000,amountLabel:'$100k',unit:'USD check'}),
  e('e68','jack-entertainment','generation-now','money','$75,000 in two checks','Bank records total two company checks.', ['gn-bank'],'March 2018 & September 2019',true,{caseId:'hb6',status:'reported',directional:true,amount:75000,amountLabel:'$75k',unit:'USD payments'}),
  e('e69','charter','generation-now','money','$125,000 in five checks','Bank records total five company checks.', ['gn-bank'],'October 2018–February 2020',true,{caseId:'hb6',status:'reported',directional:true,amount:125000,amountLabel:'$125k',unit:'USD payments'}),
  e('e70','att','generation-now','money','$75,000 in four checks','Bank records total four company checks.', ['gn-bank'],'April 2018–March 2020',true,{caseId:'hb6',status:'reported',directional:true,amount:75000,amountLabel:'$75k',unit:'USD payments'}),
  e('e71','redflex','raphael','money','Cash extorted for campaign conduits','DOJ says Raphael pleaded guilty to extorting Redflex cash for elected officials while seeking camera contracts.', ['redflex-npa'],'Plea described in December 2016',true,{caseId:'redflex',status:'conviction',directional:true,graphLabel:'Extorted cash',unit:'Cash · amount not specified in this release'}),
  e('e72','raphael','ohio-democrats','money','Reported conduit route','WOSU traced a Finley contribution through a lobbyist and the party; DOJ identifies Raphael as the lobbyist.', ['redflex-ginther','redflex-npa'],'2011 contribution route · reporting 2015',true,{caseId:'redflex',status:'reported',directional:true,graphLabel:'Reported conduit'}),
  e('e73','ohio-democrats','ginther-campaign','money','$21,000 party contribution','WOSU’s crosscheck identifies the campaign as recipient of the party contribution.', ['redflex-ginther'],'November 1, 2011',true,{caseId:'redflex',status:'reported',directional:true,amount:21000,amountLabel:'$21k',unit:'USD campaign contribution',context:'Ginther denied requesting ODP’s contribution. Finley’s court record did not name him.'}),
  e('e74','ginther','ginther-campaign','leadership','Council candidate','The reported contribution went to Ginther’s campaign committee.', ['redflex-ginther'],'2011 Council election',true,{caseId:'redflex',status:'documented',directional:true,graphLabel:'Candidate'}),
  e('e75','redflex','city','influence','Obtained / retained camera contracts','Finley admitted conduit contributions were exchanged for assistance obtaining or retaining contracts, including Columbus’s photo-enforcement contract.', ['redflex-plea'],'Scheme 2005–2013 · plea June 2015',true,{caseId:'redflex',status:'conviction',directional:true,graphLabel:'Camera contracts'}),
  e('e76','finley','redflex','leadership','CEO','DOJ records Finley’s CEO term and her guilty plea.', ['redflex-plea'],'December 2005–February 2013',true,{caseId:'redflex',status:'documented',directional:true,graphLabel:'CEO'}),
  e('e77','ginther','redflex','influence','Solicited contributions twice, per Ginther','Ginther acknowledged two requests for Redflex support, while denying his campaign received company money.', ['redflex-ginther'],'Statement June 22, 2015',true,{caseId:'redflex',status:'acknowledged',directional:true,graphLabel:'Acknowledged requests'}),
  ...cityHallEdges, ...release.edges
];
const infrastructure=infrastructureRelease(verifiedSourceIds,nodes.map(n=>n.id));
nodes.push(...infrastructure.nodes);
edges.push(...infrastructure.edges);
meta.infrastructureState=infrastructure.complete?'complete':'verified subset';
const politics=politicalRelease(verifiedSourceIds,nodes.map(n=>n.id));
nodes.push(...politics.nodes);
edges.push(...politics.edges);
meta.politicalState=politics.complete?'complete':'verified subset';
const flows=flowRelease(verifiedSourceIds,nodes.map(n=>n.id));
nodes.push(...flows.nodes);
edges.push(...flows.edges);
meta.flowState=flows.complete?'complete':'verified subset';
const trails=trailRelease(verifiedSourceIds,nodes.map(n=>n.id));
nodes.push(...trails.nodes); edges.push(...trails.edges);
applyTrailUpdates(edges,verifiedSourceIds);
meta.trailState=trails.complete?'complete':'verified subset';
const media=mediaRelease(verifiedSourceIds,nodes.map(n=>n.id));
nodes.push(...media.nodes);edges.push(...media.edges);
meta.mediaState=media.complete?'complete':'verified subset';
const civic=civicRelease(verifiedSourceIds,nodes.map(node=>node.id));
nodes.push(...civic.nodes);edges.push(...civic.edges);
meta.civicState=civic.complete?'complete':'verified subset';
const donations=donationRelease(verifiedSourceIds,nodes.map(node=>node.id));
nodes.push(...donations.nodes);edges.push(...donations.edges);
meta.donationState=donations.complete?'complete':'verified subset';
const campaigns=campaignRelease(verifiedSourceIds,nodes.map(node=>node.id));
nodes.push(...campaigns.nodes);edges.push(...campaigns.edges);applyCampaignUpdates(nodes,verifiedSourceIds);
meta.campaign2026State=campaigns.complete?'source-checked subset':'partially source-checked';
meta.campaign2026Coverage='Official roster for selected statewide and Franklin County races; selected financial filings and campaign statements, with incomplete donor and outside-spending ledgers.';
const epsteinIntake=epsteinRelease(verifiedSourceIds,nodes.map(node=>node.id));
nodes.push(...epsteinIntake.nodes);edges.push(...epsteinIntake.edges);
meta.epsteinState=epsteinIntake.complete?'complete':'verified subset';
const redflexIntake=redflexRelease(verifiedSourceIds,nodes.map(node=>node.id));
nodes.push(...redflexIntake.nodes);edges.push(...redflexIntake.edges);
meta.redflexState=redflexIntake.complete?'complete':'verified subset';
if(verifiedSourceIds.has('flow-jobs-finance')){
 const record=nodes.find(n=>n.id==='jobsohio');
 const extraIds=['flow-jobs-finance','flow-jobs-audit','flow-podcast'].filter(id=>verifiedSourceIds.has(id));
 const description=['Receives liquor-enterprise funding for economic-development assistance.',verifiedSourceIds.has('flow-jobs-audit')?'Its 2013 state audit documented control failures.':'',verifiedSourceIds.has('flow-podcast')?'In March 2026, it announced a review of its disputed podcast payment.':''].filter(Boolean).join(' ');
 Object.assign(record,{role:'Liquor-funded economic-development nonprofit',description,sourceIds:[...new Set([...record.sourceIds,...extraIds])]});
}

export const cases = {
  campaigns2026:campaignCase,
  hb6: { label: 'HB 6', title: 'Generation Now / HB 6', summary: 'Political payments, spending control, bailout legislation, and legal outcomes.', outcomes: ['Householder: racketeering conviction; 20-year sentence (2023).', 'FirstEnergy: bribery admission; $230m penalty (2021).', 'AEP: SEC findings; $19m civil penalty (2025).'], positions: {aep:[70,240],empowering:[400,240],'generation-now':[760,240],householder:[1100,80],firstenergy:[730,30],hb6:[1100,410],sec:[60,450],'resource-fuels':[450,-220],'boich-donors':[880,-220],'karen-trust':[1200,-220],'penn-national':[1430,30],'fair-gaming':[1450,240],'jack-entertainment':[1440,450],charter:[1150,650],att:[770,650]} },
  epstein: { label: 'Wexner–Epstein', title: 'Wexner / Epstein', summary: 'Financial authority, trusteeship, and transfers to Abigail Wexner’s charitable fund.', outcomes: ['Epstein: 2008 sex-offense guilty plea; died before trial on 2019 federal charges.', 'YLK: $46,657,998 in asset book value received in 2008.', 'Wexner’s explanation of those transfers: partial recovery of misappropriated assets.'], positions: {les:[90,100],epstein:[450,100],foundation:[120,370],'financial-trust':[800,100],couq:[450,390],ylk:[1060,390],abigail:[1060,100]} },
  redflex:{label:'Redflex',title:'Redflex / Columbus campaigns',summary:'Camera contracts, conduit payments, and campaign records.',outcomes:['Finley: bribery/fraud guilty plea (2015).','Raphael: extortion guilty plea, identified by DOJ.','Ginther campaign: $21,000 party contribution reported; he denied requesting it.'],positions:{redflex:[60,150],raphael:[380,150],'ohio-democrats':[730,150],'ginther-campaign':[1080,150],ginther:[1080,450],city:[60,450],finley:[60,-100]}},
  politics:{...politicalCase,contextEdgeIds:[...politicalCase.contextEdgeIds,'j29','j35','j67','j38','j45','j46','j47','j48','j49','j50','j66','j59','j60']},
  jobsohio:jobsOhioCase, media:mediaCase,
  cityhall:cityHallCase, sports:release.complete?sportsCase:{...sportsCase,title:'Sports ownership / campaign transactions / development',outcomes:['Three reported July 2026 contributions total $32,615.67.','HSG, the Edwards family and Pizzuti announced a Confluence Village JV in 2020.','The 2026 franchise announcement names HSG, Nationwide, Christine and Pete Edwards.']},
  ...Object.fromEntries(Object.entries(infrastructureCases).map(([id,record])=>[id,{...record,outcomes:[...record.outcomes]}]))
};
cases.datacenters.contextEdgeIds=[...new Set([...(cases.datacenters.contextEdgeIds||[]),'d26-05','d26-06','d26-07','d26-08','d26-09'])];
cases.politics.contextEdgeIds=[...new Set([...cases.politics.contextEdgeIds,...campaigns.edges.map(edge=>edge.id)])];
const caseFact=(sourceId,caseId,text)=>{if(verifiedSourceIds.has(sourceId))cases[caseId].outcomes.push(text);};
if(epsteinIntake.edges.length)cases.epstein.summary='Financial authority, charitable-fund transfers, Ohio State gift records and congressional testimony.';
caseFact('ep26-osu-review','epstein','Ohio State’s review traced its $2.5m COUQ gift to Wexner funds. A further $75,000 historical pledge was not confirmed received.');
caseFact('ep26-house-deposition','epstein','Wexner gave a House Oversight deposition February 18, 2026; testimony is not a finding of wrongdoing.');
if(redflexIntake.edges.length)cases.redflex.summary='Columbus camera procurement, campaign conduits, individual Ohio convictions and separate corporate restitution obligations.';
caseFact('rf26-ordinance-2013','redflex','2013: extension authorized with bidding waived and no new appropriation. Authorization is separate from contract execution.');
caseFact('rf26-amendment-2013','redflex','Attached modification: $29.74 per paid citation; vendor signed, city execution fields blank. The rate is not a payment total.');
caseFact('rf26-raphael-sentence','redflex','Raphael: 15-month Ohio sentence imposed June 8, 2016.');
caseFact('rf26-finley-sentence','redflex','Finley: 14-month Ohio sentence reported in October 2016; exact sentencing day not verified.');
if(redflexIntake.complete)caseFact('redflex-npa','redflex','Corporate agreement: $100,000 Columbus restitution obligation; completed payment and final discharge not verified.');
for(const edge of trails.edges)for(const id of edge.relatedCases||[]){
  if(cases[id])cases[id].contextEdgeIds=[...new Set([...(cases[id].contextEdgeIds||[]),edge.id])];
}
for(const [id,context] of Object.entries({jobsohio:['p24','p25','p26','p27','p28','p29','p30'],alpr:['j38','p14','p21','p22','t31','t32','t33','t34','t35'],datacenters:['t01','t03','t04','t23','t24']})){
  cases[id].contextEdgeIds=[...new Set([...(cases[id].contextEdgeIds||[]),...context])];
}
caseFact('trail-vpac-q2','politics','Original FEC records date four billionaire V-PAC receipts and $8,182,282 paid to New Albany media vendor Flexpoint in June 2026.');
caseFact('trail-vivek-fds','jobsohio','Ramaswamy’s 2025 disclosure lists Narya Fund I interests, 8VC Fund III income and former JobsOhio head Mark Kvamme as a gift source.');
caseFact('trail-intel-plan','jobsohio','Intel: up to $150m planned JobsOhio assistance in January 2022; payments not established by that announcement.');
caseFact('trail-state-compliance','jobsohio','Separate state-award review: 39 of 60 recipients noncompliant; this is not an individual JobsOhio / Anduril finding.');
caseFact('trail-microsoft-ohio','datacenters','Microsoft names Ames as New Albany contractor; July 2026 site-preparation update does not establish operation.');
caseFact('trail-oshp-flock','alpr','Highway Patrol: $90k FY2024 plus $90k FY2025 Flock ceiling approved; actual payments remain unverified.');
caseFact('trail-vance-oge','jobsohio','Vance’s 2025 annual disclosure reports Narya interests and an LLC cash account at Huntington; ranges are not transfers.');
caseFact('trail-pov-2022','politics','Three original Thiel receipts total $15m to Protect Ohio Values’ non-contribution account; outside support is separate from candidate receipts.');
caseFact('flow-jobs-audit','jobsohio','2013 audit: missing ethics controls; $59,747 sampled payments lacked invoices / receipts. Three potential conflicts resolved as absent or de minimis.');
caseFact('flow-carter-report','jobsohio','Ohio State’s 2026 report found misuse of office and documented JobsOhio / Anduril introductions.');
caseFact('flow-podcast','jobsohio','March 2026: JobsOhio acknowledged $60k paid for four podcast episodes; one completed.');
caseFact('flow-jobs-finance','jobsohio','FY2026: $280m internal liquor-funded grant and Huntington borrowing flows.');
caseFact('flow-anduril-grant','jobsohio','Anduril: $310m conditional agreement; paid amount not supplied.');
cases.jobsohio.outcomes.push('Audits and institutional findings are distinct from criminal convictions.');
if(!flows.complete)cases.jobsohio.outcomes.push('Some researched records still need source-content verification.');
caseFact('political-vivek','politics','Ramaswamy: 2026 gubernatorial nominee; no incumbent governor authority.');
caseFact('political-coalition','politics','Campaign identifies Vance, Trump and Huffman as supporters.');
caseFact('political-strive','politics','Strive connects Ramaswamy with Narya and named seed investors.');
caseFact('political-vpac','politics','Reported billionaire receipts go to V-PAC, separate from the candidate committee.');
caseFact('political-rickenbacker','politics','Congressional support links into COTA’s local-project network.');
if(!politics.complete)cases.politics.outcomes.push('Some researched links still need source-content verification.');
caseFact('flock-contract-2024','alpr','Flock: up to $228,000 for 38 readers over two years; bidding waived.');
caseFact('forcemetrics-trial-2025','alpr','ForceMetrics: free one-year trial; later service prices are options.');
caseFact('vigilant-contract-2026','alpr','Motorola / Vigilant: up to $103,990 subscriptions; bidding waived.');
caseFact('flock-financing-2025','alpr','Flock: $275m company financing round; Andreessen Horowitz led.');
caseFact('google-incentive-2018','datacenters','Montauk / Google: 100% / 15-year abatement and permit-fee waiver authorized.');
caseFact('new-albany-budget-2024','datacenters','City budget records announced AWS, QTS and Edged investments.');
caseFact('aep-data-tariff','datacenters','Schedule DCT sets minimum demand and long-term customer obligations.');
if(!infrastructureSources.filter(s=>['flock-contract-2024','forcemetrics-trial-2025','vigilant-contract-2026','flock-financing-2025'].includes(s.id)).every(s=>verifiedSourceIds.has(s.id)))cases.alpr.outcomes.push('Additional contracts / financing still need source-content verification.');
if(!infrastructureSources.filter(s=>['google-incentive-2018','new-albany-budget-2024','aep-data-tariff'].includes(s.id)).every(s=>verifiedSourceIds.has(s.id)))cases.datacenters.outcomes.push('Some infrastructure records still need source-content verification.');
// Corrections are additive review records; identity is independent of display and layout.
for (const change of acceptedCorrections) {
  const record=edges.find(e=>e.id===change.recordId);
  if(!record)throw Error(`Correction references unknown relationship ${change.recordId}`);
  Object.assign(record,change.patch);
}
