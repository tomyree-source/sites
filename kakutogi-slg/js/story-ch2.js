// 第2章（全盛前夜 23〜29歳）シナリオデータと章ロジック
// step の書式は story-ch1.js と共通。追加ステップ:
// {warWin:true} / {warLose:true} … 道場対抗戦（賭け試合）の弟子争奪の結果処理
// {ch2skip:true} … その年の残りを年次スキップ精算して翌年へ進む
// {endChapter2:true} … 第2章の終了画面へ
"use strict";

// ---------- 第2章への遷移 ----------
function startChapter2(){
S.chapter = 2;
S.chapter2Clear = false;
S.absWeek = 193; // 23歳・第1週
S.age = 23;
S.dmg = {arm:0, leg:0, core:0, head:0}; // 章区切りで通常の部位ダメージは回復（設計書4.5）
saveGame(false);
startSceneById("ch2_intro");
}
function chapter2EndScreen(){
UI.screen = "end"; S.chapter2Clear = true; S.chapter = 2; hud();
const r = S.record;
$("main").innerHTML = '<div class="endcard"><h2>第2章 全盛前夜 ―完―</h2>' +
'<div class="stext">記録：試合 ' + r.matches + "戦 " + r.wins + "勝 ／ 反則 " + r.fouls + "回 ／ 暗器 " + (r.anki || 0) + "回 ／ バイト " + r.works + "回 ／ セミナー " + r.seminars + "回 ／ 論争 " + r.debateWins + "勝 ／ 大会優勝 " + r.cups + "回 ／ 天下一武道会 優勝" + (r.tenkaTitles || 0) + "回・出場" + (r.tenkaIn || 0) + "回</div>" +
'<div class="stext">名声 ' + fameTotal() + "（" + fameRank() + "）／ 清名" + S.sei + "・悪名" + S.aku + " ／ 道場生 " + S.students.length + "人 ／ " + (mainStyle()? mainStyle().name: "") + " Lv" + styleLv(S.mainStyle) + " ／ 純粋度 " + purity() + "%" + (S.partner? " ／ 想い人：" + CAST_BY_ID[S.partner].name: "") + "</div>" +
'<div class="stext">全盛期（30〜39歳）。体のピークと古傷の始まり、ドーピングの誘惑、弟子世代の入門、そして章末から「引退」も選べるようになる。このセーブデータは第3章へ引き継げます（次回制作）。</div>' +
'<button class="btn next" data-auto="to-title">タイトルへ戻る</button></div>';
saveGame(false);
$("main").querySelector("[data-auto='to-title']").addEventListener("click", renderTitle);
}

// ---------- 年次スキップ精算（代表シーズン方式） ----------
// その年の残り28週（7か月分）を、月謝・請求書・賃料・用具代まで一括精算して翌年へ進む
function __ch2Skip(){
const months = 7;
const tuitionIn = S.students.length * 8000 * months;
const gear = S.students.length * 1500 * months;
const onoCost = S.flags.onoPlan? 12000 * months: 0;
const bills = (52000 + 48000) * months + gear + onoCost;
const net = tuitionIn - bills;
S.money += net;
// 経過期間の小さな変化
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
S.absWeek += 29; // 残り28週を飛ばし、翌年の第1週に着地する
S.age = 19 + Math.floor((S.absWeek - 1) / 48);
saveGame(false);
const sum = [
{sp:"narr", t:"――季節は巡り、" + S.age + "歳の年が明けた。"},
{sp:"narr", t:"月謝収入 +" + tuitionIn.toLocaleString() + "円 ／ 家賃・道場賃料・生活費・用具代 -" + bills.toLocaleString() + "円 ／ 差し引き " + (net >= 0? "+": "") + net.toLocaleString() + "円。道場は回っている。だが、余裕はない。"},
{sp:"narr", t:"稽古と指導の日々の中で、" + "{style}" + "の理解も静かに深まっていった。"},
{week:true},
];
for (const n of notes) sum.splice(2, 0, {sp:"narr", t:n});
startScene(sum);
}

// ---------- 道場対抗戦（弟子争奪）の結果処理 ----------
// 移籍してくる生徒の候補（黒潮道場の門下生）
const RIVAL_STUDENTS = [
{id:"rv_kawai", name:"河合 駿", style:"選手志望", trust:60, skill:4, note:"黒潮道場の若手。師匠と衝突して燻っていた"},
{id:"rv_fujii", name:"藤井 拓海", style:"選手志望", trust:58, skill:3, note:"強くなりたい一心で移籍を決めた"},
{id:"rv_morishita", name:"森下 葵", style:"護身志望", trust:62, skill:2, note:"守られた恩を返したいと志願してきた"},
{id:"rv_takagi", name:"高木 颯太", style:"選手志望", trust:55, skill:4, note:"賭け試合の戦いぶりに惚れて入門"},
{id:"rv_nishimura", name:"西村 凛", style:"選手志望", trust:64, skill:5, note:"黒潮道場の元・看板生徒。指導方針の違いで離れた"},
{id:"rv_ando", name:"安藤 光", style:"健康志望", trust:57, skill:2, note:"雰囲気の良さに惹かれて移ってきた"},
];
function dojoWarResult(win){
if (win){
const cap = STUDENT_CAP[fameRankIdx()];
let moved = 0;
for (const cand of RIVAL_STUDENTS){
if (moved >= 2) break;
if (S.students.length >= cap) break;
if (S.students.find(x => x.id === cand.id)) continue;
S.students.push({id:cand.id, name:cand.name, style:cand.style, trust:cand.trust, skill:cand.skill, note:cand.note});
toast("移籍入門：" + cand.name + "（" + cand.note + "）");
moved++;
}
if (moved === 0) toast("移籍希望者はいたが、定員いっぱいで受け入れられなかった（賞金 +30,000円）");
if (moved === 0) S.money += 30000;
else toast("黒潮道場から " + moved + "名が移ってきた！");
} else {
// 負け：信頼の低い生徒から流れる。ただし最大3割まで、最低2名は残る（設計書2.5）
const maxLose = Math.min(Math.floor(S.students.length * 0.3), Math.max(0, S.students.length - 2));
const leavers = S.students.filter(s => s.trust < 70).sort((a, b) => a.trust - b.trust).slice(0, maxLose);
if (!leavers.length){ toast("誰も道場を去らなかった。信頼が、道場を守った"); return;}
S.students = S.students.filter(s =>!leavers.includes(s));
for (const l of leavers) toast(l.name + " が黒潮道場へ移っていった……", true);
toast(leavers.length + "名の生徒を失った", true);
}
saveGame(false);
}

// ---------- 第2章の固定ビート（absWeek） ----------
const BEATS_CH2 = [
{week:196, id:"ch2_ono"}, {week:199, id:"ch2_yan"}, {week:202, id:"ch2_ryuno"}, {week:205, id:"ch2_chen"},
{week:208, id:"ch2_tier_a"}, {week:212, id:"ch2_yearskip"},
{week:241, id:"birthday"}, {week:244, id:"ch2_todo"}, {week:247, id:"ch2_kurozaki"}, {week:250, id:"ch2_jinguji"},
{week:253, id:"ch2_elena"}, {week:255, id:"ch2_douhan"}, {week:257, id:"ch2_war1"}, {week:260, id:"ch2_yearskip"},
{week:289, id:"birthday"}, {week:292, id:"ch2_miura"}, {week:295, id:"ch2_aisha"}, {week:299, id:"ch2_mariana"},
{week:303, id:"ch2_tier_b"}, {week:308, id:"ch2_yearskip"},
{week:337, id:"birthday"}, {week:340, id:"ch2_anna"}, {week:343, id:"ch2_kirishima"}, {week:347, id:"ch2_onizuka"},
{week:352, id:"ch2_war2"}, {week:356, id:"ch2_yearskip"},
{week:385, id:"birthday"}, {week:388, id:"ch2_dope"}, {week:392, id:"ch2_raio"}, {week:396, id:"ch2_infowar"},
{week:404, id:"ch2_yearskip"},
{week:433, id:"birthday"}, {week:437, id:"ch2_war3"}, {week:442, id:"ch2_tier_c"}, {week:447, id:"ch2_honsen_intro"},
{week:452, id:"ch2_yearskip"},
{week:481, id:"birthday"}, {week:485, id:"ch2_honsen_qf"}, // 本戦は準々決勝シーンから決勝→第2章完までジャンプ連鎖で進む
];

