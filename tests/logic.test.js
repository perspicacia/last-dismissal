import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, choose, demoSequence, anomalies, nextAnomaly } from '../logic.js';
test('tutorial does not award progress; five correct choices escape',()=>{
  let s = choose(newGame(true),false);
  assert.equal(s.progress,0); assert.equal(s.tutorial,false);
  for(const anomaly of demoSequence) { assert.equal(s.anomaly,anomaly); s=choose(s,Boolean(anomaly)); }
  assert.equal(s.ended,true); assert.equal(s.progress,5); assert.equal(s.attempts,5);
  assert.deepEqual(choose(s,true),s);
});
test('incorrect choice resets streak and deterministic demo sequence',()=>{
  let s=choose(newGame(true),false); s=choose(s,false); assert.equal(s.progress,1);
  s=choose(s,false); assert.equal(s.correct,false);assert.equal(s.progress,0);assert.equal(s.anomaly,null);
});
test('random anomalies remain valid and avoid consecutive same anomaly',()=>{
  for(const previous of anomalies) for(let i=0;i<100;i++){
    const a=nextAnomaly({...newGame(),previous},()=>i/100);
    assert.ok(a===null || anomalies.includes(a)); assert.notEqual(a,previous);
  }
});
