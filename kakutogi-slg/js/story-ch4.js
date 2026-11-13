// 第4章（円熟期 40〜49歳）シナリオデータと章ロジック（第86節）
// step の書式は story-ch1.js 〜 story-ch3.js と共通。追加ステップ:
// {warWinM:true} / {warLoseM:true} … 間宮道場との対抗戦（賭け試合）の弟子争奪の結果処理
// {ch4skip:true} … その年の残りを年次スキップ精算して翌年へ進む（代表シーズン方式・第2〜3章と同じ）
// {endChapter4:true} … 第4章の終了画面へ（現役続行）
// {endChapter4retire:true} … 引退を選んだ場合の早期エンディング画面へ（第4章版）
// 円熟期の体の変化（設計書1.5＋第86節の申し送り調整）:
// ・戦闘時の体力上限はピーク比80%（game.js の startBattle で章補正）
// ・ケア・休養の回復量低下、部位ダメージの自然回復が鈍る、試合後の疲労増（いずれも game.js）
// ・代わりに「相手を読む」の効果増、セミナー／指導の収益効率が全章最高（Lv9・Lv10の完全実装と連動）
"use strict";

// ---------- 第4章への遷移 ----------
function startChapter4(){
ensureStateCompat();
S.chapter = 4;
S.chapter4Clear = false;
S.flags.retiredEnding = false;
S.absWeek = 1009; // 40歳・第1週
S.age = 40;
// 章区切りで通常の部位ダメージは回復するが、古傷は残る（第3章と同じ流儀）
const newly = crystallizeOldWounds();
S.dmg = {arm:0, leg:0, core:0, head:0};
applyOldWoundFloor();
if (newly.length) S.flags.ch4IntroOldWound = newly.join("・");
saveGame(false);
startSceneById("ch4_intro");
}
function chapter4EndScreen(){
UI.screen = "end"; S.chapter4Clear = true; S.chapter = 4; hud();
const r = S.record;
const ow = oldWounds(); const owNames = {arm:"腕", leg:"脚", core:"体幹", head:"頭"};
const owList = Object.keys(ow).filter(p => ow[p] > 0).map(p => owNames[p]).join("・");
$("main").innerHTML = '<div class="endcard"><h2>第4章 円熟期 ―完―（現役続行）</h2>' +
'<div class="stext">記録：試合 ' + r.matches + "戦 " + r.wins + "勝（最高" + (r.bestWinStreak || 0) + "連勝）／ 反則 " + r.fouls + "回 ／ 暗器 " + (r.anki || 0) + "回 ／ バイト " + r.works + "回 ／ セミナー " + r.seminars + "回 ／ 論争 " + r.debateWins + "勝 ／ 大会優勝 " + r.cups + "回 ／ 天下一武道会 優勝" + (r.tenkaTitles || 0) + "回・出場" + (r.tenkaIn || 0) + "回</div>" +
'<div class="stext">名声 ' + fameTotal() + "（" + fameRank() + "）／ 清名" + S.sei + "・悪名" + S.aku + " ／ 道場生 " + S.students.length + "人 ／ " + (mainStyle()? mainStyle().name: "") + " Lv" + styleLv(S.mainStyle) + " ／ 純粋度 " + purity() + "%" + (S.partner? " ／ 想い人：" + CAST_BY_ID[S.partner].name: "") + (owList? " ／ 古傷：" + owList: "") + "</div>" +
'<div class="stext">師範期（50〜59歳）。間宮健一との対抗戦は、決着の舞台を50代へ移す。同世代の最後のライバル、源田巌の世代との別れと代替わり、そして新しい弟子の入門が待っている。</div>' +
'<button class="btn next" data-auto="to-title">タイトルへ戻る</button></div>';
saveGame(false);
$("main").querySelector("[data-auto='to-title']").addEventListener("click", renderTitle);
}
function chapter4RetireScreen(){
UI.screen = "end"; S.flags.retiredEnding = true; S.chapter = 4; hud();
const r = S.record;
const color = S.sei > S.aku + 5? "清名に彩られた": S.aku > S.sei + 5? "悪名と共に語られる": "清濁を併せ呑んだ";
$("main").innerHTML = '<div class="endcard"><h2>早期エンディング ― 引退（' + S.age + '歳）</h2>' +
'<div class="stext">' + color + '現役生活に、ここで幕を下ろした。記録：試合 ' + r.matches + "戦 " + r.wins + "勝 ／ 大会優勝 " + r.cups + "回 ／ 天下一武道会 優勝" + (r.tenkaTitles || 0) + "回・出場" + (r.tenkaIn || 0) + "回 ／ 反則 " + r.fouls + "回 ／ 暗器 " + (r.anki || 0) + "回 ／ バイト " + r.works + "回。</div>" +
'<div class="stext">名声 ' + fameTotal() + "（" + fameRank() + "）／ 清名" + S.sei + "・悪名" + S.aku + " ／ 道場生 " + S.students.length + "人 ／ " + (mainStyle()? mainStyle().name: "") + " Lv" + styleLv(S.mainStyle) + " ／ 純粋度 " + purity() + "%" + (S.partner? " ／ 共に歩む人：" + CAST_BY_ID[S.partner].name: "") + "</div>" +
'<div class="stext">円熟の10年は、衰えと深みが同時に進んだ歳月だった。引退は終わりではない。道場は残り、生徒たちはそれぞれの道を歩み続ける。' + (S.partner? CAST_BY_ID[S.partner].name + "と共に過ごす穏やかな日々と、時折顔を出す道場の笑い声。": "時折道場に顔を出し、若い世代の背中を押す日々。") + 'CLASHでは今も、時々あなたの名前が「円熟の師」として語られている。</div>' +
'<button class="btn next" data-auto="to-title">タイトルへ戻る</button></div>';
saveGame(false);
$("main").querySelector("[data-auto='to-title']").addEventListener("click", renderTitle);
}

// ---------- 年次スキップ精算（代表シーズン方式・第2〜3章と同方式。第4章は支出の山を上乗せ） ----------
function __ch4Skip(){
const months = 7;
const ow = oldWounds();
const owCount = Object.keys(ow).filter(p => ow[p] > 0).length;
const tuitionIn = S.students.length * 8000 * months;
const gear = S.students.length * 1500 * months; // 生徒の用具代
const expedition = S.students.length * 1200 * months; // 弟子の遠征・育成費（第4章〜）
const equip = 30000 * months; // 道場の設備投資・維持（第4章〜）
const careCost = (10000 + owCount * 3000) * months; // 医療・ケア費（第4章〜。古傷が多いほど重い）
const onoCost = S.flags.onoPlan? 12000 * months: 0;
const bills = (52000 + 48000) * months + gear + expedition + equip + careCost + onoCost;
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
// 40代の体：重い部位ダメージは古傷として残り、通常のダメージは経過で回復する
const newly = crystallizeOldWounds();
S.dmg = {arm:0, leg:0, core:0, head:0};
applyOldWoundFloor();
if ((S.flags.dopeSuspect || 0) > 0) S.flags.dopeSuspect = Math.max(0, S.flags.dopeSuspect - 1);
S.absWeek += 29; // 残り28週を飛ばし、翌年の第1週に着地する
S.age = 19 + Math.floor((S.absWeek - 1) / 48);
saveGame(false);
const sum = [
{sp:"narr", t:"――季節は巡り、" + S.age + "歳の年が明けた。"},
{sp:"narr", t:"月謝収入 +" + tuitionIn.toLocaleString() + "円 ／ 家賃・道場賃料・生活費・用具代・遠征費・設備・ケア費 -" + bills.toLocaleString() + "円 ／ 差し引き " + (net >= 0? "+": "") + net.toLocaleString() + "円。円熟期の道場は、回すだけで金がかかる。それでも、回り続けている。"},
{sp:"narr", t:"稽古と指導の日々の中で、" + "{style}" + "の理解も静かに深まっていった。"},
{week:true},
];
if (newly.length) sum.splice(2, 0, {sp:"narr", t:"（" + newly.join("・") + "のダメージが、古傷として体に残った。40代の体は、正直だ）"});
for (const n of notes) sum.splice(2, 0, {sp:"narr", t:n});
startScene(sum);
}

// ---------- 間宮道場との対抗戦（弟子争奪）の結果処理 ----------
// 移籍してくる生徒の候補（間宮道場の門下生。一人ひとりに移る理由がある）
const MAMIYA_STUDENTS = [
{id:"mm_kisaragi", name:"如月 颯", style:"選手志望", trust:60, skill:5, note:"間宮道場の若手エース。勝ち方への疑問を抱え、読みの深さに惹かれて移籍を志願した"},
{id:"mm_houjou", name:"北条 凛々", style:"護身志望", trust:64, skill:3, note:"対抗戦で見た『守るための散打ではない戦い』に衝撃を受けて門を叩いた"},
{id:"mm_serikawa", name:"芹川 岳", style:"選手志望", trust:57, skill:5, note:"間宮の元では二番手に甘んじていた。大きな舞台を求めて移ってきた"},
{id:"mm_amamiya", name:"雨宮 梢", style:"健康志望", trust:62, skill:2, note:"長く続けられる稽古の形を求めて、円熟の道場を選んだ"},
{id:"mm_godai", name:"伍代 修", style:"師範志望", trust:65, skill:4, note:"敗れた間宮から『あの男に学べ』と潔く送り出された"},
{id:"mm_tachibana2", name:"立花 澪", style:"選手志望", trust:61, skill:4, note:"CLASHで見た円熟の戦いぶりに惚れ、対抗戦の直後に志願してきた"},
];
function dojoWarResultMamiya(win){
if (win){
const cap = STUDENT_CAP[fameRankIdx()];
let moved = 0;
for (const cand of MAMIYA_STUDENTS){
if (moved >= 2) break;
if (S.students.length >= cap) break;
if (S.students.find(x => x.id === cand.id)) continue;
S.students.push({id:cand.id, name:cand.name, style:cand.style, trust:cand.trust, skill:cand.skill, note:cand.note});
toast("移籍入門：" + cand.name + "（" + cand.note + "）");
moved++;
}
if (moved === 0){ toast("移籍希望者はいたが、定員いっぱいで受け入れられなかった（賞金 +30,000円）"); S.money += 30000;}
else toast("間宮道場から " + moved + "名が移ってきた！");
} else {
// 負け：信頼の低い生徒から流れる。ただし最大3割まで、最低2名は残る（設計書2.5。第2〜3章と同じ流儀）
const maxLose = Math.min(Math.floor(S.students.length * 0.3), Math.max(0, S.students.length - 2));
const leavers = S.students.filter(s => s.trust < 70).sort((a, b) => a.trust - b.trust).slice(0, maxLose);
if (!leavers.length){ toast("誰も道場を去らなかった。信頼が、道場を守った"); return;}
S.students = S.students.filter(s =>!leavers.includes(s));
for (const l of leavers) toast(l.name + " が間宮道場へ移っていった……", true);
toast(leavers.length + "名の生徒を失った", true);
}
saveGame(false);
}

