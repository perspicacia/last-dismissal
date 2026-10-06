// CC0 source anatomy -> static seated body. The source face is discarded.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';

globalThis.ProgressEvent??=class{constructor(type,info){this.type=type;Object.assign(this,info);}};
globalThis.FileReader??=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
const source=new URL('./source/quaternius/',import.meta.url);
const json=JSON.parse(await readFile(new URL('Superhero_Male_FullBody.gltf',source),'utf8'));
json.buffers[0].uri='data:application/octet-stream;base64,'+(await readFile(new URL('Superhero_Male_FullBody.bin',source))).toString('base64');
// Source materials, eyes and eyebrows are not part of this adapted character.
delete json.materials;delete json.images;delete json.textures;
for(const mesh of json.meshes)for(const p of mesh.primitives)delete p.material;
const asset=await new GLTFLoader().parseAsync(JSON.stringify(json),'');asset.scene.updateMatrixWorld(true);
const skin=asset.scene.getObjectByName('SuperHero_Male'),bones=skin.skeleton.bones;
const facing=new THREE.Matrix4().makeRotationY(Math.PI);
const original=bones.map(b=>facing.clone().multiply(b.matrixWorld)),byName=new Map(bones.map((b,i)=>[b.name,i]));
const targets={root:[0,0,0],pelvis:[0,.616,.145],spine_01:[0,.714,.075],spine_02:[0,.805,.065],spine_03:[0,.905,.045],neck_01:[0,1.067,.010],Head:[0,1.137,.015]};
for(const [side,sign] of [['l',-1],['r',1]])Object.assign(targets,{
 ['clavicle_'+side]:[sign*.025,.979,.025],['upperarm_'+side]:[sign*.171,.963,.015],
 ['lowerarm_'+side]:[sign*.186,.749,-.052],['hand_'+side]:[sign*.112,.619,-.180],
 ['thigh_'+side]:[sign*.096,.614,.105],['calf_'+side]:[sign*.088,.498,-.211],
 ['foot_'+side]:[sign*.045,.081,-.216],['ball_'+side]:[sign*.045,.032,-.285],['ball_leaf_'+side]:[sign*.045,.026,-.312]
});
const paths={root:'pelvis',pelvis:'spine_01',spine_01:'spine_02',spine_02:'spine_03',spine_03:'neck_01',neck_01:'Head'};
for(const side of ['l','r'])for(const [a,b] of [['clavicle','upperarm'],['upperarm','lowerarm'],['lowerarm','hand'],['hand','middle_01'],['thigh','calf'],['calf','foot'],['foot','ball'],['ball','ball_leaf']])paths[a+'_'+side]=b+'_'+side;
const maps=[];
for(let i=0;i<bones.length;i++){
 const bone=bones[i],name=bone.name,start=new THREE.Vector3().setFromMatrixPosition(original[i]);
 if(!targets[name])continue;
 const target=new THREE.Vector3(...targets[name]),next=paths[name],child=byName.get(next),world=original[i].clone();
 const q=new THREE.Quaternion(),scale=new THREE.Vector3(),dummy=new THREE.Vector3();world.decompose(dummy,q,scale);
 let radial=/thigh|pelvis/.test(name)?.69:/calf|foot|ball/.test(name)?.62:/arm|hand/.test(name)?.70:.74,length=radial;
 if(child!==undefined){const end=/^hand/.test(name)?new THREE.Vector3(target.x*.95,target.y-.030,target.z-.030):new THREE.Vector3(...targets[next]);const a=new THREE.Vector3().setFromMatrixPosition(original[child]).sub(start),b=end.sub(target);length=b.length()/a.length();q.premultiply(new THREE.Quaternion().setFromUnitVectors(a.normalize(),b.normalize()));}
 const posed=new THREE.Matrix4().compose(target,q,new THREE.Vector3(radial,length,radial));maps[i]=posed.multiply(original[i].clone().invert());
}
// Fingers inherit the posed hand's transform, preserving the authored topology.
for(let i=0;i<bones.length;i++)if(!maps[i]){let parent=bones[i].parent;while(parent&&!maps[byName.get(parent.name)])parent=parent.parent;maps[i]=parent?maps[byName.get(parent.name)]:new THREE.Matrix4();}
const input=skin.geometry,positions=input.attributes.position,joints=input.attributes.skinIndex,weights=input.attributes.skinWeight,posed=[];
for(let i=0;i<positions.count;i++){
 const originalPoint=new THREE.Vector3().fromBufferAttribute(positions,i).applyMatrix4(facing),result=new THREE.Vector3();
 for(let j=0;j<4;j++){const weight=weights.getComponent(i,j);if(weight)result.addScaledVector(originalPoint.clone().applyMatrix4(maps[joints.getComponent(i,j)]),weight);}
 // Worn loose clothes soften the muscular source and fill out child limbs.
 const restY=positions.getY(i),restX=Math.abs(positions.getX(i));
 if(restY>1.02&&restY<1.50&&restX<.24){result.x*=1.27;result.z=.065+(result.z-.065)*1.28;}
 // Sleeves have volume around the shoulder, rather than clinging to biceps.
 if(result.y>.825&&result.y<.967&&Math.abs(result.x)>.14){const centre=Math.sign(result.x)*.18;result.x=centre+(result.x-centre)*1.22;result.z=.015+(result.z-.015)*1.18;}
 if(restY>.12&&restY<.95){const sign=result.x<0?-1:1,centre=sign*(restY>.53?.09:.045);result.x=centre+(result.x-centre)*1.30;}
 posed.push(result);
}
// Clip above the neck in the REST mesh, so none of the free model's face survives.
const points=[],triangles=[],vertexMap=new Map(),cut=1.535;
const point=(id)=>{if(vertexMap.has(id))return vertexMap.get(id);const p=posed[id];points.push(p.x,p.y,p.z);const index=points.length/3-1;vertexMap.set(id,index);return index;};
for(let i=0;i<input.index.count;i+=3){const ids=[0,1,2].map(j=>input.index.getX(i+j));if(ids.some(id=>positions.getY(id)>cut))continue;triangles.push(...ids.map(point));}
// Weld UV seams before smoothing; the body remains continuous at every joint.
const keys=new Map(),welded=[],remap=[];
for(let i=0;i<points.length;i+=3){const key=points.slice(i,i+3).map(n=>Math.round(n*1e6)).join(',');if(!keys.has(key)){keys.set(key,welded.length/3);welded.push(...points.slice(i,i+3));}remap.push(keys.get(key));}
const indices=triangles.map(i=>remap[i]),neighbours=Array.from({length:welded.length/3},()=>new Set()),edges=new Map();
for(let i=0;i<indices.length;i+=3)for(let j=0;j<3;j++){const a=indices[i+j],b=indices[i+(j+1)%3];neighbours[a].add(b);neighbours[b].add(a);const key=[a,b].sort((a,b)=>a-b).join(',');edges.set(key,(edges.get(key)||0)+1);}
const boundary=new Set([...edges].filter(([,n])=>n===1).flatMap(([key])=>key.split(',').map(Number)));
for(let pass=0;pass<10;pass++){const previous=welded.slice();for(let i=0;i<neighbours.length;i++){if(boundary.has(i))continue;for(let axis=0;axis<3;axis++){let sum=0;for(const n of neighbours[i])sum+=previous[n*3+axis];welded[i*3+axis]=previous[i*3+axis]*.75+sum/neighbours[i].size*.25;}}}
// Seal each boundary in its actual topological order. Sorting the neck by angle
// can skip the small folds at the collar and leave overlapping triangles.
const openEdges=[];
for(let i=0;i<indices.length;i+=3)for(let j=0;j<3;j++){
 const a=indices[i+j],b=indices[i+(j+1)%3];
 if(edges.get([a,b].sort((a,b)=>a-b).join(','))===1)openEdges.push([a,b]);
}
const remaining=new Set(openEdges.map((_,i)=>i));
while(remaining.size){
 const seed=remaining.values().next().value,component=[],vertices=new Set(openEdges[seed]);
 let expanded=true;
 while(expanded){expanded=false;for(const id of remaining){const edge=openEdges[id];if(edge.some(v=>vertices.has(v))){remaining.delete(id);component.push(edge);edge.forEach(v=>vertices.add(v));expanded=true;}}}
 const centre=new THREE.Vector3();for(const id of vertices)centre.add(new THREE.Vector3(...welded.slice(id*3,id*3+3)));centre.divideScalar(vertices.size);
 const c=welded.length/3;welded.push(...centre.toArray());
 for(const [a,b] of component)indices.push(c,b,a);
}
// Flatten only the bench contact and sole contact, retaining a seated L profile.
for(let i=0;i<welded.length;i+=3){let [x,y,z]=welded.slice(i,i+3);if(z>=.04&&y<.545)y=.525;if(y<.026)y=.026;welded[i+1]=y;}
const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(welded,3));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingBox();
const body=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:'#c5beb2',roughness:.95}));body.name='piano-boy-free-body';
body.userData={source:'Quaternius Universal Base Characters Standard / Superhero_Male',license:'CC0-1.0',adaptation:'head removed, child proportions, static seated pose'};
const binary=await new GLTFExporter().parseAsync(body,{binary:true});await mkdir(new URL('../assets/models/',import.meta.url),{recursive:true});await writeFile(new URL('../assets/models/piano-boy-body.glb',import.meta.url),new Uint8Array(binary));
console.log(JSON.stringify({bytes:binary.byteLength,vertices:welded.length/3,triangles:indices.length/3,bounds:geometry.boundingBox},null,2));
