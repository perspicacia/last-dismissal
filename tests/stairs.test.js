import test from 'node:test';
import assert from 'node:assert/strict';
import {stairFlight} from '../stairs.js';
import {stairDirection} from '../walk-exits.js';
test('상승·하강 계단은 기존 좌우 입구와 일치하고 높이가 반대로 변한다',()=>{
  for(const up of [true,false]) {
    const f=stairFlight(up);assert.equal(stairDirection({x:(f.left+f.right)/2,z:24}),up);
    assert.equal(f.steps.length,12);assert.equal(f.steps[0].previous,0);
    for(let i=0;i<f.steps.length;i++){
      const s=f.steps[i];assert.ok(up?s.level>s.previous:s.level<s.previous);
      assert.ok(s.far>s.near);
      if(i){assert.equal(s.near,f.steps[i-1].far);assert.equal(s.previous,f.steps[i-1].level);}
    }
  }
});

import {clipNearPlane,drawStairs,screenHull} from '../stairs.js';
test('근거리 입구의 뒤쪽 꼭짓점만 잘라내고 보이는 다각형을 유지한다',()=>{
  const p={x:-1.6,z:23.75,angle:-.25};
  const points=clipNearPlane([[-2.65,3,24.6],[-.65,3,24.6],[-.65,0,23.4],[-2.65,0,23.4]],p);
  assert.ok(points.length>=3);
  for(const v of points)assert.ok((v[0]-p.x)*Math.sin(p.angle)+(v[2]-p.z)*Math.cos(p.angle)>=.13-1e-9);
  assert.deepEqual(clipNearPlane([[0,0,0],[1,0,0],[1,1,0]],{x:0,z:2,angle:0}),[]);
});
test('난간 선분은 가까운 경계를 넘어도 앞쪽 부분을 유지한다',()=>{
  const clipped=clipNearPlane([[0,0,0],[0,1,2]],{x:0,z:1,angle:0},.13,false);
  assert.equal(clipped.length,2);assert.ok(Math.abs(clipped[0][2]-1.13)<1e-9);assert.deepEqual(clipped[1],[0,1,2]);
});
test('근거리·비스듬한 실제 투영에서도 상승/하강 계단판을 그린다',()=>{
  for(const p of [{x:-1.95,z:23.98,angle:-.11},{x:-1.6,z:23.75,angle:-.25},{x:1.6,z:23.75,angle:.25},{x:0,z:23.75,angle:0}]){
    const fills=[];const c=new Proxy({},{get(o,k){return k==='fill'?()=>fills.push(o.fillStyle):()=>{};},set(o,k,v){o[k]=v;return true;}});
    const project=(x,y,z)=>{const dx=x-p.x,dz=z-p.z,d=dx*Math.sin(p.angle)+dz*Math.cos(p.angle);return d>.12?{x:400+(dx*Math.cos(p.angle)-dz*Math.sin(p.angle))*500/d,y:400-(y-1.5)*500/d,d}:null;};
    drawStairs(c,project,p);assert.ok(fills.includes('#8d958b'));assert.ok(fills.includes('#717e77'));
  }
});

test('입구 수직 면과 바닥의 합집합은 근거리 계단을 가릴 만큼 위로 잘리지 않는다',()=>{
  const p={x:-1.95,z:23.98,angle:-.11};
  const project=v=>{const dx=v[0]-p.x,dz=v[2]-p.z,d=dx*Math.sin(p.angle)+dz*Math.cos(p.angle);return {x:400+(dx*Math.cos(p.angle)-dz*Math.sin(p.angle))*500/d,y:400-(v[1]-1.5)*500/d};};
  const polygons=[[[-2.65,3,24.6],[-.65,3,24.6],[-.65,0,24.6],[-2.65,0,24.6]],[[-2.65,0,23.4],[-.65,0,23.4],[-.65,0,24.6],[-2.65,0,24.6]]];
  const hull=screenHull(polygons.flatMap(v=>clipNearPlane(v,p).map(project)));
  assert.ok(hull.length>=3);assert.ok(Math.max(...hull.map(v=>v.y))>4000);
});
