// 異種格闘年代記（仮）本制作エンジン ― 第1章（青年期）
// 構成: 状態管理 / シーン再生 / 週間育成ループ / バトル / SNS議論 / 口説き / セーブ
"use strict";

// ---------- ユーティリティ ----------
const $ = id => document.getElementById(id);
let _rng = Math.random;
function rnd(n){ return Math.floor(_rng() * (n + 1));} // 0..n
function randf(a, b){ return a + _rng() * (b - a);}
function clamp(v, a, b){ return Math.max(a, Math.min(b, v));}
function esc(s){ return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;");}
function mulberry32(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296;};}
window.__errors = [];
window.addEventListener("error", e => { window.__errors.push(String(e.message || e.error));});

// ---------- 定数 ----------
const SAVE_KEY = "kakutogi_production_save_v1";
const FAME_RANKS = ["無名", "近所で有名", "配信で話題", "流派の顔", "最強論争の中心"];
const FAME_THRESHOLDS = [0, 5, 12, 22, 35];
const STUDENT_CAP = [3, 6, 10, 16, 24];
const MONTHLY_BILLS = 52000; // 家賃32,000＋生活費20,000
const TUITION = 8000; // 生徒1人の月謝
const WEEKS_PER_YEAR = 48;

// ---------- 状態 ----------
let S = null;
function newState(){
return {
chapter: 1, absWeek: 1, age: 19,
money: 30000, fatigue: 10, sei: 0, aku: 0, attention: 0,
stats: {strike:1, kick:1, grapple:1, ground:1, endure:1, read:1, teach:1},
mainStyle: null, styleLv: {}, styleExp: {},
expMainTotal: 0, expTotal: 0,
dmg: {arm:0, leg:0, core:0, head:0},
students: [], met: [], affection: {}, romanceEv: {}, partner: null,
flags: {}, record: {fouls:0, works:0, matches:0, wins:0, cups:0, debates:0, debateWins:0, streetWins:0, finWins:0, seminars:0},
seminarCd: 0, lastRandomWeek: -9, poolUsed: [], beatsDone: {},
chapter1Clear: false, startedAt: Date.now(),
};
}
function fameTotal(){ return S.sei + S.aku;}
function fameRankIdx(){ const f = fameTotal(); let i = 0; FAME_THRESHOLDS.forEach((t, k) => { if (f >= t) i = k;}); return i;}
function fameRank(){ return FAME_RANKS[fameRankIdx()];}
function nickname(){
if (!S) return "若き黒帯";
if (S.record.fouls >= 2) return "眼突きの黒帯";
if (S.flags.champion) return "予選を制した黒帯";
if (S.record.works >= 24) return "バイト戦士";
const b = S.flags.boukanHow;
if (b === "voice") return "駅前の声";
if (b === "help") return "間に立つ初段";
if (b === "fight") return "一撃の初段";
return "若き黒帯";
}
function styleById(id){ return STYLES_DATA.find(s => s.id === id) || null;}
function styleByName(name){ return STYLES_DATA.find(s => s.name === name) || null;}
function mainStyle(){ return S && S.mainStyle!= null? styleById(S.mainStyle): null;}
function sigName(){ const st = mainStyle(); return st? st.name.replace(/（[^）]*）/g, "") + "の看板技": "看板技";}
function fill(t){
if (typeof t!== "string") return t;
const st = mainStyle();
return t.replaceAll("{style}", st? st.name: "流派")
.replaceAll("{sig}", sigName())
.replaceAll("{nickname}", nickname())
.replaceAll("{age}", S? S.age: 19)
.replaceAll("{years}", S? (S.age - 19): 0);
}
function styleLv(id){ return S.styleLv[id] || 1;}
function expNeed(lv){ return lv * 20;}
function gainStyleExp(id, pts, notes){
if (pts <= 0) return;
S.styleExp[id] = (S.styleExp[id] || 0) + pts;
S.expTotal += pts;
if (id === S.mainStyle) S.expMainTotal += pts;
let lv = styleLv(id);
while (lv < 10 && S.styleExp[id] >= expNeed(lv)){
S.styleExp[id] -= expNeed(lv); lv++;
if (notes) notes.push("" + (styleById(id)? styleById(id).name: "") + " Lv" + lv + (lv === 5? "！ 看板技が開きました": lv === 3? "！ 基本の精度が完成しました": ""));
}
S.styleLv[id] = lv;
}
function purity(){ if (!S.expTotal) return 100; return Math.round(S.expMainTotal / S.expTotal * 100);}

// ---------- 効果適用 ----------
function toast(msg, bad){
const box = $("toast"); if (!box) return;
const d = document.createElement("div");
d.className = "toast-item" + (bad? " bad": ""); d.textContent = msg;
box.appendChild(d);
setTimeout(() => d.remove(), 5200);
while (box.children.length > 5) box.firstChild.remove();
}
function applyFx(fx){
if (!fx) return;
const notes = [];
const yen = v => (v >= 0? "+": "") + v.toLocaleString() + "円";
if (fx.money){ S.money += fx.money; notes.push("所持金 " + yen(fx.money));}
if (fx.fatigue){ S.fatigue = clamp(S.fatigue + fx.fatigue, 0, 100); notes.push(fx.fatigue < 0? "疲労が回復した": "疲労が溜まった");}
if (fx.sei){ S.sei = Math.max(0, S.sei + fx.sei); notes.push(fx.sei > 0? "清名が上がった": "清名が下がった");}
if (fx.aku){ S.aku = Math.max(0, S.aku + fx.aku); notes.push(fx.aku > 0? "悪名が上がった": "悪名が下がった");}
if (fx.attention){ S.attention = clamp(S.attention + fx.attention, 0, 60); notes.push("注目度 " + (fx.attention > 0? "↑": "↓"));}
if (fx.expMain && S.mainStyle!= null){ gainStyleExp(S.mainStyle, fx.expMain, notes);}
if (fx.stat){ for (const k in fx.stat){ S.stats[k] = Math.round((S.stats[k] + fx.stat[k]) * 10) / 10;}}
if (fx.dmg){ for (const p in fx.dmg){ S.dmg[p] = clamp(S.dmg[p] + fx.dmg[p], 0, 3); if (fx.dmg[p] > 0) notes.push("部位ダメージ：" + ({arm:"腕", leg:"脚", core:"体幹", head:"頭"})[p] + " が悪化した"); if (fx.dmg[p] < 0) notes.push("部位ダメージが回復した");}}
if (fx.flags){ Object.assign(S.flags, fx.flags);}
if (fx.meet){ for (const id of fx.meet){ if (!S.met.includes(id)) S.met.push(id);}}
if (fx.affection){ for (const id in fx.affection){ S.affection[id] = clamp((S.affection[id] || 0) + fx.affection[id], 0, 100); notes.push(CAST_BY_ID[id].name + " の好感度が上がった");}}
if (fx.record){ for (const k in fx.record){ S.record[k] = (S.record[k] || 0) + fx.record[k];}}
if (fx.addStudent){ const st = fx.addStudent; if (!S.students.find(x => x.id === st.id)) { S.students.push(st); notes.push("道場生が増えた：" + st.name);}}
if (fx.joinStudent){ const joined = joinGenericStudent(); if (joined) notes.push("道場生が増えた：" + joined.name);}
for (const n of notes) toast(n);
return notes;
}
function joinGenericStudent(){
const cap = STUDENT_CAP[fameRankIdx()];
if (S.students.length >= cap) return null;
const cand = STUDENT_POOL.filter(p =>!S.poolUsed.includes(p.name) &&!S.students.find(x => x.name === p.name));
if (!cand.length) return null;
const p = cand[rnd(cand.length - 1)];
S.poolUsed.push(p.name);
const st = {id: "gen_" + p.name, name: p.name, style: p.style, trust: 50, skill: 1, note: p.note};
S.students.push(st);
return st;
}

