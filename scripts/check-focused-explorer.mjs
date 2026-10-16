import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {nodes,edges,categories,relationships} from '../dist/data.js';
import {connectionSummary,focusedStyle,focusFlight,badgePosition,badgePorts,packFocus,extendTrail} from '../dist/focused-explorer.js';
import {scopedConnections} from '../dist/canvas-layout.js';
import {visibleEntities,connectionRoute} from '../dist/semantic-map.js';
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
const wrap=name=>{const lines=[];let line='';for(const word of name.split(' ')){if(line&&(line+' '+word).length>20){lines.push(line);line=word;}else line=(line+' '+word).trim();}if(line)lines.push(line);return lines;};
for(const center of ['amy-acton','city','aep'])for(const [width,height]of [[340,624],[690,683],[1230,548]]){
  const local=scopedConnections(graph,new Set([center]),1),required=new Set(local.nodes.map(node=>node.id));
  const searchWidth=width<600?width-20:width<800?250:310;
  const obstacles=[{left:10,top:10,right:10+searchWidth,bottom:108},
    width<600?{left:10,top:116,right:width-10,bottom:147}:{left:Math.max(330,width-330),top:10,right:width-10,bottom:52},
    {left:10,top:height-124,right:width-10,bottom:height-68},
    {left:10,top:height-50,right:Math.min(220,width/2),bottom:height-10},
    {left:width-150,top:height-50,right:width-10,bottom:height-10},
    {left:width-(width<600?178:200),top:height/2-55,right:width-16,bottom:height/2+55}];
  let layout,items,compactUsed=false;
  outer:for(const compact of [false,true])for(const density of [1,.9,.8,.7,.6,.5,.4,.3,.25]){
    const styles=new Map(local.nodes.map(node=>{const style=focusedStyle(degrees.get(node.id),{anchor:node.id===center,density});if(compact&&node.id!==center)style.radius=Math.max(9,style.radius);return [node.id,style];}));
    const boxes=new Map(local.nodes.map(node=>{const style=styles.get(node.id),r=style.radius,lines=wrap(node.name),half=compact&&node.id!==center?r+5:Math.max(r+5,...lines.map(line=>line.length*style.font*.28+2));return [node.id,{left:-half,right:half,top:-r-5,bottom:compact&&node.id!==center?r+5:r+7+style.font*(lines.length+.2)+2}];}));
    const ports=badgePorts(local.edges,center,id=>styles.get(id),density);
    for(const port of ports.values()){const box=boxes.get(port.owner);box.left=Math.min(box.left,port.x-port.size/2-3);box.top=Math.min(box.top,port.y-port.size/2-3);box.bottom=Math.max(box.bottom,port.y+port.size/2+3);}
    items=local.nodes.map(node=>({id:node.id,box:boxes.get(node.id),required:true}));
    layout=packFocus(items,{width,height,obstacles,center,gap:compact?3:6.5});
    if(!layout.latent.length){compactUsed=compact;break outer;}
  }
  assert.equal(layout.latent.length,0,`${center}: every direct neighbor fits the fixed ${width} x ${height} viewport`);
  const candidates=items.map(item=>{const p=layout.positions.get(item.id),m=item.box;return {id:item.id,opacity:1,box:{left:p.x+m.left,right:p.x+m.right,top:p.y+m.top,bottom:p.y+m.bottom}};});
  assert.equal(visibleEntities(candidates,{width,height,obstacles,gap:0}).ids.size,required.size,'Entities, labels and reserved icons do not overlap panels or one another');
  layouts.push({center,width,height,entities:required.size,compactNames:compactUsed});
}
let trail=extendTrail(null,graph,{to:'amy-acton'});
trail=extendTrail(trail,graph,{from:'amy-acton',to:'david-pepper'});
trail=extendTrail(trail,graph,{from:'david-pepper',to:'ohio-democrats'});
assert.deepEqual([...trail.nodes],['amy-acton','david-pepper','ohio-democrats']);
assert.deepEqual([...trail.edges],['pc26-ticket-amy-acton','pc26-pepper-party']);
const edgeOnlyTrail=extendTrail({nodes:['unknown'],edges:['pc26-ticket-amy-acton','unknown']},graph);
assert.deepEqual([...edgeOnlyTrail.nodes].sort(),['amy-acton','david-pepper']);assert.deepEqual([...edgeOnlyTrail.edges],['pc26-ticket-amy-acton'],'Shared trails keep valid record endpoints and discard unknown IDs');
const disconnected=extendTrail(trail,graph,{from:'ohio-democrats',to:'aep'});
assert.equal(disconnected.edges.size,trail.edges.size,'An unrelated search never invents a connecting line');
const shownPath=extendTrail(trail,graph,{path:{nodes:['city','redflex'],edges:['e99']}});
assert.ok([...trail.nodes].every(id=>shownPath.nodes.has(id)),'Showing another path retains previous explored steps');
for(const id of shownPath.edges)assert.ok(edges.some(edge=>edge.id===id),'Trails reference original relationship records only');
const from={x:30,y:70,z:.72},to={x:0,y:0,z:1.8},anchor={x:300,y:200};
assert.deepEqual(focusFlight(from,to,anchor,0,700),from);assert.deepEqual(focusFlight(from,to,anchor,1,700),to);
let previous=focusFlight(from,to,anchor,0,700);
for(let step=1;step<=100;step++){const t=step/100,eased=t*t*(3-2*t),camera=focusFlight(from,to,anchor,eased,700);assert.ok(Object.values(camera).every(Number.isFinite)&&camera.z>0);assert.ok(Math.abs(camera.z-previous.z)<.06,'Camera changes continuously');previous=camera;}
assert.ok(focusFlight(to,to,anchor,.5,900).z<to.z,'Long flights pull back before settling');
const occupied=[{left:230,right:330,top:100,bottom:190}],route={start:{x:30,y:140},control:{x:280,y:140},end:{x:530,y:140}};
const badge=badgePosition(route,{width:560,height:350,occupied,size:22});
assert.ok(badge,'A crowded midpoint can use another point on the same connection');assert.ok(badge.box.right<occupied[0].left||badge.box.left>occupied[0].right||badge.box.bottom<occupied[0].top||badge.box.top>occupied[0].bottom);
const state={view:'network',caseId:'all',history:true,categories:new Set(Object.keys(categories)),relationships:new Set(Object.keys(relationships)),selected:{kind:'node',id:'amy-acton'},focus:true,focusType:'endorsement',connectionDistance:1};
const restored=decodeState(encodeState('https://example.test/',state,'test'),state);assert.equal(restored.focusType,'endorsement');assert.equal(restored.selected.id,'amy-acton');
assert.equal(decodeState('https://example.test/?focusType=made-up',state).focusType,'');
state.trailNodes=trail.nodes;state.trailEdges=trail.edges;state.collapsedNodes=new Set(['ohio-democrats']);
const savedTrail=decodeState(encodeState('https://example.test/',state,'test'),state);assert.deepEqual(savedTrail.trailNodes,trail.nodes);assert.deepEqual(savedTrail.trailEdges,trail.edges);assert.ok(savedTrail.collapsedNodes.has('ohio-democrats'));
const blocked=badgePosition(route,{width:560,height:350,occupied:[{left:0,right:560,top:0,bottom:350}],size:22});assert.equal(blocked,null,'A badge is never moved off its connection to escape a collision');
const bounded=connectionRoute({x:100,y:280},{x:500,y:180},{width:560,height:350,bounded:true,obstacles:[{left:220,right:370,top:160,bottom:260}]});
assert.ok(bounded.control.x>=8&&bounded.control.x<=552&&bounded.control.y>=8&&bounded.control.y<=342);assert.equal(bounded.outside,0,'Focused lines remain inside the same visible canvas as their icons');
const result={focus:'All 15 Amy Acton direct neighbors, without a degree threshold',types:'Record counts, icons and URL-persistent local type choice',layout:layouts,trail:'Unpinned steps and real records persist; disconnected searches add no fictional edge; URL state includes explicit collapse',motion:'Continuous camera flight, exact endpoints and a gentle pullback',records:'Existing IDs and original objects retained'};
await writeFile('artifacts/focused-explorer-checks.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
