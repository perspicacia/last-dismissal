export function clockAngles(anomaly=false) {
  return anomaly ? [Math.PI,Math.PI] : [(11+17/60)*Math.PI/6,17*Math.PI/30];
}
export function drawClockFace(c,size,anomaly=false) {
  c.save();c.translate(size/2,size/2);const r=size*.49;
  const disk=(radius,fill)=>{c.fillStyle=fill;c.beginPath();c.arc(0,0,radius,0,Math.PI*2);c.fill();};
  const wood=c.createLinearGradient(-r,-r,r,r);wood.addColorStop(0,'#79584a');wood.addColorStop(.28,'#34231f');wood.addColorStop(.65,'#50332b');wood.addColorStop(1,'#201c1a');disk(r,wood);
  disk(r*.89,'#adada0');disk(r*.85,'#687466');
  const ivory=c.createRadialGradient(-r*.3,-r*.3,0,0,0,r*.83);ivory.addColorStop(0,'#f4f0df');ivory.addColorStop(1,'#c7d0c5');disk(r*.83,ivory);
  c.strokeStyle='#879589';c.lineWidth=size*.002;c.beginPath();c.arc(0,0,r*.79,0,Math.PI*2);c.stroke();
  for(let i=0;i<60;i++){const a=i*Math.PI/30;c.strokeStyle='#47564b';c.lineWidth=i%5?size*.002:size*.005;c.beginPath();c.moveTo(Math.sin(a)*r*.76,-Math.cos(a)*r*.76);c.lineTo(Math.sin(a)*r*(i%5?.79:.81),-Math.cos(a)*r*(i%5?.79:.81));c.stroke();}
  c.fillStyle='#14291f';c.font=`${size*.125}px Georgia, serif`;c.textAlign='center';c.textBaseline='middle';
  for(let n=1;n<=12;n++){const a=n*Math.PI/6;c.fillText(String(n),Math.sin(a)*r*.64,-Math.cos(a)*r*.64);}
  // Faded floral print in the lower-right part of the dial.
  c.strokeStyle='#61735a';c.lineWidth=size*.005;
  for(let i=0;i<5;i++){const x=r*(.2+i*.052),y=r*(.38-i*.025);c.beginPath();c.moveTo(r*.23,r*.59);c.quadraticCurveTo(x-r*.06,y+r*.04,x,y-r*.14);c.stroke();c.fillStyle='#688365';c.beginPath();c.ellipse(x-r*.05,y+r*.01,r*.065,r*.027,-.6,0,Math.PI*2);c.fill();}
  for(const [x,y,rr,col] of [[.29,.35,.083,'#b17c90'],[.41,.29,.088,'#af8fab'],[.19,.44,.06,'#b99797']])for(let i=0;i<7;i++){
    const a=i*Math.PI*2/7;c.fillStyle=col;c.beginPath();c.ellipse(r*x+Math.cos(a)*rr*r*.48,r*y+Math.sin(a)*rr*r*.48,rr*r*.55,rr*r*.35,a,0,Math.PI*2);c.fill();
  }
  for(const [i,a] of clockAngles(anomaly).entries()) {
    c.save();c.rotate(a);const len=r*(i?.70:.49);
    c.shadowColor='#11201766';c.shadowBlur=size*.007;c.shadowOffsetX=size*.006;c.shadowOffsetY=size*.007;
    c.fillStyle='#172a22';c.beginPath();c.moveTo(-size*.012,size*.075);c.lineTo(-size*.018,-len*.63);c.lineTo(0,-len);c.lineTo(size*.018,-len*.63);c.lineTo(size*.012,size*.075);c.closePath();c.fill();
    c.shadowBlur=0;c.shadowOffsetX=0;c.shadowOffsetY=0;c.strokeStyle='#172a22';c.lineWidth=size*.008;
    for(const f of [.25,.5]){c.beginPath();c.ellipse(0,-len*f,size*.025,len*.105,0,0,Math.PI*2);c.stroke();}
    c.restore();
  }
  disk(size*.019,'#b0a45f');disk(size*.009,'#3c4632');
  c.strokeStyle='#ffffff28';c.lineWidth=size*.007;c.beginPath();c.arc(0,0,r*.87,Math.PI*1.05,Math.PI*1.65);c.stroke();c.restore();
}
// Triangulated UV mapping follows the perspective of a plane on the side wall.
export function texturedQuad(c,image,project,point,divisions=6) {
  const triangle=(uv)=>{
    const p=uv.map(([u,v])=>project(...point(u,v)));if(!p.every(Boolean))return;
    const [a,b,d]=p,[s,t,q]=uv.map(([u,v])=>[u*image.width,v*image.height]);
    const det=s[0]*(t[1]-q[1])+t[0]*(q[1]-s[1])+q[0]*(s[1]-t[1]);
    const coef=values=>[(values[0]*(t[1]-q[1])+values[1]*(q[1]-s[1])+values[2]*(s[1]-t[1]))/det,(values[0]*(q[0]-t[0])+values[1]*(s[0]-q[0])+values[2]*(t[0]-s[0]))/det,(values[0]*(t[0]*q[1]-q[0]*t[1])+values[1]*(q[0]*s[1]-s[0]*q[1])+values[2]*(s[0]*t[1]-t[0]*s[1]))/det];
    const x=coef([a.x,b.x,d.x]),y=coef([a.y,b.y,d.y]);
    c.save();c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.lineTo(d.x,d.y);c.closePath();c.clip();c.transform(x[0],y[0],x[1],y[1],x[2],y[2]);c.drawImage(image,0,0);c.restore();
  };
  for(let i=0;i<divisions;i++)for(let j=0;j<divisions;j++) {const u=i/divisions,v=j/divisions,un=(i+1)/divisions,vn=(j+1)/divisions;triangle([[u,v],[un,v],[un,vn]]);triangle([[u,v],[un,vn],[u,vn]]);}
}
export function drawWallClock(c,project,image) {
  const radius=.39,y=2.08,z=19,front=2.83,back=2.99;
  const ring=(x,offset=0)=>Array.from({length:48},(_,i)=>{const a=i*Math.PI/24;return project(x,y+Math.cos(a)*radius+offset,z+Math.sin(a)*radius+offset);});
  const polygon=(p,color)=>{if(!p.every(Boolean))return;c.fillStyle=color;c.beginPath();p.forEach((a,i)=>i?c.lineTo(a.x,a.y):c.moveTo(a.x,a.y));c.closePath();c.fill();};
  const a=ring(front),b=ring(back);polygon(ring(2.995,-.05),'#0c1d1b70');
  for(let i=0;i<48;i++)polygon([a[i],a[(i+1)%48],b[(i+1)%48],b[i]],i<24?'#382d29':'#665346');
  texturedQuad(c,image,project,(u,v)=>[front,y+radius-v*radius*2,z+radius-u*radius*2]);
}
