import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {createPianoBoyBodyLoader,preparePianoBoyBody} from '../piano-boy-body.js';
import {buildPianoBoyFigure,buildPianoBoyHead,attachPianoBoyBody,setPianoBoyTexture} from '../piano-boy-volume.js';
import {ThreeSchoolView} from '../three-school.js';
import {pianoBoyLayout} from '../piano-boy.js';
import {ROOM_AMBIENCE} from '../exploration.js';
import {pngPixels,resizePixels} from './png-pixels.js';

const file=await readFile(new URL('../assets/models/piano-boy-body.glb',import.meta.url));
const asset=await new GLTFLoader().parseAsync(file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength),'');
const body=asset.scene.getObjectByName('piano-boy-free-body').geometry;
const art=pngPixels(new URL('../assets/piano-boy-ghost.png',import.meta.url));
const image={complete:true,naturalWidth:art.width,naturalHeight:art.height},config=ROOM_AMBIENCE.music.boy,pose=pianoBoyLayout(image,config);
function closed(g){
 const edges=new Map();
 for(let i=0;i<g.index.count;i+=3)for(let j=0;j<3;j++){
  const ids=[g.index.getX(i+j),g.index.getX(i+(j+1)%3)].sort((a,b)=>a-b),key=ids.join(',');edges.set(key,(edges.get(key)||0)+1);
 }
 assert.ok([...edges.values()].every(n=>n===2),'every surface edge belongs to two triangles');
 for(const n of [...g.attributes.position.array,...g.attributes.normal.array])assert.ok(Number.isFinite(n));
}

test('로컬 무료 인체 GLB는 얼굴 없는 닫힌 앉은 몸통이며 좌석·맨발이 접지한다',()=>{
 closed(body);body.computeBoundingBox();const p=body.attributes.position;
 assert.ok(p.count>3000&&p.count<9000,'anatomy, separate garments and toes remain a small authored mesh');
 assert.ok(body.boundingBox.max.y<1.10,'source model head is excluded');
 assert.ok(body.boundingBox.max.z-body.boundingBox.min.z>.45,'seated knees have an L profile');
 let seat=0,chest=[],back=[],knees=0;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
  if(Math.abs(x)<.12&&y>.77&&y<.91)(z<.065?chest:back).push(z);
  if(y>.44&&y<.58&&z<-.18)knees++;
  const worldX=config.x+z,worldZ=config.z-x;
  if(worldX>=2.47&&worldX<=2.89&&Math.abs(worldZ-7.35)<.325){assert.ok(y>=config.y-.004,'no body surface cuts through bench');if(Math.abs(y-config.y)<.008)seat++;}
 }
 assert.ok(Math.max(...back)-Math.min(...chest)>.18,'chest and back are distinct surfaces');
 assert.ok(knees>15&&seat>5);assert.ok(body.boundingBox.min.y>.020&&body.boundingBox.min.y<.035);
 let volume=0;
 for(let i=0;i<body.index.count;i+=3){
  const [a,b,c]=[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(p,body.index.getX(i+j)));
  assert.ok(b.clone().sub(a).cross(c.clone().sub(a)).length()>2e-12,'surface triangles do not collapse at soles or neckline');
  volume+=a.dot(b.cross(c))/6;
 }
 assert.ok(volume>.02,'winding encloses a positive anatomical volume');
 for(let i=0;i<p.count;i++)assert.ok(new THREE.Vector3().fromBufferAttribute(body.attributes.normal,i).length()>.99);
});

test('원본 얼굴의 눈·코·입·턱 비율은 보존하고 머리 둘레와 뒷면만 둥글게 연결한다',()=>{
 const head=buildPianoBoyHead(art.pixels,art.width,art.height,pose);closed(head);
 const p=head.attributes.position,uv=head.attributes.uv,front=new Set(head.index.array.slice(0,head.groups[0].count));
 for(const i of front){assert.ok(Math.abs(p.getX(i)-(uv.getX(i)-.5)*pose.width)<1e-6);assert.ok(Math.abs(p.getY(i)-(pose.top-(1-uv.getY(i))*pose.height))<1e-6);}
 const at=(u,v)=>{let nearest=Infinity,point;for(const i of front){const d=(uv.getX(i)-u)**2+(1-uv.getY(i)-v)**2;if(d<nearest){nearest=d;point=new THREE.Vector3().fromBufferAttribute(p,i);}}return point;};
 const landmarks=[at(.457,.160),at(.548,.160),at(.501,.190),at(.501,.218),at(.501,.242)];
 for(const distance of [.60,.85,1.20])for(const yaw of [-35,0,35]){
  const theta=THREE.MathUtils.degToRad(yaw),target=new THREE.Vector3(0,pose.eyeY-.035,-.095),camera=new THREE.PerspectiveCamera(36,1,.01,30);
  camera.position.set(Math.sin(theta)*distance,1.5,target.z-Math.cos(theta)*distance);camera.lookAt(target);camera.updateMatrixWorld();
  const projected=landmarks.map(p=>p.clone().project(camera)),reference=landmarks.map(p=>new THREE.Vector3(p.x,p.y,-.095).project(camera));
  const ratio=p=>p[0].clone().add(p[1]).multiplyScalar(.5).distanceTo(p[4])/p[0].distanceTo(p[1]);
  assert.ok(Math.abs(ratio(projected)/ratio(reference)-1)<.03,`${distance}m / ${yaw}° preserves eye-to-chin ratio`);
 }
 const back=new Set([...head.index.array.slice(head.groups[0].count)].filter(i=>!front.has(i)));
 assert.ok([...back].every(i=>head.attributes.photoBlend.getX(i)===0),'eyes are never painted on back of head');
 assert.ok(head.boundingBox.max.z-head.boundingBox.min.z>.17);
});

