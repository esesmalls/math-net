const fs = require("fs");
const vm = require("vm");

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync("results-data.js", "utf8"), context);
vm.runInContext(fs.readFileSync("singularis.js", "utf8"), context);

const { results, domains, constellations, bySlug, byDomain, reviewed, maintenance } = context.window.MATH_NET;
const singularis = context.window.SINGULARIS_DRAWERS;
const errors = [];
const required = ["slug", "domain", "era", "title", "latinTitle", "authors", "year", "status", "theorem", "symbols", "formula", "proof", "significance", "reviewed", "sourceChecked", "sources"];

if (results.length !== 36) errors.push(`Expected 36 results, found ${results.length}.`);
if (Object.keys(bySlug).length !== 36) errors.push("Slugs are not unique.");
if (reviewed !== "2026-06-11") errors.push(`Unexpected review date: ${reviewed}.`);
if (!maintenance || maintenance.schemaVersion !== 4) errors.push("Missing catalog maintenance schema v4.");
if (!maintenance || !Array.isArray(maintenance.checkpoints) || !maintenance.checkpoints.length) errors.push("Missing source-review checkpoints.");
if (maintenance && maintenance.corpusReviewed !== reviewed) errors.push("Maintenance corpus date and result corpus date differ.");
if (!maintenance || !maintenance.reviewCadenceByStatus || maintenance.reviewCadenceByStatus.preprint !== 45) errors.push("Missing status-aware review cadence.");
if (!maintenance || maintenance.dueSoonDays !== 21 || maintenance.queueSize !== 12) errors.push("Missing review-queue policy.");

for (const [domain, config] of Object.entries(domains)) {
  const group = byDomain[domain] || [];
  if (group.length !== 6) errors.push(`${config.name} has ${group.length} results.`);
  if (group.filter((item) => item.era === "recent").length !== 3) errors.push(`${config.name} does not have 3 recent results.`);
  if (group.filter((item) => item.era === "historic").length !== 3) errors.push(`${config.name} does not have 3 historic results.`);
  const slugs = new Set(group.map((item) => item.slug));
  const edges = constellations[domain] || [];
  const adjacent = Object.fromEntries([...slugs].map((slug) => [slug, []]));
  const edgeKeys = new Set();
  for (const [from, to, relation] of edges) {
    if (!slugs.has(from) || !slugs.has(to)) errors.push(`${config.name} constellation crosses its field boundary: ${from} -> ${to}.`);
    if (from === to) errors.push(`${config.name} constellation contains a self-loop: ${from}.`);
    if (!relation) errors.push(`${config.name} constellation has an unlabeled relation.`);
    const key = [from, to].sort().join("::");
    if (edgeKeys.has(key)) errors.push(`${config.name} constellation repeats relation ${key}.`);
    edgeKeys.add(key);
    if (adjacent[from] && adjacent[to]) { adjacent[from].push(to); adjacent[to].push(from); }
  }
  const reached = new Set();
  const queue = [[...slugs][0]];
  while (queue.length) {
    const slug = queue.shift();
    if (reached.has(slug)) continue;
    reached.add(slug);
    queue.push(...(adjacent[slug] || []));
  }
  if (reached.size !== 6) errors.push(`${config.name} theorem constellation is disconnected.`);
}

for (const item of results) {
  for (const field of required) if (!item[field] || (Array.isArray(item[field]) && !item[field].length)) errors.push(`${item.slug || "unknown"} missing ${field}.`);
  if (!Array.isArray(item.proof) || item.proof.length !== 3) errors.push(`${item.slug} must have exactly 3 proof-route steps.`);
  if (!Array.isArray(item.sources) || item.sources.length < 2) errors.push(`${item.slug} needs at least 2 sources.`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.sourceChecked)) errors.push(`${item.slug} has an invalid source-check date.`);
  for (const entry of item.sources || []) {
    try { new URL(entry.url); } catch { errors.push(`${item.slug} has invalid source URL: ${entry.url}`); }
  }
  if (item.sources.some((entry) => entry.type === "primary-index")) errors.push(`${item.slug} still uses a search-index source placeholder.`);
  if (item.era === "recent" && !item.sources.some((entry) => ["preprint", "primary", "journal"].includes(entry.type))) errors.push(`${item.slug} lacks a direct primary-paper link.`);
  if (item.era === "recent" && item.sourceChecked !== "2026-08-11") errors.push(`${item.slug} was not covered by the latest recent-results audit.`);
  if (item.status === "published" && !item.sources.some((entry) => ["journal", "conference"].includes(entry.type))) errors.push(`${item.slug} is marked published without a formal publication record.`);
  if (!item.visual || typeof singularis[item.visual.motif] !== "function") errors.push(`${item.slug} has no Singularis drawer.`);
}