// ---------- セーブ ----------
function saveGame(manual){
try { localStorage.setItem(SAVE_KEY, JSON.stringify({v:1, savedAt: Date.now(), state: S})); if (manual) toast("セーブしました"); return true;}
catch(e){ if (manual) toast("セーブに失敗しました", true); return false;}
}
function loadGame(){
try { const raw = localStorage.getItem(SAVE_KEY); if (!raw) return false; const d = JSON.parse(raw); S = d.state; return true;}
catch(e){ return false;}
}
function hasSave(){ try { return!!localStorage.getItem(SAVE_KEY);} catch(e){ return false;}}

// ---------- シーン再生エンジン ----------
const UI = { screen:"title", queue:[], portrait:null, battle:null, debate:null, afterWeek:null };
function startScene(steps, onDone){
  UI.screen = "scene";
  UI.queue = steps.slice();
  UI.onSceneDone = onDone || null;
  sceneAdvance();
}
function startSceneById(id){
  const sc = STORY_CH1[id];
  if (!sc){ goWeek(); return; }
  startScene(sc.steps);
}
function sceneAdvance(){
  while (UI.queue.length){
    const st = UI.queue.shift();
    if (st.venueIntro){
      const stl = mainStyle();
      const lines = (stl && VENUE_SPECIAL[stl.name]) || VENUE_TEXT[stl ? stl.venue : "dojo"] || [];
      UI.queue = lines.concat(UI.queue); continue;
    }
    if (st.img !== undefined){ UI.portrait = st.img; continue; }
    if (st.fx){ applyFx(st.fx); continue; }
    if (st.jump){ startSceneById(st.jump); return; }
    if (st.week){ finishScene(); return; }
    if (st.endChapter){ chapterEndScreen(); return; }
    if (st.t !== undefined){ renderSay(st); return; }
    if (st.choice){ renderChoice(st); return; }
    if (st.battle){ startBattle(st.battle, st.win || [], st.lose || []); return; }
    if (st.debate){ startDebate(st.debate); return; }
  }
  finishScene();
}
function finishScene(){
  saveGame(false);
  if (UI.onSceneDone){ const f = UI.onSceneDone; UI.onSceneDone = null; f(); return; }
  goWeek();
}
function speakerName(sp){
  if (sp === "narr") return "";
  if (sp === "me") return "ハヤト";
  const c = CAST_BY_ID[sp]; return c ? c.name : sp;
}
function portraitHtml(){
  if (!UI.portrait) return "";
  return '<div class="portrait"><img src="../cast-art/cast-' + UI.portrait + '-sera.webp" alt=""></div>';
}
function renderSay(st){
  hud();
  const sp = st.sp || "narr";
  const name = speakerName(sp);
  $("main").innerHTML = '<div class="scene">' + portraitHtml() +
    '<div class="dialog">' + (name ? '<div class="spname">' + esc(name) + '</div>' : "") +
    '<div class="stext">' + esc(fill(st.t)) + '</div>' +
    '<button class="btn next" data-auto="next">次へ</button></div></div>';
  $("main").querySelector(".next").addEventListener("click", sceneAdvance);
}
function renderChoice(st){
  hud();
  const btns = st.choice.map((c, i) => '<button class="btn choice" data-choice="' + i + '">' + esc(fill(c.label)) + '</button>').join("");
  $("main").innerHTML = '<div class="scene">' + portraitHtml() +
    '<div class="dialog"><div class="stext">――どうする？</div><div class="choices">' + btns + '</div></div></div>';
  $("main").querySelectorAll("[data-choice]").forEach(b => b.addEventListener("click", () => {
    const c = st.choice[Number(b.dataset.choice)];
    if (c.fx) applyFx(c.fx);
    UI.queue = (c.say || []).concat(UI.queue);
    sceneAdvance();
  }));
}

