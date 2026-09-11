/**
 * GlareMap bookmarklet entry point.
 * Concatenated with scanner.js, renderer.js, and panel.js by build.js;
 * references those modules' functions as free identifiers inside one IIFE.
 */
(async function glareMapBookmarklet() {
  if (window.__glaremapState) {
    window.__glaremapState.off();
    return;
  }

  const style = injectStyles();
  // Strict CSP blocks injected <style>; Chrome/Firefox leave style.sheet null.
  const cspBlocked = !style.sheet;
  if (cspBlocked) {
    showCspFallback();
    return;
  }

  const state = { panel: null, observer: null, scanning: false };
  window.__glaremapState = state;

  const scheduler = (task) =>
    new Promise((resolve) => {
      const run = () => resolve(task());
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(run, { timeout: 200 });
      } else {
        setTimeout(run, 0);
      }
    });

  async function scan() {
    if (state.scanning) return;
    state.scanning = true;
    try {
      const result = await scanDocument(document, { scheduler });
      const threshold = Number(state.panel.threshold.value);
      const strength = Number(state.panel.strength.value);
      const svg = buildMaskSVG(result.cells, result.cols, result.rows, threshold, strength);
      applyMaskSVG(svg);
      const hotspots = topHotspots(result.cells, threshold, 5);
      const softened = softenCells(result.cells, threshold).length;
      state.panel.setHotspots(hotspots);
      state.panel.setStatus(
        `Scanned ${result.scanned} elements — softening ${softened} cell(s). ` +
          'Image/video/gradient regions are marked unmeasured and never scored.',
      );
    } finally {
      state.scanning = false;
    }
  }

  function off() {
    if (state.observer) state.observer.disconnect();
    clearMaskSVG();
    document.getElementById('glaremap-panel')?.remove();
    document.getElementById('glaremap-csp-fallback')?.remove();
    window.__glaremapState = null;
  }

  state.panel = createGlareMapPanel({
    onScan: scan,
    onOff: off,
    onThreshold: () => scan(),
    onStrength: () => scan(),
  });

  await scan();

  // Motion-triggered re-scan: debounce so dynamic pages settle before re-scoring.
  let debounce;
  state.observer = new MutationObserver(() => {
    clearTimeout(debounce);
    debounce = setTimeout(scan, 500);
  });
  state.observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class'],
  });
})();