test('실제 목은 턱 아래까지 이어져 사진 머리 하단의 긴 판을 줄인다',()=>{
 const head=buildPianoBoyHead(art.pixels,art.width,art.height,pose),p=body.attributes.position;
 const bottom=head.boundingBox.min.y,underChin=[];
 for(let i=0;i<p.count;i++)if(Math.abs(p.getX(i))<.03&&Math.abs(p.getY(i)-bottom)<.014)underChin.push(p.getZ(i));
 assert.ok(underChin.length>5,'neck surface reaches the retained head');
 const neckFront=Math.min(...underChin),neckBack=Math.max(...underChin);
 assert.ok(neckFront-head.boundingBox.min.z<.012,'no long unsupported photographic chin shelf');
 assert.ok(neckBack>-.02&&neckFront<-.06,'the neck supports both sides of the head bottom');
 assert.ok(body.boundingBox.max.y>bottom+.010,'head and neck overlap vertically');
 const cap=head.attributes.color.count-1;
 assert.equal(head.attributes.photoBlend.getX(cap),0,'bottom cap has no stretched face photo');
 const clothed=preparePianoBoyBody(body,pose,art.pixels,art.width,art.height);
 let neckVertex=-1;for(let i=0;i<p.count;i++)if(Math.abs(p.getX(i))<.03&&p.getY(i)>1.05){neckVertex=i;break;}
 for(let c=0;c<3;c++)assert.ok(Math.abs(head.attributes.color.getComponent(cap,c)-clothed.attributes.color.getComponent(neckVertex,c))<.008,'head closure and actual neck share skin colour');
 clothed.dispose();head.dispose();
});

test('인체의 앞면만 원본 의상을 연결하고 옆·등은 원본 색으로 채운다',()=>{
 const g=preparePianoBoyBody(body,pose,art.pixels,art.width,art.height),p=g.attributes.position,n=g.attributes.normal;
 assert.notEqual(g,body);assert.equal(g.index.count,body.index.count);
 let faceOn=0,backOff=0;
 for(let i=0;i<p.count;i++){
  const b=g.attributes.photoBlend.getX(i);assert.ok(Number.isFinite(b)&&b>=0&&b<=1);
  if(n.getZ(i)>.2){assert.equal(b,0);backOff++;}if(n.getZ(i)<-.8&&b>.95)faceOn++;
  for(const v of [g.attributes.uv.getX(i),g.attributes.uv.getY(i),...Array.from({length:3},(_,axis)=>g.attributes.color.getComponent(i,axis))])assert.ok(Number.isFinite(v));
 }
 assert.ok(faceOn>100&&backOff>100);assert.equal(body.attributes.photoBlend,undefined,'shared source geometry remains immutable');
});

