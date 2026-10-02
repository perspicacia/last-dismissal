import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {ROOM_HAUNTINGS, windowGaze, bouncePose, buildRoomHauntings, updateRoomHauntings, ghostSmileAmount, createGhostSmile, updateGhostSmile} from '../room-hauntings.js';

const ghostConfig = {x: -6.1, y: 1.30, z: 5.25, height: 2.35};
const watching = {x: -3.2, z: 5.25, angle: -Math.PI / 2};
test('창 바라보기는 실내 접근 거리와 시선 방향을 모두 요구한다', () => {
  assert.equal(windowGaze(watching, ghostConfig), true);
  assert.equal(windowGaze({...watching, angle: 0}, ghostConfig), false);
  assert.equal(windowGaze({...watching, x: 0}, ghostConfig), false);
  assert.equal(windowGaze({...watching, x: -4.6}, ghostConfig), false);
  assert.equal(windowGaze({...watching, angle: NaN}, ghostConfig), false);
  assert.equal(ghostSmileAmount(watching, ghostConfig), 1);
  assert.equal(ghostSmileAmount({...watching, x: -2.1}, ghostConfig), 0);
  assert.equal(ghostSmileAmount(watching, ghostConfig, {active: false}), 0);
});
test('공은 충돌 높이에서 빠르고 정점에서 느린 주기이며 동작 줄이기는 바닥에 고정한다', () => {
  const base = bouncePose(0), apex = bouncePose(.56), landed = bouncePose(1.12);
  assert.equal(base.height, landed.height); assert.ok(apex.height > 1.5);
  assert.ok(apex.shadowScale > base.shadowScale); assert.ok(apex.shadowOpacity < base.shadowOpacity);
  assert.equal(bouncePose(.56, {reduced: true}).height, base.height);
  for (let t = 0; t < 10; t += .01) assert.ok(bouncePose(t).height >= base.height - 1e-9);
});
test('공은 3-1 창밖, 웅크린 그림자는 3-2 구석에만 배치되고 중앙 통로를 비운다', () => {
  const room31 = buildRoomHauntings('classroom31'), classroom = buildRoomHauntings('classroom');
  assert.ok(room31.userData.ball.position.x < -4.4); assert.equal(room31.userData.corner, undefined);
  assert.ok(classroom.userData.corner.position.x > 3); assert.ok(classroom.getObjectByName('corner-shadow-eye'));
  assert.equal(classroom.userData.ball, undefined); assert.equal(buildRoomHauntings('dance').children.length, 0);
  assert.ok(ROOM_HAUNTINGS.classroom.corner.z < 1.8);
});
test('공은 바라볼 때만 진행하고 시선을 돌리면 같은 높이에 멈추며 방 밖에서 초기화한다', () => {
  const room = buildRoomHauntings('classroom31'), player = {x: -2, z: 4.7, angle: -Math.PI / 2};
  for (let i = 0; i < 20; i++) updateRoomHauntings(room, {player, dt: .016});
  const height = room.userData.ball.position.y;
  assert.ok(height > bouncePose(0).height);
  const paused = updateRoomHauntings(room, {player: {...player, angle: 0}, dt: .1});
  assert.equal(paused.ballActive, false); assert.equal(paused.ballHeight, height);
  assert.equal(updateRoomHauntings(room, {player, reduced: true}).ballHeight, bouncePose(0).height);
  assert.equal(updateRoomHauntings(room, {player, active: false}).ballHeight, bouncePose(0).height);
  assert.equal(room.userData.ballTime, 0);
});
test('귀신 미소는 가까이 바라볼 때만 서서히 나타나고 떠나면 기본 표정으로 복귀한다', () => {
  const overlay = createGhostSmile(ghostConfig), ghost = new THREE.Sprite(new THREE.SpriteMaterial());
  for (let i = 0; i < 60; i++) updateGhostSmile(overlay, ghost, watching, ghostConfig);
  assert.ok(overlay.userData.amount > .98); assert.equal(overlay.visible, true); assert.ok(ghost.material.rotation > .1);
  const mouth = overlay.userData.mouth;
  assert.ok(Math.abs(mouth.position.y - ghostConfig.height * .327) < 1e-12);
  for (let i = 0; i < 60; i++) updateGhostSmile(overlay, ghost, {...watching, angle: 0}, ghostConfig);
  assert.ok(overlay.userData.amount < .02); assert.equal(overlay.visible, false);
  updateGhostSmile(overlay, ghost, watching, ghostConfig, {reduced: true});
  assert.equal(overlay.userData.amount, 1); assert.equal(ghost.material.rotation, 0);
  updateGhostSmile(overlay, ghost, watching, ghostConfig, {active: false});
  assert.equal(overlay.visible, false); assert.equal(overlay.userData.amount, 0); assert.equal(ghost.material.rotation, 0);
});
