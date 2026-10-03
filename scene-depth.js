import {CORRIDOR_LAMPS} from './school-lighting.js';
import {SCHOOL_WINDOW,CLASSROOM_WINDOWS} from './school-windows.js';
export function drawSceneDepth(c,project,player,{classroom=false,lampLevels=null}={}) {
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
    const {wallX:x,sill,top,transom,rail}=SCHOOL_WINDOW,wood=['#b18752','#755032','#92663e'],edge=['#745030','#48311f','#5e4129'];
    for(const {start,end} of CLASSROOM_WINDOWS){
      const middle=(start+end)/2,height=top-sill;
      for(const z of [start,end])box(x+.015,sill-.045,z,.24,height+.09,rail+.025,wood);
      for(const y of [sill,top])box(x+.015,y-(rail+.025)/2,middle,.24,rail+.025,end-start+.10,wood);
      box(x+.025,transom-rail/2,middle,.22,rail,end-start,wood);
      box(x+.055,sill,middle,.18,height,rail,wood);
      for(const side of [-1,1]){const a=side<0?start:middle,b=side<0?middle:end,sx=x+(side<0?.06:.02);
        for(const y of [sill+.09,top-.08])box(sx+.06,y-.011,(a+b)/2,.025,.022,b-a-.10,edge);
        box(sx+.08,1.35,middle+side*.115,.025,.18,.035,['#878274','#514e46','#6d695d']);
      }
      box(x+.12,sill-.0925,middle,.46,.075,end-start+.20,wood);
      box(x+.348,sill-.113,middle,.016,.026,end-start+.18,edge);
    }
  } else {
    for(const start of [4,6,12,14])if(Math.abs(player.z-(start+1))<9)frame(1,start+.16,start+1.84,.82,2.57,['#789184','#284e49','#547469']);
    for(const start of [4,14])if(Math.abs(player.z-(start+1))<9)frame(-1,start+.24,start+1.76,.02,2.61,['#a28b68','#4a4636','#796a50']);
    if(Math.abs(player.z-9)<8){for(const z of [8.18,9.82])box(-2.92,.62,z,.16,1.9,.055,['#aca07e','#3b4433','#766c4c']);for(const y of [.60,2.52])box(-2.92,y,9,.16,.065,1.7,['#aca07e','#3b4433','#766c4c']);}
  }
  for(const [i,z] of (classroom?[2.3,5.3,8.3]:CORRIDOR_LAMPS).entries()) {
    if(Math.abs(player.z-z)>12)continue;
    box(0,2.83,z+.2,1.25,.13,.48,['#85978c','#3f5550','#667c70']);
    // Light diffuser is a luminous bottom face of the metal fixture.
    const level=lampLevels?.[i]??1;
    polygon([[-.54,2.825,z+.035],[.54,2.825,z+.035],[.54,2.825,z+.365],[-.54,2.825,z+.365]],`rgb(${Math.round(53+160*level)},${Math.round(66+162*level)},${Math.round(60+150*level)})`);
    for(const x of [-.44,.44])box(x,2.95,z+.2,.025,.05,.025,['#8caaa0','#536b61','#536b61']);
  }
  faces.sort((a,b)=>b.d-a.d);
  for(const f of faces){c.fillStyle=f.color;c.beginPath();f.p.forEach((a,i)=>i?c.lineTo(a.x,a.y):c.moveTo(a.x,a.y));c.closePath();c.fill();c.strokeStyle='#0b231b30';c.lineWidth=.5;c.stroke();}
}
