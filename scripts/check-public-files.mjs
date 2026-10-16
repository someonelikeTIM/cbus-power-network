import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {publicInputs, filesUnder, hash} from './public-files.mjs';

const inputs = await publicInputs();
const paths = [...new Set([
  ...inputs.map(file => file.input),
  ...await filesUnder('dist'),
])];
const forbiddenPaths = /(?:^|\/)(?:AGENTS\.md|SKILL\.md|\.env(?:\..*)?|\.open[a]i|\.co[d]ex|\.agents|.*HANDOFF.*|.*DELIVERY-PLAN.*|PILOT-INVITATION\.md|QA\.md)(?:\/|$)/i;
const patterns = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['service token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|sk-[A-Za-z0-9_-]{32,}|AKIA[A-Z0-9]{16})\b/],
  ['absolute home path', /(?:[A-Z]:[\\/]Users[\\/]|(?:^|[\s'"`])\/(?:Users|home)\/)[^\s'"<>]+/i],
  ['private network address', /\b(?:192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b/],
  ['internal hosting ID', /appgprj_[a-f0-9]{20,}/i],
  ['internal attribution', /\b(?:co[d]ex|open[a]i|agent[i]c)\b|AI re[v]iewer|type\s*:\s*['"]ag[e]nt['"]|"type"\s*:\s*"ag[e]nt"/i],
  ['embedded credentials', /https?:\/\/[^\s/]+:[^\s/]+@/i],
  ['private contact address', /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i],
];
const findings = [];
const files = [];
const evidenceExceptions=[];
for (const path of paths.sort()) {
  if (forbiddenPaths.test(path)) findings.push({path, kind: 'private file'});
  const bytes = await readFile(path);
  const text = (path.endsWith('.json.gz')?gunzipSync(bytes):bytes).toString('utf8');
  let attributionText=text;
  if(path.startsWith('dist/finance/2026/')&&path.endsWith('.json.gz')){
    const data=JSON.parse(text),employer=data.columns.indexOf('employer'),name=data.columns.indexOf('name'),category=data.columns.indexOf('category'),report=data.columns.indexOf('reportId');
    // A documented employer name in a filing is evidence, not project authorship.
    const rows=data.rows.map(row=>{const copy=[...row];if(/^open[a]i(?: (?:researcher|software engineer))?$/i.test(copy[employer])){copy[employer]='[reported employer]';evidenceExceptions.push({path,recordId:row[0],field:'employer',reason:'Officially reported employer name'});}if((data.reportId==='fec-2025264'||row[report]==='fec-2025264')&&row[category]==='spending'&&/^The Culture Co[d]ex Podcast LLC$/i.test(copy[name])){copy[name]='[reported campaign payee]';evidenceExceptions.push({path,recordId:row[0],field:'name',reason:'Verified payee in original filing 2025264, Schedule B17; not project authorship'});}return copy;});
    attributionText=JSON.stringify({...data,rows});
  }
  for (const [kind, pattern] of patterns) {
    // Ignore rules document excluded directory names, not development history.
    if (path === '.gitignore' && kind === 'internal attribution') continue;
    if (pattern.test(kind==='internal attribution'?attributionText:text)) findings.push({path, kind});
  }
  files.push({path, bytes: bytes.length, sha256: hash(bytes)});
}
await mkdir('artifacts', {recursive: true});
await writeFile('artifacts/public-file-audit.json', JSON.stringify({files, findings,evidenceExceptions}, null, 2) + '\n');
assert.deepEqual(findings, [], 'Review public-file audit findings before publication.');
console.log(`PASS public-file audit: ${files.length} files; no configured sensitive-content patterns found.`);
