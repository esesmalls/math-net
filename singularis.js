(function () {
  "use strict";

  const TAU = Math.PI * 2;

  function scene(api, time) {
    return {
      c: api.ctx,
      w: api.width,
      h: api.height,
      x: api.width * .66,
      y: api.height * .5,
      s: Math.min(api.width, api.height),
      t: time * .001
    };
  }

  function stroke(c, red, alpha, width, dash) {
    c.strokeStyle = red ? `rgba(125,56,41,${alpha})` : `rgba(55,39,24,${alpha})`;
    c.lineWidth = width || 1;
    c.setLineDash(dash || []);
  }

  function fill(c, red, alpha) {
    c.fillStyle = red ? `rgba(125,56,41,${alpha})` : `rgba(55,39,24,${alpha})`;
  }

  function line(c, x1, y1, x2, y2, red, alpha, width, dash) {
    stroke(c, red, alpha, width, dash);
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  }

  function circle(c, x, y, radius, red, alpha, width, dash) {
    stroke(c, red, alpha, width, dash);
    c.beginPath(); c.arc(x, y, radius, 0, TAU); c.stroke();
  }

  function point(c, x, y, radius, red, alpha) {
    fill(c, red, alpha);
    c.beginPath(); c.arc(x, y, radius, 0, TAU); c.fill();
  }

  function text(c, value, x, y, size, red, align) {
    fill(c, red, .72);
    c.font = `italic ${size}px "Cambria Math", Georgia, serif`;
    c.textAlign = align || "center";
    c.textBaseline = "middle";
    c.fillText(value, x, y);
  }

  function polyline(c, points, red, alpha, width, close, dash) {
    if (!points.length) return;
    stroke(c, red, alpha, width, dash);
    c.beginPath();
    points.forEach((p, index) => index ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]));
    if (close) c.closePath();
    c.stroke();
  }

  function loop(c, x, y, rx, ry, phase, lobes, red, alpha) {
    const points = [];
    for (let i = 0; i <= 180; i++) {
      const a = i / 180 * TAU;
      const warp = 1 + .13 * Math.sin(a * lobes + phase);
      points.push([x + Math.cos(a) * rx * warp, y + Math.sin(a) * ry / warp]);
    }
    polyline(c, points, red, alpha, 1);
  }

  function wave(c, x1, x2, y, amplitude, frequency, phase, red, alpha, envelope) {
    const points = [];
    for (let x = x1; x <= x2; x += 3) {
      const u = (x - x1) / (x2 - x1);
      const e = envelope ? Math.exp(-Math.pow((u - .5) / .22, 2)) : 1;
      points.push([x, y + Math.sin(u * TAU * frequency + phase) * amplitude * e]);
    }
    polyline(c, points, red, alpha, 1.1);
  }

  function lattice(c, x, y, size, rows, phase, predicate) {
    const gap = size / (rows - 1);
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < rows; i++) {
        const active = predicate(i, j);
        point(c, x + (i - (rows - 1) / 2) * gap, y + (j - (rows - 1) / 2) * gap, active ? 2.5 + Math.sin(phase + i + j) : .65, active, active ? .72 : .18);
      }
    }
  }

  function chromatic(api, time) {
    const { c, x, y, s, t } = scene(api, time);
    for (let layer = 0; layer < 9; layer++) {
      const radius = s * (.08 + layer * .025);
      loop(c, x, y, radius * 1.8, radius, t * (layer % 2 ? -1 : 1), 3 + layer % 4, layer % 3 === 0, .22 + layer * .018);
    }
    for (let n = 0; n < 5; n++) line(c, x - s * .28, y + (n - 2) * s * .08, x + s * .29, y + (n - 2) * s * .08, n === 2, .28, 1, [3, 7]);
    text(c, "v_n", x, y - s * .31, s * .045, true);
  }

  function framed(api, time) {
    const { c, x, y, s, t } = scene(api, time);
    for (let band = -1; band <= 1; band++) {
      const points = [];
      for (let i = 0; i <= 240; i++) {
        const a = i / 240 * TAU;
        const r = s * (.19 + .055 * Math.cos(3 * a));
        points.push([x + Math.cos(a) * (r + band * 7), y + Math.sin(2 * a + t * .25) * s * .13 + band * 5]);
      }
      polyline(c, points, band === 0, band === 0 ? .64 : .25, band === 0 ? 1.4 : .8);
    }
    text(c, "theta_j", x, y + s * .3, s * .042, true);
  }

  function knot(api, time) {
    const { c, x, y, s, t } = scene(api, time);
    circle(c, x, y, s * .27, false, .25, 1);
    for (let sheet = 0; sheet < 11; sheet++) {
      const points = [];
      for (let i = 0; i <= 160; i++) {
        const u = i / 160 * TAU;
        const r = s * (.08 + sheet * .014) * (1 + .2 * Math.cos(3 * u + t));
        points.push([x + Math.cos(u) * r * 1.7, y + Math.sin(u) * r + Math.sin(2 * u + t) * sheet * .7]);
      }
      polyline(c, points, sheet === 0, .2 + (10 - sheet) * .018, 1);
    }
    text(c, "partial F = K", x, y - s * .33, s * .035, true);
  }

  function polyhedron(api, time) {
    const { c, x, y, s, t } = scene(api, time);
    const vertices = Array.from({ length: 8 }, (_, i) => {
      const sx = i & 1 ? 1 : -1; const sy = i & 2 ? 1 : -1; const sz = i & 4 ? 1 : -1;
      const a = t * .22;
      const px = sx * Math.cos(a) - sz * Math.sin(a);
      const pz = sx * Math.sin(a) + sz * Math.cos(a);
      return [x + (px + pz * .3) * s * .14, y + (sy + pz * .24) * s * .14];
    });
    for (let i = 0; i < 8; i++) for (let bit = 1; bit <= 4; bit *= 2) if (i < (i ^ bit)) line(c, ...vertices[i], ...vertices[i ^ bit], bit === 4, .38, 1);
    vertices.forEach((p, i) => point(c, p[0], p[1], i % 3 ? 2.2 : 3.5, i % 3 === 0, .7));
    text(c, "V - E + F = 2", x, y + s * .32, s * .038, true);
  }

  function fixed(api, time) {
    const { c, x, y, s, t } = scene(api, time);
    for (let ring = 1; ring <= 5; ring++) circle(c, x, y, s * ring * .052, ring === 1, .18 + ring * .035, 1, ring === 1 ? [] : [2, 5]);
    for (let i = 0; i < 22; i++) {
      const a = i / 22 * TAU + t * .08;
      const r = s * .3;
      const ex = x + Math.cos(a) * r; const ey = y + Math.sin(a) * r * .72;
      line(c, ex, ey, x + Math.cos(a + .25) * s * .045, y + Math.sin(a + .25) * s * .045, i % 5 === 0, .3, 1);
    }
    point(c, x, y, 5 + Math.sin(t) * 1.5, true, .8);
    text(c, "f(p) = p", x, y - s * .34, s * .04, true);
  }

  function sphere(api, time) {
    const { c, x, y, s, t } = scene(api, time);
    circle(c, x, y, s * .25, false, .4, 1.2);
    for (let k = -4; k <= 4; k++) {
      stroke(c, k === 0, .22 + (4 - Math.abs(k)) * .03, 1);
      c.beginPath(); c.ellipse(x, y, s * .25, s * (.04 + Math.abs(k) * .035), t * .08 + k * .12, 0, TAU); c.stroke();
    }
    line(c, x, y - s * .25, x + s * .34, y + s * .22, true, .55, 1.1, [5, 6]);
    point(c, x, y - s * .25, 4, true, .8);
    text(c, "S^3", x + s * .31, y + s * .27, s * .05, true);
  }

  function langlands(api, time) {
    const { c, x, y, s, t } = scene(api, time);
    for (let side = -1; side <= 1; side += 2) {
      lattice(c, x + side * s * .16, y, s * .24, 7, t, (i, j) => (i * j + i + j) % (side < 0 ? 3 : 4) === 0);
      circle(c, x + side * s * .16, y, s * .15, false, .2, 1);
    }
    for (let k = -3; k <= 3; k++) {
      const yy = y + k * s * .04 + Math.sin(t + k) * 5;
      line(c, x - s * .08, yy, x + s * .08, y - k * s * .04, k === 0, .4, 1, [3, 4]);
    }
    text(c, "Gal <-> Aut", x, y - s * .32, s * .036, true);
  }

  function modular(api, time) {
    const { c, x, y, s, t } = scene(api, time);
    line(c, x - s * .34, y + s * .22, x + s * .34, y + s * .22, false, .35, 1);
    for (let level = 0; level < 5; level++) {
      const count = 1 << level;
      for (let i = 0; i < count; i++) {
        const radius = s * .3 / count;
        const cx = x - s * .3 + radius + i * radius * 2;
        stroke(c, (i + level) % 4 === 0, .32, 1);
        c.beginPath(); c.arc(cx, y + s * .22, radius, Math.PI, TAU); c.stroke();
      }
    }
    point(c, x + Math.sin(t * .3) * s * .18, y - s * .04, 4, true, .8);
    text(c, "H / Gamma", x, y - s * .31, s * .038, true);
  }

  function progression(api, time) {
    const { c, x, y, s, t } = scene(api, time);
    lattice(c, x, y, s * .55, 13, t, (i, j) => (i === j || i + j === 12 || j === 6) && (Math.floor(t) + i) % 3 !== 0);
    for (let q = 0; q < 3; q++) line(c, x - s * .27, y + (q - 1) * s * .09, x + s * .27, y + (q - 1) * s * .09, q === 1, .35, 1, [2, 7]);
    text(c, "a, a+d, a+2d", x, y - s * .34, s * .035, true);
  }

  function factor(api, time) {
    const { c, x, y, s, t } = scene(api, time);
    const levels = [[360], [18, 20], [3, 6, 4, 5], [2, 3, 2, 2, 5]];
    levels.forEach((values, level) => values.forEach((value, i) => {
      const px = x + (i - (values.length - 1) / 2) * s * .12;
      const py = y - s * .25 + level * s * .15;
      if (level < levels.length - 1) {
        const next = levels[level + 1];
        const start = level === 0 ? 0 : i * 2;
        for (let k = 0; k < (level === 2 && i > 1 ? 1 : 2); k++) {
          const nx = x + (start + k - (next.length - 1) / 2) * s * .12;
          line(c, px, py + 10, nx, py + s * .15 - 10, false, .3, 1);
        }
      }
      circle(c, px, py, 13 + Math.sin(t + i) * 1.5, level === levels.length - 1, .45, 1);
      text(c, String(value), px, py, s * .022, level === levels.length - 1);
    }));
  }

  function primes(api, time) {
    const { c, x, y, s } = scene(api, time);
    const prime = (n) => { for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return n > 1; };
    let count = 0; const points = [];
    for (let n = 2; n <= 90; n++) {
      if (prime(n)) count++;
      points.push([x - s * .31 + n / 90 * s * .62, y + s * .25 - count / 25 * s * .48]);
      if (prime(n)) point(c, points.at(-1)[0], points.at(-1)[1], 2.3, true, .65);
    }
    polyline(c, points, false, .5, 1.2);
    const approx = []; for (let n = 3; n <= 90; n++) approx.push([x - s * .31 + n / 90 * s * .62, y + s * .25 - (n / Math.log(n)) / 25 * s * .48]);
    polyline(c, approx, true, .5, 1, false, [4, 5]);
    text(c, "pi(x) ~ x / log x", x, y - s * .33, s * .035, true);
  }

  function frey(api, time) {
    const { c, x, y, s, t } = scene(api, time);
    const curve = [];
    for (let px = -1.7; px <= 1.7; px += .025) {
      const yy = px * px * px - px + .5;
      if (yy >= 0) curve.push([x - s * .2 + px * s * .08, y + Math.sqrt(yy) * s * .08]);
    }
    polyline(c, curve, true, .6, 1.4);
    for (let n = 1; n <= 7; n++) wave(c, x + s * .02, x + s * .31, y + (n - 4) * s * .055, s * .014, n, t * n, n === 3, .35);
    line(c, x - s * .02, y, x + s * .02, y, true, .55, 1.2, [4, 5]);
    text(c, "E <-> f", x, y - s * .32, s * .045, true);
  }

  function randomField(api, time, seed) {
    const { c, x, y, s, t } = scene(api, time);
    for (let ring = 0; ring < 16; ring++) {
      const points = [];
      for (let i = 0; i <= 150; i++) {
        const a = i / 150 * TAU;
        const noise = Math.sin(a * (3 + ring % 5) + t * .3 + seed) + .5 * Math.sin(a * 11 - t * .2);
        const r = s * (.035 + ring * .016 + noise * .005);
        points.push([x + Math.cos(a) * r * 1.45, y + Math.sin(a) * r]);
      }
      polyline(c, points, ring === 7, .16 + ring * .012, 1);
    }
    text(c, "d_h", x, y - s * .34, s * .05, true);
  }

  function sle(api, time, seed) {
    const { c, x, y, s, t } = scene(api, time);
    circle(c, x, y, s * .28, false, .35, 1);
    const points = [[x, y + s * .28]];
    let px = x; let py = y + s * .28;
    for (let i = 1; i < 130; i++) {
      const a = -Math.PI / 2 + Math.sin(i * .72 + seed) * .9 + Math.sin(i * .17 + t * .5) * .45;
      px += Math.cos(a) * s * .006; py += Math.sin(a) * s * .006;
      points.push([px, py]);
    }
    polyline(c, points, true, .67, 1.4);
    text(c, "SLE_4", x, y - s * .34, s * .04, true);
  }

  function branch(api, time) {
    const { c, x, y, s, t } = scene(api, time);
    point(c, x, y, 4, true, .8);
    line(c, x, y, x + s * .32, y, true, .5, 1, [5, 5]);
    for (let sheet = 0; sheet < 5; sheet++) {
      const points = [];
      for (let i = 0; i <= 180; i++) {
        const a = i / 180 * TAU * 1.35 + sheet * .23 + t * .12;
        const r = s * (.025 + i / 180 * .25);
        points.push([x + Math.cos(a) * r, y + Math.sin(a) * r * .6 + sheet * 5]);
      }
      polyline(c, points, sheet === 2, .28 + sheet * .03, 1);
    }
    text(c, "z^(1/n)", x, y - s * .33, s * .04, true);
  }

  function contour(api, time) {
    const { c, x, y, s, t } = scene(api, time);
    const poles = [[-.12,-.07],[.1,.08],[.2,-.12],[-.2,.14]];
    poles.forEach((p, i) => point(c, x + p[0] * s, y + p[1] * s, 3 + i, true, .72));
    for (let k = 0; k < 3; k++) loop(c, x, y, s * (.18 + k * .045), s * (.12 + k * .035), t * .18 + k, 4 + k, k === 1, .35);
    const a = t * .4; const px = x + Math.cos(a) * s * .27; const py = y + Math.sin(a) * s * .2;
    point(c, px, py, 4, false, .8);
    text(c, "2 pi i Sum Res", x, y - s * .34, s * .033, true);
  }

  function mapping(api, time) {
    const { c, x, y, s, t } = scene(api, time);
    for (let side = -1; side <= 1; side += 2) {
      const cx = x + side * s * .18;
      circle(c, cx, y, s * .14, side > 0, .35, 1);
      for (let k = -3; k <= 3; k++) {
        stroke(c, k === 0, .25, .8);
        c.beginPath(); c.ellipse(cx, y, s * (.035 + Math.abs(k) * .022), s * .14, t * .06 * side + k * .13, 0, TAU); c.stroke();
      }
    }
    line(c, x - s * .03, y, x + s * .03, y, true, .55, 1.2, [3, 4]);
    text(c, "f : Omega -> D", x, y - s * .32, s * .035, true);
  }

  function essential(api, time, seed) {
    const { c, x, y, s, t } = scene(api, time);
    point(c, x, y, 4, true, .8);
    for (let i = 1; i < 190; i++) {
      const a = i * 2.399963 + t * .2;
      const r = s * .28 / Math.sqrt(i) * (1 + (i % 7) * .07);
      point(c, x + Math.cos(a) * r * 1.6, y + Math.sin(a) * r, 1 + i % 3 * .35, i % 11 === 0, .2 + (i % 5) * .08);
    }
    circle(c, x, y, s * .29, false, .25, 1, [2, 7]);
    text(c, "C \\ {a}", x, y - s * .34, s * .04, true);
  }

  function flow(api, time) {
    const { c, x, y, s, t } = scene(api, time);
    for (let step = 0; step < 12; step++) {
      const phase = (step / 12 + t * .08) % 1;
      const radius = s * (.28 - phase * .22);
      loop(c, x, y, radius * 1.35, radius, phase * 2, 3, step === 10, .12 + phase * .35);
    }
    line(c, x, y - s * .3, x, y + s * .3, false, .18, .8, [2, 7]);
    text(c, "dX/dt = H", x, y - s * .34, s * .035, true);
  }

  function bonnet(api, time) {
    const { c, x, y, s, t } = scene(api, time);
    for (let side = -1; side <= 1; side += 2) {
      const cx = x + side * s * .17;
      for (let k = -5; k <= 5; k++) {
        const points = [];
        for (let i = -30; i <= 30; i++) {
          const u = i / 30;
          points.push([cx + u * s * .13, y + k * s * .018 + Math.sin(u * Math.PI * 2 + side * t * .2) * s * .045 * (1 - Math.abs(k) / 8)]);
        }
        polyline(c, points, k === 0, .2 + (5 - Math.abs(k)) * .025, .9);
      }
    }
    line(c, x - s * .03, y, x + s * .03, y, true, .5, 1.2, [4, 4]);
    text(c, "I, II", x, y - s * .32, s * .04, true);
  }

  function mass(api, time) {
    const { c, x, y, s, t } = scene(api, time);
    for (let j = -6; j <= 6; j++) {
      const points = [];
      for (let i = -8; i <= 8; i++) {
        const px = i / 8; const py = j / 6;
        const lift = Math.exp(-(px * px + py * py) * 3) * (.3 + .05 * Math.sin(t));
        points.push([x + px * s * .31, y + py * s * .24 - lift * s * .22]);
      }
      polyline(c, points, j === 0, .2, .8);
    }
    circle(c, x, y - s * .07, s * .045, true, .6, 1.2);
    text(c, "m_ADM -> 0", x, y - s * .34, s * .036, true);
  }

  function curvature(api, time) {
    const { c, x, y, s, t } = scene(api, time);
    const vertices = [[x, y - s * .22], [x - s * .24, y + s * .19], [x + s * .24, y + s * .19]];
    for (let edge = 0; edge < 3; edge++) {
      const a = vertices[edge]; const b = vertices[(edge + 1) % 3];
      const points = [];
      for (let i = 0; i <= 60; i++) {
        const u = i / 60; const bend = Math.sin(u * Math.PI) * s * .035 * (edge === 0 ? -1 : 1);
        points.push([a[0] * (1 - u) + b[0] * u + Math.sin(t * .2) * bend * .1, a[1] * (1 - u) + b[1] * u - bend]);
      }
      polyline(c, points, edge === 1, .48, 1.2);
    }
    vertices.forEach((p) => circle(c, p[0], p[1], s * .04, true, .34, 1));
    text(c, "K intrinsic", x, y + s * .31, s * .037, true);
  }

  function totalCurvature(api, time) {
    const { c, x, y, s, t } = scene(api, time);
    circle(c, x, y, s * .25, false, .38, 1.1);
    for (let i = 0; i < 32; i++) {
      const a = i / 32 * TAU; const r = s * .25;
      const px = x + Math.cos(a) * r; const py = y + Math.sin(a) * r;
      const len = s * (.025 + .025 * (.5 + .5 * Math.sin(i * 1.7 + t)));
      line(c, px, py, px + Math.cos(a) * len, py + Math.sin(a) * len, i % 8 === 0, .42, 1);
    }
    for (let k = -3; k <= 3; k++) {
      stroke(c, false, .18, .8); c.beginPath(); c.ellipse(x, y, s * .25, s * (.04 + Math.abs(k) * .032), k * .08, 0, TAU); c.stroke();
    }
    text(c, "Integral K dA = 2 pi chi", x, y - s * .34, s * .029, true);
  }

  function embedding(api, time) {
    const { c, x, y, s, t } = scene(api, time);
    for (let layer = -4; layer <= 4; layer++) {
      const points = [];
      for (let i = 0; i <= 160; i++) {
        const a = i / 160 * TAU;
        const r = s * (.14 + layer * .012);
        points.push([x + Math.cos(a) * r * 1.7 + Math.sin(3 * a + t * .2) * layer * 2, y + Math.sin(a) * r + Math.cos(2 * a) * layer * 2]);
      }
      polyline(c, points, layer === 0, layer === 0 ? .62 : .19, layer === 0 ? 1.4 : .8);
    }
    for (let i = 0; i < 8; i++) line(c, x - s * .3, y - s * .25 + i * s * .07, x + s * .3, y - s * .25 + i * s * .07, false, .12, .7, [2, 8]);
    text(c, "M -> R^N", x, y - s * .34, s * .04, true);
  }

  function threshold(api, time) {
    const { c, x, y, s, t } = scene(api, time);
    line(c, x - s * .3, y + s * .22, x + s * .3, y + s * .22, false, .35, 1);
    line(c, x - s * .3, y + s * .22, x - s * .3, y - s * .25, false, .35, 1);
    const curve = [];
    for (let i = 0; i <= 100; i++) {
      const u = i / 100;
      const v = 1 / (1 + Math.exp(-(u - .5 - Math.sin(t * .2) * .03) * 22));
      curve.push([x - s * .3 + u * s * .6, y + s * .22 - v * s * .46]);
    }
    polyline(c, curve, true, .65, 1.5);
    line(c, x, y + s * .25, x, y - s * .27, true, .35, 1, [3, 5]);
    text(c, "p_c", x, y + s * .3, s * .04, true);
  }

  function coloring(api, time) {
    const { c, x, y, s, t } = scene(api, time);
    const points = Array.from({ length: 12 }, (_, i) => [x + Math.cos(i / 12 * TAU + t * .05) * s * (.18 + (i % 3) * .035), y + Math.sin(i / 12 * TAU + t * .05) * s * (.15 + (i % 4) * .025)]);
    for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) if ((i * 7 + j * 11) % 9 < 2) line(c, ...points[i], ...points[j], false, .24, .8);
    points.forEach((p, i) => { circle(c, p[0], p[1], 5 + i % 3, i % 4 === Math.floor(t) % 4, .68, 1); text(c, String((i % 4) + 1), p[0], p[1], s * .018, i % 4 === Math.floor(t) % 4); });
    text(c, "chi(G)", x, y - s * .34, s * .045, true);
  }

  function union(api, time) {
    const { c, x, y, s, t } = scene(api, time);
    const centers = [[-.13,0],[.1,-.07],[.08,.12]];
    centers.forEach((p, i) => {
      stroke(c, i === Math.floor(t) % 3, .42, 1.2);
      c.beginPath(); c.ellipse(x + p[0] * s, y + p[1] * s, s * .18, s * .13, i * .7, 0, TAU); c.stroke();
    });
    for (let i = 0; i < 8; i++) point(c, x + Math.cos(i * 2.4) * s * .08, y + Math.sin(i * 2.4) * s * .07, 2.5, i % 3 === 0, .7);
    text(c, "|{A:x in A}| >= |F|/2", x, y - s * .34, s * .027, true);
  }

  function bridges(api, time) {
    const { c, x, y, s, t } = scene(api, time);
    const banks = [x - s * .28, x - s * .08, x + s * .08, x + s * .28];
    banks.forEach((bx, i) => circle(c, bx, y + (i % 2 ? -1 : 1) * s * .12, s * .06, i === Math.floor(t) % 4, .45, 1.1));
    const edges = [[0,1],[0,1],[0,2],[1,2],[1,3],[2,3],[2,3]];
    edges.forEach(([a,b], i) => {
      const ay = y + (a % 2 ? -1 : 1) * s * .12; const by = y + (b % 2 ? -1 : 1) * s * .12;
      const mid = (banks[a] + banks[b]) / 2;
      const points = [[banks[a], ay], [mid, y + (i - 3) * s * .035], [banks[b], by]];
      polyline(c, points, i === Math.floor(t * 1.5) % 7, .38, 1.1);
    });
    text(c, "deg(v) odd", x, y - s * .34, s * .038, true);
  }

  function planar(api, time) {
    const { c, x, y, s, t } = scene(api, time);
    for (let ring = 0; ring < 5; ring++) {
      const radius = s * (.07 + ring * .048);
      const sides = 5 + ring;
      const points = Array.from({ length: sides }, (_, i) => [x + Math.cos(i / sides * TAU + ring * .2) * radius * 1.35, y + Math.sin(i / sides * TAU + ring * .2) * radius]);
      polyline(c, points, ring === Math.floor(t) % 5, .42, 1.1, true);
      points.forEach((p, i) => point(c, p[0], p[1], 2.5, (i + ring) % 4 === Math.floor(t) % 4, .65));
    }
    text(c, "4 colors", x, y - s * .34, s * .042, true);
  }

  function minor(api, time) {
    const { c, x, y, s, t } = scene(api, time);
    const outer = Array.from({ length: 10 }, (_, i) => [x + Math.cos(i / 10 * TAU) * s * .27, y + Math.sin(i / 10 * TAU) * s * .21]);
    const collapse = .5 + .5 * Math.sin(t * .35);
    const inner = outer.map((p, i) => [p[0] * (1 - collapse * .55) + (x + (i % 5 - 2) * s * .06) * collapse * .55, p[1] * (1 - collapse * .55) + (y + (i < 5 ? -1 : 1) * s * .07) * collapse * .55]);
    for (let i = 0; i < 10; i++) {
      line(c, ...inner[i], ...inner[(i + 1) % 10], false, .3, .9);
      line(c, ...inner[i], ...inner[(i + 5) % 10], i % 3 === 0, .32, .9);
    }
    inner.forEach((p, i) => point(c, p[0], p[1], 3, i % 5 === 0, .7));
    text(c, "G / e", x, y - s * .34, s * .045, true);
  }

  function kakeya(api, time) {
    const { c, x, y, s, t } = scene(api, time);
    for (let scale = 0; scale < 5; scale++) {
      const radius = s * (.29 - scale * .045);
      for (let i = 0; i < 42; i++) {
        const a = i / 42 * Math.PI + t * .1 * (scale % 2 ? -1 : 1);
        const offset = Math.sin(i * 11.7 + scale) * radius * .2;
        const dx = Math.cos(a) * radius; const dy = Math.sin(a) * radius;
        line(c, x - dx + Math.cos(a + Math.PI / 2) * offset, y - dy + Math.sin(a + Math.PI / 2) * offset, x + dx + Math.cos(a + Math.PI / 2) * offset, y + dy + Math.sin(a + Math.PI / 2) * offset, scale === 0, .12 + scale * .035, 1);
      }
      circle(c, x, y, radius, scale === 0, .18, .8, [3, 7]);
    }
    text(c, "dim E = 3", x, y - s * .34, s * .04, true);
  }

  function furstenberg(api, time) {
    const { c, x, y, s, t } = scene(api, time);
    for (let i = 0; i < 38; i++) {
      const a = i / 38 * Math.PI + t * .04;
      const len = s * .3; const offset = Math.sin(i * 4.73) * s * .09;
      const ox = Math.cos(a + Math.PI / 2) * offset; const oy = Math.sin(a + Math.PI / 2) * offset;
      line(c, x - Math.cos(a) * len + ox, y - Math.sin(a) * len + oy, x + Math.cos(a) * len + ox, y + Math.sin(a) * len + oy, i % 9 === 0, .15, .8);
      for (let p = 1; p <= 4; p++) if ((i * p) % 5 < 2) point(c, x + Math.cos(a) * len * (p / 5 - .5) * 2 + ox, y + Math.sin(a) * len * (p / 5 - .5) * 2 + oy, 1.7, i % 9 === 0, .55);
    }
    text(c, "dim_H(E)", x, y - s * .34, s * .04, true);
  }

  function restriction(api, time) {
    const { c, x, y, s, t } = scene(api, time);
    for (let cell = -3; cell <= 3; cell++) {
      const cx = x + cell * s * .075;
      line(c, cx, y - s * .25, cx + Math.sin(cell + t * .2) * s * .05, y + s * .25, cell === 0, .25, 1, [3, 6]);
    }
    for (let packet = 0; packet < 7; packet++) wave(c, x - s * .3, x + s * .3, y + (packet - 3) * s * .06, s * .025, 2 + packet, t * (packet + 1) * .4, packet === 3, .32, true);
    circle(c, x, y, s * .24, true, .25, 1, [4, 5]);
    text(c, "Ef", x, y - s * .34, s * .05, true);
  }

  function epicycle(api, time) {
    const { c, x, y, s, t } = scene(api, time);
    let px = x - s * .22; let py = y;
    for (let n = 1; n <= 7; n++) {
      const radius = s * .13 / n;
      circle(c, px, py, radius, n === 1, .25, .9);
      const angle = n * t * .45 + n * .6;
      const nx = px + Math.cos(angle) * radius; const ny = py + Math.sin(angle) * radius;
      line(c, px, py, nx, ny, n === 1, .45, 1);
      px = nx; py = ny;
    }
    wave(c, px, x + s * .34, y, s * .11, 3, t, true, .58);
    line(c, px, py, px, y + Math.sin(t) * s * .11, true, .35, 1, [3, 5]);
    text(c, "Sum a_n e^(int)", x, y - s * .34, s * .032, true);
  }

  function dual(api, time) {
    const { c, x, y, s, t } = scene(api, time);
    wave(c, x - s * .33, x - s * .03, y, s * .12, 5, t, false, .5, true);
    for (let n = -5; n <= 5; n++) {
      const h = s * .2 * Math.exp(-n * n / 8);
      line(c, x + s * .08 + (n + 5) * s * .025, y + h / 2, x + s * .08 + (n + 5) * s * .025, y - h / 2, n === 0, .5, 1.2);
    }
    line(c, x - s * .01, y - s * .25, x + s * .04, y + s * .25, true, .5, 1.2, [4, 5]);
    text(c, "f <-> f-hat", x, y - s * .34, s * .038, true);
  }

  function uncertainty(api, time) {
    const { c, x, y, s, t } = scene(api, time);
    const narrow = .08 + (.5 + .5 * Math.sin(t * .35)) * .14;
    for (let side = -1; side <= 1; side += 2) {
      const cx = x + side * s * .18;
      const width = side < 0 ? narrow : .3 - narrow;
      const points = [];
      for (let i = -80; i <= 80; i++) {
        const u = i / 80;
        const amp = Math.exp(-Math.pow(u / width, 2)) * s * .21;
        points.push([cx + u * s * .15, y - amp]);
      }
      polyline(c, points, side > 0, .55, 1.3);
      line(c, cx - s * .15, y, cx + s * .15, y, false, .3, .8);
    }
    text(c, "Delta x Delta xi >= 1/2", x, y - s * .34, s * .03, true);
  }

  window.SINGULARIS_DRAWERS = {
    chromatic, framed, knot, polyhedron, fixed, sphere,
    langlands, modular, progression, factor, primes, frey,
    "random-field": randomField, sle, branch, contour, mapping, essential,
    flow, bonnet, mass, curvature, "total-curvature": totalCurvature, embedding,
    threshold, coloring, union, bridges, planar, minor,
    kakeya, furstenberg, restriction, epicycle, dual, uncertainty
  };
}());
