import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {ThreeSchoolView} from '../three-school.js';
import {buildOutdoors} from '../three-outdoors.js';
import {ROOM_AMBIENCE} from '../exploration.js';
import {pianoBoyLayout} from '../piano-boy.js';
import {attackerSize} from '../schoolgirl-attacker.js';
import {pngPixels,resizePixels} from './png-pixels.js';
function mockCanvas(){const gradient={addColorStop(){}};const ctx=new Proxy({}, {get:(_,k)=>()=>String(k).startsWith('create')?gradient:undefined,set:()=>true});return {width:512,height:512,getContext:()=>ctx};}
function buildView(){const old=globalThis.document;globalThis.document={createElement:mockCanvas};try{const v=Object.create(ThreeSchoolView.prototype);v.scenes={};v.refs={};v.textures=[];v.build('corridor');v.build('classroom');return v;}finally{globalThis.document=old;}}
test('새 여고생 공격자는 한 방에서만 나타나고 사람 PNG에 토끼 팔·피 마스크를 적용하지 않는다',()=>{
 const v=buildView(),oldDocument=globalThis.document,oldWindow=globalThis.window;
 globalThis.document={createElement:mockCanvas};globalThis.window={matchMedia:()=>({matches:false})};
 v.camera=new THREE.PerspectiveCamera();v.renderer={render(){}};
 const normal=mockCanvas(),attack=mockCanvas();normal.width=attack.width=1024;normal.height=attack.height=1536;
 const source={attackerKind:'schoolgirl',schoolgirl:normal,schoolgirlAttack:attack,scene:'classroom',player:{x:0,z:4,angle:0,manualLook:true,pitch:0},keys:new Set(),canvas:{dataset:{}},exploration:{ended:false},caughtAt:0};v.source=source;
 try{
  v.build('music');v.draw(source,0);assert.equal(v.refs.rabbit.visible,false);assert.ok(Object.values(v.refs.roomAttackers).every(r=>!r.visible));
  source.exploration.ended=true;v.draw(source,0);const ghost=v.refs.roomAttackers.classroom;
  assert.equal(ghost.visible,true);assert.equal(v.refs.roomAttackers.music.visible,false);assert.ok(Object.values(v.refs.roomRabbits).every(r=>!r.visible));
  assert.equal(ghost.material.map.image,normal);assert.equal(ghost.children.length,0);const far=ghost.position.z;
  source.mouthOpen=true;v.draw(source,1100);assert.equal(ghost.material.map.image,attack);assert.ok(ghost.position.z<far);assert.ok(Math.abs(ghost.position.z-source.player.z-.80)<1e-10);
  assert.equal(ghost.scale.y,attackerSize(attack,1.08).height);assert.ok(Math.abs(ghost.scale.x/ghost.scale.y-2/3)<1e-12);
  source.schoolgirlAttack={complete:true,naturalWidth:0};v.draw(source,1200);assert.equal(ghost.visible,false);
  source.exploration.ended=false;v.resetHauntings();assert.ok(Object.values(v.refs.roomAttackers).every(r=>!r.visible));
 }finally{globalThis.document=oldDocument;globalThis.window=oldWindow;}
});
test('다섯 교실의 목재창과 장면별 한 마리 고양이는 재방문/종료 때 중복·잔상 없이 갱신한다',()=>{
 const v=buildView(),oldDocument=globalThis.document,oldWindow=globalThis.window;
 globalThis.document={createElement:mockCanvas};try{for(const id of ['classroom31','classroom33','music','dance'])v.build(id);}finally{globalThis.document=oldDocument;}
 for(const id of ['classroom','classroom31','classroom33','music','dance']){let count=0;v.scenes[id].traverse(m=>{if(m.name==='wooden-classroom-window')count++;});assert.equal(count,5);}
 assert.equal(v.scenes.corridor.getObjectByName('wooden-classroom-window'),undefined);
 assert.equal(Object.keys(v.refs.cats).length,6);
 globalThis.window={matchMedia:()=>({matches:false})};v.camera=new THREE.PerspectiveCamera();v.renderer={render(){}};v.syncTextures=()=>{};
 const source={scene:'classroom31',anomaly:null,mouthOpen:false,player:{x:0,z:1.4,angle:0},keys:new Set(),exploration:{ended:false},catEvent:{cat:{path:{from:{x:-1.3,z:5.6},to:{x:0,z:5.6}},elapsed:.8}}};
 try{v.draw(source,0);assert.equal(v.refs.cats.classroom31.visible,true);assert.ok(Object.entries(v.refs.cats).filter(([id])=>id!=='classroom31').every(([,cat])=>!cat.visible));const model=v.refs.cats.classroom31;
  source.exploration.ended=true;v.draw(source,50);assert.ok(Object.values(v.refs.cats).every(cat=>!cat.visible));source.catEvent.cat=null;source.exploration.ended=false;v.draw(source,100);assert.equal(v.refs.cats.classroom31,model);assert.equal(model.visible,false);
 }finally{globalThis.window=oldWindow;}
});
test('복도 소등은 해당 광원과 발광 표면만 바꾸고 교실·게임 상태를 보존한다',()=>{
 const v=buildView(),source={canvas:{dataset:{}},scene:'corridor',exploration:{ended:false}};v.source=source;
 assert.equal(new Set(v.refs.corridorLamps.map(l=>l.bulb.material)).size,5);
 const classroom=v.scenes.classroom.children.filter(o=>o.isPointLight).map(o=>o.intensity);
 v.updateLighting(source,0,false);for(let t=50;t<=3000;t+=50)v.updateLighting(source,t,false);
 assert.equal(v.refs.corridorLamps[0].light.intensity,0);assert.equal(v.refs.corridorLamps[0].bulb.material.emissiveIntensity,.02);
 assert.ok(v.refs.corridorLamps.slice(1).every(l=>l.light.intensity===l.power));
 assert.deepEqual(v.scenes.classroom.children.filter(o=>o.isPointLight).map(o=>o.intensity),classroom);
 assert.deepEqual(source.exploration,{ended:false});assert.equal(source.canvas.dataset.corridorLights,'0.00,1.00,1.00,1.00,1.00');
 v.updateLighting(source,3050,true);assert.ok(v.refs.corridorLamps.every(l=>l.light.intensity===l.power));
 v.resetHauntings();assert.equal(v.lighting.elapsed,0);assert.equal(source.canvas.dataset.corridorLights,'1.00,1.00,1.00,1.00,1.00');
});
test('크기가 먼저 알려진 미완료 토끼 PNG를 빈 분할 캐시로 확정하지 않는다',()=>{
 const v=Object.create(ThreeSchoolView.prototype),image={naturalWidth:1024,naturalHeight:1536,complete:false};
 assert.equal(v.partsFor(image),null);assert.equal(v.rabbitPartCache.has(image),false);
});
test('3D 카메라는 기존 오른쪽 회전과 화면 좌우를 보존하고 문·시계 글자를 반전하지 않는다',()=>{
  const v=buildView(),camera=new THREE.PerspectiveCamera(70,1,.05,160);camera.position.set(0,1.5,-1.8);camera.lookAt(0,1.5,-2.8);camera.updateMatrixWorld();
  v.scenes.corridor.updateMatrixWorld(true);
  const right=new THREE.Vector3(1,1.5,-5).project(camera),left=new THREE.Vector3(-1,1.5,-5).project(camera);assert.ok(right.x>left.x);
  const clock=v.refs.clock;camera.position.set(1.2,2.08,-19);camera.lookAt(2.2,2.08,-19);camera.updateMatrixWorld();
  const textureLeft=clock.localToWorld(new THREE.Vector3(-.3,0,0)).project(camera),textureRight=clock.localToWorld(new THREE.Vector3(.3,0,0)).project(camera);assert.ok(textureLeft.x<textureRight.x);
});
test('3D 이상현상 전환은 귀신·토끼 위치·이빨 텍스처를 갱신하고 정상에서 복구한다',()=>{
  const v=buildView();v.camera=new THREE.PerspectiveCamera();v.renderer={render(){}};v.lastState='';
  const old=globalThis.window,oldDocument=globalThis.document;globalThis.document={createElement:mockCanvas};globalThis.window={matchMedia:()=>({matches:true})};
  const source={anomaly:'figure',mouthOpen:true,mascot:mockCanvas(),mascotOpen:mockCanvas(),clockFace:mockCanvas(),door:mockCanvas(),boardPhoto:mockCanvas(),boardPhotoErased:mockCanvas(),windowGhost:mockCanvas(),player:{x:0,z:1.8,angle:0},keys:new Set(),scene:'corridor'};
  try{v.draw(source,0);assert.equal(v.refs.rabbit.position.z,16);assert.equal(v.refs.rabbit.material.map.image,source.mascotOpen);assert.equal(v.refs.ghost.visible,false);source.anomaly='window';source.mouthOpen=false;v.draw(source,0);assert.equal(v.refs.ghost.visible,true);assert.equal(v.refs.rabbit.position.z,22);source.anomaly=null;v.draw(source,0);assert.equal(v.refs.ghost.visible,false);assert.equal(v.refs.rabbit.material.map.image,source.mascot);assert.equal(v.refs.photo.material.map.image,source.boardPhoto);source.anomaly='board';v.draw(source,0);assert.equal(v.refs.photo.material.map.image,source.boardPhotoErased);}finally{globalThis.window=old;globalThis.document=oldDocument;}
});
test('실외 풍경은 창 밖의 서로 다른 실제 깊이와 결정적인 나무 배치를 가진다',()=>{
  for(const side of ['corridor','classroom']){const a=buildOutdoors({side}),b=buildOutdoors({side});assert.ok(a.userData.treeCount>30);const trees=a.getObjectByName('tree-trunks');assert.deepEqual([...trees.instanceMatrix.array],[...b.getObjectByName('tree-trunks').instanceMatrix.array]);const xs=[];for(let i=0;i<trees.count;i++){const m=new THREE.Matrix4();trees.getMatrixAt(i,m);xs.push(m.elements[12]);}assert.ok(Math.max(...xs)-Math.min(...xs)>15);if(side==='corridor')assert.ok(Math.min(...xs)>3);else assert.ok(Math.max(...xs)<-4.4);}
});
test('상행 마지막 발판 위에는 사람이 설 여유가 있고 하강 입구에서는 아래 발판으로 시선이 내려간다',()=>{
  const v=buildView(),scene=v.scenes.corridor,top=scene.getObjectByName('stair-up-11'),ceiling=scene.getObjectByName('stair-ceiling-up');
  const headroom=ceiling.position.y-ceiling.geometry.parameters.height/2-(top.position.y+top.geometry.parameters.height/2);assert.ok(headroom>1.8);
  v.camera=new THREE.PerspectiveCamera();v.renderer={render(){}};v.lastState='null|false|false';const old=globalThis.window;globalThis.window={matchMedia:()=>({matches:true})};
  try{const source={anomaly:null,mouthOpen:false,player:{x:1.6,z:23.6,angle:0},scene:'corridor',keys:new Set()};v.draw(source,0);assert.ok(v.camera.getWorldDirection(new THREE.Vector3()).y<-.4);source.scene='classroom';v.draw(source,0);assert.ok(Math.abs(v.camera.getWorldDirection(new THREE.Vector3()).y)<.01);}finally{globalThis.window=old;}
});

