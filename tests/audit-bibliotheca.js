const fs = require("fs");
const vm = require("vm");

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync("results-data.js", "utf8"), context);
vm.runInContext(fs.readFileSync("bibliotheca.js", "utf8"), context);

const net = context.window.MATH_NET;
const library = context.window.MATH_BIBLIOTHECA;
const issues = library.audit(net.results);
const records = net.results.filter((item) => item.era === "recent").map((item) => library.recordFor(item));
const published = records.filter((record) => record.publication);
const manuscripts = records.filter((record) => !record.publication);

console.log(`Bibliotheca reviewed ${library.reviewed}`);
console.log(`${records.length} canonical works · ${published.length} formal publications · ${manuscripts.length} active manuscripts`);
console.log(`arXiv snapshots: ${records.map((record) => `${record.arxiv.id}v${record.arxiv.version}@${record.arxiv.updated}`).join(", ")}`);
console.log(issues.length ? `Identity issues: ${issues.join("; ")}` : "No identity collisions or status divergences.");

if (process.argv.includes("--strict") && issues.length) process.exit(1);
