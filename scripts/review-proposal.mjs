import { readFile,writeFile } from 'node:fs/promises';
import { nodes,edges,sources } from '../dist/data.js';
import { acceptedPatch,validateProposal } from '../dist/contributions.js';
import { datasetFor,validateDataset } from '../dist/contract.js';

const input=process.argv[2];if(!input)throw Error('Usage: node scripts/review-proposal.mjs reviewed-proposal.json');
const proposal=JSON.parse(await readFile(input,'utf8'));validateProposal(proposal,{sourceIds:new Set(sources.map(s=>s.id))});
const ledger=JSON.parse(await readFile('content/reviews.json','utf8'));
if(ledger.some(p=>p.id===proposal.id))throw Error('Proposal ID already recorded; preserve the existing disposition.');
if(proposal.state==='accepted'){
  const record=edges.find(e=>e.id===proposal.recordId);if(!record)throw Error('Unknown relationship');
  const change=acceptedPatch(proposal,record,new Set(sources.map(s=>s.id)));
  const candidate=datasetFor({nodes,edges:edges.map(e=>e.id===record.id?{...e,...change.patch}:e)});validateDataset(candidate);
  proposal.acceptedChange=change;
}
ledger.push(proposal);
const generated='// Generated from content/reviews.json. Do not erase correction history.\nexport const acceptedCorrections = '+JSON.stringify(ledger.filter(p=>p.state==='accepted').map(p=>p.acceptedChange),null,2)+';\n';
// Preserve the old files before either write, for an explicit local recovery point.
await writeFile(input+'.ledger-before.json',await readFile('content/reviews.json'));
await writeFile(input+'.module-before.js',await readFile('dist/corrections.js'));
await writeFile('content/reviews.json',JSON.stringify(ledger,null,2)+'\n');
await writeFile('dist/corrections.js',generated);
console.log(`Recorded ${proposal.id}: ${proposal.state}. Rebuild and check before release.`);
