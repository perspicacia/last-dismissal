// Upload one ready image per idle callback, without rendering or advancing play.
export function sceneTextures(scenes){
 const textures=new Set();
 const add=value=>{if(value?.isTexture)textures.add(value);};
 for(const scene of Object.values(scenes)){
  add(scene.background);add(scene.environment);
  scene.traverse(object=>{for(const material of Array.isArray(object.material)?object.material:[object.material])if(material)for(const value of Object.values(material))add(value);});
 }
 return [...textures];
}
function ready(texture){
 if(!texture?.isTexture||texture.version<=0||texture.isRenderTargetTexture||texture.isDepthTexture||texture.isVideoTexture||texture.isExternalTexture||texture.source?.dataReady===false)return false;
 const valid=image=>image&&image.complete!==false&&image.width>0&&image.height>0;
 return Array.isArray(texture.image)?texture.image.every(valid):valid(texture.image);
}
export class TextureWarmup {
 constructor({renderer,getTextures,canRun=()=>true,onStatus=()=>{},defer=fn=>globalThis.requestIdleCallback?requestIdleCallback(fn,{timeout:600}):setTimeout(fn,75),cancel=id=>globalThis.cancelIdleCallback?cancelIdleCallback(id):clearTimeout(id)}){
  Object.assign(this,{renderer,getTextures,canRun,onStatus,defer,cancel});
  this.supported=typeof renderer?.initTexture==='function';this.pending=new Map();this.prepared=new WeakMap();this.failed=new WeakMap();this.preparedCount=0;this.failedCount=0;this.busy=false;this.scheduled=null;this.disposed=false;
  this.refresh();
 }
 publish(){
  const status=!this.supported?'unsupported':this.busy?'preparing':!this.pending.size?(this.failedCount?'fallback':'ready'):!this.canRun()?'paused':'pending';
  this.onStatus({status,pending:this.pending.size,prepared:this.preparedCount,failed:this.failedCount});
 }
 refresh(){
  if(this.disposed)return;
  this.pending.clear();this.preparedCount=0;this.failedCount=0;
  for(const texture of new Set(this.getTextures()))if(ready(texture)){
   if(this.prepared.get(texture)===texture.version)this.preparedCount++;
   else if(this.failed.get(texture)===texture.version)this.failedCount++;
   else this.pending.set(texture,texture.version);
  }
  this.schedule();
 }
 schedule(){
  if(this.disposed)return;
  if(!this.supported||!this.canRun()){
   if(this.scheduled!==null){this.cancel(this.scheduled);this.scheduled=null;}
   this.publish();return;
  }
  if(this.busy||this.scheduled!==null||!this.pending.size){this.publish();return;}
  this.scheduled=this.defer(()=>{this.scheduled=null;this.next();});this.publish();
 }
 next(){
  if(this.disposed||this.busy||!this.supported||!this.canRun()){this.publish();return;}
  const item=this.pending.entries().next().value;if(!item)return;
  const [texture,version]=item;this.pending.delete(texture);
  if(!ready(texture)||texture.version!==version){this.refresh();return;}
  this.busy=true;this.publish();
  try{this.renderer.initTexture(texture);this.prepared.set(texture,version);this.preparedCount++;}
  catch{this.failed.set(texture,version);this.failedCount++;}
  finally{this.busy=false;if(!this.disposed)this.schedule();}
 }
 dispose(){this.disposed=true;if(this.scheduled!==null)this.cancel(this.scheduled);this.scheduled=null;this.pending.clear();}
}
