import test from 'node:test';
import assert from 'node:assert/strict';
import {stairFlight} from '../stairs.js';
import {stairDirection} from '../walk-exits.js';
test('상승·하강 계단은 기존 좌우 입구와 일치하고 높이가 반대로 변한다',()=>{
  for(const up of [true,false]) {
    const f=stairFlight(up);assert.equal(stairDirection({x:(f.left+f.right)/2,z:24}),up);
    assert.equal(f.steps.length,12);assert.equal(f.steps[0].previous,0);
    for(let i=0;i<f.steps.length;i++){
      const s=f.steps[i];assert.ok(up?s.level>s.previous:s.level<s.previous);
      assert.ok(s.far>s.near);
      if(i){assert.equal(s.near,f.steps[i-1].far);assert.equal(s.previous,f.steps[i-1].level);}
    }
  }
});
