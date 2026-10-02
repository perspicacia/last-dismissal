export const SURVIVAL = {duration:60,cycle:20,warning:10,attack:16,doorHold:7,doorRecovery:3};
export function newSurvival(){return {elapsed:0,phase:'watch',doorUntil:0,recoveryUntil:0,resolved:0,defended:0,ended:false,outcome:null};}
export function doorClosed(state){return !state.ended&&state.doorUntil>state.elapsed;}
export function toggleDoor(state,scene){
 if(state.ended||scene!=='classroom')return state;
 if(doorClosed(state))return {...state,doorUntil:0,recoveryUntil:state.elapsed+SURVIVAL.doorRecovery};
 if(state.elapsed<state.recoveryUntil)return state;
 return {...state,doorUntil:state.elapsed+SURVIVAL.doorHold,recoveryUntil:state.elapsed+SURVIVAL.doorHold+SURVIVAL.doorRecovery};
}
export function advanceSurvival(state,dt,scene){
 if(state.ended)return state;
 const elapsed=Math.min(SURVIVAL.duration,state.elapsed+Math.min(.1,Math.max(0,Number.isFinite(dt)?dt:0)));
 let next={...state,elapsed:elapsed>=SURVIVAL.duration-1e-8?SURVIVAL.duration:elapsed};
 const attack=SURVIVAL.attack+state.resolved*SURVIVAL.cycle;
 if(state.elapsed<attack&&elapsed>=attack){
  if(scene!=='classroom'||state.doorUntil<=attack)return {...next,phase:'caught',ended:true,outcome:'caught'};
  next.resolved++;next.defended++;
 }
 if(next.elapsed>=SURVIVAL.duration)return {...next,phase:'escaped',ended:true,outcome:'escaped'};
 const t=elapsed%SURVIVAL.cycle;
 next.phase=t<SURVIVAL.warning?'watch':t<SURVIVAL.attack?'warning':'retreat';
 return next;
}
export function rabbitPosition(state){const t=state.elapsed%SURVIVAL.cycle;return state.phase==='warning'?22-(t-SURVIVAL.warning)/(SURVIVAL.attack-SURVIVAL.warning)*15:22;}
