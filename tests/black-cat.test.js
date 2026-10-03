import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {buildBlackCat,updateBlackCat} from '../black-cat.js';
import {catPose} from '../cat-event.js';
test('검은 고양이는 얇은 이미지 면 대신 머리·몸·네 다리·귀·꼬리를 가진 입체 도형이다',()=>{
 const cat=buildBlackCat(),body=cat.getObjectByName('cat-body'),head=cat.getObjectByName('cat-head');
 assert.equal(cat.visible,false);assert.equal(cat.userData.legs.length,4);assert.equal(cat.children.filter(c=>c.name==='cat-pointed-ear').length,2);
 assert.equal(cat.userData.tail.children[0].geometry.type,'TubeGeometry');assert.equal(body.geometry.type,'SphereGeometry');
 for(const mesh of [body,head])assert.ok(Math.min(mesh.scale.x,mesh.scale.y,mesh.scale.z)>.08);
 cat.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(cat);assert.ok(bounds.max.y>.50&&bounds.max.y<.65);assert.ok(bounds.min.z>-.58&&bounds.max.z<.42);
 cat.traverse(mesh=>{if(mesh.isMesh)for(const n of mesh.geometry.attributes.position.array)assert.ok(Number.isFinite(n));});
});
test('뛰는 자세·접지 그림자는 같은 모델에서 갱신되고 종료 때 숨는다',()=>{
 const cat=buildBlackCat(),count=cat.children.length,path={from:{x:-.9,z:5.6},to:{x:.9,z:5.6}},pose=catPose({cat:{path,elapsed:.8}});
 updateBlackCat(cat,pose);assert.equal(cat.visible,true);assert.equal(cat.position.y,pose.y);assert.ok(cat.userData.legs.some(l=>Math.abs(l.rotation.x)>.1));
 cat.updateMatrixWorld(true);assert.ok(Math.abs(cat.userData.shadow.getWorldPosition(new THREE.Vector3()).y-.006)<1e-8);
 updateBlackCat(cat,catPose({cat:{path,elapsed:.8}},true));assert.ok(cat.userData.legs.every(l=>l.rotation.x===0));assert.equal(cat.position.y,0);
 updateBlackCat(cat,null);assert.equal(cat.visible,false);assert.equal(cat.children.length,count);
});
