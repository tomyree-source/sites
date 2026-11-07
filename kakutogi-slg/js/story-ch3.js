// 第3章（全盛期 30〜39歳）シナリオデータと章ロジック
// step の書式は story-ch1.js / story-ch2.js と共通。追加ステップ:
// {warWinK:true} / {warLoseK:true} … 香取道場との対抗戦（賭け試合）の弟子争奪の結果処理
// {ch3skip:true} … その年の残りを年次スキップ精算して翌年へ進む（代表シーズン方式・第2章と同じ）
// {endChapter3:true} … 第3章の終了画面へ（現役続行）
// {endChapter3retire:true} … 引退を選んだ場合の早期エンディング画面へ
// ドーピング関連の fx 拡張（game.js の applyFx で処理）:
// fx.dopeUse:true … 使用した（短期強化 dopeUntilWeek まで＋記録）／ fx.dopeSuspect:n … 疑惑度の加算
// fx.oldWound:{part:level} … 古傷として残す部位を指定する
"use strict";

// ---------- 古傷（第3章〜：部位ダメージの一部が章をまたいで残る。設計書1.4／2.8） ----------
function oldWounds(){ if (!S.flags.oldWounds || typeof S.flags.oldWounds!== "object") S.flags.oldWounds = {}; return S.flags.oldWounds;}
function applyOldWoundFloor(){
const ow = oldWounds();
for (const p of ["arm","leg","core","head"]){ if ((ow[p] || 0) > 0) S.dmg[p] = Math.max(S.dmg[p] || 0, ow[p]);}
}
// 現在の部位ダメージのうち重いもの（2以上）を古傷として固定する。新規に古傷化した部位名の配列を返す
function crystallizeOldWounds(){
const ow = oldWounds(); const newly = [];
const names = {arm:"腕", leg:"脚", core:"体幹", head:"頭"};
for (const p of ["arm","leg","core","head"]){
if ((S.dmg[p] || 0) >= 2 && (ow[p] || 0) < 1){ ow[p] = 1; newly.push(names[p]);}
}
return newly;
}

// ---------- 第3章への遷移 ----------
function startChapter3(){
ensureStateCompat();
S.chapter = 3;
S.chapter3Clear = false;
S.flags.retiredEnding = false;
S.absWeek = 529; // 30歳・第1週
S.age = 30;
// 章区切りで通常の部位ダメージは回復するが、重いダメージは古傷として残る（設計書4.5／1.4）
const newly = crystallizeOldWounds();
S.dmg = {arm:0, leg:0, core:0, head:0};
applyOldWoundFloor();
if (newly.length) S.flags.ch3IntroOldWound = newly.join("・");
saveGame(false);
startSceneById("ch3_intro");
}
function chapter3EndScreen(){
UI.screen = "end"; S.chapter3Clear = true; S.chapter = 3; hud();
const r = S.record;
const ow = oldWounds(); const owNames = {arm:"腕", leg:"脚", core:"体幹", head:"頭"};
const owList = Object.keys(ow).filter(p => ow[p] > 0).map(p => owNames[p]).join("・");
$("main").innerHTML = '<div class="endcard"><h2>第3章 全盛期 ―完―（現役続行）</h2>' +
'<div class="stext">記録：試合 ' + r.matches + "戦 " + r.wins + "勝（最高" + (r.bestWinStreak || 0) + "連勝）／ 反則 " + r.fouls + "回 ／ バイト " + r.works + "回 ／ セミナー " + r.seminars + "回 ／ 論争 " + r.debateWins + "勝 ／ 大会優勝 " + r.cups + "回</div>" +
'<div class="stext">名声 ' + fameTotal() + "（" + fameRank() + "）／ 清名" + S.sei + "・悪名" + S.aku + " ／ 道場生 " + S.students.length + "人 ／ " + (mainStyle()? mainStyle().name: "") + " Lv" + styleLv(S.mainStyle) + " ／ 純粋度 " + purity() + "%" + (S.partner? " ／ 想い人：" + CAST_BY_ID[S.partner].name: "") + (owList? " ／ 古傷：" + owList: "") + "</div>" +
'<div class="stext">円熟期（40〜49歳）。散打の間宮健一率いる道場が、本格的な対抗戦の主敵として立ちはだかる。老師たちの高Lv帯の指導、若手の星の追い上げ、そして「衰え」と「深み」の同時進行が始まる。</div>' +
'<button class="btn next" data-auto="to-title">タイトルへ戻る</button></div>';
saveGame(false);
$("main").querySelector("[data-auto='to-title']").addEventListener("click", renderTitle);
}
function retireEndScreen(){
UI.screen = "end"; S.flags.retiredEnding = true; S.chapter = 3; hud();
const r = S.record;
const color = S.sei > S.aku + 5? "清名に彩られた": S.aku > S.sei + 5? "悪名と共に語られる": "清濁を併せ呑んだ";
$("main").innerHTML = '<div class="endcard"><h2>早期エンディング ― 引退（' + S.age + '歳）</h2>' +
'<div class="stext">' + color + '現役生活に、ここで幕を下ろした。記録：試合 ' + r.matches + "戦 " + r.wins + "勝 ／ 大会優勝 " + r.cups + "回 ／ 反則 " + r.fouls + "回 ／ バイト " + r.works + "回。</div>" +
'<div class="stext">名声 ' + fameTotal() + "（" + fameRank() + "）／ 清名" + S.sei + "・悪名" + S.aku + " ／ 道場生 " + S.students.length + "人 ／ " + (mainStyle()? mainStyle().name: "") + " Lv" + styleLv(S.mainStyle) + " ／ 純粋度 " + purity() + "%" + (S.partner? " ／ 共に歩む人：" + CAST_BY_ID[S.partner].name: "") + "</div>" +
'<div class="stext">引退は終わりではない。道場は残り、生徒たちはそれぞれの道を歩み続ける。' + (S.partner? CAST_BY_ID[S.partner].name + "と共に過ごす穏やかな日々と、時折顔を出す道場の笑い声。": "時折道場に顔を出し、若い世代の背中を押す日々。") + 'CLASHでは今も、時々あなたの名前が「全盛期の男」として語られている。</div>' +
'<button class="btn next" data-auto="to-title">タイトルへ戻る</button></div>';
saveGame(false);
$("main").querySelector("[data-auto='to-title']").addEventListener("click", renderTitle);
}

// ---------- 年次スキップ精算（代表シーズン方式・第2章と同方式） ----------
function __ch3Skip(){
const months = 7;
const tuitionIn = S.students.length * 8000 * months;
const gear = S.students.length * 1500 * months;
const onoCost = S.flags.onoPlan? 12000 * months: 0;
const bills = (52000 + 48000) * months + gear + onoCost;
const net = tuitionIn - bills;
S.money += net;
const notes = [];
gainStyleExp(S.mainStyle, 10, notes);
for (const stu of S.students){ if (_rng() < 0.5) stu.skill = Math.min(10, stu.skill + 1);}
for (const id in S.affection){
if (S.partner === id) S.affection[id] = clamp(S.affection[id] + 2, 0, 100);
else if (S.affection[id] > 0) S.affection[id] = clamp(S.affection[id] - 3, 0, 100);
}
if (S.money < -30000 &&!S.flags.tamuraHelp){
S.flags.tamuraHelp = true; S.money += 20000;
notes.push("田村が立て替えてくれた +20,000円");
}
// 30代の体：重い部位ダメージは古傷として残り、通常のダメージは経過で回復する
const newly = crystallizeOldWounds();
S.dmg = {arm:0, leg:0, core:0, head:0};
applyOldWoundFloor();
// ドーピング疑惑は時間と共に少し薄れる（使用の事実そのものは消えない）
if ((S.flags.dopeSuspect || 0) > 0) S.flags.dopeSuspect = Math.max(0, S.flags.dopeSuspect - 1);
S.absWeek += 29; // 残り28週を飛ばし、翌年の第1週に着地する
S.age = 19 + Math.floor((S.absWeek - 1) / 48);
saveGame(false);
const sum = [
{sp:"narr", t:"――季節は巡り、" + S.age + "歳の年が明けた。"},
{sp:"narr", t:"月謝収入 +" + tuitionIn.toLocaleString() + "円 ／ 家賃・道場賃料・生活費・用具代 -" + bills.toLocaleString() + "円 ／ 差し引き " + (net >= 0? "+": "") + net.toLocaleString() + "円。全盛期の道場は、回り続けている。"},
{sp:"narr", t:"稽古と指導の日々の中で、" + "{style}" + "の理解も静かに深まっていった。"},
{week:true},
];
if (newly.length) sum.splice(2, 0, {sp:"narr", t:"（" + newly.join("・") + "のダメージが、古傷として体に残った。白石遥の診察とケアで付き合っていくしかない）"});
for (const n of notes) sum.splice(2, 0, {sp:"narr", t:n});
startScene(sum);
}

// ---------- 香取道場との対抗戦（弟子争奪）の結果処理 ----------
// 移籍してくる生徒の候補（香取道場の門下生。一人ひとりに移る理由がある）
const KATORI_STUDENTS = [
{id:"kt_hase", name:"長谷川 蓮", style:"選手志望", trust:62, skill:5, note:"香取道場の若手エース。師範との指導方針の違いに悩んでいた"},
{id:"kt_shindo", name:"新堂 美月", style:"護身志望", trust:65, skill:3, note:"対抗戦で守る戦いぶりに惚れて移籍を志願した"},
{id:"kt_orito", name:"織戸 駿介", style:"選手志望", trust:58, skill:4, note:"もっと大きな舞台に挑みたいと門を叩いた"},
{id:"kt_yabuki", name:"矢吹 梓", style:"健康志望", trust:60, skill:2, note:"道場の雰囲気の温かさに惹かれて移ってきた"},
{id:"kt_serizawa", name:"芹沢 圭", style:"選手志望", trust:66, skill:5, note:"香取道場の元・看板生徒。敗れた師範から潔く送り出された"},
{id:"kt_amano", name:"天野 澪", style:"師範志望", trust:63, skill:4, note:"教える側の背中を見て学びたいと志願した"},
];
function dojoWarResultKatori(win){
if (win){
const cap = STUDENT_CAP[fameRankIdx()];
let moved = 0;
for (const cand of KATORI_STUDENTS){
if (moved >= 2) break;
if (S.students.length >= cap) break;
if (S.students.find(x => x.id === cand.id)) continue;
S.students.push({id:cand.id, name:cand.name, style:cand.style, trust:cand.trust, skill:cand.skill, note:cand.note});
toast("移籍入門：" + cand.name + "（" + cand.note + "）");
moved++;
}
if (moved === 0){ toast("移籍希望者はいたが、定員いっぱいで受け入れられなかった（賞金 +30,000円）"); S.money += 30000;}
else toast("香取道場から " + moved + "名が移ってきた！");
} else {
// 負け：信頼の低い生徒から流れる。ただし最大3割まで、最低2名は残る（設計書2.5。第2章と同じ流儀）
const maxLose = Math.min(Math.floor(S.students.length * 0.3), Math.max(0, S.students.length - 2));
const leavers = S.students.filter(s => s.trust < 70).sort((a, b) => a.trust - b.trust).slice(0, maxLose);
if (!leavers.length){ toast("誰も道場を去らなかった。信頼が、道場を守った"); return;}
S.students = S.students.filter(s =>!leavers.includes(s));
for (const l of leavers) toast(l.name + " が香取道場へ移っていった……", true);
toast(leavers.length + "名の生徒を失った", true);
}
saveGame(false);
}