const STORY_CH2 = {
// ===== 導入：独立 =====
ch2_intro: {
title: "第2章 全盛前夜 ― 独立",
steps: [
{sp:"narr", t:"22歳の終わり。地域予選の熱が冷めやらぬ頃、源田師範に呼ばれた。"},
{mimg:true},
{sp:"genda", t:"ハヤト。お前ももう、人の道場に間借りする身分じゃない。……自分の看板を、上げる時だ"},
{sp:"genda", t:"看板は責任だ。家賃、光熱費、生徒の用具、大会の参加費。強いだけでは、道場は一日も回らん"},
{sp:"me", t:"（分かっている。第1章の終わり、懐には余裕があった。だが、それは「まだ看板を持っていなかったから」の余裕だ）"},
{choice:[
{label:"貯金をはたいて、専用の道場を借りる", say:[
{sp:"narr", t:"不動産屋の契約書に判を押した。礼金・保証金・初月の賃料で、貯金が大きく目減りする。だが、畳の匂いのするこの空間は、間違いなく「自分の城」だった。"},
{fx:{money:-150000, flags:{dojoOwn:true}},},
]},
{label:"身の丈に合った小さな物件から始める", say:[
{sp:"narr", t:"駅から少し離れた、小さな物件に決めた。出費は抑えたが、それでも看板を上げる重みは同じだった。"},
{fx:{money:-110000, flags:{dojoOwn:true}},},
]},
]},
{sp:"narr", t:"道場賃料（月48,000円）と生徒の用具代（月1,500円／人）が、月末の請求書に加わるようになった。収入と支出の綱引きが、本当の戦いになる。"},
{sp:"narr", t:"23歳。看板を上げた男の、全盛前夜が始まる。"},
{week:true},
],
},
// ===== 23歳 =====
ch2_ono: {
title: "定食屋「千鶴」",
steps: [
{sp:"narr", t:"道場の近くに、小さな定食屋ができた。店主は大野千鶴。管理栄養士の資格を持つ女将で、開店祝いに訪れた選手たちの体つきを、一目で見抜いた。"},
{img:"ono"},
{fx:{meet:["ono"]},},
{sp:"ono", t:"あんた、顔色が悪いよ。勝ちたきゃ、まず食いな。筋肉は畳の上じゃなく、台所で作られるんだから"},
{sp:"ono", t:"うちはね、選手の月契約やってるの。安くはないけど、体の回復が段違いになるよ。……どうする？"},
{choice:[
{label:"月契約する（月12,000円・回復が良くなる）", fx:{flags:{onoPlan:true}, affection:{ono:8}}, say:[
{sp:"ono", t:"毎度あり。あんたの体は、私が台所から支えてあげる。……あと、残しちゃ駄目だよ"},
{sp:"narr", t:"その日から、稽古終わりの定食が何よりの楽しみになった。"},
]},
{label:"今は金が惜しい。単品で通う", fx:{affection:{ono:4}}, say:[
{sp:"ono", t:"まあ、無理はしなさんな。……あんたみたいな子には、味噌汁くらいおまけしちゃうけどね"},
]},
]},
{week:true},
],
},
ch2_yan: {
title: "SNS映えの少林拳",
steps: [
{sp:"narr", t:"交流稽古会。跳躍と回転の連続技で会場のスマホを一斉に向けさせたのは、北少林拳の劉燕だった。"},
{img:"yan"},
{fx:{meet:["yan"]},},
{sp:"yan", t:"見た見た？ 私の技、今日のCLASHで一番バズってるの。……ねえ、あんたの{style}って、地味じゃない？"},
{sp:"me", t:"地味かどうかは、リングで決めるものだ"},
{sp:"yan", t:"ふふ、いい目するじゃない。……その目、嫌いじゃないわ。今度、私の動画にゲストで出て。数字、跳ねるわよ"},
{fx:{attention:2, affection:{yan:5}},},
{sp:"narr", t:"劉燕との縁は、にわかファン層の扉を開いた。派手さは、名声のもう一つの形だった。"},
{week:true},
],
},
ch2_ryuno: {
title: "蹴りの名手、来日",
steps: [
{sp:"narr", t:"ムエタイの龍野舞が、九条の招聘で来日した。合同セミナーの講師として、彼女の肘と膝の講義は満員だった。"},
{img:"ryuno"},
{fx:{meet:["ryuno"]},},
{sp:"ryuno", t:"あんたが噂の「{nickname}」？ ……蹴り、見せて。私のと、どっちが本物か確かめたい"},
{battle:"ryuno_spar", win:[
{sp:"ryuno", t:"……やるね。距離の作り方が、私と全然違う。面白い。日本にいる間、また付き合って"},
{fx:{sei:2, affection:{ryuno:8}},},
], lose:[
{sp:"ryuno", t:"蹴りの世界は、まだまだ深いよ。……でも、あんたの目、諦めてなかった。それは認める"},
{fx:{sei:1, affection:{ryuno:5}},},
]},
{week:true},
],
},
ch2_chen: {
title: "詠春拳の門",
steps: [
{sp:"narr", t:"至近距離の手技で知られる詠春拳。その師父・陳美玲の道場は、街の外れに静かにあった。"},
{img:"chen"},
{fx:{meet:["chen"]},},
{sp:"chen", t:"私の門は、誰にでも開いてはいません。……ですが、あなたの戦いは見せてもらいました。汚れのない戦い方でした"},
{sp:"chen", t:"詠春を学びたいなら、個人指導の門は開けましょう。ただし、悪名の匂いがする者は、その場で門を閉じます。それが私の流儀です"},
{sp:"narr", t:"陳美玲の個人指導は「他流派を学ぶ」から受けられる。悪名が高いと門前払いされる。"},
{fx:{sei:1},},
{week:true},
],
},
ch2_tier_a: {
title: "Tier表、定期更新",
steps: [
{sp:"narr", t:"ミラの最強Tier表が、月例の定期コンテンツとして定着し始めた。今月の更新は、道場を持ったばかりの自分にも火の粉を落としてきた。"},
{debate:"tier_ch2_a"},
{week:true},
],
},
ch2_yearskip: {
title: "季節は巡る",
steps: [
{sp:"narr", t:"大きな節目のない週が続いた。稽古、指導、請求書、また稽古。武道の人生は、こういう平らな時間の積み重ねでできている。"},
{ch2skip:true},
],
},
// ===== 24歳 =====
ch2_todo: {
title: "寛容な師範",
steps: [
{sp:"narr", t:"老舗の空手道場「藤堂道場」との交流稽古。師範の藤堂静は、稽古の前にまず茶を出す人だった。"},
{img:"todo"},
{fx:{meet:["todo"]},},
{sp:"todo", t:"若い頃はね、私も随分と無茶をしたものよ。失敗の数は、勲章みたいなもの。……あんたの目、いい失敗をしてきた目だね"},
{sp:"todo", t:"よかったら、一本だけ組み手を。私の道場の若い子たちにも、いい刺激になる"},
{choice:[
{label:"組み手を受ける", say:[
{battle:"todo_ex", win:[
{sp:"todo", t:"ふふ、容赦ないねえ。……強い子は好きよ。困ったことがあったら、いつでも茶を飲みにいらっしゃい"},
{fx:{sei:2, affection:{todo:8}},},
], lose:[
{sp:"todo", t:"年の功、ってやつよ。でも、あんたの攻め、嫌いじゃなかった。……茶、もう一杯どうぞ"},
{fx:{sei:1, affection:{todo:6}},},
]},
]},
{label:"茶と話だけで失礼する", fx:{affection:{todo:5}}, say:[
{sp:"todo", t:"あら、堅実だね。……まあ、戦うだけが武道じゃないものね"},
]},
]},
{sp:"narr", t:"藤堂静は空手系の個人指導を担う。多少の悪名は笑って許す人だ。"},
{week:true},
],
},
ch2_kurozaki: {
title: "裏の指導者、本格登場",
steps: [
{sp:"narr", t:"第1章では噂とカメオだけだった女が、深夜の道場に姿を現した。黒崎ラン。正規の指導者たちが口を閉ざす「裏」の技術を教える女。"},
{img:"kurozaki"},
{fx:{meet:["kurozaki"]},},
{sp:"kurozaki", t:"看板を上げたんだってね。……お行儀のいい道場主さん。ねえ、正道だけじゃ届かない場所があるって、もう気づいてるんじゃない？"},
{sp:"kurozaki", t:"私の門はね、清いだけの人には開かないの。泥を被る覚悟のある人だけ、来なさい"},
{sp:"narr", t:"黒崎ランの個人指導は、悪名が一定以上あると開く（「他流派を学ぶ」の特殊・話題枠など）。正統派とは逆の門だ。"},
{week:true},
],
},
ch2_jinguji: {
title: "舞うカポエイラ",
steps: [
{sp:"narr", t:"配信大会のエキシビション。音楽と共に現れた神宮寺澪のカポエイラは、戦いというより舞踏だった。観客の視線を全て持っていく。"},
{img:"jinguji"},
{fx:{meet:["jinguji"]},},
{sp:"jinguji", t:"ねえ、次はあんたと私で「魅せる試合」をしない？ 勝ち負けより、観た人の心に残るやつ。SNS、絶対に燃えるよ"},
{battle:"jinguji_match", win:[
{sp:"jinguji", t:"あはっ、負けたのに楽しい！ あんたの戦い、堅いのに「絵」があるね。……また誘うから、断らないでね"},
{fx:{sei:1, attention:3, affection:{jinguji:8}},},
], lose:[
{sp:"jinguji", t:"私の勝ち。でも、あんたを追うカメラの数は私より多かったよ。……悔しいけど、本当"},
{fx:{attention:3, affection:{jinguji:5}},},
]},
{week:true},
],
},
ch2_elena: {
title: "組みの強豪",
steps: [
{sp:"narr", t:"レスリングのエレナ・コワルスキが、合同練習に姿を見せた。言葉は少ない。だが、組み合った瞬間に分かる者がいる。"},
{img:"elena"},
{fx:{meet:["elena"]},},
{sp:"elena", t:"……噂は聞いた。組んで、確かめる"},
{battle:"elena_spar", win:[
{sp:"elena", t:"……強い。私の組みを、最後まで崩しきった。認める。あんたは本物だ"},
{fx:{sei:2, affection:{elena:8}},},
], lose:[
{sp:"elena", t:"まだ、組の圧が足りない。……だが、目は悪くない。また来い。鍛えてやる"},
{fx:{sei:1, affection:{elena:5}},},
]},
{week:true},
],
},
ch2_war1: {
title: "道場対抗戦 ― 黒潮道場の挑戦",
steps: [
{sp:"narr", t:"隣町に「黒潮道場」という新興の道場ができた。師範の黒潮鉄心は元・重量級の選手で、拡大路線を取る野心家だった。ある日、挑戦状が届いた。"},
{sp:"narr", t:"「代表戦をやろう。ただし、ただの試合じゃつまらない。――賭けよう。勝った方が、負けた方の生徒を貰う」"},
{sp:"me", t:"（生徒を賭けるなんて、正道のやり方じゃない。だが、断れば「逃げた」とCLASHで燃える。……そして、勝てば黒潮の門下生がこちらに来る）"},
{fx:{money:-20000},},
{sp:"narr", t:"遠征費と会場費で20,000円が飛んだ。看板同士の戦いに、無料のものはない。"},
{choice:[
{label:"賭けを受ける（勝てば相手の生徒を獲得、負ければ生徒が流れる）", say:[
{sp:"narr", t:"代表戦。相手のエースは、番長格の室井豪。"},
{battle:"war1_ace", win:[
{warWin:true},
{sp:"narr", t:"黒潮鉄心は、潔く頭を下げた。「約束は約束だ。……行きたがっている連中は、止めない」"},
{fx:{sei:3, attention:2, record:{finWins:1}},},
], lose:[
{warLose:true},
{sp:"narr", t:"黒潮鉄心は勝ち誇らなかった。ただ静かに言った。「生徒は、強い看板に集まるものだ」"},
{fx:{attention:1},},
]},
]},
{label:"賭けは断り、交流戦にする", say:[
{sp:"narr", t:"賭けなしの交流戦。室井との一戦は、看板を賭けない分、純粋な読み合いになった。"},
{battle:"war1_ace", win:[
{sp:"narr", t:"勝った。黒潮鉄心は「次は賭けでやろう」と笑った。火種は、残った。"},
{fx:{sei:2},},
], lose:[
{sp:"narr", t:"負けた。だが、生徒は誰も失わなかった。守りの選択にも、意味はある。"},
{fx:{sei:1},},
]},
]},
]},
{week:true},
],
},
};

