// =============================================================
//  art.js  —  everything is drawn with code (no image files)
// =============================================================
'use strict';

const OUT = '#2b1d3a';           // cartoon outline color
const TAU = Math.PI * 2;

// ---------- option lists ----------
const SKINS = ['#ffe0c7', '#f6c9a0', '#e0a878', '#c68650', '#8d5a34', '#5c3a21'];
const HAIR_COLORS = ['#2b2118', '#6b4226', '#e8c15a', '#d9541e', '#ff6fb5', '#3d8bff', '#38c76a', '#9b5de5', 'rainbow'];
const COLORS = ['#ff4d4d', '#ff9f1c', '#ffd60a', '#38c76a', '#2ec4b6', '#3a86ff', '#8338ec', '#ff5fa2', '#ffffff', '#3a3a4a'];
// short styles (boys' cuts) and long styles (girls' styles) — shown as two rows
const HAIR_SHORT = ['mohawk', 'spiky', 'short', 'sidepart', 'quiff', 'flattop', 'buzz', 'swoop', 'curly', 'afro', 'bald'];
const HAIR_LONG = ['long', 'ponytail', 'pigtails', 'braids', 'bob', 'bun', 'spacebuns', 'locs', 'mullet'];
const HAIR_STYLES = HAIR_SHORT.concat(HAIR_LONG);
const FACES = ['happy', 'grin', 'cool', 'tongue', 'wow'];
const SHIRTS = ['tee', 'stripes', 'hoodie', 'hero', 'jacket'];
const HATS = ['none', 'helmet', 'cap', 'crown', 'cowboy', 'bow', 'party'];
const GLASSES = ['none', 'sunglasses', 'goggles', 'glasses', 'mustache'];
const BACKS = ['none', 'cape', 'wings', 'backpack'];
const VEHICLE_TYPES = ['dirtbike', 'atv', 'skateboard', 'scooter', 'monstertruck', 'gokart', 'unicorn', 'cart', 'rocketbed'];
const MONSTER_TYPES = ['mohawk', 'slime', 'dino', 'robot', 'ghost'];

const NAMES = {
  mohawk: 'Mohawk', spiky: 'Spiky', short: 'Crew cut', sidepart: 'Side part', curly: 'Curly', long: 'Long', pigtails: 'Pigtails', bun: 'Bun', bald: 'Bald',
  quiff: 'Quiff', flattop: 'Flat top', buzz: 'Buzz cut', swoop: 'Swoop', afro: 'Afro', locs: 'Locs', bob: 'Bob',
  mullet: 'Mullet', ponytail: 'Ponytail', braids: 'Braids', spacebuns: 'Space buns',
  happy: 'Happy', grin: 'Big grin', cool: 'Cool', tongue: 'Silly', wow: 'Wow',
  tee: 'T-shirt', stripes: 'Stripes', hoodie: 'Hoodie', hero: 'Super suit', jacket: 'Jacket',
  none: 'Nothing', helmet: 'Helmet', cap: 'Cap', crown: 'Crown', cowboy: 'Cowboy hat', bow: 'Bow', party: 'Party hat',
  sunglasses: 'Sunglasses', goggles: 'Goggles', glasses: 'Glasses', mustache: 'Mustache',
  cape: 'Cape', wings: 'Wings', backpack: 'Backpack',
  dirtbike: 'Dirt bike', atv: 'ATV', skateboard: 'Skateboard', scooter: 'Scooter', monstertruck: 'Monster truck',
  gokart: 'Go-kart', unicorn: 'Unicorn', cart: 'Shopping cart', rocketbed: 'Rocket bed',
  m_mohawk: 'Mohawk Monster', m_slime: 'Slime Blob', m_dino: 'Dino', m_robot: 'Robot', m_ghost: 'Ghost',
};

// ---------- tiny helpers ----------
function rand01(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function fillOut(ctx, fill, lw = 3) {
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = OUT; ctx.lineJoin = 'round'; ctx.stroke(); }
}
function circ(ctx, x, y, r, fill, lw = 3) { ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, TAU); fillOut(ctx, fill, lw); }
function ell(ctx, x, y, rx, ry, fill, lw = 3, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU); fillOut(ctx, fill, lw); }
function poly(ctx, pts, fill, lw = 3) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath(); fillOut(ctx, fill, lw);
}
function line(ctx, pts, w, color) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke();
}
// thick outlined stroke — used for arms, legs, frames
function limb(ctx, pts, w, color) { line(ctx, pts, w + 5, OUT); line(ctx, pts, w, color); }