for (const checkpoint of maintenance.checkpoints || []) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkpoint.date)) errors.push(`Invalid checkpoint date: ${checkpoint.date}.`);
  for (const slug of checkpoint.slugs || []) if (!bySlug[slug]) errors.push(`Checkpoint references unknown slug: ${slug}.`);
  for (const evidence of checkpoint.evidence || []) {
    if (!bySlug[evidence.slug]) errors.push(`Checkpoint evidence references unknown slug: ${evidence.slug}.`);
    try { new URL(evidence.url); } catch { errors.push(`Checkpoint evidence has invalid URL: ${evidence.url}`); }
    if (!evidence.outcome) errors.push(`Checkpoint evidence lacks an outcome: ${evidence.slug}.`);
  }
  const reviewSlugs = new Set();
  for (const review of checkpoint.reviews || []) {
    if (!bySlug[review.slug]) errors.push(`Checkpoint review references unknown slug: ${review.slug}.`);
    if (reviewSlugs.has(review.slug)) errors.push(`Checkpoint repeats review: ${review.slug}.`);
    if (!review.outcome || !Array.isArray(review.changedFields) || !review.changedFields.length) errors.push(`Checkpoint review is incomplete: ${review.slug}.`);
    reviewSlugs.add(review.slug);
  }
  if ((checkpoint.slugs || []).some((slug) => !reviewSlugs.has(slug)) || reviewSlugs.size !== (checkpoint.slugs || []).length) errors.push(`Checkpoint review ledger does not match its declared scope: ${checkpoint.date}.`);
}
if (!(maintenance.checkpoints || []).some((checkpoint) => checkpoint.slugs.includes("furstenberg-set-conjecture"))) errors.push("Furstenberg status recheck is missing from the maintenance ledger.");
if ((maintenance.checkpoints[0].evidence || []).length !== 11) errors.push("Latest maintenance checkpoint should retain eleven status-review notes.");
if ((maintenance.checkpoints[0].reviews || []).length !== 18) errors.push("Latest maintenance checkpoint should cover all eighteen recent results.");
if (bySlug["sle4-removability"].status !== "preprint" || bySlug["union-closed-lower-bound"].status !== "preprint") errors.push("Unsupported publication labels remain in the recent catalog.");
if (!bySlug["kelley-meka-roth"].sources.some((entry) => entry.url.includes("2302.05537")) || !bySlug["kelley-meka-roth"].formula.includes("¹⁄¹²")) errors.push("Kelley-Meka primary paper or corrected exponent is missing.");

const mockContext = new Proxy({
  beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fill() {}, arc() {}, ellipse() {},
  closePath() {}, setLineDash() {}, fillText() {}, save() {}, restore() {}, translate() {}
}, { set(target, key, value) { target[key] = value; return true; } });

for (const item of results) {
  if (!item.visual || typeof singularis[item.visual.motif] !== "function") continue;
  try {
    singularis[item.visual.motif]({ ctx: mockContext, width: 1280, height: 720 }, 1500, 7, item);
    singularis[item.visual.motif]({ ctx: mockContext, width: 390, height: 844 }, 0, 7, item);
  } catch (error) {
    errors.push(`${item.slug} Singularis drawer failed: ${error.message}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${results.length} results across ${Object.keys(domains).length} domains.`);