Object.assign(STORY_CH2, {
// ===== 25歳 =====
ch2_miura: {
title: "護身セミナーの相方",
steps: [
{sp:"narr", t:"合気道の三浦梓が主催する護身セミナーに、講師の相方として招かれた。参加者は満員。その多くが、夜道の不安を抱えた女性たちだった。"},
{img:"miura"},
{fx:{meet:["miura"]},},
{sp:"miura", t:"力でねじ伏せるのではなく、力の流れを変える。それが護身の心です。……ハヤトさん、今日は本当にありがとうございました"},
{sp:"miura", t:"あなたの道場と、私のセミナー。目指す場所は、きっと同じです"},
{fx:{sei:2, money:30000, affection:{miura:6}},},
{sp:"narr", t:"セミナー後、参加者の数名が「もっと習いたい」と声をかけてきた。"},
{fx:{joinStudent:true},},
{week:true},
],
},
ch2_aisha: {
title: "静かな手技",
steps: [
{sp:"narr", t:"シラットのアイシャ・ラーマンが、礼を尽くして道場を訪れた。至近距離の手技は、静かで、速く、美しかった。"},
{img:"aisha"},
{fx:{meet:["aisha"]},},
{sp:"aisha", t:"私の国では、戦う前にまず挨拶を交わします。相手への敬意が、技の精度を上げるのです"},
{sp:"aisha", t:"あなたの戦いには、その敬意があります。……だから、今日は会いに来ました"},
{fx:{sei:2, affection:{aisha:6}},},
{sp:"narr", t:"遠い国の流儀と、静かな交流が生まれた。距離の概念が、また一つ広がった。"},
{week:true},
],
},
ch2_mariana: {
title: "寝技の壁",
steps: [
{sp:"narr", t:"ブラジリアン柔術のマリアナ・ドス・サントス。寝技の世界では「壁」と呼ばれる選手が、交流戦の相手として名乗りを上げた。"},
{img:"mariana"},
{fx:{meet:["mariana"]},},
{sp:"mariana", t:"立ってる時のあんたは見たことある。でも、寝たらどうかな？ 私の世界へ、ようこそ！"},
{battle:"mariana_spar", win:[
{sp:"mariana", t:"ハハッ、やられた！ 寝技であたしを極めきるなんて、そうはいないよ。……あんたの道場、寝技の時間に混ぜて。あたしも学びたい"},
{fx:{sei:2, affection:{mariana:8}},},
{choice:[
{label:"道場に迎える（寝技の指導者兼・門下生として）", fx:{addStudent:{id:"mariana", name:"マリアナ・ドス・サントス", style:"ブラジリアン柔術", trust:75, skill:6}, affection:{mariana:5}}, say:[
{sp:"mariana", t:"決まり！ 教える代わりに、あんたの{style}も教えてよね。……家族みたいな道場って、悪くない"},
]},
{label:"今は互いに独立した関係で", say:[
{sp:"mariana", t:"まあ、それもいいさ。また寝技で語り合おう"},
]},
]},
], lose:[
{sp:"mariana", t:"寝たら、あたしの勝ち。……でも、簡単に諦めない目をしてた。そういう男、嫌いじゃないよ"},
{fx:{sei:1, affection:{mariana:5}},},
]},
{week:true},
],
},
ch2_tier_b: {
title: "寝技最強論争",
steps: [
{sp:"narr", t:"マリアナとの交流戦の映像が拡散し、ミラのTier表が「寝技最強論争」特集を組んだ。論争の中心には、また自分の名前があった。"},
{debate:"tier_ch2_b"},
{week:true},
],
},
// ===== 26歳 =====
ch2_anna: {
title: "サンボの実力主義者",
steps: [
{sp:"narr", t:"スポーツサンボのアンナ・ヴォルコワが開く公開セミナー。投げと関節の連携の講義は、一切の無駄がなかった。"},
{img:"anna"},
{fx:{meet:["anna"]},},
{sp:"anna", t:"私の指導を受けたい者は多い。だが、私は評判では人を選ばない。戦績と、今の腕。それだけだ"},
{sp:"anna", t:"……あんたの戦績は、悪くない。個人指導の門は、開けておく"},
{sp:"narr", t:"アンナ・ヴォルコワの個人指導は「他流派を学ぶ」のサンボから受けられる。条件は評判ではなく、勝ち星と腕前だ。"},
{week:true},
],
},
ch2_kirishima: {
title: "ジャーナリストの目",
steps: [
{sp:"narr", t:"スポーツジャーナリストの霧島沙耶が、道場の密着取材に現れた。鋭い質問の裏に、選手への敬意がある人だった。"},
{img:"kirishima"},
{fx:{meet:["kirishima"]},},
{sp:"kirishima", t:"記事は、選手の人生を変えます。持ち上げることも、潰すこともね。……だから私は、書く前に必ず自分の目で見るんです"},
{sp:"kirishima", t:"あなたの道場、面白い。看板の裏側にある「生活」まで含めて、記事にしたい"},
{fx:{attention:2, affection:{kirishima:5}},},
{sp:"narr", t:"霧島の記事は、正確で、温かかった。情報が武器にも盾にもなる世界で、信頼できる書き手は貴重だった。"},
{week:true},
],
},
ch2_onizuka: {
title: "空道の鬼",
steps: [
{sp:"narr", t:"空道の鬼塚徹。50歳にして現役の圧を持ち、実力主義の師匠として知られる男の道場を訪れた。"},
{img:"onizuka"},
{fx:{meet:["onizuka"]},},
{sp:"onizuka", t:"評判？ 知らんな。俺が見たいのは、お前の今の腕だけだ"},
{sp:"onizuka", t:"……悪くない目だ。だが、全盛はこれからだと言うなら、油断するなよ。20代の終わりは、油断した者から順に落ちていく"},
{sp:"narr", t:"鬼塚徹の個人指導は「他流派を学ぶ」の空道から受けられる。条件は勝ち星と腕前のみ。"},
{fx:{sei:1},},
{week:true},
],
},
ch2_war2: {
title: "道場対抗戦 ― 再戦の賭け",
steps: [
{sp:"narr", t:"黒潮道場との因縁は続いていた。門下生の数で並ばれつつある今、黒潮鉄心から再び果たし状が届いた。"},
{sp:"narr", t:"「今度は、うちの室井が本気で行く。賭けは前回と同じでいいな？」"},
{fx:{money:-25000},},
{sp:"narr", t:"遠征費と会場費で25,000円が出ていった。"},
{choice:[
{label:"賭けを受ける", say:[
{battle:"war2_ace", win:[
{warWin:true},
{sp:"narr", t:"室井は畳の上で天井を見上げた。「……完敗だ。あんたの道場が、羨ましいよ」"},
{fx:{sei:3, attention:2, record:{finWins:1}},},
], lose:[
{warLose:true},
{sp:"narr", t:"室井の圧に押し切られた。黒潮鉄心は無言で頷いただけだったが、その沈黙が重かった。"},
{fx:{attention:1},},
]},
]},
{label:"賭けは断り、交流戦にする", say:[
{battle:"war2_ace", win:[
{sp:"narr", t:"勝った。因縁は深まるばかりだが、生徒は守れた。"},
{fx:{sei:2},},
], lose:[
{sp:"narr", t:"負けた。だが、賭けていない戦いに、失うものはなかった。"},
{fx:{sei:1},},
]},
]},
]},
{week:true},
],
},
// ===== 27歳 =====
ch2_dope: {
title: "疑惑のささやき",
steps: [
{sp:"narr", t:"CLASHで、妙な投稿が回り始めた。「あの道場の選手、回復が早すぎないか？」根拠のない、ドーピング疑惑のささやきだった。"},
{sp:"narr", t:"使っていない。だが、強くなるほど、人は疑われる。この火種を、どう扱うか。"},
{debate:"dope_rumor"},
{week:true},
],
},
ch2_raio: {
title: "ショーの国の使者",
steps: [
{sp:"narr", t:"ルチャ・リブレのエル・ライオが、興行のゲストとして来日した。九条の計らいで、エキシビションの相手に指名された。"},
{img:"raio"},
{fx:{meet:["raio"]},},
{sp:"raio", t:"戦いはショーでもある。客の心を掴めない者は、リングでは生き残れない。……見せてもらおうか、君の「魅せる力」を"},
{battle:"raio_show", win:[
{sp:"raio", t:"素晴らしい！ 技術も、華もある。君はリングの真ん中が似合う男だ"},
{fx:{sei:1, attention:4, money:60000, affection:{}, record:{finWins:1}},},
], lose:[
{sp:"raio", t:"技術は悪くない。だが、魅せる意識がもう一歩だ。……また来よう、その時は本気でな"},
{fx:{attention:3, money:30000},},
]},
{week:true},
],
},
ch2_infowar: {
title: "切り抜かれた真実",
steps: [
{sp:"narr", t:"稽古中の古傷のケア映像が、文脈を切り取られて拡散された。「{style}の看板、実は深刻な怪我を隠している」という、半分だけ本当の情報だった。"},
{sp:"narr", t:"霧島沙耶から連絡が来た。「反論するなら今です。私も記事で援護できます。……ただ、リングの上の言葉が一番強い」"},
{debate:"info_war1"},
{week:true},
],
},
// ===== 28歳 =====
ch2_war3: {
title: "道場対抗戦 ― 師範同士",
steps: [
{sp:"narr", t:"黒潮道場との三度目の対決。今度は黒潮鉄心本人が、代表戦の畳に立つと言ってきた。"},
{img:null},
{sp:"narr", t:"「若い看板同士の争いは、もう終わりにしよう。……師範同士で決める。賭けは、今までで一番大きく行く」"},
{fx:{money:-30000},},
{sp:"narr", t:"会場費と遠征費で30,000円が出ていった。"},
{choice:[
{label:"賭けを受ける（師範同士の代表戦）", say:[
{battle:"war3_ace", win:[
{warWin:true},
{sp:"narr", t:"黒潮鉄心は深く息を吐き、笑った。「……負けた。だが、いい時代になったもんだ。強い看板が、ちゃんと勝つ」"},
{fx:{sei:4, attention:3, record:{finWins:1}},},
], lose:[
{warLose:true},
{sp:"narr", t:"黒潮鉄心の圧は、本物だった。「生徒は、強い看板に集まる。……それだけのことだ」"},
{fx:{attention:2},},
]},
]},
{label:"賭けは断り、交流戦にする", say:[
{battle:"war3_ace", win:[
{sp:"narr", t:"師範同士の読み合いは、観客を静まり返らせた。勝ったが、賭けのない勝利に、黒潮は「つまらん」と笑った。"},
{fx:{sei:2},},
], lose:[
{sp:"narr", t:"負けた。だが、道場の誰も失わなかった。看板の守り方は、一つではない。"},
{fx:{sei:1},},
]},
]},
]},
{week:true},
],
},
ch2_tier_c: {
title: "純粋か、混合か",
steps: [
{sp:"narr", t:"ミラのTier表が、ついに大論争の特集を組んだ。「一つの流派を極める者」と「全てを混ぜる者」。その渦の中心に、また自分の名前があった。"},
{debate:"tier_ch2_c"},
{week:true},
],
},
ch2_honsen_intro: {
title: "本戦への切符",
steps: [
{sp:"narr", t:"九条沙織から、異種格闘技戦「本戦」への出場決定の知らせが届いた。地域予選とは桁の違う、全国の猛者が集まる舞台。"},
{img:"kujo"},
{sp:"kujo", t:"本戦よ。カードは準々決勝から。相手は勝ち上がってきた者たちばかり。……それと、出場には参加費と遠征費がかかるわ。大きな舞台は、タダじゃないの"},
{choice:[
{label:"参加費・遠征費 80,000円を払う", fx:{money:-80000}, say:[
{sp:"kujo", t:"いい顔になったわね。29歳、武道家として一番脂の乗る年。……全部、置いてきなさい"},
]},
{label:"道場の積立から捻出する（注目を集めて補う）", fx:{money:-50000, attention:2}, say:[
{sp:"kujo", t:"クラウドファンディング的な集め方ね。……まあ、あなたの物語には、応援してくれる人がもう沢山いるものね"},
]},
]},
{sp:"narr", t:"本戦は29歳の年、春に開かれる。残された準備期間は、わずかだった。"},
{week:true},
],
},
// ===== 29歳：本戦 =====
ch2_honsen_qf: {
title: "本戦 準々決勝 神宮寺澪",
steps: [
{sp:"narr", t:"本戦のリング。観客の数は地域予選の何倍もいる。実況は音羽響、レフェリーは三好涼子。準々決勝の相手は、舞うカポエイラ。"},
{img:"jinguji"},
{sp:"jinguji", t:"やっと大きな舞台で会えたね。……今日は「魅せる」だけじゃ終わらせない。本気の私、見せてあげる"},
{battle:"honsen_qf", win:[
{sp:"jinguji", t:"……はは、完敗。でも、最高の舞台だった。準決勝も、魅せて勝ってね"},
{fx:{sei:3, attention:3, affection:{jinguji:6}, record:{finWins:1}},},
{jump:"ch2_honsen_sf_after"},
], lose:[
{sp:"narr", t:"準々決勝で敗れた。だが、本戦のリングに立ったという事実は、誰にも消せない。"},
{fx:{sei:2, attention:2},},
{jump:"ch2_honsen_end"},
]},
],
},
ch2_honsen_sf_after: {
title: "本戦 準決勝 エレナ・コワルスキ",
steps: [
{sp:"narr", t:"準決勝。組みの強豪が、静かに待っていた。"},
{img:"elena"},
{sp:"elena", t:"……来たか。今度は、組の全力で確かめる"},
{battle:"honsen_sf", win:[
{sp:"elena", t:"……完敗だ。あんたの{style}は、本物だ。決勝も、勝て"},
{fx:{sei:3, attention:3, affection:{elena:6}, record:{finWins:1}},},
{jump:"ch2_honsen_final_after"},
], lose:[
{sp:"narr", t:"準決勝で敗れた。エレナは静かに手を差し伸べた。「……いい試合だった」"},
{fx:{sei:2, attention:2, affection:{elena:3}},},
{jump:"ch2_honsen_end"},
]},
],
},
ch2_honsen_final_after: {
title: "本戦 決勝 鬼塚徹",
steps: [
{sp:"narr", t:"決勝のリング。向かい合うのは、空道の鬼。実力だけを見る目が、静かにこちらを測っていた。"},
{img:"onizuka"},
{sp:"onizuka", t:"ここまで来たか。……評判も、金も、関係ない。決勝は、今の腕だけで決める"},
{sp:"me", t:"（20代の全てを、この一戦に置いていく）"},
{battle:"honsen_final", win:[
{sp:"narr", t:"判定の瞬間、会場が総立ちになった。本戦、優勝。鬼塚は畳の上で笑い、力強く手を差し伸べた。"},
{sp:"onizuka", t:"……見事だ。お前の20代は、本物だった。30代はな、ここからが本当の戦いだぞ"},
{fx:{sei:6, attention:5, money:200000, flags:{honsenChampion:true}, record:{cups:1, finWins:1}},},
{jump:"ch2_end"},
], lose:[
{sp:"narr", t:"あと一歩、届かなかった。優勝は鬼塚。それでも、本戦の決勝に立った男の名前は、格闘技界に刻まれた。"},
{sp:"onizuka", t:"悪くなかった。……だが、頂点は一つだけだ。30代で、また来い"},
{fx:{sei:4, attention:4, money:80000, record:{finWins:0}},},
{jump:"ch2_end"},
]},
],
},
ch2_honsen_end: {
title: "本戦の終わり",
steps: [
{sp:"narr", t:"本戦は終わった。結果はどうあれ、29歳の春は、間違いなく武道人生の節目になった。"},
{jump:"ch2_end"},
],
},
ch2_end: {
title: "第2章 完",
steps: [
{mimg:true},
{sp:"genda", t:"看板を上げ、弟子を守り、本戦のリングに立った。……お前の20代は、駆け抜けたな"},
{sp:"genda", t:"30代は違うぞ。体はピークを迎え、同時に古傷が残り始める。強さの形そのものが、変わっていく"},
{sp:"me", t:"（{style}の道は、まだ先が長い。――次は、全盛期だ）"},
{sp:"narr", t:""},
{sp:"narr", t:"全盛期（30〜39歳）。ドーピングの誘惑、弟子世代の入門、道場対抗戦の本格化、そして「引退」という選択肢。物語は続いていきます。"},
{sp:"narr", t:"セーブデータは第3章へそのまま引き継げる構造になっています。第3章は次回制作で追加されます。"},
{endChapter2:true},
],
},
});

// ===== バトル定義（第2章） =====
Object.assign(BATTLES, {
ryuno_spar: {title:"交流戦 vs 龍野舞", enemyName:"龍野 舞", enemyStyleName:"ムエタイ", img:"ryuno", hp:85, power:9, mode:"spar", foul:false,
comments:["「肘と膝の連携、芸術的だ！」","実況「蹴りの名手の圧が来ます！」","観客「距離が一瞬で詰まる」"]},
todo_ex: {title:"組み手 vs 藤堂静", enemyName:"藤堂 静", enemyStyleName:"松濤館流", img:"todo", hp:75, power:7, mode:"spar", foul:false,
comments:["藤堂道場の若い子たちが見守っている","静かな道場に、足音だけが響く","「師範の間合い、深い…」"]},
jinguji_match: {title:"エキシビション vs 神宮寺澪", enemyName:"神宮寺 澪", enemyStyleName:"カポエイラ・ヘジョナル", img:"jinguji", hp:85, power:9, mode:"match", foul:true,
comments:["実況「舞うような動き！ 観客が沸いています！」","「どこから蹴りが来るか分からない」","コメント欄が澪の名で埋まっていく"]},
elena_spar: {title:"合同練習 vs エレナ・コワルスキ", enemyName:"エレナ・コワルスキ", enemyStyleName:"レスリング（フリースタイル）", img:"elena", hp:100, power:10, mode:"spar", foul:false,
comments:["組み合う音が道場に響く","「組の圧が、まるで壁だ」","源田師範が静かに頷いている"]},
mariana_spar: {title:"交流戦 vs マリアナ", enemyName:"マリアナ・ドス・サントス", enemyStyleName:"ブラジリアン柔術", img:"mariana", hp:110, power:11, mode:"spar", foul:false,
comments:["「寝たら終わり、という圧がすごい」","実況「寝技の世界へようこそ、だそうです！」","観客「極まるか、逃げ切るか」"]},
war1_ace: {title:"道場対抗戦 vs 室井豪", enemyName:"室井 豪（黒潮道場）", enemyStyleName:"極真空手", img:null, hp:100, power:10, mode:"match", foul:true,
comments:["実況「看板同士の代表戦です！」","両道場の生徒たちが固唾を飲んで見守る","「賭けの行方は――」"]},
war2_ace: {title:"道場対抗戦 vs 室井豪（再戦）", enemyName:"室井 豪（黒潮道場）", enemyStyleName:"極真空手", img:null, hp:125, power:12, mode:"match", foul:true,
comments:["実況「因縁の再戦！ 室井の目が変わっています」","「前回とは別人だ」","CLASHの実況欄が荒れている"]},
war3_ace: {title:"師範対決 vs 黒潮鉄心", enemyName:"黒潮 鉄心（黒潮道場師範）", enemyStyleName:"極真空手", img:null, hp:150, power:13, mode:"match", foul:true,
comments:["実況「師範同士の代表戦。会場の空気が重い！」","「重量級の圧が来る」","生徒たちの声援が割れる"]},
raio_show: {title:"エキシビション vs エル・ライオ", enemyName:"エル・ライオ", enemyStyleName:"ルチャ・リブレ", img:"raio", hp:95, power:9, mode:"match", foul:false,
comments:["実況「空を飛ぶ！ これがルチャです！」","観客総立ちの空中戦","「魅せる戦いとは、こういうことか」"]},
honsen_qf: {title:"本戦・準々決勝 vs 神宮寺澪", enemyName:"神宮寺 澪", enemyStyleName:"カポエイラ・ヘジョナル", img:"jinguji", hp:140, power:12, mode:"match", foul:true,
comments:["実況「本戦の舞台、準々決勝です！」","「澪の本気、初めて見る」","会場の熱気が地域予選とは桁違いだ"]},
honsen_sf: {title:"本戦・準決勝 vs エレナ・コワルスキ", enemyName:"エレナ・コワルスキ", enemyStyleName:"レスリング（フリースタイル）", img:"elena", hp:165, power:13, mode:"match", foul:true,
comments:["実況「組みの頂上決戦です！」","「壁のような圧」","観客「どちらも譲らない」"]},
honsen_final: {title:"本戦・決勝 vs 鬼塚徹", enemyName:"鬼塚 徹", enemyStyleName:"空道（大道塾）", img:"onizuka", hp:200, power:14, mode:"match", foul:true,
comments:["実況「決勝です！ 20代の全てを懸けた一戦！」","「鬼塚の圧、化け物だ」","会場全体が総立ちになっている","音羽響の声が震えている"]},
});

