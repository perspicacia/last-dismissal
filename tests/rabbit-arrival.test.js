import test from 'node:test';import assert from 'node:assert/strict';
import {rabbitArrival,rabbitSize,ARRIVAL} from '../rabbit-arrival.js';
test('처음에는 기본 표정으로 머물다가 접근 중 이빨을 드러낸다',()=>{
 assert.equal(rabbitArrival(0).rush,0);assert.equal(rabbitArrival(.29).teeth,false);assert.equal(rabbitArrival(.30).rush,0);
 assert.ok(rabbitArrival(.54).rush>0);assert.equal(rabbitArrival(.54).teeth,false);assert.equal(rabbitArrival(.55).teeth,true);
 assert.equal(rabbitArrival(1).rush,1);assert.equal(rabbitArrival(1.49).done,false);assert.equal(rabbitArrival(ARRIVAL.end).done,true);
 assert.equal(rabbitArrival(NaN).teeth,false);assert.equal(rabbitArrival(-1).rush,0);
});
test('돌진 모든 시점·서로 다른 이미지에서 원본 비율을 유지한다',()=>{
 for(const image of [{naturalWidth:1024,naturalHeight:1536},{naturalWidth:800,naturalHeight:1600}])for(const t of [0,.3,.55,1,1.5]){const size=rabbitSize(image,rabbitArrival(t).growth);assert.ok(Math.abs(size.width/size.height-image.naturalWidth/image.naturalHeight)<1e-12);}
});
test('동작 줄이기는 이동만 생략하고 표정·종료 시점은 유지한다',()=>{
 assert.equal(rabbitArrival(0,true).rush,1);assert.equal(rabbitArrival(0,true).teeth,false);assert.equal(rabbitArrival(.55,true).teeth,true);assert.equal(rabbitArrival(1.5,true).done,true);
});
