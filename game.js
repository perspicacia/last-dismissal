import {MouseLookController,lookPlayer,inputAction,DEFAULT_SENSITIVITY} from './mouse-controls.js?v=mouse-comfort-1';
import {ARRIVAL,rabbitArrival} from './rabbit-arrival.js';
import {SchoolAudio} from './audio.js?v=character-depth-6';
import {Corridor} from './corridor.js?v=mouse-comfort-1';
import {ROOMS,ROOM_AMBIENCE,nearbyRoom,newExploration,advanceExploration} from './exploration.js?v=mouse-comfort-1';
import {ghostSmileAmount} from './room-hauntings.js?v=music-ghost-polish-1';
import {newHauntingAudio,advanceHauntingAudio} from './haunting-audio-state.js?v=music-ghost-polish-1';
const $=id=>document.getElementById(id),audio=new SchoolAudio();
let paused=false,sensitivity=DEFAULT_SENSITIVITY;const heldKeys=new Map();
let state=null,endingTimer,audioError='',hauntingAudio=newHauntingAudio();
function show(id){if(id!=='game'){closePause();mouse.release();}document.body.dataset.screen=id;document.body.classList.toggle('playing',id==='game');for(const x of ['intro','game','ending','gameover'])$(x).hidden=x!==id;}
function updateAudioStatus(){const status=$('audio-status'),message=audioError||(!audio.ctx?'BGM 대기':audio.muted||audio.volume===0?'BGM 음소거':audio.ctx.state==='running'?'BGM 재생 중':'BGM 일시 정지 · 소리 확인');if(status.textContent!==message)status.textContent=message;status.dataset.level=String(audio.level().toFixed(5));const needsHelp=Boolean(audioError)||Boolean(audio.ctx&&audio.ctx.state!=='running'&&!audio.muted&&state&&!state.ended&&!paused);status.classList.toggle('sr-only',!needsHelp);$('sound-test').hidden=!needsHelp;}
setInterval(updateAudioStatus,500);
async function enableAudio(test=false){if(!test&&($('game').hidden||!state||state.ended||paused))return;audioError='';try{await(test?audio.test():audio.start());}catch{audioError='재생 실패 · 소리 확인';}$('audio-status').dataset.recordedDoor=String(audio.recordedBuffers.has('door-slide'));$('audio-status').dataset.recordedRabbit=String(audio.recordedBuffers.has('jumpscare'));updateAudioStatus();}
const corridor=new Corridor($('corridor'),({player,scene})=>{
 $('position').dataset.scene=scene;for(const key of ['x','z','angle','pitch'])$('position').dataset[key]=(player[key]||0).toFixed(3);
 updateUI();
},()=>audio.footstep(corridor.scene==='corridor'?'corridor':'classroom'));
corridor.onCatCue=variant=>audio.catMeow(variant);
corridor.manualLook=true;
const canPlay=()=>!$('game').hidden&&Boolean(state)&&!state.ended&&!paused;
const mouse=new MouseLookController($('corridor'),{
 canPlay,onLook:(dx,dy)=>{corridor.player=lookPlayer(corridor.player,dx,dy,sensitivity);corridor.notify();},
 onInteract:()=>interact(),onUnlock:()=>pause(),onMode:mode=>{$('corridor').dataset.lookMode=mode;}
});
function closePause(){paused=false;heldKeys.clear();corridor.keys.clear();$('pause-menu').hidden=true;$('game').inert=false;document.body.dataset.paused='false';}
function pause(){
 if(!canPlay())return;
 paused=true;heldKeys.clear();corridor.setActive(false);mouse.release();audio.stop();
 document.body.dataset.paused='true';$('pause-menu').hidden=false;$('game').inert=true;$('resume-game').focus();updateAudioStatus();
}
async function resume(){
 if(!paused||!state||state.ended)return;
 closePause();corridor.setActive(true);$('corridor').focus();mouse.requestLock();await enableAudio();
}
$('pause-game').onclick=pause;$('resume-game').onclick=resume;$('pause-exit').onclick=restart;
$('sensitivity').oninput=e=>{sensitivity=Number(e.target.value)/100;$('sensitivity-value').textContent=`${e.target.value}%`;};
$('pause-menu').addEventListener('keydown',e=>{
 if(e.key!=='Tab')return;
 const controls=[...$('pause-menu').querySelectorAll('button,input')],first=controls[0],last=controls.at(-1);
 if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
 else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
});
window.addEventListener('blur',pause);
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});

