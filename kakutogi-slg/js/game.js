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

// ---------- プレイヤーの声（第72節）: バージョン管理・CLASH投稿・いいね ----------
// 受け皿は2層: (1)ゲーム内CLASH投稿といいね（👍反応）は端末内 localStorage に保存
// (2)全体の集計（人気投票・コメント）は Googleフォーム。投稿パネルの「開発にも送る」から送る
const GAME_VERSION = "1.42";
const FEEDBACK_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdlIsptOWafNjikDixHtq6LTfnVsxE-XQMdapOLRBf5poeuYQ/viewform";
const LIKES_KEY = "kakutogi_likes_v1";
const POSTS_KEY = "kakutogi_posts_v1";
const CHANGELOG = [
  {v:"1.42", date:"2026-11-09", items:[
    "「界隈大炎上編」に界隈の決め台詞『目を突くように嘘を吐く』を追記：『目つき』騒動のコメント欄で生まれた言葉遊びが、説明の二転三転する騒動全体を指す合言葉として広がっていく",
  ]},
  {v:"1.41", date:"2026-11-09", items:[
    "連鎖イベント「界隈大炎上編」を追加（第2章以降・週をまたぐ全8段）：人気インフルエンサーの疑惑報道に端を発し、達人グループの内紛、別件の『目つき』騒動、説明の二転三転、映画企画の大ゴケとグループ離散、無関係な配信者の便乗まで、燃え続ける騒動の連鎖を描く。疑惑の当事者は架空の人物で、真偽は作中でも断定しない",
  ]},
  {v:"1.4", date:"2026-11-09", items:[
    "第4章「円熟期」（40〜49歳）を追加：散打の間宮健一率いる道場との対抗戦が主敵ラインとして開幕（第5章へ続く長期戦の第1幕）。赤井道場が開かれ、弟子全員が同じ赤い道着の『赤い軍団』として登場",
    "第4章の初登場：王麗華（58・陳式太極拳、厳格型の老師）／間宮健一（55・散打）／高村蒼太（19・サバット、若手の星）／呉志強（61・酔拳、寛容型の老師）。カメオで顔見せ済みの達人たちとも直接対面できるようになった",
    "流派Lv9「指導の高み」とLv10「奥義・皆伝」を完全実装：Lv9で高額セミナーと指導収入が跳ね上がり、Lv10で試合中に一度だけ放てる奥義（純粋度で強化）が解放される。王麗華の口説き固有イベントも追加",
    "円熟期の体の変化を実装：戦闘時の体力上限はピーク比80%、回復は遅く連戦の代償が重い。代わりに『相手を読む』効果とセミナー・指導の収益効率が全章で最も高い。道場の設備投資・弟子の遠征費・医療ケア費など、円熟期の支出の山も追加",
  ]},
  {v:"1.33", date:"2026-11-08", items:[
    "「試斬動画の大論争」エピソードに、老師の語り草を追記：かつて忍術の使い手と揉めた折にタバコをくわえたまま吐き捨てた『この河童野郎！』の一件が、界隈の物真似の定番フレーズになっている",
  ]},
  {v:"1.32", date:"2026-11-08", items:[
    "居合の達人・真井勇作を追加（キャスト総数101名）。飛んでくる小さな弾さえ真剣で斬る記録級の離れ業で知られる超人が、第2章から検証・批評の実力者として登場",
    "「試斬動画の大論争」エピソードを加筆：批判側に真井が立ち、当事者同士の本気の争いと、それを祭りにしてしまう界隈の温度差を描く",
  ]},
  {v:"1.31", date:"2026-11-08", items:[
    "師匠の絵を流派ごとに差し替え：序章の認定審査に立つ師範と、流派詳細（他流派を学ぶ画面）の師範像が、選んだ流派の系統に合った人物になった（カテゴリ別10種＋相撲・ムエタイ・カポエイラ・忍術・アーマードバトル・シルムの個別6種）",
  ]},
  {v:"1.3", date:"2026-11-08", items:[
    "達人系の発信者20名を追加（キャスト総数100名）。第4〜6章で本格登場し、第1〜3章では映像・噂のカメオで顔見せ。検証コラボのハブ役など固有コラボ2本も追加",
    "誹謗中傷の裏ルートを追加：バックに組織がいる相手を中傷すると、数週置いて『黒い車の訪問』が来る（謝罪／弁護士／無視で圧力が段階的に変化）",
    "勝利宣言の代償ルートを追加：論争で言い負かして相手が退場した後に勝利宣言をすると、夜道の襲撃イベントが発生しうる（蓄積した実力と体の状態で結末が変わる）",
    "エピソードのデッドエンドを追加：主要エピソードにバッドエンド（重い代償を残して年代記は続く）と、一部に真のデッドエンド（DEAD END画面から分岐点へ巻き戻し）を実装。見たデッドエンドはタイトル画面に記録される",
  ]},
  {v:"1.2", date:"2026-11-08", items:[
    "訴えられる経路を追加（CLASHの煽りからの名誉毀損／無断動画の肖像権／傷害の示談交渉）。弁護士費用（相談料・着手金・成功報酬）と、払いきれない分が残る『借金』（月末の分割返済）を実装",
    "主・流儀の本場への留学ルートを追加（費用は借金でも賄える。借金上限あり）",
    "訴訟・借金が恋愛に波及する修羅場イベントと、借金帰省でオカンに年金明細を突きつけられる実家イベントを追加",
    "インフルエンサー系キャストとのコラボ企画（動画配信・合同イベント＋固有コラボ3本）を追加",
  ]},
  {v:"1.1", date:"2026-11-08", items:[
    "実在モデル組が第1章から段階的に登場（カメオ→第2章で絡む→第3章で対面）",
    "年末イベント『BOTY（武クラ・オブ・ザ・イヤー）』を追加",
    "武術界隈の変なエピソード（試斬動画の大論争・レスバ十段ほか）と、気の達人・羽黒幻海／真壁信者エカを追加",
    "エピソードごとに『CLASHに書き込む』投稿と👍反応（いいね）を追加。感想は端末内のCLASHに残り、フォーム送信で全体の人気集計にも参加できます",
  ]},
  {v:"1.0", date:"2026-11-07", items:[
    "第1章 青年期（19〜22歳）／第2章 全盛前夜（23〜29歳）／第3章 全盛期（30〜39歳）を公開",
    "全156流派・登場人物80名・道場経営と名声（清名／悪名）・口説き・反則と裁判バトルまで実装",
  ]},
];
function getLikes(){
  try { const d = JSON.parse(localStorage.getItem(LIKES_KEY) || "{}"); return (d && typeof d === "object" && !Array.isArray(d)) ? d : {}; }
  catch(e){ return {}; }
}
function isLiked(id){ return !!getLikes()[id]; }
function setLiked(id, on){
  const l = getLikes();
  if (on) l[id] = Date.now(); else delete l[id];
  try { localStorage.setItem(LIKES_KEY, JSON.stringify(l)); } catch(e){}
  return !!l[id];
}
function toggleLike(id){ return setLiked(id, !isLiked(id)); }
function getPosts(){
  try { const d = JSON.parse(localStorage.getItem(POSTS_KEY) || "[]"); return Array.isArray(d) ? d : []; }
  catch(e){ return []; }
}
function addPost(p){
  const arr = getPosts(); arr.push(p);
  try { localStorage.setItem(POSTS_KEY, JSON.stringify(arr)); } catch(e){}
  return arr;
}
function allEventPools(){
  const pools = [];
  if (typeof WEEK_EVENTS_V2 !== "undefined") pools.push(WEEK_EVENTS_V2);
  if (typeof STUDENT_DRAMA_EVENTS !== "undefined") pools.push(STUDENT_DRAMA_EVENTS);
  if (typeof SEASONAL_EVENTS !== "undefined") pools.push(SEASONAL_EVENTS);
  if (typeof RANDOM_EVENTS !== "undefined") pools.push(RANDOM_EVENTS);
  if (typeof CH3_WEEK_EVENTS !== "undefined") pools.push(CH3_WEEK_EVENTS);
  if (typeof CH3_STUDENT_DRAMA !== "undefined") pools.push(CH3_STUDENT_DRAMA);
  if (typeof CH3_SEASONAL_EVENTS !== "undefined") pools.push(CH3_SEASONAL_EVENTS);
  if (typeof CH4_WEEK_EVENTS !== "undefined") pools.push(CH4_WEEK_EVENTS);
  if (typeof CH4_STUDENT_DRAMA !== "undefined") pools.push(CH4_STUDENT_DRAMA);
  if (typeof CH4_SEASONAL_EVENTS !== "undefined") pools.push(CH4_SEASONAL_EVENTS);
  if (typeof DEBATE_EVENTS !== "undefined") pools.push(DEBATE_EVENTS);
  if (typeof SPECIAL_EVENTS !== "undefined") pools.push(SPECIAL_EVENTS);
  if (typeof CHAIN_EVENTS !== "undefined") pools.push(CHAIN_EVENTS);
  if (typeof CAMEO_EVENTS !== "undefined") pools.push(CAMEO_EVENTS);
  return pools;
}
function firstStepText(steps){
  if (!steps) return "";
  for (const st of steps){ if (st && st.t) return String(st.t).replace(/\{[^}]*\}/g, ""); }
  return "";
}
// いいね・投稿の対象ID → 表示名（タイトル画面の一覧・投稿履歴用）
function episodeLabel(id){
  if (!id) return "エピソード";
  if (id === "boty") return "BOTY（武クラ・オブ・ザ・イヤー）年末発表";
  if (id.indexOf("ep:") === 0){
    const c = (typeof CAST_BY_ID !== "undefined") && CAST_BY_ID[id.slice(3)];
    return c ? c.name + "のエピソード場面" : "エピソード場面";
  }
  for (const pool of allEventPools()){
    const e = pool.find(x => x.id === id);
    if (e){
      if (e.title) return e.title;
      if (e.debateId && typeof DEBATES !== "undefined" && DEBATES[e.debateId]) return "CLASH論争『" + DEBATES[e.debateId].title + "』";
      const t = firstStepText(e.steps);
      if (t) return t.length > 30 ? t.slice(0, 30) + "…" : t;
      return id;
    }
  }
  for (const book of [typeof STORY_CH1 !== "undefined" ? STORY_CH1 : null, typeof STORY_CH2 !== "undefined" ? STORY_CH2 : null, typeof STORY_CH3 !== "undefined" ? STORY_CH3 : null, typeof STORY_CH4 !== "undefined" ? STORY_CH4 : null]){
    if (book && book[id]){
      if (book[id].title) return book[id].title;
      const t = firstStepText(book[id].steps);
      if (t) return t.length > 30 ? t.slice(0, 30) + "…" : t;
      return id;
    }
  }
  return id;
}
// いいね・投稿の対象ID → CLASHのハッシュタグ（#は付けずに返す）
const EPISODE_TAGS = {
  aru_jimen:"試斬動画の大論争", aru_resuba:"レスバ十段", aru_lawsuit:"法的措置を検討します",
  aru_screenshot:"スクショ全保存", aru_soke:"一子相伝の宗家", aru_eka:"先の先の実験",
  sp_eka:"先の先の実験", sp_haguro:"触れぬ先の投げ", sp_metsuking:"目突きこそ最強",
  sp_bushika:"まずスクワット", sp_rankfraud:"段位詐称は許せるか",
  sp_bbs_write:"匿名掲示板騒動", sp_bbs_expose:"匿名掲示板騒動", sp_bbs_court:"裁判バトル", sp_dojo_raid:"道場乗り込み",
  sp_clash_sue1:"CLASH名誉毀損", sp_clash_sue2:"CLASH名誉毀損",
  sp_video_upload:"無断動画騒動", sp_video_protest:"無断動画騒動", sp_video_sue:"無断動画騒動",
  sp_injury1:"傷害事件の示談", sp_injury2:"傷害事件の示談", sp_injury3:"傷害事件の示談",
  sp_partner_crisis:"修羅場", sp_partner_exposed:"バレた嘘", sp_partner_recover:"関係修復",
  sp_okan_home:"オカンの年金", sp_okan_home_good:"オカンの年金",
  sp_collab_haguro:"気の検証配信", sp_collab_eka:"先の先検証", sp_collab_shiina:"短時間マッチ企画",
  sp_collab_kitajima:"達人検証のハブ", sp_collab_shiroma:"レアキャラの稽古会",
  sp_back_visit1:"黒い車の訪問", sp_back_visit2:"黒い車の訪問", sp_back_visit3:"黒い車の訪問",
  sp_victory_declare:"勝利宣言", sp_night_attack:"夜道の襲撃", debt_deadend:"夜逃げ",
  sp_burn1:"界隈大炎上", sp_burn2:"界隈大炎上", sp_burn3:"目つき騒動", sp_burn4:"界隈大炎上",
  sp_burn5:"界隈大炎上", sp_burn6:"界隈大炎上", sp_burn7:"界隈大炎上", sp_burn8:"界隈大炎上",
  boty:"BOTY",
};
function episodeTag(id){
  if (!id) return "武クラ";
  if (EPISODE_TAGS[id]) return EPISODE_TAGS[id];
  let slug = null;
  if (id.indexOf("ep:") === 0) slug = id.slice(3);
  else { const m = id.match(/^(?:cam1_|cam_|sp_)([a-z]+?)\d*$/); if (m) slug = m[1]; }
  if (slug && typeof CAST_BY_ID !== "undefined" && CAST_BY_ID[slug]) return CAST_BY_ID[slug].name;
  for (const pool of allEventPools()){
    const e = pool.find(x => x.id === id);
    if (e && e.debateId && typeof DEBATES !== "undefined" && DEBATES[e.debateId]) return DEBATES[e.debateId].title.replace(/[\s　]/g, "").slice(0, 14);
  }
  const lbl = episodeLabel(id).replace(/[\s　『』「」【】（）・…]/g, "");
  return lbl ? lbl.slice(0, 14) : "武クラ";
}
// このIDが「エピソードの終わりにCLASHバーを出す」対象か（イベントプール所属 or カメオ場面 or BOTY）
function isLikeableId(id){
  if (!id) return false;
  if (id === "boty") return true;
  if (/^cam1_/.test(id)) return true;
  return allEventPools().some(p => p.some(e => e.id === id));
}

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
flags: {}, record: {fouls:0, works:0, matches:0, wins:0, cups:0, debates:0, debateWins:0, streetWins:0, finWins:0, seminars:0, winStreak:0, bestWinStreak:0},
seminarCd: 0, lastRandomWeek: -9, poolUsed: [], beatsDone: {}, seenEvents: {},
chapter1Clear: false, chapter2Clear: false, chapter3Clear: false, chapter4Clear: false, startedAt: Date.now(),
};
}
function ensureStateCompat(){
  if (!S) return;
  if (!S.flags || typeof S.flags !== "object") S.flags = {};
  if (!S.record || typeof S.record !== "object") S.record = {fouls:0, works:0, matches:0, wins:0, cups:0, debates:0, debateWins:0, streetWins:0, finWins:0, seminars:0};
  if (S.record.winStreak == null) S.record.winStreak = 0;
  if (S.record.bestWinStreak == null) S.record.bestWinStreak = S.record.winStreak || 0;
  if (!S.seenEvents || typeof S.seenEvents !== "object") S.seenEvents = {};
  if (!S.beatsDone || typeof S.beatsDone !== "object") S.beatsDone = {};
  if (!Array.isArray(S.students)) S.students = [];
  if (!Array.isArray(S.met)) S.met = [];
  if (!S.dmg) S.dmg = {arm:0, leg:0, core:0, head:0};
  if (!S.affection) S.affection = {};
  if (!S.styleLv) S.styleLv = {};
  if (!S.styleExp) S.styleExp = {};
  if (S.chapter3Clear == null) S.chapter3Clear = false;
  if (S.chapter4Clear == null) S.chapter4Clear = false;
}
function fameTotal(){ return S.sei + S.aku;}
function fameRankIdx(){ const f = fameTotal(); let i = 0; FAME_THRESHOLDS.forEach((t, k) => { if (f >= t) i = k;}); return i;}
function fameRank(){ return FAME_RANKS[fameRankIdx()];}
function mainTerms(){ return styleTerms(mainStyle());}
function nickname(){
const T = mainTerms();
if (!S) return T.nickYoung;
if (S.record.fouls >= 2) return T.nickFoul;
if (S.flags.champion) return T.nickChamp;
if ((S.flags.debt || 0) >= 60000) return "借金の求道者"; // 第74節: 借金が嵩むと界隈が勝手に付けた呼び名が二つ名に割り込む
if (S.record.works >= 24) return "バイト戦士";
const b = S.flags.boukanHow;
if (b === "voice") return "駅前の声";
if (b === "help") return T.nickHelp;
if (b === "fight") return T.nickFight;
return T.nickYoung;
}
function styleById(id){ return STYLES_DATA.find(s => s.id === id) || null;}
function styleByName(name){ return STYLES_DATA.find(s => s.name === name) || null;}
function mainStyle(){ return S && S.mainStyle!= null? styleById(S.mainStyle): null;}
function sigName(){ const st = mainStyle(); return st? st.name.replace(/（[^）]*）/g, "") + "の看板技": "看板技";}
function fill(t){
if (typeof t!== "string") return t;
const st = mainStyle();
const T = mainTerms();
return t.replaceAll("{style}", st? st.name: "流派")
.replaceAll("{sig}", sigName())
.replaceAll("{nickname}", nickname())
.replaceAll("{young}", T.nickYoung)
.replaceAll("{exam}", T.exam)
.replaceAll("{proof}", T.proof)
.replaceAll("{rank}", T.rank)
.replaceAll("{who}", T.who)
.replaceAll("{age}", S? S.age: 19)
.replaceAll("{years}", S? (S.age - 19): 0)
.replaceAll("{abroad}", S && S.flags && S.flags.abroadPlace ? S.flags.abroadPlace : "本場");
}
// ---------- 攻撃系統（第73節：流派別の攻撃系統制限） ----------
// プレイヤーが使える系統 = 習得した全流派（主・流儀＋学んだ流派）の systems の和集合。
// 他流派を学ぶほど系統が広がる（混合ルートの利点）。純粋ルートは系統が狭い代わりに
// 主・流儀の精度・看板技・対策メタ回避などの既存の強みが生きる。
function playerSystems(){
  const set = {};
  if (S){
    if (S.mainStyle != null) styleSystems(styleById(S.mainStyle)).forEach(k => { set[k] = true; });
    for (const id in S.styleLv) styleSystems(styleById(Number(id))).forEach(k => { set[k] = true; });
  }
  return ATTACK_SYSTEMS.map(a => a.kind).filter(k => set[k]);
}
function systemsKindLabel(kind){ const d = ATTACK_SYSTEMS.find(a => a.kind === kind); return d ? d.label : kind; }
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
if (notes) notes.push("" + (styleById(id)? styleById(id).name: "") + " Lv" + lv + (lv === 10? "！ 奥義・皆伝――その流派を極めた証明。試合で一度だけ放てる奥義と、高額セミナーの頂点が開きました": lv === 9? "！ 指導の高みに達しました。高額セミナーと指導収入が跳ね上がり、遠方から生徒が集まるようになります": lv === 5? "！ 看板技が開きました": lv === 3? "！ 基本の精度が完成しました": ""));
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
if (fx.douhan){ S.flags.douhanScore = (S.flags.douhanScore || 0) + fx.douhan; notes.push(fx.douhan > 0 ? "ユイの評価が上がった" : fx.douhan < 0 ? "ユイの評価が下がった" : "ユイの評価は変わらなかった");}
if (fx.dopeUse){ S.flags.dopeUsed = (S.flags.dopeUsed || 0) + 1; S.flags.dopeUntilWeek = S.absWeek + 8; notes.push("短期的な強化を得た（検査・告発・疑惑のリスクを背負う)");}
if (fx.dopeSuspect){ S.flags.dopeSuspect = Math.max(0, (S.flags.dopeSuspect || 0) + fx.dopeSuspect); if (fx.dopeSuspect > 0) notes.push("ドーピング疑惑が強まった"); else if (fx.dopeSuspect < 0) notes.push("ドーピング疑惑が弱まった");}
if (fx.oldWound){ if (!S.flags.oldWounds || typeof S.flags.oldWounds !== "object") S.flags.oldWounds = {}; for (const p in fx.oldWound){ S.flags.oldWounds[p] = fx.oldWound[p]; notes.push("古傷として残った部位がある");}}
if (fx.studentTrust){ for (const stu of S.students){ stu.trust = clamp((stu.trust || 50) + fx.studentTrust, 0, 100);} if (S.students.length) notes.push(fx.studentTrust > 0 ? "生徒たちの信頼が上がった" : "生徒たちの信頼が下がった");}
if (fx.studentSkill){ for (const stu of S.students){ stu.skill = clamp((stu.skill || 1) + fx.studentSkill, 1, 10);} if (S.students.length) notes.push("生徒たちの上達度が上がった");}
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
try { const raw = localStorage.getItem(SAVE_KEY); if (!raw) return false; const d = JSON.parse(raw); S = d.state; ensureStateCompat(); return true;}
catch(e){ return false;}
}
function hasSave(){ try { return!!localStorage.getItem(SAVE_KEY);} catch(e){ return false;}}

