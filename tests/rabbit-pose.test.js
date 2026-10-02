import test from 'node:test';import assert from 'node:assert/strict';
import {LEFT_ARM,RIGHT_ARM,raisedArms,rabbitParts} from '../rabbit-pose.js';
test('기본 팔 내림에서 이빨 시점 양팔 만세로 올라가며 재시작 초기화',()=>{
 assert.equal(raisedArms(0).lift,0);assert.equal(raisedArms(.35).lift,0);assert.ok(raisedArms(.55).lift>.5);assert.equal(raisedArms(.70).lift,1);
 assert.equal(raisedArms(.7).left,-raisedArms(.7).right);assert.equal(raisedArms(0).left,0);assert.equal(raisedArms(NaN).lift,0);
});
test('동작 줄이기에서는 이빨 시점에 마지막 자세만 표시',()=>{assert.equal(raisedArms(.54,true).lift,0);assert.equal(raisedArms(.55,true).lift,1);});
test('팔 마스크와 어깨는 대칭이며 이미지 밖을 참조하지 않는다',()=>{assert.equal(LEFT_ARM.pivot.x+RIGHT_ARM.pivot.x,1);for(let i=0;i<LEFT_ARM.polygon.length;i++){const [x,y]=LEFT_ARM.polygon[i],right=RIGHT_ARM.polygon[i];assert.equal(x+right[0],1);assert.equal(y,right[1]);assert.ok(x>=0&&x<=1&&y>=0&&y<=1);}assert.equal(rabbitParts({naturalWidth:0}),null);});
