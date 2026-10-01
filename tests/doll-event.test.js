import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceDoll,newDollState,dollRise} from '../doll-event.js';
import {choose} from '../logic.js';
const player={x:-1.05,z:4.2,angle:0};
const input={scene:'classroom',anomaly:'doll',player,dt:.05};
function tick(state,count,options={}){for(let i=0;i<count;i++)state=advanceDoll(state,{...input,...options});return state;}
test('normal and other anomalies keep doll lying',()=>{
 for(const anomaly of [null,'figure','window'])assert.equal(tick(newDollState(),100,{anomaly}).phase,'lying');
});
test('requires close uninterrupted gaze and loaded assets',()=>{
 for(const options of [{player:{...player,z:1}},{player:{...player,angle:Math.PI}},{ready:false},{scene:'corridor'}])assert.equal(tick(newDollState(),20,options).phase,'lying');
 let state=tick(newDollState(),4);assert.ok(state.gaze>0);
 state=tick(state,1,{player:{...player,angle:Math.PI}});assert.equal(state.gaze,0);
 assert.equal(tick(state,4).phase,'lying');assert.equal(tick(state,7).phase,'rising');
});
test('rises once and preserves standing across classroom exit and return',()=>{
 let state=tick(newDollState(),7);assert.equal(state.phase,'rising');
 const away=tick(state,20,{scene:'corridor'});assert.deepEqual(away,state);
 state=tick(away,12);assert.equal(state.phase,'standing');assert.equal(dollRise(state),1);
 assert.deepEqual(tick(state,100),state);assert.deepEqual(tick(state,20,{scene:'corridor'}),state);
 assert.deepEqual(newDollState(),{phase:'lying',gaze:0,elapsed:0});
});
test('elapsed time is capped and nonfinite time cannot trigger reveal',()=>{
 assert.equal(tick(newDollState(),1,{dt:10}).gaze,.05);
 assert.equal(tick(newDollState(),100,{dt:NaN}).phase,'lying');
});
test('doll anomaly uses upstairs judgement',()=>{
 assert.equal(choose({tutorial:false,anomaly:'doll',progress:0,attempts:0,ended:false},true).progress,1);
});
