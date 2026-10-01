export const CLASSROOM_DOOR = { x: -2.9, z: 5 };
export function schoolAction(player, scene, tutorial) {
  return scene === 'corridor' && !tutorial && Math.hypot(player.x - CLASSROOM_DOOR.x, player.z - CLASSROOM_DOOR.z) <= 3.8 ? 'enter' : null;
}
export function canChooseStairs(scene, atStairs) {
  return scene === 'corridor' && atStairs;
}
