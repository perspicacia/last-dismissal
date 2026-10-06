import {SCHOOL_TONE} from './school-tone.js?v=shadow-tone-1';
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
  const fallback = new THREE.IcosahedronGeometry(1, 1);
  const positions = fallback.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const variation = .75 + Math.sin(positions.getX(i) * 34 + positions.getY(i) * 51 + positions.getZ(i) * 23) * .24;
    positions.setXYZ(i, positions.getX(i) * variation, positions.getY(i) * variation, positions.getZ(i) * variation);
  }
  fallback.computeVertexNormals();
  const leafTexture = makeFoliageTexture();
  const leafGeometry = leafTexture ? new THREE.PlaneGeometry(2, 2) : fallback;
  const leafMaterial = new THREE.MeshStandardMaterial({
    color: '#ffffff', map: leafTexture, alphaTest: .45, side: THREE.DoubleSide,
    roughness: 1, metalness: 0,
  });
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
    // Three intersecting twig-and-leaf cards give each cluster a porous silhouette
    // from any viewing direction, rather than a smooth solid spherical crown.
    for (let k = 0; k < 10; k++) {
      const angle = random() * Math.PI * 2, radius = random() * height * .23;
      const size = height * (.13 + random() * .1);
      const p = [x + Math.cos(angle) * radius, crown + (random() - .2) * height * .32, z + Math.sin(angle) * radius];
      const scale = [size * (1 + random() * .45), size * (.65 + random() * .6), size];
      const color = new THREE.Color().setHSL(.27 + random() * .07, .19 + random() * .18, .17 + random() * .12);
      for (let face = 0; face < (leafTexture ? 3 : 1); face++) {
        leaves.push({ p, s: scale, color, q: new THREE.Quaternion().setFromEuler(new THREE.Euler((face - 1) * .32, angle + face * Math.PI / 3, Math.sin(angle) * .17)) });
      }
    }
  };
  const flush = (geometry, color, items, name, material = mat(color)) => {
    const mesh = new THREE.InstancedMesh(geometry, material, items.length);
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
    box(x + direction * 1.15, 3.98, z, .53, .02, .19, '#ffe6b8', { emissive: SCHOOL_TONE.lampEmission, emissiveIntensity: 1.3 });
    const light = new THREE.SpotLight(SCHOOL_TONE.lamp, 26, 17, .72, .7, 1.4);
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
      const p = [10.65 + random() * .55, .2, -21 + i * 2.8];
      const scale = [.75, .43 + random() * .18, .95];
      for (let face = 0; face < (leafTexture ? 3 : 1); face++) leaves.push({
        p, s: scale, color: new THREE.Color(i % 2 ? '#536546' : '#455c43'),
        q: new THREE.Quaternion().setFromEuler(new THREE.Euler(.2, face * Math.PI / 3, 0)),
      });
    }
  }
  flush(cylinder, '#655e4e', trunks, 'tree-trunks');
  flush(cylinder, '#645c4f', branches, 'tree-branches');
  flush(leafGeometry, '#ffffff', leaves, 'tree-canopies', leafMaterial);
  group.userData.side = side;
  group.userData.treeCount = trunks.length;
  return group;
}


// A locally generated, transparent twig cluster. No image download, external
// texture or random layout change is needed. Node tests use jagged geometry.
function makeFoliageTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
  const c = canvas.getContext('2d');
  if (!c) return null;
  let seed = 401;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const leaf = (x, y, angle, length) => {
    c.save(); c.translate(x, y); c.rotate(angle);
    const brightness = Math.floor(140 + random() * 110);
    c.fillStyle = `rgb(${brightness},${brightness},${Math.floor(brightness * .9)})`;
    c.beginPath(); c.moveTo(-length / 2, 0);
    c.bezierCurveTo(-length * .15, -length * .36, length * .25, -length * .22, length / 2, 0);
    c.bezierCurveTo(length * .16, length * .31, -length * .25, length * .24, -length / 2, 0);
    c.fill(); c.restore();
  };
  for (let branch = 0; branch < 19; branch++) {
    const angle = branch / 19 * Math.PI * 2 + (random() - .5) * .4;
    const length = 115 + random() * 109;
    const originX = 256 + (random() - .5) * 88, originY = 256 + (random() - .5) * 75;
    const dx = Math.cos(angle), dy = Math.sin(angle);
    c.strokeStyle = '#95877a'; c.lineWidth = 1.3 + random() * 2;
    c.beginPath(); c.moveTo(originX, originY); c.lineTo(originX + dx * length, originY + dy * length); c.stroke();
    for (let twig = 1; twig <= 8; twig++) {
      const t = twig / 9, px = originX + dx * length * t, py = originY + dy * length * t;
      for (const side of [-1, 1]) {
        const twigAngle = angle + side * (.5 + random() * .8), twigLength = 20 + random() * 37;
        const tx = Math.cos(twigAngle), ty = Math.sin(twigAngle);
        c.lineWidth = .9; c.beginPath(); c.moveTo(px, py); c.lineTo(px + tx * twigLength, py + ty * twigLength); c.stroke();
        for (let i = 1; i <= 4; i++) {
          const u = i / 4;
          leaf(px + tx * twigLength * u + (random() - .5) * 8, py + ty * twigLength * u + (random() - .5) * 8,
            twigAngle + (i % 2 ? .6 : -.6), 8 + random() * 13);
        }
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
