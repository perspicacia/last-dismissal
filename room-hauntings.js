import * as THREE from './vendor/three.module.js';
import {GHOST_SMILE_DESIGN, traceGhostPath} from './ghost-smile-shape.js';

// Metres in the school's unreflected scene coordinates. These props never
// participate in movement, rabbit discovery, or a game-over decision.
export const ROOM_HAUNTINGS = Object.freeze({
  classroom31: {ball: {x: -6.7, z: 5.25, radius: .20, floorY: -.265}},
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
  const shape = new THREE.Shape(); traceGhostPath(shape, GHOST_SMILE_DESIGN.mouth);
  const makeMaterial = extra => new THREE.MeshBasicMaterial({side: THREE.DoubleSide, transparent: true, opacity: 0, depthWrite: false, ...extra});
  const openingGeometry = new THREE.ShapeGeometry(shape, 32);
  const openingColors = [];
  for (let i = 0; i < openingGeometry.attributes.position.count; i++) {
    const y = openingGeometry.attributes.position.getY(i), edge = Math.min(1, Math.abs(y + .009) / .022);
    const color = new THREE.Color('#0f0e0e').lerp(new THREE.Color('#291d1a'), edge);
    openingColors.push(color.r, color.g, color.b);
  }
  openingGeometry.setAttribute('color', new THREE.Float32BufferAttribute(openingColors, 3));
  const opening = new THREE.Mesh(openingGeometry, makeMaterial({vertexColors: true}));
  opening.name = 'ghost-smile-opening'; mouth.add(opening);
  const shading = [];
  for (const [radius, strength] of [[.0035, .12], [.002, .24]]) {
    const outline = new THREE.Path(); traceGhostPath(outline, GHOST_SMILE_DESIGN.mouth);
    const curve = new THREE.CatmullRomCurve3(outline.getPoints(48).map(p => new THREE.Vector3(p.x, p.y, -.0006)), true);
    const lip = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, radius, 6, true), makeMaterial({color: '#4b392e'}));
    lip.name = 'ghost-smile-lip-shadow'; lip.userData.opacityScale = strength;
    mouth.add(lip); shading.push(lip);
  }
  for (const path of [GHOST_SMILE_DESIGN.upperLip, GHOST_SMILE_DESIGN.lowerLip]) {
    const edge = new THREE.Path(); traceGhostPath(edge, path);
    const curve = new THREE.CatmullRomCurve3(edge.getPoints(48).map(p => new THREE.Vector3(p.x, p.y, .0007)));
    const gum = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, .0014, 5, false), makeMaterial({color: '#43312c'}));
    gum.name = 'ghost-smile-gum-shadow'; gum.userData.opacityScale = .82;
    mouth.add(gum); shading.push(gum);
  }
  const teeth = [];
  for (const design of GHOST_SMILE_DESIGN.teeth) {
    const toothShape = new THREE.Shape(); traceGhostPath(toothShape, design.path);
    const geometry = new THREE.ShapeGeometry(toothShape, 10), colors = [];
    const root = new THREE.Color(design.rootColor), enamel = new THREE.Color(design.enamelColor), tip = new THREE.Color('#d1ccb5');
    for (let i = 0; i < geometry.attributes.position.count; i++) {
      const y = geometry.attributes.position.getY(i), progress = clamp((y - design.root) * design.direction / design.length);
      const color = progress < .35 ? root.clone().lerp(enamel, progress / .35) : enamel.clone().lerp(tip, (progress - .35) / .65);
      colors.push(color.r, color.g, color.b);
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const tooth = new THREE.Mesh(geometry, makeMaterial({vertexColors: true}));
    tooth.name = `ghost-smile-${design.row}-tooth`; tooth.userData.smileTooth = design;
    tooth.position.z = .0016; mouth.add(tooth); teeth.push(tooth);
  }
  mouth.scale.setScalar(config.height);
  Object.assign(group.userData, {amount: 0, mouth, opening, teeth, shading});
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
  data.mouth.scale.set(config.height * (.5 + amount * .22), config.height * (.22 + amount * .44), config.height);
  data.opening.material.opacity = amount;
  for (const tooth of data.teeth) tooth.material.opacity = amount * .96;
  for (const shade of data.shading) shade.material.opacity = amount * shade.userData.opacityScale;
  return amount;
}
