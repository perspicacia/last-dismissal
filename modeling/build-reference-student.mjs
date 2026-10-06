import {writeFile} from 'node:fs/promises';
import {deflateSync} from 'node:zlib';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {pngPixels} from '../tests/png-pixels.js';
import {createReferenceStudent} from './reference-student.mjs';
function crc(b){let c=0xffffffff;for(const v of b){c^=v;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function chunk(t,d){const n=Buffer.from(t),o=Buffer.alloc(d.length+12);o.writeUInt32BE(d.length);n.copy(o,4);d.copy(o,8);o.writeUInt32BE(crc(Buffer.concat([n,d])),d.length+8);return o;}
function png(w,h,p){const header=Buffer.alloc(13);header.writeUInt32BE(w);header.writeUInt32BE(h,4);header[8]=8;header[9]=6;const rows=Buffer.alloc((w*4+1)*h);for(let y=0;y<h;y++)Buffer.from(p.buffer,p.byteOffset+y*w*4,w*4).copy(rows,y*(w*4+1)+1);return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);}
globalThis.ImageData=class{constructor(data,width,height){Object.assign(this,{data,width,height});}};
globalThis.document={createElement(){return {width:1,height:1,getContext(){return {putImageData:image=>{this.image=image;},translate(){},scale(){}};},toBlob(cb,type){cb(new Blob([png(this.width,this.height,this.image.data)],{type}));}};}};
globalThis.FileReader=class{readAsArrayBuffer(b){b.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
const model=createReferenceStudent(pngPixels(new URL('../assets/doll-student-concept.png',import.meta.url)));
const binary=await new GLTFExporter().parseAsync(model,{binary:true,animations:model.animations});
await writeFile(new URL('../assets/models/student-reference-rig.glb',import.meta.url),new Uint8Array(binary));
console.log(JSON.stringify({bytes:binary.byteLength,clips:model.animations.map(c=>c.name),bones:17,source:'preserved doll-student-concept.png',status:'review candidate; sides/back approximate'}));
