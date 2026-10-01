import test from 'node:test';
import assert from 'node:assert/strict';
import { createKeyDoor, keyDoorAction, interactKeyDoor, constrainKeyDoor } from '../key-door.js';
import { movePlayer, SPAWN } from '../movement.js';

test('열쇠는 3.2m 이내에서 방향과 무관하게 획득 가능',()=>{
  const state=createKeyDoor();
  assert.equal(keyDoorAction({x:2,z:.8,angle:Math.PI},state),'pickup');
  assert.equal(keyDoorAction({x:2,z:.79,angle:0},state),null);
  const acquired=interactKeyDoor({x:2,z:4,angle:Math.PI},state);
  assert.equal(acquired.hasKey,true);
  assert.equal(interactKeyDoor({x:2,z:4},acquired),acquired);
});
test('문은 열쇠 없이 열리지 않고 가까이서 열쇠로 개방',()=>{
  const player={x:0,z:7.5};const state=createKeyDoor();
  assert.equal(keyDoorAction(player,state),'locked');
  assert.equal(interactKeyDoor(player,state),state);
  const acquired=interactKeyDoor({x:2,z:4},state);
  assert.equal(keyDoorAction(player,acquired),'open');
  assert.equal(interactKeyDoor(player,acquired).doorOpen,true);
  assert.equal(keyDoorAction(player,interactKeyDoor(player,acquired)),null);
});
test('닫힌 문 이동 차단과 개방 뒤 통과',()=>{
  let player={...SPAWN,z:7.4};let state=createKeyDoor();
  player=constrainKeyDoor(movePlayer(player,new Set(['forward']),.05),state);
  assert.equal(player.z,7.5);
  state=interactKeyDoor({x:2,z:4},state);state=interactKeyDoor(player,state);
  player=constrainKeyDoor(movePlayer(player,new Set(['forward']),.05),state);
  assert.ok(player.z>7.5);
});
test('다음 복도에서는 열쇠 절차가 없고 새 게임은 초기화',()=>{
  const loop=createKeyDoor(false);
  assert.equal(loop.doorOpen,true);
  assert.equal(keyDoorAction({x:2,z:4},loop),null);
  assert.equal(constrainKeyDoor({x:0,z:15},loop).z,15);
  const reset=createKeyDoor();
  assert.deepEqual(reset,{tutorial:true,hasKey:false,doorOpen:false});
});

test('문 앞과 열쇠 획득 범위가 겹쳐도 열쇠를 먼저 획득한다',()=>{
  for (const player of [{x:2,z:6}, {x:2,z:7.2}, {x:0,z:6}]) {
    const state=createKeyDoor();
    assert.equal(keyDoorAction(player,state),'pickup');
    const acquired=interactKeyDoor(player,state);
    assert.equal(acquired.hasKey,true);
    assert.equal(acquired.doorOpen,false);
    assert.equal(keyDoorAction(player,acquired),'open');
  }
  assert.equal(keyDoorAction({x:2,z:7.21},createKeyDoor()),'locked');
});