// ---------- 週間ループ ----------
const BEATS = [
  {week:1, id:"beat_underling"}, {week:3, id:"beat_seminar_fail"}, {week:5, id:"beat_baito_clash"},
  {week:12, id:"beat_rin_match"}, {week:16, id:"beat_boukan"}, {week:20, id:"beat_ozeki"},
  {week:24, id:"beat_jiyun"}, {week:28, id:"beat_otowa_cup"}, {week:32, id:"beat_kujo"},
  {week:36, id:"beat_shiratori"}, {week:40, id:"beat_kurozaki"},
  {week:46, id:"cup_year"}, {week:94, id:"cup_year"}, {week:142, id:"cup_year"},
  {week:52, id:"beat_rent"}, {week:76, id:"beat_students"}, {week:100, id:"beat_media"}, {week:148, id:"beat_spar_festival"},
  {week:60, id:"beat_dojo_class"}, {week:70, id:"beat_oba2"}, {week:84, id:"beat_seminar_voice"},
  {week:110, id:"beat_genda_past"}, {week:120, id:"beat_misaki_match"}, {week:132, id:"beat_jiyun2"},
  {week:158, id:"beat_winter"}, {week:166, id:"beat_rin_eve"},
  {week:49, id:"birthday"}, {week:97, id:"birthday"}, {week:145, id:"birthday"},
  {week:176, id:"finale1"},
];
function goWeek(){
  UI.screen = "week"; UI.portrait = null;
  const beat = BEATS.find(b => b.week === S.absWeek && !S.beatsDone[b.week + ":" + b.id]);
  if (beat){ S.beatsDone[beat.week + ":" + beat.id] = true; startSceneById(beat.id); return; }
  renderWeek();
}
function weekLabel(){
  const yw = ((S.absWeek - 1) % WEEKS_PER_YEAR) + 1;
  const month = Math.ceil(yw / 4);
  return S.age + "歳・" + month + "月（第" + yw + "週）";
}
function renderWeek(){
  hud();
  const st = mainStyle();
  const acts = [
    ["train_main", "稽古（主・流儀）", (st ? st.name : "") + " Lv" + styleLv(S.mainStyle) + " の稽古。経験値+10"],
    ["train_sub", "他流派を学ぶ", "全153流派から選ぶ（独学／セミナー／個人指導）"],
    ["basics", "基礎トレーニング", "持久と体幹を鍛える"],
    ["research", "映像研究", "読みが上がる。相手の研究にも"],
    ["teach", "道場指導", "収入と指導力。生徒 " + S.students.length + "人"],
    ["seminar", "セミナー開催", S.seminarCd > 0 ? "準備中（あと" + S.seminarCd + "週）" : "集客は注目度と評判で決まる"],
    ["baito", "バイト（タイミー）", "倉庫／警備／設営。生活費の足しに"],
    ["sns", "SNS「CLASH」", "投稿と論争。名声のもう一つのリング"],
    ["romance", "口説く", fameRankIdx() >= 1 ? "名声ランクで解放中" : "名声ランク「近所で有名」で解放"],
    ["care", "ケア・休養", "疲労と部位ダメージの回復"],
    ["dex", "図鑑・記録", "流派図鑑とキャスト名簿（週は進みません）"],
  ];
  $("main").innerHTML = '<div class="weekhead"><h2>' + weekLabel() + '</h2>' +
    '<div class="weeksub">二つ名：' + esc(nickname()) + "　／　純粋度：" + purity() + "%</div>" +
    '<div class="stext" style="color:var(--sub);font-size:.92em;">' + esc(WEEK_FLAVOR[S.absWeek % WEEK_FLAVOR.length]) + "</div></div>" +
    '<div class="actions">' + acts.map(a => '<button class="btn act" data-act="' + a[0] + '"><b>' + a[1] + '</b><span>' + esc(a[2]) + '</span></button>').join("") + "</div>";
  $("main").querySelectorAll("[data-act]").forEach(b => b.addEventListener("click", () => doAction(b.dataset.act)));
}
function afterAction(notes){
  for (const n of (notes || [])) toast(n);
  endWeek();
}
function endWeek(){
  // ランダムイベント
  let ev = null;
  if (S.absWeek - S.lastRandomWeek >= 2 && _rng() < 0.22){
    const cands = RANDOM_EVENTS.filter(e => e.condFatigue == null || S.fatigue >= e.condFatigue);
    if (cands.length){
      let tot = 0; for (const c of cands) tot += c.weight;
      let r = _rng() * tot;
      for (const c of cands){ r -= c.weight; if (r <= 0){ ev = c; break; } }
      ev = ev || cands[0];
    }
  }
  const proceed = () => {
    // 月末処理
    if (S.absWeek % 4 === 0){
      const tuition = S.students.length * TUITION;
      if (tuition > 0){ S.money += tuition; toast("月謝 +" + tuition.toLocaleString() + "円（生徒" + S.students.length + "人）"); }
      S.money -= MONTHLY_BILLS;
      toast("月末の請求書 -" + MONTHLY_BILLS.toLocaleString() + "円（家賃・生活費）", S.money < 0);
      if (S.money < 0) toast("所持金が底をついた……バイトで凌ぐしかない", true);
      if (S.money < -30000 && !S.flags.tamuraHelp){
        S.flags.tamuraHelp = true; S.money += 20000;
        toast("田村が立て替えてくれた +20,000円「大会で返せよ」");
      }
      // 生徒の成長
      for (const stu of S.students){ if (_rng() < 0.3) stu.skill = Math.min(10, stu.skill + 1); }
    }
    if (S.seminarCd > 0) S.seminarCd--;
    // 部位ダメージの自然回復（4週ごと）
    if (S.absWeek % 4 === 0){ for (const p of ["leg","arm","core","head"]){ if (S.dmg[p] > 0){ S.dmg[p]--; break; } } }
    S.absWeek++;
    if ((S.absWeek - 1) % WEEKS_PER_YEAR === 0) S.age++;
    saveGame(false);
    goWeek();
  };
  if (ev){ S.lastRandomWeek = S.absWeek; startScene(ev.steps, proceed); }
  else proceed();
}

