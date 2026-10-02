// Short original synthesized sounds; no downloaded samples.
export function effectSamples(kind,rate=44100,variant=0){
 const duration=kind==='footstep'?.24:kind==='jumpscare'?.85:0;
 if(!duration)throw new RangeError('Unknown sound effect');
 const data=new Float32Array(Math.ceil(rate*duration));let seed=12345+variant*7919,low=0,previous=0,phase=0,peak=0;
 for(let i=0;i<data.length;i++){
  const t=i/rate;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/2147483648-1;
  low+=.12*(noise-low);const high=noise-previous;previous=noise;
  if(kind==='footstep'){
   phase+=2*Math.PI*(88+variant*6)*Math.exp(-t*3)/rate;
   const hit=Math.min(1,t/.004)*Math.exp(-t*24);
   const scuff=Math.max(0,1-Math.abs(t-.10)/.08)*.09;
   data[i]=hit*(Math.sin(phase)*.75+low*.85)+low*scuff;
  }else{
   phase+=2*Math.PI*(1350*Math.exp(-t*2.8)+180)/rate;
   const attack=Math.min(1,t/.008),tail=Math.pow(Math.max(0,1-t/duration),1.7);
   const thud=Math.sin(2*Math.PI*64*t)*Math.exp(-t*14);
   data[i]=attack*tail*(thud*.8+Math.sin(phase)*.30+high*.16+low*.35);
  }
  peak=Math.max(peak,Math.abs(data[i]));
 }
 if(peak)for(let i=0;i<data.length;i++)data[i]*=(kind==='footstep'?.70:.85)/peak;
 return data;
}
