import test from 'node:test';
import assert from 'node:assert/strict';
import {Color,SRGBColorSpace} from '../vendor/three.module.js';
import {buildDollVolume,volumeFromImage} from '../doll-volume.js';

function rectangle(w=32,h=48){
 const pixels=new Uint8ClampedArray(w*h*4);
 for(let y=4;y<h-4;y++)for(let x=7;x<w-7;x++)pixels.set([180,150,110,255],(y*w+x)*4);
 return {pixels,w,h};
}
function assertClosed(g){
 const edges=new Map();
 for(let i=0;i<g.index.count;i+=3){const tri=[g.index.array[i],g.index.array[i+1],g.index.array[i+2]];
  for(let j=0;j<3;j++){const a=tri[j],b=tri[(j+1)%3],key=a<b?`${a},${b}`:`${b},${a}`;edges.set(key,(edges.get(key)||0)+1);}
 }
 assert.ok([...edges.values()].every(n=>n===2),'every silhouette edge has a front and a rear face');
}

test('투명 배경은 제외하고 원본 투영면과 둥근 뒷면으로 닫힌 인형을 만든다',()=>{
 const {pixels,w,h}=rectangle(),g=buildDollVolume(pixels,w,h,1.55,w,h),uv=g.getAttribute('uv');
 assert.ok(g.index.count>0);assert.equal(g.groups.length,2);assert.ok(g.groups[1].count>0);
 assert.ok(g.boundingBox.min.z<-.1);assert.ok(g.boundingBox.max.z<=1e-6);
 const used=new Set(g.index.array);
 for(const i of used){const u=uv.getX(i),v=1-uv.getY(i);assert.ok(u>=.18&&u<=.82);assert.ok(v>=.05&&v<=.95);}
 assertClosed(g);assert.equal(volumeFromImage({naturalWidth:0}),null);
});

test('완만한 앞면에서도 원본 사진의 XY·UV 비율과 중앙 얼굴 비율을 보존한다',()=>{
 const w=30,h=45,pixels=new Uint8ClampedArray(w*h*4).fill(255),g=buildDollVolume(pixels,w,h,1.55,w,h);
 const a=g.getAttribute('position'),uv=g.getAttribute('uv'),normal=g.getAttribute('normal'),front=g.groups[0];
 const photoVertices=new Set(g.index.array.slice(front.start,front.start+front.count));
 const faceDepth=[];
 for(const i of photoVertices){
  assert.ok(Math.abs(a.getX(i)-(uv.getX(i)-.5)*1.55*w/h)<1e-6);
  assert.ok(Math.abs(a.getY(i)-(uv.getY(i)-.5)*1.55)<1e-6);
  assert.ok(a.getZ(i)>=-.27001&&a.getZ(i)<0);
  assert.ok(Number.isFinite(normal.getX(i))&&Number.isFinite(normal.getY(i))&&Number.isFinite(normal.getZ(i)));
  assert.ok(normal.getZ(i)<=0,'photo normals face outwards');
  const u=uv.getX(i),v=1-uv.getY(i);
  if(u>.35&&u<.65&&v>.14&&v<.25){faceDepth.push(a.getZ(i));}
 }
 assert.ok(faceDepth.length>0);assert.ok(Math.min(...faceDepth)<-.20,'the skull has depth beyond the former 14 cm plate');
 assert.ok(Math.max(...faceDepth)-Math.min(...faceDepth)>.01,'cheeks are curved instead of a flat face');
 assert.ok(Math.abs((g.boundingBox.max.x-g.boundingBox.min.x)/1.55-w/h)<1e-6);
});

test('머리카락 틈은 깊은 측면 홈이 되지 않고 앞면 UV·얇은 봉합선을 유지한다',()=>{
 const w=96,h=144,pixels=new Uint8ClampedArray(w*h*4);
 for(let y=4;y<50;y++)for(let x=22;x<75;x++)pixels.set([170,150,110,255],(y*w+x)*4);
 // A fine strand gap within the head, fully transparent in the unchanged PNG.
 for(let y=10;y<30;y++)for(let x=44;x<46;x++)pixels.fill(0,(y*w+x)*4,(y*w+x)*4+4);
 const g=buildDollVolume(pixels,w,h,1.55,w,h),n=(w+1)*(h+1),a=g.getAttribute('position'),v=20*(w+1)+45;
 assert.ok(a.getZ(v+n)-a.getZ(v)>.10,'hair gap cannot collapse to a 2 mm trench');
 assert.equal(pixels[(20*w+45)*4+3],0,'original PNG alpha stays transparent');
 assertClosed(g);
});

test('머리카락 밝고 어두운 세부 무늬는 뒤·옆으로 세로 반복되지 않는다',()=>{
 const w=48,h=72,pixels=new Uint8ClampedArray(w*h*4);
 for(let y=5;y<h-5;y++)for(let x=7;x<w-7;x++)pixels.set(x<24?[210,190,130,255]:[50,40,30,255],(y*w+x)*4);
 const g=buildDollVolume(pixels,w,h,1.55,w,h),n=(w+1)*(h+1),colors=g.getAttribute('color');
 for(const y of [10,20,40,60]){
  const a=n+y*(w+1)+12,b=n+y*(w+1)+36;
  for(const c of ['getX','getY','getZ'])assert.equal(colors[c](a),colors[c](b));
 }
});

