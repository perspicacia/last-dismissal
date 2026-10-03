import * as THREE from './vendor/three.module.js';
import {pianoBoyLayout} from './piano-boy.js';
import {facelessStudentLayout} from './faceless-student.js';

const portrait={naturalWidth:1024,naturalHeight:1536,complete:true};
const material=(color,roughness=.9)=>new THREE.MeshStandardMaterial({color,roughness});
// Closed anatomical volumes carry an unchanged frontal photograph. The rear
// hemisphere has its own opaque material, so it never repeats a face on the back.
function oval(root,name,center,radii,mat,pose=null,quaternion=null){
 const geometry=new THREE.SphereGeometry(1,20,14);geometry.scale(...radii);
 if(quaternion)geometry.applyQuaternion(quaternion);geometry.translate(...center);geometry.computeVertexNormals();
 const mesh=new THREE.Mesh(geometry,mat);mesh.name=name;mesh.castShadow=mesh.receiveShadow=true;
 mesh.userData={center,radii,color:mat.color.getStyle()};root.add(mesh);
 if(pose){
  const front=geometry.clone(),positions=front.attributes.position,normals=front.attributes.normal,indices=[];
  for(let i=0;i<front.index.count;i+=3){const a=front.index.getX(i),b=front.index.getX(i+1),c=front.index.getX(i+2);if(normals.getZ(a)+normals.getZ(b)+normals.getZ(c)<-.3)indices.push(a,b,c);}
  front.setIndex(indices);const uv=front.attributes.uv,blend=[];
  for(let i=0;i<positions.count;i++){uv.setXY(i,.5+positions.getX(i)/pose.width,1-(pose.top-positions.getY(i))/pose.height);blend.push(1,1,1,Math.max(0,Math.min(1,(-normals.getZ(i)-.08)/.32)));}
  front.setAttribute('color',new THREE.Float32BufferAttribute(blend,4));
  front.translate(0,0,-.0025);
  const photo=new THREE.Mesh(front,new THREE.MeshStandardMaterial({color:'#fff',roughness:.94,transparent:true,alphaTest:.025,depthWrite:true,vertexColors:true}));photo.name=name+'-photo';photo.castShadow=false;root.add(photo);root.userData.photoMeshes.push(photo);
 }
 return mesh;
}
function limb(root,name,a,b,radius,mat,pose=null){
 const direction=new THREE.Vector3(...b).sub(new THREE.Vector3(...a)),center=a.map((n,i)=>(n+b[i])/2);
 return oval(root,name,center,[radius,direction.length()/2+radius*.65,radius],mat,pose,new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize()));
}
export function buildPortraitGhost(kind,config){
 const root=new THREE.Group();root.name=kind==='boy'?'piano-boy-ghost':'faceless-student';root.visible=false;
 root.userData.photoMeshes=[];root.userData.kind=kind;
 const boy=kind==='boy',pose=boy?pianoBoyLayout(portrait,config):facelessStudentLayout(portrait,config);
 root.userData.pose=pose;root.position.set(config.x,0,config.z);root.rotation.y=boy?Math.PI/2:config.angle;
 const skin=material(boy?'#b8b7aa':'#b9b8ac'),cloth=material(boy?'#aaa99b':'#35363a'),hair=material('#111718',.73),shoe=material('#171b1d',.45);
 const xy=(u,v,z=0)=>[(u-.5)*pose.width,pose.top-v*pose.height,z];
 const head=xy(.5,boy?.132:.075);
 const skull=oval(root,'ghost-head',head,[pose.width*(boy?.132:.081),pose.height*(boy?.119:.075),boy?.119:.113],skin.clone(),pose),colors=[];
 const positions=skull.geometry.attributes.position;
 for(let i=0;i<positions.count;i++){const y=positions.getY(i),z=positions.getZ(i),threshold=pose.top-pose.height*(boy?.143:.090);const amount=Math.max(0,Math.min(1,(y-threshold+(z>0?.045:0))/.022));const color=skin.color.clone().lerp(hair.color,amount);colors.push(color.r,color.g,color.b);}
 skull.geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));skull.material.color.set('#fff');skull.material.vertexColors=true;
 for(const side of [-1,1])oval(root,'ghost-ear',[side*pose.width*(boy?.132:.081),head[1]-.045,0],[.014,.028,.018],skin,pose);
 oval(root,'ghost-neck',xy(.5,boy?.254:.16,.03),[boy?.058:.049,boy?.075:.09,.058],skin,pose);
 oval(root,'ghost-torso',xy(.5,boy?.386:.335,.045),[pose.width*(boy?.176:.138),pose.height*(boy?.137:.163),boy?.112:.128],cloth,pose);
 oval(root,'ghost-hips',boy?[0,config.y+.105,.055]:xy(.5,.497,.025),[pose.width*(boy?.182:.117),boy?.105:.14,.115],cloth,pose);
 for(const side of [-1,1]){
  const u=value=>.5+side*value;
  if(boy){
   const shoulder=xy(u(.207),.33,.015),elbow=xy(u(.185),.459,-.025),wrist=xy(u(.100),.553,-.139);
   limb(root,'ghost-sleeve',shoulder,xy(u(.2),.415,.01),.049,cloth,pose);
   limb(root,'ghost-upper-arm',xy(u(.2),.401,.01),elbow,.037,skin,pose);limb(root,'ghost-forearm',elbow,wrist,.035,skin,pose);
   oval(root,'ghost-hand',wrist,[.041,.052,.028],skin,pose);
   const knee=[side*.114,config.y+.050,-.055];
   limb(root,'ghost-thigh',[side*.11,config.y+.090,.16],knee,.074,cloth,pose);
   oval(root,'ghost-knee',knee,[.064,.073,.075],skin,pose);
   limb(root,'ghost-shin',[side*.114,.493,-.055],[side*.082,.092,-.027],.045,skin,pose);
   oval(root,'ghost-foot',[side*.083,.055,-.086],[.052,.030,.106],skin,pose);
  }else{
   const shoulder=xy(u(.122),.209,.02),elbow=xy(u(.155),.345,.02),wrist=xy(u(.157),.482,-.018);
   limb(root,'ghost-upper-arm',shoulder,elbow,.055,cloth,pose);limb(root,'ghost-forearm',elbow,wrist,.047,cloth,pose);
   oval(root,'ghost-hand',xy(u(.153),.523,-.02),[.035,.077,.037],skin,pose);
   const hip=xy(u(.071),.495),knee=xy(u(.078),.717),ankle=[side*.086,.14,0];
   limb(root,'ghost-thigh',hip,knee,.067,cloth,pose);limb(root,'ghost-shin',knee,ankle,.059,cloth,pose);
   oval(root,'ghost-shoe',[side*.090,.061,-.047],[.064,.036,.12],shoe,pose);
  }
 }
 return root;
}
export function setPortraitTexture(root,image,texture){
 const ready=image?.complete!==false&&image?.naturalWidth>0&&image?.naturalHeight>0;root.visible=Boolean(ready);
 if(!ready)return false;
 for(const mesh of root.userData.photoMeshes){mesh.material.map=texture;mesh.material.needsUpdate=true;}return true;
}
export const SEATED_GIRL=Object.freeze({x:1.2,z:4.34,angle:Math.PI,seat:.448});
export function seatedGirlLook(player){
 const dx=SEATED_GIRL.x-player.x,dz=SEATED_GIRL.z-player.z,distance=Math.hypot(dx,dz);
 if(distance>=3.5||(dx*Math.sin(player.angle)+dz*Math.cos(player.angle))/Math.max(.001,distance)<.8)return 0;
 return -.65/Math.max(.8,distance)*Math.max(0,Math.min(1,(3.5-distance)/1.2));
}
export function buildSeatedGirl(config=SEATED_GIRL){
 const root=new THREE.Group();root.name='seated-schoolgirl';root.userData.photoMeshes=[];root.position.set(config.x,0,config.z);root.rotation.y=config.angle;
 const cloth=material('#333b42'),skirt=material('#202b36'),skin=material('#b6b1a3'),hair=material('#10191c',.78),sock=material('#9b9d91'),shoe=material('#181d20',.5);
 oval(root,'girl-hips',[0,config.seat+.082,.012],[.145,.082,.145],skirt);oval(root,'girl-torso',[0,.80,.008],[.163,.24,.115],cloth);
 oval(root,'girl-neck',[0,1.025,0],[.045,.072,.046],skin);oval(root,'girl-head',[0,1.17,0],[.105,.134,.105],skin);
 oval(root,'girl-hair-cap',[0,1.185,.015],[.114,.14,.125],hair);
 oval(root,'girl-hair-back',[0,.973,.115],[.141,.215,.067],hair);
 for(let i=0;i<17;i++){const x=(i-8)*.016,curve=new THREE.CatmullRomCurve3([[x*.65,1.26,.08],[x,1.10,.17],[x*1.02,.91,.18],[x*.91,.757+Math.cos(i)*.008,.14]].map(p=>new THREE.Vector3(...p)));const strand=new THREE.Mesh(new THREE.TubeGeometry(curve,10,.006,4,false),i%3?hair:material('#26302f',.65));strand.name='girl-hair-strand';strand.castShadow=true;root.add(strand);}
 for(const side of [-1,1]){
  limb(root,'girl-upper-arm',[side*.15,.95,0],[side*.18,.72,-.027],.045,cloth);
  limb(root,'girl-forearm',[side*.18,.72,-.027],[side*.10,.58,-.13],.036,cloth);
  oval(root,'girl-hand',[side*.10,.575,-.15],[.03,.042,.025],skin);
  limb(root,'girl-thigh',[side*.075,config.seat+.095,.05],[side*.083,config.seat+.065,-.20],.075,skirt);
  limb(root,'girl-shin',[side*.083,config.seat+.04,-.20],[side*.077,.085,-.24],.035,sock);
  oval(root,'girl-shoe',[side*.076,.043,-.285],[.046,.025,.09],shoe);
 }
 for(let i=0;i<9;i++){const x=(i-4)*.033;limb(root,'girl-skirt-pleat',[x,.57,-.08],[x*1.18,.37,-.255],.017,i%2?skirt:material('#34424d'));}
 return root;
}
// Low-cost compatibility silhouette for the new seated girl. Photographic
// ghosts keep their existing Canvas cutouts; mixing ellipses under the photograph
// would create pale halos instead of reproducing the shaded Three.js model.
export function drawFigureVolume(ctx,project,root){
 if(!root?.visible)return;root.updateMatrixWorld(true);const faces=[];
 for(const mesh of root.children){if(!mesh.userData.center)continue;const center=new THREE.Vector3(...mesh.userData.center).applyMatrix4(root.matrixWorld),p=project(center.x,center.y,center.z);if(!p)continue;
  const radius=Math.max(mesh.userData.radii[0],mesh.userData.radii[2]),edge=project(center.x+radius,center.y,center.z),edgeZ=project(center.x,center.y,center.z+radius),top=project(center.x,center.y+mesh.userData.radii[1],center.z);if(edge&&edgeZ&&top)faces.push({p,rx:Math.max(1,Math.abs(edge.x-p.x),Math.abs(edgeZ.x-p.x)),ry:Math.max(1,Math.abs(top.y-p.y)),color:mesh.userData.color});
 }
 faces.sort((a,b)=>b.p.d-a.p.d);for(const f of faces){ctx.fillStyle=f.color;ctx.beginPath();ctx.ellipse(f.p.x,f.p.y,f.rx,f.ry,0,0,Math.PI*2);ctx.fill();}
}
