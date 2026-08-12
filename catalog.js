(function () {
  "use strict";

  const net = window.MATH_NET;
  const ledger = document.querySelector("#catalog-ledger");
  if (!net || !ledger) return;

  const state = { domain: "all", era: "all" };
  const domainFilter = document.querySelector("#catalog-domain-filter");
  const eraFilter = document.querySelector("#catalog-era-filter");
  const audit = document.querySelector("#catalog-audit");
  const checkpoint = document.querySelector("#catalog-checkpoint");
  const directSourceTypes = new Set(["preprint", "primary", "journal"]);
  const maintenanceCore = window.MATH_MAINTENANCE;
  const maintenance = net.maintenance || {};
  const today = new Date().toISOString().slice(0, 10);
  const asOf = maintenanceCore ? maintenanceCore.asOfFromSearch(window.location && window.location.search, today) : today;

  function button(label, value, kind) {
    const node = document.createElement("button");
    node.type = "button";
    node.textContent = label;
    node.dataset.value = value;
    node.setAttribute("aria-pressed", value === "all" ? "true" : "false");
    node.addEventListener("click", () => {
      state[kind] = value;
      node.parentElement.querySelectorAll("button").forEach((item) => {
        item.setAttribute("aria-pressed", String(item === node));
      });
      render();
    });
    return node;
  }

  function resultLeaf(item) {
    const link = document.createElement("a");
    link.className = "catalog-result";
    link.href = `result.html?slug=${encodeURIComponent(item.slug)}`;

    const meta = document.createElement("span");
    meta.className = "catalog-result-meta";
    meta.textContent = `${item.year} · ${item.status.toUpperCase()}`;

    const title = document.createElement("strong");
    title.textContent = item.title;

    const formula = document.createElement("span");
    formula.className = "catalog-result-formula";
    if (window.MATH_TYPES) window.MATH_TYPES.renderFormula(formula, item.formula, { display: "inline", label: item.formula });
    else formula.textContent = item.formula;

    const verification = document.createElement("small");
    const hasDirectPrimary = item.sources.some((source) => directSourceTypes.has(source.type));
    const review = maintenanceCore ? maintenanceCore.recordFor(item, maintenance, asOf) : null;
    link.dataset.provenance = hasDirectPrimary ? "direct" : "reference";
    if (review) link.dataset.review = review.state;
    verification.textContent = `${hasDirectPrimary ? "DIRECT PAPER" : "REFERENCE"} · FONTES ${item.sources.length} · CHECK ${item.sourceChecked || item.reviewed}${review ? ` · DUE ${review.dueDate}` : ""}`;

    link.append(meta, title, formula, verification);
    return link;
  }

  function resultColumn(label, era, results) {
    const column = document.createElement("div");
    column.className = `catalog-column catalog-column-${era}`;
    column.hidden = state.era !== "all" && state.era !== era;

    const heading = document.createElement("h3");
    heading.textContent = label;
    column.appendChild(heading);
    results.filter((item) => item.era === era).forEach((item) => column.appendChild(resultLeaf(item)));
    return column;
  }

  function domainRow(key, domain) {
    const results = net.byDomain[key];
    const row = document.createElement("article");
    row.className = "catalog-domain";
    row.dataset.domain = key;

    const historic = resultColumn("HISTORICA", "historic", results);
    const recent = resultColumn("RECENTIA", "recent", results);
    const axis = document.createElement("div");
    axis.className = "catalog-domain-axis";

    const symbol = document.createElement("span");
    symbol.textContent = domain.symbol;
    const name = document.createElement("h3");
    name.textContent = domain.latin;
    const count = document.createElement("small");
    count.textContent = "III + III";
    axis.append(symbol, name, count);
    row.append(historic, axis, recent);
    return row;
  }

  function render() {
    ledger.replaceChildren();
    Object.entries(net.domains).forEach(([key, domain]) => {
      if (state.domain === "all" || state.domain === key) ledger.appendChild(domainRow(key, domain));
    });
    ledger.dataset.era = state.era;
  }

  domainFilter.appendChild(button("OMNIA", "all", "domain"));
  Object.entries(net.domains).forEach(([key, domain]) => {
    domainFilter.appendChild(button(domain.latin.toUpperCase(), key, "domain"));
  });
  eraFilter.append(button("BOTH", "all", "era"), button("HISTORICA", "historic", "era"), button("RECENTIA", "recent", "era"));

  const sourceCount = net.results.reduce((sum, item) => sum + item.sources.length, 0);
  const preprintCount = net.results.filter((item) => item.status.includes("preprint")).length;
  const recentDirectCount = net.results.filter((item) => item.era === "recent" && item.sources.some((source) => directSourceTypes.has(source.type))).length;
  const searchPlaceholderCount = net.results.filter((item) => item.sources.some((source) => source.type === "primary-index")).length;
  const canonicalCount = window.MATH_BIBLIOTHECA ? Object.keys(window.MATH_BIBLIOTHECA.works).length : 0;
  audit.textContent = `${net.results.length} FOLIOS · ${sourceCount} LINKS · ${recentDirectCount} DIRECT PAPERS · ${canonicalCount} CANONICAL IDENTITIES · ${searchPlaceholderCount} SEARCH PLACEHOLDERS · ${preprintCount} PREPRINT MARKS · CORPUS ${net.reviewed}`;

  const latest = (maintenance.checkpoints || [])[0];
  const cadence = maintenance.reviewCadenceDays || 90;
  const nextReview = new Date(`${maintenance.corpusReviewed || net.reviewed}T00:00:00Z`);
  nextReview.setUTCDate(nextReview.getUTCDate() + cadence);
  checkpoint.textContent = latest
    ? `NOVISSIMA RECOGNITIO · ${latest.date} · ${latest.scope} · NEXT FULL CYCLE ${nextReview.toISOString().slice(0, 10)}`
    : `CORPUS REVIEWED · ${net.reviewed}`;

  function appendText(parent, tagName, value, className) {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    node.textContent = value;
    parent.appendChild(node);
    return node;
  }

  function renderApparatus() {
    const orbit = document.querySelector("#review-orbit");
    const queueNode = document.querySelector("#review-queue");
    const summaryNode = document.querySelector("#review-summary");
    const asOfNode = document.querySelector("#review-as-of");
    const policyNode = document.querySelector("#review-policy");
    const exportButton = document.querySelector("#export-review-queue");
    if (!maintenanceCore || !orbit || !queueNode || !summaryNode) return;

    const manifest = maintenanceCore.buildManifest(net.results, net.domains, maintenance, asOf);
    manifest.domains.forEach((entry) => {
      const domain = net.domains[entry.domain];
      const node = document.createElement("a");
      node.className = "review-orbit-node";
      node.href = `#${domain.anchor}`;
      node.dataset.state = entry.due ? "due" : entry.soon ? "soon" : "current";
      node.style.setProperty("--angle", `${entry.index * 60 - 90}deg`);
      node.style.setProperty("--counter-angle", `${90 - entry.index * 60}deg`);
      node.style.setProperty("--freshness", entry.freshness.toFixed(3));
      node.setAttribute("aria-label", `${domain.name}: ${entry.due} overdue, next review ${entry.nextDue}`);
      appendText(node, "b", domain.symbol);
      appendText(node, "small", domain.latin);
      appendText(node, "em", entry.due ? `${entry.due} DUE` : entry.nextDue);
      orbit.appendChild(node);
    });

    const due = manifest.summary.due;
    const soon = manifest.summary.soon;
    appendText(summaryNode, "strong", String(due).padStart(2, "0"));
    appendText(summaryNode, "span", due ? "FOLIOS REQUIRE RECHECK" : "OVERDUE FOLIOS");
    appendText(summaryNode, "small", `${soon} approaching threshold · queue generated ${asOf}`);
    asOfNode.textContent = `AS OF ${asOf}`;

    manifest.queue.forEach((record, index) => {
      const item = document.createElement("li");
      item.dataset.state = record.state;
      appendText(item, "span", String(index + 1).padStart(2, "0"), "review-order");
      const copy = document.createElement("div");
      appendText(copy, "small", `${net.domains[record.domain].latin} · ${record.status.toUpperCase()}`);
      const link = appendText(copy, "a", record.title);
      link.href = `result.html?slug=${encodeURIComponent(record.slug)}`;
      appendText(copy, "p", record.state === "due"
        ? `${record.overdueDays ? `OVERDUE ${record.overdueDays} DAYS` : "DUE TODAY"} · LAST CHECK ${record.sourceChecked}`
        : `DUE ${record.dueDate} · ${record.daysRemaining} DAYS REMAIN`);
      item.appendChild(copy);
      queueNode.appendChild(item);
    });

    const rules = maintenance.reviewCadenceByStatus;
    const evidenceCount = manifest.checkpoint && manifest.checkpoint.evidence ? manifest.checkpoint.evidence.length : 0;
    policyNode.textContent = `CADENTIA · accepted preprint ${rules["accepted preprint"]}d · preprint ${rules.preprint}d · published ${rules.published}d · classical ${rules.classical}d · due-soon window ${maintenance.dueSoonDays}d · ${evidenceCount} status notes in latest checkpoint`;

    exportButton.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `math-net-review-queue-${asOf}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    });
  }

  render();
  renderApparatus();
}());
