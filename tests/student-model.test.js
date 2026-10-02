import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import * as THREE from '../vendor/three.module.js';
import {prepareStudentModel} from '../student-model.js';
import {ThreeSchoolView} from '../three-school.js';

const bytes=readFileSync(new URL('../assets/models/student-doll.glb',import.meta.url));
const jsonLength=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+jsonLength).toString());
const binaryStart=28+jsonLength;
function attribute(index){
  const a=json.accessors[index],v=json.bufferViews[a.bufferView],offset=binaryStart+(v.byteOffset||0)+(a.byteOffset||0);
  const size={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type],Type={5126:Float32Array,5123:Uint16Array,5125:Uint32Array}[a.componentType];
  assert.ok(Type&&size);assert.ok((v.byteOffset||0)+v.byteLength<=json.buffers[0].byteLength);
  return new THREE.BufferAttribute(new Type(bytes.buffer,bytes.byteOffset+offset,a.count*size),size,a.normalized||false);
}
// Reconstruct only binary geometry/transforms for floor/volume tests. The real
// browser fixture also decodes the embedded images using the production loader.
function asset(){
  const nodes=json.nodes.map(node=>{
    const group=new THREE.Group();group.name=node.name||'';
    if(node.matrix)group.applyMatrix4(new THREE.Matrix4().fromArray(node.matrix));
    else {if(node.translation)group.position.fromArray(node.translation);if(node.rotation)group.quaternion.fromArray(node.rotation);if(node.scale)group.scale.fromArray(node.scale);}
    if(node.mesh!==undefined)for(const p of json.meshes[node.mesh].primitives){
      const geometry=new THREE.BufferGeometry();for(const [key,name] of [['POSITION','position'],['NORMAL','normal'],['TEXCOORD_0','uv']])if(p.attributes[key]!==undefined)geometry.setAttribute(name,attribute(p.attributes[key]));
      if(p.indices!==undefined)geometry.setIndex(attribute(p.indices));
      const material=new THREE.MeshStandardMaterial();material.name=json.materials[p.material].name;
      group.add(new THREE.Mesh(geometry,material));
    }return group;
  });
  json.nodes.forEach((node,i)=>{for(const child of node.children||[])nodes[i].add(nodes[child]);});
  const scene=new THREE.Group();for(const index of json.scenes[json.scene||0].nodes)scene.add(nodes[index]);return scene;
}

test('학생 GLB는 내부 메시·재질·PNG를 포함하고 외부 다운로드·스킨을 요구하지 않는다',()=>{
  assert.equal(bytes.toString('ascii',0,4),'glTF');assert.equal(bytes.readUInt32LE(4),2);assert.equal(bytes.readUInt32LE(8),bytes.length);
  assert.equal(json.asset.version,'2.0');assert.ok(bytes.length<3_000_000);
  assert.ok(json.meshes.length>=4);assert.ok(!json.skins&&!json.animations);
  assert.ok(json.buffers.every(b=>!b.uri));assert.equal(json.images.length,2);
  for(const image of json.images){assert.ok(!image.uri);assert.equal(image.mimeType,'image/png');const v=json.bufferViews[image.bufferView];assert.deepEqual([...bytes.subarray(binaryStart+v.byteOffset,binaryStart+v.byteOffset+8)],[137,80,78,71,13,10,26,10]);}
  for(const name of ['aged ivory porcelain','amber glass iris','woven navy uniform','ash blonde hair'])assert.ok(json.materials.some(m=>m.name===name));
});

test('실제 GLB의 두개골과 몸통은 사진 평면과 달리 옆·뒤 깊이가 있고 법선이 유효하다',()=>{
  const model=asset(),head=model.getObjectByName('head'),body=model.getObjectByName('uniform');
  const h=new THREE.Box3().setFromObject(head).getSize(new THREE.Vector3()),b=new THREE.Box3().setFromObject(body).getSize(new THREE.Vector3());
  assert.ok(h.z>.30&&h.z/h.x>.65);assert.ok(b.z>.20);assert.ok(b.x>.35);
  for(const mesh of json.meshes)for(const primitive of mesh.primitives){
    const positions=attribute(primitive.attributes.POSITION),normals=attribute(primitive.attributes.NORMAL),index=attribute(primitive.indices);
    assert.equal(positions.count,normals.count);
    for(let i=0;i<positions.count;i++){assert.ok(Number.isFinite(positions.getX(i)+positions.getY(i)+positions.getZ(i)));assert.ok(Math.abs(Math.hypot(normals.getX(i),normals.getY(i),normals.getZ(i))-1)<.001);}
    for(const i of index.array)assert.ok(i<positions.count);
  }
});

