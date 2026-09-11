# GlareMap

Spatial glare heatmap + targeted softening for photophobia and migraine.
**Comfort aid — not a medical device and not a diagnosis.**

> Status: **live** (2026-09-11) at https://markkirby125.github.io/glaremap/ — lab page and bookmarklet build.

GlareMap estimates per-region brightness from computed CSS colors, renders a heatmap,
and softens only the hottest regions with an SVG mask — instead of dimming the whole
page like a global dimmer. "Glare" here is a **relative brightness estimate, not a
photometric measurement**.

## Use

- **Lab page:** https://markkirby125.github.io/glaremap/ — paste HTML or load a URL
  best-effort, then adjust threshold and strength.
- **Bookmarklet:** on the lab page, press "Copy bookmarklet", create a bookmark, and
  click it on any page. To rebuild it from source: `npm run build`.

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
