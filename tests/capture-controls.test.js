import test from 'node:test';import assert from 'node:assert/strict';
import {captureCommand,isCaptureShortcut} from '../capture-controls.js';
import {inputAction} from '../mouse-controls.js';
import {Corridor} from '../corridor.js';
const active={canCapture:true,capturing:false};
test('P freezes/resumes with physical Korean layout and cannot interrupt an ended game',()=>{
 for(const key of [{key:'p',code:'KeyP'},{key:'P',code:'KeyP'},{key:'ㅔ',code:'KeyP'}]){
  assert.equal(captureCommand(key,active),'capture');assert.equal(captureCommand(key,{...active,capturing:true}),'resume');
  assert.equal(captureCommand(key,{canCapture:false,capturing:false}),null);
  assert.equal(captureCommand({...key,repeat:true},active),null);
  for(const modifier of ['metaKey','ctrlKey','altKey'])assert.equal(captureCommand({...key,[modifier]:true},active),null);
 }
});
test('OS capture shortcuts release early while unrelated browser shortcuts are left alone',()=>{
 const shortcuts=[{key:'Shift',code:'ShiftLeft',metaKey:true,shiftKey:true},{key:'Meta',code:'MetaLeft',metaKey:true,shiftKey:true},...[3,4,5].map(n=>({key:String(n),code:`Digit${n}`,metaKey:true,shiftKey:true})),{key:'S',code:'KeyS',metaKey:true,shiftKey:true},{key:'S',code:'KeyS',ctrlKey:true,shiftKey:true}];
 for(const key of shortcuts){assert.equal(isCaptureShortcut(key),true);assert.equal(captureCommand(key,active),'capture');assert.equal(captureCommand(key,{...active,capturing:true}),null);}
 for(const key of [{key:'Shift',code:'ShiftLeft',shiftKey:true},{key:'4',code:'Digit4'},{key:'r',code:'KeyR',metaKey:true},{key:'s',code:'KeyS',ctrlKey:true}]){assert.equal(isCaptureShortcut(key),false);assert.equal(captureCommand(key,active),null);}
});
test('modified movement and system snipping S cannot move the player',()=>{
 for(const modifier of ['metaKey','ctrlKey','altKey'])for(const code of ['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowRight'])assert.equal(inputAction(code.replace('Key','').toLowerCase(),code,{[modifier]:true}),null);
 assert.equal(inputAction('S','KeyS',{metaKey:true,shiftKey:true}),null);assert.equal(inputAction('S','KeyS',{ctrlKey:true,shiftKey:true}),null);
 assert.equal(inputAction('W','KeyW',{shiftKey:true}),'forward');
});
test('capture stops simulation while retaining the visible cat, exploration and input clearing',()=>{
 const c=Object.create(Corridor.prototype),cat={visible:true},event={phase:'crossing',elapsed:1.2},exploration={visited:['classroom31'],ended:false};
 Object.assign(c,{active:true,keys:new Set(['forward']),canvas:{dataset:{catVisible:'true',catCount:'2',catHeight:'.006'}},view3D:{refs:{cats:{corridor:cat}}},catEvent:event,catCount:2,exploration});
 c.setActive(false,{preserveCat:true});assert.equal(c.active,false);assert.equal(c.keys.size,0);assert.equal(cat.visible,true);assert.equal(c.catEvent,event);assert.equal(c.exploration,exploration);assert.equal(c.canvas.dataset.catVisible,'true');
 c.setActive(true);assert.equal(c.catEvent,event);assert.equal(cat.visible,true);
 c.setActive(false);assert.equal(cat.visible,false);assert.equal(c.canvas.dataset.catVisible,'false');assert.notEqual(c.catEvent,event);
});