test('계단 중앙 칸막이와 외벽은 입구부터 뒷벽까지 빈 틈 없이 이어진다',()=>{
  const scene=buildView().scenes.corridor;
  for(const name of ['stair-central-wall','stair-outer-wall-up','stair-outer-wall-down']){
    const wall=scene.getObjectByName(name),{depth,height}=wall.geometry.parameters;
    assert.ok(wall.position.z-depth/2<=24.6);assert.ok(wall.position.z+depth/2>=31);
    assert.ok(wall.position.y-height/2<=-2.5);assert.ok(wall.position.y+height/2>=5.4);
  }
  const center=scene.getObjectByName('stair-central-wall');assert.equal(center.geometry.parameters.width,1.3);
  assert.ok(scene.getObjectByName('stair-up-0').position.x<-center.geometry.parameters.width/2);
  assert.ok(scene.getObjectByName('stair-down-0').position.x>center.geometry.parameters.width/2);
});
test('게시판 사진은 원본 비율을 유지하고 보드 안쪽에 여백을 남긴다',()=>{
 const photo=buildView().refs.photo,{width,height}=photo.geometry.parameters;
 assert.ok(width<1.78);assert.ok(height<.98);assert.ok(Math.abs(width/height-1.5)<.001);assert.equal(photo.position.y,1.61);
});
test('학교 가구는 둥근 목재 판·금속 프레임·열린 수납칸·고무 발을 갖는다',()=>{
 const v=buildView(),scene=v.scenes.classroom;
 for(const name of ['desk-rounded-top','desk-cubby-bottom','desk-rubber-foot','chair-rounded-seat','chair-wood-back','chair-bent-frame','chair-rubber-foot'])assert.ok(scene.getObjectByName(name));
 const top=scene.getObjectByName('desk-rounded-top');assert.equal(top.geometry.type,'ExtrudeGeometry');
 const frame=scene.getObjectByName('chair-bent-frame');assert.equal(frame.geometry.type,'TubeGeometry');
 const photo=v.refs.photo.geometry.parameters;assert.equal(photo.width,1.05);assert.equal(photo.height,.70);
});
test('인형의 얼굴 면은 누웠을 때 위를 향하고 기립 후 플레이어를 향한다',()=>{
 const v=buildView();v.camera=new THREE.PerspectiveCamera();v.renderer={render(){}};v.syncTextures=()=>{};
 const old=globalThis.window;globalThis.window={matchMedia:()=>({matches:true})};
 const source={anomaly:'doll',mouthOpen:false,player:{x:-1.05,z:4,angle:0},scene:'classroom',keys:new Set(),dollState:{phase:'lying'}};
 const front=new THREE.Vector3(0,0,-.08),back=new THREE.Vector3(0,0,0);
 try{
  v.draw(source,0);v.scenes.classroom.updateMatrixWorld(true);
  assert.ok(v.refs.doll.localToWorld(front.clone()).y>v.refs.doll.localToWorld(back.clone()).y);
  source.dollState={phase:'standing'};v.draw(source,1000);v.scenes.classroom.updateMatrixWorld(true);
  assert.ok(v.refs.doll.localToWorld(front.clone()).z>v.refs.doll.localToWorld(back.clone()).z);
 }finally{globalThis.window=old;}
});
test('생존 경고는 토끼 위치·이빨을 갱신하고 교실 미닫이 문은 방어 상태를 표시한다',()=>{
 const v=buildView();v.camera=new THREE.PerspectiveCamera();v.renderer={render(){}};v.syncTextures=()=>{};
 const old=globalThis.window;globalThis.window={matchMedia:()=>({matches:true})};
 const source={anomaly:null,mouthOpen:true,rabbitZ:9,player:{x:0,z:2,angle:0},scene:'classroom',keys:new Set(),survival:{elapsed:13,doorUntil:20}};
 try{v.draw(source,0);assert.equal(v.refs.rabbit.position.z,9);const door=v.scenes.classroom.getObjectByName('sliding-classroom-door');assert.ok(door.userData.leaves.every(leaf=>leaf.position.z===0));source.survival.elapsed=21;v.draw(source,1000);assert.ok(door.userData.leaves.every(leaf=>Math.abs(leaf.position.z)===.72));}finally{globalThis.window=old;}
});

