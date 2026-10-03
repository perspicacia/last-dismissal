import * as THREE from './vendor/three.module.js';
export const CLASSROOM_BOARD=Object.freeze({x:-.2,y:1.80,z:9.64,width:5.40,height:1.55,depth:.12});
export function boardWriting(kind){return [kind==='classroom31'?'3학년 1반':kind==='classroom33'?'3학년 3반':'3학년 2반','오늘의 당번','민서 · 지우','칠판과 창문 정리'];}
// Resolve the local Korean handwriting before any cached board is built.
// A missing font falls back to the system without blocking game initialization.
let chalkFont='cursive';
if(typeof FontFace==='function'&&typeof document!=='undefined'&&document.fonts){
 try{const font=new FontFace('SchoolChalk',`url("${new URL('./assets/fonts/NanumPenScript-Regular.ttf',import.meta.url).href}")`);await font.load();document.fonts.add(font);chalkFont='"SchoolChalk", cursive';}catch{/* Optional appearance asset; keep the system fallback. */}
}
function boardRandom(kind){
 let seed=[...kind].reduce((n,char)=>Math.imul(n,31)+char.charCodeAt(0),137)>>>0;
 // Do not consume gameplay's Math.random when making decorative textures.
 return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
}
function chalkText(c,text,x,y,size,random,angle=0){
 const layer=document.createElement('canvas'),ink=layer.getContext('2d');ink.font=`${size}px ${chalkFont}`;
 const width=ink.measureText(text)?.width??size*text.length;
 layer.width=Math.ceil(width)+24;layer.height=Math.ceil(size*1.4);
 ink.font=`${size}px ${chalkFont}`;ink.fillStyle='#e1e4d5';ink.fillText(text,12,size);
 const pixels=ink.getImageData(0,0,layer.width,layer.height);
 if(pixels?.data){
  const data=pixels.data;
  for(let py=0;py<layer.height;py++)for(let px=0;px<layer.width;px++){
   const a=(py*layer.width+px)*4+3;if(!data[a])continue;
   const pressure=.84+.16*Math.sin(px*.09+Math.sin(py*.15)*2),grain=.42+.58*random();
   data[a]=Math.round(data[a]*pressure*grain*(random()<.075?.12:1));
  }
  ink.putImageData(pixels,0,0);
 }
 c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha=.13;c.shadowColor='#e1e4d5';c.shadowBlur=3;
 c.drawImage(layer,-12,-size);c.shadowBlur=0;c.globalAlpha=1;c.drawImage(layer,-12,-size);c.restore();
}
export function boardCanvas(kind){
 const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=420;const c=canvas.getContext('2d');
 const random=boardRandom(kind);
 c.fillStyle='#17463e';c.fillRect(0,0,1536,420);
 c.save();c.lineCap='round';
 for(let i=0;i<34;i++){
  const x=70+random()*1240,y=35+random()*340;
  c.globalAlpha=.013+random()*.018;c.strokeStyle='#b3c9b8';c.lineWidth=15+random()*35;
  c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+65,y-18+random()*36,x+110+random()*170,y-16+random()*32);c.stroke();
 }
 for(let i=0;i<14000;i++){
  c.fillStyle=i%3?'#bdcbb9':'#041e1b';c.globalAlpha=.018+random()*.05;
  c.fillRect(random()*1536,random()*420,.45+random()*1.4,.45+random()*1.4);
 }
 c.restore();
 const [room,duty,names,task]=boardWriting(kind);
 chalkText(c,room,60,83,64,random,-.009);chalkText(c,'10월 4일',66,142,48,random,.014);
 chalkText(c,duty,1080,89,64,random,-.018);chalkText(c,names,1098,153,54,random,.008);chalkText(c,task,1086,209,42,random,-.007);
 c.save();c.strokeStyle='#d1dac5';c.lineCap='round';
 for(let i=0;i<84;i++){const x=1082+i*3.1;c.globalAlpha=.35+random()*.45;c.lineWidth=1.3+random()*1.1;c.beginPath();c.moveTo(x,102+Math.sin(i*.06)*1.6);c.lineTo(x+2.9,102+Math.sin((i+1)*.06)*1.6);c.stroke();}
 c.restore();return canvas;
}
function box(g,name,p,size,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(...size),mat);m.name=name;m.position.set(...p);m.castShadow=m.receiveShadow=true;g.add(m);return m;}
export function buildClassroomBoard(kind){
 const b=CLASSROOM_BOARD,g=new THREE.Group();g.name='classroom-blackboard';g.position.set(b.x,b.y,b.z);
 const metal=new THREE.MeshStandardMaterial({color:'#97a09b',metalness:.75,roughness:.38}),dark=new THREE.MeshStandardMaterial({color:'#38443f',roughness:.9});
 box(g,'board-backing',[0,0,.035],[b.width,b.height,b.depth],dark);
 const map=new THREE.CanvasTexture(boardCanvas(kind));map.colorSpace=THREE.SRGBColorSpace;
 const green=new THREE.MeshStandardMaterial({color:'#17463e',roughness:.96}),writing=new THREE.MeshStandardMaterial({map,roughness:.96});
 const face=box(g,'board-writing',[0,0,-.040],[b.width-.12,b.height-.10,.025],[green,green,green,green,green,writing]);
 // The school uses mirrored world Z. Reverse the -Z face UVs so world X
 // still reads left to right from the classroom, matching the Canvas view.
 const uv=face.geometry.attributes.uv;for(let i=20;i<24;i++)uv.setX(i,1-uv.getX(i));
 for(const x of [-b.width/2,b.width/2])box(g,'board-aluminium-frame',[x,0,-.045],[.055,b.height+.055,.095],metal);
 for(const y of [-b.height/2,b.height/2])box(g,'board-aluminium-frame',[0,y,-.045],[b.width+.055,.055,.095],metal);
 box(g,'board-chalk-tray',[0,-b.height/2-.023,-.103],[b.width+.05,.035,.24],metal);
 box(g,'board-tray-lip',[0,-b.height/2+.006,-.219],[b.width+.05,.052,.022],metal);
 const chalkMat=new THREE.MeshStandardMaterial({color:'#dedfcb',roughness:1}),wood=new THREE.MeshStandardMaterial({color:'#9a774c',roughness:.8}),felt=new THREE.MeshStandardMaterial({color:'#4d5751',roughness:1});
 for(const [i,x] of [-1.82,-1.60,-1.39,.51].entries()){const m=new THREE.Mesh(new THREE.CylinderGeometry(.011,.011,.085+i*.01,10),chalkMat);m.name='board-chalk';m.rotation.z=Math.PI/2;m.rotation.y=i*.15;m.position.set(x,-b.height/2+.005,-.116);m.castShadow=true;g.add(m);}
 for(const x of [-.74,.11]){box(g,'board-eraser-felt',[x,-b.height/2+.010,-.125],[.23,.026,.084],felt);box(g,'board-eraser-wood',[x,-b.height/2+.038,-.125],[.24,.029,.088],wood);}
 g.userData.texture=map;return g;
}
export function drawClassroomBoard(c,project,texture){
 const b=CLASSROOM_BOARD,points=[[-b.width/2,b.height/2],[b.width/2,b.height/2],[b.width/2,-b.height/2],[-b.width/2,-b.height/2]].map(([x,y])=>project(b.x+x,b.y+y,b.z-.06));if(!points.every(Boolean))return;
 // Facing the back wall keeps vertical edges vertical; horizontal strips carry
 // the same original writing into the compatibility perspective.
 c.strokeStyle='#8e9992';c.lineWidth=5;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.stroke();
 for(let i=0;i<80;i++){const a=i/80,d=(i+1)/80,top=points[0].y*(1-a)+points[1].y*a,bottom=points[3].y*(1-a)+points[2].y*a,x=points[0].x*(1-a)+points[1].x*a,nextX=points[0].x*(1-d)+points[1].x*d;c.drawImage(texture,a*texture.width,0,texture.width/80,texture.height,x,top,nextX-x+1,bottom-top);}
 const left=project(b.x-b.width/2,b.y-b.height/2,b.z-.20),right=project(b.x+b.width/2,b.y-b.height/2,b.z-.20);if(!left||!right)return;
 c.strokeStyle='#86918b';c.lineWidth=7;c.beginPath();c.moveTo(left.x,left.y);c.lineTo(right.x,right.y);c.stroke();
 for(const x of [-1.8,-1.6,-1.4]){const a=project(b.x+x,b.y-b.height/2+.02,b.z-.13),r=project(b.x+x+.09,b.y-b.height/2+.02,b.z-.13);if(a&&r){c.strokeStyle='#dedfcb';c.lineWidth=3;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(r.x,r.y);c.stroke();}}
 for(const x of [-.74,.11]){const a=project(b.x+x-.12,b.y-b.height/2+.06,b.z-.14),d=project(b.x+x+.12,b.y-b.height/2+.02,b.z-.14);if(a&&d){c.fillStyle='#a48859';c.fillRect(a.x,a.y,d.x-a.x,Math.max(3,d.y-a.y));}}
}