// ---------- 第4章の固定ビート（absWeek） ----------
// 40歳=1009週開始。各年は前半20週を実プレイし、年次スキップ（開始+19週）で残り28週を精算する
const BEATS_CH4 = [
{week:1012, id:"ch4_lihua"}, {week:1015, id:"ch4_mamiya_intro"}, {week:1018, id:"ch4_takamura"},
{week:1021, id:"ch4_akai_dojo"}, {week:1024, id:"ch4_body1"}, {week:1028, id:"ch4_yearskip"},
{week:1057, id:"birthday"}, {week:1060, id:"ch4_zhiqiang"}, {week:1063, id:"ch4_war_m1"}, {week:1066, id:"ch4_meet_sakakibara"},
{week:1069, id:"ch4_meet_kiyose"}, {week:1072, id:"ch4_disciples1"}, {week:1076, id:"ch4_yearskip"},
{week:1105, id:"birthday"}, {week:1108, id:"ch4_war_m2"}, {week:1111, id:"ch4_meet_iwaki"}, {week:1114, id:"ch4_lihua_deep"},
{week:1117, id:"ch4_expedition"}, {week:1124, id:"ch4_yearskip"},
{week:1153, id:"birthday"}, {week:1156, id:"ch4_meet_kazama"}, {week:1159, id:"ch4_war_m3"}, {week:1162, id:"ch4_meet_higa"},
{week:1165, id:"ch4_disciples_match"}, {week:1172, id:"ch4_yearskip"},
{week:1201, id:"birthday"}, {week:1204, id:"ch4_meet_aragaki"}, {week:1207, id:"ch4_war_m4"}, {week:1210, id:"ch4_body2"},
{week:1213, id:"ch4_equip"}, {week:1220, id:"ch4_yearskip"},
{week:1249, id:"birthday"}, {week:1252, id:"ch4_cup45"}, {week:1255, id:"ch4_war_m5"}, {week:1258, id:"ch4_genda_talk2"},
{week:1261, id:"ch4_zhiqiang_deep"}, {week:1268, id:"ch4_yearskip"},
{week:1297, id:"birthday"}, {week:1300, id:"ch4_war_m6"}, {week:1303, id:"ch4_lihua_tea"}, {week:1306, id:"ch4_takamura_grow"},
{week:1309, id:"ch4_media_doc"}, {week:1316, id:"ch4_yearskip"},
{week:1345, id:"birthday"}, {week:1348, id:"ch4_war_m7"}, {week:1351, id:"ch4_akai_army2"}, {week:1354, id:"ch4_body3"},
{week:1357, id:"ch4_saotome_now"}, {week:1364, id:"ch4_yearskip"},
{week:1393, id:"birthday"}, {week:1396, id:"ch4_checkup3"}, {week:1399, id:"ch4_katori_reunion"}, {week:1402, id:"ch4_tier_g"},
{week:1405, id:"ch4_ono_table"}, {week:1412, id:"ch4_yearskip"},
{week:1441, id:"birthday"}, {week:1444, id:"ch4_final_intro"}, {week:1447, id:"ch4_final_check"}, {week:1450, id:"ch4_final_prep"},
{week:1453, id:"ch4_finale_qf"},
];

