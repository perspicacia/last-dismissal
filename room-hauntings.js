import * as THREE from './vendor/three.module.js';

// Metres in the school's unreflected scene coordinates. These props never
// participate in movement, rabbit discovery, or a game-over decision.
export const ROOM_HAUNTINGS = Object.freeze({
  classroom31: {ball: {x: -6.7, z: 4.7, radius: .20, floorY: -.265}},
  classroom: {corner: {x: 3.72, z: 1.05}},
});
const clamp = value => Math.max(0, Math.min(1, value));

export function windowGaze(player, target, {range = 4, cosine = .78, windowX = -4.4} = {}) {
  if (!player || !target || ![player.x, player.z, player.angle, target.x, target.z].every(Number.isFinite)) return false;
  if (player.x < windowX || Math.abs(player.x - windowX) > range) return false;
  const dx = target.x - player.x, dz = target.z - player.z, distance = Math.hypot(dx, dz);
  return distance > .001 && (dx * Math.sin(player.angle) + dz * Math.cos(player.angle)) / distance >= cosine;
}

// A ballistic arc keeps the bounce quick at impact and slow at its apex.
export function bouncePose(time, {reduced = false, radius = .20, floorY = -.265} = {}) {
  const phase = ((Math.max(0, Number.isFinite(time) ? time : 0) % 1.12) / 1.12);
  const rise = reduced ? 0 : 4 * 1.62 * phase * (1 - phase);
  return {height: floorY + radius + rise, rise, rotation: reduced ? 0 : time * .28, shadowScale: 1 + rise * .44, shadowOpacity: .44 - rise * .12};
}

function mat(color, extra = {}) {return new THREE.MeshStandardMaterial({color, roughness: .92, ...extra});}
function ellipsoid(parent, position, scale, material, name) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), material);
  mesh.position.set(...position); mesh.scale.set(...scale); mesh.castShadow = true; mesh.receiveShadow = true;
  if (name) mesh.name = name; parent.add(mesh); return mesh;
}
function rod(parent, points, radius, material) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, radius, 7, false), material);
  mesh.castShadow = true; parent.add(mesh); return mesh;
}

export function buildRoomHauntings(kind) {
  const group = new THREE.Group(); group.name = `room-hauntings-${kind}`;
  group.userData.kind = kind; group.userData.ballTime = 0;
  const config = ROOM_HAUNTINGS[kind];
  if (config?.ball) {
    const p = config.ball, ball = new THREE.Group(); ball.name = 'unattended-bouncing-ball';
    ball.position.set(p.x, p.floorY + p.radius, p.z);
    ellipsoid(ball, [0, 0, 0], [p.radius, p.radius, p.radius], mat('#91603c', {roughness: .99}), 'basketball-surface');
    const seam = mat('#241e17');
    for (const rotation of [[0, 0, 0], [Math.PI / 2, 0, 0], [0, Math.PI / 2, 0]]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(p.radius + .001, .004, 5, 48), seam);
      ring.rotation.set(...rotation); ball.add(ring);
    }
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(.25, 32), new THREE.MeshBasicMaterial({color: '#071116', transparent: true, opacity: .44, depthWrite: false}));
    shadow.name = 'ball-ground-shadow'; shadow.position.set(p.x, p.floorY + .004, p.z); shadow.rotation.x = -Math.PI / 2;
    group.add(ball, shadow); Object.assign(group.userData, {ball, shadow, ballConfig: p});
  }
  if (config?.corner) {
    const p = config.corner, figure = new THREE.Group(); figure.name = 'crouching-corner-shadow';
    figure.position.set(p.x, 0, p.z); figure.rotation.y = -1.4;
    const cloth = mat('#15201d'), skin = mat('#242e29'), hair = mat('#101714');
    ellipsoid(figure, [0, .38, 0], [.23, .39, .23], cloth, 'corner-shadow-body');
    ellipsoid(figure, [0, .66, .13], [.135, .18, .13], hair, 'corner-shadow-head');
    for (const side of [-1, 1]) {
      ellipsoid(figure, [side * .23, .16, .13], [.12, .17, .16], cloth);
      rod(figure, [[side * .14, .56, .08], [side * .22, .34, .26], [side * .30, .08, .40]], .038, skin);
      ellipsoid(figure, [side * .30, .07, .41], [.053, .025, .082], skin);
      for (let finger = 0; finger < 3; finger++) rod(figure, [[side * .30 + (finger - 1) * .026, .055, .44], [side * .30 + (finger - 1) * .030, .035, .55]], .009, skin);
      const eye = ellipsoid(figure, [side * .046, .674, .251], [.013, .008, .003], new THREE.MeshBasicMaterial({color: '#89917b'}), 'corner-shadow-eye');
      eye.castShadow = false;
    }
    for (let i = 0; i < 9; i++) {
      const x = -.14 + i * .035;
      rod(figure, [[x * .60, .78, .13], [x, .65, .247], [x * .98, .48 - (i % 3) * .022, .235]], .009, hair);
    }
    group.add(figure); group.userData.corner = figure;
  }
  return group;
}

