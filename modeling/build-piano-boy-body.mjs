// CC0 source anatomy -> static seated body. The source face is discarded.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {closedSurface,joinSurfaces,roundedToe,looseShirt} from './closed-surface.mjs';

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
 let radial=/thigh|pelvis/.test(name)?.88:/calf/.test(name)?.93:/foot|ball/.test(name)?.84:/hand/.test(name)?.60:/arm/.test(name)?.82:.85,length=radial;
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
 closedSurface(rest,anatomy,input.index.array,[(_rest,posed)=>.900-posed.y],0,10,p=>Math.max(smooth((Math.abs(p.x)-.65)/.08),1-smooth((p.y-.10)/.08))),
 ...looseShirt(),
 closedSurface(rest,shorts,input.index.array,[p=>p.y-.71,p=>1.045-p.y,p=>.28-p.x,p=>.28+p.x],2,8)
];
// Close the covered adult shoulder in the seated pose, then connect a narrow
// child neck to the original chin. Rest-pose arm cuts would bridge the wrists.
parts.push(roundedToe([0,1.027,-.047],[.045,.064,.055],32,10,0));
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
const binary=await new GLTFExporter().parseAsync(body,{binary:true});await mkdir(new URL('../assets/models/',import.meta.url),{recursive:true});await writeFile(new URL('../assets/models/piano-boy-body.glb',import.meta.url),new Uint8Array(binary));
console.log(JSON.stringify({bytes:binary.byteLength,vertices:welded.length/3,triangles:geometry.index.count/3,bounds:geometry.boundingBox},null,2));
