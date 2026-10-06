import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {surfacePixels,schoolSurface,surfaceMaterial} from '../school-surfaces.js';
import {CORRIDOR_DESK,CORRIDOR_BLOCKERS,blockedByFurniture,PLAYER_RADIUS} from '../school-colliders.js';
import {movePlayer} from '../movement.js';
import {ThreeSchoolView} from '../three-school.js';
import {RenderMetrics} from '../render-metrics.js';
import {CLASSROOM_DESKS} from '../classroom.js';

function mockCanvas(){const gradient={addColorStop(){}};const ctx=new Proxy({}, {get:(_,k)=>()=>String(k).startsWith('create')?gradient:undefined,set:()=>true});return {width:512,height:512,getContext:()=>ctx};}
function view(){const old=globalThis.document;globalThis.document={createElement:mockCanvas};try{const v=Object.create(ThreeSchoolView.prototype);v.scenes={};v.refs={};v.textures=[];v.build('corridor');v.build('classroom');return v;}finally{globalThis.document=old;}}

test('학교 표면은 게임 난수를 소비하지 않고 독립 색·법선·거칠기와 유효한 단위 법선을 만든다',()=>{
 const random=Math.random;Math.random=()=>{throw new Error('game RNG consumed');};
 try{for(const kind of ['wood','plaster','metal']){
  const a=surfacePixels(kind,64),b=surfacePixels(kind,64);assert.deepEqual(a,b);assert.notDeepEqual(a.colour,a.normal);assert.notDeepEqual(a.colour,a.roughness);
  assert.ok(new Set(a.roughness.filter((_,i)=>i%4===0)).size>15);
  for(let i=0;i<a.normal.length;i+=4){const n=Array.from(a.normal.slice(i,i+3),v=>v/127.5-1);assert.ok(Math.abs(Math.hypot(...n)-1)<.014);assert.ok(n[2]>0);assert.equal(a.normal[i+3],255);assert.equal(a.colour[i+3],255);}
 }}finally{Math.random=random;}
});
test('학교 맵을 공유하되 색만 sRGB로 해석하고 바닥 타일과 벽 타일의 반복을 분리한다',()=>{
 const a=surfaceMaterial('wood',{variant:'floor'}),b=surfaceMaterial('wood',{variant:'floor'}),wall=schoolSurface('wood','wall');
 assert.equal(a.map,b.map);assert.equal(a.normalMap,b.normalMap);assert.equal(a.roughnessMap,b.roughnessMap);assert.notEqual(a.map,wall.map);
 assert.equal(a.map.colorSpace,THREE.SRGBColorSpace);assert.equal(a.normalMap.colorSpace,THREE.NoColorSpace);assert.equal(a.roughnessMap.colorSpace,THREE.NoColorSpace);
 assert.deepEqual(a.map.repeat.toArray(),[2,8]);assert.deepEqual(wall.map.repeat.toArray(),[2,1]);assert.equal(a.map.image.width,512);
});
test('복도 책상을 정면·옆걸음·대각선으로 관통하지 않으며 가장자리를 따라 미끄러지고 중앙 통로는 열린다',()=>{
 const walk=(p,keys,n=60)=>{for(let i=0;i<n;i++){p=movePlayer(p,new Set(keys),.05);assert.equal(blockedByFurniture(p.x,p.z,CORRIDOR_BLOCKERS),false);}return p;};
 const front=walk({x:2,z:2,angle:0,manualLook:true},['forward']);assert.ok(front.z<=CORRIDOR_DESK.z-CORRIDOR_DESK.depth/2-PLAYER_RADIUS);
 const side=walk({x:.8,z:3.2,angle:0,manualLook:true},['strafeRight']);assert.ok(side.x<=CORRIDOR_DESK.x-CORRIDOR_DESK.width/2-PLAYER_RADIUS);
 const diagonal=walk({x:1,z:2,angle:0,manualLook:true},['forward','strafeRight']);assert.ok(diagonal.x>2.4&&diagonal.z<2.64);
 const slide=walk({x:1.15,z:3.2,angle:0,manualLook:true},['forward','strafeRight']);assert.ok(slide.z>5);assert.equal(blockedByFurniture(slide.x,slide.z,CORRIDOR_BLOCKERS),false);
 const aisle=walk({x:0,z:1.8,angle:0,manualLook:true},['forward']);assert.ok(aisle.z>10);assert.equal(aisle.x,0);
});
test('각 장면은 천장등 하나만 실내 그림자를 계산하고 기존 소등·복구 신호를 따른다',()=>{
 const v=view();for(const scene of Object.values(v.scenes)){
  const indoor=scene.children.filter(o=>o.isSpotLight&&o.castShadow);assert.equal(indoor.length,1);assert.equal(indoor[0].shadow.mapSize.x,1024);assert.ok(indoor[0].position.y>2.5);assert.equal(scene.children.filter(o=>o.isPointLight&&o.castShadow).length,0);
  const moon=scene.children.find(o=>o.isDirectionalLight);assert.equal(moon.shadow.mapSize.x,1024);assert.ok(moon.shadow.camera.right<6);
 }
 const lamp=v.refs.corridorLamps[0];assert.ok(lamp.shadowLight);v.applyCorridorLighting([0,1,1,1,1]);assert.equal(lamp.shadowLight.intensity,0);assert.equal(lamp.light.intensity,0);
 v.applyCorridorLighting([1,1,1,1,1]);assert.equal(lamp.shadowLight.intensity,lamp.shadowPower);
});
test('반복 가구 인스턴싱은 실제 책상 치수·좌석·기울기를 보존하면서 메시와 geometry 수를 줄인다',()=>{
 const v=view(),instanced=new THREE.Group(),legacy=new THREE.Group();v.classroomFurniture(instanced,'classroom33');
 v.source={canvas:{dataset:{furnitureInstances:'false'}}};v.classroomFurniture(legacy,'classroom33');
 const bounds=g=>new THREE.Box3().setFromObject(g),a=bounds(instanced),b=bounds(legacy);assert.ok(a.min.distanceTo(b.min)<1e-5);assert.ok(a.max.distanceTo(b.max)<1e-5);
 const geometries=g=>{const set=new Set();g.traverse(o=>{if(o.isMesh)set.add(o.geometry);});return set.size;};assert.ok(geometries(instanced)<geometries(legacy)/3);
 const chair=instanced.getObjectByName('chair-rounded-seat');assert.equal(chair.count,CLASSROOM_DESKS.length);
 for(let i=0;i<chair.count;i++){const matrix=new THREE.Matrix4();chair.getMatrixAt(i,matrix);const position=new THREE.Vector3().setFromMatrixPosition(matrix);assert.ok(Math.abs(position.x-CLASSROOM_DESKS[i].x)<1e-5);assert.ok(Math.abs(position.z-(CLASSROOM_DESKS[i].z-.72))<1e-5);}
});
test('표정 전환은 기존 텍스처를 재사용하고 반복 재시작은 교체된 시계 맵을 해제한다',()=>{
 const v=view(),source={canvas:{dataset:{}},mascot:mockCanvas(),mascotOpen:mockCanvas(),windowGhost:mockCanvas(),clockFace:mockCanvas()};v.source=source;
 const oldDocument=globalThis.document;globalThis.document={createElement:mockCanvas};try{
 v.syncTextures(source);const original=v.refs.rabbit.material.map,clock=v.refs.clock.material.map;let disposed=0;clock.addEventListener('dispose',()=>disposed++);
 source.mouthOpen=true;v.syncTextures(source);const attack=v.refs.rabbit.material.map;assert.notEqual(original,attack);const size=v.textures.length;
 for(let i=0;i<30;i++){source.mouthOpen=i%2===0;source.clockFace=mockCanvas();v.syncTextures(source);assert.equal(v.textures.length,size);}
 assert.equal(disposed,1);assert.equal(v.imageTextureCache.has(clock.image),false);source.mouthOpen=false;v.syncTextures(source);assert.equal(v.refs.rabbit.material.map,original);
 source.mouthOpen=true;v.syncTextures(source);assert.equal(v.refs.rabbit.material.map,attack);
 }finally{globalThis.document=oldDocument;}
});
test('성능 측정은 CPU 제출 시간과 프레임 간격을 분리하고 일시정지 공백을 FPS로 계산하지 않는다',()=>{
 const m=new RenderMetrics(4);let report;
 for(let i=0;i<8;i++)report=m.sample(i*10,i*10+2,i*16);assert.equal(report.samples,4);assert.equal(report.cpuMedian,2);assert.equal(report.frameMedian,16);assert.equal(report.fps,62.5);
 report=m.sample(100,108,5000);assert.equal(report.frameMedian,16);assert.equal(report.cpuP95,8);assert.equal(m.intervals.length,4);
});
test('첫 화면의 토끼 맵 준비는 복도 등장이나 탐색 판정을 진행하지 않는다',()=>{
 const old=globalThis.document;globalThis.document={createElement:mockCanvas};try{
  const v=view();v.build('classroom31');const mascot=mockCanvas(),source={canvas:{dataset:{}},scene:'corridor',mascot,mascotOpen:mockCanvas(),clockFace:mockCanvas(),player:{x:0,z:1.8,angle:0}};v.source=source;
  v.syncTextures(source);assert.ok(v.refs.ambienceRabbit.material.map);assert.equal(v.refs.ambienceRabbit.visible,false);assert.equal(source.exploration,undefined);assert.deepEqual(source.player,{x:0,z:1.8,angle:0});
 }finally{globalThis.document=old;}
});