function shade(hex, amt) {
  if (!hex || hex[0] !== '#') return hex;
  let c = hex.slice(1); if (c.length === 3) c = c.split('').map(x => x + x).join('');
  let r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  if (amt < 0) { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
  else { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}
const RAINBOW = ['#ff4d4d', '#ff9f1c', '#ffd60a', '#38c76a', '#3a86ff', '#9b5de5'];
function rainbowGrad(ctx, x0, y0, x1, y1) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  RAINBOW.forEach((c, i) => g.addColorStop(i / (RAINBOW.length - 1), c));
  return g;
}
function star(ctx, x, y, r, fill, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot - Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  ctx.closePath(); fillOut(ctx, fill, 2);
}

// =============================================================
//  RIDER
// =============================================================
function drawHead(ctx, cfg, cx, cy, t = 0) {
  const R = 17, skin = cfg.skin, hs = cfg.hair;
  const hc = cfg.hairColor === 'rainbow' ? rainbowGrad(ctx, cx - 22, cy + 10, cx + 22, cy - 30) : cfg.hairColor;

  // --- hair behind the head
  if (hs === 'long') {
    ctx.beginPath(); ctx.moveTo(cx - 6, cy - 15);
    ctx.quadraticCurveTo(cx - 28, cy - 8, cx - 22, cy + 24);
    ctx.quadraticCurveTo(cx - 10, cy + 30, cx - 1, cy + 16);
    ctx.lineTo(cx + 2, cy - 6); ctx.closePath(); fillOut(ctx, hc);
  } else if (hs === 'pigtails') {
    const sw = Math.sin(t * 9) * 2;
    circ(ctx, cx - 22, cy + 3 + sw, 8.5, hc); circ(ctx, cx - 16, cy - 15 - sw, 7.5, hc);
    circ(ctx, cx - 15, cy + 1, 3, '#ff5fa2', 2); circ(ctx, cx - 12, cy - 10, 3, '#ff5fa2', 2);
  } else if (hs === 'bun') {
    circ(ctx, cx - 9, cy - 19, 9.5, hc);
  } else if (hs === 'curly') {
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * 0.55 + i * (Math.PI * 1.35 / 8);
      circ(ctx, cx - 2 + Math.cos(a) * 17, cy - 2 + Math.sin(a) * 17, 9, hc);
    }
  } else if (hs === 'afro') {
    ctx.beginPath();
    for (let i = 0; i <= 28; i++) { const a = i / 28 * TAU, r = 25 + (i % 2) * 2; ctx.lineTo(cx - 8 + Math.cos(a) * r, cy - 12 + Math.sin(a) * r); }
    ctx.closePath(); fillOut(ctx, hc);
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.arc(cx - 8 + (rand01(i) - 0.5) * 36, cy - 12 + (rand01(i + 20) - 0.5) * 36, 1.8, 0, TAU); ctx.fill(); }
  } else if (hs === 'ponytail') {
    const sw = Math.sin(t * 9) * 3;
    ctx.beginPath(); ctx.moveTo(cx - 13, cy - 15);
    ctx.quadraticCurveTo(cx - 36, cy - 12 + sw, cx - 30, cy + 18 + sw);
    ctx.quadraticCurveTo(cx - 24, cy + 6, cx - 15, cy - 4); ctx.closePath(); fillOut(ctx, hc);
    circ(ctx, cx - 16, cy - 11, 3.5, '#ff5fa2', 2);
  } else if (hs === 'braids') {
    const sw = Math.sin(t * 8) * 1.5;
    for (let i = 0; i < 5; i++) circ(ctx, cx - 13 - i * 1.6 + sw * i / 4, cy + 1 + i * 6.5, 5 - i * 0.3, hc, 2.5);
    circ(ctx, cx - 20 + sw, cy + 33, 3, '#3a86ff', 2);
  } else if (hs === 'bob') {
    rr(ctx, cx - 22, cy - 16, 28, 33, 11); fillOut(ctx, hc);
  } else if (hs === 'mullet') {
    ctx.beginPath(); ctx.moveTo(cx - 10, cy - 8);
    ctx.quadraticCurveTo(cx - 26, cy + 4, cx - 21, cy + 27);
    ctx.lineTo(cx - 8, cy + 22); ctx.lineTo(cx - 4, cy + 2); ctx.closePath(); fillOut(ctx, hc);
  } else if (hs === 'locs') {
    for (let i = 0; i < 6; i++) {
      const sw = Math.sin(t * 7 + i) * 2;
      limb(ctx, [[cx - 6 - i * 3, cy - 14 + i * 2], [cx - 16 - i * 2 + sw, cy + 6 + i], [cx - 14 - i * 2.5 + sw, cy + 24 - i * 1.5]], 4, hc === cfg.hairColor ? hc : RAINBOW[i]);
    }
  }

  // --- head, ear, nose
  circ(ctx, cx, cy, R, skin);
  ell(ctx, cx - 4, cy + 2, 4, 5.5, skin, 2.5);
  ctx.beginPath(); ctx.arc(cx + R - 1, cy + 3, 3.4, -Math.PI / 2, Math.PI / 2); fillOut(ctx, skin, 2.5);
  ctx.fillStyle = 'rgba(255,110,140,.35)'; ctx.beginPath(); ctx.arc(cx + 6, cy + 7, 3.6, 0, TAU); ctx.fill();

  // --- eyes
  const face = cfg.face;
  const blink = Math.sin(t * 1.3) + Math.sin(t * 0.71) > 1.93;
  const big = face === 'wow' ? 1.25 : 1;
  for (const ex of [cx + 4, cx + 11]) {
    const ey = cy - 2;
    if (blink) { line(ctx, [[ex - 3, ey], [ex + 3, ey]], 2, OUT); continue; }
    ell(ctx, ex, ey, 3.4 * big, 4.4 * big, '#fff', 1.5);
    circ(ctx, ex + 1, ey + 0.5, 2.1 * big, OUT, 0);
    circ(ctx, ex + 1.6, ey - 0.7, 0.7, '#fff', 0);
    if (face === 'cool') {
      ctx.beginPath(); ctx.ellipse(ex, ey, 3.8, 4.8, 0, Math.PI, TAU); ctx.closePath();
      ctx.fillStyle = skin; ctx.fill(); line(ctx, [[ex - 3.8, ey], [ex + 3.8, ey]], 1.8, OUT);
    }
  }

  // --- mouth
  ctx.lineCap = 'round';
  if (face === 'grin') {
    ctx.beginPath(); ctx.moveTo(cx + 3, cy + 6); ctx.lineTo(cx + 15, cy + 5);
    ctx.quadraticCurveTo(cx + 13, cy + 15, cx + 6, cy + 13); ctx.closePath(); fillOut(ctx, '#a0213b', 2);
    ctx.fillStyle = '#fff'; ctx.fillRect(cx + 4.5, cy + 6.2, 9.5, 2.4);
  } else if (face === 'wow') {
    ell(ctx, cx + 10, cy + 9, 3, 4, '#a0213b', 2);
  } else if (face === 'cool') {
    ctx.beginPath(); ctx.moveTo(cx + 4, cy + 8); ctx.quadraticCurveTo(cx + 10, cy + 11, cx + 15, cy + 5);
    ctx.lineWidth = 2.2; ctx.strokeStyle = OUT; ctx.stroke();
  } else {
    if (face === 'tongue') ell(ctx, cx + 10, cy + 11, 3, 3.6, '#ff7aa2', 1.5);
    ctx.beginPath(); ctx.arc(cx + 9, cy + 6, 5, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.lineWidth = 2.2; ctx.strokeStyle = OUT; ctx.stroke();
  }

  // --- hair on top
  const helmet = cfg.hat === 'helmet';
  const cap = () => {
    ctx.beginPath(); ctx.arc(cx, cy, R + 1.5, Math.PI * 0.92, Math.PI * 1.82);
    ctx.quadraticCurveTo(cx + 10, cy - 6, cx + 2, cy - 9);
    ctx.quadraticCurveTo(cx - 6, cy - 6, cx - 12, cy - 2);
    ctx.closePath(); fillOut(ctx, hc);
  };
  const mohawk = () => {
    const n = 5, a0 = Math.PI * 1.08, a1 = Math.PI * 1.78, step = (a1 - a0) / n;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a0) * (R - 3), cy + Math.sin(a0) * (R - 3));
    for (let i = 0; i < n; i++) {
      const at = a0 + step * (i + 0.5), ab = a0 + step * (i + 1);
      const tip = R + 13 + (i === 2 ? 4 : 0);
      ctx.lineTo(cx + Math.cos(at) * tip, cy + Math.sin(at) * tip);
      ctx.lineTo(cx + Math.cos(ab) * (R - 3), cy + Math.sin(ab) * (R - 3));
    }
    ctx.closePath(); fillOut(ctx, hc, 2.5);
  };
  if (hs === 'mohawk' && !helmet) mohawk();
  else if (hs === 'spiky') {
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (1.0 + i * 0.13);
      poly(ctx, [[cx + Math.cos(a - 0.14) * R, cy + Math.sin(a - 0.14) * R],
        [cx + Math.cos(a) * (R + 10), cy + Math.sin(a) * (R + 10)],
        [cx + Math.cos(a + 0.14) * R, cy + Math.sin(a + 0.14) * R]], hc, 2.5);
    }
    cap();
  } else if (hs === 'curly') {
    for (let i = 0; i < 5; i++) {
      const a = Math.PI * (1.05 + i * 0.19);
      circ(ctx, cx + Math.cos(a) * (R - 1), cy + Math.sin(a) * (R - 1), 7, hc, 2.5);
    }
  } else if (['long', 'pigtails', 'bun', 'ponytail', 'braids', 'mullet', 'locs'].includes(hs)) cap();
  else if (hs === 'short' || hs === 'sidepart') {
    // boy's crew cut: neat hairline above the forehead, no bangs
    ctx.beginPath(); ctx.arc(cx, cy, R + 2, Math.PI * 0.95, Math.PI * 1.85);
    ctx.lineTo(cx + 10, cy - 11); ctx.quadraticCurveTo(cx, cy - 13, cx - 9, cy - 5); ctx.closePath(); fillOut(ctx, hc);
    if (hs === 'sidepart') {
      ctx.beginPath(); ctx.moveTo(cx - 6, cy - 19);
      ctx.quadraticCurveTo(cx + 8, cy - 27, cx + 19, cy - 15);
      ctx.quadraticCurveTo(cx + 12, cy - 12, cx + 2, cy - 15); ctx.closePath(); fillOut(ctx, hc, 2.5);
      line(ctx, [[cx - 8, cy - 17], [cx - 2, cy - 18]], 1.8, 'rgba(255,255,255,.55)');
    } else {
      for (let i = 0; i < 4; i++) line(ctx, [[cx - 10 + i * 6, cy - 17], [cx - 8 + i * 6, cy - 13]], 1.4, 'rgba(255,255,255,.3)');
    }
  }
  else if (hs === 'buzz') {
    ctx.beginPath(); ctx.arc(cx, cy, R + 0.5, Math.PI * 0.95, Math.PI * 1.8);
    ctx.quadraticCurveTo(cx + 4, cy - 12, cx - 12, cy - 4); ctx.closePath();
    ctx.globalAlpha = 0.85; fillOut(ctx, hc, 2); ctx.globalAlpha = 1;
  } else if (hs === 'afro') {
    for (let i = 0; i < 3; i++) { const a = Math.PI * (1.35 + i * 0.17); circ(ctx, cx + Math.cos(a) * (R - 1), cy + Math.sin(a) * (R - 1), 5.5, hc, 0); }
  } else if (hs === 'bob') {
    cap();
    poly(ctx, [[cx - 6, cy - 16], [cx + 15, cy - 11], [cx + 15, cy - 6], [cx - 4, cy - 8]], hc, 2.5);
  } else if (hs === 'swoop') {
    cap();
    ctx.beginPath(); ctx.moveTo(cx - 12, cy - 16);
    ctx.quadraticCurveTo(cx + 10, cy - 26, cx + 22, cy - 10);
    ctx.quadraticCurveTo(cx + 20, cy - 3, cx + 15, cy - 1);
    ctx.quadraticCurveTo(cx + 12, cy - 12, cx - 4, cy - 9); ctx.closePath(); fillOut(ctx, hc, 2.5);
  } else if (hs === 'quiff') {
    cap();
    if (!['helmet', 'cap', 'cowboy'].includes(cfg.hat)) {
      ctx.beginPath(); ctx.moveTo(cx - 8, cy - 15);
      ctx.quadraticCurveTo(cx - 4, cy - 34, cx + 14, cy - 30);
      ctx.quadraticCurveTo(cx + 22, cy - 26, cx + 15, cy - 12);
      ctx.quadraticCurveTo(cx + 6, cy - 14, cx - 8, cy - 15); ctx.closePath(); fillOut(ctx, hc, 2.5);
    }
  } else if (hs === 'flattop') {
    if (['helmet', 'cap', 'cowboy'].includes(cfg.hat)) cap();
    else { poly(ctx, [[cx - 17, cy - 2], [cx - 18, cy - 24], [cx - 15, cy - 27], [cx + 12, cy - 27], [cx + 15, cy - 24], [cx + 16, cy - 10], [cx + 4, cy - 10], [cx - 8, cy - 6]], hc);
      for (let i = 0; i < 5; i++) line(ctx, [[cx - 12 + i * 6, cy - 24], [cx - 13 + i * 6, cy - 15]], 1.5, 'rgba(255,255,255,.3)'); }
  } else if (hs === 'spacebuns') {
    cap();
    if (!['helmet', 'cap', 'cowboy'].includes(cfg.hat)) { circ(ctx, cx - 9, cy - 20, 8, hc); circ(ctx, cx + 8, cy - 21, 8, hc); }
  } else if (hs === 'bald') {
    ctx.beginPath(); ctx.arc(cx - 2, cy - 4, 10, Math.PI * 1.15, Math.PI * 1.45);
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; ctx.stroke();
  }

  // --- face accessories
  const g = cfg.glasses;
  if (g === 'sunglasses') {
    line(ctx, [[cx + 1, cy - 3], [cx - 5, cy - 1]], 2.2, OUT);
    rr(ctx, cx + 0.5, cy - 7, 16.5, 8, 3.5); fillOut(ctx, '#1b1b2a', 2);
    line(ctx, [[cx + 3, cy - 5], [cx + 6, cy - 5]], 1.5, 'rgba(255,255,255,.8)');
  } else if (g === 'goggles') {
    line(ctx, [[cx + 2, cy - 3], [cx - R + 1, cy - 1]], 4.5, '#ff9f1c');
    rr(ctx, cx, cy - 8.5, 19, 12, 5.5); fillOut(ctx, 'rgba(120,205,255,.9)', 2.5);
    line(ctx, [[cx + 3, cy - 5.5], [cx + 7, cy - 5.5]], 1.6, '#fff');
  } else if (g === 'glasses') {
    circ(ctx, cx + 4, cy - 2, 5, 'rgba(255,255,255,.25)', 2); circ(ctx, cx + 12.5, cy - 2, 4.6, 'rgba(255,255,255,.25)', 2);
    line(ctx, [[cx - 1, cy - 2], [cx - 4, cy - 1]], 2, OUT);
  } else if (g === 'mustache') {
    ctx.beginPath(); ctx.moveTo(cx + 6, cy + 5);
    ctx.quadraticCurveTo(cx + 9, cy + 1, cx + 13, cy + 4); ctx.quadraticCurveTo(cx + 17, cy + 1, cx + 19, cy + 6);
    ctx.quadraticCurveTo(cx + 15, cy + 5, cx + 13, cy + 7); ctx.quadraticCurveTo(cx + 9, cy + 9, cx + 6, cy + 5);
    fillOut(ctx, '#5a3a1e', 1.5);
  }

  // --- hats
  const hat = cfg.hat, acc = cfg.shirt;
  if (hat === 'helmet') {
    ctx.beginPath(); ctx.arc(cx, cy - 1, R + 4, Math.PI * 0.88, Math.PI * 2.02);
    ctx.lineTo(cx + 14, cy - 7); ctx.lineTo(cx - 2, cy - 8); ctx.lineTo(cx - 10, cy + 6); ctx.closePath();
    fillOut(ctx, acc);
    ctx.beginPath(); ctx.arc(cx, cy - 1, R - 1, Math.PI * 1.2, Math.PI * 1.7);
    ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.stroke();
    rr(ctx, cx + 9, cy - 13, 21, 6, 3); fillOut(ctx, shade(acc, -0.3), 2.5);
    if (hs === 'mohawk') mohawk();
  } else if (hat === 'cap') {
    ctx.beginPath(); ctx.arc(cx, cy - 2, R + 1.5, Math.PI, Math.PI * 1.97); ctx.closePath(); fillOut(ctx, acc);
    ell(ctx, cx + 17, cy - 3, 12, 3.5, shade(acc, -0.25), 2.5);
    circ(ctx, cx - 1, cy - R - 2, 2.5, shade(acc, -0.25), 1.5);
  } else if (hat === 'crown') {
    const b = cy - R + 4;
    poly(ctx, [[cx - 12, b], [cx - 13, b - 12], [cx - 6, b - 5], [cx, b - 16], [cx + 6, b - 5], [cx + 13, b - 12], [cx + 12, b]], '#ffd23f', 2.5);
    circ(ctx, cx, b - 4, 2.2, '#ff4d4d', 1.2); circ(ctx, cx - 7, b - 3, 1.8, '#3a86ff', 1.2); circ(ctx, cx + 7, b - 3, 1.8, '#38c76a', 1.2);
  } else if (hat === 'cowboy') {
    rr(ctx, cx - 11, cy - R - 13, 24, 18, 7); fillOut(ctx, '#b5773f', 2.5);
    ctx.fillStyle = '#5a3a1e'; ctx.fillRect(cx - 10, cy - R - 1, 22, 3.5);
    ell(ctx, cx + 2, cy - R + 3, 28, 5, '#a0673a', 2.5);
  } else if (hat === 'bow') {
    const x = cx - 3, y = cy - R - 1;
    poly(ctx, [[x, y], [x - 12, y - 8], [x - 12, y + 6]], '#ff5fa2', 2.5);
    poly(ctx, [[x, y], [x + 12, y - 8], [x + 12, y + 6]], '#ff5fa2', 2.5);
    circ(ctx, x, y, 3.5, '#ff2d87', 2);
  } else if (hat === 'party') {
    const b = cy - R + 5;
    poly(ctx, [[cx - 10, b], [cx + 11, b - 2], [cx + 3, b - 28]], acc, 2.5);
    line(ctx, [[cx - 5, b - 9], [cx + 8, b - 11]], 2.5, 'rgba(255,255,255,.85)');
    line(ctx, [[cx - 1, b - 18], [cx + 6, b - 19]], 2.5, 'rgba(255,255,255,.85)');
    circ(ctx, cx + 3, b - 29, 4, '#ffd60a', 2);
  }
}

