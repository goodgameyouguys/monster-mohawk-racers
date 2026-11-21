// =============================================================
//  audio.js — music + sound effects (made with fal.ai) and read-aloud voice
// =============================================================
'use strict';

const SOUND_FILES = ['music_menu', 'music_race', 'music_win', 'music_lose',
  'sfx_jump', 'sfx_crash', 'sfx_boost', 'sfx_mud', 'sfx_cheer', 'sfx_click', 'sfx_rev', 'sfx_whoosh', 'sfx_pop', 'sfx_tada',
  // one engine / rolling sound for each ride, one growl for each monster
  'eng_dirtbike', 'eng_atv', 'eng_skateboard', 'eng_scooter', 'eng_monstertruck', 'eng_gokart', 'eng_unicorn', 'eng_cart', 'eng_rocketbed',
  'mon_mohawk', 'mon_slime', 'mon_dino', 'mon_robot', 'mon_ghost'];

const MUSIC_VOL = { music_menu: 0.38, music_race: 0.34, music_win: 0.55, music_lose: 0.55 };

const AudioMgr = {
  ctx: null, master: null, musicGain: null, sfxGain: null,
  buffers: {}, html: {}, muted: false,
  musicName: null, musicLoop: true, musicNode: null, musicEl: null,
  engineNode: null, engineGain: null, engineEl: null,

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) {
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain(); this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 0.9; this.sfxGain.connect(this.master);
    }
    for (const n of SOUND_FILES) this.load(n);
  },
  load(name) {
    const url = 'audio/' + name + '.mp3';
    const useHtml = () => { const a = new Audio(url); a.preload = 'auto'; this.html[name] = a; };
    if (!this.ctx || location.protocol === 'file:') { useHtml(); return; }
    fetch(url).then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); })
      .then(b => new Promise((res, rej) => this.ctx.decodeAudioData(b, res, rej)))
      .then(buf => {
        this.buffers[name] = buf;
        if (this.musicName === name && !this.musicNode) this.playMusic(name, this.musicLoop, true);
      })
      .catch(useHtml);
  },
  unlock() {
    this.init();
    const kick = () => { if (this.musicName && !this.musicNode && !this.musicEl) this.playMusic(this.musicName, this.musicLoop, true); };
    if (this.ctx && this.ctx.state !== 'running') this.ctx.resume().then(kick).catch(() => { });
    else kick();
  },
  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 1;
    for (const a of Object.values(this.html)) a.muted = m;
    if (this.musicEl) this.musicEl.muted = m;
    if (this.engineEl) this.engineEl.muted = m;
    if (m && 'speechSynthesis' in window) speechSynthesis.cancel();
  },

  play(name, vol = 1, rate = 1) {
    if (this.muted) return;
    rate = Math.min(1, rate);
    if (!name.includes('_')) name = 'sfx_' + name;
    if (this.ctx && this.buffers[name]) {
      const s = this.ctx.createBufferSource(); s.buffer = this.buffers[name]; s.playbackRate.value = rate;
      const g = this.ctx.createGain(); g.gain.value = vol; s.connect(g); g.connect(this.sfxGain); s.start();
    } else if (this.html[name]) {
      const a = this.html[name].cloneNode(); a.volume = Math.min(1, vol); a.play().catch(() => { });
    }
  },

  playMusic(name, loop = true, force = false) {
    if (!force && this.musicName === name && (this.musicNode || this.musicEl)) return;
    this.stopMusic();
    this.musicName = name; this.musicLoop = loop;
    const vol = MUSIC_VOL[name] || 0.4;
    if (this.ctx && this.buffers[name]) {
      if (this.ctx.state !== 'running') return; // will start on unlock
      const s = this.ctx.createBufferSource(); s.buffer = this.buffers[name]; s.loop = loop;
      this.musicGain.gain.value = vol; s.connect(this.musicGain); s.start();
      s.onended = () => { if (this.musicNode === s) this.musicNode = null; };
      this.musicNode = s;
    } else if (this.html[name]) {
      const a = this.html[name]; a.loop = loop; a.volume = vol; a.currentTime = 0; a.muted = this.muted;
      this.musicEl = a;
      a.play().catch(() => { if (this.musicEl === a) this.musicEl = null; });
    }
  },
  stopMusic() {
    if (this.musicNode) { try { this.musicNode.onended = null; this.musicNode.stop(); } catch (e) { } this.musicNode = null; }
    if (this.musicEl) { this.musicEl.pause(); this.musicEl = null; }
    this.musicName = null;
  },
  duck(on) {
    const name = this.musicName, vol = (MUSIC_VOL[name] || 0.4) * (on ? 0.3 : 1);
    if (this.musicGain) this.musicGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.15);
    if (this.musicEl) this.musicEl.volume = vol;
  },

  engineStart(vehicle) {
    this.engineStop();
    const name = 'eng_' + (vehicle || 'dirtbike');
    if (this.ctx && this.buffers[name]) {
      const s = this.ctx.createBufferSource(); s.buffer = this.buffers[name]; s.loop = true;
      const g = this.ctx.createGain(); g.gain.value = 0.3; s.connect(g); g.connect(this.sfxGain); s.start();
      this.engineNode = s; this.engineGain = g;
    } else if (this.html[name]) {
      const a = this.html[name]; a.loop = true; a.volume = 0.3; a.muted = this.muted; a.play().catch(() => { }); this.engineEl = a;
    }
  },
  engineRate(r) {
    r = Math.max(0.8, Math.min(1.12, r));
    if (this.engineNode) this.engineNode.playbackRate.setTargetAtTime(r, this.ctx.currentTime, 0.1);
    if (this.engineEl) this.engineEl.playbackRate = Math.max(0.5, Math.min(2, r));
  },
  engineStop() {
    if (this.engineNode) { try { this.engineNode.stop(); } catch (e) { } this.engineNode = null; }
    if (this.engineEl) { this.engineEl.pause(); this.engineEl = null; }
  },
  pauseAll() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); if (this.musicEl) this.musicEl.pause(); if (this.engineEl) this.engineEl.pause(); },
  resumeAll() { if (this.ctx) this.ctx.resume(); if (this.musicEl) this.musicEl.play().catch(() => { }); if (this.engineEl) this.engineEl.play().catch(() => { }); },
};

