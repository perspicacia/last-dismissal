import * as THREE from './vendor/three.module.js';
import {facelessStudentLayout} from './faceless-student.js';
import {loftGeometry,clothMaterial} from './character-shape.js';
import {buildPianoBoyFigure,setPianoBoyTexture} from './piano-boy-volume.js?v=free-body-7';

const portrait={naturalWidth:1024,naturalHeight:1536,complete:true};
const material=(color,roughness=.9)=>new THREE.MeshStandardMaterial({color,roughness});
// Closed anatomical volumes carry an unchanged frontal photograph. The rear
// hemisphere has its own opaque material, so it never repeats a face on the back.
function oval(root,name,center,radii,mat,pose=null,quaternion=null){
 const geometry=new THREE.SphereGeometry(1,20,14);geometry.scale(...radii);
 if(quaternion)geometry.applyQuaternion(quaternion);geometry.translate(...center);geometry.computeVertexNormals();
 return volume(root,name,geometry,center,radii,mat,pose);
}
function volume(root,name,geometry,center,radii,mat,pose=null){
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
 if(kind==='boy')return buildPianoBoyFigure(config);
 const root=new THREE.Group();root.name='faceless-student';root.visible=false;
 root.userData.photoMeshes=[];root.userData.kind=kind;
 const pose=facelessStudentLayout(portrait,config);
 root.userData.pose=pose;root.position.set(config.x,0,config.z);root.rotation.y=config.angle;
 const skin=material('#b9b8ac'),cloth=clothMaterial('#35363a'),hair=material('#111718',.73),shoe=material('#171b1d',.45);
 const xy=(u,v,z=0)=>[(u-.5)*pose.width,pose.top-v*pose.height,z];
 const head=xy(.5,.075);
 const skullRadii=[pose.width*.081,pose.height*.075,.113];
 const skull=volume(root,'ghost-head',loftGeometry([
  [pose.top-pose.height*.151,0,0,.005],[pose.top-pose.height*.133,.047,.063,.003],
  [pose.top-pose.height*.103,.079,.093,0],[pose.top-pose.height*.072,.093,.113,.006],
  [pose.top-pose.height*.039,.083,.103,.012],[pose.top-pose.height*.009,0,0,.015]
 ]),head,skullRadii,skin.clone(),pose),colors=[];
 const positions=skull.geometry.attributes.position;
 for(let i=0;i<positions.count;i++){const y=positions.getY(i),z=positions.getZ(i),threshold=pose.top-pose.height*.090;const amount=Math.max(0,Math.min(1,(y-threshold+(z>0?.045:0))/.022));const color=skin.color.clone().lerp(hair.color,amount);colors.push(color.r,color.g,color.b);}
 skull.geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));skull.material.color.set('#fff');skull.material.vertexColors=true;
 for(const side of [-1,1])oval(root,'ghost-ear',[side*pose.width*.081,head[1]-.045,0],[.014,.028,.018],skin,pose);
 oval(root,'ghost-neck',xy(.5,.16,.03),[.049,.09,.058],skin,pose);
 volume(root,'ghost-torso',loftGeometry([
  [pose.top-pose.height*.53,0,0,.025],[pose.top-pose.height*.50,.142,.102,.025],
  [pose.top-pose.height*.42,.133,.112,.025],[pose.top-pose.height*.32,.145,.125,.028],
  [pose.top-pose.height*.232,.163,.114,.028],[pose.top-pose.height*.205,.137,.085,.02],
  [pose.top-pose.height*.180,.050,.061,.019],[pose.top-pose.height*.167,0,0,.02]
 ]),xy(.5,.34,.025),[.163,.30,.128],cloth,pose);
 oval(root,'ghost-hips',xy(.5,.497,.025),[pose.width*.117,.14,.115],cloth,pose);
 for(const side of [-1,1]){
  const u=value=>.5+side*value;
   const shoulder=xy(u(.122),.209,.02),wrist=xy(u(.157),.482,-.018);
   const direction=new THREE.Vector3(...shoulder).sub(new THREE.Vector3(...wrist)),length=direction.length();
   const sleeve=loftGeometry([[0,0,0,0],[.02,.044,.046,0],[length*.35,.048,.050,0],[length*.74,.052,.056,0],[length-.02,.055,.057,0],[length+.018,0,0,0]],{steps:32});
   sleeve.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize()));sleeve.translate(...wrist);
   volume(root,'ghost-sleeve',sleeve,shoulder.map((n,i)=>(n+wrist[i])/2),[.055,length/2,.057],cloth,pose);
   oval(root,'ghost-hand',xy(u(.153),.523,-.02),[.035,.077,.037],skin,pose);
   const trouser=loftGeometry([[.095,0,0,0],[.126,.055,.060,0],[.28,.058,.060,0],[.48,.065,.070,0],[.69,.068,.075,0],[.84,.073,.080,.012],[.93,0,0,.015]],{steps:48});trouser.translate(side*.085,0,0);
   volume(root,'ghost-trouser',trouser,[side*.085,.51,.008],[.073,.415,.080],cloth,pose);
   oval(root,'ghost-shoe',[side*.090,.061,-.047],[.064,.036,.12],shoe,pose);
 }
 return root;
}
export function setPortraitTexture(root,image,texture){
 if(root.userData.kind==='boy')return setPianoBoyTexture(root,image,texture);
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
 const cloth=clothMaterial('#333b42'),skirt=clothMaterial('#202b36'),skin=material('#b6b1a3'),hair=material('#10191c',.62),sock=clothMaterial('#b1b3a7'),shoe=material('#181d20',.4);
 oval(root,'girl-hips',[0,config.seat+.082,.012],[.145,.082,.145],skirt);
 volume(root,'girl-torso',loftGeometry([[.54,0,0,.02],[.59,.122,.100,.012],[.72,.131,.100,.008],[.88,.163,.111,.008],[.96,.151,.087,0],[1.025,.05,.043,0],[1.04,0,0,0]]),[0,.80,.008],[.163,.24,.115],cloth);
 oval(root,'girl-neck',[0,1.025,0],[.045,.072,.046],skin);oval(root,'girl-head',[0,1.17,0],[.105,.134,.105],skin);
 volume(root,'girl-hair-back',loftGeometry([[.735,0,0,.095],[.766,.118,.034,.098],[.90,.125,.045,.116],[1.06,.114,.067,.095],[1.15,.114,.120,.018],[1.24,.090,.107,.012],[1.293,.055,.060,.008],[1.327,0,0,.008]],{pleats:.017}),[0,1.01,.10],[.13,.29,.12],hair);
 for(let i=0;i<17;i++){const x=(i-8)*.013,curve=new THREE.CatmullRomCurve3([[x*.56,1.278,.088],[x*.94,1.12,.175-Math.abs(x)*.14],[x,.93,.164-Math.abs(x)*.12],[x*.90,.77+Math.cos(i)*.006,.126]].map(p=>new THREE.Vector3(...p)));const strand=new THREE.Mesh(new THREE.TubeGeometry(curve,16,.0011,4,false),i%3?hair:material('#242b2b',.66));strand.name='girl-hair-strand';strand.castShadow=false;root.add(strand);}
 for(const side of [-1,1]){
  limb(root,'girl-upper-arm',[side*.15,.95,0],[side*.18,.72,-.027],.045,cloth);
  limb(root,'girl-forearm',[side*.18,.72,-.027],[side*.10,.58,-.13],.036,cloth);
  oval(root,'girl-hand',[side*.10,.575,-.15],[.03,.042,.025],skin);
  limb(root,'girl-thigh',[side*.075,config.seat+.095,.05],[side*.083,config.seat+.065,-.20],.075,skirt);
  limb(root,'girl-shin',[side*.083,config.seat+.04,-.20],[side*.077,.085,-.24],.035,sock);
  oval(root,'girl-shoe',[side*.076,.043,-.285],[.046,.025,.09],shoe);
 }
 const skirtGeometry=loftGeometry([[.36,0,0,-.27],[.38,.18,.04,-.26],[.445,.179,.07,-.245],[.48,.17,.19,-.048],[.572,.128,.139,.018],[.59,0,0,.018]],{pleats:.07});
 const skirtPositions=skirtGeometry.attributes.position;
 for(let i=0;i<skirtPositions.count;i++)if(skirtPositions.getY(i)<config.seat-.004)skirtPositions.setZ(i,Math.min(skirtPositions.getZ(i),-.18-(config.seat-.004-skirtPositions.getY(i))*.5));
 skirtGeometry.computeVertexNormals();skirtGeometry.computeBoundingBox();
 volume(root,'girl-skirt',skirtGeometry,[0,.475,-.05],[.18,.115,.19],skirt);
 // A sewn sailor collar follows the shoulders; it is not a floating white ring.
 const collarGeometry=loftGeometry([[.955,0,0,0],[.962,.148,.073,0],[.984,.130,.065,0],[1.012,.054,.047,0],[1.018,0,0,0]],{steps:16});
 volume(root,'girl-collar',collarGeometry,[0,.986,0],[.148,.032,.073],clothMaterial('#aaa99c'));
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
