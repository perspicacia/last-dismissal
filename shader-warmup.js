// Prepare programs during title-screen idle time. Never render a scene or wait
// for preparation before allowing play. The caller owns gameplay/visibility.
export class SceneShaderWarmup {
 constructor({renderer,scenes,camera,canRun=()=>true,onStatus=()=>{},defer=fn=>globalThis.requestIdleCallback?requestIdleCallback(fn,{timeout:600}):setTimeout(fn,75),cancel=id=>globalThis.cancelIdleCallback?cancelIdleCallback(id):clearTimeout(id)}){
  Object.assign(this,{renderer,scenes,camera,canRun,onStatus,defer,cancel});
  this.supported=typeof renderer?.compileAsync==='function';this.pending=new Set(Object.keys(scenes));this.prepared=new Set();this.failed=new Set();this.revisions=new Map();this.busy=false;this.scheduled=null;this.disposed=false;
  this.publish();
 }
 publish(){
  const status=!this.supported?'unsupported':this.busy?'preparing':!this.pending.size?(this.failed.size?'fallback':'ready'):!this.canRun()?'paused':'pending';
  this.onStatus({status,prepared:[...this.prepared],failed:[...this.failed],pending:[...this.pending]});
 }
 invalidate(names=Object.keys(this.scenes)){
  if(this.disposed)return;
  for(const name of names)if(this.scenes[name]){this.revisions.set(name,(this.revisions.get(name)||0)+1);this.prepared.delete(name);this.failed.delete(name);this.pending.add(name);}
  this.schedule();
 }
 schedule(){
  if(this.disposed)return;
  if(!this.supported||!this.canRun()){
   if(this.scheduled!==null){this.cancel(this.scheduled);this.scheduled=null;}
   this.publish();return;
  }
  if(this.busy||this.scheduled!==null||!this.pending.size){this.publish();return;}
  this.scheduled=this.defer(()=>{this.scheduled=null;void this.next();});this.publish();
 }
 async next(){
  if(this.disposed||this.busy||!this.supported||!this.canRun()){this.publish();return;}
  const name=this.pending.values().next().value;if(name===undefined)return;
  this.pending.delete(name);const revision=this.revisions.get(name)||0;this.busy=true;this.publish();
  try{
   await this.renderer.compileAsync(this.scenes[name],this.camera);
   if(!this.disposed&&(this.revisions.get(name)||0)===revision){this.prepared.add(name);this.failed.delete(name);}
  }catch{
   if(!this.disposed&&(this.revisions.get(name)||0)===revision)this.failed.add(name);
  }finally{this.busy=false;if(!this.disposed)this.schedule();}
 }
 dispose(){this.disposed=true;if(this.scheduled!==null)this.cancel(this.scheduled);this.scheduled=null;this.pending.clear();}
}
