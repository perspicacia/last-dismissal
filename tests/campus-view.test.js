import test from 'node:test';
import assert from 'node:assert/strict';
import {classroomWindowColumn, CAMPUS_WIDTH, drawCampusView} from '../campus-view.js';
test('교실 다섯 창은 동일 타일 대신 하나의 풍경에서 서로 다른 연속 영역을 읽는다',()=>{
  const starts=[1.8,3.25,4.7,6.15,7.6].map(z=>classroomWindowColumn(z));
  assert.equal(new Set(starts).size,5);assert.equal(starts[0],0);
  for(let i=1;i<starts.length;i++)assert.ok(starts[i]>starts[i-1]);
  assert.ok(Math.abs(classroomWindowColumn(3.25)-classroomWindowColumn(3.249))<=1);
  assert.equal(classroomWindowColumn(8.9),CAMPUS_WIDTH-1);
  assert.equal(classroomWindowColumn(-1),0);assert.equal(classroomWindowColumn(20),CAMPUS_WIDTH-1);
});
test('운동장 시차는 정지 시 결정적이고 비정상 값을 안전하게 제한한다',()=>{
  const render=viewOffset=>{const ops=[],gradient={addColorStop(...a){ops.push(['stop',...a]);}};const c=new Proxy({}, {get:(_,k)=>(...a)=>{ops.push([k,...a]);return String(k).startsWith('create')?gradient:undefined;},set:()=>true});drawCampusView(c,{viewOffset});return ops;};
  assert.deepEqual(render(0),render(0));assert.deepEqual(render(NaN),render(0));assert.deepEqual(render(20),render(1));assert.notDeepEqual(render(0),render(1));
});