// ---------- 週間行動 ----------
function growStat(k, v){ S.stats[k] = Math.round((S.stats[k] + v) * 10) / 10; }
function doAction(act){
  const notes = [];
  if (act === "train_main"){
    const before = styleLv(S.mainStyle);
    S.fatigue = clamp(S.fatigue + 18, 0, 100);
    const n = []; gainStyleExp(S.mainStyle, 10, n);
    const st = mainStyle();
    const prim = st.stats.strike >= st.stats.kick && st.stats.strike >= st.stats.grapple && st.stats.strike >= st.stats.ground ? "strike"
      : st.stats.kick >= st.stats.grapple && st.stats.kick >= st.stats.ground ? "kick"
      : st.stats.grapple >= st.stats.ground ? "grapple" : "ground";
    growStat(prim, 0.3); growStat("endure", 0.1);
    toast("黙々と" + st.name + "の稽古を積んだ" + (styleLv(S.mainStyle) > before ? "（Lvアップ！）" : ""));
    afterAction(n); return;
  }
  if (act === "basics"){
    S.fatigue = clamp(S.fatigue + 12, 0, 100);
    growStat("endure", 0.5); growStat("strike", 0.1);
    toast("基礎トレーニング。地味だが、体は裏切らない");
    afterAction(notes); return;
  }
  if (act === "research"){
    S.fatigue = clamp(S.fatigue + 6, 0, 100);
    growStat("read", 0.5);
    if (_rng() < 0.3){ S.attention += 1; toast("研究の切り口がCLASHで少し話題になった"); }
    else toast("試合映像を何本も見た。距離の癖が少しずつ見える");
    afterAction(notes); return;
  }
  if (act === "teach"){
    const base = S.students.length > 0 ? 6000 + S.students.length * 1500 : 5000;
    S.money += base; S.fatigue = clamp(S.fatigue + 10, 0, 100);
    growStat("teach", 0.4);
    const n = []; gainStyleExp(S.mainStyle, 2, n);
    toast("道場指導 +" + base.toLocaleString() + "円（教えることは学ぶことだ）");
    afterAction(n); return;
  }
  if (act === "seminar"){
    if (S.seminarCd > 0){ toast("セミナーは準備中です", true); return; }
    S.seminarCd = 3; S.record.seminars++;
    S.fatigue = clamp(S.fatigue + 14, 0, 100);
    const guests = Math.min(40, Math.max(0, Math.round((2 + S.attention * 0.8 + fameTotal() * 0.5 + S.stats.teach * 0.7) * randf(0.7, 1.3))));
    const income = guests * 3000;
    S.money += income;
    if (guests >= 10){ S.sei += 1; toast("セミナーは盛況だった！"); }
    if (guests >= 8 && _rng() < 0.5){ const j = joinGenericStudent(); if (j) toast("参加者の" + j.name + "が入門した！"); }
    if (guests === 0) toast("参加者はゼロだった……告知と名前が足りない", true);
    else toast("セミナー集客 " + guests + "人、収入 +" + income.toLocaleString() + "円");
    afterAction(notes); return;
  }
  if (act === "sns"){
    if (!S.flags.clashDone || _rng() < 0.55){
      S.flags.clashDone = true;
      startScene([{sp:"narr", t:"CLASHを開くと、小さな論争が燃えていた。"}, {debate:"mini1"}], () => endWeek());
      return;
    }
    S.attention += 2;
    if (_rng() < 0.25){ S.sei += 1; toast("稽古の投稿が「真摯だ」と評判になった"); }
    else toast("稽古の様子を投稿した（注目度↑）");
    afterAction(notes); return;
  }
  if (act === "train_sub") return renderSubStylePick();
  if (act === "baito") return renderBaitoPick();
  if (act === "care") return renderCarePick();
  if (act === "romance") return renderRomancePick();
  if (act === "dex") return renderDex();
}
function renderBaitoPick(){
  hud();
  const jobs = [
    ["warehouse", "倉庫ピッキング", "+9,000円。体力は付くが脚に来る"],
    ["security", "警備バイト", "+11,000円。事件の解決で顔が売れることも"],
    ["setup", "大会の設営バイト", "+10,000円。会場の下見と情報が手に入る"],
  ];
  $("main").innerHTML = '<div class="weekhead"><h2>バイトを選ぶ</h2></div><div class="actions">' +
    jobs.map(j => '<button class="btn act" data-job="' + j[0] + '"><b>' + j[1] + '</b><span>' + j[2] + "</span></button>").join("") +
    '<button class="btn ghost" data-back="1">戻る</button></div>';
  $("main").querySelector("[data-back]").addEventListener("click", renderWeek);
  $("main").querySelectorAll("[data-job]").forEach(b => b.addEventListener("click", () => {
    const job = b.dataset.job; S.record.works++;
    S.fatigue = clamp(S.fatigue + 20, 0, 100);
    if (job === "warehouse"){ S.money += 9000; growStat("endure", 0.2); if (_rng() < 0.3){ S.dmg.leg = clamp(S.dmg.leg + 1, 0, 3); toast("倉庫バイト +9,000円。脚に疲労が溜まった"); } else toast("倉庫バイト +9,000円"); }
    if (job === "security"){ S.money += 11000; if (_rng() < 0.25){ S.sei += 1; S.attention += 1; toast("警備バイト +11,000円。小さな揉め事を収め、感謝された"); } else toast("警備バイト +11,000円"); }
    if (job === "setup"){ S.money += 10000; growStat("read", 0.2); toast("設営バイト +10,000円。会場の動線と控室の様子が頭に入った"); }
    afterAction([]);
  }));
}
function renderCarePick(){
  hud();
  $("main").innerHTML = '<div class="weekhead"><h2>ケア・休養</h2></div><div class="actions">' +
    '<button class="btn act" data-care="rest"><b>しっかり休養</b><span>疲労を大きく回復</span></button>' +
    '<button class="btn act" data-care="care"><b>ケア（治療）</b><span>' + (S.flags.carePro ? "白鳥恵の治療。部位ダメージも回復（3,000円）" : "セルフケア。部位ダメージを少し回復") + "</span></button>" +
    '<button class="btn ghost" data-back="1">戻る</button></div>';
  $("main").querySelector("[data-back]").addEventListener("click", renderWeek);
  $("main").querySelectorAll("[data-care]").forEach(b => b.addEventListener("click", () => {
    if (b.dataset.care === "rest"){ S.fatigue = clamp(S.fatigue - 45, 0, 100); toast("しっかり休んだ"); }
    else {
      S.fatigue = clamp(S.fatigue - 30, 0, 100);
      let heal = S.flags.carePro ? 2 : 1;
      if (S.flags.carePro){ if (S.money >= 3000){ S.money -= 3000; } else { heal = 1; toast("治療費が足りず、簡易ケアになった", true); } }
      for (const p of ["leg","arm","core","head"]){ while (heal > 0 && S.dmg[p] > 0){ S.dmg[p]--; heal--; } }
      toast("ケアを受けた。体が軽い");
    }
    afterAction([]);
  }));
}
// ---------- 他流派と師匠 ----------
function mentorFor(style){
  if (!style) return null;
  if (style.name === "詠春拳") return {id:"chen", type:"厳格", note:"悪名のある者を門前払いする"};
  if (style.name === "空道（大道塾）") return {id:"onizuka", type:"実力主義", note:"評判は見ない。腕だけを見る"};
  if (style.cat === "日本の空手系") return {id:"todo", type:"寛容", note:"多少の悪名は笑って許す"};
  if (style.cat === "特殊・話題枠" || style.name === "クラヴマガ" || style.name === "システマ") return {id:"kurozaki", type:"無法歓迎", note:"悪名の高い者を歓迎する"};
  return null;
}
function mentorCheck(m){
  if (m.type === "厳格") return S.aku <= 1;
  if (m.type === "寛容") return S.aku <= 6;
  if (m.type === "実力主義") return S.record.wins >= 1 || styleLv(S.mainStyle) >= 3;
  if (m.type === "無法歓迎") return S.met.includes("kurozaki") && S.aku >= 2;
  return true;
}
function renderSubStylePick(){
  hud();
  const opts = STYLES_DATA.map(s => '<option value="' + s.id + '">' + s.name + "（" + s.dist.join("・") + "）</option>").join("");
  $("main").innerHTML = '<div class="weekhead"><h2>学ぶ流派を選ぶ</h2><div class="weeksub">全流派が最初から習得可能。唯一の制限は「時間」です</div></div>' +
    '<input id="style-search" type="text" placeholder="流派名で検索" style="width:100%;padding:10px;margin-bottom:8px;">' +
    '<select id="sub-style" size="10" style="width:100%;">' + opts + "</select>" +
    '<div id="sub-info" class="weeksub" style="margin:8px 0;"></div>' +
    '<div class="actions" id="route-btns"></div><button class="btn ghost" data-back="1">戻る</button>';
  const sel = $("sub-style"), info = $("sub-info"), routes = $("route-btns");
  if (sel.selectedIndex < 0) sel.selectedIndex = 0;
  const drawRoutes = () => {
    const st = styleById(Number(sel.value || 1)); if (!st) return;
    const lv = styleLv(st.id);
    info.textContent = st.name + " Lv" + lv + " ― " + st.feature + (lv >= 5 ? "（看板技 習得済み）" : lv >= 3 ? "（精度完成）" : "");
    const m = mentorFor(st);
    let html = '<button class="btn act" data-route="self"><b>独学・映像</b><span>経験値+4。誰でもいつでも</span></button>' +
               '<button class="btn act" data-route="seminar"><b>公開セミナー・交流稽古</b><span>経験値+7。評判では断られない</span></button>';
    if (m) html += '<button class="btn act" data-route="mentor"><b>個人指導（' + CAST_BY_ID[m.id].name + "）</b><span>経験値+12。" + m.type + "型：" + m.note + "</span></button>";
    routes.innerHTML = html;
    routes.querySelectorAll("[data-route]").forEach(b => b.addEventListener("click", () => trainSub(st, b.dataset.route, m)));
  };
  sel.addEventListener("change", drawRoutes);
  $("style-search").addEventListener("input", e => {
    const q = e.target.value.trim();
    for (const o of sel.options) o.style.display = (!q || o.textContent.includes(q)) ? "" : "none";
  });
  $("main").querySelector("[data-back]").addEventListener("click", renderWeek);
  drawRoutes();
}
function trainSub(st, route, mentor){
  S.fatigue = clamp(S.fatigue + 16, 0, 100);
  const notes = [];
  if (route === "mentor"){
    if (!mentorCheck(mentor)){
      const msgs = {"厳格":"静かに、しかしきっぱりと断られた。「出直してきなさい」", "寛容":"「今のあんたは、ちょっと荒れてるねえ」と笑って断られた", "実力主義":"「腕を見せてから来い」と門前払いされた", "無法歓迎":"「つまらない優等生には教えない」と断られた"};
      toast(msgs[mentor.type] || "門前払いされた", true);
      toast("独学に切り替えた");
      gainStyleExp(st.id, 4, notes);
    } else {
      toast(CAST_BY_ID[mentor.id].name + " の個人指導！ 効率が段違いだ");
      gainStyleExp(st.id, 12, notes);
      if (!S.met.includes(mentor.id)) S.met.push(mentor.id);
    }
  } else if (route === "seminar"){ gainStyleExp(st.id, 7, notes); S.money = Math.max(0, S.money - 5000); toast("セミナー受講 -5,000円"); }
  else { gainStyleExp(st.id, 4, notes); }
  afterAction(notes);
}
// ---------- 口説き ----------
function prefMatch(c){
  if (c.pref === "sei") return S.sei >= S.aku;
  if (c.pref === "aku") return S.aku >= 3;
  if (c.pref === "power") return styleLv(S.mainStyle) >= 4 || S.record.wins >= 3;
  return true;
}
function prefHint(c){
  if (c.pref === "sei") return "清らかな格を好む";
  if (c.pref === "aku") return "型破りな男に惹かれる";
  return "実力のある男に惹かれる";
}
function renderRomancePick(){
  hud();
  const women = CAST_DATA.filter(c => c.sex === "F" && S.met.includes(c.id) && ROMANCE[c.id]);
  let html = '<div class="weekhead"><h2>口説く</h2><div class="weeksub">名声ランクで解放。相手の好み（' + "清名／悪名／実力" + '）で実り方が変わります</div></div>';
  if (fameRankIdx() < 1) html += '<div class="stext">まだ名声が足りない。まずは戦って、名を上げよう（現在のランク：' + fameRank() + "）</div>";
  if (!women.length) html += '<div class="stext">まだ出会った女性がいない。</div>';
  html += '<div class="actions">' + women.map(c => {
    const af = S.affection[c.id] || 0;
    const locked = fameRankIdx() < 1;
    return '<button class="btn act" data-rom="' + c.id + '"' + (locked ? " disabled" : "") + "><b>" + c.name + "</b><span>好感度 " + af + " ／ " + prefHint(c) + (S.partner === c.id ? " ／ 交際中" : "") + "</span></button>";
  }).join("") + '<button class="btn ghost" data-back="1">戻る</button></div>';
  $("main").innerHTML = html;
  $("main").querySelector("[data-back]").addEventListener("click", renderWeek);
  $("main").querySelectorAll("[data-rom]").forEach(b => b.addEventListener("click", () => doRomance(b.dataset.rom)));
}
function doRomance(id){
  const c = CAST_BY_ID[id], R = ROMANCE[id];
  const af = S.affection[id] || 0;
  S.romanceEv = S.romanceEv || {};
  const done = S.romanceEv[id] || {};
  const head = [{img: id}];
  // 告白（好感度80・未交際。失敗時は時間を置いて再挑戦できる）
  if (af >= 80 && !S.partner && !done.confessed && (done.confessWaitUntil || 0) <= S.absWeek){
    const ok = prefMatch(c);
    if (ok) done.confessed = true; else done.confessWaitUntil = S.absWeek + 6;
    S.romanceEv[id] = done;
    const steps = head.concat([
      {sp:"me", t:"（今日こそ、伝える。武道の試合より、ずっと緊張する）"},
      {sp:"me", t: c.name + "さん。俺と、付き合ってください"},
    ].concat(ok ? R.confessOk : R.confessNg));
    if (ok){ steps.push({fx:{flags:{}}}); }
    startScene(steps, () => { if (ok){ S.partner = id; toast(c.name + " と交際することになった"); } endWeek(); });
    return;
  }
  if (af >= 55 && done.ev1 && !done.ev2){ done.ev2 = true; S.romanceEv[id] = done; startScene(head.concat(R.ev2), () => { applyFx({affection:{[id]:8}}); endWeek(); }); return; }
  if (af >= 25 && !done.ev1){ done.ev1 = true; S.romanceEv[id] = done; startScene(head.concat(R.ev1), () => { applyFx({affection:{[id]:8}}); endWeek(); }); return; }
  // 通常の口説き
  S.fatigue = clamp(S.fatigue + 4, 0, 100);
  S.money = Math.max(0, S.money - 1500);
  const lines = R.flirt[rnd(R.flirt.length - 1)];
  const gain = prefMatch(c) ? 8 : 5;
  startScene(head.concat(lines), () => { applyFx({affection:{[id]:gain}}); endWeek(); });
}

