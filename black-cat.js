import * as THREE from './vendor/three.module.js';
import {catLimbPose} from './cat-gait.js?v=cat-polish-2';
import {loftGeometry} from './character-shape.js';

function ellipsoid(g,name,position,scale,material){const m=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),material);m.name=name;m.position.set(...position);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
let furMap;
function coatTexture(){
 if(furMap)return furMap;
 const size=128,data=new Uint8Array(size*size*4);let seed=9417;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const grain=seed/4294967296,streak=.5+.5*Math.sin(x*2.3+Math.sin(y*.14)*.6),v=165+grain*35+streak*40,i=(y*size+x)*4;
  data[i]=v;data[i+1]=v;data[i+2]=v;data[i+3]=255;
 }
 furMap=new THREE.DataTexture(data,size,size);furMap.wrapS=furMap.wrapT=THREE.RepeatWrapping;furMap.repeat.set(3,2);furMap.needsUpdate=true;return furMap;
}
function ear(g,side,fur,inner){
 const shape=new THREE.Shape();shape.moveTo(-.035,0);shape.quadraticCurveTo(-.031,.050,-.008,.105);shape.quadraticCurveTo(.001,.109,.007,.098);shape.quadraticCurveTo(.030,.048,.035,0);shape.closePath();
 const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.010,bevelEnabled:true,bevelThickness:.003,bevelSize:.003,bevelSegments:3,steps:1,curveSegments:10}),fur);
 mesh.name='cat-pointed-ear';mesh.position.set(side*.050,.486,.272);mesh.scale.y=.86;mesh.rotation.z=-side*.12;mesh.castShadow=true;g.add(mesh);
 const inset=new THREE.Shape();inset.moveTo(-.023,.018);inset.quadraticCurveTo(-.020,.055,-.006,.085);inset.quadraticCurveTo(.010,.06,.024,.018);inset.closePath();
 const lining=new THREE.Mesh(new THREE.ShapeGeometry(inset,10),inner);lining.position.z=.014;lining.name='cat-inner-ear';mesh.add(lining);
}
function almond(g,side,lid,iris,black){
 const shape=new THREE.Shape();shape.moveTo(-.024,0);shape.quadraticCurveTo(0,.014,.024,0);shape.quadraticCurveTo(0,-.012,-.024,0);
 const eye=new THREE.Group();eye.name='cat-eye';eye.position.set(side*.044,.450,.374);eye.rotation.z=side*.13;eye.rotation.y=side*.27;g.add(eye);
 const rim=new THREE.Mesh(new THREE.ShapeGeometry(shape,16),lid);rim.scale.set(1.12,1.15,1);eye.add(rim);
 const goldenGeometry=new THREE.ShapeGeometry(shape,16),p=goldenGeometry.attributes.position;
 for(let i=0;i<p.count;i++)p.setZ(i,.002*(1-(p.getX(i)/.024)**2));goldenGeometry.computeVertexNormals();
 const golden=new THREE.Mesh(goldenGeometry,iris);golden.position.z=.002;eye.add(golden);
 ellipsoid(eye,'cat-eye-slit',[0,0,.005],[.0023,.0083,.0017],black).castShadow=false;
 const glint=new THREE.Mesh(new THREE.SphereGeometry(.0017,8,6),new THREE.MeshBasicMaterial({color:'#d7c58a'}));glint.position.set(-.008,.005,.006);eye.add(glint);
}
function link(mesh,a,b,radius){
 const start=new THREE.Vector3(a.x,a.y,a.z),end=new THREE.Vector3(b.x,b.y,b.z),delta=end.sub(start);
 mesh.position.copy(start).addScaledVector(delta,.5);mesh.scale.set(radius,delta.length()*.57,radius);
 mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
}
export function buildBlackCat(){
 const root=new THREE.Group();root.name='black-cat';root.visible=false;
 const map=coatTexture(),fur=new THREE.MeshStandardMaterial({color:'#242627',map,bumpMap:map,bumpScale:.0012,roughness:.72,metalness:0});
 const faceFur=fur.clone();faceFur.color.set('#202223');
 const inner=new THREE.MeshStandardMaterial({color:'#443732',roughness:1,side:THREE.DoubleSide}),black=new THREE.MeshStandardMaterial({color:'#090b0c',roughness:.65});
 const iris=new THREE.MeshStandardMaterial({color:'#bd9e35',emissive:'#9c751d',emissiveIntensity:.10,roughness:.26});
 const torso=new THREE.Group();torso.name='cat-torso';root.add(torso);
 const bodyGeometry=loftGeometry([[-.310,0,0,-.278],[-.270,.073,.091,-.278],[-.180,.101,.119,-.278],[-.035,.095,.112,-.284],[.105,.088,.116,-.294],[.195,.080,.101,-.299],[.255,.052,.073,-.316],[.300,0,0,-.335]],{steps:56});bodyGeometry.rotateX(Math.PI/2);
 const body=new THREE.Mesh(bodyGeometry,fur);body.name='cat-body';body.castShadow=body.receiveShadow=true;torso.add(body);
 ellipsoid(torso,'cat-neck',[0,.361,.234],[.064,.100,.069],faceFur);
 const head=new THREE.Group();head.name='cat-head-rig';root.add(head);
 const headGeometry=loftGeometry([[.346,0,0,.319],[.370,.043,.049,.323],[.405,.075,.079,.303],[.447,.087,.088,.286],[.480,.078,.082,.281],[.507,.049,.053,.280],[.528,0,0,.280]],{steps:40});
 headGeometry.translate(0,-.431,-.285);const skull=new THREE.Mesh(headGeometry,faceFur);skull.name='cat-head';skull.position.set(0,.431,.285);skull.castShadow=skull.receiveShadow=true;head.add(skull);
 for(const side of [-1,1]){
  ellipsoid(head,'cat-muzzle',[side*.020,.407,.371],[.025,.018,.024],faceFur);
  ear(head,side,faceFur,inner);almond(head,side,black,iris,black);
 }
 // A narrow nasal bridge joins the brow and nose, rather than two spherical cheeks.
 ellipsoid(head,'cat-nose-bridge',[0,.433,.366],[.015,.029,.023],faceFur);
 const noseShape=new THREE.Shape();noseShape.moveTo(-.011,.003);noseShape.lineTo(.011,.003);noseShape.quadraticCurveTo(.009,-.003,0,-.009);noseShape.quadraticCurveTo(-.009,-.003,-.011,.003);
 const nose=new THREE.Mesh(new THREE.ExtrudeGeometry(noseShape,{depth:.004,bevelEnabled:true,bevelThickness:.001,bevelSize:.001,bevelSegments:2}),black);nose.name='cat-nose';nose.position.set(0,.412,.396);head.add(nose);
 const lines=[];
 for(const side of [-1,1])for(let i=0;i<3;i++)lines.push(side*.034,.395+i*.003,.385,side*(.122+i*.012),.38+i*.014,.370-i*.016);
 const whiskerGeometry=new THREE.BufferGeometry();whiskerGeometry.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));
 const whiskers=new THREE.LineSegments(whiskerGeometry,new THREE.LineBasicMaterial({color:'#817a67',transparent:true,opacity:.28}));whiskers.name='cat-whiskers';head.add(whiskers);
 const headPivot=new THREE.Vector3(0,.431,.285);for(const part of head.children)part.position.sub(headPivot);head.position.copy(headPivot);
 const legs=[];
 for(const side of [-1,1])for(const front of [true,false]){
  const rig=new THREE.Group();rig.name='cat-leg';root.add(rig);
  const upper=ellipsoid(rig,'cat-upper-leg',[0,0,0],[1,1,1],fur),lower=ellipsoid(rig,'cat-lower-leg',[0,0,0],[1,1,1],fur);
  const paw=ellipsoid(rig,'cat-paw',[0,0,0],[.028,.023,.041],faceFur);
  for(let i=-1;i<=1;i++)ellipsoid(paw,'cat-toe',[i*.20,-.08,.55],[.26,.30,.48],faceFur);
  rig.userData={side,front,upper,lower,paw};legs.push(rig);
 }
 const tail=new THREE.Group();tail.name='cat-tail';tail.position.set(0,.29,-.241);root.add(tail);
 const curve=new THREE.CatmullRomCurve3([[0,0,0],[.018,.025,-.105],[.032,.080,-.205],[.072,.16,-.25],[.115,.19,-.22]].map(p=>new THREE.Vector3(...p)));
 const tailGeometry=new THREE.TubeGeometry(curve,24,.018,8,false),positions=tailGeometry.attributes.position;
 for(let i=0;i<positions.count;i++){
  const u=Math.floor(i/9)/24,center=curve.getPointAt(u),taper=1-.65*u;
  positions.setXYZ(i,center.x+(positions.getX(i)-center.x)*taper,center.y+(positions.getY(i)-center.y)*taper,center.z+(positions.getZ(i)-center.z)*taper);
 }
 tailGeometry.computeVertexNormals();const tailMesh=new THREE.Mesh(tailGeometry,fur);tailMesh.castShadow=true;tail.add(tailMesh);
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(.25,28),new THREE.MeshBasicMaterial({color:'#020302',transparent:true,opacity:.4,depthWrite:false}));shadow.name='cat-floor-shadow';shadow.rotation.x=-Math.PI/2;root.add(shadow);
 root.userData={legs,tail,torso,head,shadow,tailMesh,tailBase:positions.array.slice(),whiskers};
 updateBlackCat(root,{x:0,y:0,z:0,yaw:0,cycle:0,motion:0,opacity:1});root.visible=false;
 return root;
}
export function updateBlackCat(root,pose){
 root.visible=Boolean(pose);if(!pose)return;
 root.position.set(pose.x,pose.y,pose.z);root.rotation.y=pose.yaw;
 const {legs,torso,head,tail,tailMesh,tailBase,shadow,whiskers}=root.userData;
 torso.rotation.x=pose.bodyPitch||0;head.position.y=.431+(pose.headBob||0);head.rotation.y=pose.headYaw||0;
 for(const leg of legs){
  const {side,front,upper,lower,paw}=leg.userData,joints=catLimbPose(pose,side,front);leg.userData.joints=joints;
  link(upper,joints.hip,joints.knee,front?.026:.037);link(lower,joints.knee,joints.paw,front?.017:.022);
  paw.position.set(joints.paw.x,joints.paw.y,joints.paw.z);paw.rotation.x=0;
 }
 tail.rotation.y=(pose.gait||0)*.10;
 const positions=tailMesh.geometry.attributes.position;
 for(let i=0;i<positions.count;i++){const u=Math.floor(i/9)/24;positions.setXYZ(i,tailBase[i*3]+Math.sin((pose.cycle||0)*3+u*3)*u*u*.014,tailBase[i*3+1],tailBase[i*3+2]);}
 positions.needsUpdate=true;tailMesh.geometry.computeVertexNormals();
 shadow.position.y=.006-pose.y;shadow.scale.set(.8,1.5,1);shadow.material.opacity=.38*pose.opacity;
 root.traverse(m=>{if(m.isMesh&&m!==shadow){m.material.transparent=pose.opacity<1;m.material.opacity=pose.opacity;}});whiskers.material.opacity=.28*pose.opacity;
}
// Compatibility silhouettes use the same grounded joint positions as Three.js.
export function drawBlackCat(c,project,pose){
 if(!pose)return false;
 const local=(x,y,z)=>project(pose.x+x*Math.cos(pose.yaw)+z*Math.sin(pose.yaw),pose.y+y,pose.z-x*Math.sin(pose.yaw)+z*Math.cos(pose.yaw));
 const headLocal=(x,y,z)=>{const yaw=pose.headYaw||0,dz=z-.285;return local(x*Math.cos(yaw)+dz*Math.sin(yaw),y+(pose.headBob||0),.285-x*Math.sin(yaw)+dz*Math.cos(yaw));};
 const head=headLocal(0,.431,.285),top=headLocal(0,.603,.27),bottom=local(0,0,0);if(!head||!top||!bottom)return false;
 const unit=Math.abs(top.y-bottom.y)/.603;c.save();c.globalAlpha=pose.opacity;c.strokeStyle='#151818';c.fillStyle='#141717';c.lineCap='round';
 const segment=(a,b,width)=>{const from=local(a.x,a.y,a.z),to=local(b.x,b.y,b.z);if(from&&to){c.lineWidth=width*unit;c.beginPath();c.moveTo(from.x,from.y);c.lineTo(to.x,to.y);c.stroke();}};
 segment({x:0,y:.284,z:-.19},{x:0,y:.284,z:.16},.235);segment({x:0,y:.285,z:.22},{x:0,y:.431,z:.285},.13);
 for(const side of [-1,1])for(const front of [true,false]){const {hip,knee,paw}=catLimbPose(pose,side,front);segment(hip,knee,front?.052:.067);segment(knee,paw,.035);const foot=local(paw.x,paw.y,paw.z);if(foot){c.beginPath();c.ellipse(foot.x,foot.y,.032*unit,.019*unit,0,0,Math.PI*2);c.fill();}}
 const tail=[[0,.29,-.241],[.018,.315,-.346],[.032,.37,-.446],[.072,.45,-.49],[.115,.48,-.461]].map(p=>local(...p));if(tail.every(Boolean)){c.lineWidth=.027*unit;c.beginPath();tail.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();}
 c.beginPath();c.ellipse(head.x,head.y,.088*unit,.094*unit,0,0,Math.PI*2);c.fill();
 for(const side of [-1,1]){const points=[[side*.065-.040,.49,.29],[side*.065+.041,.49,.29],[side*.065,.603,.27]].map(p=>headLocal(...p));if(points.every(Boolean)){c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();}}
 // Eyes are visible from the forward half of the head, never through its back.
 const face=headLocal(0,.449,.379),back=headLocal(0,.449,.27),eyes=[headLocal(-.044,.449,.379),headLocal(.044,.449,.379)];
 if(face&&back&&face.d<=back.d+.005)for(const [i,eye] of eyes.entries()){
  if(!eye||!eyes[1-i]||(Math.abs(eye.d-eyes[1-i].d)>.055&&eye.d>eyes[1-i].d))continue;
  c.fillStyle='#bca044';c.beginPath();c.ellipse(eye.x,eye.y,.023*unit,.010*unit,0,0,Math.PI*2);c.fill();c.fillStyle='#070908';c.fillRect(eye.x-.002*unit,eye.y-.009*unit,.004*unit,.018*unit);
 }
 c.restore();return true;
}
