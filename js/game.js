// =============================================================
//  game.js — screens, customizer, quiz flow, the race, controls
// =============================================================
'use strict';

const $ = id => document.getElementById(id);
const canvas = $('game'), ctx = canvas.getContext('2d');

// ---------- the 5 tracks (each a little harder) ----------
//  length = how far to the finish, speed = how fast you go,
//  gap = space between things on the track, dbl = chance of 2 obstacles side by side.
//  The rest are the chances of each kind of thing showing up (whatever is left over = obstacles).
//  big = how many ramps are BIG launch ramps (room for flips).
const LEVELS = [
  { theme: 'dirt', length: 9000, speed: 250, gap: [620, 800], dbl: 0.0, ramp: 0.14, big: 0.35, spring: 0.05, cannon: 0.03, deck: 0.05, stairs: 0.0, hill: 0.05, bumps: 0.06, loop: 0.04, mud: 0.08, rival: 0.07, boost: 0.06, pad: 0.06 },
  { theme: 'beach', length: 10500, speed: 270, gap: [580, 760], dbl: 0.12, ramp: 0.13, big: 0.45, spring: 0.05, cannon: 0.04, deck: 0.04, stairs: 0.02, hill: 0.05, bumps: 0.06, loop: 0.05, mud: 0.09, rival: 0.08, boost: 0.05, pad: 0.06 },
  { theme: 'snow', length: 12000, speed: 290, gap: [540, 720], dbl: 0.22, ramp: 0.13, big: 0.50, spring: 0.05, cannon: 0.04, deck: 0.03, stairs: 0.03, hill: 0.05, bumps: 0.06, loop: 0.05, mud: 0.09, rival: 0.08, boost: 0.05, pad: 0.06 },
  { theme: 'candy', length: 13500, speed: 310, gap: [510, 690], dbl: 0.32, ramp: 0.12, big: 0.55, spring: 0.06, cannon: 0.04, deck: 0.03, stairs: 0.03, hill: 0.06, bumps: 0.06, loop: 0.05, mud: 0.09, rival: 0.09, boost: 0.04, pad: 0.06 },
  { theme: 'spooky', length: 15000, speed: 330, gap: [490, 660], dbl: 0.42, ramp: 0.12, big: 0.60, spring: 0.05, cannon: 0.05, deck: 0.02, stairs: 0.04, hill: 0.05, bumps: 0.06, loop: 0.06, mud: 0.09, rival: 0.09, boost: 0.04, pad: 0.05 },
];
// every kind of jump: how long you are in the air and how high you go
const JUMPS = {
  small: { dur: 0.75, h: 75 }, big: { dur: 1.3, h: 155 }, spring: { dur: 1.15, h: 215 }, cannon: { dur: 2.0, h: 320 },
  hop: { dur: 1.0, h: 100 },
};
const STARS_PER_HEART = 10;
const FLIP_TIME = 0.45, LEAD_MAX = 100;

const G = {
  W: 900, scale: 1, offY: 0, dpr: 1, time: 0,
  screen: 'title', mode: 'menu', demoX: 0, demoTheme: 'dirt',
  cfg: {
    hair: 'mohawk', hairColor: 'rainbow', skin: SKINS[1], face: 'grin',
    shirtStyle: 'tee', shirt: '#3a86ff', pants: '#3a3a4a',
    hat: 'none', glasses: 'goggles', back: 'none',
    vehicle: 'dirtbike', vColor: '#ff4d4d', monster: 'mohawk',
  },
  tab: 'hair', levelIdx: 0, race: null, quiz: null, beaten: new Set(),
};

function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// =============================================================
//  SIZING
// =============================================================
function resize() {
  const w = Math.max(1, innerWidth), h = Math.max(1, innerHeight), dpr = Math.min(window.devicePixelRatio || 1, 2);
  G.dpr = dpr;
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  G.scale = Math.min(h / 540, w / 900);
  G.W = w / G.scale;
  G.offY = (h / G.scale - 540) / 2;
  sizePreview();
}
addEventListener('resize', resize);
addEventListener('orientationchange', () => setTimeout(resize, 200));

// =============================================================
//  SCREENS
// =============================================================
const SCREENS = ['title', 'custom', 'levels', 'quiz', 'pause', 'result'];
function show(name) {
  for (const s of SCREENS) $(s).classList.toggle('hidden', s !== name);
  G.screen = name;
}
function setHud(on) {
  $('hud').classList.toggle('hidden', !on);
  document.body.classList.toggle('racing', on);
}
function click() { AudioMgr.play('pop', 0.7); }

function goTitle() {
  Speech.stop(); setHud(false); G.mode = 'menu'; G.race = null; G.demoTheme = 'dirt';
  AudioMgr.engineStop(); AudioMgr.playMusic('music_menu');
  show('title');
}
function goCustom() {
  Speech.stop(); setHud(false); G.mode = 'menu'; G.race = null; G.demoTheme = 'dirt';
  AudioMgr.engineStop(); AudioMgr.playMusic('music_menu');
  show('custom'); buildTabs(); renderOptions(); sizePreview();
}
function goLevels() {
  Speech.stop(); G.mode = 'menu'; G.race = null;
  show('levels'); buildLevels();
}
function startRun(idx) {
  G.levelIdx = idx; G.mode = 'menu'; G.race = null; G.demoTheme = LEVELS[idx].theme;
  setHud(false); AudioMgr.engineStop(); AudioMgr.playMusic('music_menu');
  askQuiz('pre', () => beginRace(idx));
}
function beginRace(idx) {
  Speech.stop();
  G.race = newRace(idx); G.mode = 'race';
  show(null); setHud(true); updateHearts();
  drawHudIcons();
  AudioMgr.playMusic('music_race', true, true);
  if (document.activeElement) document.activeElement.blur();
  const hint = $('keyHint'); hint.classList.remove('hidden');
  clearTimeout(G.hintTimer); G.hintTimer = setTimeout(() => hint.classList.add('hidden'), 6000);
}
function endRun(win) {
  setHud(false); AudioMgr.engineStop();
  askQuiz('post', () => showResult(win));
}
function showResult(win) {
  const idx = G.levelIdx, last = idx === LEVELS.length - 1, name = THEMES[LEVELS[idx].theme].name;
  show('result');
  AudioMgr.playMusic('music_menu');
  const title = win ? (last ? 'You beat ALL the tracks!' : 'You beat the monster!') : 'The monster got you!';
  $('resultEmoji').textContent = win ? (last ? '🏆' : '⭐') : '👾';
  $('resultTitle').textContent = title;
  const stars = G.race ? G.race.stars : 0;
  $('resultText').textContent = (win ? `${name} is done!` : 'Try again — you can do it!') + `  You got ${stars} ⭐`;
  const box = $('resultBtns'); box.innerHTML = '';
  const btn = (label, cls, fn, aria) => {
    const b = document.createElement('button'); b.className = 'big-btn ' + cls; b.textContent = label;
    if (aria) b.setAttribute('aria-label', aria);
    b.onclick = () => { click(); fn(); }; box.appendChild(b);
  };
  if (win && !last) btn('Next ▶', 'go', () => startRun(idx + 1));
  btn(win ? '🔁' : '🔁 Try again', win ? '' : 'go', () => startRun(idx), 'Play again');
  btn('🎨', '', goCustom, 'Change racer');
  btn('🏠', '', goTitle, 'Home');
  if (win && last) Speech.say('win_all', 'Wow! You beat all the tracks! You are a champion!');
  else if (win) Speech.say('win', 'You beat the monster! Great job!');
  else Speech.say('lose', 'Oh no! The monster got you! Try again!');
}

// =============================================================
//  CUSTOMIZER
// =============================================================
const TABS = [
  { id: 'hair', icon: '💇', groups: [['hair', HAIR_SHORT, 'head', '💇‍♂️'], ['hair', HAIR_LONG, 'head', '💇‍♀️'], ['hairColor', HAIR_COLORS, 'color', '🎨']] },
  { id: 'face', icon: '🙂', groups: [['face', FACES, 'head', '😀'], ['skin', SKINS, 'color', '✋']] },
  { id: 'clothes', icon: '👕', groups: [['shirtStyle', SHIRTS, 'body', '👕'], ['shirt', COLORS, 'color', '🎨'], ['pants', COLORS, 'color', '👖']] },
  { id: 'extras', icon: '🎩', groups: [['hat', HATS, 'head', '🧢'], ['glasses', GLASSES, 'head', '🕶️'], ['back', BACKS, 'body', '🦸']] },
  { id: 'ride', icon: '🏍️', groups: [['vehicle', VEHICLE_TYPES, 'rig', '🛴'], ['vColor', COLORS, 'color', '🎨']] },
  { id: 'monster', icon: '👾', groups: [['monster', MONSTER_TYPES, 'monster', '👾']] },
];

function buildTabs() {
  const box = $('tabs'); box.innerHTML = '';
  for (const t of TABS) {
    const b = document.createElement('button'); b.className = 'tab'; b.textContent = t.icon; b.dataset.id = t.id;
    b.setAttribute('aria-label', t.id);
    b.onclick = () => {
      G.tab = t.id; click(); renderOptions(); $('options').scrollTop = 0;
      if (t.id === 'monster') Speech.say('who_chase', 'Who will chase you?');
    };
    box.appendChild(b);
  }
}