// ---------- シーン再生エンジン ----------
const UI = { screen:"title", queue:[], portrait:null, episode:null, battle:null, debate:null, afterWeek:null, likeId:null };
function startScene(steps, onDone, likeId){
  // 第82節: エピソード開始時点の状態を巻き戻しポイントとして保持する（真のデッドエンド用）
  if (likeId && S){ try { window.__rewindPoint = {s: JSON.stringify(S), steps: steps, onDone: onDone || null, likeId: likeId}; } catch(e){} }
  UI.screen = "scene";
  UI.episode = null;
  UI.likeId = likeId || null;
  UI.queue = steps.slice();
  UI.onSceneDone = onDone || null;
  sceneAdvance();
}
function startSceneById(id){
  const sc = STORY_CH1[id] || (typeof STORY_CH2 !== "undefined" ? STORY_CH2[id] : null) || (typeof STORY_CH3 !== "undefined" ? STORY_CH3[id] : null) || (typeof STORY_CH4 !== "undefined" ? STORY_CH4[id] : null);
  if (!sc){ goWeek(); return; }
  startScene(sc.steps, null, id);
}
// ドーピング検査の結果発表（第3章）。使用の有無で分岐する
function dopeVerdictLines(){
  if ((S.flags.dopeUsed || 0) > 0){
    if (!S.flags.dopeVerdictDone){
      S.flags.dopeVerdictDone = true;
      return [
        {sp:"narr", t:"結果は、白石遥の手で公表された。陽性――セルゲイの『ケア』の痕跡が、検出された。"},
        {img:"shiraishi"},
        {sp:"shiraishi", t:"……残念です。あなたの体は守れても、信頼は、私にも守りきれません"},
        {sp:"narr", t:"資格停止の処分と、大きな批判が押し寄せた。積み上げてきた清らかな看板の色は、深く傷ついた。"},
        {fx:{aku:3, sei:-2, attention:3, flags:{dopeExposed:true}}},
      ];
    }
    return [{sp:"narr", t:"検査の結果は既に公表済みだ。疑惑と処分の影は、まだ完全には晴れていない。"}];
  }
  return [
    {sp:"narr", t:"結果は、白石遥の手で公表された。陰性。疑惑は、数字で晴れた。"},
    {img:"shiraishi"},
    {sp:"shiraishi", t:"あなたの体は、正直でした。……疑われた分だけ、潔白の重みが増しましたね"},
    {fx:{sei:2}},
  ];
}
// 裁判バトル（第46節）の結末変換。直前の議論バトル（court_case）で選んだ方針と勝敗から、和解／勝訴／敗訴と効果を決める
// 第74節で弁護士費用（着手金・成功報酬）と借金（払いきれない分は月末分割）を全経路共通で組み込んだ
function courtVerdictLines(){
  const d = S.flags.lastDebate || {};
  const attr = d.id === "court_case" ? d.attr : "弁護";
  const win = !!d.win;
  const F = LEGAL_FEES;
  S.flags.courtDone = true; S.flags.courtWeek = S.absWeek;
  if (S.partner && !S.flags.partnerCrisisDone) S.flags.partnerCrisisPending = S.absWeek; // 第76節: 訴訟が恋愛に波及する火種
  if (attr === "謝罪"){
    if (win){ S.flags.courtResult = "settle"; return settleBillLines("和解の支払い",
      [{label:"賠償金", amount:60000},{label:"弁護士・着手金", amount:F.retainer},{label:"成功報酬", amount:F.settleFee}],
      [{sp:"narr", t:"判決の前に、和解が成立した。門脇も最後は小さく頭を下げた。「……リングでは、また別だ」"},
       {sp:"narr", t:"高い授業料だった。だが、逃げずに畳んだ姿勢は、界隈にも静かに伝わった。"},
       {fx:{sei:1, attention:1}}]);}
    S.flags.courtResult = "settle_hard"; return settleBillLines("和解の支払い",
      [{label:"賠償金", amount:120000},{label:"弁護士・着手金", amount:F.retainer},{label:"成功報酬", amount:F.settleFee}],
      [{sp:"narr", t:"和解は成立した。ただし条件は重く、謝罪文の文面も、相手方と一語ずつ調整する苦い作業になった。"},
       {sp:"narr", t:"「匿名でも、言葉は金で償うことになる」――霧島沙耶のコラムが、静かに締めくくった。"},
       {fx:{aku:1, attention:2}}]);}
  if (attr === "弁護"){
    if (win){ S.flags.courtResult = "settle"; return settleBillLines("和解の支払い",
      [{label:"賠償金", amount:70000},{label:"弁護士・着手金", amount:F.retainer},{label:"成功報酬", amount:F.settleFee}],
      [{sp:"narr", t:"加納弁護士の交渉で、和解が成立した。感情の応酬にならなかった分、傷は浅く済んだ。"},
       {sp:"narr", t:"「戦う場所を選ぶのも、実力のうちです」加納の言葉が、妙に残った。"},
       {fx:{fatigue:-5}}]);}
    S.flags.courtResult = "lose"; return settleBillLines("敗訴の支払い",
      [{label:"賠償金", amount:150000},{label:"弁護士・着手金", amount:F.retainer}],
      [{sp:"narr", t:"判決は敗訴。賠償金の支払いが命じられた。プロに任せても、書き込みの悪質さは覆らなかった。"},
       {sp:"narr", t:"法廷を出ると、記者たちのフラッシュが待っていた。"},
       {fx:{aku:1, attention:2}}]);}
  // 証拠／正論で争った場合
  if (win){ S.flags.courtResult = "win"; return settleBillLines("勝訴しても、費用はかかる",
    [{label:"弁護士・着手金", amount:F.retainer},{label:"成功報酬", amount:F.winFee}],
    [{sp:"narr", t:"勝訴。書き込みの一部は、正当な批評の範囲と認められた。"},
     {sp:"narr", t:"だが、勝ったことと、匿名で悪口を書いた事実は、別の話だった。CLASHの反応も半々で、「勝訴＝正義」と言ってくれる者はいなかった。"},
     {fx:{attention:3, sei:-1, aku:1}}]);}
  S.flags.courtResult = "lose"; return settleBillLines("敗訴の支払い",
    [{label:"賠償金", amount:180000},{label:"弁護士・着手金", amount:F.retainer}],
    [{sp:"narr", t:"敗訴。賠償金に、謝罪投稿の掲載まで命じられた。争う姿勢そのものが心証を悪くした、とも報じられた。"},
     {sp:"narr", t:"謝罪投稿のコメント欄は、しばらく荒れたままだった。"},
     {fx:{aku:2, attention:3}}]);}
