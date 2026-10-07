import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {buildBlackCat,updateBlackCat,drawBlackCat} from '../black-cat.js';
import {catPose} from '../cat-event.js';
import {catLimbPose,CAT_STRIDE} from '../cat-gait.js';
test('검은 고양이는 얇은 이미지 면 대신 머리·몸·네 다리·귀·꼬리를 가진 입체 도형이다',()=>{
 const cat=buildBlackCat(),body=cat.getObjectByName('cat-body'),head=cat.getObjectByName('cat-head');
 assert.equal(cat.visible,false);assert.equal(cat.userData.legs.length,4);assert.equal(cat.userData.head.children.filter(c=>c.name==='cat-pointed-ear').length,2);
 assert.equal(cat.userData.tail.children[0].geometry.type,'TubeGeometry');body.geometry.computeBoundingBox();const bodySize=body.geometry.boundingBox.getSize(new THREE.Vector3());assert.ok(bodySize.x>.18&&bodySize.y>.2&&bodySize.z>.55,'continuous body spans shoulders and haunches');
 for(const mesh of [body,head])assert.ok(Math.min(mesh.scale.x,mesh.scale.y,mesh.scale.z)>.08);
 cat.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(cat);assert.ok(bounds.max.y>.65&&bounds.max.y<.75);assert.ok(bounds.min.z>-.58&&bounds.max.z<.42);
 cat.traverse(mesh=>{if(mesh.isMesh)for(const n of mesh.geometry.attributes.position.array)assert.ok(Number.isFinite(n));});
});

test('다리 시작 단면은 몸통 내부에 묻히고 두 귀는 깊이가 있는 좌우 대칭 표면이다',()=>{
 const cat=buildBlackCat();updateBlackCat(cat,{x:0,y:0,z:0,yaw:0,cycle:0,motion:0,opacity:1});cat.updateMatrixWorld(true);
 const body=cat.getObjectByName('cat-body'),ray=new THREE.Raycaster();body.material.side=THREE.DoubleSide;
 for(const rig of cat.userData.legs){
  const point=new THREE.Vector3().fromBufferAttribute(rig.userData.surface.geometry.attributes.position,0);ray.set(point,new THREE.Vector3(1,0,0));
  const distances=[...new Set(ray.intersectObject(body,false).map(hit=>Math.round(hit.distance*1e6)))];
  assert.equal(distances.length,1,'upper leg terminates inside the body, without an exposed stump');
 }
 const ears=cat.userData.head.children.filter(p=>p.name==='cat-pointed-ear'),left=ears[0],right=ears[1];
 left.geometry.computeBoundingBox();assert.ok(left.geometry.boundingBox.getSize(new THREE.Vector3()).z>.035,'ear has genuine front/back depth');
 for(let i=0;i<left.geometry.attributes.position.count;i++){
  const a=new THREE.Vector3().fromBufferAttribute(left.geometry.attributes.position,i).applyMatrix4(left.matrixWorld),b=new THREE.Vector3().fromBufferAttribute(right.geometry.attributes.position,i).applyMatrix4(right.matrixWorld);
  assert.ok(Math.abs(a.x+b.x)<1e-6&&Math.abs(a.y-b.y)<1e-6&&Math.abs(a.z-b.z)<1e-6,'mirrored ear shape and cup');
 }
});

test('머리·몸·귀·변형 다리는 열린 끝이나 비정상 좌표 없이 닫힌 표면이다',()=>{
 const cat=buildBlackCat();
 for(const cycle of [0,.25,.65,.9]){
  updateBlackCat(cat,{x:0,y:0,z:0,yaw:0,cycle,motion:1,opacity:1});
  for(const mesh of [cat.getObjectByName('cat-body'),cat.getObjectByName('cat-head'),...cat.userData.head.children.filter(p=>p.name==='cat-pointed-ear'),...cat.userData.legs.map(r=>r.userData.surface)]){
   const g=mesh.geometry,p=g.attributes.position,edges=new Map(),key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(n=>Math.round(n*1e6)).join(',');
   for(let i=0;i<g.index.count;i+=3){const ids=[0,1,2].map(j=>key(g.index.getX(i+j)));assert.equal(new Set(ids).size,3,mesh.name+' triangle does not collapse');for(let j=0;j<3;j++){const edge=[ids[j],ids[(j+1)%3]].sort().join('|');edges.set(edge,(edges.get(edge)||0)+1);}}
   assert.ok([...edges.values()].every(n=>n===2),mesh.name+' surface is closed');
   for(const n of [...p.array,...g.attributes.normal.array])assert.ok(Number.isFinite(n));
  }
 }
});