function thumb(key, val, kind) {
  const c = document.createElement('canvas'), S = 72, d = Math.min(2, G.dpr || 1);
  c.width = S * d; c.height = S * d;
  const x = c.getContext('2d'); x.scale(d, d);
  const cfg = Object.assign({}, G.cfg, { [key]: val });
  if (kind === 'head') { x.translate(33, 47); x.scale(1.1, 1.1); drawHead(x, cfg, 0, 0, 0); }
  else if (kind === 'body') { x.translate(38, 68); x.scale(0.52, 0.52); drawRider(x, cfg, VEHICLES._stand, 0); }
  else if (kind === 'rig') {
    const vd = VEHICLES[val], s = Math.min(0.5, 60 / vd.h, 64 / (vd.w + 30));
    x.translate(36, 66); x.scale(s, s); drawRig(x, cfg, 0, 0);
  } else if (kind === 'monster') { x.translate(40, 68); x.scale(0.27, 0.27); drawMonster(x, val, 0.3, 'chase'); }
  return c;
}

function renderOptions() {
  for (const b of $('tabs').children) b.classList.toggle('active', b.dataset.id === G.tab);
  const box = $('options'), keep = box.scrollTop; box.innerHTML = '';
  const tab = TABS.find(t => t.id === G.tab);
  for (const [key, list, kind, icon] of tab.groups) {
    const g = document.createElement('div'); g.className = 'group';
    const lab = document.createElement('div'); lab.className = 'group-label'; lab.textContent = icon;
    const row = document.createElement('div'); row.className = 'opt-row';
    for (const val of list) {
      const b = document.createElement('button'), sel = G.cfg[key] === val;
      const label = NAMES[(key === 'monster' ? 'm_' : '') + val] || 'color';
      if (kind === 'color') {
        b.className = 'swatch' + (sel ? ' sel' : '') + (val === 'rainbow' ? ' rainbow' : '');
        if (val !== 'rainbow') b.style.background = val;
      } else {
        b.className = 'opt' + (sel ? ' sel' : '');
        b.appendChild(thumb(key, val, kind));
      }
      b.setAttribute('aria-label', label);
      b.onclick = () => {
        G.cfg[key] = val; click(); renderOptions();
        if (kind !== 'color') Speech.say('n_' + (key === 'monster' ? 'm_' : '') + val, label);
        if (key === 'monster') AudioMgr.play('mon_' + val, 0.6);
      };
      row.appendChild(b);
    }
    g.append(lab, row); box.appendChild(g);
  }
  box.scrollTop = keep;
}

const pv = $('preview'), pctx = pv.getContext('2d');
function sizePreview() {
  const r = pv.getBoundingClientRect();
  if (!r.width) return;
  pv.width = Math.round(r.width * G.dpr); pv.height = Math.round(r.height * G.dpr);
}
function renderPreview() {
  const w = pv.width / G.dpr, h = pv.height / G.dpr;
  if (!w || !h) return;
  pctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0); pctx.clearRect(0, 0, w, h);
  const gy = h * 0.86;
  if (G.tab === 'monster') {
    const s = Math.min(1.1, (h - 24) / 250, w / 300);
    pctx.translate(w / 2 - 10 * s, gy); pctx.scale(s, s);
    drawMonster(pctx, G.cfg.monster, G.time, 'chase');
    return;
  }
  const vd = VEHICLES[G.cfg.vehicle];
  const s = Math.min(1.8, (gy - 16) / (vd.h + 20), (w - 30) / (vd.w + 80));
  ell(pctx, w / 2, gy, 52 * s, 8 * s, 'rgba(0,0,0,.18)', 0);
  pctx.translate(w / 2, gy + Math.sin(G.time * 6) * 1.2); pctx.scale(s, s);
  drawRig(pctx, G.cfg, G.time, G.time * 5);
}

$('btnRandom').onclick = () => {
  const m = G.cfg.monster;
  G.cfg = randomCfg(); if (G.tab !== 'monster') G.cfg.monster = m;
  AudioMgr.play('rev', 0.5); renderOptions();
};

// =============================================================
//  LEVEL SELECT
// =============================================================
function buildLevels() {
  const box = $('levelGrid'); box.innerHTML = '';
  LEVELS.forEach((L, i) => {
    const th = THEMES[L.theme];
    const b = document.createElement('button'); b.className = 'level-card' + (G.beaten.has(i) ? ' done' : '');
    const c = document.createElement('canvas'); c.width = 360; c.height = 168;
    const x = c.getContext('2d'); x.scale(0.4, 0.4); x.translate(0, -120);
    drawScene(x, th, 900, i * 700 + 300, 1.5);
    th.obstacles.slice(0, 3).forEach((o, k) => {
      x.save(); x.translate(260 + k * 210, LANE_GROUND[k]); x.scale(LANE_SCALE[k], LANE_SCALE[k]); OBSTACLES[o](x, 0, k); x.restore();
    });
    x.save(); x.translate(560, LANE_GROUND[1]); x.scale(0.93, 0.93); drawRig(x, G.cfg, 0, 0); x.restore();
    const num = document.createElement('div'); num.className = 'level-num'; num.textContent = i + 1;
    const name = document.createElement('div'); name.textContent = th.emoji + ' ' + th.name;
    b.append(num, c, name);
    b.setAttribute('aria-label', 'Track ' + (i + 1) + ': ' + th.name);
    b.onclick = () => { click(); startRun(i); };
    box.appendChild(b);
  });
}

// =============================================================
//  QUIZ
// =============================================================
function askQuiz(kind, done) {
  const q = Quiz.next(), idx = QUESTIONS.indexOf(q), r = idx % 3;
  // answers are shown in the same order the racer voice reads them
  const answers = [0, 1, 2].map(k => { const i = (k + r) % 3; return { pic: q.a[i][0], lbl: q.a[i][1], right: i === 0 }; });
  G.quiz = { q, idx, kind, done, answers, solved: false };
  show('quiz');
  $('quizBadge').textContent = kind === 'pre' ? '⭐ Quiz before the race!' : '⭐ Quiz after the race!';
  $('quizQ').textContent = q.q;
  const box = $('quizAnswers'); box.innerHTML = '';
  for (const a of answers) {
    const b = document.createElement('button'); b.className = 'ans';
    const pic = document.createElement('span'); pic.className = 'pic' + (/^\d+$/.test(a.pic) ? ' num' : '');
    if (a.pic.startsWith('draw:') && QUIZ_DRAWINGS[a.pic.slice(5)]) {
      const c = document.createElement('canvas'); c.className = 'pic-canvas'; c.width = c.height = 200;
      const x = c.getContext('2d'); x.scale(2, 2); QUIZ_DRAWINGS[a.pic.slice(5)](x);
      pic.appendChild(c);
    } else pic.textContent = a.pic;
    const lbl = document.createElement('span'); lbl.className = 'lbl'; lbl.textContent = a.lbl;
    b.append(pic, lbl);
    b.onclick = () => answerQuiz(b, a);
    box.appendChild(b);
  }
  $('quizFact').classList.add('hidden');
  const nb = $('btnQuizNext'); nb.classList.add('hidden');
  nb.textContent = kind === 'pre' ? "Let's race! 🏁" : 'Next ▶';
  speakQuestion(false);
}
function speakQuestion(force) {
  const Q = G.quiz; if (!Q) return;
  if (Q.solved) { Speech.say('f' + Q.idx, `Yes! ${Q.q.fact}`, force); return; }
  const o = Q.answers.map(a => a.lbl);
  Speech.say('q' + Q.idx, `${Q.q.q} ${o[0]}, ${o[1]}, or ${o[2]}?`, force);
}
function answerQuiz(btn, a) {
  const Q = G.quiz; if (!Q || Q.solved) return;
  if (a.right) {
    Q.solved = true;
    btn.classList.add('right');
    for (const c of $('quizAnswers').children) c.classList.add('locked');
    AudioMgr.play('tada', 0.6);
    const f = $('quizFact'); f.textContent = '🎉 ' + Q.q.fact; f.classList.remove('hidden');
    $('btnQuizNext').classList.remove('hidden');
    Speech.say('f' + Q.idx, `Yes! ${a.lbl}! ${Q.q.fact}`);
  } else {
    btn.classList.add('wrong');
    AudioMgr.play('pop', 0.5);
    Speech.say('try_again', 'Hmm, not that one. Try again!');
  }
}
function finishQuiz() {
  const Q = G.quiz; if (!Q) return;
  G.quiz = null; Speech.stop(); click(); Q.done();
}
$('btnQuizNext').onclick = finishQuiz;
$('btnSpeak').onclick = () => speakQuestion(true);

// =============================================================
//  THE RACE
// =============================================================
const LAUNCHERS = ['ramp', 'spring', 'cannon'];
const TERRAIN = ['deck', 'hill', 'bumps'];
function jumpKind(it) { return it.k === 'ramp' ? (it.big ? 'big' : 'small') : it.k; }

function addAirStars(items, x, lane, kind, speed) {
  const J = JUMPS[kind], n = kind === 'cannon' ? 6 : 4;
  for (let k = 1; k <= n; k++) {
    const p = k / (n + 1);
    items.push({ k: 'star', x: x - 25 + p * speed * J.dur, lane, h: Math.sin(Math.PI * p) * J.h });
  }
}

