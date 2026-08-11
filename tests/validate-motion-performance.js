const fs = require("fs");

const portals = fs.readFileSync("portals.js", "utf8");
const script = fs.readFileSync("script.js", "utf8");
const singularis = fs.readFileSync("singularis.js", "utf8");
const result = fs.readFileSync("result.js", "utf8");
const styles = fs.readFileSync("style.css", "utf8");
const pages = [fs.readFileSync("index.html", "utf8"), fs.readFileSync("result.html", "utf8")];
const errors = [];

function expect(source, pattern, message) {
  if (!pattern.test(source)) errors.push(message);
}

expect(portals, /portal-active/, "Portal state does not retain an active phase while the inverse operator closes.");
expect(portals, /mathnet:portal-state/, "Portal state changes are not exposed to the domain renderer.");
expect(portals, /animationend/, "Portal completion still relies only on a timing guess.");
expect(styles, /\.domain-page\.portal-active\s*>\s*\.domain-portal[\s\S]*?visibility:\s*hidden/, "The forward operator is visible beneath its inverse.");

expect(script, /const fluidSprites = new Map\(\)/, "Fluid gradients are not cached as reusable sprites.");
if (/createRadialGradient\(this\.x,\s*this\.y/.test(script)) errors.push("Fluid particles recreate radial gradients every frame.");
if (/lorenzPoints\.shift\(/.test(script)) errors.push("Lorenz history still shifts the full point array every step.");
expect(script, /scene\.visible\s*&&\s*!scene\.covered/, "Covered domain canvases are not suspended.");
expect(script, /innerWidth\s*<\s*700\s*\?\s*40\s*:\s*33/, "Homepage animation cadence is not adaptive.");
expect(result, /innerWidth\s*<\s*700\s*\?\s*40\s*:\s*33/, "Result animation cadence is not adaptive.");

const loopBody = singularis.match(/function loop\([\s\S]*?\n  }\n\n  function wave/)?.[0] || "";
const waveBody = singularis.match(/function wave\([\s\S]*?\n  }\n\n  function lattice/)?.[0] || "";
if (/const points\s*=\s*\[\]/.test(loopBody + waveBody)) errors.push("Common Singularis paths allocate point arrays every frame.");

const assetVersions = pages.flatMap((page) => [...page.matchAll(/(?:src|href)="[^"]+\?v=([^"]+)"/g)].map((match) => match[1]));
if (assetVersions.length !== 15 || new Set(assetVersions).size !== 1) errors.push("HTML assets do not share one cache-busting release stamp.");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Validated conjugate portal states and animation performance guards.");
