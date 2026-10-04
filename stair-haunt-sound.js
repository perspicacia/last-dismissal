export const STAIR_SOUND_DURATION=3.6;
export const STAIR_STEPS=Object.freeze([1.28,1.72,2.09,2.39,2.63]);
const TAU=2*Math.PI,clamp=x=>Math.max(0,Math.min(1,x));
export function stairHauntSamples(rate){
 if(!Number.isFinite(rate)||rate<4000)throw new RangeError('Unsupported sample rate');
 const dry=new Float32Array(Math.ceil(rate*STAIR_SOUND_DURATION));
 const lowAlpha=1-Math.exp(-TAU*190/rate),midAlpha=1-Math.exp(-TAU*1600/rate);
 let seed=82431,low=0,mid=0,phase=0;
 for(let i=0;i<dry.length;i++){
  const t=i/rate;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/2147483648-1;
  low+=lowAlpha*(noise-low);mid+=midAlpha*(noise-mid);
  phase+=TAU*(380+72*Math.sin(TAU*.8*t)+18*Math.sin(TAU*14*t))/rate;
  // A railing scraped from below, followed by a brief gap before the approach.
  const scrape=clamp((t-.02)/.075)*clamp((.88-t)/.14),drag=.35+.65*Math.sin(TAU*(3*t+3*t*t))**4;
  let value=scrape*(drag*(Math.sin(phase)*.065+Math.sin(phase*2.07)*.028+Math.sin(phase*3.17)*.012)+(mid-low)*.16+low*.09);
  for(let step=0;step<STAIR_STEPS.length;step++){
   const u=t-STAIR_STEPS[step];if(u<0||u>.55)continue;
   const level=[.15,.25,.4,.64,1][step],impact=clamp(u/.004)*Math.exp(-u*17);
   const sole=Math.sin(TAU*(88*u-24*u*u))*.61+Math.sin(TAU*171*u)*.20+low*.75;
   const scuff=clamp(1-Math.abs(u-.085)/.06)*(mid-low)*.13;
   value+=level*(impact*sole+scuff);
   if(step===STAIR_STEPS.length-1)value+=clamp(u/.005)*Math.exp(-u*12)*Math.sin(TAU*47*u)*.35;
  }
  dry[i]=value;
 }
 // Concrete stairwell reflections are in the same buffer, so stopping the
 // source cancels every later footfall and echo without pending timers.
 const data=new Float32Array(dry.length),echoes=[[.075,.23],[.17,.14],[.31,.08]].map(([delay,level])=>[Math.round(rate*delay),level]);
 let peak=0;
 for(let i=0;i<data.length;i++){
  let value=dry[i];for(const [delay,level] of echoes)if(i>=delay)value+=dry[i-delay]*level;
  data[i]=value*clamp((STAIR_SOUND_DURATION-i/rate)/.18);peak=Math.max(peak,Math.abs(data[i]));
 }
 if(peak)for(let i=0;i<data.length;i++)data[i]*=.72/peak;
 return data;
}