function genLevel(L, th) {
  const items = [];
  let x = 950, blockLane = -1, blockUntil = 0;
  while (x < L.length - 900) {
    const free = [0, 1, 2].filter(l => !(l === blockLane && x < blockUntil));
    const lane = pick(free), canBlock = x >= blockUntil;
    const r = Math.random();
    let acc = 0, extra = 0; const is = p => (acc += p, r < acc);
    const block = len => { blockLane = lane; blockUntil = x + len; };
    if (is(L.ramp)) {
      const big = Math.random() < L.big;
      items.push({ k: 'ramp', x, lane, big });
      addAirStars(items, x, lane, big ? 'big' : 'small', L.speed); extra = big ? 120 : 0;
    } else if (is(L.spring)) {
      items.push({ k: 'spring', x, lane, sq: 0 }); addAirStars(items, x, lane, 'spring', L.speed); extra = 220;
    } else if (is(L.cannon)) {
      items.push({ k: 'cannon', x, lane, fire: 0 }); addAirStars(items, x, lane, 'cannon', L.speed); extra = 520;
    } else if (canBlock && is(L.deck)) {
      const len = 520 + Math.random() * 300;
      items.push({ k: 'deck', x, lane, len, steps: [[0, 60]] });
      for (let s = x + 170; s < x + len - 40; s += 70) items.push({ k: 'star', x: s, lane, h: 60 });
      block(len + 160);
    } else if (canBlock && is(L.stairs)) {
      const len = 760 + Math.random() * 200, mid = Math.round(len * 0.45);
      items.push({ k: 'deck', x, lane, len, steps: [[0, 55], [mid, 120]] });
      for (let s = x + 150; s < x + len - 40; s += 70) items.push({ k: 'star', x: s, lane, h: s - x < mid + 100 ? 55 : 120 });
      block(len + 180);
    } else if (canBlock && is(L.hill)) {
      const len = 360 + Math.random() * 80, it = { k: 'hill', x, lane, len, h: 95 };
      items.push(it);
      for (let k = 1; k <= 4; k++) { const a = len * k / 5; items.push({ k: 'star', x: x + a, lane, h: terrainH(it, a) }); }
      block(len + 120);
    } else if (canBlock && is(L.bumps)) {
      items.push({ k: 'bumps', x, lane, len: 256 });
      for (let k = 0; k < 4; k++) items.push({ k: 'star', x: x + 32 + k * 64, lane, h: 20 });
      block(256 + 120);
    } else if (is(L.loop)) {
      const d = Math.round(L.speed * 1.4); items.push({ k: 'loop', x, lane, got: 0, d }); extra = d + 60;
    } else if (is(L.mud)) items.push({ k: 'mud', x, lane });
    else if (canBlock && is(L.rival)) {
      items.push({ k: 'rival', x, lane, cfg: randomCfg(), spd: L.speed * 0.5, t: Math.random() * 9, spin: 0, wob: 0 });
      block(1800);
    } else if (is(L.boost)) items.push({ k: 'boost', x, lane });
    else if (is(L.pad)) items.push({ k: 'pad', x, lane });
    else {
      const n = (free.length === 3 && Math.random() < L.dbl) ? 2 : 1;
      const lanes = shuffle(free.slice()).slice(0, n);
      for (const l of lanes) items.push({ k: 'obs', x, lane: l, type: pick(th.obstacles), v: Math.floor(Math.random() * 4) });
      const open = free.filter(l => !lanes.includes(l));
      if (open.length && Math.random() < 0.3) items.push({ k: 'boost', x, lane: pick(open) });
    }
    const g = L.gap[0] + Math.random() * (L.gap[1] - L.gap[0]) + extra;
    // a trail of stars between rows
    if (Math.random() < 0.7) {
      const sl = pick([0, 1, 2].filter(l => !(l === blockLane && x + g / 2 < blockUntil)));
      const n = 3 + Math.floor(Math.random() * 3), sx = x + g / 2 - (n - 1) * 22;
      for (let k = 0; k < n; k++) items.push({ k: 'star', x: sx + k * 44, lane: sl, h: 0 });
    }
    x += g;
  }
  return items;
}

function newRace(idx) {
  const L = LEVELS[idx], th = THEMES[L.theme];
  return {
    idx, L, th, items: genLevel(L, th),
    x: 0, speed: 0, lane: 1, laneF: 1, falls: 0, phase: 'countdown', cd: 3.99, goT: 0,
    boost: 1, boosting: false, mudT: 0, crashT: 0, invT: 0,
    jumpT: -1, jumpDur: 0.75, jumpH: 75, flipT: -1, flips: 0, wobT: 0, padT: 0,
    elev: 0, elevV: 0, ter: null, loop: null, lead: 0, stars: 0, bank: 0, jumps: 0, heartOffered: false,
    rollT: -1, rolls: 0, jumpKind: 'small', wheelie: false, wAmt: 0, wheelT: 0, lastBoostTap: -9, lastJumpTap: -9,
    annNext: 0, lastAnn: 4, facts: shuffle(FACT_KEYS.slice()).slice(0, 3),
    mon: { px: -400, jumpT: -1, dur: 1, h: 0, elev: 0, elevV: 0, ter: null, loop: null },
    gap: 270, t: 0, spin: 0, parts: [], texts: [], shake: 0, endT: 0, ended: false, roarT: -1,
    paused: false, gotYou: false, mLaneF: 1,
  };
}
const CRASH_TIME = 1.3;
function playerX() { return clamp(G.W * 0.42, 300, 430); }
function isBoosting(R) { return R.phase === 'go' && R.boosting && R.boost > 0.01 && R.crashT <= 0; }
function isFast(R) { return isBoosting(R) || (R.padT > 0 && R.crashT <= 0); }
function inAir(R) { return R.jumpT >= 0 || R.elev > 24 || !!R.loop; }
function playerHeight(R) {
  let h = R.elev;
  if (R.jumpT >= 0) h += Math.sin(Math.PI * R.jumpT / R.jumpDur) * R.jumpH;
  return h;
}

function addText(R, txt, color = '#fff', y) {
  R.texts.push({ txt, x: playerX() + 60, y: y ?? Math.max(60, laneGround(R.laneF) - 175 - playerHeight(R) * 0.6), life: 1.1, max: 1.1, c: color });
}
function bannerText(R, txt, color, life = 1.8) { R.texts.push({ txt, x: G.W / 2, y: 120, life, max: life, c: color }); }
function burst(R, n, o) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, sp = (o.speed || 200) * (0.4 + Math.random() * 0.6);
    R.parts.push({
      x: o.x, y: o.y, vx: Math.cos(a) * sp + (o.vx || 0), vy: Math.sin(a) * sp + (o.vy || 0), g: o.g ?? 600,
      life: o.life || 0.7, max: o.life || 0.7, r: o.r || 5, c: o.c || '#fff', type: o.type || 'dot', rot: Math.random() * TAU, screen: o.screen,
    });
  }
}
// doing something cool pushes the monster further back
function addLead(R, n, txt, color = '#7dff9a') {
  R.lead = Math.min(LEAD_MAX, R.lead + n);
  if (txt) addText(R, txt, color);
  burst(R, 6, { x: R.x - R.gap, y: laneGround(R.mLaneF) - 30, c: 'rgba(255,255,255,.85)', r: 9, speed: 90, g: -40, life: 0.6, type: 'puff' });
}
function healHeart(R, why) {
  if (R.falls <= 0 || R.phase !== 'go') return false;
  R.falls--; updateHearts();
  bannerText(R, '+ ❤️  ' + why, '#ff6b8b', 2);
  AudioMgr.play('tada', 0.7);
  burst(R, 14, { x: R.x, y: laneGround(R.laneF) - 70, type: 'star', c: '#ff6b8b', r: 7, speed: 260, g: 100 });
  return true;
}
// stars fill the heart meter: every 10 stars = a heart back (or a SUPER STAR boost when hearts are full)
function addStars(R, n, x, y) {
  R.stars += n; R.bank += n;
  R.lead = Math.min(LEAD_MAX, R.lead + 3 * n);
  AudioMgr.play('pop', 0.55);
  if (x !== undefined) burst(R, 5, { x, y, type: 'star', c: '#ffd60a', r: 4, speed: 140, g: 0, life: 0.4 });
  while (R.bank >= STARS_PER_HEART) {
    R.bank -= STARS_PER_HEART;
    if (healHeart(R, '10 stars!')) { if (!G.starHeartSpoken) { G.starHeartSpoken = true; Speech.say('star_heart', 'Ten stars! You got a heart back!'); } }
    else { R.boost = 1; addLead(R, 45); bannerText(R, 'SUPER STAR! ⭐', '#ffd60a', 1.6); announce(R, 'a_superstar'); }
  }
}
function getStar(R, x, y) { addStars(R, 1, x, y); }

// down to your last heart? a big heart shows up ahead so you can win one back
function offerHeart(R) {
  for (let ahead = 900; ahead < 1800; ahead += 100) {
    const hx = R.x + ahead;
    const open = [0, 1, 2].filter(l => !R.items.some(i => i.lane === l && !i.done && Math.abs(i.x - hx) < 180 && (i.k === 'obs' || i.k === 'rival' || i.k === 'mud' || LAUNCHERS.includes(i.k) || i.k === 'loop')
      || (i.lane === l && TERRAIN.includes(i.k) && hx > i.x - 150 && hx < i.x + i.len + 150)));
    if (open.length) {
      R.items.push({ k: 'heart', x: hx, lane: pick(open) });
      bannerText(R, 'Grab the ❤️!', '#ff6b8b', 2.2);
      Speech.say('grab_heart', 'Grab the heart to get one back!');
      return;
    }
  }
}

