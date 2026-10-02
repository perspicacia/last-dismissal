import {ROOMS} from './exploration.js?v=classroom-hauntings-1';

function cryInterval(random){
 const value=random();
 return 12+10*(Number.isFinite(value)?Math.max(0,Math.min(1,value)):0);
}
export function newHauntingAudio(random=Math.random){
 return {scene:null,elapsed:0,nextCry:cryInterval(random),laughed:false};
}
// The controller owns playback. This pure clock works equally when muted, and
// returning a cue consumes it even if the audio device cannot play it.
export function advanceHauntingAudio(state,dt,scene,ended,random=Math.random,ghostSmiling=false){
 if(ended||!ROOMS.some(room=>room.id===scene)){
  return {state:state.scene===null&&state.elapsed===0&&!state.laughed?state:newHauntingAudio(random),cry:false,laugh:false};
 }
 const laugh=Boolean(ghostSmiling)&&(state.scene!==scene||!state.laughed);
 if(state.scene!==scene)return {state:{...state,scene,elapsed:0,nextCry:cryInterval(random),laughed:laugh},cry:false,laugh};
 const laughed=Boolean(state.laughed||laugh);
 const elapsed=state.elapsed+(Number.isFinite(dt)?Math.max(0,Math.min(.1,dt)):0);
 if(elapsed+1e-9>=state.nextCry)return {state:{...state,scene,elapsed:0,nextCry:cryInterval(random),laughed},cry:true,laugh};
 return {state:{...state,elapsed,laughed},cry:false,laugh};
}
