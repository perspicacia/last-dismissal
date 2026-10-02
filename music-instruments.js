import * as THREE from './vendor/three.module.js';
import {buildOpenScore} from './music-sheet.js';

const material = (color, options = {}) => new THREE.MeshStandardMaterial({color, roughness: .48, ...options});
function mesh(parent, name, geometry, mat, position = [0, 0, 0]) {
  const object = new THREE.Mesh(geometry, mat);object.name = name;object.position.set(...position);
  object.castShadow = true;object.receiveShadow = true;parent.add(object);return object;
}
const box = (parent, name, position, size, mat) => mesh(parent, name, new THREE.BoxGeometry(...size), mat, position);
function rod(parent, name, a, b, radius, mat) {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), delta = end.clone().sub(start);
  const object = mesh(parent, name, new THREE.CylinderGeometry(radius, radius, delta.length(), 8), mat);
  object.position.copy(start.add(end).multiplyScalar(.5));object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());return object;
}

export function woodGrainTexture(size = 128) {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const drift = 2 * Math.sin(y * .045) + Math.sin(y * .16 + x * .07);
    const grain = Math.sin((x + drift) * 1.4) * 8 + Math.sin(x * .25 + y * .006) * 11;
    const pore = ((x * 73 + y * 151) % 31) / 31 * 5;
    const offset = (y * size + x) * 4;
    data[offset] = 185 + grain - pore;data[offset + 1] = 146 + grain * .72 - pore;data[offset + 2] = 100 + grain * .46 - pore;data[offset + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, size, size);texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;texture.needsUpdate = true;return texture;
}
function timber(color) {
  const grain = woodGrainTexture();return material(color, {map: grain, bumpMap: grain, bumpScale: .0025, roughness: .36});
}

export function guitarOutline() {
  const shape = new THREE.Shape();shape.moveTo(0, .19);
  shape.bezierCurveTo(-.18, .19, -.29, .26, -.27, .42);
  shape.bezierCurveTo(-.26, .51, -.13, .55, -.14, .62);
  shape.bezierCurveTo(-.15, .69, -.24, .71, -.20, .80);
  shape.bezierCurveTo(-.17, .87, -.08, .89, 0, .885);
  shape.bezierCurveTo(.08, .89, .17, .87, .20, .80);
  shape.bezierCurveTo(.24, .71, .15, .69, .14, .62);
  shape.bezierCurveTo(.13, .55, .26, .51, .27, .42);
  shape.bezierCurveTo(.29, .26, .18, .19, 0, .19);
  const hole = new THREE.Path();hole.absarc(0, .645, .073, 0, Math.PI * 2, true);shape.holes.push(hole);
  return shape;
}
export function buildAcousticGuitar() {
  const guitar = new THREE.Group();guitar.name = 'acoustic-guitar';guitar.userData.front = '-z';
  const face = timber('#e0b271'), sides = timber('#714324'), darkWood = material('#37251b'), metal = material('#c3c3a4', {metalness: .76, roughness: .29});
  const bodyGeometry = new THREE.ExtrudeGeometry(guitarOutline(), {depth: .122, bevelEnabled: true, bevelThickness: .008, bevelSize: .005, bevelSegments: 3, curveSegments: 30});
  bodyGeometry.translate(0, 0, -.061);
  mesh(guitar, 'guitar-body', bodyGeometry, [face, sides]);
  const outline = guitarOutline();outline.holes = [];
  const binding = new THREE.Line(new THREE.BufferGeometry().setFromPoints(outline.getPoints(100).map(p => new THREE.Vector3(p.x, p.y, -.071))), new THREE.LineBasicMaterial({color: '#d4ba8b'}));
  binding.name = 'guitar-edge-binding';guitar.add(binding);
  mesh(guitar, 'guitar-sound-hole', new THREE.CircleGeometry(.072, 40), material('#100d0a'), [0, .645, .018]).rotation.y = Math.PI;
  for (const [radius, color] of [[.078, '#d2bc88'], [.083, '#513723'], [.088, '#d6bd82']]) {
    const ring = mesh(guitar, 'guitar-rosette', new THREE.TorusGeometry(radius, .0016, 5, 48), material(color), [0, .645, -.071]);ring.rotation.y = Math.PI;
  }
  box(guitar, 'guitar-neck', [0, 1.118, -.048], [.071, .555, .063], sides);
  box(guitar, 'guitar-fretboard', [0, 1.051, -.083], [.077, .668, .016], darkWood);
  for (let fret = 1; fret <= 19; fret++) {
    const y = 1.383 - .99 * (1 - Math.pow(2, -fret / 12));
    rod(guitar, 'guitar-fret', [-.036, y, -.094], [.036, y, -.094], .0015, metal);
    if ([3, 5, 7, 9, 12, 15, 17].includes(fret)) {
      mesh(guitar, 'guitar-fret-marker', new THREE.CircleGeometry(.0035, 8), material('#cbbf9e'), [0, y + .014, -.0945]).rotation.y = Math.PI;
    }
  }
  const head = box(guitar, 'guitar-head', [0, 1.464, .026], [.106, .187, .052], sides);head.rotation.x = -.10;
  box(guitar, 'guitar-nut', [0, 1.386, -.083], [.08, .006, .019], material('#d2c8a3'));
  box(guitar, 'guitar-bridge', [0, .402, -.079], [.17, .052, .022], darkWood);
  box(guitar, 'guitar-saddle', [0, .418, -.092], [.112, .005, .006], material('#dbd0ae'));
  for (let i = 0; i < 6; i++) {
    const x = -.023 + i * .0092;
    rod(guitar, 'guitar-string', [x * 1.55, .415, -.100], [x, 1.39, -.100], .00075 + (5 - i) * .00008, metal);
    mesh(guitar, 'guitar-bridge-pin', new THREE.SphereGeometry(.0028, 6, 4), material('#d0be94'), [x * 1.55, .39, -.093]);
    const side = i < 3 ? -1 : 1, y = 1.423 + i % 3 * .047;
    rod(guitar, 'guitar-head-string', [x, 1.39, -.100], [side * .026, y, -.006], .00075, metal);
    rod(guitar, 'guitar-tuning-shaft', [side * .026, y, .026], [side * .079, y, .026], .0055, metal);
    const peg = mesh(guitar, 'guitar-tuning-peg', new THREE.SphereGeometry(.014, 10, 6), material('#242521'), [side * .083, y, .026]);peg.scale.set(1, .7, .5);
  }
  const pickguard = new THREE.Shape();pickguard.moveTo(.04, .59);pickguard.bezierCurveTo(.08, .56, .17, .59, .16, .50);pickguard.bezierCurveTo(.15, .44, .08, .46, .06, .49);pickguard.lineTo(.04, .59);
  mesh(guitar, 'guitar-pickguard', new THREE.ShapeGeometry(pickguard), material('#55341f', {side: THREE.DoubleSide}), [0, 0, -.072]);
  return guitar;
}