// ---------- バトル ----------
function resolveBattleDef(id){
  const def = Object.assign({}, BATTLES[id]);
  def.id = id;
  if (def.enemyByYear){
    const y = Math.min(2, Math.max(0, S.age - 19 - (S.absWeek >= 145 ? 1 : 0)));
    const e = def.enemyByYear[Math.min(def.enemyByYear.length - 1, Math.max(0, S.age - 20))];
    Object.assign(def, e);
  }
  return def;
}
function startBattle(id, winSteps, loseSteps){
  const def = resolveBattleDef(id);
  UI.screen = "battle";
  const eStyle = def.enemyStyleName ? styleByName(def.enemyStyleName) : mainStyle();
  const maxPhp = Math.round((55 + S.stats.endure * 6 + styleLv(S.mainStyle) * 2) * (1 - S.fatigue / 250) - S.dmg.core * 4);
  UI.battle = { def, eStyle, php: Math.max(20, maxPhp), maxPhp: Math.max(20, maxPhp), ehp: def.hp, turn: 0, dealt: 0,
    log: [], cmtIdx: 0, foulUsed: false, sigUsed: false, readBonus: 0, control: 0, readGuard: false, secondUsed: false,
    winSteps, loseSteps };
  bLog("実況", def.title + "――開始！");
  renderBattle();
}
function bLog(sp, tx){ UI.battle.log.push({sp, tx}); }
function pushComment(){
  const b = UI.battle; if (!b.def.comments || !b.def.comments.length) return;
  bLog("実況", b.def.comments[b.cmtIdx % b.def.comments.length]); b.cmtIdx++;
}
function playerPower(kind){
  const lv = styleLv(S.mainStyle);
  const base = {strike: S.stats.strike, kick: S.stats.kick, grapple: S.stats.grapple, ground: S.stats.ground}[kind];
  let p = 5 + base * 3 + lv + rnd(4) + UI.battle.readBonus;
  if (kind === "kick") p -= S.dmg.leg * 2;
  if (kind === "strike" || kind === "grapple") p -= S.dmg.arm * 2;
  if (kind === "ground") p += UI.battle.control;
  return Math.max(2, Math.round(p));
}
function renderBattle(){
  hud();
  const b = UI.battle, def = b.def;
  const lv = styleLv(S.mainStyle);
  const acts = [
    ["strike", "打撃で攻める", "中距離"],
    ["kick", "蹴りで攻める", "遠距離" + (S.dmg.leg ? "（脚のダメージで低下中）" : "")],
    ["grapple", "組み付く", "近距離・組技"],
    ["ground", "寝技に誘う", "寝技" + (b.control ? "（支配 +" + b.control + "）" : "")],
    ["read", "相手を読む", "次の攻撃↑・被ダメ半減"],
    ["recover", "息を整える", "体力を少し回復"],
  ];
  if (lv >= 5 && !b.sigUsed) acts.push(["sig", "看板技：" + sigName(), "1試合に1回"]);
  if (def.foul && !b.foulUsed) acts.push(["foul", "反則・眼突き", "勝てるが、評判を落とす諸刃"]);
  const enemyImg = def.img ? '<div class="portrait"><img src="../cast-art/cast-' + def.img + '-sera.webp" alt=""></div>' : "";
  $("main").innerHTML = '<div class="battle"><div class="vs">' +
    '<div class="fighter"><div class="nm">ハヤト（' + esc(mainStyle().name) + " Lv" + lv + '）</div><div class="bar hp"><i style="width:' + clamp(b.php / b.maxPhp * 100, 0, 100) + '%"></i></div><div class="sub">体力 ' + Math.max(0, b.php) + " ／ 部位：腕" + S.dmg.arm + " 脚" + S.dmg.leg + " 体幹" + S.dmg.core + '</div></div>' +
    '<div class="fighter enemy"><div class="nm">' + esc(def.enemyName) + '</div><div class="bar ehp"><i style="width:' + clamp(b.ehp / def.hp * 100, 0, 100) + '%"></i></div><div class="sub">' + esc(def.enemyStyleName || "同流派") + " ／ 耐久 " + Math.max(0, b.ehp) + "</div></div>" +
    enemyImg + '</div>' +
    '<div class="blog">' + b.log.map(l => '<div class="bl"><span>' + esc(l.sp) + "</span>" + esc(fill(l.tx)) + "</div>").join("") + "</div>" +
    '<div class="actions">' + acts.map(a => '<button class="btn act" data-bact="' + a[0] + '"><b>' + a[1] + '</b><span>' + a[2] + "</span></button>").join("") + "</div></div>";
  const blog = $("main").querySelector(".blog"); if (blog) blog.scrollTop = blog.scrollHeight;
  $("main").querySelectorAll("[data-bact]").forEach(x => x.addEventListener("click", () => battleTurn(x.dataset.bact)));
}
function battleTurn(act){
  const b = UI.battle, def = b.def;
  b.turn++;
  let dmg = 0;
  if (act === "strike"){ dmg = playerPower("strike"); bLog("実況", "突きが距離を刻む！"); }
  else if (act === "kick"){ dmg = playerPower("kick"); bLog("実況", "蹴りが間合いを支配する！"); }
  else if (act === "grapple"){ dmg = playerPower("grapple"); b.control = Math.min(6, b.control + 2); bLog("実況", "組み合った！ 支配が少しずつこちらに傾く"); }
  else if (act === "ground"){ dmg = playerPower("ground"); bLog("実況", "寝技の展開！ 極めを狙う"); }
  else if (act === "read"){ b.readBonus = 4 + Math.round(S.stats.read); b.readGuard = true; bLog("実況", "相手の癖を読む……次の手が冴える！"); }
  else if (act === "recover"){ b.php = Math.min(b.maxPhp, b.php + 9); bLog("実況", "息を整え、軸を立て直す"); }
  else if (act === "sig"){ dmg = 13 + Math.max(S.stats.strike, S.stats.kick, S.stats.grapple, S.stats.ground) * 3 + rnd(4); b.sigUsed = true; bLog("実況", sigName() + "――会場の空気が変わった！"); }
  else if (act === "foul"){
    dmg = 16 + rnd(4); b.foulUsed = true; S.record.fouls++;
    bLog("実況", "……今のは？ 指が目に――際どい攻防だ");
    if (def.mode === "match"){
      if (_rng() < 0.45){ applyFx({aku:2, attention:1}); bLog("判定", "レフェリーから警告！ 反則行為として記録された"); }
      else if (_rng() < 0.35){ applyFx({aku:1, attention:1}); bLog("実況", "映像がCLASHに切り抜かれた。「あれは反則だ」と拡散が始まっている"); }
    }
  }
  if (dmg > 0){ b.ehp -= dmg; b.dealt += dmg; b.readBonus = 0; }
  pushComment();
  // セコンド（源田）: 決勝・ルール交渉で選択した場合に1回
  if (!b.secondUsed && S.flags.ruleFx === "second" && def.id === "fin_rin" && b.php < b.maxPhp * 0.4 && b.ehp > 0){
    b.secondUsed = true; b.php = Math.min(b.maxPhp, b.php + 15);
    bLog("源田", "ハヤト、相手の左足を見ろ。……お前の距離は、まだ生きている");
  }
  if (b.ehp <= 0) return finishBattle(true);
  if (def.mode === "exam" && b.turn >= (def.turnLimit || 6)) return finishBattle(b.dealt >= 25);
  // 敵の反撃
  let edmg = def.power + rnd(4) + Math.round(((b.eStyle && b.eStyle.stats.grapple) || 1));
  if (def.id === "fin_rin" && S.flags.ruleFx === "stand") edmg = Math.round(edmg * 0.85);
  if (def.id === "fin_rin" && S.flags.ruleFx === "open") edmg = Math.round(edmg * 1.15);
  if (b.readGuard){ edmg = Math.round(edmg / 2); b.readGuard = false; }
  b.php -= edmg;
  if (_rng() < 0.18){
    const parts = ["leg", "arm", "core"]; const p = parts[rnd(2)];
    S.dmg[p] = clamp(S.dmg[p] + 1, 0, 3);
    bLog("実況", "攻め込まれた拍子に" + ({leg:"脚", arm:"腕", core:"体幹"})[p] + "を痛めた！");
  }
  bLog("実況", def.enemyName + "の反撃。こちらの体力が削られる");
  if (b.php <= 0) return finishBattle(false);
  renderBattle();
}
function finishBattle(win){
  const b = UI.battle;
  S.record.matches++;
  if (win) S.record.wins++;
  S.fatigue = clamp(S.fatigue + 12, 0, 100);
  const steps = win ? b.winSteps : b.loseSteps;
  UI.battle = null; UI.screen = "scene";
  UI.queue = steps.concat(UI.queue);
  sceneAdvance();
}

