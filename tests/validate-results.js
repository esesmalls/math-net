const fs = require("fs");
const vm = require("vm");

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync("results-data.js", "utf8"), context);
vm.runInContext(fs.readFileSync("singularis.js", "utf8"), context);

const { results, domains, bySlug, byDomain, reviewed, maintenance } = context.window.MATH_NET;
const singularis = context.window.SINGULARIS_DRAWERS;
const errors = [];
const required = ["slug", "domain", "era", "title", "latinTitle", "authors", "year", "status", "theorem", "symbols", "formula", "proof", "significance", "reviewed", "sourceChecked", "sources"];

if (results.length !== 36) errors.push(`Expected 36 results, found ${results.length}.`);
if (Object.keys(bySlug).length !== 36) errors.push("Slugs are not unique.");
if (reviewed !== "2026-06-11") errors.push(`Unexpected review date: ${reviewed}.`);
if (!maintenance || maintenance.schemaVersion !== 2) errors.push("Missing catalog maintenance schema v2.");
if (!maintenance || !Array.isArray(maintenance.checkpoints) || !maintenance.checkpoints.length) errors.push("Missing source-review checkpoints.");
if (maintenance && maintenance.corpusReviewed !== reviewed) errors.push("Maintenance corpus date and result corpus date differ.");

for (const [domain, config] of Object.entries(domains)) {
  const group = byDomain[domain] || [];
  if (group.length !== 6) errors.push(`${config.name} has ${group.length} results.`);
  if (group.filter((item) => item.era === "recent").length !== 3) errors.push(`${config.name} does not have 3 recent results.`);
  if (group.filter((item) => item.era === "historic").length !== 3) errors.push(`${config.name} does not have 3 historic results.`);
}

for (const item of results) {
  for (const field of required) if (!item[field] || (Array.isArray(item[field]) && !item[field].length)) errors.push(`${item.slug || "unknown"} missing ${field}.`);
  if (!Array.isArray(item.proof) || item.proof.length !== 3) errors.push(`${item.slug} must have exactly 3 proof-route steps.`);
  if (!Array.isArray(item.sources) || item.sources.length < 2) errors.push(`${item.slug} needs at least 2 sources.`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.sourceChecked)) errors.push(`${item.slug} has an invalid source-check date.`);
  for (const entry of item.sources || []) {
    try { new URL(entry.url); } catch { errors.push(`${item.slug} has invalid source URL: ${entry.url}`); }
  }
  if (!item.visual || typeof singularis[item.visual.motif] !== "function") errors.push(`${item.slug} has no Singularis drawer.`);
}

for (const checkpoint of maintenance.checkpoints || []) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkpoint.date)) errors.push(`Invalid checkpoint date: ${checkpoint.date}.`);
  for (const slug of checkpoint.slugs || []) if (!bySlug[slug]) errors.push(`Checkpoint references unknown slug: ${slug}.`);
}

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
