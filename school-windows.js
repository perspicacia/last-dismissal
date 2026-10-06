import * as THREE from './vendor/three.module.js';
import {surfaceMaterial} from './school-surfaces.js?v=quality-2';

// Reference: warm wooden sliding sashes with a small transom above a tall pane.
export const SCHOOL_WINDOW=Object.freeze({sill:.82,top:2.83,transom:2.34,rail:.075,wallX:-4.4});
export const CLASSROOM_WINDOWS=Object.freeze(Array.from({length:5},(_,i)=>({start:1.8+i*1.45,end:Math.min(1.8+(i+1)*1.45,8.9)})));
export function windowPanes({start,end}){
 const middle=(start+end)/2,r=SCHOOL_WINDOW.rail/2;
 return [[start+r,middle-r],[middle+r,end-r]].flatMap(([a,b])=>[
  {start:a,end:b,bottom:SCHOOL_WINDOW.sill+r,top:SCHOOL_WINDOW.transom-r},
  {start:a,end:b,bottom:SCHOOL_WINDOW.transom+r,top:SCHOOL_WINDOW.top-r},
 ]);
}
export function lowerPaneCenter(index,side=1){const panes=windowPanes(CLASSROOM_WINDOWS[index]);const pane=panes[side?2:0];return (pane.start+pane.end)/2;}
export function windowWood(){
 return surfaceMaterial('wood',{color:'#d8ae76'});
}
function block(g,name,x,y,z,w,h,d,material){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.name=name;m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
export function buildSchoolWindow(parent,{x=SCHOOL_WINDOW.wallX,start,end,wood=windowWood()}={}){
 const g=new THREE.Group();g.name='wooden-classroom-window';g.userData={start,end,panes:windowPanes({start,end})};parent.add(g);
 const {sill,top,transom,rail}=SCHOOL_WINDOW,middle=(start+end)/2,center=(sill+top)/2,height=top-sill;
 const edge=new THREE.MeshStandardMaterial({color:'#644021',roughness:.82}),metal=new THREE.MeshStandardMaterial({color:'#69675c',metalness:.7,roughness:.5});
 const glass=new THREE.MeshStandardMaterial({color:'#8eafb4',transparent:true,opacity:.045,roughness:.15,depthWrite:false});
 for(const z of [start,end])block(g,'window-outer-stile',x+.015,center,z,.24,height+.09,rail+.025,wood);
 for(const y of [sill,top])block(g,'window-outer-rail',x+.015,y,middle,.24,rail+.025,end-start+.10,wood);
 block(g,'window-transom-rail',x+.025,transom,middle,.22,rail,end-start,wood);
 block(g,'window-meeting-stile',x+.055,center,middle,.18,height,rail,wood);
 // One sash sits slightly behind the other; thin recessed metal handles face in.
 for(const side of [-1,1]){
  const a=side<0?start:middle,b=side<0?middle:end,sx=x+(side<0?.06:.02);
  for(const y of [sill+.09,top-.08])block(g,'sliding-window-track',sx+.06,y,(a+b)/2,.025,.022,b-a-.10,edge);
  const hz=middle+side*.115;
  block(g,'window-handle',sx+.08,1.44,hz,.025,.18,.035,metal);
  block(g,'window-handle-inset',sx+.096,1.44,hz,.009,.125,.012,edge);
 }
 for(const pane of g.userData.panes){const m=block(g,'window-pane',x,(pane.bottom+pane.top)/2,(pane.start+pane.end)/2,.012,pane.top-pane.bottom,pane.end-pane.start,glass);m.castShadow=false;}
 block(g,'wooden-window-sill',x+.12,sill-.055,middle,.46,.075,end-start+.20,wood);
 block(g,'sill-front-shadow',x+.348,sill-.10,middle,.016,.026,end-start+.18,edge);
 return g;
}
