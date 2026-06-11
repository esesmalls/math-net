const fs = require("fs");
const vm = require("vm");

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync("results-data.js", "utf8"), context);

const { results, domains, bySlug, byDomain, reviewed } = context.window.MATH_NET;
const errors = [];
const required = ["slug", "domain", "era", "title", "latinTitle", "authors", "year", "status", "theorem", "symbols", "formula", "proof", "significance", "reviewed", "sources"];

if (results.length !== 36) errors.push(`Expected 36 results, found ${results.length}.`);
if (Object.keys(bySlug).length !== 36) errors.push("Slugs are not unique.");
if (reviewed !== "2026-06-11") errors.push(`Unexpected review date: ${reviewed}.`);

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
  for (const entry of item.sources || []) {
    try { new URL(entry.url); } catch { errors.push(`${item.slug} has invalid source URL: ${entry.url}`); }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${results.length} results across ${Object.keys(domains).length} domains.`);
