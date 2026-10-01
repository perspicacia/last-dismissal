// These openings match the two stairways painted on the corridor end wall.
export function stairDirection(player, scene = 'corridor') {
  if (scene !== 'corridor' || player.z < 24) return null;
  if (player.x < -.65) return true;
  if (player.x > .65) return false;
  return null;
}
