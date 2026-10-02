import {ROOMS} from './exploration.js?v=classroom-hauntings-1';

function cryInterval(random){
 const value=random();
 return 12+10*(Number.isFinite(value)?Math.max(0,Math.min(1,value)):0);
}
export function newHauntingAudio(random=Math.random){
 return {scene:null,elapsed:0,nextCry:cryInterval(random)};
}
// The controller owns playback. This pure clock works equally when muted, and
// returning a cue consumes it even if the audio device cannot play it.
export function advanceHauntingAudio(state,dt,scene,ended,random=Math.random){
 if(ended||!ROOMS.some(room=>room.id===scene)){
  return {state:state.scene===null&&state.elapsed===0?state:newHauntingAudio(random),cry:false};
 }
 if(state.scene!==scene)return {state:{...state,scene,elapsed:0,nextCry:cryInterval(random)},cry:false};
 const elapsed=state.elapsed+(Number.isFinite(dt)?Math.max(0,Math.min(.1,dt)):0);
 if(elapsed+1e-9>=state.nextCry)return {state:{scene,elapsed:0,nextCry:cryInterval(random)},cry:true};
 return {state:{...state,elapsed},cry:false};
}
