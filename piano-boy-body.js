import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';

export const PIANO_BOY_BODY_URL=new URL('./assets/models/piano-boy-body.glb?v=free-body-5',import.meta.url).href;
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
 const g=source.clone(),p=g.attributes.position,n=g.attributes.normal,uv=[],colours=[],blend=[];
 const sample=(u,v)=>4*(Math.max(0,Math.min(height-1,Math.round(v*(height-1))))*width+Math.max(0,Math.min(width-1,Math.round(u*(width-1)))));
 const tint=new THREE.Color(),skin=new THREE.Color(),smooth=n=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n);};
 const skinAt=sample(.48,.211);skin.setRGB(pixels[skinAt]/255,pixels[skinAt+1]/255,pixels[skinAt+2]/255,THREE.SRGBColorSpace);
 for(let i=0;i<p.count;i++){
  const u=.5+p.getX(i)/pose.width,v=(pose.top-p.getY(i))/pose.height;
  uv.push(u,1-v);
  const neck=smooth((p.getY(i)-.94)/.055)*(1-smooth((Math.abs(p.getX(i))-.065)/.04)),arm=Math.abs(p.getX(i))>.125&&v>.45&&v<.58,leg=v>.66;
  const colorAt=sample(arm?(p.getX(i)<0?.318:.682):leg?(p.getX(i)<0?.44:.594):.51,arm?.477:leg?Math.min(.89,Math.max(.73,v)):.41);
  tint.setRGB(pixels[colorAt]/255,pixels[colorAt+1]/255,pixels[colorAt+2]/255,THREE.SRGBColorSpace);
  tint.lerp(skin,neck).multiplyScalar(.99+.015*Math.sin(p.getX(i)*913+p.getY(i)*731));colours.push(tint.r,tint.g,tint.b);
  blend.push((1-neck)*smooth((-n.getZ(i)-.03)/.65));
 }
 g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(colours,3));g.setAttribute('photoBlend',new THREE.Float32BufferAttribute(blend,1));g.computeBoundingBox();return g;
}
