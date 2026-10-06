import * as THREE from './vendor/three.module.js';
import {pianoBoyLayout} from './piano-boy.js';
import {preparePianoBoyBody} from './piano-boy-body.js?v=human-shape-2';

// Preserve photographed X/Y and UV positions while sculpting BOTH surfaces.
// Facial landmarks need gentler depth than the surrounding skull silhouette:
// a spherical forehead-to-chin taper compresses the photo at close range.
export function buildPianoBoyVolume(pixels,width,height,pose,columns=256,rows=384){
 const stride=columns+1,active=new Uint8Array(columns*rows),dist=new Float32Array(stride*(rows+1));
 const sample=(u,v)=>4*(Math.min(height-1,Math.round(v*(height-1)))*width+Math.min(width-1,Math.round(u*(width-1))));
 for(let y=0;y<rows;y++)for(let x=0;x<columns;x++)active[y*columns+x]=pixels[sample((x+.5)/columns,(y+.5)/rows)+3]>96;
 // Close narrow hair-strand cracks in geometry, while retaining original alpha.
 for(let y=1;y<rows*.23;y++)for(let x=1;x<columns-1;x++)if(!active[y*columns+x]&&active[y*columns+x-1]&&active[y*columns+x+1])active[y*columns+x]=1;
 const cell=(x,y)=>x>=0&&x<columns&&y>=0&&y<rows&&active[y*columns+x];
 for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++)dist[y*stride+x]=cell(x-1,y-1)&&cell(x,y-1)&&cell(x-1,y)&&cell(x,y)?1000:0;
 const dx=pose.width/columns,dy=pose.height/rows,diagonal=Math.hypot(dx,dy);
 for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++){const i=y*stride+x;if(x)dist[i]=Math.min(dist[i],dist[i-1]+dx);if(y)dist[i]=Math.min(dist[i],dist[i-stride]+dy);if(x&&y)dist[i]=Math.min(dist[i],dist[i-stride-1]+diagonal);if(x<columns&&y)dist[i]=Math.min(dist[i],dist[i-stride+1]+diagonal);}
 for(let y=rows;y>=0;y--)for(let x=columns;x>=0;x--){const i=y*stride+x;if(x<columns)dist[i]=Math.min(dist[i],dist[i+1]+dx);if(y<rows)dist[i]=Math.min(dist[i],dist[i+stride]+dy);if(x<columns&&y<rows)dist[i]=Math.min(dist[i],dist[i+stride+1]+diagonal);if(x&&y<rows)dist[i]=Math.min(dist[i],dist[i+stride-1]+diagonal);}
 // Smooth the interior distance field, while keeping all contour seams closed.
 // Otherwise each alpha-mask row leaves a horizontal ridge on the shaded back.
 for(let pass=0;pass<4;pass++){
  const source=dist.slice();for(let y=1;y<rows;y++)for(let x=1;x<columns;x++){
   const i=y*stride+x;if(!source[i])continue;dist[i]=(source[i]*4+(source[i-1]+source[i+1]+source[i-stride]+source[i+stride])*2+source[i-stride-1]+source[i-stride+1]+source[i+stride-1]+source[i+stride+1])/16;
  }
 }
 const points=[],uv=[],colours=[],front=[],back=[],vertices=new Map(),colour=new THREE.Color();
 // Each region supplies front/back radii, rather than a deep rear attached to
 // a flat photograph. The thigh-to-shin center line creates a seated L profile.
 const regions=[
  [.497,.126,.151,.130,.108,.122], // skull (front profile is specialized below)
  [.497,.256,.085,.078,.065,.077], // neck
  [.497,.405,.252,.183,.115,.112], // rib cage / shirt
  [.323,.462,.080,.132,.105,.080], [.679,.462,.080,.132,.105,.080], // forearms
  [.402,.556,.080,.077,.117,.085], [.616,.556,.078,.077,.117,.085], // hands
  [.509,.589,.238,.073,.073,.245], // seated hips extend BACK onto the bench
  [.415,.624,.105,.106,.110,.110], [.611,.632,.101,.106,.110,.110], // thighs / knees
  [.438,.793,.064,.184,.064,.065], [.594,.810,.060,.171,.064,.065], // calves
  [.456,.948,.060,.054,.088,.053], [.550,.958,.055,.048,.088,.053] // feet
 ];
 const smooth=n=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n);};
 const union=(a,b)=>{const h=Math.max(0,.018-Math.abs(a-b))/.018;return Math.max(a,b)+.0045*h*h;};
 const fields=[new Float32Array(dist.length),new Float32Array(dist.length)];
 for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++){
  const u=x/columns,v=y/rows,i=y*stride+x;
  // An elliptical rim meets the contour with a side-facing tangent. A smooth
  // step with zero edge slope leaves a flat photo strip and a visible seam.
  const rimDistance=Math.min(1,dist[i]/.028),rim=Math.sqrt(1-(1-rimDistance)**2);
  for(const [region,[cx,cy,rx,ry,frontRadius,backRadius]] of regions.entries()){
   const r=1-((u-cx)/rx)**2-((v-cy)/ry)**2;if(r<=0)continue;
   const dome=Math.sqrt(r);if(region!==0)fields[0][i]=union(fields[0][i],frontRadius*dome);fields[1][i]=union(fields[1][i],backRadius*dome);
  }
  // Broad cranial curvature rounds the temples, while the face stays gently
  // convex through the jaw instead of tapering back into the neck below eyes.
  const head=1-((u-.497)/.151)**4-((v-.130)/.150)**4;
  if(head>0)fields[0][i]=union(fields[0][i],.096*Math.sqrt(head));
  const faceShell=1-((u-.500)/.112)**4-((v-.192)/.100)**4;
  if(faceShell>0)fields[0][i]=union(fields[0][i],.096*Math.sqrt(faceShell)*smooth((v-.120)/.022)*(1-smooth((v-.250)/.032)));
  // Features keep the source's alignment without a deep protruding nose.
  const bump=(cx,cy,rx,ry,d)=>d*Math.exp(-2*(((u-cx)/rx)**2+((v-cy)/ry)**2));
  fields[0][i]+=bump(.501,.190,.028,.036,.008)+bump(.447,.177,.041,.043,.003)+bump(.551,.177,.041,.043,.003)+bump(.50,.230,.048,.025,.003);
  fields[0][i]*=rim;fields[1][i]*=rim;
 }
 // Smooth joined anatomical regions without changing the photographed outline.
 for(const field of fields)for(let pass=0;pass<3;pass++){
  const source=field.slice();for(let y=1;y<rows;y++)for(let x=1;x<columns;x++){
   const i=y*stride+x;if(dist[i]<.028)continue;
   field[i]=(source[i]*4+source[i-1]+source[i+1]+source[i-stride]+source[i+stride])/8;
  }
 }
 const sourceTint=(u,v)=>{
  let r=0,g=0,b=0,total=0;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   const n=sample(Math.max(0,Math.min(1,u+dx*.006)),Math.max(0,Math.min(1,v+dy*.006))),weight=pixels[n+3]/255;
   r+=pixels[n]*weight;g+=pixels[n+1]*weight;b+=pixels[n+2]*weight;total+=weight;
  }
  if(total)colour.setRGB(r/total/255,g/total/255,b/total/255,THREE.SRGBColorSpace);
 };
 const sideColour=(u,v,rear)=>{
  const arm=v>.410&&v<.59&&(u<.409||u>.598),leg=v>.638;
  const grain=(Math.sin(u*347+v*187)+Math.sin(u*719-v*431))*.015;
  colour.set(arm||leg?'#bdb7ad':'#b7b2a7');
  if(v<.28){
   const hair=rear?v<.242:(v<.150||Math.abs(u-.497)>.113&&v<.234);
   // Only hair/skin swatches are sampled here, never the eyes or whole face.
   if(hair)sourceTint(.48,.060);
   else sourceTint(.552,.211);
  }else if(arm)sourceTint(u<.5?.319:.681,.474);
  else if(leg)sourceTint(u<.52?.440:.594,Math.min(.89,Math.max(.71,v)));
  else sourceTint(.5+(u-.5)*.25,Math.min(.59,v));
  colour.multiplyScalar(1+grain);return [colour.r,colour.g,colour.b];
 };
 const vertex=(x,y,rear)=>{
  const key=2*(y*stride+x)+Number(rear);if(vertices.has(key))return vertices.get(key);
  const u=x/columns,v=y/rows,i=y*stride+x;
  // Hips stay over the seat; knees and shins are in front of its fascia.
  const center=.025-.160*smooth((v-.52)/.13)-.047*smooth((v-.64)/.10);
  let z=center+(rear?fields[1][i]:-fields[0][i]);
  if(rear&&pose.top-v*pose.height<pose.top-(957/1536)*pose.height)z=Math.min(z,.030);
  points.push((u-.5)*pose.width,pose.top-v*pose.height,z);uv.push(u,1-v);colours.push(...sideColour(u,v,rear));
  const id=points.length/3-1;vertices.set(key,id);return id;
 };
 const contour=new Map(),pairs=new Map();
 const seal=(a,b)=>{
  back.push(a[0],b[1],b[0],a[0],a[1],b[1]);
  for(const [p,q] of [[a,b],[b,a]]){if(!contour.has(p[0]))contour.set(p[0],new Set());contour.get(p[0]).add(q[0]);pairs.set(p[0],p[1]);}
 };
 for(let y=0;y<rows;y++)for(let x=0;x<columns;x++)if(cell(x,y)){
  const a=[vertex(x,y,false),vertex(x,y,true)],b=[vertex(x+1,y,false),vertex(x+1,y,true)],c=[vertex(x,y+1,false),vertex(x,y+1,true)],d=[vertex(x+1,y+1,false),vertex(x+1,y+1,true)];
  front.push(a[0],b[0],c[0],b[0],d[0],c[0]);back.push(a[1],c[1],b[1],b[1],c[1],d[1]);
  if(!cell(x,y-1))seal(a,b);if(!cell(x+1,y))seal(b,d);if(!cell(x,y+1))seal(d,c);if(!cell(x-1,y))seal(c,a);
 }
 // Smooth only the pixel-stepped head outline, with the front and back seam
 // moving together. Update UV with XY so the photograph never stretches.
 for(let pass=0;pass<5;pass++){
  const source=points.slice();for(const [i,neighbours] of contour){
   if(1-uv[i*2+1]>=.28||neighbours.size!==2)continue;
   const [a,b]=[...neighbours],rear=pairs.get(i);
   for(const axis of [0,1]){const value=source[i*3+axis]*.5+(source[a*3+axis]+source[b*3+axis])*.25;points[i*3+axis]=points[rear*3+axis]=value;}
   uv[i*2]=uv[rear*2]=points[i*3]/pose.width+.5;uv[i*2+1]=uv[rear*2+1]=1-(pose.top-points[i*3+1])/pose.height;
  }
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colours,3));geometry.setIndex([...front,...back]);geometry.addGroup(0,front.length,0);geometry.addGroup(front.length,back.length,1);geometry.computeVertexNormals();
 const normals=geometry.attributes.normal,photoBlend=[],frontVertices=new Set(front);
 for(let i=0;i<normals.count;i++){
  const u=uv[i*2],v=1-uv[i*2+1];
  // Preserve both eyes, mouth and jaw even at the cheek-to-temple transition.
  // The back never receives facial photography.
  const isFront=frontVertices.has(i),face=isFront?smooth((u-.425)/.025)*smooth((.578-u)/.025)*smooth((v-.135)/.013)*smooth((.255-v)/.013):0;
  // The sampled alpha outline has small steps. Its alternating edge normals
  // must not turn the cheek/hair photograph into horizontal stripes.
  const outline=dist[Math.round(v*rows)*stride+Math.round(u*columns)];
  const surface=isFront&&v<.28?smooth(outline/.028):smooth((-normals.getZ(i)-.12)/.28);
  photoBlend.push(Math.max(face,surface));
 }
 geometry.setAttribute('photoBlend',new THREE.Float32BufferAttribute(photoBlend,1));geometry.computeBoundingBox();return geometry;
}
export function buildPianoBoyFigure(config){
 const root=new THREE.Group();root.name='piano-boy-ghost';root.visible=false;root.position.set(config.x,0,config.z);root.rotation.y=Math.PI/2;
 const photo=new THREE.MeshStandardMaterial({color:'#fff',vertexColors:true,roughness:.95,alphaTest:.035,emissive:'#fff',emissiveIntensity:.040});
 // Cross-fade the original photograph into the opaque anatomical side colour.
 // A hard front/rear material split reads as a cut-out pasted to a grey block.
 photo.onBeforeCompile=shader=>{
  shader.vertexShader='attribute float photoBlend;\nvarying float vPhotoBlend;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvPhotoBlend=photoBlend;');
  shader.fragmentShader='varying float vPhotoBlend;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
   #ifdef USE_MAP
    vec4 sourcePhoto=texture2D(map,vMapUv);
    float originalWeight=vPhotoBlend*smoothstep(.35,.95,sourcePhoto.a);
    diffuseColor.rgb*=mix(vColor.rgb,sourcePhoto.rgb,originalWeight);
    diffuseColor.a*=mix(1.0,sourcePhoto.a,vPhotoBlend);
   #else
    diffuseColor.rgb*=vColor.rgb;
   #endif`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','');
  shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance*=vPhotoBlend;');
 };
 photo.customProgramCacheKey=()=> 'piano-boy-photo-to-side-2';
 const back=new THREE.MeshStandardMaterial({color:'#fff',vertexColors:true,roughness:.94});
 const mesh=new THREE.Mesh(new THREE.BufferGeometry(),[photo,back]);mesh.name='piano-boy-original-volume';mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);
 root.userData={kind:'boy',config,photoMeshes:[mesh],volume:mesh,sourceImage:null,pose:pianoBoyLayout({naturalWidth:1024,naturalHeight:1536},config),bodySource:null,bodyStatus:'original'};return root;
}
// Adapt the free skull/jaw/neck while retaining the child's front photograph.
// Gentle facial depth preserves its landmarks; the sides remain an approximation.
export function buildPianoBoyHead(pixels,width,height,pose,source){
 if(!source?.attributes.position)throw new Error('Piano boy human head is empty');
 const g=source.clone(),p=g.attributes.position,n=g.attributes.normal,coords=[],colours=[],blend=[];
 const smooth=n=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n);};
 const sample=(u,v)=>4*(Math.max(0,Math.min(height-1,Math.round(v*(height-1))))*width+Math.max(0,Math.min(width-1,Math.round(u*(width-1)))));
 // The adult source's cheeks cannot surround the narrow photographed jaw as
 // a grey shelf. Fit only the outer front jaw, leaving the eyes and lips aligned.
 const left=new Float32Array(height).fill(-pose.width/2),right=new Float32Array(height).fill(pose.width/2);
 for(let row=Math.floor(height*.165);row<height*.24;row++){
  let min=width,max=-1;for(let x=0;x<width;x++)if(pixels[4*(row*width+x)+3]>192){min=Math.min(min,x);max=Math.max(max,x);}
  if(max>=min){left[row]=(min/(width-1)-.5)*pose.width;right[row]=(max/(width-1)-.5)*pose.width;}
 }
 const skinAt=sample(.48,.211),hairAt=sample(.48,.060);
 const skin=new THREE.Color().setRGB(pixels[skinAt]/255,pixels[skinAt+1]/255,pixels[skinAt+2]/255,THREE.SRGBColorSpace);
 const hair=new THREE.Color().setRGB(pixels[hairAt]/255,pixels[hairAt+1]/255,pixels[hairAt+2]/255,THREE.SRGBColorSpace);
 for(let i=0;i<p.count;i++){
  const v=(pose.top-p.getY(i))/pose.height,row=Math.max(0,Math.min(height-1,Math.round(v*(height-1)))),x=p.getX(i);
  const limit=x<0?-left[row]:right[row],outer=Math.max(0,Math.abs(x)-limit*.65),narrowed=Math.sign(x)*(Math.abs(x)-outer*.60);
  const jawWidth=smooth((v-.171)/.032)*(1-smooth((v-.230)/.016))*smooth((-p.getZ(i)+.01)/.07);
  p.setX(i,THREE.MathUtils.lerp(x,narrowed,jawWidth));
  const u=.5+p.getX(i)/pose.width;
  const face=smooth((u-.394)/.031)*(1-smooth((u-.606)/.031))*smooth((v-.119)/.026)*(1-smooth((v-.254)/.028))*smooth((-p.getZ(i)-.007)/.047);
  // The source nose/eye sockets must not emboss a second adult face beneath
  // the child's photograph. A gentle child surface keeps the original eyes,
  // mouth and nose registered; the free jaw, ears and neck form the profile.
  const bump=(cx,cy,rx,ry,depth)=>depth*Math.exp(-2*(((u-cx)/rx)**2+((v-cy)/ry)**2));
  const relief=bump(.501,.190,.028,.036,.008)+bump(.45,.181,.05,.045,.002)+bump(.55,.181,.05,.045,.002);
  const jaw=.003*smooth((v-.219)/.025);
  p.setZ(i,THREE.MathUtils.lerp(p.getZ(i),-.095-relief+jaw,face));
  coords.push(u,1-v);
  const faceSide=1-smooth((p.getZ(i)+.010)/.09),hairEnd=THREE.MathUtils.lerp(.191,.139,faceSide),hairWeight=1-smooth((v-hairEnd)/.035);
  const tint=skin.clone().lerp(hair,hairWeight).multiplyScalar(.99+.015*Math.sin(p.getX(i)*413+p.getY(i)*731));colours.push(tint.r,tint.g,tint.b);
  blend.push(0);
 }
 g.computeVertexNormals();
 for(let i=0;i<p.count;i++){const u=coords[i*2],v=1-coords[i*2+1],front=smooth((-n.getZ(i)-.05)/.65);blend[i]=front*smooth((pixels[sample(u,v)+3]/255-.25)/.65)*(1-smooth((v-.246)/.022));}
 g.setAttribute('uv',new THREE.Float32BufferAttribute(coords,2));g.setAttribute('color',new THREE.Float32BufferAttribute(colours,3));g.setAttribute('photoBlend',new THREE.Float32BufferAttribute(blend,1));g.clearGroups();g.addGroup(0,g.index.count,0);g.computeBoundingBox();return g;
}
export function attachPianoBoyBody(root,source){
 if(root.userData.bodySource===source)return;
 if(root.userData.body){const previous=root.userData.body;root.remove(previous);previous.geometry.dispose();previous.material.dispose();}
 root.userData.bodySource=source;root.userData.bodyStatus='ready';
 // The portrait already carries facial shadows. Avoid projecting those
 // baked shadows a second time onto the collar.
 root.userData.volume.castShadow=root.userData.volume.receiveShadow=false;
 const body=new THREE.Mesh(source.clone(),root.userData.volume.material[0].clone());body.name='piano-boy-free-body';body.castShadow=body.receiveShadow=true;
 // Material.clone does not retain custom shader callbacks.
 body.material.onBeforeCompile=shader=>{root.userData.volume.material[0].onBeforeCompile(shader);shader.fragmentShader=shader.fragmentShader.replace('diffuseColor.a*=mix(1.0,sourcePhoto.a,vPhotoBlend);','diffuseColor.a=1.0;');};body.material.customProgramCacheKey=()=> 'piano-boy-solid-body-photo-1';
 root.userData.body=body;root.add(body);
 const image=root.userData.sourceImage,texture=root.userData.sourceTexture;root.userData.sourceImage=null;
 if(image&&texture)setPianoBoyTexture(root,image,texture);
}
export function setPianoBoyTexture(root,image,texture){
 const pose=pianoBoyLayout(image,root.userData.config);root.visible=false;if(!pose)return false;
 if(root.userData.sourceImage!==image){
  const canvas=document.createElement('canvas');canvas.width=384;canvas.height=Math.round(384*image.naturalHeight/image.naturalWidth);
  const ctx=canvas.getContext('2d');if(!ctx)return false;ctx.drawImage(image,0,0,canvas.width,canvas.height);
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
  let opaque=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>96&&++opaque>=32)break;
  if(opaque<32)return false;
  const geometry=root.userData.bodySource?buildPianoBoyHead(pixels,canvas.width,canvas.height,pose,root.userData.bodySource.pianoBoyHead):buildPianoBoyVolume(pixels,canvas.width,canvas.height,pose);
  if(!geometry.index.count){geometry.dispose();return false;}
  root.userData.volume.geometry.dispose();root.userData.volume.geometry=geometry;root.userData.sourceImage=image;root.userData.pose=pose;
  if(root.userData.bodySource){const body=root.userData.body;body.geometry.dispose();body.geometry=preparePianoBoyBody(root.userData.bodySource,pose,pixels,canvas.width,canvas.height);}
 }
 const material=root.userData.volume.material[0];material.map=material.emissiveMap=texture;material.needsUpdate=true;root.userData.sourceTexture=texture;
 if(root.userData.body){const m=root.userData.body.material;m.map=m.emissiveMap=texture;m.needsUpdate=true;}
 root.visible=true;return true;
}
