import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {buildPianoBoyVolume,buildPianoBoyFigure,setPianoBoyTexture} from '../piano-boy-volume.js';
import {pianoBoyLayout} from '../piano-boy.js';
import {ROOM_AMBIENCE} from '../exploration.js';
import {pngPixels,resizePixels} from './png-pixels.js';

const art=pngPixels(new URL('../assets/piano-boy-ghost.png',import.meta.url)),image={complete:true,naturalWidth:art.width,naturalHeight:art.height},config=ROOM_AMBIENCE.music.boy,pose=pianoBoyLayout(image,config);
const geometry=()=>buildPianoBoyVolume(art.pixels,art.width,art.height,pose);
test('남자아이의 실제 원본 윤곽·얼굴 UV를 보존하고 정면이 구형 머리처럼 찌그러지지 않는다',()=>{
 const g=geometry(),p=g.attributes.position,uv=g.attributes.uv,face=new Set(g.index.array.slice(0,g.groups[0].count)),depth=[];
 assert.ok(g.groups[0].count>0&&g.groups[1].count>0);
 for(const i of face){
  assert.ok(Math.abs(p.getX(i)-(uv.getX(i)-.5)*pose.width)<1e-6);
  assert.ok(Math.abs(p.getY(i)-(pose.top-(1-uv.getY(i))*pose.height))<1e-6);
  const v=1-uv.getY(i);if(v>.14&&v<.23&&uv.getX(i)>.40&&uv.getX(i)<.59)depth.push(p.getZ(i));
 }
 assert.ok(depth.length>40);assert.ok(Math.max(...depth)-Math.min(...depth)<.045,'eyes, nose and chin share a shallow photographic surface');
 const edges=new Map();for(let i=0;i<g.index.count;i+=3)for(let j=0;j<3;j++){const a=g.index.array[i+j],b=g.index.array[i+(j+1)%3],key=a<b?`${a},${b}`:`${b},${a}`;edges.set(key,(edges.get(key)||0)+1);}
 assert.ok([...edges.values()].every(n=>n===2));for(const n of [...p.array,...g.attributes.normal.array])assert.ok(Number.isFinite(n));
 assert.ok(g.boundingBox.max.z-g.boundingBox.min.z>.24,'preserved front still connects to a substantial rounded back');
});
test('실제 원본 기반 남자아이는 좌석을 뚫지 않고 맨발을 바닥에 맞춘다',()=>{
 const g=geometry(),p=g.attributes.position;
 for(let i=0;i<p.count;i++){
  const worldX=config.x+p.getZ(i),worldZ=config.z-p.getX(i);
  if(worldX>=2.47&&worldX<=2.89&&Math.abs(worldZ-7.35)<.325)assert.ok(p.getY(i)>=config.y-.004,'body remains above the bench');
 }
 assert.ok(g.boundingBox.min.y>=.015&&g.boundingBox.min.y<.035);assert.ok(g.boundingBox.max.y<1.45);
});
test('남자아이 로딩은 원본 한 장을 공유하고 미완료·빈 알파를 고정하지 않으며 재방문 때 재사용한다',()=>{
 const previous=globalThis.document;let reads=0,empty=false;
 const canvas={width:0,height:0,getContext:()=>({drawImage(){},getImageData(){reads++;return {data:empty?new Uint8ClampedArray(canvas.width*canvas.height*4):resizePixels(art,canvas.width,canvas.height)};}})};
 globalThis.document={createElement:()=>canvas};
 try{
  const root=buildPianoBoyFigure(config),texture=new THREE.Texture(image),mesh=root.userData.volume;
  for(const bad of [undefined,{...image,complete:false},{...image,naturalWidth:0}]){assert.equal(setPianoBoyTexture(root,bad,texture),false);assert.equal(root.visible,false);}
  assert.equal(reads,0);empty=true;assert.equal(setPianoBoyTexture(root,image,texture),false);assert.equal(root.userData.sourceImage,null);
  empty=false;assert.equal(setPianoBoyTexture(root,image,texture),true);const built=mesh.geometry;
  assert.equal(mesh.material[0].map,texture);assert.equal(mesh.material[0].emissiveMap,texture);assert.equal(mesh.material[1].map,null);
  assert.equal(setPianoBoyTexture(root,image,texture),true);assert.equal(mesh.geometry,built);assert.equal(reads,2);assert.equal(root.children.length,1);
 }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});
