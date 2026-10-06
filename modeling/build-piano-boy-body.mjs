// CC0 anatomy -> static seated child. Source face materials are discarded.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {closedSurface,joinSurfaces,roundedToe} from './closed-surface.mjs';
import {childShirt} from './boy-clothes.mjs';

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
 ['lowerarm_'+side]:[sign*.182,.745,-.073],['hand_'+side]:[sign*.108,.622,-.183],
 ['thigh_'+side]:[sign*.096,.614,.105],['calf_'+side]:[sign*.088,.498,-.211],
 ['foot_'+side]:[sign*.052,.081,-.216],['ball_'+side]:[sign*.052,.032,-.285],['ball_leaf_'+side]:[sign*.052,.026,-.312]
});
const paths={root:'pelvis',pelvis:'spine_01',spine_01:'spine_02',spine_02:'spine_03',spine_03:'neck_01',neck_01:'Head'};
for(const side of ['l','r'])for(const [a,b] of [['clavicle','upperarm'],['upperarm','lowerarm'],['lowerarm','hand'],['hand','middle_01'],['thigh','calf'],['calf','foot'],['foot','ball'],['ball','ball_leaf']])paths[a+'_'+side]=b+'_'+side;
const maps=[];
for(let i=0;i<bones.length;i++){
 const bone=bones[i],name=bone.name,start=new THREE.Vector3().setFromMatrixPosition(original[i]);
 if(!targets[name])continue;
 const target=new THREE.Vector3(...targets[name]),next=paths[name],child=byName.get(next),world=original[i].clone();
 const q=new THREE.Quaternion(),scale=new THREE.Vector3(),dummy=new THREE.Vector3();world.decompose(dummy,q,scale);
 let radial=/thigh|pelvis/.test(name)?.88:/calf/.test(name)?.84:/foot|ball/.test(name)?.84:/hand/.test(name)?.76:/arm/.test(name)?.82:.85,length=radial;
 if(child!==undefined){const end=/^hand/.test(name)?new THREE.Vector3(target.x*.98,target.y-.027,target.z-.030):new THREE.Vector3(...targets[next]);const a=new THREE.Vector3().setFromMatrixPosition(original[child]).sub(start),b=end.sub(target);length=b.length()/a.length();q.premultiply(new THREE.Quaternion().setFromUnitVectors(a.normalize(),b.normalize()));}
 const posed=new THREE.Matrix4().compose(target,q,new THREE.Vector3(radial,length,radial));maps[i]=posed.multiply(original[i].clone().invert());
}
// Fingers inherit the posed hand's transform, preserving the authored topology.
for(let i=0;i<bones.length;i++)if(!maps[i]){let parent=bones[i].parent;while(parent&&!maps[byName.get(parent.name)])parent=parent.parent;maps[i]=parent?maps[byName.get(parent.name)]:new THREE.Matrix4();}
const input=skin.geometry,positions=input.attributes.position,joints=input.attributes.skinIndex,weights=input.attributes.skinWeight;
const smooth=n=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n);};
const rest=[],anatomy=[],shorts=[];
const posePoint=(p,i)=>{const out=new THREE.Vector3();for(let j=0;j<4;j++){const weight=weights.getComponent(i,j);if(weight)out.addScaledVector(p.clone().applyMatrix4(maps[joints.getComponent(i,j)]),weight);}return out;};
for(let i=0;i<positions.count;i++){
 const p=new THREE.Vector3().fromBufferAttribute(positions,i).applyMatrix4(facing),normal=new THREE.Vector3().fromBufferAttribute(input.attributes.normal,i).transformDirection(facing);
 rest.push(p);anatomy.push(posePoint(p,i));
 // The clothes are independent closed surfaces. Continuous ease around the
 // thighs replaces the old hard inflation thresholds; the shirt is authored separately.
 const cuff=1-smooth((p.y-.70)/.25);shorts.push(posePoint(p.clone().addScaledVector(normal,.028+.015*cuff),i));
}
const parts=[
 closedSurface(rest,anatomy,input.index.array,[(_rest,posed)=>.900-posed.y],0,20,p=>Math.max(smooth((Math.abs(p.x)-.65)/.08),1-smooth((p.y-.10)/.08))),
 childShirt(),
 closedSurface(rest,shorts,input.index.array,[p=>p.y-.71,p=>1.045-p.y,p=>.28-p.x,p=>.28+p.x],2,8)
];
// Covered adult shoulders are closed beneath the continuous shirt.
// The connected child head/neck is exported separately below.
// The free base has a single smooth foot tip. Small, overlapping toe volumes
// restore the original barefoot silhouette without painting toes on a wedge.
for(const sign of [-1,1])for(let toe=0;toe<5;toe++){
 const size=1-toe*.13,x=sign*(.032+toe*.012),ry=.012*size;
 parts.push(roundedToe([x,.026+ry,-.301+toe*.002],[.0105*size,ry,.023*size]));
}
const geometry=joinSurfaces(parts),welded=geometry.attributes.position.array,regions=geometry.attributes.garment;
// Flatten only the bench contact and sole contact, retaining a seated L profile.
for(let i=0;i<welded.length;i+=3){
 let [x,y,z]=welded.slice(i,i+3);if(z>=.04&&y<.545)y=.525;if(y<.026)y=.026;
 if(regions.getX(i/3)===0&&y<.95){const covered=smooth((y-.85)/.05);z=z*(1-covered)+Math.max(-.050,Math.min(.105,z))*covered;}
 welded[i+1]=y;welded[i+2]=z;
}
geometry.attributes.position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingBox();
const body=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:'#c5beb2',roughness:.95}));body.name='piano-boy-free-body';
body.userData={source:'Quaternius Universal Base Characters Standard / Superhero_Male',license:'CC0-1.0',adaptation:'head removed, child proportions, static seated pose, separate loose shirt and shorts, child neck and toes'};
// Reuse the free human's continuous jaw/neck topology, retaining none of its
// face materials. Photograph extrusion cannot invent a human side profile.
const headPose=p=>{
 const keys=[[1.555,.977],[1.580,1.048],[1.630,1.087],[1.660,1.126],[1.690,1.170],[1.810,1.377]];
 let k=0;while(k<keys.length-2&&p.y>keys[k+1][0])k++;
 const a=keys[k],b=keys[k+1],t=THREE.MathUtils.clamp((p.y-a[0])/(b[0]-a[0]),0,1);
 const y=THREE.MathUtils.lerp(a[1],b[1],t),neck=1-smooth((p.y-1.58)/.06);
 const width=THREE.MathUtils.lerp(.72,1.36,smooth((p.y-1.555)/.045));
 const out=new THREE.Vector3(p.x*width,y,p.z*THREE.MathUtils.lerp(1.12,.65,neck)-.042*neck);
 // Adult trapezius/neck folds must not become a crumpled collar on the child.
 // A continuous oval cross-section retains the jaw above, narrowing only the nape.
 const rounded=1-smooth((y-1.050)/.060),rx=.059+.010*smooth((y-.977)/.10),rz=.050+.010*smooth((y-.977)/.10),radius=Math.hypot(out.x/rx,(out.z+.009)/rz);
 if(radius>.001){out.x=THREE.MathUtils.lerp(out.x,out.x/radius,rounded);out.z=THREE.MathUtils.lerp(out.z,(out.z+.009)/radius-.009,rounded);}
 out.y-=.025*(1-smooth((y-1.010)/.040));
 return out;
};
const headRest=rest,headPosed=rest.map(headPose);
const headParts=closedSurface(headRest,headPosed,input.index.array,[p=>p.y-1.555,p=>.115-p.x,p=>.115+p.x],0,2);
const headGeometry=joinSurfaces([headParts]);headGeometry.computeVertexNormals();headGeometry.computeBoundingBox();
const headMesh=new THREE.Mesh(headGeometry,body.material);headMesh.name='piano-boy-human-head';
headMesh.userData={source:body.userData.source,license:'CC0-1.0',adaptation:'child skull and continuous jaw/neck anatomy, no source face material'};
const model=new THREE.Group();model.name='piano-boy-anatomy';model.add(body,headMesh);
const binary=await new GLTFExporter().parseAsync(model,{binary:true});await mkdir(new URL('../assets/models/',import.meta.url),{recursive:true});await writeFile(new URL('../assets/models/piano-boy-body.glb',import.meta.url),new Uint8Array(binary));
console.log(JSON.stringify({bytes:binary.byteLength,vertices:welded.length/3,triangles:geometry.index.count/3,bounds:geometry.boundingBox},null,2));
