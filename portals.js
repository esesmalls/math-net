(function () {
  "use strict";

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const portals = [];

  function createNode(item) {
    const link = document.createElement("a");
    link.className = "result-node";
    link.href = `result.html?slug=${encodeURIComponent(item.slug)}`;
    link.textContent = item.title;
    return link;
  }

  function makePortal(section) {
    const key = section.dataset.domain;
    const domain = window.MATH_NET.domains[key];
    const results = window.MATH_NET.byDomain[key];
    const button = document.createElement("button");
    button.className = "domain-portal";
    button.type = "button";
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", `Open ${domain.portalName}`);
    const canvas = document.createElement("canvas");
    const label = document.createElement("span");
    label.textContent = `ENTER · ${domain.portalName.toUpperCase()}`;
    button.append(canvas, label);

    const map = document.createElement("div");
    map.className = "result-star-map";
    map.setAttribute("aria-hidden", "true");
    const close = document.createElement("button");
    close.className = "portal-return";
    close.type = "button";
    close.textContent = `RETURN · ${domain.returnName.toUpperCase()}`;
    const recent = document.createElement("div");
    recent.className = "star-map-group";
    recent.innerHTML = "<h3>RECENTIA · 3 RESULTS</h3>";
    const historic = document.createElement("div");
    historic.className = "star-map-group";
    historic.innerHTML = "<h3>HISTORICA · 3 RESULTS</h3>";
    results.filter((item) => item.era === "recent").forEach((item) => recent.appendChild(createNode(item)));
    results.filter((item) => item.era === "historic").forEach((item) => historic.appendChild(createNode(item)));
    map.append(close, recent, historic);
    section.append(button, map);

    function setOpen(open) {
      document.querySelectorAll(".domain-page.portal-open").forEach((other) => {
        if (other !== section) other.classList.remove("portal-open");
      });
      section.classList.toggle("portal-open", open);
      button.setAttribute("aria-expanded", String(open));
      map.setAttribute("aria-hidden", String(!open));
      if (open) {
        const first = map.querySelector(".result-node");
        if (first) first.focus({ preventScroll: true });
      } else {
        button.focus({ preventScroll: true });
      }
    }
    button.addEventListener("click", () => setOpen(true));
    close.addEventListener("click", () => setOpen(false));
    section.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && section.classList.contains("portal-open")) setOpen(false);
    });

    const ctx = canvas.getContext("2d");
    portals.push({ key, canvas, ctx, width: 0, height: 0, visible: true });
  }

  document.querySelectorAll(".domain-page[data-domain]").forEach(makePortal);

  function resize(item) {
    const rect = item.canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    item.width = rect.width;
    item.height = rect.height;
    item.canvas.width = Math.max(1, rect.width * dpr);
    item.canvas.height = Math.max(1, rect.height * dpr);
    item.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function line(ctx, alpha, width) {
    ctx.strokeStyle = `rgba(55,39,24,${alpha})`;
    ctx.lineWidth = width || 1;
  }

  function drawPortal(item, time) {
    const { ctx, width: w, height: h, key } = item;
    const cx = w / 2; const cy = h / 2; const r = Math.min(w, h) * .32;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    if (key === "topology") {
      line(ctx, .55, 1);
      for (let strand = 0; strand < 3; strand++) {
        ctx.beginPath();
        for (let i = 0; i <= 100; i++) {
          const a = i / 100 * Math.PI * 2;
          const rr = r * (.72 + .22 * Math.sin(a * 3 + time * .001 + strand));
          const x = cx + Math.cos(a + strand * .18) * rr;
          const y = cy + Math.sin(a * 2 + strand) * rr * .55;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    } else if (key === "number") {
      ctx.font = `italic ${Math.max(9, w * .07)}px "Cambria Math"`;
      ctx.fillStyle = "rgba(55,39,24,.52)";
      for (let i = 0; i < 30; i++) {
        const a = i * 2.399 + time * .0001;
        const rr = Math.sqrt(i) * r * .19;
        ctx.fillText(String((i * 7 + 1) % 10), cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      }
    } else if (key === "complex") {
      line(ctx, .45, 1);
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        const rr = r * (.25 + i * .18);
        ctx.arc(cx, cy, rr, time * .0004 + i, time * .0004 + i + Math.PI * 1.55);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(125,56,41,.75)"; ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
    } else if (key === "geometry") {
      line(ctx, .42, .9);
      const a = time * .0005;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, r * .55, a, a + Math.PI * 1.35); ctx.stroke();
    } else if (key === "graph") {
      const pts = Array.from({ length: 7 }, (_, i) => {
        const a = i / 7 * Math.PI * 2 + time * .00015 * (i % 2 ? 1 : -1);
        return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
      });
      line(ctx, .4, .8);
      pts.forEach((p, i) => { const q = pts[(i * 3 + 2) % pts.length]; ctx.beginPath(); ctx.moveTo(...p); ctx.lineTo(...q); ctx.stroke(); });
      pts.forEach((p, i) => { ctx.fillStyle = i < 2 ? "rgba(125,56,41,.75)" : "rgba(55,39,24,.6)"; ctx.beginPath(); ctx.arc(...p, 3, 0, Math.PI * 2); ctx.fill(); });
    } else {
      let x = cx; let y = cy; line(ctx, .4, .8);
      for (let i = 0; i < 5; i++) {
        const rr = r / (i + 1);
        const a = (i * 2 + 1) * time * .0007;
        ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.stroke();
        x += Math.cos(a) * rr; y += Math.sin(a) * rr;
      }
      ctx.fillStyle = "rgba(125,56,41,.75)"; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function frame(time) {
    portals.forEach((item) => { if (item.visible) drawPortal(item, time); });
    if (!reduceMotion) requestAnimationFrame(frame);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const portal = portals.find((item) => item.canvas === entry.target);
      if (portal) portal.visible = entry.isIntersecting;
    });
  });
  portals.forEach((item) => { resize(item); observer.observe(item.canvas); });
  addEventListener("resize", () => portals.forEach(resize));
  frame(reduceMotion ? 0 : performance.now());
}());