// ===== SNS議論バトル定義（第2章） =====
Object.assign(DEBATES, {
tier_ch2_a: {title:"Tier表・定期更新への反論", posts:[
{name:"ミラ", handle:"@tier_mira", text:"月例更新！ 道場を持った{style}の若手、Aランク目前で足踏み中。看板を上げると、戦いが「守り」に入る人って多いのよね〜"},
{name:"格闘技ウォッチャー", handle:"@watch_kakuto", text:"道場主になったら終わりだろ。生活に追われて、リングの輝きは消える"},
], replies:[
{attr:"正論", label:"「道場経営と強さは両立できる。数字で示す」と返す", score:6,
win:[{sp:"narr", t:"「看板を背負って勝つ方が難しい」という声が増え、論争の流れが変わった。"}],
lose:[{sp:"narr", t:"尤もだが、地味な正論は論争の熱に流されてしまった。"}]},
{attr:"経験談", label:"独立の苦労と、それでも続ける理由を語る", score:6,
win:[{sp:"narr", t:"生活の現実を語る言葉が、同じ境遇の格闘家たちに刺さった。"}],
lose:[{sp:"narr", t:"届く人には届いたが、大きな流れにはならなかった。"}]},
{attr:"ユーモア", label:"「家賃の請求書が一番の強敵」と笑いに変える", score:7,
win:[{sp:"narr", t:"名言として切り抜かれた。「請求書に勝てる男は強い」というミームまで生まれた。"}],
lose:[{sp:"narr", t:"笑いは取れたが、「余裕がない証拠」と叩く者もいた。"}]},
{attr:"煽り", label:"「終わったと言うなら、リングで証明しろ」と返す", score:5,
win:[{sp:"narr", t:"言葉の圧が勝ち、対戦希望の声まで上がった。"}],
lose:[{sp:"narr", t:"「ネット弁慶」のレッテルを貼られ、少し荒れた。"}]},
], winFx:{attention:3, sei:1}, loseFx:{attention:2, aku:1}},
tier_ch2_b: {title:"寝技最強論争", posts:[
{name:"ミラ", handle:"@tier_mira", text:"寝技最強論争！ {style}の看板は、寝たらどうなの？ マリアナ戦の映像、何度も見返しちゃった♡"},
{name:"寝技ウォッチャー", handle:"@newaza_watch", text:"立技の人は、寝技の深さを知らない。タップするまでが一瞬の世界だ"},
], replies:[
{attr:"正論", label:"「寝技も立技も、距離の一つだ」と返す", score:6,
win:[{sp:"narr", t:"「距離で統一して考える視点が新しい」と、技術派の支持を集めた。"}],
lose:[{sp:"narr", t:"理屈は通ったが、寝技派の熱には勝てなかった。"}]},
{attr:"経験談", label:"マリアナとの交流戦で感じたことを正直に語る", score:7,
win:[{sp:"mariana", t:"正直な言葉だね。寝技は嘘をつかない。……あんたの言葉も、嘘がなかった"}],
lose:[{sp:"narr", t:"正直さは伝わったが、論争は静かに流れた。"}]},
{attr:"ユーモア", label:"「寝たら終わる、だから寝ない努力がすごい」と返す", score:5,
win:[{sp:"narr", t:"自虐と敬意のバランスがウケた。"}],
lose:[{sp:"narr", t:"「逃げの発想」と取られてしまった。"}]},
{attr:"煽り", label:"「なら次は、寝技ルールで受けて立つ」と宣言する", score:6,
win:[{sp:"narr", t:"宣言が拡散し、再戦への期待が燃え上がった。"}],
lose:[{sp:"narr", t:"「無謀」と叩かれた。結果で返すしかない。"}]},
], winFx:{attention:3, sei:1}, loseFx:{attention:2}},
tier_ch2_c: {title:"純粋か、混合か", posts:[
{name:"ミラ", handle:"@tier_mira", text:"純粋か、混合か。{style}一筋の者と、全てを混ぜる者。最強論争は、いよいよ核心に入りました"},
{name:"古参ファン", handle:"@old_fan", text:"流派の看板を背負う意味を、今の若い者は分かっていない"},
{name:"MMAファン", handle:"@mma_fan", text:"看板なんて飾りだ。強さの前では全部同じ"},
], replies:[
{attr:"正論", label:"「看板は制約であり、同時に深さの源だ」と返す", score:6,
win:[{sp:"narr", t:"両陣営から「分かっている」という声が上がった。論争が一段深くなった。"}],
lose:[{sp:"narr", t:"「どっちつかず」と両陣営から叩かれた。"}]},
{attr:"経験談", label:"自分の流儀の歩みを、数字と共に語る", score:7,
win:[{sp:"narr", t:"積み上げた年月の重さが、言葉に宿った。ミラ本人が長文で引用した。"}],
lose:[{sp:"narr", t:"経験は届いたが、論争の熱は収まらなかった。"}]},
{attr:"ユーモア", label:"「純粋度は心の在り方、と師匠が言っていた」と返す", score:5,
win:[{sp:"narr", t:"含みのある返しが、各方面に好意的に受け取られた。"}],
lose:[{sp:"narr", t:"含みが深すぎて、伝わりきらなかった。"}]},
{attr:"煽り", label:"「飾りと言うなら、その飾りに負けた者は何だ」と返す", score:6,
win:[{sp:"narr", t:"一撃の言葉が空気を変えた。論争はリングでの決着を望む声に包まれた。"}],
lose:[{sp:"narr", t:"煽りすぎて、純粋派からも距離を置かれた。"}]},
], winFx:{attention:4, sei:1}, loseFx:{attention:3, aku:1}},
dope_rumor: {title:"ドーピング疑惑への反論", posts:[
{name:"匿名アカウント", handle:"@anon_shadow", text:"あの道場の看板、回復が早すぎる。裏で「何か」やってるんじゃないか？ 選手生命を縮める近道は、実在するんだよ"},
{name:"格闘技ウォッチャー", handle:"@watch_kakuto", text:"疑惑だけで人は潰せる時代だからな。本人の言葉が聞きたい"},
], replies:[
{attr:"正論", label:"「検査はいつでも受け入れる。記録も全て開示する」と宣言する", score:7,
win:[{sp:"narr", t:"潔さが空気を変えた。「これが清い者の戦い方だ」という声が大勢になった。"}],
lose:[{sp:"narr", t:"宣言は届いたが、疑う者は疑い続けた。火は小さくなっただけだった。"}]},
{attr:"経験談", label:"食事とケアと休養の積み重ねを、具体的に語る", score:6,
win:[{sp:"ono", t:"あの子の回復は、台所と休養の賜物だよ。……ちゃんと見てる人は、見てるからね"}],
lose:[{sp:"narr", t:"地道な話は、地味だと言われてしまった。"}]},
{attr:"ユーモア", label:"「秘密は定食屋の味噌汁」と笑いに変える", score:6,
win:[{sp:"narr", t:"「疑惑の答えが味噌汁」という切り抜きがバズり、疑惑そのものが笑い話になった。"}],
lose:[{sp:"narr", t:"笑いに寄せすぎて、「ごまかした」と取る者もいた。"}]},
{attr:"煽り", label:"「疑う暇があったら強くなれ」と一蹴する", score:5,
win:[{sp:"narr", t:"圧のある一言が、匿名アカウントを沈黙させた。"}],
lose:[{sp:"narr", t:"「図星で怒った」と解釈され、火に油を注いだ。"}]},
], winFx:{attention:3, sei:2}, loseFx:{attention:3, aku:1}},
info_war1: {title:"怪我の切り抜き騒動", posts:[
{name:"切り抜きアカウント", handle:"@kirinuki_g", text:"{style}の看板、深刻な怪我を隠して出場を強行か？ ケア映像が流出。本戦への影響は避けられない模様"},
{name:"霧島 沙耶", handle:"@kirishima_sports", text:"切り抜きは「半分の真実」です。本人の言葉と、正確な経緯を記事にしました。判断は、全文を読んでからどうぞ"},
], replies:[
{attr:"正論", label:"「ケアは怪我の隠蔽ではなく、選手の日常だ」と事実を並べる", score:7,
win:[{sp:"narr", t:"霧島の記事と本人の言葉が揃い、騒動は「情報戦の手口」として逆に注目を集めた。"}],
lose:[{sp:"narr", t:"事実は届いたが、切り抜きの拡散力には届かなかった。"}]},
{attr:"経験談", label:"体の管理と向き合ってきた年月を語る", score:6,
win:[{sp:"narr", t:"「武道家は体と一生付き合う」という言葉が、同業者に広く刺さった。"}],
lose:[{sp:"narr", t:"真摯さは伝わったが、騒動は静かに残った。"}]},
{attr:"ユーモア", label:"「隠すほどの怪我なら、まず請求書を隠したい」と返す", score:5,
win:[{sp:"narr", t:"生活感のある笑いが、空気をほぐした。"}],
lose:[{sp:"narr", t:"「余裕ぶっている」と叩かれた。"}]},
{attr:"煽り", label:"「怪我をしていても勝つ。それだけだ」と宣言する", score:6,
win:[{sp:"narr", t:"強気の宣言が本戦への期待を跳ね上げた。"}],
lose:[{sp:"narr", t:"「強がり」と取られ、相手の思う壺になった。"}]},
], winFx:{attention:4, sei:1}, loseFx:{attention:3}},
});

