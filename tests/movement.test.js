import test from 'node:test';
import assert from 'node:assert/strict';
import { SPAWN, movePlayer, nearbyItem, revealsTeeth } from '../movement.js';
test('teeth reveal only when approaching and facing the anomalous mascot',()=>{
  assert.equal(revealsTeeth({x:0,z:13,angle:0},'figure'),true);
  assert.equal(revealsTeeth({x:0,z:13,angle:Math.PI},'figure'),false);
  assert.equal(revealsTeeth(SPAWN,'figure'),false);
  assert.equal(revealsTeeth({x:0,z:13,angle:0},null),false);
  assert.equal(revealsTeeth(SPAWN,'figure',true),true);
  assert.equal(revealsTeeth(SPAWN,null,true),false);
});
test('arrows move forward/back and rotate without changing position',()=>{
  const forward=movePlayer(SPAWN,new Set(['forward']),.05);
  assert.ok(forward.z>SPAWN.z);assert.equal(forward.x,0);
  assert.ok(movePlayer(SPAWN,new Set(['back']),.05).z<SPAWN.z);
  const right=movePlayer(SPAWN,new Set(['right']),.05);
  assert.ok(right.angle>0);assert.equal(right.z,SPAWN.z);
  assert.ok(movePlayer(right,new Set(['forward']),.05).x>0);
});
test('movement respects walls, end of corridor and frame time cap',()=>{
  let p={x:2.55,z:24.6,angle:Math.PI/4};
  for(let i=0;i<100;i++)p=movePlayer(p,new Set(['forward']),1);
  assert.equal(p.x,2.55);assert.equal(p.z,24.6);
  assert.deepEqual(movePlayer(SPAWN,new Set(['forward']),1),movePlayer(SPAWN,new Set(['forward']),.05));
});
test('inspect requires proximity and facing the object',()=>{
  assert.equal(nearbyItem({x:-1,z:5,angle:-Math.PI/2},null),'door');
  assert.equal(nearbyItem({x:-1,z:5,angle:Math.PI/2},null),'window');
  assert.equal(nearbyItem({x:0,z:12,angle:0},null),null);
});
