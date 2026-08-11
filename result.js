(function () {
  "use strict";

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const params = new URLSearchParams(location.search);
  const slug = params.get("slug");
  const result = window.MATH_NET && window.MATH_NET.bySlug[slug];
  const mainSections = [...document.querySelectorAll(".result-main > section:not(#result-error)")];

  function setText(selector, value) {
    const node = $(selector);
    if (node) node.textContent = value;
  }

  function makeElement(tagName, className, text) {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function makeSvg(tagName, attributes) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tagName);
    Object.entries(attributes || {}).forEach(([name, value]) => node.setAttribute(name, value));
    return node;
  }

  function renderError() {
    mainSections.forEach((node) => { node.hidden = true; });
    $("#result-error").hidden = false;
    document.title = "Folio non inventum · Codex Infinitum";
  }

  if (!result) {
    renderError();
    return;
  }

  const domain = window.MATH_NET.domains[result.domain];
  document.body.dataset.domain = result.domain;
  document.title = `${result.title} · Codex Infinitum`;
  setText("#result-era", `${result.era === "recent" ? "RECENTIA" : "HISTORICA"} · ${domain.latin}`);
  setText("#result-latin", result.latinTitle);
  setText("#result-title", result.title);
  setText("#result-meta", `${result.authors} · ${result.year} · ${result.status.toUpperCase()}`);
  setText("#result-reviewed", result.reviewed);
  setText("#result-source-checked", result.sourceChecked || result.reviewed);
  if (window.MATH_TYPES) window.MATH_TYPES.renderFormula($("#result-formula"), result.formula, { label: `Core formula: ${result.formula}` });
  else setText("#result-formula", result.formula);
  setText("#result-theorem", result.theorem);
  setText("#result-symbols", result.symbols);
  setText("#result-significance", result.significance);
  setText("#result-index", domain.symbol);
  setText("#footer-result-name", result.latinTitle);

  const backUrl = `index.html#${domain.anchor}`;
  $("#domain-back").href = backUrl;
  $("#domain-back").textContent = domain.returnName.toUpperCase();
  $("#footer-back").href = backUrl;
  $("#footer-back").textContent = domain.returnName.toUpperCase();

  const proof = $("#result-proof");
  result.proof.forEach((step) => {
    const item = document.createElement("li");
    item.textContent = step;
    proof.appendChild(item);
  });

  const sourceList = $("#result-sources");
  const sourceRanks = {
    journal: "I", conference: "I", primary: "I", preprint: "I",
    institution: "II", "authoritative-survey": "II",
    reference: "III", background: "III"
  };
  result.sources.forEach((entry) => {
    const link = document.createElement("a");
    link.className = "source-card";
    link.dataset.rank = sourceRanks[entry.type] || "III";
    link.href = entry.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    const type = document.createElement("span");
    type.className = "source-type";
    type.textContent = entry.type.toUpperCase();
    const rank = document.createElement("i");
    rank.className = "source-rank";
    rank.textContent = link.dataset.rank;
    const label = document.createElement("strong");
    label.textContent = entry.label;
    link.append(rank, type, label);
    sourceList.appendChild(link);
  });

  function renderConstellation() {
    const domainResults = window.MATH_NET.byDomain[result.domain];
    const edges = window.MATH_NET.constellations[result.domain];
    const lineLayer = $("#result-lineage-lines");
    const nodeLayer = $("#result-lineage-nodes");
    const outerPositions = [[500, 82], [812, 215], [760, 510], [240, 510], [188, 215]];
    const positions = { [result.slug]: [500, 310] };
    domainResults.filter((item) => item.slug !== result.slug).forEach((item, index) => {
      positions[item.slug] = outerPositions[index];
    });

    setText("#lineage-domain", domain.latin.toUpperCase());
    lineLayer.replaceChildren();
    nodeLayer.replaceChildren();

    lineLayer.append(
      makeSvg("ellipse", { cx: 500, cy: 310, rx: 355, ry: 248, class: "lineage-orbit" }),
      makeSvg("circle", { cx: 500, cy: 310, r: 112, class: "lineage-orbit lineage-orbit-inner" }),
      makeSvg("path", { d: "M90 310 H910 M500 34 V586", class: "lineage-axis" })
    );
    const watermark = makeSvg("text", { x: 500, y: 335, class: "lineage-watermark", "text-anchor": "middle" });
    watermark.textContent = domain.symbol;
    lineLayer.appendChild(watermark);

    edges.forEach(([from, to, relation], index) => {
      const a = positions[from];
      const b = positions[to];
      const midpoint = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const bend = (index % 2 ? -1 : 1) * Math.min(34, Math.hypot(dx, dy) * .08);
      const length = Math.max(1, Math.hypot(dx, dy));
      const control = [midpoint[0] - dy / length * bend, midpoint[1] + dx / length * bend];
      const current = from === result.slug || to === result.slug;
      const group = makeSvg("g", { class: `lineage-relation${current ? " is-current" : ""}` });
      group.appendChild(makeSvg("path", { d: `M ${a[0]} ${a[1]} Q ${control[0]} ${control[1]} ${b[0]} ${b[1]}` }));
      const label = makeSvg("text", { x: control[0], y: control[1] - 8, "text-anchor": "middle" });
      label.textContent = relation;
      group.appendChild(label);
      lineLayer.appendChild(group);
    });

    [result, ...domainResults.filter((item) => item.slug !== result.slug)].forEach((item) => {
      const current = item.slug === result.slug;
      const node = makeElement(current ? "div" : "a", `lineage-node${current ? " is-current" : ""}`);
      const position = positions[item.slug];
      node.style.setProperty("--lineage-x", `${position[0] / 10}%`);
      node.style.setProperty("--lineage-y", `${position[1] / 6.2}%`);
      if (!current) node.href = `result.html?slug=${encodeURIComponent(item.slug)}#lineage`;
      else node.setAttribute("aria-current", "page");
      node.append(
        makeElement("small", "lineage-era", item.era === "recent" ? "RECENTIA" : "HISTORICA"),
        makeElement("strong", "lineage-title", item.title),
        makeElement("span", "lineage-year", item.year)
      );
      nodeLayer.appendChild(node);
    });
  }

  function appendMetric(list, term, description) {
    list.append(makeElement("dt", "", term), makeElement("dd", "", description));
  }

  function renderRevisionTrail() {
    const core = window.MATH_MAINTENANCE;
    const policy = window.MATH_NET.maintenance;
    const fallbackDate = new Date().toISOString().slice(0, 10);
    const auditDate = core.asOfFromSearch(location.search, fallbackDate);
    const record = core.recordFor(result, policy, auditDate);
    const trail = core.revisionTrailFor(result, policy);
    const freshness = Math.round(record.freshness * 100);
    const seal = $("#revision-seal");
    seal.dataset.state = record.state;
    seal.style.setProperty("--freshness-angle", `${record.freshness * 360}deg`);
    setText("#revision-freshness", `${freshness}%`);
    setText("#revision-state", record.state.toUpperCase());

    const metrics = $("#revision-metrics");
    appendMetric(metrics, "STATUS", result.status.toUpperCase());
    appendMetric(metrics, "LAST VERIFICATION", record.sourceChecked);
    appendMetric(metrics, "NEXT REVIEW", record.dueDate);
    appendMetric(metrics, "CADENCE", `${record.cadenceDays} DAYS`);
    appendMetric(metrics, "AUDIT HORIZON", auditDate);

    const list = $("#result-revisions");
    trail.forEach((entry) => {
      const item = makeElement("li", `revision-entry revision-${entry.kind}`);
      const index = makeElement("span", "revision-index", String(trail.length - list.children.length).padStart(2, "0"));
      const copy = makeElement("div", "revision-copy");
      copy.append(
        makeElement("small", "revision-date", `${entry.date} · ${entry.label}`),
        makeElement("p", "revision-outcome", entry.outcome)
      );
      if (entry.changedFields.length) {
        copy.appendChild(makeElement("span", "revision-fields", `FIELDS · ${entry.changedFields.join(" · ").toUpperCase()}`));
      }
      if (entry.evidence) {
        const evidence = makeElement("a", "revision-evidence", "OPEN STATUS EVIDENCE ↗");
        evidence.href = entry.evidence.url;
        evidence.target = "_blank";
        evidence.rel = "noopener noreferrer";
        evidence.title = entry.evidence.outcome;
        copy.appendChild(evidence);
      }
      item.append(index, copy);
      list.appendChild(item);
    });
  }

  renderConstellation();
  renderRevisionTrail();

  const canvas = $("#result-canvas");
  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let mode = "singularis";
  let visible = true;
  let frameId = 0;
  let lastFrame = 0;
  let frameDelay = 0;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, innerWidth < 700 ? 1 : 1.5);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.max(1, width * dpr);
    canvas.height = Math.max(1, height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function ink(alpha, lineWidth) {
    ctx.strokeStyle = `rgba(54,38,23,${alpha})`;
    ctx.lineWidth = lineWidth || 1;
  }

  function drawTopology(time, seed) {
    const rings = 12 + seed % 10;
    ctx.save();
    ctx.translate(width * .65, height * .5);
    ink(.27, .8);
    for (let j = 0; j < rings; j++) {
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const u = i / 120 * Math.PI * 2;
        const v = j / rings * Math.PI * 2 + time * .00012;
        const knot = result.visual.motif === "knot" || result.visual.motif === "framed";
        const r = Math.min(width, height) * (knot ? .16 : .23);
        const x = Math.cos(u) * (r * 1.7 + r * .38 * Math.cos(v + u * (seed % 3 + 1)));
        const y = Math.sin(u) * (r + r * .32 * Math.sin(v + u * 2));
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawNumber(time, seed) {
    const count = 520 + seed * 11;
    const cx = width * .62;
    const cy = height * .5;
    const scale = Math.min(width, height) * .014;
    for (let n = 2; n < count; n++) {
      let prime = true;
      for (let d = 2; d * d <= n; d++) if (n % d === 0) { prime = false; break; }
      const a = n * 2.399963 + time * .00002;
      const r = Math.sqrt(n) * scale;
      ctx.fillStyle = prime ? "rgba(124,52,36,.65)" : "rgba(54,38,23,.09)";
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, prime ? 1.5 : .55, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawComplex(time, seed) {
    const cell = Math.max(9, Math.floor(Math.min(width, height) / 65));
    for (let y = 0; y < height; y += cell) {
      for (let x = 0; x < width; x += cell) {
        const zx = (x / width - .5) * 4;
        const zy = (y / height - .5) * 3;
        const degree = 2 + seed % 4;
        const arg = Math.atan2(zy, zx) * degree + time * .00008;
        const wave = .5 + .5 * Math.sin(arg + Math.hypot(zx, zy) * 5);
        ctx.fillStyle = `rgba(${90 + wave * 55},${52 + wave * 25},25,${.05 + wave * .15})`;
        ctx.fillRect(x, y, cell + 1, cell + 1);
      }
    }
  }

  function drawGeometry(time, seed) {
    const cx = width * .62;
    const cy = height * .5;
    const gap = Math.max(35, Math.min(width, height) / 15);
    ink(.22, .8);
    const warp = (x, y) => {
      const dx = x - cx; const dy = y - cy;
      const lift = Math.exp(-(dx * dx + dy * dy) / (height * height * .08)) * height * (.12 + seed % 4 * .02);
      return [x + dx * lift / height * .22, y - lift + dy * lift / height * .15];
    };
    for (let y = -gap; y < height + gap; y += gap) {
      ctx.beginPath();
      for (let x = 0; x <= width; x += 8) {
        const p = warp(x, y);
        if (x === 0) ctx.moveTo(...p); else ctx.lineTo(...p);
      }
      ctx.stroke();
    }
    for (let x = 0; x < width + gap; x += gap) {
      ctx.beginPath();
      for (let y = 0; y <= height; y += 8) {
        const p = warp(x, y);
        if (y === 0) ctx.moveTo(...p); else ctx.lineTo(...p);
      }
      ctx.stroke();
    }
  }

  function drawGraph(time, seed) {
    const count = 9 + seed % 8;
    const nodes = Array.from({ length: count }, (_, i) => {
      const a = i / count * Math.PI * 2 + time * .00005 * (i % 2 ? 1 : -1);
      const r = Math.min(width, height) * (.19 + (i % 3) * .055);
      return [width * .63 + Math.cos(a) * r, height * .5 + Math.sin(a) * r];
    });
    ink(.25, .8);
    nodes.forEach((a, i) => nodes.forEach((b, j) => {
      if (j > i && ((i * 7 + j * 5 + seed) % 6 < 2)) {
        ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
      }
    }));
    nodes.forEach((p, i) => {
      ctx.fillStyle = i % 4 === 0 ? "rgba(124,52,36,.78)" : "rgba(54,38,23,.65)";
      ctx.beginPath(); ctx.arc(...p, 3 + i % 3, 0, Math.PI * 2); ctx.fill();
    });
  }

  function drawHarmonic(time, seed) {
    let x = width * .45; let y = height * .5;
    const base = Math.min(width, height) * .17;
    const terms = 4 + seed % 6;
    for (let n = 0; n < terms; n++) {
      const px = x; const py = y;
      const harmonic = n * 2 + 1;
      const radius = base / harmonic;
      const angle = harmonic * time * .00065 + n * .25;
      x += Math.cos(angle) * radius; y += Math.sin(angle) * radius;
      ink(.2, .7); ctx.beginPath(); ctx.arc(px, py, radius, 0, Math.PI * 2); ctx.stroke();
      ink(.45, .8); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
    }
    ctx.strokeStyle = "rgba(124,52,36,.65)";
    ctx.beginPath();
    for (let px = x; px < width; px += 2) {
      const dx = px - x;
      let wave = 0;
      for (let n = 0; n < terms; n++) wave += Math.sin((n * 2 + 1) * time * .00065 - dx * .018) / (n * 2 + 1);
      const py = height * .5 + wave * base * .65;
      if (px === x) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  const drawers = { topology: drawTopology, number: drawNumber, complex: drawComplex, geometry: drawGeometry, graph: drawGraph, harmonic: drawHarmonic };
  const seed = [...result.slug].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 31;
  const singularDrawer = window.SINGULARIS_DRAWERS && window.SINGULARIS_DRAWERS[result.visual.motif];

  function drawFrame(time) {
    ctx.clearRect(0, 0, width, height);
    if (mode === "singularis" && singularDrawer) singularDrawer({ ctx, width, height }, time, seed, result);
    else drawers[result.domain](time, seed);
  }

  function scheduleFrame() {
    if (reduceMotion) {
      drawFrame(0);
      return;
    }
    if (!visible || document.hidden || frameId || frameDelay) return;
    const wait = Math.max(0, (innerWidth < 700 ? 40 : 33) - (performance.now() - lastFrame));
    if (wait > 1) {
      frameDelay = setTimeout(() => {
        frameDelay = 0;
        scheduleFrame();
      }, wait);
      return;
    }
    frameId = requestAnimationFrame(frame);
  }

  function frame(time) {
    frameId = 0;
    if (!visible || document.hidden) return;
    lastFrame = time;
    drawFrame(time);
    scheduleFrame();
  }

  const toggle = $("#visual-toggle");
  toggle.hidden = false;
  toggle.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-mode]");
    if (!button) return;
    mode = button.dataset.mode;
    [...toggle.querySelectorAll("button")].forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    drawFrame(performance.now());
    scheduleFrame();
  });

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible && frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }
    scheduleFrame();
  }).observe(canvas);
  addEventListener("resize", () => {
    resize();
    drawFrame(performance.now());
    scheduleFrame();
  });
  document.addEventListener("visibilitychange", scheduleFrame);
  resize();
  scheduleFrame();

  function restoreHashTarget() {
    const id = decodeURIComponent(location.hash.slice(1));
    const target = id && document.getElementById(id);
    if (!target) return;
    requestAnimationFrame(() => {
      const navHeight = $(".result-nav")?.getBoundingClientRect().height || 0;
      const top = target.getBoundingClientRect().top + scrollY - navHeight;
      scrollTo({ top, behavior: "instant" });
    });
  }

  addEventListener("hashchange", restoreHashTarget);
  restoreHashTarget();
}());
