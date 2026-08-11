const fs = require("fs");
const vm = require("vm");

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync("results-data.js", "utf8"), context);

const { results, maintenance } = context.window.MATH_NET;
const strict = process.argv.includes("--strict");
const dateArgument = process.argv.find((value) => /^\d{4}-\d{2}-\d{2}$/.test(value));
const today = new Date(`${dateArgument || new Date().toISOString().slice(0, 10)}T00:00:00Z`);
const cadence = maintenance.reviewCadenceDays;
const day = 24 * 60 * 60 * 1000;

const stale = results.filter((item) => {
  const checked = new Date(`${item.sourceChecked}T00:00:00Z`);
  return Math.floor((today - checked) / day) > cadence;
});
const preprints = results.filter((item) => item.status.includes("preprint"));
const searchIndexes = results.filter((item) => item.sources.some((source) => source.type === "primary-index"));

console.log(`Catalog audit at ${today.toISOString().slice(0, 10)}`);
console.log(`${results.length} folios · ${preprints.length} preprint-marked · ${searchIndexes.length} search-index placeholders`);
console.log(stale.length ? `Recheck due: ${stale.map((item) => item.slug).join(", ")}` : `No source checks older than ${cadence} days.`);

if (strict && (stale.length || searchIndexes.length)) process.exit(1);
