(function () {
  "use strict";

  const NS = "http://www.w3.org/1998/Math/MathML";
  const subscriptMap = { "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9", "₊": "+", "₋": "−", "₌": "=", "₍": "(", "₎": ")", "ₐ": "a", "ₑ": "e", "ₕ": "h", "ᵢ": "i", "ⱼ": "j", "ₖ": "k", "ₗ": "l", "ₘ": "m", "ₙ": "n", "ₒ": "o", "ₚ": "p", "ᵣ": "r", "ₛ": "s", "ₜ": "t", "ᵤ": "u", "ᵥ": "v", "ₓ": "x" };
  const superscriptMap = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁺": "+", "⁻": "−", "⁼": "=", "⁽": "(", "⁾": ")", "ᵃ": "a", "ᵇ": "b", "ᶜ": "c", "ᵈ": "d", "ᵉ": "e", "ᶠ": "f", "ᵍ": "g", "ʰ": "h", "ⁱ": "i", "ʲ": "j", "ᵏ": "k", "ˡ": "l", "ᵐ": "m", "ⁿ": "n", "ᵒ": "o", "ᵖ": "p", "ʳ": "r", "ˢ": "s", "ᵗ": "t", "ᵘ": "u", "ᵛ": "v", "ʷ": "w", "ˣ": "x", "ʸ": "y", "ᶻ": "z" };
  const normalIdentifiers = new Set(["ADM", "Conf", "EFL", "GL", "KI", "SLE", "Sym", "deg", "dim", "exp", "log", "max", "min", "pmGH", "range", "rel"]);
  const operatorChars = new Set(["+", "−", "-", "=", "≄", "≁", "≠", "≥", "≤", ">", "<", "⇒", "⇔", "→", "⟶", "∈", "∉", "⊂", "⊆", "≅", "~", "∼", "∧", "∨", "\\", "|", "∥", ":", ",", ";", ".", "(", ")", "[", "]", "{", "}", "⟨", "⟩", "·", "*", "/", "∞"]);
  const largeOperators = new Set(["∫", "∮", "∏", "Σ", "∑", "max", "min"]);

  function element(name, text) {
    const node = document.createElementNS(NS, name);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function isLetter(char) {
    return typeof char === "string" && /[\p{L}]/u.test(char);
  }

  function isAsciiLetter(char) {
    return typeof char === "string" && /[A-Za-z]/.test(char);
  }

  function readRun(expression, start, predicate) {
    let end = start;
    while (end < expression.length && predicate(expression[end])) end += 1;
    return { value: expression.slice(start, end), end };
  }

  function scriptNode(value) {
    if (/^\d+$/.test(value)) return element("mn", value);
    if (normalIdentifiers.has(value)) {
      const node = element("mi", value);
      node.setAttribute("mathvariant", "normal");
      return node;
    }
    return element("mi", value);
  }

  function attachScript(row, kind, value) {
    const base = row.lastElementChild;
    if (!base) {
      row.appendChild(element(kind === "sub" ? "mi" : "mo", value));
      return;
    }
    const wrapper = element(kind === "sub" ? "msub" : "msup");
    row.removeChild(base);
    wrapper.append(base, scriptNode(value));
    row.appendChild(wrapper);
  }

  function appendWord(row, word) {
    if (word.length === 1 || normalIdentifiers.has(word)) {
      const node = element("mi", word);
      if (normalIdentifiers.has(word)) node.setAttribute("mathvariant", "normal");
      row.appendChild(node);
      return;
    }
    const node = element("mtext", word);
    row.appendChild(node);
  }

  function buildRow(expression) {
    const row = element("mrow");
    let index = 0;
    let needsSpace = false;

    while (index < expression.length) {
      const char = expression[index];
      if (/\s/.test(char)) {
        needsSpace = true;
        index += 1;
        continue;
      }
      if (needsSpace && row.lastElementChild) {
        const space = element("mspace");
        space.setAttribute("width", ".28em");
        row.appendChild(space);
      }
      needsSpace = false;

      if (char === "_") {
        const next = expression[index + 1];
        if (next === "{") {
          const end = expression.indexOf("}", index + 2);
          const value = end === -1 ? expression.slice(index + 2) : expression.slice(index + 2, end);
          attachScript(row, "sub", value.replaceAll("_", ""));
          index = end === -1 ? expression.length : end + 1;
        } else {
          const run = readRun(expression, index + 1, (value) => isLetter(value) || /\d/.test(value));
          attachScript(row, "sub", run.value || next || "");
          index = Math.max(index + 2, run.end);
        }
        continue;
      }

      if (subscriptMap[char]) {
        const run = readRun(expression, index, (value) => Boolean(subscriptMap[value]));
        attachScript(row, "sub", [...run.value].map((value) => subscriptMap[value]).join(""));
        index = run.end;
        continue;
      }

      if (superscriptMap[char]) {
        const run = readRun(expression, index, (value) => Boolean(superscriptMap[value]));
        attachScript(row, "sup", [...run.value].map((value) => superscriptMap[value]).join(""));
        index = run.end;
        continue;
      }

      if (/\d/.test(char)) {
        const run = readRun(expression, index, (value) => /[\d.]/.test(value));
        row.appendChild(element("mn", run.value));
        index = run.end;
        continue;
      }

      if (isLetter(char)) {
        if (isAsciiLetter(char)) {
          const run = readRun(expression, index, (value) => isAsciiLetter(value));
          appendWord(row, run.value);
          index = run.end;
        } else {
          appendWord(row, char);
          index += 1;
        }
        continue;
      }

      if (char === "̂") {
        const base = row.lastElementChild;
        if (base) {
          const accent = element("mover");
          accent.setAttribute("accent", "true");
          row.removeChild(base);
          accent.append(base, element("mo", "ˆ"));
          row.appendChild(accent);
        }
        index += 1;
        continue;
      }

      const operator = element("mo", char);
      if (largeOperators.has(char)) operator.setAttribute("largeop", "true");
      if (!operatorChars.has(char) && !largeOperators.has(char)) operator.setAttribute("mathvariant", "normal");
      row.appendChild(operator);
      index += 1;
    }
    return row;
  }

  function renderFormula(target, expression, options) {
    if (!target) return null;
    const settings = options || {};
    const math = element("math");
    math.setAttribute("display", settings.display || "block");
    math.setAttribute("aria-label", settings.label || expression);
    math.appendChild(buildRow(expression));
    target.replaceChildren(math);
    return math;
  }

  window.MATH_TYPES = { renderFormula };
}());
