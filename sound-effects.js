// Original deterministic synthesis. Every effect shares the player's master gain.
export const EFFECT_DURATIONS={footstep:.24,jumpscare:.85,'door-slide':.65,'baby-cry':1.7};
const TAU=2*Math.PI;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
export function effectSamples(kind,rate=44100,variant=0){
 const duration=EFFECT_DURATIONS[kind];
 if(!duration)throw new RangeError('Unknown sound effect');
 if(!Number.isFinite(rate)||rate<4000)throw new RangeError('Unsupported sample rate');
 const data=new Float32Array(Math.ceil(rate*duration));
 let seed=12345+variant*7919,low=0,mid=0,phase=0,peak=0;
 // Time-based filter coefficients keep the colour stable across sample rates.
 const lowAlpha=kind==='footstep'?.12:1-Math.exp(-TAU*180/rate),midAlpha=1-Math.exp(-TAU*1800/rate);
 for(let i=0;i<data.length;i++){
  const t=i/rate;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/2147483648-1;
  low+=lowAlpha*(noise-low);mid+=midAlpha*(noise-mid);
  if(kind==='footstep'){
   phase+=TAU*(88+variant*6)*Math.exp(-t*3)/rate;
   const hit=Math.min(1,t/.004)*Math.exp(-t*24);
   const scuff=Math.max(0,1-Math.abs(t-.10)/.08)*.09;
   data[i]=hit*(Math.sin(phase)*.75+low*.85)+low*scuff;
  }else if(kind==='jumpscare'){
   // A low, irregular throat rather than the old high "u-aa" voice. Subharmonics,
   // non-linear folds and breath rasp give weight without increasing output gain.
   const pitch=(83+29*Math.exp(-t*5)-24*t)*(1+.055*Math.sin(TAU*19*t)+.014*noise);
   phase+=TAU*pitch/rate;
   let throat=0;
   for(let h=1;h<=24;h++){
    const f=pitch*h;
    if(f>=rate*.45)break;
    const formant=.45+1.4*Math.exp(-(((f-360)/160)**2))+.65*Math.exp(-(((f-1150)/400)**2));
    throat+=Math.sin(phase*h)*formant/Math.pow(h,1.1);
   }
   const folds=Math.tanh(throat*2.4)*(.67+.18*Math.sin(phase*.5));
   const rasp=(mid-low)*(.24+.14*Math.sin(TAU*31*t)**2);
   const body=Math.sin(phase*.5)*.24+Math.sin(TAU*58*t)*Math.exp(-t*12)*.14;
   const envelope=clamp(t/.012,0,1)*clamp((duration-t)/.15,0,1);
   data[i]=envelope*(folds+body+rasp);
  }else if(kind==='door-slide'){
   // Wooden panel friction, uneven rail chatter and a soft latch at the end.
   const glide=clamp(t/.035,0,1)*clamp((.60-t)/.09,0,1);
   const rail=.52+.48*Math.sin(TAU*(23*t+14*t*t))**8;
   const creak=Math.sin(TAU*(155*t+19*t*t))*.12;
   const latch=t>=.56?Math.exp(-(t-.56)*65)*(.50*low+.32*Math.sin(TAU*82*(t-.56))):0;
   data[i]=(glide*(low*.48+(mid-low)*.50)*rail+glide*creak+latch)*clamp((duration-t)/.018,0,1);
  }else{
   // Two breathy, wavering cries behind a wall. A slow attack and low playback
   // gain make it an atmosphere cue, not a second jumpscare.
   const sob=Math.sin(Math.PI*clamp(t/.83,0,1))**1.4+.70*Math.sin(Math.PI*clamp((t-.86)/.84,0,1))**1.4;
   const pitch=480+115*Math.sin(Math.PI*clamp(t/.83,0,1))+45*Math.sin(TAU*5.6*t);
   phase+=TAU*pitch/rate;
   let voice=0;
   for(let h=1;h<=8;h++){
    const f=pitch*h;
    if(f>=rate*.45)break;
    const formant=.35+Math.exp(-(((f-850)/340)**2))+.5*Math.exp(-(((f-1700)/460)**2));
    voice+=Math.sin(phase*h)*formant/Math.pow(h,1.5);
   }
   const breath=(mid-low)*.11;
   data[i]=sob*clamp(t/.065,0,1)*clamp((duration-t)/.12,0,1)*(voice*.45+breath);
  }
  peak=Math.max(peak,Math.abs(data[i]));
 }
 if(kind==='baby-cry'){
  // Short room reflections and softened upper frequencies suggest distance.
  const dry=data.slice(),early=Math.round(rate*.071),late=Math.round(rate*.137);
  const soften=1-Math.exp(-TAU*1900/rate);let softened=0;peak=0;
  for(let i=0;i<data.length;i++){
   const reflected=dry[i]+(i>=early?dry[i-early]*.22:0)+(i>=late?dry[i-late]*.12:0);
   softened+=soften*(reflected-softened);
   data[i]=softened*clamp((duration-i/rate)/.12,0,1);peak=Math.max(peak,Math.abs(data[i]));
  }
 }
 const limit=kind==='footstep'?.70:kind==='jumpscare'?.85:kind==='baby-cry'?.60:.65;
 if(peak)for(let i=0;i<data.length;i++)data[i]*=limit/peak;
 return data;
}
