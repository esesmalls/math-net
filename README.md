# Math Net · Codex Infinitum

An interactive mathematical manuscript inspired by historical notebooks and
classical mathematical typesetting.

## Features

- Aged manuscript visual system with marginal notes and geometric sketches
- Six animated mathematical folios:
  - Topology
  - Number theory
  - Complex analysis
  - Differential geometry
  - Graph theory
  - Harmonic analysis
- Responsive desktop and mobile layouts
- Six result portals per field: three recent breakthroughs and three historical results
- Paired animated field operators: each entrance has a mathematically inverse return operator
- Shareable data-driven result folios with theorem statements, proof routes and sources
- Semantic MathML rendering for all core formulas, with accessible text labels
- A dedicated `Singularis` animation for every result, shown by default with `Systema` available for comparison
- Local-only PDF submission and review Archivum backed by IndexedDB
- Zero dependencies and no build step

## Motion Performance

- Canvas loops pause when the document or their section is outside the viewport.
- A result portal suspends the covered field canvas until the inverse return completes.
- Animation cadence is capped at 30 fps on desktop and 25 fps on narrow screens.
- Fluid gradients and the Lorenz stroke gradient are cached instead of rebuilt per frame.
- The Lorenz history uses a circular buffer, avoiding full-array shifts during animation.

## Run Locally

Open `index.html` directly, or serve the directory with any static file server:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

The submission and review Archivum is intentionally read-only when the site is
opened through `file://`. Use localhost or GitHub Pages for IndexedDB storage.

## Content Data

Research results live in `results-data.js`. Each result has a stable slug used
by `result.html?slug=<slug>`. The current research review date is
`2026-06-11`. Individual source rechecks are recorded separately in
`sourceChecked`; catalog-wide audit checkpoints live in `maintenance`, so a
partial verification never silently changes the review date of all 36 folios.

## Validation

```bash
node tests/validate-results.js
node tests/validate-catalog.js
node tests/validate-mathml.js
node tests/validate-motion-performance.js
node tests/audit-catalog.js 2026-08-11
```

Pass a review date to the catalog audit for reproducible output. Add `--strict`
when an automated check should fail once any source review exceeds the configured
90-day cadence or a result falls back to a search-index placeholder instead of a
direct primary-paper link.