function drawArm(ctx, sh, hand, cfg, far) {
  const dx = hand[0] - sh[0], dy = hand[1] - sh[1], len = Math.hypot(dx, dy) || 1;
  let px = -dy / len, py = dx / len; if (py < 0) { px = -px; py = -py; }
  const bend = Math.max(2, 13 - len * 0.22);
  const el = [(sh[0] + hand[0]) / 2 + px * bend, (sh[1] + hand[1]) / 2 + py * bend];
  const sleeve = far ? shade(cfg.shirt, -0.22) : cfg.shirt;
  const skin = far ? shade(cfg.skin, -0.15) : cfg.skin;
  const longSleeve = cfg.shirtStyle !== 'tee' && cfg.shirtStyle !== 'stripes';
  limb(ctx, [sh, el], 9, sleeve);
  limb(ctx, [el, hand], 8, longSleeve ? sleeve : skin);
  circ(ctx, hand[0], hand[1], 5, skin, 2.5);
}

function drawLeg(ctx, hip, knee, foot, cfg, far) {
  const p = far ? shade(cfg.pants, -0.22) : cfg.pants;
  limb(ctx, [hip, knee, foot], 11, p);
  ell(ctx, foot[0] + 3, foot[1] + 1, 7.5, 4.5, far ? '#d6d6de' : '#f4f4f4', 2.5);
}

function drawRider(ctx, cfg, vd, t) {
  const [hx, hy] = vd.hip;
  const sh = [hx + 7, hy - 30];
  const pose = vd.pose || 'hold';

  // back accessory (behind everything)
  if (cfg.back === 'cape') {
    const w1 = Math.sin(t * 12) * 4, w2 = Math.cos(t * 10) * 5;
    ctx.beginPath(); ctx.moveTo(sh[0] - 2, sh[1] - 2);
    ctx.quadraticCurveTo(sh[0] - 26, sh[1] + w1, sh[0] - 40, sh[1] + 14 + w2);
    ctx.lineTo(sh[0] - 32, sh[1] + 30 + w1);
    ctx.quadraticCurveTo(sh[0] - 14, sh[1] + 25, sh[0] - 6, sh[1] + 20);
    ctx.closePath(); fillOut(ctx, '#e63946');
  } else if (cfg.back === 'wings') {
    const f = Math.sin(t * 14) * 0.25;
    ctx.save(); ctx.translate(sh[0] - 6, sh[1] + 8);
    ctx.rotate(-0.4 + f); ell(ctx, -15, -8, 17, 9, 'rgba(170,225,255,.9)', 2.5, -0.4);
    ctx.rotate(0.6); ell(ctx, -12, 4, 12, 6.5, 'rgba(255,190,235,.9)', 2.5, 0.3);
    ctx.restore();
  } else if (cfg.back === 'backpack') {
    rr(ctx, sh[0] - 21, sh[1] + 1, 14, 24, 5); fillOut(ctx, '#ff9f1c');
    rr(ctx, sh[0] - 19, sh[1] + 13, 10, 8, 3); fillOut(ctx, '#ffc46b', 2);
  }

  // which way do the hands go?
  let nearHand = vd.hand, farHand = null;
  if (pose === 'balance') { const s = Math.sin(t * 3) * 4; farHand = [sh[0] - 22, sh[1] + 4 + s]; nearHand = [sh[0] + 22, sh[1] + 2 - s]; }
  else if (pose === 'cheer') { const s = Math.sin(t * 8) * 3; farHand = [sh[0] - 24, sh[1] - 26 + s]; nearHand = [sh[0] + 34, sh[1] - 24 - s]; }
  if (farHand) drawArm(ctx, sh, farHand, cfg, true);

  // legs
  if (vd.legs === 'sit') {
    const f = vd.foot;
    const knee = [(hx + f[0]) / 2 + 12, Math.min(hy, f[1]) + 1];
    drawLeg(ctx, [hx, hy], knee, f, cfg, false);
  } else if (vd.legs === 'stand') {
    const [f1, f2] = vd.feet;
    const k1 = [(hx + f1[0]) / 2 + 5, (hy + f1[1]) / 2], k2 = [(hx + f2[0]) / 2 + 6, (hy + f2[1]) / 2];
    drawLeg(ctx, [hx, hy], k1, f1, cfg, true);
    drawLeg(ctx, [hx, hy], k2, f2, cfg, false);
  }

  // torso
  const A = [hx, hy - 3], B = [sh[0], sh[1] + 5];
  if (cfg.shirtStyle === 'hoodie') circ(ctx, sh[0] - 8, sh[1] - 1, 8, shade(cfg.shirt, -0.15));
  limb(ctx, [A, B], 21, cfg.shirt);
  const ux = B[0] - A[0], uy = B[1] - A[1], ul = Math.hypot(ux, uy), nx = -uy / ul, ny = ux / ul;
  const at = k => [A[0] + ux * k, A[1] + uy * k];
  if (cfg.shirtStyle === 'stripes') {
    const sc = cfg.shirt === '#ffffff' ? '#3a86ff' : 'rgba(255,255,255,.85)';
    for (const k of [0.15, 0.5, 0.85]) { const p = at(k); line(ctx, [[p[0] - nx * 9, p[1] - ny * 9], [p[0] + nx * 9, p[1] + ny * 9]], 3.5, sc); }
  } else if (cfg.shirtStyle === 'hero') {
    const p = at(0.55); star(ctx, p[0] + 1, p[1], 7, '#ffd60a', 0.2);
  } else if (cfg.shirtStyle === 'jacket') {
    line(ctx, [[A[0] + nx * 5, A[1] + ny * 5], [B[0] + nx * 5, B[1] + ny * 5]], 2.5, shade(cfg.shirt, 0.45));
  } else if (cfg.shirtStyle === 'hoodie') {
    const p = at(0.75); line(ctx, [[p[0] + 4, p[1]], [p[0] + 4, p[1] + 8]], 1.8, '#fff');
  }

  // near arm + head
  drawArm(ctx, sh, nearHand, cfg, false);
  drawHead(ctx, cfg, sh[0] + 5, sh[1] - 16, t);
}

// =============================================================
//  VEHICLES   (origin = ground under the middle, facing right)
// =============================================================
function wheel(ctx, x, y, r, spin, tire = '#2b2b38', hub = '#d8dee8') {
  circ(ctx, x, y, r, tire);
  ctx.save(); ctx.translate(x, y); ctx.rotate(spin);
  ctx.fillStyle = '#4a4a5a';
  for (let i = 0; i < 8; i++) { ctx.rotate(TAU / 8); ctx.fillRect(r - 4, -1.5, 3, 3); }
  ctx.restore();
  circ(ctx, x, y, r * 0.55, hub, 2);
  ctx.save(); ctx.translate(x, y); ctx.rotate(spin);
  ctx.strokeStyle = '#8a94a6'; ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) { ctx.rotate(TAU / 3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r * 0.55, 0); ctx.stroke(); }
  ctx.restore();
  circ(ctx, x, y, Math.max(1.5, r * 0.15), '#555', 1.5);
}
function fender(ctx, x, y, r, a0, a1, c) {
  ctx.beginPath(); ctx.arc(x, y, r, a0, a1);
  ctx.lineCap = 'round'; ctx.lineWidth = 10; ctx.strokeStyle = OUT; ctx.stroke();
  ctx.lineWidth = 6; ctx.strokeStyle = c; ctx.stroke();
}
function hoofLeg(ctx, x, y, ph, far) {
  const sw = Math.sin(ph), lift = Math.max(0, Math.cos(ph)) * 7;
  const knee = [x + sw * 8, y + 17], hoof = [x + sw * 13, -5 - lift];
  limb(ctx, [[x, y], knee, hoof], 8, far ? '#e4e0f0' : '#ffffff');
  ell(ctx, hoof[0] + 1, hoof[1] + 2, 5, 3.5, '#c9a0dc', 2);
}

