# GlareMap

**Targeted glare softening for photophobia and migraine — dim only the bright spots, not the whole page.**

Global screen dimmers lower everything at once. Text darkens, images turn muddy, and the page becomes harder to read without fixing the regions that actually hurt.

GlareMap estimates per-region brightness from computed CSS colors, renders a heatmap, and softens only the hottest regions with an SVG mask. The rest of the page stays readable.

**Status:** live at [markkirby125.github.io/glaremap/](https://markkirby125.github.io/glaremap/) — lab page and bookmarklet build.

> GlareMap is a comfort aid, not a medical device and not a diagnosis. "Glare" here is a **relative brightness estimate, not a photometric measurement**.

## Features

- **Regional brightness estimation** from computed CSS colors.
- **Heatmap overlay** showing which areas exceed the threshold.
- **Targeted softening** via SVG mask, leaving text and images outside hot zones untouched.
- **Click-through overlay** — the mask is `pointer-events: none`; links, buttons, inputs, and form fields remain interactive.
- **Honest scope labeling** — image, video, and gradient regions are marked **unmeasured** and never scored as glare.
- **CSP-aware failure** — the panel reports when a site blocks injected styles instead of failing silently.

## Quick start

### Lab page

1. Open [markkirby125.github.io/glaremap/](https://markkirby125.github.io/glaremap/).
2. Paste HTML or load a URL (best-effort).
3. Adjust threshold and strength.

### Bookmarklet

On the lab page, press **Copy bookmarklet**, save it as a browser bookmark, then click it on any page.

To rebuild from source:

```bash
npm run build   # bundles scanner+renderer+panel into bookmarklet.min.js
```

## Develop

```bash
npm test        # node --test tests/*.test.mjs
npm run build   # bundles scanner+renderer+panel into bookmarklet.min.js
```

## Contributing

Open an issue or submit a pull request. Please keep the comfort-aid framing and scope limitations accurate in any documentation changes.

## License

MIT License. See [LICENSE](LICENSE) for details.

## Part of the Vision Apps toolkit

GlareMap is one of four accessibility tools in the [Vision Apps](https://github.com/markkirby125/vision-apps) kit.
