import * as THREE from './vendor/three.module.js';
import {pianoBoyLayout} from './piano-boy.js';

// Keep photographed X/Y and UV positions together. A shallow facial surface
// preserves identity; the independently rounded back supplies head/body depth.
export function buildPianoBoyVolume(pixels,width,height,pose,columns=160,rows=240){
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
 const depthProfile=[[0,.25],[.20,.25],[.28,.245],[.50,.245],[.57,.22],[.64,.18],[.70,.17],[.80,.105],[.90,.105],[.97,.12],[1,.12]];
 // Rear-only anatomical domes preserve the original front image. Unlike a
 // uniform extrusion they taper the skull, shoulders, arms and shins in profile.
 const rearVolumes=[[.497,.126,.141,.128,.25],[.497,.254,.075,.075,.11],[.497,.406,.250,.192,.245],[.320,.459,.070,.115,.12],[.687,.465,.070,.115,.12],[.515,.578,.220,.086,.19],[.415,.646,.074,.085,.17],[.617,.651,.078,.085,.17],[.436,.794,.052,.175,.112],[.597,.817,.049,.16,.108],[.457,.946,.056,.047,.12],[.554,.963,.049,.041,.12]];
 const smooth=n=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n);};
 const vertex=(x,y,rear)=>{
  const key=2*(y*stride+x)+Number(rear);if(vertices.has(key))return vertices.get(key);
  const u=x/columns,v=y/rows,round=Math.sin(Math.min(1,dist[y*stride+x]/.055)*Math.PI/2);
  let k=0;while(k<depthProfile.length-2&&v>depthProfile[k+1][0])k++;
  const depth=THREE.MathUtils.lerp(depthProfile[k][1],depthProfile[k+1][1],smooth((v-depthProfile[k][0])/(depthProfile[k+1][0]-depthProfile[k][0])));
  // Below the photographed thigh-support line the back stays ahead of the
  // bench fascia. The shins and feet extend naturally toward the aisle.
  const seam=THREE.MathUtils.lerp(.012,Math.min(-.035,.030-depth),smooth((v-.54)/.083));
  const nose=.012*Math.exp(-2*(((u-.506)/.033)**2+((v-.190)/.031)**2));
  const face=v<.25?.030:.037;
  let rearDepth=0;for(const [cx,cy,rx,ry,d] of rearVolumes){const radius=1-((u-cx)/rx)**2-((v-cy)/ry)**2;if(radius<=0)continue;const value=d*Math.sqrt(radius),blend=Math.max(0,.025-Math.abs(value-rearDepth))/.025;rearDepth=Math.max(rearDepth,value)+.00625*blend*blend;}
  const z=rear?seam+Math.min(depth,rearDepth)*round:seam-face*round-nose*round;
  points.push((u-.5)*pose.width,pose.top-v*pose.height,z);uv.push(u,1-v);
  colour.set(v<.22?'#171b1d':v<.29?'#b5b2ac':v<.64?'#b6b2a7':'#b3b0a8');colours.push(colour.r,colour.g,colour.b);
  const id=points.length/3-1;vertices.set(key,id);return id;
 };
 const seal=(a,b)=>back.push(a[0],b[1],b[0],a[0],a[1],b[1]);
 for(let y=0;y<rows;y++)for(let x=0;x<columns;x++)if(cell(x,y)){
  const a=[vertex(x,y,false),vertex(x,y,true)],b=[vertex(x+1,y,false),vertex(x+1,y,true)],c=[vertex(x,y+1,false),vertex(x,y+1,true)],d=[vertex(x+1,y+1,false),vertex(x+1,y+1,true)];
  front.push(a[0],b[0],c[0],b[0],d[0],c[0]);back.push(a[1],c[1],b[1],b[1],c[1],d[1]);
  if(!cell(x,y-1))seal(a,b);if(!cell(x+1,y))seal(b,d);if(!cell(x,y+1))seal(d,c);if(!cell(x-1,y))seal(c,a);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colours,3));geometry.setIndex([...front,...back]);geometry.addGroup(0,front.length,0);geometry.addGroup(front.length,back.length,1);geometry.computeVertexNormals();geometry.computeBoundingBox();return geometry;
}
export function buildPianoBoyFigure(config){
 const root=new THREE.Group();root.name='piano-boy-ghost';root.visible=false;root.position.set(config.x,0,config.z);root.rotation.y=Math.PI/2;
 const photo=new THREE.MeshStandardMaterial({color:'#fff',roughness:.95,transparent:true,alphaTest:.035,emissive:'#fff',emissiveIntensity:.085});
 const back=new THREE.MeshStandardMaterial({color:'#fff',vertexColors:true,roughness:.94});
 const mesh=new THREE.Mesh(new THREE.BufferGeometry(),[photo,back]);mesh.name='piano-boy-original-volume';mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);
 root.userData={kind:'boy',config,photoMeshes:[mesh],volume:mesh,sourceImage:null,pose:pianoBoyLayout({naturalWidth:1024,naturalHeight:1536},config)};return root;
}
export function setPianoBoyTexture(root,image,texture){
 const pose=pianoBoyLayout(image,root.userData.config);root.visible=false;if(!pose)return false;
 if(root.userData.sourceImage!==image){
  const canvas=document.createElement('canvas');canvas.width=288;canvas.height=Math.round(288*image.naturalHeight/image.naturalWidth);
  const ctx=canvas.getContext('2d');if(!ctx)return false;ctx.drawImage(image,0,0,canvas.width,canvas.height);
  const geometry=buildPianoBoyVolume(ctx.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height,pose);
  if(!geometry.index.count){geometry.dispose();return false;}
  root.userData.volume.geometry.dispose();root.userData.volume.geometry=geometry;root.userData.sourceImage=image;root.userData.pose=pose;
 }
 const material=root.userData.volume.material[0];material.map=material.emissiveMap=texture;material.needsUpdate=true;root.visible=true;return true;
}