// ---------- the race announcer (same southern voice) ----------
const FACT_KEYS = ['a_fact1', 'a_fact2', 'a_fact3', 'a_fact4', 'a_fact5', 'a_fact6', 'a_fact7', 'a_fact8'];
function announce(R, keys, pri = 1) {
  if (!R || G.mode !== 'race' || G.race !== R) return;
  const key = Array.isArray(keys) ? pick(keys) : keys;
  if (pri < 2 && (R.t < (R.annNext || 0) || Speech.busy())) return;
  Speech.say(key);
  R.annNext = R.t + (pri >= 2 ? 2.5 : 3.2); R.lastAnn = R.t;
}
// short obstacles can be hopped over; tall ones (and other racers) need a lane change or great timing
const OBS_H = { rock: 40, log: 32, hay: 46, cone: 50, sandcastle: 72, crab: 45, beachball: 44, snowman: 60, iceblock: 46, snowlog: 40, gumdrop: 48, lollipop: 73, cupcake: 62, pumpkin: 50, tombstone: 55, mushroom: 50 };
const ROLL_TIME = 0.5;
const ROLL_NAME = v => (v === 'skateboard' || v === 'scooter') ? 'KICKFLIP!' : 'BARREL ROLL!';

function crash(R) {
  R.falls++; R.crashT = CRASH_TIME; R.invT = CRASH_TIME + 1.6; R.shake = 0.35; R.mudT = 0; R.jumpT = -1;
  R.lead = 0; R.flipT = -1; R.flips = 0; R.rollT = -1; R.rolls = 0; R.padT = 0; R.wheelie = false;
  AudioMgr.play('crash', 0.9);
  if (R.falls === 2) announce(R, 'a_close', 2); else if (R.falls < 3) announce(R, ['a_crash1', 'a_crash2'], 2);
  burst(R, 10, { x: R.x, y: laneGround(R.laneF) - 50, type: 'star', c: '#ffd60a', r: 7, speed: 260, g: 300 });
  addText(R, pick(['Oops!', 'Bonk!', 'Uh-oh!']), '#ffd60a');
  updateHearts();
  if (R.falls >= 3) {
    R.phase = 'caught'; R.endT = 0; R.boosting = false;
    AudioMgr.engineStop(); AudioMgr.stopMusic();
    R.roarT = 0.3;
  } else {
    R.roarT = 0.55;
    if (R.falls === 2) R.offerT = 1.6;   // a rescue heart appears soon after
  }
}

function finishRace(R) {
  R.phase = 'finish'; R.endT = 0; R.boosting = false;
  G.beaten.add(R.idx);
  AudioMgr.engineStop();
  AudioMgr.playMusic('music_win', false, true);
  AudioMgr.play('cheer', 0.9);
  R.texts.push({ txt: 'YOU WIN!', x: G.W / 2, y: 170, life: 2.6, max: 2.6, c: '#ffd60a', big: true });
}

function startJump(R, kind) {
  const J = JUMPS[kind];
  R.jumpT = 0; R.jumpDur = J.dur; R.jumpH = J.h; R.flipT = -1; R.flips = 0; R.rollT = -1; R.rolls = 0; R.wheelie = false;
  R.jumpKind = kind; R.pumped = false;
  if (kind === 'hop') { AudioMgr.play('jump', 0.45); return; }
  if (kind === 'cannon') { AudioMgr.play('crash', 0.45); AudioMgr.play('rev', 0.8); R.shake = 0.25; }
  else AudioMgr.play('jump', 0.7);
  R.jumps++;
  const word = { small: 'Wheee!', big: 'Big air!', spring: 'BOING!', cannon: 'BOOM!' }[kind];
  addText(R, word, kind === 'cannon' ? '#ffb020' : '#fff');
  if (R.jumps <= 2) {
    bannerText(R, 'Tap ⤴ JUMP to FLIP!', '#ffd60a');
    if (!G.flipSpoken) { G.flipSpoken = true; announce(R, 'flip_tip2', 2); return; }
  }
  if (kind === 'cannon') announce(R, 'a_cannon'); else if (kind === 'spring') announce(R, 'a_spring');
}
function land(R) {
  R.jumpT = -1;
  burst(R, 8, { x: R.x, y: laneGround(R.laneF) - R.elev, c: R.th.pebble, r: 7, speed: 120, vy: -60, g: 200, life: 0.5 });
  if (R.flipT >= 0 || R.rollT >= 0) {
    // landed in the middle of a trick: wobbly, slows you down (but not a fall)
    R.flipT = -1; R.rollT = -1; R.wobT = 0.9; R.mudT = 0.6;
    addText(R, 'Wobbly!', '#ffb3d9'); AudioMgr.play('mud', 0.5); announce(R, 'a_wobbly');
  } else if (R.flips > 0 || R.rolls > 0) {
    const n = R.flips + R.rolls;
    let word = ['', 'FLIP!', 'DOUBLE FLIP!', 'TRIPLE FLIP!'][Math.min(3, R.flips)] || 'MEGA FLIP!';
    if (R.rolls && !R.flips) word = ROLL_NAME(G.cfg.vehicle);
    else if (R.rolls) word = 'COMBO x' + n + '!';
    addLead(R, 30 + 25 * n, word, '#ffd60a');
    AudioMgr.play('tada', 0.5);
    addStars(R, 2 * n, R.x, laneGround(R.laneF) - 60);
    if (R.rolls && !R.flips) announce(R, ROLL_NAME(G.cfg.vehicle) === 'KICKFLIP!' ? 'a_kick' : 'a_roll', 2);
    else announce(R, R.flips >= 3 ? 'a_triple' : R.flips === 2 ? 'a_double' : ['a_flip1', 'a_flip2'], 2);
  } else if (R.jumpKind !== 'hop') { addLead(R, 18, 'Nice landing!'); if (R.jumpKind !== 'small') announce(R, 'a_land'); }
  R.flips = 0; R.rolls = 0;
}

function collide(R) {
  const air = inAir(R), h = playerHeight(R);
  const inLane = it => Math.abs(R.laneF - it.lane) < 0.45;
  for (const it of R.items) {
    if (it.done) continue;
    const dx = it.x - R.x;
    if (TERRAIN.includes(it.k)) {
      const along = -dx;
      if (!R.ter && inLane(it) && R.jumpT < 0 && along > -10 && along < it.len - 20) {
        // decks must be entered from the start; bridges + bumps can be joined from the side
        if (it.k === 'deck' ? (along < 60 && R.elev < 5) : true) {
          R.ter = it;
          if (!it.used) {
            it.used = true;
            if (it.k === 'deck') { AudioMgr.play('whoosh', 0.6); addLead(R, 10, it.steps.length > 1 ? 'Up, up, up!' : 'Up high!'); announce(R, 'a_deck'); }
            else if (it.k === 'hill') { AudioMgr.play('whoosh', 0.6); addLead(R, 14, 'Over the rainbow!'); announce(R, 'a_rainbow'); }
            else { addLead(R, 10, 'Bumpy!'); announce(R, 'a_bumps'); }
          }
        }
      }
      continue;
    }
    if (dx > 160 || dx < -160) continue;
    if (LAUNCHERS.includes(it.k)) {
      const hopping = R.jumpKind === 'hop' && R.jumpT >= 0 && !R.ter;
      if (!it.used && (!air || hopping) && inLane(it) && dx < (it.k === 'cannon' ? 15 : 30) && dx > -40) {
        it.used = true; if (it.k === 'spring') it.sq = 1; if (it.k === 'cannon') it.fire = 1;
        // hopped onto it? launch from where you are (you glide down onto the new arc)
        if (hopping) { R.elev = Math.max(R.elev, h); R.elevV = 0; }
        startJump(R, jumpKind(it));
      }
    } else if (it.k === 'loop') {
      if (!it.used && !air && inLane(it) && dx <= 0 && dx > -60) {
        it.used = true; R.loop = { it, t: 0, dur: 1.4 }; R.x = it.x;
        AudioMgr.play('rev', 0.6); R.flipT = -1; R.rollT = -1; R.wheelie = false; announce(R, 'a_loop');
      }
    } else if (it.k === 'star') {
      if (inLane(it) && Math.abs(dx) < 38 && Math.abs(h - it.h) < 50) {
        it.done = true; getStar(R, it.x, laneGround(it.lane) - 30 - it.h);
      }
    } else if (it.k === 'heart') {
      if (inLane(it) && Math.abs(dx) < 48 && h < 90) {
        it.done = true;
        if (!healHeart(R, 'Got it!')) addLead(R, 40, 'Yay!');
        Speech.say('got_heart', 'Yay! You got a heart back!');
      }
    } else if (it.k === 'pad') {
      if (!it.used && !air && inLane(it) && Math.abs(dx) < 52) {
        it.used = true; R.padT = 1.2; AudioMgr.play('rev', 0.7); addLead(R, 22, 'Zoom!', '#5ef2ff'); announce(R, 'a_pad');
      }
    } else if (it.k === 'mud') {
      if (!it.used && !air && inLane(it) && Math.abs(dx) < 52) {
        it.used = true; R.mudT = 0.9; AudioMgr.play('mud', 0.8); addText(R, 'Splash!', '#cfe8ff'); announce(R, 'a_mud');
        burst(R, 14, { x: it.x, y: LANE_GROUND[it.lane] - 8, c: R.th.mud, r: 5, speed: 220, vy: -150, g: 700, vx: 60 });
      }
    } else if (it.k === 'boost') {
      if (inLane(it) && Math.abs(dx) < 42 && h < 80) {
        it.done = true; R.boost = Math.min(1, R.boost + 0.45);
        AudioMgr.play('pop', 0.6); addLead(R, 10, '+ ⚡', '#ffd60a');
        burst(R, 10, { x: it.x, y: LANE_GROUND[it.lane] - 36, type: 'star', c: '#ffd60a', r: 5, speed: 180, g: 0, life: 0.5 });
      }
    } else if (it.k === 'obs') {
      const oh = OBS_H[it.type] || 45;
      // while hopping, short things can't hit you at all; tall things only if you're low
      const hopping = R.jumpT >= 0 && R.jumpKind === 'hop';
      const clear = hopping ? (oh < 55 || h > oh - 20) : h >= oh - 8;
      if (!R.loop && !clear && inLane(it) && Math.abs(dx) < 38 && R.invT <= 0) {
        it.done = true; it.fly = { x: 0, y: 0, vx: 280, vy: -460, r: 0, vr: 9 };
        crash(R); return;
      }
      if (!it.hopped && R.jumpT >= 0 && R.jumpKind === 'hop' && inLane(it) && Math.abs(dx) < 30) {
        it.hopped = true; addLead(R, 10, 'Hop!', '#7dff9a'); announce(R, 'a_hop');
      }
    } else if (it.k === 'rival') {
      if (h < 95 && !R.loop && !it.hit && inLane(it) && Math.abs(dx) < 70 && R.invT <= 0) {
        it.hit = true; it.wob = 1.2; crash(R); return;
      }
    }
  }
}

