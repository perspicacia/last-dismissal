import { newGame, choose } from './logic.js';
import { SchoolAudio } from './audio.js';
import { Corridor } from './corridor.js';
const $ = id => document.getElementById(id);
const audio = new SchoolAudio();
let state = null;
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
const labels = {door:'교실', board:'게시판', window:'창문', clock:'시계', figure:'토끼 마스코트'};
const normal = {
  door:'교실 문에 3-2라고 쓰여 있다. 안은 조용하고 아무도 없다.',
  board:'수학여행 단체사진. 학생들이 모두 카메라를 보고 있다.',
  window:'운동장은 어둡고, 멀리 가로등이 보인다.',
  clock:'벽시계는 11시 17분. 휴대전화의 시간과 같다.',
  figure:'학교 축제의 토끼 마스코트가 계단 오른쪽에 서 있다. 낡은 민트색 털과 검은 단추 눈. 웃는 얼굴이 조금 어색하다.'
};
const abnormal = {
  door:'교실 번호가 404로 바뀌어 있다. 이 학교에는 404호가 없다.',
  board:'사진 속 학생들의 얼굴이 모두 검게 지워져 있다. 눈이 있어야 할 곳이 비어 있다.',
  window:'창문 너머에 운동장이 없다. 똑같은 복도가 반대편에서 이어진다.',
  clock:'시곗바늘 두 개가 모두 아래를 향한다. 휴대전화는 여전히 11시 17분이다.',
  figure:'토끼 마스코트가 계단 옆을 떠나 복도 중간까지 와 있다. 누가 옮겼지? 여전히 똑같은 얼굴로 나를 보고 있다.'
};
function show(id) { ['intro','game','ending'].forEach(x => $(x).hidden = x !== id); }
function render() {
  $('mode').textContent = state.tutorial ? '정상 복도 · 기억하는 시간' : '야간 자율학습 종료';
  $('progress-label').textContent = `하교 기록 ${state.progress} / 5`;
  $('marks').innerHTML = Array.from({length:5},(_,i)=>`<i class="${i<state.progress?'done':''}"></i>`).join('');
  corridor.reset(state.anomaly);
  $('inspect-title').textContent = '복도를 관찰하세요.';
  $('inspect-text').textContent = state.tutorial ? '이곳이 정상 상태입니다. 화살표로 탐색하고 복도 끝의 아래층 계단으로 가세요.' : '방금 기억한 복도와 달라진 점이 있나요?';
  $('up').disabled = true; $('down').disabled = true;
  $('record').textContent = `출석부 · 하교한 학생 ${state.progress}명 / 마지막 이름: 나`;
}
async function start() {
  state = newGame(); show('game'); corridor.setActive(true); render(); $('corridor').focus();
  $('feedback').textContent = '첫 복도에는 이상이 없습니다. 정상 상태를 기억하세요.';
  await enableAudio();
}
function decide(up) {
  if (!state || state.ended || $('game').hidden || !corridor.atStairs || (state.tutorial && up)) return;
  const tutorial = state.tutorial, old = state.anomaly;
  state = choose(state,up);
  if (!tutorial) audio.result(state.correct);
  if (state.ended) {
    corridor.setActive(false); show('ending'); audio.end(); $('result').textContent = `총 ${state.attempts}번의 선택 끝에 하교했습니다.`; $('again').focus(); return;
  }
  render();
  $('feedback').textContent = tutorial ? '계단을 내려왔는데 같은 복도다. 이제 이상을 찾아야 한다.' : state.correct ? '올바른 계단이었다. 하지만 다시 같은 복도에 도착했다.' : `다시 처음이다. ${old ? labels[old]+'에 이상이 있었다.' : '방금 복도에는 이상이 없었다.'} 기록이 0으로 돌아갔다.`;
}
const corridor = new Corridor($('corridor'), ({item, stairs, names, player}) => {
  $('inspect').disabled = !item;
  $('inspect').textContent = item ? `E · ${names[item]} 조사` : 'E · 가까운 사물 조사';
  $('up').disabled = !stairs || Boolean(state?.tutorial);
  $('down').disabled = !stairs;
  $('walk-prompt').textContent = stairs ? '계단에 도착했다. 아래에서 방향을 선택하세요.' : item ? `E · ${names[item]} 조사` : '↑↓ 걷기 · ←→ 둘러보기';
  $('position').textContent = stairs ? '계단 앞' : `복도 ${Math.round(player.z)} / 26 m`;
  $('position').dataset.x = player.x.toFixed(2);
  $('position').dataset.z = player.z.toFixed(2);
  $('position').dataset.angle = player.angle.toFixed(2);
}, () => audio.tone(105,.12,.06), () => {
  audio.tone(130,.7,.12); audio.tone(138,.7,.08);
  $('feedback').textContent='토끼가 입을 벌렸다. 웃음 안쪽에서 날카로운 이빨이 드러났다.';
});
function inspect() {
  if (!state || !corridor.item || $('game').hidden) return;
  const key = corridor.item;
  $('inspect-title').textContent = labels[key];
  $('inspect-text').textContent = key === 'figure' && corridor.mouthOpen ? '토끼가 입을 크게 벌리고 있다. 웃는 얼굴 안에 날카로운 이빨 두 줄이 숨어 있었다. 여긴 정상적인 복도가 아니다.' : state.anomaly === key ? abnormal[key] : normal[key];
  audio.inspect();
}
$('inspect').onclick = inspect;
const keyActions = { ArrowUp:'forward', ArrowDown:'back', ArrowLeft:'left', ArrowRight:'right', w:'forward', s:'back', a:'left', d:'right' };
document.addEventListener('keydown', e => {
  if ($('game').hidden || e.target.tagName === 'INPUT') return;
  const action = keyActions[e.key] || keyActions[e.key.toLowerCase()];
  if (action) { e.preventDefault(); if(!e.repeat)corridor.nudge(action); corridor.keys.add(action); }
  if (e.key.toLowerCase() === 'e' && !e.repeat) { e.preventDefault(); inspect(); }
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
$('up').onclick=()=>decide(true); $('down').onclick=()=>decide(false);
$('restart').onclick=()=>{state=null;corridor.setActive(false);show('intro');audio.stop();$('start').focus();};
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
