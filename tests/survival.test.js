import test from 'node:test';import assert from 'node:assert/strict';
import {newSurvival,advanceSurvival,toggleDoor,doorClosed,rabbitPosition} from '../survival.js';
const until=(s,t,scene='corridor')=>{while(s.elapsed+1e-7<t&&!s.ended)s=advanceSurvival(s,Math.min(.05,t-s.elapsed),scene);return s;};
test('경고는 위치 변화로 전달하고 방어하지 않으면 첫 공격에 종료',()=>{
 let s=until(newSurvival(),10.05);assert.equal(s.phase,'warning');const far=rabbitPosition(s);s=until(s,15);assert.ok(rabbitPosition(s)<far);s=until(s,16.05);assert.equal(s.outcome,'caught');assert.equal(advanceSurvival(s,1,'classroom'),s);
});
test('교실 문으로 세 번 방어하고 60초 탈출·재시작 초기화',()=>{
 let s=newSurvival();for(const time of [13,33,53]){s=until(s,time,'classroom');s=toggleDoor(s,'classroom');s=until(s,time+4,'classroom');assert.equal(s.ended,false);}
 s=until(s,60,'classroom');assert.equal(s.outcome,'escaped');assert.equal(s.defended,3);assert.deepEqual(newSurvival(),{elapsed:0,phase:'watch',doorUntil:0,recoveryUntil:0,resolved:0,defended:0,ended:false,outcome:null});
});
test('너무 이른 닫기·회복 중 연타·교실 밖 닫기로는 방어 불가',()=>{
 let s=toggleDoor(newSurvival(),'classroom');s=until(s,7.1,'classroom');assert.equal(doorClosed(s),false);assert.equal(toggleDoor(s,'classroom'),s);s=until(s,16.1,'classroom');assert.equal(s.outcome,'caught');assert.equal(toggleDoor(newSurvival(),'corridor').doorUntil,0);
});
test('공격 순간 문 만료면 실패하며 공격은 한 번만 판정',()=>{
 let s={...newSurvival(),elapsed:15.95,phase:'warning',doorUntil:16};assert.equal(advanceSurvival(s,.1,'classroom').outcome,'caught');s={...s,doorUntil:17};s=advanceSurvival(s,.1,'classroom');assert.equal(s.defended,1);s=advanceSurvival(s,.05,'classroom');assert.equal(s.defended,1);
});
test('잘못된 경과 시간 제한 및 직접 문 열기 회복',()=>{
 const s=newSurvival();assert.equal(advanceSurvival(s,NaN,'corridor').elapsed,0);assert.equal(advanceSurvival(s,10,'corridor').elapsed,.1);let closed=toggleDoor(s,'classroom');closed=toggleDoor(closed,'classroom');assert.equal(doorClosed(closed),false);assert.equal(toggleDoor(closed,'classroom'),closed);
});
