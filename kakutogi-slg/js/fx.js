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
.fx-dmg.crit{ color:#ff6a5e; font-size:2.05em; letter-spacing:.05em; }
.fx-trail{ position:absolute; height:3px; border-radius:2px; pointer-events:none; }
#fx-focus{ position:fixed; inset:-12%; pointer-events:none; z-index:940; opacity:0;
  background:repeating-conic-gradient(from 0deg at 50% 50%, rgba(0,0,0,.34) 0deg 1.1deg, transparent 1.1deg 7deg);
  -webkit-mask-image:radial-gradient(circle at 50% 50%, transparent 26%, #000 78%);
  mask-image:radial-gradient(circle at 50% 50%, transparent 26%, #000 78%); }
.bar.fx-low i.fx-fill{ background:#ff5252; animation:fx-lowblink .55s linear infinite; }
@keyframes fx-lowblink{ 0%,49%{ opacity:1; } 50%,100%{ opacity:.3; } }
body.fx-ougi .battle{ background:radial-gradient(ellipse at 50% 22%, rgba(201,164,74,.28), rgba(201,164,74,.05) 55%, transparent 78%); animation:fx-ougipulse 1.3s ease-out; }
@keyframes fx-ougipulse{ 0%{ filter:brightness(1.22) saturate(1.25); } 100%{ filter:brightness(1) saturate(1); } }
body.fx-hitstop .battle{ filter:saturate(1.18) contrast(1.06); }
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

  // ---------- 第100節A: 系統別プロファイル（手技／足技／投げ・組み／寝技・関節／反則） ----------
  const SYS_FX = {
    strike:  { rgb: "255,214,110", angle: -32, dir: [1, 0.45] },
    kick:    { rgb: "140,200,255", angle: -6,  dir: [1, 0.08] },
    grapple: { rgb: "255,160,90",  angle: 18,  dir: [0.35, 1] },
    ground:  { rgb: "190,140,255", angle: 52,  dir: [0.55, 0.8] },
    foul:    { rgb: "255,70,95",   angle: -45, dir: [1, 0.6] },
    special: { rgb: "255,233,160", angle: -20, dir: [1, 0.35] },
  };
  function sysProfile(sys){ return SYS_FX[sys] || SYS_FX.special; }
  // 系統別の効果音（既存の tone/noise プリミティブで合成。音OFF・テスト時は鳴らさない）
  function seSys(sys, heavy){
    log("seSys", sys + (heavy ? ":heavy" : ""));
    if (!cfg.sound || fast) return;
    switch (sys){
      case "strike": noise(0.06, 0.55, "bandpass", 1500, 800); tone(200, 90, "sine", 0.08, 0.55); if (heavy) tone(110, 45, "sine", 0.18, 0.8); break;
      case "kick": noise(0.14, 0.3, "bandpass", 1100, 300); noise(0.1, 0.6, "lowpass", 700, 180, 0.05); tone(95, 42, "sine", 0.16, 0.8, 0.05); break;
      case "grapple": noise(0.2, 0.5, "lowpass", 500, 150); noise(0.08, 0.3, "bandpass", 400, 250, 0.02); tone(80, 36, "triangle", 0.24, 0.7, 0.06); break;
      case "ground": tone(140, 55, "sawtooth", 0.3, 0.22); noise(0.28, 0.3, "lowpass", 350, 120); if (heavy) tone(65, 32, "sine", 0.3, 0.7, 0.05); break;
      case "foul": tone(620, 590, "square", 0.16, 0.2); tone(466, 440, "square", 0.16, 0.2); noise(0.12, 0.4, "highpass", 2400, 2400); break;
      default: noise(0.08, 0.5, "bandpass", 1000, 500); tone(150, 60, "sine", 0.12, 0.6); break;
    }
  }
  function seCrit(){
    log("seSys", "crit");
    if (!cfg.sound || fast) return;
    tone(1560, 1560, "triangle", 0.1, 0.3); tone(2340, 2340, "triangle", 0.14, 0.22, 0.03);
    noise(0.16, 0.75, "lowpass", 900, 200, 0.02); tone(105, 40, "sine", 0.22, 0.9, 0.02);
  }
  function seSlowmo(){
    log("seSys", "slowmo");
    if (!cfg.sound || fast) return;
    tone(58, 29, "sine", 0.85, 0.95); noise(0.8, 0.3, "lowpass", 300, 90);
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
  function flash(kind, rgb){
    ensureDom(); if (!flashEl || !cfg.enabled) return;
    const color = rgb ? "rgba(" + rgb + ",.9)" : (kind === "taken" ? "rgba(190,40,55,.85)" : "rgba(255,240,200,.75)");
    flashEl.style.background = "radial-gradient(ellipse at center, transparent 52%, " + color + " 135%)";
    log("flash", kind);
    if (flashEl.animate && !fast){
      try { flashEl.animate([{ opacity: 0 }, { opacity: 0.55, offset: 0.18 }, { opacity: 0 }], { duration: 300, easing: "ease-out" }); return; } catch (e) {}
    }
    flashEl.style.opacity = "0"; // フォールバック: 表示しない（進行に影響なし）
  }
  // 方向つきシェイク（第100節A: 系統ごとに揺れる方向と間合いを変える）
  function shakeDir(el, power, sys){
    if (!el || !cfg.enabled) return;
    const p = sysProfile(sys), px = Math.max(2, Math.min(12, power));
    const dx = p.dir[0] * px, dy = p.dir[1] * px;
    log("shakeDir", sys + ":" + Math.round(px));
    animate(el, [
      { transform: "translate(0,0)" },
      { transform: "translate(" + (-dx) + "px," + (-dy) + "px)" },
      { transform: "translate(" + (dx * 0.75) + "px," + (dy * 0.75) + "px)" },
      { transform: "translate(" + (-dx * 0.4) + "px," + (-dy * 0.4) + "px)" },
      { transform: "translate(0,0)" },
    ], { duration: sys === "ground" ? 340 : 250, easing: "ease-out" });
  }
  // 技の軌跡ライン（第100節A）: 防御側の表示位置に系統色のスワイプ線を一瞬走らせる
  function trail(targetEl, sys){
    ensureDom(); log("trail", sys);
    if (!layer || !targetEl || !cfg.enabled || fast) return;
    try {
      const r = targetEl.getBoundingClientRect();
      if (!r.width && !r.height) return;
      const p = sysProfile(sys);
      const mk = (dy, ang, w) => {
        const el = document.createElement("div");
        el.className = "fx-trail";
        el.style.width = w + "px";
        el.style.left = (r.left + r.width / 2 - w / 2) + "px";
        el.style.top = (r.top + r.height / 2 + dy) + "px";
        el.style.background = "linear-gradient(90deg, transparent, rgba(" + p.rgb + ",.95) 50%, transparent)";
        el.style.boxShadow = "0 0 8px rgba(" + p.rgb + ",.8)";
        layer.appendChild(el);
        if (el.animate){
          el.animate([
            { transform: "rotate(" + ang + "deg) translateX(-46px)", opacity: 0 },
            { transform: "rotate(" + ang + "deg) translateX(0)", opacity: 1, offset: 0.3 },
            { transform: "rotate(" + ang + "deg) translateX(52px)", opacity: 0 },
          ], { duration: 240, easing: "ease-out" });
        }
        setTimeout(() => { try { el.remove(); } catch (e) {} }, 300);
      };
      mk(0, p.angle, Math.min(190, Math.max(110, r.width * 0.7)));
      if (sys === "grapple") mk(14, -p.angle * 0.6, 130); // 投げ・組みは交差する2本線
    } catch (e) {}
  }
  // 大ダメージ専用の画面効果（第100節B）: 集中線で周囲を落とす
  let focusEl = null;
  function bigFx(){
    ensureDom(); log("bigfx");
    if (!cfg.enabled || fast) return;
    try {
      if (!focusEl){ focusEl = document.createElement("div"); focusEl.id = "fx-focus"; document.body.appendChild(focusEl); }
      if (focusEl.animate) focusEl.animate([{ opacity: 0 }, { opacity: 0.85, offset: 0.25 }, { opacity: 0 }], { duration: 420, easing: "ease-out" });
    } catch (e) {}
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
  // ---------- 第100節: 段階演出（衝撃は即時／キャラの動きは描画直後） ----------
  // battleTurn は同期処理で、終わりに renderBattle がDOMを差し替える。そのため音・光・軌跡・数字は
  // 呼び出し時点で即時に出し、立ち絵の出・のけぞりは pendingImpacts に積んで applyStage（描画直後）で当てる。
  let pendingImpacts = []; // {side, sys, big, crit, ratio, hitStop} のキュー（1ターンに自分の攻撃＋敵の反撃の2回分たまる）
  let slowmoArmed = false;  // 決着の一撃が入った印（battleEnd でスローモーションへ）
  function hitStopMs(o){
    if (o.crit || o.kind === "ougi") return 120;
    if (o.big || o.ratio >= 0.16) return 90;
    if (o.sys === "grapple" || o.sys === "ground") return 80;
    return 50;
  }
  // 自分が敵に与えたヒット。kind: normal|sig|combo|ougi|foul / ratio: 相手最大HP比
  // sys: 攻撃系統（第100節A） / read: 「読む」の的中 / killing: この一撃で決着（第100節B）
  function playerHit(o){
    ensureDom();
    const enemy = document.querySelector(".fighter.enemy") || document.querySelectorAll(".fighter")[1];
    const sys = o.sys || (o.kind === "foul" ? "foul" : "strike");
    if (o.missed){ se("whiff"); trail(enemy, sys); popup(enemy, "ミス！", "miss"); log("syshit", sys + ":miss"); return; }
    const big = o.kind === "sig" || o.kind === "combo" || o.kind === "ougi";
    // 会心は新しい判定を作らず、既存の強調条件（看板技・複合技・奥義／読みの的中／大ダメージ）に接続する
    const crit = !!(o.read || big || o.ratio >= 0.25);
    log("syshit", sys + (crit ? ":crit" : ""));
    seSys(sys, big || o.ratio >= 0.16);
    if (crit) seCrit();
    popup(enemy, crit ? "会心 -" + o.dmg : "-" + o.dmg, crit ? "big crit" : (big ? "big" : ""));
    flash("dealt", sysProfile(sys).rgb);
    trail(enemy, sys);
    if (big || o.ratio >= 0.2) bigFx();
    if (o.killing) slowmoArmed = true;
    const imp = { side: "enemy", sys, big, crit, ratio: o.ratio || 0, hitStop: hitStopMs({ crit, kind: o.kind, big, ratio: o.ratio || 0, sys }) };
    pendingImpacts.push(imp);
    log("hitstop", imp.hitStop);
  }
  // 敵から受けたヒット。guarded: 「読む」で半減した場合はガード音 / sys: 敵の攻撃系統
  function playerHurt(o){
    ensureDom();
    const me = document.querySelectorAll(".fighter")[0];
    const sys = o.sys || "strike";
    log("syshit", sys + ":taken");
    if (o.guarded){ se("guard"); popup(me, "-" + o.dmg + "（読んで半減）", "taken"); }
    else { seSys(sys, o.ratio >= 0.16); popup(me, "-" + o.dmg, "taken"); }
    flash("taken");
    trail(me, sys);
    if (o.ratio >= 0.2) bigFx();
    if (o.killing) slowmoArmed = true;
    const imp = { side: "player", sys, big: o.ratio >= 0.2, crit: false, ratio: o.ratio || 0, hitStop: hitStopMs({ crit: false, kind: "normal", big: o.ratio >= 0.2, ratio: o.ratio || 0, sys }) };
    pendingImpacts.push(imp);
    log("hitstop", imp.hitStop);
  }
  // 描画直後に保留中の衝撃を新しいDOMへ当てる（第100節A/C: ヒットストップ→攻撃側が出て、被弾側がのけぞる）
  // 1ターンに2回分の衝撃（自分の攻撃＋敵の反撃）がたまるため、キューを順番に再生する
  function applyStage(){
    const imps = pendingImpacts; pendingImpacts = [];
    if (!imps.length || !cfg.enabled || fast) return;
    try { document.body.classList.add("fx-hitstop"); } catch (e) {}
    let delay = 0;
    imps.forEach((imp, idx) => {
      delay += imp.hitStop;
      const at = delay, last = idx === imps.length - 1;
      setTimeout(() => {
        if (last) try { document.body.classList.remove("fx-hitstop"); } catch (e) {}
        if (!document.querySelector(".battle")) return; // すでに画面が切り替わっていたら再生しない
        const me = document.querySelectorAll(".fighter")[0];
        const enemy = document.querySelector(".fighter.enemy") || document.querySelectorAll(".fighter")[1];
        const portrait = document.querySelector(".portrait");
        const battle = document.querySelector(".battle");
        const dirSign = imp.side === "enemy" ? 1 : -1; // プレイヤーは左、敵は右にいる
        const atkEls = imp.side === "enemy" ? [me] : [enemy, portrait];
        const defEls = imp.side === "enemy" ? [enemy, portrait] : [me];
        log("stage", imp.sys + ":" + imp.side);
        atkEls.forEach(el => { if (el) animate(el, [
          { transform: "translateX(0)" },
          { transform: "translateX(" + (dirSign * 16) + "px)", offset: 0.35 },
          { transform: "translateX(0)" },
        ], { duration: 260, easing: "ease-out" }); });
        defEls.forEach(el => { if (el) animate(el, [
          { transform: "translateX(0) rotate(0deg)" },
          { transform: "translateX(" + (dirSign * (imp.crit ? 15 : 10)) + "px) rotate(" + (dirSign * 1.2) + "deg)", offset: 0.3 },
          { transform: "translateX(0) rotate(0deg)" },
        ], { duration: imp.crit ? 380 : 300, easing: "ease-out" }); });
        shakeDir(defEls[0], 3 + imp.ratio * 34, imp.sys);
        if (imp.big || imp.ratio >= 0.2) shakeDir(battle, 4 + imp.ratio * 20, imp.sys);
      }, at);
      delay += 240; // 次の衝撃までの間合い
    });
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
      document.body.classList.add("fx-ougi"); // 第100節C: 奥義の間はバトル背景に金色の光を広げる
      log("ougi-bg", o.text);
      setTimeout(() => { try { document.body.classList.remove("fx-ougi"); } catch (e) {} }, 1400);
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
  // 第100節B: 決着の一撃が入っていた場合は、先にスローモーション（画面がゆっくり寄って暗くなる＋低い音）をはさむ
  function battleEnd(win, text, done){
    ensureDom(); log("battleEnd", text);
    const slow = slowmoArmed; slowmoArmed = false; pendingImpacts = [];
    if (!cfg.enabled || fast){ se("gong"); if (win) se("crowd"); done(); return; }
    const showKo = () => {
      se("gong"); if (win) se("crowd");
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
    };
    if (slow){
      log("slowmo", 650); seSlowmo();
      try {
        const battle = document.querySelector(".battle");
        if (battle && battle.animate) battle.animate([
          { transform: "scale(1)", filter: "brightness(1)" },
          { transform: "scale(1.045)", filter: "brightness(.72) saturate(1.25)" },
        ], { duration: 650, easing: "ease-in", fill: "forwards" });
      } catch (e) {}
      setTimeout(showKo, 650);
      return;
    }
    showKo();
  }
  // HPバーの残像: renderBattle が data-to（目標%）付きで置いた .fx-ghost を遅れて追随させる
  function applyGhosts(root){
    if (!root) return;
    root.querySelectorAll(".fx-ghost").forEach(g => {
      const to = g.getAttribute("data-to");
      // 第100節B: 低HP（25%以下）のバーは赤く点滅させる警告表示（演出のみ）
      const bar = g.closest ? g.closest(".bar") : null;
      if (bar){
        const pct = to == null ? 100 : parseFloat(to);
        const low = cfg.enabled && !isNaN(pct) && pct <= 25;
        if (bar.classList.contains("fx-low") !== low){ bar.classList.toggle("fx-low", low); log("lowhp", low ? pct : "off"); }
      }
      if (to == null) return;
      if (!cfg.enabled || fast){ g.style.transition = "none"; g.style.width = to + "%"; return; }
      requestAnimationFrame(() => requestAnimationFrame(() => { g.style.width = to + "%"; }));
    });
    applyStage(); // 第100節: 保留中の衝撃（出・のけぞり）を新しいDOMへ当てる
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
    cfg, battleStart, battleEnd, playerHit, playerHurt, heal, cutin, applyGhosts, applyStage, typeLastLog, sysFx: SYS_FX,
    se, log, events: () => evLog.slice(),
    setFast: v => { fast = !!v; },
    isFast: () => fast,
    refreshButtons,
  };
})();

window.FX = FX;
