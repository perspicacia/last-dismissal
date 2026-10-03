import {ROOMS,ROOM_AMBIENCE} from './exploration.js?v=faceless-student-1';
import {facelessStudentBlocker} from './faceless-student.js';
import {raisedArms,rabbitParts,drawRabbitPose} from './rabbit-pose.js';
import {rabbitArrival,rabbitSize} from './rabbit-arrival.js';
import { newDollState, advanceDoll, facingDoll, DOLL, dollRise } from './doll-event.js';
import { ThreeSchoolView } from './three-school.js?v=faceless-student-1';
import {SchoolLighting,recordLighting,shadeCanvasSchool} from './school-lighting.js';
import { drawClockFace, drawWallClock } from './clock.js';
import { drawSceneDepth } from './scene-depth.js?v=horror-lighting-1';
import { drawStairs } from './stairs.js';
import { drawCampusView, CAMPUS_WIDTH } from './campus-view.js';
import { drawWindowView } from './window-view.js';
import { CLASSROOM_SPAWN, moveClassroomPlayer, drawClassroom } from './classroom.js?v=faceless-student-1';
import {ROOM_BLOCKERS} from './room-props.js';
import { SPAWN, movePlayer, nearbyItem, revealsTeeth } from './movement.js';

const names = {door:'교실',board:'게시판',window:'창문',clock:'시계',figure:'토끼 마스코트',doll:'학생 인형'};
export class Corridor {
  constructor(canvas, onPosition, onStep, onReveal = () => {}) {
    this.canvas=canvas;this.use3D=canvas.dataset.renderer==='three'; this.ctx=this.use3D?null:canvas.getContext('2d'); this.onPosition=onPosition;this.onStep=onStep;
    this.scene="corridor";this.corridorPlayer=null;this.keys=new Set();this.player={...SPAWN};this.active=false;this.anomaly=null;this.steps=0;
    this.windowGhost = new Image();
    this.windowGhost.onload = () => this.buildTextures();
    this.windowGhost.src = new URL('./assets/window-ghost.png', import.meta.url).href;
    this.pianoBoy=new Image();this.canvas.dataset.pianoBoyStatus='loading';
    this.pianoBoy.onload=()=>{this.canvas.dataset.pianoBoyStatus='ready';this.view3D?.syncTextures(this);};
    this.pianoBoy.onerror=()=>{this.canvas.dataset.pianoBoyStatus='unavailable';this.view3D?.syncTextures(this);};
    this.pianoBoy.src=new URL('./assets/piano-boy-ghost.png',import.meta.url).href;
    this.facelessStudent=new Image();this.canvas.dataset.facelessStudentStatus='loading';
    this.facelessStudent.onload=()=>{this.canvas.dataset.facelessStudentStatus='ready';this.view3D?.syncTextures(this);};
    this.facelessStudent.onerror=()=>{this.canvas.dataset.facelessStudentStatus='unavailable';this.view3D?.syncTextures(this);};
    this.facelessStudent.src=new URL('./assets/faceless-student.png',import.meta.url).href;
    this.mascot = new Image();
    this.mascot.src = new URL('./assets/mascot-rabbit.png', import.meta.url).href;
    this.mascotOpen = new Image();
    this.mascotOpen.src = new URL('./assets/mascot-rabbit-open.png', import.meta.url).href;
    this.boardPhoto = new Image();
    this.boardPhotoErased = new Image();
    for (const [image, path] of [[this.boardPhoto, './assets/school-group-photo.png'], [this.boardPhotoErased, './assets/school-group-photo-erased.png']]) {
      image.onload = () => this.buildTextures();
      image.src = new URL(path, import.meta.url).href;
    }
    this.mouthOpen = false; this.onReveal = onReveal;this.dollState=newDollState();
    this.dollImage=new Image();this.dollScary=new Image();
    for(const [image,path] of [[this.dollImage,'./assets/doll-student-concept.png'],[this.dollScary,'./assets/doll-student-open-slit-eyes.png']]){image.onload=()=>this.view3D?.syncTextures(this);image.src=new URL(path,import.meta.url).href;}
    this.buildTextures();
    if(this.use3D){
      try {this.view3D=new ThreeSchoolView(canvas,this);for(const image of [this.mascot,this.mascotOpen])image.addEventListener('load',()=>this.view3D.syncTextures(this));}
      catch(error){
        console.warn('3D 화면 초기화 실패, Canvas 호환 화면으로 전환합니다.',error);
        const fallback=canvas.cloneNode();canvas.replaceWith(fallback);canvas=fallback;this.canvas=fallback;
        this.use3D=false;this.view3D=null;this.ctx=fallback.getContext('2d');fallback.dataset.rendererReady='canvas';
        const intro=document.getElementById('intro');if(intro){const notice=document.createElement('p');notice.className='compat-notice';notice.textContent='호환 화면으로 실행합니다.';(intro.querySelector('.intro-content')||intro).append(notice);}
      }
    }
    this.resize();
    new ResizeObserver(()=>this.resize()).observe(canvas);
    window.addEventListener('blur',()=>this.keys.clear());
    document.addEventListener('visibilitychange',()=>this.keys.clear());
    this.focused=document.hasFocus();window.addEventListener('blur',()=>this.focused=false);window.addEventListener('focus',()=>this.focused=true);
    this.last=0;requestAnimationFrame(t=>this.frame(t));
  }
  resize() { if(this.view3D){this.view3D.resize();return;}this.canvas.width=Math.min(1100,Math.max(375,Math.round(this.canvas.clientWidth)));this.canvas.height=Math.round(this.canvas.width*(this.canvas.clientHeight/Math.max(1,this.canvas.clientWidth))); }
  enterClassroom(room='classroom') {if(this.scene!=='corridor')return;this.corridorPlayer={...this.player};this.scene=room;this.player={...CLASSROOM_SPAWN};this.keys.clear();this.notify();}
  leaveClassroom() {if(this.scene==='corridor')return;this.scene='corridor';this.player={...(this.corridorPlayer||SPAWN)};this.keys.clear();this.notify();}
  move(keys,dt) {const blocker=facelessStudentBlocker(ROOM_AMBIENCE[this.scene]?.faceless);return this.scene!=='corridor'?moveClassroomPlayer(this.player,keys,dt,ROOM_BLOCKERS[this.scene],blocker?[blocker]:[]):movePlayer(this.player,keys,dt);}
  reset(anomaly) {this.hauntState=null;this.hauntTime=0;this.lighting?.reset();if(this.canvas)recordLighting(this.canvas,[1,1,1,1,1]);this.view3D?.resetHauntings();this.caughtAt=null;if(this.canvas)this.canvas.dataset.rabbitArms='0';this.scene='corridor';this.corridorPlayer=null;this.anomaly=anomaly;this.mouthOpen=false;this.dollState=newDollState();this.player={...SPAWN};this.keys.clear();this.steps=0;this.buildTextures();this.notify();}
  setActive(value) {this.active=value;this.keys.clear();}
  nudge(action) {
    if(!this.active||this.caughtAt!=null) return;
    const before=this.player;this.player=this.move(new Set([action]),.05);this.steps+=Math.hypot(this.player.x-before.x,this.player.z-before.z);if(this.steps>.95){this.steps=0;this.onStep();}this.notify();
  }
  texture(draw) {
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
    const c=canvas.getContext('2d');
    c.fillStyle='#a1aaa2';c.fillRect(0,0,512,256);
    // Deterministic plaster mottling, damp corners and school wall mouldings.
    for(let i=0;i<420;i++){const x=(i*83)%512,y=(i*47)%256;c.fillStyle=i%3?'#314e4912':'#f6eadb12';c.fillRect(x,y,6+i%17,1+i%4);}
    c.fillStyle='#365c5d';c.fillRect(0,145,512,111);
    for(let i=0;i<160;i++){c.fillStyle='#101e2911';c.fillRect((i*61)%512,149+(i*17)%105,8+i%24,2+i%8);}
    c.fillStyle='#c7c4ad';c.fillRect(0,141,512,3);c.fillStyle='#263d3c';c.fillRect(0,145,512,3);
    c.fillStyle='#1f302e';c.fillRect(0,247,512,9);c.fillStyle='#75867b';c.fillRect(0,245,512,2);
    c.fillStyle='#929f95';c.fillRect(0,0,512,8);c.fillStyle='#dee0c52a';c.fillRect(0,8,512,2);
    c.strokeStyle='#183a321c';c.lineWidth=1;for(let i=0;i<6;i++){c.beginPath();c.moveTo(i*89+12,8);c.lineTo(i*89+15,28);c.lineTo(i*89+7,43);c.stroke();}
    draw(c);return canvas;
  }
  buildTextures() {
    this.wall=this.texture(()=>{});
    this.door=this.texture(c=>{
      c.fillStyle='#34271f';c.fillRect(57,27,398,229);c.fillStyle='#986546';c.fillRect(66,31,380,225);
      for(const left of [78,258]){
        c.fillStyle='#ae7e58';c.fillRect(left,41,176,213);
        for(let i=0;i<32;i++){c.strokeStyle=i%2?'#efc19722':'#43251226';c.beginPath();c.moveTo(left+i*5.4,41);c.bezierCurveTo(left+i*5.4+2,112,left+i*5.4-3,199,left+i*5.4,254);c.stroke();}
        for(const y of [123,157,191,225]){c.strokeStyle='#71462e';c.strokeRect(left+17,y,140,26);c.strokeStyle='#d19b6a66';c.strokeRect(left+19,y+2,136,22);}
        c.fillStyle='#6d432c';c.fillRect(left+28,65,116,45);c.fillStyle='#183440';c.fillRect(left+35,71,102,33);
        c.fillStyle='#c2d2cd28';c.fillRect(left+35,71,102,3);
        if(this.anomaly==='doll'){const x=left+85;c.fillStyle='#ddd8b2ad';c.beginPath();c.ellipse(x,93,7,6,0,0,Math.PI*2);c.fill();for(let i=0;i<5;i++){c.beginPath();c.ellipse(x-7+i*3.5,82-(i%3),1.8,5,0,0,Math.PI*2);c.fill();}}
      }
      c.fillStyle='#402c21';c.fillRect(253,41,5,215);c.fillRect(78,37,355,4);
      for(const x of [86,419]){c.fillStyle='#acaba2';c.fillRect(x,165,9,23);c.fillStyle='#302b27';c.fillRect(x+3,168,3,17);}
      c.fillStyle='#afa99a';c.fillRect(77,252,357,3);
      c.fillStyle='#eee4c6';c.fillRect(219,7,74,18);c.fillStyle='#283931';c.font='bold 15px sans-serif';c.textAlign='center';c.fillText(this.anomaly==='door'?'404':'3-2',256,21);

    });
    this.roomDoorTextures={};for(const {z,label:roomLabel} of ROOMS){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const label=roomLabel.replace(' 교실','');const c=canvas.getContext('2d');c.drawImage(this.door,0,0);c.fillStyle='#eee4c6';c.fillRect(219,7,74,18);c.fillStyle='#283931';c.font='bold 13px sans-serif';c.textAlign='center';c.fillText(label,256,21);this.roomDoorTextures[z]=canvas;}
    this.board=this.texture(c=>{
      c.fillStyle='#171e15';c.fillRect(45,38,422,168);c.fillStyle='#7b7150';c.fillRect(52,44,408,155);
      // A side wall maps 512px to 2m horizontally, 256px to 3m vertically.
      // Compensate for that mapping so the 3:2 photograph keeps its proportions.
      c.fillStyle='#ded3ab';c.fillRect(73,65,366,86);
      const photo=this.anomaly==='board'?this.boardPhotoErased:this.boardPhoto;
      if(photo.complete && photo.naturalWidth) c.drawImage(photo,76,68,360,80);
      else {c.fillStyle='#697363';c.fillRect(76,68,360,80);}
      c.fillStyle='#ded3ab';c.fillRect(285,158,145,36);
      c.fillStyle='#73715c';for(let line=0;line<4;line++)c.fillRect(298,165+line*6,line===3?65:112,1);
    });
    this.exterior=document.createElement('canvas');this.exterior.width=CAMPUS_WIDTH;this.exterior.height=447;
    drawCampusView(this.exterior.getContext('2d'));
    this.windowTexture=(haunted,viewOffset=0)=>this.texture(c=>{
      c.fillStyle='#244e4a';c.fillRect(29,25,454,173);c.fillStyle='#507d6c';c.fillRect(35,30,442,163);
      drawWindowView(c,{x:42,y:37,width:428,height:149},{ghost:this.windowGhost,haunted,viewOffset});
      // The exterior is behind both crossbars and faint glass reflections.
      c.fillStyle='#345e52';c.fillRect(251,37,10,149);c.fillRect(42,111,428,7);
      c.fillStyle='#aac1ad';c.fillRect(251,37,2,149);c.fillRect(42,111,428,1);
      c.fillStyle='#bac1a41a';c.beginPath();c.moveTo(55,40);c.lineTo(72,40);c.lineTo(208,180);c.lineTo(191,180);c.fill();
      c.fillStyle='#aaa68b';c.fillRect(24,195,464,5);c.fillStyle='#233833';c.fillRect(24,200,464,5);
    });
    this.window=this.windowTexture(false);this.hauntedWindow=this.windowTexture(this.anomaly==='window');
    this.windowViews={};this.lastExteriorUpdate=-Infinity;this.exteriorOffset=null;
    this.clock=this.wall;
    this.clockFace=document.createElement('canvas');this.clockFace.width=512;this.clockFace.height=512;
    drawClockFace(this.clockFace.getContext('2d'),512,this.anomaly==='clock');
    this.end=this.texture(c=>{
      // Recessed openings; the stair flights are projected in world space.
      for(const x of [30,311]){
        c.fillStyle='#2b403c';c.fillRect(x,0,171,256);
      }
    });
    this.view3D?.syncTextures(this);
  }

