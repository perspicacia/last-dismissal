import * as THREE from './vendor/three.module.js';

// Authored, repeatable surface fields. No gameplay RNG and no source PNG edits.
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const noise=(x,y,s)=>{let n=Math.imul(x+Math.imul(y,8191)+s,1103515245);n=Math.imul(n^(n>>>16),2246822519);return (n>>>0)/4294967295;};
const cache=new Map();
const fields=new Map();
export function surfacePixels(kind,size=kind==='metal'?128:512){
 if(!['wood','plaster','metal'].includes(kind))throw new Error(`Unknown school surface: ${kind}`);
 const height=new Float32Array(size*size),rough=new Float32Array(size*size),colour=new Uint8Array(size*size*4);
 const palettes={wood:[139,109,75],plaster:[169,174,167],metal:[166,173,174]},base=palettes[kind];
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size,v=y/size,i=y*size+x,n=noise(x,y,kind.length*419),grain=Math.sin(2*Math.PI*(u*61+Math.sin(v*Math.PI*2)*.21));
  let h=0,r=.8,value=1;
  if(kind==='wood'){
   const plank=Math.floor(u*8),edge=Math.min((u*8)%1,1-(u*8)%1),end=(v*2+plank*.31)%1,seam=edge<.025||end<.009;
   const knot=Math.sin(2*Math.PI*(u*23+Math.sin(v*2*Math.PI)*.24))*Math.sin(v*6*Math.PI);
   h=.48+grain*.035+knot*.025+(n-.5)*.035-(seam?.31:0);
   r=seam?.97:.58+n*.17+Math.abs(grain)*.08;
   value=.94+(noise(plank,0,739)-.5)*.20+grain*.038+knot*.025+(n-.5)*.065-(seam?.25:0);
   // Scuffs affect coating roughness more than colour, avoiding printed shading.
   if(n>.991){r=.96;value*=.92;h-=.035;}
  }else if(kind==='plaster'){
   const cloud=Math.sin(u*6*Math.PI)*Math.sin(v*4*Math.PI),pore=n<.12;
   h=.5+(n-.5)*.14+(pore?-.075:0);r=.82+n*.17;
   value=.98+cloud*.025+(n-.5)*.075-(pore?.018:0);
  }else{
   const brushed=Math.sin(u*256*Math.PI)*.018;
   h=.5+brushed+(n-.5)*.028;r=.38+n*.18+Math.abs(brushed)*1.4;
   value=1+brushed+(n-.5)*.035;
  }
  height[i]=h;rough[i]=clamp(r);for(let c=0;c<3;c++)colour[i*4+c]=Math.round(clamp(base[c]*value,0,255));colour[i*4+3]=255;
 }
 const normal=new Uint8Array(size*size*4),roughness=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const i=y*size+x,at=i*4,dx=(height[y*size+(x+1)%size]-height[y*size+(x+size-1)%size])*2.8,dy=(height[((y+1)%size)*size+x]-height[((y+size-1)%size)*size+x])*2.8,l=Math.hypot(dx,dy,1);
  normal.set([Math.round(127.5-dx/l*127.5),Math.round(127.5-dy/l*127.5),Math.round(127.5+127.5/l),255],at);
  const r=Math.round(rough[i]*255);roughness.set([r,r,r,255],at);
 }
 return {size,colour,normal,roughness};
}
export function schoolSurface(kind,variant='default'){
 const key=`${kind}/${variant}`;if(cache.has(key))return cache.get(key);
 if(!fields.has(kind))fields.set(kind,surfacePixels(kind));const p=fields.get(kind),texture=(data,srgb=false)=>{
  const t=new THREE.DataTexture(data,p.size,p.size);t.name=`school-${key}`;t.colorSpace=srgb?THREE.SRGBColorSpace:THREE.NoColorSpace;
  t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=4;t.needsUpdate=true;
  if(variant==='floor')t.repeat.set(2,8);else if(variant==='wall')t.repeat.set(2,1);
  return t;
 };
 const maps={map:texture(p.colour,true),normalMap:texture(p.normal),roughnessMap:texture(p.roughness)};cache.set(key,maps);return maps;
}
export function surfaceMaterial(kind,{variant='default',color='#ffffff',...options}={}){
 return new THREE.MeshStandardMaterial({color,...schoolSurface(kind,variant),roughness:1,metalness:kind==='metal'?.6:0,normalScale:new THREE.Vector2(kind==='wood'?.45:.22,kind==='wood'?.45:.22),...options});
}
export function schoolReflectionEnvironment(renderer){
 const width=128,height=64,data=new Float32Array(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const u=x/width,v=y/height,lamp=v<.25&&Math.abs(Math.sin(u*Math.PI*6))>.975?1.1:0;
  const sky=.06+.07*Math.max(0,Math.cos((v-.5)*Math.PI));
  data.set([sky+lamp,sky*1.1+lamp*.76,sky*1.2+lamp*.42,1],4*(y*width+x));
 }
 const source=new THREE.DataTexture(data,width,height,THREE.RGBAFormat,THREE.FloatType);source.mapping=THREE.EquirectangularReflectionMapping;source.needsUpdate=true;
 const pmrem=new THREE.PMREMGenerator(renderer),target=pmrem.fromEquirectangular(source);source.dispose();pmrem.dispose();return target;
}
