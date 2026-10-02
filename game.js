import {SchoolAudio} from './audio.js?v=survival-audio-1';
import {Corridor} from './corridor.js?v=rabbit-survival-2';
import {schoolAction} from './school-route.js';
import {newSurvival,advanceSurvival,toggleDoor,doorClosed,rabbitPosition,SURVIVAL} from './survival.js?v=rabbit-survival-2';
const $=id=>document.getElementById(id),audio=new SchoolAudio();
let state=null,endingTimer,audioError='',lastPhase='';
function show(id){document.body.classList.toggle('playing',id==='game');for(const x of ['intro','game','ending','gameover'])$(x).hidden=x!==id;}
function updateAudioStatus(){const status=$('audio-status');status.textContent=audioError||(!audio.ctx?'BGM 대기':audio.muted||audio.volume===0?'BGM 음소거':audio.ctx.state==='running'?'BGM 재생 중':'BGM 일시 정지 · 소리 확인');status.dataset.level=String(audio.level().toFixed(5));}
setInterval(updateAudioStatus,500);
async function enableAudio(test=false){audioError='';try{await(test?audio.test():audio.start());}catch{audioError='재생 실패 · 소리 확인';}updateAudioStatus();}
const corridor=new Corridor($('corridor'),({player,scene})=>{
 $('position').dataset.scene=scene;for(const key of ['x','z','angle'])$('position').dataset[key]=player[key].toFixed(2);
 updateUI();
},()=>audio.footstep(corridor.scene));
audio.onEffect=kind=>{const canvas=$('corridor');canvas.dataset.soundEffect=kind;canvas.dataset.soundCount=String(Number(canvas.dataset.soundCount||0)+1);};
corridor.onTick=dt=>{
 if(!state||state.ended)return;
 const previous=state;
 state=advanceSurvival(state,dt,corridor.scene);
 if(state.defended>previous.defended)audio.result(true);
 if(state.phase!==lastPhase){lastPhase=state.phase;if(state.phase==='warning')audio.cue('mascot-reveal');}
 corridor.survival=state;corridor.rabbitZ=rabbitPosition(state);corridor.mouthOpen=state.phase==='warning';
 if(state.ended)finish();
};
function updateUI(){
 if(!state)return;
 const inside=corridor.scene==='classroom',closed=doorClosed(state),recovery=Math.max(0,Math.ceil(state.recoveryUntil-state.elapsed));
 $('floor').textContent=inside?'3-2 교실':'3층 동쪽 복도';
 $('room-action').hidden=inside||!schoolAction(corridor.player,corridor.scene,false)||state.ended;
 $('inspect').hidden=true;$('classroom-tools').hidden=!inside||state.ended;
 $('door-toggle').disabled=!closed&&recovery>0;
 $('door-toggle').textContent=closed?`문 열기 · ${Math.ceil(state.doorUntil-state.elapsed)}초 남음`:recovery?`문이 걸렸다 · ${recovery}초`:'문 닫기';
 $('door-toggle').setAttribute('aria-pressed',String(closed));
 $('room-return').disabled=closed;
 $('survival-time').textContent=`하교까지 ${Math.ceil(SURVIVAL.duration-state.elapsed)}초`;
 const message=state.phase==='warning'?(closed?'문 너머로 발소리가 들린다.':'토끼가 다가온다. 교실로 피해서 문을 닫자.'):state.phase==='retreat'?'발소리가 멀어진다.':closed?'잠시 숨을 고른다. 문은 곧 다시 열린다.':'복도를 살펴보자. 토끼는 어디에 있지?';
 if($('threat-status').textContent!==message)$('threat-status').textContent=message;
 $('survival-hud').dataset.phase=state.phase;
 $('corridor').dataset.survivalPhase=state.phase;$('corridor').dataset.doorClosed=String(closed);
 corridor.survival=state;corridor.rabbitZ=rabbitPosition(state);corridor.mouthOpen=state.phase==='warning';
}
async function start(){
 clearTimeout(endingTimer);audio.clearEffects();lastPhase='watch';state=newSurvival();corridor.survival=state;corridor.rabbitZ=22;corridor.tutorial=false;corridor.reset(null);
 $('jumpscare').hidden=true;$('corridor').dataset.soundCount='0';$('corridor').dataset.soundEffect='';$('feedback').textContent='';show('game');corridor.setActive(true);updateUI();$('corridor').focus();await enableAudio();
}
function finish(){
 corridor.setActive(false);updateUI();
 if(state.outcome==='escaped'){show('ending');audio.end();$('result').textContent=`토끼의 접근을 ${state.defended}번 막고 학교를 나왔다.`;$('again').focus();return;}
 $('jumpscare').hidden=false;audio.jumpscare();
 endingTimer=setTimeout(()=>{if(state?.outcome!=='caught')return;$('jumpscare').hidden=true;show('gameover');$('caught-result').textContent=`${Math.floor(state.elapsed)}초 동안 버텼다. 다음에는 토끼가 다가올 때 교실 문을 닫자.`;$('retry').focus();},1200);
}
function changeDoor(){if(!state||state.ended)return;const before=state;state=toggleDoor(state,corridor.scene);if(before!==state)audio.inspect();updateUI();corridor.draw(performance.now());$('corridor').focus();}
function interact(){
 if(!state||state.ended)return;
 if(corridor.scene==='classroom'){changeDoor();return;}
 if(schoolAction(corridor.player,corridor.scene,false)){corridor.enterClassroom();updateUI();audio.inspect();$('corridor').focus();}
}
$('room-action').onclick=interact;$('door-toggle').onclick=changeDoor;
$('room-return').onclick=()=>{if(!state||state.ended||doorClosed(state))return;corridor.leaveClassroom();updateUI();$('corridor').focus();};
function restart(){clearTimeout(endingTimer);state=null;corridor.survival=null;corridor.rabbitZ=undefined;corridor.mouthOpen=false;corridor.setActive(false);$('jumpscare').hidden=true;show('intro');audio.stop();$('start').focus();}
const keyActions={ArrowUp:'forward',ArrowDown:'back',ArrowLeft:'left',ArrowRight:'right',w:'forward',s:'back',a:'left',d:'right'};
document.addEventListener('keydown',e=>{
 if(e.target.tagName==='INPUT')return;
 if(e.key==='Escape'){e.preventDefault();restart();return;}
 if($('game').hidden||!state||state.ended)return;
 const action=keyActions[e.key]||keyActions[e.key.toLowerCase()];if(action){e.preventDefault();if(!e.repeat)corridor.nudge(action);corridor.keys.add(action);}
 if(e.key.toLowerCase()==='e'&&!e.repeat){e.preventDefault();interact();}
});
document.addEventListener('keyup',e=>{const action=keyActions[e.key]||keyActions[e.key.toLowerCase()];if(action)corridor.keys.delete(action);});
$('start').onclick=start;$('again').onclick=start;$('retry').onclick=start;$('restart').onclick=restart;
function mute(){audio.muted=!audio.muted;audio.update();$('mute').textContent=audio.muted?'소리 꺼짐':'소리 켜짐';$('mute').setAttribute('aria-pressed',String(audio.muted));if(!audio.muted)enableAudio();updateAudioStatus();}
$('mute').onclick=mute;
$('sound-test').onclick=()=>{audio.muted=false;if(audio.volume===0){audio.volume=.5;$('volume').value=50;}$('mute').textContent='소리 켜짐';$('mute').setAttribute('aria-pressed','false');enableAudio(true);};
$('volume').oninput=e=>{audio.volume=Number(e.target.value)/100;audio.update();};
document.addEventListener('keydown',e=>{if(!['INPUT','BUTTON','A'].includes(e.target.tagName)&&!e.repeat&&e.key.toLowerCase()==='m')mute();});
document.addEventListener('visibilitychange',()=>{if(!audio.ctx)return;if(document.hidden)audio.ctx.suspend();else if(state&&!state.ended)audio.ctx.resume().catch(()=>{});});
