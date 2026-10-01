import test from 'node:test';
import assert from 'node:assert/strict';
import { createSchoolRoute, schoolAction, confirmAttendance, canChooseStairs } from '../school-route.js';
test('교실은 연습 다음 가까운 문에서 입장하고 조준이 필요 없다', () => {
  const r=createSchoolRoute(), p={x:0,z:5,angle:Math.PI};
  assert.equal(schoolAction(p,'corridor',true,r),null);
  assert.equal(schoolAction(p,'corridor',false,r),'enter');
  assert.equal(schoolAction({x:0,z:20},'corridor',false,r),null);
});
test('확인표는 교실의 가까운 책상에서만 얻으며 중복 획득하지 않는다', () => {
  const r=createSchoolRoute(), p={x:1.2,z:5};
  assert.equal(confirmAttendance(p,'corridor',r),r);
  assert.equal(confirmAttendance({x:0,z:1.4},'classroom',r),r);
  const confirmed=confirmAttendance(p,'classroom',r);
  assert.equal(confirmed.confirmed,true);
  assert.equal(confirmAttendance(p,'classroom',confirmed),confirmed);
  assert.equal(createSchoolRoute().confirmed,false);
});
test('교실 안 계단 판정 금지, 확인표 보유 후 복도 진행 가능', () => {
  const r=createSchoolRoute();
  assert.equal(canChooseStairs('corridor',true,true,r),true);
  assert.equal(canChooseStairs('corridor',true,false,r),false);
  assert.equal(canChooseStairs('classroom',true,false,{confirmed:true}),false);
  assert.equal(canChooseStairs('corridor',true,false,{confirmed:true}),true);
  assert.equal(canChooseStairs('corridor',false,false,{confirmed:true}),false);
});