// ---------- the monster rides the same track (in its lane) ----------
function monsterJump(M, kind) { const J = JUMPS[kind]; M.jumpT = 0; M.dur = J.dur; M.h = J.h; }
function updateMonster(R, dt) {
  const M = R.mon, mx = R.x - R.gap, lane = Math.round(R.mLaneF), busy = M.jumpT >= 0 || M.loop;
  if (R.phase === 'go' || R.phase === 'countdown') {
    for (const it of R.items) {
      if (it.lane !== lane) continue;
      const crossed = it.x > M.px && it.x <= mx;
      if (it.k === 'rival') { if (!busy && !it.hit && Math.abs(it.x - mx) < 50 && !M.ter) monsterJump(M, 'hop'); continue; }
      if (!crossed) continue;
      if (LAUNCHERS.includes(it.k) && !busy && !M.ter) {
        monsterJump(M, jumpKind(it));
        if (it.k === 'spring') it.sq = 1;
        if (it.k === 'cannon') { it.fire = 1; AudioMgr.play('crash', 0.25); }
        if (it.k !== 'ramp') { announce(R, 'a_monfly'); AudioMgr.play('mon_' + G.cfg.monster, 0.5); }
      } else if (it.k === 'obs' && !it.done && !busy && !M.ter) monsterJump(M, 'hop');
      else if (it.k === 'mud') burst(R, 12, { x: it.x, y: LANE_GROUND[it.lane] - 8, c: R.th.mud, r: 5, speed: 200, vy: -150, g: 700 });
      else if (TERRAIN.includes(it.k) && !busy) M.ter = it;
      else if (it.k === 'loop' && !busy && !M.ter) M.loop = { it };
      else if (it.k === 'star' && !it.done && it.h < 40) { it.done = true; burst(R, 4, { x: it.x, y: LANE_GROUND[lane] - 40, type: 'star', c: '#ffd60a', r: 4, speed: 100, g: 0, life: 0.3 }); }
    }
  }
  M.px = mx;
  if (M.jumpT >= 0) { M.jumpT += dt; if (M.jumpT >= M.dur) { M.jumpT = -1; R.shake = Math.max(R.shake, 0.1); } }
  if (M.loop && mx > M.loop.it.x + M.loop.it.d) M.loop = null;
  if (M.ter) {
    const a = mx - M.ter.x;
    if (Math.abs(R.mLaneF - M.ter.lane) > 0.45 || a > M.ter.len || a < -20) { M.ter = null; M.elevV = 0; }
    else M.elev = terrainH(M.ter, a);
  } else if (M.elev > 0) { M.elevV += 1500 * dt; M.elev = Math.max(0, M.elev - M.elevV * dt); }
}
function monsterHeight(R) {
  const M = R.mon; let h = M.elev;
  if (M.jumpT >= 0) h += Math.sin(Math.PI * M.jumpT / M.dur) * M.h;
  return h;
}

