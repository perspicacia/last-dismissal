// Unmodified cutout: alpha > 64 begins at y=11 and shoes end at y=1498.
const ART={hair:11/1536,feet:1498/1536};
export function facelessStudentLayout(image,config){
  if(!config||image?.complete===false||!(image?.naturalWidth>0&&image?.naturalHeight>0))return null;
  const height=config.height/(ART.feet-ART.hair),width=height*image.naturalWidth/image.naturalHeight,top=.025+ART.feet*height;
  return {height,width,top,bottom:top-height,centerY:top-height/2};
}
export function facelessStudentBlocker(config){return config?{x:config.x,z:config.z,width:.5,depth:.5}:null;}
function point(project,pose,config,u,v){
  const offset=(u-.5)*pose.width;
  return project(config.x+offset*Math.cos(config.angle),pose.top-v*pose.height,config.z-offset*Math.sin(config.angle));
}
export function facelessStudentQuad(project,image,config){
  const pose=facelessStudentLayout(image,config);if(!pose)return null;
  const points=[[0,0],[1,0],[1,1],[0,1]].map(([u,v])=>point(project,pose,config,u,v));
  return points.every(Boolean)?points:null;
}
function triangle(c,image,source,destination){
  const [s0,s1,s2]=source,[p0,p1,p2]=destination,ux=s1.x-s0.x,uy=s1.y-s0.y,vx=s2.x-s0.x,vy=s2.y-s0.y,det=ux*vy-vx*uy;
  const a=((p1.x-p0.x)*vy-(p2.x-p0.x)*uy)/det,b=((p1.y-p0.y)*vy-(p2.y-p0.y)*uy)/det;
  const d=((p2.y-p0.y)*ux-(p1.y-p0.y)*vx)/det,e=((p2.x-p0.x)*ux-(p1.x-p0.x)*vx)/det;
  c.save();c.beginPath();c.moveTo(p0.x,p0.y);c.lineTo(p1.x,p1.y);c.lineTo(p2.x,p2.y);c.closePath();c.clip();
  c.transform(a,b,e,d,p0.x-a*s0.x-e*s0.y,p0.y-b*s0.x-d*s0.y);c.drawImage(image,0,0);c.restore();
}
export function drawFacelessStudent(c,project,image,config){
  const pose=facelessStudentLayout(image,config);if(!pose||!facelessStudentQuad(project,image,config))return false;
  for(let i=0;i<12;i++){
    const l=i/12,r=(i+1)/12,points=[[l,0],[r,0],[r,1],[l,1]].map(([u,v])=>point(project,pose,config,u,v));
    const uv=[{x:l*image.naturalWidth,y:0},{x:r*image.naturalWidth,y:0},{x:r*image.naturalWidth,y:image.naturalHeight},{x:l*image.naturalWidth,y:image.naturalHeight}];
    triangle(c,image,[uv[0],uv[1],uv[2]],[points[0],points[1],points[2]]);triangle(c,image,[uv[0],uv[2],uv[3]],[points[0],points[2],points[3]]);
  }
  return true;
}
