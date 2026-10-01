import test from 'node:test';
import assert from 'node:assert/strict';
import {CLASSROOM_SPAWN,moveClassroomPlayer} from '../classroom.js';
test('classroom uses its own bounds and can advance beyond corridor width',()=>{const p=moveClassroomPlayer({x:3.9,z:1.4,angle:Math.PI/2},new Set(['forward']),.05);assert.equal(p.x,4);const q=moveClassroomPlayer({x:-2.1,z:9.15,angle:0},new Set(['forward']),.05);assert.equal(q.z,9.2);assert.equal(moveClassroomPlayer({x:0,z:.81,angle:0},new Set(['back']),.05).z,.8);});
test('desks and chairs block walking while rotation remains available',()=>{const p={x:1.2,z:4.4,angle:0};const q=moveClassroomPlayer(p,new Set(['forward','right']),.05);assert.equal(q.z,p.z);assert.ok(q.angle>0);const chair={x:1.2,z:3.95,angle:0};assert.equal(moveClassroomPlayer(chair,new Set(['forward']),.05).z,chair.z);});
test('center aisle connects spawn to the front',()=>{let p={...CLASSROOM_SPAWN};for(let i=0;i<45;i++)p=moveClassroomPlayer(p,new Set(['forward']),.05);assert.ok(p.z>8);});

import {Corridor} from '../corridor.js';
test('classroom entry/return restore corridor position and never expose stairs',()=>{
  const positions=[];const c=Object.create(Corridor.prototype);
  Object.assign(c,{scene:'corridor',player:{x:-1,z:5.1,angle:-1.5},keys:new Set(['forward']),keyDoor:{tutorial:false},onPosition:p=>positions.push(p),canvas:{dataset:{}},anomaly:null,mouthOpen:false});
  const original={...c.player};c.enterClassroom();assert.deepEqual(c.player,CLASSROOM_SPAWN);assert.equal(c.scene,'classroom');assert.equal(c.keys.size,0);assert.equal(positions.at(-1).stairs,false);assert.equal(positions.at(-1).item,null);
  c.player={x:0,z:8,angle:1};c.leaveClassroom();assert.deepEqual(c.player,original);assert.equal(c.scene,'corridor');
});
test('reset from classroom removes stored return state and restores corridor spawn',()=>{
  const c=Object.create(Corridor.prototype);Object.assign(c,{scene:'classroom',corridorPlayer:{x:2,z:9},keys:new Set(),buildTextures(){},notify(){}});c.reset(null);assert.equal(c.scene,'corridor');assert.equal(c.corridorPlayer,null);assert.equal(c.player.z,1.8);
});

test('teacher desk blocks repeated steps toward front wall and leaves side passage',()=>{
  let p={x:-.5,z:8,angle:0};for(let i=0;i<6;i++)p=moveClassroomPlayer(p,new Set(['forward']),.05);assert.equal(p.z,8);
  let side={x:-2.1,z:8,angle:0};for(let i=0;i<6;i++)side=moveClassroomPlayer(side,new Set(['forward']),.05);assert.ok(side.z>9);
});
