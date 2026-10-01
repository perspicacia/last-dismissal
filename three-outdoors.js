import * as THREE from './vendor/three.module.js';

// Distances are world metres: the foreground path, yard and woodland occupy
// separate depths, so walking past the windows produces natural parallax.
export function buildOutdoors({ side = 'corridor' } = {}) {
  const group = new THREE.Group();
  group.name = `outdoors-${side}`;
  const materials = new Map();
  const mat = (color, extra = {}) => {
    const key = `${color}:${JSON.stringify(extra)}`;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: .9, ...extra }));
    return materials.get(key);
  };
  const cube = new THREE.BoxGeometry(1, 1, 1);
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 8);
  const ball = new THREE.IcosahedronGeometry(1, 2);
  const box = (x, y, z, sx, sy, sz, color, extra = {}) => {
    const mesh = new THREE.Mesh(cube, mat(color, extra));
    mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz);
    mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh); return mesh;
  };
  const rod = (a, b, radius, color, extra = {}) => {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
    const mesh = new THREE.Mesh(cylinder, mat(color, extra));
    mesh.position.copy(start).add(end).multiplyScalar(.5);
    mesh.scale.set(radius, start.distanceTo(end), radius);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
    mesh.castShadow = true; group.add(mesh); return mesh;
  };
  let seed = side === 'classroom' ? 271 : 913;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const trunks = [], branches = [], leaves = [];
  const tree = (x, z, height) => {
    const crown = height * .65, trunkHeight = height * .69;
    trunks.push({ p: [x, -.28 + trunkHeight / 2, z], s: [.11 + height * .015, trunkHeight, .11 + height * .015] });
    for (let k = 0; k < 5; k++) {
      const angle = random() * Math.PI * 2;
      const start = new THREE.Vector3(x, height * (.32 + k * .065), z);
      const end = new THREE.Vector3(x + Math.cos(angle) * height * .18, crown + (random() - .5) * height * .22, z + Math.sin(angle) * height * .18);
      branches.push({ p: start.clone().add(end).multiplyScalar(.5).toArray(), s: [.045, start.distanceTo(end), .045], q: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize()) });
    }
    // Offset and squash clusters instead of using one spherical crown per tree.
    for (let k = 0; k < 10; k++) {
      const angle = random() * Math.PI * 2, radius = random() * height * .23;
      const size = height * (.13 + random() * .1);
      leaves.push({ p: [x + Math.cos(angle) * radius, crown + (random() - .2) * height * .32, z + Math.sin(angle) * radius], s: [size * (1 + random() * .45), size * (.65 + random() * .6), size], color: new THREE.Color().setHSL(.27 + random() * .07, .19 + random() * .18, .17 + random() * .12) });
    }
  };
  const flush = (geometry, color, items, name) => {
    const mesh = new THREE.InstancedMesh(geometry, mat(color), items.length);
    const transform = new THREE.Object3D();
    items.forEach((item, i) => {
      transform.position.set(...item.p); transform.scale.set(...item.s);
      transform.quaternion.copy(item.q || new THREE.Quaternion()); transform.updateMatrix();
      mesh.setMatrixAt(i, transform.matrix);
      if (item.color) mesh.setColorAt(i, item.color);
    });
    mesh.name = name; mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh);
  };
  const lamp = (x, z, direction = -1) => {
    rod([x, -.3, z], [x, 4.1, z], .065, '#7c8787', { metalness: .65, roughness: .38 });
    rod([x, 3.45, z], [x + direction * 1.15, 4.05, z], .045, '#7c8787', { metalness: .65 });
    box(x, -.2, z, .24, .18, .24, '#6e7675');
    const fixture = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8), mat('#b2b7ad', { metalness: .45, roughness: .35 }));
    fixture.position.set(x + direction * 1.15, 4.03, z); fixture.scale.set(.43, .075, .19); group.add(fixture);
    box(x + direction * 1.15, 3.98, z, .53, .02, .19, '#ffe6b8', { emissive: '#ffc989', emissiveIntensity: 1.3 });
    const light = new THREE.SpotLight('#ffd9a0', 26, 17, .72, .7, 1.4);
    light.position.set(x + direction * 1.15, 3.9, z);
    light.target.position.set(x + direction * .75, -.25, z); group.add(light, light.target);
    // Lighting remains visible, but avoids allocating another shadow map per pole.
    light.castShadow = false;
  };
  const fence = (x, z0, z1) => {
    for (let z = z0; z <= z1; z += 2.5) rod([x, -.3, z], [x, 1.1, z], .035, '#72807c', { metalness: .45 });
    for (const y of [.15, .65, 1.06]) rod([x, y, z0], [x, y, z1], .018, '#72807c', { metalness: .45 });
  };

  if (side === 'classroom') {
    box(-34, -.45, 7, 59, .3, 76, '#40523d').name = 'school-yard-ground';
    box(-10, -.285, 6, 9, .03, 38, '#84837a'); // paved terrace next to the classroom
    box(-19, -.29, 5, 9, .035, 15, '#806746').name = 'basketball-court';
    const line = (x, z, sx, sz) => box(x, -.263, z, sx, .009, sz, '#c5c2a8');
    for (const x of [-23.35, -14.65]) line(x, 5, .055, 14.5);
    for (const z of [-2.25, 12.25]) line(-19, z, 8.7, .055);
    line(-19, 5, 8.7, .045);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.3, 1.35, 40), mat('#c5c2a8', { side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(-19, -.253, 5); group.add(ring);
    for (const z of [-1.8, 11.8]) {
      const sign = z < 5 ? 1 : -1;
      rod([-19, -.3, z], [-19, 3.05, z], .055, '#919895', { metalness: .6 });
      rod([-19, 2.8, z], [-19, 3.05, z + sign * .4], .04, '#919895');
      box(-19, 3.08, z + sign * .4, 1.55, .95, .06, '#d1d0b8');
      box(-19, 3.05, z + sign * .445, .5, .36, .02, '#728181');
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(.24, .025, 6, 24), mat('#aa6040'));
      hoop.rotation.x = Math.PI / 2; hoop.position.set(-19, 2.8, z + sign * .73); group.add(hoop);
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2;
        rod([-19 + Math.cos(a) * .23, 2.79, z + sign * .73 + Math.sin(a) * .23], [-19 + Math.cos(a) * .15, 2.39, z + sign * .73 + Math.sin(a) * .15], .008, '#b6b6a5');
      }
    }
    box(-11, 1.1, -4, 3.5, 2.8, 3.1, '#85827a').name = 'storage-shed';
    const roof = box(-11, 2.63, -4, 3.8, .14, 3.5, '#475557'); roof.rotation.z = -.1;
    box(-9.235, .82, -4, .035, 2.1, 1.2, '#4c605c');
    for (const z of [1.8, 7.2]) rod([-28, -.3, z], [-28, 2.05, z], .045, '#c4c4af');
    rod([-28, 2.05, 1.8], [-28, 2.05, 7.2], .045, '#c4c4af');
    // Rear goal frame and sparse net, oriented towards the school windows.
    for (const z of [1.8, 7.2]) {
      rod([-28, 2.05, z], [-29.3, .05, z], .025, '#919a8e');
      rod([-28, -.27, z], [-29.3, -.27, z], .025, '#919a8e');
    }
    for (let z = 1.8; z <= 7.2; z += .45) rod([-29.3, .02, z], [-28, 2.03, z], .006, '#7a8b7b');
    lamp(-11.5, 13, 1); lamp(-10, -8, 1);
    fence(-31, -22, 30);
    for (let i = 0; i < 38; i++) tree(-34 - random() * 23, -24 + random() * 59, 5 + random() * 6);
    tree(-12.5, 18, 6.8); tree(-16, -13, 7.5); tree(-23, 18, 7);
  } else {
    box(36, -.45, 12, 65, .3, 100, '#3e513c').name = 'woodland-ground';
    box(7, -.28, 12, 3.8, .035, 72, '#777c75').name = 'walkway';
    for (const x of [5.05, 8.95]) box(x, -.23, 12, .14, .12, 72, '#999e8e');
    // Non-repeating paving joints run continuously alongside the school.
    for (let z = -22; z < 48; z += 2.4) box(7, -.252, z, 3.65, .01, .035, '#59665f');
    fence(10, -23, 48);
    lamp(8.25, 6.8, -1); lamp(8.25, 24, -1); lamp(8.25, -12, -1);
    tree(13.3, -3, 7.5); tree(12.6, 11.7, 6.2); tree(15.2, 21.3, 8.2);
    for (let i = 0; i < 50; i++) tree(19 + random() * 37, -30 + random() * 85, 5 + random() * 7);
    // Low planting allows the distant ghost and forest to remain readable.
    for (let i = 0; i < 24; i++) {
      const shrub = new THREE.Mesh(ball, mat(i % 2 ? '#536546' : '#455c43'));
      shrub.position.set(10.65 + random() * .55, .14, -21 + i * 2.8);
      shrub.scale.set(.6, .43 + random() * .18, .95); shrub.castShadow = true; group.add(shrub);
    }
  }
  flush(cylinder, '#655e4e', trunks, 'tree-trunks');
  flush(cylinder, '#645c4f', branches, 'tree-branches');
  flush(ball, '#ffffff', leaves, 'tree-canopies');
  group.userData.side = side;
  group.userData.treeCount = trunks.length;
  return group;
}
