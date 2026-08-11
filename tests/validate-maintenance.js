const fs = require("fs");
const vm = require("vm");

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync("results-data.js", "utf8"), context);
vm.runInContext(fs.readFileSync("maintenance.js", "utf8"), context);

const net = context.window.MATH_NET;
const core = context.window.MATH_MAINTENANCE;
const errors = [];

const manifest = core.buildManifest(net.results, net.domains, net.maintenance, "2026-08-11");
if (manifest.summary.results !== 36) errors.push("Manifest does not cover all 36 folios.");
if (manifest.summary.due !== 0 || manifest.summary.soon !== 0) errors.push("Fresh 2026-08-11 corpus should have no due or soon records.");
if (manifest.domains.length !== 6) errors.push("Manifest does not summarize six domains.");
if (manifest.queue.length !== 12) errors.push("Manifest queue does not obey the configured queue size.");
if (!manifest.checkpoint || manifest.checkpoint.evidence.length !== 4) errors.push("Manifest does not retain checkpoint evidence.");
if (manifest.queue[0].slug !== "non-simple-sle-removability" || manifest.queue[1].slug !== "positive-mass-stability") errors.push("Accepted preprints are not first in the review queue.");
if (!manifest.queue.every((item) => item.actions.length === 3)) errors.push("Review queue items need three concrete actions.");

const furstenberg = net.bySlug["furstenberg-set-conjecture"];
const furstenbergRecord = core.recordFor(furstenberg, net.maintenance, "2026-08-11");
if (furstenberg.sourceChecked !== "2026-08-11" || furstenbergRecord.dueDate !== "2026-09-25") errors.push("Furstenberg recheck date or cadence is incorrect.");

const soon = core.recordFor(net.bySlug["positive-mass-stability"], net.maintenance, "2026-08-20");
if (soon.state !== "soon" || soon.daysRemaining !== 21) errors.push("Due-soon boundary is incorrect.");
const due = core.recordFor(net.bySlug["positive-mass-stability"], net.maintenance, "2026-09-10");
if (due.state !== "due" || due.daysRemaining !== 0) errors.push("Due-date boundary is incorrect.");
if (core.asOfFromSearch("?audit=2026-09-10", "2026-08-11") !== "2026-09-10") errors.push("Audit query override is not reproducible.");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Validated status-aware review cadence, queue order and manifest export.");