test('PNG 크기만 먼저 알려지거나 알파가 아직 비어 있으면 깨진 볼륨을 저장하지 않는다',()=>{
 const prior=globalThis.document;let reads=0;
 globalThis.document={createElement:()=>({getContext:()=>({drawImage(){},getImageData:()=>{reads++;return {data:new Uint8ClampedArray(288*432*4)};}})})};
 try{
  assert.equal(volumeFromImage({naturalWidth:1024,naturalHeight:1536,complete:false}),null);assert.equal(reads,0);
  assert.equal(volumeFromImage({naturalWidth:1024,naturalHeight:1536,complete:true}),null);assert.equal(reads,1);
 }finally{globalThis.document=prior;}
});

test('머리카락과 목의 오목한 경계에도 긴 측면 기둥 없이 얇은 봉합선만 남는다',()=>{
 const {pixels,w,h}=rectangle();
 for(let y=13;y<18;y++)for(let x=7;x<16;x++)pixels.fill(0,(y*w+x)*4,(y*w+x)*4+4);
 const g=buildDollVolume(pixels,w,h,1.55,w,h),a=g.getAttribute('position'),n=(w+1)*(h+1),side=g.groups[1];
 for(let k=side.start;k<side.start+side.count;k+=3){
  const tri=Array.from(g.index.array.slice(k,k+3));if(tri.every(i=>i>=n))continue;
  for(const i of tri){const vertex=i%n;assert.ok(Math.abs(a.getZ(vertex)-a.getZ(vertex+n))<=.00201);}
 }
 assertClosed(g);
});

test('사진 뒤의 두께는 실루엣부터 내부까지 둥글게 변하며 사진에는 뒷면 재질이 배정되지 않는다',()=>{
 const {pixels,w,h}=rectangle(48,72),g=buildDollVolume(pixels,w,h,1.55,w,h),a=g.getAttribute('position'),n=(w+1)*(h+1);
 const thickness=(x,y)=>a.getZ(n+y*(w+1)+x)-a.getZ(y*(w+1)+x);
 assert.ok(thickness(8,28)>thickness(7,28));assert.ok(thickness(10,28)>thickness(8,28));
 assert.ok(thickness(24,28)>.11);assert.ok(thickness(22,61)>.10);
 const front=g.groups[0];for(let i=front.start;i<front.start+front.count;i++)assert.ok(g.index.array[i]<n);
 assert.equal(g.groups[1].materialIndex,1);
});

test('뒷면 색은 투명한 검정 배경에 오염되지 않고 작은 사진 줄무늬를 부드럽게 만든다',()=>{
 const {pixels,w,h}=rectangle(),g=buildDollVolume(pixels,w,h,1.55,w,h),colors=g.getAttribute('color'),n=(w+1)*(h+1);
 const expected=new Color().setRGB(180/255,150/255,110/255,SRGBColorSpace);
 assert.ok(Math.abs(colors.getX(n+4*(w+1)+7)-expected.r)<1e-6);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const c=x%2?200:40;pixels.set([c,c,c,255],(y*w+x)*4);}
 const striped=buildDollVolume(pixels,w,h,1.55,w,h).getAttribute('color'),value=striped.getX(n+24*(w+1)+16);
 const dark=new Color().setRGB(100/255,100/255,100/255,SRGBColorSpace).r,light=new Color().setRGB(140/255,140/255,140/255,SRGBColorSpace).r;
 assert.ok(value>dark&&value<light,'blurred vertex colour is neither the dark nor the bright stripe');
});

test('작은 분위기 인형의 앞면·둥근 뒷면·봉합선 두께도 같은 비율로 축소한다',()=>{
 const {pixels,w,h}=rectangle(),large=buildDollVolume(pixels,w,h,1.55,w,h).getAttribute('position'),small=buildDollVolume(pixels,w,h,.775,w,h).getAttribute('position');
 assert.equal(large.count,small.count);
 for(let i=0;i<large.array.length;i++)assert.ok(Math.abs(small.array[i]-large.array[i]/2)<1e-6);
});


test('이미지 샘플링은 세로로 긴 원본의 비율을 고정 2:3으로 찌그러뜨리지 않는다',()=>{
 const prior=globalThis.document;let drawn;
 const canvas={width:0,height:0,getContext:()=>({drawImage:(...args)=>{drawn=args;},getImageData:()=>({data:new Uint8ClampedArray(canvas.width*canvas.height*4).fill(255)})})};
 globalThis.document={createElement:()=>canvas};
 try{
  const image={naturalWidth:900,naturalHeight:1800},g=volumeFromImage(image);
  assert.equal(drawn[3]/drawn[4],.5);assert.equal(canvas.width,216);
  const ratio=(g.boundingBox.max.x-g.boundingBox.min.x)/(g.boundingBox.max.y-g.boundingBox.min.y);
  assert.ok(Math.abs(ratio-.5)<1e-6);
 }finally{if(prior===undefined)delete globalThis.document;else globalThis.document=prior;}
});
