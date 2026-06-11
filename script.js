const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const mouse = { x: innerWidth * 0.6, y: innerHeight * 0.45, px: innerWidth * 0.6, py: innerHeight * 0.45 };
const cursor = $(".cursor-orbit");

window.addEventListener("pointermove", (event) => {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
});

function animateCursor() {
  mouse.px += (mouse.x - mouse.px) * 0.12;
  mouse.py += (mouse.y - mouse.py) * 0.12;
  cursor.style.left = `${mouse.px}px`;
  cursor.style.top = `${mouse.py}px`;
  requestAnimationFrame(animateCursor);
}
animateCursor();

$$("a, .field-card, .note-paper").forEach((element) => {
  element.addEventListener("pointerenter", () => cursor.classList.add("active"));
  element.addEventListener("pointerleave", () => cursor.classList.remove("active"));
});

$$(".magnetic").forEach((element) => {
  element.addEventListener("pointermove", (event) => {
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    element.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
  });
  element.addEventListener("pointerleave", () => {
    element.style.transform = "";
  });
});

const split = $(".split-text");
split.innerHTML = [...split.textContent].map((char, index) =>
  char === " " ? " " : `<span class="char" style="transition-delay:${index * 8}ms">${char}</span>`
).join("");

split.addEventListener("pointermove", (event) => {
  $$(".char", split).forEach((char) => {
    const rect = char.getBoundingClientRect();
    const distance = Math.hypot(event.clientX - (rect.left + rect.width / 2), event.clientY - (rect.top + rect.height / 2));
    const lift = Math.max(0, 32 - distance * 0.1);
    char.style.transform = `translateY(${-lift}px) rotate(${(rect.left - event.clientX) * 0.015}deg)`;
  });
});
split.addEventListener("pointerleave", () => $$(".char", split).forEach((char) => char.style.transform = ""));

