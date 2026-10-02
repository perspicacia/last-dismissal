import * as THREE from './vendor/three.module.js';

// An original practice score, drawn locally: no downloaded score or image asset.
export const SCORE_LAYOUT = {width: 1024, height: 768, systems: 4, measures: 4, staves: 2};

function path(ctx, draw) {ctx.beginPath(); draw(); ctx.stroke();}
function treble(ctx, x, y, unit) {
  ctx.lineWidth = unit * .27;
  path(ctx, () => {
    ctx.moveTo(x + unit, y - unit * 3.2);
    ctx.bezierCurveTo(x + unit * 2.5, y - unit * 6, x - unit, y - unit * 4.4, x + unit * .35, y + unit * 1.2);
    ctx.bezierCurveTo(x + unit * 1.9, y + unit * 3.8, x + unit * 3.5, y + unit * .1, x + unit * 1.6, y - unit * 1.4);
    ctx.bezierCurveTo(x - unit * .9, y - unit * 3.6, x - unit * 1.1, y + unit * .7, x + unit * 1.3, y + unit * .45);
    ctx.bezierCurveTo(x + unit * 3.8, y, x + unit * 1.1, y - unit * 2.2, x + unit * .5, y - unit * .3);
    ctx.moveTo(x + unit * 1.2, y + unit * .2);
    ctx.bezierCurveTo(x + unit * 2.1, y + unit * 5, x + unit * .9, y + unit * 5.7, x - unit * .4, y + unit * 4.5);
  });
  ctx.beginPath();ctx.ellipse(x - unit * .2, y + unit * 4.25, unit * .62, unit * .42, -.4, 0, Math.PI * 2);ctx.fill();
}
function bass(ctx, x, y, unit) {
  ctx.lineWidth = unit * .3;
  path(ctx, () => {ctx.moveTo(x, y + unit * .1);ctx.bezierCurveTo(x + unit * 2.8, y - unit * 2.4, x + unit * 3, y + unit * 2, x - unit * .2, y + unit * 3.6);});
  for (const [dx, dy, radius] of [[.4, 0, .46], [3, -.6, .22], [3, .6, .22]]) {
    ctx.beginPath();ctx.arc(x + unit * dx, y + unit * dy, unit * radius, 0, Math.PI * 2);ctx.fill();
  }
}
function note(ctx, x, y, unit, up = true, open = false) {
  ctx.beginPath();ctx.ellipse(x, y, unit * .65, unit * .43, -.28, 0, Math.PI * 2);
  if (open) {ctx.lineWidth = unit * .16;ctx.stroke();} else ctx.fill();
  const stemX = x + (up ? 1 : -1) * unit * .56, endY = y + (up ? -1 : 1) * unit * 3.4;
  ctx.lineWidth = unit * .16;
  path(ctx, () => {ctx.moveTo(stemX, y);ctx.lineTo(stemX, endY);});
  return {x: stemX, y: endY};
}
export function drawPracticeScore(ctx, width = SCORE_LAYOUT.width, height = SCORE_LAYOUT.height) {
  const sx = width / SCORE_LAYOUT.width, sy = height / SCORE_LAYOUT.height;
  ctx.save();ctx.scale(sx, sy);
  ctx.fillStyle = '#ded9bf';ctx.fillRect(0, 0, 1024, 768);
  // Two lightly yellowed pages, with a darker fold and restrained paper texture.
  for (const x of [22, 528]) {
    ctx.fillStyle = '#ebe6d1';ctx.fillRect(x, 18, 474, 732);
    ctx.fillStyle = '#887b4930';ctx.fillRect(x, 18, 3, 732);
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = i % 3 ? '#79694005' : '#ffffff16';
      ctx.fillRect(x + (i * 97) % 469, 24 + (i * 79) % 714, 2 + i % 4, 1);
    }
  }
  ctx.fillStyle = '#25251f';ctx.strokeStyle = '#25251f';ctx.textAlign = 'center';
  ctx.font = 'italic 21px Georgia, serif';ctx.fillText('Nocturne for an Empty School', 266, 52);
  ctx.font = '14px Georgia, serif';ctx.fillText('Piano · Andante misterioso', 266, 78);
  ctx.font = 'italic 14px Georgia, serif';ctx.fillText('dolce, poco a poco', 772, 52);
  const unit = 6.5;
  for (let page = 0; page < 2; page++) for (let system = 0; system < SCORE_LAYOUT.systems; system++) {
    const left = 48 + page * 506, right = left + 420, top = 124 + system * 150;
    ctx.lineWidth = .8;
    for (let staff = 0; staff < 2; staff++) {
      const staffTop = top + staff * 62;
      for (let line = 0; line < 5; line++) path(ctx, () => {ctx.moveTo(left, staffTop + line * unit);ctx.lineTo(right, staffTop + line * unit);});
      if (staff === 0) treble(ctx, left + 8, staffTop + unit * 2, unit);
      else bass(ctx, left + 8, staffTop + unit, unit);
      ctx.font = 'bold 17px Georgia, serif';ctx.fillText('4', left + 38, staffTop + 11);ctx.fillText('4', left + 38, staffTop + 26);
      if (system === 0) {ctx.font = 'italic 16px Georgia, serif';ctx.fillText(staff ? 'p' : 'mp', left + 55, staffTop + 47);}
      for (let measure = 0; measure < SCORE_LAYOUT.measures; measure++) {
        const measureX = left + 52 + measure * 92;
        ctx.lineWidth = 1;
        path(ctx, () => {ctx.moveTo(measureX + 88, staffTop);ctx.lineTo(measureX + 88, staffTop + unit * 4);});
        const stems = [];
        for (let n = 0; n < 6; n++) {
          const x = measureX + 7 + n * 12;
          const pitch = (n * 3 + system + measure * 2 + page + staff * 2) % 9;
          const y = staffTop + (pitch * .5 - .5) * unit;
          const up = staff === 0;
          stems.push(note(ctx, x, y, unit, up, n === 5 && measure % 2 === 1));
          if (pitch === 0) {ctx.lineWidth = .7;path(ctx, () => {ctx.moveTo(x - 6, staffTop - unit * .5);ctx.lineTo(x + 6, staffTop - unit * .5);});}
          if (n === 2 && measure % 2 === 0) {ctx.font = '15px Georgia, serif';ctx.fillText('♯', x - 8, y + 3);}
        }
        ctx.lineWidth = 3.3;
        for (let pair = 0; pair < 2; pair++) path(ctx, () => {ctx.moveTo(stems[pair * 2].x, stems[pair * 2].y);ctx.lineTo(stems[pair * 2 + 1].x, stems[pair * 2 + 1].y);});
        ctx.lineWidth = .9;
        path(ctx, () => {ctx.moveTo(measureX + 5, staffTop - 13);ctx.quadraticCurveTo(measureX + 38, staffTop - 29, measureX + 78, staffTop - 13);});
      }
    }
    ctx.lineWidth = 1.4;
    path(ctx, () => {ctx.moveTo(left, top);ctx.lineTo(left, top + 88);ctx.moveTo(right, top);ctx.lineTo(right, top + 88);});
    ctx.font = '12px Georgia, serif';ctx.fillText(String(1 + page * 16 + system * 4), left + 5, top - 14);
    if (system === 2) {ctx.lineWidth = 1;path(ctx, () => {ctx.moveTo(left + 80, top + 51);ctx.lineTo(left + 193, top + 56);ctx.lineTo(left + 80, top + 61);});}
  }
  ctx.fillStyle = '#534b38';ctx.fillRect(503, 20, 17, 727);
  // Visible spiral loops along the shared binding.
  ctx.strokeStyle = '#242722';ctx.lineWidth = 3;
  for (let y = 38; y < 742; y += 27) {
    ctx.beginPath();ctx.ellipse(511, y, 11, 5, 0, 0, Math.PI * 2);ctx.stroke();
  }
  ctx.fillStyle = '#454235';ctx.font = '12px Georgia, serif';ctx.fillText('1', 266, 739);ctx.fillText('2', 772, 739);
  ctx.restore();
}

