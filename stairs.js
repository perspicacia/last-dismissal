// Geometry is in corridor world units; both flights share the existing exits.
export function stairFlight(up) {
  const left=up?-2.65:.65,right=up?-.65:2.65,start=24.6,tread=.42,rise=.19,count=12;
  const steps=Array.from({length:count},(_,i)=>({near:start+i*tread,far:start+(i+1)*tread,previous:i?(up?1:-1)*i*rise:0,level:(up?1:-1)*(i+1)*rise}));
  return {left,right,start,tread,rise,count,steps};
}
export function drawStairs(c, project) {
  for(const up of [true,false]) {
    const flight=stairFlight(up),{left:l,right:r,steps}=flight,faces=[];
    const face=(vertices,color,edge=false)=>{const pts=vertices.map(v=>project(...v));if(pts.every(Boolean))faces.push({pts,color,edge,d:pts.reduce((sum,p)=>sum+p.d,0)/pts.length});};
    const line=(a,b,color,width)=>{const pa=project(...a),pb=project(...b);if(pa&&pb)faces.push({pts:[pa,pb],color,width,d:(pa.d+pb.d)/2});};
    const clip=[project(l,3,24.6),project(r,3,24.6),project(r,0,23.4),project(l,0,23.4)];
    if(!clip.every(Boolean))continue;
    c.save();c.beginPath();clip.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.clip();
    // Recessed stairwell: side walls extend below the corridor for the down flight.
    if(up)face([[l,-2.5,26.8],[l,3,26.8],[l,3,30],[l,-2.5,30]],'#52615d');
    if(!up)face([[r,-2.5,26.8],[r,3,26.8],[r,3,30],[r,-2.5,30]],'#374744');
    face([[l,3,24.6],[r,3,24.6],[r,3,30],[l,3,30]],'#394d48');
    face([[l,-2.5,30],[r,-2.5,30],[r,3,30],[l,3,30]],'#22332f');
    face([[l,0,23.4],[r,0,23.4],[r,0,24.6],[l,0,24.6]],'#68716a',true);
    for(const s of steps) {
      // Horizontal tread and vertical riser use different brightness.
      face([[l,s.level,s.near],[r,s.level,s.near],[r,s.level,s.far],[l,s.level,s.far]],up?'#8d958b':'#717e77',true);
      face([[l,s.previous,s.near],[r,s.previous,s.near],[r,s.level,s.near],[l,s.level,s.near]],up?'#4c5954':'#354641');
      face([[l+.06,s.level+.003,s.near+.045],[r-.06,s.level+.003,s.near+.045],[r-.06,s.level+.003,s.near+.085],[l+.06,s.level+.003,s.near+.085]],'#1a2625');
      for(let j=0;j<12;j++) { // restrained aggregate speckles on the stone tread
        const x=l+.08+((j*47)%180)/100,z=s.near+.12+(j%4)*.065;
        line([x,s.level+.004,z],[x+.025,s.level+.004,z+.005],j%2?'#a8aea0':'#515f57',.8);
      }
    }
    // Steel balusters and continuous sloping handrails, one on each side.
    for(const x of [l+.09,r-.09]) {
      const first=[x,1.02,24.15],last=[x,steps.at(-1).level+1.02,steps.at(-1).far];
      for(let i=0;i<steps.length;i+=2) {
        const s=steps[i];line([x,s.level,s.near+.12],[x,s.level+1.02,s.near+.12],'#384d4c',5);
        line([x-.015,s.level,s.near+.12],[x-.015,s.level+1.02,s.near+.12],'#bbc4b8',1.6);
        line([x-.04,s.level+.016,s.near+.08],[x+.04,s.level+.016,s.near+.08],'#a0ada1',3);
      }
      line([x,0,24.15],first,'#a6b6ad',4);
      line(first,last,'#223a3a',7);line([first[0]-.015,first[1]+.015,first[2]],[last[0]-.015,last[1]+.015,last[2]],'#c1cec4',2.5);
      line([x,.56,24.15],[x,steps.at(-1).level+.56,steps.at(-1).far],'#83968c',2.5);
    }
    // Paint from back to front so risers and handrails occlude correctly.
    faces.sort((a,b)=>b.d-a.d);
    for(const f of faces) {
      c.beginPath();f.pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));
      if(f.width){c.strokeStyle=f.color;c.lineWidth=f.width;c.lineCap='round';c.stroke();}
      else {c.closePath();c.fillStyle=f.color;c.fill();if(f.edge){c.strokeStyle='#283b3580';c.lineWidth=.7;c.stroke();}}
    }
    c.restore();
    const sign=project((l+r)/2,2.8,24.6);if(sign){c.save();c.fillStyle='#d7dfc7';c.font=`bold ${Math.max(12,90/sign.d)}px sans-serif`;c.textAlign='center';c.fillText(up?'↑':'↓',sign.x,sign.y);c.restore();}
  }
}