// ---------- SNS議論バトル ----------
function startDebate(id){
  const d = DEBATES[id];
  UI.screen = "debate"; UI.debate = { def: d, id };
  hud();
  $("main").innerHTML = '<div class="debate"><h2>CLASH ― ' + esc(d.title) + "</h2>" +
    d.posts.map(p => '<div class="post"><div class="who">' + esc(p.name) + " <span>" + esc(p.handle) + '</span></div><div class="txt">' + esc(fill(p.text)) + "</div></div>").join("") +
    '<div class="weeksub">返しの属性を選んでください（読みが高いと有利）</div><div class="actions">' +
    d.replies.map((r, i) => '<button class="btn act" data-reply="' + i + '"><b>【' + r.attr + "】</b><span>" + esc(fill(r.label)) + "</span></button>").join("") + "</div></div>";
  $("main").querySelectorAll("[data-reply]").forEach(x => x.addEventListener("click", () => {
    const r = d.replies[Number(x.dataset.reply)];
    S.record.debates++;
    const score = r.score + S.stats.read * 0.4 + _rng() * 3;
    const win = score >= 7;
    if (win){ S.record.debateWins++; applyFx(d.winFx); } else applyFx(d.loseFx);
    UI.screen = "scene";
    UI.queue = (win ? r.win : r.lose).concat(UI.queue);
    sceneAdvance();
  }));
}

