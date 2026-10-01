import { DOLL, DOLL_GAZE, dollRise, facingDoll } from './doll-event.js';
import * as THREE from './vendor/three.module.js';
import { buildOutdoors } from './three-outdoors.js';
import { CLASSROOM_DESKS, CLASSROOM_TEACHER_DESK } from './classroom.js';

const material=(color,options={})=>new THREE.MeshStandardMaterial({color,roughness:.82,...options});
function box(group,x,y,z,w,h,d,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
function cylinder(group,a,b,r,mat){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,delta.length(),10),mat);m.position.copy(start.add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());m.castShadow=true;group.add(m);return m;}
function canvasTexture(image){const t=new THREE.CanvasTexture(image);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
function plasterTexture(){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#c0bda9';ctx.fillRect(0,0,256,256);for(let i=0;i<4200;i++){const x=(i*73)%256,y=(i*117+Math.floor(i/256)*29)%256;ctx.fillStyle=i%2?'#766e6112':'#fff6d319';ctx.fillRect(x,y,1+i%3,1+i%4);}const t=canvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,1);return t;}
function woodTexture(){const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');for(let row=0;row<16;row++){const v=61+(row*17)%24;ctx.fillStyle=`rgb(${v+35},${v+17},${v})`;ctx.fillRect(row*32,0,32,512);for(let i=0;i<23;i++){ctx.strokeStyle=i%2?'#19100830':'#d7aa751c';ctx.beginPath();ctx.moveTo(row*32+2+i*1.23,0);ctx.bezierCurveTo(row*32+i+5,170,row*32+i+2,320,row*32+2+i*1.23,512);ctx.stroke();}ctx.fillStyle='#211b1680';ctx.fillRect(row*32,0,1,512);ctx.fillRect(row*32,(row%3)*150,32,1);}const t=canvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,8);return t;}

export class ThreeSchoolView {
  constructor(canvas,source){
    this.source=source;this.textures=[];this.lastState='';this.camera=new THREE.PerspectiveCamera(70,1,.055,160);
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.25;
    this.scenes={};this.refs={};this.build('corridor');this.build('classroom');this.syncTextures(source);this.resize();
    canvas.dataset.rendererReady='three';
  }
  resize(){const w=Math.max(1,this.source.canvas.clientWidth),h=Math.max(1,this.source.canvas.clientHeight);this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(h/(w*.68)*.5));this.camera.updateProjectionMatrix();}
  build(kind){
    const scene=new THREE.Scene();scene.background=new THREE.Color('#10212c');scene.fog=new THREE.FogExp2('#1a2c35',.013);scene.scale.z=-1;this.scenes[kind]=scene;
    const g=new THREE.Group();scene.add(g);const classroom=kind==='classroom',half=classroom?4.4:3,end=classroom?9.8:24.6;
    const plaster=material('#d0cbb8',{map:plasterTexture()}),lower=material('#365d60'),trim=material('#a7aa99'),base=material('#183934'),wood=material('#b69b73',{map:woodTexture(),roughness:.48,bumpScale:.013});wood.bumpMap=wood.map;
    const floor=box(g,0,-.075,end/2,half*2,.15,end,wood);floor.castShadow=false;
    box(g,0,3.08,end/2,half*2,.16,end,material('#b7beb4'));
    const wall=(x,start,finish,y=1.5,height=3)=>{
      if(height===3){box(g,x,2.085,(start+finish)/2,.18,1.83,finish-start,plaster);box(g,x,.565,(start+finish)/2,.18,1.13,finish-start,lower);box(g,x,1.15,(start+finish)/2,.22,.045,finish-start,trim);box(g,x,.06,(start+finish)/2,.22,.12,finish-start,base);}
      else box(g,x,y,(start+finish)/2,.18,height,finish-start,y<1?lower:plaster);
    };
    const frame=material('#3c635c',{metalness:.23,roughness:.48});
    const window=(x,a,b)=>{
      wall(x,a,b,.4,.8);wall(x,a,b,2.79,.42);
      const fx=x+(x<0?.015:-.015),length=b-a;
      for(const z of [a,b,(a+b)/2])box(g,fx,1.67,z,.24,1.74,.07,frame);
      for(const y of [.82,1.65,2.53])box(g,fx,y,(a+b)/2,.24,.065,length,frame);
      box(g,x+(x<0?.12:-.12),.79,(a+b)/2,.43,.07,length+.16,material('#a1a795'));
      // Transparent panes retain genuine geometry behind them.
      const glass=material('#9bbfc8',{transparent:true,opacity:.07,roughness:.12,metalness:.05,depthWrite:false});
      box(g,x,1.67,(a+b)/2,.018,1.64,length-.06,glass).castShadow=false;
    };
    if(classroom){wall(half,0,end);wall(-half,0,1.8);wall(-half,8.9,end);for(let a=1.8;a<8.9;a+=1.45)window(-half,a,Math.min(a+1.45,8.9));}
    else {wall(-half,0,end);for(const [a,b] of [[0,4],[8,12],[16,end]])wall(half,a,b);for(const [a,b] of [[4,6],[6,8],[12,14],[14,16]])window(half,a,b);}
    box(g,0,1.5,-.1,half*2,3,.2,plaster);
    if(classroom){box(g,0,1.5,end,half*2,3,.2,plaster);box(g,-.2,1.65,end-.13,6,.99,.07,material('#736948'));box(g,-.2,1.66,end-.18,5.8,.85,.03,material('#153d36'));const chalk=material('#bec9b0');for(let i=0;i<5;i++)box(g,-1.7+i*.23,1.6,end-.205,.09,.007,.005,chalk);for(const desk of [...CLASSROOM_DESKS,CLASSROOM_TEACHER_DESK])this.desk(g,desk);for(const desk of CLASSROOM_DESKS)this.chair(g,desk.x,desk.z-.72);for(let x=-3.5;x<-1.4;x+=.72){box(g,x,.48,.18,.68,.96,.45,material('#64745c'));box(g,x,.49,-.06,.012,.08,.013,trim);}}
    else {
      this.stairs(g,plaster,lower);this.refs.doors=[];
      this.doorLabels={};for(const text of ['3-2','404']){const label=document.createElement('canvas');label.width=256;label.height=112;const ctx=label.getContext('2d');ctx.fillStyle='#e1dcc5';ctx.fillRect(0,0,256,112);ctx.strokeStyle='#8c8166';ctx.lineWidth=6;ctx.strokeRect(3,3,250,106);ctx.fillStyle='#233b32';ctx.font='bold 66px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,128,58);this.doorLabels[text]=label;}
      for(const z of [5,15]){
        this.slidingDoor(g,-2.84,z);
        const d=this.picture(g,null,.62,.27,[-2.61,2.81,z],Math.PI/2);this.refs.doors.push(d);
      }
      box(g,-2.81,1.61,9,.16,1.1,1.9,material('#65513a'));box(g,-2.7,1.61,9,.08,.98,1.78,material('#97865d'));
      this.refs.photo=this.picture(g,null,1.6,1.067,[-2.646,1.65,9],Math.PI/2);
      const clockFrame=new THREE.Mesh(new THREE.CylinderGeometry(.405,.405,.13,64),material('#38251d',{roughness:.4}));clockFrame.rotation.z=Math.PI/2;clockFrame.position.set(2.83,2.08,19);clockFrame.castShadow=true;g.add(clockFrame);
      this.refs.clock=this.picture(g,null,.79,.79,[2.755,2.08,19],-Math.PI/2);this.refs.clock.material.transparent=true;this.refs.clock.material.alphaTest=.05;
      this.refs.rabbit=this.sprite(g,2.1,1.05,[1.6,1.05,22]);this.refs.ghost=this.sprite(g,2.35,1.175,[7, .875,6.5]);
      this.refs.ghost.visible=false;
      this.desk(g,{x:2,z:3.2,width:1.1,depth:.7,height:.85});
    }
    if(classroom){
      this.slidingDoor(g,0,.02,-Math.PI/2);
      const root=new THREE.Group(),tilt=new THREE.Group();root.position.set(DOLL.x,.035,DOLL.z);root.rotation.y=Math.PI;root.add(tilt);g.add(root);
      this.refs.dollRoot=root;this.refs.dollTilt=tilt;this.refs.doll=this.picture(tilt,null,DOLL.height*2/3,DOLL.height,[0,DOLL.height/2,0]);
      Object.assign(this.refs.doll.material,{transparent:true,alphaTest:.55,roughness:1});this.refs.doll.castShadow=true;
      tilt.rotation.x=Math.PI/2;
    }else{
      const print=document.createElement('canvas');print.width=512;print.height=112;const pc=print.getContext('2d');pc.fillStyle='#e9e1c9b0';
      for(const x of [92,420]){pc.beginPath();pc.ellipse(x,78,24,22,-.1,0,Math.PI*2);pc.fill();for(let i=0;i<5;i++){pc.beginPath();pc.ellipse(x-24+i*12,43-(i%3)*5,5,20,.08,0,Math.PI*2);pc.fill();}}
      this.refs.dollPrint=this.picture(g,print,1.45,.32,[-2.643,1.96,5],Math.PI/2);Object.assign(this.refs.dollPrint.material,{transparent:true,alphaTest:.1,depthWrite:false});this.refs.dollPrint.visible=false;this.refs.dollPrintBack=this.refs.dollPrint.clone();this.refs.dollPrintBack.position.z=15;g.add(this.refs.dollPrintBack);
    }
    const ambient=new THREE.HemisphereLight('#baceda','#756751',.85);scene.add(ambient);
    const moon=new THREE.DirectionalLight('#b7cfdf',1.1);moon.position.set(classroom?-16:16,24,12);moon.target.position.set(0,0,end/2);scene.add(moon,moon.target);moon.castShadow=true;moon.shadow.mapSize.set(2048,2048);Object.assign(moon.shadow.camera,{left:-30,right:30,top:40,bottom:-40,near:.5,far:90});moon.shadow.bias=-.0004;moon.shadow.normalBias=.035;
    const fixture=material('#d1d6c7',{emissive:'#dfedcf',emissiveIntensity:1.3}),housing=material('#65726d');
    for(let z=classroom?2:3;z<end;z+=classroom?4:5){box(g,0,2.94,z,1.25,.085,.43,housing);box(g,0,2.88,z,1.13,.035,.34,fixture);const light=new THREE.PointLight('#e0e5c8',13,11,2);light.position.set(0,2.65,z);scene.add(light);}
    scene.add(buildOutdoors({side:kind}));
  }
  slidingDoor(parent,x,z,angle=0){
    const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=angle;g.name='sliding-classroom-door';parent.add(g);
    const grain=document.createElement('canvas');grain.width=grain.height=256;const ctx=grain.getContext('2d');ctx.fillStyle='#c4936d';ctx.fillRect(0,0,256,256);
    for(let i=0;i<110;i++){ctx.strokeStyle=i%3?'#62351f20':'#f4cea32a';ctx.beginPath();ctx.moveTo(i*2.37,0);ctx.bezierCurveTo(i*2.37+3,80,i*2.37-3,190,i*2.37,256);ctx.stroke();}
    const wood=material('#cda182',{map:canvasTexture(grain),roughness:.65}),edge=material('#865335'),groove=material('#39291f'),metal=material('#989993',{metalness:.75,roughness:.38}),glass=material('#2b4549',{metalness:.25,roughness:.2});
    box(g,.07,1.33,0,.13,2.66,2.1,groove);
    for(const side of [-1,1]){
      const center=side*.465;
      box(g,.12,1.29,center,.065,2.52,.91,wood).name='sliding-leaf';
      // Small glazed opening and its proud wooden surround.
      box(g,.164,1.96,center,.025,.36,.55,glass).name='door-glass';
      for(const yy of [1.735,2.185])box(g,.183,yy,center,.055,.07,.69,edge);
      for(const zz of [center-.31,center+.31])box(g,.183,1.96,zz,.055,.45,.07,edge);
      for(const yy of [.35,.74,1.13,1.52]){
        box(g,.157,yy,center,.015,.30,.69,edge);box(g,.171,yy,center,.022,.27,.66,wood);
      }
      const handleZ=side*.81;
      box(g,.18,.98,handleZ,.03,.27,.063,metal).name='recessed-handle';
      box(g,.198,.98,handleZ,.01,.20,.029,groove);
    }
    for(const zz of [-1.02,1.02])box(g,.15,1.33,zz,.22,2.66,.12,wood);
    box(g,.15,2.625,0,.22,.13,2.16,wood);box(g,.235,2.54,0,.035,.035,1.91,groove).name='upper-slide-rail';
    box(g,.19,.027,0,.18,.035,1.98,metal).name='lower-slide-rail';
    box(g,.17,1.285,0,.025,2.5,.016,groove);
    return g;
  }
  picture(group,image,w,h,position,angle=0){const mat=material('#ffffff',{side:THREE.DoubleSide});const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);m.position.set(...position);m.rotation.y=angle;m.scale.x=-1;group.add(m);if(image)mat.map=canvasTexture(image);return m;}
  sprite(group,h,y,position){const m=new THREE.Sprite(new THREE.SpriteMaterial({color:'#c2c8ba',transparent:true,alphaTest:.06}));m.position.set(...position);m.scale.set(h*2/3,h,1);group.add(m);return m;}
  desk(g,d){const {x,z,width,depth,height}=d;const metal=material('#70837c',{metalness:.7,roughness:.4}),top=material('#ae9168',{roughness:.55});box(g,x,height-.025,z,width,.065,depth,top);for(const dx of [-width*.39,width*.39])for(const dz of [-depth*.35,depth*.35])box(g,x+dx,height/2,z+dz,.045,height-.04,.045,metal);box(g,x,height-.19,z,width*.87,.13,depth*.78,material('#60523d'));}
  chair(g,x,z){const metal=material('#71877e',{metalness:.7,roughness:.4}),wood=material('#aa8e62');box(g,x,.42,z,.55,.06,.46,wood);box(g,x,.67,z-.22,.55,.42,.055,wood);for(const dx of [-.21,.21])for(const dz of [-.17,.17])box(g,x+dx,.22,z+dz,.035,.44,.035,metal);}
  stairs(g,plaster,lower){const stone=material('#91988d',{roughness:.75}),stripe=material('#454f4b'),steel=material('#96aaa1',{metalness:.75,roughness:.3});
    box(g,0,1.5,24.6,1.3,3,.18,plaster);
    for(const up of [true,false]){const center=up?-1.65:1.65,sign=up?1:-1;
      for(let i=0;i<12;i++){const level=sign*(i+1)*.19,z=24.6+i*.42;box(g,center,level-.11,z+.21,2,.22,.42,stone).name=`stair-${up?'up':'down'}-${i}`;box(g,center,level+.004,z+.025,2,.008,.05,stripe);if(up)box(g,center,level-.25,z+.405,2,.3,.025,stone);}
      box(g,center,sign*2.28-.11,30.15,2,.22,1.3,stone);
      for(const x of [center-.94,center+.94]){for(let i=0;i<=12;i+=3){const z=24.6+i*.42,y=sign*i*.19;cylinder(g,[x,y,z],[x,y+.95,z],.025,steel);}cylinder(g,[x,.95,24.6],[x,sign*2.28+.95,29.64],.035,steel);cylinder(g,[x,.47,24.6],[x,sign*2.28+.47,29.64],.021,steel);}
      box(g,center,1.5,31,2,8,.2,lower);
      box(g,up?-2.76:2.76,1.5,28,.2,8,6,plaster);
    }
    box(g,-1.65,5.4,27.5,2.15,.16,6,plaster).name='stair-ceiling-up';box(g,1.65,3.08,27.5,2.15,.16,6,plaster);
  }
  syncTextures(source){
    if(!this.refs.photo)return;
    for(const t of this.textures)t.dispose();this.textures=[];
    const assign=(mesh,image)=>{if(!image||(!image.getContext&&!image.naturalWidth))return;const t=canvasTexture(image);this.textures.push(t);mesh.material.map=t;mesh.material.needsUpdate=true;};
    for(const d of this.refs.doors)assign(d,this.doorLabels[source.anomaly==='door'?'404':'3-2']);
    assign(this.refs.clock,source.clockFace);
    assign(this.refs.photo,source.anomaly==='board'?source.boardPhotoErased:source.boardPhoto);
    assign(this.refs.rabbit,source.mouthOpen?source.mascotOpen:source.mascot);
    assign(this.refs.ghost,source.windowGhost);
    const scary=dollRise(source.dollState)>.25;assign(this.refs.doll,scary?source.dollScary:source.dollImage);this.refs.doll.visible=Boolean(this.refs.doll.material.map);this.lastState='';
  }
  draw(source,time){
    const state=`${source.anomaly}|${source.mouthOpen}|${dollRise(source.dollState)>.25}`;if(state!==this.lastState){this.syncTextures(source);this.lastState=state;}
    this.refs.rabbit.position.z=source.anomaly==='figure'?16:22;this.refs.ghost.visible=source.anomaly==='window';this.refs.dollPrint.visible=source.anomaly==='doll';this.refs.dollPrintBack.visible=source.anomaly==='doll';
    const rise=dollRise(source.dollState),ease=1-Math.pow(1-rise,3);this.refs.dollTilt.rotation.x=Math.PI/2*(1-ease);this.refs.dollRoot.rotation.y=Math.PI+(source.scene==='classroom'?source.player.angle*ease:0);
    const p=source.player;const walking=source.keys.has('forward')||source.keys.has('back');const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nearDoll=source.scene==='classroom'&&facingDoll(p,3.8);const dollDistance=Math.hypot(DOLL_GAZE.x-p.x,DOLL_GAZE.z-p.z);
    const targetDollLook=nearDoll?-.95*THREE.MathUtils.clamp((3.8-dollDistance)/1.5,0,1)*(1-ease):0;
    const viewDt=Math.min(.05,Math.max(0,(time-(this.lastViewTime??time-50))/1000));this.lastViewTime=time;
    this.dollLook=(this.dollLook??targetDollLook)+(targetDollLook-(this.dollLook??targetDollLook))*(1-Math.exp(-viewDt*12));
    const dollLook=source.scene==='classroom'?this.dollLook:0;
    const descent=source.scene==='corridor'&&p.x>.65?-.65*THREE.MathUtils.clamp((p.z-21.5)/2,0,1)*Math.max(0,Math.cos(p.angle)):0;
    this.camera.position.set(p.x,1.5+(!reduced&&walking?Math.sin(time/130)*.012:0),-p.z);this.camera.lookAt(p.x+Math.sin(p.angle),this.camera.position.y+descent+dollLook,-p.z-Math.cos(p.angle));
    this.renderer.render(this.scenes[source.scene],this.camera);
  }
}
