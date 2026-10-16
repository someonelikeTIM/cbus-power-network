import assert from 'node:assert/strict';
import {nodes,edges} from '../dist/data.js';
import {connectedCanvas,labelPlacements,appendWalk,networkStyle} from '../dist/desktop-network.js';
import {validateView} from '../dist/saved-views.js';

const fixture={nodes:['a','b','c','orphan'].map(id=>({id})),edges:[{id:'ab',source:'a',target:'b',type:'one'},{id:'bc',source:'b',target:'c',type:'two'}]};
assert.deepEqual(connectedCanvas(fixture).nodes.map(n=>n.id),['a','b','c']);
assert.deepEqual(connectedCanvas({...fixture,edges:fixture.edges.slice(0,1)}).nodes.map(n=>n.id),['a','b']);
assert.equal(connectedCanvas({...fixture,edges:[]}).nodes.length,0);
assert.deepEqual(connectedCanvas(fixture).edges,fixture.edges,'Canvas orphan filtering retains original relationship records');

const items=Array.from({length:45},(_,i)=>({id:'n'+i,x:100+i%9*34,y:100+Math.floor(i/9)*35,r:9,w:95,h:28,priority:i===0?10000:45-i}));
const before=structuredClone(items),obstacles=[{left:0,top:0,right:180,bottom:65}],labels=labelPlacements(items,{width:900,height:600,obstacles});
assert.ok(labels.has('n0'));assert.ok(labels.size>5&&labels.size<items.length);
for(const a of labels.values()){
  assert.ok(a.left>=8&&a.right<=892&&a.top>=8&&a.bottom<=592);
  for(const b of labels.values())if(a!==b)assert.ok(a.right<=b.left||a.left>=b.right||a.bottom<=b.top||a.top>=b.bottom,'Visible labels never overlap');
  assert.ok(obstacles.every(b=>a.right<=b.left||a.left>=b.right||a.bottom<=b.top||a.top>=b.bottom));
}
assert.deepEqual(items,before,'Label placement does not move any entity');
for(const zoom of [.06,.2,.4,1,3]){assert.ok(networkStyle(1,zoom).radius>=6);assert.equal(networkStyle(1,zoom,{selected:true}).radius,18);}

let walk=appendWalk([],'nexstar',{edges});
walk=appendWalk(walk,'nexstar-operating',{from:'nexstar',via:'m16',edges});
walk=appendWalk(walk,'wcmh',{from:'nexstar-operating',via:'m15',edges});
assert.deepEqual(walk,[{id:'nexstar',via:''},{id:'nexstar-operating',via:'m16'},{id:'wcmh',via:'m15'}]);
assert.throws(()=>appendWalk(walk,'wcmh',{from:'nexstar',via:'m20',edges}));
assert.equal(appendWalk(walk,'city',{edges}).at(-1).via,'','An unrelated branch receives no invented connection');
const entityIds=new Set(nodes.map(n=>n.id)),snapshot={query:'',positions:[],camera:{x:0,y:0,z:.4},interaction:{walk,showDirect:true}};
const restored=validateView(snapshot,entityIds);
assert.deepEqual(restored.interaction.walk,walk);assert.equal(restored.interaction.showDirect,true);
assert.throws(()=>validateView({...snapshot,interaction:{walk:[walk[0],{id:'wcmh',via:'m20'}]}},entityIds));
console.log('PASS readable exploration: orphan filtering, nonoverlapping labels, minimum node sizes, explicit source-linked traversal, and saved origin/path state.');
