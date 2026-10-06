import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';

export const PIANO_BOY_BODY_URL=new URL('./assets/models/piano-boy-body.glb?v=free-body-fit-14',import.meta.url).href;
export function createPianoBoyBodyLoader(loader=new GLTFLoader()){
 let cached;
 return ()=>{
  cached??=loader.loadAsync(PIANO_BOY_BODY_URL).then(asset=>{
   const mesh=asset.scene.getObjectByName('piano-boy-free-body');
   if(!mesh?.geometry?.attributes.position?.count)throw new Error('Piano boy body is empty');
   return mesh.geometry;
  }).catch(error=>{cached=null;throw error;});
  return cached;
 };
}
export const loadPianoBoyBody=createPianoBoyBodyLoader();

// Original photo coordinates are used only on front-facing body surfaces.
// Silhouette geometry comes from the authored human mesh, not PNG extrusion.
export function preparePianoBoyBody(source,pose,pixels,width,height){
 const g=source.clone(),p=g.attributes.position,n=g.attributes.normal,garment=g.attributes._garment,detail=g.attributes._skindetail,uv=[],colours=[],blend=[];
 const sample=(u,v)=>4*(Math.max(0,Math.min(height-1,Math.round(v*(height-1))))*width+Math.max(0,Math.min(width-1,Math.round(u*(width-1)))));
 const tint=new THREE.Color(),skin=new THREE.Color(),smooth=n=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n);};
 const skinAt=sample(.48,.211);skin.setRGB(pixels[skinAt]/255,pixels[skinAt+1]/255,pixels[skinAt+2]/255,THREE.SRGBColorSpace);
 for(let i=0;i<p.count;i++){
  const u=.5+p.getX(i)/pose.width,v=(pose.top-p.getY(i))/pose.height;
  uv.push(u,1-v);
  const fabric=garment?.getX(i)||0,neck=fabric?0:smooth((p.getY(i)-.94)/.055)*(1-smooth((Math.abs(p.getX(i))-.065)/.04)),arm=!fabric&&Math.abs(p.getX(i))>.125&&v>.36&&v<.60,leg=!fabric&&v>.66;
  const colorAt=fabric===2?sample(.34,.565):sample(arm?(p.getX(i)<0?.318:.682):leg?(p.getX(i)<0?.44:.594):.51,arm?.477:leg?Math.min(.89,Math.max(.73,v)):Math.max(.32,Math.min(.5,v)));
  tint.setRGB(pixels[colorAt]/255,pixels[colorAt+1]/255,pixels[colorAt+2]/255,THREE.SRGBColorSpace);
  if(detail?.getX(i)>0){const at=p.getY(i)<.20?sample(p.getX(i)<0?.44:.594,.80):sample(p.getX(i)<0?.318:.682,.477),bare=new THREE.Color().setRGB(pixels[at]/255,pixels[at+1]/255,pixels[at+2]/255,THREE.SRGBColorSpace);tint.lerp(bare,detail.getX(i));}
  tint.lerp(skin,neck).multiplyScalar(.99+.015*Math.sin(p.getX(i)*913+p.getY(i)*731));colours.push(tint.r,tint.g,tint.b);
  // The full photograph includes the boy's hands resting on his shorts. Do
  // not print those hands on the garment underneath the real modelled hands.
  const photographedHands=smooth((v-.51)/.018)*(1-smooth((v-.583)/.016))*smooth((Math.abs(u-.5)-.055)/.025)*(1-smooth((Math.abs(u-.5)-.18)/.025));
  const hem=fabric===2?1-smooth((v-.595)/.025):1;
  const collarPhoto=smooth((v-.30)/.05);
  blend.push((1-neck)*(arm?0:1)*(1-(detail?.getX(i)||0))*(fabric?1-photographedHands:1)*hem*collarPhoto*smooth((-n.getZ(i)-.03)/.65));
 }
 g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(colours,3));g.setAttribute('photoBlend',new THREE.Float32BufferAttribute(blend,1));g.computeBoundingBox();return g;
}
