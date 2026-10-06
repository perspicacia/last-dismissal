import {SCHOOL_TONE} from './school-tone.js?v=shadow-tone-1';
import {regularClassroom,ROOM_AMBIENCE} from './exploration.js?v=mouse-comfort-1';
import {ROOM_HAUNTINGS,windowGaze,bouncePose,ghostSmileAmount} from './room-hauntings.js';
import {drawGhostSmile} from './ghost-smile-shape.js';
import {DOLL, dollRise} from './doll-event.js';
import { classroomWindowColumn } from './campus-view.js';
import { drawSceneDepth } from './scene-depth.js?v=shadow-tone-1';
import {pianoBoyQuad,drawPianoBoy,pianoBoyLook} from './piano-boy.js';
import {facelessStudentQuad,drawFacelessStudent} from './faceless-student.js';
import {SCHOOL_WINDOW,CLASSROOM_WINDOWS,windowPanes} from './school-windows.js';
import {drawBlackCat} from './black-cat.js?v=cat-boy-likeness-1';
import {buildSeatedGirl,seatedGirlLook,drawFigureVolume} from './ghost-figures.js?v=cat-boy-likeness-1';
import {boardCanvas,drawClassroomBoard} from './classroom-board.js?v=chalk-writing-1';
import {movementDelta} from './movement.js?v=mouse-comfort-1';
const boards=new Map(),figures=new Map();
function seatedGirl(){if(!figures.has('girl'))figures.set('girl',buildSeatedGirl());return figures.get('girl');}
export const CLASSROOM_SPAWN = { x: 0, z: 1.4, angle: 0 };
export const CLASSROOM_TEACHER_DESK = { x: -.5, z: 8.7, width: 2, depth: .65, height: .72 };
export const CLASSROOM_DESKS = [-2.5, 1.2, 2.8].flatMap(x => [3.2, 5, 6.8].map(z => ({x,z,width:1.1,depth:.65,height:.76})));
export function moveClassroomPlayer(player, keys, dt, blockers=null, extraBlockers=[]) {
  const {angle,dx,dz}=movementDelta(player,keys,dt);
  const result={...player,angle};
  const blocked=(x,z)=>[...(blockers||[...CLASSROOM_DESKS,CLASSROOM_TEACHER_DESK]),...extraBlockers].some(d=>Math.abs(x-d.x)<d.width/2+.22 && Math.abs(z-d.z)<d.depth/2+.22)||(!blockers&&CLASSROOM_DESKS.some(d=>Math.abs(x-d.x)<.45 && Math.abs(z-(d.z-.72))<.42));
  const x=Math.max(-4,Math.min(4,player.x+dx));
  if(!blocked(x,result.z))result.x=x;
  const z=Math.max(.8,Math.min(9.2,player.z+dz));
  if(!blocked(result.x,z))result.z=z;
  return result;
}