// ---------- 第3章の固定ビート（absWeek） ----------
// 30歳=529週開始。各年は前半20週を実プレイし、年次スキップ（開始+19週）で残り28週を精算する
const BEATS_CH3 = [
{week:532, id:"ch3_satake"}, {week:535, id:"ch3_shiraishi"}, {week:538, id:"ch3_saotome"}, {week:541, id:"ch3_akai1"},
{week:544, id:"ch3_katori_intro"}, {week:548, id:"ch3_yearskip"},
{week:577, id:"birthday"}, {week:580, id:"ch3_war_k1"}, {week:583, id:"ch3_gunnar"}, {week:586, id:"ch3_sergei1"},
{week:589, id:"ch3_akai2"}, {week:592, id:"ch3_raijin"}, {week:596, id:"ch3_yearskip"},
{week:625, id:"birthday"}, {week:628, id:"ch3_war_k2"}, {week:631, id:"ch3_checkup"}, {week:634, id:"ch3_saotome_match"},
{week:637, id:"ch3_dope_rumor"}, {week:640, id:"ch3_mamiya_rumor"}, {week:644, id:"ch3_yearskip"},
{week:673, id:"birthday"}, {week:676, id:"ch3_war_k3"}, {week:679, id:"ch3_sergei2"}, {week:682, id:"ch3_akai3"},
{week:685, id:"ch3_oba"}, {week:688, id:"ch3_tier_d"}, {week:692, id:"ch3_yearskip"},
{week:721, id:"birthday"}, {week:724, id:"ch3_saotome_grow"}, {week:727, id:"ch3_war_black"}, {week:730, id:"ch3_body_crisis"},
{week:733, id:"ch3_gunnar2"}, {week:736, id:"ch3_satake2"}, {week:740, id:"ch3_yearskip"},
{week:769, id:"birthday"}, {week:772, id:"ch3_sergei3"}, {week:775, id:"ch3_akai4"}, {week:778, id:"ch3_war_k4"},
{week:781, id:"ch3_raijin2"}, {week:784, id:"ch3_honsen3_intro"}, {week:788, id:"ch3_yearskip"},
{week:817, id:"birthday"}, {week:820, id:"ch3_saotome_match2"}, {week:823, id:"ch3_checkup2"}, {week:826, id:"ch3_kirishima_doc"},
{week:829, id:"ch3_war_ex"}, {week:832, id:"ch3_body_final_note"}, {week:836, id:"ch3_yearskip"},
{week:865, id:"birthday"}, {week:868, id:"ch3_akai5"}, {week:871, id:"ch3_sergei_farewell"}, {week:874, id:"ch3_saotome_indep"},
{week:877, id:"ch3_tier_e"}, {week:880, id:"ch3_genda_talk"}, {week:884, id:"ch3_yearskip"},
{week:913, id:"birthday"}, {week:916, id:"ch3_final_intro"}, {week:919, id:"ch3_final_check"}, {week:922, id:"ch3_katori_final_talk"},
{week:925, id:"ch3_final_prep"}, {week:932, id:"ch3_yearskip"},
{week:961, id:"birthday"}, {week:964, id:"ch3_finale_qf"},
];

const STORY_CH3 = {
// ===== 導入：全盛期 =====
ch3_intro: {
title: "第3章 全盛期 ― 30歳",
steps: [
{sp:"narr", t:"30歳になった。本戦のリングを経験し、看板は地域に知れ渡った。体は今、人生で一番よく動く。"},
{sp:"narr", t:"だが源田師範の言葉が、頭の片隅に残っている。「30代は違うぞ。ピークと古傷は、同じドアから入ってくる」"},
{img:"genda"},
{sp:"genda", t:"体の管理、道場の本格的な戦い、そして……甘い誘いも増える年頃だ。お前の「全盛期」は、強さの形そのものが問われる十年になる"},
{sp:"me", t:"（やることは変わらない。戦う、守る、語る。その先に、まだ見ていない景色がある）"},
{sp:"narr", t:"第3章では、章の終わりに初めて「引退」を選べるようになります。選ばなければ現役続行が本線です。"},
{week:true},
],
},
ch3_yearskip: {
title: "季節は巡る",
steps: [
{sp:"narr", t:"大きな節目のない週が続いた。稽古、指導、体のケア、請求書。全盛期の日々もまた、平らな時間の積み重ねでできている。"},
{ch3skip:true},
],
},
// ===== 30歳 =====
ch3_satake: {
title: "警備の先輩",
steps: [
{sp:"narr", t:"大会会場の警備バイト。現場責任者は、元自衛官の佐竹剛だった。田村の紹介である。"},
{img:"satake"},
{fx:{meet:["satake"]}},
{sp:"satake", t:"あんたが噂の看板か。……俺は佐竹。自衛隊あがりで、今は警備の現場を仕切ってる"},
{sp:"satake", t:"リングの戦いと、現場の実戦は違う。距離感と、終わらせ方だ。今度、暇な時に教えてやる"},
{sp:"narr", t:"佐竹の言葉は短いが、現場の人間の重みがあった。警備バイトの口も、彼経由で太くなりそうだ。"},
{fx:{sei:1, money:11000, record:{works:1}}},
{week:true},
],
},
ch3_shiraishi: {
title: "スポーツドクターの診察",
steps: [
{sp:"narr", t:"選手の体の管理を専門にするスポーツドクター、白石遥のクリニック。大会主催側の紹介で、30歳の節目の精密検査を受けることになった。"},
{img:"shiraishi"},
{fx:{meet:["shiraishi"]}},
{sp:"shiraishi", t:"初めまして、白石です。……あなたのデータ、20代の頃から追っています。回復の速さは本物。でも、聞きたいのは数字じゃない"},
{sp:"shiraishi", t:"痛みを、隠していませんか？ 選手は皆、嘘をつくんです。「大丈夫」という嘘を"},
{choice:[
{label:"正直に、痛む部位を全部話す", fx:{affection:{shiraishi:8}, sei:1}, say:[
{sp:"shiraishi", t:"……正直な人は、珍しい。大丈夫、その正直さがあれば、私はあなたを止めずに済む方法を一緒に探せます"},
{sp:"narr", t:"検査の結果、大きな異常はなかった。だが白石は言った。「ダメージは、30代から『借り』じゃなく『残高』になります。付き合い方を変えましょう」"},
]},
{label:"「問題ありません」と答える", fx:{affection:{shiraishi:2}}, say:[
{sp:"shiraishi", t:"……そう。では、検査の数字で判断します。……触診で分かる嘘もあるんですよ、選手さん"},
{sp:"narr", t:"検査の結果、大きな異常はなかった。だが、見抜かれている感覚だけが残った。"},
]},
]},
{sp:"narr", t:"白石遥は今後、古傷の管理と「止める／出す」の最終判断、そして疑惑の検査側の顔として関わってくる。"},
{week:true},
],
},
ch3_saotome: {
title: "弟子世代の入門",
steps: [
{sp:"narr", t:"体験入門に、一人の若者が来た。早乙女楓、19歳。まっすぐな目で、道場の空気を吸っていた。"},
{img:"saotome"},
{fx:{meet:["saotome"]}},
{sp:"saotome", t:"あなたの試合、全部見てます。……私も、ああなりたい。いえ、ああなるために来ました。入門させてください"},
{sp:"me", t:"（19歳。……自分が{exam}を受けた年だ。この目を、預かる責任が生まれる）"},
{fx:{addStudent:{id:"saotome", name:"早乙女 楓", style:"弟子世代", trust:70, skill:2}, affection:{saotome:5}}},
{sp:"narr", t:"早乙女楓が入門した。教える側としての物語が、ここから本格的に始まる。"},
{week:true},
],
},
ch3_akai1: {
title: "CLASHの話題の男",
steps: [
{sp:"narr", t:"CLASHで、妙な選手が話題になっていた。赤い道着に黒帯、金髪のウィッグ、指なしグローブと赤いスニーカー。往年の格闘ゲームの主人公そのままの姿で戦う、コスプレ格闘家――赤井ケン。"},
{ep:"akai"},
{sp:"narr", t:"だが、笑う者は映像の最後で黙る。空手ベースの技は本物で、戦績も申し分ない。ミラの投稿が火を付けた。"},
{img:"mira"},
{sp:"mira", t:"今週の注目選手は赤井ケン！ コスプレに目が行きがちだけど、実力はガチ。……ねえハヤト、あなたの「正統」と、彼の「魅せる正統」、どっちが上か見たくない？"},
{fx:{attention:2}},
{sp:"narr", t:"赤井ケンの名前が、頭の片隅に残った。いつか、リングで会う男だ。"},
{week:true},
],
},
ch3_katori_intro: {
title: "香取道場の噂",
steps: [
{sp:"narr", t:"隣町の名門「香取道場」。八極拳の師範・香取冴子が率いる、門下生の数で地域随一の道場だ。交流会の席で、初めて顔を合わせた。"},
{img:"katori"},
{fx:{meet:["katori"]}},
{sp:"katori", t:"あんたが、本戦で名を上げた若い看板かい。……ふん、悪くない目をしてる。だがね、道場の本当の勝負は、リングの外でも決まるんだよ"},
{sp:"katori", t:"うちの門下と、あんたの門下。いつか本気で競わせようじゃないか。逃げるんじゃないよ"},
{sp:"narr", t:"その席ではもう一つ、噂を聞いた。散打の間宮健一という老師範が、各地の道場対抗戦を観戦して回っているという。「次の時代の看板」を品定めしているのだ、と。"},
{fx:{attention:1}},
{week:true},
],
},
// ===== 31歳 =====
ch3_war_k1: {
title: "道場対抗戦 ― 香取道場との交流戦",
steps: [
{sp:"narr", t:"香取道場との初の交流戦が決まった。賭けなしの顔合わせ。だが、両道場の生徒たちの目は真剣そのものだった。"},
{img:"katori"},
{sp:"katori", t:"今日は顔合わせだ。だが、手加減はいらない。うちの若い衆に、本物の圧を見せてやっておくれ"},
{battle:"katori_ex", win:[
{sp:"katori", t:"……見事。あんたの{style}、噂以上だね。だが次は、賭けありでやろう。看板の値打ちは、賭けてこそ決まる"},
{fx:{sei:2, attention:2, affection:{katori:5}}},
], lose:[
{sp:"katori", t:"ふふ、うちの若い衆も捨てたもんじゃないだろう？ ……あんたの目、悪くなかったよ。次は本気で競おう"},
{fx:{sei:1, affection:{katori:4}}},
]},
{week:true},
],
},
ch3_gunnar: {
title: "甲冑の重戦車",
steps: [
{sp:"narr", t:"特別興行の対戦相手は、アーマードバトルのグンナル・シグルドソン。甲冑を着込んだ重戦車が、特別ルールのリングに立った。"},
{img:"gunnar"},
{fx:{meet:["gunnar"]}},
{sp:"gunnar", t:"私の鎧は、並の打撃では揺るがない。だが、戦士の礼はする。……全力で来い、日本の看板"},
{battle:"gunnar_b", win:[
{sp:"gunnar", t:"……鎧の内側まで響いた。見事なものだ。持久と視界、弱点をよく見ていた"},
{fx:{sei:3, attention:3, money:80000, record:{finWins:1}}},
], lose:[
{sp:"gunnar", t:"重さは、正義だ。……だが、お前の読みは悪くなかった。次は鎧なしでも戦おう"},
{fx:{sei:1, attention:2, money:30000}},
]},
{week:true},
],
},
ch3_sergei1: {
title: "怪しいトレーナー",
steps: [
{sp:"narr", t:"大会の控室。一人の男が、笑顔で近づいてきた。元軍関係者と噂されるトレーナー、セルゲイ・コズロフ。"},
{img:"sergei"},
{fx:{meet:["sergei"]}},
{sp:"sergei", t:"素晴らしい選手生活だ。だが、30代の回復は若い頃と違う。……私の『ケア』を受ければ、回復は20代に戻る。注射一本、秘密は厳守だ"},
{sp:"me", t:"（『回復が早くなる注射』。第2章で噂に聞いた、あの話か。……匂う。危ない匂いがする）"},
{choice:[
{label:"きっぱり断る", fx:{sei:2, affection:{}}, say:[
{sp:"sergei", t:"……ふふ、正直な男だ。気が変わったら、いつでも声をかけてくれ。扉は開けておく"},
{sp:"narr", t:"断った。だが、あの笑顔は「また来る」と言っていた。"},
]},
{label:"話だけ聞いてみる", fx:{dopeSuspect:1, attention:1}, say:[
{sp:"sergei", t:"賢明だ。使うかどうかは、君が決めることだ。……サンプルは、置いていこう"},
{sp:"narr", t:"小さなケースが手元に残った。使うかどうかは、まだ決めていない。だが「持っている」という事実が、既に重かった。"},
{fx:{flags:{dopeSample:true}}},
]},
]},
{week:true},
],
},
ch3_akai2: {
title: "マイク合戦 ― 赤井ケン登場",
steps: [
{sp:"narr", t:"興行の合同記者会見。隣の席に座ったのは、赤い道着と金髪ウィッグの男、赤井ケンだった。"},
{img:"akai"},
{fx:{meet:["akai"]}},
{sp:"akai", t:"よお、全盛期の看板さん。俺は赤井ケン。見ての通りのコスプレ格闘家だ。……だがな、リングじゃコスプレは関係ねえ。全力で来いよ"},
{sp:"akai", t:"どうせなら試合前に一つ、マイクで勝負しようぜ。観客は、戦う前から物語を求めてるんだ"},
{debate:"akai_mic"},
{sp:"narr", t:"会見の後、二人の対戦カードが正式に決まった。"},
{battle:"akai_battle", win:[
{sp:"akai", t:"ははっ、負けた！ だが見ろよ、この会場の盛り上がり。……あんたとは、いい物語が作れそうだ。また戦おうぜ、看板さん"},
{fx:{sei:2, attention:4, money:60000, record:{finWins:1}}},
], lose:[
{sp:"akai", t:"俺の勝ちだな。でもよ、あんたの正統派の圧、痺れたぜ。……次はあんたが勝つ番かもしれねえ。それが物語ってもんだ"},
{fx:{attention:4, money:30000}},
]},
{week:true},
],
},
ch3_raijin: {
title: "ショーの達人",
steps: [
{sp:"narr", t:"プロレスの大ベテラン、ザ・グレート雷神との特別エキシビション。48歳の体から放たれる「見せる力」は、若い選手の誰よりも大きかった。"},
{img:"raijin"},
{fx:{meet:["raijin"]}},
{sp:"raijin", t:"若いの、戦いは強いだけじゃ残らねえ。客の心に爪痕を残すんだ。……今日は、その授業料はタダにしといてやる"},
{battle:"raijin_show", win:[
{sp:"raijin", t:"はっはっは、やるじゃねえか。技術も華もある。……だが、マイクはまだまだだな。今度、教えてやる"},
{fx:{sei:1, attention:4, money:70000, record:{finWins:1}}},
], lose:[
{sp:"raijin", t:"力は認める。だが、最後に客が覚えているのは「物語」だ。……負けても物語は作れる。それを忘れるな"},
{fx:{attention:3, money:40000}},
]},
{week:true},
],
},
};

