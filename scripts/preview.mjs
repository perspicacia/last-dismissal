import {readFile,mkdir,open,realpath,stat} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {PREVIEW_MARKER,REQUIRED_FILES,rootIdentity} from './preview-server.mjs';

export const PLAY_URL='http://127.0.0.1:8080/';
const delay=ms=>new Promise(done=>setTimeout(done,ms));
async function response(url){
 const res=await fetch(url,{signal:AbortSignal.timeout(1500),cache:'no-store'});
 return {status:res.status,body:Buffer.from(await res.arrayBuffer())};
}

export class PreviewManager{
 constructor({root=fileURLToPath(new URL('../',import.meta.url)),port=8080,stateDir}={}){
  this.root=resolve(root);this.port=port;this.stateDir=resolve(stateDir||join(this.root,'.preview'));this.url=`http://127.0.0.1:${port}/`;
 }
 async inspect(){
  const root=await realpath(this.root);
  let remote;
  try{remote=await response(this.url+'__preview/status');}
  catch(error){return {kind:'unavailable',healthy:false,reason:error.cause?.code||error.name};}
  let identity;
  if(remote.status===200)try{identity=JSON.parse(remote.body.toString());}catch{}
  const managed=identity?.marker===PREVIEW_MARKER;
  if(managed&&identity.rootId!==rootIdentity(root))return {kind:'foreign',healthy:false,reason:'8080 포트가 다른 프로젝트를 제공하고 있습니다.'};
  const mismatched=[];
  for(const path of REQUIRED_FILES){
   try{
    const [local,res]=await Promise.all([readFile(join(root,path)),response(this.url+path)]);
    if(res.status!==200||!local.equals(res.body))mismatched.push(path);
   }catch{mismatched.push(path);}
  }
  let owned=false;
  if(managed)try{
   const state=JSON.parse(await readFile(join(this.stateDir,'server.json'),'utf8'));
   owned=state.marker===PREVIEW_MARKER&&state.pid===identity.pid&&state.token===identity.token&&state.rootId===identity.rootId&&state.port===this.port;
  }catch{}
  return {kind:managed?'managed':mismatched.length?'foreign':'compatible',healthy:mismatched.length===0,owned,identity,mismatched,
   reason:mismatched.length?'현재 프로젝트와 다른 파일 응답: '+mismatched.join(', '):undefined};
 }
 async start(){
  const before=await this.inspect();
  if(before.healthy)return {...before,reused:true};
  if(before.kind!=='unavailable')throw new Error(before.reason||'서버가 정상 파일을 제공하지 않습니다. 파일과 상태를 먼저 확인하세요.');
  const root=await realpath(this.root);for(const path of REQUIRED_FILES)await stat(join(root,path));
  await mkdir(this.stateDir,{recursive:true});
  const log=await open(join(this.stateDir,'server.log'),'a',0o600);
  const config={root,port:this.port,stateDir:this.stateDir,token:randomUUID()};
  const child=spawn(process.execPath,[fileURLToPath(new URL('./preview-server.mjs',import.meta.url)),JSON.stringify(config)],
   {cwd:root,detached:true,stdio:['ignore',log.fd,log.fd]});
  let spawnError;child.on('error',error=>{spawnError=error;});child.unref();await log.close();
  for(let i=0;i<40;i++){
   await delay(100);if(spawnError)throw spawnError;
   const current=await this.inspect();
   if(current.healthy&&current.kind==='managed'&&current.owned)return {...current,reused:false};
   if(current.kind==='foreign')throw new Error(current.reason);
   if(child.exitCode!==null)break;
  }
  throw new Error(`서버 시작을 확인하지 못했습니다. ${join(this.stateDir,'server.log')}를 확인하세요. 다른 프로세스는 종료하지 않았습니다.`);
 }
 async stop(){
  const state=await this.inspect();
  if(state.kind==='unavailable')return {stopped:false,alreadyStopped:true};
  if(!state.owned)throw new Error('이 명령이 관리하는 서버임을 확인하지 못해 종료하지 않았습니다. 기존 서버/다른 작업은 유지합니다.');
  process.kill(state.identity.pid,'SIGTERM');
  for(let i=0;i<40;i++){
   await delay(100);const current=await this.inspect();
   if(current.kind==='unavailable'){
    try{process.kill(state.identity.pid,0);}catch(error){if(error.code==='ESRCH')return {stopped:true};throw error;}
    continue;
   }
   if(current.identity?.token!==state.identity.token)throw new Error('종료 중 다른 서버가 포트를 사용하기 시작했습니다. 새 서버는 유지합니다.');
  }
  throw new Error('서버 종료가 아직 확인되지 않았습니다. 강제 종료하지 않았습니다.');
 }
 async restart(){await this.stop();return this.start();}
}

function describe(state,url){
 if(!state.healthy){console.error('미리보기 확인 실패: '+(state.reason||'서버가 응답하지 않습니다. npm start로 복구하세요.'));return false;}
 console.log(`${state.reused?'실행 중인 서버 재사용':'서버 정상'}: ${url}`);
 console.log('첫 페이지와 필수 게임 모듈이 현재 프로젝트 파일과 일치합니다.');
 if(state.kind==='compatible')console.log('기존 서버를 유지합니다. 이 명령으로 기존 서버를 종료하거나 재시작하지 않습니다.');
 else console.log(`관리 서버 PID ${state.identity.pid} · 실행 명령 종료 후에도 유지 · 로그 .preview/server.log`);
 return true;
}
async function openChrome(url){
 if(process.platform!=='darwin')throw new Error(`직접 브라우저에서 ${url}를 입력하세요. 자동 Chrome 열기는 Mac에서 지원합니다.`);
 await new Promise((done,reject)=>{
  const child=spawn('open',['-a','Google Chrome',url],{stdio:'inherit'});child.once('error',reject);child.once('exit',code=>code===0?done():reject(new Error('Chrome 실행 요청에 실패했습니다. 위 주소를 직접 입력하세요.')));
 });
 console.log('Mac Chrome으로 위 주소를 여는 요청을 보냈습니다. 실제 화면 표시 여부는 브라우저에서 확인하세요.');
}
export async function main(command='start'){
 const manager=new PreviewManager();
 if(command==='status'){if(!describe(await manager.inspect(),manager.url))process.exitCode=1;return;}
 if(command==='stop'){const state=await manager.stop();console.log(state.stopped?'관리 서버를 종료했습니다.':'서버가 이미 응답하지 않습니다.');return;}
 if(command==='logs'){try{console.log((await readFile(join(manager.stateDir,'server.log'),'utf8')).split('\n').slice(-30).join('\n'));}catch{console.log('관리 서버 로그가 아직 없습니다.');}return;}
 if(!['start','open','restart'].includes(command))throw new Error('사용법: node scripts/preview.mjs start|open|status|restart|stop|logs');
 const state=command==='restart'?await manager.restart():await manager.start();describe(state,manager.url);
 if(command==='open')await openChrome(manager.url);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{await main(process.argv[2]||'start');}catch(error){console.error(error.message);process.exitCode=1;}
}
