import test from 'node:test';import assert from 'node:assert/strict';
import {effectSamples} from '../sound-effects.js';import {SchoolAudio} from '../audio.js';
function mockAudio(){const audio=new SchoolAudio(),outputs=[],sources=[];audio.master={};audio.ctx={state:'running',currentTime:0,sampleRate:8000,createBuffer(ch,n){const data=new Float32Array(n);return {getChannelData:()=>data};},createGain(){return {gain:{},connect(target){outputs.push(target);},disconnect(){}};},createBufferSource(){const source={connect(){},start(){this.started=true;},stop(){this.stopped=true;},disconnect(){this.disconnected=true;}};sources.push(source);return source;}};return {audio,outputs,sources};}
test('발소리·등장 효과음은 유한한 합성 파형이며 피크가 제한된다',()=>{
 for(const [kind,length,peak] of [['footstep',.24,.70],['jumpscare',.85,.85]]){const data=effectSamples(kind,8000);assert.equal(data.length,Math.ceil(length*8000));assert.ok(data.every(Number.isFinite));assert.ok(Math.max(...data.map(Math.abs))<=peak+.00001);assert.ok(data.reduce((n,x)=>n+x*x,0)>.1);assert.equal(Math.abs(data[0]),0);}
 assert.notDeepEqual(effectSamples('footstep',8000,0),effectSamples('footstep',8000,1));
});
test('발소리 간격·좌우 음색, 등장 음향 모두 master 출력으로 연결된다',()=>{
 const {audio,outputs,sources}=mockAudio();assert.equal(audio.footstep(),true);assert.equal(audio.footstep(),false);audio.ctx.currentTime=.2;assert.equal(audio.footstep('classroom'),true);assert.notEqual(sources[0].buffer,sources[1].buffer);assert.equal(audio.jumpscare(),true);assert.ok(outputs.every(x=>x===audio.master));assert.equal(sources.length,3);
 sources[0].onended();assert.equal(audio.effects.size,2);assert.equal(sources[0].disconnected,true);
 audio.clearEffects();assert.equal(audio.effects.size,0);assert.ok(sources.slice(1).every(s=>s.stopped&&s.disconnected));assert.equal(audio.foot,0);assert.equal(audio.footstep(),true);
});
test('음소거·음량 0·오디오 중단에서는 효과음을 재생하지 않는다',()=>{
 const {audio,sources}=mockAudio();audio.muted=true;assert.equal(audio.footstep(),false);assert.equal(audio.jumpscare(),false);audio.muted=false;audio.volume=0;assert.equal(audio.jumpscare(),false);audio.volume=.5;audio.ctx.state='suspended';assert.equal(audio.footstep(),false);assert.equal(sources.length,0);const unsupported=new SchoolAudio();assert.equal(unsupported.jumpscare(),false);assert.doesNotThrow(()=>unsupported.clearEffects());
});

test('비명은 단발 충격으로 꺼지지 않고 중간까지 유성 소리를 유지한다',()=>{
 const samples=effectSamples('jumpscare',16000);
 const rms=(a,b)=>Math.sqrt(samples.slice(Math.floor(a*16000),Math.floor(b*16000)).reduce((sum,x)=>sum+x*x,0)/Math.floor((b-a)*16000));
 assert.ok(rms(.3,.65)>.12);assert.ok(rms(.8,.85)<rms(.3,.65));
});
