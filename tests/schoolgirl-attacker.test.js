import test from 'node:test';
import assert from 'node:assert/strict';
import {newExploration,advanceExploration,ROOMS} from '../exploration.js';
import {ATTACKER_ASSETS,attackerImagesReady,attackerArrival,attackerSize,attackerProjection,ARRIVAL} from '../schoolgirl-attacker.js';
import {pngPixels} from './png-pixels.js';
import {Corridor} from '../corridor.js';

const image={complete:true,naturalWidth:1024,naturalHeight:1536};
const player={x:0,z:4,angle:0,manualLook:true,pitch:0};
test('교복 귀신은 다섯 방 중 한 곳에 숨고 새 게임의 방문·발견 상태는 독립한다',()=>{
  for(const [i,room] of ROOMS.entries()){
    const state=newExploration(()=>i/ROOMS.length+.01);
    assert.equal(state.attacker,'schoolgirl');assert.equal(state.attackerRoom,room.id);
    assert.equal(advanceExploration(state,.1,'corridor',player,true).ended,false);
    assert.equal(advanceExploration(state,.1,room.id,{...player,z:1.4},true).ended,false);
    const caught=advanceExploration(state,.1,room.id,player,true);assert.equal(caught.ended,true);
    assert.equal(advanceExploration(caught,.1,'corridor',player,true),caught);
    assert.deepEqual(newExploration(()=>i/ROOMS.length+.01).visited,[]);
  }
});
test('두 표정이 완전히 로딩되기 전에는 보이지 않는 공격이 없고 방문은 계속 기록된다',()=>{
  const state=newExploration(()=>0),source={schoolgirl:image,schoolgirlAttack:{...image,complete:false}};
  assert.equal(attackerImagesReady(source),false);
  let next=advanceExploration(state,.1,'classroom31',player,attackerImagesReady(source));
  assert.equal(next.ended,false);assert.deepEqual(next.visited,['classroom31']);
  source.schoolgirlAttack={complete:true,naturalWidth:0,naturalHeight:0};assert.equal(attackerImagesReady(source),false);
  source.schoolgirlAttack=image;assert.equal(attackerImagesReady(source),true);
  next=advanceExploration(next,.1,'classroom31',player,attackerImagesReady(source));assert.equal(next.ended,true);
});
test('실제 Canvas 돌진은 사람 원본 한 장만 그리고 표정 실패에서는 아무것도 그리지 않는다',()=>{
  const oldWindow=globalThis.window;globalThis.window={matchMedia:()=>({matches:false})};
  const draws=[],normal={...image},attack={...image},view=Object.create(Corridor.prototype);
  Object.assign(view,{attackerKind:'schoolgirl',schoolgirl:normal,schoolgirlAttack:attack,player,canvas:{width:1100,height:620,dataset:{}},ctx:{drawImage(...args){draws.push(args);}},caughtAt:0});
  try{
    view.drawCatch(0);assert.equal(draws.length,1);assert.equal(draws[0][0],normal);
    view.drawCatch(1100);assert.equal(draws.length,2);assert.equal(draws[1][0],attack);assert.equal(view.canvas.dataset.attackerExpression,'attack');
    assert.ok(Math.abs(draws[1][3]/draws[1][4]-2/3)<1e-12);
    view.schoolgirlAttack={complete:true,naturalWidth:0,naturalHeight:0};view.drawCatch(1200);assert.equal(draws.length,2);
  }finally{globalThis.window=oldWindow;}
});
test('기본 얼굴→공격 얼굴의 .55초 전환과 1.5초 종료, 동작 줄이기 시점은 같다',()=>{
  assert.equal(attackerArrival(0).rush,0);assert.equal(attackerArrival(.3).rush,0);
  assert.equal(attackerArrival(.549).attack,false);assert.equal(attackerArrival(.55).attack,true);
  assert.equal(attackerArrival(1.499).done,false);assert.equal(attackerArrival(ARRIVAL.end).done,true);
  assert.equal(attackerArrival(0,true).rush,1);assert.equal(attackerArrival(0,true).attack,false);
  assert.equal(attackerArrival(.55,true).attack,true);
});
test('서로 다른 표정의 원본 비율과 Canvas 돌진 얼굴 높이를 유지한다',()=>{
  for(const dimensions of [image,{width:900,height:1600}]){
    const ratio=(dimensions.naturalWidth??dimensions.width)/(dimensions.naturalHeight??dimensions.height);
    for(const t of [0,.55,1.1]){
      const arrival=attackerArrival(t),size=attackerSize(dimensions,arrival.growth);
      assert.ok(Math.abs(size.width/size.height-ratio)<1e-12);
      for(const [w,h] of [[1440,900],[390,844],[1000,500]])for(const pitch of [-.3,0,.3]){
        const projected=attackerProjection({...player,pitch},arrival,dimensions,w,h);
        assert.ok(Object.values(projected).every(Number.isFinite));assert.ok(Math.abs(projected.width/projected.height-ratio)<1e-12);
        if(t===1.1){const face=projected.y+(.13-.5)*projected.height;assert.ok(Math.abs(face-h*.48)<w*.05);}
      }
    }
  }
});
test('일반 게임용 귀신 두 PNG는 같은 프레이밍과 실제 투명 배경을 갖는다',()=>{
  const a=pngPixels(new URL('../'+ATTACKER_ASSETS.normal,import.meta.url)),b=pngPixels(new URL('../'+ATTACKER_ASSETS.attack,import.meta.url));
  assert.equal(a.width,b.width);assert.equal(a.height,b.height);
  for(const png of [a,b]){
    let clear=0,visible=0;for(let i=3;i<png.pixels.length;i+=4){if(png.pixels[i]===0)clear++;if(png.pixels[i]>200)visible++;}
    assert.ok(clear>png.width*png.height*.4);assert.ok(visible>png.width*png.height*.1);
  }
  // A generated expression variant must not shift the body during a texture
  // swap. Ignore the changing face and compare the lower silhouette's alpha.
  let intersection=0,union=0;
  for(let i=a.width*Math.floor(a.height*.20)*4+3;i<a.pixels.length;i+=4){
    const normal=a.pixels[i]>200,attack=b.pixels[i]>200;
    intersection+=normal&&attack;union+=normal||attack;
  }
  assert.ok(intersection/union>.98,'both expressions keep aligned body/hand/foot silhouettes');
});