function updateRace(R, dt) {
  R.t += dt;
  if (R.phase === 'countdown') {
    const before = Math.ceil(R.cd); R.cd -= dt; const after = Math.ceil(R.cd);
    if (after !== before && after >= 1) AudioMgr.play('pop', 0.9);
    if (R.cd <= 0) { R.phase = 'go'; R.goT = 0.8; AudioMgr.play('rev', 0.8); AudioMgr.engineStart(G.cfg.vehicle); announce(R, ['a_start1', 'a_start2'], 2); }
  }
  if (R.goT > 0) R.goT -= dt;

  R.laneF += (R.lane - R.laneF) * Math.min(1, dt * 13);
  // the monster steers into your lane, a little slower than you do
  if (R.phase !== 'finish') R.mLaneF += (R.laneF - R.mLaneF) * Math.min(1, dt * (R.phase === 'caught' ? 6 : 2.6));
  const boosting = isBoosting(R), fast = isFast(R);

  let target = 0;
  if (R.phase === 'go' && R.crashT <= 0) {
    target = R.L.speed;
    if (fast) target *= 1.6;
    if (R.mudT > 0) target *= 0.45;
  }
  const rate = R.phase === 'finish' ? 1.1 : (target > R.speed ? 2.2 : 7);
  R.speed += (target - R.speed) * Math.min(1, dt * rate);
  if (boosting) R.boost = Math.max(0, R.boost - dt * 0.4);
  else R.boost = Math.min(1, R.boost + dt * 0.085);

  // riding around a loop: it's stretched like a roller coaster, so you keep moving forward the whole time
  if (R.loop) {
    const L = R.loop, it = L.it; L.t += dt;
    const ang = Math.min(1, L.t / L.dur) * TAU;
    R.x = it.x + it.d * Math.min(1, L.t / L.dur);
    while (it.got < 5 && ang >= (it.got + 1) * TAU / 6) {
      it.got++;
      const ls = LANE_SCALE[it.lane], p = loopPoint(it.d, it.got * TAU / 6, 40 * ls, LOOP_R * ls);
      getStar(R, it.x + p[0], LANE_GROUND[it.lane] + p[1]);
    }
    if (L.t >= L.dur) { R.loop = null; addLead(R, 40, 'LOOP-DE-LOOP!', '#ffd60a'); AudioMgr.play('tada', 0.4); }
  } else R.x += R.speed * dt;
  R.spin += R.speed * dt / 16;

  R.mudT -= dt; R.crashT -= dt; R.invT -= dt; R.padT -= dt; R.wobT = Math.max(0, R.wobT - dt);
  R.shake = Math.max(0, R.shake - dt);

  // jumps + tricks
  if (R.jumpT >= 0) {
    R.jumpT += dt;
    if (R.flipT >= 0) { R.flipT += dt; if (R.flipT >= FLIP_TIME) { R.flipT = -1; R.flips++; } }
    if (R.rollT >= 0) { R.rollT += dt; if (R.rollT >= ROLL_TIME) { R.rollT = -1; R.rolls++; } }
    if (!R.ter && R.jumpT > R.jumpDur * 0.5) {
      const h = playerHeight(R);
      for (const it of R.items) {
        if (!TERRAIN.includes(it.k) || Math.abs(R.laneF - it.lane) > 0.45) continue;
        const a = R.x - it.x; if (a < 0 || a > it.len) continue;
        const th = terrainH(it, a);
        if (th > 12 && h <= th + 4 && h >= th - 45) { R.ter = it; it.used = true; R.elev = th; R.elevV = 0; R.jumpT = R.jumpDur; break; }
      }
    }
    if (R.jumpT >= R.jumpDur) land(R);
  }
  // wheelie: double-tap + hold boost while on the ground
  if (R.wheelie && (!R.boosting || R.boost <= 0.02 || R.jumpT >= 0 || R.loop || R.crashT > 0 || R.phase !== 'go')) R.wheelie = false;
  R.wAmt += ((R.wheelie ? 1 : 0) - R.wAmt) * Math.min(1, dt * 10);
  if (R.wheelie) {
    R.wheelT += dt; R.lead = Math.min(LEAD_MAX, R.lead + dt * 8);
    if (R.wheelT >= 1) { R.wheelT -= 1; addStars(R, 1, R.x + 30, laneGround(R.laneF) - 90); }
  }
  // the announcer
  if (R.phase === 'go') {
    if (!R.halfSaid && R.x > R.L.length * 0.5) { R.halfSaid = true; announce(R, 'a_half'); }
    if (!R.finalSaid && R.x > R.L.length * 0.85) { R.finalSaid = true; announce(R, 'a_final'); }
    if (!G.hopTip && R.t > 6.5) { G.hopTip = true; bannerText(R, 'Tap ⤴ JUMP to hop!', '#7dff9a', 2.4); announce(R, 'hop_tip', 2); }
    else if (!G.wheelieTip && R.t > 20) { G.wheelieTip = true; bannerText(R, 'Double-tap ⚡ + hold = WHEELIE!', '#7dff9a', 2.6); announce(R, 'wheelie_tip', 2); }
    else if (R.t - R.lastAnn > 10 && !Speech.busy()) { const f = R.facts.pop(); if (f) announce(R, f); else R.lastAnn = R.t; }
  }
  // riding on a deck / rainbow bridge / bumps
  if (R.ter) {
    const d = R.ter, along = R.x - d.x;
    if (Math.abs(R.laneF - d.lane) > 0.45 || along > d.len) { R.ter = null; R.elevV = 0; }
    else {
      const target = terrainH(d, along);
      R.elev = d.k === 'deck' || R.elev < 1 ? target : R.elev + (target - R.elev) * Math.min(1, dt * 18);
      if (d.k === 'hill' && R.elev < 1 && along > d.len / 2) R.ter = null;
    }
  } else if (R.elev > 0) {
    R.elevV += 1500 * dt; R.elev = Math.max(0, R.elev - R.elevV * dt);
    if (R.elev === 0) burst(R, 6, { x: R.x, y: laneGround(R.laneF), c: R.th.pebble, r: 6, speed: 100, vy: -50, g: 200, life: 0.4 });
  }
  const air = inAir(R);
  if (R.phase === 'go') AudioMgr.engineRate(0.7 + R.speed / R.L.speed * 0.45);

  // dust + boost sparks
  if (!air && R.speed > 40 && R.crashT <= 0 && Math.random() < dt * 28) {
    const s = laneScale(R.laneF);
    R.parts.push({ x: R.x - 48 * s, y: laneGround(R.laneF) - 4 - R.elev * s, vx: -40 - Math.random() * 40, vy: -20 - Math.random() * 30, g: 0, life: 0.6, max: 0.6, r: 5 + Math.random() * 5, c: R.th.pebble, type: 'puff' });
  }
  if (fast && Math.random() < dt * 30) {
    R.parts.push({ x: R.x - 60, y: laneGround(R.laneF) - 20 - Math.random() * 60 - playerHeight(R), vx: -500, vy: 0, g: 0, life: 0.3, max: 0.3, r: 3, c: '#fff', type: 'line' });
  }

  // rivals + things knocked flying
  for (const it of R.items) {
    if (it.k === 'rival') {
      if (!it.active && it.x - R.x < 1100) it.active = true;
      if (it.active) { it.x += it.spd * dt; it.spin += it.spd * dt / 16; it.t += dt; }
      if (it.wob > 0) it.wob -= dt;
      if (!it.hit && !it.passed && R.phase === 'go' && it.x < R.x - 80) { it.passed = true; addLead(R, 15, 'Passed!'); announce(R, 'a_pass'); }
    }
    if (it.fly) { const f = it.fly; f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 1100 * dt; f.r += f.vr * dt; }
    if (it.sq > 0) it.sq = Math.max(0, it.sq - dt * 3);
    if (it.fire > 0) it.fire = Math.max(0, it.fire - dt * 1.5);
  }

  if (R.phase === 'go' && R.crashT <= 0 && !R.loop) collide(R);
  if (R.offerT > 0) { R.offerT -= dt; if (R.offerT <= 0 && R.phase === 'go' && R.falls === 2) offerHeart(R); }

  if (R.roarT > 0) {
    R.roarT -= dt;
    if (R.roarT <= 0) {
      AudioMgr.play('mon_' + G.cfg.monster, 0.85);
      R.texts.push({ txt: 'RAWR!', x: playerX() - R.gap + 40, y: 260, life: 1, max: 1, c: '#ff5fa2' });
    }
  }

  if (R.phase === 'go' && R.x >= R.L.length) finishRace(R);

  // the monster: falls bring it closer, cool moves push it back
  R.lead = Math.max(0, R.lead - dt * 4);
  if (boosting) R.lead = Math.min(LEAD_MAX, R.lead + dt * 12);
  if (R.phase === 'finish') R.gap += R.speed * dt;
  else if (!R.loop) {
    let gT = [250, 185, 125][Math.min(R.falls, 2)] + R.lead;
    if (R.phase === 'countdown') gT = 270;
    if (R.mudT > 0) gT -= 45;
    if (R.crashT > 0) gT -= 50;
    if (R.phase === 'caught') gT = -20;
    R.gap += (gT - R.gap) * Math.min(1, dt * (R.phase === 'caught' ? 2.6 : 1.4));
  }
  if (!R.loop) updateMonster(R, dt);

  if (R.phase === 'caught') {
    R.endT += dt;
    if (!R.gotYou && R.gap < 20) {
      R.gotYou = true; AudioMgr.playMusic('music_lose', false, true);
      R.texts.push({ txt: 'GOTCHA!', x: G.W / 2, y: 170, life: 2.4, max: 2.4, c: '#ff5fa2', big: true });
    }
    if (R.endT > 3 && !R.ended) { R.ended = true; endRun(false); }
  }
  if (R.phase === 'finish') {
    R.endT += dt;
    if (R.endT < 1.6 && Math.random() < dt * 40) {
      R.parts.push({ x: Math.random() * G.W, y: -20 - G.offY, vx: (Math.random() - 0.5) * 80, vy: 120 + Math.random() * 120, g: 60, life: 3, max: 3, r: 6, c: pick(RAINBOW), type: 'conf', rot: Math.random() * TAU, screen: true });
    }
    if (R.endT > 3 && !R.ended) { R.ended = true; endRun(true); }
  }

  for (const p of R.parts) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt; p.rot = (p.rot || 0) + dt * 6; if (p.type === 'puff') p.r += dt * 14; }
  R.parts = R.parts.filter(p => p.life > 0);
  for (const tx of R.texts) { tx.life -= dt; tx.y -= dt * 40; }
  R.texts = R.texts.filter(tx => tx.life > 0);

  updateHud(R);
}

// ---------- drawing the race ----------
function bigText(c, txt, x, y, size, fill, alpha = 1) {
  c.save(); c.globalAlpha = clamp(alpha, 0, 1);
  c.font = `700 ${size}px Fredoka, 'Arial Rounded MT Bold', sans-serif`;
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  c.lineWidth = size * 0.2; c.strokeStyle = OUT; c.strokeText(txt, x, y);
  c.fillStyle = fill; c.fillText(txt, x, y);
  c.restore();
}

function drawPlayer(R, px) {
  if (R.gotYou) return;
  const gy = laneGround(R.laneF), s = laneScale(R.laneF);
  if (R.loop) {
    const it = R.loop.it, ls = LANE_SCALE[it.lane], r = LOOP_R * ls, th = Math.min(1, R.loop.t / R.loop.dur) * TAU;
    const p = loopPoint(it.d, th, 0, r);
    ctx.save(); ctx.translate(it.x - R.x + px + p[0], LANE_GROUND[it.lane] + p[1]); ctx.rotate(loopAngle(it.d, th, r)); ctx.scale(ls * 0.85, ls * 0.85);
    drawRig(ctx, G.cfg, R.t, R.spin, { boost: true });
    ctx.restore();
    return;
  }
  let jy = -playerHeight(R) * s, ang = 0, dizzy = false;
  if (R.jumpT >= 0) {
    const p = R.jumpT / R.jumpDur; ang = -0.28 + 0.4 * p;
    if (R.flipT >= 0) ang -= R.flipT / FLIP_TIME * TAU;
  }
  let roll = 1;
  if (R.rollT >= 0) { roll = Math.cos(R.rollT / ROLL_TIME * TAU); if (Math.abs(roll) < 0.06) roll = roll < 0 ? -0.06 : 0.06; }
  if (R.wobT > 0) ang += Math.sin(R.t * 30) * 0.2 * (R.wobT / 0.9);
  if (R.crashT > 0) {
    const p = 1 - R.crashT / CRASH_TIME;
    if (p < 0.55) { const q = p / 0.55; ang = q * TAU; jy = -Math.sin(q * Math.PI) * 70; } else dizzy = true;
  } else if (R.phase === 'caught') dizzy = true;

  const floorY = gy - (R.ter ? R.elev * s : 0);
  const sh = Math.max(0.4, 1 - (floorY - (gy + jy)) / 200);
  ell(ctx, px, floorY, 50 * s * sh, 8 * s * sh, 'rgba(0,0,0,.2)', 0);
  ctx.save();
  if (R.invT > 0 && R.crashT <= 0 && Math.floor(R.t * 10) % 2) ctx.globalAlpha = 0.45;
  const bob = (!inAir(R) && R.speed > 20) ? Math.sin(R.t * 28) * 1.1 : 0;
  ctx.translate(px, gy + jy + bob); ctx.scale(s, s);
  ctx.translate(0, -45); ctx.rotate(ang); ctx.scale(1, roll); ctx.translate(0, 45);
  if (R.wAmt > 0.01) {   // wheelie: tip back on the rear wheel
    const rx = -VEHICLES[G.cfg.vehicle].w * 0.34;
    ctx.translate(rx, -10); ctx.rotate(-0.45 * R.wAmt); ctx.translate(-rx, 10);
  }
  drawRig(ctx, G.cfg, R.t, R.spin, { boost: isFast(R) });
  ctx.restore();
  const top = gy + jy - (VEHICLES[G.cfg.vehicle].h + 8) * s;
  if (dizzy) dizzyStars(ctx, px, top, R.t);
  if (R.phase === 'countdown') {
    const b = Math.sin(R.t * 8) * 5;
    poly(ctx, [[px - 12, top - 22 + b], [px + 12, top - 22 + b], [px, top - 6 + b]], '#ffd60a', 3);
    bigText(ctx, 'YOU', px, top - 42 + b, 26, '#ffd60a');
  }
}

