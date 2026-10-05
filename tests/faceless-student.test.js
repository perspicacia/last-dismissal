import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three.module.js';
import {ROOM_AMBIENCE,newExploration,advanceExploration} from '../exploration.js';
import {facelessStudentLayout,facelessStudentBlocker,facelessStudentQuad,drawFacelessStudent} from '../faceless-student.js';
import {moveClassroomPlayer,CLASSROOM_SPAWN} from '../classroom.js';
import {ThreeSchoolView} from '../three-school.js';
const image={naturalWidth:1024,naturalHeight:1536,complete:true},config=ROOM_AMBIENCE.classroom33.faceless;

test('새 귀신 PNG 비율·발 접촉과 벽 안쪽 경계를 보존한다',()=>{
 const png=readFileSync(new URL('../assets/faceless-student.png',import.meta.url));
 assert.equal(png.readUInt32BE(16),1024);assert.equal(png.readUInt32BE(20),1536);assert.equal(png[25],6);
 const pose=facelessStudentLayout(image,config);assert.ok(Math.abs(pose.width/pose.height-2/3)<1e-12);
 assert.ok(Math.abs(pose.top-1498/1536*pose.height-.025)<1e-12);
 assert.ok(config.x+pose.width*Math.cos(config.angle)/2<4.4);assert.ok(config.z+pose.width*Math.sin(config.angle)/2<9.8);
});
test('추가 충돌은 학생 관통만 막고 기존 책상·의자·중앙 탐색을 보존한다',()=>{
 const extra=[facelessStudentBlocker(config)],p={x:config.x,z:8.8,angle:0};
 assert.equal(moveClassroomPlayer(p,new Set(['forward']),.05,null,extra).z,p.z);
 assert.ok(moveClassroomPlayer(p,new Set(['back']),.05,null,extra).z<p.z);
 const chair={x:1.2,z:3.95,angle:0};assert.equal(moveClassroomPlayer(chair,new Set(['forward']),.05,null,extra).z,chair.z);
 let center={...CLASSROOM_SPAWN};for(let i=0;i<35;i++)center=moveClassroomPlayer(center,new Set(['forward']),.05,null,extra);assert.ok(center.z>7);
 let state=newExploration(()=>.99);for(let i=0;i<100;i++)state=advanceExploration(state,.1,'classroom33',p);assert.equal(state.ended,false);
});
test('Canvas는 고정 방향 원근을 유지하며 미완료·실패·시선 뒤를 건너뛴다',()=>{
 const angle=config.angle,camera={x:config.x-2*Math.sin(angle),z:config.z-2*Math.cos(angle)};
 const project=(x,y,z)=>{const dx=x-camera.x,dz=z-camera.z,d=dx*Math.sin(angle)+dz*Math.cos(angle);return {x:(dx*Math.cos(angle)-dz*Math.sin(angle))*400/d,y:(1.5-y)*400/d,d};};
 const quad=facelessStudentQuad(project,image,config);assert.ok(quad[0].x<quad[1].x);assert.ok(Math.abs((quad[1].x-quad[0].x)/(quad[3].y-quad[0].y)-2/3)<1e-12);
 let draws=0;const ctx=new Proxy({}, {get:(_,k)=>k==='drawImage'?()=>draws++:k==='transform'?(...m)=>assert.ok(m.every(Number.isFinite)):()=>{}});
 assert.equal(drawFacelessStudent(ctx,project,image,config),true);assert.ok(draws>0);assert.equal(drawFacelessStudent(ctx,()=>null,image,config),false);
 for(const missing of [undefined,{...image,complete:false},{naturalWidth:0,naturalHeight:0,complete:true}]){assert.equal(facelessStudentLayout(missing,config),null);assert.equal(drawFacelessStudent(ctx,()=>{throw Error('unready');},missing,config),false);}
});
test('Three.js는 한 학생만 유지하고 이미지 실패/재시작에서 복구한다',()=>{
 const old=globalThis.document;globalThis.document={createElement(){return {width:128,height:128,getContext:()=>new Proxy({}, {get:(_,k)=>()=>String(k).startsWith('create')?{addColorStop(){}}:undefined,set:()=>true})};}};
 try{
  const view=Object.create(ThreeSchoolView.prototype);Object.assign(view,{scenes:{},refs:{},textures:[]});view.build('corridor');view.build('classroom');view.build('classroom33');
  const mesh=view.refs.facelessStudent,source={facelessStudent:image,canvas:{dataset:{}}};assert.equal(mesh.visible,false);
  view.syncTextures(source);assert.equal(mesh.visible,true);assert.equal(mesh.isGroup,true);assert.ok(mesh.userData.photoMeshes.every(part=>part.material.map.image===image));assert.equal(mesh.rotation.y,config.angle);
  const children=mesh.parent.children.length,parts=mesh.children.length,textures=view.textures.length;view.syncTextures(source);assert.equal(view.refs.facelessStudent,mesh);assert.equal(mesh.parent.children.length,children);assert.equal(mesh.children.length,parts);assert.equal(view.textures.length,textures);
  source.facelessStudent={...image,naturalWidth:0};view.syncTextures(source);assert.equal(mesh.visible,false);source.facelessStudent=image;view.syncTextures(source);assert.equal(mesh.visible,true);
 }finally{globalThis.document=old;}
});
