import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {nodes,edges,categories,relationships} from '../dist/data.js';
import {connectionSummary,focusedStyle,focusFlight,badgePosition} from '../dist/focused-explorer.js';
import {arrangeCanvas,scopedConnections} from '../dist/canvas-layout.js';
import {visibleEntities} from '../dist/semantic-map.js';
import {encodeState,decodeState} from '../dist/routing.js';

const graph={nodes,edges},amy=connectionSummary(graph,'amy-acton');
assert.equal(amy.links.length,15);assert.equal(amy.neighbors.size,15);
assert.equal(amy.types.find(item=>item.type==='endorsement').count,6);
assert.equal(amy.types.reduce((sum,item)=>sum+item.count,0),amy.links.length);
for(const degree of [0,1,3,40,100])assert.equal(focusedStyle(degree).opacity,1,'Direct neighbors have no overview degree threshold');
assert.ok(focusedStyle(30).radius>focusedStyle(1).radius);
assert.ok(focusedStyle(3,{pinned:true}).radius>focusedStyle(3).radius);
const degrees=new Map(nodes.map(node=>[node.id,connectionSummary(graph,node.id).links.length]));
const layouts=[];
for(const center of ['amy-acton','city','aep'])for(const width of [360,690,1230]){
  const local=scopedConnections(graph,new Set([center]),1),required=new Set(local.nodes.map(node=>node.id));
  const measurements=new Map(local.nodes.map(node=>{const style=focusedStyle(degrees.get(node.id),{anchor:node.id===center}),lines=Math.ceil(node.name.length/20),half=Math.max(style.radius+8,Math.min(20,node.name.length)*style.font*.29);return [node.id,{left:-half,right:half,top:-style.radius-8,bottom:style.radius+style.font*(lines+1)+14}];}));
  let height=548,layout,obstacles;
  for(let step=0;step<10;step++){
    obstacles=[{left:12,top:12,right:Math.min(width-12,320),bottom:125},{left:width-220,top:150,right:width-12,bottom:450}];
    layout=arrangeCanvas(local,{width,height,center,required,measurements,degrees,obstacles,centerPoint:{x:width/2,y:274}});
    if(!layout.latent.length)break;height+=Math.max(180,Math.ceil(required.size/Math.max(2,width/160))*55);
  }
  assert.equal(layout.latent.length,0,`${center}: every direct neighbor receives space at ${width}px`);
  const candidates=local.nodes.map(node=>{const p=layout.positions.get(node.id),m=measurements.get(node.id);return {id:node.id,opacity:1,box:{left:p.x+m.left,right:p.x+m.right,top:p.y+m.top,bottom:p.y+m.bottom}};});
  assert.equal(visibleEntities(candidates,{width,height,obstacles,gap:6}).ids.size,required.size,'All direct labels fit without overlap or panel collisions');
  layouts.push({center,width,height,entities:required.size});
}
const from={x:30,y:70,z:.72},to={x:0,y:0,z:1.8},anchor={x:300,y:200};
assert.deepEqual(focusFlight(from,to,anchor,0,700),from);assert.deepEqual(focusFlight(from,to,anchor,1,700),to);
let previous=focusFlight(from,to,anchor,0,700);
for(let step=1;step<=100;step++){const t=step/100,eased=t*t*(3-2*t),camera=focusFlight(from,to,anchor,eased,700);assert.ok(Object.values(camera).every(Number.isFinite)&&camera.z>0);assert.ok(Math.abs(camera.z-previous.z)<.06,'Camera changes continuously');previous=camera;}
assert.ok(focusFlight(to,to,anchor,.5,900).z<to.z,'Long flights pull back before settling');
const occupied=[{left:230,right:330,top:100,bottom:190}],route={start:{x:30,y:140},control:{x:280,y:140},end:{x:530,y:140}};
const badge=badgePosition(route,{width:560,height:350,occupied,size:22});
assert.ok(badge,'A crowded midpoint still receives a readable connection icon');assert.ok(badge.box.right<occupied[0].left||badge.box.left>occupied[0].right||badge.box.bottom<occupied[0].top||badge.box.top>occupied[0].bottom);
const state={view:'network',caseId:'all',history:true,categories:new Set(Object.keys(categories)),relationships:new Set(Object.keys(relationships)),selected:{kind:'node',id:'amy-acton'},focus:true,focusType:'endorsement',connectionDistance:1};
const restored=decodeState(encodeState('https://example.test/',state,'test'),state);assert.equal(restored.focusType,'endorsement');assert.equal(restored.selected.id,'amy-acton');
assert.equal(decodeState('https://example.test/?focusType=made-up',state).focusType,'');
const result={focus:'All 15 Amy Acton direct neighbors, without a degree threshold',types:'Record counts, icons and URL-persistent local type choice',layout:layouts,motion:'Continuous camera flight, exact endpoints and a gentle pullback',records:'Existing IDs and original objects retained'};
await writeFile('artifacts/focused-explorer-checks.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
