/**
 * GlareMap floating panel — bookmarklet runtime UI.
 * Expects scanner.js and renderer.js to be concatenated into the same bundle
 * (their exported functions are free identifiers here after build.js strips `export`).
 * Native controls only, keyboard accessible, reduced-motion safe (no animation).
 */

const PANEL_ID = 'glaremap-panel';

function makePanel() {
  const root = document.createElement('div');
  root.id = PANEL_ID;
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', 'GlareMap controls');
  root.innerHTML = `
    <div class="glaremap-title">
      <strong>GlareMap</strong>
      <span class="glaremap-note">relative brightness estimate, not a glare measurement</span>
    </div>
    <label for="glaremap-threshold">Threshold
      <input type="range" id="glaremap-threshold" min="0" max="1" step="0.01" value="0.6">
      <output id="glaremap-threshold-out">0.60</output>
    </label>
    <label for="glaremap-strength">Strength
      <input type="range" id="glaremap-strength" min="0.1" max="0.85" step="0.05" value="0.35">
      <output id="glaremap-strength-out">0.35</output>
    </label>
    <div class="glaremap-actions">
      <button type="button" id="glaremap-scan">Scan again</button>
      <button type="button" id="glaremap-off">Off</button>
    </div>
    <p id="glaremap-status" role="status" aria-live="polite"></p>
    <details>
      <summary>Top hotspots</summary>
      <p id="glaremap-hotspots">Scan to list hotspots.</p>
    </details>
  `;
  return root;
}

function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    #${PANEL_ID} {
      position: fixed; right: 12px; top: 12px; z-index: 2147483647;
      width: min(320px, calc(100vw - 24px));
      background: #101214; color: #e8e6e1; border: 2px solid #d6d0c4;
      border-radius: 8px; padding: 12px; font: 15px/1.45 system-ui, sans-serif;
    }
    #${PANEL_ID} label { display: block; margin: 8px 0; }
    #${PANEL_ID} input[type="range"] { width: 100%; min-height: 44px; }
    #${PANEL_ID} button { min-height: 44px; min-width: 44px; margin: 4px 8px 4px 0; padding: 8px 12px; }
    #${PANEL_ID} .glaremap-note { display: block; font-size: 13px; opacity: 0.85; }
    #${PANEL_ID} :focus-visible { outline: 2px solid #ffd24a; outline-offset: 2px; }
    @media (prefers-reduced-motion: no-preference) {
      #${PANEL_ID} { transition: opacity 150ms ease; }
    }
  `;
  document.head.appendChild(style);
  return style;
}

/** Returns true when styles were applied, false when CSP blocked them. */
export function stylesInjected() {
  return Boolean(document.getElementById(PANEL_ID)?.parentElement);
}

export function createGlareMapPanel({ onScan, onOff, onThreshold, onStrength } = {}) {
  const panel = makePanel();
  document.documentElement.appendChild(panel);

  const threshold = panel.querySelector('#glaremap-threshold');
  const thresholdOut = panel.querySelector('#glaremap-threshold-out');
  const strength = panel.querySelector('#glaremap-strength');
  const strengthOut = panel.querySelector('#glaremap-strength-out');
  const scanBtn = panel.querySelector('#glaremap-scan');
  const offBtn = panel.querySelector('#glaremap-off');
  const status = panel.querySelector('#glaremap-status');
  const hotspots = panel.querySelector('#glaremap-hotspots');

  const setStatus = (text) => {
    status.textContent = text;
  };
  const setHotspots = (list) => {
    hotspots.textContent = list.length
      ? list.map((h) => `row ${h.row}, col ${h.col} (${h.luma})`).join(' · ')
      : 'No hotspots above the threshold.';
  };

  threshold.addEventListener('input', () => {
    thresholdOut.textContent = Number(threshold.value).toFixed(2);
    onThreshold?.(Number(threshold.value));
  });
  strength.addEventListener('input', () => {
    strengthOut.textContent = Number(strength.value).toFixed(2);
    onStrength?.(Number(strength.value));
  });
  scanBtn.addEventListener('click', () => onScan?.());
  offBtn.addEventListener('click', () => onOff?.());

  // Escape turns GlareMap off (non-modal; never traps focus).
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onOff?.();
    }
  });

  return { panel, threshold, strength, setStatus, setHotspots, off: () => onOff?.() };
}

/** Insert or replace the softening mask. Returns the mask SVG element. */
export function applyMaskSVG(svgString) {
  clearMaskSVG();
  const wrapper = document.createElement('div');
  wrapper.id = 'glaremap-mask';
  wrapper.innerHTML = svgString;
  document.documentElement.appendChild(wrapper);
  return wrapper;
}

export function clearMaskSVG() {
  document.getElementById('glaremap-mask')?.remove();
}

/** CSP fallback: a plain, unstyled message that works even when injected styles are blocked. */
export function showCspFallback() {
  const pre = document.createElement('pre');
  pre.id = 'glaremap-csp-fallback';
  pre.setAttribute('role', 'alert');
  pre.textContent =
    'GlareMap: this site blocks injected styles, so the softening mask cannot be applied here.';
  document.documentElement.appendChild(pre);
  return pre;
}