function renderRace(R) {
  const px = playerX(), camX = R.x - px;
  ctx.save();
  if (R.shake > 0) ctx.translate((Math.random() - 0.5) * R.shake * 30, (Math.random() - 0.5) * R.shake * 30);
  drawScene(ctx, R.th, G.W, camX, R.t, G.offY);

  // start + finish lines
  const sx = 40 - camX;
  if (sx > -30 && sx < G.W) { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(sx, TRACK_TOP, 10, TRACK_BOT - TRACK_TOP); }
  const fx = R.L.length - camX;
  if (fx > -200 && fx < G.W + 200) drawFinishLine(ctx, fx, R.t);

  // flat things first
  for (const it of R.items) {
    if (it.k !== 'mud' && it.k !== 'pad') continue;
    const x = it.x - camX; if (x < -120 || x > G.W + 120) continue;
    ctx.save(); ctx.translate(x, LANE_GROUND[it.lane]); ctx.scale(LANE_SCALE[it.lane], LANE_SCALE[it.lane]);
    if (it.k === 'mud') drawMud(ctx, R.th.mud); else drawPad(ctx, R.t);
    ctx.restore();
  }
  // the monster runs in a lane too (behind you), so it is drawn with that lane
  const drawM = () => {
    const M = R.mon, ls = laneScale(R.mLaneF), ms = ls * 0.8;
    const mood = R.phase === 'finish' && R.endT > 0.6 ? 'dizzy' : (R.gotYou || M.jumpT >= 0 || M.loop ? 'happy' : 'chase');
    if (M.loop) {
      // the monster rides the loop too!
      const it = M.loop.it, ls2 = LANE_SCALE[it.lane], r = LOOP_R * ls2;
      const th = clamp((R.x - R.gap - it.x) / it.d, 0, 1) * TAU, p = loopPoint(it.d, th, 0, r);
      ctx.save(); ctx.translate(it.x - camX + p[0], LANE_GROUND[it.lane] + p[1]);
      ctx.rotate(loopAngle(it.d, th, r)); ctx.scale(ls2 * 0.5, ls2 * 0.5); drawMonster(ctx, G.cfg.monster, R.t, 'happy'); ctx.restore();
      return;
    }
    const mx = px - R.gap; if (mx < -200) return;
    let ang = 0;
    if (M.jumpT >= 0) ang = -0.25 + 0.4 * (M.jumpT / M.dur);
    ctx.save(); ctx.translate(mx, laneGround(R.mLaneF) + 4 - monsterHeight(R) * ls);
    ctx.rotate(ang); ctx.scale(ms, ms);
    drawMonster(ctx, G.cfg.monster, R.t, mood); ctx.restore();
  };
  const monsterOnTop = R.gotYou || R.gap < 60;
  const ml = Math.round(R.mLaneF);

  // lane by lane (back to front)
  const pl = R.loop ? R.loop.it.lane : Math.round(R.laneF);
  for (let lane = 0; lane < 3; lane++) {
    const s = LANE_SCALE[lane], gy = LANE_GROUND[lane];
    for (const it of R.items) {
      if (it.lane !== lane) continue;
      const x = it.x - camX;
      if (TERRAIN.includes(it.k)) {
        if (x + it.len < -40 || x > G.W + 40) continue;
        ctx.save(); ctx.translate(x, gy); ctx.scale(s, s); drawTerrain(ctx, it, R.th, R.t); ctx.restore();
      } else if (it.k === 'spring') {
        if (x < -60 || x > G.W + 60) continue;
        ctx.save(); ctx.translate(x, gy); ctx.scale(s, s); drawSpring(ctx, R.t, it.sq); ctx.restore();
      } else if (it.k === 'cannon') {
        if (x < -120 || x > G.W + 120) continue;
        ctx.save(); ctx.translate(x, gy); ctx.scale(s, s); drawCannon(ctx, R.t, it.fire); ctx.restore();
      } else if (it.k === 'heart' && !it.done) {
        if (x < -60 || x > G.W + 60) continue;
        ctx.save(); ctx.translate(x, gy); ctx.scale(s, s); drawHeartPickup(ctx, R.t); ctx.restore();
      } else if (it.k === 'loop') {
        if (x + it.d < -200 || x > G.W + 200) continue;
        ctx.save(); ctx.translate(x, gy); drawLoop(ctx, it.d, LOOP_R * s, s, R.t);
        for (let k = it.got + 1; k <= 5; k++) {
          const p = loopPoint(it.d, k * TAU / 6, 40 * s, LOOP_R * s);
          ctx.save(); ctx.translate(p[0], p[1]); ctx.scale(s * 0.8, s * 0.8); drawStarPickup(ctx, R.t + k); ctx.restore();
        }
        ctx.restore();
      } else if (it.k === 'ramp') {
        if (x < -100 || x > G.W + 100) continue;
        ctx.save(); ctx.translate(x, gy); ctx.scale(s, s); drawRamp(ctx, it.big); ctx.restore();
      } else if (it.k === 'star' && !it.done) {
        if (x < -40 || x > G.W + 40) continue;
        ctx.save(); ctx.translate(x, gy - (it.h + 32) * s); ctx.scale(s, s); drawStarPickup(ctx, R.t + it.x * 0.01); ctx.restore();
      } else if (it.k === 'obs') {
        let ox = x, y = gy;
        if (it.done) { if (!it.fly || it.fly.y > 600) continue; ox += it.fly.x; y += it.fly.y; }
        if (ox < -90 || ox > G.W + 90) continue;
        if (!it.done) ell(ctx, ox, gy, 30 * s, 6 * s, 'rgba(0,0,0,.15)', 0);
        ctx.save(); ctx.translate(ox, y); ctx.scale(s, s);
        if (it.fly) { ctx.translate(0, -20); ctx.rotate(it.fly.r); ctx.translate(0, 20); }
        OBSTACLES[it.type](ctx, R.t, it.v);
        ctx.restore();
      } else if (it.k === 'boost' && !it.done) {
        if (x < -60 || x > G.W + 60) continue;
        ctx.save(); ctx.translate(x, gy); ctx.scale(s, s); drawBolt(ctx, R.t + it.x); ctx.restore();
      } else if (it.k === 'rival') {
        if (x < -120 || x > G.W + 120) continue;
        ell(ctx, x, gy, 46 * s, 7 * s, 'rgba(0,0,0,.18)', 0);
        ctx.save(); ctx.translate(x, gy); ctx.scale(s, s);
        if (it.wob > 0) { ctx.translate(0, -30); ctx.rotate(Math.sin(it.t * 30) * 0.25 * it.wob); ctx.translate(0, 30); }
        drawRig(ctx, it.cfg, it.t, it.spin);
        ctx.restore();
      }
    }
    if (ml === lane && !monsterOnTop) drawM();
    if (pl === lane) drawPlayer(R, px);
  }
  if (monsterOnTop) drawM();

  // particles
  for (const p of R.parts) {
    const x = p.screen ? p.x : p.x - camX, a = clamp(p.life / p.max, 0, 1);
    ctx.globalAlpha = p.type === 'conf' ? 1 : a;
    if (p.type === 'star') star(ctx, x, p.y, p.r, p.c, p.rot);
    else if (p.type === 'conf') { ctx.save(); ctx.translate(x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c; ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore(); }
    else if (p.type === 'line') line(ctx, [[x, p.y], [x + 40, p.y]], 3, 'rgba(255,255,255,.8)');
    else { ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(x, p.y, p.r, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
  }

  drawWeather(ctx, R.th, G.W, camX, R.t, G.offY);

  for (const tx of R.texts) {
    const a = tx.life / tx.max, pop = 1 + Math.max(0, (a - 0.85) * 3);
    bigText(ctx, tx.txt, tx.x, tx.y, (tx.big ? 76 : 40) * pop, tx.c, Math.min(1, a * 3));
  }

  if (R.phase === 'countdown') {
    const n = Math.ceil(R.cd);
    if (n <= 3) { const f = R.cd - Math.floor(R.cd); bigText(ctx, String(n), G.W / 2, 190, 120 * (1 + f * 0.4), '#fff'); }
  } else if (R.goT > 0) bigText(ctx, 'GO!', G.W / 2, 190, 130 * (1 + R.goT * 0.3), '#38c76a', R.goT * 2);

  ctx.restore();
}

function renderDemo(dt) {
  const th = THEMES[G.demoTheme] || THEMES.dirt;
  G.demoX += 190 * dt;
  const px = Math.max(320, G.W * 0.58), camX = G.demoX - px;
  drawScene(ctx, th, G.W, camX, G.time, G.offY);
  const gy = LANE_GROUND[1], s = LANE_SCALE[1];
  ell(ctx, px, gy, 50 * s, 8 * s, 'rgba(0,0,0,.2)', 0);
  ctx.save(); ctx.translate(px, gy + Math.sin(G.time * 28) * 1.1); ctx.scale(s, s);
  drawRig(ctx, G.cfg, G.time, G.demoX / 16); ctx.restore();
  ctx.save(); ctx.translate(px - 230 + Math.sin(G.time * 0.8) * 30, gy + 4); ctx.scale(s * 0.8, s * 0.8); drawMonster(ctx, G.cfg.monster, G.time, 'chase'); ctx.restore();
  drawWeather(ctx, th, G.W, camX, G.time, G.offY);
}

// =============================================================
//  HUD
// =============================================================
function updateHearts() {
  const R = G.race; if (!R) return;
  let h = '';
  for (let i = 0; i < 3; i++) h += i < 3 - R.falls ? '<span>❤️</span>' : '<span class="lost">🤍</span>';
  $('hearts').innerHTML = h;
}
function drawHudIcons() {
  const p = $('pPlayer').getContext('2d');
  p.setTransform(1, 0, 0, 1, 0, 0); p.clearRect(0, 0, 80, 80);
  p.translate(38, 48); p.scale(1.45, 1.45); drawHead(p, G.cfg, 0, 0, 0);
  const m = $('pMonster').getContext('2d');
  m.setTransform(1, 0, 0, 1, 0, 0); m.clearRect(0, 0, 80, 80);
  m.translate(42, 76); m.scale(0.3, 0.3); drawMonster(m, G.cfg.monster, 0.3, 'chase');
}
const boostBtn = $('btnBoost');
function updateHud(R) {
  const p = clamp(R.x / R.L.length, 0, 1);
  const mp = clamp((R.x - R.gap * 4) / R.L.length, 0, 1);
  $('pPlayer').style.left = `calc((100% - 18px) * ${p})`;
  $('pMonster').style.left = `calc((100% - 18px) * ${mp})`;
  boostBtn.style.setProperty('--b', R.boost.toFixed(3));
  boostBtn.classList.toggle('empty', R.boost < 0.05);
  if (R.shownStars !== R.stars) {
    R.shownStars = R.stars; $('starCount').textContent = '⭐ ' + R.stars;
    $('starFill').style.width = (R.bank / STARS_PER_HEART * 100) + '%';
  }
}

// =============================================================
//  CONTROLS
// =============================================================
function laneMove(d) {
  const R = G.race;
  if (!R || R.paused || G.mode !== 'race' || G.screen) return;
  if (R.phase === 'caught' || R.crashT > 0 || R.loop) return;
  const nl = clamp(R.lane + d, 0, 2);
  if (nl !== R.lane) { R.lane = nl; AudioMgr.play('whoosh', 0.55); }
}
function setBoost(on) {
  const R = G.race; if (!R) return;
  if (on && !R.boosting) {
    const onGround = R.jumpT < 0 && !R.loop && R.elev < 5;
    // double-tap and hold boost = WHEELIE
    if (isBoostReady(R) && onGround && R.t - R.lastBoostTap < 0.35) {
      R.wheelie = true; R.wheelT = 0; AudioMgr.play('rev', 0.7);
      addText(R, 'WHEELIE!', '#7dff9a'); announce(R, 'a_wheelie');
    } else if (isBoostReady(R)) AudioMgr.play('rev', 0.4);
    R.lastBoostTap = R.t;
  }
  if (!on) R.wheelie = false;
  R.boosting = on;
  boostBtn.classList.toggle('pressed', on);
}
// JUMP: on the ground = hop over short things; in the air = tap for a flip, double-tap for a barrel roll / kickflip
function jumpPress() {
  const R = G.race;
  if (!R || R.paused || G.mode !== 'race' || G.screen || R.phase !== 'go' || R.crashT > 0 || R.loop) return;
  const now = R.t, left = R.jumpDur - R.jumpT;
  if (R.jumpT >= 0) {
    if (!R.pumped && R.jumpKind !== 'hop' && R.jumpT < 0.22) {
      // tapped JUMP right as you left a ramp / spring / cannon: go even higher and farther!
      R.pumped = true; R.jumpH *= 1.3; R.jumpDur *= 1.15;
      addText(R, 'SUPER JUMP!', '#7dff9a'); AudioMgr.play('jump', 0.5); addLead(R, 10);
    } else if (R.flipT >= 0 && R.flipT < 0.3 && now - R.lastJumpTap < 0.3 && left > 0.2) {
      R.flipT = -1; R.rollT = 0; AudioMgr.play('whoosh', 0.7);     // second tap turns the flip into a roll
    } else if (R.flipT < 0 && R.rollT < 0 && left > 0.15) {
      R.flipT = 0; AudioMgr.play('whoosh', 0.6);
    }
  } else {
    startJump(R, 'hop');      // from the ground, a deck, a bridge or the bumps
  }
  R.lastJumpTap = now;
}
function isBoostReady(R) { return R.phase === 'go' && R.boost > 0.05 && R.crashT <= 0; }

function holdBtn(el, down, up) {
  el.addEventListener('pointerdown', e => {
    e.preventDefault(); AudioMgr.unlock();
    el.classList.add('pressed');
    try { el.setPointerCapture(e.pointerId); } catch (_) { }
    down();
  });
  const end = () => { el.classList.remove('pressed'); if (up) up(); };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('contextmenu', e => e.preventDefault());
}
holdBtn($('btnUp'), () => laneMove(-1));
holdBtn($('btnDown'), () => laneMove(1));
holdBtn(boostBtn, () => setBoost(true), () => setBoost(false));
holdBtn($('btnJump'), () => jumpPress());

// swipe up / down on the track
let swipeY = null;
canvas.addEventListener('pointerdown', e => { swipeY = e.clientY; });
canvas.addEventListener('pointerup', e => {
  if (swipeY === null) return;
  const dy = e.clientY - swipeY; swipeY = null;
  if (Math.abs(dy) > 30) laneMove(dy < 0 ? -1 : 1);
});

const UP_KEYS = ['ArrowUp', 'w', 'W'], DOWN_KEYS = ['ArrowDown', 's', 'S'], BOOST_KEYS = ['Shift', 'ArrowRight', 'd', 'D', 'b', 'B'], JUMP_KEYS = [' ', 'j', 'J', 'Enter'];
addEventListener('keydown', e => {
  AudioMgr.unlock();
  if (G.mode !== 'race' || !G.race || G.screen === 'quiz' || G.screen === 'result') return;
  if (UP_KEYS.includes(e.key)) { e.preventDefault(); if (!e.repeat) laneMove(-1); }
  else if (DOWN_KEYS.includes(e.key)) { e.preventDefault(); if (!e.repeat) laneMove(1); }
  else if (BOOST_KEYS.includes(e.key)) { e.preventDefault(); if (!e.repeat) setBoost(true); }
  else if (JUMP_KEYS.includes(e.key)) { e.preventDefault(); if (!e.repeat) jumpPress(); }
  else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') togglePause();
});
addEventListener('keyup', e => { if (BOOST_KEYS.includes(e.key)) setBoost(false); });
document.addEventListener('pointerdown', () => AudioMgr.unlock(), { capture: true });

// pause
function canPause() { const R = G.race; return R && G.mode === 'race' && !R.ended && (G.screen === null || G.screen === 'pause'); }
function togglePause() {
  if (!canPause()) return;
  const R = G.race;
  if (!R.paused) { R.paused = true; R.boosting = false; show('pause'); AudioMgr.pauseAll(); Speech.stop(); }
  else resume();
}
function resume() {
  const R = G.race; if (!R) return;
  R.paused = false; show(null); AudioMgr.resumeAll(); click();
  if (document.activeElement) document.activeElement.blur();
}
$('btnPause').onclick = () => { click(); togglePause(); };
$('btnResume').onclick = resume;
$('btnRestart').onclick = () => { AudioMgr.resumeAll(); click(); const i = G.levelIdx; G.race = null; beginRace(i); };
$('btnPauseHome').onclick = () => { AudioMgr.resumeAll(); click(); goTitle(); };
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (canPause() && !G.race.paused) togglePause();
    else AudioMgr.pauseAll();
  } else if (!(G.race && G.race.paused)) AudioMgr.resumeAll();
});

