import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {SCHOOL_WINDOW,CLASSROOM_WINDOWS,windowPanes,buildSchoolWindow} from '../school-windows.js';
import {ROOM_AMBIENCE} from '../exploration.js';
import {drawSceneDepth} from '../scene-depth.js';
test('창은 실제 두 미닫이 칸·손잡이·레일·두께 있는 창턱을 갖는다',()=>{
 const group=new THREE.Group(),wood=new THREE.MeshStandardMaterial(),bay=CLASSROOM_WINDOWS[2];
 const window=buildSchoolWindow(group,{...bay,wood});
 assert.equal(window.parent,group);assert.equal(window.children.filter(m=>m.name==='window-pane').length,4);
 assert.equal(window.children.filter(m=>m.name==='window-handle').length,2);
 assert.equal(window.children.filter(m=>m.name==='sliding-window-track').length,4);
 assert.ok(window.getObjectByName('wooden-window-sill').geometry.parameters.width>.4);
 const panes=windowPanes(bay);for(const lower of [panes[0],panes[2]])assert.ok(lower.top-lower.bottom>3*(panes[1].top-panes[1].bottom));
 assert.equal(window.getObjectByName('window-transom-rail').position.y,SCHOOL_WINDOW.transom);
});
test('두 귀신 얼굴의 중심과 이마·턱이 창살 대신 큰 유리 안에 투영된다',()=>{
 // The source PNG face spans 10–24% from the top; verify actual rays from
 // near/far eye positions to that area, rather than just comparing constants.
 for(const room of ['classroom33','dance']){
  const ghost=ROOM_AMBIENCE[room].ghost,top=ghost.y+ghost.height/2;
  for(const x of [-2.3,0])for(const sourceY of [.10,.173,.24])for(const dz of [-.15,0,.15]){
   const t=(SCHOOL_WINDOW.wallX-x)/(ghost.x-x),y=1.5+(top-sourceY*ghost.height-1.5)*t,z=ghost.z+dz*t;
   assert.ok(CLASSROOM_WINDOWS.flatMap(windowPanes).some(p=>z>p.start&&z<p.end&&y>p.bottom&&y<p.top),`${room}: face ray (${y},${z}) hits a frame`);
  }
 }
});
test('Canvas의 입체 창틀도 큰 아래 유리와 같은 높이에 있어 옛 초록 창틀로 덮지 않는다',()=>{
 const geometry=[],colors=[],ctx={set fillStyle(value){colors.push(value);},set strokeStyle(value){},set lineWidth(value){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){}};
 drawSceneDepth(ctx,(x,y,z)=>{if(x<-4)geometry.push({x,y,z});return {x:x*10,y:y*10,d:10+z};},{x:0,z:5},{classroom:true});
 assert.ok(colors.includes('#92663e'));assert.ok(!colors.includes('#31564f'));
 const y=geometry.map(p=>p.y);assert.ok(Math.max(...y)>SCHOOL_WINDOW.top);assert.ok(y.some(value=>Math.abs(value-(SCHOOL_WINDOW.transom+SCHOOL_WINDOW.rail/2))<1e-8));
 assert.ok(!y.some(value=>value>1.57&&value<1.72));
});