const STORY_CH4 = {
// ===== 導入：円熟期 =====
ch4_intro: {
title: "第4章 円熟期 ― 40歳",
steps: [
{sp:"narr", t:"40歳になった。全盛期の看板は地域に知れ渡り、道場は回っている。だが今朝の稽古で、初めて実感した。――回復が、遅い。昨日の疲れが、抜けきらない。"},
{sp:"me", t:"（体力の天井は下がり始めている。でも、不思議と相手の動きは前よりよく見える。40代の戦いは、『衰え』と『深み』の同時進行だ）"},
{sp:"narr", t:"そんな折、CLASHに一通の投稿が流れてきた。散打の間宮健一――第3章の終わりに噂だけが届いていた、隣県の大道場の師範。その人の言葉が、画面の中で静かに燃えていた。"},
{img:"mamiya"},
{sp:"mamiya", t:"『全盛期は過ぎた』と、誰が決めた。……看板さん、あんたの40代は、私が試す。対抗戦の申し入れは、正式に送った。逃げるなよ"},
{sp:"narr", t:"さらに、陳式太極拳の老師・王麗華が来日するという報せと、高Lv帯の稽古を求める若い才能たちの噂。円熟期の幕が、静かに上がろうとしていた。"},
{week:true},
],
},
ch4_yearskip: {
title: "季節は巡る",
steps: [
{sp:"narr", t:"大きな節目のない週が続いた。稽古、指導、体のケア、請求書。円熟期の日々もまた、平らな時間の積み重ねでできている。"},
{ch4skip:true},
],
},

// ===== 40歳 =====
ch4_lihua: {
title: "老師の門 ― 王麗華",
steps: [
{sp:"narr", t:"陳式太極拳の老師、王麗華が来日した。58歳。長年その道を率いてきた格のある人物で、門は狭いが中は深いと聞く。高Lv帯の深みを求めて、その門を叩いた。"},
{img:"lihua"},
{fx:{meet:["lihua"]}},
{sp:"lihua", t:"あなたの{style}は、よく鍛えられている。……しかし、力の抜きどころを、まだ知らないようね"},
{sp:"me", t:"（一目で、そこまで見抜くのか）"},
{sp:"lihua", t:"私の門は、清らかな格の者にしか開かない。噂の悪名高い者は、ここで帰ってもらう。……あなたはどうやら、前者のようね。少しだけ、見せてあげる"},
{sp:"narr", t:"老師の手が、ゆっくりと円を描いた。その動きに合わせて体を動かすと、自分の力みがどこにあるのかが、残酷なほどよく分かった。"},
{fx:{stat:{read:0.4}, expMain:6, affection:{lihua:4}}},
{sp:"lihua", t:"高みは、力の先にあるのではない。力の抜けた先にある。……また来なさい。次は、門の内側で"},
{week:true},
],
},
ch4_mamiya_intro: {
title: "主敵の宣戦 ― 間宮健一",
steps: [
{sp:"narr", t:"間宮健一が、弟子数名を連れて道場を訪れた。55歳、散打の師範。隣県で大きな道場を構える、押しも押されもせぬ実力者だった。"},
{img:"mamiya"},
{fx:{meet:["mamiya"]}},
{sp:"mamiya", t:"噂の看板に、挨拶に来た。……40を過ぎて、まだリングに立つ男は嫌いじゃない。だがね、看板さん"},
{sp:"mamiya", t:"道場の格は、師範同士の戦いで決まる。うちとあんたの道場、これから何年かかけて競おう。弟子の奪い合いも含めてな。――これが、宣戦布告だ"},
{sp:"me", t:"（第3章で香取と競った対抗戦が、今度はもっと長く、重い戦いになる。間宮ラインの開幕だ）"},
{sp:"narr", t:"間宮は弟子たちに目配せし、静かに帰っていった。その背中には、10年単位で競う覚悟があった。"},
{fx:{attention:2}},
{week:true},
],
},
ch4_takamura: {
title: "若手の星 ― 高村蒼太",
steps: [
{sp:"narr", t:"交流大会の会場で、ひときわ目を引く若者がいた。高村蒼太、19歳。サバットの使い手で、長い脚から繰り出される蹴りの軌道が、まるで鞭だった。"},
{img:"takamura"},
{fx:{meet:["takamura"]}},
{sp:"takamura", t:"あんたが、あの看板の人か。……早乙女楓さんから、よく話を聞いてる。『師匠の読みは、歳を取るほど深くなる』って"},
{sp:"narr", t:"早乙女楓が隣に来て、少し誇らしげに言った。「蒼太は、私の対になる世代の星です。……師匠、彼に稽古をつけてやってください」"},
{img:"saotome"},
{sp:"saotome", t:"私とは違うタイプの若さです。だからこそ、見てほしいんです"},
{battle:"takamura_spar", win:[
{sp:"takamura", t:"……っ、速さだけじゃ、届かないのか。あんたの『読み』、本物だ"},
{fx:{sei:2, attention:2, affection:{saotome:3}}},
], lose:[
{sp:"takamura", t:"取った……！ 若さは、まだ武器になるんだ"},
{sp:"narr", t:"若い才能の眩しさと、40代の自分の現在地。その両方を、静かに受け止めた。"},
{fx:{attention:2, affection:{saotome:2}}},
]},
{week:true},
],
},
ch4_akai_dojo: {
title: "赤い軍団、出陣 ― 赤井道場開き",
steps: [
{sp:"narr", t:"赤井ケンが、ついに自分の道場を開いた。第3章で宣言したとおり――弟子全員が、同じ赤い道着。その入場は、もはや軍団だった。"},
{img:"akai"},
{sp:"akai", t:"見たか、看板さん！ これが赤い軍団だ！ 弟子は全員、赤。大会では一目でうちと分かる。それが、物語ってもんだろ！"},
{sp:"narr", t:"開き記念のエキシビション。まずは赤い軍団の若手エースとの一戦が組まれた。"},
{battle:"akai_disciple", win:[
{sp:"narr", t:"若手エースを退けた。だが会場の目は、次に立つ男に集まっていた。"},
], lose:[
{sp:"narr", t:"赤い軍団の若手に敗れた。赤井の物語が、また一つ大きくなった。"},
{fx:{attention:2}},
]},
{sp:"akai", t:"さあ、締めは師範同士だ。……魅せ合おうぜ、看板さん"},
{battle:"akai_dojo_b", win:[
{sp:"akai", t:"ははっ、負けた！ だが聞けよこの歓声。赤い軍団の船出に、あんたの胸を借りられた。それで十分だ"},
{fx:{sei:3, attention:4, money:60000}},
], lose:[
{sp:"akai", t:"勝ったぜ、看板さん。……でもな、今日の主役は軍団の船出だ。あんたが来てくれたから、物語になったんだ"},
{fx:{sei:1, attention:4, money:40000}},
]},
{week:true},
],
},
ch4_body1: {
title: "円熟の体（1）― 回復の遅さ",
steps: [
{sp:"narr", t:"赤井道場との連戦の翌日。体が、まるで他人のもののように重かった。白鳥恵のケアを受けながら、白石遥の言葉を思い出す。"},
{img:"shiratori"},
{sp:"shiratori", t:"40代の回復は、30代のようにはいきません。『休む』も稽古のうちだと、本気で思ってください"},
{img:"shiraishi"},
{sp:"shiraishi", t:"データにも出ています。体力の天井は下がり、回復には時間がかかる。でも、読みの精度は今が一番いい。……体の使い方そのものを、変える時期です"},
{choice:[
{label:"回復計画を白石・白鳥と本格的に組む（医療・ケア費が増える）", fx:{money:-30000, stat:{endure:0.3}, affection:{shiraishi:3, shiratori:3}}, say:[{sp:"narr", t:"ケアを『経費』ではなく『投資』として組み込んだ。円熟期の体は、管理で戦う。"}]},
{label:"今までどおりの感覚で押し切る", fx:{fatigue:10}, say:[{sp:"narr", t:"若さの感覚のまま押し切った。体は正直に、悲鳴の準備を始めている。"}]},
]},
{week:true},
],
},

// ===== 41歳 =====
ch4_zhiqiang: {
title: "酔拳の老師 ― 呉志強",
steps: [
{sp:"narr", t:"交流稽古の場で、酒の匂いを漂わせた老師と出会った。呉志強、61歳。酔拳の使い手で、その動きは千鳥足のようでいて、一分の隙もなかった。"},
{img:"zhiqiang"},
{fx:{meet:["zhiqiang"]}},
{sp:"zhiqiang", t:"はっは、若いの。……と言っても、あんたも40か。力を抜く稽古は、してるかね？"},
{sp:"narr", t:"老師の手が、ふらりと伸びてきた。避けたはずの場所に、その手はあった。酔いの動きは、読めないのではない。『読ませない』のだ。"},
{sp:"zhiqiang", t:"失敗の多い男は、深くなる。再起の仕方を体が覚えてるからね。……あんたの失敗談、今度ゆっくり聞かせておくれ"},
{fx:{stat:{read:0.3}}},
{sp:"narr", t:"寛容型の老師は、多少の悪名も『若気の至り』で笑い飛ばすという。後半の人生の深みを担う人との出会いだった。"},
{week:true},
],
},
ch4_war_m1: {
title: "間宮ライン（1）― 交流戦",
steps: [
{sp:"narr", t:"間宮道場との初の交流戦が決まった。賭けなしの顔合わせ。だが、両道場の生徒たちの目は、香取戦の時以上に真剣だった。"},
{img:"mamiya"},
{sp:"mamiya", t:"今日は挨拶だ。だが手加減はいらない。うちの若い衆に、円熟の圧というものを見せてやれ"},
{battle:"mamiya_ex", win:[
{sp:"mamiya", t:"……見事。読みの深さは本物だな。だが次は、賭けありでやる。看板の値打ちは、賭けてこそ決まる"},
{fx:{sei:2, attention:2}},
], lose:[
{sp:"mamiya", t:"ふむ、うちの若い衆も捨てたものではないだろう？ ……あんたの目、悪くなかった。次は本気で競おう"},
{fx:{sei:1}},
]},
{week:true},
],
},
ch4_meet_sakakibara: {
title: "直接対面 ― 榊原剛",
steps: [
{sp:"narr", t:"これまで映像と記事の中でしか会えなかった男が、交流稽古の場にいた。伝統派空手の榊原剛。型の美しさと実戦の圧を併せ持つ、若手実力者の筆頭だった。"},
{img:"sakakibara"},
{fx:{meet:["sakakibara"]}},
{sp:"sakakibara", t:"映像では何度も見た。……実物の圧は、想像以上だ。今日は型の交換を頼みたい"},
{sp:"narr", t:"互いの型を見せ合う、静かな稽古。言葉は少ないのに、得るものは大きかった。40代になって、こういう出会いの値打ちが増している。"},
{fx:{expMain:5, stat:{read:0.2}, sei:1}},
{week:true},
],
},
ch4_meet_kiyose: {
title: "直接対面 ― 清瀬涼介",
steps: [
{sp:"narr", t:"合気道の清瀬涼介と、初めて言葉を交わした。映像特集で見た、あの流れるような崩しが目の前にある。"},
{img:"kiyose"},
{fx:{meet:["kiyose"]}},
{sp:"kiyose", t:"力で押す戦い方しか知らなかった頃、あなたの全盛期の試合を見て、考え方が変わりました。……今日は、崩しの交換稽古を"},
{sp:"narr", t:"力の流し方、受け方。若い世代の実力者との稽古は、自分の{style}の輪郭を逆に照らしてくれた。"},
{fx:{expMain:5, stat:{read:0.2}, attention:1}},
{week:true},
],
},
ch4_disciples1: {
title: "弟子世代の邂逅",
steps: [
{sp:"narr", t:"道場の稽古後、早乙女楓と高村蒼太が残っていた。二人の世代が、静かに火花を散らしている。"},
{img:"saotome"},
{sp:"saotome", t:"蒼太の蹴りは速い。でも、私には師匠の教えがある。……ね、師匠"},
{img:"takamura"},
{sp:"takamura", t:"教えの深さは認める。でも世代交代は、待ってくれないんだ"},
{sp:"me", t:"（弟子世代が競い合う姿を見るのも、40代の役目だ。……二人とも、大きく育て）"},
{fx:{studentTrust:4, affection:{saotome:3}}},
{week:true},
],
},

// ===== 42歳 =====
ch4_war_m2: {
title: "間宮ライン（2）― 賭けあり代表戦",
steps: [
{sp:"narr", t:"間宮からの正式な申し入れが届いた。賭けありの代表戦――負けた側の道場から、門下生が流れる。香取戦と同じ掟が、より大きな規模で回り始める。"},
{img:"mamiya"},
{sp:"mamiya", t:"看板さん、掟は分かっているな。勝てばあんたのもの、負ければ私のもの。……潔くやろう"},
{battle:"mamiya_ace", win:[
{sp:"mamiya", t:"……見事だ。潔く、約束は果たす。気に入った門下がいたら、連れていくがいい"},
{warWinM:true},
{fx:{sei:3, attention:3}},
], lose:[
{sp:"mamiya", t:"約束は約束だ。……行く者は、止めない。それがこの勝負の重さだよ"},
{warLoseM:true},
{fx:{attention:2}},
]},
{week:true},
],
},
ch4_meet_iwaki: {
title: "直接対面 ― 岩城章吾",
steps: [
{sp:"narr", t:"フルコンタクト空手の岩城章吾と、初めてリングの外で言葉を交わした。同世代の実力者同士、言葉より先に通じるものがあった。"},
{img:"iwaki"},
{fx:{meet:["iwaki"]}},
{sp:"iwaki", t:"40代同士の戦いは、若い頃とは違う面白さがある。……あんたとは、いつか本気で決着をつけたい"},
{sp:"narr", t:"軽い組み手の交換でも、その圧は本物だった。円熟同士の極め合いが、いつか来る日の予感を残した。"},
{fx:{expMain:5, attention:1}},
{week:true},
],
},
ch4_lihua_deep: {
title: "老師の内側 ― 高Lv帯の指導",
steps: [
{sp:"narr", t:"王麗華の門の内側に、正式に迎えられた。高Lv帯の指導は、技の形ではなく『力の抜き方』そのものを掘り下げていく。"},
{img:"lihua"},
{sp:"lihua", t:"あなたの{style}は、もう形を教える段階は終わっている。ここからは、捨てる稽古よ。余分な力を、一つずつ"},
{sp:"narr", t:"指導は厳しかった。だが一週間後、看板技の入りが自分でも驚くほど静かになっていた。指導の高みは、遠くから生徒が集まる理由にもなる。"},
{fx:{expMain:12, stat:{read:0.4, teach:0.3}, affection:{lihua:5}}},
{sp:"lihua", t:"（あなたの主・流儀がLv9に届けば、私の知る『高み』の景色も見えてくるでしょう）"},
{week:true},
],
},
ch4_expedition: {
title: "弟子たちの遠征",
steps: [
{sp:"narr", t:"生徒たちが、遠方の大会への遠征を希望した。交通費、宿泊費、帯同の費用――円熟期の道場は、弟子の挑戦にも金がかかる。"},
{choice:[
{label:"遠征費を道場で持つ（支出の山）", fx:{money:-60000, studentTrust:8, sei:1}, say:[{sp:"narr", t:"「師匠が背中を押してくれた」。その一言が、道場の結束を強くした。"}]},
{label:"各自の負担にする", fx:{studentTrust:-4}, say:[{sp:"narr", t:"現実的な判断だった。だが、若い挑戦の芽を摘んだ気が、少しだけ残った。"}]},
{label:"スポンサー探しに動く", fx:{attention:2, money:-20000, studentTrust:4}, say:[{sp:"narr", t:"九条沙織の伝手で一部は賄えた。顔の広さも、師範の資産だった。"}]},
]},
{week:true},
],
},

// ===== 43歳 =====
ch4_meet_kazama: {
title: "直接対面 ― 風間俊樹",
steps: [
{sp:"narr", t:"古流合気体術の風間俊樹と、初めて対面した。厳格な物腰の奥に、若い世代を導く熱があった。"},
{img:"kazama"},
{fx:{meet:["kazama"]}},
{sp:"kazama", t:"古い型は、守るだけでは死ぬ。……あんたの道場の『世代の厚み』、見せてもらった。うちも負けてはいられない"},
{sp:"narr", t:"型の保存と実戦の間で悩む若き指導者との対話は、自分の道場経営の鏡にもなった。"},
{fx:{expMain:4, stat:{teach:0.2}, sei:1}},
{week:true},
],
},
ch4_war_m3: {
title: "間宮ライン（3）― 師範対決の前哨",
steps: [
{sp:"narr", t:"対抗戦の熱は、師範同士の直接対決を求める声に変わってきた。まずは前哨戦――間宮道場のNo.2との一戦が組まれた。"},
{img:"mamiya"},
{sp:"mamiya", t:"私の右腕だ。……あんたの円熟が本物なら、ここは越えてもらおう"},
{battle:"mamiya_elite", win:[
{sp:"mamiya", t:"右腕を退けたか。……いいだろう、次は私が立つ。師範対決は、そう遠くない"},
{fx:{sei:3, attention:3}},
], lose:[
{sp:"mamiya", t:"まだ壁は厚い、ということだ。……焦るな、看板さん。あんたの時間は、まだ先が長い"},
{fx:{attention:2}},
]},
{week:true},
],
},
ch4_meet_higa: {
title: "直接対面 ― 比嘉康雄",
steps: [
{sp:"narr", t:"沖縄伝来の中国武術を伝える比嘉康雄と、初めて稽古を交えた。穏やかな物腰と、触れた瞬間に分かる重さの同居した人だった。"},
{img:"higa"},
{fx:{meet:["higa"]}},
{sp:"higa", t:"力は、溜めるものじゃなく、通すものさ。……あんたの{style}にも、その考えは活きるよ"},
{sp:"narr", t:"南の島の武術の知恵は、自分の型の思い込みを一つ外してくれた。"},
{fx:{expMain:5, stat:{read:0.2}}},
{week:true},
],
},
ch4_disciples_match: {
title: "弟子の試合 ― 世代の火花",
steps: [
{sp:"narr", t:"アマ大会。早乙女楓と高村蒼太が、同じ階級のトーナメントに名を連ねた。セコンドとして、二人の戦いを見届ける。"},
{img:"saotome"},
{sp:"saotome", t:"蒼太には負けません。……師匠、見ていてください"},
{battle:"disciples4", win:[
{sp:"narr", t:"弟子たちは見事に勝ち上がり、決勝は身内の対決になった。どちらの手が上がっても、道場の誇りになる戦いだった。"},
{fx:{sei:2, attention:2, studentTrust:5, affection:{saotome:3}}},
], lose:[
{sp:"narr", t:"弟子の敗戦は、師の敗戦より堪える。だが、若い二人の目に涙はなかった。次を見ていた。"},
{fx:{attention:1, studentTrust:2}},
]},
{week:true},
],
},

// ===== 44歳 =====
ch4_meet_aragaki: {
title: "直接対面 ― 新垣翔太",
steps: [
{sp:"narr", t:"沖縄空手と総合格闘技を股にかける新垣翔太と、初めて対面した。若さと実績を併せ持つ、厄介な世代の代表格だった。"},
{img:"aragaki"},
{fx:{meet:["aragaki"]}},
{sp:"aragaki", t:"伝統と総合、どっちが強いかなんて、もう古い問いだと思うんです。……でも、あんたの戦い方は、その問いに一つの答えを出してる"},
{sp:"narr", t:"軽いスパーリングの交換でも、その身体能力は脅威だった。若い世代の『完成度』は、確実に上がってきている。"},
{fx:{expMain:4, attention:2}},
{week:true},
],
},
ch4_war_m4: {
title: "間宮ライン（4）― 賭けの拡大",
steps: [
{sp:"narr", t:"対抗戦の評判が広がり、九条沙織から興行化の提案が来た。賭けの規模も、観客の熱も、一段大きくなる。"},
{img:"kujo"},
{sp:"kujo", t:"円熟同士の弟子争奪戦――数字が取れるわ。代表戦、もう一幕やりましょう"},
{battle:"mamiya_ace2", win:[
{sp:"mamiya", t:"……二度も退けたか。潔く約束は果たす。だが、師範対決では別だぞ"},
{warWinM:true},
{fx:{sei:3, attention:4, money:50000}},
], lose:[
{sp:"mamiya", t:"興行の熱の中で負けると、響きも大きい。……それでも、逃げなかったことは認めよう"},
{warLoseM:true},
{fx:{attention:3}},
]},
{week:true},
],
},
ch4_body2: {
title: "円熟の体（2）― 古傷の請求書",
steps: [
{sp:"narr", t:"古傷が、静かに主張を強めてきた。白石遥の診察室。データの並ぶモニターの前で、主治医の顔はいつもより厳しかった。"},
{img:"shiraishi"},
{sp:"shiraishi", t:"正直に言います。連戦の代償は、もう若い頃のようには消えません。……でも、やり方次第で、まだ長く戦えます"},
{choice:[
{label:"高額な専門ケアを契約する（医療費の山）", fx:{money:-80000, stat:{endure:0.4}, affection:{shiraishi:4}}, say:[{sp:"narr", t:"専門ケアの契約は重い出費だった。だが、40代の戦いは『管理』がそのまま武器になる。"}]},
{label:"白鳥のケアと自己管理で回す", fx:{affection:{shiratori:3}, fatigue:6}, say:[{sp:"narr", t:"白鳥恵の手を借りながら、自分の体と付き合う道を選んだ。安くはないが、破綻もしない。"}]},
{label:"痛み止めで誤魔化して連戦を続ける", fx:{fatigue:14, aku:1}, say:[{sp:"narr", t:"誤魔化しは効いた。だが、体への借金は利子つきで返ってくる。"}]},
]},
{week:true},
],
},
ch4_equip: {
title: "道場の設備投資",
steps: [
{sp:"narr", t:"道場のマットと器具が、限界を迎えていた。生徒の安全と、道場の格。その両方を天秤にかける、大物の出費の判断が来た。"},
{choice:[
{label:"全面的に更新する（設備投資の山）", fx:{money:-150000, studentTrust:6, sei:2, flags:{ch4Equip:true}}, say:[{sp:"narr", t:"新しいマットの匂いと、生徒たちの目の輝き。『円熟の道場』の看板に、実が伴ってきた。"}]},
{label:"危険な部分だけ部分更新する", fx:{money:-50000, studentTrust:2}, say:[{sp:"narr", t:"堅実な更新だった。派手さはないが、道場は回り続ける。"}]},
{label:"まだ使う。金は他に回す", fx:{studentTrust:-3, fatigue:4}, say:[{sp:"narr", t:"器具の悲鳴を聞き流した。……いつか、安全の問題として返ってくるかもしれない。"}]},
]},
{week:true},
],
},

// ===== 45歳 =====
ch4_cup45: {
title: "円熟の本戦 ― 45歳の挑戦",
steps: [
{sp:"narr", t:"45歳での本戦出場が決まった。CLASHの見出しは『円熟の挑戦』。実況の音羽響が、マイクの前で言った。"},
{img:"otowa"},
{sp:"otowa", t:"皆さん、45歳ですよ、45歳！ 体の天井が下がった男が、読みと経験だけでどこまで行けるのか。……これが、円熟の戦いです！"},
{battle:"cup45_b", win:[
{sp:"narr", t:"接戦を制した。勝ち方そのものが、若い世代への教材になっていた。"},
{fx:{sei:4, attention:4, money:120000, record:{cups:1}}},
], lose:[
{sp:"narr", t:"敗れた。だが、45歳の挑戦そのものが会場の記憶に残った。若い選手たちが、静かに頭を下げていた。"},
{fx:{sei:2, attention:4, money:40000}},
]},
{week:true},
],
},
ch4_war_m5: {
title: "間宮ライン（5）― 弟子争奪の佳境",
steps: [
{sp:"narr", t:"対抗戦の通算成績が、CLASHの特集になった。ミラのTier表は、二つの道場を並べて『円熟の双璧』と書いた。"},
{img:"mira"},
{sp:"mira", t:"師範対決の前に、これが最後の弟子争奪になるでしょうね。……数字の動きが、止まらないんですよ"},
{battle:"mamiya_ace3", win:[
{sp:"mamiya", t:"……弟子の行き先は、もう決着がついたも同然だな。残るは、師範同士の決着だけだ"},
{warWinM:true},
{fx:{sei:3, attention:3}},
], lose:[
{sp:"mamiya", t:"流れは、簡単には変わらない。……だがあんたの目、まだ死んでいないな"},
{warLoseM:true},
{fx:{attention:2}},
]},
{week:true},
],
},
ch4_genda_talk2: {
title: "源田巌との対話 ― 衰えと深み",
steps: [
{sp:"narr", t:"久しぶりに、源田巌のもとを訪ねた。70歳を過ぎた原点の師範は、縁側で静かにお茶を淹れてくれた。"},
{mimg:true},
{sp:"genda", t:"40代か。……体が言うことを聞かなくなる頃だな。だが、武道の本当の面白さは、そこから先にある"},
{sp:"genda", t:"若い頃は『速さ』で勝った。これからは『深さ』で勝つ番だ。……お前の{style}は、まだ深くなる"},
{sp:"me", t:"（師範の言葉は、いつも短い。だが、40代の自分には、その短さの意味が分かるようになっていた）"},
{fx:{expMain:6, stat:{read:0.3}, sei:1}},
{week:true},
],
},
ch4_zhiqiang_deep: {
title: "酔拳の深み ― 呉志強の稽古",
steps: [
{sp:"narr", t:"呉志強の稽古場を訪ねた。老師の酔拳は、今日も読めない。だが、今日は『読ませない理由』を、少しだけ教えてくれた。"},
{img:"zhiqiang"},
{sp:"zhiqiang", t:"型通りに動く者は、型通りに読まれる。……あんたの戦いは、まだ『正直』すぎるねえ"},
{sp:"narr", t:"力の抜き方、呼吸のずらし方。再起の指導に強いという寛容型の深みは、失敗の多い人生の歩き方そのものだった。"},
{fx:{expMain:8, stat:{read:0.4}}},
{sp:"zhiqiang", t:"はっは、いい顔になった。50代のあんたが、楽しみだよ"},
{week:true},
],
},

// ===== 46歳 =====
ch4_war_m6: {
title: "間宮ライン（6）― 師範対決",
steps: [
{sp:"narr", t:"ついに、師範対決の日が来た。間宮健一、本人が畳に立つ。両道場の全生徒が見守る、円熟期最大の一戦。"},
{img:"mamiya"},
{sp:"mamiya", t:"看板さん。弟子の勝負は、あんたに分があった。だが師範同士は、別だ。……私の散打、40代の全部で受けてみろ"},
{battle:"mamiya_duel", win:[
{sp:"mamiya", t:"……完敗だ。円熟の読みとは、こういうことか。だが聞け、看板さん。決着は、まだついていない"},
{sp:"mamiya", t:"50代で、もう一度競おう。その時こそ、本当の決着だ。……長生きしろよ、お互いに"},
{fx:{sei:5, attention:5, money:100000}},
], lose:[
{sp:"mamiya", t:"師範対決は、私のものだ。……だが、あんたの目はまだ先を見ている。50代で、決着をつけ直そう"},
{fx:{sei:2, attention:4, money:50000}},
]},
{sp:"narr", t:"間宮ラインの第1幕は、ここで幕を閉じた。だが二人の競いは、50代の舞台へ持ち越された。"},
{week:true},
],
},
ch4_lihua_tea: {
title: "老師の茶席",
steps: [
{sp:"narr", t:"王麗華に、稽古ではなく茶席へ招かれた。陳式太極拳の老師の淹れる茶は、静かで、深かった。"},
{img:"lihua"},
{sp:"lihua", t:"あなたは、よく戦う人ね。……でも、戦わない時間の過ごし方で、その人の格は決まるのよ"},
{sp:"lihua", t:"私が若い頃、負けてばかりの時期があった。あの時期に覚えた『待つ』ことが、今の私を作っている"},
{sp:"me", t:"（厳格な老師の、柔らかい一面。清らかな格を好む人の、信頼の形だった）"},
{fx:{affection:{lihua:6}, stat:{read:0.2}, sei:1}},
{week:true},
],
},
ch4_takamura_grow: {
title: "高村蒼太の成長",
steps: [
{sp:"narr", t:"交流大会で、高村蒼太が上の世代の選手を破った。19歳で出会った若手の星は、20代半ばの実力者へと育っていた。"},
{img:"takamura"},
{sp:"takamura", t:"あの日の稽古が、ずっと頭に残ってた。速さだけじゃ届かない理由を、体で覚えたくてさ"},
{img:"saotome"},
{sp:"saotome", t:"蒼太も、私も。師匠の背中を追う世代が、ちゃんと育っています"},
{sp:"me", t:"（若手の成長は、嬉しくもあり、自分の歳を教える鏡でもある。その両方を、受け入れるのが円熟だ）"},
{fx:{sei:2, attention:2, affection:{saotome:3}}},
{week:true},
],
},
ch4_media_doc: {
title: "円熟のドキュメンタリー",
steps: [
{sp:"narr", t:"霧島沙耶の紹介で、『円熟の格闘家』を追うドキュメンタリーの撮影が入った。衰えと深みの同時進行を、そのまま撮るという。"},
{img:"kirishima"},
{sp:"kirishima", t:"大げさな演出はしません。回復に時間のかかる朝も、老師に頭を下げる昼も、全部が記事の価値です"},
{choice:[
{label:"全てをさらけ出して撮らせる", fx:{attention:5, sei:2, money:50000}, say:[{sp:"narr", t:"正直な密着は、『40代のリアル』として大きな反響を呼んだ。"}]},
{label:"稽古の場面だけに絞る", fx:{attention:2, money:20000}, say:[{sp:"narr", t:"締めるべきところは締めた。それでも、円熟の空気は十分に伝わった。"}]},
]},
{week:true},
],
},

// ===== 47歳 =====
ch4_war_m7: {
title: "間宮ライン（7）― 決着の持ち越し",
steps: [
{sp:"narr", t:"対抗戦の総括イベント。間宮と並んで、両道場の生徒たちの前で語る場が設けられた。"},
{img:"mamiya"},
{sp:"mamiya", t:"40代の競いは、看板さんに分があったと認めよう。……だが、私はまだ終わらない。50代の舞台で、本当の決着をつける"},
{sp:"me", t:"（長い戦いの第1幕が終わった。この男との競いは、人生の後半戦の芯になっていく）"},
{sp:"narr", t:"生徒たちの拍手の中で、二人の師範は静かに握手を交わした。CLASHでは『円熟の双璧、決着は50代へ』と報じられた。"},
{fx:{sei:3, attention:3}},
{week:true},
],
},
ch4_akai_army2: {
title: "赤い軍団との合同稽古",
steps: [
{sp:"narr", t:"赤井道場との合同稽古。赤い軍団は道場いっぱいに広がり、その熱量は円熟の道場にも新しい風を入れた。"},
{img:"akai"},
{sp:"akai", t:"うちの軍団、あんたの読みを学びたがってる。……締めに一本、魅せてやってくれよ"},
{battle:"akai_army_b", win:[
{sp:"akai", t:"ははっ、やっぱり本物だ。……軍団の連中、目がキラキラしてやがる。いい船出の恩を、また返せたな"},
{fx:{sei:2, attention:3, studentTrust:4}},
], lose:[
{sp:"akai", t:"勝ったぜ。……だがな、今日の主役は稽古だ。軍団とあんたの生徒、どっちも得るものがあったろ？"},
{fx:{attention:3, studentTrust:3}},
]},
{week:true},
],
},
ch4_body3: {
title: "円熟の体（3）― 連戦の代償",
steps: [
{sp:"narr", t:"対抗戦と本戦が重なった月。試合後の疲労が、翌週まで抜けなかった。連戦の代償が、40代では明確に重い。"},
{img:"shiratori"},
{sp:"shiratori", t:"出場間隔の管理も、戦術のうちです。『出られる』と『戦える』は、もう同じじゃありません"},
{choice:[
{label:"出場ペースを落として質を取る", fx:{attention:-1, stat:{read:0.3}, sei:1}, say:[{sp:"narr", t:"数は減った。だが、一戦ごとの重みは増した。円熟の戦い方への、静かな転換だった。"}]},
{label:"頼まれる限り出続ける", fx:{fatigue:16, money:60000, attention:2}, say:[{sp:"narr", t:"興行の期待に応え続けた。金と注目は入ったが、体への請求書も確実に積み上がった。"}]},
]},
{week:true},
],
},
ch4_saotome_now: {
title: "早乙女楓の今",
steps: [
{sp:"narr", t:"早乙女楓が、自分の弟子を連れて道場に顔を出した。第3章で入門した星弟子は、もう教える側の顔を持つようになっていた。"},
{img:"saotome"},
{sp:"saotome", t:"師匠に教わった『読み』は、私の道場でも芯になっています。……世代は、こうやって繋がるんですね"},
{sp:"me", t:"（弟子が弟子を持つ。それを見届けるのも、円熟期の報われ方だ）"},
{fx:{sei:2, affection:{saotome:4}, studentTrust:3}},
{week:true},
],
},

// ===== 48歳 =====
ch4_checkup3: {
title: "48歳の総点検",
steps: [
{sp:"narr", t:"白石遥による、48歳の総合検診。古傷の状態、連戦の蓄積、回復の見通し。データは正直だった。"},
{img:"shiraishi"},
{sp:"shiraishi", t:"結論から言います。管理は、よくできています。この調子なら、50代の舞台にも立てます。……ただし、無茶の利子は確実に増えています"},
{choice:[
{label:"検診結果をCLASHで正直に公開する", fx:{sei:2, attention:3, affection:{shiraishi:3}}, say:[{sp:"narr", t:"『48歳の正直なデータ』は、同世代の格闘家たちに静かに刺さった。"}]},
{label:"結果は胸にしまい、戦いに集中する", fx:{expMain:4}, say:[{sp:"narr", t:"数字は胸にしまった。残りの40代を、悔いなく戦うために。"}]},
]},
{week:true},
],
},
ch4_katori_reunion: {
title: "香取冴子との再会",
steps: [
{sp:"narr", t:"香取冴子が、合同稽古の申し入れに道場を訪れた。第3章で弟子を奪い合ったライバル師範との、穏やかな再会だった。"},
{img:"katori"},
{sp:"katori", t:"間宮との戦い、見てるよ。……あんたも私も、戦い方が変わったね。若い頃の火花も良かったけど、今の深さも悪くない"},
{sp:"narr", t:"軽い組み手の交換は、勝敗のない、円熟同士の対話だった。"},
{fx:{expMain:5, affection:{katori:4}, sei:1}},
{week:true},
],
},
ch4_tier_g: {
title: "Tier表の円熟評価",
steps: [
{sp:"narr", t:"ミラの最強Tier表、円熟期の特別版が公開された。40代の選手だけを集めた異色の回だった。"},
{img:"mira"},
{sp:"mira", t:"若さのTier表は、もう飽きられてるんです。『衰えと深み』の両方を数値化するのが、今回の私の仕事でして"},
{sp:"narr", t:"自分の名前は、表の上位にあった。数字の理由として書かれていたのは――『読みの深さは、年齢とともにまだ伸びている』。"},
{fx:{attention:3, sei:1}},
{week:true},
],
},
ch4_ono_table: {
title: "千鶴の食卓と円熟の金",
steps: [
{sp:"narr", t:"大野千鶴の定食屋。円熟期の道場経営の数字を、女将が静かに聞いてくれた。"},
{img:"ono"},
{sp:"ono", t:"設備だの遠征だの、40代の道場は金がかかるねえ。……でも、あんたの数字には『人への投資』が多い。それは、悪くない使い方だよ"},
{choice:[
{label:"体の管理を優先した食の契約を続ける", fx:{money:-24000, stat:{endure:0.3}, affection:{ono:3}}, say:[{sp:"narr", t:"食への投資は、回復の土台になった。円熟の体は、食で戦う。"}]},
{label:"倹約して現状維持にする", fx:{money:10000}, say:[{sp:"narr", t:"締めるべきところは締めた。道場の懐事情も、円熟の知恵のうちだった。"}]},
]},
{week:true},
],
},

// ===== 49歳・フィナーレ =====
ch4_final_intro: {
title: "円熟期の総決算へ",
steps: [
{sp:"narr", t:"49歳。円熟期の総決算となるグランド本戦の開催が決まった。対戦表には、世代を超えた顔ぶれが並んでいた。"},
{sp:"narr", t:"準々決勝は新垣翔太。勝てば、準決勝で間宮健一。そして決勝の先には、岩城章吾が待つ。40代の全部を問う、3つの壁。"},
{fx:{attention:3}},
{week:true},
],
},
ch4_final_check: {
title: "白石遥の最終判断",
steps: [
{sp:"narr", t:"本戦を前に、白石遥の最終チェックが入った。古傷と連戦の蓄積を前に、主治医の判断は――"},
{img:"shiraishi"},
{sp:"shiraishi", t:"出られます。……ただし、条件つきです。連戦の間、回復の時間を『戦術』として計算してください。あなたの40代は、管理で勝ってきた。その集大成を見せてください"},
{fx:{affection:{shiraishi:3}, stat:{read:0.2}}},
{week:true},
],
},
ch4_final_prep: {
title: "決戦前夜 ― 49歳",
steps: [
{sp:"narr", t:"決戦前夜。道場に、生徒たちと、ゆかりの人々の声が集まった。早乙女楓、高村蒼太、そしてCLASHの向こうの無数の声。"},
{img:"saotome"},
{sp:"saotome", t:"師匠。40代の全部を、私たちは見てきました。……明日は、私たちの世代が、あなたの背中を押します"},
{sp:"me", t:"（全盛期の自分は、一人で強かった。円熟期の自分は、背負うものの多さで戦う。それが、深みということだ）"},
{fx:{sei:1, attention:1}},
{week:true},
],
},
ch4_finale_qf: {
title: "グランド本戦 準々決勝 新垣翔太",
steps: [
{sp:"narr", t:"グランド本戦。実況は音羽響、レフェリーは三好涼子。準々決勝の相手は、沖縄空手と総合を股にかける若き実力者、新垣翔太。"},
{img:"aragaki"},
{sp:"aragaki", t:"世代交代の時間、始めましょう。……あんたの円熟、超えていきます"},
{battle:"fin4_qf", win:[
{sp:"aragaki", t:"……読みの深さが、違う。完敗です。でも、次は必ず"},
{fx:{sei:3, attention:3, record:{finWins:1}}},
{jump:"ch4_finale_sf"},
], lose:[
{sp:"narr", t:"準々決勝で敗れた。だが、49歳の挑戦そのものが、会場の記憶に刻まれた。"},
{fx:{sei:2, attention:3}},
{jump:"ch4_finale_end"},
]},
],
},
ch4_finale_sf: {
title: "グランド本戦 準決勝 間宮健一",
steps: [
{sp:"narr", t:"準決勝の相手は、間宮健一。対抗戦の主敵との、円熟期最後の直接対決だった。"},
{img:"mamiya"},
{sp:"mamiya", t:"看板さん。40代の決着は、ここでつけよう。……ただし、50代の再戦の約束は、まだ生きているからな"},
{battle:"fin4_sf", win:[
{sp:"mamiya", t:"……見事だ、円熟の男。決勝も、その読みで勝ってこい。約束の再戦は、50代でな"},
{fx:{sei:3, attention:4, record:{finWins:1}}},
{jump:"ch4_finale_final"},
], lose:[
{sp:"narr", t:"間宮の散打が、今日は上回った。だが、準決勝の熱狂は誰の記憶にも残った。"},
{fx:{sei:2, attention:4}},
{jump:"ch4_finale_end"},
]},
],
},
ch4_finale_final: {
title: "グランド本戦 決勝 岩城章吾",
steps: [
{sp:"narr", t:"決勝の相手は、岩城章吾。同世代の実力者同士、円熟の極め合いが始まる。"},
{img:"iwaki"},
{sp:"iwaki", t:"40代同士の決勝。これが一番、面白い。……全盛期とは違う勝ち方を、見せ合おうじゃないか"},
{sp:"me", t:"（40代の集大成。衰えた体、深まった読み、背負ってきた人々。全部を置いて、戦う）"},
{battle:"fin4_final", win:[
{sp:"narr", t:"判定の瞬間、会場が総立ちになった。グランド本戦、優勝。円熟期の集大成は、頂点で締めくくられた。"},
{sp:"iwaki", t:"……完敗だ。あんたの円熟は、本物だったよ"},
{fx:{sei:6, attention:5, money:250000, flags:{grandChampion4:true}, record:{cups:1, finWins:1}}},
{jump:"ch4_finale_end"},
], lose:[
{sp:"narr", t:"あと一歩、届かなかった。優勝は岩城。それでも、決勝のリングに立った40代の全ては、誰にも消せない。"},
{sp:"iwaki", t:"いい戦いだった。……あんたとの決勝は、私の自慢だ"},
{fx:{sei:4, attention:4, money:100000}},
{jump:"ch4_finale_end"},
]},
],
},
ch4_finale_end: {
title: "第4章 完 ― 引退か、続行か",
steps: [
{sp:"narr", t:"グランド本戦は終わった。49歳。円熟期と呼ばれた十年が、幕を下ろそうとしている。"},
{sp:"narr", t:"道場に戻ると、生徒たちが待っていた。高村蒼太が言った。「先生は、50代も戦うんですよね？」"},
{sp:"me", t:"（体は正直に衰えた。だが、読みと深みはまだ伸びている。……ここで引退するのも、一つの答えだ。続けるのも、また一つの答えだ）"},
{choice:[
{label:"現役を続ける（第5章・師範期へ）", say:[
{sp:"narr", t:"「まだ、リングの先を見ていたい」。そう答えると、生徒たちの顔が明るくなった。50代の戦いが、静かに始まろうとしている。"},
{endChapter4:true},
]},
{label:"ここで引退する（早期エンディング）", say:[
{sp:"narr", t:"「……ここまでだ」。静かに告げると、道場はしばらく沈黙し、やがて大きな拍手に包まれた。円熟の男の引き際を、誰もが目に焼き付けた。"},
{endChapter4retire:true},
]},
]},
],
},
};