  updateExterior(time) {
    if(time-this.lastExteriorUpdate<120)return;
    this.lastExteriorUpdate=time;
    const offset=center=>Math.max(-1,Math.min(1,(this.player.z-center)/3));
    if(this.scene==='classroom'){
      const viewOffset=Math.round(offset(4.5)*20)/20;
      if(viewOffset!==this.exteriorOffset){
        drawCampusView(this.exterior.getContext('2d'),{viewOffset});
        this.exteriorOffset=viewOffset;
      }
    } else for(const start of [4,6,12,14]){
      const viewOffset=Math.round(offset(start+1)*20)/20;
      if(this.windowViews[start]?.offset===viewOffset)continue;
      this.windowViews[start]={offset:viewOffset,texture:this.windowTexture(this.anomaly==='window'&&start===6,viewOffset)};
    }
  }
  notify() {
    if(this.scene!=='corridor'){this.canvas.dataset.mascotMouth=this.mouthOpen?'open':'closed';this.item=this.scene==='classroom'&&facingDoll(this.player)?'doll':null;this.atStairs=false;this.onPosition({item:this.item,stairs:false,names,player:this.player,scene:this.scene});return;}
    const open=this.exploration?this.exploration.ended:this.survival?this.survival.phase==='warning':revealsTeeth(this.player,this.anomaly,this.mouthOpen);
    if(!this.exploration&&!this.survival&&open && !this.mouthOpen) this.onReveal();
    this.mouthOpen=open;
    this.canvas.dataset.mascotMouth=open?'open':'closed';
    const item=nearbyItem(this.player,this.anomaly);const stairs=this.player.z>22;
    this.item=item;this.atStairs=stairs;
    this.onPosition({item,stairs,names,player:this.player,scene:this.scene});
  }
  updateDoll(dt){const before=this.dollState?.phase;this.dollState=advanceDoll(this.dollState||newDollState(),{scene:this.scene,anomaly:this.anomaly,player:this.player,dt,ready:Boolean(this.dollImage?.naturalWidth&&this.dollScary?.naturalWidth)});if(before==='lying'&&this.dollState.phase==='rising')this.onReveal('doll');this.canvas.dataset.dollPhase=this.dollState.phase;}
  frame(time) {
    const dt=Math.min((time-this.last)/1000,.05);this.last=time;
    if(this.active && !document.hidden && this.focused){
      const before=this.player;if(this.caughtAt==null)this.player=this.move(this.keys,dt);
      const distance=Math.hypot(this.player.x-before.x,this.player.z-before.z);this.steps+=distance;
      if(this.steps>.95){this.steps=0;this.onStep();}
      this.updateDoll(dt);this.onTick?.(dt);this.notify();this.draw(time);
    }
    requestAnimationFrame(t=>this.frame(t));
  }
  drawCatch(time){
    const c=this.ctx,w=this.canvas.width,h=this.canvas.height,p=this.player;
    const arrival=rabbitArrival((time-this.caughtAt)/1000,window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const img=arrival.teeth?this.mascotOpen:this.mascot;if(!img.naturalWidth)return;
    const dx=(0-p.x)*(1-arrival.rush)+Math.sin(p.angle)*.80*arrival.rush;
    const dz=(6.8-p.z)*(1-arrival.rush)+Math.cos(p.angle)*.80*arrival.rush;
    const distance=Math.max(.08,dx*Math.sin(p.angle)+dz*Math.cos(p.angle)),lens=w*.68;
    const size=rabbitSize(img,arrival.growth),width=size.width*lens/distance,height=size.height*lens/distance;
    const x=w/2+(dx*Math.cos(p.angle)-dz*Math.sin(p.angle))*lens/distance;
    const y=h*.48+(1.5-arrival.centerY)*lens/distance;
    this.rabbitPartCache??=new WeakMap();if(!this.rabbitPartCache.has(img))this.rabbitPartCache.set(img,rabbitParts(img));
    drawRabbitPose(c,this.rabbitPartCache.get(img),x,y,width,height,raisedArms((time-this.caughtAt)/1000,window.matchMedia('(prefers-reduced-motion: reduce)').matches));
  }
  draw(time) {
    if(this.view3D){this.view3D.draw(this,time);return;}
    const c=this.ctx,w=this.canvas.width,h=this.canvas.height,p=this.player;
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.lighting??=new SchoolLighting();
    const levels=this.lighting.update(time,{active:this.scene==='corridor'&&!this.exploration?.ended,reduced:reduce});recordLighting(this.canvas,levels);
    this.updateExterior(time);
    if(this.scene!=='corridor'){drawClassroom(c,w,h,p,time,this.exterior,{state:this.dollState,image:this.dollImage,scary:this.dollScary,ghost:this.windowGhost,boy:this.pianoBoy,faceless:this.facelessStudent,haunting:this.hauntState??=( {scene:this.scene,ballTime:0,smile:0,last:time}),ended:this.exploration?.ended},this.scene);shadeCanvasSchool(c,w,h);if(this.caughtAt!=null)this.drawCatch(time);return;}
    const bob=this.keys.has('forward')||this.keys.has('back') ? reduce?0:Math.sin(time/130)*2 : 0;
    const horizon=h*.48+bob, lens=w*.68;
    const ceiling=c.createLinearGradient(0,0,0,horizon);ceiling.addColorStop(0,'#293b3e');ceiling.addColorStop(1,'#65716b');c.fillStyle=ceiling;c.fillRect(0,0,w,horizon);
    const floor=c.createLinearGradient(0,horizon,0,h);floor.addColorStop(0,'#252d2b');floor.addColorStop(1,'#584b3e');c.fillStyle=floor;c.fillRect(0,horizon,w,h);
    for(let y=Math.ceil(horizon)+1;y<h;y+=4){
      const d=1.5*lens/(y-horizon);if(d>40)continue;
      for(let x=0;x<w;x+=4){
        const across=(x-w/2)*d/lens;
        const wx=p.x+Math.sin(p.angle)*d+Math.cos(p.angle)*across;
        const wz=p.z+Math.cos(p.angle)*d-Math.sin(p.angle)*across;
        const row=Math.floor(wx/.25),gx=((wx%.25)+.25)%.25,gz=((wz+row*.51)%2+2)%2;
        const wood=42+Math.sin(row*21)*8+Math.sin(wz*10+row*7)*3;
        const light=Math.max(.38,1-d*.018);
        c.fillStyle=`rgb(${(wood+23)*light},${(wood+12)*light},${(wood+6)*light})`;
        if(d<8&&(gx<.015||gz<.02))c.fillStyle=`rgb(${(wood+15)*light},${(wood+4)*light},${(wood-2)*light})`;
        c.fillRect(x,y,4,4);
      }
    }
    const depth=new Float64Array(Math.ceil(w/2));
    for(let x=0;x<w;x+=2){
      const offset=Math.atan((x-w/2)/lens),angle=p.angle+offset;
      const dx=Math.sin(angle),dz=Math.cos(angle);
      const tx=Math.abs(dx)<1e-9?Infinity:((dx>0?3:-3)-p.x)/dx;
      const tz=Math.abs(dz)<1e-9?Infinity:((dz>0?24.6:0)-p.z)/dz;
      const side=tx<tz,dist=side?tx:tz,perp=Math.max(.02,dist*Math.cos(offset));depth[x/2]=perp;
      let tex=this.wall,u;
      if(side){const z=p.z+dz*dist;u=((z%2)+2)%2/2;
        if(dx<0){if(this.exploration){const room=ROOMS.find(r=>Math.abs(z-r.z)<1);if(room)tex=this.roomDoorTextures[room.z];else if(z>=8&&z<10)tex=this.board;}else{if(z>=4&&z<6)tex=this.door;else if(z>=8&&z<10)tex=this.board;else if(z>=14&&z<16)tex=this.door;}}
        else {if((z>=4&&z<8)||(z>=12&&z<16))tex=this.windowViews[Math.floor(z/2)*2]?.texture||this.window;else if(z>=18&&z<20)tex=this.clock;}
      } else {u=(p.x+dx*dist+3)/6;if(dz>0)tex=this.end;}
      const height=3*lens/perp,top=horizon-height*.5;
      c.drawImage(tex,Math.max(0,Math.min(511,Math.floor(u*512))),0,1,256,x,top,2,height);
      c.fillStyle=`rgba(0,10,5,${Math.min(.7,perp*.022)})`;c.fillRect(x,top,2,height);
    }
    // Ceiling fixtures projected into the same world as the walls.
    const project=(x,y,z)=>{const dx=x-p.x,dz=z-p.z;const d=dx*Math.sin(p.angle)+dz*Math.cos(p.angle);return d>.12?{x:w/2+(dx*Math.cos(p.angle)-dz*Math.sin(p.angle))*lens/d,y:horizon-(y-1.5)*lens/d,d}:null;};
    drawStairs(c,project,p);
    drawSceneDepth(c,project,p,{lampLevels:levels});
    drawWallClock(c,project,this.clockFace);
    if(this.tutorial){
      const desk=project(2,0,4);
      if(desk&&desk.d<depth[Math.min(depth.length-1,Math.max(0,Math.floor(desk.x/2)))]){
        const unit=lens/desk.d,top=desk.y-.85*unit;
        c.fillStyle='#3b2822';c.fillRect(desk.x-.6*unit,top,.95*unit,.7*unit);
        c.fillStyle='#a08a68';c.fillRect(desk.x-.67*unit,top-.09*unit,1.1*unit,.13*unit);

      }
    }
    const figure=project(1.6,0,this.rabbitZ??(this.anomaly==='figure'?16:22));
    const sprite=this.mouthOpen && this.mascotOpen.complete && this.mascotOpen.naturalWidth ? this.mascotOpen : this.mascot;
    if(!this.exploration && figure && sprite.complete && sprite.naturalWidth){
      const height=2.1*lens/figure.d, width=height*sprite.naturalWidth/sprite.naturalHeight;
      const left=figure.x-width/2,top=figure.y-height;
      c.save();
      c.filter=`brightness(${Math.max(.48,.88-figure.d*.013)}) saturate(.75)`;
      // Clip each sprite column against wall depth, including partial occlusion.
      for(let x=Math.max(0,Math.floor(left/2)*2);x<Math.min(w,left+width);x+=2){
        if(figure.d>=depth[Math.floor(x/2)])continue;
        const sourceX=(x-left)/width*sprite.naturalWidth;
        if(sourceX<0||sourceX>=sprite.naturalWidth)continue;
        const sourceWidth=Math.min(sprite.naturalWidth-sourceX,2/width*sprite.naturalWidth);
        c.drawImage(sprite,sourceX,0,sourceWidth,sprite.naturalHeight,x,top,2,height);
      }
      c.restore();
    }
    const shade=c.createRadialGradient(w/2,h/2,w*.12,w/2,h/2,w*.7);shade.addColorStop(0,'transparent');shade.addColorStop(1,'#020a07bb');c.fillStyle=shade;c.fillRect(0,0,w,h);
    shadeCanvasSchool(c,w,h,levels,p);
  }
}
