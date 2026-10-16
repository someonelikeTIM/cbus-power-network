import assert from 'node:assert/strict';
import {nodes,edges} from '../dist/data.js';
import {connectionBuckets,bucketLayout,selectionGraph,segmentInBox,circleInBox,dollarLabel} from '../dist/map-actions.js';
import {validateView} from '../dist/saved-views.js';
const links=edges.filter(edge=>edge.source==='jobsohio'||edge.target==='jobsohio'),ids=new Set(links.flatMap(edge=>[edge.source,edge.target]));
const graph={nodes:nodes.filter(node=>ids.has(node.id)),edges:links};
const buckets=connectionBuckets(graph,'jobsohio');
assert.equal(buckets.flatMap(bucket=>bucket.nodes).length,graph.nodes.length);
assert.equal(new Set(buckets.flatMap(bucket=>bucket.nodes.map(node=>node.id))).size,graph.nodes.length);
assert.equal(buckets.find(bucket=>bucket.type==='anchor').nodes[0].id,'jobsohio');
for(const width of [290,780]){const layout=bucketLayout(graph,{anchor:'jobsohio',width});assert.equal(layout.positions.size,graph.nodes.length);for(const bucket of layout.buckets)for(const node of bucket.nodes){const p=layout.positions.get(node.id);assert.ok(p.x>bucket.left&&p.x<bucket.left+bucket.width);assert.ok(p.y>bucket.top&&p.y<bucket.top+bucket.height);}assert.deepEqual(bucketLayout(graph,{anchor:'jobsohio',width}),layout);}
const grant=edges.find(edge=>edge.id==='j29'),selected=selectionGraph(graph,new Set(),new Set(['j29']));assert.deepEqual(selected.edges,[grant]);assert.deepEqual(new Set(selected.nodes.map(node=>node.id)),new Set([grant.source,grant.target]));
assert.match(dollarLabel(grant),/\$310m.*commitment/);assert.equal(dollarLabel({label:'Unpriced registration',amount:10,unit:'people'}),'');
const box={left:10,right:30,top:10,bottom:30};assert.ok(segmentInBox({x:0,y:20},{x:40,y:20},box));assert.ok(!segmentInBox({x:0,y:0},{x:40,y:0},box));
assert.ok(circleInBox({x:20,y:20},4,box));assert.ok(circleInBox({x:5,y:20},5,box));assert.ok(!circleInBox({x:5,y:5},5,box));assert.ok(!circleInBox({x:40,y:20},4,box));
const view={query:'?group=type&amounts=1',positions:[],camera:{x:0,y:0,z:1},interaction:{entities:['jobsohio'],connections:['j29'],bucketIds:[...ids]}};
assert.deepEqual(validateView(view,new Set(nodes.map(node=>node.id))).interaction,view.interaction);
assert.throws(()=>validateView({...view,interaction:{connections:['invented']}},new Set(nodes.map(node=>node.id))));
console.log('PASS map actions: deterministic type buckets, exact selection records, amount qualifiers, rectangle crossing, and validated saved selections.');
