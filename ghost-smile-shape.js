// Face-local dimensions, as a fraction of the original full-body image height.
// Both renderers use these curves, keeping teeth attached to the mouth rather
// than drawing a second, disconnected row across the photograph.
export const GHOST_MOUTH_HALF_WIDTH = .047;
export const ghostUpperLip = x => -.002 + .019 * (x / GHOST_MOUTH_HALF_WIDTH) ** 2;
export const ghostLowerLip = x => -.030 + .047 * (x / GHOST_MOUTH_HALF_WIDTH) ** 2;

function lipPath(upper) {
  const w = GHOST_MOUTH_HALF_WIDTH;
  return [['M', -w, .017], ['C', -w / 3, upper ? -.008333 : -.045667,
    w / 3, upper ? -.008333 : -.045667, w, .017]];
}
const mouth = [...lipPath(true), ['C', GHOST_MOUTH_HALF_WIDTH / 3, -.045667,
  -GHOST_MOUTH_HALF_WIDTH / 3, -.045667, -GHOST_MOUTH_HALF_WIDTH, .017], ['Z']];

function tooth(row, i, count) {
  const direction = row === 'upper' ? -1 : 1;
  const x = (i - (count - 1) / 2) * .0081 + (row === 'lower' ? .0006 : 0);
  const gap = ghostUpperLip(x) - ghostLowerLip(x);
  const width = .0062 + ((i * 7 + count) % 4) * .00032;
  const length = gap * (row === 'upper' ? .39 + (i % 3) * .032 : .29 + (i % 3) * .027);
  const lip = row === 'upper' ? ghostUpperLip : ghostLowerLip;
  const root = lip(x) + direction * .0005;
  const tip = [x + (i % 2 ? -.0010 : .0008), root + direction * length];
  const left = [x - width / 2, lip(x - width / 2) + direction * .0003];
  const right = [x + width / 2, lip(x + width / 2) + direction * .0003];
  const path = [['M', ...left], ['C', left[0] + width * .14, left[1] + direction * length * .40,
    tip[0] - width * .08, tip[1] - direction * length * .23, ...tip],
  ['C', tip[0] + width * .25, tip[1] - direction * length * .18,
    right[0] - width * .12, right[1] + direction * length * .40, ...right],
  ['C', x + width * .18, root, x - width * .18, root, ...left], ['Z']];
  return {row, x, root, tip, width, length, direction, path,
    // Side teeth recede into the lip shadow instead of shining like white bars.
    rootColor: '#635c4a', enamelColor: i % 3 === 0 ? '#c8c1a6' : '#b5b29b'};
}

export const GHOST_SMILE_DESIGN = Object.freeze({
  mouth, upperLip: lipPath(true), lowerLip: lipPath(false),
  teeth: [...Array.from({length: 9}, (_, i) => tooth('upper', i, 9)),
    ...Array.from({length: 8}, (_, i) => tooth('lower', i, 8))],
});

export function traceGhostPath(target, path) {
  for (const [op, ...coordinates] of path) {
    if (op === 'M') target.moveTo(...coordinates);
    else if (op === 'L') target.lineTo(...coordinates);
    else if (op === 'C') target.bezierCurveTo(...coordinates);
    else target.closePath();
  }
}

// The caller supplies the same face-local scale as Three.js. Invert only y,
// since Canvas has downward-positive screen coordinates.
export function drawGhostSmile(context) {
  const d = GHOST_SMILE_DESIGN;
  context.save(); context.scale(1, -1);
  for (const [width, alpha] of [[.007, .12], [.004, .24]]) {
    context.strokeStyle = `rgba(75,57,46,${alpha})`; context.lineWidth = width;
    context.lineJoin = 'round'; context.beginPath(); traceGhostPath(context, d.mouth); context.stroke();
  }
  const cavity = context.createLinearGradient(0, .013, 0, -.030);
  cavity.addColorStop(0, '#261b19'); cavity.addColorStop(.4, '#100f0f'); cavity.addColorStop(1, '#201918');
  context.fillStyle = cavity; context.beginPath(); traceGhostPath(context, d.mouth); context.fill();
  context.strokeStyle = '#43312c'; context.lineWidth = .0028;
  for (const lip of [d.upperLip, d.lowerLip]) {context.beginPath(); traceGhostPath(context, lip); context.stroke();}
  for (const t of d.teeth) {
    const enamel = context.createLinearGradient(t.x, t.root, t.x, t.tip[1]);
    enamel.addColorStop(0, t.rootColor); enamel.addColorStop(.35, t.enamelColor); enamel.addColorStop(1, '#d1ccb5');
    context.fillStyle = enamel; context.beginPath(); traceGhostPath(context, t.path); context.fill();
  }
  context.restore();
}