test('모델의 천·머리 무늬는 밝기 넘침 때문에 검은 점이 생기지 않는다',()=>{
  for(const image of json.images){
    const view=json.bufferViews[image.bufferView],png=bytes.subarray(binaryStart+view.byteOffset,binaryStart+view.byteOffset+view.byteLength),idat=[];
    const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
    for(let i=8;i+12<=png.length;){const length=png.readUInt32BE(i),type=png.toString('ascii',i+4,i+8);if(type==='IDAT')idat.push(png.subarray(i+8,i+8+length));if(type==='IEND')break;i+=length+12;}
    const rows=inflateSync(Buffer.concat(idat));assert.equal(rows.length,(width*4+1)*height);
    for(let y=0;y<height;y++){assert.equal(rows[y*(width*4+1)],0);for(let x=0;x<width;x++){const i=y*(width*4+1)+1+x*4;assert.ok(rows[i]>=175);assert.equal(rows[i+3],255);}}
  }
});

test('균일 크기와 누운 회전은 1.55m 비율을 보존하고 머리·몸·뒤꿈치를 바닥 위에 놓는다',()=>{
  const solid=prepareStudentModel(asset(),1.55),standing=new THREE.Box3().setFromObject(solid);
  assert.ok(Math.abs(standing.max.y-standing.min.y-1.55)<1e-5);assert.ok(Math.abs(standing.min.y)<1e-5);
  assert.equal(solid.scale.x,solid.scale.y);assert.equal(solid.scale.x,solid.scale.z);
  const pose=new THREE.Group();pose.add(solid);pose.rotation.x=Math.PI/2;pose.position.y=solid.userData.floorHeight;pose.updateMatrixWorld(true);
  const floor=new THREE.Box3().setFromObject(pose);assert.ok(Math.abs(floor.min.y-.012)<1e-5);
  for(const name of ['head','uniform','socks-and-shoes']){const part=new THREE.Box3().setFromObject(solid.getObjectByName(name));assert.ok(part.min.y>=.011);assert.ok(part.min.y<.07,`${name} floats ${part.min.y}m`);}
  assert.ok(floor.max.y-floor.min.y>.35);assert.ok(Math.abs(floor.max.z-floor.min.z-1.55)<1e-5);
});

function view(){
  const v=Object.create(ThreeSchoolView.prototype),tilt=new THREE.Group(),doll=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshStandardMaterial());
  doll.material.map={};tilt.add(doll);v.refs={doll,dollTilt:tilt,dollRoot:new THREE.Group()};v.dollVolumeReady=true;v.source={canvas:{dataset:{}},exploration:{ended:false}};return v;
}
test('GLB는 로딩 전 PNG를 유지하고 준비 후 탐색 인형만 교체하며 이전 기립 화면은 보존한다',async()=>{
  const v=view();v.updateStudentModel(v.source);let resolve;
  const loading=v.loadStudentModel(()=>new Promise(done=>{resolve=done;}));
  assert.equal(v.source.canvas.dataset.studentModelStatus,'loading');assert.equal(v.refs.doll.visible,true);
  resolve(asset());await loading;assert.equal(v.source.canvas.dataset.studentModelStatus,'ready');assert.equal(v.source.canvas.dataset.studentModel,'glb');assert.equal(v.refs.doll.visible,false);assert.equal(v.refs.dollSolid.visible,true);
  const y=v.refs.dollRoot.position.y;assert.ok(y>.15);
  v.source.exploration=null;v.updateStudentModel(v.source);assert.equal(v.refs.dollSolid.visible,false);assert.equal(v.refs.doll.visible,true);assert.equal(v.refs.dollRoot.position.y,.035);
  v.source.exploration={ended:false};v.updateStudentModel(v.source);assert.equal(v.refs.dollRoot.position.y,y);assert.equal(v.refs.dollSolid.visible,true);
});
test('로딩 실패 또는 빈 모델은 게임을 막는 예외 없이 기존 표시로 복구한다',async()=>{
  for(const load of [()=>Promise.reject(new Error('missing')),()=>Promise.resolve(new THREE.Group())]){
    const v=view();await assert.doesNotReject(v.loadStudentModel(load));assert.equal(v.source.canvas.dataset.studentModelStatus,'fallback');assert.equal(v.refs.doll.visible,true);assert.equal(v.source.canvas.dataset.studentModel,'image-volume');assert.equal(v.source.canvas.dataset.dollReady,'true');
  }
});
