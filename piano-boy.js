// Anchors measured on the unmodified 1024×1536 cutout: shorts underside,
// toes and eyes. One uniform scale places the thighs on the piano bench.
const ART={seat:957/1536,feet:1509/1536,eyes:245/1536};
export function pianoBoyLayout(image,seat){
  if(!seat||image?.complete===false||!(image?.naturalWidth>0&&image?.naturalHeight>0))return null;
  const height=(seat.y-.025)/(ART.feet-ART.seat),width=height*image.naturalWidth/image.naturalHeight;
  const top=seat.y+ART.seat*height;
  return {width,height,top,bottom:top-height,centerY:top-height/2,eyeY:top-ART.eyes*height};
}
export function pianoBoyLook(player,image,seat){
  const pose=pianoBoyLayout(image,seat);if(!pose)return 0;
  const dx=seat.x-player.x,dz=seat.z-player.z,distance=Math.hypot(dx,dz),clamp=n=>Math.max(0,Math.min(1,n));
  if(distance>=3.5||(dx*Math.sin(player.angle)+dz*Math.cos(player.angle))/Math.max(.001,distance)<=.7)return 0;
  const weight=clamp((distance-.8)/.8),lookY=pose.eyeY*(1-weight)+(pose.centerY+.10)*weight;
  return (lookY-1.5)/Math.max(.5,distance)*clamp((3.5-distance)/1.2);
}
export function pianoBoyQuad(project,image,seat){
  const pose=pianoBoyLayout(image,seat);if(!pose)return null;
  // Fixed plane faces the central aisle (-X), rather than following the camera.
  const points=[[seat.x,pose.top,seat.z+pose.width/2],[seat.x,pose.top,seat.z-pose.width/2],
    [seat.x,pose.bottom,seat.z-pose.width/2],[seat.x,pose.bottom,seat.z+pose.width/2]].map(v=>project(...v));
  return points.every(Boolean)?points:null;
}
function triangle(c,image,source,destination){
  const [s0,s1,s2]=source,[p0,p1,p2]=destination,ux=s1.x-s0.x,uy=s1.y-s0.y,vx=s2.x-s0.x,vy=s2.y-s0.y,det=ux*vy-vx*uy;
  const a=((p1.x-p0.x)*vy-(p2.x-p0.x)*uy)/det,b=((p1.y-p0.y)*vy-(p2.y-p0.y)*uy)/det;
  const d=((p2.y-p0.y)*ux-(p1.y-p0.y)*vx)/det,e=((p2.x-p0.x)*ux-(p1.x-p0.x)*vx)/det;
  c.save();c.beginPath();c.moveTo(p0.x,p0.y);c.lineTo(p1.x,p1.y);c.lineTo(p2.x,p2.y);c.closePath();c.clip();
  c.transform(a,b,e,d,p0.x-a*s0.x-e*s0.y,p0.y-b*s0.x-d*s0.y);c.drawImage(image,0,0);c.restore();
}
export function drawPianoBoy(c,project,image,seat){
  const pose=pianoBoyLayout(image,seat);if(!pose||!pianoBoyQuad(project,image,seat))return false;
  // Small strips keep the photographic cutout in perspective in Canvas mode.
  for(let i=0;i<12;i++){
    const l=i/12,r=(i+1)/12,at=(u,v)=>project(seat.x,pose.top-v*pose.height,seat.z+(.5-u)*pose.width);
    const points=[at(l,0),at(r,0),at(r,1),at(l,1)],uv=[{x:l*image.naturalWidth,y:0},{x:r*image.naturalWidth,y:0},{x:r*image.naturalWidth,y:image.naturalHeight},{x:l*image.naturalWidth,y:image.naturalHeight}];
    triangle(c,image,[uv[0],uv[1],uv[2]],[points[0],points[1],points[2]]);
    triangle(c,image,[uv[0],uv[2],uv[3]],[points[0],points[2],points[3]]);
  }
  return true;
}
