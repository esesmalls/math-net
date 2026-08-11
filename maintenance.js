(function (root) {
  "use strict";

  const day = 24 * 60 * 60 * 1000;

  function isoDate(value) {
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    const text = String(value || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error(`Invalid audit date: ${text}`);
    return text;
  }

  function dateValue(value) {
    return Date.parse(`${isoDate(value)}T00:00:00Z`);
  }

  function addDays(value, amount) {
    return new Date(dateValue(value) + amount * day).toISOString().slice(0, 10);
  }

  function asOfFromSearch(search, fallback) {
    const match = String(search || "").match(/[?&]audit=(\d{4}-\d{2}-\d{2})(?:&|$)/);
    return isoDate(match ? match[1] : fallback);
  }

  function cadenceFor(item, policy) {
    const rules = policy.reviewCadenceByStatus || {};
    const status = String(item.status || "").toLowerCase();
    if (Number.isFinite(rules[status])) return rules[status];
    if (status.includes("preprint") && Number.isFinite(rules.preprint)) return rules.preprint;
    return Number.isFinite(rules.default) ? rules.default : (policy.reviewCadenceDays || 90);
  }

  function actionsFor(item) {
    const status = String(item.status || "").toLowerCase();
    if (status.includes("preprint")) {
      return [
        "Check the primary-paper revision and comments field.",
        "Search for a canonical journal page or DOI.",
        "Compare theorem wording, authors and proof route with the current folio."
      ];
    }
    if (item.era === "recent") {
      return [
        "Verify the canonical journal or institutional record.",
        "Check corrections, revised statements and bibliographic metadata.",
        "Refresh the background source if a stronger survey now exists."
      ];
    }
    return [
      "Verify reference links and historical attribution.",
      "Confirm that the theorem statement retains its standard hypotheses.",
      "Replace secondary background with a stronger archival source when available."
    ];
  }

  function recordFor(item, policy, asOf) {
    const auditDate = isoDate(asOf);
    const cadenceDays = cadenceFor(item, policy);
    const checked = item.sourceChecked || item.reviewed;
    const dueDate = addDays(checked, cadenceDays);
    const daysRemaining = Math.ceil((dateValue(dueDate) - dateValue(auditDate)) / day);
    const ageDays = Math.max(0, Math.floor((dateValue(auditDate) - dateValue(checked)) / day));
    const dueSoonDays = policy.dueSoonDays || 21;
    const state = daysRemaining <= 0 ? "due" : daysRemaining <= dueSoonDays ? "soon" : "current";

    return {
      slug: item.slug,
      domain: item.domain,
      era: item.era,
      title: item.title,
      status: item.status,
      sourceChecked: checked,
      cadenceDays,
      dueDate,
      ageDays,
      daysRemaining,
      overdueDays: Math.max(0, -daysRemaining),
      freshness: Math.max(0, Math.min(1, daysRemaining / cadenceDays)),
      state,
      actions: actionsFor(item)
    };
  }

  function compareRecords(a, b) {
    const rank = { due: 0, soon: 1, current: 2 };
    return rank[a.state] - rank[b.state]
      || a.daysRemaining - b.daysRemaining
      || (a.era === "recent" ? 0 : 1) - (b.era === "recent" ? 0 : 1)
      || a.slug.localeCompare(b.slug);
  }

  function buildQueue(results, policy, asOf, limit) {
    const count = Number.isFinite(limit) ? limit : (policy.queueSize || 12);
    return results.map((item) => recordFor(item, policy, asOf)).sort(compareRecords).slice(0, count);
  }

  function summarizeDomains(results, domains, policy, asOf) {
    return Object.keys(domains).map((domain, index) => {
      const records = results.filter((item) => item.domain === domain).map((item) => recordFor(item, policy, asOf)).sort(compareRecords);
      return {
        domain,
        index,
        symbol: domains[domain].symbol,
        latin: domains[domain].latin,
        due: records.filter((item) => item.state === "due").length,
        soon: records.filter((item) => item.state === "soon").length,
        freshness: records.reduce((sum, item) => sum + item.freshness, 0) / records.length,
        nextDue: records[0].dueDate,
        nextSlug: records[0].slug
      };
    });
  }

  function buildManifest(results, domains, policy, asOf) {
    const auditDate = isoDate(asOf);
    const records = results.map((item) => recordFor(item, policy, auditDate));
    return {
      schemaVersion: 1,
      generatedAt: auditDate,
      corpusReviewed: policy.corpusReviewed,
      checkpoint: (policy.checkpoints || [])[0] || null,
      policy: {
        dueSoonDays: policy.dueSoonDays,
        reviewCadenceByStatus: policy.reviewCadenceByStatus,
        sourcePriority: policy.sourcePriority
      },
      summary: {
        results: records.length,
        due: records.filter((item) => item.state === "due").length,
        soon: records.filter((item) => item.state === "soon").length
      },
      domains: summarizeDomains(results, domains, policy, auditDate),
      queue: buildQueue(results, policy, auditDate)
    };
  }

  root.MATH_MAINTENANCE = {
    isoDate,
    addDays,
    asOfFromSearch,
    cadenceFor,
    recordFor,
    buildQueue,
    summarizeDomains,
    buildManifest
  };
}(typeof window === "undefined" ? globalThis : window));