Object.assign(STORY_CH3, {
// ===== 32歳 =====
ch3_war_k2: {
title: "道場対抗戦 ― 賭け宣言",
steps: [
{sp:"narr", t:"香取冴子から、正式な果たし状が届いた。「代表戦をやろう。今回は賭けありだ。勝った方が、負けた方の生徒を貰う。――あんたが本戦で見せた看板の値打ち、試させてもらう」"},
{img:"katori"},
{sp:"katori", t:"断るなら断ればいい。だが、看板ってのはね、賭けて守るもんなんだよ"},
{fx:{money:-25000}},
{sp:"narr", t:"遠征費と会場費で25,000円が出ていった。"},
{choice:[
{label:"賭けを受ける（勝てば相手の生徒が移籍、負ければ生徒が流れる）", say:[
{sp:"narr", t:"代表戦。香取道場のエースは、若手の長谷川蓮。師範譲りの近距離の圧が襲う。"},
{battle:"katori_ace", win:[
{warWinK:true},
{sp:"katori", t:"……約束は約束だ。行きたがっている連中は、止めない。だが、預けるからには大事に育てておくれ"},
{fx:{sei:3, attention:3, affection:{katori:6}, record:{finWins:1}}},
], lose:[
{warLoseK:true},
{sp:"katori", t:"生徒は、強い看板に集まる。……それだけのことさ。恨むんじゃないよ、あんたの門下もね"},
{fx:{attention:2}},
]},
]},
{label:"賭けは断り、交流戦にする", say:[
{battle:"katori_ace", win:[
{sp:"narr", t:"勝った。香取は「賭けのない勝利は、半分の味だ」と笑った。火種は残った。"},
{fx:{sei:2, affection:{katori:3}}},
], lose:[
{sp:"narr", t:"負けた。だが、生徒は誰も失わなかった。"},
{fx:{sei:1}},
]},
]},
]},
{week:true},
],
},
ch3_checkup: {
title: "止める／出すの判断",
steps: [
{sp:"narr", t:"白石遥の定期診察。積み重なった部位ダメージのデータを見て、彼女の表情が曇った。"},
{img:"shiraishi"},
{fx:{meet:["shiraishi"]}},
{sp:"shiraishi", t:"正直に言います。このまま大きな試合に出れば、ダメージの一部は『古傷』として一生残る可能性がある。今なら、まだ選べます"},
{sp:"shiraishi", t:"休んで治すか、それでも出るか。……決めるのは選手であるあなた。私は、どちらの判断にも医療で付き合います"},
{choice:[
{label:"白石の助言を受け、ケアに専念する", fx:{dmg:{arm:-1, leg:-1, core:-1, head:-1}, fatigue:-20, affection:{shiraishi:8}, sei:1}, say:[
{sp:"shiraishi", t:"……賢明です。止まれる選手は、長く戦えます。あなたの30代は、まだ始まったばかりですよ"},
]},
{label:"それでも戦い続ける", fx:{affection:{shiraishi:3}}, say:[
{sp:"shiraishi", t:"……だろうと思いました。では約束を。痛みを隠したら、その時点で私はあなたの出場を止めます。それでも、ついていきます"},
]},
]},
{week:true},
],
},
ch3_saotome_match: {
title: "弟子の試合 ― セコンドの采配",
steps: [
{sp:"narr", t:"早乙女楓のアマ大会デビュー戦。セコンドにつくのは、師である自分だ。采配ひとつで、弟子の未来が変わる。"},
{img:"saotome"},
{sp:"saotome", t:"師匠。……緊張してます。でも、逃げません。私の戦い、見ていてください"},
{choice:[
{label:"「距離を支配しろ。お前の型を信じろ」と送り出す", say:[{sp:"narr", t:"楓は深呼吸をして、リングへ上がった。"}]},
{label:"「無理はするな。引く勇気も戦いだ」と送り出す", say:[{sp:"narr", t:"楓は頷き、肩の力を抜いてリングへ上がった。"}]},
]},
{battle:"saotome_match", win:[
{sp:"saotome", t:"勝ちました……！ 私、勝ちました、師匠！"},
{sp:"narr", t:"弟子の初勝利は、自分の勝利とは違う種類の重さがあった。道場の名前も、小さく響いた。"},
{fx:{sei:2, attention:1, affection:{saotome:6}, studentTrust:5}},
], lose:[
{sp:"saotome", t:"……負けました。でも、最後まで立ってました。次は、絶対に……"},
{sp:"narr", t:"敗北の味を知ることも、育つということだ。楓の目は、折れていなかった。"},
{fx:{sei:1, affection:{saotome:4}, studentTrust:3}},
]},
{week:true},
],
},
ch3_dope_rumor: {
title: "強さゆえの疑惑",
steps: [
{sp:"narr", t:"CLASHに、再び疑惑の投稿が流れた。「あの回復力は異常だ。30代であの動きはありえない」。使っていなくても、強さそのものが疑われる時代だった。"},
{sp:"narr", t:"白石遥から短い連絡が来た。「検査はいつでも受けられます。潔白は、証明できますよ」"},
{debate:"dope_ch3_rumor"},
{week:true},
],
},
ch3_mamiya_rumor: {
title: "観戦する老師範",
steps: [
{sp:"narr", t:"交流戦の観客席に、噂の老師範が座っていたという。散打の間宮健一。元・軍警察の訓練教官で、各地の対抗戦を品定めして回る男。"},
{sp:"narr", t:"試合後、関係者経由で短い伝言が届いた。「香取との決着がついたら、次は私の番だ。40代の戦いを用意しておく」"},
{sp:"me", t:"（間宮健一。……次の年代の、主敵の顔が見え始めた）"},
{fx:{attention:1}},
{week:true},
],
},
// ===== 33歳 =====
ch3_war_k3: {
title: "道場対抗戦 ― 師範対決",
steps: [
{sp:"narr", t:"香取道場との三度目の対決。今度は冴子本人が代表戦の畳に立つ。「賭けは前回と同じ。師範同士で決めよう」"},
{img:"katori"},
{sp:"katori", t:"八極拳の貼山靠、若い看板に受け止められるかい？ ……行くよ、ハヤト"},
{fx:{money:-30000}},
{choice:[
{label:"賭けを受ける（師範対決）", say:[
{battle:"katori_duel", win:[
{warWinK:true},
{sp:"katori", t:"……完敗だ。潔く認める。あんたの道場は、本物だね。……だが、弟子の取り合いは、これで終わりじゃないよ"},
{fx:{sei:4, attention:3, affection:{katori:8}, record:{finWins:1}}},
], lose:[
{warLoseK:true},
{sp:"katori", t:"師範の意地、見せてもらったかい。……あんたも大したもんだ。ここまで粘る若い看板は、そういない"},
{fx:{attention:2, affection:{katori:5}}},
]},
]},
{label:"賭けは断り、交流戦にする", say:[
{battle:"katori_duel", win:[
{sp:"narr", t:"師範同士の読み合いを制した。賭けのない勝利に、冴子は「つまらないねえ」と笑った。"},
{fx:{sei:2, affection:{katori:5}}},
], lose:[
{sp:"narr", t:"負けた。だが、道場の誰も失わなかった。"},
{fx:{sei:1, affection:{katori:3}}},
]},
]},
]},
{week:true},
],
},
ch3_sergei2: {
title: "ドーピングの誘惑 ― 本番",
steps: [
{sp:"narr", t:"大きな大会を前に、セルゲイが再び現れた。今度は具体的な話だった。「次の大会まで、週に一度の注射でいい。検査のタイミングも、私が管理する」"},
{img:"sergei"},
{sp:"sergei", t:"使う者は、皆やっている。やらない者は、正直者ぶって落ちていくだけだ。……君は、どちら側の人間かな？"},
{choice:[
{label:"使う（短期的に強くなるが、検査・告発・疑惑のリスクを背負う）", fx:{dopeUse:true, aku:1, dopeSuspect:1}, say:[
{sp:"narr", t:"注射の後、体は驚くほど軽かった。稽古の回復が、20代の頃のように速い。……だが、鏡の中の自分の目が、少しだけ他人に見えた。（一定期間、試合での攻撃力が上がる）"},
{sp:"narr", t:"白石遥の次回の検査が、頭をよぎった。バレれば、全てが終わる。"},
]},
{label:"断る（正道で戦い続ける）", fx:{sei:2}, say:[
{sp:"sergei", t:"……そうか。正直者は、損をする世界だ。だが、まあ……その目、嫌いじゃない"},
{sp:"narr", t:"断った。代わりに残ったのは、自分の足で立つ感覚だけだった。正道だけでも、この章は走り切れる。それが自分の戦い方だ。"},
]},
{label:"霧島沙耶に情報を渡し、告発の準備をする", fx:{sei:3, dopeSuspect:-1, attention:1}, say:[
{sp:"narr", t:"霧島は静かに頷いた。「記事にするには、証拠が要ります。……でも、あなたの潔白と勇気は、必ず守ります」"},
{sp:"narr", t:"セルゲイの影は、少しだけ遠のいた。だが、火種は消えていない。"},
{fx:{flags:{sergeiReported:true}}},
]},
]},
{week:true},
],
},
ch3_akai3: {
title: "試合後の交流 ― 赤井ケン",
steps: [
{sp:"narr", t:"興行の打ち上げ。赤井ケンが、ウィッグを外した素顔で現れた。地毛は短く刈った黒髪で、印象がまるで違う。"},
{img:"akai"},
{sp:"akai", t:"驚いたか？ ウィッグはコスプレの一部だ。俺の「変身」なんだよ。……リングに上がる時は、別の自分になる。それが俺の強さの半分だ"},
{sp:"akai", t:"あんたは変身しねえよな。いつも素顔で、正統で、真っ直ぐだ。……だからこそ、俺とあんたの試合は映えるんだよ。正反対の二人が、本気でぶつかる物語"},
{sp:"akai", t:"俺には夢があるんだ。いつか自分の道場を開く。その時はな、弟子は全員この赤い道着だ。……笑うか？ でもよ、門をくぐった瞬間に全員が『変身』する道場って、悪くないだろ"},
{fx:{attention:2, affection:{}}},
{sp:"narr", t:"人気者の素顔は、意外なほど真面目な格闘家だった。赤井ケンという男の奥行きを、少しだけ知った。"},
{week:true},
],
},
ch3_oba: {
title: "同世代の時間",
steps: [
{sp:"narr", t:"合同稽古で、同世代ライバルの大場鉄平と久しぶりに組み合った。19歳の頃から知る、極真の男。"},
{img:"oba"},
{fx:{meet:["oba"]}},
{sp:"oba", t:"お互い、歳を取ったな。……俺はな、そろそろ引退を考えてる。体が、正直になってきた"},
{sp:"oba", t:"あんたは、まだ行ける。俺より先に行けよ。……同世代の意地だ"},
{sp:"narr", t:"一緒に歳を取り、やがて先に去っていく者もいる。それもまた、年代記の現実だった。"},
{fx:{sei:1}},
{week:true},
],
},
ch3_tier_d: {
title: "Tier表 ― 全盛期の評価",
steps: [
{sp:"narr", t:"ミラの月例Tier表。30代の部の中心に、自分の名前があった。「全盛期の看板は、衰えを知らないのか」という特集だ。"},
{debate:"tier_ch3"},
{week:true},
],
},
});