$$(".tilt-card").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const rx = ((event.clientY - rect.top) / rect.height - 0.5) * -10;
    const ry = ((event.clientX - rect.left) / rect.width - 0.5) * 10;
    card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateZ(8px)`;
  });
  card.addEventListener("pointerleave", () => card.style.transform = "");
});

const fluid = $("#fluid");
const fctx = fluid.getContext("2d", { alpha: true });
let fw = 0;
let fh = 0;
let particles = [];

class FluidParticle {
  constructor(index) {
    this.index = index;
    this.reset(true);
  }
  reset(initial = false) {
    this.x = Math.random() * fw;
    this.y = initial ? Math.random() * fh : fh + 30;
    this.radius = 35 + Math.random() * 120;
    this.speed = 0.12 + Math.random() * 0.38;
    this.phase = Math.random() * Math.PI * 2;
    this.tint = Math.random() > 0.7 ? "91,53,32" : Math.random() > 0.5 ? "126,79,44" : "67,53,35";
  }
  update(time) {
    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const dist = Math.max(90, Math.hypot(dx, dy));
    const influence = Math.min(1, 190 / dist);
    this.x += Math.sin(time * 0.00035 + this.phase) * 0.55 + (dx / dist) * influence * 0.7;
    this.y -= this.speed + Math.cos(time * 0.00027 + this.phase) * 0.18 + (dy / dist) * influence * 0.2;
    if (this.y < -this.radius * 2) this.reset();
  }
  draw() {
    const gradient = fctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
    gradient.addColorStop(0, `rgba(${this.tint}, .09)`);
    gradient.addColorStop(0.45, `rgba(${this.tint}, .04)`);
    gradient.addColorStop(1, `rgba(${this.tint}, 0)`);
    fctx.fillStyle = gradient;
    fctx.beginPath();
    fctx.ellipse(this.x, this.y, this.radius * 0.72, this.radius, Math.sin(this.phase) * 2, 0, Math.PI * 2);
    fctx.fill();
  }
}

function resizeFluid() {
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  fw = innerWidth;
  fh = innerHeight;
  fluid.width = fw * dpr;
  fluid.height = fh * dpr;
  fluid.style.width = `${fw}px`;
  fluid.style.height = `${fh}px`;
  fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  particles = Array.from({ length: Math.min(34, Math.max(18, Math.floor(fw / 55))) }, (_, i) => new FluidParticle(i));
}

function renderFluid(time) {
  fctx.clearRect(0, 0, fw, fh);
  fctx.globalCompositeOperation = "multiply";
  particles.forEach((particle) => {
    particle.update(time);
    particle.draw();
  });
  fctx.globalCompositeOperation = "source-over";
  if (!prefersReducedMotion) requestAnimationFrame(renderFluid);
}
resizeFluid();
requestAnimationFrame(renderFluid);

const attractor = $("#attractor");
const actx = attractor.getContext("2d");
let aw = 0;
let ah = 0;
let lorenzPoints = [];
let lorenzState = { x: 0.1, y: 0, z: 0 };

function resizeAttractor() {
  const rect = attractor.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  aw = rect.width;
  ah = rect.height;
  attractor.width = aw * dpr;
  attractor.height = ah * dpr;
  actx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function stepLorenz() {
  const dt = 0.005;
  const sigma = 10;
  const rho = 28 + ((mouse.x / innerWidth) - 0.5) * 3;
  const beta = 8 / 3;
  const { x, y, z } = lorenzState;
  lorenzState.x += sigma * (y - x) * dt;
  lorenzState.y += (x * (rho - z) - y) * dt;
  lorenzState.z += (x * y - beta * z) * dt;
  lorenzPoints.push({ ...lorenzState });
  if (lorenzPoints.length > 2200) lorenzPoints.shift();
}

function renderAttractor() {
  for (let i = 0; i < (prefersReducedMotion ? 700 : 7); i++) stepLorenz();
  actx.clearRect(0, 0, aw, ah);
  actx.save();
  actx.translate(aw / 2, ah / 2);
  const scale = Math.min(aw, ah) / 54;
  const angle = performance.now() * 0.00004 + (mouse.x / innerWidth - 0.5) * 0.25;
  actx.rotate(angle * 0.18);
  actx.beginPath();
  lorenzPoints.forEach((point, index) => {
    const depth = point.z;
    const px = point.x * scale * 0.95 + Math.sin(depth * 0.045 + angle) * depth * 0.5;
    const py = (point.z - 25) * scale * 0.78 + point.y * Math.sin(angle) * 0.6;
    if (index === 0) actx.moveTo(px, py);
    else actx.lineTo(px, py);
  });
  const gradient = actx.createLinearGradient(-aw / 2, 0, aw / 2, 0);
  gradient.addColorStop(0, "rgba(91,53,32,.14)");
  gradient.addColorStop(0.5, "rgba(48,37,24,.78)");
  gradient.addColorStop(1, "rgba(125,56,41,.4)");
  actx.strokeStyle = gradient;
  actx.lineWidth = 0.8;
  actx.stroke();
  actx.restore();
  if (!prefersReducedMotion) requestAnimationFrame(renderAttractor);
}
resizeAttractor();
requestAnimationFrame(renderAttractor);

const domainScenes = $$(".domain-canvas").map((canvas) => ({
  canvas,
  ctx: canvas.getContext("2d"),
  type: canvas.dataset.domain,
  width: 0,
  height: 0,
  visible: false,
  frame: 0
}));

function resizeDomainScene(scene) {
  const rect = scene.canvas.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  scene.width = rect.width;
  scene.height = rect.height;
  scene.canvas.width = Math.max(1, rect.width * dpr);
  scene.canvas.height = Math.max(1, rect.height * dpr);
  scene.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function inkLine(ctx, alpha = 0.28, width = 1) {
  ctx.strokeStyle = `rgba(52, 38, 24, ${alpha})`;
  ctx.lineWidth = width;
}

function projectPoint(x, y, z, cx, cy, scale) {
  const depth = 4.8 + z;
  return [cx + x * scale / depth, cy + y * scale / depth];
}

function drawTopology(scene, time) {
  const { ctx, width: w, height: h } = scene;
  const cx = w * 0.58;
  const cy = h * 0.52;
  const rot = time * 0.00018;
  ctx.save();
  inkLine(ctx, 0.3, 0.8);
  for (let ring = 0; ring < 20; ring++) {
    ctx.beginPath();
    const v = (ring / 20) * Math.PI * 2;
    for (let step = 0; step <= 90; step++) {
      const u = (step / 90) * Math.PI * 2;
      const R = 2.1;
      const r = 0.72 + Math.sin(time * 0.0007 + v * 2) * 0.05;
      let x = (R + r * Math.cos(v)) * Math.cos(u);
      let y = (R + r * Math.cos(v)) * Math.sin(u);
      let z = r * Math.sin(v);
      const xr = x * Math.cos(rot) - y * Math.sin(rot);
      const yr = x * Math.sin(rot) + y * Math.cos(rot);
      const zr = z * Math.cos(0.8) - yr * Math.sin(0.8);
      const py = z * Math.sin(0.8) + yr * Math.cos(0.8);
      const [sx, sy] = projectPoint(xr, py, zr, cx, cy, Math.min(w, h) * 0.78);
      if (step === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}

const primeCache = Array.from({ length: 1200 }, (_, n) => isPrime(n));
function drawNumber(scene, time) {
  const { ctx, width: w, height: h } = scene;
  const cx = w * 0.55;
  const cy = h * 0.52;
  const max = Math.min(1150, Math.floor(Math.min(w, h) * 1.4));
  const scale = Math.min(w, h) / Math.sqrt(max) * 0.42;
  ctx.save();
  for (let n = 1; n < max; n++) {
    const angle = n * 2.399963 + time * 0.000025;
    const radius = Math.sqrt(n) * scale;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    const prime = primeCache[n];
    ctx.fillStyle = prime ? "rgba(112,48,34,.7)" : "rgba(55,42,25,.12)";
    const size = prime ? 1.3 + Math.sin(time * 0.002 + n) * 0.45 : 0.55;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawComplex(scene, time) {
  const { ctx, width: w, height: h } = scene;
  const cell = Math.max(7, Math.round(Math.min(w, h) / 95));
  const drift = time * 0.0001;
  for (let y = 0; y < h; y += cell) {
    for (let x = 0; x < w; x += cell) {
      const zx = (x / w - 0.5) * 4.4;
      const zy = (y / h - 0.5) * 3.2;
      const re = zx * zx * zx - 3 * zx * zy * zy - 1;
      const im = 3 * zx * zx * zy - zy * zy * zy;
      const arg = Math.atan2(im, re) + drift;
      const mod = Math.log1p(Math.hypot(re, im));
      const wave = 0.5 + 0.5 * Math.sin(arg * 3 + mod * 4);
      const red = Math.round(72 + wave * 82);
      const green = Math.round(43 + wave * 30);
      ctx.fillStyle = `rgba(${red},${green},25,${0.1 + wave * 0.2})`;
      ctx.fillRect(x, y, cell + 1, cell + 1);
    }
  }
  ctx.save();
  inkLine(ctx, 0.25, 0.8);
  ctx.beginPath();
  ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
  ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
  ctx.stroke();
  [[1, 0], [-0.5, Math.sqrt(3) / 2], [-0.5, -Math.sqrt(3) / 2]].forEach(([zx, zy], index) => {
    const x = w * (0.5 + zx / 4.4);
    const y = h * (0.5 + zy / 3.2);
    ctx.strokeStyle = "rgba(120,50,35,.72)";
    ctx.beginPath();
    ctx.arc(x, y, 10 + Math.sin(time * 0.001 + index) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(80,43,27,.76)";
    ctx.font = "italic 14px 'Cambria Math'";
    ctx.fillText(`z${index + 1}`, x + 14, y - 10);
  });
  ctx.restore();
}

function drawGeometry(scene, time) {
  const { ctx, width: w, height: h } = scene;
  const cx = w * 0.54;
  const cy = h * 0.53;
  const amp = Math.min(w, h) * 0.16;
  const warp = (x, y) => {
    const dx = x - cx;
    const dy = y - cy;
    const d = Math.hypot(dx, dy) / Math.min(w, h);
    const lift = Math.exp(-d * d * 14) * amp * (0.84 + Math.sin(time * 0.0006) * 0.08);
    return [x + dx * lift / Math.min(w, h) * 0.35, y - lift + dy * lift / Math.min(w, h) * 0.18];
  };
  ctx.save();
  inkLine(ctx, 0.24, 0.8);
  const gap = Math.max(34, Math.min(w, h) / 16);
  for (let y = -gap; y < h + gap; y += gap) {
    ctx.beginPath();
    for (let x = -gap; x <= w + gap; x += 8) {
      const p = warp(x, y);
      if (x === -gap) ctx.moveTo(...p); else ctx.lineTo(...p);
    }
    ctx.stroke();
  }
  for (let x = -gap; x < w + gap; x += gap) {
    ctx.beginPath();
    for (let y = -gap; y <= h + gap; y += 8) {
      const p = warp(x, y);
      if (y === -gap) ctx.moveTo(...p); else ctx.lineTo(...p);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(120,50,35,.55)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i <= 180; i++) {
    const x = (i / 180) * w;
    const y = cy + Math.sin(i * 0.045 + time * 0.0005) * h * 0.12;
    const p = warp(x, y);
    if (i === 0) ctx.moveTo(...p); else ctx.lineTo(...p);
  }
  ctx.stroke();
  ctx.restore();
}

const graphEdges = [[0,1],[0,3],[0,5],[1,2],[1,4],[2,3],[2,6],[3,4],[3,7],[4,5],[4,8],[5,6],[5,9],[6,7],[7,8],[8,9],[1,8],[2,9]];
function drawGraph(scene, time) {
  const { ctx, width: w, height: h } = scene;
  const cx = w * 0.55;
  const cy = h * 0.52;
  const r = Math.min(w, h) * 0.31;
  const nodes = Array.from({ length: 10 }, (_, i) => {
    const a = i / 10 * Math.PI * 2 + time * 0.00008 * (i % 2 ? 1 : -1);
    const rr = r * (0.62 + (i % 3) * 0.16);
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  });
  ctx.save();
  inkLine(ctx, 0.28, 0.8);
  graphEdges.forEach(([a, b]) => {
    ctx.beginPath(); ctx.moveTo(...nodes[a]); ctx.lineTo(...nodes[b]); ctx.stroke();
  });
  nodes.forEach(([x, y], i) => {
    ctx.fillStyle = i % 3 === 0 ? "rgba(120,50,35,.78)" : "rgba(52,38,24,.72)";
    ctx.beginPath(); ctx.arc(x, y, 3 + (i % 3), 0, Math.PI * 2); ctx.fill();
    ctx.font = "italic 12px 'Cambria Math'";
    ctx.fillText(String.fromCharCode(97 + i), x + 8, y - 8);
  });
  ctx.restore();
}

function drawHarmonic(scene, time) {
  const { ctx, width: w, height: h } = scene;
  let x = w * 0.38;
  let y = h * 0.5;
  const base = Math.min(w, h) * 0.15;
  const endPoints = [];
  ctx.save();
  for (let n = 0; n < 7; n++) {
    const prevX = x;
    const prevY = y;
    const harmonic = n * 2 + 1;
    const radius = base * (4 / (Math.PI * harmonic));
    const angle = harmonic * time * 0.0007 + n * 0.22;
    x += Math.cos(angle) * radius;
    y += Math.sin(angle) * radius;
    ctx.strokeStyle = "rgba(52,38,24,.22)";
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(prevX, prevY, radius, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "rgba(52,38,24,.48)";
    ctx.beginPath(); ctx.moveTo(prevX, prevY); ctx.lineTo(x, y); ctx.stroke();
    endPoints.push([x, y]);
  }
  ctx.fillStyle = "rgba(120,50,35,.8)";
  ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(120,50,35,.52)";
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(w * 0.68, y); ctx.stroke();
  ctx.beginPath();
  for (let px = w * 0.68; px < w; px += 2) {
    const offset = px - w * 0.68;
    let wave = 0;
    for (let n = 0; n < 7; n++) {
      const harmonic = n * 2 + 1;
      wave += Math.sin(harmonic * time * 0.0007 - offset * 0.017) / harmonic;
    }
    const py = h * 0.5 + wave * base * 0.75;
    if (px === w * 0.68) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = "rgba(120,50,35,.72)";
  ctx.lineWidth = 1.3;
  ctx.stroke();
  ctx.restore();
}

const domainDrawers = {
  topology: drawTopology,
  number: drawNumber,
  complex: drawComplex,
  geometry: drawGeometry,
  graph: drawGraph,
  harmonic: drawHarmonic
};

function renderDomainScenes(time) {
  domainScenes.forEach((scene) => {
    if (!scene.visible) return;
    scene.frame++;
    if (scene.type === "complex" && scene.frame % 3 !== 0) return;
    scene.ctx.clearRect(0, 0, scene.width, scene.height);
    domainDrawers[scene.type](scene, time);
  });
  if (!prefersReducedMotion) requestAnimationFrame(renderDomainScenes);
}

const domainVisibility = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const scene = domainScenes.find((item) => item.canvas === entry.target);
    if (scene) {
      scene.visible = entry.isIntersecting;
      if (prefersReducedMotion && scene.visible) renderDomainScenes(0);
    }
  });
}, { rootMargin: "20% 0px" });

domainScenes.forEach((scene) => {
  resizeDomainScene(scene);
  domainVisibility.observe(scene.canvas);
});
requestAnimationFrame(renderDomainScenes);

let lastScroll = 0;
function onScroll() {
  const scrollY = window.scrollY;
  const progress = Math.min(1, scrollY / innerHeight);
  const title = $(".hero-title");
  title.style.transform = `translateY(${scrollY * 0.18}px) skewY(${Math.sin(progress * Math.PI) * -2.5}deg)`;
  $(".orbital-system").style.transform = `rotate(${scrollY * 0.04}deg) scale(${1 + progress * 0.25})`;
  $(".coordinate-grid").style.backgroundPositionY = `${scrollY * 0.08}px`;
  lastScroll = scrollY;
}
window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", () => {
  resizeFluid();
  resizeAttractor();
  domainScenes.forEach(resizeDomainScene);
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.animate(
        [
          { opacity: 0, transform: "translateY(45px) scale(.98)" },
          { opacity: 1, transform: "translateY(0) scale(1)" }
        ],
        { duration: 900, easing: "cubic-bezier(.16,1,.3,1)", fill: "forwards" }
      );
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.13 });

$$(".domain-copy, .note-paper, .kicker, .axiom-layout, .attractor-copy").forEach((element) => {
  element.style.opacity = 0;
  observer.observe(element);
});