// ===== 第4章の週替わりイベント（共通プール） =====
const CH4_WEEK_EVENTS = [
  {id:"ch4_ev_street_mentor", category:"street", weight:2, chapters:[4], steps:[
    {sp:"narr", t:"夜の帰り道、若い選手が絡まれている場面に出くわした。間に入ると、相手は自分の顔を見て静かに引いていった。"},
    {choice:[
      {label:"若い選手に声をかけ、連絡先を渡す", fx:{sei:2, attention:1}, say:[{sp:"narr", t:"「円熟の看板」に守られた夜は、地域の小さな語り草になった。"}]},
      {label:"静かにその場を収めて立ち去る", fx:{sei:1}, say:[{sp:"narr", t:"名乗らずに去った。だが、見ていた人々の目が、道場の評判を運んでくれる。"}]},
    ]},
  ]},
  {id:"ch4_ev_dojo_oldfan", category:"dojo", weight:2, chapters:[4], minStudents:2, steps:[
    {sp:"narr", t:"第1章の頃からの古いファンが、孫を連れて道場見学に来た。世代を超えて続く縁に、胸が熱くなった。"},
    {choice:[
      {label:"孫の体験入門を受け入れる", fx:{sei:2, joinStudent:true}, say:[{sp:"narr", t:"三代にわたる縁が、道場に新しい芽を運んできた（定員に空きがある場合）。"}]},
      {label:"昔話に花を咲かせる", fx:{studentTrust:4, sei:1}, say:[{sp:"narr", t:"語り継がれる道場であることの重みを、改めて感じた。"}]},
    ]},
  ]},
  {id:"ch4_ev_sns_rumor", category:"sns", weight:2, chapters:[4], steps:[
    {sp:"narr", t:"CLASHで『円熟の看板は、もう試合に出るな』という投稿が小さく燃えた。引退勧告のような言葉が並ぶ。"},
    {choice:[
      {label:"「リングで答える」とだけ返す", fx:{attention:3, sei:1}, say:[{sp:"narr", t:"短い返しが大きく拡散した。静かな圧は、歳とともに増している。"}]},
      {label:"若い世代へのエールとして受け止める", fx:{attention:2, sei:2}, say:[{sp:"narr", t:"大人の対応に「円熟とはこういうことか」と称賛が集まった。"}]},
      {label:"煽り返して火に油を注ぐ", fx:{attention:4, aku:2}, say:[{sp:"narr", t:"数字は跳ねたが、穏やかなファン層からは少し距離を置かれた。"}]},
    ]},
  ]},
  {id:"ch4_ev_media_textbook", category:"media", weight:2, chapters:[4], minFameRank:2, steps:[
    {sp:"narr", t:"出版社から、『40代からの体の使い方』という教則本への監修依頼が来た。円熟の知恵を、本にする仕事だった。"},
    {choice:[
      {label:"監修を引き受ける", fx:{attention:3, sei:2, money:40000}, say:[{sp:"narr", t:"正直な体の記録は、同世代の読者に深く刺さった。監修料も入った。"}]},
      {label:"今は戦いに集中すると断る", fx:{expMain:4}, say:[{sp:"narr", t:"静かに断り、稽古に戻った。"}]},
    ]},
  ]},
  {id:"ch4_ev_baito_coach", category:"baito", weight:2, chapters:[4], steps:[
    {sp:"narr", t:"警備バイトの現場で、若い警備員たちから体の使い方の相談を受けた。現場でも『先生』と呼ばれる歳になった。"},
    {choice:[
      {label:"休憩時間に簡単な護身の型を教える", fx:{money:6000, stat:{teach:0.3}, sei:1, record:{works:1}}, say:[{sp:"narr", t:"佐竹が笑った。「あんたは、どこへ行っても指導者だな」"}]},
      {label:"警備の仕事に集中する", fx:{money:11000, record:{works:1}}, say:[{sp:"narr", t:"黙々とこなして手当を稼いだ。教える時間は、道場のために取っておく週もある。"}]},
    ]},
  ]},
  {id:"ch4_ev_dojo_leak", category:"dojo", weight:2, chapters:[4], steps:[
    {sp:"narr", t:"生徒の一人が、古傷の状態をうっかりCLASHに投稿してしまった。弱点の漏洩は、円熟期の戦いでは命取りになりかねない。"},
    {choice:[
      {label:"生徒を静かに諭し、情報管理の稽古とする", fx:{studentTrust:5, stat:{read:0.2}}, say:[{sp:"narr", t:"失敗を、道場全体の学びに変えた。情報もまた、戦いの一部だった。"}]},
      {label:"厳しく叱って再発防止を徹底する", fx:{studentTrust:-3, aku:1}, say:[{sp:"narr", t:"空気は張り詰めた。……信頼の回復は、時間が教えてくれる。"}]},
    ]},
  ]},
  {id:"ch4_ev_seminar_far", category:"media", weight:2, chapters:[4], minFameRank:3, steps:[
    {sp:"narr", t:"遠方の町から、高額セミナーの招聘が来た。『あの先生に習いたい』という声が、年齢とともに遠くへ届くようになっていた。"},
    {choice:[
      {label:"招聘を受けて遠征セミナーを行う", fx:{money:90000, fatigue:10, sei:2, attention:2, record:{seminars:1}}, say:[{sp:"narr", t:"満員の会場と、遠方からの生徒の熱。指導の高みは、確かに実を結んでいた。"}]},
      {label:"体の負担を考えて断る", fx:{sei:1}, say:[{sp:"narr", t:"丁重に断った。円熟期は、引き受ける仕事の選び方も戦術だった。"}]},
    ]},
  ]},
  {id:"ch4_ev_old_rival_news", category:"sns", weight:2, chapters:[4], steps:[
    {sp:"narr", t:"CLASHに、同世代ライバルの引退の報せが流れた。共に歳を取ってきた戦友が、また一人、リングを降りた。"},
    {choice:[
      {label:"労いの言葉を送る", fx:{sei:2, attention:1}, say:[{sp:"narr", t:"『お互い、よく戦った』。短いやり取りに、多くのファンが静かに反応した。"}]},
      {label:"静かに報せを見送る", fx:{expMain:3}, say:[{sp:"narr", t:"戦友の分まで、もう少し戦う。その決意を、稽古に変えた。"}]},
    ]},
  ]},
];
// ===== 第4章の生徒ドラマ（別枠） =====
const CH4_STUDENT_DRAMA = [
  {id:"ch4_stu_successor", weight:2, chapters:[4], minStudents:2, steps:[
    {sp:"narr", t:"古参の生徒が言った。「先生の後を継ぐのは、誰なんですか」。道場の未来を問う声が、円熟期には自然と生まれてくる。"},
    {choice:[
      {label:"「継ぐ者を育てるのが、これからの仕事だ」と答える", fx:{studentTrust:7, sei:1}, say:[{sp:"narr", t:"生徒たちの目に、目標の光が宿った。道場の世代交代は、静かに始まっている。"}]},
      {label:"「まだ先の話だ」と笑って流す", fx:{studentTrust:2}, say:[{sp:"narr", t:"笑って流したが、その問いは自分の胸にも残った。"}]},
    ]},
  ]},
  {id:"ch4_stu_injury_care", weight:2, chapters:[4], minStudents:1, steps:[
    {sp:"narr", t:"生徒の一人が怪我をした。自分の古傷の経験が、そのまま若い世代への助言になった。"},
    {choice:[
      {label:"ケアの専門家につなぎ、復帰まで伴走する", fx:{studentTrust:8, money:-15000, sei:1}, say:[{sp:"narr", t:"「先生がいてくれてよかった」。円熟の師の値打ちは、こういう場面に出る。"}]},
      {label:"「怪我も稽古のうちだ」と突き放す", fx:{studentTrust:-4, aku:1}, say:[{sp:"narr", t:"若い頃の自分の言葉を、そのまま返してしまった。……少し、後悔が残った。"}]},
    ]},
  ]},
  {id:"ch4_stu_wedding", weight:2, chapters:[4], minStudents:1, steps:[
    {sp:"narr", t:"古参の生徒から、結婚の報告が届いた。道場で育った縁が、人生の節目に立ち会わせてくれる歳になった。"},
    {choice:[
      {label:"祝いの言葉と、ささやかな品を贈る", fx:{studentTrust:5, money:-10000, sei:1}, say:[{sp:"narr", t:"道場は、戦う場所である前に、人の集まる場所だった。"}]},
    ]},
  ]},
  {id:"ch4_stu_takamura_rumor", weight:2, chapters:[4], minStudents:1, steps:[
    {sp:"narr", t:"CLASHで『高村蒼太は、円熟の看板の後継者か』という投稿が話題になった。世代交代の物語が、外でも語られ始めている。"},
    {choice:[
      {label:"「後継ではなく、同じ時代の戦友だ」と返す", fx:{attention:2, sei:2}, say:[{sp:"narr", t:"若い世代への敬意ある言葉に、両方のファンから支持が集まった。"}]},
      {label:"成り行きに任せる", fx:{attention:1}, say:[{sp:"narr", t:"物語は、外の世界でも勝手に育っていく。それも名声の形だった。"}]},
    ]},
  ]},
];
// ===== 第4章の季節イベント（別枠） =====
const CH4_SEASONAL_EVENTS = [
  {id:"ch4_sea_summer_camp", category:"seasonal", weight:2, chapters:[4], window:[25,32], steps:[
    {sp:"narr", t:"夏。道場の合宿が組まれた。若い世代の体力に付き合いきるのは難しくなったが、指導の密度は今が一番高い。"},
    {choice:[
      {label:"指導に徹し、若手の底上げに集中する", fx:{studentTrust:6, stat:{teach:0.4}, fatigue:6}, say:[{sp:"narr", t:"合宿の終わり、生徒たちの目の色が変わっていた。円熟の夏だった。"}]},
      {label:"若手と一緒に体を動かしきる", fx:{fatigue:16, studentTrust:4, stat:{endure:0.2}}, say:[{sp:"narr", t:"無理はしたが、生徒たちとの距離は縮まった。回復には、たっぷり時間がかかった。"}]},
    ]},
  ]},
  {id:"ch4_sea_winter_joint", category:"seasonal", weight:2, chapters:[4], window:[41,48], steps:[
    {sp:"narr", t:"年末。近隣の道場との合同稽古と忘年会。間宮道場の面々も顔を見せ、ライバル同士の穏やかな年の瀬になった。"},
    {choice:[
      {label:"間宮と静かに杯を交わす", fx:{sei:2, attention:1}, say:[{sp:"narr", t:"「50代の決着、楽しみにしている」。言葉少なな約束が、年の瀬に交わされた。"}]},
      {label:"生徒たちと一年を振り返る", fx:{studentTrust:5}, say:[{sp:"narr", t:"笑い声の絶えない、道場らしい忘年会になった。"}]},
    ]},
  ]},
  {id:"ch4_sea_spring_rookie", category:"seasonal", weight:2, chapters:[4], window:[9,16], steps:[
    {sp:"narr", t:"春。新年度の体験入門が増える季節。今年は『先生の円熟した指導を受けたい』という、遠方からの申し込みが目立った。"},
    {choice:[
      {label:"遠方の体験者も丁寧に受け入れる", fx:{sei:2, joinStudent:true}, say:[{sp:"narr", t:"新しい縁が、道場に春を運んできた（定員に空きがある場合）。"}]},
      {label:"既存の生徒の指導を優先する", fx:{studentTrust:4}, say:[{sp:"narr", t:"今いる生徒を大切にする姿勢が、道場の空気を作っていた。"}]},
    ]},
  ]},
  {id:"ch4_sea_autumn_memorial", category:"seasonal", weight:2, chapters:[4], window:[33,40], steps:[
    {sp:"narr", t:"秋。格闘技界の功労者を顕彰する式典に、招待が届いた。自分の名前が『功労』の側で呼ばれる歳になっていた。"},
    {choice:[
      {label:"式典に出席し、若い世代へ言葉を残す", fx:{sei:3, attention:2}, say:[{sp:"narr", t:"短いスピーチは、若い選手たちに静かに刺さったという。"}]},
      {label:"稽古を優先して欠席する", fx:{expMain:4}, say:[{sp:"narr", t:"顕彰より稽古を選んだ。それもまた、現役の答えだった。"}]},
    ]},
  ]},
];

