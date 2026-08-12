const fs = require("fs");
const vm = require("vm");

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync("results-data.js", "utf8"), context);
vm.runInContext(fs.readFileSync("maintenance.js", "utf8"), context);

const net = context.window.MATH_NET;
const core = context.window.MATH_MAINTENANCE;
const errors = [];

const manifest = core.buildManifest(net.results, net.domains, net.maintenance, "2026-08-12");
if (manifest.schemaVersion !== 2) errors.push("Revision manifest schema v2 is missing.");
if (manifest.summary.results !== 36) errors.push("Manifest does not cover all 36 folios.");
if (manifest.summary.due !== 0 || manifest.summary.soon !== 0) errors.push("Fresh 2026-08-12 corpus should have no due or soon records.");
if (manifest.domains.length !== 6) errors.push("Manifest does not summarize six domains.");
if (manifest.queue.length !== 12) errors.push("Manifest queue does not obey the configured queue size.");
if (!manifest.checkpoint || manifest.checkpoint.evidence.length !== 3) errors.push("Manifest does not retain the latest canonical-identity evidence.");
if (manifest.queue[0].slug !== "furstenberg-set-conjecture" || manifest.queue[1].slug !== "last-kervaire-invariant") errors.push("Preprints are not first in the status-aware review queue.");
if (!manifest.queue.every((item) => item.actions.length === 3)) errors.push("Review queue items need three concrete actions.");
if (manifest.summary.revisionEntries !== 57) errors.push("Revision manifest does not count the 36 corpus entries and 21 source reviews.");

const furstenberg = net.bySlug["furstenberg-set-conjecture"];
const furstenbergRecord = core.recordFor(furstenberg, net.maintenance, "2026-08-11");
if (furstenberg.sourceChecked !== "2026-08-11" || furstenbergRecord.dueDate !== "2026-09-25") errors.push("Furstenberg recheck date or cadence is incorrect.");

const soon = core.recordFor(net.bySlug["positive-mass-stability"], net.maintenance, "2026-11-19");
if (soon.state !== "soon" || soon.daysRemaining !== 21) errors.push("Due-soon boundary is incorrect.");
const due = core.recordFor(net.bySlug["positive-mass-stability"], net.maintenance, "2026-12-10");
if (due.state !== "due" || due.daysRemaining !== 0) errors.push("Due-date boundary is incorrect.");
if (core.asOfFromSearch("?audit=2026-09-10", "2026-08-11") !== "2026-09-10") errors.push("Audit query override is not reproducible.");

const furstenbergTrail = core.revisionTrailFor(furstenberg, net.maintenance);
if (furstenbergTrail.length !== 2 || furstenbergTrail[0].kind !== "source-review") errors.push("Furstenberg revision trail is incomplete or unsorted.");
if (!furstenbergTrail[0].evidence || !furstenbergTrail[0].changedFields.includes("sourceChecked")) errors.push("Furstenberg revision evidence is not traceable.");
const historicTrail = core.revisionTrailFor(net.bySlug["euler-characteristic"], net.maintenance);
if (historicTrail.length !== 1 || historicTrail[0].kind !== "corpus-entry") errors.push("Historic folio should retain its initial corpus entry.");
const positiveMassTrail = core.revisionTrailFor(net.bySlug["positive-mass-stability"], net.maintenance);
if (positiveMassTrail.length !== 3 || positiveMassTrail[0].date !== "2026-08-12") errors.push("Positive-mass publication transition is missing from the revision trail.");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Validated status-aware review cadence, queue order and manifest export.");