const VEHICLES = {
  dirtbike: {
    hip: [-10, -50], hand: [27, -58], foot: [6, -28], legs: 'sit', h: 125, w: 110,
    draw(ctx, c, t, s) {
      wheel(ctx, -38, -16, 16, s); wheel(ctx, 38, -16, 16, s);
      limb(ctx, [[-38, -16], [-8, -32]], 6, '#666');
      limb(ctx, [[-12, -30], [-40, -37]], 5, '#c9ced6');
      limb(ctx, [[38, -16], [27, -54]], 6, '#aab2bf');
      poly(ctx, [[-38, -47], [-14, -34], [14, -34], [31, -48], [14, -57], [-4, -50], [-30, -55]], c);
      rr(ctx, -33, -57, 30, 8, 4); fillOut(ctx, '#2b2b38', 2.5);
      fender(ctx, 38, -16, 21, Math.PI * 1.1, Math.PI * 1.7, c);
      circ(ctx, 6, -44, 7, '#fff', 2.5);
      ctx.fillStyle = OUT; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('1', 6, -43.5);
      limb(ctx, [[21, -58], [32, -61]], 4, '#333');
    },
  },
  atv: {
    hip: [-12, -58], hand: [22, -65], foot: [4, -36], legs: 'sit', h: 130, w: 120,
    draw(ctx, c, t, s) {
      wheel(ctx, -34, -19, 19, s); wheel(ctx, 34, -19, 19, s);
      rr(ctx, -50, -48, 100, 16, 8); fillOut(ctx, c);
      fender(ctx, -34, -19, 24, Math.PI * 1.05, Math.PI * 1.95, c);
      fender(ctx, 34, -19, 24, Math.PI * 1.05, Math.PI * 1.95, c);
      rr(ctx, -31, -59, 34, 9, 4); fillOut(ctx, '#2b2b38', 2.5);
      limb(ctx, [[16, -46], [20, -64]], 4, '#555'); limb(ctx, [[14, -65], [28, -65]], 4, '#333');
      circ(ctx, 47, -40, 4, '#fff7a1', 2);
    },
  },
  skateboard: {
    hip: [0, -52], feet: [[-13, -17], [13, -17]], legs: 'stand', pose: 'balance', h: 120, w: 84,
    draw(ctx, c, t, s) {
      line(ctx, [[-22, -10], [22, -10]], 4, '#8a94a6');
      circ(ctx, -22, -6, 5.5, '#ffd60a', 2.5); circ(ctx, 22, -6, 5.5, '#ffd60a', 2.5);
      limb(ctx, [[-41, -20], [-33, -14], [33, -14], [41, -20]], 5, c);
    },
  },
  scooter: {
    hip: [-6, -50], feet: [[-15, -18], [2, -18]], hand: [20, -75], legs: 'stand', h: 132, w: 84,
    draw(ctx, c, t, s) {
      wheel(ctx, -24, -8, 8, s); wheel(ctx, 28, -8, 8, s);
      limb(ctx, [[-30, -14], [24, -14]], 6, c);
      limb(ctx, [[26, -12], [21, -76]], 5, c);
      limb(ctx, [[13, -77], [29, -77]], 5, '#333');
    },
  },
  monstertruck: {
    hip: [-8, -92], hand: [20, -110], legs: 'none', h: 168, w: 150,
    draw(ctx, c, t, s) {
      limb(ctx, [[-44, -30], [-36, -64]], 6, '#888'); limb(ctx, [[44, -30], [36, -64]], 6, '#888');
      for (const x of [-46, 46]) {
        circ(ctx, x, -30, 30, '#2b2b38');
        ctx.save(); ctx.translate(x, -30); ctx.rotate(s); ctx.fillStyle = '#494958';
        for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); ctx.fillRect(22, -4, 7, 8); }
        ctx.restore();
        circ(ctx, x, -30, 13, shade(c, -0.1), 2.5); circ(ctx, x, -30, 4, '#ddd', 2);
      }
      rr(ctx, -68, -90, 136, 30, 10); fillOut(ctx, c);
      poly(ctx, [[-60, -70], [-40, -82], [-30, -72], [-14, -84], [0, -70], [-60, -66]], '#ffd60a', 2);
      poly(ctx, [[-56, -70], [-42, -78], [-32, -70], [-56, -68]], '#ff7b1c', 0);
      circ(ctx, 64, -78, 4.5, '#fff7a1', 2);
      limb(ctx, [[14, -98], [20, -108]], 3, '#555');
      ell(ctx, 20, -110, 3, 8, '#333', 2);
    },
    front(ctx, c) { rr(ctx, -32, -106, 62, 18, 7); fillOut(ctx, shade(c, -0.18)); },
  },
  gokart: {
    hip: [-14, -28], hand: [10, -42], foot: [34, -22], legs: 'sit', h: 100, w: 112,
    draw(ctx, c, t, s) {
      wheel(ctx, -34, -12, 12, s); wheel(ctx, 36, -12, 12, s);
      rr(ctx, -52, -32, 16, 13, 3); fillOut(ctx, '#888', 2.5);
      limb(ctx, [[-50, -22], [-58, -18]], 4, '#bbb');
      poly(ctx, [[-46, -16], [46, -16], [50, -24], [-44, -28]], shade(c, -0.25));
      rr(ctx, -27, -54, 10, 30, 4); fillOut(ctx, '#2b2b38', 2.5);
      limb(ctx, [[18, -26], [10, -40]], 3, '#555');
      ell(ctx, 10, -42, 3, 8, '#333', 2);
    },
    front(ctx, c) {
      poly(ctx, [[12, -31], [44, -28], [55, -18], [51, -12], [12, -14]], c);
      circ(ctx, 31, -21, 6, '#fff', 2);
      ctx.fillStyle = OUT; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('7', 31, -20.5);
    },
  },
  unicorn: {
    hip: [-6, -72], hand: [24, -80], foot: [0, -48], legs: 'sit', h: 158, w: 120,
    draw(ctx, c, t, s) {
      const g = s * 0.9, b = Math.sin(g * 2) * 2;
      hoofLeg(ctx, -22, -42, g + Math.PI, true); hoofLeg(ctx, 24, -42, g, true);
      // rainbow tail
      for (let i = 0; i < 5; i++) {
        const w = Math.sin(t * 9 + i) * 4;
        limb(ctx, [[-34, -56 + b], [-52, -52 + i * 3 + w], [-60, -38 + i * 3 + w]], 4, RAINBOW[i]);
      }
      ell(ctx, 0, -52 + b, 38, 19, '#ffffff');
      hoofLeg(ctx, -26, -42, g, false); hoofLeg(ctx, 28, -42, g + Math.PI, false);
      poly(ctx, [[20, -64 + b], [34, -94 + b], [50, -90 + b], [38, -52 + b]], '#ffffff');
      ell(ctx, 50, -94 + b, 16, 10, '#ffffff', 3, 0.35);
      poly(ctx, [[44, -103 + b], [52, -104 + b], [57, -128 + b]], '#ffd23f', 2.5);
      for (let i = 0; i < 5; i++) circ(ctx, 30 + i * 3, -64 - i * 7 + b, 6, RAINBOW[i], 2);
      circ(ctx, 50, -97 + b, 2.6, OUT, 0);
      circ(ctx, 62, -89 + b, 1.3, OUT, 0);
      rr(ctx, -21, -74 + b, 31, 11, 5); fillOut(ctx, c, 2.5);
    },
  },
  cart: {
    hip: [-2, -58], legs: 'none', pose: 'cheer', h: 140, w: 104,
    draw(ctx, c, t, s) {
      line(ctx, [[-30, -16], [-30, -8]], 3, '#8b9bb0'); line(ctx, [[26, -16], [26, -8]], 3, '#8b9bb0');
      circ(ctx, -30, -6, 6, '#333', 2); circ(ctx, 26, -6, 6, '#333', 2);
      limb(ctx, [[-36, -16], [30, -16]], 3, '#9aa8b8');
      limb(ctx, [[-40, -66], [-50, -74]], 3, '#9aa8b8');
      limb(ctx, [[-50, -74], [-60, -74]], 6, c);
      poly(ctx, [[-40, -66], [38, -66], [30, -20], [-32, -20]], 'rgba(160,180,200,.35)', 0);
    },
    front(ctx, c) {
      poly(ctx, [[-40, -66], [38, -66], [30, -20], [-32, -20]], 'rgba(205,228,248,.45)', 3);
      ctx.strokeStyle = '#8b9bb0'; ctx.lineWidth = 2;
      for (let k = 1; k < 7; k++) {
        ctx.beginPath(); ctx.moveTo(-40 + 78 * k / 7, -66); ctx.lineTo(-32 + 62 * k / 7, -20); ctx.stroke();
      }
      for (const y of [-54, -42, -30]) {
        const f = (y + 66) / 46;
        ctx.beginPath(); ctx.moveTo(-40 + 8 * f, y); ctx.lineTo(38 - 8 * f, y); ctx.stroke();
      }
      limb(ctx, [[-42, -66], [40, -66]], 5, c);
    },
  },
  rocketbed: {
    hip: [-14, -44], hand: [16, -52], legs: 'none', h: 112, w: 150,
    draw(ctx, c, t, s) {
      const f = 0.8 + Math.sin(t * 40) * 0.12 + Math.sin(t * 23) * 0.08;
      poly(ctx, [[-76, -32], [-76, -16], [-76 - 30 * f, -24]], '#ff7b1c', 2);
      poly(ctx, [[-76, -28], [-76, -20], [-76 - 16 * f, -24]], '#ffd60a', 0);
      rr(ctx, -80, -34, 32, 18, 9); fillOut(ctx, '#c9ced6');
      poly(ctx, [[-74, -34], [-66, -34], [-76, -44]], '#ff4d4d', 2);
      poly(ctx, [[-74, -16], [-66, -16], [-76, -6]], '#ff4d4d', 2);
      limb(ctx, [[-40, -14], [-38, -8]], 3, '#777'); limb(ctx, [[34, -14], [34, -8]], 3, '#777');
      circ(ctx, -38, -5, 5, '#555', 2); circ(ctx, 34, -5, 5, '#555', 2);
      rr(ctx, -48, -26, 96, 12, 4); fillOut(ctx, '#a0673a');
      rr(ctx, -56, -66, 12, 54, 6); fillOut(ctx, c);
      rr(ctx, -44, -37, 90, 12, 6); fillOut(ctx, '#ffffff', 2.5);
      ell(ctx, -31, -42, 11, 7, '#ffffff', 2.5);
    },
    front(ctx, c) {
      rr(ctx, -20, -52, 66, 18, 8); fillOut(ctx, shade(c, 0.25));
      for (let i = 0; i < 4; i++) circ(ctx, -10 + i * 15, -43 + (i % 2) * 3, 2.5, '#fff', 0);
    },
  },
  _stand: {
    hip: [0, -40], feet: [[-5, -2], [6, -2]], hand: [15, -46], legs: 'stand', h: 110, w: 40,
    draw() { },
  },
};

// Draws a whole rider + vehicle. opts: {boost}
function drawRig(ctx, cfg, t, spin, opts = {}) {
  const vd = VEHICLES[cfg.vehicle] || VEHICLES.dirtbike;
  if (opts.boost) {
    const f = 0.8 + Math.sin(t * 50) * 0.2;
    const bx = -vd.w / 2 - 4;
    poly(ctx, [[bx, -34], [bx, -14], [bx - 46 * f, -24]], '#ff7b1c', 2);
    poly(ctx, [[bx, -29], [bx, -19], [bx - 26 * f, -24]], '#ffd60a', 0);
  }
  vd.draw(ctx, cfg.vColor, t, spin);
  drawRider(ctx, cfg, vd, t);
  if (vd.front) vd.front(ctx, cfg.vColor, t, spin);
}

function randomCfg() {
  return {
    hair: pick(HAIR_STYLES), hairColor: pick(HAIR_COLORS), skin: pick(SKINS), face: pick(FACES),
    shirtStyle: pick(SHIRTS), shirt: pick(COLORS), pants: pick(COLORS),
    hat: pick(HATS), glasses: Math.random() < 0.5 ? 'none' : pick(GLASSES), back: Math.random() < 0.5 ? 'none' : pick(BACKS),
    vehicle: pick(VEHICLE_TYPES), vColor: pick(COLORS), monster: pick(MONSTER_TYPES),
  };
}

// =============================================================
//  MONSTERS  (origin = ground, facing right, ~190px tall)
// =============================================================
function dizzyStars(ctx, x, y, t) {
  for (let i = 0; i < 3; i++) {
    const a = t * 4 + i * TAU / 3;
    star(ctx, x + Math.cos(a) * 30, y + Math.sin(a) * 9, 7, '#ffd60a', t * 3);
  }
}
function claws(ctx, x, y, c) {
  circ(ctx, x, y, 11, c, 3);
  for (let k = -1; k <= 1; k++) poly(ctx, [[x + 7, y + k * 6 - 3], [x + 18, y + k * 7], [x + 7, y + k * 6 + 3]], '#fff', 2);
}
function monsterEyes(ctx, pts, t, mood) {
  for (const [x, y, r] of pts) {
    circ(ctx, x, y, r, '#fff', 3);
    if (mood === 'dizzy') {
      ctx.beginPath();
      for (let a = 0; a < TAU * 2; a += 0.3) ctx.lineTo(x + Math.cos(a + t * 6) * a * r / 14, y + Math.sin(a + t * 6) * a * r / 14);
      ctx.lineWidth = 2.5; ctx.strokeStyle = OUT; ctx.stroke();
    } else {
      circ(ctx, x + r * 0.35, y + r * 0.1, r * 0.48, OUT, 0);
      circ(ctx, x + r * 0.5, y - r * 0.15, r * 0.16, '#fff', 0);
    }
  }
}
function mouthOpen(t, mood) {
  if (mood === 'happy') return 0.5 + 0.5 * Math.abs(Math.sin(t * 10));
  if (mood === 'dizzy') return 0.2;
  return 0.35 + 0.18 * Math.sin(t * 6);
}

