// 戦闘演出モジュール（第88節：戦闘演出フルセット／映像＋音）
// 役割: バトルの「見せ方」と「音」だけを担当する。バトル計算・勝敗・セーブには一切関与しない。
// 集約ポイント: 演出の有無・音の有無・音量・タイプライター速度はすべてこのファイルの cfg で調整する。
// 設定は localStorage の専用キー（kakutogi_fx_v1）に保存し、ゲームのセーブデータとは分離する。
// ?autotest=1 のときは全ての待ち時間を 0 にし、演出が自動プレイ検証を止めないようにする。
// WebAudio／WAAPI が無い環境（旧ブラウザ・検証用DOM等）では各演出が静かに無効化され、進行に影響しない。
"use strict";

const FX = (() => {
  const SETTINGS_KEY = "kakutogi_fx_v1";
  const cfg = { enabled: true, sound: true, volume: 0.5, typeSpeed: 12 }; // typeSpeed: 1文字あたりms
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    if (saved && typeof saved === "object") for (const k in cfg) if (typeof saved[k] === typeof cfg[k]) cfg[k] = saved[k];
  } catch (e) { /* 設定が壊れていても既定値で動く */ }
  const isAutoTest = (() => { try { return new URLSearchParams(location.search).has("autotest"); } catch (e) { return false; } })();
  let fast = isAutoTest;
  const evLog = [];
  function log(kind, detail){
    evLog.push({ kind, detail: detail || null, at: Date.now() });
    if (evLog.length > 300) evLog.shift();
  }
  function persist(){ try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(cfg)); } catch (e) {} }
  const scale = ms => fast ? 0 : ms;

  // ---------- スタイル（このモジュールに集約。index.html の既存CSSは変更しない） ----------
  const CSS = `
.bar{ position:relative; }
.bar i.fx-ghost{ position:absolute; left:0; top:0; z-index:0; background:#efe9d6; opacity:.6; transition:width .9s ease .30s; }
.bar i.fx-fill{ position:relative; z-index:1; transition:width .18s ease; }
#fx-flash{ position:fixed; inset:0; pointer-events:none; z-index:900; opacity:0; }
#fx-layer{ position:fixed; inset:0; pointer-events:none; z-index:950; overflow:hidden; }
.fx-dmg{ position:absolute; transform:translate(-50%,0); font-weight:bold; font-size:1.15em; color:#fff;
  text-shadow:0 0 4px #000,0 2px 3px rgba(0,0,0,.8); white-space:nowrap; }
.fx-dmg.big{ color:#ffd94d; font-size:1.8em; letter-spacing:.04em; }
.fx-dmg.taken{ color:#ff9d9d; }
.fx-dmg.miss{ color:#b9c2d8; font-size:.95em; }
.fx-dmg.heal{ color:#9fe8a9; }
#fx-cutin{ position:fixed; inset:0; z-index:980; pointer-events:none; display:flex; align-items:center; justify-content:center; gap:4vw;
  background:linear-gradient(100deg, rgba(4,6,14,.94) 30%, rgba(4,6,14,.78)); }
#fx-cutin img{ max-height:74vh; max-width:52vw; object-fit:contain; }
#fx-cutin .fx-cutin-txt{ color:var(--gold,#c9a44a); }
#fx-cutin .fx-cutin-name{ font-size:1.05em; color:#e8e6df; letter-spacing:.3em; margin-bottom:10px; }
#fx-cutin .fx-cutin-tech{ font-size:2.3em; font-weight:bold; letter-spacing:.1em; line-height:1.35;
  text-shadow:0 0 18px rgba(201,164,74,.55), 0 3px 6px rgba(0,0,0,.9); }
#fx-ko{ position:fixed; inset:0; z-index:990; display:flex; align-items:center; justify-content:center;
  background:rgba(4,6,14,.55); }
#fx-ko .fx-ko-txt{ font-size:3.2em; font-weight:bold; color:#ffd94d; letter-spacing:.14em;
  text-shadow:0 0 24px rgba(201,164,74,.7), 0 4px 10px rgba(0,0,0,.95); }
#fx-ko.lose .fx-ko-txt{ color:#e8e6df; text-shadow:0 4px 10px rgba(0,0,0,.95); }
`;
  let layer = null, flashEl = null;
  function ensureDom(){
    if (layer || typeof document === "undefined" || !document.body) return;
    const st = document.createElement("style"); st.id = "fx-style"; st.textContent = CSS;
    document.head.appendChild(st);
    flashEl = document.createElement("div"); flashEl.id = "fx-flash"; document.body.appendChild(flashEl);
    layer = document.createElement("div"); layer.id = "fx-layer"; document.body.appendChild(layer);
    injectButtons();
    log("init", { enabled: cfg.enabled, sound: cfg.sound, fast });
  }
  function injectButtons(){
    const nav = document.querySelector(".navrow");
    if (!nav || document.getElementById("fx-btn-sound")) return;
    const mk = (id, label, fn) => {
      const b = document.createElement("button");
      b.className = "btn ghost"; b.id = id; b.textContent = label;
      b.addEventListener("click", () => { fn(); refreshButtons(); });
      nav.appendChild(b); return b;
    };
    mk("fx-btn-sound", "", () => { cfg.sound = !cfg.sound; persist(); if (cfg.sound) se("guard"); });
    mk("fx-btn-vis", "", () => { cfg.enabled = !cfg.enabled; persist(); });
    refreshButtons();
  }
  function refreshButtons(){
    const s = document.getElementById("fx-btn-sound"); if (s) s.textContent = cfg.sound ? "🔊 音：ON" : "🔇 音：OFF";
    const v = document.getElementById("fx-btn-vis"); if (v) v.textContent = cfg.enabled ? "🎬 演出：ON" : "🎬 演出：OFF";
  }

  // ---------- 音（WebAudio生成。ファイル不要） ----------
  let AC = null, master = null, noiseBuf = null;
  function ac(){
    if (!cfg.sound) return null;
    try {
      if (AC){ if (AC.state === "suspended") AC.resume(); return AC; }
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      AC = new Ctor();
      master = AC.createGain(); master.gain.value = Math.max(0, Math.min(1, cfg.volume)) * 0.6;
      master.connect(AC.destination);
      noiseBuf = AC.createBuffer(1, AC.sampleRate * 1.5, AC.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return AC;
    } catch (e) { return null; }
  }
  // 自動再生ポリシー対応: 最初のユーザー操作で AudioContext を生成・再開する
  if (typeof window !== "undefined" && window.addEventListener){
    const unlock = () => { ac(); };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
  }
  function env(g, t, peak, dur){
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  function tone(freqA, freqB, type, dur, peak, delay){
    const c = ac(); if (!c) return;
    try {
      const t = c.currentTime + (delay || 0);
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(freqA, t);
      if (freqB) o.frequency.exponentialRampToValueAtTime(Math.max(freqB, 1), t + dur);
      env(g, t, peak, dur);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
    } catch (e) {}
  }
  function noise(dur, peak, filterType, fA, fB, delay, q){
    const c = ac(); if (!c || !noiseBuf) return;
    try {
      const t = c.currentTime + (delay || 0);
      const src = c.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      src.playbackRate.value = 0.85 + Math.random() * 0.3;
      const f = c.createBiquadFilter(); f.type = filterType; f.Q.value = q || 0.9;
      f.frequency.setValueAtTime(fA, t);
      if (fB) f.frequency.exponentialRampToValueAtTime(Math.max(fB, 10), t + dur);
      const g = c.createGain(); env(g, t, peak, dur);
      src.connect(f); f.connect(g); g.connect(master);
      src.start(t); src.stop(t + dur + 0.05);
    } catch (e) {}
  }
  function se(kind){
    log("se", kind);
    if (!cfg.sound || fast) return; // テスト時は音を出さない（ログだけ残す）
    switch (kind){
      case "hitLight": noise(0.07, 0.5, "bandpass", 900, 500); tone(160, 70, "sine", 0.09, 0.5); break;
      case "hitHeavy": noise(0.16, 0.8, "lowpass", 900, 200); tone(120, 45, "sine", 0.2, 0.9); tone(70, 38, "triangle", 0.22, 0.6); break;
      case "hurt": noise(0.1, 0.55, "bandpass", 600, 300); tone(130, 60, "sine", 0.13, 0.65); break;
      case "guard": tone(2100, 1700, "square", 0.05, 0.16); noise(0.05, 0.25, "highpass", 2500, 2500); break;
      case "whiff": noise(0.13, 0.22, "bandpass", 1300, 320); break;
      case "gong":
        [156, 208, 263, 349, 415].forEach((f, i) => tone(f, f * 0.99, "sine", 1.5, 0.34 - i * 0.05));
        noise(0.05, 0.3, "highpass", 3000, 3000); break;
      case "crowd":
        noise(1.5, 0.5, "bandpass", 700, 500, 0, 0.6);
        noise(1.1, 0.3, "bandpass", 1000, 800, 0.15, 0.7); break;
    }
  }

  // ---------- 映像ユーティリティ ----------
  function animate(el, frames, opts){
    if (!el) return;
    if (el.animate && !fast){ try { el.animate(frames, opts); return; } catch (e) {} }
  }
  function shake(el, power){
    if (!el || !cfg.enabled) return;
    const px = Math.max(2, Math.min(11, power)) * (cfg.enabled ? 1 : 0);
    log("shake", Math.round(px));
    animate(el, [
      { transform: "translate(0,0)" },
      { transform: "translate(" + (-px) + "px," + Math.round(px * 0.35) + "px)" },
      { transform: "translate(" + px * 0.8 + "px," + Math.round(-px * 0.25) + "px)" },
      { transform: "translate(" + (-px * 0.45) + "px,0)" },
      { transform: "translate(0,0)" },
    ], { duration: 250, easing: "ease-out" });
  }
  function flash(kind){
    ensureDom(); if (!flashEl || !cfg.enabled) return;
    const color = kind === "taken" ? "rgba(190,40,55,.85)" : "rgba(255,240,200,.75)";
    flashEl.style.background = "radial-gradient(ellipse at center, transparent 52%, " + color + " 135%)";
    log("flash", kind);
    if (flashEl.animate && !fast){
      try { flashEl.animate([{ opacity: 0 }, { opacity: 0.55, offset: 0.18 }, { opacity: 0 }], { duration: 300, easing: "ease-out" }); return; } catch (e) {}
    }
    flashEl.style.opacity = "0"; // フォールバック: 表示しない（進行に影響なし）
  }
  function popup(targetEl, text, cls){
    ensureDom(); log("popup", text + (cls ? ":" + cls : ""));
    if (!layer || !targetEl || !cfg.enabled || fast) return;
    try {
      while (layer.children.length >= 8) layer.firstChild.remove();
      const r = targetEl.getBoundingClientRect();
      if (!r.width && !r.height) return;
      const el = document.createElement("div");
      el.className = "fx-dmg" + (cls ? " " + cls : "");
      el.textContent = text;
      el.style.left = (r.left + r.width / 2 + (Math.random() * 36 - 18)) + "px";
      el.style.top = (r.top + 10) + "px";
      layer.appendChild(el);
      const big = cls && cls.includes("big");
      if (el.animate){
        el.animate([
          { transform: "translate(-50%,6px) scale(.7)", opacity: 0 },
          { transform: "translate(-50%,-6px) scale(" + (big ? 1.25 : 1.05) + ")", opacity: 1, offset: 0.25 },
          { transform: "translate(-50%,-46px) scale(1)", opacity: 0 },
        ], { duration: 780, easing: "ease-out" });
      }
      setTimeout(() => { try { el.remove(); } catch (e) {} }, 850);
    } catch (e) {}
  }

  // ---------- バトル連携API（game.js から呼ばれる） ----------
  function battleStart(){
    ensureDom(); log("battleStart");
    se("gong");
  }
  // 自分が敵に与えたヒット。kind: normal|sig|combo|ougi|foul / ratio: 相手最大HP比
  function playerHit(o){
    ensureDom();
    const enemy = document.querySelector(".fighter.enemy") || document.querySelectorAll(".fighter")[1];
    const battle = document.querySelector(".battle");
    if (o.missed){ se("whiff"); popup(enemy, "ミス！", "miss"); return; }
    const big = o.kind === "sig" || o.kind === "combo" || o.kind === "ougi";
    se(big || o.ratio >= 0.16 ? "hitHeavy" : "hitLight");
    popup(enemy, "-" + o.dmg, big ? "big" : "");
    flash("dealt");
    shake(enemy, 3 + o.ratio * 34);
    if (big || o.ratio >= 0.2) shake(battle, 4 + o.ratio * 20);
  }
  // 敵から受けたヒット。guarded: 「読む」で半減した場合はガード音
  function playerHurt(o){
    ensureDom();
    const me = document.querySelectorAll(".fighter")[0];
    if (o.guarded){ se("guard"); popup(me, "-" + o.dmg + "（読んで半減）", "taken"); }
    else { se(o.ratio >= 0.16 ? "hitHeavy" : "hurt"); popup(me, "-" + o.dmg, "taken"); }
    flash("taken");
    shake(me, 3 + o.ratio * 30);
  }
  function heal(o){
    const me = document.querySelectorAll(".fighter")[0];
    popup(me, "+" + o.amount, "heal");
  }
  // 奥義カットイン（暗転＋設定画＋技名）。進行は止めない（pointer-events:none）
  function cutin(o){
    ensureDom(); log("cutin", o.text);
    se("gong");
    if (!cfg.enabled || fast) return;
    try {
      const old = document.getElementById("fx-cutin"); if (old) old.remove();
      const el = document.createElement("div"); el.id = "fx-cutin";
      el.innerHTML = '<img src="../cast-art/cast-' + o.img + '-sera.webp" alt="">' +
        '<div class="fx-cutin-txt"><div class="fx-cutin-name">' + (o.name || "") + '</div><div class="fx-cutin-tech">' + (o.text || "") + "</div></div>";
      document.body.appendChild(el);
      if (el.animate){
        el.animate([{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: 1300, easing: "ease-out" });
        const img = el.querySelector("img");
        if (img && img.animate) img.animate([{ transform: "translateX(-26px)" }, { transform: "translateX(0)" }], { duration: 380, easing: "ease-out" });
        const tx = el.querySelector(".fx-cutin-tech");
        if (tx && tx.animate) tx.animate([{ transform: "scale(1.35)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }], { duration: 300, delay: 110, easing: "ease-out" });
      }
      setTimeout(() => { try { el.remove(); } catch (e) {} }, 1350);
    } catch (e) {}
  }
  // 決着の溜め: 静止→大きく結果表示→少し置いて done()。テスト時は即 done()
  function battleEnd(win, text, done){
    ensureDom(); log("battleEnd", text);
    se("gong"); if (win) se("crowd");
    if (!cfg.enabled || fast){ done(); return; }
    try {
      const old = document.getElementById("fx-ko"); if (old) old.remove();
      const el = document.createElement("div"); el.id = "fx-ko"; if (!win) el.className = "lose";
      el.innerHTML = '<div class="fx-ko-txt">' + text + "</div>";
      document.body.appendChild(el);
      if (el.animate) el.animate([{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 1, offset: 0.78 }, { opacity: 0 }], { duration: 1000, easing: "ease-out" });
      const tx = el.querySelector(".fx-ko-txt");
      if (tx && tx.animate) tx.animate([{ transform: "scale(1.6)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }], { duration: 260, delay: 120, easing: "cubic-bezier(.2,1.6,.4,1)" });
      setTimeout(() => { try { el.remove(); } catch (e) {} done(); }, 980);
    } catch (e) { done(); }
  }
  // HPバーの残像: renderBattle が data-to（目標%）付きで置いた .fx-ghost を遅れて追随させる
  function applyGhosts(root){
    if (!root) return;
    root.querySelectorAll(".fx-ghost").forEach(g => {
      const to = g.getAttribute("data-to");
      if (to == null) return;
      if (!cfg.enabled || fast){ g.style.transition = "none"; g.style.width = to + "%"; return; }
      requestAnimationFrame(() => requestAnimationFrame(() => { g.style.width = to + "%"; }));
    });
  }
  // ---------- タイプライター（バトルログの最新エントリ） ----------
  let typing = null; // {node, full, idx, timer}
  function stopTyping(complete){
    if (!typing) return;
    clearInterval(typing.timer);
    if (complete && typing.node && typing.node.isConnected) typing.node.nodeValue = typing.full;
    typing = null;
  }
  function typeLastLog(){
    stopTyping(false);
    const blog = document.querySelector(".battle .blog");
    if (!blog) return;
    const entries = blog.querySelectorAll(".bl");
    if (!entries.length) return;
    const last = entries[entries.length - 1];
    const node = last.childNodes[last.childNodes.length - 1];
    if (!node || node.nodeType !== 3) return;
    const full = node.nodeValue || "";
    log("type", full.slice(0, 24));
    if (!cfg.enabled || fast || !full){ return; }
    const chars = Array.from(full);
    const per = Math.max(4, Math.min(cfg.typeSpeed, Math.floor(850 / Math.max(chars.length, 1)) || cfg.typeSpeed));
    node.nodeValue = "";
    let idx = 0;
    const session = { node, full, timer: null };
    session.timer = setInterval(() => {
      if (!node.isConnected){ stopTyping(false); return; }
      idx += 2;
      node.nodeValue = chars.slice(0, idx).join("");
      blog.scrollTop = blog.scrollHeight;
      if (idx >= chars.length) stopTyping(false);
    }, per);
    typing = session;
  }
  if (typeof document !== "undefined" && document.addEventListener){
    document.addEventListener("click", e => {
      if (typing && e.target && e.target.closest && e.target.closest(".blog")) stopTyping(true);
    });
  }

  if (typeof document !== "undefined"){
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ensureDom);
    else ensureDom();
  }
  return {
    cfg, battleStart, battleEnd, playerHit, playerHurt, heal, cutin, applyGhosts, typeLastLog,
    se, log, events: () => evLog.slice(),
    setFast: v => { fast = !!v; },
    isFast: () => fast,
    refreshButtons,
  };
})();

window.FX = FX;
