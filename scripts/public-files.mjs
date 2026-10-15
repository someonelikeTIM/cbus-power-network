import { readdir,readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
export const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function filesUnder(root){const results=[];for(const entry of await readdir(root,{withFileTypes:true})){const path=`${root}/${entry.name}`;if(entry.isDirectory())results.push(...await filesUnder(path));else if(entry.isFile())results.push(path);}return results.sort();}
export async function publicInputs(){
  const folders=['dist','scripts','schemas','content','.github','docs'];
  const paths=[];for(const root of folders)paths.push(...await filesUnder(root));
  const selected=paths.filter(p=>!p.startsWith('dist/downloads/')&&!p.startsWith('dist/docs/')&&p!=='dist/release.json'&&p!=='dist/.nojekyll');
  selected.push('package.json','public-release.config.json','.gitignore','.gitattributes','.editorconfig');
  const mappings=selected.map(path=>({path,input:path}));mappings.push({path:'README.md',input:'README.md'},{path:'LICENSE',input:'LICENSE'},{path:'DATA-LICENSE.md',input:'DATA-LICENSE.md'});
  return Promise.all(mappings.sort((a,b)=>a.path.localeCompare(b.path)).map(async file=>{const bytes=await readFile(file.input);return {...file,sha256:hash(bytes),bytes:bytes.length};}));
}
export async function inputFingerprint(){const files=await publicInputs();return {files,fingerprint:hash(JSON.stringify(files.map(({path,sha256})=>({path,sha256}))))};}