Object.assign(STORY_CH3, {
// ===== 34歳 =====
ch3_saotome_grow: {
title: "育つ弟子",
steps: [
{sp:"narr", t:"早乙女楓の動きが、明らかに変わってきた。入門当初のおぼつかない型は消え、距離の支配に自分の色が出始めている。"},
{img:"saotome"},
{sp:"saotome", t:"師匠、私、最近思うんです。あなたの背中は、遠いようで、ちゃんと届く距離にあるって。……いつか、追いつきます"},
{sp:"me", t:"（育てることの手応えは、自分の勝利とは別の場所で返ってくる）"},
{fx:{affection:{saotome:5}, studentTrust:5, sei:1}},
{week:true},
],
},
ch3_war_black: {
title: "黒潮道場との再戦（別枠）",
steps: [
{sp:"narr", t:"第2章で争った黒潮道場から、親善枠の再戦の誘いが来た。賭けなしの交流戦だが、両道場の意地は健在だった。"},
{sp:"narr", t:"黒潮鉄心は笑った。「香取相手に看板を張るようになったか。……うちの若い衆にも、本物の圧を見せてやってくれ」"},
{battle:"war3_ace", win:[
{sp:"narr", t:"勝った。黒潮鉄心は潔く頷いた。「いい時代だ。強い看板が、ちゃんと勝つ」"},
{fx:{sei:2, attention:2}},
], lose:[
{sp:"narr", t:"負けた。黒潮の若い衆の成長もまた、本物だった。"},
{fx:{sei:1}},
]},
{week:true},
],
},
ch3_body_crisis: {
title: "体の山場",
steps: [
{sp:"narr", t:"稽古中、古傷のある部位が悲鳴を上げた。白石遥の緊急診察が入る。"},
{img:"shiraishi"},
{sp:"shiraishi", t:"言いましたよね。30代の体は『残高』だって。……今のあなたは、大きな引き出しをしようとしている。止めるなら、今です"},
{choice:[
{label:"白石の判断に従い、一定期間の休養と治療に入る", fx:{fatigue:-35, dmg:{arm:-1, leg:-1, core:-1, head:-1}, affection:{shiraishi:8}, sei:1}, say:[
{sp:"shiraishi", t:"……ありがとう。止まれる強さは、誰にでもあるものじゃない。復帰の計画は、私が全部組みます"},
]},
{label:"治療を受けながら、戦いは止めない", fx:{fatigue:-15, dmg:{arm:-1, leg:-1}, affection:{shiraishi:4}}, say:[
{sp:"shiraishi", t:"……分かりました。では、無理の線引きは私がします。痛みを隠したら、その場で止めますからね"},
]},
{label:"痛み止めで押し切る", fx:{aku:1, dopeSuspect:1, affection:{shiraishi:-3}}, say:[
{sp:"shiraishi", t:"……それは、選手の判断として最低の部類です。……でも、止める権利は、今の私にはない。次回の検査で、詳しく見ます"},
]},
]},
{week:true},
],
},
ch3_gunnar2: {
title: "鎧なしの再戦",
steps: [
{sp:"narr", t:"グンナルが再び来日した。今度は鎧なしの通常ルールで、互いの純粋な技術を競う再戦だった。"},
{img:"gunnar"},
{sp:"gunnar", t:"鎧の内側まで響かせた男と、素手で戦ってみたかった。……行くぞ"},
{battle:"gunnar_b2", win:[
{sp:"gunnar", t:"……素手でも強い。認めよう、お前は本物の戦士だ"},
{fx:{sei:3, attention:2, money:60000, record:{finWins:1}}},
], lose:[
{sp:"gunnar", t:"重さは、鎧がなくても正義だ。……だが、いい試合だった"},
{fx:{sei:1, money:30000}},
]},
{week:true},
],
},
ch3_satake2: {
title: "警備の現場で",
steps: [
{sp:"narr", t:"佐竹剛と組んだ警備バイトの夜。イベント会場の裏口で、酔った集団が警備員に絡み始めた。"},
{img:"satake"},
{sp:"satake", t:"来たな、実戦の時間だ。……リングと違って、終わらせ方が全てだ。見てろ"},
{battle:"street2", win:[
{sp:"satake", t:"……見事な収め方だ。あんたの距離感、現場でも通用する"},
{sp:"narr", t:"騒ぎは怪我人もなく収まった。警備会社からの評価も上がり、現場の信頼が厚くなった。"},
{fx:{sei:2, attention:1, money:15000, record:{streetWins:1, works:1}}},
], lose:[
{sp:"satake", t:"怪我は軽い。……現場は結果が全てじゃない。誰も死ななきゃ、それでいい"},
{fx:{sei:1, money:11000, record:{works:1}, dmg:{arm:1}}},
]},
{week:true},
],
},
// ===== 35歳 =====
ch3_sergei3: {
title: "検査と告発",
steps: [
{sp:"narr", t:"大会組織が、抜き打ちのドーピング検査を導入した。検査の責任者は白石遥。選手全員が対象で、例外はなかった。"},
{img:"shiraishi"},
{sp:"shiraishi", t:"全員、平等に検査します。……あなたも例外じゃありません。結果は、私が責任を持って公表します"},
{choice:[
{label:"堂々と検査を受ける", say:[
{sp:"narr", t:"検査は滞りなく進んだ。結果の公表は、数日後になるという。"},
]},
]},
{dopeVerdict:true},
{week:true},
],
},
ch3_akai4: {
title: "コラボ興行 ― 正統とコスプレ",
steps: [
{sp:"narr", t:"九条沙織の企画で、「正統の看板」と「コスプレ格闘家」のコラボ興行が実現した。チケットは即完売。CLASHの実況欄は、始まる前から燃えていた。"},
{img:"akai"},
{sp:"akai", t:"見ろよ、この熱。物語ってのはな、強い同士が噛み合った時に生まれるんだ。……今日は客に、最高の物語を配ろうぜ"},
{sp:"akai", t:"聞いてるか、未来の弟子たちよ。……いつか開く俺の道場じゃ、弟子は全員この赤い道着だ。今日の熱を見て『着たい』と思った奴、待ってるぜ"},
{battle:"akai_rematch", win:[
{sp:"akai", t:"っはは、また負けたか！ でもよ、満足そうな客の顔を見ろ。俺たち、いい仕事したよな"},
{fx:{sei:2, attention:5, money:90000, record:{finWins:1}}},
], lose:[
{sp:"akai", t:"俺の物語が勝ったな。……だが、あんたの正統がなきゃ、この熱は生まれなかった。礼を言うぜ"},
{fx:{attention:5, money:50000}},
]},
{week:true},
],
},
ch3_war_k4: {
title: "道場対抗戦 ― 香取との最終決着",
steps: [
{sp:"narr", t:"香取冴子から、最後の果たし状が届いた。「弟子の取り合いも、これで最後にしよう。賭けは最大。師範同士、全力で決める」"},
{img:"katori"},
{sp:"katori", t:"あんたとの争いは、悪くなかった。うちの門下も、あんたの門下も、競い合って強くなった。……だからこそ、最後は綺麗に決めようじゃないか"},
{fx:{money:-30000}},
{choice:[
{label:"賭けを受ける（最終決着）", say:[
{battle:"katori_final", win:[
{warWinK:true},
{sp:"katori", t:"……完敗。潔く認めるよ。あんたは、間違いなくこの地域の顔だ。……弟子たちを、よろしく頼む"},
{fx:{sei:5, attention:4, affection:{katori:10}, record:{finWins:1}}},
], lose:[
{warLoseK:true},
{sp:"katori", t:"最後は、うちが貰ったね。……だがあんた、負けてなお目が死んでない。40代の戦いが、楽しみだよ"},
{fx:{attention:3, affection:{katori:6}}},
]},
]},
{label:"賭けなしの、純粋な師範対決にする", say:[
{battle:"katori_final", win:[
{sp:"narr", t:"賭けのない師範対決は、純粋な読み合いの極致だった。勝敗を超えて、両道場の生徒たちが拍手を送った。"},
{fx:{sei:3, affection:{katori:8}}},
], lose:[
{sp:"narr", t:"負けた。だが、失ったものは何もない。残ったのは、認め合う師範同士の関係だった。"},
{fx:{sei:1, affection:{katori:6}}},
]},
]},
]},
{week:true},
],
},
ch3_raijin2: {
title: "マイクの師匠",
steps: [
{sp:"narr", t:"大きな大会を控え、雷神が道場を訪れた。試合後のマイクについて、直々に稽古をつけるという。"},
{img:"raijin"},
{sp:"raijin", t:"いいか、マイクは第二の試合だ。勝った後の三十秒で、次の物語が生まれる。……次の相手を指名する度胸と、負けた相手への敬意。両方を持て"},
{sp:"raijin", t:"あんたは強い。だが、語る力はまだ半人前だ。……全盛期の男は、戦い方も語り方も、全部が「顔」になるんだぜ"},
{fx:{attention:2, sei:1}},
{week:true},
],
},
ch3_honsen3_intro: {
title: "全盛期の本戦への誘い",
steps: [
{sp:"narr", t:"九条沙織から、全盛期の集大成となる大会「グランド本戦」への出場案内が届いた。39歳の年に開かれる、30代の全てを懸ける舞台だ。"},
{img:"kujo"},
{sp:"kujo", t:"出場の準備には、参加費も体も要るわ。残りの数年は、全部この大会への助走。……あなたの30代の答えを、リングで見せてちょうだい"},
{choice:[
{label:"参加費・遠征費 100,000円を払い、出場を決める", fx:{money:-100000, flags:{grandEntry:true}}, say:[
{sp:"kujo", t:"いい目ね。その目があれば、きっと届く。……準備を怠らないで"},
]},
{label:"道場の積立と応援で捻出する", fx:{money:-60000, attention:2, flags:{grandEntry:true}}, say:[
{sp:"kujo", t:"あなたの物語には、応援してくれる人が大勢いる。それも実力のうちよ"},
]},
]},
{week:true},
],
},
});

