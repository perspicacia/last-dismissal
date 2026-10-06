import * as THREE from './vendor/three.module.js';

// One copy of each authored component, many placements. Collider dimensions
// and chair rotations still come from the ordinary room layout.
export function repeatFurniture(template,placements,name){
 template.updateMatrixWorld(true);const group=new THREE.Group();group.name=name;
 template.traverse(part=>{if(!part.isMesh)return;
  if(part.isSkinnedMesh)throw new Error('Animated figures cannot use static furniture batching');
  const instances=new THREE.InstancedMesh(part.geometry,part.material,placements.length);instances.name=part.name||'furniture-component';
  instances.castShadow=part.castShadow;instances.receiveShadow=part.receiveShadow;
  for(const [i,p] of placements.entries()){
   const matrix=new THREE.Matrix4().compose(new THREE.Vector3(p.x,0,p.z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),p.angle||0),new THREE.Vector3(1,1,1));
   instances.setMatrixAt(i,matrix.multiply(part.matrixWorld));
  }
  instances.instanceMatrix.needsUpdate=true;instances.computeBoundingBox();instances.computeBoundingSphere();group.add(instances);
 });return group;
}