export function createScoreTexture({createCanvas} = {}) {
  const factory = createCanvas || (typeof document !== 'undefined' ? () => document.createElement('canvas') : null);
  if (!factory) return null;
  const canvas = factory();canvas.width = SCORE_LAYOUT.width;canvas.height = SCORE_LAYOUT.height;
  const context = canvas.getContext('2d');if (!context) return null;
  drawPracticeScore(context, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);texture.colorSpace = THREE.SRGBColorSpace;texture.anisotropy = 4;
  return texture;
}

export function buildOpenScore(width = .56, height = .4, options) {
  const book = new THREE.Group();book.name = 'open-practice-score';
  const texture = createScoreTexture(options);
  const paper = new THREE.MeshStandardMaterial({color: texture ? '#ffffff' : '#e5dfc9', map: texture, roughness: .94});
  const pages = new THREE.Mesh(new THREE.PlaneGeometry(width, height), paper);
  pages.name = 'sheet-music-paper';pages.rotation.y = Math.PI;pages.position.z = -.008;
  pages.userData = {...SCORE_LAYOUT, front: '-z', originalScore: true};book.add(pages);
  const backing = new THREE.Mesh(new THREE.BoxGeometry(width + .006, height + .004, .008), new THREE.MeshStandardMaterial({color: '#d4cbae', roughness: .95}));
  backing.name = 'score-page-stack';backing.position.z = .001;book.add(backing);
  return book;
}
