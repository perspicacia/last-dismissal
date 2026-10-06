// Adapt the reference's pools of warm light to the existing school at night.
export const SCHOOL_TONE=Object.freeze({
  filter:'saturate(.78)',
  sky:'#081319',fog:'#111f25',fogDensity:.016,
  ambientSky:'#94a9ae',ambientGround:'#29363a',moon:'#91a5ae',
  lamp:'#ead0a7',lampEmission:'#edc493',lampRange:9,
  plaster:'#a3aaa5',plasterTint:'#cdd0c8',panel:'#304848',trim:'#929d94',frame:'#3b514c',
  canvasCeilingTop:'#131f25',canvasCeilingBottom:'#45504d',
});

export function applySchoolTone(canvas){
  canvas.style.filter=SCHOOL_TONE.filter;
  canvas.dataset.schoolTone='shadow-corridor';
}

// Static grime only; cosmetic texture generation must not consume game RNG.
export function paintDampWall(ctx,width,height){
  ctx.save();
  for(let i=0;i<18;i++){
    const x=((i*83+19)%257)/257*width,y=height*(.75+.19*(.5+.5*Math.sin(i*4.7)));
    const radius=width*(.035+.024*(i%4));
    const stain=ctx.createRadialGradient(x,y,0,x,y,radius);
    stain.addColorStop(0,'rgba(24,43,45,.14)');stain.addColorStop(1,'rgba(24,43,45,0)');
    ctx.fillStyle=stain;ctx.fillRect(x-radius,y-radius,radius*2,radius*2);
  }
  for(let i=0;i<13;i++){
    const x=((i*67+39)%251)/251*width,top=height*(.04+.09*(i%3)),length=height*(.23+.07*(i%5));
    const drip=ctx.createLinearGradient(0,top,0,top+length);
    drip.addColorStop(0,'rgba(22,42,43,.13)');drip.addColorStop(1,'rgba(22,42,43,0)');
    ctx.fillStyle=drip;ctx.fillRect(x,top,width*(.003+.001*(i%3)),length);
  }
  ctx.restore();
}

export function canvasLampColor(level){
  const t=Math.max(0,Math.min(1,level));
  return `rgb(${Math.round(43+190*t)},${Math.round(51+137*t)},${Math.round(52+79*t)})`;
}
