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
 // Closed tapered cross-sections give the triangular ear an actual curved cup.
 // Interior colour is painted on that same surface, avoiding intersecting
 // planar front/lining triangles when viewed at 45 degrees.
 const geometry=loftGeometry([[-.008,0,0,0],[.004,.041,.018,0],[.028,.035,.015,-.003],[.055,.025,.012,-.008],[.078,.015,.008,-.015],[.096,.006,.004,-.020],[.104,0,0,-.021]],{steps:32,radial:24}),p=geometry.attributes.position,colors=[];
 for(let i=0;i<p.count;i++){
  const row=Math.floor(i/25),angle=(i%25)/24*Math.PI*2,t=row/32;
  const front=THREE.MathUtils.smoothstep(Math.sin(angle),.35,.90),rim=1-THREE.MathUtils.smoothstep(Math.abs(Math.cos(angle)),.50,.82),height=THREE.MathUtils.smoothstep(t,.12,.22)*(1-THREE.MathUtils.smoothstep(t,.80,.91));
  p.setX(i,p.getX(i)-.014*THREE.MathUtils.clamp(p.getY(i)/.104,0,1));
  const c=fur.color.clone().lerp(inner.color,front*rim*height);colors.push(c.r,c.g,c.b);
 }
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();geometry.computeBoundingBox();
 const material=fur.clone();material.color.set('#fff');material.vertexColors=true;
 const mesh=new THREE.Mesh(geometry,material);mesh.name='cat-pointed-ear';mesh.position.set(side*.052,.481,.274);mesh.scale.set(side,.92,1);mesh.rotation.z=-side*.10;mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);
}
function almond(g,side,lid,iris,black){
 const shape=new THREE.Shape();shape.moveTo(-.0185,0);shape.quadraticCurveTo(0,.0125,.0185,0);shape.quadraticCurveTo(0,-.0105,-.0185,0);
 const eye=new THREE.Group();eye.name='cat-eye';eye.position.set(side*.042,.447,.369);eye.rotation.z=side*.13;eye.rotation.y=side*.27;g.add(eye);
 const rim=new THREE.Mesh(new THREE.ShapeGeometry(shape,16),lid);rim.scale.set(1.12,1.15,1);eye.add(rim);
 const goldenGeometry=new THREE.ShapeGeometry(shape,16),p=goldenGeometry.attributes.position;
 for(let i=0;i<p.count;i++)p.setZ(i,.002*(1-(p.getX(i)/.0185)**2));goldenGeometry.computeVertexNormals();
 const golden=new THREE.Mesh(goldenGeometry,iris);golden.position.z=.002;eye.add(golden);
 ellipsoid(eye,'cat-eye-slit',[0,0,.005],[.0020,.0082,.0017],black).castShadow=false;
 const glint=new THREE.Mesh(new THREE.SphereGeometry(.0017,8,6),new THREE.MeshBasicMaterial({color:'#d7c58a'}));glint.position.set(-.008,.005,.006);eye.add(glint);
}
function legSurface(root,material){
 const steps=32,radial=16,positions=new Float32Array((steps+1)*(radial+1)*3),uv=[],indices=[];
 for(let j=0;j<=steps;j++)for(let i=0;i<=radial;i++){
  uv.push(i/radial,j/steps);if(j<steps&&i<radial){const a=j*(radial+1)+i,b=a+1,c=a+radial+1,d=c+1;if(j)indices.push(a,b,c);if(j<steps-1)indices.push(b,d,c);}
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);
 const mesh=new THREE.Mesh(geometry,material);mesh.name='cat-continuous-leg';mesh.castShadow=mesh.receiveShadow=true;mesh.userData={steps,radial};root.add(mesh);return mesh;
}
function fitLeg(mesh,{hip,knee,paw},front){
 const {steps,radial}=mesh.userData,p=mesh.geometry.attributes.position;
 const ankle=new THREE.Vector3(knee.x,knee.y,knee.z).lerp(new THREE.Vector3(paw.x,paw.y,paw.z),.78);if(!front)ankle.z-=.012;
 const path=new THREE.CatmullRomCurve3([new THREE.Vector3(hip.x*.65,hip.y+.100,hip.z),new THREE.Vector3(hip.x,hip.y,hip.z),new THREE.Vector3(knee.x,knee.y,knee.z),ankle,new THREE.Vector3(paw.x,paw.y,paw.z)],false,'centripetal');
 const rings=[[0,0],[.12,front?.032:.043],[.30,front?.034:.046],[.52,front?.024:.030],[.74,front?.018:.021],[.94,.017],[1,0]],point=new THREE.Vector3();
 for(let j=0;j<=steps;j++){
  const t=j/steps,center=path.getPoint(t),tangent=path.getTangent(t).normalize(),across=new THREE.Vector3(1,0,0).addScaledVector(tangent,-tangent.x).normalize(),cross=new THREE.Vector3().crossVectors(tangent,across).normalize();let k=0;while(k<rings.length-2&&t>rings[k+1][0])k++;
  const u=(t-rings[k][0])/(rings[k+1][0]-rings[k][0]),ease=u*u*(3-2*u),r=THREE.MathUtils.lerp(rings[k][1],rings[k+1][1],ease);
  for(let i=0;i<=radial;i++){const a=i/radial*Math.PI*2;point.copy(center).addScaledVector(across,r*Math.cos(a)).addScaledVector(cross,r*Math.sin(a));p.setXYZ(j*(radial+1)+i,point.x,point.y,point.z);}
 }
 p.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();
}
// Short tapered strands soften the silhouette without a transparent fur shell.
// The local seed never consumes the game's placement/event random stream.
function shortFur(surface,material,count,seed){
 const p=surface.geometry.attributes.position,n=surface.geometry.attributes.normal,index=surface.geometry.index,vertices=[],normals=[];
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const point=new THREE.Vector3(),normal=new THREE.Vector3(),tangent=new THREE.Vector3(),vertex=new THREE.Vector3();
 for(let i=0;i<count;i++){
  const tri=Math.floor(random()*index.count/3)*3,a=index.getX(tri),b=index.getX(tri+1),c=index.getX(tri+2),r=Math.sqrt(random()),s=random(),weights=[1-r,r*(1-s),r*s];
  point.set(0,0,0);normal.set(0,0,0);
  for(const [j,k] of [a,b,c].entries()){point.addScaledVector(vertex.fromBufferAttribute(p,k),weights[j]);normal.addScaledVector(vertex.fromBufferAttribute(n,k),weights[j]);}
  normal.normalize();tangent.set(random()-.5,random()-.5,random()-.5).cross(normal).normalize();
  const length=.0016+random()*.0022,width=.00055+random()*.0004;
  for(const [across,out] of [[-width,.00015],[width,.00015],[0,length]]){
   vertex.copy(point).addScaledVector(tangent,across).addScaledVector(normal,out);vertices.push(vertex.x,vertex.y,vertex.z);normals.push(normal.x,normal.y,normal.z);
  }
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
 const coat=new THREE.Mesh(geometry,material);coat.name='cat-short-fur';surface.add(coat);return coat;
}
export function buildBlackCat(){
 const root=new THREE.Group();root.name='black-cat';root.visible=false;
 const map=coatTexture(),fur=new THREE.MeshStandardMaterial({color:'#181a1c',map,bumpMap:map,bumpScale:.0018,roughness:.90,metalness:0});
 const faceFur=fur.clone();faceFur.color.set('#161819');
 const inner=new THREE.MeshStandardMaterial({color:'#443732',roughness:1,side:THREE.DoubleSide}),black=new THREE.MeshStandardMaterial({color:'#090b0c',roughness:.65});
 const iris=new THREE.MeshStandardMaterial({color:'#bd9e35',emissive:'#9c751d',emissiveIntensity:.10,roughness:.26});
 const torso=new THREE.Group();torso.name='cat-torso';root.add(torso);
 // The breast rises into the neck in one surface, without a separate collar.
 const bodyGeometry=loftGeometry([[-.314,0,0,-.297],[-.282,.052,.075,-.301],[-.230,.102,.110,-.302],[-.140,.109,.123,-.310],[0,.103,.105,-.312],[.130,.102,.119,-.318],[.220,.095,.139,-.350],[.290,.073,.113,-.384],[.343,.043,.070,-.426],[.370,0,0,-.443]],{steps:72,radial:40});bodyGeometry.rotateX(Math.PI/2);
 const body=new THREE.Mesh(bodyGeometry,fur);body.name='cat-body';body.castShadow=body.receiveShadow=true;torso.add(body);
 const fineFur=new THREE.MeshStandardMaterial({color:'#1b1d1e',roughness:1,side:THREE.DoubleSide});shortFur(body,fineFur,1300,51831);
 const head=new THREE.Group();head.name='cat-head-rig';root.add(head);
 const headGeometry=loftGeometry([[.371,0,0,.333],[.384,.039,.042,.320],[.412,.070,.067,.301],[.430,.080,.081,.294],[.452,.083,.080,.280],[.487,.077,.074,.273],[.516,.051,.050,.270],[.534,0,0,.270]],{steps:56,radial:40});
 headGeometry.translate(0,-.431,-.285);const skull=new THREE.Mesh(headGeometry,faceFur);skull.name='cat-head';skull.position.set(0,.431,.285);skull.castShadow=skull.receiveShadow=true;head.add(skull);shortFur(skull,fineFur,600,68145);
 for(const side of [-1,1]){
  ellipsoid(head,'cat-muzzle',[side*.014,.407,.372],[.019,.015,.022],faceFur);
  ear(head,side,faceFur,inner);almond(head,side,black,iris,black);
 }
 // The nasal bridge is part of the head surface instead of a separate oval
 // sitting between the eyes. Keep the small black nose and original whiskers.
 const noseShape=new THREE.Shape();noseShape.moveTo(-.011,.003);noseShape.lineTo(.011,.003);noseShape.quadraticCurveTo(.009,-.003,0,-.009);noseShape.quadraticCurveTo(-.009,-.003,-.011,.003);
 const nose=new THREE.Mesh(new THREE.ExtrudeGeometry(noseShape,{depth:.004,bevelEnabled:true,bevelThickness:.001,bevelSize:.001,bevelSegments:2}),black);nose.name='cat-nose';nose.position.set(0,.412,.394);head.add(nose);
 const lines=[];
 for(const side of [-1,1])for(let i=0;i<3;i++)lines.push(side*.034,.395+i*.003,.385,side*(.122+i*.012),.38+i*.014,.370-i*.016);
 const whiskerGeometry=new THREE.BufferGeometry();whiskerGeometry.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));
 const whiskers=new THREE.LineSegments(whiskerGeometry,new THREE.LineBasicMaterial({color:'#817a67',transparent:true,opacity:.28}));whiskers.name='cat-whiskers';head.add(whiskers);
 const headPivot=new THREE.Vector3(0,.431,.285);for(const part of head.children)part.position.sub(headPivot);head.position.copy(headPivot);
 const legs=[];
 for(const side of [-1,1])for(const front of [true,false]){
  const rig=new THREE.Group();rig.name='cat-leg';root.add(rig);
  const surface=legSurface(rig,fur);
  const paw=ellipsoid(rig,'cat-paw',[0,0,0],[.028,.023,.041],faceFur);
  for(let i=-1;i<=1;i++)ellipsoid(paw,'cat-toe',[i*.20,-.08,.55],[.26,.30,.48],faceFur);
  rig.userData={side,front,surface,paw};legs.push(rig);
 }
 const tail=new THREE.Group();tail.name='cat-tail';tail.position.set(0,.294,-.261);root.add(tail);
 const curve=new THREE.CatmullRomCurve3([[0,0,0],[.012,.085,-.054],[.015,.202,-.074],[.009,.327,-.066],[.020,.422,-.057]].map(p=>new THREE.Vector3(...p)));
 const tailGeometry=new THREE.TubeGeometry(curve,24,.022,10,false),positions=tailGeometry.attributes.position;
 for(let i=0;i<positions.count;i++){
  const u=Math.floor(i/11)/24,center=curve.getPointAt(u),taper=1-.58*u;
  positions.setXYZ(i,center.x+(positions.getX(i)-center.x)*taper,center.y+(positions.getY(i)-center.y)*taper,center.z+(positions.getZ(i)-center.z)*taper);
 }
 tailGeometry.computeVertexNormals();const tailMesh=new THREE.Mesh(tailGeometry,fur);tailMesh.castShadow=true;tail.add(tailMesh);const tailFur=shortFur(tailMesh,fineFur,350,99183);
 const tailTip=ellipsoid(tail,'cat-tail-tip',[.020,.422,-.057],[.0092,.0092,.0092],fur);
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(.25,28),new THREE.MeshBasicMaterial({color:'#020302',transparent:true,opacity:.4,depthWrite:false}));shadow.name='cat-floor-shadow';shadow.rotation.x=-Math.PI/2;root.add(shadow);
 root.userData={legs,tail,torso,head,shadow,tailMesh,tailBase:positions.array.slice(),tailTip,tailFur,tailFurBase:tailFur.geometry.attributes.position.array.slice(),whiskers};
 updateBlackCat(root,{x:0,y:0,z:0,yaw:0,cycle:0,motion:0,opacity:1});root.visible=false;
 return root;
}
export function updateBlackCat(root,pose){
 root.visible=Boolean(pose);if(!pose)return;
 root.position.set(pose.x,pose.y,pose.z);root.rotation.y=pose.yaw;
 const {legs,torso,head,tail,tailMesh,tailBase,tailTip,tailFur,tailFurBase,shadow,whiskers}=root.userData;
 torso.rotation.x=pose.bodyPitch||0;head.position.y=.431+(pose.headBob||0);head.rotation.y=pose.headYaw||0;
 for(const leg of legs){
  const {side,front,surface,paw}=leg.userData,joints=catLimbPose(pose,side,front);leg.userData.joints=joints;
  fitLeg(surface,joints,front);
  paw.position.set(joints.paw.x,joints.paw.y,joints.paw.z);paw.rotation.x=0;
 }
 tail.rotation.y=(pose.gait||0)*.10;
 const positions=tailMesh.geometry.attributes.position;
 for(let i=0;i<positions.count;i++){const u=Math.floor(i/11)/24;positions.setXYZ(i,tailBase[i*3]+Math.sin((pose.cycle||0)*3+u*3)*u*u*.014,tailBase[i*3+1],tailBase[i*3+2]);}
 positions.needsUpdate=true;tailMesh.geometry.computeVertexNormals();
 const strands=tailFur.geometry.attributes.position;
 for(let i=0;i<strands.count;i++){const u=Math.max(0,Math.min(1,tailFurBase[i*3+1]/.422));strands.setX(i,tailFurBase[i*3]+Math.sin((pose.cycle||0)*3+u*3)*u*u*.014);}
 strands.needsUpdate=true;tailTip.position.x=.020+Math.sin((pose.cycle||0)*3+3)*.014;
 shadow.position.y=.006-pose.y;shadow.scale.set(.8,1.5,1);shadow.material.opacity=.38*pose.opacity;
 root.traverse(m=>{if(m.isMesh&&m!==shadow){m.material.transparent=pose.opacity<1;m.material.opacity=pose.opacity;}});whiskers.material.opacity=.28*pose.opacity;
}
// Compatibility silhouettes use the same grounded joint positions as Three.js.
export function drawBlackCat(c,project,pose){
 if(!pose)return false;
 const local=(x,y,z)=>project(pose.x+x*Math.cos(pose.yaw)+z*Math.sin(pose.yaw),pose.y+y,pose.z-x*Math.sin(pose.yaw)+z*Math.cos(pose.yaw));
 const headLocal=(x,y,z)=>{const yaw=pose.headYaw||0,dz=z-.285;return local(x*Math.cos(yaw)+dz*Math.sin(yaw),y+(pose.headBob||0),.285-x*Math.sin(yaw)+dz*Math.cos(yaw));};
 const head=headLocal(0,.431,.285),top=headLocal(0,.616,.27),bottom=local(0,0,0);if(!head||!top||!bottom)return false;
 const unit=Math.abs(top.y-bottom.y)/.616;c.save();c.globalAlpha=pose.opacity;c.strokeStyle='#151818';c.fillStyle='#141717';c.lineCap='round';
 const segment=(a,b,width)=>{const from=local(a.x,a.y,a.z),to=local(b.x,b.y,b.z);if(from&&to){c.lineWidth=width*unit;c.beginPath();c.moveTo(from.x,from.y);c.lineTo(to.x,to.y);c.stroke();}};
 segment({x:0,y:.293,z:-.19},{x:0,y:.297,z:.16},.24);segment({x:0,y:.318,z:.22},{x:0,y:.431,z:.285},.14);
 for(const side of [-1,1])for(const front of [true,false]){const {hip,knee,paw}=catLimbPose(pose,side,front);segment(hip,knee,front?.046:.060);segment(knee,paw,front?.032:.038);const foot=local(paw.x,paw.y,paw.z);if(foot){c.beginPath();c.ellipse(foot.x,foot.y,.032*unit,.019*unit,0,0,Math.PI*2);c.fill();}}
 const tail=[[0,.294,-.261],[.012,.379,-.315],[.015,.496,-.335],[.009,.621,-.327],[.020,.716,-.318]].map(p=>local(...p));if(tail.every(Boolean)){c.lineWidth=.032*unit;c.beginPath();tail.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();}
 c.beginPath();c.ellipse(head.x,head.y,.083*unit,.081*unit,0,0,Math.PI*2);c.fill();
 for(const side of [-1,1]){const points=[[side*(.052-.041),.481,.30],[side*(.052+.040),.481,.30],[side*.046,.576,.274]].map(p=>headLocal(...p));if(points.every(Boolean)){c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();}}
 // Eyes are visible from the forward half of the head, never through its back.
 const face=headLocal(0,.449,.379),back=headLocal(0,.449,.27),eyes=[headLocal(-.044,.449,.379),headLocal(.044,.449,.379)];
 if(face&&back&&face.d<=back.d+.005)for(const [i,eye] of eyes.entries()){
  if(!eye||!eyes[1-i]||(Math.abs(eye.d-eyes[1-i].d)>.055&&eye.d>eyes[1-i].d))continue;
  c.fillStyle='#bca044';c.beginPath();c.ellipse(eye.x,eye.y,.0185*unit,.010*unit,0,0,Math.PI*2);c.fill();c.fillStyle='#070908';c.fillRect(eye.x-.002*unit,eye.y-.0082*unit,.004*unit,.0164*unit);
 }
 c.restore();return true;
}
