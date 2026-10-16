import assert from 'node:assert/strict';
import {nodes,edges} from '../dist/data.js';
import {connectedCanvas,labelPlacements,appendWalk,networkStyle,networkPositions,orbitalBranch,flyoutPlacement,explorationSpace,clearNodeCamera} from '../dist/desktop-network.js';
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

const world=networkPositions({nodes,edges}),sun={...world.get('ginther-fund')},first=orbitalBranch({nodes,edges},'ginther-fund',world);
assert.equal(first.positions.size,10);assert.deepEqual(world.get('ginther-fund'),sun,'The anchor never moves');
for(const [id,p]of first.positions){assert.ok(Math.abs(Math.hypot(p.x-sun.x,p.y-sun.y)-240)<.02);world.set(id,p);}
const frozen=new Map([...first.placed].map(id=>[id,{...world.get(id)}]));
const repeat=orbitalBranch({nodes,edges},'ginther-fund',world,first.placed);assert.equal(repeat.positions.size,0,'Repeated expansion never runs another layout');
const next=orbitalBranch({nodes,edges},'alison-marker',world,first.placed,{parent:'ginther-fund'});
for(const [id,p]of next.positions){assert.ok(!frozen.has(id));world.set(id,p);}
for(const [id,p]of frozen)assert.deepEqual(world.get(id),p,'Expanding the next planet preserves every previously placed entity');
const geometry={width:1200,height:700,size:{width:300,height:400},preferred:{left:420,top:100},points:[{x:500,y:300,r:30}],segments:[[{x:300,y:300},{x:650,y:300}]]};
const windowBox=flyoutPlacement(geometry);assert.ok(windowBox.right<300||windowBox.left>650||windowBox.bottom<288||windowBox.top>312,'The flyout clears the active entity and path');
const space=explorationSpace(1200,700,[{left:800,right:1180,top:60,bottom:650},{left:490,right:790,top:70,bottom:520}]);assert.ok(space.right<=474&&space.width>=400);
const windowState={manual:true,left:750,top:90,width:340,height:380};
const saved=validateView({...snapshot,interaction:{walk,showDirect:true,orbitIds:[...first.placed],flyout:windowState}},entityIds);
assert.deepEqual(saved.interaction.orbitIds,[...first.placed]);assert.deepEqual(saved.interaction.flyout,windowState);
assert.throws(()=>validateView({...snapshot,interaction:{orbitIds:['missing']}},entityIds));
assert.throws(()=>validateView({...snapshot,interaction:{flyout:{...windowState,width:'large'}}},entityIds));
const cameraPoints=new Map([['sun',{x:0,y:0}],['up',{x:0,y:-240}],['down',{x:0,y:240}]]),controls=[{left:0,right:220,top:500,bottom:680},{left:0,right:320,top:10,bottom:120}];
const clear=clearNodeCamera({x:240,y:340,z:1},cameraPoints.keys(),cameraPoints,{width:1200,height:700,obstacles:controls});
for(const p of cameraPoints.values()){const x=p.x*clear.z+clear.x,y=p.y*clear.z+clear.y;assert.ok(x>=26&&x<=1174&&y>=26&&y<=674);for(const b of controls){const px=Math.max(b.left,Math.min(x,b.right)),py=Math.max(b.top,Math.min(y,b.bottom));assert.ok(Math.hypot(x-px,y-py)>=24,'Camera framing keeps direct entities clear of controls');}}
console.log('PASS readable exploration: orphan filtering, nonoverlapping labels, minimum node sizes, explicit source-linked traversal, and saved origin/path state.');
