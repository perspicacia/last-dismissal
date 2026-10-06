import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {createCharacterAssetLoader,instantiateCharacter} from '../character-assets.js';
import {pngPixels} from './png-pixels.js';

const bytes=readFileSync(new URL('../assets/models/student-reference-rig.glb',import.meta.url));
const length=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+length).toString()),binary=bytes.subarray(28+length);
function attr(index){const a=json.accessors[index],v=json.bufferViews[a.bufferView],offset=(v.byteOffset||0)+(a.byteOffset||0),n={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[a.type],Type={5126:Float32Array,5123:Uint16Array,5125:Uint32Array}[a.componentType];return new THREE.BufferAttribute(new Type(binary.buffer,binary.byteOffset+offset,a.count*n),n);}
async function loadWithoutImages(){
 // Node validates the actual skins/animations with the production GLTFLoader.
 // Browser QA additionally decodes the embedded original PNG.
 const data=structuredClone(json);data.materials=[];data.images=[];data.textures=[];for(const m of data.meshes)for(const p of m.primitives)delete p.material;
 const raw=Buffer.from(JSON.stringify(data)),body=Buffer.alloc(Math.ceil(raw.length/4)*4,32);raw.copy(body);const glb=Buffer.alloc(28+body.length+binary.length);
 glb.write('glTF');glb.writeUInt32LE(2,4);glb.writeUInt32LE(glb.length,8);glb.writeUInt32LE(body.length,12);glb.writeUInt32LE(0x4e4f534a,16);body.copy(glb,20);glb.writeUInt32LE(binary.length,20+body.length);glb.writeUInt32LE(0x004e4942,24+body.length);binary.copy(glb,28+body.length);
 return new GLTFLoader().parseAsync(glb.buffer.slice(glb.byteOffset,glb.byteOffset+glb.byteLength),'');
}
test('새 검토 GLB는 원본 PNG 픽셀을 보존하고 실제 스킨·뼈·유효 웨이트와 두 동작을 갖는다',()=>{
 assert.equal(bytes.readUInt32LE(8),bytes.length);assert.ok(bytes.length<5_000_000);assert.ok(json.skins.length>0);assert.ok(json.skins.every(s=>s.joints.length===17));assert.deepEqual(json.animations.map(a=>a.name),['GentleIdle','JointInspection']);
 const source=readFileSync(new URL('../assets/doll-student-concept.png',import.meta.url));assert.ok(json.images.every(i=>!i.uri));assert.equal(source.readUInt32BE(16),1024);
 for(const mesh of json.meshes)for(const p of mesh.primitives){
  assert.notEqual(p.attributes.JOINTS_0,undefined);assert.notEqual(p.attributes.WEIGHTS_0,undefined);const weights=attr(p.attributes.WEIGHTS_0),joints=attr(p.attributes.JOINTS_0),normals=attr(p.attributes.NORMAL),position=attr(p.attributes.POSITION),uv=attr(p.attributes.TEXCOORD_0);
  for(let i=0;i<weights.count;i++){assert.ok(Math.abs(weights.getX(i)+weights.getY(i)+weights.getZ(i)+weights.getW(i)-1)<1e-5);assert.ok(joints.getX(i)<17&&joints.getY(i)<17);assert.ok(Math.abs(Math.hypot(normals.getX(i),normals.getY(i),normals.getZ(i))-1)<.001);assert.ok(Math.abs(uv.getY(i)-(1-position.getY(i)/1.55))<1e-5);}
 }
 const image=json.bufferViews[json.images[0].bufferView],png=binary.subarray(image.byteOffset,image.byteOffset+image.byteLength);assert.equal(png.readUInt32BE(16),1024);assert.equal(png.readUInt32BE(20),1536);assert.deepEqual(pngPixels(png),pngPixels(source));
});
test('전체 GLB 로더와 인스턴스는 뼈 계층·애니메이션을 유지하고 독립 변형·재질을 갖는다',async()=>{
 const asset=await loadWithoutImages(),a=instantiateCharacter(asset),b=instantiateCharacter(asset);let skinned=0;a.model.traverse(o=>{if(o.isSkinnedMesh){skinned++;assert.equal(o.skeleton.bones.length,17);}});assert.ok(skinned>=17);
 const head=a.model.getObjectByName('doll_head'),other=b.model.getObjectByName('doll_head');assert.notEqual(head,other);const rest=other.quaternion.clone();a.play('GentleIdle');for(let i=0;i<30;i++)a.update(.05);assert.ok(head.quaternion.angleTo(rest)>.01);assert.ok(other.quaternion.angleTo(rest)<1e-10);
 a.play('rest');assert.ok(head.quaternion.angleTo(rest)<1e-6);a.play('JointInspection');for(let i=0;i<20;i++)a.update(.05);assert.ok(a.model.getObjectByName('doll_upperarm_left').quaternion.angleTo(b.model.getObjectByName('doll_upperarm_left').quaternion)>.1);
 const bounds=new THREE.Box3().setFromObject(b.model);assert.ok(Math.abs(bounds.min.y)<1e-5);assert.ok(Math.abs(bounds.max.y-1.55)<1e-5);
 const ma=a.model.getObjectByName('sailor-blouse').children[0].material,mb=b.model.getObjectByName('sailor-blouse').children[0].material;assert.notEqual(ma,mb);
 b.inspectionPose('lying');b.inspectionPose('lying');const pose=new THREE.Group();pose.add(b.model);pose.rotation.x=Math.PI/2;pose.position.y=b.model.userData.floorHeight;pose.updateMatrixWorld(true);
 for(const name of ['original-head-and-curls','pleated-dress','shoe-left','shoe-right']){const part=new THREE.Box3().setFromObject(b.model.getObjectByName(name));assert.ok(part.min.y>=.011,`${name} intersects floor`);assert.ok(part.min.y<.05,`${name} floats ${part.min.y}`);}
 pose.rotation.x=0;pose.position.y=0;b.inspectionPose('standing');assert.ok(Math.abs(b.model.getObjectByName('doll_pelvis').position.z-asset.scene.getObjectByName('doll_pelvis').position.z)<1e-6);
 a.dispose();b.dispose();
});
test('GLB 요청은 동시에 공유하고 실패·빈 모델은 캐시하지 않아 재시도할 수 있다',async()=>{
 let calls=0;const asset={scene:new THREE.Group(),animations:[]};asset.scene.add(new THREE.Group());
 const load=createCharacterAssetLoader({loadAsync:async()=>{calls++;if(calls===1)throw new Error('missing');if(calls===2)return {scene:new THREE.Group()};return asset;}});
 await assert.rejects(load('model'),/missing/);await assert.rejects(load('model'),/Empty/);const [a,b]=await Promise.all([load('model'),load('model')]);assert.equal(a,asset);assert.equal(b,asset);assert.equal(calls,3);assert.equal(await load('model'),asset);
});
