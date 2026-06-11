(function () {
  "use strict";

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const operators = [];

  function createNode(item) {
    const link = document.createElement("a");
    link.className = "result-node";
    link.href = `result.html?slug=${encodeURIComponent(item.slug)}`;
    link.textContent = item.title;
    return link;
  }

  function makeCanvasButton(className, label, caption) {
    const button = document.createElement("button");
    button.className = className;
    button.type = "button";
    button.setAttribute("aria-label", label);
    const canvas = document.createElement("canvas");
    const text = document.createElement("span");
    text.textContent = caption;
    button.append(canvas, text);
    return { button, canvas, ctx: canvas.getContext("2d"), width: 0, height: 0 };
  }

  function makePortal(section) {
    const key = section.dataset.domain;
    const domain = window.MATH_NET.domains[key];
    const results = window.MATH_NET.byDomain[key];
    const enter = makeCanvasButton("domain-portal", `Open ${domain.portalName}`, `ENTER · ${domain.portalName.toUpperCase()}`);
    enter.button.setAttribute("aria-expanded", "false");

    const map = document.createElement("div");
    map.className = "result-star-map";
    map.setAttribute("aria-hidden", "true");
    const exit = makeCanvasButton("portal-return", `Return through ${domain.returnName}`, `RETURN · ${domain.returnName.toUpperCase()}`);
    const recent = document.createElement("div");
    recent.className = "star-map-group";
    recent.innerHTML = "<h3>RECENTIA · 3 RESULTS</h3>";
    const historic = document.createElement("div");
    historic.className = "star-map-group";
    historic.innerHTML = "<h3>HISTORICA · 3 RESULTS</h3>";
    results.filter((item) => item.era === "recent").forEach((item) => recent.appendChild(createNode(item)));
    results.filter((item) => item.era === "historic").forEach((item) => historic.appendChild(createNode(item)));
    map.append(exit.button, recent, historic);
    section.append(enter.button, map);

    const item = { key, section, map, enter, exit, phase: "idle", transitionStart: 0, visible: true, timer: null };
    operators.push(item);

    function open() {
      operators.forEach((other) => {
        if (other === item) return;
        clearTimeout(other.timer);
        other.section.classList.remove("portal-open", "portal-transforming", "portal-inverting");
        other.enter.button.setAttribute("aria-expanded", "false");
        other.map.setAttribute("aria-hidden", "true");
        other.phase = "idle";
      });
      clearTimeout(item.timer);
      item.phase = "opening";
      item.transitionStart = performance.now();
      section.classList.add("portal-open", "portal-transforming");
      enter.button.setAttribute("aria-expanded", "true");
      map.setAttribute("aria-hidden", "false");
      item.timer = setTimeout(() => {
        item.phase = "open";
        section.classList.remove("portal-transforming");
        map.querySelector(".result-node")?.focus({ preventScroll: true });
      }, reduceMotion ? 1 : 720);
    }

    function close() {
      clearTimeout(item.timer);
      item.phase = "closing";
      item.transitionStart = performance.now();
      section.classList.add("portal-transforming", "portal-inverting");
      item.timer = setTimeout(() => {
        section.classList.remove("portal-open", "portal-transforming", "portal-inverting");
        enter.button.setAttribute("aria-expanded", "false");
        map.setAttribute("aria-hidden", "true");
        item.phase = "idle";
        enter.button.focus({ preventScroll: true });
      }, reduceMotion ? 1 : 780);
    }

    enter.button.addEventListener("click", open);
    exit.button.addEventListener("click", close);
    section.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && section.classList.contains("portal-open")) close();
    });
  }

  document.querySelectorAll(".domain-page[data-domain]").forEach(makePortal);

  function resizePart(part) {
    const rect = part.canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    part.width = rect.width;
    part.height = rect.height;
    part.canvas.width = Math.max(1, rect.width * dpr);
    part.canvas.height = Math.max(1, rect.height * dpr);
    part.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function ink(ctx, alpha = .5, width = 1, red = false) {
    ctx.strokeStyle = red ? `rgba(125,56,41,${alpha})` : `rgba(55,39,24,${alpha})`;
    ctx.lineWidth = width;
  }

  function dot(ctx, x, y, radius = 3, red = false) {
    ctx.fillStyle = red ? "rgba(125,56,41,.78)" : "rgba(55,39,24,.68)";
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  }

  function drawTopology(part, time, inverse, pulse) {
    const { ctx, width: w, height: h } = part;
    const cx = w / 2; const cy = h / 2; const r = Math.min(w, h) * .32;
    const direction = inverse ? -1 : 1;
    const crossing = Math.sin(time * .0012 * direction) * .22 + pulse * direction * .45;
    ctx.save(); ctx.translate(cx, cy); ink(ctx, .56, 1.2);
    for (let strand = -1; strand <= 1; strand++) {
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const t = i / 120 * Math.PI * 2;
        const x = Math.cos(t) * r * (1 + .12 * Math.cos(t * 3));
        const y = Math.sin(t * 2 + strand * .65 + crossing) * r * .47 + strand * 7;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ink(ctx, .65, 1.3, true);
    ctx.beginPath(); ctx.arc(0, 0, r * (.22 + pulse * .3), 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  function euclidSequence(a, b) {
    const rows = [];
    while (b && rows.length < 7) {
      rows.push([a, b, Math.floor(a / b), a % b]);
      [a, b] = [b, a % b];
    }
    return rows;
  }

  function drawNumber(part, time, inverse, pulse) {
    const { ctx, width: w, height: h } = part;
    const rows = euclidSequence(89, 34);
    ctx.font = `italic ${Math.max(10, w * .06)}px "Cambria Math"`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    rows.forEach((row, index) => {
      const i = inverse ? rows.length - 1 - index : index;
      const x = w * (.22 + (i % 2) * .3 + pulse * .08 * (inverse ? -1 : 1));
      const y = h * (.18 + index * .1);
      ctx.fillStyle = index === rows.length - 1 ? "rgba(125,56,41,.8)" : "rgba(55,39,24,.55)";
      ctx.fillText(inverse ? `${row[3]}=${row[0]}−${row[2]}·${row[1]}` : `${row[0]}=${row[2]}·${row[1]}+${row[3]}`, x, y);
      if (index < rows.length - 1) {
        ink(ctx, .32, .8); ctx.beginPath(); ctx.moveTo(x, y + 8); ctx.lineTo(w - x, y + h * .075); ctx.stroke();
      }
    });
    ctx.fillStyle = "rgba(125,56,41,.75)";
    ctx.font = `italic ${w * .15}px "Cambria Math"`;
    ctx.fillText(inverse ? "1=−13·89+34·34" : "gcd", w / 2, h * .86);
  }

  function drawComplex(part, time, inverse, pulse) {
    const { ctx, width: w, height: h } = part;
    const cx = w / 2; const cy = h / 2; const direction = inverse ? -1 : 1;
    dot(ctx, cx, cy, 3, true);
    ink(ctx, .55, 1);
    ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(w * .9, cy); ctx.stroke(); ctx.setLineDash([]);
    for (let sheet = 0; sheet < 3; sheet++) {
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const a = direction * (i / 120 * Math.PI * 2.1 + time * .00045) + sheet * .18;
        const r = 9 + i / 120 * Math.min(w, h) * (.28 + pulse * .08);
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r * .68;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(125,56,41,.75)"; ctx.font = `italic ${w * .12}px "Cambria Math"`; ctx.fillText(inverse ? "z̄" : "√z", w * .12, h * .2);
  }

  function drawGeometry(part, time, inverse, pulse) {
    const { ctx, width: w, height: h } = part;
    const cx = w / 2; const cy = h / 2; const r = Math.min(w, h) * .31;
    const direction = inverse ? -1 : 1;
    ink(ctx, .42, .9); ctx.beginPath(); ctx.ellipse(cx, cy, r, r * .62, -.3, 0, Math.PI * 2); ctx.stroke();
    const a = direction * time * .00065 + pulse * direction * Math.PI;
    const x = cx + Math.cos(a) * r; const y = cy + Math.sin(a) * r * .62;
    const holonomy = a + direction * .65;
    ink(ctx, .7, 1.4, true); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(holonomy) * r * .45, y + Math.sin(holonomy) * r * .45); ctx.stroke();
    dot(ctx, x, y, 3);
    ink(ctx, .25, .7); ctx.beginPath(); ctx.arc(cx, cy, r * .22, 0, Math.PI * 2); ctx.stroke();
  }

  function graphPoints(w, h) {
    return [[.2,.3],[.43,.2],[.7,.28],[.8,.62],[.55,.76],[.25,.68]].map(([x,y]) => [w*x,h*y]);
  }

  function drawGraph(part, time, inverse, pulse) {
    const { ctx, width: w, height: h } = part;
    const pts = graphPoints(w, h);
    const merge = inverse ? 1 - pulse : pulse;
    const a = pts[1]; const b = pts[2];
    const midpoint = [(a[0]+b[0])/2,(a[1]+b[1])/2];
    const transformed = pts.map((p, i) => {
      if (i !== 1 && i !== 2) return p;
      return [p[0] + (midpoint[0]-p[0])*merge, p[1] + (midpoint[1]-p[1])*merge];
    });
    const edges = [[0,1],[0,5],[1,2],[1,4],[2,3],[2,4],[3,4],[4,5]];
    ink(ctx, .45, .9); edges.forEach(([i,j]) => { ctx.beginPath(); ctx.moveTo(...transformed[i]); ctx.lineTo(...transformed[j]); ctx.stroke(); });
    transformed.forEach((p,i) => dot(ctx,...p, i===1||i===2 ? 4 : 3, i===1||i===2));
    if (inverse) {
      ctx.setLineDash([3,4]); ink(ctx,.35,.8,true); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); ctx.setLineDash([]);
    }
  }

  function drawHarmonic(part, time, inverse, pulse) {
    const { ctx, width: w, height: h } = part;
    const center = h / 2;
    if (!inverse) {
      for (let packet = 0; packet < 5; packet++) {
        const py = h * (.2 + packet * .15);
        ctx.strokeStyle = packet === 2 ? "rgba(125,56,41,.7)" : "rgba(55,39,24,.32)";
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const envelope = Math.exp(-Math.pow((x-w*.5)/(w*(.1+packet*.015)),2));
          const y = py + Math.sin(x*.14*(packet+1)+time*.001)*envelope*h*.045;
          if (x===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        }
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = "rgba(125,56,41,.7)"; ctx.beginPath();
      for (let x=0;x<=w;x+=2) {
        let sum=0; for(let n=1;n<=5;n++) sum += Math.sin(x*.035*n-time*.001*n)/n;
        const y=center+sum*h*.09*(.6+pulse*.4);
        if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      } ctx.stroke();
      ink(ctx,.25,.8); for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(w*.15+i*w*.17,center,10+i*4,0,Math.PI*2);ctx.stroke();}
    }
  }

  const drawers = { topology: drawTopology, number: drawNumber, complex: drawComplex, geometry: drawGeometry, graph: drawGraph, harmonic: drawHarmonic };

  function resize(item) {
    resizePart(item.enter);
    resizePart(item.exit);
  }

  function frame(time) {
    operators.forEach((item) => {
      if (!item.visible) return;
      const elapsed = Math.min(1, Math.max(0, (time - item.transitionStart) / 720));
      const pulse = item.phase === "opening" ? elapsed : item.phase === "closing" ? elapsed : .5 + Math.sin(time * .0015) * .12;
      item.enter.ctx.clearRect(0, 0, item.enter.width, item.enter.height);
      item.exit.ctx.clearRect(0, 0, item.exit.width, item.exit.height);
      drawers[item.key](item.enter, time, false, pulse);
      drawers[item.key](item.exit, time, true, pulse);
    });
    if (!reduceMotion) requestAnimationFrame(frame);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const item = operators.find((candidate) => candidate.section === entry.target);
      if (item) item.visible = entry.isIntersecting;
    });
  });
  operators.forEach((item) => { resize(item); observer.observe(item.section); });
  addEventListener("resize", () => operators.forEach(resize));
  frame(reduceMotion ? 0 : performance.now());
}());
