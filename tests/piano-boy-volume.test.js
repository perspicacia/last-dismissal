import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {buildPianoBoyVolume,buildPianoBoyFigure,setPianoBoyTexture} from '../piano-boy-volume.js';
import {pianoBoyLayout} from '../piano-boy.js';
import {ROOM_AMBIENCE} from '../exploration.js';
import {pngPixels,resizePixels} from './png-pixels.js';

const art=pngPixels(new URL('../assets/piano-boy-ghost.png',import.meta.url)),image={complete:true,naturalWidth:art.width,naturalHeight:art.height},config=ROOM_AMBIENCE.music.boy,pose=pianoBoyLayout(image,config);
const geometry=()=>buildPianoBoyVolume(art.pixels,art.width,art.height,pose);
test('남자아이의 원본 XY·얼굴 UV를 보존하면서 앞면도 완만한 곡면을 가진다',()=>{
 const g=geometry(),p=g.attributes.position,uv=g.attributes.uv,face=new Set(g.index.array.slice(0,g.groups[0].count)),depth=[];
 assert.ok(g.groups[0].count>0&&g.groups[1].count>0);
 for(const i of face){
  assert.ok(Math.abs(p.getX(i)-(uv.getX(i)-.5)*pose.width)<1e-6);
  assert.ok(Math.abs(p.getY(i)-(pose.top-(1-uv.getY(i))*pose.height))<1e-6);
  const v=1-uv.getY(i);if(v>.14&&v<.23&&uv.getX(i)>.40&&uv.getX(i)<.59)depth.push(p.getZ(i));
 }
 assert.ok(depth.length>40);const relief=Math.max(...depth)-Math.min(...depth);assert.ok(relief>.055&&relief<.14,'face has bounded anatomical relief rather than a flat front or exaggerated sphere');
 const edges=new Map();for(let i=0;i<g.index.count;i+=3)for(let j=0;j<3;j++){const a=g.index.array[i+j],b=g.index.array[i+(j+1)%3],key=a<b?`${a},${b}`:`${b},${a}`;edges.set(key,(edges.get(key)||0)+1);}
 assert.ok([...edges.values()].every(n=>n===2));for(const n of [...p.array,...g.attributes.normal.array])assert.ok(Number.isFinite(n));
 assert.ok(g.boundingBox.max.z-g.boundingBox.min.z>.24,'head, seated knees and feet occupy distinct depth ranges');
});
test('앞뒤 두께를 나누고 앉은 무릎·종아리 및 사진의 측면 전환을 조형한다',()=>{
 const g=geometry(),p=g.attributes.position,uv=g.attributes.uv,front=new Set(g.index.array.slice(0,g.groups[0].count)),back=new Set(g.index.array.slice(g.groups[0].count));
 const at=(u,v,set)=>{let nearest=Infinity,result;for(const i of set){const d=(uv.getX(i)-u)**2+(1-uv.getY(i)-v)**2;if(d<nearest){nearest=d;result=p.getZ(i);}}return result;};
 for(const v of [.17,.41]){assert.ok(at(.5,v,front)<-.07,'front has real cranial/chest depth');assert.ok(at(.5,v,back)>.09);assert.ok(at(.5,v,back)<.18,'back is not an oversized balloon');}
 assert.ok(at(.415,.65,front)<-.20,'knees project forward from the seat');
 assert.ok(at(.438,.81,back)<-.09,'calves clear the bench fascia');
 assert.ok(at(.438,.81,back)-at(.438,.81,front)>.10,'lower legs remain rounded');
 const blend=g.attributes.photoBlend;assert.equal(blend.count,p.count);
 for(const n of blend.array)assert.ok(Number.isFinite(n)&&n>=0&&n<=1);
 assert.ok([...front].some(i=>blend.getX(i)>.99));assert.ok([...front].some(i=>blend.getX(i)<.05),'photograph fades into side material at grazing surfaces');
});
test('실제 원본 기반 남자아이는 좌석을 뚫지 않고 맨발을 바닥에 맞춘다',()=>{
 const g=geometry(),p=g.attributes.position;let support=0;
 for(let i=0;i<p.count;i++){
  const worldX=config.x+p.getZ(i),worldZ=config.z-p.getX(i);
  if(worldX>=2.47&&worldX<=2.89&&Math.abs(worldZ-7.35)<.325){assert.ok(p.getY(i)>=config.y-.004,'body remains above the bench');if(Math.abs(p.getY(i)-config.y)<.008)support++;}
 }
 assert.ok(support>20,'seated hips actually reach the bench rather than float in front');
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
