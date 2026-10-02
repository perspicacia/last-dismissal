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
   // Voiced, rough "u-aa-ah": glottal harmonics shaped by moving vowel formants.
   const vowel=Math.min(1,Math.max(0,(t-.08)/.18));
   const pitch=(210+210*Math.sin(Math.min(1,t/.24)*Math.PI/2))*Math.exp(-t*.95);
   phase+=2*Math.PI*pitch*(1+.025*Math.sin(2*Math.PI*33*t)+.007*noise)/rate;
   const formants=[320+530*vowel,800+460*vowel,2450];let voice=0;
   for(let harmonic=1;harmonic<=24;harmonic++){
    const frequency=pitch*harmonic;
    const weight=.10+formants.reduce((sum,f,j)=>sum+(j===2?.38:1)*Math.exp(-Math.pow((frequency-f)/(j===2?280:170),2)),0);
    voice+=Math.sin(phase*harmonic)*weight/Math.pow(harmonic,.8);
   }
   const attack=Math.min(1,t/.018),tail=Math.min(1,(duration-t)/.14);
   const growl=Math.sin(phase*.5)*.16,breath=high*(.025+.10*Math.min(1,t/.65));
   data[i]=attack*tail*(Math.tanh(voice*1.8)*.80+growl+breath+Math.sin(2*Math.PI*64*t)*Math.exp(-t*23)*.25);

  }
  peak=Math.max(peak,Math.abs(data[i]));
 }
 if(peak)for(let i=0;i<data.length;i++)data[i]*=(kind==='footstep'?.70:.85)/peak;
 return data;
}
