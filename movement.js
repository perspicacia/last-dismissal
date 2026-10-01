export const SPAWN = { x: 0, z: 1.8, angle: 0 };
export function revealsTeeth(player, anomaly, alreadyOpen = false) {
  if (anomaly !== 'figure') return false;
  if (alreadyOpen) return true;
  const dx=1.6-player.x,dz=16-player.z,distance=Math.hypot(dx,dz);
  const facing=(dx*Math.sin(player.angle)+dz*Math.cos(player.angle))/Math.max(distance,.001);
  return distance<4.2 && facing>.75;
}
export function movePlayer(player, keys, dt) {
  const step = Math.min(Math.max(dt, 0), .05);
  const turn = Number(keys.has('right')) - Number(keys.has('left'));
  const walk = Number(keys.has('forward')) - Number(keys.has('back'));
  const angle = player.angle + turn * 1.65 * step;
  return {
    angle,
    x: Math.max(-2.55, Math.min(2.55, player.x + Math.sin(angle) * walk * 3.8 * step)),
    z: Math.max(.8, Math.min(24.6, player.z + Math.cos(angle) * walk * 3.8 * step))
  };
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