test('소매와 반바지는 원본 폭을 유지하는 별도 입체 표면이고 팔·다리의 두께는 끊기지 않는다',()=>{
 const p=body.attributes.position,garment=body.attributes._garment;
 const part=(kind,y,tolerance=.014)=>Array.from({length:p.count},(_,i)=>i).filter(i=>garment.getX(i)===kind&&Math.abs(p.getY(i)-y)<tolerance);
 const range=(ids,axis)=>[Math.min(...ids.map(i=>p.getComponent(i,axis))),Math.max(...ids.map(i=>p.getComponent(i,axis)))];
 const originalWidth=(v,side=false)=>{const row=Math.round(v*(art.height-1)),xs=[];for(let x=0;x<art.width;x++)if((!side||x<art.width/2)&&art.pixels[4*(row*art.width+x)+3]>96)xs.push(x);return (Math.max(...xs)-Math.min(...xs))/art.width*pose.width;};
 const shirt=part(1,pose.top-.405*pose.height,.025),[left,right]=range(shirt,0),reference=originalWidth(.405);
 assert.ok(shirt.length>20&&right-left>reference*.85&&right-left<reference*1.15,'loose sleeves retain the original photographed breadth');
 assert.ok(part(2,.56,.025).length>10,'shorts have their own lower surface');
 const bareArm=part(0,.84,.03).filter(i=>Math.abs(p.getX(i))>.14),clothedArm=shirt.filter(i=>Math.abs(p.getX(i))>.14);
 assert.ok(range(clothedArm,0)[1]>range(bareArm,0)[1]+.008,'cuffs have ease beyond the underlying arm');
 for(const y of [.25,.32,.40]){
  const calf=part(0,y).filter(i=>p.getX(i)<0),[min,max]=range(calf,0),width=max-min,reference=originalWidth((pose.top-y)/pose.height,true);
  assert.ok(width>reference*.75&&width<reference*1.5,`${y}m calf follows the original child proportions`);
 }
 // Surface edges must not jump across a hard inflation threshold at joints.
 for(let i=0;i<body.index.count;i+=3)for(let edge=0;edge<3;edge++){
  const a=body.index.getX(i+edge),b=body.index.getX(i+(edge+1)%3);
  if(garment.getX(a)!==0||Math.abs(p.getX(a))<.03||p.getY(a)>.50||p.getY(a)<.12)continue;
  assert.ok(new THREE.Vector3().fromBufferAttribute(p,a).distanceTo(new THREE.Vector3().fromBufferAttribute(p,b))<.10,'calf and ankle surface stays locally continuous');
 }
});

test('모델 손·발에 사진 손가락을 중복하지 않고 바지 위의 원본 손 사진도 제외한다',()=>{
 const g=preparePianoBoyBody(body,pose,art.pixels,art.width,art.height),p=g.attributes.position,tag=g.attributes._garment,detail=g.attributes._skindetail;
 let bare=0,shorts=0,toes=0;
 for(let i=0;i<p.count;i++){
  const u=g.attributes.uv.getX(i),v=1-g.attributes.uv.getY(i),blend=g.attributes.photoBlend.getX(i);
  if(detail.getX(i)>.99){bare++;assert.ok(blend<.011,'actual digits use continuous skin, not duplicate photographic fingers');if(p.getY(i)<.06&&p.getZ(i)<-.310)toes++;}
  if(tag.getX(i)===2&&v>.53&&v<.58&&Math.abs(u-.5)>.085&&Math.abs(u-.5)<.175){shorts++;assert.ok(blend<.02,'photographic hands cannot be printed on the shorts');}
 }
 assert.ok(bare>100&&shorts>3&&toes>40);g.dispose();
});

test('양손은 무릎 위 가까이에 머무르고 발가락은 발끝과 연결된다',()=>{
 const p=body.attributes.position,tag=body.attributes._garment,detail=body.attributes._skindetail;
 for(const sign of [-1,1]){
  const hands=[],knees=[],feet=[],toes=[];
  for(let i=0;i<p.count;i++)if(tag.getX(i)===0&&p.getX(i)*sign>0){
   const point=new THREE.Vector3().fromBufferAttribute(p,i);
   if(detail.getX(i)>.99&&point.y>.5&&point.y<.7)hands.push(point);
   if(detail.getX(i)<.01&&point.y>.5&&point.y<.61&&point.z<-.15)knees.push(point);
   if(point.y<.06)(point.z<-.310?toes:feet).push(point);
  }
  const distance=(a,b)=>Math.min(...a.flatMap(p=>b.map(q=>p.distanceTo(q))));
  assert.ok(hands.length>20&&knees.length>10&&distance(hands,knees)<.035,'hand surface rests within a few centimetres of its knee');
  assert.ok(toes.length>15&&distance(toes,feet)<.018,'toe volumes join the authored foot tip');
 }
});

test('무료 모델 로더는 동시에 한 번 읽고 실패 후 다시 불러올 수 있다',async()=>{
 let calls=0,fail=true;
 const load=createPianoBoyBodyLoader({async loadAsync(){calls++;if(fail)throw new Error('offline');return asset;}});
 const one=load(),two=load();assert.equal(one,two);await assert.rejects(one,/offline/);assert.equal(calls,1);
 fail=false;assert.equal(await load(),body);assert.equal(await load(),body);assert.equal(calls,2);
 const empty=createPianoBoyBodyLoader({async loadAsync(){return {scene:new THREE.Group()};}});await assert.rejects(empty(),/empty/);
});