// ---------- read-aloud: a southern racer voice (made with fal.ai MiniMax voice design) ----------
// Clips live in audio/voice/<key>.mp3. If a clip can't play, the browser's own voice reads the text instead.
const Speech = {
  voice: null, buf: {}, node: null, el: null, token: 0,
  ok: 'speechSynthesis' in window,
  init() {
    if (!this.ok) return;
    const choose = () => {
      const vs = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang));
      this.voice = vs.find(v => /en-US/i.test(v.lang) && /male|fred|alex|daniel/i.test(v.name)) || vs.find(v => /en-US/i.test(v.lang)) || vs[0] || null;
    };
    choose(); speechSynthesis.onvoiceschanged = choose;
  },
  // key = clip name, text = what it says (used only if the clip can't play)
  say(key, text = '', force = false) {
    if (AudioMgr.muted && !force) return;
    this.stop();
    const my = ++this.token, ctx = AudioMgr.ctx;
    const go = b => {
      if (my !== this.token) return;
      if (ctx.state !== 'running') ctx.resume();
      const s = ctx.createBufferSource(); s.buffer = b;
      const g = ctx.createGain(); g.gain.value = 1.15; s.connect(g); g.connect(force ? ctx.destination : AudioMgr.master);
      AudioMgr.duck(true);
      s.onended = () => { if (this.node === s) { this.node = null; AudioMgr.duck(false); } };
      s.start(); this.node = s;
    };
    if (ctx && location.protocol !== 'file:') {
      if (this.buf[key]) return go(this.buf[key]);
      fetch('audio/voice/' + key + '.mp3').then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); })
        .then(ab => new Promise((res, rej) => ctx.decodeAudioData(ab, res, rej)))
        .then(b => { this.buf[key] = b; go(b); })
        .catch(() => this.html(key, text, my));
    } else this.html(key, text, my);
  },
  html(key, text, my) {
    if (my !== this.token) return;
    const a = new Audio('audio/voice/' + key + '.mp3'); this.el = a;
    AudioMgr.duck(true);
    a.onended = () => { if (this.el === a) { this.el = null; AudioMgr.duck(false); } };
    a.play().catch(() => { if (this.el === a) this.el = null; this.tts(text); });
  },
  tts(text) {
    if (!this.ok || !text) { AudioMgr.duck(false); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[^\p{L}\p{N}\s.,!?'"-]/gu, ''));
    if (this.voice) u.voice = this.voice;
    u.rate = 0.9; u.pitch = 0.9;
    u.onstart = () => AudioMgr.duck(true);
    u.onend = u.onerror = () => AudioMgr.duck(false);
    speechSynthesis.speak(u);
  },
  busy() { return !!(this.node || this.el); },
  stop() {
    this.token++;
    if (this.node) { try { this.node.onended = null; this.node.stop(); } catch (e) { } this.node = null; }
    if (this.el) { this.el.pause(); this.el = null; }
    if (this.ok) speechSynthesis.cancel();
    AudioMgr.duck(false);
  },
};