// ===== 口説き（恋愛）データ（第2章） =====
// 第1章分（ROMANCE）へ Object.assign で統合する。書式は第1章と共通
Object.assign(ROMANCE, {
  ryuno: {title:"龍野 舞", flirt:[
      [{sp:"ryuno", t:"あんたの蹴り、また見たい。……今度は私が、隣で見てる側でもいいけど"}],
      [{sp:"ryuno", t:"タイのキャンプは厳しいよ。でも、あんたの顔を思い出すと、不思議と乗り越えられるんだ"}],
      [{sp:"ryuno", t:"肘の入り方、教えてあげる。……近い距離の稽古になるけど、覚悟してね"}],
      [{sp:"narr", t:"舞に、タイシルクのハンドラップを贈った。タイのキャンプでも使える、丈夫で華やかなものを選んだ。"},
       {sp:"ryuno", t:"お、気が利くじゃん。……タイに持ってくよ。あんたのことを思い出しながら、巻くことにする"}],
    ], ev1:[
      {ep:"ryuno-ev1"},
      {sp:"narr", t:"セミナーの打ち上げ。舞と二人、屋台の並ぶ通りを歩いた。"},
      {sp:"ryuno", t:"私、強い男には何人も会ってきた。でも「隣にいたい」と思ったのは、あんたが初めて"},
      {sp:"ryuno", t:"蹴りで語るのは得意なのに、こういうのは下手でさ。……伝わってる？"},
    ], dateIntro:[
      {sp:"narr", t:"思い切って、舞を休日の外出に誘った。稽古着でない彼女と会うのは、初めてだった。"},
      {sp:"ryuno", t:"デートのお誘い？ ふふ、あんたも言うようになったね。……いいよ、付き合う"},
    ], dateSpots:[
      {label:"タイ料理の屋台街で食べ歩き", good:true, say:[
        {sp:"ryuno", t:"お、目の付け所がいいじゃん。タイの味は私の燃料みたいなもんだから。……辛さ、あんたは平気？ 無理すんなよ"},
        {sp:"narr", t:"舞の案内で三軒はしごした。故郷の味に、彼女の表情がほころんでいく。"},
      ]},
      {label:"映画館でアクション映画", good:false, say:[
        {sp:"ryuno", t:"……ごめん、蹴りのフォームにばっかり目がいっちゃった。映画自体は面白かったけどね"},
        {sp:"narr", t:"上映後、舞はずっと蹴りの解説をしていた。楽しそうではあった。"},
      ]},
    ], dateSeason:{
      spring:{label:"桜の河川敷を歩く", good:true, say:[
        {sp:"ryuno", t:"タイにも桜に似た花はあるけど、本物は迫力が違うね。……あんたと見る景色は、よく覚えてるんだ"},
      ]},
      summer:{label:"海辺でかき氷", good:true, say:[
        {sp:"ryuno", t:"減量のない日の氷は最高だね！ ……あんたの分も一口もらおうか"},
      ]},
      autumn:{label:"紅葉の山道を歩く", good:true, say:[
        {sp:"ryuno", t:"山道歩きは脚の稽古にもなるし、一石二鳥だね。……あんたの隣、歩きやすいよ"},
      ]},
      winter:{label:"雪景色と温かいタイティー", good:true, say:[
        {sp:"ryuno", t:"雪の静けさ、タイにはない景色だ。……寒い日は、人の温かさがよく分かるね"},
      ]},
    }, dateOutro:[
      {sp:"ryuno", t:"今日のあんた、蹴り以外も悪くないじゃん。……距離の話、次に会う時って言ったよね。今日で少し、縮まったかも"},
      {sp:"narr", t:"帰り道、舞の歩幅は稽古の時より、ずっとゆっくりだった。"},
    ], ev2:[
      {ep:"ryuno-ev2"},
      {sp:"narr", t:"帰国前夜。舞が道場に一人で現れた。"},
      {sp:"ryuno", t:"距離ってさ、国と国の距離だけじゃないよね。……私とあんたの距離、今どれくらいだと思う？"},
      {sp:"ryuno", t:"答えは、次に会う時まで取っておく。だから、必ずまた会おう"},
    ], confessOk:[
      {sp:"ryuno", t:"……！ あんた、蹴りより真っ直ぐな告白するんだね。……うん。私の心、完全に打ち抜かれた"},
      {sp:"narr", t:"龍野舞と、気持ちが通じ合った。蹴りの届く距離より、近くにいることを選んだ二人だった。"},
    ], confessNg:[
      {sp:"ryuno", t:"ごめん……今の私は、まだ自分の蹴りの先にいる。あんたのせいじゃない"},
    ]},
  elena: {title:"エレナ・コワルスキ", flirt:[
      [{sp:"elena", t:"……今日も来たな。組むか。言葉より、その方が早い"}],
      [{sp:"elena", t:"あんたの組み、少し良くなった。……褒めるのは、滅多にないことだ"}],
      [{sp:"elena", t:"私の国では、信頼できる相手としか組まない。……あんたは、信頼できる"}],
      [{sp:"narr", t:"エレナに、バルト海の琥珀のペンダントを贈った。彼女の故郷の海の色をしていたからだ。"},
       {sp:"elena", t:"……故郷の、琥珀。……なぜ、これを選んだ。……いや、聞かない。礼を言う。大事にする"}],
    ], ev1:[
      {ep:"elena-ev1"},
      {sp:"narr", t:"合同練習の後、エレナが珍しく長く話した。"},
      {sp:"elena", t:"私は、言葉が下手だ。だから、組んだ時の感触で人を判断する。……あんたの感触は、正直だった"},
      {sp:"elena", t:"正直な相手は、少ない。大事にしたいと、思う"},
    ], dateIntro:[
      {sp:"narr", t:"思い切って、エレナを休日の外出に誘った。練習着でない彼女は、新鮮だった。"},
      {sp:"elena", t:"……休みの日に、私と？ ……分かった。付き合おう"},
    ], dateSpots:[
      {label:"静かな湖畔の公園を歩く", good:true, say:[
        {sp:"elena", t:"……静かな場所は、好きだ。言葉が少なくても、隣にいることが伝わる"},
        {sp:"narr", t:"多くを語らないエレナが、湖畔のベンチで長いこと隣に座っていた。それが答えのようだった。"},
      ]},
      {label:"賑やかなゲームセンター", good:false, say:[
        {sp:"elena", t:"……騒がしいのは、少し疲れた。だが、あんたと出かけたこと自体は、悪くなかった"},
        {sp:"narr", t:"エレナはクレーンゲームを無言で三回試し、ぬいぐるみを一つ取って、こちらに押し付けた。"},
      ]},
    ], dateSeason:{
      spring:{label:"桜の並木を歩く", good:true, say:[
        {sp:"elena", t:"……桜は、儚いから見るのだろう。……悪くない"},
      ]},
      summer:{label:"川辺で涼む", good:true, say:[
        {sp:"elena", t:"……水の音は、落ち着く。あんたの隣も、同じだ"},
      ]},
      autumn:{label:"紅葉の森を歩く", good:true, say:[
        {sp:"elena", t:"……故郷の秋に似ている。……懐かしい気持ちは、嫌いじゃない"},
      ]},
      winter:{label:"雪の公園を歩く", good:true, say:[
        {sp:"elena", t:"……雪は、私の国の言葉だ。……今日は、あんたにも少しだけ、その言葉が分かっただろう"},
      ]},
    }, dateOutro:[
      {sp:"elena", t:"……今日は、悪くなかった。いや……『良かった』、が正しい。……また誘え"},
      {sp:"narr", t:"帰り道、エレナがほんの少しだけ、隣に寄って歩いた。"},
    ], ev2:[
      {ep:"elena-ev2"},
      {sp:"narr", t:"雪の日の体育館。エレナが小さな声で言った。"},
      {sp:"elena", t:"私は、弱さを見せるのが怖かった。……だが、あんたの前では、不思議と鎧が重い"},
      {sp:"elena", t:"いつか、その鎧を脱ぐ日が来たら。……隣にいて、ほしい"},
    ], confessOk:[
      {sp:"elena", t:"……っ。私は、こういう時、どうすればいいか分からない。……だが、答えは決まっている。うん。私も、同じ気持ちだ"},
      {sp:"narr", t:"エレナ・コワルスキと、気持ちが通じ合った。言葉少なな二人の、確かな始まりだった。"},
    ], confessNg:[
      {sp:"elena", t:"……ごめん。今の私は、まだ組み合うことでしか人を測れない。もう少し、時間がいる"},
    ]},
  chen: {title:"陳 美玲", flirt:[
      [{sp:"chen", t:"今日の手の内、少しだけ進歩がありました。……継続は、才能に勝ります"}],
      [{sp:"chen", t:"あなたは、戦いの外でも礼を忘れない。それが、私が門を開けた理由です"}],
      [{sp:"chen", t:"詠春は、至近の距離の武術です。……心の距離も、同じように測れるものですね"}],
      [{sp:"narr", t:"美玲に、白檀の扇子を贈った。至近の武術を極める人の、涼やかな所作に似合うと思って。"},
       {sp:"chen", t:"……よく見ていますね。扇の開閉もまた、手の内の修練です。ありがたく、頂きます"}],
    ], ev1:[
      {ep:"chen-ev1"},
      {sp:"narr", t:"陳の道場で、中国茶を振る舞われた。静かな時間だった。"},
      {sp:"chen", t:"私は、弟子にも心を許すのに時間がかかる性分です。……ですが、あなたは例外になりつつある"},
      {sp:"chen", t:"師としてではなく、一人の武術家として。あなたの歩みを、近くで見ていたい"},
    ], dateIntro:[
      {sp:"narr", t:"思い切って、陳を休日の外出に誘った。師としてではない彼女と会うのは、初めてだった。"},
      {sp:"chen", t:"……お誘いですか。……ふふ、礼を尽くすあなたのことです、断る理由がありませんね"},
    ], dateSpots:[
      {label:"中国茶の専門店で茶席", good:true, say:[
        {sp:"chen", t:"良い店をご存じですね。……茶は、心の鏡です。今日のあなたの心は、澄んでいます"},
        {sp:"narr", t:"陳の淹れる茶の香りが、二人の間の静けさを心地よいものに変えていく。"},
      ]},
      {label:"賑やかな商店街の食べ歩き", good:false, say:[
        {sp:"chen", t:"……活気は嫌いではありません。ですが、私には少し、騒がしすぎたようです"},
        {sp:"narr", t:"人混みの中で、陳は小さくため息をついた。それでも最後まで、文句は言わなかった。"},
      ]},
    ], dateSeason:{
      spring:{label:"桜の庭園で茶を飲む", good:true, say:[
        {sp:"chen", t:"桜と茶。……日本の春は、静けさの作法が美しいですね"},
      ]},
      summer:{label:"蓮の池のある公園", good:true, say:[
        {sp:"chen", t:"蓮は、泥の中から清く咲きます。……人の心も、そうありたいものです"},
      ]},
      autumn:{label:"紅葉の寺院を訪ねる", good:true, say:[
        {sp:"chen", t:"紅葉の静寂は、詠春の心に似ています。……今日のお誘い、正解でしたね"},
      ]},
      winter:{label:"雪の茶室で温まる", good:true, say:[
        {sp:"chen", t:"雪の日の茶は、格別です。……あなたの隣で飲む茶は、なおさらですね"},
      ]},
    }, dateOutro:[
      {sp:"chen", t:"今日の時間、私の心にも静かに残りました。……門の内側とは、こういうことかもしれませんね"},
      {sp:"narr", t:"帰り道、陳の歩みはいつもの稽古より少しだけ緩やかだった。"},
    ], ev2:[
      {ep:"chen-ev2"},
      {sp:"narr", t:"雨上がりの庭。陳が、珍しく昔話をした。"},
      {sp:"chen", t:"若い頃、私は「強い女は一人で立つもの」と信じていました。……今は、少し考えが変わりました"},
      {sp:"chen", t:"隣に立つ資格のある人が、現れたからです。……心当たりは、ありますか"},
    ], confessOk:[
      {sp:"chen", t:"……師弟の礼を、乱す言葉ですね。……ですが、私の心は、もう答えを出していました。受け取ります。あなたの想いも、あなた自身も"},
      {sp:"narr", t:"陳美玲と、気持ちが通じ合った。厳格な師の心の門が、一人の男のために開かれた。"},
    ], confessNg:[
      {sp:"chen", t:"……今の私には、師としての節度が先に立ちます。その言葉は、しかと受け取りました。ですが、答えは、まだ出せません"},
    ]},
  todo: {title:"藤堂 静", flirt:[
      [{sp:"todo", t:"あら、今日もいい顔してるね。……茶でも飲んでいきなさい"}],
      [{sp:"todo", t:"あんたの試合、若い子たちが見てるよ。背中って、言葉より雄弁なの"}],
      [{sp:"todo", t:"私もね、若い頃は「年上には敵わない」って思ってた。……今は逆の立場だけど、気持ちはよく分かる"}],
      [{sp:"narr", t:"静に、京焼の湯呑みを贈った。いつも茶を勧めてくれるお礼に、新しい器を。"},
       {sp:"todo", t:"あらまあ、気が利くねえ。……今度はこの器で、あんたに茶を入れてあげるよ"}],
    ], ev1:[
      {ep:"todo-ev1"},
      {sp:"narr", t:"藤堂道場の縁側。二人で茶を飲みながら、静かな夕方を過ごした。"},
      {sp:"todo", t:"失敗談なら、いくらでもあるわ。……でもね、失敗を笑って話せるようになるまでが、一番苦しいの"},
      {sp:"todo", t:"あんたは、その時期を上手に越えたね。……隣で見ていて、気持ちのいい若さだった"},
    ], dateIntro:[
      {sp:"narr", t:"思い切って、藤堂静を休日の外出に誘った。師範の顔でない彼女と会うのは、初めてだった。"},
      {sp:"todo", t:"あら、私なんかでいいの？ ……ふふ、嬉しいね。今日は先生じゃなく、一人の女として付き合うよ"},
    ], dateSpots:[
      {label:"禅寺で座禅体験", good:true, say:[
        {sp:"todo", t:"寺の作務衣に着替えて、座禅。……心が洗われるね。あんたの横顔、稽古の時よりずっと静かで、いい顔してた"},
        {sp:"narr", t:"作務衣姿の二人は、しばし言葉少なに庭を眺めた。静けさが、心の距離を縮めていく。"},
      ]},
      {label:"若者に人気のカフェ巡り", good:false, say:[
        {sp:"todo", t:"……あらあら、私、場違いだったかしら。でもね、あんたが気を遣ってくれたのは、ちゃんと伝わったよ"},
        {sp:"narr", t:"藤堂は笑って済ませたが、店の空気には少しだけ居心地が悪そうだった。"},
      ]},
    ], dateSeason:{
      spring:{label:"桜の境内の茶店", good:true, say:[
        {sp:"todo", t:"桜の季節の境内は、道場の静けさに似てるね。……あんたと歩くと、余計に穏やかだ"},
      ]},
      summer:{label:"風鈴の寺で涼む", good:true, say:[
        {sp:"todo", t:"風鈴の音は、心の汗を拭いてくれるね。……夏の稽古の後みたいだ"},
      ]},
      autumn:{label:"紅葉の庭の散策", good:true, say:[
        {sp:"todo", t:"紅葉は、円熟の色だね。……私の歳になると、この色に励まされるの"},
      ]},
      winter:{label:"雪の庭と温かい抹茶", good:true, say:[
        {sp:"todo", t:"雪の庭と抹茶の苦み。……大人の冬は、こういうのが嬉しいね"},
      ]},
    }, dateOutro:[
      {sp:"todo", t:"今日はありがとね。……年の差だなんて言葉、あんたの前では忘れられそうだ"},
      {sp:"narr", t:"帰り道、藤堂の笑顔は師範のものより、少しだけ若かった。"},
    ], ev2:[
      {ep:"todo-ev2"},
      {sp:"narr", t:"稽古終わり。藤堂が、ふと真顔になった。"},
      {sp:"todo", t:"年の差って、武道では関係ないの。……心の話でも、そうだと私は思いたい"},
      {sp:"todo", t:"あんたがどう思うかは、別としてね。……ふふ、らしくないことを言わせる子だ"},
    ], confessOk:[
      {sp:"todo", t:"……あらあら。本気なのね。……ふふ、いいわ。私の人生の後半戦、隣に立つ資格をあげる"},
      {sp:"narr", t:"藤堂静と、気持ちが通じ合った。年上の師範の、穏やかで確かな愛情が始まった。"},
    ], confessNg:[
      {sp:"todo", t:"嬉しい言葉だね。……でも、今の私は、まだ「師範」の顔でいたいの。もう少しだけ、時間をちょうだい"},
    ]},
  kurozaki: {title:"黒崎 ラン", flirt:[
      [{sp:"kurozaki", t:"あら、看板持ちのお坊ちゃま。……裏の稽古、興味ある？"}],
      [{sp:"kurozaki", t:"あんたの悪名、いい色になってきたじゃない。……その調子で堕ちてきなさい"}],
      [{sp:"kurozaki", t:"正道の連中は、あんたの半分しか見てない。私はね、全部見てるのよ"}],
      [{sp:"narr", t:"ランに、黒い薔薇のドライフラワーと銀の花器を贈った。正道の棚には並ばないようなものを、あえて選んだ。"},
       {sp:"kurozaki", t:"フフ……黒い薔薇。あんたも、悪い趣味になってきたじゃない。……気に入ったわ。大事にする"}],
    ], ev1:[
      {ep:"kurozaki-ev1"},
      {sp:"narr", t:"深夜の裏道場。ランが、表では決して教えない技術の「考え方」を語った。"},
      {sp:"kurozaki", t:"私はね、綺麗なだけの人間が一番信用ならない。……あんたは違う。泥の味を知ってる目だ"},
      {sp:"kurozaki", t:"そういう目をした男には、弱いところも見せたくなる。……困った女でしょ"},
    ], dateIntro:[
      {sp:"narr", t:"思い切って、ランを休日の外出に誘った。裏道場の外で会うのは、初めてだった。"},
      {sp:"kurozaki", t:"あら、昼間から私を誘うなんて。……看板、汚れるわよ？ ……ふふ、嘘。付き合ってあげる"},
    ], dateSpots:[
      {label:"路地裏の隠れ家カフェ", good:true, say:[
        {sp:"kurozaki", t:"よく見つけたわね、こんな店。……表の人間には見つけられない場所。あんた、こっち側の素質もあるんじゃない？"},
        {sp:"narr", t:"看板のない店の奥で、ランは珍しく肩の力を抜いて笑っていた。"},
      ]},
      {label:"明るいファミリー向けの公園", good:false, say:[
        {sp:"kurozaki", t:"……眩しいわね、ここは。私には不釣り合いな場所。……でも、あんたと歩く分には、悪くなかったわ"},
        {sp:"narr", t:"家族連れの笑い声の中で、ランは少しだけ居場所を探すように辺りを見回していた。"},
      ]},
    ], dateSeason:{
      spring:{label:"夕桜の公園を歩く", good:true, say:[
        {sp:"kurozaki", t:"夕方の桜は、表と裏の境目の色ね。……私の好きな時間だわ"},
      ]},
      summer:{label:"夜市の屋台を回る", good:true, say:[
        {sp:"kurozaki", t:"夜の賑わいは、素性を隠してくれる。……あんたと並ぶ夜市、悪くないわ"},
      ]},
      autumn:{label:"紅葉の裏山道", good:true, say:[
        {sp:"kurozaki", t:"人の来ない道は落ち着くわ。……あんたとなら、表の道でも歩いてあげるけど"},
      ]},
      winter:{label:"雪の路地を歩く", good:true, say:[
        {sp:"kurozaki", t:"雪の路地は音が消える。……二人の秘密話には、ちょうどいいわね"},
      ]},
    }, dateOutro:[
      {sp:"kurozaki", t:"今日のことは、裏の私だけの秘密にしておくわ。……あんたの『表』も『裏』も、少しずつ私のものになっていくみたいね"},
      {sp:"narr", t:"帰り道、ランの影がこちらの影に、そっと重なっていた。"},
    ], ev2:[
      {ep:"kurozaki-ev2"},
      {sp:"narr", t:"雨の夜、傘を差し出した時のこと。ランが小さく笑った。"},
      {sp:"kurozaki", t:"優しいのね、裏の女にも。……そういうところ、嫌いじゃない"},
      {sp:"kurozaki", t:"ねえ。私みたいな女と並んで歩いたら、あんたの看板、汚れるわよ。……それでも？"},
    ], confessOk:[
      {sp:"kurozaki", t:"……本気？ はっ、面白い男。……いいわ。あんたの「裏側」は、私が全部引き受けてあげる"},
      {sp:"narr", t:"黒崎ランと、気持ちが通じ合った。光と影の境界に立つ二人の関係が始まった。"},
    ], confessNg:[
      {sp:"kurozaki", t:"あら、今のあんたは、まだ「表」の人間ね。……もっと泥を被ってから、出直してきなさい"},
    ]},
  jinguji: {title:"神宮寺 澪", flirt:[
      [{sp:"jinguji", t:"ねえねえ、今日のあんたの試合、私のフォロワーが絶賛してたよ！ ……私も、その一人だけど"}],
      [{sp:"jinguji", t:"カポエイラは音楽と一緒じゃないと始まらないの。あんたの戦いにも、リズムがあるよね"}],
      [{sp:"jinguji", t:"今度、二人でコラボ動画撮ろう？ 「堅い男と舞う女」ってタイトルで。絶対バズるって"}],
      [{sp:"narr", t:"澪に、カポエイラで使う籠製のシェーカー、カシシを贈った。彼女のリズムの源を、一つ増やせればと思って。"},
       {sp:"jinguji", t:"わ、カシシ！ しかも本格的なやつ！ ……ねえ、今度これで一緒にホーダ（輪）を作ろう？ あんたの戦いに、リズムをあげる"}],
    ], ev1:[
      {ep:"jinguji-ev1"},
      {sp:"narr", t:"撮影の合間。澪がカメラを止めて、素顔で話した。"},
      {sp:"jinguji", t:"「魅せる」って、実はすごく孤独なんだ。観てる人は多いのに、分かってくれる人は少なくて"},
      {sp:"jinguji", t:"でも、あんたは違う。カメラの向こうじゃなく、私自身を見てくれる。……それが、一番嬉しいの"},
    ], dateIntro:[
      {sp:"narr", t:"思い切って、澪を休日の外出に誘った。カメラの回っていない彼女と会うのは、初めてだった。"},
      {sp:"jinguji", t:"デートのお誘い？ やった！ ……今日は撮影なし、って決めてたけど、あんたとなら素の私で楽しめそう"},
    ], dateSpots:[
      {label:"河川敷でピクニックと音楽", good:true, say:[
        {sp:"jinguji", t:"外で食べるごはん、最高！ ……ねえ、音楽かけるね。あんたとの時間にも、リズムがほしいな"},
        {sp:"narr", t:"風と音楽と、澪の笑い声。河川敷の午後は、配信の何倍も鮮やかだった。"},
      ]},
      {label:"静かな図書館", good:false, say:[
        {sp:"jinguji", t:"……静かすぎて、体がうずうずしちゃった。ごめんね、私、じっとしてるの苦手なの"},
        {sp:"narr", t:"帰り際、澪は河川敷で一回だけ大きく伸びをした。それが本音のようだった。"},
      ]},
    ], dateSeason:{
      spring:{label:"桜の公園でお花見ピクニック", good:true, say:[
        {sp:"jinguji", t:"桜の下で食べるお弁当、最高のリズムだね！ ……来年も、同じメンバーで来ようね"},
      ]},
      summer:{label:"夏祭りのサンバステージ", good:true, say:[
        {sp:"jinguji", t:"太鼓の音、来た！ ……ねえ、少しだけ踊っていい？ あんたのためだけの、一曲ね"},
      ]},
      autumn:{label:"紅葉の丘でピクニック", good:true, say:[
        {sp:"jinguji", t:"紅葉の丘って、舞台みたい。……観客はあんた一人、それが贅沢なの"},
      ]},
      winter:{label:"イルミネーションの広場", good:true, say:[
        {sp:"jinguji", t:"光の広場、キラキラだね。……私の舞より、あんたの笑顔の方が今日は眩しいよ"},
      ]},
    }, dateOutro:[
      {sp:"jinguji", t:"今日の私、誰にも見せてない笑顔ばっかりだった気がする。……あんただけの、特別公開だよ"},
      {sp:"narr", t:"帰り道、澪の足取りは小さなステップを刻んでいた。"},
    ], ev2:[
      {ep:"jinguji-ev2"},
      {sp:"narr", t:"夕日の河川敷。澪が小さな声で言った。"},
      {sp:"jinguji", t:"ねえ。私の舞は、誰かに届けたくて始めたの。……今は、一番届けたい人が決まってる"},
      {sp:"jinguji", t:"その人にだけ見せる舞もあるんだよ。……いつか、見せてあげる"},
    ], confessOk:[
      {sp:"jinguji", t:"……！ ほんとに？ やった……！ 私の舞、これからはあんたのためにも舞う。約束ね"},
      {sp:"narr", t:"神宮寺澪と、気持ちが通じ合った。舞う女と堅い男の、華やかな関係が始まった。"},
    ], confessNg:[
      {sp:"jinguji", t:"ごめんね……今の私は、まだ「観られる自分」から抜け出せてないの。あんたのせいじゃないよ"},
    ]},
  aisha: {title:"アイシャ・ラーマン", flirt:[
      [{sp:"aisha", t:"今日も、礼から始めてくれましたね。……そういう人を、私は信頼します"}],
      [{sp:"aisha", t:"シラットの手技、今度はもう少し近くで教えます。……心の準備は、できていますか"}],
      [{sp:"aisha", t:"あなたの国の武道も、私の国の武道も、根は同じです。……人を護るための、力です"}],
      [{sp:"narr", t:"アイシャに、バティック柄のスカーフを贈った。彼女の国の伝統の模様が、凛とした佇まいに似合うと思って。"},
       {sp:"aisha", t:"まあ……私の国のバティックを。心遣いが、礼にかなっています。……ありがとうございます、大切にします"}],
    ], ev1:[
      {ep:"aisha-ev1"},
      {sp:"narr", t:"アイシャの国の茶菓子を分けてもらった。穏やかな午後だった。"},
      {sp:"aisha", t:"遠い国で、私はいつも「礼儀正しい選手」と呼ばれてきました。……ですが、心を許すのとは別の話です"},
      {sp:"aisha", t:"心を許す相手は、人生で数人だけ。その一人に、あなたが入りつつあります"},
    ], dateIntro:[
      {sp:"narr", t:"思い切って、アイシャを休日の外出に誘った。稽古着でない彼女と会うのは、初めてだった。"},
      {sp:"aisha", t:"お誘い、ありがとうございます。……礼を尽くしてくださる方との時間、私も大切にします"},
    ], dateSpots:[
      {label:"彼女の国の料理の店", good:true, say:[
        {sp:"aisha", t:"故郷の味を用意してくださるなんて……。遠い国で、あなたの心遣いが一番のごちそうです"},
        {sp:"narr", t:"料理の説明をするアイシャの声は、いつもより少しだけ弾んでいた。"},
      ]},
      {label:"騒がしいフードコート", good:false, say:[
        {sp:"aisha", t:"……少し、騒がしかったですね。ですが、あなたと一緒の時間は、静かでなくても穏やかでした"},
        {sp:"narr", t:"帰りは静かな裏通りを選んだ。アイシャが小さく「お気遣い、感謝します」と言った。"},
      ]},
    ], dateSeason:{
      spring:{label:"桜の公園を散歩", good:true, say:[
        {sp:"aisha", t:"桜は、あなたの国の心ですね。……私の国にも、届けたい景色です"},
      ]},
      summer:{label:"夕涼みの川辺", good:true, say:[
        {sp:"aisha", t:"川の音は、祈りの声に似ています。……今日は、穏やかな一日でした"},
      ]},
      autumn:{label:"紅葉の庭園を訪ねる", good:true, say:[
        {sp:"aisha", t:"紅葉の庭は、礼の形をした自然ですね。……あなたと歩けて、光栄です"},
      ]},
      winter:{label:"温かいチャイと雪景色", good:true, say:[
        {sp:"aisha", t:"チャイの温かさは、人の温かさに似ています。……今日のあなたは、その両方を持っていますね"},
      ]},
    }, dateOutro:[
      {sp:"aisha", t:"今日の約束も、守れましたね。……あなたとの約束は、これからも増えていく気がします"},
      {sp:"narr", t:"帰り道、アイシャの礼の仕草に、いつもより温かみがあった。"},
    ], ev2:[
      {ep:"aisha-ev2"},
      {sp:"narr", t:"稽古の帰り道。アイシャが、静かに尋ねた。"},
      {sp:"aisha", t:"私は、約束を大切にします。一度交わした約束は、必ず守る。……あなたは、どうですか"},
      {sp:"aisha", t:"……その目を見れば、分かります。私たちは、きっと同じ約束ができます"},
    ], confessOk:[
      {sp:"aisha", t:"……はい。私も、同じ気持ちです。礼を尽くして、誠実に。……私たちは、きっと良い縁になります"},
      {sp:"narr", t:"アイシャ・ラーマンと、気持ちが通じ合った。静かで礼に満ちた、確かな関係が始まった。"},
    ], confessNg:[
      {sp:"aisha", t:"……その言葉、嬉しく受け取ります。ですが、今の私には、まだ武術の道が先にあります。許してください"},
    ]},
  yan: {title:"劉 燕", flirt:[
      [{sp:"yan", t:"ねえ、今のあんた、フォロワーがまた増えてるよ。……私の動画のおかげ、かもね？"}],
      [{sp:"yan", t:"地味って言ったの、撤回してもいい。あんたの戦い、近くで見ると迫力あるんだもん"}],
      [{sp:"yan", t:"今度の私の特番、あんたも出て。……隣にいると、数字が跳ねるの。あと、私が楽しいの"}],
      [{sp:"narr", t:"燕に、金の刺繍が躍る演武用の扇を贈った。SNS映えの大技には、映える道具がいるだろうと思って。"},
       {sp:"yan", t:"きゃー、金ピカ！ しかも刺繍が細かい！ ……これで次の動画、絶対バズるよ。あんた、意外とやり手だね"}],
    ], ev1:[
      {ep:"yan-ev1"},
      {sp:"narr", t:"撮影終わりの控室。燕が、カメラの前とは違う顔を見せた。"},
      {sp:"yan", t:"バズるって、疲れるの。数字の向こうの「私」を見てくれる人、ほとんどいなくて"},
      {sp:"yan", t:"あんたは違うもんね。私の技の「中身」を、最初に褒めてくれた人"},
    ], dateIntro:[
      {sp:"narr", t:"思い切って、燕を休日の外出に誘った。カメラの向こうでない彼女と会うのは、初めてだった。"},
      {sp:"yan", t:"へえ、あんたから誘うなんて珍しい。……いいよ、今日は数字なしの私を、あんたにだけ見せてあげる"},
    ], dateSpots:[
      {label:"下町の中華街で食べ歩き", good:true, say:[
        {sp:"yan", t:"分かってるじゃん！ 派手な店より、こういう本場の味。……あんたの隣で食べると、余計に美味しいの、なんでだろ"},
        {sp:"narr", t:"小籠包を頬張る燕は、配信の時よりずっと無防備に笑っていた。"},
      ]},
      {label:"高級フレンチのランチ", good:false, say:[
        {sp:"yan", t:"……美味しいけど、堅苦しくて肩が凝っちゃった。私たちには、もっとラフな方が似合うよね"},
        {sp:"narr", t:"店を出た瞬間、燕は大きく伸びをした。「次は私が選ぶ番ね」と笑った。"},
      ]},
    ], dateSeason:{
      spring:{label:"桜の下でお弁当", good:true, say:[
        {sp:"yan", t:"桜の下のお弁当、映えるのに今日は撮らないの。……あんたとの時間は、非公開が正解だもんね"},
      ]},
      summer:{label:"夏祭りの屋台巡り", good:true, say:[
        {sp:"yan", t:"屋台の列、私が並ぶからあんたは座ってて。……たまには、私に世話させて"},
      ]},
      autumn:{label:"紅葉の中華庭園", good:true, say:[
        {sp:"yan", t:"故郷みたいな庭で、紅葉。……あんたと歩くと、遠い国の景色も近く感じるね"},
      ]},
      winter:{label:"イルミネーションの街", good:true, say:[
        {sp:"yan", t:"街の光より、あんたの隣の方が今日の当たりだね。……数字じゃ測れないやつ"},
      ]},
    }, dateOutro:[
      {sp:"yan", t:"今日の私、再生数ゼロ。……でも、あんたの記憶には一生残るやつだよね。それでいいの"},
      {sp:"narr", t:"帰り道、燕はスマホを鞄の奥にしまったままだった。"},
    ], ev2:[
      {ep:"yan-ev2"},
      {sp:"narr", t:"夜の街。燕が小さく言った。"},
      {sp:"yan", t:"私、目立つのが好き。でもね……一番見てほしいのは、一人だけなんだ"},
      {sp:"yan", t:"その一人が、私の派手さじゃなく「私」を見てくれた時。……私は、きっと弱いよ"},
    ], confessOk:[
      {sp:"yan", t:"……！ 本気で言ってる？ ……やだ、カメラ回ってないのに、顔が熱い。……うん。私も、あんたしか見てない"},
      {sp:"narr", t:"劉燕と、気持ちが通じ合った。話題の中心にいる女の、たった一人の特等席が決まった。"},
    ], confessNg:[
      {sp:"yan", t:"ごめん……今のあんたは、まだ「数字のいい共演者」なの。それが変わったら、私から行くから"},
    ]},
  mariana: {title:"マリアナ・ドス・サントス", flirt:[
      [{sp:"mariana", t:"お、今日も寝技の稽古？ あたしの胸、借りたい？ ……実力は、貸し借りできないけどね"}],
      [{sp:"mariana", t:"あんたの根性、好きだよ。寝技は根性の勝負だからね"}],
      [{sp:"mariana", t:"ブラジルじゃ、道場は家族みたいなものなの。……あんたの道場も、そんな匂いがする"}],
      [{sp:"narr", t:"マリアナに、本場ブラジルのコーヒー豆とアサイーのお菓子を贈った。故郷の味を届けたかった。"},
       {sp:"mariana", t:"おお、ブラジルのコーヒー！ ……あんた、こういうところ優しいんだ。道場のみんなで飲もう。あんたの分は特別に濃く入れるよ"}],
    ], ev1:[
      {ep:"mariana-ev1"},
      {sp:"narr", t:"稽古終わり。マリアナと二人、道場の床に寝転んで天井を見た。"},
      {sp:"mariana", t:"故郷を離れて、ずっと一人で戦ってきた。……強いって言われるほど、弱さを見せる場所がなくなるんだ"},
      {sp:"mariana", t:"あんたの道場は、不思議だ。弱さを見せても、笑われない。……だから、好きだよ"},
    ], dateIntro:[
      {sp:"narr", t:"思い切って、マリアナを休日の外出に誘った。道着でない彼女と会うのは、初めてだった。"},
      {sp:"mariana", t:"お、デートの誘い？ ハハッ、いいね！ あたしの休日、あんたに預けるよ"},
    ], dateSpots:[
      {label:"海辺のバーベキューテラス", good:true, say:[
        {sp:"mariana", t:"肉と海と、あんた！ ブラジルの休日みたいで最高だよ。……故郷が恋しい時は、こういう時間が効くんだ"},
        {sp:"narr", t:"肉を焼くマリアナの手際は、寝技と同じくらい迷いがなかった。"},
      ]},
      {label:"静かな美術館", good:false, say:[
        {sp:"mariana", t:"……絵は悪くないけどさ、じっとしてると体がなまる気がして。あたしは動いてる方が性に合うね"},
        {sp:"narr", t:"館を出る頃、マリアナは出口の階段を一段飛ばしで駆け下りた。"},
      ]},
    ], dateSeason:{
      spring:{label:"桜の公園でサンドイッチ", good:true, say:[
        {sp:"mariana", t:"桜の下で食べるサンド、悪くないね！ ……日本にも、いい休日の形があるんだ"},
      ]},
      summer:{label:"ビーチでスイカ割り", good:true, say:[
        {sp:"mariana", t:"スイカ割り、ブラジルにはない文化だね。……目隠しでも、あんたの声があれば当てられるよ"},
      ]},
      autumn:{label:"紅葉の山のカフェ", good:true, say:[
        {sp:"mariana", t:"山の空気は、道場の朝みたいに澄んでる。……あんたと分け合うコーヒー、格別だね"},
      ]},
      winter:{label:"温かいフェジョアーダの店", good:true, say:[
        {sp:"mariana", t:"故郷の煮込みは、心まで温かくするんだ。……あんたにも、その温かさが伝わるといいな"},
      ]},
    }, dateOutro:[
      {sp:"mariana", t:"今日のあんた、心拍数上がってたね。……あたしもだよ。寝技じゃなくても、伝わるもんだね"},
      {sp:"narr", t:"帰り道、マリアナの笑い声が夕日の通りに響いていた。"},
    ], ev2:[
      {ep:"mariana-ev2"},
      {sp:"narr", t:"夕日の帰り道。マリアナが、真面目な顔で言った。"},
      {sp:"mariana", t:"寝技はね、相手の心拍まで分かる距離なの。……あんたと組んでると、私の心拍まで速くなる"},
      {sp:"mariana", t:"これが何なのか、あたしはもう気づいてる。……あんたは、どうかな"},
    ], confessOk:[
      {sp:"mariana", t:"ハハッ、やっと言ったね！ ……うん、あたしもだよ。心拍の速さは、嘘をつかないんだ"},
      {sp:"narr", t:"マリアナ・ドス・サントスと、気持ちが通じ合った。寝技の壁は、心の壁ではなかった。"},
    ], confessNg:[
      {sp:"mariana", t:"……ごめん。今のあたしは、まだマットの上のことで頭がいっぱいなんだ。あんたは悪くない"},
    ]},
  anna: {title:"アンナ・ヴォルコワ", flirt:[
      [{sp:"anna", t:"今日の投げ、悪くなかった。……私が「悪くない」と言うのは、褒めているということだ"}],
      [{sp:"anna", t:"評判の色など、私は見ない。あんたの腕と、戦績。それが全てだ"}],
      [{sp:"anna", t:"強い男は多い。だが、強さを持続できる男は少ない。……あんたは、後者だと思っている"}],
      [{sp:"narr", t:"アンナに、ロシアの紅茶と木苺のジャムを贈った。ジャムを入れて飲むのが、彼女の故郷の流儀だと聞いたからだ。"},
       {sp:"anna", t:"……よく調べたな。故郷の飲み方まで。……悪くない。いや、かなり嬉しい。礼を言う"}],
    ], ev1:[
      {ep:"anna-ev1"},
      {sp:"narr", t:"セミナーの後。アンナが短く、だが真摯に語った。"},
      {sp:"anna", t:"私は、人を信じるのが下手だ。裏切られた数が、多かったからな"},
      {sp:"anna", t:"だが、あんたの戦いには嘘がない。嘘のない男は、信じる価値がある"},
    ], dateIntro:[
      {sp:"narr", t:"思い切って、アンナを休日の外出に誘った。稽古着でない彼女と会うのは、初めてだった。"},
      {sp:"anna", t:"……休日に、私を？ ……いいだろう。あんたの選ぶ場所、見せてもらう"},
    ], dateSpots:[
      {label:"静かなロシア料理の店", good:true, say:[
        {sp:"anna", t:"……ボルシチの味は、裏切らない。あんたの選択も、今日は正しかったようだ"},
        {sp:"narr", t:"故郷の味に、アンナの表情がほんの少しだけ和らいだ。"},
      ]},
      {label:"賑やかなショッピングモール", good:false, say:[
        {sp:"anna", t:"……人が多すぎる。だが、あんたが隣にいたから、最後までいられた。それだけだ"},
        {sp:"narr", t:"人混みを抜けた先で、アンナは小さく息をついた。弱さを見せたのは、それだけだった。"},
      ]},
    ], dateSeason:{
      spring:{label:"桜の並木道を歩く", good:true, say:[
        {sp:"anna", t:"……桜は短い。だから、人は集まる。……あんたと見る時間は、短く感じないがな"},
      ]},
      summer:{label:"川辺のテラスで涼む", good:true, say:[
        {sp:"anna", t:"……夏の川辺は、稽古の後のようだ。……悪くない休み方だ"},
      ]},
      autumn:{label:"紅葉の森の小道", good:true, say:[
        {sp:"anna", t:"……森の秋は、故郷を思い出す。……懐かしさは、弱さではないと、最近思う"},
      ]},
      winter:{label:"雪景色と温かい紅茶", good:true, say:[
        {sp:"anna", t:"……雪と紅茶。それで十分な冬だ。……隣にあんたがいるなら、なお良い"},
      ]},
    }, dateOutro:[
      {sp:"anna", t:"今日の評価は……『悪くない』、ではない。『良かった』だ。……滅多に言わないことだ、覚えておけ"},
      {sp:"narr", t:"帰り道、アンナの歩調がこちらの歩調に、自然と合っていた。"},
    ], ev2:[
      {ep:"anna-ev2"},
      {sp:"narr", t:"雪の降る夜。アンナが珍しく、私的な話をした。"},
      {sp:"anna", t:"私の人生は、勝つか負けるかだった。……だが最近、第三の選択肢を考えるようになった"},
      {sp:"anna", t:"「隣に立つ」という選択肢だ。……相手は、もう決まっている"},
    ], confessOk:[
      {sp:"anna", t:"……そうか。私も、同じ結論に至っていた。……よろしく頼む。私の隣は、簡単な場所ではないぞ"},
      {sp:"narr", t:"アンナ・ヴォルコワと、気持ちが通じ合った。実力で認め合った二人の、静かな始まりだった。"},
    ], confessNg:[
      {sp:"anna", t:"……悪いが、今のあんたの戦績では、私の心は動かない。強くなってから、出直せ"},
    ]},
  miura: {title:"三浦 梓", flirt:[
      [{sp:"miura", t:"今日のセミナーも、ありがとうございました。……あなたの受けの美しさ、参加者の方が見惚れていましたよ"}],
      [{sp:"miura", t:"力で制するのではなく、力を流す。……あなたの戦い方には、その心があります"}],
      [{sp:"miura", t:"今度、うちの道場にも来てください。……お茶の美味しい店も、教えます"}],
      [{sp:"narr", t:"梓に、老舗の練り切りの詰め合わせを贈った。お茶の美味しい店を知る彼女に、合う和菓子を。"},
       {sp:"miura", t:"まあ、美しいお菓子……。食べるのがもったいないくらいです。……今度、お茶と一緒にいただきましょう"}],
    ], ev1:[
      {ep:"miura-ev1"},
      {sp:"narr", t:"セミナーの帰り道。梓と並んで歩いた。"},
      {sp:"miura", t:"護身を教える仕事は、「怖かった」という声を聞く仕事です。……だからこそ、強さの意味をいつも考えます"},
      {sp:"miura", t:"あなたの強さは、人を安心させる強さです。……そばにいると、私も安心します"},
    ], dateIntro:[
      {sp:"narr", t:"思い切って、梓を休日の外出に誘った。道着でない彼女と会うのは、初めてだった。"},
      {sp:"miura", t:"あら、お誘いですか。……ふふ、嬉しいです。今日は力を抜いて、流れに身を任せますね"},
    ], dateSpots:[
      {label:"川沿いの散歩と茶店", good:true, say:[
        {sp:"miura", t:"流れのある場所は、心が整います。……あなたの隣を歩くのも、同じくらい自然ですね"},
        {sp:"narr", t:"川面の光を見ながら、梓と他愛のない話をした。時間の流れまで、穏やかだった。"},
      ]},
      {label:"行列のできる人気スイーツ店", good:false, say:[
        {sp:"miura", t:"……並ぶ時間も悪くありませんでしたが、少し疲れましたね。力の使いどころは、選ばないといけません"},
        {sp:"narr", t:"結局、茶店に落ち着いた。梓は「やっぱり、こちらの流れですね」と笑った。"},
      ]},
    ], dateSeason:{
      spring:{label:"桜の川沿いを歩く", good:true, say:[
        {sp:"miura", t:"桜の花びらが川に流れる景色、合気の心みたいです。……受け流す美しさ、ですね"},
      ]},
      summer:{label:"緑陰の茶店で一服", good:true, say:[
        {sp:"miura", t:"緑の陰は、涼しい風の通り道です。……あなたの隣も、風の通りがいいんですよ"},
      ]},
      autumn:{label:"紅葉の神社へ参拝", good:true, say:[
        {sp:"miura", t:"神社の空気は、背筋が伸びますね。……今日のお誘い、心が整いました"},
      ]},
      winter:{label:"温泉街の足湯に浸かる", good:true, say:[
        {sp:"miura", t:"足湯の温かさは、体の流れを良くします。……心の流れも、今日は上々です"},
      ]},
    }, dateOutro:[
      {sp:"miura", t:"今日の流れは、穏やかで温かかったです。……この流れの先、また一緒に確かめましょう"},
      {sp:"narr", t:"帰り道、梓の歩調は川の流れのように、自然とこちらに寄り添っていた。"},
    ], ev2:[
      {ep:"miura-ev2"},
      {sp:"narr", t:"合気道の道場。梓が、稽古の後に小さく言った。"},
      {sp:"miura", t:"流れを変える、というのは合気の心です。……あなたと出会って、私の人生の流れも、静かに変わりました"},
      {sp:"miura", t:"この流れの先に、何があるのか。……確かめてみたいと、思っています"},
    ], confessOk:[
      {sp:"miura", t:"……はい。私も、同じ流れの中にいたいと、ずっと思っていました。……ありがとうございます"},
      {sp:"narr", t:"三浦梓と、気持ちが通じ合った。力を流す者同士の、穏やかな関係が始まった。"},
    ], confessNg:[
      {sp:"miura", t:"……その言葉、嬉しく受け取ります。ですが、今の私には、まだセミナーのことが先にあります。……少し、待っていただけますか"},
    ]},
  kirishima: {title:"霧島 沙耶", flirt:[
      [{sp:"kirishima", t:"いい記事が書けました。……あなたの言葉には、飾りがない。それが、一番の魅力です"}],
      [{sp:"kirishima", t:"取材者と選手の距離は、難しいんです。……近づきすぎると、書けなくなる。でも、離れすぎても書けない"}],
      [{sp:"kirishima", t:"次の試合、私は最前列で見ます。……記者の席じゃなく、一人の観客として、ね"}],
      [{sp:"narr", t:"沙耶に、特製のスクラップブックを渡した。彼女が書いた記事の切り抜きを、丁寧に綴じたものだ。"},
       {sp:"kirishima", t:"これ……私の記事、全部……？ ……記者が自分の記事を贈られるなんて、初めてです。……ありがとう。大切にします"}],
    ], ev1:[
      {ep:"kirishima-ev1"},
      {sp:"narr", t:"喫茶店での取材。沙耶が、ペンを置いて言った。"},
      {sp:"kirishima", t:"私は、選手の「負けた日」を書くのが一番好きなんです。……人の本質は、そこで出ますから"},
      {sp:"kirishima", t:"あなたの負けた日の記事、書きたい。……そして、勝った日の記事は、もっと書きたい"},
    ], dateIntro:[
      {sp:"narr", t:"思い切って、沙耶を休日の外出に誘った。記者の顔でない彼女と会うのは、初めてだった。"},
      {sp:"kirishima", t:"あら、取材ではなく、私を誘うんですか。……ふふ、今日はペンを置いて付き合います"},
    ], dateSpots:[
      {label:"古書店街と喫茶店", good:true, say:[
        {sp:"kirishima", t:"活字の匂いのする場所、落ち着きます。……あなたの言葉にも、同じ匂いがするんですよ"},
        {sp:"narr", t:"古書を眺める沙耶の横顔は、取材の時よりずっと柔らかかった。"},
      ]},
      {label:"テーマパーク", good:false, say:[
        {sp:"kirishima", t:"……賑やかすぎて、記事のネタばかり探してしまいました。書き手の悪い癖ですね"},
        {sp:"narr", t:"帰り道、沙耶は「次は静かな所がいいですね」と小さく笑った。"},
      ]},
    ], dateSeason:{
      spring:{label:"桜の見える喫茶店", good:true, say:[
        {sp:"kirishima", t:"桜の見える特等席。……記事の締切がない休日は、こうも穏やかなんですね"},
      ]},
      summer:{label:"夏祭りの屋台を回る", good:true, say:[
        {sp:"kirishima", t:"祭りの熱気は、文章の熱に似ています。……今日の熱は、私だけのものですね"},
      ]},
      autumn:{label:"紅葉の文芸散歩", good:true, say:[
        {sp:"kirishima", t:"紅葉と文学散歩。……書き手の休日として、完璧すぎて困ります"},
      ]},
      winter:{label:"雪の降る街の書店", good:true, say:[
        {sp:"kirishima", t:"雪の日の書店は、時間がゆっくり流れます。……あなたとの時間も、同じ速さがいい"},
      ]},
    }, dateOutro:[
      {sp:"kirishima", t:"今日のことは、記事には書きません。……私だけの未発表原稿として、大切にします"},
      {sp:"narr", t:"帰り道、沙耶の持つノートは、今日は一度も開かれなかった。"},
    ], ev2:[
      {ep:"kirishima-ev2"},
      {sp:"narr", t:"深夜の電話。沙耶の声は、いつもより柔らかかった。"},
      {sp:"kirishima", t:"記事にできない話が、増えてきました。……書き手の倫理としては困るんですが、一人の人間としては、悪くない気分です"},
      {sp:"kirishima", t:"あなたの物語の「筆者」じゃなく、「登場人物」になりたい時があるんです"},
    ], confessOk:[
      {sp:"kirishima", t:"……それは、記事には書けない言葉ですね。……はい。私の物語にも、あなたを登場させてください"},
      {sp:"narr", t:"霧島沙耶と、気持ちが通じ合った。書く者と書かれる者の、境界が溶けた瞬間だった。"},
    ], confessNg:[
      {sp:"kirishima", t:"……ごめんなさい。今の私は、まだ「書き手」でいたいんです。その言葉は、今日の取材ノートには書きません"},
    ]},
  ono: {title:"大野 千鶴", flirt:[
      [{sp:"ono", t:"毎度。……今日もいい食べっぷりだったね。あんたの体は、私が作ってるようなもんだ"}],
      [{sp:"ono", t:"寝不足の顔してるよ。……味噌汁、熱いの入れてあげるから、ちゃんと休みな"}],
      [{sp:"ono", t:"若い頃の私はね、選手の妻に憧れたこともあったの。……あら、今のは忘れて"}],
      [{sp:"narr", t:"千鶴に、老舗の鰹節と昆布の出汁セットを贈った。毎日、俺の体を作ってくれる人へのお礼に。"},
       {sp:"ono", t:"あらあら、いい鰹節じゃない。……あんたの体は私が作ってるんだから、材料も私が吟味するさ。……ありがとね"}],
    ], ev1:[
      {ep:"ono-ev1"},
      {sp:"narr", t:"閉店後の店。千鶴と二人、カウンターで茶を飲んだ。"},
      {sp:"ono", t:"食の仕事は、人の命を預かる仕事だと思ってる。……だから、あんたみたいに無茶する子は、放っておけないの"},
      {sp:"ono", t:"心配するのにも、理由がいるんだよ。……あんたは、その理由が多すぎる子だ"},
    ], dateIntro:[
      {sp:"narr", t:"思い切って、千鶴を休日の外出に誘った。店の外で会う彼女は、新鮮だった。"},
      {sp:"ono", t:"あらあら、私なんか誘ってどうするの。……ふふ、嬉しいじゃない。今日は店のことは忘れて、付き合うわよ"},
    ], dateSpots:[
      {label:"市場で食材の買い出し", good:true, say:[
        {sp:"ono", t:"目の付け所がいいね。市場の朝は、食の戦場みたいなもの。……あんたと回ると、仕入れも楽しいわ"},
        {sp:"narr", t:"魚や野菜を見る千鶴の目は、女将のもの。だが、隣を歩く姿は少しだけ少女のようだった。"},
      ]},
      {label:"ファストフード店", good:false, say:[
        {sp:"ono", t:"……たまにはいいけどね、私の舌には少し物足りないかな。……今度は私が作るから、期待してな"},
        {sp:"narr", t:"千鶴は笑って済ませたが、帰りに市場で夕食の食材を買い込んでいた。"},
      ]},
    ], dateSeason:{
      spring:{label:"桜の商店街を歩く", good:true, say:[
        {sp:"ono", t:"商店街の桜は、暮らしの桜だね。……あんたとの休日も、暮らしの一部になればいいのに"},
      ]},
      summer:{label:"朝市の夏野菜を選ぶ", good:true, say:[
        {sp:"ono", t:"夏野菜は、色で選ぶの。……あんたの体を作る材料だからね、私は本気だよ"},
      ]},
      autumn:{label:"紅葉と秋刀魚の市場", good:true, say:[
        {sp:"ono", t:"秋刀魚の目利き、あんたにも教えてあげようか。……家庭の味って、こういうところから始まるんだよ"},
      ]},
      winter:{label:"雪の日の鍋食材探し", good:true, say:[
        {sp:"ono", t:"冬は鍋に限るね。……今度、あんたのために特別な鍋を作ってあげる"},
      ]},
    }, dateOutro:[
      {sp:"ono", t:"今日はごちそうさま、私の方が楽しませてもらったね。……あんたの隣の席、悪くないわ"},
      {sp:"narr", t:"帰り道、千鶴は小さく鼻歌を歌っていた。"},
    ], ev2:[
      {ep:"ono-ev2"},
      {sp:"narr", t:"雨の夜。千鶴が、小さな声で言った。"},
      {sp:"ono", t:"私はね、人の背中を見てきた人生だった。作る側、支える側。……それが性に合ってる"},
      {sp:"ono", t:"でも、たまには思うの。……特定の誰かの、隣に座りたいってね"},
    ], confessOk:[
      {sp:"ono", t:"……あらあら、本気なの。……ふふ、いいわよ。あんたの健康と幸せは、私が台所から一生支えてあげる"},
      {sp:"narr", t:"大野千鶴と、気持ちが通じ合った。包容力のある女将の、温かい関係が始まった。"},
    ], confessNg:[
      {sp:"ono", t:"嬉しいこと言ってくれるね。……でも、今の私は、まだ「みんなの女将」でいたいの。ごめんね"},
    ]},
});

