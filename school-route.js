import { CLASSROOM_NOTE } from './classroom.js';
export const CLASSROOM_DOOR = { x: -2.9, z: 5 };
export const ATTENDANCE_NOTE = CLASSROOM_NOTE;
export function createSchoolRoute() { return { confirmed: false }; }
export function schoolAction(player, scene, tutorial, route) {
  if (scene === 'classroom') return !route.confirmed && Math.hypot(player.x - ATTENDANCE_NOTE.x, player.z - ATTENDANCE_NOTE.z) <= 2.8 ? 'confirm' : null;
  return !tutorial && Math.hypot(player.x - CLASSROOM_DOOR.x, player.z - CLASSROOM_DOOR.z) <= 3.8 ? 'enter' : null;
}
export function confirmAttendance(player, scene, route) {
  return schoolAction(player, scene, false, route) === 'confirm' ? { confirmed: true } : route;
}
export function canChooseStairs(scene, atStairs, tutorial, route) {
  return scene === 'corridor' && atStairs && (tutorial || route.confirmed);
}
