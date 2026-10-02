import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';

export const STUDENT_MODEL_URL=new URL('./assets/models/student-doll.glb?v=1',import.meta.url).href;
let cached;
export function loadStudentModel(){
  cached??=new GLTFLoader().loadAsync(STUDENT_MODEL_URL).then(gltf=>gltf.scene).catch(error=>{cached=null;throw error;});
  return cached;
}

// Normalize every axis by the same factor, preserving the sculpted proportions.
export function prepareStudentModel(asset,height){
  const group=new THREE.Group();group.name='student-doll-solid';group.add(asset.clone(true));
  const bounds=new THREE.Box3().setFromObject(group),size=bounds.getSize(new THREE.Vector3());
  if(!Number.isFinite(size.y)||size.y<=0)throw new Error('Invalid student doll dimensions');
  const scale=height/size.y;group.scale.setScalar(scale);group.position.y=-bounds.min.y*scale;
  group.traverse(mesh=>{if(mesh.isMesh){
    // Overlapping locks can alias against their own shadow at classroom scale.
    mesh.castShadow=true;mesh.receiveShadow=!mesh.material.name.includes('hair');
  }});
  group.updateMatrixWorld(true);
  // Rotation X=PI/2 puts the back (+Z) at the lowest point. Keep it above floor.
  group.userData.floorHeight=new THREE.Box3().setFromObject(group).max.z+.012;
  return group;
}