// 道場への乗り込み（第47節）の導入。裁判の結末（勝訴／敗訴）で、押しかける側の顔ぶれが変わる
function raidIntroLines(){
  if (S.flags.courtResult === "win"){
    return [
      {sp:"narr", t:"勝訴から数週間後。稽古の時間、道場の扉が乱暴に開いた。門脇道場の若手・タツヤと、その仲間たちだった。"},
      {sp:"narr", t:"「法廷じゃ言葉で誤魔化しやがって……！ 師匠の無念は、俺たちがこの畳で晴らす！」門脇本人は来ていない。弟子たちの怒りだけが、熱を持って押しかけてきた。"},
    ];
  }
  return [
    {sp:"narr", t:"敗訴の報せから数週間後。稽古の時間、道場の扉が乱暴に開いた。門脇道場の若手・タツヤが、仲間を連れて立っていた。"},
    {sp:"narr", t:"「金払えば終わりだと思ってるのか？ 先生は許しても、俺はあの書き込みを許さねえ！」賠償で畳んだはずの騒動が、別の形で火種を残していた。"},
  ];
}
// ---------- 借金と弁護士費用（第74節） ----------
// 賠償金・示談金・弁護士費用は chargeLegal で払う： 手持ちで払い、足りない分は「借金」として残り、
// 月末の精算（endWeek）で残高の1/5（最低1万円）ずつ分割返済される。借金がある間の演出は
// 二つ名（借金の求道者）・CLASHの噂・第76節（恋愛への波及）・第77節（実家のオカン）と共通。
const LEGAL_FEES = {consult:10000, retainer:30000, settleFee:20000, winFee:30000};
function debtOf(){ return (S && S.flags && S.flags.debt) || 0; }
function addDebt(amount){
  if (amount <= 0) return;
  const before = debtOf();
  S.flags.debt = before + amount;
  S.flags.debtTotal = (S.flags.debtTotal || 0) + amount;
  if (before < 50000 && S.flags.debt >= 50000){
    toast("CLASHで『借金してまで戦う男』と噂が立ち始めた", true);
    if (S.partner && !S.flags.partnerCrisisDone && !S.flags.partnerCrisisPending) S.flags.partnerCrisisPending = S.absWeek;
  }
}
function chargeLegal(amount){
  if (amount <= 0) return {paid:0, debted:0};
  const pay = Math.max(0, Math.min(S.money, amount));
  S.money -= pay;
  const rest = amount - pay;
  if (rest > 0) addDebt(rest);
  return {paid: pay, debted: rest};
}
// 法的な支払いの明細行を組み立てる（parts=[{label, amount}]）。合計を chargeLegal で払い、借金に回った分も明記する
function settleBillLines(title, parts, tail){
  const total = parts.reduce((a, p) => a + p.amount, 0);
  const res = chargeLegal(total);
  const detail = parts.filter(p => p.amount > 0).map(p => p.label + p.amount.toLocaleString() + "円").join("＋");
  const lines = [{sp:"narr", t:"【" + title + "】" + detail + " ＝ 合計" + total.toLocaleString() + "円。手持ちから" + res.paid.toLocaleString() + "円を払った。"}];
  if (res.debted > 0) lines.push({sp:"narr", t:"残りの" + res.debted.toLocaleString() + "円は借金として残った（借金残高" + debtOf().toLocaleString() + "円）。月末の精算で、少しずつ返していく。"});
  return lines.concat(tail || []);
}
function monthlyDebtPayment(show){
  const debt = debtOf();
  if (debt <= 0) return 0;
  const inst = Math.min(debt, Math.max(10000, Math.ceil(debt / 5)));
  S.money -= inst;
  S.flags.debt = debt - inst;
  S.flags.debtPaidTotal = (S.flags.debtPaidTotal || 0) + inst;
  if (show) toast("借金の返済 -" + inst.toLocaleString() + "円（残り" + S.flags.debt.toLocaleString() + "円）", S.flags.debt > 0);
  if (S.flags.debt <= 0){ S.flags.debt = 0; if (show) toast("借金を完済した！ 肩の荷が一つ下りた"); }
  return inst;
}
// 民事の結末変換（第74節： court_case2=CLASH名誉毀損／court_case3=無断動画の肖像権）。方針（attr）と勝敗から和解／勝訴／敗訴と金額を決める
function civilVerdictLines(kind){
  const d = S.flags.lastDebate || {};
  const attr = d.attr || "弁護";
  const win = !!d.win;
  const F = LEGAL_FEES;
  const DMG = kind === "clash" ? {settle:40000, settleHard:80000, counsel:50000, lose:120000} : {settle:30000, settleHard:60000, counsel:40000, lose:110000};
  const flagDone = kind === "clash" ? "clashCourtDone" : "videoCourtDone";
  const flagRes = kind === "clash" ? "clashCourtResult" : "videoCourtResult";
  S.flags[flagDone] = true; S.flags[flagRes + "Week"] = S.absWeek;
  if (S.partner && !S.flags.partnerCrisisDone) S.flags.partnerCrisisPending = S.absWeek;
  let result, lines;
  if (attr === "謝罪" && win){ result = "settle"; lines = settleBillLines("和解の支払い",
    [{label:"賠償金", amount:DMG.settle},{label:"弁護士・着手金", amount:F.retainer},{label:"成功報酬", amount:F.settleFee}],
    [{sp:"narr", t:"判決の前に、和解が成立した。投稿の削除と謝罪文の掲載、そして賠償。相手側も、最後は矛を収めた。"}, {fx:{sei:1, attention:1}}]);
  } else if (attr === "謝罪"){ result = "settle_hard"; lines = settleBillLines("和解の支払い",
    [{label:"賠償金", amount:DMG.settleHard},{label:"弁護士・着手金", amount:F.retainer},{label:"成功報酬", amount:F.settleFee}],
    [{sp:"narr", t:"和解は成立したが、条件は重かった。謝罪の文面は相手方と一語ずつ調整し、賠償も膨らんだ。"}, {fx:{aku:1, attention:2}}]);
  } else if (attr === "弁護" && win){ result = "settle"; lines = settleBillLines("和解の支払い",
    [{label:"賠償金", amount:DMG.counsel},{label:"弁護士・着手金", amount:F.retainer},{label:"成功報酬", amount:F.settleFee}],
    [{sp:"narr", t:"加納弁護士の交渉で、和解が成立した。法廷で争い切る前に畳めた分、傷は浅く済んだ。"}, {fx:{fatigue:-5}}]);
  } else if (attr === "弁護"){ result = "lose"; lines = settleBillLines("敗訴の支払い",
    [{label:"賠償金", amount:DMG.lose},{label:"弁護士・着手金", amount:F.retainer}],
    [{sp:"narr", t:"判決は敗訴。賠償金の支払いが命じられた。言葉の応酬の代償は、法廷でも安くはなかった。"}, {fx:{aku:1, attention:2}}]);
  } else if (win){ result = "win"; lines = settleBillLines("勝訴しても、費用はかかる",
    [{label:"弁護士・着手金", amount:F.retainer},{label:"成功報酬", amount:F.winFee}],
    [{sp:"narr", t:"勝訴。こちらの主張が、おおむね認められた。"}, {sp:"narr", t:"だがCLASHの反応は複雑だった。「勝った」と「正しかった」は、界隈では別の話として扱われる。"}, {fx:{attention:2}}]);
  } else { result = "lose"; lines = settleBillLines("敗訴の支払い",
    [{label:"賠償金", amount:DMG.lose + 30000},{label:"弁護士・着手金", amount:F.retainer}],
    [{sp:"narr", t:"敗訴。賠償金の支払いが命じられた。争う姿勢そのものが心証を悪くした、とも報じられた。"}, {fx:{aku:2, attention:3}}]);
  }
  S.flags[flagRes] = result;
  return lines;
}
// CLASH名誉毀損ルート（第74節・経路1）の導入。煽りの相手（直近の論争の第一投稿者）を動的に差し込む
function clashSueIntroLines(){
  const opp = S.flags.lastAoriOpp || "論争の相手";
  const title = S.flags.lastAoriTitle || "CLASHの論争";
  return [
    {sp:"narr", t:"ある朝、郵便受けに分厚い封筒が入っていた。差出人は弁護士事務所。――内容証明郵便だった。"},
    {sp:"narr", t:"CLASHの論争『" + title + "』での、あの煽りの応酬。言い負かしたはずの" + opp + "側が、名誉毀損だとして、謝罪と投稿の削除、そして慰謝料を求めてきたのだ。"},
    {sp:"me", t:"（言葉の試合のつもりだった。だが、言葉にも体重はあったらしい）"},
  ];
}
// 傷害ルート（第74節・刑事の側）。火種は3系統： boukan=暴漢への過剰防衛／raid=乗り込み組手で怪我／match=試合で重い怪我
const INJURY_SETTLE_BASE = {boukan:80000, raid:120000, match:150000};
function injurySource(){ return S.flags.injurySource || "match"; }
function injurySourceReady(){
  if (!S || S.flags.injuryDone || S.flags.injurySource) return !!S.flags.injurySource;
  if (S.flags.raidResult === "win" && S.seenEvents["sp_dojo_raid"]){ S.flags.injurySource = "raid"; S.flags.injuryBaseWeek = S.seenEvents["sp_dojo_raid"]; return true; }
  if (S.flags.boukanHow === "fight"){ S.flags.injurySource = "boukan"; S.flags.injuryBaseWeek = 16; return true; }
  return false;
}
function injuryIntroLines(){
  const heads = {
    boukan: ["駅前で女性を守った、あの一戦から数週間。警察署から、任意の聞き取りへの協力要請が届いた。", "あの夜の男が、肋骨を折られたとして被害届を出したのだという。「守った側」が、今度は「加害者」として呼ばれている。"],
    raid: ["道場への乗り込みを組手で退けた、あの日から数週間。警察署から、任意の聞き取りへの協力要請が届いた。", "タツヤが、あの組手で腕を骨折したとして、被害届を出したのだという。押しかけてきた側が、今度は「被害者」として名を連ねている。"],
    match: ["先日の試合から数週間。警察署から、任意の聞き取りへの協力要請が届いた。", "試合で倒れた相手の怪我が、思いのほか重かった。反則気味の一撃で負わせたとして、告訴の動きがあるという。"],
  };
  const h = heads[injurySource()] || heads.match;
  return [
    {sp:"narr", t:h[0]},
    {sp:"narr", t:h[1]},
    {sp:"narr", t:"刑事事件の入り口だ。逮捕という話ではない。だが、被害届が受理された以上、無関係ではいられない。相手側は治療費と慰謝料を求める構えで、示談の成否が今後の処分を左右するという。"},
  ];
}
function injurySettleAmount(){
  let amt = INJURY_SETTLE_BASE[injurySource()] || 120000;
  if (S.flags.injuryLawyer) amt = Math.round(amt * 0.8); // 加納の交渉で2割減
  if (S.flags.injuryApology) amt = Math.round(amt * 0.8); // 直接の謝罪でも2割減
  if (S.flags.injuryAttitude === "silent") amt = Math.round(amt * 1.2); // 黙秘・ごまかしは相手を硬化させる
  return amt;
}
function injurySettleLines(){
  const parts = [{label:"示談金（治療費・慰謝料を含む）", amount:injurySettleAmount()}];
  if (S.flags.injuryLawyer){ parts.push({label:"弁護士・着手金", amount:LEGAL_FEES.retainer}); S.flags.injuryRetainerPaid = true; }
  S.flags.injuryDone = true; S.flags.injuryResult = "settled";
  return settleBillLines("示談の支払い", parts, [
    {sp:"narr", t:"示談書に署名した。相手側は被害届を取り下げ、事件は不起訴で終わる。リングの外の決着は、地味で、重くて、そして高かった。"},
    {fx:{attention:1}},
  ]);
}
function injuryFineLines(){
  let fine = 80000;
  if (S.flags.injuryLawyer) fine = 50000;
  if (S.flags.injuryAttitude === "silent") fine = 120000;
  const parts = [{label:"略式命令の罰金", amount:fine}];
  if (S.flags.injuryLawyer && !S.flags.injuryRetainerPaid) parts.push({label:"弁護士・着手金", amount:LEGAL_FEES.retainer});
  S.flags.injuryDone = true; S.flags.injuryResult = "fine";
  if (S.partner && !S.flags.partnerCrisisDone) S.flags.partnerCrisisPending = S.absWeek;
  return settleBillLines("罰金と費用", parts, [
    {sp:"narr", t:"示談はまとまらなかった。検察の判断は略式起訴。罰金の支払いを命じる略式命令が届いた。逮捕も実刑もない。だが事件は「終わった」ことになり、記録と噂は静かに残る。"},
    {sp:"narr", t:"CLASHでは『あの件、罰金で終わったらしい』という投稿が回った。強さの証明のつもりが、別の形で名を残してしまった。"},
    {fx:{aku:2, attention:2}},
  ]);
}
// ---------- 訴訟・借金の恋愛への波及（第76節） ----------
function partnerSeverity(){
  let sev = 0;
  if (S.flags.courtResult === "lose" || S.flags.clashCourtResult === "lose" || S.flags.videoCourtResult === "lose") sev += 2;
  else if (S.flags.courtDone || S.flags.clashCourtDone || S.flags.videoCourtDone) sev += 1;
  const debt = debtOf();
  if (debt >= 100000) sev += 2; else if (debt >= 50000) sev += 1;
  if (S.flags.injuryDone) sev += 1;
  return sev;
}
function partnerCrisisSteps(){
  const pid = S.partner; const c = pid ? CAST_BY_ID[pid] : null;
  if (!c) return [{sp:"narr", t:"（交際相手がいないため、この騒動は誰の耳にも入らなかった）"}];
  S.flags.partnerMarried = (S.chapter >= 3 && (S.affection[pid] || 0) >= 90) ? true : !!S.flags.partnerMarried;
  const foundOut = (S.flags.courtResult === "lose" || S.flags.injuryResult === "fine") ? "報道とCLASHの投稿で" : "自分の口から話す前に、共通の知人づてに";
  return [
    {sp:"narr", t:"訴訟と借金のことは、隠し通せるものではなかった。" + foundOut + "、" + c.name + "の耳に入った。その夜、二人の間に重い沈黙が落ちた。"},
    {img:pid},
    {sp:pid, t:"……ねえ。訴えられてるって話、本当？ 借金まであるって。どうして、私に何も言ってくれなかったの"},
    {sp:"me", t:"（来るべき時が来た。ここでの答え方が、この関係の行方を決める）"},
    {choice:[
      {label:"正直に話して、頭を下げる", say:[{partnerReact:"honest"}]},
      {label:"取り繕う・隠す（「大したことじゃない」と流す）", say:[{partnerReact:"hide"}]},
      {label:"返済と再起の計画を示す", say:[{partnerReact:"plan"}]},
    ]},
  ];
}
function partnerReactLines(mode){
  const pid = S.partner; const c = pid ? CAST_BY_ID[pid] : null;
  if (!c) return [];
  const pref = c.pref || "sei";
  const sev = partnerSeverity();
  S.flags.partnerCrisisDone = true;
  if (mode === "hide"){
    S.flags.partnerHid = true; S.flags.partnerHidWeek = S.absWeek;
    return [
      {sp:"me", t:"大したことじゃない。もう終わったようなものだ。心配するな"},
      {sp:pid, t:"……そう。終わったようなもの、ね"},
      {sp:"narr", t:"彼女はそれ以上追及しなかった。だが、笑顔の端に小さな影が残った。本当のことが別から漏れた時、この一言は「嘘」として数えられる。"},
      {fx:{affection:{[pid]:-5}}},
    ];
  }
  if (mode === "honest"){
    if (pref === "aku") return [
      {sp:pid, t:"……ふふ。訴えられて、借金して、それを正直に話す男。最低だけど、面白いじゃない"},
      {sp:"narr", t:"彼女は呆れたように笑って、それきり追及をやめた。悪名に惹かれる彼女には、この騒動すら「物語」に見えるらしい。関係は、むしろ少し深まった。"},
      {fx:{affection:{[pid]:3}}},
    ];
    if (pref === "power"){
      if (sev >= 4){ S.flags.partnerStrained = true; return [
        {sp:pid, t:"……分かった。話してくれたことは信じる。でも、しばらく距離を置かせて。あなたの再起を、見届けてから決めたい"},
        {sp:"narr", t:"別れではなかった。だが、関係には明確な「保留」が付いた。借金を返し切ることが、そのまま答え合わせになる。"},
        {fx:{affection:{[pid]:-12}}},
      ];}
      return [
        {sp:pid, t:"……頭を下げられる男は、信用できる。逃げなかったこと、私は評価するよ"},
        {sp:"narr", t:"厳しい目だったが、背は向けられなかった。再起の姿を見せることが、そのまま関係の修復になるはずだ。"},
        {fx:{affection:{[pid]:-3}}},
      ];
    }
    // 清名型
    if (sev >= 3){ S.flags.partnerStrained = true; return [
      {sp:pid, t:"……裁判沙汰の人と、この先を考えるのは、正直、怖い。あなたを嫌いになったわけじゃない。でも、少し時間をください"},
      {sp:"narr", t:"清らかさを重んじる彼女にとって、訴訟と借金は大きな影だった。別れの言葉はなかった。だが関係は冷え、修復には「返済の実績」という証明が要る。"},
      {fx:{affection:{[pid]:-15}}},
    ];}
    return [
      {sp:pid, t:"……心配はしたけど、隠さず話してくれたことは、嬉しい。借金は、一緒に返していけばいいじゃない"},
      {sp:"narr", t:"彼女は静かに寄り添った。騒動の分だけ、二人の距離は少し縮まったかもしれない。"},
      {fx:{affection:{[pid]:2}}},
    ];
  }
  // plan: 返済と再起の計画を示す
  const repaid = (S.flags.debtPaidTotal || 0) > 0;
  if (pref === "power") return [
    {sp:"me", t:"月々の返済はこう回す。稽古と指導で収入はこう増やす。――紙に書いて、全部見せた"},
    {sp:pid, t: repaid ? "……返済が既に進んでる計画は、嘘じゃないわね。いいよ、その再起、私も隣で見る" : "……計画は立派ね。でも、実行はこれから。見せてもらうわ、その姿を"},
    {sp:"narr", t:"実力を重んじる彼女は、言葉より数字と姿勢を見た。関係は持ち直した。"},
    {fx:{affection:{[pid]:5}}},
  ];
  if (pref === "aku") return [
    {sp:pid, t:"計画、計画って。真面目な話は退屈ね。……でも、借金抱えて計画立てられる男は、嫌いじゃないよ"},
    {sp:"narr", t:"彼女はあっさり残った。騒動そのものへの興味が、心配を上回ったようだ。"},
    {fx:{affection:{[pid]:-2}}},
  ];
  if (sev >= 3) S.flags.partnerStrained = true;
  return [
    {sp:pid, t:"計画を立ててるのは分かる。真面目なのも分かる。でも……訴えられるようなことをした事実は、計画じゃ消えないの"},
    {sp:"narr", t:"彼女の声は静かだった。計画性は認められたが、訴訟そのものへの違和感は残った。"},
    {fx:{affection:{[pid]:-6}}},
  ];
}
function partnerBreakupLines(reasonLines){
  const pid = S.partner;
  const married = !!S.flags.partnerMarried;
  const lines = (reasonLines || []).slice();
  if (married){
    addDebt(200000);
    lines.push({sp:"narr", t:"話し合いは、離婚という結論に至った。慰謝料20万円は、新しい借金として残った（借金残高" + debtOf().toLocaleString() + "円）。法廷の外の敗北は、法廷の中より重かった。"});
  } else {
    lines.push({sp:"narr", t:"二人の関係は、ここで終わった。リングで負けるより、ずっと静かで、ずっと痛い敗北だった。"});
  }
  lines.push({fx:{attention:1, aku:1}});
  S.flags.partnerBrokeWeek = S.absWeek;
  S.partner = null;
  if (pid){
    S.affection[pid] = 40;
    S.romanceEv = S.romanceEv || {};
    const done = S.romanceEv[pid] || {};
    done.confessed = false; done.confessWaitUntil = S.absWeek + 12;
    S.romanceEv[pid] = done;
  }
  S.flags.partnerMarried = false; S.flags.partnerStrained = false; S.flags.partnerHid = false;
  return lines;
}
function partnerExposedSteps(){
  const pid = S.partner; const c = pid ? CAST_BY_ID[pid] : null;
  if (!c) return [{sp:"narr", t:"（交際相手がいない）"}];
  const pref = c.pref || "sei";
  const head = [
    {sp:"narr", t:"隠したはずのことが、別ルートから彼女の耳に入った。霧島沙耶のコラムと、CLASHのまとめ投稿。そこには、隠した分だけ誇張された事実が並んでいた。"},
    {img:pid},
    {sp:pid, t:"……「大したことない」って言ったよね。私が怒ってるのは、事件のことじゃない。隠したことだよ"},
  ];
  S.flags.partnerHid = false;
  if (pref === "aku" && _rng() < 0.5){
    return head.concat([
      {sp:pid, t:"……でもまあ、隠し事のある男も、味があって嫌いじゃない。次は先に言いなさい。次は、無い方がいいけどね"},
      {sp:"narr", t:"彼女は笑って流した。だが、その笑顔は「最後の許し」の色をしていた。"},
      {fx:{affection:{[pid]:-10}}},
    ]);
  }
  if (pref === "power" && partnerSeverity() < 4){
    S.flags.partnerStrained = true;
    return head.concat([
      {sp:pid, t:"実力も誠実さも、リングの外で試されるの。……しばらく、距離を置きましょう"},
      {sp:"narr", t:"別れではなかった。だが「嘘」の分だけ、修復のハードルは上がった。借金を返し切ることが、最低条件になる。"},
      {fx:{affection:{[pid]:-20}}},
    ]);
  }
  return head.concat(partnerBreakupLines([
    {sp:pid, t:"ごめんなさい。私は、隣にいる人の言葉を信じられなくなったら、もう一緒にいられない"},
  ]));
}
function partnerRecoverSteps(){
  const pid = S.partner; const c = pid ? CAST_BY_ID[pid] : null;
  if (!c) return [{sp:"narr", t:"（交際相手がいない）"}];
  S.flags.partnerStrained = false;
  return [
    {sp:"narr", t:"借金を、返し切った。その夜、完済の知らせを彼女に伝えた。"},
    {img:pid},
    {sp:pid, t:"……本当に、返したんだ。逃げずに、全部。……ねえ、その姿、私はずっと見てたんだよ"},
    {sp:"narr", t:"冷えた関係に、静かに温度が戻った。訴訟の記憶は消えない。だが「返し切った男」という事実は、それより長く残る。"},
    {fx:{affection:{[pid]:15}, sei:1}},
  ];
}
// ---------- 本場留学ルート（第75節：借金で資金調達） ----------
const ABROAD_LOAN_CAP = 300000; // 借金残高がこの額以上あると新規の借入は断られる
function abroadDest(){
  const st = mainStyle(); const name = st ? st.name : ""; const cat = st ? st.cat : "";
  const D = (place, zone) => ({place, zone, cost: zone === "domestic" ? 300000 : zone === "asia" ? 500000 : 700000});
  if (/ムエタイ|ムエボーラン|ムエラオ/.test(name)) return D("タイ・バンコクの名門ジム", "asia");
  if (/レスウェイ/.test(name)) return D("ミャンマー・ヤンゴンのジム", "asia");
  if (/プラダル/.test(name)) return D("カンボジア・プノンペンのジム", "asia");
  if (/ブラジリアン柔術|カポエイラ/.test(name)) return D("ブラジル・リオデジャネイロ", "far");
  if (/サンボ/.test(name)) return D("ロシア・モスクワ方面のクラブ", "far");
  if (/シラット/.test(name)) return D("インドネシア・ジャカルタ", "asia");
  if (/クラヴマガ/.test(name)) return D("イスラエルの訓練施設", "far");
  if (/ルチャ/.test(name)) return D("メキシコ・アレナの世界", "far");
  if (/アーマードバトル/.test(name)) return D("ドイツの古城と工房", "far");
  if (/モンゴル|ブフ/.test(name)) return D("モンゴル・ウランバートル", "asia");
  if (/ボクシング/.test(name)) return D("アメリカ・ロサンゼルスの老舗ジム", "far");
  if (/講道館柔道|高専柔道/.test(name)) return D("東京・講道館本部", "domestic");
  if (/相撲/.test(name)) return D("東京・両国の相撲部屋", "domestic");
  if (cat === "中国武術"){
    if (/太極拳/.test(name)) return D("中国・陳家溝", "asia");
    if (/少林/.test(name)) return D("中国・嵩山", "asia");
    return D("中国・各地の武館", "asia");
  }
  if (cat === "日本の空手系") return D("沖縄・那覇", "domestic");
  if (cat === "日本の柔術・柔道・合気・相撲系") return D("東京・本部道場", "domestic");
  if (cat === "朝鮮半島") return D("韓国・ソウル", "asia");
  if (cat === "東南アジア") return D("タイ・バンコク", "asia");
  return D("アメリカ・ラスベガス", "far");
}
function abroadEligible(){
  if (!S || S.chapter < 2 || S.flags.abroadDone || S.mainStyle == null) return false;
  const lv = styleLv(S.mainStyle);
  if (lv < 5) return false;
  // 留学の8週間は固定ビートを跨げないため、直近にビートがある間は提示を待つ（0週間の留学を防ぐ）
  if (nextBeatAbsWeek() - S.absWeek < 9) return false;
  if (S.flags.abroadOfferLv == null) return true;
  return lv >= S.flags.abroadOfferLv + 2; // 見送った場合は、主・流儀が2レベル上がるごとに再提示
}
function nextBeatAbsWeek(){
  const allBeats = BEATS.concat(typeof BEATS_CH2 !== "undefined" ? BEATS_CH2 : [], typeof BEATS_CH3 !== "undefined" ? BEATS_CH3 : [], typeof BEATS_CH4 !== "undefined" ? BEATS_CH4 : []);
  let best = Infinity;
  for (const b of allBeats){ if (b.week > S.absWeek && !S.beatsDone[b.week + ":" + b.id]) best = Math.min(best, b.week); }
  return best;
}
// 留学の時間経過： 月末精算（月謝・請求書・借金の分割返済）を回しながら進める。固定ビートの週は跨がない
function skipWeeksAbroad(n){
  let steps = 0;
  while (steps < n){
    const nb = nextBeatAbsWeek();
    if (nb !== Infinity && S.absWeek + 1 >= nb) break;
    S.absWeek++; steps++;
    if ((S.absWeek - 1) % WEEKS_PER_YEAR === 0) S.age++;
    if (S.absWeek % 4 === 0){
      const tuition = S.students.length * TUITION; if (tuition > 0) S.money += tuition;
      const dojoRent = S.chapter >= 2 ? 48000 : 0;
      const gearCost = S.chapter >= 2 ? S.students.length * 1500 : 0;
      const onoCost = (S.chapter >= 2 && S.flags.onoPlan) ? 12000 : 0;
      const ch4Cost = ch4MonthlyCosts();
      S.money -= (MONTHLY_BILLS + dojoRent + gearCost + onoCost + ch4Cost.total);
      monthlyDebtPayment(false);
    }
  }
  if (S.seminarCd > 0) S.seminarCd = Math.max(0, S.seminarCd - steps);
  return steps;
}
function abroadPayLines(mode){
  const dest = abroadDest();
  const cost = dest.cost;
  if (mode === "cash"){
    if (S.money >= cost){
      S.money -= cost;
      return [{sp:"narr", t:"留学費用" + cost.toLocaleString() + "円を支払った。貯えは大きく減ったが、これは「投資」だ。"}];
    }
    UI.queue = [
      {sp:"narr", t:"数えてみれば、所持金は" + Math.max(0, S.money).toLocaleString() + "円。費用の" + cost.toLocaleString() + "円には届かなかった。"},
      {sp:"narr", t:"今回は見送るしかない。だが、本場への道が消えたわけではない。力を付けて、出直そう。"},
    ];
    return null;
  }
  if (debtOf() >= ABROAD_LOAN_CAP){
    UI.queue = [
      {sp:"narr", t:"借入の相談をしたが、現在の借金残高では新規の借入は断られた。「まず返してから、出直してこい」――冷たいが、正しい言葉だった。"},
      {sp:"narr", t:"今回は見送る。借金を減らし、力を付けてから、また考えよう。"},
    ];
    return null;
  }
  addDebt(cost);
  return [
    {img:"genda"},
    {sp:"narr", t:"借入の段取りは、思いのほか早く進んだ。バイト先の田村が金融屋の知人を紹介し、保証人の欄には――源田巌が、黙って判を押した。"},
    {sp:"genda", t:"借りた金は、稽古で返せ。……行ってこい、本場へ"},
    {sp:"narr", t:"留学費用" + cost.toLocaleString() + "円を借り入れた（借金残高" + debtOf().toLocaleString() + "円）。月末の精算で、少しずつ返していく。"},
  ];
}
function abroadGoLines(){
  // 第82節: 古傷の蓄積が重いまま留学すると「現地で悪化→早期帰国」のエピソード・バッドエンドになる
  let dmgTotal = 0; for (const k in (S.dmg || {})) dmgTotal += S.dmg[k] || 0;
  const badBody = dmgTotal >= 8;
  const skipped = skipWeeksAbroad(badBody ? 4 : 8);
  const notes = [];
  gainStyleExp(S.mainStyle, badBody ? 120 : 240, notes);
  S.flags.abroadDone = true;
  const lines = [{sp:"narr", t:"――そして、" + skipped + "週間が過ぎた。"}];
  if (badBody){
    lines.push({sp:"narr", t:"だが、蓄積した古傷が現地の高地と稽古量に耐えなかった。膝と腰が悲鳴を上げ、主治医の判断で早期帰国が決まった。費用は全額かかり、得られたものは半分。――体の管理を後回しにした代償は、本場でも容赦なく回ってきた。"});
    lines.push({fx:{attention:1, flags:{abroadBadEnd:true}}});
  }
  for (const n of notes) lines.push({sp:"narr", t:n});
  return lines;
}
function abroadTripSteps(){
  return [
    {sp:"narr", t:"【本場留学 ― {abroad}】言葉も、空気も、稽古の流儀も違う土地。{style}が生まれた場所に、身を置く日々が始まった。"},
    {sp:"narr", t:"――洗礼は、初日からだった。稽古の号令が全く聞き取れない。見様見真似で動けば笑われ、休憩の取り方一つで「よそから来た若者」の扱いを受ける。現地の若手に「お前の{style}は、教科書の形だ」と言われた夜は、布団の中で型を反芻した。"},
    {sp:"narr", t:"現地でも最強論争はあった。ネットの現地版では、自分の映像が「本場で修行中の日本人」として回り、『段位は盛っていないか』の査定まで始まっていた。武クラは、世界共通だった。"},
    {sp:"narr", t:"――転機は、中盤の一組手だった。本場の先輩は、こちらの型の「入り方」ではなく「意味」を崩してきた。教わった通りの形が、意味ごとほどけていく。だが、そのほどけた先で初めて、型が「自分の動き」として組み直される感覚があった。"},
    {sp:"narr", t:"帰国前、現地の若手との交流試合が組まれた。勝敗より、この二か月を証明する一戦だった。"},
    {battle:"abroad_fight", win:[
      {sp:"narr", t:"現地の若手に、内容で勝った。試合後、初日に笑った若手が近づいてきて、拙い言葉で言った。「……お前の{style}、本物だ」"},
    ], lose:[
      {sp:"narr", t:"内容では一歩及ばなかった。だが初日に笑った若手が、帰り際に握手を求めてきた。「次は、負けない」。本場の土産は、勝敗より重かった。"},
    ]},
    {abroadGo:1},
    {sp:"narr", t:"帰国。空港には源田が迎えに来ていた。一目見て、師範は言った。「目が変わったな」"},
    {fx:{attention:3, sei:2}},
    {sp:"narr", t:"【本場留学の効果】主・流儀の経験が大きく伸びた。以後、セミナーの集客にも「本場仕込み」の看板が効くようになる。"},
  ];
}
function abroadOfferSteps(){
  const dest = abroadDest();
  S.flags.abroadPlace = dest.place;
  const trip = abroadTripSteps();
  return [
    {img:"genda"},
    {sp:"narr", t:"稽古の後、源田巌が静かに言った。「お前の{style}は、型の『意味』で止まっている。本場の空気を吸ってこい。――{abroad}だ」"},
    {sp:"genda", t:"期間は二か月ほど。費用は" + dest.cost.toLocaleString() + "円かかる。安くはない。だが、{style}の本場で揉まれる経験は、ここでは買えん"},
    {sp:"narr", t:"大きな誘いだった。行くかどうか、そして金の工面を、決めなければならない。"},
    {choice:[
      {label:"所持金で行く（" + dest.cost.toLocaleString() + "円）", say:[{abroadPay:"cash"}].concat(trip)},
      {label:"借金して行く（保証人は源田、紹介は田村）", say:[{abroadPay:"loan"}].concat(trip)},
      {label:"今は行かない", say:[
        {sp:"narr", t:"今は、その時ではない。源田は小さく頷いた。「無理に行く旅は、実らん。……だが、本場は逃げんぞ」"},
        {sp:"narr", t:"（主・流儀のレベルがさらに上がれば、また話が来るかもしれない）"},
      ]},
    ]},
  ];
}
// ================= 第82節: デッドエンド（バッドエンド／真のデッドエンド＋リワインド） =================
// 真のデッドエンドは {deadEnd:{id,title,cause}} ステップで発火する。DEAD END画面を出し、
// 「分岐点へ戻る」で window.__rewindPoint（エピソード開始時点 or 週の開始時点の状態）へ巻き戻す。
// 見たデッドエンドは localStorage に記録され、タイトル画面に残る。
const DEADEND_KEY = "kakutogi_deadends_v1";
function getDeadEnds(){
  try { const d = JSON.parse(localStorage.getItem(DEADEND_KEY) || "[]"); return Array.isArray(d) ? d : []; }
  catch(e){ return []; }
}
function recordDeadEnd(id, title){
  const l = getDeadEnds();
  if (!l.some(x => x.id === id)){ l.push({id, title, at: Date.now()}); try { localStorage.setItem(DEADEND_KEY, JSON.stringify(l)); } catch(e){} }
}
function showDeadEnd(de){
  recordDeadEnd(de.id, de.title);
  UI.screen = "deadend";
  hud();
  $("main").innerHTML = '<div class="deadend"><p class="de-kicker">DEAD END</p><h2>' + esc(de.title) + '</h2>' +
    '<p class="de-cause">' + esc(de.cause) + '</p>' +
    '<p class="de-note">この世界線は、ここで終わる。――分岐点へ巻き戻して、別の選択を試すことができる。</p>' +
    '<div class="actions"><button class="btn act" data-auto="rewind"><b>分岐点へ戻る</b><span>このエピソードの開始時点からやり直す</span></button>' +
    '<button class="btn ghost" data-auto="de-title">タイトルへ（セーブは残ります）</button></div></div>';
  $("main").querySelector("[data-auto='rewind']").addEventListener("click", rewindNow);
  $("main").querySelector("[data-auto='de-title']").addEventListener("click", () => { saveGame(); renderTitle(); });
}
function rewindNow(){
  const rp = window.__rewindPoint;
  if (!rp){ renderTitle(); return; }
  try { S = JSON.parse(rp.s); } catch(e){ renderTitle(); return; }
  ensureStateCompat();
  toast("世界線を巻き戻した。分岐点から、やり直そう");
  if (rp.steps) startScene(rp.steps, rp.onDone, rp.likeId);
  else { UI.screen = "week"; renderWeek(); }
}

