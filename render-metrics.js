// Developer-only CPU submission / frame cadence, never advertised as GPU time.
export class RenderMetrics{
 constructor(limit=120){this.limit=limit;this.cpu=[];this.intervals=[];this.last=null;}
 sample(start,end,frameTime){
  if(Number.isFinite(start)&&Number.isFinite(end)&&end>=start)this.cpu.push(end-start);
  if(this.last!==null&&frameTime>this.last&&frameTime-this.last<250)this.intervals.push(frameTime-this.last);
  this.last=frameTime;for(const values of [this.cpu,this.intervals])if(values.length>this.limit)values.shift();
  const percentile=(a,p)=>a.length?[...a].sort((x,y)=>x-y)[Math.min(a.length-1,Math.floor(a.length*p))]:0;
  const frame=percentile(this.intervals,.5);
  return {samples:this.cpu.length,cpuMedian:percentile(this.cpu,.5),cpuP95:percentile(this.cpu,.95),frameMedian:frame,fps:frame?1000/frame:0};
 }
}
