import test from 'node:test';
import assert from 'node:assert/strict';
import {CORRIDOR_LAMPS,corridorLampLevel,SchoolLighting,shadeCanvasSchool} from '../school-lighting.js';

test('복도 전등은 반복 소등·복구하고 모든 등을 동시에 끄지 않는다',()=>{
  const off=CORRIDOR_LAMPS.map(()=>0),recover=CORRIDOR_LAMPS.map(()=>0),previous=CORRIDOR_LAMPS.map(()=>1);
  for(let t=0;t<120;t+=.05){
    const levels=CORRIDOR_LAMPS.map((_,i)=>corridorLampLevel(i,t));
    assert.ok(levels.every(v=>Number.isFinite(v)&&v>=0&&v<=1));
    assert.ok(levels.filter(v=>v===1).length>=4,'최소 네 전등은 켜져 있다');
    levels.forEach((v,i)=>{if(v===0&&previous[i]>0)off[i]++;if(v===1&&previous[i]<1)recover[i]++;previous[i]=v;});
  }
  assert.ok(off.every(n=>n>=6));assert.ok(recover.every(n=>n>=6));
});

test('점멸 전환은 즉시 번쩍이지 않고 동작 줄이기에서는 고정된다',()=>{
  for(let i=0;i<5;i++)for(let t=0;t<40;t+=.01){
    assert.equal(corridorLampLevel(i,t,true),1);
    assert.ok(Math.abs(corridorLampLevel(i,t+.01)-corridorLampLevel(i,t))<.09);
  }
});

test('교실·중단·동작 줄이기에서 시계가 진행되지 않고 재시작은 초기화한다',()=>{
  const clock=new SchoolLighting();clock.update(0);clock.update(50);assert.equal(clock.elapsed,.05);
  clock.update(100,{active:false});clock.update(150,{reduced:true});assert.equal(clock.elapsed,.05);
  clock.update(60000);assert.equal(clock.elapsed,.1,'긴 중단 뒤에도 한 프레임만 진행');
  clock.reset();assert.equal(clock.elapsed,0);assert.equal(clock.last,null);assert.deepEqual(clock.update(90000),[1,1,1,1,1]);
});

test('Canvas는 주변 전등 소등을 어두워지는 표현으로 반영한다',()=>{
  let fill;const c={save(){},restore(){},fillRect(){fill=this.fillStyle;}};
  shadeCanvasSchool(c,100,100,[0,1,1,1,1],{z:3});assert.equal(fill,'rgba(2,8,13,0.5)');
  shadeCanvasSchool(c,100,100,[0,1,1,1,1],{z:23});assert.equal(fill,'rgba(2,8,13,0.38)');
});
