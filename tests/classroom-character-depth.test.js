import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {buildPortraitGhost,buildSeatedGirl,SEATED_GIRL,setPortraitTexture,drawFigureVolume,seatedGirlLook} from '../ghost-figures.js';
import {CLASSROOM_BOARD,buildClassroomBoard,boardCanvas,boardWriting,drawClassroomBoard} from '../classroom-board.js';
import {ROOM_AMBIENCE,newExploration,advanceExploration} from '../exploration.js';
import {CLASSROOM_DESKS,moveClassroomPlayer,CLASSROOM_SPAWN,drawClassroom} from '../classroom.js';
const image={naturalWidth:1024,naturalHeight:1536,complete:true};
function bounds(mesh){mesh.geometry.computeBoundingBox();return mesh.geometry.boundingBox;}
function closed(geometry){
 const p=geometry.attributes.position,key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(n=>Math.round(n*1e5)).join(','),edges=new Map();
 for(let i=0;i<geometry.index.count;i+=3){const ids=[0,1,2].map(j=>key(geometry.index.getX(i+j)));for(let j=0;j<3;j++){const edge=[ids[j],ids[(j+1)%3]].sort().join('|');edges.set(edge,(edges.get(edge)||0)+1);}}
 return [...edges.values()].every(count=>count===2);
}
function withCanvas(fn){const old=globalThis.document,words=[];const ctx=new Proxy({}, {get:(_,key)=>key==='fillText'?(text)=>words.push(text):()=>{},set:()=>true});globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>ctx})};try{return fn(words);}finally{globalThis.document=old;}}

test('두 남학생은 앞뒤가 닫힌 머리·몸·사지와 사진 앞면만 갖고 UV가 늘어나지 않는다',()=>{
 for(const [kind,config] of [['boy',ROOM_AMBIENCE.music.boy],['faceless',ROOM_AMBIENCE.classroom33.faceless]]){
  const root=buildPortraitGhost(kind,config);assert.equal(root.visible,false);
  for(const name of ['ghost-head','ghost-torso','ghost-hips','ghost-thigh','ghost-shin']){const mesh=root.getObjectByName(name),b=bounds(mesh);assert.ok(closed(mesh.geometry),name);assert.ok(b.max.z-b.min.z>.08,name);}
  assert.ok(bounds(root.getObjectByName('ghost-head')).getSize(new THREE.Vector3()).z>.2);
  assert.ok(bounds(root.getObjectByName('ghost-torso')).getSize(new THREE.Vector3()).z>.2);
  const pose=root.userData.pose;
  for(const part of root.userData.photoMeshes){const {position:p,uv,color}=part.geometry.attributes;assert.equal(color.itemSize,4);
   for(let i=0;i<p.count;i++){assert.ok(Math.abs(uv.getX(i)-(.5+p.getX(i)/pose.width))<1e-6);assert.ok(Math.abs(uv.getY(i)-(1-(pose.top-p.getY(i))/pose.height))<1e-6);assert.ok(Number.isFinite(color.getW(i)));}
   assert.ok(part.geometry.index.count<root.getObjectByName(part.name.replace('-photo','')).geometry.index.count);
  }
  const texture=new THREE.Texture(image),children=[...root.children];assert.equal(setPortraitTexture(root,image,texture),true);assert.ok(root.userData.photoMeshes.every(part=>part.material.map===texture));
  for(const missing of [undefined,{...image,complete:false},{...image,naturalWidth:0}]){assert.equal(setPortraitTexture(root,missing,texture),false);assert.equal(root.visible,false);}
  setPortraitTexture(root,image,texture);assert.deepEqual(root.children,children);assert.equal(root.visible,true);
 }
});

test('좌석에 겹치는 인물 표면은 좌석 위에 있고 발과 벽 여유를 지킨다',()=>{
 const boy=buildPortraitGhost('boy',ROOM_AMBIENCE.music.boy),girl=buildSeatedGirl();
 for(const [root,seat,inside] of [[boy,.525,p=>p.x>=2.47&&p.x<=2.89&&Math.abs(p.z-7.35)<.325],[girl,.448,p=>Math.abs(p.x-1.2)<.26&&Math.abs(p.z-4.28)<.23]]){
  root.updateMatrixWorld(true);root.traverse(part=>{if(!part.userData.center)return;const position=part.geometry.attributes.position;for(let i=0;i<position.count;i++){const p=new THREE.Vector3().fromBufferAttribute(position,i).applyMatrix4(part.matrixWorld);if(inside(p))assert.ok(p.y>=seat-.004,`${part.name}: ${p.y}`);}});
  const b=new THREE.Box3().setFromObject(root);assert.ok(b.min.y>=.015&&b.min.y<.03);
 }
 const standing=buildPortraitGhost('faceless',ROOM_AMBIENCE.classroom33.faceless),b=new THREE.Box3().setFromObject(standing);assert.ok(b.max.x<4.4&&b.max.z<9.8);assert.ok(Math.abs(b.max.y-b.min.y-1.7)<.04);
});

