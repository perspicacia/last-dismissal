import {STAIR_SOUND_DURATION,stairHauntSamples} from './stair-haunt-sound.js?v=stair-haunt-1';
import {catVoiceSamples} from './cat-voice.js?v=cat-polish-2';
// Original deterministic synthesis. Every effect shares the player's master gain.
export const EFFECT_DURATIONS={footstep:.24,jumpscare:.85,'door-slide':1.05,'baby-cry':1.7,'ghost-laugh':1.85,'cat-meow':1.55,'stair-haunt':STAIR_SOUND_DURATION};
const TAU=2*Math.PI;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
export function effectSamples(kind,rate=44100,variant=0){
 const duration=EFFECT_DURATIONS[kind];
 if(!duration)throw new RangeError('Unknown sound effect');
 if(!Number.isFinite(rate)||rate<4000)throw new RangeError('Unsupported sample rate');
 if(kind==='stair-haunt')return stairHauntSamples(rate);
 if(kind==='cat-meow')return catVoiceSamples(rate,variant);
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
   // A sliding wooden panel that binds against a rusty rail: friction continues
   // under several uneven, voiced squeals before the runner clicks into place.
   const glide=clamp(t/.075,0,1)*clamp((.97-t)/.16,0,1);
   const stick=.36+.64*Math.sin(TAU*(3.2*t+2.4*t*t))**4;
   const speed=1+.07*Math.sin(TAU*17*t)+.025*Math.sin(TAU*41*t);
   phase+=TAU*(590+160*Math.sin(TAU*.85*t)+80*t)*speed/rate;
   const squeal=Math.sin(phase)*.27+Math.sin(phase*2.01)*.11+Math.sin(phase*3.03)*.045;
   const chatter=(mid-low)*(.17+.17*Math.sin(TAU*(36*t+9*t*t))**10);
   const friction=low*(.55+.12*Math.sin(TAU*11*t));
   const latchT=t-.93;
   const latch=latchT>=0?Math.exp(-latchT*58)*(.25*noise+.22*Math.sin(TAU*135*latchT)+.13*Math.sin(TAU*2150*latchT)*Math.exp(-latchT*45)):0;
   data[i]=(glide*(friction+chatter+squeal*stick)+latch)*clamp((duration-t)/.025,0,1);
  }else if(kind==='ghost-laugh'){
   // Breath-led "hu, hu ... ha, ha, ha" with a woman's lower register and vowel
   // formants. Irregular phrasing and a fading room echo avoid a toy-like giggle.
   const syllables=[[.04,.28,.72],[.39,.25,.8],[.76,.25,1],[1.06,.24,.86],[1.34,.27,.58]];
   let voiced=0,exhale=0,vowel=0;
   for(let s=0;s<syllables.length;s++){
    const [start,length,level]=syllables[s],u=(t-start)/length;
    if(u<0||u>1)continue;
    voiced=Math.sin(Math.PI*clamp((u-.13)/.87,0,1))**1.5*level;
    exhale=Math.sin(Math.PI*u)**.8*level;
    vowel=s<2?0:1;
   }
   const pitch=238-35*t+24*Math.sin(TAU*2.6*t)+6*Math.sin(TAU*6.7*t)+noise*1.4;
   phase+=TAU*pitch/rate;
   let voice=0;
   for(let h=1;h<=20;h++){
    const f=pitch*h;if(f>=rate*.45)break;
    const first=500+320*vowel,second=1150+340*vowel;
    const formant=.15+1.7*Math.exp(-(((f-first)/180)**2))+.9*Math.exp(-(((f-second)/260)**2))+.28*Math.exp(-(((f-2750)/380)**2));
    voice+=Math.sin(phase*h)*formant/Math.pow(h,1.12);
   }
   const folds=Math.tanh(voice*1.35)*(.78+.12*Math.sin(phase*.5));
   const breath=(mid-low)*.23+low*.04;
   data[i]=(voiced*folds*.72+exhale*breath)*clamp((duration-t)/.15,0,1);
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
 if(kind==='baby-cry'||kind==='ghost-laugh'){
  // Short room reflections and softened upper frequencies suggest distance.
  const ghost=kind==='ghost-laugh',dry=data.slice(),early=Math.round(rate*(ghost?.095:.071)),late=Math.round(rate*(ghost?.187:.137));
  const soften=1-Math.exp(-TAU*(ghost?2900:1900)/rate);let softened=0;peak=0;
  for(let i=0;i<data.length;i++){
   const reflected=dry[i]+(i>=early?dry[i-early]*.22:0)+(i>=late?dry[i-late]*.12:0);
   softened+=soften*(reflected-softened);
   data[i]=softened*clamp((duration-i/rate)/.12,0,1);peak=Math.max(peak,Math.abs(data[i]));
  }
 }
 const limit=kind==='footstep'?.70:kind==='jumpscare'?.85:kind==='baby-cry'?.60:kind==='ghost-laugh'?.62:kind==='cat-meow'?.55:.65;
 if(peak)for(let i=0;i<data.length;i++)data[i]*=limit/peak;
 return data;
}