audio.onEffect=(kind,details)=>{
 const canvas=$('corridor'),source=details?.source||'synthesis';
 canvas.dataset.soundEffect=kind;canvas.dataset.soundSource=source;
 canvas.dataset.soundCount=String(Number(canvas.dataset.soundCount||0)+1);
 const key=kind==='baby-cry'?'babyCryCount':kind==='door-slide'?'doorSlideCount':kind==='ghost-laugh'?'ghostLaughCount':kind==='jumpscare'?'roarCount':kind==='cat-meow'?'catMeowCount':null;
 if(key){canvas.dataset[key]=String(Number(canvas.dataset[key]||0)+1);canvas.dataset[key.replace('Count','Source')]=source;}
};
corridor.onTick=dt=>{
 if(!state)return;
 if(state.ended){updateArrival();return;}
 state=advanceExploration(state,dt,corridor.scene,corridor.player);
 corridor.exploration=state;updateUI();if(state.ended)finish();else{const ghost=ROOM_AMBIENCE[corridor.scene]?.ghost,smiling=Boolean(ghost&&ghostSmileAmount(corridor.player,ghost));const ambient=advanceHauntingAudio(hauntingAudio,dt,corridor.scene,false,Math.random,smiling);hauntingAudio=ambient.state;if(ambient.cry)audio.babyCry();if(ambient.laugh)audio.ghostLaugh();}
};
function updateUI(){
 if(!state)return;
 const inside=corridor.scene!=='corridor',room=nearbyRoom(corridor.player,corridor.scene);
 $('floor').textContent=ROOMS.find(r=>r.id===corridor.scene)?.label||'3층 동쪽 복도';
 $('room-action').hidden=inside||!room||state.ended;
 if(room)$('room-action').textContent=`${room.label} 들어가기`;
 $('inspect').hidden=true;$('classroom-tools').hidden=!inside||state.ended;$('door-toggle').hidden=true;
 $('room-return').disabled=false;
 $('survival-time').textContent=`둘러본 교실 ${state.visited.length} / ${ROOMS.length}`;
 const message=state.ended?'뒤늦게 눈이 마주쳤다.':inside?'조용한 교실. 안쪽을 살펴보자.':'아직 누군가 학교에 남아 있다.';
 if($('threat-status').textContent!==message)$('threat-status').textContent=message;
 $('survival-hud').dataset.phase=state.ended?'warning':'exploring';
 $('corridor').dataset.survivalPhase=state.ended?'caught':'exploring';
 $('corridor').dataset.rabbitVisible=String(state.ended);
 $('corridor').dataset.visited=state.visited.join(',');
 corridor.exploration=state;
}
async function start(){
 clearTimeout(endingTimer);closePause();mouse.release();audio.clearEffects();hauntingAudio=newHauntingAudio();state=newExploration();corridor.survival=null;corridor.exploration=state;corridor.tutorial=false;corridor.reset(null);corridor.screamTriggered=false;
 $('jumpscare').hidden=true;for(const key of ['soundCount','babyCryCount','doorSlideCount','ghostLaughCount','roarCount','catMeowCount'])$('corridor').dataset[key]='0';for(const key of ['soundEffect','soundSource','babyCrySource','doorSlideSource','ghostLaughSource','roarSource','catMeowSource'])$('corridor').dataset[key]='';$('feedback').textContent='';show('game');corridor.setActive(true);updateUI();$('corridor').focus();mouse.requestLock();await enableAudio();
}
function updateArrival(){
 const arrival=rabbitArrival((performance.now()-corridor.caughtAt)/1000);
 corridor.mouthOpen=arrival.teeth;
 $('corridor').dataset.mascotMouth=arrival.teeth?'open':'closed';
 if(arrival.teeth&&!corridor.screamTriggered){corridor.screamTriggered=true;audio.jumpscare();}
}
function finish(){
 audio.clearEffects();hauntingAudio=newHauntingAudio();
 corridor.keys.clear();corridor.caughtAt=performance.now();corridor.mouthOpen=false;corridor.screamTriggered=false;updateUI();
 // Keep drawing the room-space lunge, but block movement and all actions.
 endingTimer=setTimeout(()=>{if(!state?.ended)return;corridor.setActive(false);audio.clearEffects();show('gameover');$('retry').focus();},ARRIVAL.end*1000);
}
function interact(){
 if(!state||state.ended||paused)return;
 if(corridor.scene!=='corridor'){leaveRoom();return;}
 const room=nearbyRoom(corridor.player,corridor.scene);if(room){audio.clearEffects();hauntingAudio=newHauntingAudio();corridor.enterClassroom(room.id);updateUI();audio.doorSlide();$('corridor').focus();}
}
function leaveRoom(){if(!state||state.ended||paused)return;audio.clearEffects();hauntingAudio=newHauntingAudio();corridor.leaveClassroom();updateUI();$('corridor').focus();}
$('room-action').onclick=interact;$('room-return').onclick=leaveRoom;
function restart(){closePause();mouse.release();clearTimeout(endingTimer);hauntingAudio=newHauntingAudio();state=null;corridor.exploration=null;corridor.survival=null;corridor.caughtAt=null;corridor.screamTriggered=false;corridor.mouthOpen=false;corridor.setActive(false);$('jumpscare').hidden=true;show('intro');audio.stop();$('start').focus();}
function refreshKeys(){corridor.keys.clear();for(const action of heldKeys.values())corridor.keys.add(action);}
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){if(canPlay()){e.preventDefault();pause();}else if(!$('gameover').hidden){e.preventDefault();restart();}return;}
 if(['INPUT','BUTTON','A'].includes(e.target.tagName)||!canPlay())return;
 const action=inputAction(e.key,e.code);if(action){e.preventDefault();heldKeys.set(e.code||e.key.toLowerCase(),action);refreshKeys();if(!e.repeat)corridor.nudge(action);}
 if((e.code==='KeyE'||e.key.toLowerCase()==='e')&&!e.repeat){e.preventDefault();interact();heldKeys.clear();}
});
document.addEventListener('keyup',e=>{heldKeys.delete(e.code||e.key.toLowerCase());if(canPlay())refreshKeys();});
$('start').onclick=start;$('again').onclick=start;$('retry').onclick=start;$('restart').onclick=restart;
function mute(){audio.muted=!audio.muted;audio.update();$('mute').textContent=audio.muted?'소리 꺼짐':'소리 켜짐';$('mute').setAttribute('aria-pressed',String(audio.muted));if(!audio.muted)enableAudio();updateAudioStatus();}
$('mute').onclick=mute;
$('sound-test').onclick=()=>{audio.muted=false;if(audio.volume===0){audio.volume=.5;$('volume').value=50;}$('mute').textContent='소리 켜짐';$('mute').setAttribute('aria-pressed','false');enableAudio(true);};
$('volume').oninput=e=>{audio.volume=Number(e.target.value)/100;audio.update();};
document.addEventListener('keydown',e=>{if(!['INPUT','BUTTON','A'].includes(e.target.tagName)&&!e.repeat&&e.key.toLowerCase()==='m')mute();});
document.addEventListener('visibilitychange',()=>{if(!audio.ctx)return;if(document.hidden)audio.ctx.suspend();else if(state&&!state.ended&&!paused)audio.ctx.resume().catch(()=>{});});
