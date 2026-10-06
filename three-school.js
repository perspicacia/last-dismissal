import {SCHOOL_TONE,paintDampWall} from './school-tone.js?v=shadow-tone-1';
import {boardPhotoFor} from './board-photo.js?v=aged-photo-1';
import {manualCameraPose} from './mouse-controls.js?v=mouse-comfort-1';
import {LEFT_ARM,RIGHT_ARM,raisedArms,rabbitParts} from './rabbit-pose.js?v=dark-blood-1';
import {rabbitArrival,rabbitSize} from './rabbit-arrival.js?v=dark-blood-1';
import {attackerImagesReady,attackerImage,attackerArrival,attackerSize,attackerPosition} from './schoolgirl-attacker.js?v=schoolgirl-attacker-1';
import {ROOMS,RABBIT_SPOT,regularClassroom,ROOM_AMBIENCE} from './exploration.js?v=mouse-comfort-1';
import {buildPortraitGhost,setPortraitTexture,buildSeatedGirl,seatedGirlLook} from './ghost-figures.js?v=human-shape-2';
import {buildClassroomBoard} from './classroom-board.js?v=chalk-writing-1';
import {SCHOOL_WINDOW,CLASSROOM_WINDOWS,buildSchoolWindow,windowWood} from './school-windows.js';
import {buildBlackCat,updateBlackCat} from './black-cat.js?v=cat-boy-likeness-1';
import {catPose} from './cat-event.js?v=cat-polish-2';
import {buildRoomProps} from './room-props.js?v=music-ghost-polish-2';
import { DOLL, DOLL_GAZE, dollRise, facingDoll } from './doll-event.js';
import {volumeFromImage} from './doll-volume.js?v=character-original-1';
import {loadStudentModel,prepareStudentModel} from './student-model.js?v=student-glb-1';
import {CORRIDOR_LAMPS,SCHOOL_DARKNESS,SchoolLighting,recordLighting} from './school-lighting.js?v=shadow-tone-1';
import {bloodiedRabbit,rabbitImageSize} from './rabbit-appearance.js?v=dark-blood-1';
import {pianoBoyLayout,pianoBoyLook} from './piano-boy.js';
import {loadPianoBoyBody} from './piano-boy-body.js?v=human-shape-2';
import {attachPianoBoyBody} from './piano-boy-volume.js?v=human-shape-2';
import * as THREE from './vendor/three.module.js';
import { buildOutdoors } from './three-outdoors.js?v=shadow-tone-1';
import { CLASSROOM_DESKS, CLASSROOM_TEACHER_DESK } from './classroom.js?v=cat-boy-likeness-1';

import {buildRoomHauntings,updateRoomHauntings,createGhostSmile,updateGhostSmile,ghostSmileAmount,ROOM_HAUNTINGS} from './room-hauntings.js?v=music-ghost-polish-1';