test('Canvas 체형과 접지 다리는 정면·사선·옆·뒤에서도 유한하게 투영된다',()=>{
 let shapes=0,restores=0;const ctx=new Proxy({}, {get:(_,key)=>key==='restore'?()=>restores++:['ellipse','moveTo','lineTo','fillRect'].includes(key)?(...values)=>{assert.ok(values.every(Number.isFinite));shapes++;}:()=>{},set:()=>true});
 for(const yaw of [0,Math.PI/4,Math.PI/2,Math.PI]){
  const pose={x:0,y:.008,z:3,yaw,cycle:.7,motion:1,opacity:1,headYaw:.2};
  assert.equal(drawBlackCat(ctx,(x,y,z)=>({x:640+x*100,y:400-y*100,d:5+z}),pose),true);
 }
 assert.ok(shapes>20);assert.equal(restores,4);assert.equal(drawBlackCat(ctx,()=>null,{x:0,y:0,z:0,yaw:0}),false);
});
test('뛰는 자세·접지 그림자는 같은 모델에서 갱신되고 종료 때 숨는다',()=>{
 const cat=buildBlackCat(),count=cat.children.length,path={from:{x:-.9,z:5.6},to:{x:.9,z:5.6}},pose=catPose({cat:{path,elapsed:1.31}});
 updateBlackCat(cat,pose);assert.equal(cat.visible,true);assert.equal(cat.position.y,pose.y);assert.ok(cat.userData.legs.some(l=>l.userData.joints.paw.y+pose.y>.04));
 cat.updateMatrixWorld(true);assert.ok(Math.abs(cat.userData.shadow.getWorldPosition(new THREE.Vector3()).y-.006)<1e-8);
 updateBlackCat(cat,catPose({cat:{path,elapsed:.8}},true));assert.ok(cat.userData.legs.every(l=>l.userData.joints.contact&&l.userData.joints.paw.y===.023));assert.equal(cat.position.y,0);
 updateBlackCat(cat,null);assert.equal(cat.visible,false);assert.equal(cat.children.length,count);
});
test('두 관절 발은 지지 때 바닥/세계 위치를 지키며 대각선끼리 번갈아 든다',()=>{
 const support={cycle:.06,motion:1,y:.01},next={...support,cycle:.14};
 for(const [side,front] of [[-1,true],[1,false]]){
  const a=catLimbPose(support,side,front),b=catLimbPose(next,side,front);
  assert.equal(a.contact,true);assert.equal(b.contact,true);assert.ok(Math.abs(a.paw.y+support.y-.023)<1e-9);
  assert.ok(Math.abs((b.paw.z-a.paw.z)+CAT_STRIDE*(next.cycle-support.cycle))<1e-9,'support foot stays put when the body advances');
 }
 const pose={cycle:.2,motion:1,y:.008},lf=catLimbPose(pose,-1,true),rf=catLimbPose(pose,1,true),lr=catLimbPose(pose,-1,false),rr=catLimbPose(pose,1,false);
 assert.equal(lf.contact,rr.contact);assert.equal(rf.contact,lr.contact);assert.notEqual(lf.contact,rf.contact);
 assert.ok(rf.paw.y+pose.y>.045);
});
test('모든 보행 프레임의 다리 길이·접지·몸체 여유와 재사용을 지킨다',()=>{
 const cat=buildBlackCat(),meshes=[];cat.traverse(m=>{if(m.isMesh)meshes.push(m);});
 const path={from:{x:0,z:0},to:{x:0,z:1.8}};
 for(let t=.01;t<3;t+=.017){
  const pose=catPose({cat:{path,elapsed:t}});updateBlackCat(cat,pose);cat.updateMatrixWorld(true);
  assert.ok(pose.y>=0&&pose.y<.012);
  for(const rig of cat.userData.legs){
   const {hip,knee,paw,contact}=rig.userData.joints;
   for(const point of [hip,knee,paw])for(const n of Object.values(point))assert.ok(Number.isFinite(n));
   const upper=Math.hypot(knee.y-hip.y,knee.z-hip.z),lower=Math.hypot(paw.y-knee.y,paw.z-knee.z);
   assert.ok(Math.abs(upper-(rig.userData.front?.142:.16))<1e-6);assert.ok(Math.abs(lower-(rig.userData.front?.144:.15))<1e-6);
   const worldPaw=rig.userData.paw.getWorldPosition(new THREE.Vector3());assert.ok(worldPaw.y>=.023-1e-9);
   if(contact)assert.ok(Math.abs(worldPaw.y-.023)<1e-9);
  }
  const box=new THREE.Box3().setFromObject(cat);
  assert.ok(box.min.z-pose.z>-.58&&box.max.z-pose.z<.58,'anatomy stays within the path clearance');
  assert.ok(box.min.y>=-.002,'feet never pierce the floor');
 }
 const after=[];cat.traverse(m=>{if(m.isMesh)after.push(m);});assert.deepEqual(after,meshes);
});