// A0–C8: 52 white keys and 36 black keys, including the E/F and B/C gaps.
export function pianoKeyLayout() {
  const keys = [], pitchNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G'], width = 2.056 / 52;
  for (let i = 0; i < 52; i++) {
    const x = -1.028 + width * (i + .5);keys.push({white: true, x, pitch: pitchNames[i % 7], width: width - .0012});
    if (i < 51 && ![1, 4].includes(i % 7)) keys.push({white: false, x: x + width / 2, pitch: `${pitchNames[i % 7]}#`, width: width * .58});
  }
  return keys;
}
export function buildUprightPiano() {
  const piano = new THREE.Group();piano.name = 'upright-piano';piano.userData.front = '-z';
  const wood = timber('#996e48'), dark = material('#342619'), ebony = material('#171916', {roughness: .28}), ivory = material('#e8e3ca', {roughness: .34});
  const brass = material('#bc9f63', {metalness: .76, roughness: .36});
  box(piano, 'piano-body', [0, .75, .16], [2.35, 1.17, .50], wood);
  box(piano, 'piano-top', [0, 1.36, .16], [2.43, .062, .58], wood);
  box(piano, 'piano-bottom-plinth', [0, .12, .16], [2.37, .08, .54], wood);
  box(piano, 'piano-upper-panel', [0, 1.09, -.10], [2.13, .40, .05], wood);
  box(piano, 'piano-upper-panel-inset', [0, 1.11, -.129], [1.98, .25, .010], dark);
  box(piano, 'piano-upper-panel-veneer', [0, 1.11, -.137], [1.945, .22, .008], wood);
  box(piano, 'piano-lower-panel', [0, .46, -.104], [2.11, .46, .038], wood);
  for (const x of [-1.116, 1.116]) {
    box(piano, 'piano-side-pilaster', [x, .70, -.12], [.088, 1.15, .08], wood);
    box(piano, 'piano-cheek-block', [x, .842, -.346], [.145, .19, .43], wood);
    box(piano, 'piano-front-leg', [x, .41, -.435], [.116, .68, .128], wood);
    box(piano, 'piano-leg-foot', [x, .07, -.435], [.15, .06, .18], wood);
  }
  box(piano, 'piano-keybed', [0, .759, -.345], [2.36, .085, .46], wood);
  box(piano, 'piano-keybed-front-moulding', [0, .784, -.581], [2.23, .078, .042], dark);
  box(piano, 'piano-fallboard', [0, .928, -.20], [2.08, .035, .10], wood);
  for (const key of pianoKeyLayout()) {
    const object = box(piano, key.white ? 'piano-white-key' : 'piano-black-key', [key.x, key.white ? .830 : .867, key.white ? -.401 : -.308], [key.width, key.white ? .034 : .048, key.white ? .327 : .177], key.white ? ivory : ebony);
    object.userData.pitch = key.pitch;
  }
  box(piano, 'piano-score-ledge', [0, .987, -.185], [.90, .026, .13], wood);
  const score = buildOpenScore(.82, .335);score.position.set(0, 1.164, -.161);score.rotation.x = .10;piano.add(score);
  for (const x of [-.15, 0, .15]) {
    rod(piano, 'piano-pedal-stem', [x, .117, -.12], [x, .07, -.38], .014, brass);
    const pedal = box(piano, 'piano-pedal', [x, .069, -.40], [.06, .028, .13], brass);pedal.rotation.x = -.10;
  }
  // Hardware at the lid and plinth catches the corridor light without a new lamp.
  for (const x of [-.82, .82]) box(piano, 'piano-lid-hinge', [x, 1.347, -.144], [.067, .014, .023], brass);
  for (const x of [-1.12, 1.12]) for (const z of [.30, -.435]) {
    const caster = mesh(piano, 'piano-caster', new THREE.CylinderGeometry(.031, .031, .036, 10), dark, [x, .038, z]);caster.rotation.z = Math.PI / 2;
  }
  return piano;
}