Object.assign(STORY_CH3, {
// ===== 36歳 =====
ch3_saotome_match2: {
title: "弟子の試合 ― 育つ実感",
steps: [
{sp:"narr", t:"早乙女楓のアマ大会、二度目の出場。今度はシード選手としての登場だった。セコンドから見る弟子の背中が、入門の頃よりずっと大きく見える。"},
{img:"saotome"},
{sp:"saotome", t:"師匠、今日は勝ちにいきます。……育ててもらった分を、結果で返します"},
{battle:"saotome_match2", win:[
{sp:"saotome", t:"やりました……！ 師匠、私、看板を背負える選手に、なれてますか？"},
{sp:"narr", t:"弟子の活躍は道場の名声そのものになった。若い世代の入門希望まで届き始めている。"},
{fx:{sei:3, attention:2, affection:{saotome:7}, studentTrust:6, joinStudent:true}},
], lose:[
{sp:"saotome", t:"あと一歩でした……。でも、去年の私とは違う戦いができました"},
{sp:"narr", t:"敗れても、成長は明らかだった。育つ実感は、師と弟子の両方に残った。"},
{fx:{sei:1, affection:{saotome:5}, studentTrust:4}},
]},
{week:true},
],
},
ch3_checkup2: {
title: "定期検査 ― 白石遥",
steps: [
{sp:"narr", t:"白石遥の定期検査。古傷の経過と、全身のデータが並ぶ。彼女はデータの一点を、長く見つめていた。"},
{img:"shiraishi"},
{sp:"shiraishi", t:"体の管理は、正直さが全てです。……隠し事のない選手のデータは、嘘をつきません"},
{dopeVerdict:true},
{sp:"shiraishi", t:"付き合い方は、あなた自身が決めること。私は、最後まであなたの体の味方でいます"},
{fx:{affection:{shiraishi:4}}},
{week:true},
],
},
ch3_kirishima_doc: {
title: "ドキュメンタリーの取材",
steps: [
{sp:"narr", t:"霧島沙耶が、30代の格闘家の日常を追うドキュメンタリー記事の取材に来た。稽古、指導、体のケア、請求書。その全てが題材だという。"},
{img:"kirishima"},
{fx:{meet:["kirishima"]}},
{sp:"kirishima", t:"強い選手の記事は、誰でも書けます。でも『強くあり続ける生活』の記事は、あなたにしか書かせてもらえない"},
{sp:"kirishima", t:"全盛期って、派手な言葉ですけど。実態は、体の管理と、地味な継続なんですね"},
{fx:{attention:3, sei:1, affection:{kirishima:5}}},
{week:true},
],
},
ch3_war_ex: {
title: "合同交流戦 ― 世代の競演",
steps: [
{sp:"narr", t:"地域の合同交流戦。香取道場、黒潮道場、そして自分の道場。若手とベテランが入り混じる、世代の競演だった。"},
{sp:"narr", t:"早乙女楓の試合運びに、観客のどよめきが起きた。弟子世代が、確かに育っている。"},
{battle:"katori_ex", win:[
{sp:"narr", t:"自分の試合も制した。師範としての貫禄が、結果にも出始める年代になった。"},
{fx:{sei:2, attention:2}},
], lose:[
{sp:"narr", t:"自分の試合は落としたが、弟子たちの健闘が道場の評価を押し上げた。"},
{fx:{sei:1, attention:1}},
]},
{week:true},
],
},
ch3_body_final_note: {
title: "体の管理の総括",
steps: [
{sp:"narr", t:"白石遥との面談。30代も後半に入り、体の管理は「稽古」と同じ重さの営みになっていた。"},
{img:"shiraishi"},
{sp:"shiraishi", t:"あなたの体は、よく持っています。古傷との付き合い方も、上手くなった。……あとは、大きな舞台で無事に戦い抜くこと。それだけです"},
{choice:[
{label:"白石の管理計画に全面的に委ねる", fx:{fatigue:-25, dmg:{arm:-1, leg:-1, core:-1, head:-1}, affection:{shiraishi:8}, sei:1}, say:[
{sp:"shiraishi", t:"……信頼、ありがとうございます。あなたの全盛期の締めくくり、私も一緒に戦います"},
]},
{label:"自分の感覚を優先し、助言は参考にする", fx:{affection:{shiraishi:3}}, say:[
{sp:"shiraishi", t:"選手の感覚も、大事なデータです。……ただし、嘘だけはつかないでくださいね"},
]},
]},
{week:true},
],
},
// ===== 37歳 =====
ch3_akai5: {
title: "人気対決 ― 赤井ケン最終章",
steps: [
{sp:"narr", t:"赤井ケンとの三度目の対戦カードが組まれた。「正統とコスプレ、人気対決の最終章」と銘打たれ、CLASHの注目度は章内最高を記録した。"},
{img:"akai"},
{sp:"akai", t:"看板さん、俺たちの物語も三戦目だ。……勝っても負けても、客が泣ける試合をしようぜ。それが、プロってもんだろ"},
{battle:"akai_final", win:[
{sp:"akai", t:"ははっ、三連敗か！ でもよ、不思議と悔しくねえ。あんたとの試合は、いつも満員だ。……また戦おうぜ。何歳になってもな"},
{fx:{sei:3, attention:5, money:100000, record:{finWins:1}}},
], lose:[
{sp:"akai", t:"ようやく一矢報いたぜ。……だが、あんたの正統あっての俺だ。次も、物語の続きを書こう"},
{fx:{attention:5, money:60000}},
]},
{week:true},
],
},
ch3_sergei_farewell: {
title: "セルゲイの去就",
steps: [
{sp:"narr", t:"セルゲイ・コズロフの周囲が、騒がしくなってきた。他の選手への持ちかけが明るみに出始め、組織が調査に動いているという。"},
{img:"sergei"},
{sp:"sergei", t:"……君は、私を売ることもできた。だが、格闘技界は狭い。情報は、持っている者が強い"},
{choice:[
{label:"霧島と組織へ、持っている情報を全て渡す", fx:{sei:3, attention:2, flags:{sergeiExposed:true}}, say:[
{sp:"narr", t:"数週間後、セルゲイは格闘技界から姿を消した。ドーピングの闇は、完全には晴れない。それでも、一つの火種は消えた。"},
{sp:"kirishima", t:"あなたの勇気が、界隈を少しだけ綺麗にしました。……記事は、選手たちを守る形で書きます"},
]},
{label:"自分の戦いにだけ集中し、関わらない", fx:{attention:1}, say:[
{sp:"narr", t:"セルゲイの行方は、やがて噂の中に消えた。闇は残ったが、自分のリングは汚れなかった。"},
]},
]},
{week:true},
],
},
ch3_saotome_indep: {
title: "弟子の独立相談",
steps: [
{sp:"narr", t:"稽古終わり、早乙女楓が改まって切り出した。「師匠、私……将来は、自分の道場を持ちたいです」"},
{img:"saotome"},
{sp:"saotome", t:"まだ先の話です。でも、あなたの背中を見ていたら、自然とそう思うようになって。……怒りますか？"},
{choice:[
{label:"「いい夢だ。全力で応援する」と背中を押す", fx:{affection:{saotome:8}, studentTrust:8, sei:2}, say:[
{sp:"saotome", t:"……！ ありがとうございます。いつか、師匠に挑める選手になって、その上で独立します。それが、私の恩返しです"},
{sp:"narr", t:"弟子は育ち、独立し、やがて挑む側に回る。それが世代交代というものだ。"},
]},
{label:"「まだ早い。まず選手として完成しろ」と諭す", fx:{affection:{saotome:4}, studentTrust:3}, say:[
{sp:"saotome", t:"……はい。焦らず、まず強くなります。夢は、逃げませんから"},
]},
]},
{week:true},
],
},
ch3_tier_e: {
title: "Tier表 ― 混合か純粋か、30代の答え",
steps: [
{sp:"narr", t:"ミラの特集が、再び大論争を巻き起こした。「30代の看板は、流派の純粋さで戦うのか、混合の対応力で戦うのか」。渦の中心には、また自分の名前があった。"},
{debate:"tier_ch3_b"},
{week:true},
],
},
ch3_genda_talk: {
title: "師範と引退の話",
steps: [
{sp:"narr", t:"源田師範の道場を訪ねた。茶を飲みながら、ふと引退の話になった。"},
{img:"genda"},
{sp:"genda", t:"引退はな、弱さじゃない。引き際を自分で決められる者は、強い者だけだ。……だが、お前の目はまだ、リングの先を見ている"},
{sp:"genda", t:"決めるのはお前だ。誰の言葉でもない、お前の体と心の声で決めろ"},
{sp:"me", t:"（この章の終わりには、初めて「引退」という選択肢が、自分の前に置かれる。……答えは、その時に出す）"},
{fx:{sei:1}},
{week:true},
],
},
// ===== 38歳 =====
ch3_final_intro: {
title: "集大成への助走",
steps: [
{sp:"narr", t:"38歳。グランド本戦まで、あと一年。九条沙織から、大会の概要と出場枠の確定が伝えられた。"},
{img:"kujo"},
{sp:"kujo", t:"枠は確保したわ。あとは、あなたの体と心の仕上がりだけ。……30代の全てを、この一年に集めてちょうだい"},
{fx:{attention:2}},
{week:true},
],
},
ch3_final_check: {
title: "最終判断 ― 白石遥",
steps: [
{sp:"narr", t:"大会前の最終検査。白石遥は、全てのデータを並べて、長く沈黙した。"},
{img:"shiraishi"},
{sp:"shiraishi", t:"古傷はあります。でも、管理できている。……医師として、言います。あなたは出られます。ただし、約束してください"},
{sp:"shiraishi", t:"限界のサインが出たら、私の声を聞くこと。選手の誇りより、あなたの人生の方が長いんです"},
{choice:[
{label:"約束する", fx:{affection:{shiraishi:8}, sei:1, fatigue:-15}, say:[
{sp:"shiraishi", t:"……はい。その約束があるなら、私は安心して送り出せます。行ってらっしゃい、選手さん"},
]},
{label:"「最後は自分の判断だ」と答える", fx:{affection:{shiraishi:3}}, say:[
{sp:"shiraishi", t:"……でしょうね。では、私はリングサイドで待機します。何があっても、あなたを見ています"},
]},
]},
{week:true},
],
},
ch3_katori_final_talk: {
title: "ライバル師範の激励",
steps: [
{sp:"narr", t:"大会を前に、香取冴子が訪ねてきた。手には、八極拳の古い手拭いがあった。"},
{img:"katori"},
{sp:"katori", t:"これはね、私が若い頃に大きな大会で使った手拭いだ。……あんたに預ける。地域の顔は、今はあんただからね"},
{sp:"katori", t:"負けても潔く、勝っても驕らず。あんたの戦い方、私は好きだよ。……行っておいで"},
{fx:{affection:{katori:8}, sei:2}},
{week:true},
],
},
ch3_final_prep: {
title: "静かな準備",
steps: [
{sp:"narr", t:"大会まで、残りわずか。道場の生徒たちが、静かに送り出してくれた。早乙女楓が、代表して言った。"},
{img:"saotome"},
{sp:"saotome", t:"師匠の全盛期を、私たちは目に焼き付けます。……だから、思い切り戦ってきてください"},
{sp:"me", t:"（19歳で{exam}を受けた日から、20年近く。{style}と共に歩いた30代の答えを、リングに置いてくる）"},
{fx:{sei:1, fatigue:-20}},
{week:true},
],
},
// ===== 39歳：グランド本戦 =====
ch3_finale_qf: {
title: "グランド本戦 準々決勝 グンナル",
steps: [
{sp:"narr", t:"グランド本戦。会場の熱気は、本戦の時を上回っていた。実況は音羽響、レフェリーは三好涼子。準々決勝の相手は、甲冑の重戦車。"},
{img:"gunnar"},
{sp:"gunnar", t:"集大成の舞台で、また会えた。……全力で来い、全盛期の男"},
{battle:"fin3_qf", win:[
{sp:"gunnar", t:"……見事だ。お前の全盛期は、本物だった"},
{fx:{sei:3, attention:3, record:{finWins:1}}},
{jump:"ch3_finale_sf"},
], lose:[
{sp:"narr", t:"準々決勝で敗れた。だが、39歳の挑戦そのものが、会場の記憶に刻まれた。"},
{fx:{sei:2, attention:3}},
{jump:"ch3_finale_end"},
]},
],
},
ch3_finale_sf: {
title: "グランド本戦 準決勝 赤井ケン",
steps: [
{sp:"narr", t:"準決勝の相手は、赤い道着の男だった。赤井ケンは、ウィッグを整えながら笑った。"},
{img:"akai"},
{sp:"akai", t:"準決勝で当たるとはな、看板さん。……俺たちの物語、今日が最高潮だ。全力で、魅せ合おうぜ"},
{battle:"fin3_sf", win:[
{sp:"akai", t:"ははっ、負けた！ だが聞けよ、この歓声。……決勝も、魅せて勝てよ。正統の看板さん"},
{fx:{sei:3, attention:4, record:{finWins:1}}},
{jump:"ch3_finale_final"},
], lose:[
{sp:"narr", t:"赤井の物語が、今日は上回った。だが、準決勝の熱狂は、誰の記憶にも残った。"},
{fx:{sei:2, attention:4}},
{jump:"ch3_finale_end"},
]},
],
},
ch3_finale_final: {
title: "グランド本戦 決勝 香取冴子",
steps: [
{sp:"narr", t:"決勝の相手は、因縁のライバル師範だった。香取冴子が、静かに畳に立つ。"},
{img:"katori"},
{sp:"katori", t:"決勝が、あんたと私だなんてね。……30代の全部を、ここに置いていこうじゃないか"},
{sp:"me", t:"（30代の集大成。体の管理、弟子たち、疑惑、正道。全部を背負って、戦う）"},
{battle:"fin3_final", win:[
{sp:"narr", t:"判定の瞬間、会場が総立ちになった。グランド本戦、優勝。30代の集大成は、頂点で締めくくられた。"},
{sp:"katori", t:"……完敗だ。あんたの全盛期は、間違いなく本物だったよ"},
{fx:{sei:6, attention:5, money:250000, flags:{grandChampion:true}, record:{cups:1, finWins:1}}},
{jump:"ch3_finale_end"},
], lose:[
{sp:"narr", t:"あと一歩、届かなかった。優勝は香取。それでも、決勝のリングに立った30代の全ては、誰にも消せない。"},
{sp:"katori", t:"いい戦いだった。……あんたとの決勝は、私の自慢だよ"},
{fx:{sei:4, attention:4, money:100000}},
{jump:"ch3_finale_end"},
]},
],
},
ch3_finale_end: {
title: "第3章 完 ― 引退か、続行か",
steps: [
{sp:"narr", t:"グランド本戦は終わった。39歳。全盛期と呼ばれた十年が、幕を下ろそうとしている。"},
{sp:"narr", t:"道場に戻ると、生徒たちが待っていた。早乙女楓が言った。「師匠は、これからも戦うんですよね？」"},
{sp:"me", t:"（体はまだ動く。だが、古傷は正直だ。……ここで引退するのも、一つの答えだ。続けるのも、また一つの答えだ）"},
{choice:[
{label:"現役を続ける（第4章・円熟期へ）", say:[
{sp:"narr", t:"「まだ、リングの先を見ていたい」。そう答えると、生徒たちの顔が明るくなった。40代の戦いが、静かに始まろうとしている。"},
{endChapter3:true},
]},
{label:"ここで引退する（早期エンディング）", say:[
{sp:"narr", t:"「……ここまでだ」。静かに告げると、道場はしばらく沈黙し、やがて大きな拍手に包まれた。全盛期の男の引き際を、誰もが目に焼き付けた。"},
{endChapter3retire:true},
]},
]},
],
},
});