// ================= 第81節: 夜道の襲撃（勝利宣言の代償） =================
// 結末は主人公の蓄積で変わる：主・流儀Lv＋使える系統（組み・寝技）＋暴漢対処の経験－部位ダメージの蓄積
function attackReadiness(){
  let sc = styleLv(S.mainStyle);
  const sys = playerSystems();
  if (sys.indexOf("grapple") >= 0) sc += 2;
  if (sys.indexOf("ground") >= 0) sc += 1;
  if (S.flags.boukanHow) sc += 2; // 第1章「暴漢から守る」で身につけた実地の勘
  let dmgTotal = 0; for (const k in (S.dmg || {})) dmgTotal += S.dmg[k] || 0;
  if (dmgTotal >= 6) sc -= 3;
  if ((S.fatigue || 0) >= 80) sc -= 1;
  return sc;
}
function nightAttackSteps(){
  const sc = attackReadiness();
  const opp = S.flags.oppDeletedName || "論争の相手";
  const grappleSay = sc >= 8 ? [
    {sp:"narr", t:"突き出された刃を、体が先に読んだ。手首を掴み、体重を預けて、そのまま地面に押さえ込んだ。長年の稽古は、こういう一瞬のためにあった。"},
    {sp:"narr", t:"通行人の通報で駆けつけた警官が、男を取り押さえた。――アカウントを消して消えたはずの、" + opp + "だった。"},
    {fx:{sei:2, attention:3, flags:{attackResult:"caught"}}},
  ] : sc >= 5 ? [
    {sp:"narr", t:"刃をかわしきれなかった。腕に熱い線が走る。それでも足は動いた。距離を取り、叫びながら近くのコンビニへ転がり込んだ。男は追ってこなかった。"},
    {sp:"narr", t:"病院で腕を縫った。命に別状はない。防犯カメラの映像から、男は翌日逮捕された。アカウントを消して消えたはずの、" + opp + "だった。"},
    {fx:{dmg:{arm:2}, money:-30000, attention:3, flags:{attackResult:"injured"}}},
  ] : [
    {sp:"narr", t:"体が、動かなかった。古傷の疼きと疲労が、反応を半拍遅らせた。刃が、深く入った――。"},
    {deadEnd:{id:"de_night_attack", title:"夜道の襲撃", cause:"引き金は、勝利宣言の投稿と、蓄積した怪我と疲労だった。実力の蓄積が足りないまま刃物に向かった世界線は、ここで終わる"}},
  ];
  const escapeSay = sc >= 5 ? [
    {sp:"narr", t:"考えるより先に、走っていた。路地の配置は稽古帰りに何度も通って覚えている。角を二つ曲がり、大通りの明かりに飛び込んだ。男の足音は、遠ざかっていった。"},
    {sp:"narr", t:"防犯カメラと目撃証言から、男は数日後に逮捕された。アカウントを消して消えたはずの、" + opp + "だった。"},
    {fx:{fatigue:15, attention:2, flags:{attackResult:"escaped"}}},
  ] : [
    {sp:"narr", t:"走った。だが古傷の脚がもつれ、路地で転倒した。背中に刃が掠り、血が滲んだ。それでも這って大通りまで出たところで、通行人に助けられた。"},
    {sp:"narr", t:"病院送りになった。男は後日、防犯カメラの映像から逮捕された。アカウントを消して消えたはずの、" + opp + "だった。"},
    {fx:{dmg:{leg:2}, money:-20000, fatigue:20, attention:3, flags:{attackResult:"injured"}}},
  ];
  const shoutSay = [
    {sp:"narr", t:"腹の底から叫んだ。「人が襲われてる！ 警察！」。窓が開き、誰かが叫び返し、犬が吠えた。男は舌打ちして、闇に走り去った。"},
    {sp:"narr", t:"防犯カメラの映像が決め手になり、男は後日逮捕された。アカウントを消して消えたはずの、" + opp + "だった。"},
    {fx:{attention:2, flags:{attackResult:"escaped"}}},
  ];
  const steps = [
    {sp:"narr", t:"稽古帰りの夜道。駅からの十分間は、もう何年も通った道だった。その日は、路地の電柱の陰に、人影があった。"},
    {sp:"narr", t:"「……あんたのせいで、俺は全部失った」。アカウントを消して消えたはずの男だった。手には、刃物が光っていた。"},
    {sp:"me", t:"（言葉の試合の、続きが来た。――今度は、言葉が届かない場所で）"},
    {choice:[
      {label:"正面から取り押さえる", say: grappleSay},
      {label:"距離を取って逃げる", say: escapeSay},
      {label:"大声で助けを呼ぶ", say: shoutSay},
    ]},
    {sp:"narr", t:"後日、警察の聞き取りを受けた。男は傷害未遂で送検された。「ネットの言い争いの行き着く先が、刃物でしたね」刑事の言葉が、静かに重かった。"},
    {sp:"narr", t:"CLASHの反応は割れた。襲撃への同情と怒り。そして勝利宣言への批判も。「言い負かした先に、何があると思ってたの」――その投稿だけは、消せなかった。"},
  ];
  if (S.partner){
    const pc = CAST_BY_ID[S.partner];
    if (pc) steps.push({sp:"narr", t: pc.name + "から、震える声で電話が来た。「無事で……よかった」。事件は、身近な人の日常にも、確かに届いていた。"});
  }
  steps.push({sp:"narr", t:"オカンからも電話が来た。「あんた、武道で飯を食うって……こういうことまで、あるんか」。返せる言葉が、なかった。"});
  steps.push({fx:{flags:{attackDone:true}}});
  return steps;
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
    if (st.mimg){ const ms = mainStyle(); UI.portrait = ms ? "master-" + masterArtKey(ms) : null; continue; }
    if (st.ep !== undefined){ UI.episode = st.ep; continue; }
    if (st.fx){ applyFx(st.fx); continue; }
    if (st.jump){ startSceneById(st.jump); return; }
    if (st.week){ finishScene(); return; }
    if (st.endChapter){ chapterEndScreen(); return; }
    if (st.endChapter2){ chapter2EndScreen(); return; }
    if (st.ch2skip){ __ch2Skip(); return; }
    if (st.endChapter3){ chapter3EndScreen(); return; }
    if (st.endChapter3retire){ retireEndScreen(); return; }
    if (st.ch3skip){ __ch3Skip(); return; }
    if (st.warWinK){ dojoWarResultKatori(true); continue; }
    if (st.warLoseK){ dojoWarResultKatori(false); continue; }
    if (st.endChapter4){ chapter4EndScreen(); return; }
    if (st.endChapter4retire){ chapter4RetireScreen(); return; }
    if (st.ch4skip){ __ch4Skip(); return; }
    if (st.warWinM){ dojoWarResultMamiya(true); continue; }
    if (st.warLoseM){ dojoWarResultMamiya(false); continue; }
    if (st.dopeVerdict){ UI.queue = dopeVerdictLines().concat(UI.queue); continue; }
    if (st.bbsMark){
      if (st.bbsMark === "post"){ S.flags.bbsPosted = true; S.flags.bbsPostWeek = S.absWeek; }
      if (st.bbsMark === "expose"){ S.flags.bbsExposed = true; S.flags.bbsExposeWeek = S.absWeek; }
      continue;
    }
    if (st.courtVerdict){ UI.queue = courtVerdictLines().concat(UI.queue); continue; }
    if (st.courtVerdict2){ UI.queue = civilVerdictLines("clash").concat(UI.queue); continue; }
    if (st.courtVerdict3){ UI.queue = civilVerdictLines("video").concat(UI.queue); continue; }
    if (st.legalPay){ UI.queue = settleBillLines(st.legalPay.title || st.legalPay.label, [{label: st.legalPay.label, amount: st.legalPay.amount}]).concat(UI.queue); continue; }
    if (st.markFlag){ S.flags[st.markFlag] = true; S.flags[st.markFlag + "Week"] = S.absWeek; continue; }
    if (st.clashSueIntro){ UI.queue = clashSueIntroLines().concat(UI.queue); continue; }
    if (st.injuryIntro){ UI.queue = injuryIntroLines().concat(UI.queue); continue; }
    if (st.injurySettlePay){ UI.queue = injurySettleLines().concat(UI.queue); continue; }
    if (st.injuryFine){ UI.queue = injuryFineLines().concat(UI.queue); continue; }
    if (st.partnerCrisis){ UI.queue = partnerCrisisSteps().concat(UI.queue); continue; }
    if (st.partnerReact){ UI.queue = partnerReactLines(st.partnerReact).concat(UI.queue); continue; }
    if (st.partnerExposed){ UI.queue = partnerExposedSteps().concat(UI.queue); continue; }
    if (st.partnerRecover){ UI.queue = partnerRecoverSteps().concat(UI.queue); continue; }
    if (st.abroadPay){ const lines = abroadPayLines(st.abroadPay); if (lines) UI.queue = lines.concat(UI.queue); continue; }
    if (st.abroadGo){ UI.queue = abroadGoLines().concat(UI.queue); continue; }
    if (st.nightAttack){ UI.queue = nightAttackSteps().concat(UI.queue); continue; }
    if (st.deadEnd){ UI.queue = []; showDeadEnd(st.deadEnd); return; }
    if (st.raidIntro){ UI.queue = raidIntroLines().concat(UI.queue); continue; }
    if (st.douhanEnd){
      const score = (S.flags && S.flags.douhanScore) || 0;
      let lines;
      if (score >= 4) lines = [{sp:"narr", t:"店を出る頃、ユイが小さく言った。「今日の同伴、すごく楽しかった。……また、誘ってくれる？」作務衣の第一印象から食事の選び方まで、今夜の選択は彼女の中で高く残ったようだ。"},{fx:{sei:1, attention:1}}];
      else if (score >= 1) lines = [{sp:"narr", t:"店を出る頃、ユイは穏やかに笑った。「今日はありがとう。落ち着く同伴だった」大きな失敗も、大きな爪痕もない。だが、悪くない夜だった。"},{fx:{attention:1}}];
      else lines = [{sp:"narr", t:"店を出る頃、ユイは少しだけ苦笑した。「今日は……うん、武術家らしい夜だったね」評価は伸びなかった。夜の街の礼儀は、リングとは別の難しさがあった。"}];
      UI.queue = lines.concat(UI.queue); continue;
    }
    if (st.warWin){ dojoWarResult(true); continue; }
    if (st.warLose){ dojoWarResult(false); continue; }
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
// エピソードイラスト（第68節）: シーンに {ep:"<slug>"} を持たせると場面イラストを表示する。見切れ防止のため object-fit:contain（CSS .epimg）
function episodeHtml(){
  if (!UI.episode) return "";
  return '<div class="epimg"><img src="assets/episodes/ep-' + UI.episode + '.webp" alt="" onerror="this.parentNode.style.display=\'none\'"></div>';
}
function renderSay(st){
  hud();
  const sp = st.sp || "narr";
  const name = speakerName(sp);
  $("main").innerHTML = episodeHtml() + '<div class="scene">' + portraitHtml() +
    '<div class="dialog">' + (name ? '<div class="spname">' + esc(name) + '</div>' : "") +
    '<div class="stext">' + esc(fill(st.t)) + '</div>' +
    '<button class="btn next" data-auto="next">次へ</button>' + clashBarHtml() + '<div data-composer></div></div></div>';
  $("main").querySelector(".next").addEventListener("click", sceneAdvance);
  bindClashBar();
}
function renderChoice(st){
  hud();
  const btns = st.choice.map((c, i) => '<button class="btn choice" data-choice="' + i + '">' + esc(fill(c.label)) + '</button>').join("");
  $("main").innerHTML = episodeHtml() + '<div class="scene">' + portraitHtml() +
    '<div class="dialog"><div class="stext">――どうする？</div><div class="choices">' + btns + '</div>' + clashBarHtml() + '<div data-composer></div></div></div>';
  $("main").querySelectorAll("[data-choice]").forEach(b => b.addEventListener("click", () => {
    const c = st.choice[Number(b.dataset.choice)];
    if (c.fx) applyFx(c.fx);
    UI.queue = (c.say || []).concat(UI.queue);
    sceneAdvance();
  }));
  bindClashBar();
}

// ---------- CLASH投稿バー（第72節）: エピソード毎の👍反応と「CLASHに書き込む」 ----------
// 表示条件: エピソードイラスト表示中は常時／イベント（カメオ・スペシャル・あるある等）はその終わりの画面で
function currentLikeTarget(){
  if (UI.episode) return UI.likeId || ("ep:" + UI.episode);
  if (UI.likeId && isLikeableId(UI.likeId)) return UI.likeId;
  return null;
}
function sceneHasMoreContent(){
  return UI.queue.some(st => st.t !== undefined || st.choice || st.battle || st.debate || st.jump !== undefined);
}
function clashBarHtml(){
  const target = currentLikeTarget();
  if (!target) return "";
  if (!UI.episode && sceneHasMoreContent()) return ""; // イベント本編の途中では出さない（イラスト表示時は常時）
  const liked = isLiked(target);
  return '<div class="clashbar"><span class="clashmark">CLASH</span>' +
    '<button class="btn clashreact' + (liked ? " liked" : "") + '" data-like="' + esc(target) + '">' + (liked ? "👍 面白かった（反応済み）" : "👍 面白かった") + '</button>' +
    '<button class="btn ghost" data-compose="' + esc(target) + '">✍ CLASHに書き込む</button></div>';
}
function bindClashBar(){
  const main = $("main"); if (!main) return;
  const rb = main.querySelector("[data-like]");
  if (rb) rb.addEventListener("click", () => {
    const now = toggleLike(rb.dataset.like);
    rb.classList.toggle("liked", now);
    rb.textContent = now ? "👍 面白かった（反応済み）" : "👍 面白かった";
    toast(now ? "👍を記録しました（タイトルの『あなたのCLASH投稿』で確認できます）" : "👍を取り消しました");
  });
  const cb = main.querySelector("[data-compose]");
  if (cb) cb.addEventListener("click", () => openComposer(cb.dataset.compose));
}
// 投稿パネル: エピソードのタグが自動で付き、本文を書いて「投稿する」と端末内のCLASHに残る。
// 「この内容を開発にも送る」は本文をクリップボードへコピーしてから Googleフォームを新しいタブで開く
function openComposer(target){
  const box = $("main").querySelector("[data-composer]");
  if (!box) return;
  const tag = episodeTag(target);
  const liked = isLiked(target);
  box.innerHTML = '<div class="clashpost">' +
    '<div class="who">あなた <span>@player ― CLASHに書き込む</span></div>' +
    '<div><span class="tagchip">#' + esc(tag) + '</span> <span class="tagchip dim">' + esc(episodeLabel(target)) + '</span></div>' +
    '<textarea data-post-text rows="3" maxlength="500" placeholder="このエピソードの感想・ツッコミ・ネタ・改善案など"></textarea>' +
    '<label class="reactline"><input type="checkbox" data-post-react' + (liked ? " checked" : "") + '> 👍 このエピソードに反応する（面白かった）</label>' +
    '<div class="composerrow">' +
      '<button class="btn next" data-post-submit>投稿する</button>' +
      '<button class="btn" data-post-send>この内容を開発にも送る</button>' +
      '<button class="btn ghost" data-post-close>閉じる</button>' +
    '</div>' +
    '<div class="sendnote">「開発にも送る」は、本文をコピーしてから意見フォーム（人気投票つき）を新しいタブで開きます。フォームに貼り付けて送信すると、全体の集計に反映されます。</div>' +
    '<div data-post-feed></div></div>';
  const ta = box.querySelector("[data-post-text]");
  if (ta) ta.focus();
  box.querySelector("[data-post-close]").addEventListener("click", () => { box.innerHTML = ""; });
  box.querySelector("[data-post-submit]").addEventListener("click", () => {
    const text = (ta.value || "").trim();
    const react = box.querySelector("[data-post-react]").checked;
    if (!text && !react){ toast("本文を書くか、👍反応を付けてください", true); return; }
    if (react) setLiked(target, true);
    const p = {ep: target, tag: tag, text: text, liked: react, at: Date.now()};
    addPost(p);
    const rb = $("main").querySelector("[data-like]");
    if (rb && react){ rb.classList.add("liked"); rb.textContent = "👍 面白かった（反応済み）"; }
    const feed = box.querySelector("[data-post-feed]");
    feed.innerHTML = '<div class="clashpost mine"><div class="who">あなた <span>@player</span></div>' +
      '<div><span class="tagchip">#' + esc(tag) + '</span></div>' +
      (text ? '<div class="txt">' + esc(text) + '</div>' : "") +
      (react ? '<div class="reactdisp">👍 面白かった</div>' : "") +
      '<div class="sendnote">CLASHに投稿しました（この端末に保存されています）</div></div>';
    toast("CLASHに投稿しました");
  });
  box.querySelector("[data-post-send]").addEventListener("click", () => {
    const text = (ta.value || "").trim();
    const body = "#" + tag + "\n" + text;
    const open = () => window.open(FEEDBACK_FORM_URL, "_blank", "noopener");
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(body).then(() => { toast("本文をコピーしました。フォームに貼り付けて送信してください"); open(); },
        () => { toast("コピーはできませんでしたが、フォームを開きます", true); open(); });
    } else open();
  });
}

