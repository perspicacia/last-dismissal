import * as THREE from './vendor/three.module.js';
// Closed image relief with a rounded underside and thin silhouette seam.
// Half-thickness in metres for the 1.55 m doll. The face stays on one
// plane; round shoulders, skirt and limbs provide depth without warping it.
export function dollDepth(u,v){
  const ellipsoid=(x,y,rx,ry,r)=>r*Math.sqrt(Math.max(0,1-((u-x)/rx)**2-((v-y)/ry)**2));
  if(v<.34){
    const cheek=Math.max(0,.34-u,u-.69)/.22;
    return .025+.095*Math.sqrt(Math.max(0,1-cheek*cheek));
  }
  return .014+Math.max(
    ellipsoid(.52,.41,.23,.16,.088),
    ellipsoid(.52,.61,.27,.18,.078),
    ellipsoid(.31,.57,.085,.16,.059),
    ellipsoid(.72,.57,.085,.16,.059),
    ellipsoid(.46,.82,.08,.19,.066),
    ellipsoid(.60,.82,.08,.19,.066)
  );
}
export function buildDollVolume(pixels,width,height,worldHeight=1.55,columns=192,rows=288){
  const positions=[],uvs=[],colors=[],front=[],sides=[],active=[];const stride=columns+1,count=stride*(rows+1),worldWidth=worldHeight*width/height;
  const sample=(u,v)=>{const x=Math.min(width-1,Math.max(0,Math.round(u*(width-1)))),y=Math.min(height-1,Math.max(0,Math.round(v*(height-1))));return (y*width+x)*4;};
  for(let y=0;y<rows;y++)for(let x=0;x<columns;x++)active[y*columns+x]=pixels[sample((x+.5)/columns,(y+.5)/rows)+3]>=140;
  const cell=(x,y)=>x>=0&&x<columns&&y>=0&&y<rows&&active[y*columns+x];
  // Measure distance from the actual mesh boundary, not just alpha samples.
  // Fold the back toward the front at this contour instead of extruding hair
  // and neck cutouts all the way to the floor.
  const distances=new Float32Array(count);
  for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++)distances[y*stride+x]=cell(x-1,y-1)&&cell(x,y-1)&&cell(x-1,y)&&cell(x,y)?1000:0;
  for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++){const i=y*stride+x;if(x)distances[i]=Math.min(distances[i],distances[i-1]+1);if(y)distances[i]=Math.min(distances[i],distances[i-stride]+1);}
  for(let y=rows;y>=0;y--)for(let x=columns;x>=0;x--){const i=y*stride+x;if(x<columns)distances[i]=Math.min(distances[i],distances[i+1]+1);if(y<rows)distances[i]=Math.min(distances[i],distances[i+stride]+1);}
  for(let back=0;back<2;back++)for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++){
    const u=x/columns,v=y/rows,i=sample(u,v),rounding=Math.sin(Math.min(1,distances[y*stride+x]/Math.max(3,columns/96*10))*Math.PI/2);
    const depth=2*dollDepth(u,v)*worldHeight/1.55;
    const face=u>.34&&u<.69&&v>.12&&v<.30;
    // Keep the central face flat but roll the hair contour and every body
    // contour toward the floor. A deeper model must not expose tall edge walls.
    const frontZ=face?-depth:-Math.max(.004,depth*rounding);
    const thickness=.002+Math.max(0,-frontZ-.002)*rounding;
    positions.push((u-.5)*worldWidth,(.5-v)*worldHeight,frontZ+(back?thickness:0));
    uvs.push(u,1-v);const color=new THREE.Color().setRGB(pixels[i]/255,pixels[i+1]/255,pixels[i+2]/255,THREE.SRGBColorSpace);colors.push(color.r,color.g,color.b);
  }
  const edge=(a,b)=>sides.push(a,b+count,b,a,a+count,b+count);
  for(let y=0;y<rows;y++)for(let x=0;x<columns;x++)if(cell(x,y)){
    const a=y*stride+x,b=a+1,c=a+stride,d=c+1;
    front.push(a,b,c,b,d,c);
    // The underside uses colors, so the face photo is never stretched over it.
    sides.push(a+count,c+count,b+count,b+count,c+count,d+count);
    if(!cell(x,y-1))edge(a,b);if(!cell(x+1,y))edge(b,d);if(!cell(x,y+1))edge(d,c);if(!cell(x-1,y))edge(c,a);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex([...front,...sides]);geometry.addGroup(0,front.length,0);geometry.addGroup(front.length,sides.length,1);geometry.computeVertexNormals();geometry.computeBoundingBox();return geometry;
}
export function volumeFromImage(image){
  if(!image?.naturalWidth)return null;
  const canvas=document.createElement('canvas');canvas.width=288;canvas.height=432;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,288,432);
  return buildDollVolume(ctx.getImageData(0,0,288,432).data,288,432);
}
