import test from 'node:test';
import assert from 'node:assert/strict';
import {clockAngles} from '../clock.js';
test('정상 시계는 23:17이며 이상 시계의 두 바늘은 아래를 향한다',()=>{
  const normal=clockAngles();assert.ok(Math.abs(normal[0]-(11+17/60)*Math.PI/6)<1e-10);assert.ok(Math.abs(normal[1]-17*Math.PI/30)<1e-10);
  assert.deepEqual(clockAngles(true),[Math.PI,Math.PI]);
});
