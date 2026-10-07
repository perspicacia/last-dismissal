import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtemp,writeFile,readFile,mkdir,rm,symlink,realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {PreviewManager} from '../scripts/preview.mjs';
import {PREVIEW_MARKER,REQUIRED_FILES,rootIdentity} from '../scripts/preview-server.mjs';

async function fixture(){
 const root=await realpath(await mkdtemp(join(tmpdir(),'horror-preview-test-')));
 for(const file of REQUIRED_FILES){await mkdir(join(root,file,'..'),{recursive:true});await writeFile(join(root,file),file==='index.html'?'<title>LAST DISMISSAL test</title>':'export const version=1;');}
 return root;
}
async function listen(server,port=0){await new Promise((done,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',done);});return server.address().port;}
async function close(server){await new Promise(done=>{server.close(done);server.closeIdleConnections();});}
async function unusedPort(){const server=http.createServer();const port=await listen(server);await close(server);return port;}

test('작업 명령과 분리된 서버는 재사용·즉시 파일 수정·재시작·종료를 지원한다',async t=>{
 const root=await fixture(t),manager=new PreviewManager({root,port:await unusedPort()});
 t.after(async()=>{try{const state=await manager.inspect();if(state.owned)await manager.stop();}finally{await rm(root,{recursive:true,force:true});}});
 assert.equal((await manager.inspect()).kind,'unavailable');
 const started=await manager.start();assert.equal(started.healthy,true);assert.equal(started.owned,true);
 const pid=started.identity.pid;assert.notEqual(pid,process.pid);
 const repeated=await manager.start();assert.equal(repeated.reused,true);assert.equal(repeated.identity.pid,pid);
 const second=new PreviewManager({root,port:manager.port});assert.equal((await second.inspect()).identity.pid,pid);
 const response=await fetch(manager.url+'game.js?v=unchanged');assert.equal(response.headers.get('cache-control'),'no-store');assert.match(response.headers.get('content-type'),/javascript/);
 await writeFile(join(root,'game.js'),'export const version=2;');
 const refreshed=await fetch(manager.url+'game.js?v=unchanged');assert.equal(await refreshed.text(),'export const version=2;');assert.equal((await manager.inspect()).healthy,true);
 const restart=await manager.restart();assert.notEqual(restart.identity.pid,pid);assert.equal((await fetch(manager.url)).status,200);
 assert.equal((await manager.stop()).stopped,true);assert.equal((await manager.inspect()).kind,'unavailable');assert.equal((await manager.stop()).alreadyStopped,true);
});

test('동시 시작은 같은 포트의 하나의 관리 서버로 수렴한다',async t=>{
 const root=await fixture(t),manager=new PreviewManager({root,port:await unusedPort()});
 t.after(async()=>{try{if((await manager.inspect()).owned)await manager.stop();}finally{await rm(root,{recursive:true,force:true});}});
 const [a,b]=await Promise.all([manager.start(),manager.start()]);assert.equal(a.identity.pid,b.identity.pid);assert.equal(a.healthy,true);assert.equal(b.healthy,true);
});

test('다른 루트의 관리 서버와 현재 파일이 다른 서버는 종료하거나 다른 포트로 이동하지 않는다',async t=>{
 const root=await fixture(t),otherRoot=await fixture(t),owner=new PreviewManager({root:otherRoot,port:await unusedPort()});
 t.after(async()=>{try{if((await owner.inspect()).owned)await owner.stop();}finally{await rm(root,{recursive:true,force:true});await rm(otherRoot,{recursive:true,force:true});}});
 const before=await owner.start(),manager=new PreviewManager({root,port:owner.port});
 assert.equal((await manager.inspect()).kind,'foreign');await assert.rejects(manager.start(),/다른 프로젝트/);await assert.rejects(manager.restart(),/종료하지 않았습니다/);
 assert.equal((await owner.inspect()).identity.pid,before.identity.pid);
});

test('동일 게임을 제공하는 기존 서버를 재사용하며 오래된 PID 기록만으로는 종료하지 않는다',async t=>{
 const root=await fixture(t);let managed=false;
 const server=http.createServer(async(req,res)=>{
  if(req.url==='/__preview/status'){
   if(!managed){res.writeHead(404);res.end();return;}
   res.end(JSON.stringify({marker:PREVIEW_MARKER,rootId:rootIdentity(root),pid:process.pid,token:'actual-instance',port:server.address().port}));return;
  }
  try{res.end(await readFile(join(root,req.url==='/'?'index.html':req.url.slice(1))));}catch{res.writeHead(404);res.end();}
 });
 const port=await listen(server);t.after(async()=>{await close(server);await rm(root,{recursive:true,force:true});});const manager=new PreviewManager({root,port});
 const old=await manager.start();assert.equal(old.kind,'compatible');assert.equal(old.reused,true);assert.equal(old.owned,false);await assert.rejects(manager.stop(),/종료하지 않았습니다/);
 await mkdir(join(root,'.preview'));await writeFile(join(root,'.preview/server.json'),JSON.stringify({marker:PREVIEW_MARKER,rootId:rootIdentity(root),pid:process.pid,token:'stale-instance',port}));managed=true;
 assert.equal((await manager.inspect()).owned,false);await assert.rejects(manager.stop(),/종료하지 않았습니다/);assert.equal((await fetch(manager.url)).status,200);
});

test('고정 루트는 쿼리·HEAD·모델 MIME을 지원하고 숨김 파일과 외부 심볼릭 링크를 제공하지 않는다',async t=>{
 const root=await fixture(t),manager=new PreviewManager({root,port:await unusedPort()});
 t.after(async()=>{try{if((await manager.inspect()).owned)await manager.stop();}finally{await rm(root,{recursive:true,force:true});}});
 await mkdir(join(root,'assets'));await writeFile(join(root,'assets/model.glb'),new Uint8Array([1,2,3]));
 await mkdir(join(root,'.git'));await writeFile(join(root,'.git/config'),'private-test');
 const outside=await mkdtemp(join(tmpdir(),'horror-preview-outside-'));t.after(()=>rm(outside,{recursive:true,force:true}));await writeFile(join(outside,'file'),'outside-test');await symlink(join(outside,'file'),join(root,'assets/link'));
 await manager.start();
 const head=await fetch(manager.url+'assets/model.glb?v=1',{method:'HEAD'});assert.equal(head.status,200);assert.equal(head.headers.get('content-type'),'model/gltf-binary');assert.equal(await head.text(),'');
 assert.equal((await fetch(manager.url+'.git/config')).status,403);assert.equal((await fetch(manager.url+'assets/link')).status,403);assert.equal((await fetch(manager.url+'missing.js')).status,404);
 assert.equal((await fetch(manager.url+'game.js',{method:'POST'})).status,405);
});
