import {rabbitImageSize} from './rabbit-appearance.js?v=dark-blood-1';
// Existing image rig: normalized coordinates in the original rabbit PNG.
export const LEFT_ARM={pivot:{x:.35,y:.56},polygon:[[.352,.556],[.377,.568],[.351,.625],[.322,.669],[.327,.696],[.325,.726],[.307,.751],[.225,.759],[.180,.740],[.175,.702],[.195,.659],[.246,.602],[.305,.573]]};
export const RIGHT_ARM={pivot:{x:1-LEFT_ARM.pivot.x,y:LEFT_ARM.pivot.y},polygon:LEFT_ARM.polygon.map(([x,y])=>[1-x,y])};
export function raisedArms(elapsed,reduced=false){
 const time=Number.isFinite(elapsed)?Math.max(0,elapsed):0;
 const t=reduced?(time>=.55?1:0):Math.max(0,Math.min(1,(time-.35)/.35));
 const lift=t*t*(3-2*t),angle=lift*125*Math.PI/180;
 return {lift,left:angle,right:-angle}; // Canvas coordinates, positive is clockwise.
}
function path(ctx,arm,w,h){
 const points=arm.polygon;ctx.beginPath();
 const last=points.at(-1),first=points[0];ctx.moveTo((last[0]+first[0])*w/2,(last[1]+first[1])*h/2);
 for(let i=0;i<points.length;i++){const p=points[i],next=points[(i+1)%points.length];ctx.quadraticCurveTo(p[0]*w,p[1]*h,(p[0]+next[0])*w/2,(p[1]+next[1])*h/2);}ctx.closePath();
}
export function rabbitParts(image){
 const size=rabbitImageSize(image);if(!size)return null;
 const w=size.width,h=size.height;
 const canvas=()=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
 const body=canvas(),ctx=body.getContext('2d');ctx.drawImage(image,0,0);ctx.globalCompositeOperation='destination-out';
 for(const arm of [LEFT_ARM,RIGHT_ARM]){path(ctx,arm,w,h);ctx.fill();}ctx.globalCompositeOperation='source-over';
 const arms=[LEFT_ARM,RIGHT_ARM].map(arm=>{const c=canvas(),a=c.getContext('2d');a.save();path(a,arm,w,h);a.clip();a.drawImage(image,0,0);a.restore();return c;});
 return {body,left:arms[0],right:arms[1],width:w,height:h};
}
export function drawRabbitPose(ctx,parts,x,y,width,height,pose){
 ctx.drawImage(parts.body,x-width/2,y-height/2,width,height);
 for(const [key,arm] of [['left',LEFT_ARM],['right',RIGHT_ARM]]){
  const px=x+(arm.pivot.x-.5)*width,py=y+(arm.pivot.y-.5)*height;
  ctx.save();ctx.translate(px,py);ctx.rotate(pose[key]);ctx.scale(1+.2*pose.lift,1+.2*pose.lift);ctx.drawImage(parts[key],-arm.pivot.x*width,-arm.pivot.y*height,width,height);ctx.restore();
 }
}