test('탐색에서는 복도 토끼를 숨기고 해당 방 발견 뒤에만 공간 돌진',()=>{
 const v=buildView(),oldDocument=globalThis.document,oldWindow=globalThis.window;
 globalThis.document={createElement:mockCanvas};v.build('music');v.build('dance');globalThis.document=oldDocument;
 globalThis.window={matchMedia:()=>({matches:false})};v.camera=new THREE.PerspectiveCamera();v.renderer={render(){}};v.lastState='';
 const source={scene:'music',anomaly:null,mouthOpen:false,player:{x:0,z:4,angle:0},keys:new Set(),exploration:{ended:false},caughtAt:0};
 try{v.draw(source,0);assert.equal(v.refs.rabbit.visible,false);assert.ok(Object.values(v.refs.roomRabbits).every(r=>!r.visible));source.exploration.ended=true;v.draw(source,0);assert.equal(v.refs.roomRabbits.music.visible,true);assert.equal(v.refs.roomRabbits.dance.visible,false);const far=v.refs.roomRabbits.music.position.z;assert.ok(v.refs.roomRabbits.music.userData.arms.every(a=>a.material.rotation===0));v.draw(source,700);assert.ok(v.refs.roomRabbits.music.userData.arms.every(a=>Math.abs(a.material.rotation)>2));assert.ok(v.refs.roomRabbits.music.position.z<far);assert.ok(v.refs.roomRabbits.music.position.z>source.player.z);assert.ok(Math.abs(v.refs.roomRabbits.music.userData.body.scale.x/v.refs.roomRabbits.music.userData.body.scale.y-2/3)<1e-12);source.exploration.ended=false;v.draw(source,800);assert.ok(Object.values(v.refs.roomRabbits).every(r=>!r.visible));assert.deepEqual(v.refs.doors.map(d=>d.userData.label),['3-1','3-2','3-3','음악실','무용실']);}finally{globalThis.window=oldWindow;}
});

