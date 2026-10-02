import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {buildRoomProps, ROOM_BLOCKERS} from '../room-props.js';
import {buildAcousticGuitar, guitarOutline, pianoKeyLayout, woodGrainTexture} from '../music-instruments.js';
import {createScoreTexture, drawPracticeScore, SCORE_LAYOUT} from '../music-sheet.js';

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

test('guitar has a shaped waist, a real recessed sound hole and a playable six-string neck', () => {
  const guitar = buildAcousticGuitar(), body = guitar.getObjectByName('guitar-body');
  guitar.updateMatrixWorld(true);
  assert.equal(body.geometry.type, 'ExtrudeGeometry');
  body.geometry.computeBoundingBox();assert.ok(body.geometry.boundingBox.max.z - body.geometry.boundingBox.min.z > .12);
  const outline = guitarOutline().getPoints(200);
  const waist = Math.max(...outline.filter(p => Math.abs(p.y - .62) < .02).map(p => Math.abs(p.x)));
  const lowerBout = Math.max(...outline.filter(p => p.y < .5).map(p => Math.abs(p.x)));
  assert.ok(waist < lowerBout * .7, 'curved body visibly narrows at the waist');
  const holeRay = new THREE.Raycaster(new THREE.Vector3(0, .645, -1), new THREE.Vector3(0, 0, 1));
  assert.equal(holeRay.intersectObject(body).length, 0, 'sound hole is cut through the front rather than painted on it');
  assert.ok(holeRay.intersectObject(guitar.getObjectByName('guitar-sound-hole')).length > 0, 'dark cavity is recessed behind the hole');
  const names = [];guitar.traverse(object => names.push(object.name));
  assert.equal(names.filter(name => name === 'guitar-string').length, 6);
  assert.equal(names.filter(name => name === 'guitar-tuning-peg').length, 6);
  assert.equal(names.filter(name => name === 'guitar-fret').length, 19);
  for (const name of ['guitar-rosette', 'guitar-bridge', 'guitar-saddle', 'guitar-edge-binding']) assert.ok(names.includes(name));
});

test('piano uses the A0–C8 88-key layout and has no black key across B/C or E/F', () => {
  const layout = pianoKeyLayout(), whites = layout.filter(key => key.white), blacks = layout.filter(key => !key.white);
  assert.equal(whites.length, 52);assert.equal(blacks.length, 36);
  assert.equal(whites[0].pitch, 'A');assert.equal(whites.at(-1).pitch, 'C');
  assert.ok(blacks.every(key => !['B#', 'E#'].includes(key.pitch)));
  const piano = buildRoomProps('music').getObjectByName('upright-piano'), objects = [];
  piano.traverse(object => objects.push(object));
  assert.equal(objects.filter(object => object.name === 'piano-white-key').length, 52);
  assert.equal(objects.filter(object => object.name === 'piano-black-key').length, 36);
  assert.equal(objects.filter(object => object.name === 'piano-pedal').length, 3);
  assert.equal(objects.filter(object => object.name === 'piano-front-leg').length, 2);
  for (const name of ['piano-lower-panel', 'piano-keybed-front-moulding', 'piano-score-ledge', 'piano-caster']) assert.ok(piano.getObjectByName(name));
});

test('music stand and piano score fronts face their seats and tilt together with the support', () => {
  const props = buildRoomProps('music');props.updateMatrixWorld(true);
  const positions = [['music-stand', new THREE.Vector3(-2.4, 1.2, 6.95)], ['upright-piano', new THREE.Vector3(2.68, 1.0, 7.35)]];
  for (const [name, seat] of positions) {
    const score = props.getObjectByName(name).getObjectByName('sheet-music-paper');
    const position = score.getWorldPosition(new THREE.Vector3());
    const front = new THREE.Vector3(0, 0, 1).applyQuaternion(score.getWorldQuaternion(new THREE.Quaternion()));
    assert.ok(front.dot(seat.sub(position).normalize()) > .8, `${name} printed front faces the player at the seat`);
  }
  const assembly = props.getObjectByName('tilted-score-tray');
  assert.equal(assembly.getObjectByName('score-tray').parent, assembly);
  assert.equal(assembly.getObjectByName('open-practice-score').parent, assembly);
  assert.ok(assembly.rotation.x > 0, 'upper edge tilts away from the seated player');
  assert.deepEqual(props.getObjectByName('upright-piano').position.toArray(), [3.38, 0, 7.35]);
  const stools = props.children.filter(child => child.name === 'music-stool');
  assert.ok(stools.some(stool => stool.position.x === 2.68 && stool.position.z === 7.35), 'student doll bench position is preserved');
});

test('original practice score draws dense notation on both bound pages without requiring a browser', () => {
  const calls = [];
  const context = new Proxy({}, {get(target, name) {return target[name] ?? ((...args) => calls.push({name, args}));}});
  drawPracticeScore(context);
  assert.ok(calls.filter(call => call.name === 'ellipse').length >= 384, 'both pages contain many noteheads and spiral loops');
  assert.ok(calls.filter(call => call.name === 'lineTo').length > 500, 'staves, stems, bars and beams are detailed');
  assert.ok(calls.filter(call => call.name === 'quadraticCurveTo').length >= 64, 'phrasing slurs span each measure');
  assert.ok(calls.some(call => call.name === 'fillText' && call.args[0] === 'Nocturne for an Empty School'));
  const canvas = {getContext: () => context};
  const texture = createScoreTexture({createCanvas: () => canvas});
  assert.equal(texture.image, canvas);assert.equal(canvas.width, SCORE_LAYOUT.width);assert.equal(canvas.height, SCORE_LAYOUT.height);
  assert.equal(createScoreTexture(), null, 'headless node builds remain safe');
  const grain = woodGrainTexture();assert.ok(grain.image.data.length > 0);
});

test('printed score reads left to right from each player seat in the reflected school scene', () => {
  const scene = new THREE.Scene();scene.scale.z = -1;
  const props = buildRoomProps('music');scene.add(props);scene.updateMatrixWorld(true);
  const seats = [['music-stand', [-2.4, 1.33, -6.95]], ['upright-piano', [2.68, 1.164, -7.35]]];
  for (const [name, seat] of seats) {
    const paper = props.getObjectByName(name).getObjectByName('sheet-music-paper');
    const camera = new THREE.PerspectiveCamera(70, 16 / 9, .05, 100);
    camera.position.set(...seat);camera.lookAt(paper.getWorldPosition(new THREE.Vector3()));camera.updateMatrixWorld(true);
    const position = paper.geometry.attributes.position, uv = paper.geometry.attributes.uv;
    const screen = [];
    for (let i = 0; i < position.count; i++) {
      const point = new THREE.Vector3().fromBufferAttribute(position, i).applyMatrix4(paper.matrixWorld).project(camera);
      screen.push({x: point.x, y: point.y, u: uv.getX(i), v: uv.getY(i)});
    }
    const mean = (axis, field, value) => {
      const points = screen.filter(point => point[field] === value);
      return points.reduce((sum, point) => sum + point[axis], 0) / points.length;
    };
    assert.ok(mean('x', 'u', 0) < mean('x', 'u', 1), `${name}: left side of the texture projects to screen left`);
    assert.ok(mean('y', 'v', 1) > mean('y', 'v', 0), `${name}: title and upper staff remain above the lower staff`);
    assert.ok(screen.every(point => Number.isFinite(point.x) && Number.isFinite(point.y)));
  }
});
