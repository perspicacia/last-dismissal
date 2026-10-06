// One continuous T-shirt pattern: dropped shoulders, round collar and loose
// sleeves. A photographed front is supported by rounded fabric, not capped
// intersecting tubes that leave box corners at the shoulder seam.
import * as THREE from 'three';
export function childShirt(){
 const upper=[[0,.986],[.032,.993],[.057,1.026],[.076,1.048],[.101,1.050],[.143,1.022],[.177,.988],[.205,.934],[.237,.854],[.249,.825]];
 const lower=[[0,.635],[.08,.640],[.142,.659],[.158,.691],[.169,.790],[.188,.819],[.220,.818],[.249,.825]];
 const value=(keys,x)=>{
  let k=0;while(k<keys.length-2&&x>keys[k+1][0])k++;
  const a=keys[k],b=keys[k+1],t=THREE.MathUtils.clamp((x-a[0])/(b[0]-a[0]),0,1);
  return THREE.MathUtils.lerp(a[1],b[1],t*t*(3-2*t));
 };
 const columns=80,rows=24,points=[],indices=[],stride=columns+1,count=stride*(rows+1);
 for(const back of [false,true])for(let r=0;r<=rows;r++)for(let c=0;c<=columns;c++){
  const x=(c/columns-.5)*.494,ax=Math.abs(x),t=r/rows,bottom=value(lower,ax),top=value(upper,ax),y=THREE.MathUtils.lerp(bottom,top,t);
  const sleeve=THREE.MathUtils.smoothstep(ax,.145,.210),centre=THREE.MathUtils.lerp(.075-.07*THREE.MathUtils.smoothstep(y,.63,1.04),-.019,sleeve);
  const torso=.116*Math.sqrt(Math.max(.04,1-(x/.190)**2)),arm=.072*Math.sqrt(Math.max(.025,1-((ax-.190)/.071)**2));
  const radius=THREE.MathUtils.lerp(torso,arm,sleeve),edge=.80+.20*Math.sin(Math.PI*t);
  const fold=0;
  const z=centre+(back?1:-1)*(radius*edge+fold);
  points.push(x,y,z);
 }
 for(let r=0;r<rows;r++)for(let c=0;c<columns;c++){
  const a=r*stride+c,b=a+1,d=a+stride,e=d+1;
  indices.push(a,d,b,b,d,e,count+a,count+b,count+d,count+b,count+e,count+d);
 }
 const edge=[];for(let c=0;c<columns;c++)edge.push([c+1,c]);for(let r=0;r<rows;r++)edge.push([r*stride,(r+1)*stride]);for(let c=0;c<columns;c++)edge.push([rows*stride+c,rows*stride+c+1]);for(let r=0;r<rows;r++)edge.push([(r+1)*stride+columns,r*stride+columns]);
 for(const [a,b] of edge)indices.push(a,count+a,b,b,count+a,count+b);
 const neighbours=Array.from({length:points.length/3},()=>new Set());
 for(let i=0;i<indices.length;i+=3)for(let j=0;j<3;j++){const a=indices[i+j],b=indices[i+(j+1)%3];neighbours[a].add(b);neighbours[b].add(a);}
 for(let pass=0;pass<16;pass++){
  const previous=points.slice();for(let i=0;i<neighbours.length;i++)for(let axis=0;axis<3;axis++){
   let sum=0;for(const n of neighbours[i])sum+=previous[n*3+axis];points[i*3+axis]=previous[i*3+axis]*.75+sum/neighbours[i].size*.25;
  }
 }
 return {points,indices,region:1,details:Array(points.length/3).fill(0)};
}
