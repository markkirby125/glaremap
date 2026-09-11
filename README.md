# GlareMap

**Targeted glare softening for photophobia and migraine — dim only the bright spots, not the whole page.**

Global screen dimmers lower everything at once. Text darkens, images turn muddy, and the page becomes harder to read without fixing the regions that actually hurt.

GlareMap estimates per-region brightness from computed CSS colors, renders a heatmap, and softens only the hottest regions with an SVG mask. The rest of the page stays readable.

## What is glare, and why does a global dimmer fall short?

Glare is the uncomfortable brightness difference between a screen region and its surroundings. For people with **photophobia** or **migraine**, a few bright spots can make an entire page unusable. Global dimmers lower the whole screen, which darkens text and images that were already comfortable. GlareMap targets only the regions that exceed a brightness threshold, so readable content stays readable.

**Status:** live at [markkirby125.github.io/glaremap/](https://markkirby125.github.io/glaremap/) — lab page and bookmarklet build.

*Updated: 2026-09-11*

> GlareMap is a comfort aid, not a medical device and not a diagnosis. "Glare" here is a **relative brightness estimate, not a photometric measurement**.

## How GlareMap softens bright spots

- **Regional brightness estimation** from computed CSS colors.
- **Heatmap overlay** showing which areas exceed the threshold.
- **Targeted softening** via SVG mask, leaving text and images outside hot zones untouched.
- **Click-through overlay** — the mask is `pointer-events: none`; links, buttons, inputs, and form fields remain interactive.
- **Honest scope labeling** — image, video, and gradient regions are marked **unmeasured** and never scored as glare.
- **CSP-aware failure** — the panel reports when a site blocks injected styles instead of failing silently.

## How do I use GlareMap?

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

## How do I develop GlareMap?

```bash
npm test        # node --test tests/*.test.mjs
npm run build   # bundles scanner+renderer+panel into bookmarklet.min.js
```

## Contributing

Open an issue or submit a pull request. Please keep the comfort-aid framing and scope limitations accurate in any documentation changes.

## License

MIT License. See [LICENSE](LICENSE) for details.

## Sources

- [W3C. Understanding SC 1.4.3: Contrast (Minimum) (WCAG 2.2, Level AA).](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [MDN. prefers-reduced-motion CSS media feature.](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

## Part of the Vision Apps toolkit

GlareMap is the glare-softening piece of the four-tool [Vision Apps](https://github.com/markkirby125/vision-apps) accessibility kit.

| Project | What it does |
| --- | --- |
| [ChromaCalm](https://github.com/markkirby125/chromacalm) | Zero-install spectral notch filtering for photophobia, migraine and screen halation. |
| [SoftContrast](https://github.com/markkirby125/softcontrast) | Anti-halation reading palettes built on APCA and OKLCH. |
| [terminal-a11y](https://github.com/markkirby125/terminal-a11y) | Screen-reader, photophobia, braille and sensory-budget modes for the command line. |
| [FocusBeacon](https://github.com/markkirby125/focusbeacon) | High-contrast dual-contour focus ring and cursor radar for tunnel vision. |
| **GlareMap** *(this repo)* | Targeted brightness softening for photophobia and migraine. |
