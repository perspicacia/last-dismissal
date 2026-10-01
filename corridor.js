import { createKeyDoor, constrainKeyDoor, KEY_POSITION } from './key-door.js';
import { CLASSROOM_SPAWN, moveClassroomPlayer, drawClassroom } from './classroom.js';
import { SPAWN, movePlayer, nearbyItem, revealsTeeth } from './movement.js';

const names = {door:'교실',board:'게시판',window:'창문',clock:'시계',figure:'토끼 마스코트'};
export class Corridor {
  constructor(canvas, onPosition, onStep, onReveal = () => {}) {
    this.canvas=canvas; this.ctx=canvas.getContext('2d'); this.onPosition=onPosition;this.onStep=onStep;
    this.scene="corridor";this.corridorPlayer=null;this.keyDoor=createKeyDoor(false);this.keys=new Set();this.player={...SPAWN};this.active=false;this.anomaly=null;this.steps=0;
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
    this.mouthOpen = false; this.onReveal = onReveal;
    this.buildTextures(); this.resize();
    new ResizeObserver(()=>this.resize()).observe(canvas);
    window.addEventListener('blur',()=>this.keys.clear());
    document.addEventListener('visibilitychange',()=>this.keys.clear());
    this.last=0;requestAnimationFrame(t=>this.frame(t));
  }
  resize() { this.canvas.width=Math.min(1100,Math.max(375,Math.round(this.canvas.clientWidth)));this.canvas.height=Math.round(this.canvas.width*.57); }
  enterClassroom() {if(this.scene==='classroom')return;this.corridorPlayer={...this.player};this.scene='classroom';this.player={...CLASSROOM_SPAWN};this.keys.clear();this.notify();}
  leaveClassroom() {if(this.scene!=='classroom')return;this.scene='corridor';this.player={...(this.corridorPlayer||SPAWN)};this.keys.clear();this.notify();}
  move(keys,dt) {return this.scene==='classroom'?moveClassroomPlayer(this.player,keys,dt):constrainKeyDoor(movePlayer(this.player,keys,dt),this.keyDoor);}
  reset(anomaly) {this.scene='corridor';this.corridorPlayer=null;this.anomaly=anomaly;this.mouthOpen=false;this.player={...SPAWN};this.keys.clear();this.steps=0;this.buildTextures();this.notify();}
  setKeyDoor(value) {this.keyDoor=value;this.notify();}
  setActive(value) {this.active=value;this.keys.clear();}
  nudge(action) {
    if(!this.active) return;
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
      c.fillStyle='#33362c';c.fillRect(57,27,398,229);c.fillStyle='#79664b';c.fillRect(69,35,374,221);
      c.fillStyle='#a28d69';c.fillRect(69,35,9,221);c.fillStyle='#413d31';c.fillRect(433,35,10,221);
      // Narrow vertical grain in weathered sliding wooden classroom doors.
      for(let i=0;i<48;i++){c.strokeStyle=i%2?'#dcc89e18':'#201b141a';c.beginPath();c.moveTo(82+i*7.3,39);c.bezierCurveTo(74+i*7.3,112,89+i*7.3,199,82+i*7.3,255);c.stroke();}
      c.fillStyle='#273d3d';c.fillRect(96,54,320,87);c.fillStyle='#112734';c.fillRect(103,59,306,77);
      const glass=c.createLinearGradient(103,59,409,136);glass.addColorStop(0,'#486369');glass.addColorStop(.45,'#1d343d');glass.addColorStop(1,'#0b1e2a');c.fillStyle=glass;c.fillRect(103,59,306,77);
      c.fillStyle='#aaa486';c.fillRect(248,54,8,87);c.fillRect(96,93,320,4);
      c.fillStyle='#d2d4bd20';c.beginPath();c.moveTo(115,60);c.lineTo(152,60);c.lineTo(245,135);c.lineTo(205,135);c.fill();
      c.fillStyle='#eee4c6';c.fillRect(198,153,116,35);c.strokeStyle='#998c68';c.strokeRect(198,153,116,35);
      c.fillStyle='#283931';c.font='bold 27px sans-serif';c.textAlign='center';c.fillText(this.anomaly==='door'?'404':'3-2',256,180);
      c.fillStyle='#383e36';c.fillRect(385,203,17,25);c.fillStyle='#b0ad8e';c.fillRect(390,207,6,18);
      c.fillStyle='#334a4520';c.fillRect(86,238,338,18);
    });
    this.board=this.texture(c=>{
      c.fillStyle='#171e15';c.fillRect(45,38,422,168);c.fillStyle='#7b7150';c.fillRect(52,44,408,155);
      // A side wall maps 512px to 2m horizontally, 256px to 3m vertically.
      // Compensate for that mapping so the 3:2 photograph keeps its proportions.
      c.fillStyle='#ded3ab';c.fillRect(73,65,366,86);
      const photo=this.anomaly==='board'?this.boardPhotoErased:this.boardPhoto;
      if(photo.complete && photo.naturalWidth) c.drawImage(photo,76,68,360,80);
      else {c.fillStyle='#697363';c.fillRect(76,68,360,80);}
      c.fillStyle='#ded3ab';c.fillRect(285,158,145,36);c.fillStyle='#3b4631';c.font='13px sans-serif';c.fillText('야간 자율학습',290,173);c.fillText('23:00 종료',290,189);
      c.fillStyle='#dfd6b5';c.font='13px sans-serif';c.fillText('수학여행 단체사진',76,173);
    });
    this.window=this.texture(c=>{
      c.fillStyle='#7e7055';c.fillRect(29,25,454,173);c.fillStyle='#ac9b75';c.fillRect(35,30,442,163);c.fillStyle='#06151b';c.fillRect(42,37,428,149);
      if(this.anomaly==='window'){
        c.fillStyle='#425c47';c.fillRect(42,37,428,149);c.fillStyle='#162c20';c.beginPath();c.moveTo(42,37);c.lineTo(220,90);c.lineTo(292,90);c.lineTo(470,37);c.fill();
        c.fillStyle='#738575';c.beginPath();c.moveTo(42,186);c.lineTo(220,128);c.lineTo(292,128);c.lineTo(470,186);c.fill();
        c.fillStyle='#08150d';c.fillRect(235,91,40,39);c.fillRect(82,65,50,85);c.fillRect(364,65,50,85);
      } else {c.fillStyle='#8eaa9d';for(let i=0;i<10;i++)c.fillRect(55+i*40,55+(i%3)*17,2,2);c.fillStyle='#303f2b';c.fillRect(42,160,428,26);c.fillStyle='#d8c79e';c.fillRect(370,123,5,40);c.fillRect(361,121,23,4);}
      c.fillStyle='#82795e';c.fillRect(251,37,10,149);c.fillRect(42,111,428,7);c.fillStyle='#bac1a433';c.beginPath();c.moveTo(55,40);c.lineTo(82,40);c.lineTo(225,180);c.lineTo(194,180);c.fill();c.fillStyle='#a99f83';c.fillRect(24,195,464,5);c.fillStyle='#233833';c.fillRect(24,200,464,5);
    });
    this.clock=this.texture(c=>{
      c.fillStyle='#0b1a13';c.beginPath();c.arc(256,86,53,0,Math.PI*2);c.fill();c.fillStyle='#d1d7bd';c.beginPath();c.arc(256,86,46,0,Math.PI*2);c.fill();
      c.strokeStyle='#253d2b';c.lineWidth=2;for(let i=0;i<12;i++){let a=i*Math.PI/6;c.beginPath();c.moveTo(256+Math.sin(a)*36,86-Math.cos(a)*36);c.lineTo(256+Math.sin(a)*42,86-Math.cos(a)*42);c.stroke();}
      c.lineWidth=4;c.beginPath();c.moveTo(256,86);c.lineTo(this.anomaly==='clock'?256:241,this.anomaly==='clock'?114:62);c.moveTo(256,86);c.lineTo(this.anomaly==='clock'?258:291,this.anomaly==='clock'?123:93);c.stroke();
    });
    this.fireDoor=this.texture(c=>{
      c.fillStyle='#30464b';c.fillRect(0,0,512,256);
      c.strokeStyle='#849194';c.lineWidth=5;c.strokeRect(5,5,502,246);c.beginPath();c.moveTo(256,0);c.lineTo(256,256);c.stroke();
      c.fillStyle='#111d25';c.fillRect(48,35,164,70);c.fillRect(300,35,164,70);
      c.fillStyle='#dfcd98';c.font='bold 25px sans-serif';c.textAlign='center';c.fillText('夜間通行 · 방화문',256,138);
      c.font='18px sans-serif';c.fillText('열쇠는 오른쪽 당직 책상',256,173);
      c.fillStyle='#c5b989';c.fillRect(181,192,150,8);
    });
    this.end=this.texture(c=>{
      for(const [x,title,hint] of [[35,'위층 계단','이상이 있다면'],[290,'아래층 계단','이상이 없다면']]){
        c.fillStyle='#070f0b';c.fillRect(x,46,185,210);c.strokeStyle='#738c71';c.lineWidth=3;c.strokeRect(x,46,185,210);
        c.fillStyle='#b9d598';c.font='bold 20px sans-serif';c.textAlign='center';c.fillText(title,x+92,30);c.font='14px sans-serif';c.fillText(hint,x+92,74);
        c.strokeStyle='#617361';for(let i=0;i<7;i++){c.beginPath();c.moveTo(x+18,120+i*20);c.lineTo(x+168,120+i*20);c.stroke();}
      }
    });
  }
  notify() {
    if(this.scene==='classroom'){this.item=null;this.atStairs=false;this.onPosition({item:null,stairs:false,names,player:this.player,keyDoor:this.keyDoor,scene:this.scene});return;}
    const open=revealsTeeth(this.player,this.anomaly,this.mouthOpen);
    if(open && !this.mouthOpen) this.onReveal();
    this.mouthOpen=open;
    this.canvas.dataset.mascotMouth=open?'open':'closed';
    const item=nearbyItem(this.player,this.anomaly);const stairs=this.player.z>22;
    this.item=item;this.atStairs=stairs;
    this.onPosition({item,stairs,names,player:this.player,keyDoor:this.keyDoor,scene:this.scene});
  }
  frame(time) {
    const dt=Math.min((time-this.last)/1000,.05);this.last=time;
    if(this.active && !document.hidden){
      const before=this.player;this.player=this.move(this.keys,dt);
      const distance=Math.hypot(this.player.x-before.x,this.player.z-before.z);this.steps+=distance;
      if(this.steps>.95){this.steps=0;this.onStep();}
      this.notify();this.draw(time);
    }
    requestAnimationFrame(t=>this.frame(t));
  }
  draw(time) {
    const c=this.ctx,w=this.canvas.width,h=this.canvas.height,p=this.player;
    if(this.scene==='classroom'){drawClassroom(c,w,h,p,time);return;}
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
        const wood=42+Math.sin(row*21)*8+Math.sin(wz*49+row*7)*3;
        const light=Math.max(.38,1-d*.018);
        c.fillStyle=`rgb(${(wood+23)*light},${(wood+12)*light},${(wood+6)*light})`;
        if(gx<.015||gz<.02)c.fillStyle='#151c1b';
        c.fillRect(x,y,4,4);
      }
    }
    const depth=new Float64Array(Math.ceil(w/2));
    for(let x=0;x<w;x+=2){
      const offset=Math.atan((x-w/2)/lens),angle=p.angle+offset;
      const dx=Math.sin(angle),dz=Math.cos(angle);
      const tx=Math.abs(dx)<1e-9?Infinity:((dx>0?3:-3)-p.x)/dx;
      const tz=Math.abs(dz)<1e-9?Infinity:((dz>0?26:0)-p.z)/dz;
      const doorDistance=this.keyDoor.tutorial&&!this.keyDoor.doorOpen&&dz>0?(8-p.z)/dz:Infinity;
      const barrier=doorDistance>0&&doorDistance<Math.min(tx,tz);
      const side=!barrier&&tx<tz,dist=barrier?doorDistance:side?tx:tz,perp=Math.max(.02,dist*Math.cos(offset));depth[x/2]=perp;
      let tex=this.wall,u;
      if(side){const z=p.z+dz*dist;u=((z%2)+2)%2/2;
        if(dx<0){if(z>=4&&z<6)tex=this.door;else if(z>=8&&z<10)tex=this.board;else if(z>=14&&z<16)tex=this.door;}
        else {if((z>=4&&z<8)||(z>=12&&z<16))tex=this.window;else if(z>=18&&z<20)tex=this.clock;}
      } else {u=(p.x+dx*dist+3)/6;if(barrier)tex=this.fireDoor;else if(dz>0)tex=this.end;}
      const height=3*lens/perp,top=horizon-height*.5;
      c.drawImage(tex,Math.max(0,Math.min(511,Math.floor(u*512))),0,1,256,x,top,2,height);
      c.fillStyle=`rgba(0,10,5,${Math.min(.7,perp*.022)})`;c.fillRect(x,top,2,height);
    }
    // Ceiling fixtures projected into the same world as the walls.
    const project=(x,y,z)=>{const dx=x-p.x,dz=z-p.z;const d=dx*Math.sin(p.angle)+dz*Math.cos(p.angle);return d>.12?{x:w/2+(dx*Math.cos(p.angle)-dz*Math.sin(p.angle))*lens/d,y:horizon-(y-1.5)*lens/d,d}:null;};
    for(let z=24;z>=2;z-=4){
      const points=[project(-.6,2.96,z),project(.6,2.96,z),project(.6,2.96,z+.6),project(-.6,2.96,z+.6)];
      if(points.every(Boolean)){c.fillStyle='#d0e2d2';c.shadowColor='#accac3';c.shadowBlur=9;c.beginPath();points.forEach((a,i)=>i?c.lineTo(a.x,a.y):c.moveTo(a.x,a.y));c.closePath();c.fill();c.shadowBlur=0;}
    }
    if(this.keyDoor.tutorial){
      const desk=project(KEY_POSITION.x,0,KEY_POSITION.z);
      if(desk&&desk.d<depth[Math.min(depth.length-1,Math.max(0,Math.floor(desk.x/2)))]){
        const unit=lens/desk.d,top=desk.y-.85*unit;
        c.fillStyle='#3b2822';c.fillRect(desk.x-.6*unit,top,.95*unit,.7*unit);
        c.fillStyle='#a08a68';c.fillRect(desk.x-.67*unit,top-.09*unit,1.1*unit,.13*unit);
        c.fillStyle='#e8ddbe';c.fillRect(desk.x-.49*unit,top+.1*unit,.72*unit,.22*unit);
        c.fillStyle='#302e28';c.font=`${Math.max(10,.12*unit)}px sans-serif`;c.textAlign='center';c.fillText('당직 책상',desk.x-.12*unit,top+.26*unit);
        if(!this.keyDoor.hasKey){
          c.save();c.strokeStyle='#ffe3a0';c.lineWidth=Math.max(3,.045*unit);c.shadowColor='#ffd75c';c.shadowBlur=12;
          c.beginPath();c.arc(desk.x-.18*unit,top-.15*unit,.08*unit,0,Math.PI*2);c.moveTo(desk.x-.1*unit,top-.15*unit);c.lineTo(desk.x+.2*unit,top-.15*unit);c.lineTo(desk.x+.2*unit,top-.06*unit);c.stroke();c.restore();
        }
      }
    }
    const figure=project(1.6,0,this.anomaly==='figure'?16:22);
    const sprite=this.mouthOpen && this.mascotOpen.complete && this.mascotOpen.naturalWidth ? this.mascotOpen : this.mascot;
    if(figure && sprite.complete && sprite.naturalWidth){
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
  }
}
