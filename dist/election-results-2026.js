// Checked election snapshot. Prior ballot, finance and officeholding records remain distinct.
import {campaignRoster,campaign2026EdgeIds,campaignCase} from './campaigns-2026.js';
export const electionResultSources=[
  {
    "id": "er26-ohio-results",
    "title": "November 3, 2026 unofficial statewide and congressional returns",
    "publisher": "Ohio Secretary of State",
    "url": "https://liveresults.ohiosos.gov/Api/v1/download?filename=VSSC1622XmlFileBlob",
    "date": "2026-11-04",
    "kind": "Official unofficial election returns",
    "note": "NIST XML generated November 4 at 09:06:14 UTC; status UnofficialPartial. Statewide and full congressional-district totals are distinguished from county subtotals. Joint-ticket votes are one selection."
  },
  {
    "id": "er26-franklin-results",
    "title": "November 3, 2026 unofficial Franklin County returns",
    "publisher": "Franklin County Board of Elections",
    "url": "https://vote.franklincountyohio.gov/getmedia/7b784f15-62ce-4f9d-93ba-bed82b23e779/Franklin-County-Only-Group-Detail",
    "date": "2026-11-04",
    "kind": "Official unofficial election returns",
    "note": "PDF page 8: county commissioner and auditor totals. Generated November 4 at 12:13PM publisher local time; marked UNOFFICIAL RESULTS. County-only figures are not statewide or full OH-15 totals."
  },
  {
    "id": "er26-results-notice",
    "title": "Ohio election-results status and certification notice",
    "publisher": "Ohio Secretary of State",
    "url": "https://liveresults.ohiosos.gov/",
    "date": null,
    "kind": "Official results qualification",
    "note": "Results remain unofficial until certification; outstanding eligible ballots can be included in the canvass. Election results do not themselves establish that a new officeholder has taken office."
  }
];
export const electionResults={
  "electionDate": "2026-11-03",
  "checkedOn": "2026-11-07",
  "status": "unofficial",
  "certified": false,
  "note": "Election Day has passed. These are unofficial returns, not certified outcomes or authority to take office. The statewide feed is marked UnofficialPartial. Uncounted eligible ballots may change totals. Joint-ticket votes are one shared selection, not separate votes for each member. Missing selections remain unknown. County-only totals are used only for the two county offices.",
  "races": [
    {
      "raceId": "ohio-governor-election",
      "title": "Governor and Lieutenant Governor",
      "sourceId": "er26-ohio-results",
      "sourceContestId": "_55A742EA542A09A3E0633390EE0AE290",
      "scope": "Statewide",
      "sourceUpdatedAt": "2026-11-04T09:06:14Z",
      "status": "unofficial",
      "selections": [
        {
          "candidateIds": [
            "amy-acton",
            "david-pepper"
          ],
          "votes": 2404178,
          "writeIn": false,
          "sourceSelectionId": "_BS55A742EA5F7909A3E0633390EE0AE290"
        },
        {
          "candidateIds": [
            "timothy-grady",
            "andrea-neutzling"
          ],
          "votes": 235,
          "writeIn": true,
          "sourceSelectionId": "_BS59F4F0CBC2572408E0633390EE0A0E4A"
        },
        {
          "candidateIds": [
            "heather-hill",
            "patrick-manley"
          ],
          "votes": 1186,
          "writeIn": true,
          "sourceSelectionId": "_BS576292D859D073A6E0633390EE0A943A"
        },
        {
          "candidateIds": [
            "don-kissick",
            "james-mills"
          ],
          "votes": 151874,
          "writeIn": false,
          "sourceSelectionId": "_BS59434A42701E7F04E0633390EE0A7DE4"
        },
        {
          "candidateIds": [
            "vivek",
            "mccolley"
          ],
          "votes": 2039730,
          "writeIn": false,
          "sourceSelectionId": "_BS55A742EA542B09A3E0633390EE0AE290"
        },
        {
          "candidateIds": [
            "renea-turner",
            "jalen-turner"
          ],
          "votes": 67,
          "writeIn": true,
          "sourceSelectionId": "_BS59F4F0CBC2B12408E0633390EE0A0E4A"
        }
      ],
      "leaderId": "amy-acton"
    },
    {
      "raceId": "ohio-ag-election-2026",
      "title": "Attorney General",
      "sourceId": "er26-ohio-results",
      "sourceContestId": "_55A742EA548509A3E0633390EE0AE290",
      "scope": "Statewide",
      "sourceUpdatedAt": "2026-11-04T09:06:14Z",
      "status": "unofficial",
      "selections": [
        {
          "candidateIds": [
            "keith-faber"
          ],
          "votes": 2256710,
          "writeIn": false,
          "sourceSelectionId": "_BS55A742EA548609A3E0633390EE0AE290"
        },
        {
          "candidateIds": [
            "john-kulewicz"
          ],
          "votes": 2285117,
          "writeIn": false,
          "sourceSelectionId": "_BS55A742EA5FD309A3E0633390EE0AE290"
        }
      ],
      "leaderId": "john-kulewicz"
    },
    {
      "raceId": "ohio-auditor-election-2026",
      "title": "Auditor of State",
      "sourceId": "er26-ohio-results",
      "sourceContestId": "_55A742EA54E009A3E0633390EE0AE290",
      "scope": "Statewide",
      "sourceUpdatedAt": "2026-11-04T09:06:14Z",
      "status": "unofficial",
      "selections": [
        {
          "candidateIds": [
            "annette-blackwell"
          ],
          "votes": 2237955,
          "writeIn": false,
          "sourceSelectionId": "_BS55A742EA602D09A3E0633390EE0AE290"
        },
        {
          "candidateIds": [
            "larose"
          ],
          "votes": 2310105,
          "writeIn": false,
          "sourceSelectionId": "_BS55A742EA54E109A3E0633390EE0AE290"
        }
      ],
      "leaderId": "larose"
    },
    {
      "raceId": "ohio-secretary-election-2026",
      "title": "Secretary of State",
      "sourceId": "er26-ohio-results",
      "sourceContestId": "_55A742EA553B09A3E0633390EE0AE290",
      "scope": "Statewide",
      "sourceUpdatedAt": "2026-11-04T09:06:14Z",
      "status": "unofficial",
      "selections": [
        {
          "candidateIds": [
            "tom-pruss"
          ],
          "votes": 134179,
          "writeIn": false,
          "sourceSelectionId": "_BS55A742EA66CE09A3E0633390EE0AE290"
        },
        {
          "candidateIds": [
            "allison-russo"
          ],
          "votes": 2287160,
          "writeIn": false,
          "sourceSelectionId": "_BS55A742EA608709A3E0633390EE0AE290"
        },
        {
          "candidateIds": [
            "sprague"
          ],
          "votes": 2129981,
          "writeIn": false,
          "sourceSelectionId": "_BS55A742EA553C09A3E0633390EE0AE290"
        }
      ],
      "leaderId": "allison-russo"
    },
    {
      "raceId": "ohio-treasurer-election-2026",
      "title": "Treasurer of State",
      "sourceId": "er26-ohio-results",
      "sourceContestId": "_55A742EA559609A3E0633390EE0AE290",
      "scope": "Statewide",
      "sourceUpdatedAt": "2026-11-04T09:06:14Z",
      "status": "unofficial",
      "selections": [
        {
          "candidateIds": [
            "jay-edwards"
          ],
          "votes": 2232758,
          "writeIn": false,
          "sourceSelectionId": "_BS55A742EA559709A3E0633390EE0AE290"
        },
        {
          "candidateIds": [
            "seth-walsh"
          ],
          "votes": 2282546,
          "writeIn": false,
          "sourceSelectionId": "_BS55A742EA60E109A3E0633390EE0AE290"
        }
      ],
      "leaderId": "seth-walsh"
    },
    {
      "raceId": "ohio-senate-election-2026",
      "title": "U.S. Senator",
      "sourceId": "er26-ohio-results",
      "sourceContestId": "_55A742EA56A709A3E0633390EE0AE290",
      "scope": "Statewide",
      "sourceUpdatedAt": "2026-11-04T09:06:14Z",
      "status": "unofficial",
      "selections": [
        {
          "candidateIds": [
            "sherrod-brown"
          ],
          "votes": 2301042,
          "writeIn": false,
          "sourceSelectionId": "_BS55A742EA61EF09A3E0633390EE0AE290"
        },
        {
          "candidateIds": [
            "stephen-faris"
          ],
          "votes": 291,
          "writeIn": true,
          "sourceSelectionId": "_BS59F4DEB13FEC0F04E0633390EE0A01BC"
        },
        {
          "candidateIds": [
            "anthony-holliman"
          ],
          "votes": 36,
          "writeIn": true,
          "sourceSelectionId": "_BS59F4DEB140460F04E0633390EE0A01BC"
        },
        {
          "candidateIds": [
            "husted"
          ],
          "votes": 2077748,
          "writeIn": false,
          "sourceSelectionId": "_BS55A742EA56A809A3E0633390EE0AE290"
        },
        {
          "candidateIds": [
            "greg-levy"
          ],
          "votes": 94509,
          "writeIn": false,
          "sourceSelectionId": "_BS5993067779935D6FE0633390EE0ADD86"
        },
        {
          "candidateIds": [
            "william-redpath"
          ],
          "votes": 128272,
          "writeIn": false,
          "sourceSelectionId": "_BS55A742EA672809A3E0633390EE0AE290"
        },
        {
          "candidateIds": [
            "timothy-telymonde"
          ],
          "votes": 27,
          "writeIn": true,
          "sourceSelectionId": "_BS576274EE440573A4E0633390EE0A591D"
        }
      ],
      "leaderId": "sherrod-brown"
    },
    {
      "raceId": "oh03-election-2026",
      "title": "Representative to Congress - District 03",
      "sourceId": "er26-ohio-results",
      "sourceContestId": "_55A742EA570C09A3E0633390EE0AE290",
      "scope": "Congressional District 3",
      "sourceUpdatedAt": "2026-11-04T09:06:14Z",
      "status": "unofficial",
      "selections": [
        {
          "candidateIds": [
            "beatty"
          ],
          "votes": 231925,
          "writeIn": false,
          "sourceSelectionId": "_BS55A742EA62A909A3E0633390EE0AE290"
        },
        {
          "candidateIds": [
            "cleophus-dulaney"
          ],
          "votes": 68407,
          "writeIn": false,
          "sourceSelectionId": "_BS55A742EA570D09A3E0633390EE0AE290"
        }
      ],
      "leaderId": "beatty"
    },
    {
      "raceId": "oh15-election-2026",
      "title": "Representative to Congress - District 15",
      "sourceId": "er26-ohio-results",
      "sourceContestId": "_55A742EA570209A3E0633390EE0AE290",
      "scope": "Congressional District 15",
      "sourceUpdatedAt": "2026-11-04T09:06:14Z",
      "status": "unofficial",
      "selections": [
        {
          "candidateIds": [
            "brennan-barrington"
          ],
          "votes": 8135,
          "writeIn": false,
          "sourceSelectionId": "_BS55A742EA678C09A3E0633390EE0AE290"
        },
        {
          "candidateIds": [
            "carey"
          ],
          "votes": 130225,
          "writeIn": false,
          "sourceSelectionId": "_BS55A742EA570309A3E0633390EE0AE290"
        },
        {
          "candidateIds": [
            "gary-josephson"
          ],
          "votes": 4,
          "writeIn": true,
          "sourceSelectionId": "_BS5A1D285617D7D7BEE0633390EE0A2FBB"
        },
        {
          "candidateIds": [
            "don-leonard"
          ],
          "votes": 149287,
          "writeIn": false,
          "sourceSelectionId": "_BS55A742EA62C509A3E0633390EE0AE290"
        },
        {
          "candidateIds": [
            "samuel-ronan"
          ],
          "votes": 105,
          "writeIn": true,
          "sourceSelectionId": "_BS5A1D285617CED7BEE0633390EE0A2FBB"
        }
      ],
      "leaderId": "don-leonard"
    },
    {
      "raceId": "franklin-commissioner-election-2026",
      "title": "Franklin County commissioner",
      "sourceId": "er26-franklin-results",
      "sourceContestId": null,
      "scope": "Franklin County",
      "sourceUpdatedAt": "2026-11-04T12:13:00",
      "status": "unofficial",
      "locator": "PDF page 8; summary generated November 4, 2026 at 12:13PM (publisher local time)",
      "selections": [
        {
          "candidateIds": [
            "crawley"
          ],
          "votes": 338919,
          "writeIn": false
        },
        {
          "candidateIds": [
            "eric-terford"
          ],
          "votes": 88274,
          "writeIn": false
        }
      ],
      "leaderId": "crawley"
    },
    {
      "raceId": "franklin-auditor-election-2026",
      "title": "Franklin County auditor",
      "sourceId": "er26-franklin-results",
      "sourceContestId": null,
      "scope": "Franklin County",
      "sourceUpdatedAt": "2026-11-04T12:13:00",
      "status": "unofficial",
      "locator": "PDF page 8; summary generated November 4, 2026 at 12:13PM (publisher local time)",
      "selections": [
        {
          "candidateIds": [
            "michael-stinziano"
          ],
          "votes": 367794,
          "writeIn": false
        }
      ],
      "leaderId": "michael-stinziano"
    }
  ]
};

