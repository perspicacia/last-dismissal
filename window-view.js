// Correct side-wall vertical stretching; share the same deterministic scenery
// between normal and haunted windows. viewOffset is normalized camera parallax.
export function drawWindowView(c, rect, { ghost = null, haunted = false, verticalScale = 3, viewOffset = 0 } = {}) {
  const {x,y,width,height}=rect, h=height*verticalScale;
  const offset=Number.isFinite(viewOffset)?Math.max(-1,Math.min(1,viewOffset)):0;
  c.save();c.beginPath();c.rect(x,y,width,height);c.clip();
  c.translate(x,y);c.scale(width/428,height/h);
  const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#102431');sky.addColorStop(.6,'#294347');sky.addColorStop(1,'#101f22');c.fillStyle=sky;c.fillRect(0,0,428,h);
  // Far hillside and small trees lose contrast in blue mist.
  c.save();c.translate(-offset*5,0);
  c.fillStyle='#263d42';c.beginPath();c.moveTo(-40,h*.64);
  for(let i=0;i<=18;i++)c.lineTo(i*30-40,h*(.44+Math.sin(i*.43)*.055));
  c.lineTo(500,h*.82);c.lineTo(-40,h*.82);c.fill();
  for(let i=0;i<24;i++)tree(c,i*23-30,h*.73,h*(.27+(i%5)*.018),13+(i%4)*2,i,0);
  const mist=c.createLinearGradient(0,h*.43,0,h*.81);mist.addColorStop(0,'#7d9ca600');mist.addColorStop(.6,'#63818b35');mist.addColorStop(1,'#63818b00');c.fillStyle=mist;c.fillRect(-40,h*.4,520,h*.42);
  c.restore();
  c.save();c.translate(-offset*18,0);
  for(let i=0;i<9;i++)tree(c,i*67-52,h*.87,h*(.5+(i%3)*.04),31+(i%4)*5,i+30,1);
  c.restore();
  const grass=c.createLinearGradient(0,h*.76,0,h);grass.addColorStop(0,'#1b3230');grass.addColorStop(1,'#0d1e1c');c.fillStyle=grass;c.fillRect(0,h*.82,428,h*.18);
  // Converging path edges, paving seams and low boundary establish the ground.
  const vanishing=239-offset*7;
  c.fillStyle='#293739';c.beginPath();c.moveTo(vanishing-7,h*.8);c.lineTo(vanishing+9,h*.8);c.lineTo(498,h);c.lineTo(118,h);c.closePath();c.fill();
  c.strokeStyle='#50605b';c.lineWidth=1.5;c.beginPath();c.moveTo(vanishing-7,h*.8);c.lineTo(118,h);c.moveTo(vanishing+9,h*.8);c.lineTo(498,h);c.stroke();
  for(let i=1;i<8;i++){
    const t=(i/8)**2, yy=h*(.8+.2*t);
    c.strokeStyle=`rgba(121,135,124,${.07+t*.13})`;c.lineWidth=.5+t;
    c.beginPath();c.moveTo(vanishing-7+(118-vanishing+7)*t,yy);c.lineTo(vanishing+9+(498-vanishing-9)*t,yy);c.stroke();
  }
  c.save();c.translate(-offset*18,0);
  c.fillStyle='#303e3a';c.beginPath();c.moveTo(-30,h*.9);c.lineTo(229,h*.795);c.lineTo(229,h*.81);c.lineTo(-30,h*.965);c.closePath();c.fill();
  c.strokeStyle='#687770';c.lineWidth=1.5;c.beginPath();c.moveTo(-30,h*.9);c.lineTo(229,h*.795);c.stroke();
  for(let i=0;i<10;i++){
    const t=(i/10)**.65, xx=-30+259*t, yy=h*(.9-.105*t);
    c.strokeStyle='#182724';c.lineWidth=1.5;c.beginPath();c.moveTo(xx,yy);c.lineTo(xx,yy+h*.055*(1-t));c.stroke();
  }
  // Lamp and ghost share a middle-distance plane, so neither drifts separately.
  const lx=319,ly=h*.29,bottom=h*.96;
  const glow=c.createRadialGradient(lx+39,ly,2,lx+39,ly,h*.32);glow.addColorStop(0,'#eed7a44f');glow.addColorStop(.22,'#dcc69122');glow.addColorStop(1,'#dcc69100');c.fillStyle=glow;c.fillRect(180,0,248,h);
  const pole=c.createLinearGradient(lx-4,0,lx+5,0);pole.addColorStop(0,'#384b50');pole.addColorStop(.5,'#b4bfba');pole.addColorStop(1,'#4b6063');c.strokeStyle=pole;c.lineWidth=6;c.beginPath();c.moveTo(lx,bottom);c.lineTo(lx,ly-17);c.moveTo(lx,ly+39);c.lineTo(lx+37,ly+1);c.stroke();
  c.fillStyle='#65736e';c.beginPath();c.ellipse(lx,bottom,8,2.5,0,0,Math.PI*2);c.fill();
  c.save();c.translate(lx+43,ly-2);c.rotate(-.45);c.fillStyle='#17282c';c.beginPath();c.ellipse(0,0,19,9,0,0,Math.PI*2);c.fill();c.fillStyle='#e0d2af';c.shadowColor='#fff0bf';c.shadowBlur=13;c.beginPath();c.ellipse(1,2,13,4,0,0,Math.PI*2);c.fill();c.restore();
  const pool=c.createRadialGradient(335,h*.94,2,335,h*.94,76);pool.addColorStop(0,'#c4b78845');pool.addColorStop(1,'#c4b78800');c.fillStyle=pool;c.fillRect(240,h*.79,185,h*.21);
  if(haunted && ghost?.complete && ghost.naturalWidth){
    const gh=h*.8,gw=gh*ghost.naturalWidth/ghost.naturalHeight;
    c.drawImage(ghost,160-gw/2,h*.95-gh,gw,gh);
  }
  c.restore();
  // Close trees frame the sides while preserving the ghost's viewing area.
  c.save();c.translate(-offset*35,0);
  tree(c,-42,h*1.04,h*.92,54,73,2);tree(c,478,h*1.04,h*.91,52,81,2);
  c.restore();c.restore();
}
function tree(c,x,base,height,crownWidth,seed,layer){
  const top=base-height;
  c.strokeStyle=['#294046','#182c2c','#0c1c1c'][layer];c.lineWidth=[1.2,3,7][layer];
  c.beginPath();c.moveTo(x,base);c.lineTo(x-3,top+height*.12);
  for(let i=0;i<5;i++){
    const yy=top+height*(.18+i*.09), side=i%2?1:-1;
    c.moveTo(x-2,yy+height*.16);c.lineTo(x+side*crownWidth*.67,yy);c.lineTo(x+side*crownWidth*.84,yy-height*.035);
  }c.stroke();
  // Asymmetric serrated foliage islands replace smooth circular crowns.
  for(let cluster=0;cluster<7;cluster++){
    const cx=x+Math.sin(seed+cluster*2.4)*crownWidth*.5;
    const cy=top+height*(.08+cluster*.052), rw=crownWidth*(.43+(cluster%3)*.09), rh=height*(.055+(cluster%2)*.018);
    c.fillStyle=[['#314c4c','#2c4548'],['#1b3530','#244037'],['#0d251f','#153027']][layer][cluster%2];
    c.beginPath();
    for(let k=0;k<19;k++){
      const a=k/18*Math.PI*2, tooth=.8+.2*Math.sin(k*2.7+seed+cluster);
      const px=cx+Math.cos(a)*rw*tooth, py=cy+Math.sin(a)*rh*tooth;
      if(k===0)c.moveTo(px,py);else c.lineTo(px,py);
    }c.closePath();c.fill();
    if(layer>0)for(let leaf=0;leaf<6;leaf++){
      const lx=cx+Math.sin(seed+leaf*3.2+cluster)*rw*.73, ly=cy+Math.cos(leaf*1.7+cluster)*rh*.65;
      c.fillStyle=layer===1?'#42604d38':'#315d3838';c.beginPath();c.ellipse(lx,ly,2+layer,1.3+layer*.4,leaf,0,Math.PI*2);c.fill();
    }
  }
}
