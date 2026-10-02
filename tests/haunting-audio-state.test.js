import test from 'node:test';import assert from 'node:assert/strict';
import {newHauntingAudio,advanceHauntingAudio} from '../haunting-audio-state.js';
import {ROOMS} from '../exploration.js';
const quiet=()=>0;
function enter(scene='classroom31',random=quiet){return advanceHauntingAudio(newHauntingAudio(random),.1,scene,false,random).state;}
function tick(state,seconds,scene=state.scene,ended=false,random=quiet){
 let cries=0;
 for(let i=0;i<Math.round(seconds*10);i++){const result=advanceHauntingAudio(state,.1,scene,ended,random);state=result.state;cries+=Number(result.cry);}
 return {state,cries};
}
test('모든 방에서 입장 즉시 울지 않고 12초 이상 체류한 뒤 한 번 울음 신호를 낸다',()=>{
 for(const {id} of ROOMS){
  const initial=enter(id);const before=tick(initial,11.9);assert.equal(before.cries,0);
  const at=advanceHauntingAudio(before.state,.1,id,false,quiet);assert.equal(at.cry,true);assert.equal(at.state.elapsed,0);
  assert.equal(tick(at.state,11.9).cries,0);assert.equal(tick(at.state,12).cries,1);
 }
});
test('12~22초 간격을 새로 정하고 방 변경·복귀·게임 오버는 체류 시간을 초기화한다',()=>{
 assert.equal(newHauntingAudio(()=>1).nextCry,22);assert.equal(newHauntingAudio(()=>.5).nextCry,17);
 const state=tick(enter(),11.9).state;
 for(const [scene,ended] of [['corridor',false],['classroom31',true],['title',false]]){
  const result=advanceHauntingAudio(state,.1,scene,ended,quiet);
  assert.equal(result.cry,false);assert.equal(result.state.elapsed,0);assert.equal(result.state.scene,null);
  const reenter=advanceHauntingAudio(result.state,.1,'classroom31',false,quiet);
  assert.equal(reenter.cry,false);assert.equal(tick(reenter.state,11.9).cries,0);
 }
 const change=advanceHauntingAudio(state,.1,'music',false,()=>1);assert.equal(change.cry,false);assert.equal(change.state.elapsed,0);assert.equal(change.state.nextCry,22);
 assert.equal(tick(change.state,21.9,'music',false,()=>1).cries,0);assert.equal(tick(change.state,22,'music',false,()=>1).cries,1);
 assert.equal(state.elapsed>11,true,'입력 상태는 변경하지 않는다');
});
test('백그라운드 지연·잘못된 dt가 울음을 한꺼번에 내지 않고 재시작은 독립적이다',()=>{
 let state=enter();
 for(const dt of [-10,NaN,Infinity])assert.equal(advanceHauntingAudio(state,dt,state.scene,false).state.elapsed,0);
 const delayed=advanceHauntingAudio(state,100,state.scene,false,quiet);assert.equal(delayed.cry,false);assert.equal(delayed.state.elapsed,.1);
 state=tick(state,12).state;assert.equal(state.elapsed,0);assert.equal(newHauntingAudio(quiet).scene,null);
 const invalid=newHauntingAudio(()=>NaN);assert.equal(invalid.nextCry,12);
});
