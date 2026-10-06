import {rabbitImageSize} from './rabbit-appearance.js?v=dark-blood-1';
export const ARRIVAL={still:.30,teeth:.55,rush:.70,end:1.50};
// Shared by 3D, Canvas and the sound trigger: elapsed seconds since discovery.
export function rabbitArrival(elapsed,reduced=false){
 const time=Number.isFinite(elapsed)?Math.max(0,elapsed):0;
 const progress=reduced?1:Math.max(0,Math.min(1,(time-ARRIVAL.still)/ARRIVAL.rush));
 const rush=1-Math.pow(1-progress,3);
 return {teeth:time>=ARRIVAL.teeth,rush,growth:1+.15*rush,centerY:1.05+.20*rush,done:time>=ARRIVAL.end};
}
export function rabbitSize(image,growth=1){
 const size=rabbitImageSize(image),ratio=size?size.width/size.height:2/3;
 const height=2.1*growth;return {width:height*ratio,height};
}