const review=()=>({status:'reviewed',reviewedAt:'2026-11-07',reviewer:{type:'unknown',identity:'Unattributed automated source check'},note:'Automated source-supported update. Original results, jurisdiction scope and qualifications checked; no independent human editorial review is recorded.'});
const number=value=>value.toLocaleString('en-US');
export function applyElectionResults(nodes,edges,verified){
 if(!verified.has('er26-results-notice'))return;
 const available=electionResults.races.filter(race=>verified.has(race.sourceId));
 for(const race of available){
  const leader=nodes.find(node=>node.id===race.leaderId),leading=race.selections.find(item=>item.candidateIds.includes(race.leaderId));
  if(!leader||!leading)continue;
  const sourceIds=[race.sourceId,'er26-results-notice'];
  const locator=race.locator||`XML Contest ${race.sourceContestId}; Total votes for ${race.scope}; generated ${race.sourceUpdatedAt}`;
  const qualification=`Unofficial returns generated ${race.sourceUpdatedAt.replace('T',' ')}; checked November 7. Certification is pending, and outstanding eligible ballots may change totals. This result does not establish a new term of office.`;
  for(const row of campaignRoster.filter(row=>row.race===race.raceId)){
   const node=nodes.find(node=>node.id===row.id);if(!node)continue;
   const selection=race.selections.find(item=>item.candidateIds.includes(row.id));
   const standing=!selection?'not-reported':selection===leading?'leading':'trailing';
   const votes=selection?.votes??null,ticket=selection?.candidateIds.length>1;
   const standingText=standing==='leading'?'leads unofficial returns':standing==='trailing'?'trails unofficial returns':'no separate result reported';
   const voteText=selection?`${ticket?'Joint ticket':'Candidate'} received ${number(votes)} votes in ${race.scope}. ${ticket?'This is one shared ticket count, not separate votes for its members. ':''}`:'This candidate is not separately listed in the retrieved results; no zero vote total or outcome is assigned. ';
   node.role=`2026 ${row.office} · ${standingText}${selection?.writeIn?' · write-in':''}`;
   node.description=`The election was held November 3, 2026. ${voteText}${selection?.writeIn?'The results classify this selection as a write-in. ':''}${qualification} The September ballot record and earlier roles remain in their dated sources.`;
   node.electionResult={raceId:race.raceId,electionDate:electionResults.electionDate,status:'unofficial',certified:false,standing,votes,selectionCandidateIds:selection?.candidateIds||[],writeIn:selection?.writeIn??row.writeIn,scope:race.scope,sourceId:race.sourceId,sourceUpdatedAt:race.sourceUpdatedAt,checkedOn:electionResults.checkedOn,locator,officeAssumed:false};
   if(selection)node.writeIn=selection.writeIn;
   node.sourceIds=[...new Set([...node.sourceIds,...sourceIds])];node.claimReview=review();
  }
  const contest=nodes.find(node=>node.id===race.raceId);
  if(contest){contest.role='Election held Nov 3 · unofficial returns';contest.description=`${leader.name} leads the retrieved ${race.scope} returns with ${number(leading.votes)} votes${leading.candidateIds.length>1?' for the joint ticket':''}. ${qualification}`;contest.sourceIds=[...new Set([...contest.sourceIds,...sourceIds])];contest.claimReview=review();}
  const id='er26-'+race.raceId;
  if(!edges.some(edge=>edge.id===id))edges.push({id,source:race.leaderId,target:race.raceId,type:'candidacy',label:'Leads unofficial returns',evidence:`${leader.name}: ${number(leading.votes)} votes${leading.candidateIds.length>1?' for the joint ticket':''} in ${race.scope}.`,voteCount:leading.votes,sourceIds,locator,period:'Election November 3, 2026; unofficial snapshot November 4',caseId:'campaigns2026',electionCycle:2026,historical:false,directional:true,status:'documented',publicationState:'accepted',claimReview:review(),context:qualification+' Votes are counts, not financial amounts.',evidenceEntries:sourceIds.map(sourceId=>({sourceId,role:sourceId===race.sourceId?'support':'qualify',locator:sourceId===race.sourceId?locator:'Publisher notice: Understanding Unofficial Results',excerpt:null,note:'Certification and assumption of office are not established.'})),timeline:{lane:'elections',moneyKind:'none',date:{precision:'day',start:'2026-11-03',end:'2026-11-03',role:'Election date',observedOn:'2026-11-07',observationRole:'Unofficial results checked',note:'The election date is separate from the November 4 source snapshot, November 7 check and future certification.'}}});
  campaign2026EdgeIds.add(id);if(!campaignCase.contextEdgeIds.includes(id))campaignCase.contextEdgeIds.push(id);
 }
 if(available.length){campaignCase.title='2026 Ohio election results and campaigns';campaignCase.summary='The November 3 election has been held. Unofficial returns, campaign committees, reported money and dated background roles; certification remains pending.';campaignCase.outcomes=[`Election held November 3. ${available.length} covered races have checked unofficial November 4 returns; certification is pending.`,'Leading vote counts are not certified victories or proof that a new term has begun. Missing result rows remain unknown.',...campaignCase.outcomes.filter(text=>!text.startsWith('Election held November 3.')&&!text.startsWith('Leading vote counts are not certified'))];}
}
