const assert = require('node:assert/strict');
const { createEdges, findTriangle, paint } = require('./logic.js');
const make = n => ({ n, edges: createEdges(n), result: null, triangle: null });
for (const color of ['red', 'blue']) {
 const s = make(5);
 for (const [a,b] of [[0,1],[0,2],[1,2]]) paint(s, s.edges.findIndex(e => e.a === a && e.b === b), color);
 assert.equal(s.result, 'over'); assert.deepEqual(s.triangle.vertices, [0,1,2]);
 const snapshot = JSON.stringify(s); assert.equal(paint(s, 4, 'blue'), false); assert.equal(JSON.stringify(s),snapshot);
}
const s = make(5);
paint(s,0,'red'); paint(s,0,'blue'); assert.equal(s.edges.filter(e=>e.color).length,1);
for (let i=0;i<s.edges.length;i++) { const e=s.edges[i]; paint(s,i, e.b-e.a === 1 || e.b-e.a === 4 ? 'red' : 'blue'); }
assert.equal(s.result,'clear');
for (const n of [5,6]) {
 const edges=createEdges(n); let safe=0;
 for(let mask=0;mask<2**edges.length;mask++) {
  edges.forEach((e,i)=>e.color=(mask>>i)&1?'red':'blue');
  const expected=edges.some(ab=>edges.some(ac=>ab.a===ac.a && ab.b<ac.b && ab.color===ac.color && edges.some(bc=>bc.a===ab.b && bc.b===ac.b && bc.color===ab.color)));
  assert.equal(!!findTriangle(n,edges),expected);
  if (!expected) safe++;
 }
 assert.equal(safe,n===5?12:0);
 console.log(`K${n}: ${2**edges.length} colorings checked; ${safe} triangle-free.`);
}
// K6 minus one edge can be triangle-free; either color on the last edge loses.
const partial=make(6);
partial.edges.forEach(e=> { if(e.a===4 && e.b===5)return; const a=e.a, b=e.b===5?4:e.b; e.color=b-a===1||b-a===4?'red':'blue'; });
assert.equal(findTriangle(6,partial.edges),null);
for(const color of ['red','blue']) {const final=structuredClone(partial);paint(final,14,color);assert.equal(final.result,'over');}
console.log('Recoloring, clear, both losing colors, frozen state, and final-edge loss passed.');
