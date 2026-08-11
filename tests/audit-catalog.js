const fs = require("fs");
const vm = require("vm");

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync("results-data.js", "utf8"), context);
vm.runInContext(fs.readFileSync("maintenance.js", "utf8"), context);

const { results, domains, maintenance } = context.window.MATH_NET;
const core = context.window.MATH_MAINTENANCE;
const strict = process.argv.includes("--strict");
const json = process.argv.includes("--json");
const dateArgument = process.argv.find((value) => /^\d{4}-\d{2}-\d{2}$/.test(value));
const today = dateArgument || new Date().toISOString().slice(0, 10);
const manifest = core.buildManifest(results, domains, maintenance, today);
const due = results.map((item) => core.recordFor(item, maintenance, today)).filter((item) => item.state === "due");
const preprints = results.filter((item) => item.status.includes("preprint"));
const searchIndexes = results.filter((item) => item.sources.some((source) => source.type === "primary-index"));

if (json) {
  console.log(JSON.stringify(manifest, null, 2));
} else {
  console.log(`Catalog audit at ${today}`);
  console.log(`${results.length} folios · ${preprints.length} preprint-marked · ${searchIndexes.length} search-index placeholders`);
  console.log(due.length ? `Recheck due: ${due.map((item) => item.slug).join(", ")}` : "No status-aware source checks are overdue.");
  console.log(`Next queue: ${manifest.queue.slice(0, 6).map((item) => `${item.slug}@${item.dueDate}`).join(", ")}`);
}

if (strict && (due.length || searchIndexes.length)) process.exit(1);
