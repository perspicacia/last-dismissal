export const CAT_STRIDE=.36;
export const CAT_STANCE=.62;
const TAU=2*Math.PI;
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};

// Distance, rather than wall-clock time, drives feet: a supporting paw travels
// backwards at the same speed that the body travels forwards.
export function catLimbPose(pose,side,front){
 const hip={x:side*(front?.071:.082),y:front?.255:.25,z:front?.175:-.187};
 const offset=(side<0)===front?0:.5;
 const cycle=(pose.cycle??0)+offset,phase=cycle-Math.floor(cycle),weight=pose.motion??0;
 const reach=CAT_STRIDE*CAT_STANCE/2;
 let z,lift=0;
 if(phase<CAT_STANCE)z=reach-CAT_STRIDE*phase;
 else {const u=(phase-CAT_STANCE)/(1-CAT_STANCE);z=-reach+2*reach*smooth(u);lift=.057*Math.sin(Math.PI*u)**1.4;}
 const paw={x:hip.x,y:.023-(pose.y||0)+lift*weight,z:hip.z+z*weight};
 const dy=paw.y-hip.y,dz=paw.z-hip.z,d=Math.hypot(dy,dz);
 const upper=front?.142:.16,lower=front?.144:.15;
 const a=(upper*upper-lower*lower+d*d)/(2*d),height=Math.sqrt(Math.max(0,upper*upper-a*a));
 const uy=dy/d,uz=dz/d,bend=front?1:-1;
 const knee={x:hip.x,y:hip.y+uy*a-uz*height*bend,z:hip.z+uz*a+uy*height*bend};
 return {hip,knee,paw,contact:phase<CAT_STANCE||weight===0,phase};
}
export function catBodyMotion(cycle,motion){
 return {height:.008*motion+.0035*motion*Math.cos(cycle*TAU*2),pitch:.025*motion*Math.sin(cycle*TAU),head:.008*motion*Math.sin(cycle*TAU+.4)};
}
