import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {ThreeSchoolView} from '../three-school.js';
import {buildOutdoors} from '../three-outdoors.js';
function mockCanvas(){const gradient={addColorStop(){}};const ctx=new Proxy({}, {get:(_,k)=>()=>String(k).startsWith('create')?gradient:undefined,set:()=>true});return {width:512,height:512,getContext:()=>ctx};}
function buildView(){const old=globalThis.document;globalThis.document={createElement:mockCanvas};try{const v=Object.create(ThreeSchoolView.prototype);v.scenes={};v.refs={};v.textures=[];v.build('corridor');v.build('classroom');return v;}finally{globalThis.document=old;}}
test('3D 카메라는 기존 오른쪽 회전과 화면 좌우를 보존하고 문·시계 글자를 반전하지 않는다',()=>{
  const v=buildView(),camera=new THREE.PerspectiveCamera(70,1,.05,160);camera.position.set(0,1.5,-1.8);camera.lookAt(0,1.5,-2.8);camera.updateMatrixWorld();
  v.scenes.corridor.updateMatrixWorld(true);
  const right=new THREE.Vector3(1,1.5,-5).project(camera),left=new THREE.Vector3(-1,1.5,-5).project(camera);assert.ok(right.x>left.x);
  const clock=v.refs.clock;camera.position.set(1.2,2.08,-19);camera.lookAt(2.2,2.08,-19);camera.updateMatrixWorld();
  const textureLeft=clock.localToWorld(new THREE.Vector3(-.3,0,0)).project(camera),textureRight=clock.localToWorld(new THREE.Vector3(.3,0,0)).project(camera);assert.ok(textureLeft.x<textureRight.x);
});
test('3D 이상현상 전환은 귀신·토끼 위치·이빨 텍스처를 갱신하고 정상에서 복구한다',()=>{
  const v=buildView();v.camera=new THREE.PerspectiveCamera();v.renderer={render(){}};v.lastState='';
  const old=globalThis.window;globalThis.window={matchMedia:()=>({matches:true})};
  const source={anomaly:'figure',mouthOpen:true,mascot:mockCanvas(),mascotOpen:mockCanvas(),clockFace:mockCanvas(),door:mockCanvas(),boardPhoto:mockCanvas(),boardPhotoErased:mockCanvas(),windowGhost:mockCanvas(),player:{x:0,z:1.8,angle:0},keys:new Set(),scene:'corridor'};
  try{v.draw(source,0);assert.equal(v.refs.rabbit.position.z,16);assert.equal(v.refs.rabbit.material.map.image,source.mascotOpen);assert.equal(v.refs.ghost.visible,false);source.anomaly='window';source.mouthOpen=false;v.draw(source,0);assert.equal(v.refs.ghost.visible,true);assert.equal(v.refs.rabbit.position.z,22);source.anomaly=null;v.draw(source,0);assert.equal(v.refs.ghost.visible,false);assert.equal(v.refs.rabbit.material.map.image,source.mascot);assert.equal(v.refs.photo.material.map.image,source.boardPhoto);source.anomaly='board';v.draw(source,0);assert.equal(v.refs.photo.material.map.image,source.boardPhotoErased);}finally{globalThis.window=old;}
});
test('실외 풍경은 창 밖의 서로 다른 실제 깊이와 결정적인 나무 배치를 가진다',()=>{
  for(const side of ['corridor','classroom']){const a=buildOutdoors({side}),b=buildOutdoors({side});assert.ok(a.userData.treeCount>30);const trees=a.getObjectByName('tree-trunks');assert.deepEqual([...trees.instanceMatrix.array],[...b.getObjectByName('tree-trunks').instanceMatrix.array]);const xs=[];for(let i=0;i<trees.count;i++){const m=new THREE.Matrix4();trees.getMatrixAt(i,m);xs.push(m.elements[12]);}assert.ok(Math.max(...xs)-Math.min(...xs)>15);if(side==='corridor')assert.ok(Math.min(...xs)>3);else assert.ok(Math.max(...xs)<-4.4);}
});
test('상행 마지막 발판 위에는 사람이 설 여유가 있고 하강 입구에서는 아래 발판으로 시선이 내려간다',()=>{
  const v=buildView(),scene=v.scenes.corridor,top=scene.getObjectByName('stair-up-11'),ceiling=scene.getObjectByName('stair-ceiling-up');
  const headroom=ceiling.position.y-ceiling.geometry.parameters.height/2-(top.position.y+top.geometry.parameters.height/2);assert.ok(headroom>1.8);
  v.camera=new THREE.PerspectiveCamera();v.renderer={render(){}};v.lastState='null|false';const old=globalThis.window;globalThis.window={matchMedia:()=>({matches:true})};
  try{const source={anomaly:null,mouthOpen:false,player:{x:1.6,z:23.6,angle:0},scene:'corridor',keys:new Set()};v.draw(source,0);assert.ok(v.camera.getWorldDirection(new THREE.Vector3()).y<-.4);source.scene='classroom';v.draw(source,0);assert.ok(Math.abs(v.camera.getWorldDirection(new THREE.Vector3()).y)<.01);}finally{globalThis.window=old;}
});
