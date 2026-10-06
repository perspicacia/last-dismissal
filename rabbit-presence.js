import {bloodiedRabbit,rabbitImageSize} from './rabbit-appearance.js?v=dark-blood-1';

// The schoolgirl owns the attack. This rabbit is an independent room prop.
export const RABBIT_PRESENCE=Object.freeze({room:'classroom31',x:-1.15,z:6.2,height:1.75});
export function rabbitPresence(source){
  if(source.attackerKind!=='schoolgirl'||!source.exploration||source.exploration.ended||source.scene!==RABBIT_PRESENCE.room)return null;
  if(!rabbitImageSize(source.mascot))return null;
  const p=source.player,dx=RABBIT_PRESENCE.x-p.x,dz=RABBIT_PRESENCE.z-p.z,distance=Math.hypot(dx,dz);
  const facing=distance<.01?1:(dx*Math.sin(p.angle)+dz*Math.cos(p.angle))/distance;
  const teeth=distance<=2.8&&facing>=.75&&Boolean(rabbitImageSize(source.mascotOpen));
  const image=teeth?source.mascotOpen:source.mascot,size=rabbitImageSize(image);
  return {...RABBIT_PRESENCE,image,teeth,width:RABBIT_PRESENCE.height*size.width/size.height};
}
export function recordRabbitPresence(canvas,pose){
  if(canvas)Object.assign(canvas.dataset,{rabbitVisible:String(Boolean(pose)),rabbitRole:pose?'ambience':'hidden',rabbitExpression:pose?.teeth?'teeth':'normal',rabbitRoom:pose?.room||''});
}
export function drawRabbitPresence(ctx,project,lens,pose){
  if(!pose)return;
  const foot=project(pose.x,0,pose.z);if(!foot)return;
  const image=bloodiedRabbit(pose.image);
  ctx.drawImage(image,foot.x-pose.width*lens/foot.d/2,foot.y-pose.height*lens/foot.d,pose.width*lens/foot.d,pose.height*lens/foot.d);
}
