import assert from 'node:assert/strict';
import { readFile,writeFile } from 'node:fs/promises';
import { filesUnder,hash } from './public-files.mjs';
const base=process.argv[2]||'http://127.0.0.1:4176/cbus-power-network/';
assert.ok(new URL(base).hostname==='127.0.0.1','Only the authorized loopback preview is checked');
const paths=await filesUnder('dist');let checked=0;
for(const path of paths){if(path.endsWith('/.nojekyll'))continue;const response=await fetch(new URL(path.slice(5),base));assert.equal(response.status,200,path);assert.equal(hash(Buffer.from(await response.arrayBuffer())),hash(await readFile(path)),path);checked++;}
for(const suffix of ['?case=all&record=entity:wsyx','?case=all&record=relationship:m63','?case=all&view=sources&record=source:media-fcc-wsyx','?case=all&view=timeline&scope=case&record=event:event-m09'])assert.equal((await fetch(base+suffix)).status,200);
assert.equal((await fetch(new URL('App.js',base))).status,404,'Case mismatch was incorrectly served');assert.equal((await fetch(new URL('../app.js',base))).status,404,'Prefix escape was incorrectly served');
const result={base,filesVerified:checked,deepLinkResponses:4,caseSensitivePaths:true,prefixEscapeRejected:true,contentHashesMatch:true};await writeFile('artifacts/preview-checks.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
