import {rabbitImageSize} from './rabbit-appearance.js';
import {ARRIVAL,rabbitArrival} from './rabbit-arrival.js';
export {ARRIVAL};

export const ATTACKER_ASSETS=Object.freeze({
  normal:'./assets/schoolgirl-mask-stained.png',
  attack:'./assets/schoolgirl-mask-stained-attack.png'
});

// Photo cutouts stay at their original aspect ratio. No rabbit-specific masks,
// blood paint or stretched body parts are applied to the human character.
export function attackerImagesReady(source){
  return Boolean(rabbitImageSize(source?.schoolgirl)&&rabbitImageSize(source?.schoolgirlAttack));
}
export function attackerImage(source,attack=false){
  const image=attack?source?.schoolgirlAttack:source?.schoolgirl;
  return rabbitImageSize(image)?image:null;
}
export function attackerArrival(elapsed,reduced=false){
  const arrival=rabbitArrival(elapsed,reduced);
  return {...arrival,attack:arrival.teeth,growth:1+.08*arrival.rush,centerY:.925-.18*arrival.rush};
}
export function attackerSize(image,growth=1){
  const dimensions=rabbitImageSize(image),height=1.85*growth;
  return {width:height*(dimensions?dimensions.width/dimensions.height:2/3),height};
}
export function attackerPosition(player,arrival,spot={x:0,z:6.8}){
  const pitch=player.manualLook?Math.tan(player.pitch||0):0;
  return {x:spot.x*(1-arrival.rush)+(player.x+Math.sin(player.angle)*.80)*arrival.rush,
    z:spot.z*(1-arrival.rush)+(player.z+Math.cos(player.angle)*.80)*arrival.rush,
    y:arrival.centerY+pitch*.80*arrival.rush};
}
export function attackerProjection(player,arrival,image,width,height){
  const position=attackerPosition(player,arrival),dx=position.x-player.x,dz=position.z-player.z;
  const distance=Math.max(.08,dx*Math.sin(player.angle)+dz*Math.cos(player.angle)),lens=width*.68;
  const size=attackerSize(image,arrival.growth),pitch=player.manualLook?Math.tan(player.pitch||0):0;
  return {x:width/2+(dx*Math.cos(player.angle)-dz*Math.sin(player.angle))*lens/distance,
    y:height*.48+pitch*lens+(1.5-position.y)*lens/distance,
    width:size.width*lens/distance,height:size.height*lens/distance};
}
