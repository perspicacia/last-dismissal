import test from 'node:test';
import assert from 'node:assert/strict';
import {GHOST_SMILE_DESIGN, ghostUpperLip, ghostLowerLip, drawGhostSmile} from '../ghost-smile-shape.js';
import {createGhostSmile, updateGhostSmile} from '../room-hauntings.js';

test('위아래 치아는 입 곡선에 붙고 검은 입 안에 끝을 남긴다', () => {
  const overlay = createGhostSmile({x: 0, y: 1, z: 0, height: 2.35});
  const teeth = overlay.userData.teeth;
  assert.ok(teeth.some(t => t.userData.smileTooth.row === 'upper'));
  assert.ok(teeth.some(t => t.userData.smileTooth.row === 'lower'));
  const lengths = new Set();
  for (const tooth of teeth) {
    const d = tooth.userData.smileTooth, vertices = tooth.geometry.attributes.position;
    const lip = d.row === 'upper' ? ghostUpperLip : ghostLowerLip;
    assert.ok(Math.abs(d.root - lip(d.x)) < .001);
    assert.ok(d.tip[1] < ghostUpperLip(d.tip[0]) - .002);
    assert.ok(d.tip[1] > ghostLowerLip(d.tip[0]) + .002);
    lengths.add(d.length.toFixed(5));
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i), y = vertices.getY(i);
      assert.ok(Number.isFinite(x) && Number.isFinite(y));
      assert.ok(y <= ghostUpperLip(x) + .001 && y >= ghostLowerLip(x) - .001);
    }
    const colors = tooth.geometry.attributes.color.array;
    assert.ok(Math.max(...colors) - Math.min(...colors) > .15, '치아 뿌리와 끝에는 음영 차이가 있다');
  }
  assert.ok(lengths.size > 5, '길이가 모두 같은 막대 치아가 아니다');
  assert.equal(teeth.length, GHOST_SMILE_DESIGN.teeth.length);
});

test('Canvas 미소도 사각 막대 없이 같은 곡선과 양쪽 치아를 그린다', () => {
  let fills = 0, curves = 0, saves = 0, restores = 0;
  const gradient = {addColorStop(){}};
  const context = {save(){saves++;}, restore(){restores++;}, scale(){}, beginPath(){},
    moveTo(){}, lineTo(){}, closePath(){}, bezierCurveTo(){curves++;}, stroke(){},
    fill(){fills++;}, createLinearGradient(){return gradient;}};
  drawGhostSmile(context);
  assert.equal(fills, GHOST_SMILE_DESIGN.teeth.length + 1);
  assert.ok(curves > 3 * GHOST_SMILE_DESIGN.teeth.length);
  assert.equal(saves, restores);
});

test('게임 종료는 치아와 입가의 모든 레이어를 함께 초기화한다', () => {
  const config = {x: -6.1, y: 1.3, z: 5.25, height: 2.35};
  const player = {x: -3.2, z: 5.25, angle: -Math.PI / 2};
  const overlay = createGhostSmile(config);
  updateGhostSmile(overlay, null, player, config, {reduced: true});
  assert.ok(overlay.userData.shading.every(s => s.material.opacity > 0));
  updateGhostSmile(overlay, null, player, config, {active: false});
  assert.equal(overlay.visible, false);
  assert.ok([...overlay.userData.teeth, ...overlay.userData.shading, overlay.userData.opening].every(s => s.material.opacity === 0));
});