// ===== バトル定義（第3章） =====
Object.assign(BATTLES, {
katori_ex: {title:"交流戦 vs 香取道場の若手", enemyName:"香取道場の若手エース", enemyStyleName:"八極拳", img:"katori", hp:110, power:11, mode:"spar", foul:false,
comments:["実況「八極拳の近距離の圧が来ます！」","両道場の生徒が見守っている","「師範同士の代理戦争だ」"]},
gunnar_b: {title:"特別興行 vs グンナル（甲冑）", enemyName:"グンナル・シグルドソン", enemyStyleName:"アーマードバトル（ブフルト）", img:"gunnar", hp:150, power:12, mode:"match", foul:true,
comments:["実況「甲冑の重戦車が進みます！」","「打撃が跳ね返される…」","観客「弱点は持久と視界だ」"]},
akai_battle: {title:"対戦 vs 赤井ケン", enemyName:"赤井 ケン", enemyStyleName:"空手系", img:"akai", hp:120, power:11, mode:"match", foul:true,
comments:["実況「赤い道着のコスプレ格闘家、本気モードです！」","「見た目だけじゃない、実力も本物だ」","コメント欄が赤井の名で沸いている"]},
raijin_show: {title:"エキシビション vs ザ・グレート雷神", enemyName:"ザ・グレート雷神", enemyStyleName:"プロレス", img:"raijin", hp:120, power:10, mode:"match", foul:false,
comments:["実況「48歳のショーマンシップです！」","観客総立ちの入場だった","「魅せる力は衰えていない」"]},
katori_ace: {title:"道場対抗戦 vs 長谷川蓮", enemyName:"長谷川 蓮（香取道場）", enemyStyleName:"八極拳", img:null, hp:135, power:12, mode:"match", foul:true,
comments:["実況「賭けありの代表戦です！」","両道場の生徒たちが固唾を飲む","「移籍の行方は――」"]},
saotome_match: {title:"弟子の試合 早乙女楓（セコンド采配）", enemyName:"アマ大会の対戦相手", enemyStyleName:"他流派", img:"saotome", hp:55, power:5, mode:"spar", foul:false,
comments:["実況「デビュー戦の楓選手、師の采配が光るか」","セコンドの声がリングに響く","「弟子の戦いは、師の戦いでもある」"]},
katori_duel: {title:"師範対決 vs 香取冴子", enemyName:"香取 冴子（香取道場師範）", enemyStyleName:"八極拳", img:"katori", hp:165, power:14, mode:"match", foul:true,
comments:["実況「師範同士の代表戦！ 貼山靠の圧が来ます」","「近距離の壁だ」","生徒たちの声援が割れる"]},
saotome_match2: {title:"弟子の試合 早乙女楓・二度目（セコンド采配）", enemyName:"アマ大会シード選手", enemyStyleName:"他流派", img:"saotome", hp:75, power:7, mode:"spar", foul:false,
comments:["実況「育った弟子の戦いです！」","「去年の楓とは別人だ」","道場の名前が実況で呼ばれる"]},
gunnar_b2: {title:"再戦 vs グンナル（鎧なし）", enemyName:"グンナル・シグルドソン", enemyStyleName:"アーマードバトル（ブフルト）", img:"gunnar", hp:145, power:12, mode:"match", foul:true,
comments:["実況「鎧なしの純粋な技術戦です！」","「素手でも重い」","観客「これが本当の実力勝負」"]},
akai_rematch: {title:"コラボ興行 vs 赤井ケン", enemyName:"赤井 ケン", enemyStyleName:"空手系", img:"akai", hp:150, power:13, mode:"match", foul:true,
comments:["実況「正統とコスプレの物語、第2幕です！」","チケット完売の会場が揺れている","「赤井のマイクが火を付けた一戦」"]},
katori_final: {title:"対抗戦・最終決着 vs 香取冴子", enemyName:"香取 冴子（香取道場師範）", enemyStyleName:"八極拳", img:"katori", hp:185, power:15, mode:"match", foul:true,
comments:["実況「弟子争奪の最終決着です！」","「両師範、全力の読み合い」","会場全体が総立ちになっている"]},
akai_final: {title:"人気対決 vs 赤井ケン", enemyName:"赤井 ケン", enemyStyleName:"空手系", img:"akai", hp:170, power:14, mode:"match", foul:true,
comments:["実況「人気対決の最終章です！」","「赤井の入場で会場が爆発した」","音羽響の実況が熱を帯びる"]},
fin3_qf: {title:"グランド本戦・準々決勝 vs グンナル", enemyName:"グンナル・シグルドソン", enemyStyleName:"アーマードバトル（ブフルト）", img:"gunnar", hp:180, power:14, mode:"match", foul:true,
comments:["実況「グランド本戦、準々決勝です！」","「集大成の舞台が始まった」","会場の熱気が桁違いだ"]},
fin3_sf: {title:"グランド本戦・準決勝 vs 赤井ケン", enemyName:"赤井 ケン", enemyStyleName:"空手系", img:"akai", hp:190, power:15, mode:"match", foul:true,
comments:["実況「準決勝は物語の最高潮です！」","「赤井の本気、初めて見る」","コメント欄が二人の名前で埋まっている"]},
fin3_final: {title:"グランド本戦・決勝 vs 香取冴子", enemyName:"香取 冴子", enemyStyleName:"八極拳", img:"katori", hp:215, power:16, mode:"match", foul:true,
comments:["実況「決勝です！ 30代の全てを懸けた一戦！」","「因縁の師範対決が決勝とは」","音羽響の声が震えている","会場全体が総立ちになっている"]},
});