// mute
$('btnMute').onclick = () => {
  AudioMgr.unlock();
  AudioMgr.setMuted(!AudioMgr.muted);
  $('btnMute').textContent = AudioMgr.muted ? '🔇' : '🔊';
};

// menu buttons
$('btnPlay').onclick = () => { AudioMgr.unlock(); click(); goCustom(); Speech.say('make_racer', 'Make your racer!'); };
$('btnCustomBack').onclick = () => { click(); goTitle(); };
$('btnReady').onclick = () => { click(); goLevels(); Speech.say('pick_track', 'Pick a track!'); };
$('btnLevelsBack').onclick = () => { click(); goCustom(); };

// =============================================================
//  MAIN LOOP
// =============================================================
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
  if (canvas.width !== Math.round(Math.max(1, innerWidth) * G.dpr)) resize();
  try { step(dt); } catch (e) { console.error(e); }
}
function step(dt) {
  G.time += dt;
  const k = G.dpr * G.scale;
  ctx.setTransform(k, 0, 0, k, 0, k * G.offY);
  if (G.mode === 'race' && G.race) {
    if (!G.race.paused) updateRace(G.race, dt);
    renderRace(G.race);
  } else renderDemo(dt);
  if (G.screen === 'custom') renderPreview();
}

Speech.init();
resize();
goTitle();
requestAnimationFrame(frame);
