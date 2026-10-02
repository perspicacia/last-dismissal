import * as THREE from './vendor/three.module.js';
import {buildAcousticGuitar, buildUprightPiano} from './music-instruments.js?v=music-ghost-polish-2';
import {buildOpenScore} from './music-sheet.js?v=music-ghost-polish-2';

// Feet stay within these envelopes; the central inspection aisle remains clear.
export const ROOM_BLOCKERS = {
  music: [
    {x: 3.15, z: 7.35, width: 1.35, depth: 2.7},
    {x: -2.65, z: 4.8, width: 1.95, depth: 1.7},
    {x: -2.4, z: 7.4, width: 1.15, depth: 1.75},
    {x: 3.55, z: 3.1, width: .85, depth: 1.05},
  ],
  dance: [
    {x: -4, z: 5.5, width: .6, depth: 6.2},
    {x: -3.3, z: 8.8, width: .65, depth: .65},
    {x: 3.3, z: 8.8, width: .65, depth: .65},
  ],
};

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({color, roughness: .65, ...extra});
function block(parent, name, position, size, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.name = name; mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true;
  parent.add(mesh); return mesh;
}
function rod(parent, name, a, b, radius, material) {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), direction = end.clone().sub(start);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 12), material);
  mesh.name = name; mesh.position.copy(start.clone().add(end).multiplyScalar(.5));
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function group(parent, name, position = [0, 0, 0]) {
  const result = new THREE.Group(); result.name = name; result.position.set(...position); parent.add(result); return result;
}
const metal = () => mat('#929e99', {metalness: .7, roughness: .38});
function stool(parent, x, z, wood, steel) {
  const seat = group(parent, 'music-stool', [x, 0, z]);
  block(seat, 'stool-seat', [0, .48, 0], [.65, .09, .42], wood);
  for (const dx of [-.25, .25]) for (const dz of [-.14, .14]) rod(seat, 'stool-leg', [dx, .03, dz], [dx, .44, dz], .025, steel);
  return seat;
}
function music(parent) {
  const wood = mat('#6e3e26', {roughness: .4}), steel = metal(), ebony = mat('#181e1d');
  const piano = buildUprightPiano();piano.position.set(3.38, 0, 7.35);piano.rotation.y = Math.PI / 2;parent.add(piano);
  const bench = stool(parent, 2.68, 7.35, wood, steel); bench.rotation.y = Math.PI / 2;

  const stand = group(parent, 'music-stand', [-2.4, 0, 7.8]);
  rod(stand, 'stand-post', [0, .05, 0], [0, 1.2, 0], .022, steel);
  for (const angle of [0, 2.1, 4.2]) rod(stand, 'stand-foot', [0, .12, 0], [Math.sin(angle) * .3, .035, Math.cos(angle) * .3], .017, steel);
  const scoreAssembly = group(stand, 'tilted-score-tray', [0, 1.33, 0]);scoreAssembly.rotation.x = .20;
  block(scoreAssembly, 'score-tray', [0, 0, .012], [.7, .5, .025], ebony);
  block(scoreAssembly, 'score-tray-lip', [0, -.25, -.015], [.7, .025, .08], ebony);
  scoreAssembly.add(buildOpenScore());stool(parent, -2.4, 6.95, wood, steel);

  const drums = group(parent, 'drum-kit', [-2.65, 0, 4.8]);
  const shell = mat('#68372d'), skin = mat('#b6b8aa');
  function drum(x, y, z, radius, length, horizontal = false) {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 24), [shell, skin, skin]);
    body.name = 'drum-shell'; body.position.set(x, y, z); if (horizontal) body.rotation.x = Math.PI / 2;
    body.castShadow = true; body.receiveShadow = true; drums.add(body);
    for (const edge of [-1, 1]) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, .015, 6, 24), steel); rim.name = 'drum-rim';
      if (horizontal) rim.position.set(x, y, z + edge * length / 2);
      else {rim.rotation.x = Math.PI / 2; rim.position.set(x, y + edge * length / 2, z);}
      drums.add(rim);
    }
  }
  drum(0, .41, .12, .38, .42, true); drum(-.4, .74, -.15, .22, .2); drum(.18, .89, .05, .2, .23);
  for (const x of [-.65, .53]) {
    rod(drums, 'cymbal-stand', [x, .04, .15], [x, 1.25, .15], .016, steel);
    const cymbal = new THREE.Mesh(new THREE.ConeGeometry(.28, .035, 24), mat('#b49a52', {metalness: .65, roughness: .4}));
    cymbal.name = 'cymbal'; cymbal.position.set(x, 1.26, .15); drums.add(cymbal);
  }
  const guitar = buildAcousticGuitar();guitar.position.set(3.55, .12, 3.1);guitar.rotation.z = -.12;parent.add(guitar);
  const guitarStand = group(parent, 'guitar-floor-stand', [3.55, 0, 3.1]);
  rod(guitarStand, 'guitar-stand-back', [0, .04, .09], [0, .78, .09], .015, ebony);
  for (const x of [-.15, .15]) rod(guitarStand, 'guitar-stand-cradle', [x, .30, .09], [x, .30, -.09], .014, ebony);
  for (const [x, z] of [[-.22, -.14], [.22, -.14], [0, .25]]) rod(guitarStand, 'guitar-stand-foot', [0, .07, .09], [x, .02, z], .014, ebony);
}
function dance(parent) {
  const steel = metal(), frame = mat('#53605e'), glass = mat('#819b9c', {metalness: .82, roughness: .21});
  // Stylized reflective panels, not a live camera mirror: no false duplicated characters.
  for (let i = 0; i < 4; i++) {
    const panel = group(parent, 'dance-mirror-panel', [4.22, 1.68, 3.1 + i * 1.45]);
    block(panel, 'mirror-frame', [0, 0, 0], [.1, 2.15, 1.4], frame);
    block(panel, 'mirror-glass', [-.06, 0, 0], [.015, 2.04, 1.29], glass);
    const glint = block(panel, 'mirror-light-streak', [-.071, .27, -.24], [.006, 1.7, .027], mat('#b4c8c5', {transparent: true, opacity: .35, depthWrite: false}));
    glint.rotation.x = -.28; glint.castShadow = false;
  }
  const barre = group(parent, 'dance-barre');
  for (const z of [2.6, 5.4, 8.5]) {
    rod(barre, 'barre-upright', [-4, .03, z], [-4, 1.15, z], .025, steel);
    rod(barre, 'barre-bracket', [-4, .85, z], [-4.28, .85, z], .025, steel);
  }
  for (const y of [.73, 1.13]) rod(barre, 'wooden-practice-bar', [-4, y, 2.4], [-4, y, 8.6], .041, mat('#aa8e5f'));
  for (const x of [-3.3, 3.3]) {
    const speaker = group(parent, 'dance-speaker', [x, 0, 8.8]);
    block(speaker, 'speaker-cabinet', [0, .52, 0], [.58, 1.04, .5], mat('#1d2727'));
    for (const [y, r] of [[.4, .18], [.78, .1]]) {
      const cone = new THREE.Mesh(new THREE.CylinderGeometry(r, r * .85, .035, 24), mat('#475452', {roughness: .85}));
      cone.name = 'speaker-cone'; cone.rotation.x = Math.PI / 2; cone.position.set(0, y, -.27); speaker.add(cone);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(r * .35, 12, 8), mat('#161e1d')); cap.name = 'speaker-dust-cap'; cap.position.set(0, y, -.285); speaker.add(cap);
    }
  }
  const tape = mat('#b7b8a0', {roughness: .95});
  for (const x of [-1.8, 0, 1.8]) for (const z of [3.3, 5.2, 7.1]) {
    const mark = group(parent, 'dance-floor-mark', [x, .006, z]);
    block(mark, 'floor-tape', [0, 0, 0], [.34, .004, .025], tape).castShadow = false;
    block(mark, 'floor-tape', [0, 0, 0], [.025, .004, .2], tape).castShadow = false;
  }
}
export function buildRoomProps(kind) {
  const props = new THREE.Group(); props.name = `${kind}-room-props`;
  if (kind === 'music') music(props);
  else if (kind === 'dance') dance(props);
  else throw new RangeError(`Unknown specialist room: ${kind}`);
  return props;
}
