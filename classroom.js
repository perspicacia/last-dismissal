export const CLASSROOM_NOTE = { x: 1.2, z: 5 };
export const CLASSROOM_SPAWN = { x: 0, z: 1.4, angle: 0 };
export const CLASSROOM_TEACHER_DESK = { x: -.5, z: 8.7, width: 2, depth: .65, height: .72 };
export const CLASSROOM_DESKS = [-2.5, 1.2, 2.8].flatMap(x => [3.2, 5, 6.8].map(z => ({x,z,width:1.1,depth:.65,height:.76})));
export function moveClassroomPlayer(player, keys, dt) {
  const step=Math.max(0,Math.min(.05,dt));
  const angle=player.angle+(Number(keys.has('right'))-Number(keys.has('left')))*1.65*step;
  const walk=(Number(keys.has('forward'))-Number(keys.has('back')))*3.8*step;
  const result={...player,angle};
  const blocked=(x,z)=>[...CLASSROOM_DESKS,CLASSROOM_TEACHER_DESK].some(d=>Math.abs(x-d.x)<d.width/2+.22 && Math.abs(z-d.z)<d.depth/2+.22)||CLASSROOM_DESKS.some(d=>Math.abs(x-d.x)<.45 && Math.abs(z-(d.z-.72))<.42);
  const x=Math.max(-4,Math.min(4,player.x+Math.sin(angle)*walk));
  if(!blocked(x,result.z))result.x=x;
  const z=Math.max(.8,Math.min(9.2,player.z+Math.cos(angle)*walk));
  if(!blocked(result.x,z))result.z=z;
  return result;
}

