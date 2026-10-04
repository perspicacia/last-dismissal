import {hasSystemModifier} from './capture-controls.js';
export const DEFAULT_SENSITIVITY=.65;
export const MAX_PITCH=Math.PI/3;
const actions={ArrowUp:'forward',ArrowDown:'back',ArrowLeft:'left',ArrowRight:'right',w:'forward',s:'back',a:'strafeLeft',d:'strafeRight'};
export function inputAction(key,code,event={}){if(hasSystemModifier(event))return null;return actions[code?.replace(/^Key/,'').toLowerCase()]||actions[key]||actions[String(key).toLowerCase()]||null;}
export function lookPlayer(player,dx,dy,sensitivity=DEFAULT_SENSITIVITY){
  if(!Number.isFinite(dx)||!Number.isFinite(dy))return player;
  const gain=.002*Math.max(.2,Math.min(1.8,Number.isFinite(sensitivity)?sensitivity:DEFAULT_SENSITIVITY));
  // Cap spurious deltas after focus/device changes; no inertia or acceleration.
  const clamp=value=>Math.max(-200,Math.min(200,value));
  return {...player,angle:player.angle+clamp(dx)*gain,pitch:Math.max(-MAX_PITCH,Math.min(MAX_PITCH,(player.pitch||0)-clamp(dy)*gain))};
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
