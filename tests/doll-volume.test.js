import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDollVolume,dollDepth,volumeFromImage} from '../doll-volume.js';
test('doll volume excludes transparent backdrop, tapers edges, and has closed depth',()=>{
 const w=32,h=48,p=new Uint8ClampedArray(w*h*4);
 for(let y=5;y<43;y++)for(let x=8;x<24;x++){const i=(y*w+x)*4;p.set([180,150,110,255],i);}
 const g=buildDollVolume(p,w,h,1.55,32,48);assert.ok(g.index.count>0);assert.equal(g.groups.length,2);assert.ok(g.groups[1].count>0);
 assert.ok(g.boundingBox.min.z<-.1);assert.ok(g.boundingBox.max.z<=1e-6);
 const coords=g.getAttribute('position'),uv=g.getAttribute('uv');const used=new Set(g.index.array);
 for(const i of used){const u=uv.getX(i),v=1-uv.getY(i);assert.ok(u>=.2&&u<=.8);assert.ok(v>=.07&&v<=.93);}
 const edge=5*33+8;assert.ok(Math.abs(coords.getZ(edge)-coords.getZ(edge+33*49))<.003);assert.ok(dollDepth(.49,.145)>.04);
 const edges=new Map();for(let i=0;i<g.index.count;i+=3){const tri=[g.index.array[i],g.index.array[i+1],g.index.array[i+2]];for(let j=0;j<3;j++){const a=tri[j],b=tri[(j+1)%3],key=a<b?`${a},${b}`:`${b},${a}`;edges.set(key,(edges.get(key)||0)+1);}}
 assert.ok([...edges.values()].every(n=>n===2));
 assert.equal(volumeFromImage({naturalWidth:0}),null);
});
test('눈·입·턱은 동일한 깊이를 유지해 얼굴의 투영 비율이 늘어나지 않는다',()=>{
 for(const v of [.14,.20,.26,.32])assert.equal(dollDepth(.5,v),dollDepth(.5,.14));
 const w=24,h=36,p=new Uint8ClampedArray(w*h*4).fill(255),g=buildDollVolume(p,w,h,1.55,24,36),a=g.getAttribute('position');
 const face=[];for(let y=5;y<=10;y++)face.push(a.getZ(y*25+12));assert.ok(face.every(z=>z===face[0]));
});

test('실루엣 경계는 바닥까지 늘어진 측면 없이 얇게 닫힌다',()=>{
 const w=32,h=48,p=new Uint8ClampedArray(w*h*4);
 for(let y=4;y<42;y++)for(let x=7;x<25;x++)if(!(x<15&&y>12&&y<17))p.set([160,130,100,255],(y*w+x)*4);
 const g=buildDollVolume(p,w,h,1.55,w,h),a=g.getAttribute('position'),n=(w+1)*(h+1),side=g.groups[1];
 for(let k=side.start;k<side.start+side.count;k+=3){
   if([...g.index.array.slice(k,k+3)].every(i=>i>=n))continue;
   for(let j=0;j<3;j++){
   const index=g.index.array[k+j]%n;
   assert.ok(Math.abs(a.getZ(index)-a.getZ(index+n))<=.00201);
   }
 }
 assert.ok(Math.abs(a.getZ(24*(w+1)+16)-a.getZ(24*(w+1)+16+n))>.10);
});


test('머리·몸통·치마·팔다리가 각 부위에 맞는 실제 두께를 갖는다',()=>{
 const thickness=(u,v)=>2*dollDepth(u,v);
 assert.ok(thickness(.5,.20)>=.22&&thickness(.5,.20)<=.26);
 assert.ok(thickness(.52,.41)>=.19&&thickness(.52,.41)<=.21);
 assert.ok(thickness(.52,.61)>=.17&&thickness(.52,.61)<=.19);
 assert.ok(thickness(.31,.57)>=.14&&thickness(.31,.57)<=.16);
 assert.ok(thickness(.46,.88)>=.14&&thickness(.46,.88)<=.17);
 assert.ok(thickness(.12,.20)<thickness(.5,.20));
 assert.ok(thickness(.52,.75)<thickness(.52,.61));
});

test('몸통은 둥글게 부풀고 이미지 너비·높이 비율은 유지된다',()=>{
 const w=48,h=72,p=new Uint8ClampedArray(w*h*4).fill(255);
 const g=buildDollVolume(p,w,h,1.55,w,h),a=g.getAttribute('position');
 const at=(x,y)=>a.getZ(y*(w+1)+x);
 assert.ok(at(25,30)<at(19,30));
 assert.ok(at(25,44)<at(17,44));
 assert.ok(Math.abs((g.boundingBox.max.x-g.boundingBox.min.x)/1.55-w/h)<1e-6);
 const smaller=buildDollVolume(p,w,h,.775,w,h);
 assert.ok(Math.abs(smaller.boundingBox.min.z/g.boundingBox.min.z-.5)<1e-6);
});
