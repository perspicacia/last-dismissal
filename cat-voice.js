const TAU=2*Math.PI,clamp=x=>Math.max(0,Math.min(1,x));
export const CAT_VOICE_DURATION=1.55;
export function catVoiceSamples(rate,variant=0){
 if(!Number.isFinite(rate)||rate<4000)throw new RangeError('Unsupported sample rate');
 variant=Math.max(0,Math.min(2,Math.floor(Number.isFinite(variant)?variant:0)));
 const data=new Float32Array(Math.ceil(rate*CAT_VOICE_DURATION));let seed=14837+variant*7919,low=0,high=0,phase=0;
 const lowAlpha=1-Math.exp(-TAU*750/rate),highAlpha=1-Math.exp(-TAU*Math.min(4800,rate*.40)/rate);
 for(let i=0;i<data.length;i++){
  const t=i/rate;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/2147483648-1;
  low+=lowAlpha*(noise-low);high+=highAlpha*(noise-high);const rasp=high-low;
  // Breath/teeth friction opens the call; the voiced part tears upward then
  // breaks into a falling yowl, with irregular folds rather than a soft vowel.
  const hiss=clamp(t/.016)*clamp((.32-t)/.14);
  const u=clamp((t-.17)/1.14),pitch=(510+370*Math.sin(Math.PI*u)**.65-125*u+variant*39)*(1+.035*Math.sin(TAU*(16+variant*2)*t)+.016*noise);
  phase+=TAU*pitch/rate;let voice=0;
  for(let h=1;h<=12;h++){
   const f=pitch*h;if(f>rate*.44)break;
   const formant=.18+1.25*Math.exp(-(((f-(1200-360*u))/310)**2))+.75*Math.exp(-(((f-(2900-510*u))/500)**2));
   voice+=Math.sin(phase*h+.05*Math.sin(phase*.5))*formant/Math.pow(h,.86);
  }
  const envelope=u>0&&u<1?clamp((t-.17)/.026)*Math.sin(Math.PI*u)**.65*(.76+.24*Math.sin(TAU*29*t)**2):0;
  const folds=Math.tanh(voice*2.4)*(.81+.19*Math.sin(phase*.5));
  const crack=.055*Math.sin(phase*.47)*(1+.5*Math.sin(TAU*43*t));
  data[i]=(hiss*rasp*.78+envelope*(folds*.62+rasp*.25+crack))*clamp((CAT_VOICE_DURATION-t)/.12);
 }
 const dry=data.slice(),early=Math.round(rate*.047),late=Math.round(rate*.103);let peak=0;
 for(let i=0;i<data.length;i++){data[i]=(dry[i]+(i>=early?dry[i-early]*.13:0)+(i>=late?dry[i-late]*.07:0))*clamp((CAT_VOICE_DURATION-i/rate)/.12);peak=Math.max(peak,Math.abs(data[i]));}
 if(peak)for(let i=0;i<data.length;i++)data[i]*=.55/peak;
 return data;
}
