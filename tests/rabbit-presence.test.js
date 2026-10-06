import test from 'node:test';
import assert from 'node:assert/strict';
import {RABBIT_PRESENCE,rabbitPresence,recordRabbitPresence,drawRabbitPresence} from '../rabbit-presence.js';
import {newExploration,advanceExploration} from '../exploration.js';
import {ThreeSchoolView} from '../three-school.js';
import * as THREE from '../vendor/three.module.js';

const normal={complete:true,naturalWidth:1024,naturalHeight:1536},open={...normal};
const source=()=>({attackerKind:'schoolgirl',exploration:newExploration(()=>.99),scene:'classroom31',player:{x:0,z:1.4,angle:0,manualLook:true},mascot:normal,mascotOpen:open});
function canvas(){
  const out={width:64,height:64};
  const ctx=new Proxy({getImageData:()=>({data:new Uint8ClampedArray(out.width*out.height*4)}),createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})}, {get:(o,k)=>o[k]||(()=>{}),set:()=>true});
  out.getContext=()=>ctx;return out;
}

test('토끼는 일반 3-1에서만 표시하고 방 이동·종료·재시작/처음 화면에서 정리된다',()=>{
  const s=source(),target={dataset:{}};
  assert.ok(rabbitPresence(s));
  for(const scene of ['corridor','classroom','classroom33','music','dance']){s.scene=scene;assert.equal(rabbitPresence(s),null);}
  s.scene='classroom31';s.exploration.ended=true;assert.equal(rabbitPresence(s),null);
  s.exploration=newExploration(()=>0);assert.equal(rabbitPresence(s).teeth,false);
  s.exploration=null;recordRabbitPresence(target,rabbitPresence(s));
  assert.deepEqual(target.dataset,{rabbitVisible:'false',rabbitRole:'hidden',rabbitExpression:'normal',rabbitRoom:''});
});
test('가까운 응시의 이빨은 공격 표정과 독립하며 토끼만 봐서는 패배하지 않는다',()=>{
  const s=source();s.mouthOpen=true;assert.equal(rabbitPresence(s).image,normal);
  s.player={x:-1.15,z:4.4,angle:0,manualLook:true};
  const pose=rabbitPresence(s);assert.equal(pose.image,open);assert.equal(pose.teeth,true);
  const unchanged={...s.exploration,attackerRoom:'classroom31'};
  // This gaze points at the rabbit; the schoolgirl is outside its facing cone.
  s.player={x:-1.15,z:5,angle:0,manualLook:true,pitch:0};
  const state=unchanged;
  const next=advanceExploration(state,.1,s.scene,s.player);
  assert.equal(next.ended,false);assert.equal(next.attackerRoom,'classroom31');assert.deepEqual(next.visited,['classroom31']);
  s.player.angle=Math.PI;assert.equal(rabbitPresence(s).teeth,false);
  s.mouthOpen=false;s.player.angle=0;assert.equal(rabbitPresence(s).teeth,true);
});
test('늦은 기본/표정 PNG는 준비 전 숨기고 정상 로드 후 원본 비율로 복구한다',()=>{
  const s=source();s.player={x:-1.15,z:4,angle:0};
  s.mascot={...normal,complete:false};assert.equal(rabbitPresence(s),null);
  s.mascot=normal;s.mascotOpen={complete:true,naturalWidth:0,naturalHeight:0};
  let pose=rabbitPresence(s);assert.equal(pose.image,normal);assert.equal(pose.teeth,false);
  s.mascotOpen=open;pose=rabbitPresence(s);assert.equal(pose.teeth,true);assert.ok(Math.abs(pose.width/pose.height-2/3)<1e-12);
});
test('Canvas 토끼는 공간의 발 위치와 원본 비율로 그리고 카메라 뒤에서는 숨긴다',()=>{
  const s=source(),pose=rabbitPresence(s),old=globalThis.document,draws=[];
  globalThis.document={createElement:canvas};
  try{
    const ctx={drawImage(...args){draws.push(args);}};
    drawRabbitPresence(ctx,()=>({x:300,y:400,d:4}),400,pose);
    assert.equal(draws.length,1);const [,x,y,w,h]=draws[0];assert.ok(Math.abs(w/h-2/3)<1e-12);assert.equal(y+h,400);assert.equal(x+w/2,300);
    drawRabbitPresence(ctx,()=>null,400,pose);assert.equal(draws.length,1);
  }finally{globalThis.document=old;}
});
test('Three.js 분위기 토끼는 한 개를 재사용하고 표정·종료가 여고생 메시와 독립한다',()=>{
  const oldDoc=globalThis.document,oldWin=globalThis.window;globalThis.document={createElement:canvas};globalThis.window={matchMedia:()=>({matches:true})};
  try{
    const view=Object.create(ThreeSchoolView.prototype);view.scenes={};view.refs={};view.textures=[];
    for(const room of ['corridor','classroom','classroom31','dance'])view.build(room);
    view.camera=new THREE.PerspectiveCamera();view.renderer={render(){}};
    const s={...source(),canvas:{dataset:{}},keys:new Set(),schoolgirl:canvas(),schoolgirlAttack:canvas()};view.source=s;
    view.draw(s,0);const rabbit=view.refs.ambienceRabbit;
    assert.equal(rabbit.visible,true);assert.ok(Math.abs(rabbit.scale.x/rabbit.scale.y-2/3)<1e-12);assert.equal(rabbit.position.y-rabbit.scale.y/2,0);
    assert.ok(Object.values(view.refs.roomAttackers).every(m=>!m.visible));
    const texture=rabbit.material.map;view.draw(s,50);assert.equal(rabbit.material.map,texture);
    s.player={x:-1.15,z:4.4,angle:0,manualLook:true};view.draw(s,100);assert.notEqual(rabbit.material.map,texture);assert.equal(s.canvas.dataset.rabbitExpression,'teeth');
    s.scene='dance';view.draw(s,150);assert.equal(rabbit.visible,false);
    s.exploration.ended=true;s.caughtAt=150;view.draw(s,200);assert.equal(view.refs.roomAttackers.dance.visible,true);assert.equal(rabbit.visible,false);
    s.exploration=newExploration(()=>.99);s.scene='classroom31';s.player={x:0,z:1.4,angle:0};view.resetHauntings();assert.equal(rabbit.visible,false);
    view.draw(s,250);assert.equal(view.refs.ambienceRabbit,rabbit);assert.equal(rabbit.visible,true);assert.equal(s.canvas.dataset.rabbitExpression,'normal');
    let count=0;view.scenes.classroom31.traverse(m=>{if(m.name==='ambience-rabbit')count++;});assert.equal(count,1);
    assert.deepEqual(rabbit.position.toArray(),[RABBIT_PRESENCE.x,RABBIT_PRESENCE.height/2,RABBIT_PRESENCE.z]);
  }finally{globalThis.document=oldDoc;globalThis.window=oldWin;}
});