test('새 일반 교실과 정적인 분위기 인형·창밖 귀신이 각 방에 있다',()=>{
 const v=buildView(),old=globalThis.document;globalThis.document={createElement:mockCanvas};try{v.build('classroom31');v.build('classroom33');v.build('music');v.build('dance');}finally{globalThis.document=old;}
 for(const id of ['classroom31','classroom33']){assert.ok(v.scenes[id].getObjectByName('school-desk'));assert.ok(v.scenes[id].getObjectByName('sliding-classroom-door'));assert.ok(v.refs.roomRabbits[id]);}
 assert.ok(v.scenes.classroom31.getObjectByName('ambience-student-doll'));assert.equal(v.scenes.music.getObjectByName('ambience-student-doll'),undefined);assert.ok(v.scenes.music.getObjectByName('piano-boy-ghost'));
 assert.ok(v.scenes.classroom33.getObjectByName('ambience-window-ghost').position.x<-4.4);assert.ok(v.scenes.dance.getObjectByName('ambience-window-ghost').position.x<-4.4);
 assert.ok(v.scenes.classroom.getObjectByName('doll-contact-shadow'));
});

test('피아노 귀신은 로딩 후만 표시하고 갱신·재시작에서 중복 또는 의자 관통을 만들지 않는다',()=>{
 const v=buildView(),old=globalThis.document;globalThis.document={createElement:mockCanvas};try{v.build('music');}finally{globalThis.document=old;}
 const ghost=v.refs.pianoBoy,source={canvas:{dataset:{}},pianoBoy:{naturalWidth:1024,naturalHeight:1536,complete:false}};v.source=source;
 assert.equal(ghost.visible,false);v.syncTextures(source);assert.equal(ghost.visible,false);
 const art=pngPixels(new URL('../assets/piano-boy-ghost.png',import.meta.url)),canvas={width:0,height:0,getContext:()=>({drawImage(){},getImageData:()=>({data:resizePixels(art,canvas.width,canvas.height)})})};
 globalThis.document={createElement:()=>canvas};try{source.pianoBoy.complete=true;v.syncTextures(source);}finally{globalThis.document=old;}
 assert.equal(ghost.visible,true);assert.equal(ghost.isGroup,true);assert.equal(ghost.userData.volume.material[0].map.image,source.pianoBoy);
 const pose=pianoBoyLayout(source.pianoBoy,ROOM_AMBIENCE.music.boy);assert.deepEqual(ghost.userData.pose,pose);assert.deepEqual(ghost.scale.toArray(),[1,1,1]);assert.equal(ghost.rotation.y,Math.PI/2);assert.equal(ghost.position.y,0);
 const bench=v.scenes.music.getObjectByName('music-stool');assert.ok(ghost.position.x<bench.position.x-.21);assert.equal(ghost.position.z,bench.position.z);
 v.syncTextures(source);v.resetHauntings();let count=0;v.scenes.music.traverse(o=>{if(o.name==='piano-boy-ghost')count++;});assert.equal(count,1);assert.equal(ghost.visible,true);
 source.pianoBoy={complete:true,naturalWidth:0,naturalHeight:0};v.syncTextures(source);assert.equal(ghost.visible,false);
});


