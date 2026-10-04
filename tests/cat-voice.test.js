import test from 'node:test';import assert from 'node:assert/strict';
import {catVoiceSamples,CAT_VOICE_DURATION} from '../cat-voice.js';
test('앙칼스러운 울음은 빠른 하악질·거친 고음·끝 페이드를 가진 세 변형이다',()=>{
 for(const rate of [8000,16000,44100])for(let variant=0;variant<3;variant++){
  const data=catVoiceSamples(rate,variant);assert.equal(data.length,Math.ceil(rate*CAT_VOICE_DURATION));assert.ok(data.every(Number.isFinite));
  let peak=0;for(const x of data)peak=Math.max(peak,Math.abs(x));assert.ok(peak>.54&&peak<.550001);assert.equal(Math.abs(data[0]),0);
  const rms=(a,b)=>{const part=data.slice(Math.round(a*rate),Math.round(b*rate));return Math.sqrt(part.reduce((s,x)=>s+x*x,0)/part.length);};
  assert.ok(rms(.04,.13)>.012,'hiss precedes the voiced yowl');assert.ok(rms(.35,.9)>.08);assert.ok(rms(1.45,1.55)<.005);
  assert.ok(data.slice(-Math.round(rate*.05)).every(x=>x===0));
 }
 assert.notDeepEqual(catVoiceSamples(8000,0),catVoiceSamples(8000,1));assert.notDeepEqual(catVoiceSamples(8000,1),catVoiceSamples(8000,2));
 assert.deepEqual(catVoiceSamples(8000,1),catVoiceSamples(8000,1));
});
test('고양이 울음은 저음에 묻히지 않는 고주파 성분을 유지한다',()=>{
 const rate=8000,data=catVoiceSamples(rate),start=Math.round(rate*.45),n=800;let low=0,upper=0,peak=0,peakHz=0;
 for(let hz=100;hz<=3200;hz+=25){
  let re=0,im=0;
  for(let i=0;i<n;i++){const x=data[start+i]*(.5-.5*Math.cos(2*Math.PI*i/(n-1)));re+=x*Math.cos(2*Math.PI*hz*i/rate);im+=x*Math.sin(2*Math.PI*hz*i/rate);}
  const energy=re*re+im*im;if(hz<450)low+=energy;if(hz>1000)upper+=energy;if(energy>peak){peak=energy;peakHz=hz;}
 }
 assert.ok(peakHz>=500&&peakHz<=1000);assert.ok(upper>low*3);
});
