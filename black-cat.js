import * as THREE from './vendor/three.module.js';

function ellipsoid(g,name,position,scale,material){const m=new THREE.Mesh(new THREE.SphereGeometry(1,18,12),material);m.name=name;m.position.set(...position);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
function ear(g,x,material){
 const points=new Float32Array([x-.058,.375,.295,x+.055,.375,.295,x,.505,.26,x,.388,.20]);
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(points,3));geometry.setIndex([0,1,2,0,3,1,1,3,2,2,3,0]);geometry.computeVertexNormals();
 const m=new THREE.Mesh(geometry,material);m.name='cat-pointed-ear';m.castShadow=true;g.add(m);
}
export function buildBlackCat(){
 const root=new THREE.Group();root.name='black-cat';root.visible=false;
 const fur=new THREE.MeshStandardMaterial({color:'#111619',roughness:.90}),soft=new THREE.MeshStandardMaterial({color:'#202523',roughness:.82}),nose=new THREE.MeshStandardMaterial({color:'#51433f',roughness:.7});
 ellipsoid(root,'cat-body',[0,.235,-.03],[.105,.125,.255],fur);
 ellipsoid(root,'cat-shoulders',[0,.275,.16],[.095,.11,.105],fur);
 ellipsoid(root,'cat-head',[0,.355,.265],[.09,.105,.108],fur);
 ellipsoid(root,'cat-muzzle',[0,.318,.358],[.058,.043,.035],soft);
 ellipsoid(root,'cat-nose',[0,.332,.391],[.015,.010,.007],nose);
 for(const side of [-1,1]){
  ear(root,side*.059,fur);
  const eye=ellipsoid(root,'cat-eye',[side*.048,.37,.360],[.022,.012,.013],new THREE.MeshStandardMaterial({color:'#aea96e',emissive:'#575331',emissiveIntensity:.30,roughness:.30}));eye.castShadow=false;
  ellipsoid(root,'cat-eye-slit',[side*.048,.371,.372],[.003,.011,.002],fur).castShadow=false;
  // Subtle raised cheek/whisker roots, no oversized glowing pupils.
  ellipsoid(root,'cat-cheek',[side*.042,.326,.34],[.032,.037,.035],fur);
  for(const z of [-.20,.16]){
   const leg=new THREE.Group();leg.name='cat-leg';leg.position.set(side*.070,.22,z);root.add(leg);
   ellipsoid(leg,'cat-upper-leg',[0,-.055,0],[.031,.082,.038],fur);
   ellipsoid(leg,'cat-lower-leg',[0,-.139,.013],[.022,.072,.024],fur);
   ellipsoid(leg,'cat-paw',[0,-.198,.029],[.031,.021,.047],fur);
   leg.userData.phase=side*(z<0?-1:1);
  }
 }
 const tail=new THREE.Group();tail.name='cat-tail';tail.position.set(0,.255,-.245);root.add(tail);
 const curve=new THREE.CatmullRomCurve3([[0,0,0],[0,.02,-.10],[0,.11,-.24],[0,.27,-.29],[.025,.33,-.23]].map(p=>new THREE.Vector3(...p)));
 const tailMesh=new THREE.Mesh(new THREE.TubeGeometry(curve,18,.018,7,false),fur);tailMesh.castShadow=true;tail.add(tailMesh);
 root.userData.legs=root.children.filter(x=>x.name==='cat-leg');root.userData.tail=tail;
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(.28,28),new THREE.MeshBasicMaterial({color:'#020504',transparent:true,opacity:.45,depthWrite:false}));shadow.name='cat-floor-shadow';shadow.rotation.x=-Math.PI/2;root.add(shadow);root.userData.shadow=shadow;
 return root;
}
export function updateBlackCat(root,pose){
 root.visible=Boolean(pose);if(!pose)return;
 root.position.set(pose.x,pose.y,pose.z);root.rotation.y=pose.yaw;
 for(const leg of root.userData.legs)leg.rotation.x=pose.gait*leg.userData.phase*.65;
 root.userData.tail.rotation.z=pose.gait*.09;
 root.userData.shadow.position.y=.006-pose.y;root.userData.shadow.scale.set(1,1.5,1);root.userData.shadow.material.opacity=.40*pose.opacity/(1+pose.y*2);
 root.traverse(m=>{if(m.isMesh&&m!==root.userData.shadow){m.material.transparent=pose.opacity<1;m.material.opacity=pose.opacity;}});
}
// Canvas compatibility: project the same body landmarks into a shaded silhouette.
export function drawBlackCat(c,project,pose){
 if(!pose)return false;
 const local=(x,y,z)=>project(pose.x+x*Math.cos(pose.yaw)+z*Math.sin(pose.yaw),pose.y+y,pose.z-x*Math.sin(pose.yaw)+z*Math.cos(pose.yaw));
 const center=local(0,.235,0),head=local(0,.35,.265),top=local(0,.50,.265),bottom=local(0,0,0);if(!center||!head||!top||!bottom)return false;
 const unit=Math.abs(top.y-bottom.y)/.5;
 c.save();c.globalAlpha=pose.opacity;c.strokeStyle='#101716';c.fillStyle='#141b1b';c.lineCap='round';
 const a=local(0,.235,-.23),b=local(0,.235,.20);if(a&&b){c.lineWidth=.22*unit;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}
 for(const side of [-1,1])for(const z of [-.20,.16]){const leg=local(side*.07,.22,z),foot=local(side*.07,.023,z+.025+pose.gait*side*(z<0?-1:1)*.10);if(leg&&foot){c.lineWidth=.046*unit;c.beginPath();c.moveTo(leg.x,leg.y);c.lineTo(foot.x,foot.y);c.stroke();}}
 const tail=[[0,.255,-.245],[0,.275,-.345],[0,.38,-.485],[0,.52,-.535],[.025,.58,-.475]].map(p=>local(...p));if(tail.every(Boolean)){c.lineWidth=.032*unit;c.beginPath();tail.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();}
 c.beginPath();c.ellipse(head.x,head.y,.085*unit,.102*unit,0,0,Math.PI*2);c.fill();
 for(const side of [-1,1]){const points=[[side*.059-.05,.375,.295],[side*.059+.05,.375,.295],[side*.059,.505,.26]].map(p=>local(...p));if(points.every(Boolean)){c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();}}
 const face=local(0,.36,.36),eyeL=local(-.047,.37,.36),eyeR=local(.047,.37,.36);if(face&&eyeL&&eyeR){c.fillStyle='#939567';for(const p of [eyeL,eyeR]){c.beginPath();c.ellipse(p.x,p.y,.015*unit,.007*unit,0,0,Math.PI*2);c.fill();}}
 c.restore();return true;
}