// ===== バトル定義（第4章） =====
Object.assign(BATTLES, {
takamura_spar: {title:"特別稽古 vs 高村蒼太", enemyName:"高村 蒼太", enemyStyleName:"サバット", img:"takamura", hp:120, power:12, mode:"spar", foul:false,
comments:["実況「若手の星の蹴りが唸ります！」","「円熟の読みが、速さをどう捌くか」","早乙女楓が見守っている"]},
akai_disciple: {title:"赤い軍団 若手エース戦", enemyName:"赤い軍団の若手エース", enemyStyleName:"空手系", img:"akai", hp:115, power:11, mode:"match", foul:true,
comments:["実況「赤い道着の軍団、そのエースです！」","「軍団の声援がすごい」","観客「看板は軍団を止められるか」"]},
akai_dojo_b: {title:"道場開き記念戦 vs 赤井ケン", enemyName:"赤井 ケン", enemyStyleName:"空手系", img:"akai", hp:140, power:12, mode:"match", foul:true,
comments:["実況「赤い道場の船出です！」","「コスプレ格闘家、本気モード」","コメント欄が赤で埋まっている"]},
akai_army_b: {title:"合同稽古 締めの一本 vs 赤井ケン", enemyName:"赤井 ケン", enemyStyleName:"空手系", img:"akai", hp:135, power:12, mode:"spar", foul:false,
comments:["実況「軍団と円熟の交流です」","「両道場の生徒が見守る一本」","観客「魅せる戦いだ」"]},
mamiya_ex: {title:"交流戦 vs 間宮道場の若手", enemyName:"間宮道場の若手エース", enemyStyleName:"散打（さんだ）", img:"mamiya", hp:125, power:12, mode:"spar", foul:false,
comments:["実況「散打の速い出入りです！」","両道場の生徒が見守っている","「師範同士の代理戦争だ」"]},
mamiya_ace: {title:"道場対抗戦 vs 如月颯（間宮道場）", enemyName:"如月 颯（間宮道場）", enemyStyleName:"散打（さんだ）", img:null, hp:145, power:13, mode:"match", foul:true,
comments:["実況「賭けありの代表戦です！」","両道場の生徒たちが固唾を飲む","「移籍の行方は――」"]},
mamiya_ace2: {title:"道場対抗戦・興行版 vs 間宮道場の代表", enemyName:"間宮道場の代表選手", enemyStyleName:"散打（さんだ）", img:null, hp:150, power:13, mode:"match", foul:true,
comments:["実況「興行化された弟子争奪戦です！」","観客の熱が一段上がっている","「円熟の双璧、その代理戦争」"]},
mamiya_ace3: {title:"道場対抗戦・佳境 vs 芹川岳（間宮道場）", enemyName:"芹川 岳（間宮道場）", enemyStyleName:"散打（さんだ）", img:null, hp:155, power:14, mode:"match", foul:true,
comments:["実況「弟子争奪の佳境です！」","「二番手の意地が燃える」","両師範が見守っている"]},
mamiya_elite: {title:"前哨戦 vs 間宮道場No.2", enemyName:"間宮道場のNo.2", enemyStyleName:"散打（さんだ）", img:null, hp:155, power:13, mode:"match", foul:true,
comments:["実況「師範の右腕が立ちます！」","「越えれば師範対決が見える」","観客「円熟の読みが試される」"]},
mamiya_duel: {title:"師範対決 vs 間宮健一", enemyName:"間宮 健一", enemyStyleName:"散打（さんだ）", img:"mamiya", hp:170, power:14, mode:"match", foul:true,
comments:["実況「師範対決――円熟期最大の一戦です！」","両道場の全生徒が見守る","「55歳の散打、衰え知らずの圧」"]},
fin4_sf: {title:"グランド本戦 準決勝 vs 間宮健一", enemyName:"間宮 健一", enemyStyleName:"散打（さんだ）", img:"mamiya", hp:180, power:15, mode:"match", foul:true,
comments:["実況「40代の決着戦です！」","「対抗戦の主敵との最後の直接対決」","観客総立ちの入場だった"]},
cup45_b: {title:"円熟の本戦 vs 若手の実力者", enemyName:"若手の実力者", enemyStyleName:"総合格闘技", img:null, hp:150, power:13, mode:"match", foul:true,
comments:["実況「45歳の挑戦です！」","「読みと経験でどこまで行けるか」","若い世代が固唾を飲んで見ている"]},
disciples4: {title:"弟子の試合（セコンド采配）", enemyName:"アマ大会の対戦相手", enemyStyleName:"他流派", img:"saotome", hp:60, power:6, mode:"spar", foul:false,
comments:["実況「弟子世代の火花です」","セコンドの声がリングに響く","「弟子の戦いは、師の戦いでもある」"]},
fin4_qf: {title:"グランド本戦 準々決勝 vs 新垣翔太", enemyName:"新垣 翔太", enemyStyleName:"沖縄空手", img:"aragaki", hp:150, power:13, mode:"match", foul:true,
comments:["実況「世代交代か、円熟の意地か！」","「若さの完成度が襲う」","観客「49歳の読みが試される」"]},
fin4_final: {title:"グランド本戦 決勝 vs 岩城章吾", enemyName:"岩城 章吾", enemyStyleName:"フルコンタクト空手", img:"iwaki", hp:185, power:15, mode:"match", foul:true,
comments:["実況「円熟同士の頂上決戦です！」","「全盛期とは違う勝ち方が問われる」","会場の熱気が最高潮に達する"]},
});

