import { createHorrorEvents } from './horror-events.js?v=sliding-doors-2';
import { newGame, choose } from './logic.js?v=sliding-doors-2';
import { SchoolAudio } from './audio.js?v=sliding-doors-2';
import { Corridor } from './corridor.js?v=sliding-doors-2';
import { stairDirection } from './walk-exits.js';
import { schoolAction, canChooseStairs } from './school-route.js';
const $ = id => document.getElementById(id);
const audio = new SchoolAudio();
let state = null;
const horrorEvents = createHorrorEvents();
let feedbackTimer;
new MutationObserver(()=>{
  clearTimeout(feedbackTimer);
  if($('feedback').textContent) feedbackTimer=setTimeout(()=>$('feedback').textContent='',4500);
}).observe($('feedback'),{childList:true,characterData:true,subtree:true});
function updateAudioStatus(message) {
  const status = $('audio-status');
  status.textContent = message || (!audio.ctx ? 'BGM 대기' : audio.muted || audio.volume === 0 ? 'BGM 음소거' : audio.ctx.state === 'running' ? 'BGM 재생 중' : 'BGM 일시 정지 · 소리 확인을 눌러주세요');
  status.dataset.level = String(audio.level().toFixed(5));
}
setInterval(() => updateAudioStatus(audioError), 500);
let audioError = '';
async function enableAudio(test = false) {
  audioError = '';
  try { await (test ? audio.test() : audio.start()); }
  catch { audioError = '재생 실패 · 소리 확인을 눌러주세요'; }
  updateAudioStatus(audioError);
}
const labels = {door:'교실', board:'게시판', window:'창문', clock:'시계', figure:'토끼 마스코트',doll:'학생 인형'};
const normal = {
  doll:'금발 학생 인형이 교실 바닥에 쓰러져 있다. 가까이서 바라봐도 움직이지 않는다.',
  door:'교실 문에 3-2라고 쓰여 있다. 안은 조용하고 아무도 없다.',
  board:'수학여행 단체사진. 학생들이 모두 카메라를 보고 있다.',
  window:'창밖에는 나무가 우거져 있다. 둥근 가로등 아래 길은 비어 있다.',
  clock:'벽시계는 11시 17분. 휴대전화의 시간과 같다.',
  figure:'학교 축제의 토끼 마스코트가 계단 오른쪽에 서 있다. 낡은 민트색 털과 검은 단추 눈. 웃는 얼굴이 조금 어색하다.'
};
const abnormal = {
  doll:'바닥에 쓰러져 있던 인형이 벌떡 일어나 입을 벌렸다. 날카로운 이빨과 가늘게 찢어진 동공이 나를 향한다.',
  door:'교실 번호가 404로 바뀌어 있다. 이 학교에는 404호가 없다.',
  board:'사진 속 학생들의 얼굴이 모두 검게 지워져 있다. 눈이 있어야 할 곳이 비어 있다.',
  window:'가로등 아래 누군가 서 있다. 검은 머리 사이로 갈라진 인형 얼굴이 보인다. 움직이지 않고 창 안을 바라본다.',
  clock:'시곗바늘 두 개가 모두 아래를 향한다. 휴대전화는 여전히 11시 17분이다.',
  figure:'토끼 마스코트가 계단 옆을 떠나 복도 중간까지 와 있다. 누가 옮겼지? 여전히 똑같은 얼굴로 나를 보고 있다.'
};
function show(id) { document.body.classList.toggle('playing',id==='game'); ['intro','game','ending'].forEach(x => $(x).hidden = x !== id); }
function render() {
  $('mode').textContent = state.tutorial ? '정상 복도 · 기억하는 시간' : '야간 자율학습 종료';
  $('progress-label').textContent = `하교 기록 ${state.progress} / 5`;
  $('marks').innerHTML = Array.from({length:5},(_,i)=>`<i class="${i<state.progress?'done':''}"></i>`).join('');
  corridor.tutorial = state.tutorial;
  horrorEvents.reset();
  corridor.reset(state.anomaly);
  $('feedback').textContent='';
  $('inspect-title').textContent = '복도를 관찰하세요.';
  $('inspect-text').textContent = state.tutorial ? '이곳이 정상 상태입니다. 화살표로 탐색하고 복도 끝의 아래층 계단으로 가세요.' : '방금 기억한 복도와 달라진 점이 있나요?';
  $('record').textContent = `출석부 · 하교한 학생 ${state.progress}명 / 마지막 이름: 나`;
}
async function start() {
  state = newGame(); show('game'); corridor.setActive(true); render(); $('corridor').focus();
  $('feedback').textContent = '';
  await enableAudio();
}
function decide(up) {
  if (!state || state.ended || $('game').hidden || !canChooseStairs(corridor.scene,corridor.atStairs) || (state.tutorial && up)) return;
  const tutorial = state.tutorial;
  state = choose(state,up);
  if (!tutorial) audio.result(state.correct);
  if (state.ended) {
    corridor.setActive(false); show('ending'); audio.end(); $('result').textContent = `총 ${state.attempts}번의 선택 끝에 하교했습니다.`; $('again').focus(); return;
  }
  render();
  $('feedback').textContent = tutorial ? '또 같은 복도다. 달라진 곳이 있는지 살펴보자.' : state.correct ? '' : '다시 처음으로 돌아왔다.';
}
const corridor = new Corridor($('corridor'), ({item, stairs, names, player, scene='corridor'}) => {
  const inside=scene==='classroom';
  const roomAction=schoolAction(player,scene,Boolean(state?.tutorial));
  $('floor').textContent=inside?'3-2 교실':'3층 동쪽 복도';
  $('classroom-tools').hidden=!inside;
  $('corridor').setAttribute('aria-label',`${inside?'3-2 교실':'학교 복도'} 탐색. 위아래 화살표로 이동하고 좌우 화살표로 회전합니다. E 키로 상호작용합니다.`);
  $('room-action').hidden=!roomAction;
  $('room-action').textContent='교실 들어가기';
  $('inspect').disabled = !item;
  $('inspect').hidden = !item;
  $('inspect').textContent = item ? `${names[item]} 살펴보기` : '살펴보기';
  const canChoose=canChooseStairs(scene,stairs);
  $('position').textContent = inside?`교실 ${Math.round(player.z)} / 10 m`:stairs ? '계단 앞' : `복도 ${Math.round(player.z)} / 26 m`;
  $('position').dataset.scene=scene;
  $('position').dataset.x = player.x.toFixed(2);
  $('position').dataset.z = player.z.toFixed(2);
  $('position').dataset.angle = player.angle.toFixed(2);
  const direction=stairDirection(player,scene);
  if(state && !state.ended && direction!==null) {
    if(!canChoose || (state.tutorial && direction)) {
      corridor.player={...player,z:23.3};
      $('feedback').textContent='먼저 아래층으로 내려가 정상 복도를 기억하자.';
    } else decide(direction);
  }
}, () => audio.tone(105,.12,.06), (event='mascot') => {
  if(event==='doll'){if(horrorEvents.takeEvent('doll-rise'))audio.cue('doll-rise');$('feedback').textContent='인형이 벌떡 일어났다. 웃고 있다.';return;}
  if(horrorEvents.takeEvent('mascot-reveal'))audio.cue('mascot-reveal');
  $('feedback').textContent='토끼가 입을 벌렸다. 웃음 안쪽에서 날카로운 이빨이 드러났다.';
});
function interact() {
  if (!state || state.ended || $('game').hidden) return;
  const roomAction=schoolAction(corridor.player,corridor.scene,state.tutorial);
  if(roomAction==='enter') {
    corridor.enterClassroom();
    $('inspect-title').textContent='3-2 교실';$('inspect-text').textContent='창문 너머로 푸른 빛이 스며든다. 텅 빈 교실을 둘러보자.';
    $('feedback').textContent='';
    audio.inspect();$('corridor').focus();return;
  }
  if(corridor.scene==='corridor'||corridor.item==='doll')inspect();
}
$('room-action').onclick=interact;
$('room-return').onclick=()=>{if(!state||state.ended||corridor.scene!=='classroom')return;corridor.leaveClassroom();$('inspect-title').textContent='교실 밖으로';$('inspect-text').textContent='복도를 관찰하고 계단으로 향하세요.';$('corridor').focus();};
function inspect() {
  if (!state || !corridor.item || $('game').hidden) return;
  const key = corridor.item;
  $('inspect-title').textContent = labels[key];
  $('inspect-text').textContent = key==='door'&&state.anomaly==='doll'?'교실 문 유리 안쪽에 작은 손자국 두 개가 찍혀 있다. 정상 복도에서는 없던 흔적이다.':key==='doll'&&corridor.dollState.phase!=='lying'?abnormal.doll:key==='doll'?normal.doll:key === 'figure' && corridor.mouthOpen ? '토끼가 입을 크게 벌리고 있다. 웃는 얼굴 안에 날카로운 이빨 두 줄이 숨어 있었다. 여긴 정상적인 복도가 아니다.' : state.anomaly === key ? abnormal[key] : normal[key];
  $('feedback').textContent=$('inspect-text').textContent;
  audio.inspect();
}
$('inspect').onclick = inspect;
const keyActions = { ArrowUp:'forward', ArrowDown:'back', ArrowLeft:'left', ArrowRight:'right', w:'forward', s:'back', a:'left', d:'right' };
document.addEventListener('keydown', e => {
  if ($('game').hidden || e.target.tagName === 'INPUT') return;
  if(e.key==='Escape'){e.preventDefault();restart();return;}
  const action = keyActions[e.key] || keyActions[e.key.toLowerCase()];
  if (action) { e.preventDefault(); if(!e.repeat)corridor.nudge(action); corridor.keys.add(action); }
  if (e.key.toLowerCase() === 'e' && !e.repeat) { e.preventDefault(); interact(); }
});
document.addEventListener('keyup', e => {
  const action = keyActions[e.key] || keyActions[e.key.toLowerCase()];
  if (action) corridor.keys.delete(action);
});
document.querySelectorAll('[data-move]').forEach(button => {
  button.addEventListener('pointerdown', e => { e.preventDefault();button.setPointerCapture(e.pointerId);corridor.keys.add(button.dataset.move); });
  for (const event of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(event,()=>corridor.keys.delete(button.dataset.move));
  button.addEventListener('click',e=>{if(e.detail===0)corridor.nudge(button.dataset.move);});
});
$('start').onclick=start; $('again').onclick=start;
function restart(){state=null;corridor.setActive(false);show('intro');audio.stop();$('start').focus();}
$('restart').onclick=restart;
function mute() {audio.muted=!audio.muted;audio.update();$('mute').textContent=audio.muted?'소리 꺼짐':'소리 켜짐';$('mute').setAttribute('aria-pressed',String(audio.muted));if(!audio.muted) enableAudio();updateAudioStatus();}
$('mute').onclick=mute;
$('sound-test').onclick=()=>{
  audio.muted=false;
  if(audio.volume===0) {audio.volume=.5;$('volume').value=50;}
  $('mute').textContent='소리 켜짐';$('mute').setAttribute('aria-pressed','false');
  enableAudio(true);
};
$('volume').oninput=e=>{audio.volume=Number(e.target.value)/100;audio.update();};
document.addEventListener('keydown',e=>{
  if (['INPUT','BUTTON','A'].includes(e.target.tagName) || e.repeat) return;
  if (e.key.toLowerCase()==='m') mute();
});
document.addEventListener('visibilitychange',()=>{
  if (!audio.ctx) return;
  if(document.hidden) audio.ctx.suspend(); else if(state) audio.ctx.resume().catch(()=>{});
});
