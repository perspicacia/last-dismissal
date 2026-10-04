import test from 'node:test';import assert from 'node:assert/strict';
import {newStairHaunt,advanceStairHaunt,stairSoundPan} from '../stair-haunt.js';
import {STAIR_STEPS,STAIR_SOUND_DURATION} from '../stair-haunt-sound.js';
import {effectSamples} from '../sound-effects.js';
import {SchoolAudio} from '../audio.js';
const near={x:0,z:23,angle:0};
const tick=(state,dt=.1,scene='corridor',player=near,ended=false)=>advanceStairHaunt(state,dt,scene,player,ended);
test('either stair approach requires brief dwell and triggers once without changing position',()=>{
 for(const x of [-2.55,2.55]){
  const player={...near,x},copy={...player};let result=tick(newStairHaunt(),.1,'corridor',player);assert.equal(result.cue,false);
  result=tick(result.state,.1,'corridor',player);assert.equal(result.cue,false);
  result=tick(result.state,.1,'corridor',player);assert.equal(result.cue,true);assert.equal(result.state.triggered,true);assert.deepEqual(player,copy);
  for(let i=0;i<100;i++){result=tick(result.state);assert.equal(result.cue,false);}
 }
});
test('distant corridor, classroom and ended games do not accumulate a stair cue',()=>{
 for(const [scene,player,ended] of [['corridor',{...near,z:22},false],['classroom',near,false],['music',near,false],['corridor',near,true]]){
  let result=tick(newStairHaunt(),.1,scene,player,ended);for(let i=0;i<100;i++)result=tick(result.state,.1,scene,player,ended);assert.deepEqual(result,{state:newStairHaunt(),cue:false});
 }
 assert.equal(tick(newStairHaunt(),.1,'corridor',{...near,z:NaN}).cue,false);
});
test('leaving before dwell resets it, while a spent cue survives rooms and reapproach',()=>{
 let result=tick(newStairHaunt(),.1);result=tick(result.state,.1);result=tick(result.state,.1,'music');assert.equal(result.state.elapsed,0);
 result=tick(result.state);assert.equal(result.cue,false);result=tick(result.state);result=tick(result.state);assert.equal(result.cue,true);
 result=tick(result.state,.1,'music');result=tick(result.state,.1,'corridor',{...near,z:5});result=tick(result.state);assert.equal(result.cue,false);assert.equal(result.state.triggered,true);
 assert.deepEqual(newStairHaunt(),{elapsed:0,triggered:false});
});
test('invalid or long frames cannot skip the lead-in, and paused time is not advanced',()=>{
 let result=tick(newStairHaunt(),100);assert.equal(result.state.elapsed,.1);assert.equal(result.cue,false);
 for(const dt of [NaN,Infinity,-1,0]){const frozen=tick(result.state,dt);assert.deepEqual(frozen.state,result.state);assert.equal(frozen.cue,false);}
 result=tick(result.state,100);assert.equal(result.cue,false);result=tick(result.state,100);assert.equal(result.cue,true);
});
test('below-stair stereo position follows listener yaw, is bounded and has a bad-input fallback',()=>{
 assert.ok(stairSoundPan(near)>0);assert.ok(stairSoundPan({...near,angle:Math.PI})<0);
 assert.equal(stairSoundPan({x:1.65,z:24.6,angle:0}),0);
 for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2])assert.ok(Math.abs(stairSoundPan({...near,angle}))<=.7);
 assert.equal(stairSoundPan({...near,x:NaN}),0);
});
test('scrape, pause, accelerating footfalls and fading reflection use one finite buffer',()=>{
 const gaps=STAIR_STEPS.slice(1).map((time,i)=>time-STAIR_STEPS[i]);for(let i=1;i<gaps.length;i++)assert.ok(gaps[i]<gaps[i-1]);
 for(const rate of [8000,16000,44100]){
  const data=effectSamples('stair-haunt',rate);assert.equal(data.length,Math.ceil(STAIR_SOUND_DURATION*rate));assert.ok(data.every(Number.isFinite));
  let peak=0;for(const sample of data)peak=Math.max(peak,Math.abs(sample));assert.ok(peak<=.720001);assert.equal(Math.abs(data[0]),0);assert.ok(data.slice(-Math.ceil(rate*.05)).every(sample=>sample===0));
  const rms=(start,end)=>{const part=data.slice(Math.round(start*rate),Math.round(end*rate));return Math.sqrt(part.reduce((sum,x)=>sum+x*x,0)/part.length);};
  assert.ok(rms(.1,.6)>.01);assert.ok(rms(1.16,1.24)<rms(.1,.6)*.1);assert.ok(rms(2.65,2.76)>rms(1.30,1.41)*3);assert.ok(rms(2.97,3.08)>0,'last landing retains its stairwell echo');
 }
 assert.deepEqual(effectSamples('stair-haunt',8000),effectSamples('stair-haunt',8000));
});
function mockAudio(stereo=true){
 const audio=new SchoolAudio(),sources=[],gains=[],panners=[];audio.master={};
 const node=()=>({connect(target){this.output=target;return target;},disconnect(){this.disconnected=true;}});
 audio.ctx={state:'running',sampleRate:8000,currentTime:0,createBuffer(ch,n){const data=new Float32Array(n);return {getChannelData:()=>data};},createGain(){const gain={...node(),gain:{}};gains.push(gain);return gain;},createBufferSource(){const source={...node(),start(){this.started=true;},stop(){this.stopped=true;}};sources.push(source);return source;}};
 if(stereo)audio.ctx.createStereoPanner=()=>{const panner={...node(),pan:{}};panners.push(panner);return panner;};
 return {audio,sources,gains,panners};
}
test('stair effect routes through pan and master, reuses its buffer and cancels all queued sound',()=>{
 const {audio,sources,gains,panners}=mockAudio(),cues=[];audio.onEffect=(...cue)=>cues.push(cue);
 assert.equal(audio.stairHaunt(.4),true);assert.equal(gains[0].gain.value,.36);assert.equal(gains[0].output,panners[0]);assert.equal(panners[0].output,audio.master);assert.equal(panners[0].pan.value,.4);assert.deepEqual(cues,[['stair-haunt',{source:'synthesis',pan:.4}]]);
 const buffer=sources[0].buffer;sources[0].onended();assert.equal(audio.effects.size,0);assert.equal(panners[0].disconnected,true);
 assert.equal(audio.stairHaunt(-.3),true);assert.equal(sources[1].buffer,buffer);audio.clearEffects();assert.equal(sources[1].stopped,true);assert.equal(panners[1].disconnected,true);assert.equal(sources[1].onended,null);assert.equal(audio.effects.size,0);
 const mono=mockAudio(false);assert.equal(mono.audio.stairHaunt(.4),true);assert.equal(mono.gains[0].output,mono.audio.master);
});
test('muted or unavailable playback consumes the cue instead of replaying after unmute',()=>{
 const {audio,sources}=mockAudio();let result=tick(newStairHaunt());result=tick(result.state);result=tick(result.state);assert.equal(result.cue,true);
 audio.muted=true;assert.equal(audio.stairHaunt(),false);audio.muted=false;result=tick(result.state);assert.equal(result.cue,false);assert.equal(sources.length,0);
 audio.volume=0;assert.equal(audio.stairHaunt(),false);audio.volume=.5;audio.ctx.state='suspended';assert.equal(audio.stairHaunt(),false);assert.equal(new SchoolAudio().stairHaunt(),false);
});
