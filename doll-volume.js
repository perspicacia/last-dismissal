import * as THREE from './vendor/three.module.js';
// A planar photograph over a separate rounded, vertex-coloured underside.
// The photograph must never follow a depth map: that stretches the hair and
// neck into vertical strips when the lying doll is viewed from the side.
// Half-thickness in metres for the 1.55 m doll, used only on the underside.
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
// Blurred opaque-pixel colours keep the underside from repeating small photo
// details as stripes, and transparent black pixels cannot darken its contour.
function undersideColours(pixels,width,height){
  const stride=width+1,size=stride*(height+1),sums=Array.from({length:4},()=>new Float64Array(size));
  for(let y=1;y<=height;y++)for(let x=1;x<=width;x++){
    const i=y*stride+x,p=((y-1)*width+x-1)*4,alpha=pixels[p+3]/255;
    for(let c=0;c<4;c++)sums[c][i]=sums[c][i-1]+sums[c][i-stride]-sums[c][i-stride-1]+(c===3?alpha:pixels[p+c]*alpha);
  }
  const radius=Math.max(2,Math.round(width*.04));
  return (x,y)=>{
    const x0=Math.max(0,x-radius),y0=Math.max(0,y-radius),x1=Math.min(width,x+radius+1),y1=Math.min(height,y+radius+1);
    const rect=c=>sums[c][y1*stride+x1]-sums[c][y0*stride+x1]-sums[c][y1*stride+x0]+sums[c][y0*stride+x0];
    const alpha=rect(3),color=new THREE.Color();
    return alpha?color.setRGB(rect(0)/alpha/255,rect(1)/alpha/255,rect(2)/alpha/255,THREE.SRGBColorSpace):color.set('#4b4540');
  };
}
export function buildDollVolume(pixels,width,height,worldHeight=1.55,columns=192,rows=288){
  const positions=[],uvs=[],colors=[],front=[],sides=[],active=[];const stride=columns+1,count=stride*(rows+1),worldWidth=worldHeight*width/height;
  const sample=(u,v)=>{const x=Math.min(width-1,Math.max(0,Math.round(u*(width-1)))),y=Math.min(height-1,Math.max(0,Math.round(v*(height-1))));return (y*width+x)*4;};
  for(let y=0;y<rows;y++)for(let x=0;x<columns;x++)active[y*columns+x]=pixels[sample((x+.5)/columns,(y+.5)/rows)+3]>=140;
  const cell=(x,y)=>x>=0&&x<columns&&y>=0&&y<rows&&active[y*columns+x];
  const distances=new Float32Array(count);
  for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++)distances[y*stride+x]=cell(x-1,y-1)&&cell(x,y-1)&&cell(x-1,y)&&cell(x,y)?1000:0;
  const stepX=worldWidth/columns,stepY=worldHeight/rows;
  for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++){const i=y*stride+x;if(x)distances[i]=Math.min(distances[i],distances[i-1]+stepX);if(y)distances[i]=Math.min(distances[i],distances[i-stride]+stepY);}
  for(let y=rows;y>=0;y--)for(let x=columns;x>=0;x--){const i=y*stride+x;if(x<columns)distances[i]=Math.min(distances[i],distances[i+1]+stepX);if(y<rows)distances[i]=Math.min(distances[i],distances[i+stride]+stepY);}
  const scale=worldHeight/1.55,frontZ=-.18*scale,seam=.002*scale,blurred=undersideColours(pixels,width,height);
  const underside=new Float32Array(count),vertexColours=[];
  for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++){
    const u=x/columns,v=y/rows,i=y*stride+x;
    const rounding=Math.sin(Math.min(1,distances[i]/(.085*scale))*Math.PI/2);
    const depth=Math.min(.18,2*dollDepth(u,v))*scale;
    underside[i]=frontZ+seam+(depth-seam)*rounding;
    const color=blurred(Math.round(u*(width-1)),Math.round(v*(height-1)));
    vertexColours.push(color.r,color.g,color.b);
  }
  for(let back=0;back<2;back++)for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++){
    const u=x/columns,v=y/rows,i=y*stride+x;
    // Every point using material 0 has exactly the same depth. There is no
    // depth gradient anywhere under the face, hair, neck, skirt or hands.
    positions.push((u-.5)*worldWidth,(.5-v)*worldHeight,back?underside[i]:frontZ);
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
  // Shared contour vertices otherwise average the underside normal into the
  // photo normal, making a perfectly planar face look bent under room lights.
  const normals=geometry.getAttribute('normal');for(let i=0;i<count;i++)normals.setXYZ(i,0,0,-1);
  geometry.computeBoundingBox();return geometry;
}
export function volumeFromImage(image){
  if(!image?.naturalWidth||!image?.naturalHeight)return null;
  const canvas=document.createElement('canvas');canvas.height=432;canvas.width=Math.max(1,Math.round(canvas.height*image.naturalWidth/image.naturalHeight));const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,canvas.width,canvas.height);
  return buildDollVolume(ctx.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height);
}