// ===== SNS議論バトル定義（第3章） =====
Object.assign(DEBATES, {
akai_mic: {title:"マイク合戦 ― 赤井ケン", posts:[
{name:"赤井 ケン", handle:"@akai_ken_cos", text:"全盛期の看板さんよ、リングの強さは認める。でもな、客は物語に金を払うんだ。あんたの正統派、SNSの時代にどこまで届く？"},
{name:"ミラ", handle:"@tier_mira", text:"会見が既にバズってる！ 正統派とコスプレ格闘家、どっちの物語が勝つの〜？"},
], replies:[
{attr:"正論", label:"「物語はリングの結果が作る。まず勝つ。それが答えだ」と返す", score:6,
win:[{sp:"akai", t:"正論だな。……気に入ったぜ、その真っ直ぐさ。リングで確かめよう"}],
lose:[{sp:"narr", t:"尤もだが、会見の熱は赤井のペースに流れた。"}]},
{attr:"経験談", label:"19歳の{exam}から積み上げた年月を語る", score:7,
win:[{sp:"akai", t:"……年月の重さは、コスプレじゃ作れねえもんな。敬意を表するぜ"}],
lose:[{sp:"narr", t:"重さは伝わったが、場の空気は赤井が持っていった。"}]},
{attr:"ユーモア", label:"「ウィッグの下の努力には敵わない」と笑いに変える", score:7,
win:[{sp:"akai", t:"ははっ、やるじゃねえか！ ウィッグネタを返せる正統派、初めてだ"}],
lose:[{sp:"narr", t:"笑いは取れたが、「余裕がない」と叩く声も混じった。"}]},
{attr:"煽り", label:"「コスプレの前に、実力で黙らせてやる」と宣言する", score:6,
win:[{sp:"narr", t:"宣言が拡散し、対戦への期待が跳ね上がった。"}],
lose:[{sp:"narr", t:"「言葉だけは一丁前」と叩かれた。リングで返すしかない。"}]},
], winFx:{attention:3, sei:1}, loseFx:{attention:3}},
dope_ch3_rumor: {title:"強さゆえの疑惑への反論", posts:[
{name:"匿名アカウント", handle:"@anon_shadow2", text:"30代であの回復力、あの動き。裏で『ケア』を受けてる選手がいるって噂、本当なんじゃないの？"},
{name:"格闘技ウォッチャー", handle:"@watch_kakuto", text:"疑惑と潔白は、証明の仕方で決まる。本人の言葉と、検査の記録が聞きたい"},
], replies:[
{attr:"正論", label:"「検査はいつでも、全て公開で受ける」と宣言する", score:7,
win:[{sp:"narr", t:"潔さが空気を変えた。白石遥の検査体制への信頼も後押しになった。"}],
lose:[{sp:"narr", t:"宣言は届いたが、疑う者は疑い続けた。"}]},
{attr:"経験談", label:"白石遥の管理と地道なケアの積み重ねを語る", score:6,
win:[{sp:"shiraishi", t:"彼の体のデータは、私が全て見ています。回復の秘密は、地道さだけです"}],
lose:[{sp:"narr", t:"地道な話は、地味だと言われてしまった。"}]},
{attr:"ユーモア", label:"「秘密は、よく寝てよく食べること」と返す", score:6,
win:[{sp:"narr", t:"生活感のある返しがウケて、疑惑そのものが笑い話に変わった。"}],
lose:[{sp:"narr", t:"「ごまかした」と取る者もいた。"}]},
{attr:"煽り", label:"「疑う前に、まず同じ稽古量をこなしてみろ」と返す", score:5,
win:[{sp:"narr", t:"圧のある一言が、匿名アカウントを沈黙させた。"}],
lose:[{sp:"narr", t:"「図星で怒った」と解釈され、火に油を注いだ。"}]},
], winFx:{attention:3, sei:2}, loseFx:{attention:3, aku:1}},
tier_ch3: {title:"Tier表・全盛期の評価への反論", posts:[
{name:"ミラ", handle:"@tier_mira", text:"全盛期特集！ 30代の看板、衰え知らずでSランクに置いたけど……本当に衰えてないの？ 古傷の噂も聞くけどな〜"},
{name:"ベテランウォッチャー", handle:"@vet_watch", text:"30代の強さは、20代の強さとは別物だ。管理と経験の強さを見せてほしい"},
], replies:[
{attr:"正論", label:"「30代の強さは、体の管理込みの強さだ」と返す", score:7,
win:[{sp:"narr", t:"「管理の強さ」という視点が、同世代の選手たちに広く刺さった。"}],
lose:[{sp:"narr", t:"理屈は通ったが、熱には届かなかった。"}]},
{attr:"経験談", label:"古傷と付き合いながら戦う日々を、正直に語る", score:7,
win:[{sp:"narr", t:"正直な言葉が「全盛期のリアルだ」と大きく引用された。"}],
lose:[{sp:"narr", t:"正直さは伝わったが、論争は静かに流れた。"}]},
{attr:"ユーモア", label:"「衰えた分は、読みで補って余りある」と返す", score:6,
win:[{sp:"narr", t:"含みのある返しが好意的に受け取られた。"}],
lose:[{sp:"narr", t:"「衰えを認めた」と切り取られてしまった。"}]},
{attr:"煽り", label:"「衰えたと思うなら、リングで確かめろ」と返す", score:6,
win:[{sp:"narr", t:"対戦希望の声が上がり、論争はリングへ移った。"}],
lose:[{sp:"narr", t:"煽りが過ぎて、ベテラン層から距離を置かれた。"}]},
], winFx:{attention:3, sei:1}, loseFx:{attention:2, aku:1}},
tier_ch3_b: {title:"純粋か混合か・30代の答え", posts:[
{name:"ミラ", handle:"@tier_mira", text:"30代の答え合わせ！ 一つの流派を極める者と、全てを混ぜる者。全盛期の看板は、どっちの道で頂点に立つの？"},
{name:"古参ファン", handle:"@old_fan", text:"看板の重みは、年月が決める。若い混合家にはない重さだ"},
], replies:[
{attr:"正論", label:"「道は違っても、頂点で証明されるのは積み上げた年月だ」と返す", score:6,
win:[{sp:"narr", t:"両陣営から「分かっている」という声が上がった。"}],
lose:[{sp:"narr", t:"「どっちつかず」と両陣営から叩かれた。"}]},
{attr:"経験談", label:"自分の流儀の歩みと、学んだ他流派の意味を語る", score:7,
win:[{sp:"narr", t:"積み上げた年月の重さが言葉に宿り、ミラ本人が長文で引用した。"}],
lose:[{sp:"narr", t:"経験は届いたが、論争の熱は収まらなかった。"}]},
{attr:"ユーモア", label:"「純粋度は心の在り方、と師匠が言っていた」と返す", score:5,
win:[{sp:"narr", t:"含みのある返しが、各方面に好意的に受け取られた。"}],
lose:[{sp:"narr", t:"含みが深すぎて、伝わりきらなかった。"}]},
{attr:"煽り", label:"「飾りと言うなら、その飾りの重さで沈めてやる」と返す", score:6,
win:[{sp:"narr", t:"一撃の言葉が空気を変えた。"}],
lose:[{sp:"narr", t:"煽りすぎて、純粋派からも距離を置かれた。"}]},
], winFx:{attention:4, sei:1}, loseFx:{attention:3, aku:1}},
});

// ===== 口説き（恋愛）データ（第3章） =====
// 対象は第3章初登場の女性3名：白石遥（清名型）／香取冴子（実力型）／早乙女楓（実力型）。設計書3.2の割当どおり
Object.assign(ROMANCE, {
  shiraishi: {title:"白石 遥", flirt:[
      [{sp:"shiraishi", t:"今日のデータ、良好です。……体の管理が上手な選手は、見ていて安心します"}],
      [{sp:"shiraishi", t:"選手の嘘は、データに出ます。あなたのデータは、いつも正直で……信頼できます"}],
      [{sp:"shiraishi", t:"診察以外で会うのは、少し不思議な感じがします。……悪くない、ですけど"}],
    ], ev1:[
      {sp:"narr", t:"検査の帰り道。白石が珍しく、個人的な話をした。"},
      {sp:"shiraishi", t:"止める判断は、いつも怖いんです。選手の夢と、体と、人生。全部を天秤にかける仕事で……"},
      {sp:"shiraishi", t:"あなたは、私の言葉をちゃんと聞いてくれる。……それが、どれだけ支えになるか"},
    ], ev2:[
      {sp:"narr", t:"休日のクリニック。白石が、選手としての自分ではなく、一人の人間としての自分を見てほしいと、小さく言った。"},
      {sp:"shiraishi", t:"私は、選手を『診る側』でいることに慣れすぎました。……あなたの前では、少しだけ、その立場を忘れたくなる"},
      {sp:"shiraishi", t:"ドーピングに手を出す選手は、体だけじゃなく、信頼も壊します。あなたは違う。……それが、私の確信です"},
    ], confessOk:[
      {sp:"shiraishi", t:"……！ ……はい。私の診断は、いつも正直です。……私も、あなたが好きです"},
      {sp:"narr", t:"白石遥と、気持ちが通じ合った。診る側と診られる側を越えた、静かな始まりだった。"},
    ], confessNg:[
      {sp:"shiraishi", t:"ごめんなさい……医師と選手の線引きが、今の私にはまだ必要で……気持ちは、本当に嬉しいです"},
    ]},
  katori: {title:"香取 冴子", flirt:[
      [{sp:"katori", t:"おや、看板さんじゃないか。……今日は弟子の取り合いじゃない。たまには、ただの世間話もいいだろう？"}],
      [{sp:"katori", t:"あんたの戦い方、嫌いじゃないよ。負けても潔い男は、信用できる"}],
      [{sp:"katori", t:"師範同士ってのは、孤独なもんだ。……あんたと話してると、その孤独が少し薄れるね"}],
    ], ev1:[
      {sp:"narr", t:"対抗戦の打ち上げ。冴子が、師範としての本音を漏らした。"},
      {sp:"katori", t:"道場を守るってのは、強さだけじゃない。金、評判、生徒の人生。……全部背負って、なおリングに立つ。あんたも、同じだろう？"},
      {sp:"katori", t:"認め合える相手ってのは、そういない。あんたは、その一人だよ"},
    ], ev2:[
      {sp:"narr", t:"雨の夜、二人で茶を飲んだ。冴子の声が、いつもより少しだけ柔らかかった。"},
      {sp:"katori", t:"若い頃は、勝つことしか考えてなかった。でも今は……負けても潔く、弟子に誇れる背中を見せることの方が、大事だと思ってる"},
      {sp:"katori", t:"そういう背中を、あんたに見たのさ。……師範同士、認め合うってのは、こういうことだね"},
    ], confessOk:[
      {sp:"katori", t:"……はは、あんたねえ。師範に告白とは、いい度胸だ。……うん。私も、あんたを男として見てたよ"},
      {sp:"narr", t:"香取冴子と、気持ちが通じ合った。ライバル師範同士の、認め合いから生まれた関係だった。"},
    ], confessNg:[
      {sp:"katori", t:"悪いね、今の私は道場のことで頭がいっぱいだ。……あんたのせいじゃないよ"},
    ]},
  saotome: {title:"早乙女 楓", flirt:[
      [{sp:"saotome", t:"師匠、今日の稽古ありがとうございました！ ……あの、稽古以外の時間も、師匠と話せると嬉しくて"}],
      [{sp:"saotome", t:"師匠の背中を見ていると、強くなる理由が増えるんです。……私の、一番の理由は師匠ですけど"}],
      [{sp:"saotome", t:"いつか師匠に挑むのが夢です。……その前に、もっと近くで学びたいです"}],
    ], ev1:[
      {sp:"narr", t:"稽古終わりの道場。楓が、弟子としてではなく、一人の選手として向き合ってきた。"},
      {sp:"saotome", t:"師匠は、私の憧れです。強いだけじゃなくて、生徒一人ひとりをちゃんと見てくれる。……そういう師匠に、私もなりたい"},
      {sp:"saotome", t:"……時々、弟子という立場が、少しだけもどかしいんです。理由は……まだ、言えませんけど"},
    ], ev2:[
      {sp:"narr", t:"大会の帰り道。楓が小さな声で言った。"},
      {sp:"saotome", t:"師匠と弟子の関係は、大事にしたいです。でも、私の気持ちは、それだけじゃ収まらなくて……"},
      {sp:"saotome", t:"目立つ立場同士です。噂になる覚悟も、要るのかもしれません。……それでも、私は逃げたくないです"},
    ], confessOk:[
      {sp:"saotome", t:"……！ はい。……はい！ 私でよければ。師匠の隣に立つ選手に、必ずなります"},
      {sp:"narr", t:"早乙女楓と、気持ちが通じ合った。師弟の絆の先にある、対等な関係への始まりだった。"},
    ], confessNg:[
      {sp:"saotome", t:"ごめんなさい……今の私は、まず選手として師匠に追いつくことに集中したくて……気持ちは、本当に嬉しいです"},
    ]},
});

