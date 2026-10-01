import { SPAWN, movePlayer, nearbyItem, revealsTeeth } from './movement.js';

const names = {door:'교실',board:'게시판',window:'창문',clock:'시계',figure:'토끼 마스코트'};
export class Corridor {
  constructor(canvas, onPosition, onStep, onReveal = () => {}) {
    this.canvas=canvas; this.ctx=canvas.getContext('2d'); this.onPosition=onPosition;this.onStep=onStep;
    this.keys=new Set();this.player={...SPAWN};this.active=false;this.anomaly=null;this.steps=0;
    this.mascot = new Image();
    this.mascot.src = new URL('./assets/mascot-rabbit.png', import.meta.url).href;
    this.mascotOpen = new Image();
    this.mascotOpen.src = new URL('./assets/mascot-rabbit-open.png', import.meta.url).href;
    this.mouthOpen = false; this.onReveal = onReveal;
    this.buildTextures(); this.resize();
    new ResizeObserver(()=>this.resize()).observe(canvas);
    window.addEventListener('blur',()=>this.keys.clear());
    document.addEventListener('visibilitychange',()=>this.keys.clear());
    this.last=0;requestAnimationFrame(t=>this.frame(t));
  }
  resize() { this.canvas.width=Math.min(1100,Math.max(375,Math.round(this.canvas.clientWidth)));this.canvas.height=Math.round(this.canvas.width*.57); }
  reset(anomaly) {this.anomaly=anomaly;this.mouthOpen=false;this.player={...SPAWN};this.keys.clear();this.steps=0;this.buildTextures();this.notify();}
  setActive(value) {this.active=value;this.keys.clear();}
  nudge(action) {
    if(!this.active) return;
    this.player=movePlayer(this.player,new Set([action]),.05);this.notify();
  }
  texture(draw) {
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
    const c=canvas.getContext('2d');c.fillStyle='#354c40';c.fillRect(0,0,512,256);
    c.fillStyle='#233c30';c.fillRect(0,145,512,111);c.fillStyle='#6b8270';c.fillRect(0,143,512,3);
    c.strokeStyle='#ffffff08';for(let y=0;y<256;y+=32){c.beginPath();c.moveTo(0,y);c.lineTo(512,y);c.stroke();}
    draw(c);return canvas;
  }
  buildTextures() {
    this.wall=this.texture(()=>{});
    this.door=this.texture(c=>{
      c.fillStyle='#101f18';c.fillRect(65,32,382,224);c.fillStyle='#375748';c.fillRect(76,42,360,214);
      c.fillStyle='#0b1817';c.fillRect(98,56,316,84);c.strokeStyle='#718274';c.lineWidth=3;c.strokeRect(98,56,316,84);
      c.fillStyle='#e1e5ca';c.font='bold 28px sans-serif';c.textAlign='center';c.fillText(this.anomaly==='door'?'404':'3-2',256,178);
      c.fillStyle='#a6aa8c';c.fillRect(388,194,20,5);
    });
    this.board=this.texture(c=>{
      c.fillStyle='#171e15';c.fillRect(45,38,422,168);c.fillStyle='#7b7150';c.fillRect(52,44,408,155);
      c.fillStyle='#ded3ab';c.fillRect(80,70,200,104);c.fillStyle='#243728';
      for(let i=0;i<5;i++){const x=99+i*35;c.beginPath();c.arc(x,109,12,0,Math.PI*2);c.fill();c.fillRect(x-12,123,24,35);}
      if(this.anomaly!=='board'){c.fillStyle='#c2ab81';for(let i=0;i<5;i++){c.beginPath();c.arc(99+i*35,109,9,0,Math.PI*2);c.fill();}}
      c.fillStyle='#ded3ab';c.fillRect(300,73,130,74);c.fillStyle='#3b4631';c.font='15px sans-serif';c.fillText('야간 자율학습',304,96);c.fillText('23:00 종료',304,121);
      c.fillStyle='#dfd6b5';c.font='13px sans-serif';c.fillText('수학여행 단체사진',80,190);
    });
    this.window=this.texture(c=>{
      c.fillStyle='#9cad95';c.fillRect(35,30,442,163);c.fillStyle='#06151b';c.fillRect(42,37,428,149);
      if(this.anomaly==='window'){
        c.fillStyle='#425c47';c.fillRect(42,37,428,149);c.fillStyle='#162c20';c.beginPath();c.moveTo(42,37);c.lineTo(220,90);c.lineTo(292,90);c.lineTo(470,37);c.fill();
        c.fillStyle='#738575';c.beginPath();c.moveTo(42,186);c.lineTo(220,128);c.lineTo(292,128);c.lineTo(470,186);c.fill();
        c.fillStyle='#08150d';c.fillRect(235,91,40,39);c.fillRect(82,65,50,85);c.fillRect(364,65,50,85);
      } else {c.fillStyle='#8eaa9d';for(let i=0;i<10;i++)c.fillRect(55+i*40,55+(i%3)*17,2,2);c.fillStyle='#303f2b';c.fillRect(42,160,428,26);c.fillStyle='#d8c79e';c.fillRect(370,123,5,40);c.fillRect(361,121,23,4);}
      c.fillStyle='#91a48c';c.fillRect(253,37,6,149);c.fillRect(42,113,428,5);
    });
    this.clock=this.texture(c=>{
      c.fillStyle='#0b1a13';c.beginPath();c.arc(256,86,53,0,Math.PI*2);c.fill();c.fillStyle='#d1d7bd';c.beginPath();c.arc(256,86,46,0,Math.PI*2);c.fill();
      c.strokeStyle='#253d2b';c.lineWidth=2;for(let i=0;i<12;i++){let a=i*Math.PI/6;c.beginPath();c.moveTo(256+Math.sin(a)*36,86-Math.cos(a)*36);c.lineTo(256+Math.sin(a)*42,86-Math.cos(a)*42);c.stroke();}
      c.lineWidth=4;c.beginPath();c.moveTo(256,86);c.lineTo(this.anomaly==='clock'?256:241,this.anomaly==='clock'?114:62);c.moveTo(256,86);c.lineTo(this.anomaly==='clock'?258:291,this.anomaly==='clock'?123:93);c.stroke();
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
    const open=revealsTeeth(this.player,this.anomaly,this.mouthOpen);
    if(open && !this.mouthOpen) this.onReveal();
    this.mouthOpen=open;
    this.canvas.dataset.mascotMouth=open?'open':'closed';
    const item=nearbyItem(this.player,this.anomaly);const stairs=this.player.z>22;
    this.item=item;this.atStairs=stairs;
    this.onPosition({item,stairs,names,player:this.player});
  }
  frame(time) {
    const dt=Math.min((time-this.last)/1000,.05);this.last=time;
    if(this.active && !document.hidden){
      const before=this.player;this.player=movePlayer(this.player,this.keys,dt);
      const distance=Math.hypot(this.player.x-before.x,this.player.z-before.z);this.steps+=distance;
      if(this.steps>.95){this.steps=0;this.onStep();}
      this.notify();this.draw(time);
    }
    requestAnimationFrame(t=>this.frame(t));
  }
  draw(time) {
    const c=this.ctx,w=this.canvas.width,h=this.canvas.height,p=this.player;
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const bob=this.keys.has('forward')||this.keys.has('back') ? reduce?0:Math.sin(time/130)*2 : 0;
    const horizon=h*.48+bob, lens=w*.68;
    const ceiling=c.createLinearGradient(0,0,0,horizon);ceiling.addColorStop(0,'#111c17');ceiling.addColorStop(1,'#344438');c.fillStyle=ceiling;c.fillRect(0,0,w,horizon);
    const floor=c.createLinearGradient(0,horizon,0,h);floor.addColorStop(0,'#293b2e');floor.addColorStop(1,'#53614d');c.fillStyle=floor;c.fillRect(0,horizon,w,h);
    c.fillStyle='#9dae8926';
    for(let y=Math.ceil(horizon)+1;y<h;y+=4){
      const d=1.5*lens/(y-horizon);if(d>40)continue;
      for(let x=0;x<w;x+=4){
        const across=(x-w/2)*d/lens;
        const wx=p.x+Math.sin(p.angle)*d+Math.cos(p.angle)*across;
        const wz=p.z+Math.cos(p.angle)*d-Math.sin(p.angle)*across;
        const gx=((wx%2)+2)%2,gz=((wz%2)+2)%2;
        if(gx<.035||gx>1.965||gz<.035||gz>1.965)c.fillRect(x,y,4,4);
      }
    }
    const depth=new Float64Array(Math.ceil(w/2));
    for(let x=0;x<w;x+=2){
      const offset=Math.atan((x-w/2)/lens),angle=p.angle+offset;
      const dx=Math.sin(angle),dz=Math.cos(angle);
      const tx=Math.abs(dx)<1e-9?Infinity:((dx>0?3:-3)-p.x)/dx;
      const tz=Math.abs(dz)<1e-9?Infinity:((dz>0?26:0)-p.z)/dz;
      const side=tx<tz,dist=side?tx:tz,perp=Math.max(.02,dist*Math.cos(offset));depth[x/2]=perp;
      let tex=this.wall,u;
      if(side){const z=p.z+dz*dist;u=((z%2)+2)%2/2;
        if(dx<0){if(z>=4&&z<6)tex=this.door;else if(z>=8&&z<10)tex=this.board;else if(z>=14&&z<16)tex=this.door;}
        else {if((z>=4&&z<8)||(z>=12&&z<16))tex=this.window;else if(z>=18&&z<20)tex=this.clock;}
      } else {u=(p.x+dx*dist+3)/6;if(dz>0)tex=this.end;}
      const height=3*lens/perp,top=horizon-height*.5;
      c.drawImage(tex,Math.max(0,Math.min(511,Math.floor(u*512))),0,1,256,x,top,2,height);
      c.fillStyle=`rgba(0,10,5,${Math.min(.7,perp*.022)})`;c.fillRect(x,top,2,height);
    }
    // Ceiling fixtures projected into the same world as the walls.
    const project=(x,y,z)=>{const dx=x-p.x,dz=z-p.z;const d=dx*Math.sin(p.angle)+dz*Math.cos(p.angle);return d>.12?{x:w/2+(dx*Math.cos(p.angle)-dz*Math.sin(p.angle))*lens/d,y:horizon-(y-1.5)*lens/d,d}:null;};
    for(let z=24;z>=2;z-=4){
      const points=[project(-.6,2.96,z),project(.6,2.96,z),project(.6,2.96,z+.6),project(-.6,2.96,z+.6)];
      if(points.every(Boolean)){c.fillStyle='#b9c5a0';c.beginPath();points.forEach((a,i)=>i?c.lineTo(a.x,a.y):c.moveTo(a.x,a.y));c.closePath();c.fill();}
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