test('여학생은 기존 의자에서 칠판을 향하며 몸 두께·긴 머리·양말을 갖고 중앙 통로를 막지 않는다',()=>{
 const girl=buildSeatedGirl(),desk=CLASSROOM_DESKS.find(d=>d.x===SEATED_GIRL.x&&d.z===5);assert.ok(Math.abs(SEATED_GIRL.z-(desk.z-.72))<.08);
 girl.updateMatrixWorld(true);const front=new THREE.Vector3(0,0,-1).transformDirection(girl.matrixWorld);assert.ok(front.z>.99);
 assert.ok(bounds(girl.getObjectByName('girl-torso')).getSize(new THREE.Vector3()).z>.2);assert.equal(girl.children.filter(p=>p.name==='girl-hair-strand').length,17);
 assert.ok(girl.getObjectByName('girl-shin'));assert.ok(girl.getObjectByName('girl-shoe'));
 const side={x:0,z:SEATED_GIRL.z,angle:Math.PI/2};assert.ok(seatedGirlLook(side)<-.4);assert.equal(seatedGirlLook({...side,angle:-Math.PI/2}),0);assert.equal(seatedGirlLook({...side,x:-3}),0);
 const nearby={x:1.2,z:3.95,angle:0};assert.equal(moveClassroomPlayer(nearby,new Set(['forward']),.05).z,nearby.z);
 let p={...CLASSROOM_SPAWN};for(let i=0;i<35;i++)p=moveClassroomPlayer(p,new Set(['forward']),.05);assert.ok(p.z>7);
 let state=newExploration(()=>.99);for(const scene of ['music','classroom','classroom33'])state=advanceExploration(state,.1,scene,{x:1.2,z:4.1,angle:0});assert.equal(state.ended,false);
});

test('세 교실 칠판은 충분한 높이·입체 받침·분필/지우개와 반별 당번 글씨를 공유한다',()=>withCanvas(words=>{
 for(const kind of ['classroom31','classroom','classroom33']){const board=buildClassroomBoard(kind),b=CLASSROOM_BOARD;assert.ok(b.height>=1.5&&b.width/b.height<4);assert.ok(b.y-b.height/2>.72);
  assert.equal(board.getObjectByName('board-backing').geometry.parameters.depth,b.depth);assert.ok(board.getObjectByName('board-chalk-tray').geometry.parameters.depth>.2);
  assert.equal(board.children.filter(p=>p.name==='board-chalk').length,4);assert.equal(board.children.filter(p=>p.name==='board-eraser-felt').length,2);
  for(const text of boardWriting(kind))assert.ok(words.includes(text));
 }
}));

test('칠판 앞면 UV는 Z 반전 후에도 글씨를 좌우 반전하지 않는다',()=>withCanvas(()=>{
 const board=buildClassroomBoard('classroom'),face=board.getObjectByName('board-writing'),{position:p,uv}=face.geometry.attributes;
 const front=[];for(let i=20;i<24;i++)front.push({x:p.getX(i),u:uv.getX(i)});
 assert.ok(Math.max(...front.filter(v=>v.x<0).map(v=>v.u))<Math.min(...front.filter(v=>v.x>0).map(v=>v.u)));
 assert.ok(face.material.slice(0,5).every(m=>m.map===null));assert.equal(face.material[5].map,board.userData.texture);
}));

test('Canvas의 칠판과 회전한 여학생 투영은 유한하며 시선 뒤는 그리지 않는다',()=>withCanvas(()=>{
 let draws=0,ellipses=0;const ctx=new Proxy({}, {get:(_,key)=>String(key).startsWith('create')?()=>({addColorStop(){}}):key==='drawImage'?((...args)=>{assert.ok(args.slice(1).every(Number.isFinite));draws++;}):key==='ellipse'?((...args)=>{assert.ok(args.every(Number.isFinite));ellipses++;}):()=>{},set:()=>true});
 const project=(x,y,z)=>({x:640+x*80,y:340-y*80,d:10+z});drawClassroomBoard(ctx,project,boardCanvas('classroom'));assert.ok(draws>0);
 drawFigureVolume(ctx,(x,y,z)=>({x:640+z*90,y:340-y*90,d:10+x}),buildSeatedGirl());
 assert.ok(ellipses>0);const before=ellipses;drawFigureVolume(ctx,()=>null,buildSeatedGirl());assert.equal(ellipses,before);
 for(const angle of [0,Math.PI/2,Math.PI])drawClassroom(ctx,1280,720,{x:0,z:1.4,angle},0,null,null,'classroom');
}));
