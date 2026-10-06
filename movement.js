import {CORRIDOR_BLOCKERS,blockedByFurniture} from './school-colliders.js?v=quality-2';
export const SPAWN = { x: 0, z: 1.8, angle: 0 };
export function revealsTeeth(player, anomaly, alreadyOpen = false) {
  if (anomaly !== 'figure') return false;
  if (alreadyOpen) return true;
  const dx=1.6-player.x,dz=16-player.z,distance=Math.hypot(dx,dz);
  const facing=(dx*Math.sin(player.angle)+dz*Math.cos(player.angle))/Math.max(distance,.001);
  return distance<4.2 && facing>.75;
}
export function movePlayer(player, keys, dt) {
  const {angle,dx,dz}=movementDelta(player,keys,dt);
  const result={...player,angle},x=Math.max(-2.55,Math.min(2.55,player.x+dx));
  if(!blockedByFurniture(x,result.z,CORRIDOR_BLOCKERS))result.x=x;
  const z=Math.max(.8,Math.min(24.6,player.z+dz));
  if(!blockedByFurniture(result.x,z,CORRIDOR_BLOCKERS))result.z=z;
  return result;
}
export function movementDelta(player,keys,dt){
  const step = Number.isFinite(dt)?Math.min(Math.max(dt, 0), .05):0;
  const turn = Number(keys.has('right')) - Number(keys.has('left'));
  const walk = Number(keys.has('forward')) - Number(keys.has('back'));
  const strafe=Number(keys.has('strafeRight'))-Number(keys.has('strafeLeft'));
  const angle = player.angle + turn * (player.manualLook?1.05:1.65) * step;
  const distance=(player.manualLook?3:3.8)*step/Math.max(1,Math.hypot(walk,strafe));
  return {angle,dx:(Math.sin(angle)*walk+Math.cos(angle)*strafe)*distance,dz:(Math.cos(angle)*walk-Math.sin(angle)*strafe)*distance};
}
export function nearbyItem(player, anomaly) {
  const items = [
    { id: 'door', x: -2.9, z: 5 }, { id: 'board', x: -2.9, z: 9 },
    { id: 'window', x: 2.9, z: 6 }, { id: 'clock', x: 2.9, z: 19 },
    { id: 'figure', x: 1.6, z: anomaly === 'figure' ? 16 : 22 }
  ];
  return items.map(item => {
    const dx = item.x - player.x, dz = item.z - player.z;
    const distance = Math.hypot(dx, dz);
    const facing = (dx * Math.sin(player.angle) + dz * Math.cos(player.angle)) / Math.max(distance, .001);
    return { ...item, distance, facing };
  }).filter(item => item.distance < 4.6 && item.facing > .75).sort((a,b) => b.facing - a.facing || a.distance - b.distance)[0]?.id ?? null;
}