const MONSTERS = {
  mohawk(ctx, t, mood) {
    const still = mood === 'dizzy';
    const run = still ? 0 : Math.sin(t * 11), bob = still ? 0 : -Math.abs(Math.sin(t * 11)) * 7;
    const P = '#8e5cf7', D = '#6c43d6', L = '#c9b2ff', o = mouthOpen(t, mood);
    limb(ctx, [[-22, -45 + bob], [-22 - run * 16, -12]], 24, D); ell(ctx, -14 - run * 16, -8, 19, 9, D);
    ctx.save(); ctx.translate(0, bob);
    limb(ctx, [[30, -118], [84, -128 - run * 8]], 17, D); claws(ctx, 84, -128 - run * 8, D);
    // rainbow mohawk
    const n = 7, a0 = Math.PI * 1.12, a1 = Math.PI * 1.86, st = (a1 - a0) / n;
    ctx.beginPath(); ctx.moveTo(Math.cos(a0) * 60, -95 + Math.sin(a0) * 62);
    for (let i = 0; i < n; i++) {
      const at = a0 + st * (i + 0.5), ab = a0 + st * (i + 1), tip = 98 + (i % 2) * 8;
      ctx.lineTo(Math.cos(at) * tip, -95 + Math.sin(at) * tip);
      ctx.lineTo(Math.cos(ab) * 60, -95 + Math.sin(ab) * 62);
    }
    ctx.closePath(); fillOut(ctx, rainbowGrad(ctx, -60, -150, 60, -150), 3.5);
    // furry body
    ctx.beginPath();
    for (let i = 0; i <= 44; i++) {
      const a = i / 44 * TAU, k = i % 2 ? 1.07 : 1;
      ctx.lineTo(Math.cos(a) * 68 * k, -95 + Math.sin(a) * 72 * k);
    }
    ctx.closePath(); fillOut(ctx, P, 4);
    ell(ctx, 8, -74, 40, 36, L, 0);
    monsterEyes(ctx, [[22, -126, 15], [53, -120, 13]], t, mood);
    line(ctx, [[8, -146], [32, -142]], 5, OUT); line(ctx, [[44, -138], [64, -136]], 5, OUT);
    // mouth
    ctx.beginPath(); ctx.moveTo(16, -92); ctx.lineTo(68, -95);
    ctx.quadraticCurveTo(66, -90 + o * 40, 42, -86 + o * 38); ctx.quadraticCurveTo(20, -86 + o * 30, 16, -92);
    ctx.closePath(); fillOut(ctx, '#5a1030', 3);
    for (let i = 0; i < 5; i++) poly(ctx, [[20 + i * 10, -93 + i * -0.5], [30 + i * 10, -94 - i * 0.5], [25 + i * 10, -84]], '#fff', 1.5);
    ell(ctx, 42, -80 + o * 26, 10, 5 * o + 1, '#ff7aa2', 0);
    ctx.restore();
    limb(ctx, [[22, -45 + bob], [22 + run * 16, -12]], 24, P); ell(ctx, 30 + run * 16, -8, 19, 9, P);
    ctx.save(); ctx.translate(0, bob);
    limb(ctx, [[42, -88], [92, -78 - run * -8]], 19, P); claws(ctx, 92, -78 + run * 8, P);
    ctx.restore();
    if (still) dizzyStars(ctx, 0, -205, t);
  },

  slime(ctx, t, mood) {
    const still = mood === 'dizzy', ph = t * 7;
    const hop = still ? 0 : -Math.max(0, Math.sin(ph)) * 24, sq = still ? 1 : 1 + Math.cos(ph * 2) * 0.06;
    const o = mouthOpen(t, mood);
    ctx.save(); ctx.translate(0, hop); ctx.scale(sq, 1 / sq);
    ctx.beginPath(); ctx.moveTo(-80, 0); ctx.bezierCurveTo(-92, -180, 92, -180, 80, 0);
    for (let i = 0; i < 6; i++) { const x = 80 - i * 160 / 6; ctx.quadraticCurveTo(x - 160 / 12, 10 + (i % 2) * 6, x - 160 / 6, 0); }
    ctx.closePath(); fillOut(ctx, '#5ad65a', 4);
    ell(ctx, -38, -96, 11, 24, 'rgba(255,255,255,.5)', 0, 0.4);
    circ(ctx, -26, -40, 7, 'rgba(255,255,255,.35)', 0); circ(ctx, -46, -62, 4, 'rgba(255,255,255,.35)', 0); circ(ctx, 52, -36, 5, 'rgba(255,255,255,.35)', 0);
    monsterEyes(ctx, [[12, -102, 17], [48, -98, 14]], t, mood);
    ctx.beginPath(); ctx.moveTo(4, -66); ctx.quadraticCurveTo(36, -62, 66, -70);
    ctx.quadraticCurveTo(60, -62 + o * 34, 36, -58 + o * 32); ctx.quadraticCurveTo(10, -58 + o * 22, 4, -66);
    ctx.closePath(); fillOut(ctx, '#1d5a1d', 3);
    ell(ctx, 38, -54 + o * 24, 10, 5 * o + 1, '#ff7aa2', 0);
    ctx.restore();
    if (still) dizzyStars(ctx, 0, -150, t);
  },

  dino(ctx, t, mood) {
    const still = mood === 'dizzy';
    const run = still ? 0 : Math.sin(t * 12), bob = still ? 0 : -Math.abs(Math.sin(t * 12)) * 6;
    const O = '#ff8c3a', OD = '#e06d1f', B = '#ffe0a3', S = '#38c76a', o = mouthOpen(t, mood);
    limb(ctx, [[-22, -66 + bob], [-22 - run * 16, -34], [-16 - run * 20, -8]], 18, OD); ell(ctx, -8 - run * 20, -6, 15, 7, OD);
    ctx.save(); ctx.translate(0, bob);
    const tw = Math.sin(t * 8);
    ctx.beginPath(); ctx.moveTo(-40, -112); ctx.quadraticCurveTo(-110, -100 + tw * 10, -145, -62 + tw * 14);
    ctx.quadraticCurveTo(-100, -68, -40, -66); ctx.closePath(); fillOut(ctx, O, 4);
    for (let i = 0; i < 5; i++) { const x = -54 + i * 20; poly(ctx, [[x - 9, -124 + i * 2], [x, -146 + i * 2], [x + 9, -126 + i * 2]], S, 2.5); }
    ell(ctx, -5, -96, 58, 40, O, 4);
    ell(ctx, 8, -80, 38, 22, B, 0);
    poly(ctx, [[18, -120], [36, -152], [70, -142], [50, -96]], O, 0);
    // jaw
    ctx.save(); ctx.translate(40, -140); ctx.rotate(o * 0.5);
    poly(ctx, [[0, 0], [66, 4], [62, 18], [4, 22]], O, 3.5);
    for (let i = 0; i < 4; i++) poly(ctx, [[14 + i * 12, 4], [24 + i * 12, 4], [19 + i * 12, -6]], '#fff', 1.5);
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(62, -156, 44, 26, -0.1, 0, TAU); fillOut(ctx, O, 4);
    for (let i = 0; i < 5; i++) poly(ctx, [[48 + i * 11, -134], [57 + i * 11, -135], [52 + i * 11, -124]], '#fff', 1.5);
    monsterEyes(ctx, [[66, -166, 10]], t, mood);
    line(ctx, [[56, -180], [78, -178]], 5, OUT);
    circ(ctx, 100, -158, 2.5, OUT, 0);
    limb(ctx, [[36, -96], [52, -86], [60, -78]], 7, O);
    ctx.restore();
    limb(ctx, [[12, -66 + bob], [12 + run * 16, -34], [18 + run * 20, -8]], 21, O); ell(ctx, 30 + run * 20, -6, 16, 7, O);
    if (still) dizzyStars(ctx, 50, -205, t);
  },

  robot(ctx, t, mood) {
    const still = mood === 'dizzy', bob = still ? 0 : Math.sin(t * 14) * 1.5, o = mouthOpen(t, mood);
    const C = '#a9b4c6', C2 = '#c7cfdb', DK = '#3a3f4b';
    rr(ctx, -64, -38, 128, 38, 19); fillOut(ctx, DK, 4);
    for (let i = 0; i < 4; i++) {
      const x = -45 + i * 30; circ(ctx, x, -19, 11, '#777', 2.5);
      ctx.save(); ctx.translate(x, -19); ctx.rotate(still ? 0 : t * 9);
      line(ctx, [[-8, 0], [8, 0]], 3, '#444'); ctx.restore();
    }
    ctx.save(); ctx.translate(0, bob);
    limb(ctx, [[0, -52], [0, -38]], 22, '#666');
    rr(ctx, -52, -142, 104, 92, 16); fillOut(ctx, C, 4);
    rr(ctx, -32, -124, 52, 30, 6); fillOut(ctx, DK, 3);
    const blink = Math.floor(t * 4);
    ['#ff4d4d', '#ffd60a', '#38c76a'].forEach((c, i) => circ(ctx, -20 + i * 14, -109, 5, (blink + i) % 3 ? c : '#555', 1.5));
    rr(ctx, -34, -202, 92, 58, 14); fillOut(ctx, C2, 4);
    limb(ctx, [[10, -202], [10, -222]], 3, '#666');
    circ(ctx, 10, -228, 7, blink % 2 ? '#ff4d4d' : '#ffb3b3', 2.5);
    if (still) { line(ctx, [[8, -186], [24, -174]], 4, OUT); line(ctx, [[24, -186], [8, -174]], 4, OUT); line(ctx, [[36, -186], [50, -174]], 4, OUT); line(ctx, [[50, -186], [36, -174]], 4, OUT); }
    else { rr(ctx, 6, -188, 19, 15, 4); fillOut(ctx, '#5ef2ff', 2.5); rr(ctx, 34, -188, 17, 15, 4); fillOut(ctx, '#5ef2ff', 2.5); }
    rr(ctx, 6, -166, 46, 8 + o * 14, 4); fillOut(ctx, DK, 2.5);
    for (let i = 1; i < 5; i++) line(ctx, [[6 + i * 9.2, -165], [6 + i * 9.2, -159 + o * 13]], 1.5, '#7a8396');
    for (const [x, y] of [[-44, -134], [44, -134], [-44, -58], [44, -58]]) circ(ctx, x, y, 3, '#7a8396', 1.5);
    const ay = -112 + (still ? 0 : Math.sin(t * 6) * 8);
    limb(ctx, [[40, -110], [72, -104], [102, ay]], 10, '#8a94a6');
    const pinch = 0.3 + o * 0.5;
    ctx.save(); ctx.translate(102, ay);
    ctx.save(); ctx.rotate(-pinch); limb(ctx, [[0, 0], [16, 0], [20, 6]], 5, '#6b7385'); ctx.restore();
    ctx.save(); ctx.rotate(pinch); limb(ctx, [[0, 0], [16, 0], [20, -6]], 5, '#6b7385'); ctx.restore();
    circ(ctx, 0, 0, 7, '#8a94a6', 2.5);
    ctx.restore();
    ctx.restore();
    if (still) dizzyStars(ctx, 10, -250, t);
  },

  ghost(ctx, t, mood) {
    const still = mood === 'dizzy', fl = -24 + (still ? 0 : Math.sin(t * 3) * 8), o = mouthOpen(t, mood);
    ctx.save(); ctx.translate(0, fl);
    const W = '#f7f5ff';
    ctx.beginPath(); ctx.moveTo(-62, -30); ctx.lineTo(-62, -112); ctx.arc(0, -112, 62, Math.PI, 0); ctx.lineTo(62, -30);
    const n = 5;
    for (let i = 0; i < n; i++) {
      const x0 = 62 - i * 124 / n, x1 = 62 - (i + 1) * 124 / n, wv = Math.sin(t * 6 + i) * 6;
      ctx.quadraticCurveTo((x0 + x1) / 2, 4 + wv, x1, -30);
    }
    ctx.closePath(); fillOut(ctx, W, 4);
    ell(ctx, 64, -78 + Math.sin(t * 8) * 5, 17, 9, W, 3, -0.5);
    ell(ctx, -30, -140, 10, 18, 'rgba(255,255,255,.9)', 0, -0.5);
    if (still) monsterEyes(ctx, [[8, -122, 11], [38, -118, 10]], t, mood);
    else {
      ell(ctx, 8, -122, 9, 14, OUT, 0); ell(ctx, 38, -118, 8, 13, OUT, 0);
      circ(ctx, 11, -127, 3, '#fff', 0); circ(ctx, 41, -123, 2.6, '#fff', 0);
    }
    ctx.fillStyle = 'rgba(255,120,170,.4)'; ctx.beginPath(); ctx.arc(-6, -96, 7, 0, TAU); ctx.arc(52, -94, 6, 0, TAU); ctx.fill();
    ell(ctx, 26, -88, 12, 6 + o * 12, '#4a2a5a', 3);
    ell(ctx, 28, -82 + o * 8, 6, 3 + o * 3, '#ff7aa2', 0);
    ctx.restore();
    if (still) dizzyStars(ctx, 0, -200, t);
  },
};

function drawMonster(ctx, kind, t, mood = 'chase') {
  ell(ctx, 0, 0, 80, 12, 'rgba(0,0,0,.18)', 0);
  (MONSTERS[kind] || MONSTERS.mohawk)(ctx, t, mood);
}

