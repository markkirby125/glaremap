# GlareMap

Spatial glare heatmap + targeted softening for photophobia and migraine.
**Comfort aid — not a medical device and not a diagnosis.**

> Status: in build (2026-09-11). Not yet published; install from source below.

GlareMap estimates per-region brightness from computed CSS colors, renders a heatmap,
and softens only the hottest regions with an SVG mask — instead of dimming the whole
page like a global dimmer. "Glare" here is a **relative brightness estimate, not a
photometric measurement**.

## Use

- **Lab page:** open `index.html` (or the GitHub Pages URL once published), paste HTML
  or load a URL best-effort, then adjust threshold and strength.
- **Bookmarklet:** build with `npm run build`, copy the generated bookmarklet from the
  lab page's Export button, and click it on any page.

## Honesty notes

- Image, video, and gradient regions are marked **unmeasured** and never scored as glare.
- The overlay never intercepts clicks: the mask is `pointer-events: none` and skips
  links, buttons, inputs, and form fields.
- On sites with strict CSP, the panel shows "this site blocks injected styles" instead
  of failing silently.

## Develop

```bash
npm test        # node --test tests/*.test.mjs
npm run build   # bundles scanner+renderer+panel into bookmarklet.min.js
```

## License

MIT