// ===== 口説き固有イベント（第4章追加分：王麗華） =====
Object.assign(ROMANCE, {
  lihua: {title:"王 麗華", flirt:[
      [{sp:"lihua", t:"あなたの稽古は、静かになったわね。……力の抜けた音が、するようになった"}],
      [{sp:"lihua", t:"茶の稽古は、武術の稽古よ。心が騒ぐと、湯の温度に出る。……今日のあなたは、静かね"}],
      [{sp:"lihua", t:"若い者には分からない景色が、40代にはあるの。……あなたは、その景色を見始めた人の目をしている"}],
      [{sp:"narr", t:"麗華に、黒釉の茶碗を贈った。茶の稽古を武術と説く老師に、ふさわしい器だと思って。"},
       {sp:"lihua", t:"……良い器を見る目があるのね。茶は器で味が変わるの。……今度、あなたのために点ててあげる"}],
    ], ev1:[
      {ep:"lihua-ev1"},
      {sp:"narr", t:"稽古の後、老師に茶室へ招かれた。陳の茶の香りが、静かに満ちていく。"},
      {sp:"lihua", t:"私の門は狭いけれど、一度内側に入れた人は、家族のように思うの。……あなたは、もう内側の人よ"},
      {sp:"lihua", t:"格の清らかな人は、茶の味まで清らかいの。不思議ね"},
    ], dateIntro:[
      {sp:"narr", t:"思い切って、麗華を休日の外出に誘った。老師としてではない彼女と会うのは、初めてだった。"},
      {sp:"lihua", t:"あら、あなたから誘ってくれるなんて。……ふふ、歳を重ねた者同士、静かな時間を楽しみましょう"},
    ], dateSpots:[
      {label:"庭園の茶室で茶", good:true, say:[
        {sp:"lihua", t:"静かな庭と、温かい茶。……40代のあなたには、こういう時間の贅沢が分かるのね"},
        {sp:"narr", t:"茶の香りと庭の静けさの中で、二人の時間は太極の型のようにゆっくりと流れていく。"},
      ]},
      {label:"賑やかなショッピング街", good:false, say:[
        {sp:"lihua", t:"……活気は嫌いじゃないけれど、私たちには少し騒がしいわね。……あなたの気遣いは、ちゃんと届いているわ"},
        {sp:"narr", t:"帰りは静かな裏通りを選んだ。麗華が小さく「ありがとう」と言った。"},
      ]},
    ], dateSeason:{
      spring:{label:"桜の庭園を訪ねる", good:true, say:[
        {sp:"lihua", t:"桜の命は短いからこそ、美しいの。……あなたとの時間も、一期一会ね"},
      ]},
      summer:{label:"蓮の池の茶屋", good:true, say:[
        {sp:"lihua", t:"蓮の花は、静けさの中で咲くの。……今日のあなたも、静かで良い顔をしているわ"},
      ]},
      autumn:{label:"紅葉の寺の庭", good:true, say:[
        {sp:"lihua", t:"紅葉の庭は、円熟の色ね。……歳を重ねることは、悪くないでしょう？"},
      ]},
      winter:{label:"雪の茶室で温まる", good:true, say:[
        {sp:"lihua", t:"雪の日の茶は、心まで温かいの。……隣にあなたがいるからかしら"},
      ]},
    }, dateOutro:[
      {sp:"lihua", t:"今日の時間、私の心にも静かに残りました。……『待っている』という言葉、今度は私があなたに贈りましょう"},
      {sp:"narr", t:"帰り道、麗華の歩みは太極の型のように、静かで穏やかだった。"},
    ], ev2:[
      {ep:"lihua-ev2"},
      {sp:"narr", t:"雨の日の稽古場。老師が、若い頃の話をぽつりと話し始めた。"},
      {sp:"lihua", t:"私にも、負けてばかりで、誰にも認められなかった歳月があった。あの頃の私を支えたのは、一人の人の『待っている』という言葉よ"},
      {sp:"lihua", t:"……あなたの戦う姿を見ていると、思い出すの。だから、つい目をかけてしまう。歳を重ねた者同士の、情けなさね"},
    ], confessOk:[
      {sp:"lihua", t:"……ふふ。58の私に、その言葉を。……あなたの格は、本当に清らかね。嘘のない目をしている"},
      {sp:"narr", t:"王麗華と、気持ちが通じ合った。師弟の門を越えた、静かで深い始まりだった。"},
    ], confessNg:[
      {sp:"lihua", t:"……ごめんなさいね。今のあなたには、まだ騒ぐものが残っている。格が澄んだら、また来なさい"},
    ]},
});

// ===== 既存システムの第4章対応（カメオ・あるあるは第3章分までを第4章でも発火可能にする） =====
// ※読み込み順の都合（story-ch4.js は story-cameos.js より先に実行され CAMEO_EVENTS が未定義）で、
//   chapters への push は game.js 側（全ファイル読み込み後）で実施する。
