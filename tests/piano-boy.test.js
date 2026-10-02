import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ROOM_AMBIENCE,newExploration,advanceExploration} from '../exploration.js';
import {ROOM_BLOCKERS} from '../room-props.js';
import {pianoBoyLayout,pianoBoyQuad,drawPianoBoy,pianoBoyLook} from '../piano-boy.js';

const png=readFileSync(new URL('../assets/piano-boy-ghost.png',import.meta.url));
const image={naturalWidth:png.readUInt32BE(16),naturalHeight:png.readUInt32BE(20),complete:true},seat=ROOM_AMBIENCE.music.boy;

test('음악실의 신규 귀신은 투명 초상 자산의 비율·좌석·발 높이를 보존한다',()=>{
  assert.equal(png[25],6);assert.deepEqual([image.naturalWidth,image.naturalHeight],[1024,1536]);
  assert.equal(ROOM_AMBIENCE.music.student,undefined);
  const pose=pianoBoyLayout(image,seat),scale=pose.height/image.naturalHeight;
  assert.ok(Math.abs(pose.width/image.naturalWidth-scale)<1e-12);
  assert.ok(Math.abs(pose.top-957*scale-.525)<1e-12);
  assert.ok(Math.abs(pose.top-1509*scale-.025)<1e-12);
  assert.ok(pose.top<1.45&&pose.top>1.3);
  // The cutout sits just ahead of the seat fascia, avoiding coplanar clipping.
  assert.ok(seat.x<2.47&&seat.x>2.4);assert.equal(seat.z,7.35);
  assert.ok(ROOM_BLOCKERS.music.some(b=>Math.abs(seat.x-b.x)<b.width/2+.22&&Math.abs(seat.z-b.z)<b.depth/2+.22));
});

test('이미지 로딩·실패는 보류하고 교실 분위기 귀신은 공격 판정을 만들지 않는다',()=>{
  for(const missing of [undefined,{...image,complete:false},{naturalWidth:0,naturalHeight:0,complete:true}]){
    assert.equal(pianoBoyLayout(missing,seat),null);assert.equal(drawPianoBoy({},()=>{throw Error('unready projection');},missing,seat),false);
  }
  let state=newExploration(()=>.99);
  for(let i=0;i<100;i++)state=advanceExploration(state,.1,'music',{x:1.8,z:7.35,angle:Math.PI/2});
  assert.equal(state.ended,false);assert.deepEqual(state.visited,['music']);
});

test('Canvas는 고정된 좌석 방향에 원본을 투영하며 뒤쪽·미완료 이미지를 안전하게 건너뛴다',()=>{
  const project=(x,y,z)=>({x:640+(seat.z-z)*300,y:400-y*300,d:x});
  const quad=pianoBoyQuad(project,image,seat);
  assert.ok(quad[0].x<quad[1].x);assert.ok(quad[0].y<quad[3].y);
  assert.ok(Math.abs((quad[1].x-quad[0].x)/(quad[3].y-quad[0].y)-2/3)<1e-12);
  let calls=0;const c=new Proxy({}, {get:(_,key)=>key==='transform'?(...matrix)=>assert.ok(matrix.every(Number.isFinite)):key==='drawImage'?(source)=>{assert.equal(source,image);calls++;}:()=>{}});
  assert.equal(drawPianoBoy(c,project,image,seat),true);assert.ok(calls>0);
  assert.equal(drawPianoBoy(c,()=>null,image,seat),false);
  assert.ok(pianoBoyLook({x:0,z:7.35,angle:Math.PI/2},image,seat)<0);
  assert.equal(pianoBoyLook({x:0,z:7.35,angle:-Math.PI/2},image,seat),0);
  assert.equal(pianoBoyLook({x:-3,z:7.35,angle:Math.PI/2},image,seat),0);
});
