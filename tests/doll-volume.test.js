import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDollVolume,dollDepth,volumeFromImage} from '../doll-volume.js';
test('doll volume excludes transparent backdrop, tapers edges, and has closed depth',()=>{
 const w=32,h=48,p=new Uint8ClampedArray(w*h*4);
 for(let y=5;y<43;y++)for(let x=8;x<24;x++){const i=(y*w+x)*4;p.set([180,150,110,255],i);}
 const g=buildDollVolume(p,w,h,1.55,32,48);assert.ok(g.index.count>0);assert.equal(g.groups.length,2);assert.ok(g.groups[1].count>0);
 assert.ok(g.boundingBox.min.z<-.1);assert.equal(g.boundingBox.max.z,0);
 const coords=g.getAttribute('position'),uv=g.getAttribute('uv');const used=new Set(g.index.array);
 for(const i of used){const u=uv.getX(i),v=1-uv.getY(i);assert.ok(u>=.2&&u<=.8);assert.ok(v>=.07&&v<=.93);}
 const edge=5*33+8;assert.ok(Math.abs(coords.getZ(edge))<.06);assert.ok(dollDepth(.49,.145)>dollDepth(.46,.90));
 const edges=new Map();for(let i=0;i<g.index.count;i+=3){const tri=[g.index.array[i],g.index.array[i+1],g.index.array[i+2]];for(let j=0;j<3;j++){const a=tri[j],b=tri[(j+1)%3],key=a<b?`${a},${b}`:`${b},${a}`;edges.set(key,(edges.get(key)||0)+1);}}
 assert.ok([...edges.values()].every(n=>n===2));
 assert.equal(volumeFromImage({naturalWidth:0}),null);
});
test('눈·입·턱은 동일한 깊이를 유지해 얼굴의 투영 비율이 늘어나지 않는다',()=>{
 for(const v of [.14,.20,.26,.32])assert.equal(dollDepth(.5,v),dollDepth(.5,.14));
 const w=24,h=36,p=new Uint8ClampedArray(w*h*4).fill(255),g=buildDollVolume(p,w,h,1.55,24,36),a=g.getAttribute('position');
 const face=[];for(let y=5;y<=10;y++)face.push(a.getZ(y*25+12));assert.ok(face.every(z=>z===face[0]));
});
