import {hasSystemModifier} from './capture-controls.js';
import {DEFAULT_LOOK_SETTINGS,normalizeLookSettings} from './camera-preferences.js?v=accessible-camera-1';
export const DEFAULT_SENSITIVITY=.65;
export const MAX_PITCH=Math.PI/3;
const actions={ArrowUp:'forward',ArrowDown:'back',ArrowLeft:'left',ArrowRight:'right',w:'forward',s:'back',a:'strafeLeft',d:'strafeRight'};
export function inputAction(key,code,event={}){if(hasSystemModifier(event))return null;return actions[code?.replace(/^Key/,'').toLowerCase()]||actions[key]||actions[String(key).toLowerCase()]||null;}
export function lookPlayer(player,dx,dy,sensitivity=DEFAULT_LOOK_SETTINGS){
  if(!Number.isFinite(dx)||!Number.isFinite(dy))return player;
  // Numeric callers retain their former shared gain; normal play uses two axes.
  const settings=normalizeLookSettings(typeof sensitivity==='number'?{horizontal:sensitivity,vertical:sensitivity}:sensitivity);
  // Cap spurious deltas after focus/device changes; no inertia or acceleration.
  const clamp=value=>Math.max(-200,Math.min(200,value));
  return {...player,angle:player.angle+clamp(dx)*.002*settings.horizontal,
    pitch:settings.verticalLocked?0:Math.max(-MAX_PITCH,Math.min(MAX_PITCH,(player.pitch||0)-clamp(dy)*.002*settings.vertical))};
}
export function lookKeyAction(key,code,event={}){
  if(hasSystemModifier(event))return null;
  return {PageUp:'lookUp',PageDown:'lookDown',Home:'levelLook'}[code||key]||null;
}
export function keyboardLookPlayer(player,action,settings=DEFAULT_LOOK_SETTINGS){
  if(!['levelLook','lookUp','lookDown'].includes(action))return player;
  if(action==='levelLook'||normalizeLookSettings(settings).verticalLocked)return {...player,pitch:0};
  return {...player,pitch:Math.max(-MAX_PITCH,Math.min(MAX_PITCH,(player.pitch||0)+(action==='lookUp'?1:-1)*Math.PI/60))};
}
export function manualCameraPose(player){
  return {x:player.x,y:1.5,z:-player.z,targetX:player.x+Math.sin(player.angle),targetY:1.5+Math.tan(player.pitch||0),targetZ:-player.z-Math.cos(player.angle)};
}

// Browser adapter: Pointer Lock when available, drag and keys otherwise.
export class MouseLookController{
  constructor(canvas,{canPlay,onLook,onInteract,onUnlock,onMode=()=>{}}){
    Object.assign(this,{canvas,canPlay,onLook,onInteract,onUnlock,onMode});
    this.doc=canvas.ownerDocument;this.mode='drag';this.generation=0;this.wantLock=false;this.locked=false;this.drag=null;
    this.doc.addEventListener('pointerlockchange',()=>{
      const locked=this.doc.pointerLockElement===canvas,was=this.locked;
      this.locked=locked;
      if(locked&&(!this.canPlay()||!this.wantLock)){this.release();return;}
      this.setMode(locked?'locked':'drag');
      if(was&&!locked&&this.canPlay())this.onUnlock();
    });
    this.doc.addEventListener('pointerlockerror',()=>{if(!this.locked)this.setMode('drag');});
    this.doc.addEventListener('keydown',e=>{if(hasSystemModifier(e))this.clearDrag();});
    this.doc.addEventListener('mousemove',e=>{if(this.locked&&this.canPlay()&&!hasSystemModifier(e))this.onLook(e.movementX,e.movementY);});
    canvas.addEventListener('click',e=>{if(this.locked&&this.canPlay()&&!hasSystemModifier(e))this.onInteract();});
    canvas.addEventListener('pointerdown',e=>{
      if(e.button!==0||this.locked||!this.canPlay()||hasSystemModifier(e))return;
      e.preventDefault();canvas.focus();this.drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture?.(e.pointerId);
    });
    canvas.addEventListener('pointermove',e=>{
      if(hasSystemModifier(e)){this.clearDrag();return;}
      const drag=this.drag;if(!drag||e.pointerId!==drag.id||!this.canPlay())return;
      this.onLook(e.clientX-drag.x,e.clientY-drag.y);drag.x=e.clientX;drag.y=e.clientY;
    });
    for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>{if(this.drag?.id===e.pointerId)this.clearDrag();});
  }
  setMode(mode){this.mode=mode;this.onMode(mode);}
  clearDrag(){const drag=this.drag;this.drag=null;if(drag&&this.canvas.hasPointerCapture?.(drag.id))this.canvas.releasePointerCapture(drag.id);}
  requestLock(){
    this.clearDrag();const generation=++this.generation;
    if(!this.canPlay()||!this.canvas.requestPointerLock){this.setMode('drag');return;}
    this.wantLock=true;
    const request=async(raw)=>{
      try{
        await this.canvas.requestPointerLock(raw?{unadjustedMovement:true}:undefined);
        if(!this.wantLock||!this.canPlay()){
          if(this.doc.pointerLockElement===this.canvas)this.doc.exitPointerLock?.();
        }
      }catch(error){
        if(generation!==this.generation||!this.canPlay())return;
        if(raw&&error.name==='NotSupportedError')return request(false);
        this.wantLock=false;this.setMode('drag');
      }
    };
    return request(true);
  }
  release(){this.generation++;this.wantLock=false;this.clearDrag();this.locked=false;if(this.doc.pointerLockElement===this.canvas)this.doc.exitPointerLock?.();this.setMode('drag');}
}
