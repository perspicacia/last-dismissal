import test from 'node:test';
import assert from 'node:assert/strict';
import {SchoolAudio} from '../audio.js';
function pendingAudio(){
 const audio=new SchoolAudio(),pending=[];let updates=0,suspends=0;
 audio.ctx={currentTime:0,state:'suspended',resume(){return new Promise(resolve=>pending.push(()=>{this.state='running';resolve();}));},async suspend(){this.state='suspended';suspends++;}};
 const gain=()=>({value:1,cancelScheduledValues(){},setTargetAtTime(){}});audio.master={gain:gain()};audio.ambient={gain:gain()};audio.update=()=>updates++;audio.loadEffectFiles=async()=>[];
 return {audio,pending,updates:()=>updates,suspends:()=>suspends};
}
test('늦은 오디오 재개는 Escape 종료 뒤 음악을 되살리지 않는다',async()=>{
 const old=globalThis.window;globalThis.window={AudioContext:function(){}};
 try{const {audio,pending,updates}=pendingAudio(),start=audio.start();await audio.stop();pending[0]();await start;assert.equal(updates(),0);assert.equal(audio.ctx.state,'suspended');assert.equal(audio.master.gain.value,0);}
 finally{globalThis.window=old;}
});
test('이전 시작의 늦은 완료는 새 게임의 오디오를 중단하지 않는다',async()=>{
 const old=globalThis.window;globalThis.window={AudioContext:function(){}};
 try{const {audio,pending,updates,suspends}=pendingAudio(),first=audio.start();await audio.stop();const second=audio.start();pending[1]();await second;pending[0]();await first;assert.equal(updates(),1);assert.equal(audio.ctx.state,'running');assert.equal(suspends(),1);}
 finally{globalThis.window=old;}
});
