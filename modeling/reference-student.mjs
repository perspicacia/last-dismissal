import * as THREE from 'three';
import {buildDollVolume} from '../doll-volume.js';

// Separate authored solids with projected ORIGINAL front, independent backs,
// articulated limbs and a real skeleton. Unseen surfaces are approximations.
export function createReferenceStudent(art){
 const root=new THREE.Group();root.name='reference-student';
 root.userData={kind:'original-reference-rig-candidate',front:'-Z',reference:'doll-student-concept.png',sideBack:'authored approximation',approvedForGame:false};
 const height=1.55,width=height*art.width/art.height,pixel=(u,v)=>{
  const at=(Math.max(0,Math.min(art.height-1,Math.round(v*(art.height-1))))*art.width+Math.max(0,Math.min(art.width-1,Math.round(u*(art.width-1)))))*4;
  return new THREE.Color().setRGB(art.pixels[at]/255,art.pixels[at+1]/255,art.pixels[at+2]/255,THREE.SRGBColorSpace);
 };
 // glTF stores images top-to-bottom: v=0 must be the top of the source art.
 const texture=new THREE.DataTexture(new Uint8Array(art.pixels),art.width,art.height);texture.colorSpace=THREE.SRGBColorSpace;texture.flipY=false;texture.needsUpdate=true;
 const photo=new THREE.MeshStandardMaterial({name:'original front photograph',map:texture,transparent:true,alphaTest:.12,roughness:.83,side:THREE.DoubleSide});
 // Projection outside the photographed clothing silhouette needs an opaque
 // connecting colour, not a transparent hole in a round shoulder or calf.
 // Preserve every opaque pixel; extend only transparent pixels by row colour.
 const extended=new Uint8Array(art.pixels);
 for(let y=0;y<art.height;y++){
  let r=0,g=0,b=0,n=0;for(let x=0;x<art.width;x++){const at=4*(y*art.width+x);if(art.pixels[at+3]>200){r+=art.pixels[at];g+=art.pixels[at+1];b+=art.pixels[at+2];n++;}}
  for(let x=0;x<art.width;x++){const at=4*(y*art.width+x);if(art.pixels[at+3]<32)extended.set(n?[r/n,g/n,b/n,255]:[38,37,34,255],at);}
 }
 const clothWidth=Math.round(art.width/2),clothHeight=Math.round(art.height/2),clothPixels=new Uint8Array(clothWidth*clothHeight*4);
 for(let y=0;y<clothHeight;y++)for(let x=0;x<clothWidth;x++){const from=4*(Math.min(art.height-1,y*2)*art.width+Math.min(art.width-1,x*2));clothPixels.set(extended.subarray(from,from+4),4*(y*clothWidth+x));}
 const clothMap=new THREE.DataTexture(clothPixels,clothWidth,clothHeight);clothMap.colorSpace=THREE.SRGBColorSpace;clothMap.flipY=false;clothMap.needsUpdate=true;
 const projected=new THREE.MeshStandardMaterial({name:'original clothing with extended seam colour',map:clothMap,roughness:.88,side:THREE.DoubleSide});
 const materials={skin:new THREE.MeshStandardMaterial({name:'porcelain back',color:pixel(.52,.281),roughness:.48}),cloth:new THREE.MeshStandardMaterial({name:'navy cloth back',color:pixel(.50,.59),roughness:.95}),sock:new THREE.MeshStandardMaterial({name:'cream socks',color:pixel(.43,.85),roughness:.97}),shoe:new THREE.MeshStandardMaterial({name:'dark shoes',color:pixel(.45,.95),roughness:.43})};
 const coordinates=[['doll_root',null,[0,0,0]],['doll_pelvis','doll_root',[0,.57,0]],['doll_chest','doll_pelvis',[0,.96,0]],['doll_neck','doll_chest',[0,1.075,-.075]],['doll_head','doll_neck',[0,1.31,-.12]]];
 for(const [side,s] of [['left',-1],['right',1]])coordinates.push([`doll_upperarm_${side}`,'doll_chest',[s*.148,1.02,-.07]],[`doll_forearm_${side}`,`doll_upperarm_${side}`,[s*.225,.78,-.055]],[`doll_hand_${side}`,`doll_forearm_${side}`,[s*.222,.635,-.05]],[`doll_thigh_${side}`,'doll_pelvis',[s*.070,.58,.015]],[`doll_calf_${side}`,`doll_thigh_${side}`,[s*.070,.415,0]],[`doll_foot_${side}`,`doll_calf_${side}`,[s*.070,.095,-.005]]);
 const bones=new Map(),index=new Map();for(const [name,,p] of coordinates){const bone=new THREE.Bone();bone.name=name;bones.set(name,bone);index.set(name,index.size);bone.userData.rest=p;}
 for(const [name,parent,p] of coordinates){const bone=bones.get(name),origin=parent?bones.get(parent).userData.rest:[0,0,0];bone.position.set(...p.map((n,i)=>n-origin[i]));(parent?bones.get(parent):root).add(bone);}
 root.updateMatrixWorld(true);const skeleton=new THREE.Skeleton([...bones.values()]);skeleton.calculateInverses();
 const bind=(name,geometry,back,bone,secondary=null,threshold=0,secondaryBelow=false)=>{
  if(name==='original-head-and-curls'){const ids=[...new Set(geometry.index.array)],remap=new Map(ids.map((id,i)=>[id,i])),old=geometry.attributes.position;geometry.setAttribute('position',new THREE.Float32BufferAttribute(ids.flatMap(i=>[old.getX(i),old.getY(i),old.getZ(i)]),3));geometry.setIndex([...geometry.index.array].map(i=>remap.get(i)));}
  const p=geometry.attributes.position,uv=[],joints=[],weights=[];
  for(let i=0;i<p.count;i++){
   uv.push(.5+p.getX(i)/width,1-p.getY(i)/height);
   const ramp=THREE.MathUtils.smoothstep(p.getY(i),threshold-.035,threshold+.035),blend=secondary?(secondaryBelow?1-ramp:ramp):0;
   joints.push(index.get(bone),index.get(secondary)||0,0,0);weights.push(1-blend,blend,0,0);
  }
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(joints,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
  geometry.computeVertexNormals();const normals=geometry.attributes.normal;for(let i=0;i<normals.count;i++)if(Math.hypot(normals.getX(i),normals.getY(i),normals.getZ(i))<.001)normals.setXYZ(i,0,1,0);geometry.normalizeNormals();geometry.clearGroups();const front=[],rear=[],idx=geometry.index?.array;
  for(let i=0;i<(idx?.length??p.count);i+=3){const a=idx?idx[i]:i,b=idx?idx[i+1]:i+1,c=idx?idx[i+2]:i+2,n=geometry.attributes.normal;((n.getZ(a)+n.getZ(b)+n.getZ(c))<-.25?front:rear).push(a,b,c);}
  geometry.setIndex([...front,...rear]);geometry.addGroup(0,front.length,0);geometry.addGroup(front.length,rear.length,1);
  const mesh=new THREE.SkinnedMesh(geometry,[name==='original-head-and-curls'?photo:projected,back]);mesh.name=name;mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);mesh.bind(skeleton);return mesh;
 };
 const solid=(name,center,radii,back,bone,secondary,threshold,secondaryBelow=false)=>{
  const g=new THREE.SphereGeometry(1,32,24);g.scale(...radii);g.translate(...center);return bind(name,g,back,bone,secondary,threshold,secondaryBelow);
 };
 const loft=(name,rings,back,bone,secondary,threshold,pleats=0,secondaryBelow=false)=>{
  const p=[],idx=[],radial=48;
  for(let j=0;j<rings.length;j++){const [y,cx,rx,rz,cz]=rings[j];for(let i=0;i<=radial;i++){const a=i/radial*Math.PI*2,fold=1+pleats*Math.cos(a*16);p.push(cx+Math.cos(a)*rx*fold,y,cz+Math.sin(a)*rz*fold);if(j<rings.length-1&&i<radial){const n=j*(radial+1)+i;idx.push(n,n+radial+1,n+1,n+1,n+radial+1,n+radial+2);}}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);return bind(name,g,back,bone,secondary,threshold,secondaryBelow);
 };
 // Preserve the original hair/face contour and source XY exactly. This head is
 // a closed sculpted photo surface, not a complete recovered side portrait.
 const headPixels=new Uint8ClampedArray(art.pixels);for(let y=0;y<art.height;y++)for(let x=0;x<art.width;x++)if(y/art.height>=.283||(y/art.height>.255&&x/art.width<.40))headPixels[(y*art.width+x)*4+3]=0;
 const head=buildDollVolume(headPixels,art.width,art.height,height,128,192);head.translate(0,height/2,0);head.deleteAttribute('color');
 // Round the unseen cranium independently of the front photograph's depths.
 // XY and projected UV remain unchanged; this is an authored rear approximation.
 const hp=head.attributes.position,headLayer=(128+1)*(192+1);
 for(let i=headLayer;i<hp.count;i++){const u=.5+hp.getX(i)/width,v=1-hp.getY(i)/height,cap=Math.sqrt(Math.max(0,1-((u-.49)/.29)**2-((v-.16)/.177)**2)),thickness=hp.getZ(i)-hp.getZ(i-headLayer),interior=THREE.MathUtils.smoothstep(thickness,.003,.09);hp.setZ(i,hp.getZ(i)+cap*.145*interior);}
 const hairBack=materials.skin.clone();hairBack.name='hair and porcelain back';hairBack.vertexColors=true;hairBack.roughness=.96;hairBack.color.set('#ffffff');
 bind('original-head-and-curls',head,hairBack,'doll_head');
 const headColours=[],hair=pixel(.47,.10),skin=pixel(.52,.281);
 for(let i=0;i<head.attributes.position.count;i++){const v=1-head.attributes.position.getY(i)/height,col=v<.278?hair:skin;headColours.push(col.r,col.g,col.b);}
 head.setAttribute('color',new THREE.Float32BufferAttribute(headColours,3));
 const neck=solid('connected-neck',[.04,1.108,-.14],[.032,.05,.035],materials.skin,'doll_neck','doll_chest',1.068,true);
 // The photographed transparent neck boundary must not punch a hole through
 // the new connecting solid. It uses sampled porcelain on every face.
 neck.material=[materials.skin,materials.skin];
 loft('sailor-blouse',[[.71,0,0,0,-.08],[.715,0,.128,.089,-.07],[.85,0,.143,.092,-.075],[1.015,0,.157,.084,-.07],[1.075,.025,.046,.047,-.145],[1.08,.025,0,0,-.145]],materials.cloth,'doll_chest','doll_pelvis',.76,0,true);
 loft('pleated-dress',[[.46,0,0,0,-.06],[.465,0,.209,.115,-.06],[.57,0,.182,.102,-.065],[.70,0,.14,.090,-.07],[.755,0,.120,.078,-.07],[.76,0,0,0,-.07]],materials.cloth,'doll_pelvis',null,0,.028);
 for(const [side,s] of [['left',-1],['right',1]]){
  const arm=`doll_upperarm_${side}`,elbow=`doll_forearm_${side}`,hand=`doll_hand_${side}`,thigh=`doll_thigh_${side}`,calf=`doll_calf_${side}`,foot=`doll_foot_${side}`;
  loft(`long-sleeve-${side}`,[[.635,s*.222,0,0,-.055],[.642,s*.222,.041,.041,-.055],[.78,s*.223,.054,.052,-.055],[.96,s*.184,.067,.055,-.07],[1.032,s*.150,.053,.048,-.07],[1.066,s*.128,.038,.037,-.075],[1.078,s*.11,0,0,-.08]],materials.cloth,elbow,arm,.79);
  solid(`porcelain-hand-${side}`,[s*.226,.604,-.073],[.039,.071,.028],materials.skin,hand,elbow,.658);
  solid(`thigh-${side}`,[s*.074,.454,-.055],[.053,.103,.053],materials.skin,thigh,calf,.421,true);
  solid(`knee-${side}`,[s*.075,.403,-.071],[.048,.041,.047],materials.skin,calf);
  solid(`calf-${side}`,[s*.076,.286,-.065],[.043,.120,.043],materials.skin,calf);
  solid(`sock-${side}`,[s*.073,.183,-.056],[.047,.098,.044],materials.sock,calf,foot,.135,true);
  solid(`shoe-${side}`,[s*.074,.055,-.103],[.055,.049,.101],materials.shoe,foot);
 }
 const q=(axis,angle)=>new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(...axis),angle).toArray();
 const idle=new THREE.AnimationClip('GentleIdle',4,[new THREE.QuaternionKeyframeTrack('doll_head.quaternion',[0,2,4],[...q([0,1,0],0),...q([0,1,0],.045),...q([0,1,0],0)])]);
 const inspect=new THREE.AnimationClip('JointInspection',4,['left','right'].map((s,i)=>new THREE.QuaternionKeyframeTrack(`doll_upperarm_${s}.quaternion`,[0,1,3,4],[...q([0,0,1],0),...q([0,0,1],i?.18:-.18),...q([0,0,1],i?.18:-.18),...q([0,0,1],0)])));
 root.animations=[idle,inspect];root.updateMatrixWorld(true);return root;
}
