const fs = require("fs");
const vm = require("vm");

class FakeNode {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.attributes = {};
    this._text = "";
  }

  get textContent() { return this._text + this.children.map((child) => child.textContent).join(""); }
  set textContent(value) { this._text = String(value); this.children = []; }
  get lastElementChild() { return this.children.at(-1) || null; }
  append(...nodes) { nodes.forEach((node) => this.appendChild(node)); }
  appendChild(node) { node.parentElement = this; this.children.push(node); return node; }
  removeChild(node) { this.children.splice(this.children.indexOf(node), 1); node.parentElement = null; return node; }
  replaceChildren(...nodes) { this._text = ""; this.children = []; this.append(...nodes); }
  setAttribute(name, value) { this.attributes[name] = String(value); }
}

const document = {
  createElementNS: (_namespace, tagName) => new FakeNode(tagName)
};
const context = { window: {}, document };
vm.createContext(context);
vm.runInContext(fs.readFileSync("results-data.js", "utf8"), context);
vm.runInContext(fs.readFileSync("mathml.js", "utf8"), context);

const errors = [];
const counts = {};
function visit(node) {
  counts[node.tagName] = (counts[node.tagName] || 0) + 1;
  node.children.forEach(visit);
}

for (const result of context.window.MATH_NET.results) {
  const target = new FakeNode("div");
  const math = context.window.MATH_TYPES.renderFormula(target, result.formula, { label: result.formula });
  if (!math || math.tagName !== "MATH") errors.push(`${result.slug} did not render a MathML root.`);
  if (math && math.attributes["aria-label"] !== result.formula) errors.push(`${result.slug} lost its accessible formula label.`);
  if (!target.children.length || !target.textContent.trim()) errors.push(`${result.slug} rendered an empty formula.`);
  if (math) visit(math);
}

const indexHtml = fs.readFileSync("index.html", "utf8");
const resultHtml = fs.readFileSync("result.html", "utf8");
if (!(indexHtml.indexOf("results-data.js") < indexHtml.indexOf("mathml.js") && indexHtml.indexOf("mathml.js") < indexHtml.indexOf("catalog.js"))) errors.push("Homepage MathML scripts are in the wrong order.");
if (!(resultHtml.indexOf("results-data.js") < resultHtml.indexOf("mathml.js") && resultHtml.indexOf("mathml.js") < resultHtml.indexOf("result.js"))) errors.push("Result-page MathML scripts are in the wrong order.");

if ((counts.MSUB || 0) < 20) errors.push(`Expected semantic subscripts, found ${counts.MSUB || 0}.`);
if ((counts.MSUP || 0) < 15) errors.push(`Expected semantic superscripts, found ${counts.MSUP || 0}.`);
if (!(counts.MI && counts.MO && counts.MN && counts.MTEXT)) errors.push("MathML token classes are incomplete.");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated MathML rendering for ${context.window.MATH_NET.results.length} formulas (${counts.MSUB} subscripts, ${counts.MSUP} superscripts).`);
