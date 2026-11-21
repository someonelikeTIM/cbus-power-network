// Project maps contain only the records cited in their findings. An association,
// a payment and a position on a bill keep their original types and directions.
const definitions = [
  {
    id:'wexner-campaigns', icon:'projectFunds', title:'Epstein, the Wexners and Columbus campaigns',
    teaser:'Follow the Wexners’ reported donations to two Columbus campaigns and a later gift to the Columbus Promise.',
    finding:'Les Wexner dates Epstein’s role managing his finances to 2007 and earlier. Campaign reporting identifies Les and Abigail Wexner as the donors to Andrew Ginther and Shannon Hardin in the years that followed.',
    sources:['les-letter','wexner-campaigns-2026'],
    positions:{epstein:[0,0],les:[1,0],abigail:[1,1.6],'wexner-donors':[2,.8],'ginther-fund':[3,0],'hardin-fund':[3,1.6],promise:[4,1.6]},
    steps:[
      {title:'Who managed the finances?',text:'In his 2019 letter, Les Wexner said Epstein managed his personal finances until their relationship ended in 2007.',links:{e46:'Managed finances'}},
      {title:'Who gave to the campaigns?',text:'WOSU reported the couple’s contributions together. From 2016 through its February 2026 report, it found more than $150,000 for Ginther’s campaign and more than $40,000 for council president Hardin’s campaign.',links:{e115:'Les in joint total',e116:'Abigail in joint total',e117:'Over $150,000',e118:'Over $40,000'},sources:['wexner-campaigns-2026']},
      {title:'Where did $10,000 go next?',text:'Hardin’s campaign gave $10,000 to the Columbus Promise tuition program. WOSU followed up using campaign records in September 2026.',links:{e119:'$10,000 to tuition'},sources:['wexner-charity-followup']}
    ]
  },
  {
    id:'flock-plate-readers', icon:'projectCamera', title:'Flock and Ohio’s license plate reader rules',
    teaser:'See what Flock asked lawmakers to do and why Columbus declared an emergency to lease its cameras.',
    finding:'In written testimony on November 17, 2026, Flock asked Ohio lawmakers to pass HB 725. It wanted a ban on commercial sales of license plate reader data, a recorded reason and an audit log for each search, and oversight with clear penalties for misuse.',
    sources:['policy-flock-hb725'],
    positions:{city:[0,0],capobianco:[0,1.65],flock:[1,.8],'ohio-hb725-alpr':[2,.8],'aclu-ohio':[3,0]},
    steps:[
      {title:'What Flock asked for',text:'Vaughn Roland, Flock’s government affairs director, also backed the bill’s rules on how long agencies could keep plate records. He wanted police to retain access for specific investigations.',excerpt:{text:'… prohibits the sale of LPR data, requires documented justification and auditable logs for searches, and provides meaningful oversight with clear penalties for misuse.',credit:'Vaughn Roland on the legislation Flock supported · p. 3'},links:{'policy-01':'Supported HB 725'},follow:'flock'},
      {title:'Why the ACLU objected',text:'At the same hearing, Gary Daniels of the ACLU of Ohio opposed the proposal to exempt police search inquiries from public records. He argued that residents should be able to learn how often and why officials search plate data.',links:{'policy-02':'Opposed HB 725'},follow:'aclu-ohio'},
      {title:'Why did Columbus rush the lease?',text:'Police told Council a procurement delay had left too little time to seek formal bids. On December 9, 2024, Council waived bidding and authorized up to $228,000 to lease 38 fixed plate readers for two years. Residents had about 72 hours from the final agenda posting to the deadline to sign up to speak.',links:{e179:'Lease authorized'},follow:'city'},
      {title:'The registered representative',text:'Columbus listed Louis Capobianco as Flock’s city lobbyist in its November 2025 roster.',links:{e171:'Registered lobbyist'},follow:'capobianco'}
    ]
  },
  {
    id:'data-center-lobbying', icon:'projectServers', title:'Data-center money and Ohio lobbyists',
    teaser:'Connect QTS’s announced New Albany investment, two registered lobbyists and a House campaign.',
    finding:'Ohio lists Bill Byers and Andrew Minton as QTS lobbyists. Reporting attributes $1,400 in personal contributions to each man for Mike Dovilla’s campaign. His recorded support for a data-center tax measure came more than a decade earlier.',
    sources:['donation-qts-register','donation-dovilla-report','policy-dovilla-sb243'],
    positions:{'qts-na-project':[0,.9],qts:[1,.9],'bill-byers':[2,0],'andrew-minton':[2,1.8],'dovilla-campaign':[3,.9],'mike-dovilla':[3,2.25],'ohio-sb243-data-tax':[2,3.15]},
    steps:[
      {title:'A $3.6 billion plan',text:'New Albany’s 2024 budget describes QTS’s announced $3.6 billion investment. The figure represents the developer’s plans for the project.',links:{e203:'$3.6B announced'}},
      {title:'Two names on the state register',text:'Ohio’s February and October 2026 QTS rosters identify William L. Byers IV and Andrew Minton. The records establish registration on those dates.',links:{'d26-08':'Byers registered','d26-09':'Minton registered'}},
      {title:'Two personal donors',text:'TiffinOhio.net reported four donations totaling $1,400 from each man to Mike Dovilla for Ohio between March 2025 and March 2026. The state portal identifies the recipient committee.',links:{'d26-05':'Byers · $1,400','d26-06':'Minton · $1,400','d26-07':'Candidate’s committee'},sources:['donation-dovilla-report','donation-dovilla-identity']},
      {title:'The policy came first',text:'In 2014 Dovilla cosponsored SB 243. The law temporarily gave qualifying data centers more time to make their required capital investment. The later donations have their own dates and donors.',links:{'policy-07':'2014 cosponsor'}}
    ]
  },
  {
    id:'ai-tech-lobbying', icon:'projectChip', title:'Big Tech money and Ohio’s AI debate',
    teaser:'Follow Cisco, Verizon and Google disclosures to the trade group that sought changes to Ohio’s AI bill.',
    finding:'Cisco and Verizon disclosed lobbying portions of their support for TechNet. Google also lists the group. TechNet’s own letter shows the changes it sought on Ohio’s AI bill. The companies’ figures cover the association overall.',
    sources:['policy-cisco-dues','policy-verizon-dues','policy-google-groups','policy-technet-sb163'],
    positions:{'cisco-systems':[0,0],verizon:[0,1.25],google:[0,2.5],technet:[1.3,1.25],'ohio-sb163-ai':[2.7,1.25]},
    steps:[
      {title:'What the companies disclosed',text:'Cisco identified $40,590 for TechNet lobbying in 2025. Verizon disclosed $47,753 in 2024. These are association-wide amounts for two different years.',links:{'policy-03':'$40,590 · 2025','policy-04':'$47,753 · 2024'}},
      {title:'Google’s support',text:'Google’s U.S. public policy team lists TechNet among the trade groups it supports. The disclosure gives the group’s name without a dollar figure.',links:{'policy-05':'Listed support'}},
      {title:'What TechNet asked Ohio to change',text:'In June 2025 TechNet opposed the draft of SB 163. It asked senators to focus liability on people who misuse AI and offered amendments on identifying the origin of AI-generated images.',links:{'policy-06':'Sought amendments'}}
    ]
  }
];

