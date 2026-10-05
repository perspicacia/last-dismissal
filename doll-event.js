export const DOLL = {x:-1.05,z:6.5,height:1.55};
export const DOLL_GAZE = {x:DOLL.x,z:DOLL.z-DOLL.height/2};
export function newDollState(){return {phase:'lying',gaze:0,elapsed:0};}
export function facingDoll(player,range=2.6){
  const dx=DOLL_GAZE.x-player.x,dz=DOLL_GAZE.z-player.z,d=Math.hypot(dx,dz);
  return d<range&&(dx*Math.sin(player.angle)+dz*Math.cos(player.angle))/Math.max(d,.001)>.9;
}
export function advanceDoll(state,{scene,anomaly,player,dt,ready=true}){
  const step=Math.max(0,Math.min(.05,Number.isFinite(dt)?dt:0));
  if(scene!=='classroom')return state.phase==='lying'?{...state,gaze:0}:state;
  if(state.phase==='standing')return state;
  if(state.phase==='rising'){const elapsed=Math.min(.55,state.elapsed+step);return {...state,elapsed,phase:elapsed>=.55?'standing':'rising'};}
  const gaze=anomaly==='doll'&&ready&&facingDoll(player,1.9)?state.gaze+step:0;
  return gaze>=.3?{phase:'rising',gaze:0,elapsed:0}:{...state,gaze};
}
export function dollRise(state){return state?.phase==='standing'?1:state?.phase==='rising'?Math.min(1,state.elapsed/.55):0;}
