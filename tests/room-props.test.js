import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {buildRoomProps, ROOM_BLOCKERS} from '../room-props.js';

test('specialist rooms have recognizable, distinct three-dimensional equipment', () => {
  const music = buildRoomProps('music'), dance = buildRoomProps('dance');
  for (const name of ['upright-piano', 'piano-white-key', 'piano-black-key', 'sheet-music-paper', 'music-stand', 'drum-kit', 'acoustic-guitar']) assert.ok(music.getObjectByName(name), name);
  for (const name of ['dance-mirror-panel', 'dance-barre', 'dance-speaker', 'dance-floor-mark']) assert.ok(dance.getObjectByName(name), name);
  assert.equal(dance.getObjectByName('upright-piano'), undefined);
  const piano = new THREE.Box3().setFromObject(music.getObjectByName('upright-piano'));
  const size = piano.getSize(new THREE.Vector3());
  assert.ok(size.x > .5 && size.y > 1 && size.z > 2);
});
test('room props fit the room and leave the central exploration aisle free', () => {
  for (const kind of ['music', 'dance']) {
    const bounds = new THREE.Box3().setFromObject(buildRoomProps(kind));
    assert.ok(bounds.min.x >= -4.4 && bounds.max.x <= 4.4, kind);
    assert.ok(bounds.min.z >= 0 && bounds.max.z <= 9.8, kind);
    assert.ok(bounds.min.y >= -.001 && bounds.max.y < 3, kind);
    for (const blocker of ROOM_BLOCKERS[kind]) {
      assert.ok(blocker.width > 0 && blocker.depth > 0);
      assert.ok(Math.abs(blocker.x) - blocker.width / 2 > .5, `${kind} center aisle`);
    }
  }
});
test('building an unsupported room reports a useful error', () => {
  assert.throws(() => buildRoomProps('gym'), /Unknown specialist room/);
});
