import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {checkSource,refreshData} from './refresh-data.mjs';

const source = {id:'fixture',url:'https://example.org/current'};
let calls = 0;
const respond = body => async url => {
  assert.equal(url,source.url,'Check the original URL, including for archived citations');
  calls++;
  return new Response(body,{status:200});
};
const first = await checkSource(source,{},respond('Original document'));
assert.equal(first.status,'baseline');
const same = await checkSource(source,first,respond('Original document'));
assert.equal(same.status,'unchanged');
assert.equal(calls,2,'Previously observed sources must actually be fetched again');
const changed = await checkSource(source,same,respond('Revised document'));
assert.equal(changed.status,'changed');
assert.equal(changed.previousSha256,same.sha256);
assert.notEqual(changed.sha256,same.sha256);
const htmlFirst = await checkSource(source,{},respond('<html><script>token=1</script><p class="a">Public fact</p></html>'));
const htmlNext = await checkSource(source,htmlFirst,respond('<html><script>token=2</script><p class="b"> Public fact </p></html>'));
assert.equal(htmlNext.status,'unchanged','Script tokens, markup and whitespace should not create change alerts');
assert.notEqual(htmlNext.sha256,htmlFirst.sha256,'Retain the raw hash even when the text is unchanged');
for (const fetcher of [
  async()=>new Response('Unavailable',{status:503}),
  async()=>{throw Error('Timeout');},
  respond(''),
  respond('<title>Just a moment...</title>'),
]) {
  const failed = await checkSource(source,changed,fetcher);
  assert.equal(failed.status,'failed');
  assert.equal(failed.sha256,changed.sha256,'Failure must preserve the last retrieved hash');
  assert.equal(failed.contentHash,changed.contentHash);
  assert.equal(failed.lastSuccessfulAt,changed.lastSuccessfulAt,'Failure must preserve the last successful check');
}
const acceptedBefore = await readFile('dist/live-sources.js','utf8');
await assert.rejects(refreshData(['not-a-source']),/Unknown source IDs/);
assert.equal(await readFile('dist/live-sources.js','utf8'),acceptedBefore);
console.log('PASS data refresh: real refetches, changes, access failures and preserved successful checks.');