// =============================================================
//  TRACK THINGS  (origin = ground, ~50px wide)
// =============================================================
const OBSTACLES = {
  rock(ctx) {
    poly(ctx, [[-27, 0], [-25, -22], [-10, -38], [9, -40], [25, -24], [28, 0]], '#9aa0a8');
    line(ctx, [[-12, -30], [2, -33]], 3, 'rgba(255,255,255,.6)');
  },
  log(ctx) {
    rr(ctx, -32, -32, 62, 32, 14); fillOut(ctx, '#9b6a3c');
    line(ctx, [[-22, -20], [8, -20]], 2.5, '#7a4f28');
    circ(ctx, 24, -16, 15, '#e0b47a'); circ(ctx, 24, -16, 9, null, 2); circ(ctx, 24, -16, 3, null, 2);
  },
  hay(ctx) {
    rr(ctx, -27, -46, 54, 46, 8); fillOut(ctx, '#f2c94c');
    for (let i = 0; i < 4; i++) line(ctx, [[-20, -38 + i * 10], [20, -36 + i * 10]], 2, '#d9a92e');
    line(ctx, [[-12, -46], [-12, 0]], 3.5, '#b5773f'); line(ctx, [[12, -46], [12, 0]], 3.5, '#b5773f');
  },
  cone(ctx) {
    rr(ctx, -25, -7, 50, 7, 2); fillOut(ctx, '#ff7b1c', 2.5);
    poly(ctx, [[-19, -6], [19, -6], [6, -50], [-6, -50]], '#ff7b1c');
    poly(ctx, [[-14, -22], [14, -22], [11, -32], [-11, -32]], '#fff', 0);
  },
  sandcastle(ctx) {
    const S = '#f0c97a';
    rr(ctx, -28, -26, 56, 26, 3); fillOut(ctx, S);
    rr(ctx, -27, -46, 15, 22, 2); fillOut(ctx, S); rr(ctx, 12, -46, 15, 22, 2); fillOut(ctx, S);
    rr(ctx, -9, -56, 18, 32, 2); fillOut(ctx, S);
    rr(ctx, -5, -14, 10, 14, 5); fillOut(ctx, '#c99a4a', 2);
    line(ctx, [[0, -56], [0, -72]], 2, OUT); poly(ctx, [[0, -72], [12, -68], [0, -64]], '#ff4d4d', 2);
  },
  crab(ctx, t) {
    const s = Math.sin(t * 8);
    for (let i = 0; i < 3; i++) { line(ctx, [[-14 + i * 4, -10], [-26 + i * 3, -2]], 3, OUT); line(ctx, [[14 - i * 4, -10], [26 - i * 3, -2]], 3, OUT); }
    limb(ctx, [[-14, -20], [-24, -34 - s * 3]], 4, '#ff5a4a'); limb(ctx, [[14, -20], [24, -34 + s * 3]], 4, '#ff5a4a');
    circ(ctx, -25, -38 - s * 3, 7, '#ff5a4a'); circ(ctx, 25, -38 + s * 3, 7, '#ff5a4a');
    ell(ctx, 0, -16, 22, 13, '#ff5a4a');
    line(ctx, [[-5, -27], [-6, -36]], 2.5, OUT); line(ctx, [[5, -27], [6, -36]], 2.5, OUT);
    circ(ctx, -6, -38, 4, '#fff', 2); circ(ctx, 6, -38, 4, '#fff', 2);
    circ(ctx, -5, -38, 1.8, OUT, 0); circ(ctx, 7, -38, 1.8, OUT, 0);
    ctx.beginPath(); ctx.arc(0, -14, 5, 0.2, Math.PI - 0.2); ctx.lineWidth = 2; ctx.strokeStyle = OUT; ctx.stroke();
  },
  beachball(ctx, t) {
    ctx.save(); ctx.translate(0, -22); ctx.rotate(t * 2);
    const cs = ['#ff4d4d', '#fff', '#3a86ff', '#fff', '#ffd60a', '#fff'];
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 22, i * TAU / 6, (i + 1) * TAU / 6); ctx.closePath(); ctx.fillStyle = cs[i]; ctx.fill(); }
    circ(ctx, 0, 0, 22, null, 3); circ(ctx, 0, 0, 4, '#fff', 2);
    ctx.restore();
  },
  snowman(ctx) {
    circ(ctx, 0, -18, 19, '#fff'); circ(ctx, 0, -46, 14, '#fff');
    line(ctx, [[-14, -32], [-28, -42]], 3, '#7a4f28'); line(ctx, [[14, -32], [28, -42]], 3, '#7a4f28');
    rr(ctx, -13, -37, 26, 6, 3); fillOut(ctx, '#ff4d4d', 2);
    circ(ctx, 2, -49, 1.8, OUT, 0); circ(ctx, 8, -49, 1.8, OUT, 0);
    poly(ctx, [[6, -45], [20, -43], [6, -41]], '#ff9f1c', 1.5);
    circ(ctx, 0, -20, 2, OUT, 0); circ(ctx, 0, -12, 2, OUT, 0);
  },
  iceblock(ctx) {
    rr(ctx, -25, -46, 50, 46, 6); fillOut(ctx, 'rgba(170,220,255,.95)');
    line(ctx, [[-16, -36], [-6, -40]], 3, '#fff'); line(ctx, [[-16, -26], [-12, -28]], 3, '#fff');
  },
  snowlog(ctx) {
    OBSTACLES.log(ctx);
    ctx.beginPath(); ctx.moveTo(-30, -30); ctx.quadraticCurveTo(-10, -44, 10, -36); ctx.quadraticCurveTo(26, -44, 36, -28);
    ctx.lineTo(-30, -26); ctx.closePath(); fillOut(ctx, '#fff', 2.5);
  },
  gumdrop(ctx, t, v) {
    const c = ['#ff4d4d', '#38c76a', '#9b5de5', '#ff9f1c'][v % 4];
    ctx.beginPath(); ctx.moveTo(-25, 0); ctx.quadraticCurveTo(-27, -48, 0, -48); ctx.quadraticCurveTo(27, -48, 25, 0); ctx.closePath(); fillOut(ctx, c);
    for (let i = 0; i < 8; i++) circ(ctx, -15 + rand01(i + v) * 30, -8 - rand01(i * 3 + v) * 32, 1.6, 'rgba(255,255,255,.85)', 0);
  },
  lollipop(ctx, t) {
    limb(ctx, [[0, 0], [0, -38]], 4, '#fff');
    circ(ctx, 0, -54, 19, '#ff5fa2');
    ctx.save(); ctx.translate(0, -54); ctx.rotate(t * 2); ctx.beginPath();
    for (let a = 0; a < TAU * 2.2; a += 0.2) ctx.lineTo(Math.cos(a) * a * 1.3, Math.sin(a) * a * 1.3);
    ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.restore();
  },
  cupcake(ctx) {
    poly(ctx, [[-19, 0], [19, 0], [24, -26], [-24, -26]], '#5ec8f2');
    for (let i = -2; i <= 2; i++) line(ctx, [[i * 8, -2], [i * 10, -24]], 2, '#3aa6d6');
    circ(ctx, -14, -32, 10, '#ffb3d9'); circ(ctx, 14, -32, 10, '#ffb3d9'); circ(ctx, 0, -40, 13, '#ffb3d9');
    circ(ctx, 2, -56, 6, '#ff4d4d', 2.5);
  },
  pumpkin(ctx) {
    limb(ctx, [[0, -40], [4, -50]], 5, '#38a047');
    ell(ctx, -12, -22, 14, 21, '#ff8c1a'); ell(ctx, 12, -22, 14, 21, '#ff8c1a'); ell(ctx, 0, -22, 15, 22, '#ffa033');
    poly(ctx, [[-10, -30], [-4, -30], [-7, -36]], '#7a3a00', 0); poly(ctx, [[4, -30], [10, -30], [7, -36]], '#7a3a00', 0);
    ctx.beginPath(); ctx.moveTo(-10, -18); ctx.quadraticCurveTo(0, -8, 10, -18); ctx.quadraticCurveTo(0, -13, -10, -18); ctx.fillStyle = '#7a3a00'; ctx.fill();
  },
  tombstone(ctx) {
    ctx.beginPath(); ctx.moveTo(-21, 0); ctx.lineTo(-21, -34); ctx.arc(0, -34, 21, Math.PI, 0); ctx.lineTo(21, 0); ctx.closePath(); fillOut(ctx, '#a3abbd');
    ctx.fillStyle = '#5a6275'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('BOO', 0, -30);
    for (let i = -2; i <= 2; i++) line(ctx, [[i * 9, 0], [i * 9 + 3, -8]], 3, '#4caf50');
  },
  mushroom(ctx) {
    rr(ctx, -9, -26, 18, 26, 6); fillOut(ctx, '#fff3dd');
    ctx.beginPath(); ctx.arc(0, -24, 27, Math.PI, 0); ctx.closePath(); fillOut(ctx, '#9b5de5');
    circ(ctx, -12, -34, 4, '#fff', 0); circ(ctx, 6, -42, 5, '#fff', 0); circ(ctx, 16, -30, 3.5, '#fff', 0);
  },
};

function drawBolt(ctx, t) {
  const b = Math.sin(t * 5) * 4;
  ctx.save(); ctx.translate(0, -36 + b);
  circ(ctx, 0, 0, 22 + Math.sin(t * 8) * 2, 'rgba(255,230,80,.35)', 0);
  poly(ctx, [[5, -19], [-11, 3], [0, 3], [-5, 19], [11, -4], [0, -4]], '#ffd60a', 3);
  ctx.restore();
}
function drawRamp(ctx, big) {
  if (big) {
    // big launch ramp: tall, striped, with a star
    poly(ctx, [[-72, 0], [72, 0], [72, -62]], '#ff4d4d');
    ctx.save(); ctx.beginPath(); ctx.moveTo(-72, 0); ctx.lineTo(72, 0); ctx.lineTo(72, -62); ctx.closePath(); ctx.clip();
    ctx.fillStyle = '#fff'; for (let i = -4; i < 8; i++) { ctx.beginPath(); ctx.moveTo(i * 24, 0); ctx.lineTo(i * 24 + 12, 0); ctx.lineTo(i * 24 + 40, -62); ctx.lineTo(i * 24 + 28, -62); ctx.fill(); }
    ctx.restore();
    poly(ctx, [[-72, 0], [72, 0], [72, -62]], null, 3.5);
    rr(ctx, 66, -62, 10, 62, 3); fillOut(ctx, '#8a94a6', 2.5);
    star(ctx, 40, -20, 9, '#ffd60a');
    return;
  }
  poly(ctx, [[-52, 0], [52, 0], [52, -30]], '#d08b4a');
  line(ctx, [[-26, -3], [26, -3]], 2, '#a86a32');
  for (let i = 0; i < 3; i++) poly(ctx, [[-18 + i * 20, -5 - i * 5], [-9 + i * 20, -8 - i * 6], [-18 + i * 20, -11 - i * 7]], '#ffd60a', 2);
}
function drawPad(ctx, t) {
  rr(ctx, -52, -10, 104, 14, 7); fillOut(ctx, 'rgba(94,242,255,.85)', 3);
  ctx.save(); rr(ctx, -50, -9, 100, 12, 6); ctx.clip();
  const o = (t * 90) % 30;
  for (let i = -2; i < 5; i++) { const x = -50 + i * 30 + o; poly(ctx, [[x, -8], [x + 10, -3], [x, 2], [x + 6, 2], [x + 16, -3], [x + 6, -8]], '#ffd60a', 0); }
  ctx.restore();
}
function drawStarPickup(ctx, t) {
  circ(ctx, 0, 0, 15 + Math.sin(t * 6) * 2, 'rgba(255,230,80,.3)', 0);
  ctx.save(); ctx.scale(Math.max(0.3, Math.abs(Math.cos(t * 3))), 1);
  star(ctx, 0, 0, 13, '#ffd60a'); ctx.restore();
}
// pictures for quiz answers that have no good emoji (drawn in a 100x100 box)
const QUIZ_DRAWINGS = {
  tire(ctx) {
    ctx.translate(50, 50);
    circ(ctx, 0, 0, 44, '#2b2b38', 4);
    ctx.fillStyle = '#4a4a5a';
    for (let i = 0; i < 16; i++) { ctx.save(); ctx.rotate(i * TAU / 16); rr(ctx, 33, -6, 13, 12, 3); fillOut(ctx, '#2b2b38', 3); ctx.restore(); }
    circ(ctx, 0, 0, 34, '#3a3a4a', 0);
    for (let i = 0; i < 16; i++) { ctx.save(); ctx.rotate(i * TAU / 16 + 0.2); line(ctx, [[22, -4], [32, 4]], 3, '#55556a'); ctx.restore(); }
    circ(ctx, 0, 0, 20, '#ff4d4d', 3);
    circ(ctx, 0, 0, 13, '#d8dee8', 2.5);
    for (let i = 0; i < 5; i++) { const a = i * TAU / 5; circ(ctx, Math.cos(a) * 8, Math.sin(a) * 8, 2, '#777', 0); }
    circ(ctx, 0, 0, 4, '#555', 1.5);
    ell(ctx, -16, -26, 8, 3, 'rgba(255,255,255,.25)', 0, -0.6);
  },
};