// ---------- HUD / 画面 ----------
function hud(){
  const h = $("hud"); if (!h || !S) return;
  h.classList.remove("hidden");
  $("hud-age").textContent = S.age + "歳";
  $("hud-chapter").textContent = "第1章 青年期";
  $("hud-fame").textContent = fameTotal() + "（" + fameRank() + "）";
  $("hud-sei").textContent = S.sei;
  $("hud-aku").textContent = S.aku;
  $("hud-money").textContent = "¥" + S.money.toLocaleString();
  $("hud-students").textContent = S.students.length;
  const sta = clamp(100 - S.fatigue, 0, 100);
  $("hud-stamina").textContent = sta;
  $("hud-stamina-bar").style.width = sta + "%";
  const st = mainStyle();
  $("hud-style").textContent = st ? st.name + " Lv" + styleLv(S.mainStyle) + "／二つ名：" + nickname() : "";
}
function chapterEndScreen(){
  UI.screen = "end"; S.chapter1Clear = true; hud();
  const r = S.record;
  $("main").innerHTML = '<div class="endcard"><h2>第1章 青年期 ―完―</h2>' +
    '<div class="stext">記録：試合 ' + r.matches + "戦 " + r.wins + "勝 ／ 反則 " + r.fouls + "回 ／ バイト " + r.works + "回 ／ セミナー " + r.seminars + "回 ／ 論争 " + r.debateWins + "勝</div>" +
    '<div class="stext">名声 ' + fameTotal() + "（" + fameRank() + "）／ 清名" + S.sei + "・悪名" + S.aku + " ／ 道場生 " + S.students.length + "人 ／ " + (mainStyle() ? mainStyle().name : "") + " Lv" + styleLv(S.mainStyle) + " ／ 純粋度 " + purity() + "%" + (S.partner ? " ／ 想い人：" + CAST_BY_ID[S.partner].name : "") + "</div>" +
    '<div class="stext">【第2章予告】全盛前夜（23〜29歳）。本戦への挑戦、道場の独立、新しい世代の強者たち、そして師匠たちの門。このセーブデータは第2章へ引き継げます（次回制作）。</div>' +
    '<button class="btn next" data-auto="to-title">タイトルへ戻る</button></div>';
  saveGame(false);
  $("main").querySelector("[data-auto='to-title']").addEventListener("click", renderTitle);
}
function renderTitle(){
  UI.screen = "title";
  $("hud").classList.add("hidden");
  $("main").innerHTML = '<div class="title"><h1>異種格闘年代記<span>（仮）</span></h1>' +
    '<p class="tagline">どの武術が一番強いのか――その論争に、人生で答える。</p>' +
    '<button class="btn next" data-auto="new">はじめから</button>' +
    (hasSave() ? '<button class="btn" data-auto="continue">つづきから</button>' : "") +
    '<p class="note">第1章：青年期（19〜22歳）</p></div>';
  $("main").querySelector("[data-auto='new']").addEventListener("click", renderStyleSelect);
  const c = $("main").querySelector("[data-auto='continue']");
  if (c) c.addEventListener("click", () => { if (loadGame()){ if (S.chapter1Clear) chapterEndScreen(); else goWeek(); } });
}
function renderStyleSelect(){
  hud();
  const cards = STYLES_DATA.map(s => '<button class="btn choice stylecard" data-style="' + s.id + '"><b>' + esc(s.name) + '</b><span>' + esc(s.cat) + "／得意距離：" + s.dist.join("・") + "<br>" + esc(s.feature) + "</span></button>").join("");
  $("main").innerHTML = '<div class="weekhead"><h2>主・流儀を選ぶ</h2><div class="weeksub">子供の頃から習い、19歳で初段相当（Lv2）に達した流派。全153流派から選べます（知名度順）。他流派は後からいつでも学べます</div></div>' +
    '<input id="style-search2" type="text" placeholder="流派名で検索" style="width:100%;padding:10px;margin-bottom:10px;">' +
    '<div class="styles">' + cards + "</div>";
  $("style-search2").addEventListener("input", e => {
    const q = e.target.value.trim();
    $("main").querySelectorAll(".stylecard").forEach(el => { el.style.display = (!q || el.textContent.includes(q)) ? "" : "none"; });
  });
  $("main").querySelectorAll("[data-style]").forEach(b => b.addEventListener("click", () => {
    const st = styleById(Number(b.dataset.style));
    S = newState();
    S.mainStyle = st.id;
    S.styleLv[st.id] = 2; S.styleExp[st.id] = 0;
    S.stats.strike = 1 + st.stats.strike * 0.8;
    S.stats.kick = 1 + st.stats.kick * 0.8;
    S.stats.grapple = 1 + st.stats.grapple * 0.8;
    S.stats.ground = 1 + st.stats.ground * 0.8;
    saveGame(false);
    startSceneById("prologue_after_style");
  }));
}
function renderDex(){
  hud();
  const women = CAST_DATA.filter(c => c.sex === "F");
  $("main").innerHTML = '<div class="weekhead"><h2>図鑑・記録</h2></div>' +
    '<h3>道場生（' + S.students.length + "人）</h3>" + (S.students.length ? S.students.map(s => '<div class="dexrow">' + esc(s.name) + " ― " + esc(s.style) + " 上達度" + s.skill + "</div>").join("") : '<div class="dexrow">まだいない</div>') +
    '<h3>出会った人々</h3>' + CAST_DATA.filter(c => S.met.includes(c.id)).map(c => '<div class="dexrow">' + esc(c.name) + "（" + c.age + "歳）― " + esc(c.role) + (c.sex === "F" ? " 好感度" + (S.affection[c.id] || 0) : "") + "</div>").join("") +
    '<h3>習得した流派</h3>' + Object.keys(S.styleLv).map(id => { const st = styleById(Number(id)); return st ? '<div class="dexrow">' + esc(st.name) + " Lv" + S.styleLv[id] + "</div>" : ""; }).join("") +
    '<h3>女性キャスト（全' + women.length + '名・口説き対象）</h3>' + women.map(c => '<div class="dexrow">' + esc(c.name) + " ― 第" + c.debut + "章登場" + (S.met.includes(c.id) ? "" : "（未登場）") + "</div>").join("") +
    '<button class="btn ghost" data-back="1">戻る</button>';
  $("main").querySelector("[data-back]").addEventListener("click", renderWeek);
}