// ===== 同伴イベント（企画書第37節・第40節で第2章への差し込みが決定） =====
// 相手はガールズバーの店員ユイ（24歳・架空のサブキャラクター。口説き対象28名には含めない）。
// 食事→店へ同伴の流れ。評価は専用フラグ douhanScore（S.flags）で管理し、ROMANCE の affection は使わない。
// 終盤の評価分岐は game.js の {douhanEnd:true} ステップ処理が douhanScore で解決する。
Object.assign(STORY_CH2, {
ch2_douhan: {
title: "同伴 ― 夜の約束",
steps: [
{sp:"narr", t:"警備バイト先のビルで顔なじみになった、ガールズバーの店員ユイ（24歳）。出勤前の食事に誘われていた。「今日は私の出勤に合わせて、ご飯食べてから店まで一緒に行ってくれる？」"},
{sp:"narr", t:"食事をしてから、彼女の働く店へ同伴する約束だ。服装と行き先で、彼女の評価も、周囲の目も変わっていく。"},
{sp:"me", t:"（さて、何を着ていくか。夜の街に合わせるか、自分の色を出すか――）"},
{choice:[
{label:"作務衣でいく", fx:{douhan:2, sei:1, attention:1, flags:{douhanWear:"samue"}}, say:[
{sp:"narr", t:"待ち合わせ場所に作務衣で現れると、ユイは目を丸くしてから、声を上げて笑った。「作務衣！？ ……でも待って、めちゃくちゃ似合ってる。渋いし、他の人と被らない」"},
{sp:"narr", t:"通りすがりの常連客まで振り返る。CLASHの小ネタ投稿では「作務衣の武術家、夜の街に現る」と小さく話題になった。"},
]},
{label:"きちんとしたスーツでいく", fx:{douhan:1, flags:{douhanWear:"suit"}}, say:[
{sp:"narr", t:"ユイは上下を見て頷いた。「うん、安心感ある。お店の子にも紹介しやすいタイプ」堅実な評価だった。"},
]},
{label:"普段着のカジュアルでいく", fx:{douhan:0, fatigue:-3, flags:{douhanWear:"casual"}}, say:[
{sp:"narr", t:"ユイは「あ、普段通りなんだ」と小さく笑った。悪くはない。悪くはないが、特別感も薄かった。"},
]},
{label:"稽古帰りのジャージでいく", fx:{douhan:-1, aku:1, attention:1, flags:{douhanWear:"jersey"}}, say:[
{sp:"narr", t:"「え、その格好で来たの……？」ユイに突っ込まれ、周囲の視線も集まった。武術家らしいと言えば、らしいのだが。"},
]},
]},
{sp:"me", t:"（服装は決まった。次は、食事の行き先だ）"},
{choice:[
{label:"フードコート「ブレッドガーデン」で軽く食べる", fx:{douhan:1, money:-1500, attention:1, flags:{douhanPlace:"breadgarden"}}, say:[
{sp:"narr", t:"フードコート「ブレッドガーデン」。ユイは最初「同伴前って、もっと高い店かと思った」と笑ったが、好きなものを少しずつ選べる気軽さに、すぐに上機嫌になった。"},
{sp:"narr", t:"「飾らなくていいんだ、この人」――帰り際、彼女が小さく呟いたのが聞こえた。安さではなく、気楽さが刺さったようだ。"},
]},
{label:"予約した高級イタリアンで食べる", fx:{douhan:2, money:-18000, flags:{douhanPlace:"italian"}}, say:[
{sp:"narr", t:"静かな個室と丁寧な料理。ユイは「ちゃんと用意してくれたんだ」と嬉しそうだった。財布は大きく軽くなったが、評価は確実に上がった。"},
]},
{label:"大野千鶴の定食屋で腹ごしらえする", fx:{douhan:1, money:-3000, sei:1, flags:{douhanPlace:"ono"}}, say:[
{sp:"narr", t:"千鶴の定食は、味も量も間違いがなかった。ユイは「同伴前に定食屋って初めて。でも、こういうの嫌いじゃない」と笑った。"},
]},
{label:"焼肉で景気よくいく", fx:{douhan:1, money:-9000, fatigue:5, flags:{douhanPlace:"yakiniku"}}, say:[
{sp:"narr", t:"煙と笑い声の焼肉は、場の力で盛り上がった。出勤前に匂いが付くことだけ、ユイに軽く突っ込まれた。"},
]},
]},
{sp:"narr", t:"食事を終え、二人で夜の街を歩く。同伴は、店の入口をくぐるまでの時間も含めて「同伴」なのだと、ユイが教えてくれた。"},
{sp:"narr", t:"店に着くと、他のスタッフが「ユイ、同伴のお客さん、雰囲気ある人じゃん」とざわついた。席ではマナーを守り、長居はせず、彼女の仕事を邪魔しない。それが夜の街の礼儀だった。"},
{douhanEnd:true},
{week:true},
],
},
});
