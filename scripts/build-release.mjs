import { mkdir,readFile,writeFile } from 'node:fs/promises';
import { datasetFor,validateDataset,evidencePacket,release } from '../dist/contract.js';
import { nodes,edges } from '../dist/data.js';
import { findPaths } from '../dist/reporting.js';
import { toCSV } from './csv.mjs';
import { filesUnder,hash,inputFingerprint } from './public-files.mjs';

const projectConfig=JSON.parse(await readFile('public-release.config.json','utf8'));
const owner=projectConfig.repositoryOwner,name=projectConfig.repositoryName;
if(owner&&(!/^[a-zA-Z0-9-]+$/.test(owner)||!/^[a-zA-Z0-9_.-]+$/.test(name)))throw Error('Invalid GitHub repository identity');
await writeFile('dist/project-links.js',`// Generated from project configuration by scripts/build-release.mjs.\nexport const repositoryURL=${JSON.stringify(owner?`https://github.com/${owner}/${name}`:null)};\n`);

const data=datasetFor();validateDataset(data);
const directory=`dist/downloads/${release.releaseId}`;
await mkdir(directory,{recursive:true});await mkdir('dist/docs',{recursive:true});
const save=async(name,value)=>writeFile(`${directory}/${name}`,typeof value==='string'?value:JSON.stringify(value,null,2)+'\n');
await save('dataset.json',data);
const schema=JSON.parse(await readFile('schemas/dataset.schema.json','utf8'));await save('schema.json',schema);
const definitions={entities:'entity',relationships:'relationship',sources:'source',events:'event',leads:'lead'};
for(const [name,definition]of Object.entries(definitions)){
  await save(`${name}.json`,{release,table:name,records:data[name]});
  await save(`${name}.csv`,toCSV(data[name].map(r=>({releaseId:release.releaseId,schemaVersion:release.schemaVersion,...r}))));
  await save(`${name}.schema.json`,{$schema:schema.$schema,title:`${name} table`,type:'object',required:['release','table','records'],properties:{release:{$ref:'#/$defs/release'},table:{const:name},records:{type:'array',items:{$ref:`#/$defs/${definition}`}}},$defs:schema.$defs});
}
await save('packet-m63.json',evidencePacket({kind:'edge',id:'m63'}));
await save('packet-flock.json',evidencePacket({kind:'edge',id:'e179'}));
const route=findPaths({nodes,edges},'anduril','city',{directed:false,limit:1})[0];
if(!route)throw Error('Missing example route');
await save('packet-anduril-city.json',evidencePacket({kind:'path',...route}));

const escape=value=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inline=text=>escape(text).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\[([^\]]+)\]\((https:\/\/[^)]+)\)/g,'<a href="$2">$1</a>');
function markdown(text){
  const rows=text.split(/\r?\n/);let html='',list=null,table=false;
  const closeList=()=>{if(list){html+=`</${list}>`;list=null;}};
  for(const row of rows){
    if(row.startsWith('|')){closeList();if(!table){html+='<table>';table=true;}if(/^\|\s*[-: ]+\|/.test(row))continue;html+='<tr>'+row.split('|').slice(1,-1).map(cell=>`<td>${inline(cell.trim())}</td>`).join('')+'</tr>';continue;}
    if(table){html+='</table>';table=false;}
    const heading=row.match(/^(#{1,6}) (.*)/);if(heading){closeList();html+=`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`;continue;}
    const bullet=row.match(/^(- |\d+\. )(.*)/);if(bullet){const kind=bullet[1]==='- '?'ul':'ol';if(list!==kind){closeList();list=kind;html+=`<${kind}>`;}html+=`<li>${inline(bullet[2])}</li>`;continue;}
    closeList();if(row.trim())html+=`<p>${inline(row.trim())}</p>`;
  }
  closeList();if(table)html+='</table>';return html;
}
for(const path of(await filesUnder('docs'))){
  const name=path.split('/').at(-1).replace(/\.md$/,'.html'),text=await readFile(path,'utf8');
  if(!['docs/CONTRIBUTING.md','docs/DATA-DICTIONARY.md','docs/CHANGELOG.md','docs/METHODOLOGY.md','docs/PRIVACY.md'].includes(path)){
    await writeFile(`dist/docs/${name}`,`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Data and project information</title><link rel="stylesheet" href="../styles.css"></head><body><main class="resource-page"><a href="../index.html">← Explore the network</a><h1>Data and project information</h1><p>The network, timeline and source records are available in the <a href="../index.html">explorer</a>. Technical and maintenance documentation remains with the project’s source files.</p></main></body></html>\n`);continue;
  }
  await writeFile(`dist/docs/${name}`,`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(text.split('\n')[0].replace(/^# /,''))}</title><link rel="stylesheet" href="../styles.css"></head><body><main class="resource-page"><a href="../index.html">← Explore the network</a>${markdown(text)}</main></body></html>\n`);
}
await writeFile('dist/.nojekyll','');
const input=await inputFingerprint();
const manifest={release,inputFingerprint:input.fingerprint,counts:Object.fromEntries(Object.keys(definitions).map(k=>[k,data[k].length])),sourceChecksReperformed:!!release.sourceCheckIds?.length,sourceCheckScope:release.sourceCheckIds||[],thirdPartyDocumentsIncluded:false,files:[]};
for(const path of(await filesUnder(directory)).filter(p=>!p.endsWith('/manifest.json'))){const bytes=await readFile(path);manifest.files.push({path:path.slice(directory.length+1),bytes:bytes.length,sha256:hash(bytes)});}
await save('manifest.json',manifest);
await writeFile('dist/release.json',JSON.stringify({release,inputFingerprint:input.fingerprint,manifest:`downloads/${release.releaseId}/manifest.json`},null,2)+'\n');
console.log(`Built ${release.releaseId}: ${JSON.stringify(manifest.counts)}, ${manifest.files.length} checksummed download files. Input ${input.fingerprint}`);
