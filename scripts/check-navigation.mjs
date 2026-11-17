import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {categories,relationships} from '../dist/data.js';
import {encodeState,decodeState,recordURL} from '../dist/routing.js';

const defaults={view:'network',caseId:'all',query:'',history:true,focus:false,categories:new Set(Object.keys(categories)),relationships:new Set(Object.keys(relationships)),connectionDistance:1};
for(const view of ['network','relations','directory','sources']){
  const url=encodeState('https://example.test/',{...defaults,view},'local');
  assert.equal(decodeState(url,defaults).view,view);
}
const entity=decodeState('https://example.test/?view=timeline&entity=dewine',defaults);
assert.equal(entity.view,'network');assert.deepEqual(entity.selected,{kind:'node',id:'dewine'});assert.equal(entity.focusEntity,'dewine');
const event=decodeState('https://example.test/?view=timeline&record=event:event-m09',defaults);
assert.equal(event.view,'network');assert.deepEqual(event.selected,{kind:'edge',id:'m09'});
const eventURL=recordURL('https://example.test/','event','event-m09','local');
assert.equal(new URL(eventURL).searchParams.get('view'),'network');assert.equal(new URL(eventURL).searchParams.get('record'),'relationship:m09');
const saved=encodeState('https://example.test/',{...defaults,view:'timeline',selected:{kind:'event',id:'event-m09'}},'local');
assert.equal(new URL(saved).searchParams.get('view'),'network');assert.equal(new URL(saved).searchParams.get('record'),'relationship:m09');
for(const file of ['dist/index.html','dist/app.js']){
  const content=await readFile(file,'utf8');
  assert.doesNotMatch(content,/data-view=["']timeline|data-timeline|timeline-view|View timeline|>Timeline<|setView\(['"]timeline/,'Timeline must have no UI or action links in '+file);
}
assert.equal(decodeState('https://example.test/?view=timeline',defaults).view,'network');
assert.equal(decodeState('https://example.test/?view=timeline&record=event:missing',defaults).selected,null);
console.log('PASS navigation: four supported views, no Timeline links or controls, legacy links and saved event views open the network.');
