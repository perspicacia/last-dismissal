import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';

// Read the repository's 8-bit RGBA PNG fixtures without a browser dependency.
export function pngPixels(path){
 const file=readFileSync(path),chunks=[];let width,height;
 for(let offset=8;offset<file.length;){
  const length=file.readUInt32BE(offset),type=file.toString('ascii',offset+4,offset+8),data=file.subarray(offset+8,offset+8+length);offset+=length+12;
  if(type==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);if(data[8]!==8||data[9]!==6||data[12]!==0)throw Error('Expected non-interlaced 8-bit RGBA fixture');}
  if(type==='IDAT')chunks.push(data);
 }
 const raw=inflateSync(Buffer.concat(chunks)),pixels=new Uint8ClampedArray(width*height*4),stride=width*4;
 const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
 for(let y=0;y<height;y++){
  const filter=raw[y*(stride+1)];if(filter>4)throw Error('Unsupported PNG filter');
  for(let x=0;x<stride;x++){
   const i=y*stride+x,a=x>=4?pixels[i-4]:0,b=y?pixels[i-stride]:0,c=y&&x>=4?pixels[i-stride-4]:0;
   pixels[i]=(raw[y*(stride+1)+1+x]+[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter])&255;
  }
 }
 return {pixels,width,height};
}
export function resizePixels(source,width,height){
 const pixels=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const from=4*(Math.min(source.height-1,Math.round(y/(height-1)*(source.height-1)))*source.width+Math.min(source.width-1,Math.round(x/(width-1)*(source.width-1))));
  pixels.set(source.pixels.subarray(from,from+4),4*(y*width+x));
 }
 return pixels;
}
