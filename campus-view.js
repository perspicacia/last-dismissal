// One continuous yard facing the classroom, rather than a repeated window tile.
export const CAMPUS_WIDTH = 2140;
export function classroomWindowColumn(z, width = CAMPUS_WIDTH) {
  return Math.max(0, Math.min(width - 1, Math.floor((z - 1.8) / 7.1 * width)));
}
export function drawCampusView(c, {width = CAMPUS_WIDTH, height = 447, viewOffset = 0} = {}) {
  const h=height, offset=Number.isFinite(viewOffset)?Math.max(-1,Math.min(1,viewOffset)):0;
  c.save();c.scale(width/CAMPUS_WIDTH,1);
  const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#0b1d2c');sky.addColorStop(.65,'#354950');sky.addColorStop(1,'#1d3034');c.fillStyle=sky;c.fillRect(0,0,2140,h);
  c.save();c.translate(-offset*6,0);
  // Unequal distant hills and irregular tree heights form a single skyline.
  c.fillStyle='#263d45';c.beginPath();c.moveTo(-60,h*.65);
  for(let x=-60;x<=2200;x+=40)c.lineTo(x,h*(.49+.07*Math.sin(x/360)+.026*Math.sin(x/91)));
  c.lineTo(2200,h);c.lineTo(-60,h);c.fill();c.restore();
  c.save();c.translate(-offset*18,0);
  for(let i=0;i<68;i++){
    const x=i*34-70+Math.sin(i*2.3)*13,base=h*.73,th=h*(.12+.13*(.5+.5*Math.sin(i*4.19)));
    c.strokeStyle='#182e30';c.lineWidth=3;c.beginPath();c.moveTo(x,base);c.lineTo(x+Math.sin(i)*5,base-th);c.stroke();
    c.fillStyle=i%3?'#203b36':'#2a433d';c.beginPath();c.moveTo(x,base-th-9);c.lineTo(x-18,base-th*.35);c.lineTo(x+21,base-th*.31);c.closePath();c.fill();
  }
  c.restore();
  const ground=c.createLinearGradient(0,h*.69,0,h);ground.addColorStop(0,'#414940');ground.addColorStop(1,'#635c49');c.fillStyle=ground;c.fillRect(0,h*.73,2140,h*.27);
  c.save();c.translate(-offset*28,0);
  // Low school perimeter fence, behind the empty sports ground.
  c.strokeStyle='#52645e';c.lineWidth=1.5;c.beginPath();c.moveTo(-50,h*.76);c.lineTo(2200,h*.76);c.moveTo(-50,h*.79);c.lineTo(2200,h*.79);c.stroke();
  for(let x=-50;x<2200;x+=62){c.beginPath();c.moveTo(x,h*.735);c.lineTo(x,h*.82);c.stroke();}
  // Left: utility shed and a basketball court. Middle: broad empty yard.
  c.fillStyle='#34413d';c.fillRect(65,h*.61,200,h*.18);c.fillStyle='#17292b';c.fillRect(92,h*.655,70,h*.135);
  c.fillStyle='#535c53';c.beginPath();c.moveTo(46,h*.61);c.lineTo(171,h*.55);c.lineTo(279,h*.61);c.closePath();c.fill();
  c.fillStyle='#263a3c';c.beginPath();c.moveTo(350,h*.815);c.lineTo(770,h*.815);c.lineTo(990,h);c.lineTo(180,h);c.closePath();c.fill();
  c.strokeStyle='#89948a';c.lineWidth=2;c.beginPath();c.moveTo(375,h*.84);c.lineTo(745,h*.84);c.lineTo(897,h*.97);c.lineTo(247,h*.97);c.closePath();c.moveTo(570,h*.84);c.lineTo(570,h*.97);c.stroke();
  c.beginPath();c.ellipse(570,h*.905,55,h*.035,0,0,Math.PI*2);c.stroke();
  c.strokeStyle='#87998f';c.lineWidth=5;c.beginPath();c.moveTo(425,h*.86);c.lineTo(425,h*.57);c.stroke();c.fillStyle='#94a398';c.fillRect(380,h*.53,90,h*.095);c.strokeStyle='#465a54';c.lineWidth=2;c.strokeRect(408,h*.565,34,h*.042);
  c.strokeStyle='#8e7960';c.beginPath();c.ellipse(425,h*.632,17,4,0,0,Math.PI*2);c.stroke();
  // One running-track arc and one distant goal, each appears only once.
  c.strokeStyle='#9a958066';c.lineWidth=2;
  for(let i=0;i<3;i++){c.beginPath();c.ellipse(1330,h*1.17,620+i*36,h*(.31+i*.025),0,Math.PI,Math.PI*2);c.stroke();}
  c.strokeStyle='#94a49a';c.lineWidth=3;c.beginPath();c.moveTo(1430,h*.84);c.lineTo(1430,h*.67);c.lineTo(1650,h*.67);c.lineTo(1650,h*.84);c.stroke();
  c.strokeStyle='#697d7160';c.lineWidth=1;for(let x=1445;x<1650;x+=18){c.beginPath();c.moveTo(x,h*.67);c.lineTo(x,h*.84);c.stroke();}
  // Right: one lamp, its pool of light and a large tree at the edge of the yard.
  const lx=1860,ly=h*.34;const glow=c.createRadialGradient(lx+30,ly,1,lx+30,ly,90);glow.addColorStop(0,'#ead7a044');glow.addColorStop(1,'#ead7a000');c.fillStyle=glow;c.fillRect(lx-70,ly-90,200,200);
  c.strokeStyle='#7e928e';c.lineWidth=6;c.beginPath();c.moveTo(lx,h*.9);c.lineTo(lx,ly);c.lineTo(lx+38,ly-13);c.stroke();c.fillStyle='#d1c8a2';c.beginPath();c.ellipse(lx+40,ly-13,20,4,-.3,0,Math.PI*2);c.fill();
  const pool=c.createRadialGradient(lx,h*.91,1,lx,h*.91,120);pool.addColorStop(0,'#b9b18b36');pool.addColorStop(1,'#b9b18b00');c.fillStyle=pool;c.fillRect(lx-130,h*.8,260,h*.2);
  c.restore();c.save();c.translate(-offset*42,0);c.strokeStyle='#172a27';c.lineWidth=15;c.beginPath();c.moveTo(2080,h);c.lineTo(2070,h*.47);c.moveTo(2075,h*.65);c.lineTo(2010,h*.4);c.stroke();
  for(let i=0;i<7;i++){c.fillStyle=i%2?'#18352d':'#1e3c31';c.beginPath();c.ellipse(2040+Math.sin(i*2.1)*72,h*(.35+i*.03),80+i*3,h*.075,i*.2,0,Math.PI*2);c.fill();}
  c.restore();c.restore();
}
