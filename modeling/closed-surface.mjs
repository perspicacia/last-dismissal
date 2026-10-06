import * as THREE from 'three';

// Clip with rest/posed coordinates, interpolate the posed surface at each cut,
// then close every resulting ring. Garment cuffs retain their own silhouette.
export function closedSurface(rest,posed,sourceIndices,planes,region,passes=6,detail=()=>0){
 const points=[],indices=[],details=[],lookup=new Map();
 const vertex=v=>{const key=v.p.toArray().map(n=>Math.round(n*1e7)).join(',');if(!lookup.has(key)){lookup.set(key,points.length/3);points.push(...v.p.toArray());details.push(detail(v.rest));}return lookup.get(key);};
 for(let i=0;i<sourceIndices.length;i+=3){
  let polygon=[0,1,2].map(j=>{const id=sourceIndices[i+j];return {rest:rest[id],p:posed[id]};});
  for(const plane of planes){
   const clipped=[];
   for(let j=0;j<polygon.length;j++){
    const a=polygon[j],b=polygon[(j+1)%polygon.length],da=plane(a.rest,a.p),db=plane(b.rest,b.p);
    if(da>=0)clipped.push(a);
    if((da>=0)!==(db>=0)){const t=da/(da-db);clipped.push({rest:a.rest.clone().lerp(b.rest,t),p:a.p.clone().lerp(b.p,t)});}
   }
   polygon=clipped;if(!polygon.length)break;
  }
  for(let j=1;j<polygon.length-1;j++){
   const ids=[polygon[0],polygon[j],polygon[j+1]].map(vertex);
   if(new Set(ids).size===3)indices.push(...ids);
  }
 }
 const neighbours=Array.from({length:points.length/3},()=>new Set()),edges=new Map();
 for(let i=0;i<indices.length;i+=3)for(let j=0;j<3;j++){
  const a=indices[i+j],b=indices[i+(j+1)%3],key=[a,b].sort((a,b)=>a-b).join(',');
  neighbours[a].add(b);neighbours[b].add(a);if(edges.has(key))edges.get(key).count++;else edges.set(key,{a,b,count:1});
 }
 const open=[...edges.values()].filter(e=>e.count===1),boundary=new Set(open.flatMap(e=>[e.a,e.b]));
 for(let pass=0;pass<passes;pass++){
  const previous=points.slice();for(let i=0;i<neighbours.length;i++)if(region>0||!boundary.has(i))for(let axis=0;axis<3;axis++){
   let sum=0;for(const n of neighbours[i])sum+=previous[n*3+axis];points[i*3+axis]=previous[i*3+axis]*.8+sum/neighbours[i].size*.2;
  }
 }
 const remaining=new Set(open.map((_,i)=>i));
 while(remaining.size){
  const component=[],vertices=new Set([open[remaining.values().next().value].a]);let expanded=true;
  while(expanded){expanded=false;for(const id of remaining){const edge=open[id];if(vertices.has(edge.a)||vertices.has(edge.b)){remaining.delete(id);component.push(edge);vertices.add(edge.a);vertices.add(edge.b);expanded=true;}}}
  const centre=new THREE.Vector3();for(const id of vertices)centre.add(new THREE.Vector3(...points.slice(id*3,id*3+3)));centre.divideScalar(vertices.size);
  const c=points.length/3;points.push(...centre.toArray());details.push([...vertices].reduce((total,id)=>total+details[id],0)/vertices.size);for(const e of component)indices.push(c,e.b,e.a);
 }
 return {points,indices,region,details};
}

export function joinSurfaces(parts){
 const positions=[],indices=[],regions=[],details=[];
 for(const part of parts){const offset=positions.length/3;positions.push(...part.points);indices.push(...part.indices.map(i=>i+offset));regions.push(...Array(part.points.length/3).fill(part.region));details.push(...part.details);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('garment',new THREE.Float32BufferAttribute(regions,1));geometry.setAttribute('skinDetail',new THREE.Float32BufferAttribute(details,1));geometry.setIndex(indices);return geometry;
}

// A shirt has a neckline and loose fabric, rather than the nude source's
// shoulder muscles. Explicit oval sections keep that garment silhouette smooth.
export function looseShirt(){
 const parts=[],segments=32;
 const tube=(rings,frame)=>{
  const points=[],indices=[];
  for(const [centre,rx,rz] of rings)for(let s=0;s<segments;s++){
   const theta=s/segments*Math.PI*2;
   points.push(...new THREE.Vector3(...centre).addScaledVector(frame[0],rx*Math.cos(theta)).addScaledVector(frame[1],rz*Math.sin(theta)).toArray());
  }
  for(let r=0;r<rings.length-1;r++)for(let s=0;s<segments;s++){
   const a=r*segments+s,b=r*segments+(s+1)%segments,c=a+segments,d=b+segments;
   indices.push(a,c,b,b,c,d);
  }
  for(const [r,reverse] of [[0,false],[rings.length-1,true]]){
   const centre=points.length/3;points.push(...rings[r][0]);
   for(let s=0;s<segments;s++){const a=r*segments+s,b=r*segments+(s+1)%segments;indices.push(centre,...(reverse?[b,a]:[a,b]));}
  }
  parts.push({points,indices,region:1,details:Array(points.length/3).fill(0)});
 };
 tube([
  [[0,.626,.094],.166,.115],[[0,.673,.085],.178,.126],
  [[0,.765,.062],.177,.126],[[0,.875,.045],.178,.123],
  [[0,.946,.034],.176,.109],[[0,.967,.020],.155,.086],
  [[0,.982,-.030],.107,.075],[[0,1.015,-.038],.057,.059]
 ],[new THREE.Vector3(1,0,0),new THREE.Vector3(0,0,1)]);
 for(const sign of [-1,1]){
  const start=new THREE.Vector3(sign*.146,.953,.016),end=new THREE.Vector3(sign*.194,.835,-.029),axis=end.clone().sub(start).normalize();
  const side=new THREE.Vector3(0,0,1).cross(axis).normalize(),depth=side.clone().cross(axis).normalize();
  tube([0,.2,.55,.85,1].map(t=>[start.clone().lerp(end,t).toArray(),.069-.007*t,.077-.006*t]),[side,depth]);
 }
 return parts;
}

// Closed ellipsoid: small toes, or the child neck with skinDetail=0.
export function roundedToe(centre,radius,segments=12,rings=6,skinDetail=1){
 const points=[centre[0],centre[1]+radius[1],centre[2]],indices=[];
 for(let ring=1;ring<rings;ring++)for(let s=0;s<segments;s++){
  const phi=Math.PI*ring/rings,theta=2*Math.PI*s/segments;
  points.push(centre[0]+radius[0]*Math.sin(phi)*Math.cos(theta),centre[1]+radius[1]*Math.cos(phi),centre[2]+radius[2]*Math.sin(phi)*Math.sin(theta));
 }
 const bottom=points.length/3;points.push(centre[0],centre[1]-radius[1],centre[2]);
 for(let s=0;s<segments;s++){
  const next=(s+1)%segments;indices.push(0,1+next,1+s);
  for(let row=0;row<rings-2;row++){const a=1+row*segments+s,b=1+row*segments+next,c=a+segments,d=b+segments;indices.push(a,b,c,b,d,c);}
  const last=1+(rings-2)*segments;indices.push(last+s,last+next,bottom);
 }
 return {points,indices,region:0,details:Array(points.length/3).fill(skinDetail)};
}
