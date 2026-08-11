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
    link.dataset.provenance = hasDirectPrimary ? "direct" : "reference";
    verification.textContent = `${hasDirectPrimary ? "DIRECT PAPER" : "REFERENCE"} · FONTES ${item.sources.length} · CHECK ${item.sourceChecked || item.reviewed}`;

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
  audit.textContent = `${net.results.length} FOLIOS · ${sourceCount} LINKS · ${recentDirectCount} DIRECT PAPERS · ${searchPlaceholderCount} SEARCH PLACEHOLDERS · ${preprintCount} PREPRINT MARKS · CORPUS ${net.reviewed}`;

  const maintenance = net.maintenance || {};
  const latest = (maintenance.checkpoints || [])[0];
  const cadence = maintenance.reviewCadenceDays || 90;
  const nextReview = new Date(`${maintenance.corpusReviewed || net.reviewed}T00:00:00Z`);
  nextReview.setUTCDate(nextReview.getUTCDate() + cadence);
  checkpoint.textContent = latest
    ? `NOVISSIMA RECOGNITIO · ${latest.date} · ${latest.scope} · NEXT FULL CYCLE ${nextReview.toISOString().slice(0, 10)}`
    : `CORPUS REVIEWED · ${net.reviewed}`;

  render();
}());
