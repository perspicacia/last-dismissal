import test from 'node:test';
import assert from 'node:assert/strict';
import {newCatEvent,advanceCatEvent,findCatPath,clearCatPath,catPose,CAT_DURATION} from '../cat-event.js';
import {CLASSROOM_DESKS,CLASSROOM_TEACHER_DESK} from '../classroom.js';
import {Corridor} from '../corridor.js';
const player={x:0,z:1.4,angle:0},options={scene:'corridor',player,random:()=>0};
function tick(state,seconds,config=options){let appearances=0,meows=0;for(let t=0;t<seconds-1e-8;t+=.05){const event=advanceCatEvent(state,.05,config);state=event.state;appearances+=Number(event.appeared);meows+=Number(event.meow);}return {state,appearances,meows};}
test('고양이와 울음은 시작 직후 숨고 각각 지연·재등장 간격을 지킨다',()=>{
 assert.equal(newCatEvent(()=>0).nextCat,10);assert.equal(newCatEvent(()=>1).nextCat,22);
 assert.equal(newCatEvent(()=>0).nextMeow,9);assert.equal(newCatEvent(()=>1).nextMeow,21);
 let state=advanceCatEvent(newCatEvent(()=>0),.05,options).state;
 let event=tick(state,8.95);assert.equal(event.meows,0);assert.equal(event.appearances,0);
 event=tick(event.state,.1);assert.equal(event.meows,1);assert.equal(event.state.cat,null);
 event=tick(event.state,1);assert.equal(event.appearances,1);assert.equal(event.meows,1);assert.ok(event.state.cat);
 event=tick(event.state,CAT_DURATION);assert.equal(event.appearances,0);assert.equal(event.state.cat,null);
 event=tick(event.state,8.5);assert.equal(event.appearances,1);
});
test('동시에 만료되는 울음과 등장 신호는 하나만 내보내고 음소거 후에도 밀린 신호가 없다',()=>{
 const state={...newCatEvent(()=>0),scene:'corridor',nextCat:.1,nextMeow:.1};
 const event=advanceCatEvent(state,.1,options);assert.equal(event.appeared,true);assert.equal(event.meow,true);
 const quiet=tick(event.state,1);assert.equal(quiet.meows,0);assert.equal(quiet.appearances,0);
 assert.ok(quiet.state.nextMeow>quiet.state.elapsed);
});
test('방 변경·종료는 고양이와 시계를 비우고 비활성 시간은 진행하지 않는다',()=>{
 const event=advanceCatEvent({...newCatEvent(()=>0),scene:'corridor',nextCat:0},.1,options);
 assert.ok(event.state.cat);
 const paused=advanceCatEvent(event.state,50,{...options,active:false});assert.equal(paused.state,event.state);assert.equal(paused.meow,false);
 const moved=advanceCatEvent(event.state,.1,{...options,scene:'classroom31'});assert.equal(moved.state.cat,null);assert.equal(moved.state.elapsed,0);assert.equal(moved.meow,false);
 const ended=advanceCatEvent(event.state,.1,{...options,ended:true});assert.equal(ended.state.cat,null);assert.equal(ended.state.scene,null);
 assert.equal(advanceCatEvent(ended.state,.1,{...options,ended:true}).state,ended.state);
 assert.equal(advanceCatEvent(event.state,.1,{...options,scene:'title'}).state.cat,null);
});
test('실제 책상·의자 배치에서 경로를 고르고 벽·가구에 꼬리까지 닿지 않는다',()=>{
 const blockers=[...CLASSROOM_DESKS,CLASSROOM_TEACHER_DESK,...CLASSROOM_DESKS.map(d=>({x:d.x,z:d.z-.72,width:.55,depth:.5}))];
 const paths=[findCatPath(player,'corridor',[],()=>0),findCatPath(player,'corridor',[],()=>1),findCatPath(player,'classroom31',blockers,()=>0)];
 assert.ok(paths.every(Boolean));assert.ok(paths[0].to.x<paths[0].from.x);assert.ok(paths[1].to.x>paths[1].from.x);
 for(const [i,path] of paths.entries()){assert.equal(clearCatPath(path,i===2?'classroom31':'corridor',i===2?blockers:[]),true);assert.ok(path.from.z-player.z>=3.8);}
 assert.equal(findCatPath(player,'classroom31',[{x:0,z:5.6,width:8,depth:8}],()=>0),null);
 assert.equal(findCatPath({...player,x:NaN},'corridor'),null);
 assert.equal(clearCatPath({from:{x:0,z:0},to:{x:0,z:3}},'classroom31'),false);
});
test('보행 카메라를 내리지 않아도 등장 모델의 머리·몸이 화면 안에 있다',()=>{
 const path=findCatPath(player,'corridor',[],()=>0),state={cat:{path,elapsed:.8}},pose=catPose(state);
 const lens=1280*.68,horizon=720*.48,d=pose.z-player.z;
 for(const y of [pose.y+.235,pose.y+.505]){const screen=horizon+(1.5-y)*lens/d;assert.ok(screen>0&&screen<720);}
 assert.ok(pose.y>.23);assert.ok(pose.opacity===1);
 const reducedA=catPose({cat:{path,elapsed:.3}},true),reducedB=catPose({cat:{path,elapsed:1.2}},true);
 for(const key of ['x','z','y','gait','yaw'])assert.equal(reducedA[key],reducedB[key]);
 assert.equal(reducedA.y,0);assert.equal(reducedA.gait,0);assert.equal(catPose({cat:{path,elapsed:CAT_DURATION}}),null);
 assert.equal(advanceCatEvent({...newCatEvent(()=>0),scene:'corridor'},Infinity,options).state.elapsed,0);
});
test('실제 이동 컨트롤러는 입장·복귀·정지에서 고양이를 숨기고 방문 판정을 보존한다',()=>{
 const c=Object.create(Corridor.prototype),models={corridor:{visible:true},classroom31:{visible:true}},exploration={ended:false,visited:['classroom31']};
 Object.assign(c,{canvas:{dataset:{}},view3D:{refs:{cats:models}},keys:new Set(['forward']),scene:'corridor',player:{...player},catCount:3,exploration,notify(){}});
 c.enterClassroom('classroom31');assert.equal(c.catEvent.cat,null);assert.equal(c.canvas.dataset.catVisible,'false');assert.ok(Object.values(models).every(m=>!m.visible));assert.equal(c.keys.size,0);assert.equal(c.exploration,exploration);
 c.catEvent.cat={path:{from:{x:0,z:5},to:{x:1,z:5}},elapsed:.6};c.leaveClassroom();assert.equal(c.catEvent.cat,null);assert.deepEqual(c.player,player);
 c.setActive(false);assert.equal(c.canvas.dataset.catCount,'3');assert.equal(c.active,false);assert.deepEqual(exploration.visited,['classroom31']);
});
