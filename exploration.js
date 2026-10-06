import {lowerPaneCenter} from './school-windows.js';
export const ROOMS = [
 {id:'classroom31',label:'3-1 교실',x:-2.9,z:3},
 {id:'classroom',label:'3-2 교실',x:-2.9,z:7},
 {id:'classroom33',label:'3-3 교실',x:-2.9,z:11},
 {id:'music',label:'음악실',x:-2.9,z:16},
 {id:'dance',label:'무용실',x:-2.9,z:21}
];
export function regularClassroom(kind){return ['classroom31','classroom','classroom33'].includes(kind);}
export const ROOM_AMBIENCE={
 classroom31:{student:{x:-2.5,y:.80,z:3.72,height:1.05}},
 music:{boy:{x:2.43,y:.525,z:7.35}},
 classroom33:{ghost:{x:-6.1,y:1.15,z:lowerPaneCenter(2),height:2.20},faceless:{x:3.55,z:9.35,height:1.7,angle:.42}},
 dance:{ghost:{x:-6.3,y:1.15,z:lowerPaneCenter(3),height:2.20}}
};
export const ATTACKER_SPOT={x:0,z:6.8};
export const RABBIT_SPOT=ATTACKER_SPOT; // Compatibility for historical rabbit review scenes.
export function nearbyRoom(player,scene){
 if(scene!=='corridor')return null;
 return ROOMS.filter(r=>Math.hypot(player.x-r.x,player.z-r.z)<=3.8).sort((a,b)=>Math.hypot(player.x-a.x,player.z-a.z)-Math.hypot(player.x-b.x,player.z-b.z))[0]||null;
}
export function newExploration(random=Math.random){const room=ROOMS[Math.min(ROOMS.length-1,Math.max(0,Math.floor(random()*ROOMS.length)))].id;return {attacker:'schoolgirl',attackerRoom:room,rabbitRoom:room,visited:[],elapsed:0,ended:false,outcome:null};}
export function seesAttacker(player){
 const dx=ATTACKER_SPOT.x-player.x,dz=ATTACKER_SPOT.z-player.z,d=Math.hypot(dx,dz);
 const vertical=!player.manualLook||Math.cos((player.pitch||0)-Math.atan2(1.05-1.5,Math.max(.15,d)))>=.8;
 return d<=3&&vertical&&(d<.15||(dx*Math.sin(player.angle)+dz*Math.cos(player.angle))/d>=.88);
}
export const seesRabbit=seesAttacker;
export function advanceExploration(state,dt,scene,player,attackerReady=true){
 if(state.ended)return state;
 const elapsed=state.elapsed+(Number.isFinite(dt)?Math.max(0,Math.min(.1,dt)):0);
 const visited=ROOMS.some(r=>r.id===scene)&&player.z>=3.6&&!state.visited.includes(scene)?[...state.visited,scene]:state.visited;
 const caught=attackerReady&&scene===(state.attackerRoom??state.rabbitRoom)&&seesAttacker(player);
 return {...state,elapsed,visited,ended:caught,outcome:caught?'caught':null};
}
