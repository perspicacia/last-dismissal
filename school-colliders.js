// Shared authoring dimensions: the visible corridor desk and its collider agree.
export const CORRIDOR_DESK=Object.freeze({x:2,z:3.2,width:1.1,depth:.7,height:.85});
export const CORRIDOR_BLOCKERS=Object.freeze([CORRIDOR_DESK]);
export const PLAYER_RADIUS=.22;
export function blockedByFurniture(x,z,blockers,radius=PLAYER_RADIUS){
 return blockers.some(d=>Math.abs(x-d.x)<d.width/2+radius&&Math.abs(z-d.z)<d.depth/2+radius);
}