test('원본 이미지와 몸통은 로딩 순서·재방문·재연결 때 중복이나 빈 알파를 남기지 않는다',()=>{
 const previous=globalThis.document;let reads=0,empty=false;
 const canvas={width:0,height:0,getContext:()=>({drawImage(){},getImageData(){reads++;return {data:empty?new Uint8ClampedArray(canvas.width*canvas.height*4):resizePixels(art,canvas.width,canvas.height)};}})};
 globalThis.document={createElement:()=>canvas};
 try{
  for(const bodyFirst of [true,false]){
   const root=buildPianoBoyFigure(config),texture=new THREE.Texture(image);
   if(bodyFirst)attachPianoBoyBody(root,body);
   assert.equal(setPianoBoyTexture(root,image,texture),true);
   if(!bodyFirst)attachPianoBoyBody(root,body);
   assert.equal(root.visible,true);assert.equal(root.children.length,2);assert.equal(root.userData.body.material.map,texture);
   const before=reads,built=root.userData.body.geometry;attachPianoBoyBody(root,body);setPianoBoyTexture(root,image,texture);
   assert.equal(root.userData.body.geometry,built);assert.equal(reads,before);
   const shader={vertexShader:'#include <begin_vertex>',fragmentShader:'#include <map_fragment>\n#include <color_fragment>\n#include <emissivemap_fragment>'};root.userData.body.material.onBeforeCompile(shader);assert.ok(shader.fragmentShader.includes('diffuseColor.a=1.0;'),'image transparency cannot punch holes in anatomical body');
   let disposed=0;root.userData.body.geometry.addEventListener('dispose',()=>disposed++);attachPianoBoyBody(root,body.clone());assert.equal(root.children.length,2);assert.equal(disposed,1);
  }
  const root=buildPianoBoyFigure(config);attachPianoBoyBody(root,body);empty=true;
  assert.equal(setPianoBoyTexture(root,image,new THREE.Texture(image)),false);assert.equal(root.userData.sourceImage,null);assert.equal(root.visible,false);
  empty=false;assert.equal(setPianoBoyTexture(root,image,new THREE.Texture(image)),true);
 }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});

test('Three.js 몸통 파일 실패는 탐색 렌더를 중단하지 않고 재시도하면 연결된다',async()=>{
 const view=Object.create(ThreeSchoolView.prototype);view.refs={pianoBoy:buildPianoBoyFigure(config)};view.source={canvas:{dataset:{}}};view.lastState='playing';
 await view.loadPianoBoyBody(()=>Promise.reject(new Error('offline')));assert.equal(view.source.canvas.dataset.pianoBoyBodyStatus,'fallback');assert.equal(view.refs.pianoBoy.userData.bodySource,null);
 await view.loadPianoBoyBody(()=>Promise.resolve(body));assert.equal(view.source.canvas.dataset.pianoBoyBodyStatus,'ready');assert.equal(view.lastState,'');assert.equal(view.refs.pianoBoy.children.length,2);
});

test('음악실 입장 때 실패한 몸통만 재시도하고 매 프레임이나 성공 후에는 재요청하지 않는다',async()=>{
 const view=Object.create(ThreeSchoolView.prototype);view.refs={pianoBoy:buildPianoBoyFigure(config)};view.source={scene:'corridor',canvas:{dataset:{pianoBoyBodyStatus:'fallback'}}};
 let calls=0,finish;const load=()=>{calls++;return new Promise(resolve=>{finish=resolve;});};
 const request=view.loadPianoBoyBody(load);assert.equal(request,view.loadPianoBoyBody(load));await Promise.resolve();assert.equal(calls,1);finish(body);await request;
 await view.loadPianoBoyBody(load);assert.equal(calls,1);
 let retries=0;view.loadPianoBoyBody=()=>{retries++;};view.source.canvas.dataset.pianoBoyBodyStatus='fallback';
 view.updatePianoBoyBodyLoading(view.source);view.source.scene='music';view.updatePianoBoyBodyLoading(view.source);
 for(let i=0;i<50;i++)view.updatePianoBoyBodyLoading(view.source);assert.equal(retries,1);
 view.source.scene='corridor';view.updatePianoBoyBodyLoading(view.source);view.source.scene='music';view.updatePianoBoyBodyLoading(view.source);assert.equal(retries,2);
 view.source.canvas.dataset.pianoBoyBodyStatus='ready';view.source.scene='corridor';view.updatePianoBoyBodyLoading(view.source);view.source.scene='music';view.updatePianoBoyBodyLoading(view.source);assert.equal(retries,2);
});
