import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {buildPortraitGhost,buildSeatedGirl} from '../ghost-figures.js';
import {buildBlackCat} from '../black-cat.js';
import {ROOM_AMBIENCE} from '../exploration.js';

test('새 인체·머리카락·고양이 곡면은 닫혀 있고 뒤집힌 면·빈 노멀·퇴화 삼각형이 없다',()=>{
 const student=buildPortraitGhost('faceless',ROOM_AMBIENCE.classroom33.faceless),girl=buildSeatedGirl(),cat=buildBlackCat();
 for(const [root,names] of [[student,['ghost-head','ghost-torso','ghost-sleeve','ghost-trouser']],[girl,['girl-torso','girl-hair-back','girl-skirt']],[cat,['cat-body','cat-head']]])for(const name of names){
  const geometry=root.getObjectByName(name).geometry,p=geometry.attributes.position,n=geometry.attributes.normal,edges=new Map();let volume=0;
  const key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e6)).join(',');
  for(let j=0;j<geometry.index.count;j+=3){
   const ids=[0,1,2].map(k=>geometry.index.getX(j+k)),[a,b,c]=ids.map(i=>new THREE.Vector3().fromBufferAttribute(p,i));
   assert.ok(new THREE.Vector3().crossVectors(b.clone().sub(a),c.clone().sub(a)).lengthSq()>1e-16,name+' has a nonzero face');
   volume+=a.dot(new THREE.Vector3().crossVectors(b,c))/6;
   for(let k=0;k<3;k++){const edge=[key(ids[k]),key(ids[(k+1)%3])].sort().join('|');edges.set(edge,(edges.get(edge)||0)+1);const normal=new THREE.Vector3().fromBufferAttribute(n,ids[k]);assert.ok(Math.abs(normal.length()-1)<1e-5,name+' has a unit normal');}
  }
  assert.ok(volume>0,name+' is oriented outwards');assert.ok([...edges.values()].every(count=>count===2),name+' is watertight');
 }
});

test('몸·옷 재질과 머리카락의 미세 디테일은 같은 모델에서 재사용된다',()=>{
 const a=buildSeatedGirl(),b=buildPortraitGhost('faceless',ROOM_AMBIENCE.classroom33.faceless),cat=buildBlackCat();
 assert.equal(a.getObjectByName('girl-torso').material.bumpMap,b.getObjectByName('ghost-torso').material.bumpMap);
 assert.ok(a.getObjectByName('girl-torso').material.bumpScale<=.002);
 assert.ok(a.children.filter(m=>m.name==='girl-hair-strand').every(m=>m.geometry.parameters.radius<.002),'fine hair does not read as thick tubes');
 assert.ok(cat.getObjectByName('cat-body').material.bumpScale<=.002,'fur grain remains finer than anatomy');
});