// ===== 第3章固有の変化プール（ワンパターン対策・第39/40節の第3章本格投入分） =====
// story-ch1.js の共通プール（WEEK_EVENTS_V2 等）は chapters:[1,2] のため第3章では発火しない。
// 第3章は本プールを game.js の pickEndWeekEvent が章専用として抽選する（季節→生徒ドラマ→週替わりの順）。
// 条件フィールドの書式は共通プールと同じ：chapters / minStudents / minFameRank / weight
const CH3_WEEK_EVENTS = [
  {id:"ch3_ev_street_guard", category:"street", weight:2, chapters:[3], steps:[
    {sp:"narr", t:"夜の商店街で、閉店間際の店に酔客が居座って困らせていた。警備の仕事ではないが、佐竹の言葉が頭をよぎった。"},
    {choice:[
      {label:"間に入って穏やかに収める", fx:{sei:2, attention:1}, say:[{sp:"narr", t:"騒ぎは穏やかに収まった。店主の感謝と、見ていた客の目が、道場の評判になった。"}]},
      {label:"警備会社と警察に連絡し、見守る", fx:{sei:1}, say:[{sp:"narr", t:"専門家に任せる判断もまた、実戦の終わらせ方だった。"}]},
    ]},
  ]},
  {id:"ch3_ev_dojo_veteran", category:"dojo", weight:2, chapters:[3], minStudents:2, steps:[
    {sp:"narr", t:"古参の生徒が、後輩の指導を買って出るようになった。道場に「世代」の厚みが生まれている。"},
    {choice:[
      {label:"指導の一部を正式に任せる", fx:{studentTrust:8, stat:{teach:0.4}, sei:1}, say:[{sp:"narr", t:"任せられた生徒の背筋が伸びた。教える側が育つ道場は、強い。"}]},
      {label:"自分が全て見る体制を続ける", fx:{fatigue:5}, say:[{sp:"narr", t:"質は保てたが、自分の時間は削られた。任せる勇気も、師の仕事だった。"}]},
    ]},
  ]},
  {id:"ch3_ev_dojo_rent", category:"dojo", weight:2, chapters:[3], steps:[
    {sp:"narr", t:"大家から、道場物件の契約更新の話が来た。家賃の小幅な値上げが提示されている。"},
    {choice:[
      {label:"値上げを受け入れ、長く借りる契約にする", fx:{money:-30000, sei:1, studentTrust:4}, say:[{sp:"narr", t:"安定した拠点は、生徒の安心にもつながった。"}]},
      {label:"交渉して据え置きを目指す", fx:{attention:1}, say:[{sp:"narr", t:"粘り強い交渉の末、据え置きで決着した。戦いはリングの外にもある。"}]},
    ]},
  ]},
  {id:"ch3_ev_sns_document", category:"sns", weight:2, chapters:[3], minFameRank:2, steps:[
    {sp:"narr", t:"霧島沙耶の紹介で、密着ドキュメンタリー番組の打診が来た。「全盛期の体と生活」を追う企画だという。"},
    {choice:[
      {label:"取材を受ける", fx:{attention:4, fatigue:8, money:30000}, say:[{sp:"narr", t:"体のケアまで含めた密着は、「全盛期のリアル」として好評だった。出演料も入った。"}]},
      {label:"今は大会準備に集中したいと断る", fx:{expMain:4, sei:1}, say:[{sp:"narr", t:"丁重に断った。話題より仕上がり、と決めた週だった。"}]},
    ]},
  ]},
  {id:"ch3_ev_sns_young", category:"sns", weight:2, chapters:[3], steps:[
    {sp:"narr", t:"CLASHで、若手選手が自分を名指しで挑発した。「全盛期はもう終わりだ。世代交代の時間だよ」"},
    {choice:[
      {label:"「リングで待っている」とだけ返す", fx:{attention:3, sei:1}, say:[{sp:"narr", t:"短い返しが、かえって大きく拡散した。静かな圧は、言葉数を選ばない。"}]},
      {label:"若手の戦績を褒めてから、挑戦を受ける", fx:{attention:3, sei:2}, say:[{sp:"narr", t:"格の違いを見せた対応に、「全盛期の貫禄」と称賛が集まった。"}]},
      {label:"煽り返して火に油を注ぐ", fx:{attention:4, aku:2}, say:[{sp:"narr", t:"数字は跳ねたが、穏やかなファン層からは少し距離を置かれた。"}]},
    ]},
  ]},
  {id:"ch3_ev_baito_rookie", category:"baito", weight:2, chapters:[3], steps:[
    {sp:"narr", t:"警備バイトの現場で、佐竹から新人の教育係を頼まれた。現場の世代交代も進んでいる。"},
    {choice:[
      {label:"丁寧に教えて、現場を任せられる人材に育てる", fx:{money:6000, stat:{teach:0.4}, sei:1, record:{works:1}}, say:[{sp:"narr", t:"佐竹が小さく頷いた。「あんたは、どこでも指導者だな」"}]},
      {label:"自分の担当範囲に集中する", fx:{money:9000, fatigue:6, record:{works:1}}, say:[{sp:"narr", t:"黙々とこなして手当を稼いだ。教える時間は、道場のために取っておく週もある。"}]},
    ]},
  ]},
  {id:"ch3_ev_media_book", category:"media", weight:2, chapters:[3], minFameRank:2, steps:[
    {sp:"narr", t:"出版社から、格闘家の体の管理をテーマにした本への寄稿依頼が来た。白石遥との対談形式だという。"},
    {choice:[
      {label:"寄稿を引き受ける", fx:{attention:3, sei:2, money:20000, affection:{shiraishi:3}}, say:[{sp:"narr", t:"正直な体の記録は、同業者の共感を呼んだ。原稿料も入った。"}]},
      {label:"今は選手としての発信に絞ると断る", fx:{expMain:3}, say:[{sp:"narr", t:"静かに断り、稽古に戻った。"}]},
    ]},
  ]},
  {id:"ch3_ev_street_reunion", category:"street", weight:2, chapters:[3], steps:[
    {sp:"narr", t:"街で、第1章の頃に守った人と偶然再会した。あの日の出来事が、地域の語り草になっているという。"},
    {choice:[
      {label:"近況を聞き、道場にも誘う", fx:{sei:2, joinStudent:true}, say:[{sp:"narr", t:"「ずっと気になっていたんです」。新しい入門の縁になった（定員に空きがある場合）。"}]},
      {label:"短く挨拶して別れる", fx:{sei:1}, say:[{sp:"narr", t:"短い再会だったが、守る戦いの意味が、静かに蘇った。"}]},
    ]},
  ]},
];
// ===== 第3章の生徒ドラマ（別枠・3本） =====
const CH3_STUDENT_DRAMA = [
  {id:"ch3_stu_kaede_pressure", weight:2, chapters:[3], minStudents:1, steps:[
    {sp:"narr", t:"早乙女楓が、稽古の後に残って言った。「『師匠の弟子』って目で見られるのが、最近少し重くて……」"},
    {choice:[
      {label:"「看板は背負うものじゃなく、自分の戦いで作るものだ」と伝える", fx:{studentTrust:8, affection:{saotome:4}, sei:1}, say:[{sp:"narr", t:"楓の目に、迷いが晴れた色が差した。弟子の重荷も、師の仕事のうちだった。"}]},
      {label:"あえて厳しく、結果で示せと言う", fx:{studentTrust:-3, aku:1}, say:[{sp:"narr", t:"楓は黙って頷いた。厳しさが正解かは、次の試合が教えてくれる。"}]},
    ]},
  ]},
  {id:"ch3_stu_transfer_rumor", weight:2, chapters:[3], minStudents:3, steps:[
    {sp:"narr", t:"生徒の一人に、他道場から移籍の誘いが来ているという噂が流れた。道場の空気が、少しだけざわつく。"},
    {choice:[
      {label:"本人と正直に話し合う", fx:{studentTrust:9, sei:1}, say:[{sp:"narr", t:"「先生に隠し事はしません。……私は、ここで強くなりたいんです」。正直な話し合いが、道場の結束を固めた。"}]},
      {label:"噂には触れず、普段通りに接する", fx:{studentTrust:2}, say:[{sp:"narr", t:"大人の距離感を保った。去就は本人の自由であり、道場の魅力で応えるのが筋だった。"}]},
    ]},
  ]},
  {id:"ch3_stu_family_dojo", weight:2, chapters:[3], minStudents:2, steps:[
    {sp:"narr", t:"生徒の家族が見学に来た。30代の看板の道場は、家族層の信頼も集め始めている。"},
    {choice:[
      {label:"稽古の様子と安全への取り組みを丁寧に案内する", fx:{sei:2, studentTrust:6, fatigue:4}, say:[{sp:"narr", t:"家族の安心した顔が、生徒の通いやすさを作る。道場の信用は、こうして厚くなる。"}]},
      {label:"生徒に案内を任せ、自分は稽古に集中する", fx:{expMain:3}, say:[{sp:"narr", t:"生徒の説明する姿そのものが、道場の何よりの案内になった。"}]},
    ]},
  ]},
];
// ===== 第3章の季節イベント（4本） =====
const CH3_SEASONAL_EVENTS = [
  {id:"ch3_se_newyear", window:[1,4], chapters:[3], steps:[
    {sp:"narr", t:"正月。全盛期の年の初めは、体の無事と、弟子たちの成長を祈る年になった。"},
    {choice:[
      {label:"生徒たちと稽古始めで汗を流す", fx:{studentTrust:6, sei:1, fatigue:5}, say:[{sp:"narr", t:"年の初めの一汗が、道場の一年のリズムを作った。"}]},
      {label:"白石の助言どおり、体を休める正月に", fx:{fatigue:-20}, say:[{sp:"narr", t:"休むことも、全盛期の技術のうちだった。"}]},
    ]},
  ]},
  {id:"ch3_se_summer", window:[9,12], chapters:[3], steps:[
    {sp:"narr", t:"夏。自分の道場の主催で、生徒たちとの短期合宿が開かれた。教える側として立つ、初めての夏合宿だ。"},
    {choice:[
      {label:"徹底的に指導に回る", fx:{stat:{teach:0.5}, studentTrust:7, sei:1, fatigue:10}, say:[{sp:"narr", t:"教える夏は、若い頃の合宿とは違う手応えを残した。"}]},
      {label:"自分の稽古も並行して追い込む", fx:{expMain:8, fatigue:15, stat:{endure:0.3}}, say:[{sp:"narr", t:"師と選手、二つの顔で過ごした夏だった。"}]},
    ]},
  ]},
  {id:"ch3_se_autumn", window:[13,16], chapters:[3], steps:[
    {sp:"narr", t:"秋祭り。地域の神輿の花形に、道場の面々が指名された。全盛期の看板は、地域の顔でもある。"},
    {choice:[
      {label:"神輿を担いで地域に混ざる", fx:{sei:2, attention:1, fatigue:8}, say:[{sp:"narr", t:"祭りの熱の中で、道場の名前が地域に深く根付いていった。"}]},
      {label:"生徒たちに花形を譲る", fx:{studentTrust:7, sei:1}, say:[{sp:"narr", t:"譲る美学も、師の仕事。若い世代が地域の顔になっていく。"}]},
    ]},
  ]},
  {id:"ch3_se_yearend", window:[17,20], chapters:[3], steps:[
    {sp:"narr", t:"年末。道場の大掃除と稽古納め。30代の一年を、生徒たちと静かに振り返った。"},
    {choice:[
      {label:"生徒たちへ、一年の感謝と来年の抱負を語る", fx:{sei:1, studentTrust:6, fatigue:-10}, say:[{sp:"narr", t:"語る師の背中を、弟子たちが見ていた。"}]},
      {label:"一人で黙々と稽古納めをする", fx:{expMain:6}, say:[{sp:"narr", t:"静かな打ち込みで一年を締めた。"}]},
    ]},
  ]},
];
