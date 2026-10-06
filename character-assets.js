import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {clone} from './vendor/SkeletonUtils.js';

export const REFERENCE_STUDENT_URL=new URL('./assets/models/student-reference-rig.glb?v=quality-5',import.meta.url).href;
export function createCharacterAssetLoader(loader=new GLTFLoader()){
 const cache=new Map();return url=>{
  if(!cache.has(url))cache.set(url,loader.loadAsync(url).then(asset=>{
   if(!asset.scene?.children?.length)throw new Error('Empty character asset');return asset;
  }).catch(error=>{cache.delete(url);throw error;}));return cache.get(url);
 };
}
export const loadCharacterAsset=createCharacterAssetLoader();
// Preserve the GLB hierarchy, skins, material slots and clips. Geometry-only
// extraction would remove its bones. Every instance owns bones and materials.
export function instantiateCharacter(asset,height=1.55){
 const model=new THREE.Group();model.name='character-instance';model.add(clone(asset.scene));model.animations=asset.animations||[];
 const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());
 if(!(size.y>0)||!Number.isFinite(size.y))throw new Error('Invalid character bounds');
 const scale=height/size.y;model.scale.setScalar(scale);model.position.y=-bounds.min.y*scale;
 model.traverse(mesh=>{if(mesh.isMesh){mesh.material=Array.isArray(mesh.material)?mesh.material.map(m=>m.clone()):mesh.material.clone();mesh.castShadow=mesh.receiveShadow=true;}});
 model.updateMatrixWorld(true);model.userData.floorHeight=new THREE.Box3().setFromObject(model).max.z+.012;
 const restBones=new Map();model.traverse(b=>{if(b.isBone)restBones.set(b,{position:b.position.clone(),quaternion:b.quaternion.clone()});});
 const inspectionPose=kind=>{
  mixer.stopAllAction();for(const [bone,rest] of restBones){bone.position.copy(rest.position);bone.quaternion.copy(rest.quaternion);}
  model.updateMatrixWorld(true);model.traverse(mesh=>{if(mesh.isSkinnedMesh)mesh.computeBoundingBox();});
  if(kind==='lying'){
   const head=new THREE.Box3().setFromObject(model.getObjectByName('original-head-and-curls')),dress=new THREE.Box3().setFromObject(model.getObjectByName('pleated-dress'));
   const shift=Math.max(0,head.max.z-dress.max.z)/scale;
   model.getObjectByName('doll_pelvis').position.z+=shift;
   model.getObjectByName('doll_neck').position.z-=shift*.5;model.getObjectByName('doll_head').position.z-=shift*.5;
   for(const side of ['left','right'])model.getObjectByName(`doll_thigh_${side}`).quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),-.11);
  }else if(kind!=='standing')throw new Error(`Unknown inspection pose: ${kind}`);
  model.updateMatrixWorld(true);model.traverse(mesh=>{if(mesh.isSkinnedMesh)mesh.computeBoundingBox();});
  model.userData.floorHeight=new THREE.Box3().setFromObject(model).max.z+.012;
 };
 const mixer=new THREE.AnimationMixer(model);
 return {model,mixer,inspectionPose,play(name){mixer.stopAllAction();if(name==='rest')return;const clip=THREE.AnimationClip.findByName(model.animations,name);if(!clip)throw new Error(`Missing character clip: ${name}`);mixer.clipAction(clip).reset().play();},update(dt){mixer.update(Math.max(0,Math.min(.05,dt)));},dispose(){mixer.stopAllAction();mixer.uncacheRoot(model);const skeletons=new Set();model.traverse(mesh=>{if(mesh.isMesh)for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material])m.dispose();if(mesh.isSkinnedMesh)skeletons.add(mesh.skeleton);});for(const skeleton of skeletons)skeleton.dispose();}};
}
