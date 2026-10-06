import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_SENSITIVITY,MAX_PITCH,inputAction,lookPlayer,lookKeyAction,keyboardLookPlayer,manualCameraPose,MouseLookController} from '../mouse-controls.js';
import {DEFAULT_LOOK_SETTINGS,LOOK_STORAGE_KEY,normalizeLookSettings,loadLookSettings,saveLookSettings} from '../camera-preferences.js';
import {movePlayer,movementDelta} from '../movement.js';
import {moveClassroomPlayer} from '../classroom.js';
import {ROOM_BLOCKERS} from '../room-props.js';
import {seesRabbit} from '../exploration.js';
const player={x:0,z:2,angle:0,pitch:.2,manualLook:true};
const keys=(...names)=>new Set(names);
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('WASD uses strafing while arrows retain rotation and movement',()=>{
 assert.equal(inputAction('A'),'strafeLeft');assert.equal(inputAction('d'),'strafeRight');assert.equal(inputAction('W'),'forward');assert.equal(inputAction('s'),'back');
 assert.equal(inputAction('ArrowLeft'),'left');assert.equal(inputAction('ArrowRight'),'right');assert.equal(inputAction('ArrowUp'),'forward');assert.equal(inputAction('ArrowDown'),'back');assert.equal(inputAction('q'),null);
 assert.equal(inputAction('ㅈ','KeyW'),'forward');assert.equal(inputAction('A','KeyA'),'strafeLeft');assert.equal(inputAction('ArrowLeft','ArrowLeft'),'left');
});
test('strafe direction follows yaw without rotating or losing pitch',()=>{
 for(const move of [movePlayer,moveClassroomPlayer]){
  const right=move(player,keys('strafeRight'),.05);close(right.x,.15);close(right.z,2);close(right.angle,0);close(right.pitch,.2);
  const left=move({...player,angle:Math.PI/2},keys('strafeLeft'),.05);close(left.z,2.15);close(left.angle,Math.PI/2);
 }
});
test('diagonals are normalized, opposing inputs cancel and long frames are capped',()=>{
 const straight=movementDelta(player,keys('forward'),.05),diagonal=movementDelta(player,keys('forward','strafeRight'),.05);
 close(Math.hypot(straight.dx,straight.dz),Math.hypot(diagonal.dx,diagonal.dz));
 assert.deepEqual(movementDelta(player,keys('forward','back','strafeLeft','strafeRight'),.05),{angle:0,dx:0,dz:0});
 assert.deepEqual(movePlayer(player,keys('forward'),5),movePlayer(player,keys('forward'),.05));assert.deepEqual(movePlayer(player,keys('forward'),NaN),player);
 close(movePlayer(player,keys('right'),.05).angle,.0525);
});
test('strafe keeps all room props and corridor walls solid',()=>{
 assert.equal(movePlayer({...player,x:2.55},keys('strafeRight'),.05).x,2.55);
 assert.equal(moveClassroomPlayer({...player,x:4},keys('strafeRight'),.05).x,4);
 for(const blockers of Object.values(ROOM_BLOCKERS))for(const obstacle of blockers){
  const start={...player,x:obstacle.x-obstacle.width/2-.23,z:obstacle.z};
  // Only fixtures within the playable wall bounds are reachable.
  if(start.x< -4||start.x>4||start.z<.8||start.z>9.2)continue;
  assert.equal(moveClassroomPlayer(start,keys('strafeRight'),.05,blockers).x,start.x);
 }
});
test('mouse movement is proportional, reversible, bounded and rejects bad device deltas',()=>{
 const p={...player,pitch:0},look=lookPlayer(p,100,80);close(look.angle,.13);close(look.pitch,-.052);
 assert.deepEqual(lookPlayer(look,-100,-80),p);
 close(lookPlayer(p,100,0,DEFAULT_SENSITIVITY/2).angle,look.angle/2);
 let result=p;for(let i=0;i<100;i++)result=lookPlayer(result,0,200);close(result.pitch,-MAX_PITCH);
 for(let i=0;i<100;i++)result=lookPlayer(result,0,-200);close(result.pitch,MAX_PITCH);
 assert.equal(lookPlayer(p,NaN,1),p);assert.equal(lookPlayer(p,1,Infinity),p);close(lookPlayer(p,10000,0).angle,.26);
});
test('horizontal and vertical sensitivity are independent, with a slower vertical default and optional level lock',()=>{
 const p={...player,pitch:0};
 const first=lookPlayer(p,100,100,{horizontal:.8,vertical:.25});close(first.angle,.16);close(first.pitch,-.05);
 const slowerY=lookPlayer(p,100,100,{horizontal:.8,vertical:.125});close(slowerY.angle,first.angle);close(slowerY.pitch,first.pitch/2);
 const slowerX=lookPlayer(p,100,100,{horizontal:.4,vertical:.25});close(slowerX.angle,first.angle/2);close(slowerX.pitch,first.pitch);
 const locked={...DEFAULT_LOOK_SETTINGS,verticalLocked:true};
 const level=lookPlayer({...p,pitch:-.6},100,-200,locked);close(level.pitch,0);close(level.angle,.13);
 close(lookPlayer(level,0,200,locked).pitch,0);
 close(lookPlayer(level,0,100,{...locked,verticalLocked:false}).pitch,-.065);
 assert.equal(seesRabbit({x:0,z:4,angle:0,pitch:level.pitch,manualLook:true}),true);
 close(lookPlayer(p,100,100,.4).pitch,-.08); // Preserve legacy shared-gain calls.
});
test('keyboard-only vertical viewing is bounded, reversible and ignores system shortcuts',()=>{
 assert.equal(lookKeyAction('PageUp','PageUp'),'lookUp');assert.equal(lookKeyAction('PageDown'),'lookDown');assert.equal(lookKeyAction('Home'),'levelLook');assert.equal(lookKeyAction('ArrowUp'),null);
 for(const modifier of ['metaKey','ctrlKey','altKey'])assert.equal(lookKeyAction('PageDown','PageDown',{[modifier]:true}),null);
 const p={...player,pitch:0};let result=p;
 for(let i=0;i<40;i++)result=keyboardLookPlayer(result,'lookUp');close(result.pitch,MAX_PITCH);close(result.angle,p.angle);close(result.x,p.x);close(result.z,p.z);
 assert.equal(seesRabbit({...result,x:0,z:4}),false);
 for(let i=0;i<80;i++)result=keyboardLookPlayer(result,'lookDown');close(result.pitch,-MAX_PITCH);
 close(keyboardLookPlayer(result,'levelLook').pitch,0);close(keyboardLookPlayer(result,'lookUp',{verticalLocked:true}).pitch,0);
 assert.equal(keyboardLookPlayer(p,'forward'),p);
 assert.deepEqual(keyboardLookPlayer(keyboardLookPlayer(p,'lookUp'),'lookDown'),p);
});
test('camera preferences survive reload independently of game state and malformed or denied storage is safe',()=>{
 const values=new Map(),storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
 assert.deepEqual(loadLookSettings(storage),DEFAULT_LOOK_SETTINGS);
 const selected={horizontal:.45,vertical:.175,verticalLocked:true};assert.equal(saveLookSettings(selected,storage),true);assert.deepEqual(loadLookSettings(storage),selected);
 assert.deepEqual(Object.keys(JSON.parse(values.get(LOOK_STORAGE_KEY))).sort(),['horizontal','vertical','verticalLocked']);
 for(const bad of ['{broken','null','"string"','[]']){values.set(LOOK_STORAGE_KEY,bad);assert.deepEqual(loadLookSettings(storage),DEFAULT_LOOK_SETTINGS);}
 assert.deepEqual(normalizeLookSettings({horizontal:Infinity,vertical:'32.5',verticalLocked:'true'}),DEFAULT_LOOK_SETTINGS);
 assert.deepEqual(normalizeLookSettings({horizontal:0,vertical:99,verticalLocked:true}),{horizontal:.2,vertical:1.8,verticalLocked:true});
 const denied={getItem(){throw new Error('blocked');},setItem(){throw new Error('quota');}};
 assert.deepEqual(loadLookSettings(denied),DEFAULT_LOOK_SETTINGS);assert.equal(saveLookSettings(selected,denied),false);
 // Each axis can be reduced/increased by at least half its default value.
 assert.ok(.2<=DEFAULT_LOOK_SETTINGS.horizontal/2&&1.8>=DEFAULT_LOOK_SETTINGS.horizontal*1.5);
 assert.ok(.1<=DEFAULT_LOOK_SETTINGS.vertical/2&&1.8>=DEFAULT_LOOK_SETTINGS.vertical*1.5);
});
test('manual camera uses a fixed eye height and only explicit yaw/pitch',()=>{
 const pose=manualCameraPose({...player,x:1,z:23,angle:Math.PI/2,pitch:-.4});close(pose.y,1.5);close(pose.targetY,1.5+Math.tan(-.4));close(pose.targetX,2);close(pose.targetZ,-23);
 for(let i=0,p=player;i<100;i++){p=movePlayer(p,keys('forward'),.05);close(manualCameraPose(p).y,1.5);close(manualCameraPose(p).targetY,1.5+Math.tan(.2));}
});
test('rabbit discovery respects vertical look and preserves old distance/yaw checks',()=>{
 const p={x:0,z:4,angle:0,manualLook:true,pitch:0};assert.equal(seesRabbit(p),true);
 assert.equal(seesRabbit({...p,pitch:MAX_PITCH}),false);assert.equal(seesRabbit({...p,pitch:-MAX_PITCH}),false);
 assert.equal(seesRabbit({...p,pitch:Math.atan2(-.45,2.8)}),true);assert.equal(seesRabbit({...p,z:3}),false);assert.equal(seesRabbit({...p,angle:Math.PI}),false);
 assert.equal(seesRabbit({...p,manualLook:false,pitch:MAX_PITCH}),true);
});
function rig(request){
 const doc=new EventTarget();doc.pointerLockElement=null;doc.exitPointerLock=()=>{doc.pointerLockElement=null;doc.dispatchEvent(new Event('pointerlockchange'));};
 const canvas=new EventTarget();canvas.ownerDocument=doc;canvas.focus=()=>{};canvas.requestPointerLock=request;canvas.setPointerCapture=()=>{};
 const state={active:true,looks:[],interactions:0,unlocks:0,modes:[]};
 const controls=new MouseLookController(canvas,{canPlay:()=>state.active,onLook:(...args)=>state.looks.push(args),onInteract:()=>state.interactions++,onUnlock:()=>state.unlocks++,onMode:mode=>state.modes.push(mode)});
 const emit=(target,type,props={})=>{const event=new Event(type);Object.assign(event,props);target.dispatchEvent(event);};
 const lock=()=>{doc.pointerLockElement=canvas;emit(doc,'pointerlockchange');};
 return {doc,canvas,state,controls,emit,lock};
}
test('Pointer Lock accepts relative mouse, click interaction and Escape unlock',async()=>{
 const r=rig(()=>Promise.resolve());await r.controls.requestLock();r.lock();
 r.emit(r.doc,'mousemove',{movementX:25,movementY:-8});r.emit(r.canvas,'click');assert.deepEqual(r.state.looks,[[25,-8]]);assert.equal(r.state.interactions,1);
 r.doc.exitPointerLock();assert.equal(r.state.unlocks,1);assert.equal(r.controls.mode,'drag');
 r.state.active=false;r.emit(r.doc,'mousemove',{movementX:2,movementY:2});r.emit(r.canvas,'click');assert.equal(r.state.looks.length,1);assert.equal(r.state.interactions,1);
});
test('unsupported raw input retries regular locking, legacy void return works',async()=>{
 const attempts=[];const r=rig(options=>{attempts.push(options);if(options)throw Object.assign(new Error('raw input unavailable'),{name:'NotSupportedError'});});
 await r.controls.requestLock();assert.deepEqual(attempts,[{unadjustedMovement:true},undefined]);r.lock();assert.equal(r.controls.mode,'locked');
});
test('denied or absent Pointer Lock supports drag without accidental door clicks',async()=>{
 for(const request of [undefined,()=>Promise.reject(new Error('denied'))]){
  const r=rig(request);await r.controls.requestLock();assert.equal(r.controls.mode,'drag');
  r.emit(r.canvas,'pointerdown',{button:0,pointerId:7,clientX:10,clientY:20});r.emit(r.canvas,'pointermove',{pointerId:7,clientX:30,clientY:10});r.emit(r.canvas,'pointerup',{pointerId:7});r.emit(r.canvas,'click');
  assert.deepEqual(r.state.looks,[[20,-10]]);assert.equal(r.state.interactions,0);assert.equal(r.controls.drag,null);
  r.state.active=false;r.emit(r.canvas,'pointerdown',{button:0,pointerId:8,clientX:0,clientY:0});assert.equal(r.controls.drag,null);
 }
});
test('release blocks late locks and stale drag, and does not pause on intentional release',async()=>{
 let resolve;const r=rig(()=>new Promise(done=>resolve=done));const pending=r.controls.requestLock();
 r.controls.release();r.lock();resolve();await pending;assert.equal(r.doc.pointerLockElement,null);assert.equal(r.state.unlocks,0);
 r.emit(r.canvas,'pointerdown',{button:0,pointerId:1,clientX:0,clientY:0});r.controls.release();r.emit(r.canvas,'pointermove',{pointerId:1,clientX:10,clientY:20});assert.deepEqual(r.state.looks,[]);
});
test('system shortcuts cannot start or keep a drag, rotate a locked camera or use a door',async()=>{
 for(const modifier of ['metaKey','ctrlKey','altKey']){
  const r=rig(()=>Promise.resolve());
  r.emit(r.canvas,'pointerdown',{button:0,pointerId:9,clientX:10,clientY:20,[modifier]:true});assert.equal(r.controls.drag,null);
  r.emit(r.canvas,'pointerdown',{button:0,pointerId:9,clientX:10,clientY:20});
  r.emit(r.doc,'keydown',{key:'Shift',[modifier]:true});assert.equal(r.controls.drag,null);
  r.emit(r.canvas,'pointermove',{pointerId:9,clientX:100,clientY:100});assert.deepEqual(r.state.looks,[]);
  r.emit(r.canvas,'pointerdown',{button:0,pointerId:9,clientX:10,clientY:20});
  r.emit(r.canvas,'pointermove',{pointerId:9,clientX:100,clientY:100,[modifier]:true});assert.equal(r.controls.drag,null);assert.deepEqual(r.state.looks,[]);
  await r.controls.requestLock();r.lock();r.emit(r.doc,'mousemove',{movementX:100,movementY:100,[modifier]:true});r.emit(r.canvas,'click',{[modifier]:true});
  assert.deepEqual(r.state.looks,[]);assert.equal(r.state.interactions,0);
 }
});
