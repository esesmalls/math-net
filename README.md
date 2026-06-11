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
- A dedicated `Singularis` animation for every result, shown by default with `Systema` available for comparison
- Local-only PDF submission and review Archivum backed by IndexedDB
- Zero dependencies and no build step

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
`2026-06-11`.

## Validation

```bash
node tests/validate-results.js
```
