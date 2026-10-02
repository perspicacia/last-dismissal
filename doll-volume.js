import * as THREE from './vendor/three.module.js';
// Preserve photo X/Y and UV proportions. A gently rounded front and separate
// underside meet at a thin seam; neither surface forms an extruded side wall.
// Nominal half-thickness in metres for the 1.55 m doll; shared by both surfaces.
export function dollDepth(u,v){
  const ellipsoid=(x,y,rx,ry,r)=>r*Math.sqrt(Math.max(0,1-((u-x)/rx)**2-((v-y)/ry)**2));
  const cheek=Math.max(0,.34-u,u-.69)/.22;
  const head=.025+.095*Math.sqrt(Math.max(0,1-cheek*cheek));
  const body=.014+Math.max(
    ellipsoid(.52,.41,.23,.16,.088),
    ellipsoid(.52,.61,.27,.18,.078),
    ellipsoid(.31,.57,.085,.16,.059),
    ellipsoid(.72,.57,.085,.16,.059),
    ellipsoid(.46,.82,.08,.19,.066),
    ellipsoid(.60,.82,.08,.19,.066)
  );
  if(v<=.32)return head;
  if(v>=.40)return body;
  const t=(v-.32)/.08,blend=t*t*(3-2*t);
  return head*(1-blend)+body*blend;
}
// Row-averaged opaque colours provide a smooth, separate underside material.
// Sampling each X coordinate repeats hair strands and cloth folds vertically
// down the side even when the front photograph is perfectly planar. The back
// must not carry those front details. Transparent pixels never add black.
function undersideColours(pixels,width,height){
  const stride=width+1,size=stride*(height+1),sums=Array.from({length:4},()=>new Float64Array(size));
  for(let y=1;y<=height;y++)for(let x=1;x<=width;x++){
    const i=y*stride+x,p=((y-1)*width+x-1)*4,alpha=pixels[p+3]/255;
    for(let c=0;c<4;c++)sums[c][i]=sums[c][i-1]+sums[c][i-stride]-sums[c][i-stride-1]+(c===3?alpha:pixels[p+c]*alpha);
  }
  const radius=Math.max(2,Math.round(height*.04));
  return (x,y)=>{
    const x0=0,y0=Math.max(0,y-radius),x1=width,y1=Math.min(height,y+radius+1);
    const rect=c=>sums[c][y1*stride+x1]-sums[c][y0*stride+x1]-sums[c][y1*stride+x0]+sums[c][y0*stride+x0];
    const alpha=rect(3),color=new THREE.Color();
    return alpha?color.setRGB(rect(0)/alpha/255,rect(1)/alpha/255,rect(2)/alpha/255,THREE.SRGBColorSpace):color.set('#4b4540');
  };
}
export function buildDollVolume(pixels,width,height,worldHeight=1.55,columns=192,rows=288){
  const positions=[],uvs=[],colors=[],front=[],sides=[],active=[];const stride=columns+1,count=stride*(rows+1),worldWidth=worldHeight*width/height;
  const sample=(u,v)=>{const x=Math.min(width-1,Math.max(0,Math.round(u*(width-1)))),y=Math.min(height-1,Math.max(0,Math.round(v*(height-1))));return (y*width+x)*4;};
  for(let y=0;y<rows;y++)for(let x=0;x<columns;x++)active[y*columns+x]=pixels[sample((x+.5)/columns,(y+.5)/rows)+3]>=140;
  // Tiny transparent gaps between photographed hair strands must not become
  // channels through a thick 3D head. Close those gaps for geometry only;
  // material 0 still samples the untouched PNG alpha at full resolution.
  const radius=Math.max(1,Math.round(columns*.02));
  const filter=(input,dilate)=>{
    const output=new Uint8Array(columns*rows);
    for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){
      let value=dilate?0:1;
      outer:for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){
        const xx=x+dx,yy=y+dy,v=xx>=0&&xx<columns&&yy>=0&&yy<rows&&input[yy*columns+xx];
        if(dilate?v:!v){value=dilate?1:0;break outer;}
      }
      output[y*columns+x]=value;
    }
    return output;
  };
  const closed=filter(filter(active,true),false);
  for(let y=0;y<Math.floor(rows*.29);y++)for(let x=0;x<columns;x++)active[y*columns+x]=closed[y*columns+x]||active[y*columns+x];
  const cell=(x,y)=>x>=0&&x<columns&&y>=0&&y<rows&&active[y*columns+x];
  const distances=new Float32Array(count);
  for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++)distances[y*stride+x]=cell(x-1,y-1)&&cell(x,y-1)&&cell(x-1,y)&&cell(x,y)?1000:0;
  const stepX=worldWidth/columns,stepY=worldHeight/rows;
  for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++){const i=y*stride+x;if(x)distances[i]=Math.min(distances[i],distances[i-1]+stepX);if(y)distances[i]=Math.min(distances[i],distances[i-stride]+stepY);}
  for(let y=rows;y>=0;y--)for(let x=columns;x>=0;x--){const i=y*stride+x;if(x<columns)distances[i]=Math.min(distances[i],distances[i+1]+stepX);if(y<rows)distances[i]=Math.min(distances[i],distances[i+stride]+stepY);}
  const scale=worldHeight/1.55,frontZ=-.14*scale,seam=.002*scale,blurred=undersideColours(pixels,width,height);
  const underside=new Float32Array(count),surface=new Float32Array(count),vertexColours=[];
  for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++){
    const u=x/columns,v=y/rows,i=y*stride+x;
    const rounding=Math.sin(Math.min(1,distances[i]/(.14*scale))*Math.PI/2);
    const depth=Math.min(.14,2*dollDepth(u,v))*scale;
    const thickness=seam+(depth-seam)*rounding,mid=frontZ/2;
    surface[i]=mid-thickness/2;underside[i]=mid+thickness/2;
    const color=blurred(Math.round(u*(width-1)),Math.round(v*(height-1)));
    vertexColours.push(color.r,color.g,color.b);
  }
  for(let back=0;back<2;back++)for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++){
    const u=x/columns,v=y/rows,i=y*stride+x;
    positions.push((u-.5)*worldWidth,(.5-v)*worldHeight,back?underside[i]:surface[i]);
    uvs.push(u,1-v);colors.push(vertexColours[i*3],vertexColours[i*3+1],vertexColours[i*3+2]);
  }
  const edge=(a,b)=>sides.push(a,b+count,b,a,a+count,b+count);
  for(let y=0;y<rows;y++)for(let x=0;x<columns;x++)if(cell(x,y)){
    const a=y*stride+x,b=a+1,c=a+stride,d=c+1;
    front.push(a,b,c,b,d,c);
    sides.push(a+count,c+count,b+count,b+count,c+count,d+count);
    if(!cell(x,y-1))edge(a,b);if(!cell(x+1,y))edge(b,d);if(!cell(x,y+1))edge(d,c);if(!cell(x-1,y))edge(c,a);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex([...front,...sides]);geometry.addGroup(0,front.length,0);geometry.addGroup(front.length,sides.length,1);geometry.computeVertexNormals();
  geometry.computeBoundingBox();return geometry;
}
export function volumeFromImage(image){
  // naturalWidth can become available before the PNG has finished decoding.
  // Latching its empty/partial alpha mask makes the broken geometry permanent.
  if(!image?.naturalWidth||!image?.naturalHeight||image.complete===false)return null;
  const canvas=document.createElement('canvas');canvas.height=432;canvas.width=Math.max(1,Math.round(canvas.height*image.naturalWidth/image.naturalHeight));const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,canvas.width,canvas.height);
  const geometry=buildDollVolume(ctx.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height);
  if(!geometry.index.count){geometry.dispose();return null;}return geometry;
}