// ---------- 週間ループ ----------
const BEATS = [
  {week:1, id:"beat_underling"}, {week:3, id:"beat_seminar_fail"}, {week:5, id:"beat_baito_clash"},
  // 第68節: 実在モデル組の段階的登場（第1章の固定カメオ。場面定義は story-cameos.js が STORY_CH1 へ追加する）
  {week:2, id:"cam1_shiina"}, {week:7, id:"cam1_takeru"}, {week:10, id:"cam1_fukaya"},
  {week:14, id:"cam1_namioka"}, {week:18, id:"cam1_shinohara"}, {week:22, id:"cam1_akai"}, {week:26, id:"cam1_bushika"},
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
  UI.screen = "week"; UI.portrait = null; UI.episode = null;
  // 年末イベント BOTY（武クラ・オブ・ザ・イヤー／第68節）: 年が明けた直後の週に、前の年の発表を1回だけ挟む
  if (typeof tryBotyScene === "function" && tryBotyScene()) return;
  // 第82節: 借金の夜逃げデッドエンド（月末精算で条件を満たしていた場合、週の頭で提示する）
  if (S.flags.debtDeadEndPending){
    S.flags.debtDeadEndPending = false;
    startScene([
      {sp:"narr", t:"借金の残高は、150万円を超えた。督促の電話は日に何度も鳴り、道場の家賃も、生徒の月謝も、もうどこにも逃げ場がなかった。"},
      {sp:"narr", t:"深夜。荷物を小さなバッグ一つに詰め、電気の消えた道場を振り返った。「……夜逃げ屋の真似事まで、武道家がすることか」"},
      {deadEnd:{id:"de_debt", title:"借金 ― 夜逃げ", cause:"引き金は、積み上がった借金だった。賠償・示談・留学――一つ一つの選択は小さくても、返済の実績がないまま残高が150万円を超えた世界線は、ここで終わる"}},
    ], null, null); // 巻き戻し先は週頭のスナップショット（renderWeek）を使うため likeId は付けない
    return;
  }
  // 第75節: 本場留学の提示（第2章以降・主・流儀Lv5以上・一度だけ大きく。見送れば+2Lvで再提示）
  if (typeof abroadEligible === "function" && abroadEligible()){
    S.flags.abroadOfferLv = styleLv(S.mainStyle);
    S.flags.abroadPlace = abroadDest().place;
    startScene(abroadOfferSteps(), null, "abroad_offer");
    return;
  }
  const allBeats = BEATS.concat(typeof BEATS_CH2 !== "undefined" ? BEATS_CH2 : [], typeof BEATS_CH3 !== "undefined" ? BEATS_CH3 : [], typeof BEATS_CH4 !== "undefined" ? BEATS_CH4 : []);
  const beat = allBeats.find(b => b.week === S.absWeek && !S.beatsDone[b.week + ":" + b.id]);
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
  // 第82節: 週の開始時点を巻き戻しポイントにする（エピソード外で起きるデッドエンド用）
  if (S){ try { window.__rewindPoint = {s: JSON.stringify(S), steps: null, onDone: null, likeId: null}; } catch(e){} }
  const st = mainStyle();
  const acts = [
    ["train_main", "稽古（主・流儀）", (st ? st.name : "") + " Lv" + styleLv(S.mainStyle) + " の稽古。経験値+10"],
    ["train_sub", "他流派を学ぶ", "全156流派から選ぶ（独学／セミナー／個人指導）"],
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
  // 第78節: コラボ企画（第2章以降・インフルエンサー系と出会っている場合のみ）
  if (S.chapter >= 2 && typeof collabPartnerList === "function" && collabPartnerList().length)
    acts.splice(8, 0, ["collab", "コラボ企画", "動画配信・合同イベント（相手を選ぶ）"]);
  $("main").innerHTML = '<div class="weekhead"><h2>' + weekLabel() + '</h2>' +
    '<div class="weeksub">二つ名：' + esc(nickname()) + "　／　純粋度：" + purity() + "%" + (debtOf() > 0 ? "　／　借金：" + debtOf().toLocaleString() + "円（月末に分割返済）" : "") + "</div>" +
    '<div class="stext" style="color:var(--sub);font-size:.92em;">' + esc(WEEK_FLAVOR[S.absWeek % WEEK_FLAVOR.length]) + "</div></div>" +
    '<div class="actions">' + acts.map(a => '<button class="btn act" data-act="' + a[0] + '"><b>' + a[1] + '</b><span>' + esc(a[2]) + '</span></button>').join("") + "</div>";
  $("main").querySelectorAll("[data-act]").forEach(b => b.addEventListener("click", () => doAction(b.dataset.act)));
}
function afterAction(notes){
  for (const n of (notes || [])) toast(n);
  endWeek();
}
function logEventFire(category, e){
  window.__eventLog = window.__eventLog || [];
  window.__eventLog.push({category: category, id: e.id, week: S.absWeek, chapter: S.chapter});
}
function eventEligible(e){
  if (e.chapters && !e.chapters.includes(S.chapter)) return false;
  if (e.minStudents != null && S.students.length < e.minStudents) return false;
  if (e.minFameRank != null && fameRankIdx() < e.minFameRank) return false;
  if (e.condFatigue != null && S.fatigue < e.condFatigue) return false;
  return true;
}
function pickWeighted(cands){
  let tot = 0; for (const c of cands) tot += (c.weight || 1);
  let r = _rng() * tot;
  for (const c of cands){ r -= (c.weight || 1); if (r <= 0) return c; }
  return cands[0];
}
// 第3章専用プールの抽選（story-ch3.js の CH3_* プール。共通プールは chapters:[1,2] のため第3章では発火しない）
function pickCh3Event(){
  const yw = ((S.absWeek - 1) % WEEKS_PER_YEAR) + 1;
  const yearIdx = Math.floor((S.absWeek - 1) / WEEKS_PER_YEAR);
  if (typeof CH3_SEASONAL_EVENTS !== "undefined"){
    const seasonCount = Object.keys(S.seenEvents).filter(k => k.indexOf("season3:") === 0 && k.endsWith(":" + yearIdx)).length;
    if (seasonCount < 2){
      const sc = CH3_SEASONAL_EVENTS.filter(e => eventEligible(e) && yw >= e.window[0] && yw <= e.window[1] && !S.seenEvents["season3:" + e.id + ":" + yearIdx]);
      if (sc.length && _rng() < 0.55){ const e = sc[rnd(sc.length - 1)]; S.seenEvents["season3:" + e.id + ":" + yearIdx] = S.absWeek; logEventFire("season3", e); return e; }
    }
  }
  if (S.absWeek - S.lastRandomWeek < 2) return null;
  if (typeof CH3_STUDENT_DRAMA !== "undefined"){
    const dc = CH3_STUDENT_DRAMA.filter(e => eventEligible(e) && !S.seenEvents[e.id]);
    if (dc.length && _rng() < 0.30){ const e = pickWeighted(dc); S.seenEvents[e.id] = S.absWeek; logEventFire("student3", e); return e; }
  }
  if (typeof CH3_WEEK_EVENTS !== "undefined"){
    const vc = CH3_WEEK_EVENTS.filter(e => eventEligible(e) && !S.seenEvents[e.id]);
    if (vc.length && _rng() < 0.32){ const e = pickWeighted(vc); S.seenEvents[e.id] = S.absWeek; logEventFire(e.category, e); return e; }
  }
  return null;
}
// 第4章専用プールの抽選（story-ch4.js の CH4_* プール。第3章の pickCh3Event と同方式）
function pickCh4Event(){
  const yw = ((S.absWeek - 1) % WEEKS_PER_YEAR) + 1;
  const yearIdx = Math.floor((S.absWeek - 1) / WEEKS_PER_YEAR);
  if (typeof CH4_SEASONAL_EVENTS !== "undefined"){
    const seasonCount = Object.keys(S.seenEvents).filter(k => k.indexOf("season4:") === 0 && k.endsWith(":" + yearIdx)).length;
    if (seasonCount < 2){
      const sc = CH4_SEASONAL_EVENTS.filter(e => eventEligible(e) && yw >= e.window[0] && yw <= e.window[1] && !S.seenEvents["season4:" + e.id + ":" + yearIdx]);
      if (sc.length && _rng() < 0.55){ const e = sc[rnd(sc.length - 1)]; S.seenEvents["season4:" + e.id + ":" + yearIdx] = S.absWeek; logEventFire("season4", e); return e; }
    }
  }
  if (S.absWeek - S.lastRandomWeek < 2) return null;
  if (typeof CH4_STUDENT_DRAMA !== "undefined"){
    const dc = CH4_STUDENT_DRAMA.filter(e => eventEligible(e) && !S.seenEvents[e.id]);
    if (dc.length && _rng() < 0.30){ const e = pickWeighted(dc); S.seenEvents[e.id] = S.absWeek; logEventFire("student4", e); return e; }
  }
  if (typeof CH4_WEEK_EVENTS !== "undefined"){
    const vc = CH4_WEEK_EVENTS.filter(e => eventEligible(e) && !S.seenEvents[e.id]);
    if (vc.length && _rng() < 0.32){ const e = pickWeighted(vc); S.seenEvents[e.id] = S.absWeek; logEventFire(e.category, e); return e; }
  }
  return null;
}
// 週末イベント抽選（ワンパターン対策・第39/40節）: 季節（年最大2本）→生徒ドラマ→共通プールV2→従来プールの順
function pickEndWeekEvent(){
  ensureStateCompat();
  if (S.chapter === 3){ const e3 = pickCh3Event(); if (e3) return e3; }
  if (S.chapter === 4){ const e4 = pickCh4Event(); if (e4) return e4; }
  // 第46・47節: 匿名掲示板の連鎖（書く→身バレ→裁判→道場への乗り込み）。フラグと週数で段階発火し、1周で完結する
  if (typeof CHAIN_EVENTS !== "undefined"){
    let chainEv = null;
    if (S.flags.bbsPosted && !S.seenEvents["sp_bbs_expose"] && S.absWeek >= (S.flags.bbsPostWeek || 0) + 2 && _rng() < 0.5)
      chainEv = CHAIN_EVENTS.find(e => e.id === "sp_bbs_expose");
    else if (S.flags.bbsExposed && !S.seenEvents["sp_bbs_court"] && S.absWeek >= (S.flags.bbsExposeWeek || 0) + 1 && _rng() < 0.65)
      chainEv = CHAIN_EVENTS.find(e => e.id === "sp_bbs_court");
    else if (S.flags.courtDone && !S.seenEvents["sp_dojo_raid"] && (S.flags.courtResult === "win" || S.flags.courtResult === "lose") && S.absWeek >= (S.flags.courtWeek || 0) + 2 && _rng() < 0.5)
      chainEv = CHAIN_EVENTS.find(e => e.id === "sp_dojo_raid");
    // 第74節・経路1: CLASHの煽りが名誉毀損の訴えに発展する連鎖（内容証明→無視・煽り返しで提訴）
    else if ((S.flags.aoriCount || 0) >= 3 && !S.seenEvents["sp_clash_sue1"] && S.absWeek >= (S.flags.lastAoriWeek || 0) + 1 && _rng() < 0.55)
      chainEv = CHAIN_EVENTS.find(e => e.id === "sp_clash_sue1");
    else if (S.flags.clashSueEscalate && !S.seenEvents["sp_clash_sue2"] && S.absWeek >= (S.flags.clashSueEscalateWeek || 0) + 1 && _rng() < 0.65)
      chainEv = CHAIN_EVENTS.find(e => e.id === "sp_clash_sue2");
    // 第74節・経路2: 無断動画への抗議→揉めて提訴（肖像権）
    else if (S.flags.videoUploaded && !S.seenEvents["sp_video_protest"] && S.absWeek >= (S.flags.videoUploadedWeek || 0) + 1 && _rng() < 0.6)
      chainEv = CHAIN_EVENTS.find(e => e.id === "sp_video_protest");
    else if (S.flags.videoEscalate && !S.seenEvents["sp_video_sue"] && S.absWeek >= (S.flags.videoEscalateWeek || 0) + 1 && _rng() < 0.65)
      chainEv = CHAIN_EVENTS.find(e => e.id === "sp_video_sue");
    // 第74節・傷害ルート（刑事の側）: 被害届・聞き取り→示談交渉→蹴れば略式の罰金
    else if (!S.seenEvents["sp_injury1"] && injurySourceReady() && S.absWeek >= (S.flags.injuryBaseWeek || 0) + 2 && _rng() < 0.45)
      chainEv = CHAIN_EVENTS.find(e => e.id === "sp_injury1");
    else if (S.flags.injuryHeard && !S.seenEvents["sp_injury2"] && S.absWeek >= (S.flags.injuryHeardWeek || 0) + 1 && _rng() < 0.6)
      chainEv = CHAIN_EVENTS.find(e => e.id === "sp_injury2");
    else if (S.flags.injuryNoSettle && !S.seenEvents["sp_injury3"] && S.absWeek >= (S.flags.injuryNoSettleWeek || 0) + 1 && _rng() < 0.65)
      chainEv = CHAIN_EVENTS.find(e => e.id === "sp_injury3");
    // 第76節: 訴訟・借金が恋愛に波及する連鎖（修羅場→隠せばバレて最悪／冷えた関係は完済で修復）
    else if (S.flags.partnerCrisisPending && S.partner && !S.seenEvents["sp_partner_crisis"] && S.absWeek >= S.flags.partnerCrisisPending + 1 && _rng() < 0.6)
      chainEv = CHAIN_EVENTS.find(e => e.id === "sp_partner_crisis");
    else if (S.flags.partnerHid && S.partner && !S.seenEvents["sp_partner_exposed"] && S.absWeek >= (S.flags.partnerHidWeek || 0) + 2 && _rng() < 0.6)
      chainEv = CHAIN_EVENTS.find(e => e.id === "sp_partner_exposed");
    else if (S.flags.partnerStrained && S.partner && debtOf() <= 0 && !S.seenEvents["sp_partner_recover"] && _rng() < 0.7)
      chainEv = CHAIN_EVENTS.find(e => e.id === "sp_partner_recover");
    // 第80節: バックの存在（中傷→数週置いて訪問→無視で圧力が段階的に上がる）
    else if (S.flags.backedInsult && !S.seenEvents["sp_back_visit1"] && S.absWeek >= (S.flags.backedInsultWeek || 0) + 2 && _rng() < 0.6)
      chainEv = CHAIN_EVENTS.find(e => e.id === "sp_back_visit1");
    else if (S.flags.backIgnored && !S.seenEvents["sp_back_visit2"] && S.absWeek >= (S.flags.backIgnoredWeek || 0) + 1 && _rng() < 0.65)
      chainEv = CHAIN_EVENTS.find(e => e.id === "sp_back_visit2");
    else if (S.flags.backIgnored2 && !S.seenEvents["sp_back_visit3"] && S.absWeek >= (S.flags.backIgnored2Week || 0) + 1 && _rng() < 0.7)
      chainEv = CHAIN_EVENTS.find(e => e.id === "sp_back_visit3");
    // 第81節: 相手がアカウントを消した後の「勝利宣言」→夜道の襲撃
    else if (S.flags.oppDeleted && !S.seenEvents["sp_victory_declare"] && S.absWeek >= (S.flags.oppDeletedWeek || 0) + 1 && _rng() < 0.7)
      chainEv = CHAIN_EVENTS.find(e => e.id === "sp_victory_declare");
    else if (S.flags.victoryDeclared && !S.seenEvents["sp_night_attack"] && S.absWeek >= (S.flags.victoryDeclaredWeek || 0) + 1 && _rng() < 0.55)
      chainEv = CHAIN_EVENTS.find(e => e.id === "sp_night_attack");
    // 第87節: 界隈大炎上編（第2章以降・1周1回。週をまたいで8段が連鎖する。疑惑の当事者は架空人物、
    // 達人グループの反応役と目つき騒動にはオマージュキャストを充てる。借金・訴訟系には接続しない）
    else if (S.chapter >= 2 && !S.seenEvents["sp_burn1"] && _rng() < 0.22)
      chainEv = CHAIN_EVENTS.find(e => e.id === "sp_burn1");
    else if (S.flags.burn2 && !S.seenEvents["sp_burn2"] && S.absWeek >= (S.flags.burn2Week || 0) + 3 && _rng() < 0.55)
      chainEv = CHAIN_EVENTS.find(e => e.id === "sp_burn2");
    else if (S.flags.burn3 && !S.seenEvents["sp_burn3"] && S.absWeek >= (S.flags.burn3Week || 0) + 2 && _rng() < 0.55)
      chainEv = CHAIN_EVENTS.find(e => e.id === "sp_burn3");
    else if (S.flags.burn4 && !S.seenEvents["sp_burn4"] && S.absWeek >= (S.flags.burn4Week || 0) + 3 && _rng() < 0.55)
      chainEv = CHAIN_EVENTS.find(e => e.id === "sp_burn4");
    else if (S.flags.burn5 && !S.seenEvents["sp_burn5"] && S.absWeek >= (S.flags.burn5Week || 0) + 2 && _rng() < 0.6)
      chainEv = CHAIN_EVENTS.find(e => e.id === "sp_burn5");
    else if (S.flags.burn6 && !S.seenEvents["sp_burn6"] && S.absWeek >= (S.flags.burn6Week || 0) + 3 && _rng() < 0.55)
      chainEv = CHAIN_EVENTS.find(e => e.id === "sp_burn6");
    else if (S.flags.burn7 && !S.seenEvents["sp_burn7"] && S.absWeek >= (S.flags.burn7Week || 0) + 3 && _rng() < 0.55)
      chainEv = CHAIN_EVENTS.find(e => e.id === "sp_burn7");
    else if (S.flags.burn8 && !S.seenEvents["sp_burn8"] && S.absWeek >= (S.flags.burn8Week || 0) + 3 && _rng() < 0.6)
      chainEv = CHAIN_EVENTS.find(e => e.id === "sp_burn8");
    if (chainEv){ S.seenEvents[chainEv.id] = S.absWeek; logEventFire("chain", chainEv); return chainEv; }
  }
  // 第77節: 年末の帰省（借金が多い年はオカンの小言／借金が解消した年は仕送り側の逆転版）。年1回・年末の週だけ
  if (typeof okanHomeSteps === "function"){
    const ywO = ((S.absWeek - 1) % WEEKS_PER_YEAR) + 1;
    const yrO = Math.floor((S.absWeek - 1) / WEEKS_PER_YEAR);
    if (ywO >= 44 && !S.seenEvents["okan:" + yrO]){
      if (debtOf() > 500000){
        S.seenEvents["okan:" + yrO] = S.absWeek;
        S.flags.okanDebtYears = (S.flags.okanDebtYears || 0) + 1;
        const evO = {id:"sp_okan_home", category:"family", steps: okanHomeSteps()};
        logEventFire("okan", evO); return evO;
      }
      if ((S.flags.okanDebtYears || 0) > 0 && debtOf() <= 50000 && S.money > 100000){
        S.seenEvents["okan:" + yrO] = S.absWeek;
        const evG = {id:"sp_okan_home_good", category:"family", steps: okanHomeGoodSteps()};
        logEventFire("okan", evG); return evG;
      }
    }
  }
  // 第68節: 実在モデル組の段階的登場カメオ＋武クラあるある小ネタ（story-cameos.js の CAMEO_EVENTS）。3週に1回までの間隔で、1周1回だけ発火する
  if (typeof CAMEO_EVENTS !== "undefined"){
    const lastCam = (S.flags && S.flags.cameoLastWeek != null) ? S.flags.cameoLastWeek : -99;
    if (S.absWeek - lastCam >= 3){
      const cc = CAMEO_EVENTS.filter(e => eventEligible(e) && !S.seenEvents[e.id]);
      if (cc.length && _rng() < 0.5){ const e = pickWeighted(cc); S.seenEvents[e.id] = S.absWeek; S.flags.cameoLastWeek = S.absWeek; logEventFire(e.category || "cameo", e); return e; }
    }
  }
  const yw = ((S.absWeek - 1) % WEEKS_PER_YEAR) + 1;
  const yearIdx = Math.floor((S.absWeek - 1) / WEEKS_PER_YEAR);
  if (typeof SEASONAL_EVENTS !== "undefined"){
    const seasonCount = Object.keys(S.seenEvents).filter(k => k.indexOf("season:") === 0 && k.endsWith(":" + yearIdx)).length;
    if (seasonCount < 2){
      const sc = SEASONAL_EVENTS.filter(e => eventEligible(e) && yw >= e.window[0] && yw <= e.window[1] && !S.seenEvents["season:" + e.id + ":" + yearIdx]);
      if (sc.length && _rng() < 0.55){ const e = sc[rnd(sc.length - 1)]; S.seenEvents["season:" + e.id + ":" + yearIdx] = S.absWeek; logEventFire("season", e); return e; }
    }
  }
  if (S.absWeek - S.lastRandomWeek < 2) return null;
  if (typeof STUDENT_DRAMA_EVENTS !== "undefined"){
    const dc = STUDENT_DRAMA_EVENTS.filter(e => eventEligible(e) && !S.seenEvents[e.id]);
    const dp = S.chapter >= 2 ? 0.30 : 0.16; // 第2章（生徒が育った時期）では出やすく
    if (dc.length && _rng() < dp){ const e = pickWeighted(dc); S.seenEvents[e.id] = S.absWeek; logEventFire("student", e); return e; }
  }
  if (typeof WEEK_EVENTS_V2 !== "undefined"){
    const vc = WEEK_EVENTS_V2.filter(e => eventEligible(e) && !S.seenEvents[e.id]);
    if (vc.length && _rng() < 0.30){ const e = pickWeighted(vc); S.seenEvents[e.id] = S.absWeek; logEventFire(e.category, e); return e; }
  }
  // 第44節: SNS議論バトルの汎用ネタプール（全章共通・1周で同じネタは繰り返さない）
  if (typeof DEBATE_EVENTS !== "undefined"){
    const dcands = DEBATE_EVENTS.filter(e => eventEligible(e) && !S.seenEvents[e.id] && !S.seenEvents["debate:" + e.debateId]);
    if (dcands.length && _rng() < 0.25){ const e = pickWeighted(dcands); S.seenEvents[e.id] = S.absWeek; S.seenEvents["debate:" + e.debateId] = S.absWeek; logEventFire("debate", e); return e; }
  }
  // 第45・46節: 全章共通の単発スペシャルイベント（詐称騒動／掲示板への書き込み。1周1回）
  if (typeof SPECIAL_EVENTS !== "undefined"){
    const spc = SPECIAL_EVENTS.filter(e => eventEligible(e) && !S.seenEvents[e.id]);
    if (spc.length && _rng() < 0.22){ const e = pickWeighted(spc); S.seenEvents[e.id] = S.absWeek; logEventFire("special", e); return e; }
  }
  if (_rng() < 0.22){
    const cands = RANDOM_EVENTS.filter(e => e.condFatigue == null || S.fatigue >= e.condFatigue);
    if (cands.length){ const e = pickWeighted(cands); logEventFire("legacy", e); return e; }
  }
  return null;
}
// 第86節: 第4章（円熟期）の月次コスト。設備投資・維持＋弟子の遠征/育成費＋医療/ケア費（古傷の数で増える）
function ch4MonthlyCosts(){
  if (!S || S.chapter < 4) return {equip:0, expedition:0, care:0, total:0};
  const ow = (S.flags && S.flags.oldWounds) || {};
  const owCount = Object.keys(ow).filter(p => ow[p] > 0).length;
  const equip = 30000;
  const expedition = S.students.length * 1200;
  const care = 10000 + owCount * 3000;
  return {equip, expedition, care, total: equip + expedition + care};
}
function endWeek(){
  const ev = pickEndWeekEvent();
  const proceed = () => {
    // 月末処理
    if (S.absWeek % 4 === 0){
      const tuition = S.students.length * TUITION;
      if (tuition > 0){ S.money += tuition; toast("月謝 +" + tuition.toLocaleString() + "円（生徒" + S.students.length + "人）"); }
      // 第2章以降は道場賃料と生徒の用具代が加わる（支出の山）
      const dojoRent = S.chapter >= 2 ? 48000 : 0;
      const gearCost = S.chapter >= 2 ? S.students.length * 1500 : 0;
      const onoCost = (S.chapter >= 2 && S.flags.onoPlan) ? 12000 : 0;
      // 第86節: 第4章からは円熟期の支出の山（設備投資・遠征育成費・医療ケア費）が上乗せされる
      const ch4Cost = ch4MonthlyCosts();
      const bills = MONTHLY_BILLS + dojoRent + gearCost + onoCost + ch4Cost.total;
      S.money -= bills;
      toast("月末の請求書 -" + bills.toLocaleString() + "円（家賃・生活費" + (S.chapter >= 2 ? "・道場賃料・用具代" + (onoCost ? "・食の契約" : "") : "") + (S.chapter >= 4 ? "・設備・遠征・ケア費" : "") + "）", S.money < 0);
      // 第74節: 借金の分割返済（残高の1/5・最低1万円）。借金がある間はCLASHで噂が立つ
      monthlyDebtPayment(true);
      if (debtOf() > 0 && _rng() < 0.35) toast("CLASHで『借金残高" + debtOf().toLocaleString() + "円の男、今月の返済は済んだのか』と噂になっている", true);
      // 第82節: 借金が150万円を超えたら「夜逃げ」の真のデッドエンドへ（次の週の頭で発火させる）
      if (debtOf() > 1500000 && !S.flags.debtDeadEndOnce){ S.flags.debtDeadEndOnce = true; S.flags.debtDeadEndPending = true; }
      if (onoCost) S.fatigue = clamp(S.fatigue - 10, 0, 100); // 大野の定食で回復が良い
      if (S.money < 0) toast("所持金が底をついた……バイトで凌ぐしかない", true);
      if (S.money < -30000 && !S.flags.tamuraHelp){
        S.flags.tamuraHelp = true; S.money += 20000;
        toast("田村が立て替えてくれた +20,000円「大会で返せよ」");
      }
      // 生徒の成長
      for (const stu of S.students){ if (_rng() < 0.3) stu.skill = Math.min(10, stu.skill + 1); }
    }
    if (S.seminarCd > 0) S.seminarCd--;
    // 部位ダメージの自然回復（4週ごと。第4章からは回復が鈍り、4割の月は回復しない＝円熟期の遅さ）
    if (S.absWeek % 4 === 0 && (S.chapter < 4 || _rng() < 0.6)){ for (const p of ["leg","arm","core","head"]){ if (S.dmg[p] > 0){ S.dmg[p]--; break; } } }
    S.absWeek++;
    if ((S.absWeek - 1) % WEEKS_PER_YEAR === 0) S.age++;
    saveGame(false);
    goWeek();
  };
  if (ev){ S.lastRandomWeek = S.absWeek; startScene(ev.steps, proceed, ev.id); }
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
    let base = S.students.length > 0 ? 6000 + S.students.length * 1500 : 5000;
    // 第86節: Lv9「指導の高み」では師範代行・高額指導が可能になり、指導収入が跳ね上がる
    const lv9teach = styleLv(S.mainStyle) >= 9;
    if (lv9teach) base = Math.round(base * 1.5);
    S.money += base; S.fatigue = clamp(S.fatigue + 10, 0, 100);
    growStat("teach", 0.4);
    const n = []; gainStyleExp(S.mainStyle, 2, n);
    toast("道場指導 +" + base.toLocaleString() + "円（教えることは学ぶことだ" + (lv9teach ? "。指導の高みの評判で高額指導になった" : "") + "）");
    afterAction(n); return;
  }
  if (act === "seminar"){
    if (S.seminarCd > 0){ toast("セミナーは準備中です", true); return; }
    S.seminarCd = 3; S.record.seminars++;
    S.fatigue = clamp(S.fatigue + 14, 0, 100);
    const mainLv = styleLv(S.mainStyle);
    // 第86節: 円熟期はセミナー集客効率が全章最高（×1.2）。Lv9以上は「遠方から生徒が来る」高額セミナー（単価と集客が跳ね上がる）、Lv10はその頂点
    let guests = Math.min(40, Math.max(0, Math.round((2 + S.attention * 0.8 + fameTotal() * 0.5 + S.stats.teach * 0.7) * randf(0.7, 1.3) * (S.flags.abroadDone ? 1.3 : 1) * (S.chapter >= 4 ? 1.2 : 1) * (mainLv >= 9 ? 1.3 : 1))));
    // 第86節: 第4章からはセミナー会場費がかかる（支出の山）
    let venueFee = 0;
    if (S.chapter >= 4){ venueFee = 12000; S.money -= venueFee; }
    const unitPrice = mainLv >= 10 ? 5000 : mainLv >= 9 ? 4000 : 3000;
    const income = guests * unitPrice;
    S.money += income;
    if (guests >= 10){ S.sei += 1; toast("セミナーは盛況だった！"); }
    if (guests >= 8 && _rng() < 0.5){ const j = joinGenericStudent(); if (j) toast("参加者の" + j.name + "が入門した！"); }
    if (guests === 0) toast("参加者はゼロだった……告知と名前が足りない", true);
    else toast("セミナー集客 " + guests + "人、収入 +" + income.toLocaleString() + "円");
    afterAction(notes); return;
  }
  if (act === "sns"){
    ensureStateCompat();
    if (!S.flags.clashDone){
      S.flags.clashDone = true;
      startScene([{sp:"narr", t:"CLASHを開くと、小さな論争が燃えていた。"}, {debate:"mini1"}], () => endWeek());
      return;
    }
    // 第44節: 2回目以降は汎用ネタプール（DEBATE_POOL）の未見ネタを優先して出す。1周で同じネタは繰り返さない
    const cands = unseenPoolDebates();
    if (cands.length && _rng() < 0.8){
      const d = cands[rnd(cands.length - 1)];
      S.seenEvents["debate:" + d.id] = S.absWeek; S.seenEvents["dev_" + d.id] = S.absWeek;
      logEventFire("debate", d);
      startScene([{sp:"narr", t:"CLASHを開くと、また新しい論争が燃えていた。"}, {debate:d.id}], () => endWeek());
      return;
    }
    if (_rng() < 0.45){
      startScene([{sp:"narr", t:"CLASHを開くと、小さな論争が燃えていた。"}, {debate:"mini1"}], () => endWeek());
      return;
    }
    S.attention += 2;
    if (_rng() < 0.25){ S.sei += 1; toast("稽古の投稿が「真摯だ」と評判になった"); }
    else toast("稽古の様子を投稿した（注目度↑）");
    afterAction(notes); return;
  }
  if (act === "train_sub") return renderSubStylePick();
  if (act === "collab") return renderCollabPick();
  if (act === "baito") return renderBaitoPick();
  if (act === "care") return renderCarePick();
  if (act === "romance") return renderRomancePick();
  if (act === "dex") return renderDex();
}
// 第78節: コラボ企画の相手・形式の選択画面（実処理は story-cameos.js の startCollab）
function renderCollabPick(){
  hud();
  const partners = (typeof collabPartnerList === "function") ? collabPartnerList() : [];
  const cdLeft = Math.max(0, (S.flags.collabCdUntil || 0) - S.absWeek);
  let html = '<div class="weekhead"><h2>コラボ企画</h2><div class="weeksub">出会ったインフルエンサー系の相手と、動画配信や合同イベントを行います（3週に1回まで）。相手の色で結果の傾向が変わります</div></div>';
  if (cdLeft > 0) html += '<div class="stext">前回のコラボから間が近い。あと' + cdLeft + "週は様子を見よう。</div>";
  if (!partners.length) html += '<div class="stext">まだコラボできる相手と出会っていない。</div>';
  html += '<div class="actions">' + partners.map(p => {
    const c = CAST_BY_ID[p.id];
    const scripted = (typeof COLLAB_SCRIPTED !== "undefined" && COLLAB_SCRIPTED[p.id] && !(S.flags.collabDone && S.flags.collabDone[p.id]));
    return '<button class="btn act" data-collab="' + p.id + ':video"' + (cdLeft > 0 ? " disabled" : "") + "><b>" + esc(c.name) + 'と動画・配信</b><span>' + esc(p.desc) + (scripted ? "（固有コラボあり）" : "") + "</span></button>" +
           '<button class="btn act" data-collab="' + p.id + ':event"' + (cdLeft > 0 ? " disabled" : "") + "><b>" + esc(c.name) + 'と合同イベント</b><span>合同セミナー／エキシビション。集客と参加費収入の入口</span></button>';
  }).join("") + '<button class="btn ghost" data-back="1">戻る</button></div>';
  $("main").innerHTML = html;
  $("main").querySelector("[data-back]").addEventListener("click", renderWeek);
  $("main").querySelectorAll("[data-collab]").forEach(b => b.addEventListener("click", () => {
    const parts = b.dataset.collab.split(":");
    if (typeof startCollab === "function") startCollab(parts[0], parts[1]);
  }));
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
    if (b.dataset.care === "rest"){ S.fatigue = clamp(S.fatigue - (S.chapter >= 4 ? 32 : 45), 0, 100); toast(S.chapter >= 4 ? "しっかり休んだ（40代の回復は、若い頃よりゆっくりだ）" : "しっかり休んだ"); }
    else {
      S.fatigue = clamp(S.fatigue - (S.chapter >= 4 ? 22 : 30), 0, 100);
      let heal = S.flags.carePro ? 2 : 1;
      if (S.flags.carePro){ if (S.money >= 3000){ S.money -= 3000; } else { heal = 1; toast("治療費が足りず、簡易ケアになった", true); } }
      for (const p of ["leg","arm","core","head"]){ while (heal > 0 && S.dmg[p] > 0){ S.dmg[p]--; heal--; } }
      toast("ケアを受けた。体が軽い");
    }
    afterAction([]);
  }));
}
// ---------- 流派別の師匠像（第83節） ----------
// 序章の認定審査などで出る「その流派の師範」の絵は、流派のカテゴリごとに用意した師匠像を使う
// （白道着の師範がボクシングやムエタイの審査に出る、といった違和感をなくすため）。
// 画像は cast-art/cast-master-<key>-sera.webp。portrait の仕組みで "master-<key>" として参照する。
// 固有名のある師匠（源田巌・mentorFor のキャスト）は従来どおりで、ここは汎用の師範像のみを担う。
const MASTER_BY_CAT = {
  "日本の空手系": "karate",
  "日本の柔術・柔道・合気・相撲系": "jujutsu",
  "中国武術": "chinese",
  "立技打撃": "striking",
  "グラップリング世界": "grappling",
  "朝鮮半島": "korean",
  "東南アジア": "seasia",
  "欧米・その他地域": "western",
  "軍・警察系格闘術": "military",
  "特殊・話題枠": "special",
};
// カテゴリ内でも姿が大きく異なる流派は、個別の師匠像を使う
const MASTER_OVERRIDE = {
  "相撲": "sumo", "沖縄角力（シマ）": "sumo",
  "ムエタイ": "muay", "ムエボーラン": "muay", "ムエラオ": "muay", "プラダル・セレイ（クン・クメール）": "muay",
  "カポエイラ・ヘジョナル": "capoeira", "カポエイラ・アンゴラ": "capoeira",
  "忍術体術（武神館）": "ninja",
  "アーマードバトル（ブフルト）": "armor",
  "シルム": "ssireum",
};
function masterArtKey(style){
  if (!style) return "jujutsu";
  return MASTER_OVERRIDE[style.name] || MASTER_BY_CAT[style.cat] || "jujutsu";
}
function masterPortraitHtml(style){
  return '<div class="portrait"><img src="../cast-art/cast-master-' + masterArtKey(style) + '-sera.webp" alt=""></div>';
}
// ---------- 他流派と師匠 ----------
function mentorFor(style){
  if (!style) return null;
  if (style.name === "詠春拳") return {id:"chen", type:"厳格", note:"悪名のある者を門前払いする"};
  if (style.name === "陳式太極拳") return {id:"lihua", type:"厳格", note:"清らかな格と、高みに届く腕（主・流儀Lv6以上）を見る。高Lv帯の指導者"};
  if (style.name === "酔拳") return {id:"zhiqiang", type:"寛容", note:"多少の悪名は笑って許す。再起の指導に強い"};
  if (style.name === "空道（大道塾）") return {id:"onizuka", type:"実力主義", note:"評判は見ない。腕だけを見る"};
  if (style.name === "サンボ（スポーツサンボ）") return {id:"anna", type:"実力主義", note:"評判は見ない。戦績と腕だけを見る"};
  if (style.cat === "日本の空手系") return {id:"todo", type:"寛容", note:"多少の悪名は笑って許す"};
  if (style.cat === "特殊・話題枠" || style.name === "クラヴマガ" || style.name === "システマ") return {id:"kurozaki", type:"無法歓迎", note:"悪名の高い者を歓迎する"};
  return null;
}
function mentorCheck(m){
  if (m.id === "lihua") return S.aku <= 1 && styleLv(S.mainStyle) >= 6; // 王麗華: 厳格型＋高Lv帯の指導（設計書2.4）
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
    const newSys = styleSystems(st).filter(k => !playerSystems().includes(k));
    const infoText = st.name + " Lv" + lv + " ― " + st.feature + (lv >= 5 ? "（看板技 習得済み）" : lv >= 3 ? "（精度完成）" : "") +
      "／使える攻撃：" + systemsLabel(st) + (newSys.length ? "（学ぶと新たに「" + newSys.map(systemsKindLabel).join("・") + "」が使えるようになる）" : "");
    // 第83節: 流派詳細では、その流派の師範像（カテゴリ別の絵）を合わせて表示する
    info.innerHTML = '<div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap;">' + masterPortraitHtml(st) +
      '<div style="flex:1;min-width:200px;">' + esc(infoText) + '<br><span>（絵は' + esc(st.name) + "の師範）</span></div></div>";
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
  const sysBefore = playerSystems();
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
  // 第73節: 新しい流派を身につけると、使える攻撃系統が広がることがある
  const sysGained = playerSystems().filter(k => !sysBefore.includes(k));
  if (sysGained.length) toast(st.name + " の型が体に入り、新しい攻撃「" + sysGained.map(systemsKindLabel).join("・") + "」が使えるようになった！");
  afterAction(notes);
}
// ---------- 口説き ----------
function prefMatch(c){
  if (c.id === "shiraishi" && S.flags && (S.flags.dopeUsed || 0) > 0) return false; // 白石遥：ドーピング使用は決定的な減点（設計書3.2）
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
  startScene(head.concat(lines), () => {
    applyFx({affection:{[id]:gain}});
    // 弟子への口説きのSNS炎上リスク（設計書3.4：禁止ではなく代償のある選択）。早乙女楓（弟子世代）が対象
    if (id === "saotome" && fameRankIdx() >= 2 && _rng() < 0.3){
      applyFx({aku:1, attention:2});
      toast("CLASHで『師匠と弟子』の目撃談が拡散した……悪名と注目が付いた", true);
    }
    endWeek();
  });
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
  // 未定義バトルのフォールバック（hp/power が NaN だと試合が永遠に終わらないため、汎用定義で受ける）
  if (typeof def.hp !== "number" || typeof def.power !== "number"){
    Object.assign(def, {title: def.title || "指名試合", enemyName: def.enemyName || "挑戦者", hp: 120, power: 12, mode: "match", foul: false, comments: def.comments || []});
  }
  return def;
}
function startBattle(id, winSteps, loseSteps){
  const def = resolveBattleDef(id);
  UI.screen = "battle";
  const eStyle = def.enemyStyleName ? styleByName(def.enemyStyleName) : mainStyle();
  // 第86節: 円熟期（第4章〜）は体力上限がピーク比80%まで低下する。代わりに読みと奥義が効く
  const ageHpFactor = S.chapter >= 4 ? 0.8 : 1;
  const maxPhp = Math.round(((55 + S.stats.endure * 6 + styleLv(S.mainStyle) * 2) * (1 - S.fatigue / 250) - S.dmg.core * 4) * ageHpFactor);
  // 複合技（Lv7・設計書2.2）: 主・流儀Lv7以上＋副・流儀Lv5以上で解放
  let comboStyle = null;
  if (styleLv(S.mainStyle) >= 7){
    for (const id in S.styleLv){ const sid = Number(id); if (sid !== S.mainStyle && S.styleLv[id] >= 5){ const cand = styleById(sid); if (cand && (!comboStyle || S.styleLv[id] > S.styleLv[comboStyle.id])) comboStyle = cand; } }
  }
  ensureStateCompat();
  // 研究・対策メタ（軽量版・第39/40節）: 連勝が続くと相手陣営が主・流儀／看板技を研究してくる
  const streak = S.record.winStreak || 0;
  const counterLevel = streak >= 5 ? 2 : streak >= 3 ? 1 : 0;
  const counterHasSig = styleLv(S.mainStyle) >= 5;
  UI.battle = { def, eStyle, php: Math.max(20, maxPhp), maxPhp: Math.max(20, maxPhp), ehp: def.hp, turn: 0, dealt: 0,
    log: [], cmtIdx: 0, foulUsed: false, sigUsed: false, ougiUsed: false, readBonus: 0, control: 0, readGuard: false, secondUsed: false,
    comboStyle, comboUsed: false, counterLevel, counterStreak: streak, counterHasSig,
    blur: 0, eyeHits: 0, eyeTurn: 0, misses: 0,
    winSteps, loseSteps };
  window.__lastCounter = {level: counterLevel, streak: streak, battleId: def.id, hasSig: counterHasSig};
  bLog("実況", def.title + "――開始！");
  if (def.eyeThrust){
    bLog("メツキング", "証明する、と言った。ゴーグル越しでも構わない――本気で、目を突く");
    bLog("実況", "メツキングの二指が、静かに目線の高さへ上がった。本当に、目を狙う構えだ");
  }
  if (counterLevel > 0){
    bLog("対策", "【研究・対策】" + def.enemyName + "陣営は、" + streak + "連勝中のあなたの映像を研究済みだ。" +
      (counterHasSig ? sigName() + "への対策が用意されている（看板技の威力が下がる）。" : "看板技は未解放のため、主・流儀の代表的な型への対策が用意されている（通常攻撃が少し読まれやすい）。") +
      "ただし、複合技や新しい流派の技は研究が追いついていない。");
  }
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
  if (S.flags.dopeUntilWeek && S.absWeek <= S.flags.dopeUntilWeek) p += 4; // ドーピングの短期強化（第3章）
  // 対策メタ: 看板技が未解放の場合、主・流儀の代表技（通常攻撃）が対策で少し割り引かれる
  if (UI.battle && UI.battle.counterLevel > 0 && !UI.battle.counterHasSig) p = p * (UI.battle.counterLevel >= 2 ? 0.85 : 0.92);
  if (kind === "kick") p -= S.dmg.leg * 2;
  if (kind === "strike" || kind === "grapple") p -= S.dmg.arm * 2;
  if (kind === "ground") p += UI.battle.control;
  // 第73節: 組みで作った支配（control）は投げ・組み自体の威力にも一部還る。
  // 寝技を持たない純・組み技ルートでも「組み→支配→強い投げ」の勝ち筋が成立するための配慮
  if (kind === "grapple") p += Math.floor(UI.battle.control / 2);
  return Math.max(2, Math.round(p));
}
function renderBattle(){
  hud();
  const b = UI.battle, def = b.def;
  const lv = styleLv(S.mainStyle);
  // 第73節: 使える系統の攻撃だけをボタンにする（使えない系統は出さない）
  const sysActs = {
    strike: ["strike", "打撃で攻める", "手技・中距離"],
    kick: ["kick", "蹴りで攻める", "足技・遠距離" + (S.dmg.leg ? "（脚のダメージで低下中）" : "")],
    grapple: ["grapple", "組み付く", "投げ・組み・近距離" + (b.control ? "（支配 +" + b.control + "）" : "")],
    ground: ["ground", "寝技に誘う", "寝技・関節" + (b.control ? "（支配 +" + b.control + "）" : "")],
  };
  const acts = playerSystems().map(k => sysActs[k]).filter(Boolean);
  acts.push(["read", "相手を読む", "次の攻撃↑・被ダメ半減"]);
  acts.push(["recover", "息を整える", "体力を少し回復"]);
  if (lv >= 5 && !b.sigUsed) acts.push(["sig", "看板技：" + sigName(), "1試合に1回"]);
  // 第86節: Lv10「奥義・皆伝」の完全実装。純粋度が高いほど奥義が強化される（設計書2.2）
  if (lv >= 10 && !b.ougiUsed) acts.push(["ougi", "奥義：" + mainStyle().name.replace(/（[^）]*）/g, "") + "の奥義", "皆伝の証。1試合に1回（純粋度" + purity() + "%で強化）"]);
  if (b.comboStyle && !b.comboUsed) acts.push(["combo", "複合技：" + mainStyle().name.replace(/（[^）]*）/g, "") + "×" + b.comboStyle.name.replace(/（[^）]*）/g, ""), "主・流儀Lv7＋副・流儀Lv5で解放。1試合に1回"]);
  if (def.foul && !b.foulUsed) acts.push(["foul", "反則・眼突き", "勝てるが、評判を落とす諸刃"]);
  const enemyImg = def.img ? '<div class="portrait"><img src="../cast-art/cast-' + def.img + '-sera.webp" alt=""></div>' : "";
  const counterBanner = b.counterLevel > 0 ? '<div class="weeksub" style="color:var(--aku);">【研究・対策】相手陣営があなたの主・流儀／看板技を研究済み（対策レベル' + b.counterLevel + "／" + b.counterStreak + '連勝中）。看板技は威力が下がる。ただし複合技や新しい流派の技は研究が追いついていない。</div>' : "";
  const blurBanner = b.blur > 0 ? '<div class="weeksub" style="color:var(--aku);">【視界不良】ゴーグルが霞んで狙いが定まらない（あと' + b.blur + '手）。「相手を読む」「組み付く（手を捌く）」で視界を立て直せる</div>' : "";
  $("main").innerHTML = '<div class="battle">' + counterBanner + blurBanner + '<div class="vs">' +
    '<div class="fighter"><div class="nm">ハヤト（' + esc(mainStyle().name) + " Lv" + lv + '）</div><div class="bar hp"><i style="width:' + clamp(b.php / b.maxPhp * 100, 0, 100) + '%"></i></div><div class="sub">体力 ' + Math.max(0, b.php) + " ／ 部位：腕" + S.dmg.arm + " 脚" + S.dmg.leg + " 体幹" + S.dmg.core + '</div></div>' +
    '<div class="fighter enemy"><div class="nm">' + esc(def.enemyName) + '</div><div class="bar ehp"><i style="width:' + clamp(b.ehp / def.hp * 100, 0, 100) + '%"></i></div><div class="sub">' + esc(def.enemyStyleName || "同流派") + " ／ 耐久 " + Math.max(0, b.ehp) + (b.eStyle ? " ／ 使える攻撃：" + systemsLabel(b.eStyle) : "") + "</div></div>" +
    enemyImg + '</div>' +
    '<div class="blog">' + b.log.map(l => '<div class="bl"><span>' + esc(l.sp) + "</span>" + esc(fill(l.tx)) + "</div>").join("") + "</div>" +
    '<div class="actions">' + acts.map(a => '<button class="btn act" data-bact="' + a[0] + '"><b>' + a[1] + '</b><span>' + a[2] + "</span></button>").join("") + "</div></div>";
  const blog = $("main").querySelector(".blog"); if (blog) blog.scrollTop = blog.scrollHeight;
  $("main").querySelectorAll("[data-bact]").forEach(x => x.addEventListener("click", () => battleTurn(x.dataset.bact)));
}
function battleTurn(act){
  const b = UI.battle, def = b.def;
  // 第73節: 使えない系統の攻撃は実行しない（ボタン非表示の二重ガード）
  if (["strike", "kick", "grapple", "ground"].includes(act) && !playerSystems().includes(act)) return;
  b.turn++;
  let dmg = 0;
  if (act === "strike"){ dmg = playerPower("strike"); bLog("実況", "突きが距離を刻む！"); }
  else if (act === "kick"){ dmg = playerPower("kick"); bLog("実況", "蹴りが間合いを支配する！"); }
  else if (act === "grapple"){ dmg = playerPower("grapple"); b.control = Math.min(6, b.control + 2); bLog("実況", "組み合った！ 支配が少しずつこちらに傾く"); }
  else if (act === "ground"){ dmg = playerPower("ground"); bLog("実況", "寝技の展開！ 極めを狙う"); }
  else if (act === "read"){ // 第86節: 円熟期は「読み」の効きが最大級になる（体力の低下を読みで補う設計）
    b.readBonus = Math.round((4 + Math.round(S.stats.read)) * (S.chapter >= 4 ? 1.5 : 1)); b.readGuard = true; bLog("実況", "相手の癖を読む……次の手が冴える！" + (S.chapter >= 4 ? " 円熟の読みが、若さの速さを上回る" : "")); }
  else if (act === "ougi" && styleLv(S.mainStyle) >= 10 && !b.ougiUsed){ // 第86節: 奥義・皆伝（Lv10）。純粋度が高いと強化される
    const ougiBase = Math.max(...styleSystems(mainStyle()).map(k => S.stats[k]));
    dmg = 22 + ougiBase * 4 + rnd(4);
    if (purity() >= 70){ dmg = Math.round(dmg * 1.25); bLog("実況", "純粋に磨き抜いた奥義が、冴え渡る！"); }
    b.ougiUsed = true; window.__lastOugi = {battleId: def.id, dmg: dmg, purity: purity()};
    bLog("実況", "奥義――" + mainStyle().name.replace(/（[^）]*）/g, "") + "を極めた者にだけ許される一手が、静かに放たれた！"); }
  else if (act === "recover"){ b.php = Math.min(b.maxPhp, b.php + 9); bLog("実況", "息を整え、軸を立て直す"); }
  else if (act === "sig"){ // 第73節: 看板技は主・流儀が使える系統の中から構成される（威力もその系統の能力で決まる）
    const sigBase = Math.max(...styleSystems(mainStyle()).map(k => S.stats[k]));
    dmg = 13 + sigBase * 3 + rnd(4); b.sigUsed = true; bLog("実況", sigName() + "――会場の空気が変わった！");
    if (b.counterLevel > 0){ const before = dmg; dmg = Math.max(2, Math.round(dmg * (b.counterLevel >= 2 ? 0.7 : 0.8))); window.__lastCounterCorrection = {act:"sig", level:b.counterLevel, before:before, after:dmg}; bLog("対策", "だが看板技は研究されている！ 入りを読まれ、威力が割り引かれた（対策レベル" + b.counterLevel + "）"); } }
  else if (act === "combo" && b.comboStyle){ dmg = 16 + styleLv(b.comboStyle.id) * 3 + rnd(4); b.comboUsed = true; bLog("実況", "複合技――" + mainStyle().name.replace(/（[^）]*）/g, "") + "の入り方から" + b.comboStyle.name.replace(/（[^）]*）/g, "") + "へ繋いだ！ 誰も見たことのない形だ！");
    if (b.counterLevel > 0) bLog("対策", "複合技は研究が追いついていない！ 対策の影響を受けなかった"); }
  else if (act === "foul"){
    dmg = 16 + rnd(4); b.foulUsed = true; S.record.fouls++;
    bLog("実況", "……今のは？ 指が目に――際どい攻防だ");
    if (def.mode === "match"){
      if (_rng() < 0.45){ applyFx({aku:2, attention:1}); bLog("判定", "レフェリーから警告！ 反則行為として記録された"); }
      else if (_rng() < 0.35){ applyFx({aku:1, attention:1}); bLog("実況", "映像がCLASHに切り抜かれた。「あれは反則だ」と拡散が始まっている"); }
    }
  }
  // メツキング戦（第51節）: 視界デバフ（blur）。霞んだ視界では攻撃が逸れやすい（蹴りは間合いが遠い分だけ軽減）。
  // 「相手を読む」「組み付く（相手の手を捌く）」は視界の立て直しになりデバフを解除する。看板技・複合技は体の覚えた動きなので逸れない
  if (b.blur > 0){
    if (act === "read" || act === "grapple"){ b.blur = 0; bLog("実況", "顔を逸らし、相手の手を捌く――視界が晴れてきた！"); }
    else {
      b.blur--;
      if (dmg > 0 && act !== "sig" && act !== "combo" && act !== "ougi" && _rng() < (act === "kick" ? 0.25 : 0.4)){
        dmg = 0; b.misses++;
        bLog("実況", "視界が霞んで、攻撃が逸れた！");
        if (window.__lastEyeThrust) window.__lastEyeThrust.misses = b.misses;
      }
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
  // 敵の反撃（第73節：敵も自分の流派が使える系統でしか反撃できない。
  // その流派の得意な系統ほど選ばれやすく、威力の上乗せもその系統の能力値から取る）
  const eKinds = styleSystems(b.eStyle);
  let eKind = eKinds[0] || "strike";
  { let bestW = -1;
    for (const k of eKinds){
      const v = b.eStyle ? (b.eStyle.stats[k] || 0) : 1;
      const w = v * 2 + _rng() * 2;
      if (w > bestW){ bestW = w; eKind = k; }
    }
  }
  window.__lastEnemyKind = {battleId: def.id, kind: eKind, kinds: eKinds};
  let edmg = def.power + rnd(4) + Math.round(((b.eStyle && b.eStyle.stats[eKind]) || 1));
  if (def.id === "fin_rin" && S.flags.ruleFx === "stand") edmg = Math.round(edmg * 0.85);
  if (def.id === "fin_rin" && S.flags.ruleFx === "open") edmg = Math.round(edmg * 1.15);
  // メツキング戦（第51節）: 敵の攻撃が「目を狙う高速の突き」になる。ゴーグルが受けるため体力ダメージは軽いが、視界デバフ（blur=2）が付く。4手ごとには専用技「連環三突き」
  let eyeLogged = false;
  if (def.eyeThrust){
    b.eyeTurn++;
    const combo = b.eyeTurn % 4 === 0;
    if (combo || _rng() < 0.45){
      edmg = Math.max(2, Math.round(edmg * (combo ? 0.9 : 0.55)));
      b.blur = 2; b.eyeHits++;
      if (combo) bLog("メツキング", "形意拳・連環三突き――三つとも、目だ");
      bLog("実況", combo ? "三連の突きが、全部ゴーグルを捉えた！ レンズが白く霞み、視界が奪われる！" : "メツキングの二指が一直線に目元へ――ゴーグルに鋭い音が響いた！ 視界が霞む！");
      window.__lastEyeThrust = {battleId: def.id, eyeHits: b.eyeHits, blur: b.blur, combo: combo, misses: b.misses};
      eyeLogged = true;
    } else {
      bLog("実況", "崩拳の圧が正面から押し寄せる。こちらの体力が削られる");
      eyeLogged = true;
    }
  }
  if (b.readGuard){ edmg = Math.round(edmg / 2); b.readGuard = false; }
  b.php -= edmg;
  if (_rng() < 0.18){
    const parts = ["leg", "arm", "core"]; const p = parts[rnd(2)];
    S.dmg[p] = clamp(S.dmg[p] + 1, 0, 3);
    bLog("実況", "攻め込まれた拍子に" + ({leg:"脚", arm:"腕", core:"体幹"})[p] + "を痛めた！");
  }
  if (!eyeLogged){
    // 第73節: 反撃の実況も、敵が実際に使った系統に合わせる
    const eLines = {
      strike: def.enemyName + "の手技が襲う！ こちらの体力が削られる",
      kick: def.enemyName + "の蹴りが風を切って飛んでくる！ こちらの体力が削られる",
      grapple: def.enemyName + "が組み付き、投げの形に入る！ こちらの体力が削られる",
      ground: def.enemyName + "が引き込んで関節を狙う！ こちらの体力が削られる",
    };
    bLog("実況", eLines[eKind] || (def.enemyName + "の反撃。こちらの体力が削られる"));
  }
  if (b.php <= 0) return finishBattle(false);
  renderBattle();
}
function finishBattle(win){
  const b = UI.battle;
  ensureStateCompat();
  S.record.matches++;
  // 第74節: 反則で勝った試合では、相手が重い怪我を負うことがある（傷害ルートの火種。1周1回）
  if (win && b.foulUsed && !S.flags.injuryDone && !S.flags.injurySource && _rng() < 0.5){
    S.flags.injurySource = "match"; S.flags.injuryBaseWeek = S.absWeek;
  }
  if (win){ S.record.wins++; S.record.winStreak = (S.record.winStreak || 0) + 1; S.record.bestWinStreak = Math.max(S.record.bestWinStreak || 0, S.record.winStreak); }
  else S.record.winStreak = 0;
  // 第86節: 円熟期は連戦の代償が重い（試合後の疲労増）
  S.fatigue = clamp(S.fatigue + (S.chapter >= 4 ? 18 : 12), 0, 100);
  const steps = win ? b.winSteps : b.loseSteps;
  UI.battle = null; UI.screen = "scene";
  UI.queue = steps.concat(UI.queue);
  sceneAdvance();
}

// ---------- SNS議論バトル ----------
// 第44節: 汎用ネタプール（story-ch1.js の DEBATE_POOL）のうち、まだ見ていないネタの一覧
function unseenPoolDebates(){
  if (typeof DEBATE_POOL === "undefined") return [];
  return DEBATE_POOL.filter(d => !S.seenEvents["debate:" + d.id]);
}
function startDebate(id){
  const d = DEBATES[id];
  // 第49節: 汎用プールの議論は、どの経路で再生されても既出として記録する（イベント内包時の二重発火防止）
  if (typeof DEBATE_POOL !== "undefined" && DEBATE_POOL.some(x => x.id === id)) S.seenEvents["debate:" + id] = S.absWeek;
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
    S.flags.lastDebate = {id, attr: r.attr, win};
    // 第74節: 「煽り」の返しの通算使用を記録する（CLASH名誉毀損ルートの発火条件・相手の特定に使う）
    if (r.attr === "煽り"){
      S.flags.aoriCount = (S.flags.aoriCount || 0) + 1;
      S.flags.lastAoriWeek = S.absWeek;
      S.flags.lastAoriOpp = (d.posts && d.posts[0] && d.posts[0].name) || "論争の相手";
      S.flags.lastAoriTitle = d.title;
    }
    // 第80節: バックに組織がいる相手への中傷（対象が backed の論争で「煽り」を使った時だけ記録される）
    if (d.backed && r.attr === "煽り"){
      S.flags.backedInsult = true; S.flags.backedInsultWeek = S.absWeek;
      S.flags.backedOpp = (d.posts && d.posts[0] && d.posts[0].name) || "その道場";
    }
    // 第81節: 煽りで言い負かした相手がアカウントを消して退場するケース（汎用論争の一部）
    if (win && r.attr === "煽り" && id.indexOf("pool_") === 0 && !S.flags.oppDeleted && _rng() < 0.5){
      S.flags.oppDeleted = true; S.flags.oppDeletedWeek = S.absWeek;
      S.flags.oppDeletedName = (d.posts && d.posts[0] && d.posts[0].name) || "論争の相手";
    }
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
  $("hud-chapter").textContent = S.chapter === 4 ? "第4章 円熟期" : S.chapter === 3 ? "第3章 全盛期" : S.chapter === 2 ? "第2章 全盛前夜" : "第1章 青年期";
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
    '<div class="stext">【第2章予告】全盛前夜（23〜29歳）。本戦への挑戦、道場の独立、新しい世代の強者たち、そして師匠たちの門。</div>' +
    (typeof startChapter2 === "function" ? '<button class="btn next" data-auto="to-ch2">第2章へ進む（23歳〜）</button>' : "") +
    '<button class="btn" data-auto="to-title">タイトルへ戻る</button></div>';
  saveGame(false);
  $("main").querySelector("[data-auto='to-title']").addEventListener("click", renderTitle);
  const ch2btn = $("main").querySelector("[data-auto='to-ch2']");
  if (ch2btn) ch2btn.addEventListener("click", () => startChapter2());
}
function renderTitle(){
  UI.screen = "title";
  $("hud").classList.add("hidden");
  const likes = getLikes();
  const likeIds = Object.keys(likes);
  const posts = getPosts().slice().reverse();
  const likeList = likeIds.length
    ? likeIds.map(id => '<div class="dexrow">👍 ' + esc(episodeLabel(id)) + ' <span class="tagchip">#' + esc(episodeTag(id)) + "</span></div>").join("")
    : '<div class="dexrow">まだありません。エピソードの終わりやイラスト表示中の👍ボタンで記録できます</div>';
  const postList = posts.length
    ? posts.slice(0, 20).map(p => '<div class="dexrow postitem"><span class="ptag">#' + esc(p.tag || "") + "</span> <span class=\"pdate\">" + esc(new Date(p.at).toLocaleString("ja-JP", {month:"numeric", day:"numeric", hour:"2-digit", minute:"2-digit"})) + "</span>" + (p.liked ? " 👍" : "") + (p.text ? '<div class="ptxt">' + esc(p.text) + "</div>" : "") + "</div>").join("")
    : '<div class="dexrow">まだ投稿がありません。各エピソードの終わりに「CLASHに書き込む」ボタンがあります</div>';
  $("main").innerHTML = '<div class="title"><img class="title-kv" src="assets/title-keyvisual3.webp" alt="異種格闘年代記の登場人物たち">' + '<h1>異種格闘年代記<span>（仮）</span></h1>' +
    '<p class="tagline">どの武術が一番強いのか――その論争に、人生で答える。</p>' +
    '<button class="btn next" data-auto="new">はじめから</button>' +
    (hasSave() ? '<button class="btn" data-auto="continue">つづきから</button>' : "") +
    '<p class="note">第1章：青年期（19〜22歳）／第2章：全盛前夜（23〜29歳）／第3章：全盛期（30〜39歳）／第4章：円熟期（40〜49歳）</p>' +
    '<p class="ver">ver ' + GAME_VERSION + "</p></div>" +
    '<div class="voice"><h3>あなたのCLASH投稿</h3>' +
    '<p class="voicenote">エピソードごとの感想は、作中SNS「CLASH」への書き込みとして、この端末に残ります。人気投票とコメントはフォームで集計し、次回バージョンアップに反映します。面白かったエピソードには👍、改善要望やネタはCLASH投稿から「開発にも送る」で届きます。</p>' +
    "<h4>👍したエピソード（" + likeIds.length + "件）</h4>" + likeList +
    "<h4>あなたの投稿（" + posts.length + "件）</h4>" + postList +
    (getDeadEnds().length ? "<h4>見たデッドエンド（" + getDeadEnds().length + "件）</h4><ul class=\"voicelist\">" + getDeadEnds().map(d => "<li>💀 " + esc(d.title) + "</li>").join("") + "</ul>" : "") +
    '<div class="voicerow"><a class="btn next formlink" href="' + FEEDBACK_FORM_URL + '" target="_blank" rel="noopener">感想・改善要望・ネタを送る（フォーム）</a>' +
    '<button class="btn" data-auto="changelog">更新履歴</button></div></div>';
  $("main").querySelector("[data-auto='new']").addEventListener("click", renderStyleSelect);
  const c = $("main").querySelector("[data-auto='continue']");
  if (c) c.addEventListener("click", () => { if (loadGame()) resumeFromSave(); });
  $("main").querySelector("[data-auto='changelog']").addEventListener("click", renderChangelog);
}
function renderChangelog(){
  UI.screen = "changelog";
  $("hud").classList.add("hidden");
  $("main").innerHTML = '<div class="endcard"><h2>更新履歴</h2>' +
    CHANGELOG.map(c => "<h3>v" + c.v + "（" + c.date + "）</h3>" + c.items.map(i => '<div class="dexrow">' + esc(i) + "</div>").join("")).join("") +
    '<div class="navrow"><button class="btn" data-auto="to-title">タイトルへ戻る</button></div></div>';
  $("main").querySelector("[data-auto='to-title']").addEventListener("click", renderTitle);
}
function resumeFromSave(){
  if (S.flags && S.flags.retiredEnding && S.chapter >= 4 && typeof chapter4RetireScreen === "function") chapter4RetireScreen();
  else if (S.flags && S.flags.retiredEnding && typeof retireEndScreen === "function") retireEndScreen();
  else if (S.chapter4Clear && typeof chapter4EndScreen === "function") chapter4EndScreen();
  else if (S.chapter === 4) goWeek();
  else if (S.chapter3Clear && typeof chapter3EndScreen === "function") chapter3EndScreen();
  else if (S.chapter === 3) goWeek();
  else if (S.chapter2Clear && typeof chapter2EndScreen === "function") chapter2EndScreen();
  else if (S.chapter === 2) goWeek();
  else if (S.chapter1Clear) chapterEndScreen();
  else goWeek();
}
function renderStyleSelect(){
  hud();
  const cards = STYLES_DATA.map(s => '<button class="btn choice stylecard" data-style="' + s.id + '"><b>' + esc(s.name) + '</b><span>' + esc(s.cat) + "／得意距離：" + s.dist.join("・") + "／使える攻撃：" + systemsLabel(s) + "<br>" + esc(s.feature) + "</span></button>").join("");
  $("main").innerHTML = '<div class="weekhead"><h2>主・流儀を選ぶ</h2><div class="weeksub">子供の頃から習い、19歳で一人前の入り口（Lv2）に達した流派。全156流派から選べます（知名度順）。他流派は後からいつでも学べます</div></div>' +
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
    '<h3>出会った人々</h3>' + CAST_DATA.filter(c => S.met.includes(c.id)).map(c => '<div class="dexrow">' + esc(c.name) + (c.age != null ? "（" + c.age + "歳）" : "") + " ― " + esc(c.role) + (c.sex === "F" ? " 好感度" + (S.affection[c.id] || 0) : "") + "</div>").join("") +
    '<h3>習得した流派</h3>' + Object.keys(S.styleLv).map(id => { const st = styleById(Number(id)); return st ? '<div class="dexrow">' + esc(st.name) + " Lv" + S.styleLv[id] + " ― 使える攻撃：" + systemsLabel(st) + "</div>" : ""; }).join("") +
    '<div class="dexrow">現在使える攻撃（全流派の合計）：' + playerSystems().map(systemsKindLabel).join("・") + "</div>" +
    '<h3>女性キャスト（全' + women.length + '名・口説き対象）</h3>' + women.map(c => '<div class="dexrow">' + esc(c.name) + " ― 第" + c.debut + "章登場" + (S.met.includes(c.id) ? "" : "（未登場）") + "</div>").join("") +
    '<button class="btn ghost" data-back="1">戻る</button>';
  $("main").querySelector("[data-back]").addEventListener("click", renderWeek);
}

// ---------- ナビ・起動 ----------
$("btn-save").addEventListener("click", () => { if (S) saveGame(true); });
$("btn-load").addEventListener("click", () => { if (loadGame()){ toast("ロードしました"); resumeFromSave(); } else toast("セーブデータがありません", true); });
$("btn-title").addEventListener("click", renderTitle);
if (new URLSearchParams(location.search).has("autotest")) { /* game.js 末尾の自動テストが処理 */ }
renderTitle();

// ---------- 第2章終了画面への「第3章へ進む」導線（story-ch2.js は変更しないため、ここでラップして追加する） ----------
if (typeof chapter2EndScreen === "function" && typeof startChapter3 === "function"){
  const _origChapter2EndScreen = chapter2EndScreen;
  chapter2EndScreen = function(){
    _origChapter2EndScreen();
    if (UI.screen !== "end") return;
    const mainEl = $("main"); if (!mainEl || mainEl.querySelector("[data-auto='to-ch3']")) return;
    const btn = document.createElement("button");
    btn.className = "btn next"; btn.setAttribute("data-auto", "to-ch3"); btn.textContent = "第3章へ進む（30歳〜）";
    btn.addEventListener("click", () => startChapter3());
    const titleBtn = mainEl.querySelector("[data-auto='to-title']");
    if (titleBtn) titleBtn.before(btn); else mainEl.appendChild(btn);
  };
}

// ---------- 第3章終了画面への「第4章へ進む」導線（第86節。story-ch3.js は変更しないため、ここでラップして追加する） ----------
if (typeof chapter3EndScreen === "function" && typeof startChapter4 === "function"){
  const _origChapter3EndScreen = chapter3EndScreen;
  chapter3EndScreen = function(){
    _origChapter3EndScreen();
    if (UI.screen !== "end") return;
    const mainEl = $("main"); if (!mainEl || mainEl.querySelector("[data-auto='to-ch4']")) return;
    const btn = document.createElement("button");
    btn.className = "btn next"; btn.setAttribute("data-auto", "to-ch4"); btn.textContent = "第4章へ進む（40歳〜）";
    btn.addEventListener("click", () => startChapter4());
    const titleBtn = mainEl.querySelector("[data-auto='to-title']");
    if (titleBtn) titleBtn.before(btn); else mainEl.appendChild(btn);
  };
}

// ---------- 第86節: カメオ・あるあるを第4章でも発火可能にする（読み込み順の都合で game.js 側で実施） ----------
if (typeof CAMEO_EVENTS !== "undefined"){
  CAMEO_EVENTS.forEach(e => { if (Array.isArray(e.chapters) && e.chapters.includes(3) && !e.chapters.includes(4)) e.chapters.push(4); });
}

// ---------- 検証フック（QC用：対策メタ／新規イベント／同伴イベントの発火を実測するための内部状態の公開） ----------
window.__gameTest = {
  state: () => S,
  ensureCompat: () => ensureStateCompat(),
  setWinStreak: n => { ensureStateCompat(); S.record.winStreak = n; S.record.bestWinStreak = Math.max(S.record.bestWinStreak || 0, n); },
  battle: () => UI.battle,
  startBattle: id => startBattle(id, [], []),
  startSceneById: id => startSceneById(id),
  eventLog: () => window.__eventLog || [],
  version: () => GAME_VERSION,
  playerSystems: () => playerSystems(),
  styleSystems: name => styleSystems(styleByName(name)),
  systemsLabel: name => systemsLabel(styleByName(name)),
  battleTurn: act => battleTurn(act),
  lastEnemyKind: () => window.__lastEnemyKind || null,
  likes: () => getLikes(),
  posts: () => getPosts(),
  // 第74〜78節の検証フック
  debt: () => debtOf(),
  addDebt: n => addDebt(n),
  chargeLegal: n => chargeLegal(n),
  partnerSeverity: () => partnerSeverity(),
  abroadDest: () => abroadDest(),
  abroadEligible: () => abroadEligible(),
  startAbroad: () => { if (!abroadEligible()) return false; S.flags.abroadOfferLv = styleLv(S.mainStyle); S.flags.abroadPlace = abroadDest().place; startScene(abroadOfferSteps(), null, "abroad_offer"); return true; },
  okan: () => startScene(okanHomeSteps(), null, "sp_okan_home"),
  okanGood: () => startScene(okanHomeGoodSteps(), null, "sp_okan_home_good"),
  collabList: () => (typeof collabPartnerList === "function" ? collabPartnerList() : []),
  startCollab: (id, type) => startCollab(id, type),
  // 第80〜82節の検証フック
  deadEnds: () => getDeadEnds(),
  rewind: () => rewindNow(),
  attackReadiness: () => attackReadiness(),
  nightAttack: () => startScene(nightAttackSteps(), null, "sp_night_attack"),
  toggleLike: id => toggleLike(id),
  episodeLabel: id => episodeLabel(id),
  episodeTag: id => episodeTag(id),
  clashTarget: () => currentLikeTarget(),
  openComposer: id => { const b = document.querySelector("[data-compose]"); if (b){ b.click(); return true; } return false; },
  forceEvent: id => {
    const pools = [];
    if (typeof WEEK_EVENTS_V2 !== "undefined") pools.push(...WEEK_EVENTS_V2);
    if (typeof STUDENT_DRAMA_EVENTS !== "undefined") pools.push(...STUDENT_DRAMA_EVENTS);
    if (typeof SEASONAL_EVENTS !== "undefined") pools.push(...SEASONAL_EVENTS);
    if (typeof RANDOM_EVENTS !== "undefined") pools.push(...RANDOM_EVENTS);
    if (typeof CH3_WEEK_EVENTS !== "undefined") pools.push(...CH3_WEEK_EVENTS);
    if (typeof CH3_STUDENT_DRAMA !== "undefined") pools.push(...CH3_STUDENT_DRAMA);
    if (typeof CH3_SEASONAL_EVENTS !== "undefined") pools.push(...CH3_SEASONAL_EVENTS);
    if (typeof CH4_WEEK_EVENTS !== "undefined") pools.push(...CH4_WEEK_EVENTS);
    if (typeof CH4_STUDENT_DRAMA !== "undefined") pools.push(...CH4_STUDENT_DRAMA);
    if (typeof CH4_SEASONAL_EVENTS !== "undefined") pools.push(...CH4_SEASONAL_EVENTS);
    if (typeof DEBATE_EVENTS !== "undefined") pools.push(...DEBATE_EVENTS);
    if (typeof SPECIAL_EVENTS !== "undefined") pools.push(...SPECIAL_EVENTS);
    if (typeof CHAIN_EVENTS !== "undefined") pools.push(...CHAIN_EVENTS);
    if (typeof CAMEO_EVENTS !== "undefined") pools.push(...CAMEO_EVENTS);
    const e = pools.find(x => x.id === id);
    if (!e) return false;
    ensureStateCompat();
    logEventFire(e.category || (typeof SEASONAL_EVENTS !== "undefined" && SEASONAL_EVENTS.includes(e) ? "season" : "forced"), e);
    startScene(e.steps, () => goWeek(), e.id);
    return true;
  },
  startChapter3: () => { if (typeof startChapter3 === "function") startChapter3(); },
  startChapter4: () => { if (typeof startChapter4 === "function") startChapter4(); },
  ch4Costs: () => ch4MonthlyCosts(),
  lastOugi: () => window.__lastOugi || null,
  pools: () => ({ v2: (typeof WEEK_EVENTS_V2 !== "undefined" ? WEEK_EVENTS_V2 : []).map(e => ({id:e.id, category:e.category})), student: (typeof STUDENT_DRAMA_EVENTS !== "undefined" ? STUDENT_DRAMA_EVENTS : []).map(e => e.id), seasonal: (typeof SEASONAL_EVENTS !== "undefined" ? SEASONAL_EVENTS : []).map(e => e.id),
    ch3week: (typeof CH3_WEEK_EVENTS !== "undefined" ? CH3_WEEK_EVENTS : []).map(e => ({id:e.id, category:e.category})), ch3student: (typeof CH3_STUDENT_DRAMA !== "undefined" ? CH3_STUDENT_DRAMA : []).map(e => e.id), ch3seasonal: (typeof CH3_SEASONAL_EVENTS !== "undefined" ? CH3_SEASONAL_EVENTS : []).map(e => e.id),
    ch4week: (typeof CH4_WEEK_EVENTS !== "undefined" ? CH4_WEEK_EVENTS : []).map(e => ({id:e.id, category:e.category})), ch4student: (typeof CH4_STUDENT_DRAMA !== "undefined" ? CH4_STUDENT_DRAMA : []).map(e => e.id), ch4seasonal: (typeof CH4_SEASONAL_EVENTS !== "undefined" ? CH4_SEASONAL_EVENTS : []).map(e => e.id), beats4: (typeof BEATS_CH4 !== "undefined" ? BEATS_CH4 : []).map(b => b.id),
    debates: (typeof DEBATE_POOL !== "undefined" ? DEBATE_POOL : []).map(d => d.id), debateEvents: (typeof DEBATE_EVENTS !== "undefined" ? DEBATE_EVENTS : []).map(e => e.id),
    special: (typeof SPECIAL_EVENTS !== "undefined" ? SPECIAL_EVENTS : []).map(e => e.id), chain: (typeof CHAIN_EVENTS !== "undefined" ? CHAIN_EVENTS : []).map(e => e.id),
    cameos: (typeof CAMEO_EVENTS !== "undefined" ? CAMEO_EVENTS : []).map(e => ({id:e.id, category:e.category, chapters:e.chapters})) }),
};

// ---------- 自動テスト（?autotest=1&style=流派名&foul=0|1&seed=N） ----------
(function(){
  const q = new URLSearchParams(location.search);
  if (!q.has("autotest")) return;
  _rng = mulberry32(Number(q.get("seed") || 42));
  const wantStyle = q.get("style") || "糸東流";
  const useFoul = q.get("foul") === "1";
  const ch2test = q.has("ch2test");
  const ch3test = q.has("ch3test");
  const ch4test = q.has("ch4test");
  const CLICK_LIMIT = ch4test ? 300000 : ch3test ? 150000 : ch2test ? 80000 : 20000;
  let clicks = 0, cycle = 0;
  const finish = (ok, why) => {
    clearInterval(timer);
    const res = { ok, why: why || "", screen: UI.screen, absWeek: S ? S.absWeek : 0, age: S ? S.age : 0, chapter: S ? S.chapter : 0,
      fame: S ? fameTotal() : 0, sei: S ? S.sei : 0, aku: S ? S.aku : 0, students: S ? S.students.length : 0,
      mainLv: S ? styleLv(S.mainStyle) : 0, money: S ? S.money : 0, partner: S ? S.partner : null,
      chapter1Clear: S ? S.chapter1Clear : false, chapter2Clear: S ? !!S.chapter2Clear : false, chapter3Clear: S ? !!S.chapter3Clear : false, chapter4Clear: S ? !!S.chapter4Clear : false,
      retired: S ? !!(S.flags && S.flags.retiredEnding) : false, dopeUsed: S ? (S.flags.dopeUsed || 0) : 0, oldWounds: S ? (S.flags.oldWounds || {}) : {},
      met: S ? S.met : [], record: S ? S.record : null, clicks, errors: window.__errors,
      eventLog: window.__eventLog || [], seenEvents: S ? Object.keys(S.seenEvents || {}) : [],
      douhan: S ? {wear: S.flags.douhanWear || null, place: S.flags.douhanPlace || null, score: S.flags.douhanScore || 0} : null,
      lastCounter: window.__lastCounter || null, counterCorrection: window.__lastCounterCorrection || null };
    const d = document.createElement("div"); d.id = "autotest-result";
    d.textContent = "AUTOTEST_RESULT " + JSON.stringify(res);
    document.body.appendChild(d);
  };
  const timer = setInterval(() => {
    try {
      clicks++;
      if (clicks > CLICK_LIMIT) return finish(false, "ステップ上限到達");
      if (UI.screen === "end"){
        if (ch4test && S && !S.chapter4Clear && !(S.flags && S.flags.retiredEnding)){
          if (!S.chapter2Clear){
            const b2 = $("main").querySelector("[data-auto='to-ch2']");
            if (b2){ b2.click(); return; }
            return finish(false, "第2章へのボタンが見つからない");
          }
          if (!S.chapter3Clear){
            const b3 = $("main").querySelector("[data-auto='to-ch3']");
            if (b3){ b3.click(); return; }
            return finish(false, "第3章へのボタンが見つからない");
          }
          const b4 = $("main").querySelector("[data-auto='to-ch4']");
          if (b4){ b4.click(); return; }
          return finish(false, "第4章へのボタンが見つからない");
        }
        if (ch3test && S && !S.chapter3Clear && !(S.flags && S.flags.retiredEnding)){
          if (!S.chapter2Clear){
            const b2 = $("main").querySelector("[data-auto='to-ch2']");
            if (b2){ b2.click(); return; }
            return finish(false, "第2章へのボタンが見つからない");
          }
          const b3 = $("main").querySelector("[data-auto='to-ch3']");
          if (b3){ b3.click(); return; }
          return finish(false, "第3章へのボタンが見つからない");
        }
        if (ch2test && S && !S.chapter2Clear){
          const b2 = $("main").querySelector("[data-auto='to-ch2']");
          if (b2){ b2.click(); return; }
          return finish(false, "第2章へのボタンが見つからない");
        }
        return finish(true);
      }
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
        if (ch.length){
          if (ch3test || ch4test){ const cont = Array.from(ch).find(b => b.textContent.includes("現役を続ける")); if (cont){ cont.click(); return; } }
          ch[cycle++ % ch.length].click(); return;
        }
        const nx = main.querySelector("[data-auto='next']"); if (nx) nx.click();
        return;
      }
      if (UI.screen === "debate"){ const r = main.querySelectorAll("[data-reply]"); if (r.length) r[cycle++ % r.length].click(); return; }
      if (UI.screen === "battle"){
        const B = UI.battle;
        if (B && B.php < B.maxPhp * 0.22){ const rc = main.querySelector("[data-bact='recover']"); if (rc){ rc.click(); return; } }
        let sel = null;
        if (useFoul && B && B.def.foul && !B.foulUsed) sel = main.querySelector("[data-bact='foul']");
        if (!sel) sel = main.querySelector("[data-bact='ougi']");
        if (!sel) sel = main.querySelector("[data-bact='combo']");
        if (!sel) sel = main.querySelector("[data-bact='sig']");
        if (!sel && B){ const st = mainStyle(); const prim = st.stats.kick >= st.stats.strike && st.stats.kick >= st.stats.grapple && st.stats.kick >= st.stats.ground ? "kick" : st.stats.grapple >= st.stats.ground && st.stats.grapple >= st.stats.strike ? "grapple" : st.stats.ground > st.stats.strike && st.stats.ground > st.stats.kick ? "ground" : "strike"; sel = main.querySelector("[data-bact='" + prim + "']"); }
        if (!sel) sel = main.querySelector("[data-bact='strike']");
        if (!sel) sel = main.querySelector("[data-bact='grapple'],[data-bact='ground'],[data-bact='kick'],[data-bact='read']"); // 第73節: 主・流儀の系統に無い攻撃はボタン自体が無い
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
