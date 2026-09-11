import { test } from 'node:test';
import assert from 'node:assert/strict';
import { softenCells, buildMaskSVG, maskAlpha, heatmapColor, topHotspots } from '../renderer.js';

const cell = (x, y, luma, extra = {}) => ({ x, y, w: 10, h: 10, luma, unmeasured: false, interactive: false, ...extra });

test('softenCells keeps only threshold-plus, measurable, non-interactive cells', () => {
  const cells = [
    cell(0, 0, 0.8),
    cell(1, 0, 0.4),
    cell(2, 0, 0.9, { interactive: true }),
    cell(3, 0, 0.95, { unmeasured: true }),
  ];
  const kept = softenCells(cells, 0.5);
  assert.deepEqual(kept.map((c) => c.x), [0]);
});

test('buildMaskSVG is pointer-events none and clamps strength', () => {
  const cells = [cell(0, 0, 0.8), cell(5, 5, 0.9)];
  const svg = buildMaskSVG(cells, 96, 54, 0.5, 2);
  assert.match(svg, /pointer-events:\s*none/);
  assert.ok(svg.includes('fill-opacity="0.85"'));
  assert.equal((svg.match(/<rect /g) || []).length, 2);
});

test('maskAlpha clamps to the safe band', () => {
  assert.equal(maskAlpha(0), 0.1);
  assert.equal(maskAlpha(0.35), 0.35);
  assert.equal(maskAlpha(99), 0.85);
});

test('heatmapColor returns rgb triples across the scale', () => {
  for (const luma of [0, 0.25, 0.5, 0.75, 1]) {
    const [r, g, b] = heatmapColor(luma);
    assert.ok(r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255);
  }
  assert.deepEqual(heatmapColor(0), [0, 0, 64]);
  assert.deepEqual(heatmapColor(1), [255, 40, 0]);
});

test('topHotspots sorts by luminance and excludes unmeasured', () => {
  const cells = [
    cell(0, 0, 0.5),
    cell(1, 0, 0.99, { unmeasured: true }),
    cell(2, 0, 0.7),
    cell(3, 0, 0.9),
  ];
  const top = topHotspots(cells, 0.4, 2);
  assert.deepEqual(top.map((t) => t.luma), [0.9, 0.7]);
  assert.equal(top[0].row, 1);
  assert.equal(top[0].col, 4);
});
