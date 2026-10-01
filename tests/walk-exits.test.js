import test from 'node:test';
import assert from 'node:assert/strict';
import { stairDirection } from '../walk-exits.js';
import { newGame, choose } from '../logic.js';
import { canChooseStairs } from '../school-route.js';
test('끝의 왼쪽/오른쪽 입구만 전환하며 중앙·교실·진입 전에는 전환하지 않는다',()=>{
  assert.equal(stairDirection({x:-1.5,z:24}),true);
  assert.equal(stairDirection({x:1.5,z:24}),false);
  assert.equal(stairDirection({x:0,z:24.6}),null);
  assert.equal(stairDirection({x:1.5,z:23.99}),null);
  assert.equal(stairDirection({x:1.5,z:24},'classroom'),null);
});
test('걷는 계단도 연습/확인표 조건과 다섯 번 탈출·새 복도 중복 방지를 유지한다',()=>{
  let s=newGame();
  s=choose(s,stairDirection({x:1.5,z:24}),()=>0);
  assert.equal(s.tutorial,false);
  assert.equal(s.progress,0);
  assert.equal(canChooseStairs('corridor',true,false,{confirmed:false}),false);
  for(let i=0;i<5;i++) {
    assert.equal(canChooseStairs('corridor',true,false,{confirmed:true}),true);
    s=choose(s,stairDirection({x:1.5,z:24}),()=>0);
    assert.equal(stairDirection({x:0,z:1.8}),null);
  }
  assert.equal(s.ended,true);
  assert.equal(choose(s,false),s);
});
