/**
 * GlareMap renderer — heatmap colors, softening mask selection, SVG mask builder.
 * Pure functions (no DOM writes) so the lab page, bookmarklet, and tests share one code path.
 */

/** Cells that should be softened: at/above threshold, measurable, not interactive. */
export function softenCells(cells, threshold) {
  return cells.filter((c) => c.luma >= threshold && !c.unmeasured && !c.interactive);
}

/** Clamp softening strength to a safe opacity band. */
export function maskAlpha(strength) {
  const n = Number(strength);
  if (Number.isNaN(n)) return 0.35;
  return Math.min(0.85, Math.max(0.1, n));
}

/**
 * Build an SVG softening mask. The mask is pointer-events: none and only
 * covers cells above the threshold, skipping interactive elements.
 */
export function buildMaskSVG(cells, cols, rows, threshold, strength = 0.35) {
  const alpha = maskAlpha(strength);
  const patches = softenCells(cells, threshold).map((c) => {
    const x = (c.x * c.w).toFixed(1);
    const y = (c.y * c.h).toFixed(1);
    const w = c.w.toFixed(1);
    const h = c.h.toFixed(1);
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2"/>`;
  });
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cols} ${rows}" ` +
    `preserveAspectRatio="none" style="position:fixed;inset:0;width:100vw;height:100vh;` +
    `pointer-events:none;z-index:2147483646" aria-hidden="true">` +
    `<defs><filter id="glaremap-blur" x="-20%" y="-20%" width="140%" height="140%">` +
    `<feGaussianBlur stdDeviation="2"/></filter></defs>` +
    `<g filter="url(#glaremap-blur)" fill="rgb(10, 12, 16)" fill-opacity="${alpha}">` +
    patches.join('') +
    `</g></svg>`
  );
}

/**
 * Perceptual heatmap color: deep blue (cool/low) → cyan → yellow → red (hot).
 * Returns an [r,g,b] triple. The UI must pair this with a text legend.
 */
export function heatmapColor(luma) {
  const t = Math.min(1, Math.max(0, Number(luma) || 0));
  // blue(0,0,64) -> cyan(0,160,180) -> yellow(250,200,40) -> red(255,40,40)
  let r;
  let g;
  let b;
  if (t < 0.33) {
    const k = t / 0.33;
    r = Math.round(0);
    g = Math.round(160 * k);
    b = Math.round(64 + (180 - 64) * k);
  } else if (t < 0.66) {
    const k = (t - 0.33) / 0.33;
    r = Math.round(250 * k);
    g = Math.round(160 + (200 - 160) * k);
    b = Math.round(180 + (40 - 180) * k);
  } else {
    const k = (t - 0.66) / 0.34;
    r = Math.round(250 + (255 - 250) * k);
    g = Math.round(200 * (1 - k * 0.8));
    b = Math.round(40 * (1 - k));
  }
  return [r, g, b];
}

/** Text alternative for the heatmap: top hotspot regions (row, col). */
export function topHotspots(cells, threshold, n = 5) {
  return cells
    .filter((c) => c.luma >= threshold && !c.unmeasured)
    .sort((a, b) => b.luma - a.luma)
    .slice(0, n)
    .map((c) => ({
      row: c.y + 1,
      col: c.x + 1,
      luma: Number(c.luma.toFixed(3)),
    }));
}
