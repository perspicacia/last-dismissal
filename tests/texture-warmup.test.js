import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {TextureWarmup,sceneTextures} from '../texture-warmup.js';

const texture=()=>new THREE.CanvasTexture({width:128,height:128});
function rig(images=[texture(),texture()],upload=()=>{}){
 const tasks=new Map(),calls=[],states=[];let id=0,allowed=true,current=images;
 const queue=new TextureWarmup({renderer:{initTexture(t){calls.push(t);upload(t);}},getTextures:()=>current,canRun:()=>allowed,onStatus:s=>states.push(s),defer:fn=>{tasks.set(++id,fn);return id;},cancel:key=>tasks.delete(key)});
 return {queue,calls,states,tasks,setAllowed:v=>{allowed=v;},replace:v=>{current=v;queue.refresh();},tick(){const [key,fn]=tasks.entries().next().value||[];if(fn){tasks.delete(key);fn();}}};
}
test('공유 맵과 숨긴 캐릭터의 여러 재질을 한 번씩 수집하고 렌더 타깃은 업로드하지 않는다',()=>{
 const shared=texture(),normal=texture(),scene=new THREE.Scene(),hidden=new THREE.Mesh(new THREE.BoxGeometry(),[new THREE.MeshStandardMaterial({map:shared,normalMap:normal}),new THREE.MeshBasicMaterial({map:shared})]);
 hidden.visible=false;scene.add(hidden);scene.environment=new THREE.WebGLRenderTarget(8,8).texture;
 const maps=sceneTextures({a:scene,b:scene});assert.equal(maps.length,3);const r=rig(maps);r.tick();assert.deepEqual(r.calls,[shared]);r.tick();assert.deepEqual(r.calls,[shared,normal]);assert.equal(r.states.at(-1).status,'ready');assert.equal(r.tasks.size,0);
});
test('한 콜백에 한 맵만 올리고 반복 요청·첫 화면 복귀는 준비된 버전을 재업로드하지 않는다',()=>{
 const a=texture(),b=texture(),r=rig([a,a,b]);r.queue.schedule();r.queue.refresh();assert.equal(r.tasks.size,1);
 r.tick();assert.deepEqual(r.calls,[a]);assert.equal(r.tasks.size,1);r.tick();assert.deepEqual(r.calls,[a,b]);assert.equal(r.states.at(-1).prepared,2);
 r.queue.refresh();r.queue.schedule();r.tick();assert.equal(r.calls.length,2);assert.equal(r.tasks.size,0);
});
test('플레이·숨김·캡처 또는 셰이더 작업 중 예약을 취소하고 이미 시작한 업로드 이후에는 멈춘다',()=>{
 const r=rig();r.setAllowed(false);r.queue.schedule();r.tick();assert.equal(r.calls.length,0);assert.equal(r.states.at(-1).status,'paused');
 r.setAllowed(true);r.queue.schedule();r.tick();r.setAllowed(false);r.tick();assert.equal(r.calls.length,1);
 r.setAllowed(true);r.queue.schedule();r.tick();assert.equal(r.calls.length,2);
 let active;active=rig([texture(),texture()],()=>active.setAllowed(false));active.tick();assert.equal(active.calls.length,1);assert.equal(active.tasks.size,0);
});
test('늦은 이미지·needsUpdate 버전은 준비하고 교체·해제된 이전 맵은 예약에서 제거한다',()=>{
 const a=texture(),late=texture(),replacement=texture();late.image.complete=false;
 const r=rig([a,late]);r.tick();assert.deepEqual(r.calls,[a]);late.image.complete=true;r.queue.refresh();r.tick();assert.deepEqual(r.calls,[a,late]);
 a.needsUpdate=true;r.queue.refresh();r.tick();assert.deepEqual(r.calls,[a,late,a]);
 a.needsUpdate=true;r.queue.refresh();a.dispose();r.replace([replacement,late]);r.tick();assert.deepEqual(r.calls,[a,late,a,replacement]);assert.equal(r.states.at(-1).prepared,2);assert.equal(r.tasks.size,0);
});
test('동일 버전의 업로드 실패는 반복하지 않으며 다른 맵과 일반 렌더를 막지 않는다',()=>{
 const a=texture(),b=texture();let fail=true;const r=rig([a,b],t=>{if(t===a&&fail)throw new Error('upload unavailable');});
 r.tick();r.tick();assert.deepEqual(r.calls,[a,b]);assert.equal(r.states.at(-1).status,'fallback');r.queue.refresh();r.tick();assert.equal(r.calls.length,2);
 fail=false;a.needsUpdate=true;r.queue.refresh();r.tick();assert.equal(r.calls.length,3);assert.equal(r.states.at(-1).status,'ready');assert.equal(r.states.at(-1).failed,0);
});
test('해제·미지원·데이터 미완료·깊이 맵은 업로드를 시작하지 않는다',()=>{
 const r=rig();r.queue.dispose();r.tick();r.queue.refresh();assert.equal(r.calls.length,0);
 let status;const unsupported=new TextureWarmup({renderer:{},getTextures:()=>[texture()],onStatus:s=>{status=s.status;},defer:()=>{throw new Error('unsupported scheduled');}});unsupported.schedule();assert.equal(status,'unsupported');
 const pending=texture();pending.source.dataReady=false;const empty=texture();empty.image.width=0;
 const skipped=rig([pending,empty,new THREE.DepthTexture(8,8)]);skipped.tick();assert.equal(skipped.calls.length,0);
});
