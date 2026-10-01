export const KEY_POSITION = { x: 2, z: 4 };
export const FIRE_DOOR_Z = 8;
export const CLOSED_DOOR_LIMIT = 7.5;
export function createKeyDoor(tutorial = true) { return { tutorial, hasKey: false, doorOpen: !tutorial }; }
export function keyDoorAction(player, state) {
  if (!state.tutorial || state.doorOpen) return null;
  // Pickup remains available throughout its full radius, including the door approach.
  if (!state.hasKey && Math.hypot(player.x - KEY_POSITION.x, player.z - KEY_POSITION.z) <= 3.2) return 'pickup';
  if (player.z >= 6 && player.z <= 8) return state.hasKey ? 'open' : 'locked';
  return null;
}
export function interactKeyDoor(player, state) {
  const action = keyDoorAction(player, state);
  if (action === 'pickup') return { ...state, hasKey: true };
  if (action === 'open') return { ...state, doorOpen: true };
  return state;
}
export function constrainKeyDoor(player, state) {
  return state.tutorial && !state.doorOpen ? { ...player, z: Math.min(player.z, CLOSED_DOOR_LIMIT) } : player;
}
