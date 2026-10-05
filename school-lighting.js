// Seconds of corridor play, independent of audio and exploration judgments.
export const CORRIDOR_LAMPS = Object.freeze([3,8,13,18,23]);
const OUTAGES = [[2.6,1.5],[9.1,1.8],[5.8,1.4],[14.8,2.0],[11.9,1.3]];
const PERIOD = 18.5;
const smooth = x => x*x*(3-2*x);

export function corridorLampLevel(index,seconds,reduced=false){
  if(reduced)return 1;
  const [start,duration]=OUTAGES[index],cycle=Math.floor(Math.max(0,seconds)/PERIOD);
  // Slight shifts between cycles avoid a metronomic, synchronized blink.
  const shift=cycle===0?0:Math.sin(cycle*2.7+index*1.9)*.22;
  const t=Math.max(0,seconds)%PERIOD-start-shift;
  if(t<0||t>=duration)return 1;
  if(t<.18)return 1-smooth(t/.18);
  if(t>duration-.35)return smooth((t-duration+.35)/.35);
  return 0;
}

export class SchoolLighting {
  constructor(){this.reset();}
  reset(){this.elapsed=0;this.last=null;}
  update(time,{active=true,reduced=false}={}){
    const dt=this.last===null?0:Math.min(.05,Math.max(0,(time-this.last)/1000));
    this.last=time;
    if(active&&!reduced)this.elapsed+=dt;
    return this.levels(reduced);
  }
  levels(reduced=false){return CORRIDOR_LAMPS.map((_,i)=>corridorLampLevel(i,this.elapsed,reduced));}
}

export function recordLighting(canvas,levels){
  if(canvas)canvas.dataset.corridorLights=levels.map(v=>v.toFixed(2)).join(',');
}

export function shadeCanvasSchool(c,w,h,levels=null,player=null){
  // Compatibility renderer has no physical lights: approximate the nearby pool.
  const outage=levels&&player?Math.max(...levels.map((level,i)=>(1-level)*Math.max(0,1-Math.abs(player.z-CORRIDOR_LAMPS[i])/6))):0;
  c.save();c.fillStyle=`rgba(2,8,13,${.22+.13*outage})`;c.fillRect(0,0,w,h);c.restore();
}
