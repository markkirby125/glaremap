/**
 * GlareMap scanner — pure luminance scanning core.
 * No DOM writes, no network calls. Runs in browser (bookmarklet / lab page) and Node (tests).
 */

export const GRID_COLS = 96;
export const GRID_ROWS = 54;
export const MAX_ELEMENTS = 2000;

/** sRGB channel (0-255) → linear light (0-1). */
export function srgbChannelToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance from sRGB channels (0-255). */
export function luminanceFromRGB(r, g, b) {
  return (
    0.2126 * srgbChannelToLinear(r) +
    0.7152 * srgbChannelToLinear(g) +
    0.0722 * srgbChannelToLinear(b)
  );
}

/** Parse #rgb/#rrggbb or rgb()/rgba() into {r,g,b,a}. */
export function parseColor(str) {
  if (typeof str !== 'string') return null;
  const s = str.trim().toLowerCase();
  if (!s || s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };

  let m = s.match(/^#([0-9a-f]{3})$/);
  if (m) {
    const [r, g, b] = m[1].split('').map((h) => parseInt(h + h, 16));
    return { r, g, b, a: 1 };
  }
  m = s.match(/^#([0-9a-f]{6})$/);
  if (m) {
    const n = parseInt(m[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
  }
  m = s.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)$/);
  if (m) {
    let a = m[4] === undefined ? 1 : parseFloat(m[4]);
    if (m[4] && m[4].endsWith('%')) a /= 100;
    return {
      r: clampByte(parseFloat(m[1])),
      g: clampByte(parseFloat(m[2])),
      b: clampByte(parseFloat(m[3])),
      a: Math.min(1, Math.max(0, a)),
    };
  }
  return null;
}

function clampByte(v) {
  return Math.min(255, Math.max(0, Math.round(Number(v) || 0)));
}

/**
 * Worst-case WCAG relative luminance for a CSS color string.
 * Transparent/alpha colors are composited against white and black; the
 * higher luminance wins (glare = brightness worst case).
 */
export function colorToLuminance(str) {
  const c = parseColor(str);
  if (!c) return 0;
  if (c.a >= 1) return luminanceFromRGB(c.r, c.g, c.b);
  const ch = [c.r / 255, c.g / 255, c.b / 255];
  const overWhite = ch.map((v) => c.a * v + (1 - c.a) * 1);
  const overBlack = ch.map((v) => c.a * v + (1 - c.a) * 0);
  const lum = (rgb01) =>
    luminanceFromRGB(
      Math.round(rgb01[0] * 255),
      Math.round(rgb01[1] * 255),
      Math.round(rgb01[2] * 255),
    );
  return Math.max(lum(overWhite), lum(overBlack));
}

const INTERACTIVE = new Set(['a', 'button', 'input', 'select', 'textarea', 'label', 'summary', 'details', 'option', 'optgroup', 'fieldset', 'legend']);

export function isInteractive(el) {
  if (!el || !el.tagName) return false;
  const tag = el.tagName.toLowerCase();
  if (INTERACTIVE.has(tag)) return true;
  if (typeof el.getAttribute === 'function' && el.getAttribute('role')) {
    const role = el.getAttribute('role');
    if (/button|link|checkbox|radio|slider|switch|menuitem|tab|option/i.test(role)) return true;
  }
  return false;
}

const UNMEASURED = new Set(['img', 'video', 'svg', 'canvas', 'iframe', 'object', 'embed']);

export function isUnmeasured(el, style) {
  if (!el || !el.tagName) return false;
  const tag = el.tagName.toLowerCase();
  if (UNMEASURED.has(tag)) return true;
  if (style && style.backgroundImage) {
    const bg = String(style.backgroundImage);
    if (bg !== 'none' && /url\(|gradient\(/i.test(bg)) return true;
  }
  return false;
}

function isVisible(el, rect) {
  if (!rect || rect.width <= 0 || rect.height <= 0) return false;
  if (rect.bottom < 0 || rect.right < 0) return false;
  if (typeof el.getAttribute === 'function' && (el.getAttribute('hidden') !== null || el.getAttribute('aria-hidden') === 'true')) return false;
  return true;
}

/**
 * Scan a document into a luminance grid.
 * @param {object} doc - document-like object with querySelectorAll and defaultView.getComputedStyle
 * @param {object} [options]
 * @param {number} [options.maxElements=2000]
 * @param {number} [options.viewportWidth] - defaults to doc.defaultView.innerWidth || 1024
 * @param {number} [options.viewportHeight] - defaults to doc.defaultView.innerHeight || 768
 * @param {function} [options.scheduler] - async (task) => void; default runs task synchronously
 * @returns {Promise<{cells: Array<{x,y,w,h,luma,unmeasured,interactive}>, scanned: number, total: number}>}
 */
export async function scanDocument(doc, options = {}) {
  const maxElements = options.maxElements ?? MAX_ELEMENTS;
  const view = doc?.defaultView || {};
  const viewportWidth = options.viewportWidth ?? view.innerWidth ?? 1024;
  const viewportHeight = options.viewportHeight ?? view.innerHeight ?? 768;
  const cols = options.gridCols ?? GRID_COLS;
  const rows = options.gridRows ?? GRID_ROWS;
  const cellW = viewportWidth / cols;
  const cellH = viewportHeight / rows;

  const all = Array.from(doc.querySelectorAll('*'));
  const total = all.length;
  const scannedElements = all.slice(0, maxElements);

  const cells = new Array(cols * rows);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      cells[y * cols + x] = { x, y, w: cellW, h: cellH, luma: 0, unmeasured: false, interactive: false };
    }
  }

  const applyToCells = (rect, luma, unmeasured, interactive) => {
    const x0 = Math.max(0, Math.floor(rect.left / cellW));
    const x1 = Math.min(cols - 1, Math.floor((rect.left + rect.width) / cellW));
    const y0 = Math.max(0, Math.floor(rect.top / cellH));
    const y1 = Math.min(rows - 1, Math.floor((rect.top + rect.height) / cellH));
    if (x0 > x1 || y0 > y1) return;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const cell = cells[y * cols + x];
        if (unmeasured) cell.unmeasured = true;
        if (interactive) cell.interactive = true;
        if (!unmeasured && luma > cell.luma) cell.luma = luma;
      }
    }
  };

  const getComputedStyle = view.getComputedStyle
    ? (el) => view.getComputedStyle(el)
    : (el) => (el.style || {});

  const scheduler = options.scheduler ?? ((task) => { task(); return Promise.resolve(); });

  for (const el of scannedElements) {
    await scheduler(() => {
      const rect = typeof el.getBoundingClientRect === 'function' ? el.getBoundingClientRect() : null;
      if (!isVisible(el, rect)) return;
      const style = getComputedStyle(el) || {};
      const interactive = isInteractive(el);
      if (isUnmeasured(el, style)) {
        applyToCells(rect, 0, true, interactive);
        return;
      }
      const bgLuma = colorToLuminance(style.backgroundColor);
      const fgLuma = colorToLuminance(style.color);
      applyToCells(rect, Math.max(bgLuma, fgLuma), false, interactive);
    });
  }

  return { cells, scanned: scannedElements.length, total, cols, rows, viewportWidth, viewportHeight };
}
