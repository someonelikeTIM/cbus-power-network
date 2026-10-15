import assert from 'node:assert/strict';
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
for (const path of paths.sort()) {
  if (forbiddenPaths.test(path)) findings.push({path, kind: 'private file'});
  const bytes = await readFile(path);
  const text = bytes.toString('utf8');
  for (const [kind, pattern] of patterns) {
    // Ignore rules document excluded directory names, not development history.
    if (path === '.gitignore' && kind === 'internal attribution') continue;
    if (pattern.test(text)) findings.push({path, kind});
  }
  files.push({path, bytes: bytes.length, sha256: hash(bytes)});
}
await mkdir('artifacts', {recursive: true});
await writeFile('artifacts/public-file-audit.json', JSON.stringify({files, findings}, null, 2) + '\n');
assert.deepEqual(findings, [], 'Review public-file audit findings before publication.');
console.log(`PASS public-file audit: ${files.length} files; no configured sensitive-content patterns found.`);