function drawHeartPickup(ctx, t) {
  const b = Math.sin(t * 4) * 5, s = 1 + Math.sin(t * 8) * 0.06;
  ctx.save(); ctx.translate(0, -48 + b); ctx.scale(s, s);
  circ(ctx, 0, 0, 30, 'rgba(255,90,130,.25)', 0);
  ctx.beginPath(); ctx.moveTo(0, 18);
  ctx.bezierCurveTo(-30, -2, -22, -26, 0, -12); ctx.bezierCurveTo(22, -26, 30, -2, 0, 18);
  fillOut(ctx, '#ff3d6e', 3.5);
  ell(ctx, -9, -10, 5, 3, 'rgba(255,255,255,.75)', 0, -0.5);
  ctx.restore();
  for (let i = 0; i < 3; i++) { const a = t * 3 + i * TAU / 3; star(ctx, Math.cos(a) * 34, -48 + b + Math.sin(a) * 12, 5, '#ffd60a'); }
}

// ---------- terrain you ride ON: decks (with 1 or 2 levels), rainbow bridges, bumps ----------
function terrainH(it, a) {
  if (a < 0 || a > it.len) return 0;
  if (it.k === 'hill') return it.h * Math.sin(Math.PI * a / it.len);
  if (it.k === 'bumps') return 20 * Math.abs(Math.sin(Math.PI * a / 64));
  let h = 0, base = 0;
  for (const [at, sh] of it.steps) { if (a < at) break; h = base + (sh - base) * Math.max(0, Math.min(1, (a - at) / 100)); base = sh; }
  return h;
}
function drawTerrain(ctx, it, th, t) {
  const prof = [];
  for (let a = 0; a < it.len; a += 8) prof.push([a, -terrainH(it, a)]);
  prof.push([it.len, -terrainH(it, it.len)]);
  if (it.k === 'bumps') { poly(ctx, [[0, 0], ...prof, [it.len, 0]], shade(th.pebble, -0.05), 3); return; }
  if (it.k === 'hill') {
    ctx.save(); ctx.beginPath(); ctx.rect(-10, -400, it.len + 20, 402); ctx.clip();
    for (let i = 5; i >= 0; i--) line(ctx, prof.map(([a, y]) => [a, y + 4 + i * 7]), 8, RAINBOW[i]);
    ctx.restore();
    line(ctx, prof, 3, OUT);
    line(ctx, prof.map(([a, y]) => [a, Math.min(2, y + 46)]), 3, OUT);
    return;
  }
  // deck / stairs
  for (let a = 110; a < it.len - 8; a += 110) {
    const h = terrainH(it, a);
    if (h > 20) { rr(ctx, a - 6, -h + 8, 12, h - 8, 3); fillOut(ctx, '#8a94a6', 2.5); }
  }
  const lastH = terrainH(it, it.len);
  rr(ctx, it.len - 14, -lastH + 8, 12, lastH - 8, 3); fillOut(ctx, '#8a94a6', 2.5);
  poly(ctx, [...prof, ...prof.slice().reverse().map(([a, y]) => [a, Math.min(0, y + 14)])], '#ff9f1c', 3);
  ctx.setLineDash([12, 12]);
  line(ctx, prof.map(([a, y]) => [a, y + 7]), 4, 'rgba(255,255,255,.8)');
  ctx.setLineDash([]);
}

// a springboard: "BOING!"
function drawSpring(ctx, t, sq) {
  const h = 34 - sq * 20;
  rr(ctx, -30, -7, 60, 8, 4); fillOut(ctx, '#8a94a6', 2.5);
  const pts = []; for (let i = 0; i <= 8; i++) pts.push([i % 2 ? 17 : -17, -6 - i * h / 8]);
  line(ctx, pts, 7, OUT); line(ctx, pts, 4, '#d6dbe3');
  ell(ctx, 0, -10 - h, 34, 9, '#ff4d4d', 3);
  for (let i = -1; i <= 1; i++) circ(ctx, i * 14, -12 - h, 3, '#fff', 0);
}

// a circus cannon: "BOOM!"
function drawCannon(ctx, t, fire) {
  ctx.save(); ctx.translate(-12, -30); ctx.rotate(-0.6);
  rr(ctx, -44, -20, 96, 40, 18); fillOut(ctx, '#3a3f4b', 3.5);
  rr(ctx, -14, -20, 12, 40, 3); fillOut(ctx, '#ffd60a', 2.5);
  rr(ctx, 46, -23, 14, 46, 5); fillOut(ctx, '#ff4d4d', 3);
  ctx.restore();
  wheel(ctx, -20, -16, 16, 0, '#a0673a', '#e0b47a');
  line(ctx, [[-52, -12], [-60, -2]], 2.5, OUT);
  star(ctx, -61, 0, 4 + Math.abs(Math.sin(t * 25)) * 3, '#ffd60a');
  if (fire > 0) {
    const k = 1 - fire;
    for (let i = 0; i < 4; i++) circ(ctx, 36 + k * 60 + i * 10, -62 - k * 40 - i * 6, (12 + i * 4) * (0.6 + k), `rgba(255,255,255,${0.9 * fire})`, 0);
    if (fire > 0.7) star(ctx, 40, -64, 26, '#ffb020');
  }
}
const LOOP_R = 122;
// The loop is stretched like a roller-coaster loop (a "prolate cycloid"): you keep moving
// forward the whole time you go around. d = how far forward you travel during one loop.
function loopPoint(d, th, inset = 0, r = LOOP_R) {
  const k = d / TAU, x = k * th + r * Math.sin(th), y = -r * (1 - Math.cos(th));
  const cx = k * th, cy = -r, nx = cx - x, ny = cy - y, nl = Math.hypot(nx, ny) || 1;
  return [x + nx / nl * inset, y + ny / nl * inset];
}
function loopAngle(d, th, r = LOOP_R) { return Math.atan2(-r * Math.sin(th), d / TAU + r * Math.cos(th)); }
function drawLoop(ctx, d, r, s, t) {
  const pts = [[-70 * s, 7 * s]];
  for (let th = 0; th <= TAU + 0.001; th += 0.05) pts.push(loopPoint(d, th, -7 * s, r));
  pts.push([d + 70 * s, 7 * s]);
  const a = loopPoint(d, Math.PI * 0.5, -14 * s, r), b = loopPoint(d, Math.PI * 1.5, -14 * s, r);
  limb(ctx, [a, [a[0], 4 * s]], 7 * s, '#8a94a6'); limb(ctx, [b, [b[0], 4 * s]], 7 * s, '#8a94a6');
  line(ctx, pts, 18 * s, OUT); line(ctx, pts, 12 * s, '#3a86ff');
  ctx.setLineDash([14 * s, 14 * s]); ctx.lineDashOffset = -t * 40;
  line(ctx, pts, 4 * s, '#ffd60a');
  ctx.setLineDash([]); ctx.lineDashOffset = 0;
}
function drawMud(ctx, color) {
  ell(ctx, 0, -6, 58, 13, color, 3);
  ell(ctx, -18, -9, 12, 3.5, 'rgba(255,255,255,.35)', 0);
  ell(ctx, 22, -4, 8, 2.5, 'rgba(255,255,255,.25)', 0);
}

// =============================================================
//  THEMES + SCENERY
// =============================================================
const THEMES = {
  dirt: {
    name: 'Dirt Park', emoji: '🌳', sky: ['#5fbfff', '#cdeeff'], far: 'hills', hill1: '#8fd16a', hill2: '#6bbf4a', ground: '#55a63c',
    track: '#c98f55', pebble: '#a8733f', curb: ['#ff4d4d', '#ffffff'], decor: 'tree',
    obstacles: ['rock', 'log', 'hay', 'cone'], mud: '#6b4226',
  },
  beach: {
    name: 'Sunny Beach', emoji: '🏖️', sky: ['#3fb8ff', '#c4f1ff'], far: 'ocean', hill1: '#3fb6e8', hill2: '#f5dc9a', ground: '#f2d58c',
    track: '#f7e6b0', pebble: '#e4cc8a', curb: ['#3a86ff', '#ffffff'], decor: 'palm',
    obstacles: ['sandcastle', 'crab', 'beachball', 'rock'], mud: '#4aa3df',
  },
  snow: {
    name: 'Snowy Mountain', emoji: '⛄', sky: ['#8fbfff', '#eaf4ff'], far: 'mountains', hill1: '#b7c9e6', hill2: '#e6eefa', ground: '#ffffff',
    track: '#dbe7f5', pebble: '#bccde2', curb: ['#3a86ff', '#ffffff'], decor: 'pine', snowfall: true,
    obstacles: ['snowman', 'iceblock', 'snowlog'], mud: '#8aa6c2',
  },
  candy: {
    name: 'Candy Land', emoji: '🍭', sky: ['#ff9fd6', '#ffe8f6'], far: 'hills', hill1: '#ffb3dd', hill2: '#c79bff', ground: '#8fe0a8',
    track: '#f6c79a', pebble: '#ff7aa2', curb: ['#ff5fa2', '#ffffff'], decor: 'candy', sprinkles: true,
    obstacles: ['gumdrop', 'lollipop', 'cupcake'], mud: '#7a4a2a',
  },
  spooky: {
    name: 'Spooky Forest', emoji: '🎃', sky: ['#2e2060', '#8a5fb8'], far: 'hills', hill1: '#4b3a7a', hill2: '#3b2d61', ground: '#3d5a3a',
    track: '#8a7a68', pebble: '#6f6150', curb: ['#ff8c1a', '#2b1d3a'], decor: 'spooky', night: true,
    obstacles: ['pumpkin', 'tombstone', 'mushroom'], mud: '#6be36b',
  },
};

const TRACK_TOP = 300, TRACK_BOT = 510;
const LANE_GROUND = [358, 428, 498];   // where things in each lane sit
const LANE_SCALE = [0.86, 0.93, 1.0];
function laneGround(f) { const i = Math.max(0, Math.min(1.999, f)), a = Math.floor(i), k = i - a; return LANE_GROUND[a] + (LANE_GROUND[a + 1] - LANE_GROUND[a]) * k; }
function laneScale(f) { const i = Math.max(0, Math.min(1.999, f)), a = Math.floor(i), k = i - a; return LANE_SCALE[a] + (LANE_SCALE[a + 1] - LANE_SCALE[a]) * k; }

function hillLayer(ctx, W, off, baseY, amp, wl, color) {
  ctx.beginPath(); ctx.moveTo(0, TRACK_TOP);
  for (let x = 0; x <= W + 12; x += 12) {
    const wx = x + off;
    ctx.lineTo(x, baseY - (Math.sin(wx / wl) * amp + Math.sin(wx / (wl * 0.43) + 1.3) * amp * 0.45));
  }
  ctx.lineTo(W + 12, TRACK_TOP); ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = shade(color, -0.18); ctx.stroke();
}

