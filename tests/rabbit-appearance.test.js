import test from 'node:test';
import assert from 'node:assert/strict';
import {rabbitImageSize,stainRabbitPixels,bloodiedRabbit} from '../rabbit-appearance.js';
import {rabbitParts} from '../rabbit-pose.js';
import {rabbitSize} from '../rabbit-arrival.js';

test('피 얼룩은 실루엣/투명도와 털 밝기 차이를 보존하고 게임 난수를 소비하지 않는다',()=>{
 const original=new Uint8ClampedArray([200,180,160,255,100,90,80,255,220,210,200,75,250,240,230,0,120,100,90,255]);
 const pigment=new Uint8ClampedArray([150,8,12,220,150,8,12,220,150,8,12,220,150,8,12,220,0,0,0,0]);
 const first=stainRabbitPixels(original.slice(),pigment),second=stainRabbitPixels(original.slice(),pigment);
 assert.deepEqual(first,second);assert.deepEqual(pigment,new Uint8ClampedArray([150,8,12,220,150,8,12,220,150,8,12,220,150,8,12,220,0,0,0,0]));
 for(let i=3;i<original.length;i+=4)assert.equal(first[i],original[i]);
 assert.ok(first[0]>first[4]&&first[1]>first[5]);assert.ok(first[0]>first[1]*2);
 assert.deepEqual(first.slice(12),original.slice(12));
});

test('로딩 중인 PNG는 빈 얼룩 이미지로 확정하지 않고 캔버스도 원본 비율로 분할한다',()=>{
 const unloaded={naturalWidth:1024,naturalHeight:1536,complete:false};assert.equal(bloodiedRabbit(unloaded),unloaded);assert.equal(rabbitImageSize(unloaded),null);
 const old=globalThis.document,draws=[],context=new Proxy({}, {get:(_,key)=>key==='drawImage'?(image)=>draws.push(image):()=>{},set:()=>true});
 globalThis.document={createElement:()=>({getContext:()=>context})};
 try{const skin={width:800,height:1600,getContext(){}};const parts=rabbitParts(skin);assert.deepEqual([parts.width,parts.height],[800,1600]);assert.equal(draws.length,3);assert.ok(draws.every(image=>image===skin));const size=rabbitSize(skin,1.15);assert.equal(size.width/size.height,.5);}finally{globalThis.document=old;}
});
