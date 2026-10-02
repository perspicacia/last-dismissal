import test from 'node:test';import assert from 'node:assert/strict';
import {effectSamples} from '../sound-effects.js';import {SchoolAudio} from '../audio.js';
function mockAudio(){const audio=new SchoolAudio(),outputs=[],sources=[],gains=[];audio.master={};audio.ctx={state:'running',currentTime:0,sampleRate:8000,createBuffer(ch,n){const data=new Float32Array(n);return {getChannelData:()=>data};},createGain(){const gain={gain:{},connect(target){outputs.push(target);},disconnect(){}};gains.push(gain);return gain;},createBufferSource(){const source={connect(){},start(){this.started=true;},stop(){this.stopped=true;},disconnect(){this.disconnected=true;}};sources.push(source);return source;}};return {audio,outputs,sources,gains};}
test('발소리·등장 효과음은 유한한 합성 파형이며 피크가 제한된다',()=>{
 for(const [kind,length,peak] of [['footstep',.24,.70],['jumpscare',.85,.85],['door-slide',1.05,.65],['baby-cry',1.7,.60],['ghost-laugh',1.85,.62]]){const data=effectSamples(kind,8000);assert.equal(data.length,Math.ceil(length*8000));assert.ok(data.every(Number.isFinite));assert.ok(Math.max(...data.map(Math.abs))<=peak+.00001);assert.ok(data.reduce((n,x)=>n+x*x,0)>.1);assert.equal(Math.abs(data[0]),0);}
 assert.notDeepEqual(effectSamples('footstep',8000,0),effectSamples('footstep',8000,1));
});
test('발소리 간격·좌우 음색, 등장 음향 모두 master 출력으로 연결된다',()=>{
 const {audio,outputs,sources}=mockAudio();assert.equal(audio.footstep(),true);assert.equal(audio.footstep(),false);audio.ctx.currentTime=.2;assert.equal(audio.footstep('classroom'),true);assert.notEqual(sources[0].buffer,sources[1].buffer);assert.equal(audio.jumpscare(),true);assert.ok(outputs.every(x=>x===audio.master));assert.equal(sources.length,3);
 sources[0].onended();assert.equal(audio.effects.size,2);assert.equal(sources[0].disconnected,true);
 audio.clearEffects();assert.equal(audio.effects.size,0);assert.ok(sources.slice(1).every(s=>s.stopped&&s.disconnected));assert.equal(audio.foot,0);assert.equal(audio.footstep(),true);
});
test('음소거·음량 0·오디오 중단에서는 효과음을 재생하지 않는다',()=>{
 const {audio,sources}=mockAudio();
 for(const mode of ['muted','zero','suspended']){
  audio.muted=mode==='muted';audio.volume=mode==='zero'?0:.5;audio.ctx.state=mode==='suspended'?'suspended':'running';
  for(const method of ['footstep','jumpscare','doorSlide','babyCry','ghostLaugh'])assert.equal(audio[method](),false);
 }
 assert.equal(sources.length,0);const unsupported=new SchoolAudio();assert.equal(unsupported.jumpscare(),false);assert.doesNotThrow(()=>unsupported.clearEffects());
});

test('비명은 단발 충격으로 꺼지지 않고 중간까지 유성 소리를 유지한다',()=>{
 const samples=effectSamples('jumpscare',16000);
 const rms=(a,b)=>Math.sqrt(samples.slice(Math.floor(a*16000),Math.floor(b*16000)).reduce((sum,x)=>sum+x*x,0)/Math.floor((b-a)*16000));
 assert.ok(rms(.3,.65)>.12);assert.ok(rms(.8,.85)<rms(.3,.65));
});

