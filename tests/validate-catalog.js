const fs = require("fs");
const vm = require("vm");

class FakeNode {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.dataset = {};
    this.attributes = {};
    this.listeners = {};
    this.hidden = false;
    this.textContent = "";
  }

  append(...nodes) { nodes.forEach((node) => this.appendChild(node)); }
  appendChild(node) { node.parentElement = this; this.children.push(node); return node; }
  replaceChildren(...nodes) { this.children = []; this.append(...nodes); }
  setAttribute(name, value) { this.attributes[name] = value; }
  addEventListener(name, listener) { this.listeners[name] = listener; }
  querySelectorAll(selector) {
    const found = [];
    const visit = (node) => {
      if (selector === "button" && node.tagName === "BUTTON") found.push(node);
      node.children.forEach(visit);
    };
    this.children.forEach(visit);
    return found;
  }
}

const dataContext = { window: {} };
vm.createContext(dataContext);
vm.runInContext(fs.readFileSync("results-data.js", "utf8"), dataContext);

const nodes = Object.fromEntries([
  "#catalog-ledger", "#catalog-domain-filter", "#catalog-era-filter", "#catalog-audit", "#catalog-checkpoint"
].map((selector) => [selector, new FakeNode("div")]));
const document = {
  querySelector: (selector) => nodes[selector] || null,
  createElement: (tagName) => new FakeNode(tagName)
};
const catalogContext = { window: dataContext.window, document, Date, encodeURIComponent };
vm.createContext(catalogContext);
vm.runInContext(fs.readFileSync("catalog.js", "utf8"), catalogContext);

const ledger = nodes["#catalog-ledger"];
const domainFilter = nodes["#catalog-domain-filter"];
const eraFilter = nodes["#catalog-era-filter"];
const errors = [];

function descendants(node, tagName, hidden = false) {
  const nextHidden = hidden || node.hidden;
  const own = node.tagName === tagName && !nextHidden ? [node] : [];
  return own.concat(node.children.flatMap((child) => descendants(child, tagName, nextHidden)));
}

if (ledger.children.length !== 6) errors.push(`Expected 6 catalog domain rows, found ${ledger.children.length}.`);
if (descendants(ledger, "A").length !== 36) errors.push("Initial catalog does not expose 36 result links.");
if (domainFilter.children.length !== 7) errors.push("Catalog field filter is incomplete.");
if (eraFilter.children.length !== 3) errors.push("Catalog era filter is incomplete.");
if (!nodes["#catalog-audit"].textContent.includes("36 FOLIOS")) errors.push("Catalog audit summary is missing.");

eraFilter.children.find((node) => node.textContent === "RECENTIA").listeners.click();
if (descendants(ledger, "A").length !== 18) errors.push("Recentia filter should expose 18 result links.");

domainFilter.children.find((node) => node.textContent === "NUMERORUM THEORIA").listeners.click();
if (ledger.children.length !== 1) errors.push("Domain filter should expose one ledger row.");
if (descendants(ledger, "A").length !== 3) errors.push("Filtered recent domain should expose 3 result links.");

eraFilter.children.find((node) => node.textContent === "BOTH").listeners.click();
if (descendants(ledger, "A").length !== 6) errors.push("Combined filtered domain should expose 6 result links.");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Validated catalog rendering and filters.");
