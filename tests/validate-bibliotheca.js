const fs = require("fs");
const vm = require("vm");

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync("results-data.js", "utf8"), context);
vm.runInContext(fs.readFileSync("bibliotheca.js", "utf8"), context);

const net = context.window.MATH_NET;
const library = context.window.MATH_BIBLIOTHECA;
const errors = library.audit(net.results);
const recent = net.results.filter((item) => item.era === "recent");
const records = recent.map((item) => library.recordFor(item));

if (library.schemaVersion !== 1 || library.reviewed !== "2026-08-12") errors.push("Bibliotheca schema or review date is incorrect.");
if (Object.keys(library.works).length !== 18) errors.push("Bibliotheca must contain 18 explicit recent-work identities.");
if (records.some((record) => !record.explicit || !record.arxiv || !record.arxiv.version)) errors.push("A recent work lacks an explicit versioned arXiv identity.");
if (records.some((record) => !/^\d{4}-\d{2}-\d{2}$/.test(record.arxiv.updated))) errors.push("An arXiv identity lacks a valid update date.");

const published = recent.filter((item) => item.status === "published");
for (const item of published) {
  const record = library.recordFor(item);
  if (!record.publication || !record.publication.doi) errors.push(`${item.slug} lacks a formal publication identity.`);
  if (!library.canonicalUrl(record).startsWith("https://doi.org/")) errors.push(`${item.slug} does not resolve canonically through its DOI.`);
  if (!item.sources.some((source) => source.url.includes(record.publication.doi))) errors.push(`${item.slug} corpus sources omit its canonical DOI.`);
}

for (const item of net.results) {
  const record = library.recordFor(item);
  const csl = library.toCSL(record);
  const bib = library.toBibTeX(record);
  if (!record || !csl.title || !csl.author.length || !csl.URL) errors.push(`${item.slug} cannot produce a complete CSL record.`);
  if (!bib.startsWith("@") || !bib.includes("title = {") || !bib.includes("author = {")) errors.push(`${item.slug} cannot produce BibTeX.`);
}

if (library.works["lqg-metric-uniqueness"].publication.doi !== "10.1112/plms.12492") errors.push("LQG retains an incorrect canonical DOI.");
if (library.works["positive-mass-stability"].publication.pages !== "287-319") errors.push("Positive-mass final pagination is missing.");
if (library.works["non-simple-sle-removability"].publication.year !== 2026) errors.push("Non-simple SLE final publication year is missing.");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${records.length} canonical identities and citation exports for all ${net.results.length} folios.`);