// Geometry uses the same world units as movement; desks cannot be walked through.
export function drawClassroom(c,w,h,p,time,exterior=null,doll=null,kind='classroom') {
  const lens=w*.68,horizon=h*.48+(p.manualLook?Math.tan(p.pitch||0):kind==='classroom'?seatedGirlLook(p):pianoBoyLook(p,doll?.boy,ROOM_AMBIENCE[kind]?.boy))*lens;
  const project=(x,y,z)=>{const dx=x-p.x,dz=z-p.z,d=dx*Math.sin(p.angle)+dz*Math.cos(p.angle);return d>.08?{x:w/2+(dx*Math.cos(p.angle)-dz*Math.sin(p.angle))*lens/d,y:horizon+(1.5-y)*lens/d,d}:null;};
  c.fillStyle=SCHOOL_TONE.canvasCeilingTop;c.fillRect(0,0,w,horizon);c.fillStyle='#3b322e';c.fillRect(0,horizon,w,h);
  // Perspective wooden boards, knots and faint cold window reflections.
  for(let y=Math.max(0,Math.ceil(horizon)+1);y<h;y+=4){const d=1.5*lens/(y-horizon);if(d>30)continue;for(let x=0;x<w;x+=4){const a=(x-w/2)*d/lens,wx=p.x+Math.sin(p.angle)*d+Math.cos(p.angle)*a,wz=p.z+Math.cos(p.angle)*d-Math.sin(p.angle)*a;const row=Math.floor(wx/.24),seam=((wz+((row%3)*.63))%1.9+1.9)%1.9;const grain=Math.sin(wz*10+row*8)*3;const v=45+(Math.sin(row*19)*9)+grain;c.fillStyle=`rgb(${v+18},${v+8},${v+4})`;if(d<8&&((((wx%.24)+.24)%.24)<.012||seam<.022))c.fillStyle=`rgb(${v+10},${v},${v-4})`;c.fillRect(x,y,4,4);}}

  for(let sx=0;sx<w;sx+=3){const offset=Math.atan((sx-w/2)/lens),a=p.angle+offset,dx=Math.sin(a),dz=Math.cos(a),tx=Math.abs(dx)<1e-9?Infinity:((dx>0?4.4:-4.4)-p.x)/dx,tz=Math.abs(dz)<1e-9?Infinity:((dz>0?9.8:0)-p.z)/dz,side=tx<tz,dist=side?tx:tz,depth=dist*Math.cos(offset),wx=p.x+dx*dist,wz=p.z+dz*dist;const height=3*lens/depth,top=horizon-height*.5;
    const drawBand=(from,to,color)=>{c.fillStyle=color;c.fillRect(sx,top+from*height,3,(to-from)*height+1);};
    drawBand(0,.57,SCHOOL_TONE.plaster);drawBand(.57,.97,SCHOOL_TONE.panel);drawBand(.56,.58,SCHOOL_TONE.trim);drawBand(.97,1,'#14262b');
    if(side&&dx<0&&wz>1.8&&wz<8.9){const {sill,top:wt,transom,rail}=SCHOOL_WINDOW,from=(3-wt)/3,to=(3-sill)/3,bay=CLASSROOM_WINDOWS.find(b=>wz>=b.start&&wz<=b.end);
      drawBand(from,to,'#091d2a');if(exterior)c.drawImage(exterior,classroomWindowColumn(wz,exterior.width),0,1,exterior.height,sx,top+from*height,3,(to-from)*height);
      if([bay.start,bay.end,(bay.start+bay.end)/2].some(z=>Math.abs(wz-z)<rail/2))drawBand(from,to,'#91663d');
      for(const y of [sill,transom,wt])drawBand((3-y-rail/2)/3,(3-y+rail/2)/3,'#a17748');drawBand(to,to+.032,'#b18752');
      if(Math.abs(wz-((bay.start+bay.end)/2+.115))<.018)drawBand((3-1.53)/3,(3-1.35)/3,'#777265');}
    if(!side&&dz<0){if(wx<-2.7){drawBand(.23,.92,'#6e7561');if((wx+4.4)%.55<.035)drawBand(.23,.92,'#354637');drawBand(.49,.51,'#394b3c');drawBand(.72,.74,'#394b3c');}if(wx>-.75&&wx<.75){drawBand(.13,1,'#76654d');drawBand(.18,.44,'#112b39');drawBand(.6,.62,'#b7b29b');}}
    c.fillStyle=`rgba(0,8,18,${Math.min(.7,depth*.045)})`;c.fillRect(sx,top,3,height);
  }
  const haunting=doll?.haunting||{scene:kind,ballTime:0,smile:0,last:time};
  if(haunting.scene!==kind){Object.assign(haunting,{scene:kind,ballTime:0,smile:0,last:time});}
  const dt=Math.min(.05,Math.max(0,(time-haunting.last)/1000));haunting.last=time;
  const reduced=typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches,active=!doll?.ended;
  const clipWindows=()=>{c.beginPath();for(const bay of CLASSROOM_WINDOWS)for(const pane of windowPanes(bay)){const points=[[-4.28,pane.bottom,pane.start],[-4.28,pane.top,pane.start],[-4.28,pane.top,pane.end],[-4.28,pane.bottom,pane.end]].map(v=>project(...v));if(points.every(Boolean)){points.forEach((v,i)=>i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.closePath();}}c.clip();};
  const ball=ROOM_HAUNTINGS[kind]?.ball;
  if(ball){const watching=active&&!reduced&&windowGaze(p,ball);if(watching)haunting.ballTime+=dt;const pose=bouncePose(haunting.ballTime,{...ball,reduced}),pos=project(ball.x,pose.height,ball.z);if(pos){c.save();clipWindows();const r=ball.radius*lens/pos.d;c.fillStyle='#93613c';c.beginPath();c.arc(pos.x,pos.y,r,0,Math.PI*2);c.fill();c.strokeStyle='#261d17';c.lineWidth=Math.max(1,r*.04);c.stroke();c.beginPath();c.ellipse(pos.x,pos.y,r*.44,r,pose.rotation,0,Math.PI*2);c.stroke();c.restore();}haunting.ballActive=watching;haunting.ballHeight=pose.height;}
  const ghost=ROOM_AMBIENCE[kind]?.ghost;
  if(ghost&&doll?.ghost?.naturalWidth){const pos=project(ghost.x,ghost.y,ghost.z),target=ghostSmileAmount(p,ghost,{active});haunting.smile=active?(reduced?target:haunting.smile+(target-haunting.smile)*(1-Math.exp(-dt*5))):0;if(pos){const height=ghost.height*lens/pos.d,width=height*2/3;c.save();clipWindows();c.translate(pos.x,pos.y);c.rotate(-haunting.smile*.12);c.drawImage(doll.ghost,-width/2,-height/2,width,height);if(haunting.smile>.02){c.globalAlpha=haunting.smile;c.translate(width*.006,height*(.173-.5));c.scale(height*(.5+haunting.smile*.22),height*(.22+haunting.smile*.44));drawGhostSmile(c);}c.restore();}}
  if(regularClassroom(kind)){if(!boards.has(kind))boards.set(kind,boardCanvas(kind));drawClassroomBoard(c,project,boards.get(kind));}
  const faces=[];
  if(kind==='classroom'){const girl=seatedGirl(),center=project(girl.position.x,.8,girl.position.z);if(center)faces.push({d:center.d,draw:()=>drawFigureVolume(c,project,girl)});}
  if(doll?.cat){const pos=project(doll.cat.x,doll.cat.y+.25,doll.cat.z);if(pos)faces.push({d:pos.d,draw:()=>drawBlackCat(c,project,doll.cat)});}
  const polygon=(vertices,color)=>{const pts=vertices.map(v=>project(...v));if(pts.every(Boolean))faces.push({pts,color,d:pts.reduce((s,v)=>s+v.d,0)/pts.length});};
  const box=(x,y,z,width,height,depth,colors)=>{const l=x-width/2,r=x+width/2,n=z-depth/2,f=z+depth/2,t=y+height;polygon([[l,t,n],[r,t,n],[r,t,f],[l,t,f]],colors[0]);polygon([[l,y,n],[r,y,n],[r,t,n],[l,t,n]],colors[1]);polygon([[l,y,f],[r,y,f],[r,t,f],[l,t,f]],colors[1]);polygon([[l,y,n],[l,y,f],[l,t,f],[l,t,n]],colors[2]);polygon([[r,y,n],[r,y,f],[r,t,f],[r,t,n]],colors[2]);};
  for(const desk of regularClassroom(kind)?CLASSROOM_DESKS:[]){const {x,z,width,depth}=desk;for(const dx of [-.43,.43])for(const dz of [-.22,.22])box(x+dx,0,z+dz,.045,.72,.045,['#95a6a2','#65736e','#3d504d']);box(x,.71,z,width,.06,depth,['#9c8360','#6d563c','#7a644a']);box(x,.53,z,.96,.08,.48,['#4c4739','#554936','#4a3c2f']);box(x,.38,z-.72,.55,.055,.46,['#897854','#5d533d','#746548']);box(x,.43,z-.96,.55,.43,.065,['#8f7d56','#716247','#514b3b']);for(const dx of [-.2,.2])for(const dz of [-.15,.15])box(x+dx,0,z-.72+dz,.035,.4,.035,['#8a9992','#5f7168','#34493d']);}
  // Teacher's desk anchors the classroom front.
  const teacher=CLASSROOM_TEACHER_DESK;if(regularClassroom(kind))box(teacher.x,0,teacher.z,teacher.width,teacher.height,teacher.depth,['#948064','#51493a','#685b47']);
  if(kind==='music'){
    box(3.38,0,7.35,.8,1.4,2.45,['#53382c','#211b18','#35231b']);
    box(2.98,.82,7.35,.32,.055,2.15,['#e0ddcd','#b9b9ad','#ccc8ba']);
    box(2.68,0,7.35,.42,.52,.65,['#69482d','#3d3327','#56412d']);
    box(-2.65,0,4.8,1.5,.85,1.2,['#afac98','#68372d','#523128']);
    box(-2.4,0,7.8,.06,1.2,.06,['#999','#666','#888']);
    box(-2.4,1.2,7.8,.7,.5,.025,['#ddd','#ccc','#eee']);
    box(-2.4,0,6.95,.65,.5,.42,['#69482d','#3d3327','#56412d']);
    box(3.55,.12,3.1,.5,.75,.15,['#bc894b','#916733','#a47739']);
    box(3.55,.85,3.1,.075,.75,.07,['#604128','#39291d','#58371f']);
  }
  if(kind==='dance'){
    box(4.22,.6,5.275,.1,2.15,5.75,['#8ba9ab','#6d8992','#6d8992']);
    for(const x of [-3.3,3.3])box(x,0,8.8,.58,1.04,.5,['#333','#171c22','#242b30']);
    for(const z of [2.6,5.4,8.5])box(-4,0,z,.05,1.15,.05,['#aaa','#666','#888']);
    for(const y of [.73,1.13])box(-4,y,5.5,.08,.08,6.2,['#ab9570','#7d684e','#8b795b']);
  }
  const boy=ROOM_AMBIENCE[kind]?.boy,quad=pianoBoyQuad(project,doll?.boy,boy);
  if(quad){for(const [x,y,width,depth] of [[boy.x,.009,.32,.30],[2.68,boy.y+.003,.36,.44]])polygon([[x-width/2,y,boy.z-depth/2],[x+width/2,y,boy.z-depth/2],[x+width/2,y,boy.z+depth/2],[x-width/2,y,boy.z+depth/2]],'#00000060');faces.push({d:quad.reduce((sum,p)=>sum+p.d,0)/4,draw:()=>drawPianoBoy(c,project,doll.boy,boy)});}
  const student=ROOM_AMBIENCE[kind]?.faceless,studentQuad=facelessStudentQuad(project,doll?.faceless,student);
  if(studentQuad){const {x,z}=student;polygon([[x-.27,.01,z-.19],[x+.27,.01,z-.19],[x+.27,.01,z+.19],[x-.27,.01,z+.19]],'#00000080');faces.push({d:studentQuad.reduce((sum,p)=>sum+p.d,0)/4,draw:()=>drawFacelessStudent(c,project,doll.faceless,student)});}
  faces.sort((a,b)=>b.d-a.d);for(const face of faces){if(face.draw){face.draw();continue;}c.fillStyle=face.color;c.strokeStyle='#10202980';c.lineWidth=.7;c.beginPath();face.pts.forEach((v,i)=>i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.closePath();c.fill();c.stroke();}
  drawSceneDepth(c,project,p,{classroom:true});
  if(doll&&kind==='classroom'){const rise=dollRise(doll.state),image=rise>.25?doll.scary:doll.image;const pos=project(DOLL.x,rise>.2?.04:.16,DOLL.z-.6);if(pos&&image?.naturalWidth){const unit=lens/pos.d;c.save();c.translate(pos.x,pos.y);c.rotate(-Math.PI/2*(1-rise));c.drawImage(image,-DOLL.height*unit/3,-DOLL.height*unit,DOLL.height*unit*2/3,DOLL.height*unit);c.restore();}}
  const ambience=ROOM_AMBIENCE[kind];
  if(ambience?.student&&doll?.image?.naturalWidth){const a=ambience.student,pos=project(a.x,a.y+.09,a.z-a.height/2);if(pos){const unit=lens/pos.d;c.save();c.translate(pos.x,pos.y);c.rotate(-Math.PI/2);c.drawImage(doll.image,-a.height*unit/3,-a.height*unit/2,a.height*unit*2/3,a.height*unit);c.restore();}}

  const corner=ROOM_HAUNTINGS[kind]?.corner;if(corner){const pos=project(corner.x,.48,corner.z);if(pos){const unit=lens/pos.d;c.fillStyle='#111c1b';c.beginPath();c.ellipse(pos.x,pos.y,.27*unit,.43*unit,0,0,Math.PI*2);c.fill();c.beginPath();c.ellipse(pos.x,pos.y-.30*unit,.14*unit,.18*unit,0,0,Math.PI*2);c.fill();c.fillStyle='#929a80';for(const x of [-.04,.04]){c.beginPath();c.ellipse(pos.x+x*unit,pos.y-.31*unit,.009*unit,.005*unit,0,0,Math.PI*2);c.fill();}}}
  const shade=c.createRadialGradient(w/2,h/2,w*.15,w/2,h/2,w*.7);shade.addColorStop(0,'transparent');shade.addColorStop(1,'#000915c0');c.fillStyle=shade;c.fillRect(0,0,w,h);
}