// ---------- ナビ・起動 ----------
$("btn-save").addEventListener("click", () => { if (S) saveGame(true); });
$("btn-load").addEventListener("click", () => { if (loadGame()){ toast("ロードしました"); if (S.chapter1Clear) chapterEndScreen(); else goWeek(); } else toast("セーブデータがありません", true); });
$("btn-title").addEventListener("click", renderTitle);
if (new URLSearchParams(location.search).has("autotest")) { /* game.js 末尾の自動テストが処理 */ }
renderTitle();

// ---------- 自動テスト（?autotest=1&style=流派名&foul=0|1&seed=N） ----------
(function(){
  const q = new URLSearchParams(location.search);
  if (!q.has("autotest")) return;
  _rng = mulberry32(Number(q.get("seed") || 42));
  const wantStyle = q.get("style") || "糸東流";
  const useFoul = q.get("foul") === "1";
  let clicks = 0, cycle = 0;
  const finish = (ok, why) => {
    clearInterval(timer);
    const res = { ok, why: why || "", screen: UI.screen, absWeek: S ? S.absWeek : 0, age: S ? S.age : 0,
      fame: S ? fameTotal() : 0, sei: S ? S.sei : 0, aku: S ? S.aku : 0, students: S ? S.students.length : 0,
      mainLv: S ? styleLv(S.mainStyle) : 0, money: S ? S.money : 0, partner: S ? S.partner : null,
      chapter1Clear: S ? S.chapter1Clear : false, record: S ? S.record : null, clicks, errors: window.__errors };
    const d = document.createElement("div"); d.id = "autotest-result";
    d.textContent = "AUTOTEST_RESULT " + JSON.stringify(res);
    document.body.appendChild(d);
  };
  const timer = setInterval(() => {
    try {
      clicks++;
      if (clicks > 20000) return finish(false, "ステップ上限到達");
      if (UI.screen === "end") return finish(true);
      const main = $("main"); if (!main) return;
      const styleCards = main.querySelectorAll("[data-style]");
      if (styleCards.length){
        let target = null;
        for (const c of styleCards){ if (c.textContent.includes(wantStyle)){ target = c; break; } }
        (target || styleCards[0]).click(); return;
      }
      if (UI.screen === "title"){ const b = main.querySelector("[data-auto='new']"); if (b) b.click(); return; }
      if (UI.screen === "scene"){
        const ch = main.querySelectorAll("[data-choice]");
        if (ch.length){ ch[cycle++ % ch.length].click(); return; }
        const nx = main.querySelector("[data-auto='next']"); if (nx) nx.click();
        return;
      }
      if (UI.screen === "debate"){ const r = main.querySelectorAll("[data-reply]"); if (r.length) r[cycle++ % r.length].click(); return; }
      if (UI.screen === "battle"){
        const B = UI.battle;
        if (B && B.php < B.maxPhp * 0.22){ const rc = main.querySelector("[data-bact='recover']"); if (rc){ rc.click(); return; } }
        let sel = null;
        if (useFoul && B && B.def.foul && !B.foulUsed) sel = main.querySelector("[data-bact='foul']");
        if (!sel) sel = main.querySelector("[data-bact='sig']");
        if (!sel && B){ const st = mainStyle(); const prim = st.stats.kick >= st.stats.strike && st.stats.kick >= st.stats.grapple && st.stats.kick >= st.stats.ground ? "kick" : st.stats.grapple >= st.stats.ground && st.stats.grapple >= st.stats.strike ? "grapple" : st.stats.ground > st.stats.strike && st.stats.ground > st.stats.kick ? "ground" : "strike"; sel = main.querySelector("[data-bact='" + prim + "']"); }
        if (!sel) sel = main.querySelector("[data-bact='strike']");
        if (sel) sel.click();
        return;
      }
      if (UI.screen === "week"){
        const rom = main.querySelector("[data-rom]:not([disabled])"); if (rom){ rom.click(); return; }
        const job = main.querySelector("[data-job]"); if (job){ job.click(); return; }
        const care = main.querySelector("[data-care]"); if (care){ care.click(); return; }
        const route = main.querySelector("[data-route='self']"); if (route){ route.click(); return; }
        const back = main.querySelector("[data-back]"); if (back){ back.click(); return; }
        let act = "train_main";
        if (S.fatigue > 78) act = "care";
        else if (S.money < 15000 && S.absWeek % 3 !== 0) act = "baito";
        else if (S.absWeek % 11 === 0) act = "romance";
        else if (S.absWeek % 7 === 0) act = "seminar";
        else if (S.absWeek % 5 === 0) act = "train_sub";
        else if (S.absWeek % 4 === 0) act = "teach";
        const b = main.querySelector("[data-act='" + act + "']"); if (b) b.click();
        return;
      }
    } catch(e){ window.__errors.push("autotest: " + (e && e.message)); }
  }, 5);
})();