const material=(color,options={})=>new THREE.MeshStandardMaterial({color,roughness:.82,...options});
function box(group,x,y,z,w,h,d,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
function cylinder(group,a,b,r,mat){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,delta.length(),10),mat);m.position.copy(start.add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());m.castShadow=true;group.add(m);return m;}
function canvasTexture(image){const t=new THREE.CanvasTexture(image);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
function plasterTexture(){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=SCHOOL_TONE.plaster;ctx.fillRect(0,0,256,256);for(let i=0;i<4200;i++){const x=(i*73)%256,y=(i*117+Math.floor(i/256)*29)%256;ctx.fillStyle=i%2?'#766e6112':'#fff6d319';ctx.fillRect(x,y,1+i%3,1+i%4);}paintDampWall(ctx,256,256);const t=canvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,1);return t;}
function woodTexture(){const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');for(let row=0;row<16;row++){const v=61+(row*17)%24;ctx.fillStyle=`rgb(${v+35},${v+17},${v})`;ctx.fillRect(row*32,0,32,512);for(let i=0;i<23;i++){ctx.strokeStyle=i%2?'#19100830':'#d7aa751c';ctx.beginPath();ctx.moveTo(row*32+2+i*1.23,0);ctx.bezierCurveTo(row*32+i+5,170,row*32+i+2,320,row*32+2+i*1.23,512);ctx.stroke();}ctx.fillStyle='#211b1680';ctx.fillRect(row*32,0,1,512);ctx.fillRect(row*32,(row%3)*150,32,1);}const t=canvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,8);return t;}

export class ThreeSchoolView {
  constructor(canvas,source){
    this.source=source;this.textures=[];this.lastState='';this.camera=new THREE.PerspectiveCamera(70,1,.055,160);
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=SCHOOL_DARKNESS.exposure;
    this.scenes={};this.refs={};this.build('corridor');for(const room of ROOMS)this.build(room.id);this.syncTextures(source);this.resize();
    canvas.dataset.rendererReady='three';
    // Keep the adopted image identity until a matching 3D sculpt is approved.
    this.previewStudentModel=canvas.dataset.studentModelPreview==='true';
    if(this.previewStudentModel)this.loadStudentModel();
    else canvas.dataset.studentModelStatus='original';
    this.loadPianoBoyBody();
  }
  loadPianoBoyBody(load=loadPianoBoyBody){
    if(!this.refs.pianoBoy||this.refs.pianoBoy.userData.bodySource)return Promise.resolve();
    if(this.pianoBoyBodyLoading)return this.pianoBoyBodyLoading;
    const data=this.source.canvas.dataset;data.pianoBoyBodyStatus='loading';
    this.pianoBoyBodyLoading=Promise.resolve().then(load).then(geometry=>{
      attachPianoBoyBody(this.refs.pianoBoy,geometry);data.pianoBoyBodyStatus='ready';this.lastState='';
    }).catch(()=>{data.pianoBoyBodyStatus='fallback';}).finally(()=>{this.pianoBoyBodyLoading=null;});
    return this.pianoBoyBodyLoading;
  }
  updatePianoBoyBodyLoading(source){
    if(source.scene==='music'&&this.pianoBoyBodyScene!=='music'&&source.canvas?.dataset?.pianoBoyBodyStatus==='fallback')this.loadPianoBoyBody();
    this.pianoBoyBodyScene=source.scene;
  }
  async loadStudentModel(load=loadStudentModel){
    this.previewStudentModel=true;
    const data=this.source.canvas.dataset;data.studentModelStatus='loading';
    try{
      const asset=await load(),model=prepareStudentModel(asset,DOLL.height);
      this.refs.dollSolid=model;this.refs.dollTilt.add(model);data.studentModelStatus='ready';
      this.updateStudentModel(this.source);
    }catch{data.studentModelStatus='fallback';this.updateStudentModel(this.source);}
  }
  updateStudentModel(source){
    const solid=this.refs.dollSolid,useSolid=Boolean(this.previewStudentModel&&solid&&source.exploration);
    if(solid)solid.visible=useSolid;
    const face=this.refs.dollFace||this.refs.doll.material;
    this.refs.doll.visible=!useSolid&&Boolean(face.map)&&Boolean(this.dollVolumeReady);
    this.refs.dollRoot.position.y=useSolid?solid.userData.floorHeight:.005;
    if(source.canvas)Object.assign(source.canvas.dataset,{studentModel:useSolid?'glb':'image-volume',dollReady:String(useSolid||Boolean(this.dollVolumeReady))});
    return useSolid;
  }
  resetHauntings(){for(const attacker of Object.values(this.refs.roomAttackers||{}))attacker.visible=false;for(const rabbit of Object.values(this.refs.roomRabbits||{}))rabbit.visible=false;this.lastViewTime=null;this.dollLook=0;this.lighting?.reset();this.applyCorridorLighting(CORRIDOR_LAMPS.map(()=>1));for(const group of Object.values(this.refs.hauntings||{}))updateRoomHauntings(group,{player:this.source.player,time:0,dt:0,active:false});for(const ghost of this.refs.ambienceGhosts||[])updateGhostSmile(ghost.userData.smile,ghost,this.source.player,ghost.userData.config,{active:false});if(this.source.canvas)Object.assign(this.source.canvas.dataset,{ballActive:'false',ballHeight:'0',ghostSmile:'0',cornerVisible:'false'});}
  applyCorridorLighting(levels){
    for(const [i,lamp] of (this.refs.corridorLamps||[]).entries()){
      lamp.light.intensity=lamp.power*levels[i];
      lamp.bulb.material.emissiveIntensity=.02+lamp.glow*levels[i];
    }
    recordLighting(this.source?.canvas,levels);
  }
  updateLighting(source,time,reduced){
    this.lighting??=new SchoolLighting();
    const levels=this.lighting.update(time,{active:source.scene==='corridor'&&!source.exploration?.ended,reduced});
    this.applyCorridorLighting(levels);recordLighting(source.canvas,levels);
  }
  resize(){const w=Math.max(1,this.source.canvas.clientWidth),h=Math.max(1,this.source.canvas.clientHeight);this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(h/(w*.68)*.5));this.camera.updateProjectionMatrix();}
  build(kind){
    const scene=new THREE.Scene();scene.background=new THREE.Color(SCHOOL_TONE.sky);scene.fog=new THREE.FogExp2(SCHOOL_TONE.fog,SCHOOL_TONE.fogDensity);scene.scale.z=-1;this.scenes[kind]=scene;
    const g=new THREE.Group();scene.add(g);const classroom=kind!=='corridor',half=classroom?4.4:3,end=classroom?9.8:24.6;
    const plaster=material(SCHOOL_TONE.plasterTint,{map:plasterTexture()}),lower=material(SCHOOL_TONE.panel),trim=material(SCHOOL_TONE.trim),base=material('#183934'),wood=material('#b69b73',{map:woodTexture(),roughness:.48,bumpScale:.013});wood.bumpMap=wood.map;
    const floor=box(g,0,-.075,end/2,half*2,.15,end,wood);floor.castShadow=false;
    box(g,0,3.08,end/2,half*2,.16,end,material('#b7beb4'));
    const wall=(x,start,finish,y=1.5,height=3)=>{
      if(height===3){box(g,x,2.085,(start+finish)/2,.18,1.83,finish-start,plaster);box(g,x,.565,(start+finish)/2,.18,1.13,finish-start,lower);box(g,x,1.15,(start+finish)/2,.22,.045,finish-start,trim);box(g,x,.06,(start+finish)/2,.22,.12,finish-start,base);}
      else box(g,x,y,(start+finish)/2,.18,height,finish-start,y<1?lower:plaster);
    };
    const frame=material(SCHOOL_TONE.frame,{metalness:.23,roughness:.48});
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
    if(classroom){wall(half,0,end);wall(-half,0,1.8);wall(-half,8.9,end);const windowMat=windowWood();for(const {start:a,end:b} of CLASSROOM_WINDOWS){wall(-half,a,b,SCHOOL_WINDOW.sill/2,SCHOOL_WINDOW.sill);wall(-half,a,b,(3+SCHOOL_WINDOW.top)/2,3-SCHOOL_WINDOW.top);buildSchoolWindow(g,{x:-half,start:a,end:b,wood:windowMat});}}
    else {wall(-half,0,end);for(const [a,b] of [[0,4],[8,12],[16,end]])wall(half,a,b);for(const [a,b] of [[4,6],[6,8],[12,14],[14,16]])window(half,a,b);}
    box(g,0,1.5,-.1,half*2,3,.2,plaster);
    if(classroom){box(g,0,1.5,end,half*2,3,.2,plaster);if(regularClassroom(kind)){g.add(buildClassroomBoard(kind));for(const desk of [...CLASSROOM_DESKS,CLASSROOM_TEACHER_DESK])this.desk(g,desk);for(const desk of CLASSROOM_DESKS){const chairGroup=new THREE.Group();chairGroup.position.set(desk.x,0,desk.z-.72);if(kind==='classroom33')chairGroup.rotation.y=.16*(desk.x<0?1:-1);g.add(chairGroup);this.chair(chairGroup,0,0);}for(let x=-3.5;x<-1.4;x+=.72){box(g,x,.48,.18,.68,.96,.45,material('#64745c'));box(g,x,.49,-.06,.012,.08,.013,trim);}}else g.add(buildRoomProps(kind));}
    else {
      this.stairs(g,plaster,lower);this.refs.doors=[];
      this.doorLabels={};for(const text of ['3-1','3-2','3-3','404','음악실','무용실']){const label=document.createElement('canvas');label.width=256;label.height=112;const ctx=label.getContext('2d');ctx.fillStyle='#e1dcc5';ctx.fillRect(0,0,256,112);ctx.strokeStyle='#8c8166';ctx.lineWidth=6;ctx.strokeRect(3,3,250,106);ctx.fillStyle='#233b32';ctx.font='bold 60px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,128,58);this.doorLabels[text]=label;}
      for(const {z,label} of ROOMS){
        this.slidingDoor(g,-2.84,z);
        const d=this.picture(g,null,.62,.27,[-2.61,2.81,z],Math.PI/2);d.userData.label=label.replace(' 교실','');this.refs.doors.push(d);
      }
      box(g,-2.81,1.61,9,.16,1.1,1.9,material('#65513a'));box(g,-2.7,1.61,9,.08,.98,1.78,material('#97865d'));
      this.refs.photo=this.picture(g,null,1.05,.70,[-2.646,1.61,9],Math.PI/2);
      this.refs.photo.material.transparent=true;this.refs.photo.material.alphaTest=.4;
      const clockFrame=new THREE.Mesh(new THREE.CylinderGeometry(.405,.405,.13,64),material('#38251d',{roughness:.4}));clockFrame.rotation.z=Math.PI/2;clockFrame.position.set(2.83,2.08,19);clockFrame.castShadow=true;g.add(clockFrame);
      this.refs.clock=this.picture(g,null,.79,.79,[2.755,2.08,19],-Math.PI/2);this.refs.clock.material.transparent=true;this.refs.clock.material.alphaTest=.05;
      this.refs.rabbit=this.sprite(g,2.1,1.05,[1.6,1.05,22]);this.refs.ghost=this.sprite(g,2.35,1.175,[7, .875,6.5]);
      this.refs.ghost.visible=false;
      this.desk(g,{x:2,z:3.2,width:1.1,depth:.7,height:.85});
    }
    if(classroom){
      this.slidingDoor(g,0,.02,-Math.PI/2);
      if(kind==='classroom'){const root=new THREE.Group(),tilt=new THREE.Group();root.position.set(DOLL.x,.005,DOLL.z);root.rotation.y=Math.PI;root.add(tilt);g.add(root);
      this.refs.dollRoot=root;this.refs.dollTilt=tilt;this.refs.doll=this.picture(tilt,null,DOLL.height*2/3,DOLL.height,[0,DOLL.height/2,0]);
      Object.assign(this.refs.doll.material,{transparent:true,alphaTest:.55,roughness:1});this.refs.doll.castShadow=true;this.refs.doll.receiveShadow=true;
      tilt.rotation.x=Math.PI/2;this.contactShadow(g,DOLL.x,.008,DOLL.z-DOLL.height*.5,.70,1.55);}
      this.addAmbience(g,kind);
      const haunting=buildRoomHauntings(kind);g.add(haunting);(this.refs.hauntings??={})[kind]=haunting;
      (this.refs.roomRabbits??={})[kind]=this.rabbitRig(g);this.refs.roomRabbits[kind].visible=false;
      const attacker=this.sprite(g,1.85,.925,[0,.925,6.8]);attacker.name='schoolgirl-attacker';attacker.visible=false;
      (this.refs.roomAttackers??={})[kind]=attacker;
    }else{
      const print=document.createElement('canvas');print.width=512;print.height=112;const pc=print.getContext('2d');pc.fillStyle='#e9e1c9b0';
      for(const x of [92,420]){pc.beginPath();pc.ellipse(x,78,24,22,-.1,0,Math.PI*2);pc.fill();for(let i=0;i<5;i++){pc.beginPath();pc.ellipse(x-24+i*12,43-(i%3)*5,5,20,.08,0,Math.PI*2);pc.fill();}}
      this.refs.dollPrint=this.picture(g,print,1.45,.32,[-2.643,1.96,5],Math.PI/2);Object.assign(this.refs.dollPrint.material,{transparent:true,alphaTest:.1,depthWrite:false});this.refs.dollPrint.visible=false;this.refs.dollPrintBack=this.refs.dollPrint.clone();this.refs.dollPrintBack.position.z=15;g.add(this.refs.dollPrintBack);
    }
    const ambient=new THREE.HemisphereLight(SCHOOL_TONE.ambientSky,SCHOOL_TONE.ambientGround,kind==='classroom33'?SCHOOL_DARKNESS.deepAmbient:SCHOOL_DARKNESS.ambient);scene.add(ambient);
    const moon=new THREE.DirectionalLight(SCHOOL_TONE.moon,SCHOOL_DARKNESS.moon);moon.position.set(classroom?-16:16,24,12);moon.target.position.set(0,0,end/2);scene.add(moon,moon.target);moon.castShadow=true;moon.shadow.mapSize.set(2048,2048);Object.assign(moon.shadow.camera,{left:-30,right:30,top:40,bottom:-40,near:.5,far:90});moon.shadow.bias=-.0004;moon.shadow.normalBias=.035;
    const housing=material('#65726d');
    if(!classroom)this.refs.corridorLamps=[];
    for(const z of classroom?[2,6]:CORRIDOR_LAMPS){
      const fixture=material('#8b9486',{emissive:SCHOOL_TONE.lampEmission,emissiveIntensity:.02+SCHOOL_DARKNESS.lampGlow});
      box(g,0,2.94,z,1.25,.085,.43,housing);const bulb=box(g,0,2.88,z,1.13,.035,.34,fixture);
      const light=new THREE.PointLight(SCHOOL_TONE.lamp,SCHOOL_DARKNESS.lampPower,SCHOOL_TONE.lampRange,2);light.position.set(0,2.65,z);scene.add(light);
      if(!classroom)this.refs.corridorLamps.push({bulb,light,power:SCHOOL_DARKNESS.lampPower,glow:SCHOOL_DARKNESS.lampGlow});
    }
    scene.add(buildOutdoors({side:classroom?'classroom':'corridor'}));
    const cat=buildBlackCat();g.add(cat);(this.refs.cats??={})[kind]=cat;
  }
  contactShadow(parent,x,y,z,width,length){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');
    const gradient=ctx.createRadialGradient(64,64,12,64,64,64);gradient.addColorStop(0,'rgba(0,0,0,.65)');gradient.addColorStop(.55,'rgba(0,0,0,.38)');gradient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
    const shadow=new THREE.Mesh(new THREE.PlaneGeometry(width,length),new THREE.MeshBasicMaterial({map:canvasTexture(canvas),transparent:true,depthWrite:false}));shadow.name='doll-contact-shadow';shadow.rotation.x=-Math.PI/2;shadow.position.set(x,y,z);parent.add(shadow);return shadow;
  }
  addAmbience(parent,kind){
    if(kind==='classroom')parent.add(buildSeatedGirl());
    const config=ROOM_AMBIENCE[kind];if(!config)return;
    if(config.faceless){const p=config.faceless,mesh=buildPortraitGhost('faceless',p);parent.add(mesh);
      this.refs.facelessStudent=mesh;
      this.contactShadow(parent,p.x,.009,p.z,.55,.4).name='faceless-student-feet-shadow';
    }
    if(config.boy){const p=config.boy,mesh=buildPortraitGhost('boy',p);parent.add(mesh);
      this.refs.pianoBoy=mesh;
      this.contactShadow(parent,p.x,.009,p.z,.32,.30).name='piano-boy-feet-shadow';
      this.contactShadow(parent,2.68,p.y+.003,p.z,.36,.44).name='piano-boy-seat-shadow';
    }
    if(config.student){const p=config.student,root=new THREE.Group(),tilt=new THREE.Group();root.name='ambience-student-doll';root.position.set(p.x,p.y,p.z);root.rotation.y=Math.PI;root.scale.setScalar(p.height/DOLL.height);tilt.rotation.x=Math.PI/2;root.add(tilt);parent.add(root);
      const mesh=this.picture(tilt,null,DOLL.height*2/3,DOLL.height,[0,DOLL.height/2,0]);Object.assign(mesh.material,{transparent:true,alphaTest:.55,roughness:1});mesh.castShadow=true;mesh.receiveShadow=true;(this.refs.ambienceDolls??=[]).push(mesh);
      this.contactShadow(parent,p.x,p.y+.003,p.z-p.height*.5,p.height*.48,p.height);
    }
    if(config.ghost){const p=config.ghost,ghost=this.sprite(parent,p.height,p.y,[p.x,p.y,p.z]);ghost.name='ambience-window-ghost';ghost.userData.room=kind;const smile=createGhostSmile(p);parent.add(smile);ghost.userData.smile=smile;ghost.userData.config=p;(this.refs.ambienceGhosts??=[]).push(ghost);}
  }
  slidingDoor(parent,x,z,angle=0){
    const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=angle;g.name='sliding-classroom-door';parent.add(g);
    const grain=document.createElement('canvas');grain.width=grain.height=256;const ctx=grain.getContext('2d');ctx.fillStyle='#c4936d';ctx.fillRect(0,0,256,256);
    for(let i=0;i<110;i++){ctx.strokeStyle=i%3?'#62351f20':'#f4cea32a';ctx.beginPath();ctx.moveTo(i*2.37,0);ctx.bezierCurveTo(i*2.37+3,80,i*2.37-3,190,i*2.37,256);ctx.stroke();}
    const wood=material('#cda182',{map:canvasTexture(grain),roughness:.65}),edge=material('#865335'),groove=material('#39291f'),metal=material('#989993',{metalness:.75,roughness:.38}),glass=material('#2b4549',{metalness:.25,roughness:.2});
    box(g,.07,1.33,0,.13,2.66,2.1,material('#071316',{roughness:1}));
    for(const side of [-1,1]){
      const center=side*.465,leaf=new THREE.Group();leaf.userData.side=side;g.add(leaf);(g.userData.leaves??=[]).push(leaf);
      box(leaf,.12,1.29,center,.065,2.52,.91,wood).name='sliding-leaf';
      // Small glazed opening and its proud wooden surround.
      box(leaf,.164,1.96,center,.025,.36,.55,glass).name='door-glass';
      for(const yy of [1.735,2.185])box(leaf,.183,yy,center,.055,.07,.69,edge);
      for(const zz of [center-.31,center+.31])box(leaf,.183,1.96,zz,.055,.45,.07,edge);
      for(const yy of [.35,.74,1.13,1.52]){
        box(leaf,.157,yy,center,.015,.30,.69,edge);box(leaf,.171,yy,center,.022,.27,.66,wood);
      }
      const handleZ=side*.81;
      box(leaf,.18,.98,handleZ,.03,.27,.063,metal).name='recessed-handle';
      box(leaf,.198,.98,handleZ,.01,.20,.029,groove);
    }
    for(const zz of [-1.02,1.02])box(g,.15,1.33,zz,.22,2.66,.12,wood);
    box(g,.15,2.625,0,.22,.13,2.16,wood);box(g,.235,2.54,0,.035,.035,1.91,groove).name='upper-slide-rail';
    box(g,.19,.027,0,.18,.035,1.98,metal).name='lower-slide-rail';
    box(g,.17,1.285,0,.025,2.5,.016,groove);
    return g;
  }
  picture(group,image,w,h,position,angle=0){const mat=material('#ffffff',{side:THREE.DoubleSide});const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);m.position.set(...position);m.rotation.y=angle;m.scale.x=-1;group.add(m);if(image)mat.map=canvasTexture(image);return m;}
  rabbitRig(parent){
    const root=new THREE.Group();root.name='rabbit-arm-rig';parent.add(root);
    const body=this.sprite(root,2.1,1.05,[0,0,0]);
    const arms=[LEFT_ARM,RIGHT_ARM].map((arm,i)=>{const sprite=this.sprite(root,2.1,1.05,[0,0,.003]);sprite.name=i?'rabbit-right-arm':'rabbit-left-arm';sprite.center.set(arm.pivot.x,1-arm.pivot.y);return sprite;});
    root.userData={body,arms};return root;
  }
  sprite(group,h,y,position){const m=new THREE.Sprite(new THREE.SpriteMaterial({color:'#c2c8ba',transparent:true,alphaTest:.06}));m.position.set(...position);m.scale.set(h*2/3,h,1);group.add(m);return m;}
  furnitureMaterials(){
    if(this.furnitureMats)return this.furnitureMats;
    const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle='#c39a61';ctx.fillRect(0,0,256,256);
    for(let i=0;i<100;i++){ctx.strokeStyle=i%3?'#57371925':'#ffe0a733';ctx.beginPath();ctx.moveTo(0,i*2.55);ctx.bezierCurveTo(85,i*2.55+Math.sin(i)*3,165,i*2.55-2,256,i*2.55);ctx.stroke();}
    return this.furnitureMats={wood:material('#ebc792',{map:canvasTexture(canvas),roughness:.48}),steel:material('#a2aca8',{metalness:.55,roughness:.42}),tray:material('#65716e',{metalness:.4,roughness:.6}),rubber:material('#242b28',{roughness:1})};
  }
  roundedPanel(g,width,height,thickness,position,mat,angle=0){
    const w=width/2,h=height/2,r=Math.min(.045,width/8,height/8),s=new THREE.Shape();
    s.moveTo(-w+r,-h);s.lineTo(w-r,-h);s.quadraticCurveTo(w,-h,w,-h+r);s.lineTo(w,h-r);s.quadraticCurveTo(w,h,w-r,h);s.lineTo(-w+r,h);s.quadraticCurveTo(-w,h,-w,h-r);s.lineTo(-w,-h+r);s.quadraticCurveTo(-w,-h,-w+r,-h);
    const geo=new THREE.ExtrudeGeometry(s,{depth:thickness,bevelEnabled:true,bevelThickness:.004,bevelSize:.004,bevelSegments:2,curveSegments:6});geo.translate(0,0,-thickness/2);
    // Extrusion UVs use shape units; normalize the wooden faces to one grain tile.
    const uv=geo.getAttribute('uv');for(let i=0;i<uv.count;i++)uv.setXY(i,(uv.getX(i)+w)/width,(uv.getY(i)+h)/height);
    const mesh=new THREE.Mesh(geo,mat);mesh.position.set(...position);mesh.rotation.x=angle;mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);return mesh;
  }
  desk(g,d){
    const {x,z,width,depth,height}=d,{wood,steel,tray,rubber}=this.furnitureMaterials();
    const group=new THREE.Group();group.name='school-desk';g.add(group);
    this.roundedPanel(group,width,depth,.045,[x,height-.0225,z],wood,-Math.PI/2).name='desk-rounded-top';
    for(const dx of [-width*.39,width*.39])for(const dz of [-depth*.35,depth*.35]){
      box(group,x+dx,height/2-.025,z+dz,.048,height-.05,.048,steel);
      box(group,x+dx,.025,z+dz,.055,.05,.055,rubber).name='desk-rubber-foot';
    }
    box(group,x,.24,z+depth*.35,width*.78,.033,.033,steel);
    for(const dx of [-width*.39,width*.39])box(group,x+dx,height-.09,z,.033,.033,depth*.7,steel);
    box(group,x,height-.205,z,width*.85,.018,depth*.76,tray).name='desk-cubby-bottom';
    for(const dx of [-width*.43,width*.43])box(group,x+dx,height-.125,z,.016,.16,depth*.76,tray);
    box(group,x,height-.125,z+depth*.38,width*.86,.16,.018,tray); // Open toward the chair.
  }
  chair(g,x,z){
    const {wood,steel,rubber}=this.furnitureMaterials(),group=new THREE.Group();group.name='school-chair';g.add(group);
    this.roundedPanel(group,.52,.46,.026,[x,.435,z],wood,-Math.PI/2).name='chair-rounded-seat';
    this.roundedPanel(group,.46,.21,.025,[x,.735,z-.255],wood,-.09).name='chair-wood-back';
    const points=[[-.235,.025,-.27],[-.235,.44,-.18],[-.235,.80,-.26],[-.20,.855,-.27],[.20,.855,-.27],[.235,.80,-.26],[.235,.44,-.18],[.235,.025,-.27]].map(([dx,y,dz])=>new THREE.Vector3(x+dx,y,z+dz));
    const frame=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),48,.022,8,false),steel);frame.name='chair-bent-frame';frame.castShadow=true;group.add(frame);
    for(const dx of [-.235,.235]){
      cylinder(group,[x+dx,.025,z+.19],[x+dx,.43,z+.16],.022,steel);
      cylinder(group,[x+dx,.21,z-.235],[x+dx,.21,z+.18],.018,steel);
      for(const dz of [-.27,.19])cylinder(group,[x+dx,0,z+dz],[x+dx,.052,z+dz],.026,rubber).name='chair-rubber-foot';
    }
    cylinder(group,[x-.235,.21,z+.18],[x+.235,.21,z+.18],.018,steel);
  }
  stairs(g,plaster,lower){const stone=material('#91988d',{roughness:.75}),stripe=material('#454f4b'),steel=material('#96aaa1',{metalness:.75,roughness:.3});
    box(g,0,1.5,27.8,1.3,8,6.6,plaster).name='stair-central-wall';
    for(const x of [-.655,.655])box(g,x,-.68,27.8,.025,3.66,6.6,lower);
    for(const up of [true,false]){const center=up?-1.65:1.65,sign=up?1:-1;
      for(let i=0;i<12;i++){const level=sign*(i+1)*.19,z=24.6+i*.42;box(g,center,level-.11,z+.21,2,.22,.42,stone).name=`stair-${up?'up':'down'}-${i}`;box(g,center,level+.004,z+.025,2,.008,.05,stripe);if(up)box(g,center,level-.25,z+.405,2,.3,.025,stone);}
      box(g,center,sign*2.28-.11,30.15,2,.22,1.3,stone);
      for(const x of [center-.94,center+.94]){for(let i=0;i<=12;i+=3){const z=24.6+i*.42,y=sign*i*.19;cylinder(g,[x,y,z],[x,y+.95,z],.025,steel);}cylinder(g,[x,.95,24.6],[x,sign*2.28+.95,29.64],.035,steel);cylinder(g,[x,.47,24.6],[x,sign*2.28+.47,29.64],.021,steel);}
      box(g,center,1.5,31,2,8,.2,lower);
      box(g,up?-2.76:2.76,1.5,27.8,.2,8,6.6,plaster).name=`stair-outer-wall-${up?'up':'down'}`;
    }
    box(g,-1.65,5.4,27.8,2.15,.16,6.6,plaster).name='stair-ceiling-up';box(g,1.65,3.08,27.8,2.15,.16,6.6,plaster);
  }
  partsFor(image){this.rabbitPartCache??=new WeakMap();if(!rabbitImageSize(image))return null;if(!this.rabbitPartCache.has(image))this.rabbitPartCache.set(image,rabbitParts(image));return this.rabbitPartCache.get(image);}
  syncTextures(source){
    if(!this.refs.photo)return;
    for(const t of this.textures)t.dispose();this.textures=[];
    const textureCache=new Map();
    const assign=(mesh,image)=>{if(!image||image.complete===false||(!image.getContext&&!image.naturalWidth))return;let t=textureCache.get(image);if(!t){t=canvasTexture(image);textureCache.set(image,t);this.textures.push(t);}mesh.material.map=t;mesh.material.needsUpdate=true;};
    for(const d of this.refs.doors)assign(d,this.doorLabels[source.anomaly==='door'?'404':d.userData.label]);
    assign(this.refs.clock,source.clockFace);
    const boardPhoto=boardPhotoFor(source);this.refs.photo.visible=Boolean(boardPhoto);
    assign(this.refs.photo,boardPhoto);
    const originalRabbit=source.mouthOpen?source.mascotOpen:source.mascot;const rabbitSkin=originalRabbit?.naturalWidth?bloodiedRabbit(originalRabbit):originalRabbit;
    if(source.canvas)source.canvas.dataset.rabbitAppearance=rabbitSkin&&rabbitSkin!==originalRabbit?'bloodied':'loading';
    assign(this.refs.rabbit,rabbitSkin);for(const rabbit of Object.values(this.refs.roomRabbits||{})){const parts=this.partsFor(rabbitSkin);if(parts){assign(rabbit.userData.body,parts.body);assign(rabbit.userData.arms[0],parts.left);assign(rabbit.userData.arms[1],parts.right);}}
    const schoolgirl=attackerImage(source,source.mouthOpen);for(const attacker of Object.values(this.refs.roomAttackers||{}))assign(attacker,schoolgirl);
    assign(this.refs.ghost,source.windowGhost);for(const ghost of this.refs.ambienceGhosts||[])assign(ghost,source.windowGhost);
    for(const [root,image] of [[this.refs.pianoBoy,source.pianoBoy],[this.refs.facelessStudent,source.facelessStudent]])if(root){
      root.visible=Boolean(image?.complete!==false&&image?.naturalWidth>0&&image?.naturalHeight>0);
      if(root.visible){let texture=textureCache.get(image);if(!texture){texture=canvasTexture(image);textureCache.set(image,texture);this.textures.push(texture);}setPortraitTexture(root,image,texture);}
    }
    if(!this.dollVolumeReady&&source.dollImage?.naturalWidth){
      const volume=volumeFromImage(source.dollImage);if(volume){this.refs.doll.geometry.dispose();this.refs.doll.geometry=volume;this.refs.dollFace=this.refs.doll.material;this.refs.doll.material=[this.refs.dollFace,material('#ffffff',{vertexColors:true,side:THREE.DoubleSide,roughness:.9})];this.dollVolumeReady=true;}
    }
    for(const mesh of this.refs.ambienceDolls||[]){if(this.dollVolumeReady&&!mesh.userData.volumeReady){mesh.geometry.dispose();mesh.geometry=this.refs.doll.geometry;mesh.material=[mesh.material,material('#ffffff',{vertexColors:true,side:THREE.DoubleSide,roughness:.9})];mesh.userData.volumeReady=true;}assign({material:Array.isArray(mesh.material)?mesh.material[0]:mesh.material},source.dollImage);mesh.visible=Boolean(this.dollVolumeReady);}
    const scary=dollRise(source.dollState)>.25;const face=this.refs.dollFace||this.refs.doll.material;
    assign({material:face},scary?source.dollScary:source.dollImage);this.updateStudentModel(source);if(source.canvas)Object.assign(source.canvas.dataset,{dollImageSize:`${source.dollImage?.naturalWidth}x${source.dollImage?.naturalHeight}`,dollMesh:String(this.refs.doll.geometry.index?.count)});this.lastState='';
  }
  draw(source,time){
    this.updatePianoBoyBodyLoading(source);
    const state=`${source.attackerKind}|${Boolean(source.exploration)}|${source.anomaly}|${source.mouthOpen}|${dollRise(source.dollState)>.25}`;if(state!==this.lastState){this.syncTextures(source);this.lastState=state;}
    const schoolgirl=source.attackerKind==='schoolgirl';
    this.refs.rabbit.visible=!schoolgirl&&!source.exploration;
    for(const [room,attacker] of Object.entries(this.refs.roomAttackers||{})){
      attacker.visible=Boolean(schoolgirl&&attackerImagesReady(source)&&source.exploration?.ended&&source.scene===room);
      if(attacker.visible){
        const arrival=attackerArrival((time-source.caughtAt)/1000,window.matchMedia('(prefers-reduced-motion: reduce)').matches),position=attackerPosition(source.player,arrival),size=attackerSize(attackerImage(source,arrival.attack),arrival.growth);
        attacker.position.set(position.x,position.y,position.z);attacker.scale.set(size.width,size.height,1);
        if(source.canvas)Object.assign(source.canvas.dataset,{attackerVisible:'true',attackerExpression:arrival.attack?'attack':'normal'});
      }
    }
    for(const [room,rabbit] of Object.entries(this.refs.roomRabbits||{})){
      rabbit.visible=Boolean(!schoolgirl&&source.exploration?.ended&&source.scene===room);
      if(rabbit.visible){
        const arrival=rabbitArrival((time-source.caughtAt)/1000,window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        const p=source.player,goal={x:p.x+Math.sin(p.angle)*.80,z:p.z+Math.cos(p.angle)*.80};
        rabbit.position.set(THREE.MathUtils.lerp(RABBIT_SPOT.x,goal.x,arrival.rush),arrival.centerY+(p.manualLook?Math.tan(p.pitch||0)*.80*arrival.rush:0),THREE.MathUtils.lerp(RABBIT_SPOT.z,goal.z,arrival.rush));
        const size=rabbitSize(source.mouthOpen?source.mascotOpen:source.mascot,arrival.growth);
        rabbit.rotation.y=p.angle;
        rabbit.userData.body.scale.set(size.width,size.height,1);
        const pose=raisedArms((time-source.caughtAt)/1000,window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        if(source.canvas)source.canvas.dataset.rabbitArms=pose.lift.toFixed(2);
        for(const [i,arm] of [LEFT_ARM,RIGHT_ARM].entries()){const sprite=rabbit.userData.arms[i];sprite.scale.set(size.width*(1+.2*pose.lift),size.height*(1+.2*pose.lift),1);sprite.position.set((arm.pivot.x-.5)*size.width,(.5-arm.pivot.y)*size.height,.003);sprite.material.rotation=-(i?pose.right:pose.left);}
      }
    }
    this.refs.rabbit.position.z=source.rabbitZ??(source.anomaly==='figure'?16:22);
    if(source.survival){const door=this.scenes.classroom.getObjectByName('sliding-classroom-door');const closed=source.survival.doorUntil>source.survival.elapsed;for(const leaf of door.userData.leaves)leaf.position.z=closed?0:leaf.userData.side*.72;}this.refs.ghost.visible=source.anomaly==='window';this.refs.dollPrint.visible=source.anomaly==='doll';this.refs.dollPrintBack.visible=source.anomaly==='doll';
    const solid=this.updateStudentModel(source),rise=solid?0:dollRise(source.dollState),ease=1-Math.pow(1-rise,3);this.refs.dollTilt.rotation.x=Math.PI/2*(1-ease);this.refs.dollRoot.rotation.y=Math.PI*(1-ease)+(source.scene==='classroom'?source.player.angle*ease:0);
    const p=source.player;const walking=source.keys.has('forward')||source.keys.has('back');const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cat=catPose(source.catEvent,reduced);for(const [room,model] of Object.entries(this.refs.cats||{}))updateBlackCat(model,room===source.scene&&!source.exploration?.ended?cat:null);
    const nearDoll=source.scene==='classroom'&&facingDoll(p,3.8);const dollDistance=Math.hypot(DOLL_GAZE.x-p.x,DOLL_GAZE.z-p.z);
    const headDistance=Math.hypot(DOLL.x-p.x,DOLL.z-DOLL.height*.78-p.z);
    let targetDollLook=nearDoll?-Math.min(3.2,1.30/Math.max(.35,headDistance))*THREE.MathUtils.clamp((3.8-dollDistance)/1.5,0,1)*(1-ease):0;
    const ambience=ROOM_AMBIENCE[source.scene]?.student;
    if(ambience){const dx=ambience.x-p.x,dz=ambience.z-ambience.height*.5-p.z,distance=Math.hypot(dx,dz);const facing=(dx*Math.sin(p.angle)+dz*Math.cos(p.angle))/Math.max(.001,distance);
      if(distance<3.5&&facing>.7)targetDollLook=-(1.5-ambience.y-.18)/Math.max(.5,distance)*THREE.MathUtils.clamp((3.5-distance)/1.2,0,1);}
    const boy=ROOM_AMBIENCE[source.scene]?.boy,boyPose=pianoBoyLayout(source.pianoBoy,boy);
    if(boyPose)targetDollLook=pianoBoyLook(p,source.pianoBoy,boy);
    if(source.scene==='classroom'){const girlLook=seatedGirlLook(p);if(girlLook)targetDollLook=girlLook;}
    const corner=ROOM_HAUNTINGS[source.scene]?.corner;if(corner){const dx=corner.x-p.x,dz=corner.z-p.z,distance=Math.hypot(dx,dz);if(distance<4&&(dx*Math.sin(p.angle)+dz*Math.cos(p.angle))/Math.max(.001,distance)>.85)targetDollLook=-.94/Math.max(.6,distance);}
    const nearGhost=ROOM_AMBIENCE[source.scene]?.ghost;if(nearGhost&&ghostSmileAmount(p,nearGhost,{active:!source.exploration?.ended}))targetDollLook=(nearGhost.y+nearGhost.height*.327-1.5)/Math.max(.6,Math.hypot(nearGhost.x-p.x,nearGhost.z-p.z));
    const viewDt=Math.min(.05,Math.max(0,(time-(this.lastViewTime??time-50))/1000));this.lastViewTime=time;
    this.updateLighting(source,time,reduced);
    let ballActive=false,ballHeight=0,cornerVisible=false,ghostSmile=0;
    for(const [room,group] of Object.entries(this.refs.hauntings||{})){const result=updateRoomHauntings(group,{player:p,time:time/1000,dt:viewDt,reduced,active:source.scene===room&&!source.exploration?.ended});if(source.scene===room){({ballActive,ballHeight,cornerVisible}=result);}}
    if(source.canvas)Object.assign(source.canvas.dataset,{ballActive:String(ballActive),ballHeight:(ballHeight??0).toFixed(3),ghostSmile:ghostSmile.toFixed(2),cornerVisible:String(cornerVisible)});
    this.dollLook=(this.dollLook??targetDollLook)+(targetDollLook-(this.dollLook??targetDollLook))*(1-Math.exp(-viewDt*12));
    const dollLook=source.scene==='classroom'||ambience||nearGhost||boyPose?this.dollLook:0;
    const descent=source.scene==='corridor'&&p.x>.65?-.65*THREE.MathUtils.clamp((p.z-21.5)/2,0,1)*Math.max(0,Math.cos(p.angle)):0;
    if(p.manualLook){const pose=manualCameraPose(p);this.camera.position.set(pose.x,pose.y,pose.z);this.camera.lookAt(pose.targetX,pose.targetY,pose.targetZ);}
    else {this.camera.position.set(p.x,1.5+(!reduced&&walking?Math.sin(time/130)*.012:0),-p.z);this.camera.lookAt(p.x+Math.sin(p.angle),this.camera.position.y+descent+dollLook,-p.z-Math.cos(p.angle));}
    if(source.canvas)Object.assign(source.canvas.dataset,{cameraHeight:this.camera.position.y.toFixed(3),cameraPitch:String(p.pitch||0)});
    this.camera.updateMatrixWorld();if(p.manualLook)for(const rabbit of Object.values(this.refs.roomRabbits||{}))if(rabbit.visible)rabbit.quaternion.copy(this.camera.quaternion);this.scenes[source.scene].updateMatrixWorld(true);
    for(const ghost of this.refs.ambienceGhosts||[]){const amount=updateGhostSmile(ghost.userData.smile,ghost,p,ghost.userData.config,{camera:this.camera,dt:viewDt,reduced,active:source.scene===ghost.userData.room&&!source.exploration?.ended});if(source.scene===ghost.userData.room)ghostSmile=amount;}
    if(source.canvas)source.canvas.dataset.ghostSmile=ghostSmile.toFixed(2);
    this.renderer.render(this.scenes[source.scene],this.camera);
  }
}
