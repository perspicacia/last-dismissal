import http from 'node:http';
import {readFile,writeFile,mkdir,stat,realpath,unlink} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {pipeline} from 'node:stream/promises';
import {resolve,relative,isAbsolute,extname,join} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

export const PREVIEW_MARKER='last-dismissal-preview-v1';
export const REQUIRED_FILES=['index.html','game.js','three-school.js','vendor/three.module.js'];
export const rootIdentity=root=>createHash('sha256').update(root).digest('hex');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.wav':'audio/wav','.mp3':'audio/mpeg','.ogg':'audio/ogg','.glb':'model/gltf-binary','.gltf':'model/gltf+json','.ttf':'font/ttf','.woff2':'font/woff2'};
export async function servePreview({root,port=8080,stateDir,token}){
 root=await realpath(root);stateDir=resolve(stateDir||join(root,'.preview'));
 for(const file of REQUIRED_FILES)await stat(join(root,file));
 await mkdir(stateDir,{recursive:true});
 const stateFile=join(stateDir,'server.json');
 const identity={marker:PREVIEW_MARKER,rootId:rootIdentity(root),pid:process.pid,token,port,startedAt:new Date().toISOString()};
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
  let pathname;
  try{pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);}catch{res.writeHead(400);res.end('Invalid URL');return;}
  if(pathname==='/__preview/status'){
   res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'});res.end(req.method==='HEAD'?undefined:JSON.stringify(identity));return;
  }
  if(pathname.includes('\0')||pathname.includes('\\')||pathname.split('/').some(part=>part.startsWith('.'))){res.writeHead(403);res.end('Forbidden');return;}
  try{
   let path=resolve(root,'.'+pathname);
   const contained=path=>{const r=relative(root,path);return r!== '..'&&!r.startsWith('../')&&!r.startsWith('..\\')&&!isAbsolute(r);};
   if(!contained(path)){res.writeHead(403);res.end('Forbidden');return;}
   let info=await stat(path);if(info.isDirectory()){path=join(path,'index.html');info=await stat(path);}
   if(!info.isFile()){res.writeHead(404);res.end('Not found');return;}
   if(!contained(await realpath(path))){res.writeHead(403);res.end('Forbidden');return;}
   res.writeHead(200,{'Content-Type':mime[extname(path).toLowerCase()]||'application/octet-stream','Content-Length':info.size});
   if(req.method==='HEAD'){res.end();return;}
   await pipeline(createReadStream(path),res);
  }catch(error){
   if(!res.headersSent){res.writeHead(error.code==='ENOENT'||error.code==='ENOTDIR'?404:500);res.end('Not found');}
   else res.destroy(error);
  }
 });
 await new Promise((done,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',done);});
 identity.port=server.address().port;
 try{await writeFile(stateFile,JSON.stringify(identity,null,2)+'\n',{mode:0o600});}
 catch(error){server.close();throw error;}
 console.log(`[${identity.startedAt}] Ready http://127.0.0.1:${identity.port}/ root=${root} pid=${process.pid}`);
 let stopping;
 const stop=()=>stopping??=(async()=>{
  await new Promise(done=>{server.close(done);server.closeIdleConnections();});
  try{const state=JSON.parse(await readFile(stateFile,'utf8'));if(state.token===token)await unlink(stateFile);}catch{}
 })();
 process.once('SIGTERM',()=>stop().then(()=>process.exit(0)));
 process.once('SIGINT',()=>stop().then(()=>process.exit(0)));
 return {server,identity,stop};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{await servePreview(JSON.parse(process.argv[2]));}
 catch(error){console.error(`Preview server failed: ${error.message}`);process.exitCode=1;}
}
