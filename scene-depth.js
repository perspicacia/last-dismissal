export function drawSceneDepth(c,project,player,{classroom=false}={}) {
  const faces=[];
  const polygon=(vertices,color)=>{const p=vertices.map(v=>project(...v));if(p.every(Boolean))faces.push({p,color,d:p.reduce((s,a)=>s+a.d,0)/p.length});};
  const box=(x,y,z,wx,hy,dz,colors)=>{
    const l=x-wx/2,r=x+wx/2,n=z-dz/2,f=z+dz/2,t=y+hy;
    polygon([[l,t,n],[r,t,n],[r,t,f],[l,t,f]],colors[0]);polygon([[l,y,n],[r,y,n],[r,t,n],[l,t,n]],colors[1]);polygon([[l,y,f],[r,y,f],[r,t,f],[l,t,f]],colors[1]);polygon([[l,y,n],[l,y,f],[l,t,f],[l,t,n]],colors[2]);polygon([[r,y,n],[r,y,f],[r,t,f],[r,t,n]],colors[2]);
  };
  const frame=(side,z0,z1,y0,y1,color)=>{
    const x=side*(classroom?4.34:2.95),length=z1-z0;
    box(x,y0-.03,(z0+z1)/2,.13,.07,length+.13,color);
    box(x,y1-.015,(z0+z1)/2,.13,.07,length+.13,color);
    for(const z of [z0,z1])box(x,y0,z,.13,y1-y0,.07,color);
    // Wide projecting sill, with a dark underside and contact shadow.
    box(x-side*.035,y0-.10,(z0+z1)/2,.23,.08,length+.22,['#bbb59d','#626f61','#889586']);
    box(side*(classroom?4.395:2.995),y0-.16,(z0+z1)/2,.015,.04,length+.25,['#19372a88','#102a2388','#102a2388']);
  };
  if(classroom){
    for(let z=1.8;z<8.9;z+=1.45)frame(-1,z+.04,z+1.40,1.47,2.49,['#789184','#31564f','#52756b']);
  } else {
    for(const start of [4,6,12,14])if(Math.abs(player.z-(start+1))<9)frame(1,start+.16,start+1.84,.82,2.57,['#789184','#284e49','#547469']);
    for(const start of [4,14])if(Math.abs(player.z-(start+1))<9)frame(-1,start+.24,start+1.76,.02,2.61,['#a28b68','#4a4636','#796a50']);
    if(Math.abs(player.z-9)<8){for(const z of [8.18,9.82])box(-2.92,.62,z,.16,1.9,.055,['#aca07e','#3b4433','#766c4c']);for(const y of [.60,2.52])box(-2.92,y,9,.16,.065,1.7,['#aca07e','#3b4433','#766c4c']);}
  }
  for(const z of classroom?[2.3,5.3,8.3]:[2,6,10,14,18,22]) {
    if(Math.abs(player.z-z)>12)continue;
    box(0,2.83,z+.2,1.25,.13,.48,['#85978c','#3f5550','#667c70']);
    // Light diffuser is a luminous bottom face of the metal fixture.
    polygon([[-.54,2.825,z+.035],[.54,2.825,z+.035],[.54,2.825,z+.365],[-.54,2.825,z+.365]],'#d5e4d2');
    for(const x of [-.44,.44])box(x,2.95,z+.2,.025,.05,.025,['#8caaa0','#536b61','#536b61']);
  }
  faces.sort((a,b)=>b.d-a.d);
  for(const f of faces){c.fillStyle=f.color;c.beginPath();f.p.forEach((a,i)=>i?c.lineTo(a.x,a.y):c.moveTo(a.x,a.y));c.closePath();c.fill();c.strokeStyle='#0b231b30';c.lineWidth=.5;c.stroke();}
}
