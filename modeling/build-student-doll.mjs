// Offline authoring command: npm run model:student. No browser or native DCC is required.
import {writeFile,mkdir} from 'node:fs/promises';
import {deflateSync} from 'node:zlib';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {createStudentDoll} from './student-doll.js';

// GLTFExporter uses browser image/blob APIs. This tiny headless adapter only
// accepts DataTextures and writes lossless RGBA PNG; it never edits source PNGs.
function crc(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function chunk(type,data){const name=Buffer.from(type),out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length);name.copy(out,4);data.copy(out,8);out.writeUInt32BE(crc(Buffer.concat([name,data])),data.length+8);return out;}
function png(width,height,data){
  const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;
  const rows=Buffer.alloc((width*4+1)*height);for(let y=0;y<height;y++)Buffer.from(data.buffer,data.byteOffset+y*width*4,width*4).copy(rows,y*(width*4+1)+1);
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);
}
globalThis.ImageData=class{constructor(data,width,height){Object.assign(this,{data,width,height});}};
globalThis.document={createElement(){return {width:1,height:1,getContext(){return {putImageData:image=>{this.image=image;}};},toBlob(callback,type){callback(new Blob([png(this.width,this.height,this.image.data)],{type}));}};}};
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
const model=createStudentDoll();
const binary=await new GLTFExporter().parseAsync(model,{binary:true,onlyVisible:true,maxTextureSize:256});
const destination=new URL('../assets/models/student-doll.glb',import.meta.url);await mkdir(new URL('.',destination),{recursive:true});
await writeFile(destination,new Uint8Array(binary));
let triangles=0,meshes=0;model.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});
console.log(`student-doll.glb: ${binary.byteLength} bytes, ${meshes} meshes, ${triangles} triangles`);