test('공·미소의 방별 상태는 종료·재시작 후 남지 않고 귀신 얼굴로 시선이 올라간다',()=>{
 const v=buildView(),priorDocument=globalThis.document,priorWindow=globalThis.window;
 globalThis.document={createElement:mockCanvas};try{v.build('classroom31');v.build('classroom33');}finally{globalThis.document=priorDocument;}
 globalThis.window={matchMedia:()=>({matches:false})};v.camera=new THREE.PerspectiveCamera();v.renderer={render(){}};v.syncTextures=()=>{};const canvas={dataset:{}};
 const source={canvas,scene:'classroom31',anomaly:null,mouthOpen:false,player:{x:-3.7,z:5.25,angle:-Math.PI/2},keys:new Set(),exploration:{ended:false}};v.source=source;
 try{v.draw(source,0);v.draw(source,50);assert.equal(canvas.dataset.ballActive,'true');assert.ok(Number(canvas.dataset.ballHeight)>-.065);source.scene='classroom33';source.player={x:-2.3,z:5.25,angle:-Math.PI/2};for(let t=100;t<2100;t+=50)v.draw(source,t);assert.ok(Number(canvas.dataset.ghostSmile)>.9);assert.ok(v.camera.getWorldDirection(new THREE.Vector3()).y>0);source.exploration.ended=true;v.draw(source,2150);assert.equal(canvas.dataset.ghostSmile,'0.00');assert.equal(canvas.dataset.ballActive,'false');v.resetHauntings();assert.equal(canvas.dataset.ballHeight,'0');assert.equal(canvas.dataset.cornerVisible,'false');}finally{globalThis.window=priorWindow;}
});
