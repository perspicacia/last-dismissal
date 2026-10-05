import test from 'node:test';
import assert from 'node:assert/strict';
import { schoolAction, canChooseStairs } from '../school-route.js';
import { newGame, choose } from '../logic.js';
import { Corridor } from '../corridor.js';
test('교실은 연습 다음 가까운 문에서 선택 입장하고 내부에는 수집 조작이 없다',()=>{
  const p={x:0,z:5,angle:Math.PI};
  assert.equal(schoolAction(p,'corridor',true),null);
  assert.equal(schoolAction(p,'corridor',false),'enter');
  assert.equal(schoolAction(p,'classroom',false),null);
  assert.equal(schoolAction({x:0,z:20},'corridor',false),null);
});
test('연습 방화문 위치를 수집이나 해금 없이 통과한다',()=>{
  const c=Object.create(Corridor.prototype);c.scene='corridor';
  const p=c.move.call({...c,player:{x:0,z:7.45,angle:0}},new Set(['forward']),.05);
  assert.ok(p.z>7.5);
});
test('교실 방문 없이 계단 진행, 교실 안과 계단 밖에서는 금지',()=>{
  assert.equal(canChooseStairs('corridor',true),true);
  assert.equal(canChooseStairs('classroom',true),false);
  assert.equal(canChooseStairs('corridor',false),false);
});
test('수집 없이 연습·오답·다섯 번 탈출과 새 게임을 진행한다',()=>{
  let s=choose(newGame(),false,()=>0);
  assert.equal(canChooseStairs('corridor',true),true);
  s=choose(s,true,()=>0);assert.equal(s.progress,0);
  for(let i=0;i<5;i++)s=choose(s,Boolean(s.anomaly),()=>0);
  assert.equal(s.ended,true);
  const fresh=newGame();assert.equal(fresh.tutorial,true);assert.equal(fresh.progress,0);
});
