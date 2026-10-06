import * as THREE from './vendor/three.module.js';

// Closed cross-sections describe a jaw, shoulders or cloth silhouette without
// stacking visibly separate spheres. Rings: [height, halfWidth, halfDepth, z].
export function loftGeometry(rings,{radial=32,steps=48,pleats=0}={}){
 const positions=[],uv=[],indices=[],low=rings[0][0],high=rings.at(-1)[0];
 const value=(y,column)=>{
  let k=0;while(k<rings.length-2&&y>rings[k+1][0])k++;
  const t=Math.max(0,Math.min(1,(y-rings[k][0])/(rings[k+1][0]-rings[k][0])));
  const p0=rings[Math.max(0,k-1)][column]||0,p1=rings[k][column]||0,p2=rings[k+1][column]||0,p3=rings[Math.min(rings.length-1,k+2)][column]||0;
  const a=(p2-p0)/2,b=(p3-p1)/2;
  const n=(2*t**3-3*t*t+1)*p1+(t**3-2*t*t+t)*a+(-2*t**3+3*t*t)*p2+(t**3-t*t)*b;
  return column===3?n:Math.max(0,n);
 };
 for(let j=0;j<=steps;j++){
  const t=j/steps,y=low+(high-low)*t,rx=j===0||j===steps?0:value(y,1),rz=j===0||j===steps?0:value(y,2),z=value(y,3);
  for(let i=0;i<=radial;i++){
   const angle=i/radial*Math.PI*2,fold=1+pleats*Math.cos(angle*16)*Math.sin(Math.PI*t);
   positions.push(rx*Math.cos(angle)*fold,y,z+rz*Math.sin(angle)*fold);uv.push(i/radial,t);
   if(j<steps&&i<radial){const a=j*(radial+1)+i,b=a+1,c=a+radial+1,d=c+1;if(j>0)indices.push(a,c,b);if(j<steps-1)indices.push(b,c,d);}
  }
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingBox();return geometry;
}

let weave;
export function clothMaterial(color){
 if(!weave){
  const size=64,data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4,n=160+((x+y)%2)*35+((x*13+y*7)%11);data.set([n,n,n,255],i);}
  weave=new THREE.DataTexture(data,size,size);weave.wrapS=weave.wrapT=THREE.RepeatWrapping;weave.repeat.set(6,6);weave.needsUpdate=true;
 }
 return new THREE.MeshStandardMaterial({color,roughness:.91,bumpMap:weave,bumpScale:.0012});
}
