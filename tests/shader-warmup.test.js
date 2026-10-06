import test from 'node:test';
import assert from 'node:assert/strict';
import {SceneShaderWarmup} from '../shader-warmup.js';

function rig(compile=async()=>{}){
 const tasks=new Map(),calls=[],states=[];let id=0,allowed=true;
 const scenes={corridor:{id:'corridor'},classroom31:{id:'classroom31'},music:{id:'music'}};
 const queue=new SceneShaderWarmup({renderer:{compileAsync(scene,camera){calls.push([scene.id,camera]);return compile(scene);}},scenes,camera:'camera',canRun:()=>allowed,onStatus:s=>states.push(s),defer:fn=>{tasks.set(++id,fn);return id;},cancel:key=>tasks.delete(key)});
 return {queue,calls,states,tasks,setAllowed:v=>{allowed=v;},async tick(){const [key,fn]=tasks.entries().next().value||[];if(fn){tasks.delete(key);fn();}for(let i=0;i<5;i++)await Promise.resolve();}};
}
test('준비 큐는 방을 순서대로 단독 컴파일하고 반복 요청을 합친다',async()=>{
 let resolve;const r=rig(()=>new Promise(done=>{resolve=done;}));r.queue.schedule();r.queue.schedule();assert.equal(r.tasks.size,1);
 await r.tick();assert.deepEqual(r.calls,[['corridor','camera']]);r.queue.schedule();await r.tick();assert.equal(r.calls.length,1);
 resolve();await r.tick();await r.tick();assert.equal(r.calls[1][0],'classroom31');resolve();await r.tick();await r.tick();assert.equal(r.calls[2][0],'music');resolve();await r.tick();
 assert.equal(r.states.at(-1).status,'ready');assert.deepEqual([...r.queue.prepared],['corridor','classroom31','music']);assert.equal(r.tasks.size,0);
});
test('플레이·숨김·캡처 중 새 작업을 멈추며 첫 화면 복귀 때 이어간다',async()=>{
 const r=rig();r.queue.schedule();r.setAllowed(false);r.queue.schedule();assert.equal(r.tasks.size,0);await r.tick();assert.equal(r.calls.length,0);assert.equal(r.states.at(-1).status,'paused');
 r.setAllowed(true);r.queue.schedule();await r.tick();r.setAllowed(false);r.queue.schedule();await r.tick();assert.equal(r.calls.length,1);
 r.setAllowed(true);r.queue.schedule();await r.tick();await r.tick();assert.equal(r.calls.length,3);assert.equal(r.states.at(-1).status,'ready');
});
test('진행 중 로딩 변경은 이전 준비 완료로 표시하지 않고 한 번 더 준비한다',async()=>{
 let resolve;const r=rig(()=>new Promise(done=>{resolve=done;}));r.queue.schedule();await r.tick();r.queue.invalidate(['corridor']);r.queue.invalidate(['corridor']);resolve();await r.tick();
 assert.equal(r.queue.prepared.has('corridor'),false);await r.tick();assert.equal(r.calls[1][0],'classroom31');resolve();await r.tick();await r.tick();resolve();await r.tick();await r.tick();assert.equal(r.calls[3][0],'corridor');resolve();await r.tick();assert.equal(r.queue.prepared.has('corridor'),true);
});
test('준비 실패는 렌더를 막지 않고 반복 재시도 없이 다른 방을 준비하며 변경 시 재시도한다',async()=>{
 let fail=true;const r=rig(scene=>{if(scene.id==='corridor'&&fail)throw new Error('context unavailable');return Promise.resolve();});r.queue.schedule();await r.tick();await r.tick();await r.tick();
 assert.equal(r.states.at(-1).status,'fallback');assert.deepEqual([...r.queue.failed],['corridor']);r.queue.schedule();assert.equal(r.tasks.size,0);
 fail=false;r.queue.invalidate(['corridor']);await r.tick();assert.equal(r.states.at(-1).status,'ready');assert.equal(r.queue.failed.size,0);assert.equal(r.calls.length,4);
});
test('미지원·해제된 준비 큐는 컴파일을 실행하지 않는다',async()=>{
 const r=rig();r.queue.schedule();r.queue.dispose();await r.tick();assert.equal(r.calls.length,0);
 let status;const unsupported=new SceneShaderWarmup({renderer:{},scenes:{corridor:{}},camera:{},onStatus:s=>{status=s.status;},defer:()=>{throw new Error('unsupported scheduled');}});unsupported.schedule();assert.equal(status,'unsupported');
});
