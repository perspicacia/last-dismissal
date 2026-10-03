// A short atmosphere encounter. It never participates in rabbit/visited outcomes.
export const CAT_DURATION=1.6;
const unit=random=>{const n=random();return Number.isFinite(n)?Math.max(0,Math.min(1,n)):0;};
const interval=(random,base)=>base+12*unit(random);
const scenes=new Set(['corridor','classroom31','classroom','classroom33','music','dance']);
export function newCatEvent(random=Math.random){return {scene:null,elapsed:0,nextCat:interval(random,10),nextMeow:interval(random,9),cat:null};}
export function clearCatPath(path,scene,blockers=[]){
 const half=scene==='corridor'?2.55:3.9,end=scene==='corridor'?21.2:9.25,margin=.58;
 for(let i=0;i<=16;i++){
  const u=i/16,x=path.from.x+(path.to.x-path.from.x)*u,z=path.from.z+(path.to.z-path.from.z)*u;
  if(x<-half+margin||x>half-margin||z<.55+margin||z>end-margin)return false;
  if(blockers.some(b=>Math.abs(x-b.x)<b.width/2+margin&&Math.abs(z-b.z)<b.depth/2+margin))return false;
 }
 return true;
}
export function findCatPath(player,scene,blockers=[],random=Math.random){
 if(!player||![player.x,player.z,player.angle].every(Number.isFinite)||!scenes.has(scene))return null;
 const forward={x:Math.sin(player.angle),z:Math.cos(player.angle)},right={x:Math.cos(player.angle),z:-Math.sin(player.angle)},side=unit(random)<.5?-1:1;
 // At eye height 1.5m, a cat only 1.8m away is below a level first-person
 // camera. Keep encounters ahead in view without forcing the camera down.
 for(const distance of [4.2,3.8,4.6])for(const span of [.90,.65])for(const offset of [0,-.65,.65]){
  const center={x:player.x+forward.x*distance+right.x*offset,z:player.z+forward.z*distance+right.z*offset};
  const path={from:{x:center.x-right.x*span*side,z:center.z-right.z*span*side},to:{x:center.x+right.x*span*side,z:center.z+right.z*span*side}};
  if(clearCatPath(path,scene,blockers))return path;
 }
 return null;
}
export function advanceCatEvent(state,dt,{scene,player,blockers=[],ended=false,active=true,random=Math.random}={}){
 if(ended||!scenes.has(scene))return {state:state.scene===null&&!state.cat?state:newCatEvent(random),meow:false,appeared:false};
 if(!active)return {state,meow:false,appeared:false};
 if(state.scene!==scene)return {state:{...newCatEvent(random),scene},meow:false,appeared:false};
 const step=Number.isFinite(dt)?Math.max(0,Math.min(.1,dt)):0,elapsed=state.elapsed+step;
 let cat=state.cat?{...state.cat,elapsed:state.cat.elapsed+step}:null,nextCat=state.nextCat,nextMeow=state.nextMeow,appeared=false;
 if(cat?.elapsed>=CAT_DURATION)cat=null;
 if(!cat&&elapsed+1e-9>=nextCat){
  const path=findCatPath(player,scene,blockers,random);
  if(path){cat={path,elapsed:0};appeared=true;nextCat=elapsed+interval(random,10);}
  else nextCat=elapsed+.75;
 }
 const meow=appeared||elapsed+1e-9>=nextMeow;
 if(meow)nextMeow=elapsed+interval(random,9);
 return {state:{...state,elapsed,cat,nextCat,nextMeow},meow,appeared,variant:meow?Math.min(2,Math.floor(unit(random)*3)):0};
}
export function catPose(state,reduced=false){
 if(!state?.cat||state.cat.elapsed>=CAT_DURATION)return null;
 const {path,elapsed}=state.cat,t=Math.max(0,elapsed),u=Math.min(1,t/CAT_DURATION),progress=reduced?.5:u;
 return {x:path.from.x+(path.to.x-path.from.x)*progress,z:path.from.z+(path.to.z-path.from.z)*progress,
  y:reduced?0:.24*Math.sin(Math.PI*u)**2,yaw:Math.atan2(path.to.x-path.from.x,path.to.z-path.from.z),
  gait:reduced?0:Math.sin(t*23),crouch:reduced?1:0,opacity:Math.min(1,t/.055,(CAT_DURATION-t)/.18),reduced};
}
