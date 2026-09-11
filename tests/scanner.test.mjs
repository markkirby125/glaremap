import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  srgbChannelToLinear,
  luminanceFromRGB,
  parseColor,
  colorToLuminance,
  scanDocument,
  GRID_COLS,
  GRID_ROWS,
} from '../scanner.js';

function close(actual, expected, tol = 1e-3) {
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `expected ${actual} within ${tol} of ${expected}`,
  );
}

test('sRGB channel decode matches hand-computed values', () => {
  assert.equal(srgbChannelToLinear(0), 0);
  assert.equal(srgbChannelToLinear(255), 1);
  close(srgbChannelToLinear(128), 0.2158, 1e-3);
});

test('WCAG relative luminance weights are exact', () => {
  close(luminanceFromRGB(255, 0, 0), 0.2126, 1e-4);
  close(luminanceFromRGB(0, 255, 0), 0.7152, 1e-4);
  close(luminanceFromRGB(0, 0, 255), 0.0722, 1e-4);
  close(luminanceFromRGB(255, 255, 255), 1, 1e-6);
  close(luminanceFromRGB(0, 0, 0), 0, 1e-6);
});

test('parseColor handles hex and rgb()/rgba() forms', () => {
  assert.deepEqual(parseColor('#fff'), { r: 255, g: 255, b: 255, a: 1 });
  assert.deepEqual(parseColor('#102030'), { r: 16, g: 32, b: 48, a: 1 });
  assert.deepEqual(parseColor('rgb(255, 0, 128)'), { r: 255, g: 0, b: 128, a: 1 });
  assert.deepEqual(parseColor('rgba(10, 20, 30, 0.5)'), { r: 10, g: 20, b: 30, a: 0.5 });
  assert.equal(parseColor('not-a-color'), null);
  assert.deepEqual(parseColor('transparent'), { r: 0, g: 0, b: 0, a: 0 });
});

test('colorToLuminance returns worst-case composited luminance', () => {
  assert.equal(colorToLuminance('#fff'), 1);
  assert.equal(colorToLuminance('#000'), 0);
  // Half-transparent white over white is still full white → worst case 1.
  assert.equal(colorToLuminance('rgba(255, 255, 255, 0.5)'), 1);
  assert.equal(colorToLuminance('nonsense'), 0);
});

// --- tiny DOM stub ---------------------------------------------------------

function makeEl(tag, { rect, style = {}, attrs = {} } = {}) {
  return {
    tagName: tag.toUpperCase(),
    style,
    _rect: rect,
    getBoundingClientRect: () => rect,
    getAttribute: (name) => (name in attrs ? attrs[name] : null),
  };
}

function makeDoc(elements, viewport = { w: 960, h: 540 }) {
  const view = {
    innerWidth: viewport.w,
    innerHeight: viewport.h,
    getComputedStyle: (el) => el.style,
  };
  return { querySelectorAll: () => elements, defaultView: view };
}

test('scanDocument aggregates luminance into the grid', async () => {
  const w = 960;
  const h = 540;
  const white = makeEl('div', {
    rect: { left: 0, top: 0, width: w / 2, height: h, right: w / 2, bottom: h },
    style: { backgroundColor: 'rgb(255, 255, 255)', color: 'rgb(0, 0, 0)' },
  });
  const black = makeEl('div', {
    rect: { left: w / 2, top: 0, width: w / 2, height: h, right: w, bottom: h },
    style: { backgroundColor: 'rgb(0, 0, 0)', color: 'rgb(0, 0, 0)' },
  });
  const { cells, scanned, total } = await scanDocument(makeDoc([white, black], { w, h }));
  assert.equal(scanned, 2);
  assert.equal(total, 2);
  assert.equal(cells.length, GRID_COLS * GRID_ROWS);
  const left = cells[0];
  const right = cells[GRID_COLS - 1];
  assert.equal(left.luma, 1);
  assert.equal(right.luma, 0);
});

test('scanDocument enforces the 2,000-element cap', async () => {
  const many = Array.from({ length: 2500 }, (_, i) =>
    makeEl('span', {
      rect: { left: 0, top: 0, width: 10, height: 10, right: 10, bottom: 10 },
      style: { backgroundColor: 'rgb(255,255,255)', color: 'rgb(0,0,0)' },
    }),
  );
  const { scanned, total } = await scanDocument(makeDoc(many, { w: 960, h: 540 }));
  assert.equal(total, 2500);
  assert.equal(scanned, 2000);
});

test('image/video/gradient regions are unmeasured and never scored', async () => {
  const img = makeEl('img', {
    rect: { left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100 },
    style: { backgroundColor: 'rgb(255, 255, 255)', color: 'rgb(0,0,0)' },
  });
  const { cells } = await scanDocument(makeDoc([img], { w: 960, h: 540 }));
  const cell = cells[0];
  assert.equal(cell.unmeasured, true);
  assert.equal(cell.luma, 0);
});

test('interactive elements are flagged on their cells', async () => {
  const link = makeEl('a', {
    rect: { left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100 },
    style: { backgroundColor: 'rgb(255, 255, 255)', color: 'rgb(0,0,0)' },
  });
  const { cells } = await scanDocument(makeDoc([link], { w: 960, h: 540 }));
  assert.equal(cells[0].interactive, true);
});
