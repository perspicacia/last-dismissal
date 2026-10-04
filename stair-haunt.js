export const STAIR_APPROACH_Z=22.1;
export const STAIR_DWELL=.3;
export function newStairHaunt(){return {elapsed:0,triggered:false};}
// Consuming a cue is independent of audio availability, mute and rendering.
export function advanceStairHaunt(state,dt,scene,player,ended=false){
 if(state.triggered)return {state,cue:false};
 const near=!ended&&scene==='corridor'&&Number.isFinite(player?.z)&&player.z>=STAIR_APPROACH_Z;
 if(!near)return {state:state.elapsed?{...state,elapsed:0}:state,cue:false};
 const elapsed=state.elapsed+(Number.isFinite(dt)?Math.max(0,Math.min(.1,dt)):0);
 const cue=elapsed+1e-9>=STAIR_DWELL;
 return {state:{elapsed:Math.min(STAIR_DWELL,elapsed),triggered:cue},cue};
}
export function stairSoundPan(player){
 const dx=1.65-player.x,dz=27-player.z;
 const right=(dx*Math.cos(player.angle)-dz*Math.sin(player.angle))/Math.max(.1,Math.hypot(dx,dz));
 return Number.isFinite(right)?Math.max(-.7,Math.min(.7,right*.7)):0;
}
