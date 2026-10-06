// Stain both original expressions without regenerating the adopted character.
const skins=new WeakMap();
export function rabbitImageSize(image){
  if(!image||image.complete===false)return null;
  const width=image.naturalWidth??image.width,height=image.naturalHeight??image.height;
  return width>0&&height>0?{width,height}:null;
}

export function stainRabbitPixels(pixels,pigment){
  // Multiplicative colour keeps the photograph's fur detail and exact alpha.
  for(let i=0;i<pixels.length;i+=4){
    if(!pixels[i+3]||!pigment[i+3])continue;
    const grain=.78+.22*((Math.imul(i/4+17,1103515245)>>>8)&255)/255;
    const opacity=pigment[i+3]/255*grain;
    for(let channel=0;channel<3;channel++)pixels[i+channel]*=1-opacity+opacity*pigment[i+channel]/255;
  }
  return pixels;
}

function paintStains(ctx){
  let seed=3817;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const smear=(x,y,rx,ry,angle=0)=>{
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(rx,ry);ctx.beginPath();
    for(let i=0;i<=48;i++){const a=i*Math.PI/24,r=.84+random()*.23;const px=Math.cos(a)*r,py=Math.sin(a)*r;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}
    ctx.closePath();ctx.clip();
    const gradient=ctx.createRadialGradient(-.1,-.1,0,0,0,1.08);
    gradient.addColorStop(0,'rgba(163,9,14,.97)');gradient.addColorStop(.48,'rgba(98,9,14,.92)');gradient.addColorStop(.74,'rgba(115,10,14,.64)');gradient.addColorStop(1,'rgba(108,8,12,0)');
    ctx.fillStyle=gradient;ctx.fillRect(-1.1,-1.1,2.2,2.2);
    // Thin rubbed streaks break up the edge, like pigment caught in the nap.
    for(let i=0;i<28;i++){const px=random()*1.7-.85,py=random()*1.5-.75;ctx.strokeStyle='rgba(114,9,14,.18)';ctx.lineWidth=.012+random()*.028;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+.04,py+.12+random()*.26);ctx.stroke();}
    ctx.restore();
  };
  // Forehead and cheek smears leave the eyes, nose and tooth silhouettes clear.
  for(const p of [[.363,.313,.076,.035,-.6],[.321,.353,.031,.042,.1],[.482,.278,.032,.041,-.35],[.553,.313,.065,.037,.45],[.679,.341,.039,.047,.18],[.325,.427,.039,.03,-.4],[.686,.432,.038,.026,.45],[.605,.487,.057,.012,-.14]])smear(...p);
  for(const [x,y,end,width] of [[.325,.367,.445,.008],[.345,.434,.477,.006],[.538,.324,.376,.008],[.697,.356,.435,.009],[.685,.443,.487,.005],[.589,.488,.509,.004]]){
    ctx.strokeStyle='rgba(137,8,13,.86)';ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+.008,y+.015,x-.006,end-.008,x-.003,end);ctx.stroke();
    smear(x-.003,end,width*.72,width*1.2);
  }
  for(let i=0;i<130;i++){
    const x=.27+random()*.46,y=.27+random()*.24;
    if(((x-.397)/.056)**2+((y-.376)/.04)**2<1.2||((x-.618)/.056)**2+((y-.377)/.04)**2<1.2)continue;
    if(y>.43&&y<.50&&x>.37&&x<.65)continue;
    ctx.fillStyle=i%3?'rgba(115,7,12,.83)':'rgba(178,16,19,.72)';ctx.beginPath();ctx.ellipse(x,y,.001+random()*.0026,.001+random()*.0036,random()*3,0,Math.PI*2);ctx.fill();
  }
}

export function bloodiedRabbit(image){
  const size=rabbitImageSize(image);if(!size)return image;
  if(skins.has(image))return skins.get(image);
  const canvas=document.createElement('canvas');Object.assign(canvas,size);
  const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
  const original=ctx.getImageData(0,0,size.width,size.height);
  const mask=document.createElement('canvas');Object.assign(mask,size);const paint=mask.getContext('2d');
  paint.scale(size.width,size.height);paintStains(paint);
  stainRabbitPixels(original.data,paint.getImageData(0,0,size.width,size.height).data);
  ctx.putImageData(original,0,0);skins.set(image,canvas);return canvas;
}

export function decorateRabbitElement(element,image){
  const update=()=>{const skin=bloodiedRabbit(image);if(skin===image)return;element.src=skin.toDataURL('image/png');element.dataset.rabbitAppearance='bloodied';};
  if(rabbitImageSize(image))update();else image.addEventListener('load',update,{once:true});
}