function drawDecor(ctx, type, x, y, s, v, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (type === 'tree') {
    rr(ctx, -6, -40, 12, 40, 4); fillOut(ctx, '#8a5a32');
    const g = v > 0.5 ? '#3fae4a' : '#56c45a';
    circ(ctx, -16, -52, 20, g); circ(ctx, 16, -54, 20, g); circ(ctx, 0, -72, 24, g);
    if (v > 0.7) { circ(ctx, -8, -66, 4, '#ff4d4d', 2); circ(ctx, 12, -56, 4, '#ff4d4d', 2); }
  } else if (type === 'palm') {
    ctx.beginPath(); ctx.moveTo(-5, 0); ctx.quadraticCurveTo(-2, -50, 14, -90); ctx.lineTo(22, -88); ctx.quadraticCurveTo(8, -50, 7, 0); ctx.closePath(); fillOut(ctx, '#b07a45');
    const sw = Math.sin(t * 2 + v * 6) * 0.08;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.62 + sw;
      ctx.save(); ctx.translate(18, -90); ctx.rotate(a);
      ell(ctx, 26, 0, 28, 8, '#3fae4a', 2.5); ctx.restore();
    }
    circ(ctx, 14, -84, 5, '#7a4f28', 2); circ(ctx, 22, -82, 5, '#7a4f28', 2);
  } else if (type === 'pine') {
    rr(ctx, -5, -16, 10, 16, 3); fillOut(ctx, '#7a4f28');
    for (let i = 0; i < 3; i++) {
      const y0 = -12 - i * 24, w = 32 - i * 8;
      poly(ctx, [[-w, y0], [w, y0], [0, y0 - 38]], '#2f8f5a');
      poly(ctx, [[-w * 0.45, y0 - 21], [w * 0.45, y0 - 21], [0, y0 - 38]], '#fff', 0);
    }
  } else if (type === 'candy') {
    if (v > 0.5) {
      limb(ctx, [[0, 0], [0, -60]], 5, '#fff');
      circ(ctx, 0, -78, 24, ['#ff5fa2', '#9b5de5', '#3a86ff'][Math.floor(v * 30) % 3]);
      ctx.beginPath(); for (let a = 0; a < TAU * 2.4; a += 0.25) ctx.lineTo(Math.cos(a) * a * 1.5, -78 + Math.sin(a) * a * 1.5);
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -70); ctx.arc(14, -70, 14, Math.PI, 0);
      ctx.lineCap = 'round'; ctx.lineWidth = 14; ctx.strokeStyle = OUT; ctx.stroke();
      ctx.lineWidth = 9; ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.setLineDash([7, 7]); ctx.strokeStyle = '#ff4d4d'; ctx.stroke(); ctx.setLineDash([]);
    }
  } else if (type === 'spooky') {
    ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-4, -60); ctx.lineTo(-24, -86); ctx.lineTo(-18, -90); ctx.lineTo(0, -70);
    ctx.lineTo(4, -100); ctx.lineTo(10, -98); ctx.lineTo(8, -66); ctx.lineTo(26, -80); ctx.lineTo(30, -74); ctx.lineTo(8, -54); ctx.lineTo(8, 0); ctx.closePath();
    fillOut(ctx, '#4a3a5a');
    if (v > 0.6) { circ(ctx, -2, -44, 4, '#ffd60a', 0); circ(ctx, 5, -44, 4, '#ffd60a', 0); }
  }
  ctx.restore();
}

// draws the whole background + empty track. ext = extra space above/below to fill.
function drawScene(ctx, th, W, camX, t, ext = 0) {
  const g = ctx.createLinearGradient(0, -ext, 0, TRACK_TOP);
  g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]);
  ctx.fillStyle = g; ctx.fillRect(0, -ext, W, TRACK_TOP + ext);

  if (th.night) {
    for (let i = 0; i < 40; i++) {
      const x = ((rand01(i) * W * 1.3 - camX * 0.02) % W + W) % W, y = rand01(i + 50) * 200 - ext * rand01(i + 9);
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 3 + i);
      star(ctx, x, y, 2 + rand01(i + 3) * 2.5, '#fff6c9'); ctx.globalAlpha = 1;
    }
    circ(ctx, W * 0.8, 80, 34, '#fff6c9', 0);
    circ(ctx, W * 0.8 - 10, 72, 6, '#eee2a8', 0); circ(ctx, W * 0.8 + 12, 90, 4, '#eee2a8', 0);
  } else {
    ctx.save(); ctx.translate(W * 0.82, 78); ctx.rotate(t * 0.3);
    ctx.fillStyle = 'rgba(255,230,100,.35)';
    for (let i = 0; i < 10; i++) { ctx.rotate(TAU / 10); ctx.beginPath(); ctx.moveTo(40, -6); ctx.lineTo(62, 0); ctx.lineTo(40, 6); ctx.fill(); }
    ctx.restore();
    circ(ctx, W * 0.82, 78, 34, '#ffe066', 0);
  }

  // clouds
  const cloudC = th.night ? 'rgba(200,180,255,.25)' : (th.sprinkles ? '#fff0fa' : 'rgba(255,255,255,.92)');
  for (let i = 0; i < 6; i++) {
    const span = W + 300, x = ((i * 260 - camX * 0.05 - t * 8) % span + span) % span - 150, y = 40 + rand01(i) * 110;
    ctx.fillStyle = cloudC; ctx.beginPath();
    ctx.arc(x, y, 22, 0, TAU); ctx.arc(x + 26, y - 10, 28, 0, TAU); ctx.arc(x + 56, y, 22, 0, TAU); ctx.rect(x, y, 56, 22); ctx.fill();
  }

  // far layer
  if (th.far === 'mountains') {
    const per = 260, off = camX * 0.1;
    ctx.beginPath(); ctx.moveTo(0, TRACK_TOP);
    const k0 = Math.floor(off / per) - 1, k1 = k0 + Math.ceil(W / per) + 3;
    for (let k = k0; k <= k1; k++) {
      const h = 120 + rand01(k) * 70, x = k * per - off;
      ctx.lineTo(x, 250); ctx.lineTo(x + per / 2, 250 - h);
    }
    ctx.lineTo(W, 250); ctx.lineTo(W, TRACK_TOP); ctx.closePath();
    ctx.fillStyle = th.hill1; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = shade(th.hill1, -0.2); ctx.stroke();
    for (let k = k0; k <= k1; k++) {
      const h = 120 + rand01(k) * 70, px = k * per - off + per / 2, py = 250 - h, d = h * 0.3, wd = per / 2 * 0.3;
      poly(ctx, [[px, py], [px + wd, py + d], [px + wd * 0.4, py + d * 0.8], [px, py + d], [px - wd * 0.4, py + d * 0.8], [px - wd, py + d]], '#fff', 0);
    }
  } else if (th.far === 'ocean') {
    ctx.fillStyle = th.hill1; ctx.fillRect(0, 210, W, 90);
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3;
    for (let r = 0; r < 3; r++) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 10) ctx.lineTo(x, 225 + r * 22 + Math.sin((x + camX * 0.1 * (r + 1)) / 30 + t * 2 + r) * 3);
      ctx.stroke();
    }
    // a little sailboat far away
    const bx = ((W * 0.3 - camX * 0.08) % (W + 60) + W + 60) % (W + 60) - 30;
    poly(ctx, [[bx - 16, 216], [bx + 20, 216], [bx + 14, 224], [bx - 10, 224]], '#ff4d4d', 2);
    poly(ctx, [[bx, 214], [bx, 182], [bx + 16, 214]], '#fff', 2);
  } else {
    hillLayer(ctx, W, camX * 0.12, 225, 24, 170, th.hill1);
  }
  hillLayer(ctx, W, camX * 0.25, 268, 14, 110, th.hill2);

  // decor
  const sp = 200, off = camX * 0.5;
  const k0 = Math.floor(off / sp) - 1, k1 = k0 + Math.ceil(W / sp) + 2;
  for (let k = k0; k <= k1; k++) {
    const v = rand01(k * 7 + 3);
    drawDecor(ctx, th.decor, k * sp - off + v * 80, TRACK_TOP - 4, 0.75 + rand01(k + 11) * 0.45, v, t);
  }

  // track
  ctx.fillStyle = th.ground; ctx.fillRect(0, TRACK_TOP - 8, W, 10);
  ctx.fillStyle = th.track; ctx.fillRect(0, TRACK_TOP, W, TRACK_BOT - TRACK_TOP);
  ctx.fillStyle = th.pebble;
  const pk0 = Math.floor(camX / 37);
  for (let k = pk0; k < pk0 + W / 37 + 2; k++) {
    ctx.beginPath(); ctx.ellipse(k * 37 - camX + rand01(k) * 20, TRACK_TOP + 14 + rand01(k + 5) * 180, 4 + rand01(k + 2) * 4, 2.2, 0, 0, TAU); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,.65)'; ctx.lineWidth = 4; ctx.setLineDash([40, 30]); ctx.lineDashOffset = camX % 70;
  for (const y of [370, 440]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.setLineDash([]); ctx.lineDashOffset = 0;
  const cw = 34, ck0 = Math.floor(camX / cw);
  for (let k = ck0; k < ck0 + W / cw + 2; k++) {
    ctx.fillStyle = th.curb[((k % 2) + 2) % 2];
    ctx.fillRect(k * cw - camX, TRACK_TOP - 4, cw, 9);
    ctx.fillRect(k * cw - camX, TRACK_BOT - 5, cw, 10);
  }
  line(ctx, [[0, TRACK_TOP - 4], [W, TRACK_TOP - 4]], 2.5, OUT);
  line(ctx, [[0, TRACK_BOT + 5], [W, TRACK_BOT + 5]], 2.5, OUT);

  ctx.fillStyle = th.ground; ctx.fillRect(0, TRACK_BOT + 6, W, 540 - TRACK_BOT + ext);
  ctx.strokeStyle = shade(th.ground, -0.2); ctx.lineWidth = 3;
  const gk0 = Math.floor(camX / 53);
  for (let k = gk0; k < gk0 + W / 53 + 2; k++) {
    const x = k * 53 - camX + rand01(k + 40) * 30, y = 528 + rand01(k + 41) * 8;
    ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x - 7, y - 9); ctx.moveTo(x, y); ctx.lineTo(x, y - 12); ctx.moveTo(x + 5, y); ctx.lineTo(x + 8, y - 9); ctx.stroke();
  }
}

// things that float in front of everything (snow, sprinkles, fireflies)
function drawWeather(ctx, th, W, camX, t, ext = 0) {
  if (th.snowfall) {
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    for (let i = 0; i < 60; i++) {
      const sp = W + 40, x = ((rand01(i) * sp - camX * 0.7 * (0.5 + rand01(i + 1)) + Math.sin(t + i) * 20) % sp + sp) % sp - 20;
      const h = 540 + ext * 2, y = ((rand01(i + 7) * h + t * 50 * (0.6 + rand01(i + 2))) % h) - ext;
      ctx.beginPath(); ctx.arc(x, y, 2 + rand01(i + 3) * 2.5, 0, TAU); ctx.fill();
    }
  } else if (th.night) {
    for (let i = 0; i < 14; i++) {
      const x = ((rand01(i) * W + Math.sin(t * 0.7 + i) * 40 - camX * 0.3) % W + W) % W, y = 120 + rand01(i + 3) * 180 + Math.cos(t + i * 2) * 15;
      ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i));
      circ(ctx, x, y, 3, '#fff27a', 0); ctx.globalAlpha = 1;
    }
  }
}

function drawFinishLine(ctx, x, t) {
  const sq = 15;
  for (let r = 0; r < Math.ceil((TRACK_BOT - TRACK_TOP) / sq); r++)
    for (let c = 0; c < 3; c++) {
      ctx.fillStyle = (r + c) % 2 ? '#fff' : '#222';
      ctx.fillRect(x + c * sq, TRACK_TOP + r * sq, sq, Math.min(sq, TRACK_BOT - TRACK_TOP - r * sq));
    }
  // banner
  limb(ctx, [[x - 40, TRACK_TOP], [x - 40, TRACK_TOP - 150]], 6, '#ddd');
  limb(ctx, [[x + 80, TRACK_TOP], [x + 80, TRACK_TOP - 150]], 6, '#ddd');
  const wv = Math.sin(t * 4) * 3;
  rr(ctx, x - 50, TRACK_TOP - 168 + wv, 140, 44, 10); fillOut(ctx, '#ff4d4d', 4);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 28px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('FINISH', x + 20, TRACK_TOP - 145 + wv);
}