// Geometry uses the same world units as movement; desks cannot be walked through.
export function drawClassroom(c,w,h,p,time,noteTaken=false) {
  const horizon=h*.48,lens=w*.68;
  const project=(x,y,z)=>{const dx=x-p.x,dz=z-p.z,d=dx*Math.sin(p.angle)+dz*Math.cos(p.angle);return d>.08?{x:w/2+(dx*Math.cos(p.angle)-dz*Math.sin(p.angle))*lens/d,y:horizon+(1.5-y)*lens/d,d}:null;};
  c.fillStyle='#172a35';c.fillRect(0,0,w,horizon);c.fillStyle='#3b322e';c.fillRect(0,horizon,w,h);
  // Perspective wooden boards, knots and faint cold window reflections.
  for(let y=Math.ceil(horizon)+1;y<h;y+=4){const d=1.5*lens/(y-horizon);if(d>30)continue;for(let x=0;x<w;x+=4){const a=(x-w/2)*d/lens,wx=p.x+Math.sin(p.angle)*d+Math.cos(p.angle)*a,wz=p.z+Math.cos(p.angle)*d-Math.sin(p.angle)*a;const row=Math.floor(wx/.24),seam=((wz+((row%3)*.63))%1.9+1.9)%1.9;const grain=Math.sin(wz*37+row*8)*3;const v=45+(Math.sin(row*19)*9)+grain;c.fillStyle=`rgb(${v+18},${v+8},${v+4})`;if((((wx%.24)+.24)%.24)<.012||seam<.022)c.fillStyle='#201e1c';c.fillRect(x,y,4,4);}}

  for(let sx=0;sx<w;sx+=3){const offset=Math.atan((sx-w/2)/lens),a=p.angle+offset,dx=Math.sin(a),dz=Math.cos(a),tx=Math.abs(dx)<1e-9?Infinity:((dx>0?4.4:-4.4)-p.x)/dx,tz=Math.abs(dz)<1e-9?Infinity:((dz>0?9.8:0)-p.z)/dz,side=tx<tz,dist=side?tx:tz,depth=dist*Math.cos(offset),wx=p.x+dx*dist,wz=p.z+dz*dist;const height=3*lens/depth,top=horizon-height*.5;
    const drawBand=(from,to,color)=>{c.fillStyle=color;c.fillRect(sx,top+from*height,3,(to-from)*height+1);};
    drawBand(0,.57,'#738e90');drawBand(.57,.97,'#234650');drawBand(.56,.58,'#adb3a1');drawBand(.97,1,'#14262b');
    if(side&&dx<0&&wz>1.8&&wz<8.9){drawBand(.15,.5,'#384b47');drawBand(.17,.48,'#091d2a');const frame=((wz-1.8)%1.45);if(frame<.085)drawBand(.15,.5,'#847e64');drawBand(.31,.325,'#938e76');drawBand(.49,.515,'#a1a591');if(frame>.15&&frame<.6)drawBand(.19,.28,'#1d3c51');}
    if(!side&&dz>0&&wx>-3.2&&wx<2.8){drawBand(.18,.53,'#bdb6a0');drawBand(.2,.505,'#123631');drawBand(.50,.53,'#817256');if(wx>-.8&&wx<1.2)drawBand(.32,.326,'#9dad99');}
    if(!side&&dz<0){if(wx<-2.7){drawBand(.23,.92,'#6e7561');if((wx+4.4)%.55<.035)drawBand(.23,.92,'#354637');drawBand(.49,.51,'#394b3c');drawBand(.72,.74,'#394b3c');}if(wx>-.75&&wx<.75){drawBand(.13,1,'#76654d');drawBand(.18,.44,'#112b39');drawBand(.6,.62,'#b7b29b');}}
    c.fillStyle=`rgba(0,8,18,${Math.min(.7,depth*.045)})`;c.fillRect(sx,top,3,height);
  }
  const faces=[];
  const polygon=(vertices,color)=>{const pts=vertices.map(v=>project(...v));if(pts.every(Boolean))faces.push({pts,color,d:pts.reduce((s,v)=>s+v.d,0)/pts.length});};
  const box=(x,y,z,width,height,depth,colors)=>{const l=x-width/2,r=x+width/2,n=z-depth/2,f=z+depth/2,t=y+height;polygon([[l,t,n],[r,t,n],[r,t,f],[l,t,f]],colors[0]);polygon([[l,y,n],[r,y,n],[r,t,n],[l,t,n]],colors[1]);polygon([[l,y,f],[r,y,f],[r,t,f],[l,t,f]],colors[1]);polygon([[l,y,n],[l,y,f],[l,t,f],[l,t,n]],colors[2]);polygon([[r,y,n],[r,y,f],[r,t,f],[r,t,n]],colors[2]);};
  for(const desk of CLASSROOM_DESKS){const {x,z,width,depth}=desk;for(const dx of [-.43,.43])for(const dz of [-.22,.22])box(x+dx,0,z+dz,.045,.72,.045,['#95a6a2','#65736e','#3d504d']);box(x,.71,z,width,.06,depth,[x===CLASSROOM_NOTE.x&&z===CLASSROOM_NOTE.z?'#c5a66c':'#9c8360','#6d563c','#7a644a']);box(x,.53,z,.96,.08,.48,['#4c4739','#554936','#4a3c2f']);box(x,.38,z-.72,.55,.055,.46,['#897854','#5d533d','#746548']);box(x,.43,z-.96,.55,.43,.065,['#8f7d56','#716247','#514b3b']);for(const dx of [-.2,.2])for(const dz of [-.15,.15])box(x+dx,0,z-.72+dz,.035,.4,.035,['#8a9992','#5f7168','#34493d']);}
  // Teacher's desk anchors the classroom front.
  const teacher=CLASSROOM_TEACHER_DESK;box(teacher.x,0,teacher.z,teacher.width,teacher.height,teacher.depth,['#948064','#51493a','#685b47']);
  if(!noteTaken){
    polygon([[.85,.779,4.83],[1.47,.779,4.83],[1.47,.779,5.16],[.85,.779,5.16]],'#eee1b5');
    polygon([[.92,.78,4.88],[1.38,.78,4.88],[1.38,.78,4.91],[.92,.78,4.91]],'#555c4d');
  }
  faces.sort((a,b)=>b.d-a.d);for(const face of faces){c.fillStyle=face.color;c.strokeStyle='#10202980';c.lineWidth=.7;c.beginPath();face.pts.forEach((v,i)=>i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.closePath();c.fill();c.stroke();}
  for(let z of [2.3,5.3,8.3]){const pts=[project(-1,2.98,z),project(1,2.98,z),project(1,2.98,z+.22),project(-1,2.98,z+.22)];if(pts.every(Boolean)){c.fillStyle='#bddbd9';c.shadowColor='#8eccc7';c.shadowBlur=10;c.beginPath();pts.forEach((v,i)=>i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.closePath();c.fill();c.shadowBlur=0;}}
  const shade=c.createRadialGradient(w/2,h/2,w*.15,w/2,h/2,w*.7);shade.addColorStop(0,'transparent');shade.addColorStop(1,'#000915c0');c.fillStyle=shade;c.fillRect(0,0,w,h);
}
