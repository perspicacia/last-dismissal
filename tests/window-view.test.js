import test from 'node:test';
import assert from 'node:assert/strict';
import { drawWindowView } from '../window-view.js';
import { Corridor } from '../corridor.js';
import { newGame, choose } from '../logic.js';
function context() {
  const ops=[];
  const gradient={addColorStop(){}};
  const ctx=new Proxy({ops},{get(target,key){if(key in target)return target[key];return (...args)=>{ops.push([key,...args]);return String(key).startsWith('create')?gradient:undefined;};},set(target,key,value){target[key]=value;return true;}});
  return ctx;
}
const ghost={complete:true,naturalWidth:1024,naturalHeight:1536};
test('정상 숲은 귀신 없이 그리고 이상에서만 클립 내부에 비율을 유지해 표시',()=>{
  const c=context();drawWindowView(c,{x:42,y:37,width:428,height:149},{ghost});
  assert.equal(c.ops.filter(v=>v[0]==='drawImage').length,0);
  const haunted=context();drawWindowView(haunted,{x:42,y:37,width:428,height:149},{ghost,haunted:true});
  const draw=haunted.ops.find(v=>v[0]==='drawImage');assert.equal(draw[1],ghost);
  assert.ok(haunted.ops.findIndex(v=>v[0]==='clip')<haunted.ops.indexOf(draw));
  assert.equal(draw[4]/draw[5],ghost.naturalWidth/ghost.naturalHeight);
  assert.ok(draw[3]+draw[5]<=447);
});
test('로딩되지 않은 귀신 이미지는 정상 풍경 렌더링을 막지 않는다',()=>{
  const c=context();drawWindowView(c,{x:0,y:0,width:428,height:447},{ghost:{complete:false},haunted:true,verticalScale:1});
  assert.equal(c.ops.some(v=>v[0]==='drawImage'),false);
  assert.ok(c.ops.some(v=>v[0]==='ellipse'));
});
test('창문 이상 판정·프레임 가림·다음 정상 복도의 귀신 제거',()=>{
  const old=globalThis.document;globalThis.document={createElement:()=>({getContext:()=>context()})};
  try {
    const c=Object.create(Corridor.prototype);
    c.texture=draw=>{const ctx=context();draw(ctx);return ctx;};
    Object.assign(c,{windowGhost:ghost,boardPhoto:{complete:false},boardPhotoErased:{complete:false},anomaly:'window',tutorial:false});
    c.buildTextures();const ops=c.hauntedWindow.ops,idx=ops.findIndex(v=>v[0]==='drawImage'&&v[1]===ghost);
    assert.ok(idx>=0);
    assert.ok(ops.slice(idx+1).some(v=>v[0]==='fillRect'&&v[1]===251));
    const state={...newGame(),tutorial:false,anomaly:'window'};
    assert.equal(choose(state,true,()=>0).correct,true);assert.equal(choose(state,false,()=>0).correct,false);
    c.anomaly=null;c.buildTextures();assert.equal(c.hauntedWindow.ops.some(v=>v[0]==='drawImage'&&v[1]===ghost),false);
  } finally {globalThis.document=old;}
});