export function updateRoomHauntings(group, {player, time = 0, dt = 1 / 60, reduced = false, active = true} = {}) {
  const data = group.userData;
  let ballActive = false, ballHeight = null;
  if (data.ball) {
    ballActive = Boolean(active && !reduced && windowGaze(player, data.ballConfig));
    if (!active) data.ballTime = 0;
    else if (ballActive) data.ballTime += Math.max(0, Math.min(.1, Number.isFinite(dt) ? dt : 0));
    const pose = bouncePose(data.ballTime, {...data.ballConfig, reduced});
    data.ball.position.y = pose.height; data.ball.rotation.z = pose.rotation;
    data.shadow.scale.setScalar(pose.shadowScale); data.shadow.material.opacity = pose.shadowOpacity;
    ballHeight = pose.height;
  }
  return {ballActive, ballHeight, cornerVisible: Boolean(active && data.corner), time};
}

export function ghostSmileAmount(player, config, {active = true} = {}) {
  return active && windowGaze(player, config, {range: 2.2, cosine: .88}) ? 1 : 0;
}

// Existing full-body asset: mouth centre is u=.506,v=.173. The untextured
// mouth shape is billboarded independently, so it never stretches the photo.
export function createGhostSmile(config) {
  const group = new THREE.Group(); group.name = 'window-ghost-smile'; group.visible = false;
  group.position.set(config.x, config.y, config.z);
  const mouth = new THREE.Group(); mouth.name = 'ghost-smile-mouth';
  mouth.position.set(config.height * 2 / 3 * .006, config.height * (.5 - .173), .018); group.add(mouth);
  const shape = new THREE.Shape();
  shape.moveTo(-.048, .021); shape.bezierCurveTo(-.024, -.001, .024, -.001, .048, .021);
  shape.bezierCurveTo(.04, -.020, .021, -.034, 0, -.035); shape.bezierCurveTo(-.021, -.034, -.040, -.020, -.048, .021);
  const black = new THREE.MeshBasicMaterial({color: '#100c0c', side: THREE.DoubleSide, transparent: true, opacity: 0, depthWrite: false});
  const opening = new THREE.Mesh(new THREE.ShapeGeometry(shape, 20), black); opening.name = 'ghost-smile-opening'; mouth.add(opening);
  const teeth = [];
  for (let i = 0; i < 7; i++) {
    const x = -.0315 + i * .0105, top = .006 + Math.abs(x) * .18;
    const toothShape = new THREE.Shape(); toothShape.moveTo(x - .0042, top); toothShape.lineTo(x + .0041, top);
    toothShape.lineTo(x + .0032, top - .011 - (i % 3) * .002); toothShape.lineTo(x - .0031, top - .011); toothShape.closePath();
    const tooth = new THREE.Mesh(new THREE.ShapeGeometry(toothShape), new THREE.MeshBasicMaterial({color: i % 2 ? '#aeb29c' : '#c1c3ab', side: THREE.DoubleSide, transparent: true, opacity: 0, depthWrite: false}));
    tooth.position.z = .001; mouth.add(tooth); teeth.push(tooth);
  }
  mouth.scale.setScalar(config.height);
  Object.assign(group.userData, {amount: 0, mouth, opening, teeth});
  return group;
}

export function updateGhostSmile(overlay, ghost, player, config, {dt = 1 / 60, reduced = false, active = true, camera = null} = {}) {
  const data = overlay.userData, target = ghostSmileAmount(player, config, {active});
  const step = 1 - Math.exp(-Math.max(0, Math.min(.1, Number.isFinite(dt) ? dt : 0)) * 5);
  data.amount = !active ? 0 : reduced ? target : data.amount + (target - data.amount) * step;
  const amount = clamp(data.amount);
  overlay.visible = amount > .02;
  const tilt = reduced ? 0 : amount * .12;
  if (ghost?.material) ghost.material.rotation = tilt;
  overlay.position.set(config.x, config.y, config.z);
  if (camera && ghost) {
    // Sprite vertices are formed in camera space, after the scene reflection.
    // Give the mouth the same complete billboard basis (including pitch), then
    // convert that world matrix back through its possibly reflected parent.
    const world = new THREE.Matrix4().extractRotation(camera.matrixWorld);
    world.setPosition(ghost.getWorldPosition(new THREE.Vector3()));
    world.multiply(new THREE.Matrix4().makeRotationZ(tilt));
    if (overlay.parent) {
      overlay.parent.updateWorldMatrix(true, false);
      overlay.matrix.copy(overlay.parent.matrixWorld).invert().multiply(world);
    } else overlay.matrix.copy(world);
    overlay.matrixAutoUpdate = false;
    overlay.matrixWorldNeedsUpdate = true;
  } else {
    overlay.matrixAutoUpdate = true;
    if (player) overlay.rotation.set(0, Math.atan2(player.x - config.x, player.z - config.z), 0);
    overlay.rotateZ(tilt);
  }
  data.mouth.scale.set(config.height * (.5 + amount * .5), config.height * (.22 + amount * .78), config.height);
  data.opening.material.opacity = amount;
  for (const tooth of data.teeth) tooth.material.opacity = amount * .8;
  return amount;
}