export function starterProjects(nodes,edges,sources) {
  const nodeIds=new Set(nodes.map(node=>node.id)),byEdge=new Map(edges.map(edge=>[edge.id,edge]));
  const sourceIds=new Set(sources.map(source=>source.id)),projects=new Map();
  for(const definition of definitions){
    const labels=new Map(definition.steps.flatMap(step=>Object.entries(step.links)));
    const records=[...labels.keys()].map(id=>byEdge.get(id));
    if(records.some(edge=>!edge||!edge.sourceIds?.length||edge.sourceIds.some(id=>!sourceIds.has(id))))continue;
    const route={edges:[...labels.keys()],nodes:[...new Set(records.flatMap(edge=>[edge.source,edge.target]))]};
    if(route.nodes.some(id=>!nodeIds.has(id)||!Object.hasOwn(definition.positions,id)))continue;
    const steps=definition.steps.map(step=>{
      const records=Object.keys(step.links).map(id=>byEdge.get(id));
      const citations=step.sources||[...new Set(records.map(edge=>edge.sourceIds[0]))];
      return {...step,id:records[0].id,records,citations};
    });
    const citations=[...definition.sources,...steps.flatMap(step=>step.citations)];
    if(citations.some(id=>!sourceIds.has(id)))continue;
    projects.set(definition.id,{...definition,steps,route,labels});
  }
  return projects;
}

export function isProjectMap(project,path) {
  return !!project&&path?.edges.length===project.route.edges.length&&project.route.edges.every(id=>path.edges.includes(id));
}

export function addProjectToResearch(project,research) {
  const existing=new Set(research.steps.filter(step=>step.kind==='connection').map(step=>step.id));
  const additions=project.steps.flatMap(step=>{
    const text=step.excerpt?step.text+' “'+step.excerpt.text+'” ('+step.excerpt.credit+')':step.text;
    return step.records.filter(edge=>!existing.has(edge.id))
      .map(edge=>({kind:'connection',id:edge.id,note:step.records.length===1?text:edge.evidence}));
  });
  if(!additions.length)return research;
  if(research.steps.length+additions.length>200)throw Error('This research path has room for 200 records. Save a new path to add this project.');
  const title=!research.steps.length&&research.title==='Untitled research path'?project.title:research.title;
  return {...research,title,steps:[...research.steps,...additions]};
}