test('문·아기 울음도 master를 통하며 종료 시 중간 재생을 정리한다',()=>{
 const {audio,outputs,sources,gains}=mockAudio();
 assert.equal(audio.doorSlide(),true);assert.equal(audio.babyCry(),true);assert.equal(audio.jumpscare(),true);
 assert.deepEqual(gains.map(g=>g.gain.value),[.27,.14,.58]);
 assert.ok(outputs.every(x=>x===audio.master));
 const cached=sources[0].buffer;sources[0].onended();assert.equal(audio.doorSlide(),true);assert.equal(sources.at(-1).buffer,cached);
 audio.clearEffects();assert.equal(audio.effects.size,0);assert.ok(sources.slice(1).every(s=>s.stopped&&s.disconnected));
});

function bandEnergy(data,rate,from,to){
 const n=2048,start=Math.floor(.2*rate);let energy=0;
 for(let k=Math.ceil(from*n/rate);k<=Math.floor(to*n/rate);k++){
  let re=0,im=0;
  for(let i=0;i<n;i++){
   const x=data[start+i]*(.5-.5*Math.cos(2*Math.PI*i/(n-1))),phase=2*Math.PI*k*i/n;
   re+=x*Math.cos(phase);im+=x*Math.sin(phase);
  }
  energy+=re*re+im*im;
 }
 return energy;
}
test('토끼 포효는 낮은 성대 대역이 우세하며 아기 울음과 음색이 구별된다',()=>{
 const rate=16000,roar=effectSamples('jumpscare',rate),cry=effectSamples('baby-cry',rate);
 const low=bandEnergy(roar,rate,30,180),upper=bandEnergy(roar,rate,220,700);
 assert.ok(low>upper*2,'포효에 저음 성대의 무게가 유지되어야 한다');
 assert.ok(bandEnergy(cry,rate,220,700)>bandEnergy(cry,rate,30,180)*20,'아기 울음은 다른 높이의 유성 대역이어야 한다');
});
test('여자 웃음은 master·효과음 기록·캐시·종료 정리에 함께 연결된다',()=>{
 const {audio,outputs,sources,gains}=mockAudio(),cues=[];audio.onEffect=kind=>cues.push(kind);
 assert.equal(audio.ghostLaugh(),true);assert.deepEqual(cues,['ghost-laugh']);
 assert.equal(gains[0].gain.value,.24);assert.equal(outputs[0],audio.master);
 const cached=sources[0].buffer;sources[0].onended();
 assert.equal(audio.ghostLaugh(),true);assert.equal(sources[1].buffer,cached);
 audio.clearEffects();assert.equal(audio.effects.size,0);assert.equal(sources[1].stopped,true);
 assert.equal(sources[1].disconnected,true);
});
test('문 마찰은 중반까지 끼리릭 대역을 유지하며 끝에서 잦아든다',()=>{
 const rate=16000,slide=effectSamples('door-slide',rate);
 const rms=(a,b)=>Math.sqrt(slide.slice(Math.floor(a*rate),Math.floor(b*rate)).reduce((sum,x)=>sum+x*x,0)/Math.floor((b-a)*rate));
 assert.ok(rms(.3,.8)>.06,'문이 움직이는 동안 마찰이 지속된다');
 assert.ok(rms(1.02,1.05)<rms(.3,.8),'끝 찰칵 뒤 꼬리가 잦아든다');
 assert.ok(bandEnergy(slide,rate,480,1800)>bandEnergy(slide,rate,30,180)*2,'소리가 저음 충격음에만 머무르지 않는다');
});
test('여자 웃음은 토끼 저음 포효와 구분되는 성대 음역과 여러 호흡을 가진다',()=>{
 const rate=16000,laugh=effectSamples('ghost-laugh',rate);
 assert.ok(bandEnergy(laugh,rate,180,900)>bandEnergy(laugh,rate,30,180)*5);
 const rms=(a,b)=>Math.sqrt(laugh.slice(Math.floor(a*rate),Math.floor(b*rate)).reduce((sum,x)=>sum+x*x,0)/Math.floor((b-a)*rate));
 assert.ok(rms(.15,.25)>.02);assert.ok(rms(.82,.99)>.02);assert.ok(rms(1.43,1.55)>.02);
 assert.ok(rms(1.81,1.85)<rms(.82,.99));
});
