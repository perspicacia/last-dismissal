// A side-wall texture stretches vertically in world space. Draw in a corrected
// coordinate system so tree trunks, lamp heads and the doll keep their shape.
export function drawWindowView(c, rect, { ghost = null, haunted = false, verticalScale = 3 } = {}) {
  const {x,y,width,height}=rect, h=height*verticalScale;
  c.save();c.beginPath();c.rect(x,y,width,height);c.clip();
  c.translate(x,y);c.scale(width/428,height/h);
  const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#122a3a');sky.addColorStop(.55,'#244047');sky.addColorStop(1,'#071719');c.fillStyle=sky;c.fillRect(0,0,428,h);
  // Layered broadleaf crowns, branches and thin bare trees along the school edge.
  for(let layer=0;layer<3;layer++)for(let i=0;i<15;i++){
    const tx=(i*73+layer*37)%466-20,base=h*(.68+layer*.095),top=h*(.12+((i*7)%11)*.025+layer*.08);
    c.strokeStyle=['#193039','#142c31','#102321'][layer];c.lineWidth=2+layer*1.3;
    c.beginPath();c.moveTo(tx,base);c.lineTo(tx-4,top);c.moveTo(tx-2,top+h*.14);c.lineTo(tx-23,top+h*.06);c.moveTo(tx-2,top+h*.23);c.lineTo(tx+25,top+h*.12);c.stroke();
    if(i%4!==0)for(let crown=0;crown<5;crown++){
      c.fillStyle=['#203d41','#173430','#122b27'][layer];c.beginPath();c.ellipse(tx+(crown%3-1)*20,top+h*.08+(crown%2)*20,24+(i%3)*4,25+(i%5)*3,0,0,Math.PI*2);c.fill();
    }
  }
  c.fillStyle='#152b28';c.fillRect(0,h*.83,428,h*.17);
  c.fillStyle='#263638';c.beginPath();c.moveTo(0,h*.93);c.lineTo(428,h*.82);c.lineTo(428,h);c.lineTo(0,h);c.fill();
  // Silver pole, rising angled support and an oval LED housing.
  const lx=319,ly=h*.29,bottom=h*.96;
  const glow=c.createRadialGradient(lx+39,ly,2,lx+39,ly,h*.32);glow.addColorStop(0,'#eed7a44f');glow.addColorStop(.22,'#dcc69122');glow.addColorStop(1,'#dcc69100');c.fillStyle=glow;c.fillRect(180,0,248,h);
  const pole=c.createLinearGradient(lx-4,0,lx+5,0);pole.addColorStop(0,'#384b50');pole.addColorStop(.5,'#b4bfba');pole.addColorStop(1,'#4b6063');c.strokeStyle=pole;c.lineWidth=6;c.beginPath();c.moveTo(lx,bottom);c.lineTo(lx,ly-17);c.moveTo(lx,ly+39);c.lineTo(lx+37,ly+1);c.stroke();
  c.save();c.translate(lx+43,ly-2);c.rotate(-.45);c.fillStyle='#17282c';c.beginPath();c.ellipse(0,0,19,9,0,0,Math.PI*2);c.fill();c.fillStyle='#e0d2af';c.shadowColor='#fff0bf';c.shadowBlur=13;c.beginPath();c.ellipse(1,2,13,4,0,0,Math.PI*2);c.fill();c.restore();
  const pool=c.createRadialGradient(335,h*.94,2,335,h*.94,76);pool.addColorStop(0,'#c4b78845');pool.addColorStop(1,'#c4b78800');c.fillStyle=pool;c.fillRect(240,h*.79,185,h*.21);
  if(haunted && ghost?.complete && ghost.naturalWidth){
    const gh=h*.8,gw=gh*ghost.naturalWidth/ghost.naturalHeight;
    c.drawImage(ghost,160-gw/2,h*.95-gh,gw,gh);
  }
  c.restore();
}
