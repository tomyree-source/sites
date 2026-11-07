// 第68節: 実在モデル組34名の段階的登場への再構成（企画書第68節）
// 方針: 第1章＝名前と顔が見えるカメオ（動画・投稿・記事・目撃）／第2章＝言葉を交わす・絡む／第3章＝直接対面。
// 秘伝系の達人は第1〜3章では「名前と映像・噂」に留め、格を落とさない。本格的な固有イベントや師匠枠の本筋は従来の登場章（debut）に残す。
// 笑いの濃度を優先する：各人の象徴的な口癖・持ちネタ・界隈での通称イメージを誇張した「分かる人には分かる」内輪ウケ寄り。
// 実在の人物の実名は出さない（全員架空名）。特定個人を貶める表現にはしない。
// 各場面には {ep:"<slug>"} でエピソードイラスト（assets/episodes/ep-<slug>.webp）を表示する。
// 既存セーブ互換：すべて追加方式。発火記録は S.seenEvents、間隔管理は S.flags.cameoLastWeek を使う。

// ---------- 第1章の固定ビート場面（game.js の BEATS から呼ばれる。STORY_CH1 へ後付け追加） ----------
Object.assign(STORY_CH1, {
cam1_shiina: {
title: "1分間の祭り",
steps: [
{sp:"narr", t:"稽古終わりにCLASHを開くと、再生数が跳ね上がっている動画があった。総合格闘家の椎名駆が仕掛ける『短時間マッチ企画』の、次回出場者募集の告知だった。"},
{ep:"shiina"},
{sp:"shiina", t:"ルールは簡単。1分間、全力で来い。勝ち負けより、爪痕だ。……お前らの一番熱い1分を、俺に見せてみろ"},
{sp:"narr", t:"人差し指を突き上げる決めポーズで動画は終わった。だが本当の祭りは、そこからだった。コメント欄が、ものの数分で最強論争の会場に変わっていた。"},
{sp:"narr", t:"「1分で決着がつくなら寝技は不利」「いや1分だからこそ一発が重い」「そもそも1分で強い弱いとは」――募集要項より、論争のほうが圧倒的に長い。"},
{fx:{attention:1}},
{sp:"narr", t:"椎名駆。界隈の中心に、こういう男がいる。覚えておこう。"},
{week:true},
],
},
cam1_takeru: {
title: "倒れない男の動画",
steps: [
{sp:"narr", t:"道場の後輩に「これ見てください」と回されてきた動画。短時間マッチ企画の名物『殴られ屋タケル』の密着だった。"},
{ep:"takeru"},
{sp:"narr", t:"タケルはガードをしない。両腕をだらりと下げ、相手の打撃をまともに受け続ける。だというのに、顔は終始、笑っている。"},
{sp:"takeru", t:"（インタビュアーに）痛くないんですか？ ……効いてますよ。でもね、効いてない顔をするのが、殴られ屋の仕事なんです"},
{sp:"narr", t:"動画の最後、倒れなかったタケルに相手選手のほうが手を合わせて頭を下げていた。コメント欄は称賛一色――かと思いきや、「ガードしないのは武術としてどうなのか」で、もう一つの論争が始まっていた。"},
{sp:"narr", t:"何を投稿しても論争になる。それがこの界隈の、通常運転だった。"},
{week:true},
],
},
cam1_fukaya: {
title: "型の実演動画",
steps: [
{sp:"narr", t:"映像研究のつもりで開いた配信アーカイブ。空手系配信者・深谷勇作が、正拳突きの型を黙々と実演していた。"},
{ep:"fukaya"},
{sp:"fukaya", t:"型は、嘘をつきません。組手の癖は、全部、型の中に答えがあります"},
{sp:"narr", t:"職人肌の解説に頷きかけた、その時だった。コメント欄に、界隈の定期便が届いた。『その型、実戦で使えるんですか？』"},
{sp:"narr", t:"深谷は画面越しに、にやりと笑った。『来ましたね、その質問。今日はその話をしましょう』――この論争、もう何年目になるのだろう。型と実戦。答えの出ない問いは、界隈の燃料であり続ける。"},
{fx:{attention:1}},
{week:true},
],
},
cam1_namioka: {
title: "舞うような演武",
steps: [
{sp:"narr", t:"CLASHのタイムラインに、思わず二度見する動画が流れてきた。中国武術の発信型パフォーマー、綾瀬莉央の長拳の演武だった。"},
{ep:"namioka"},
{sp:"narr", t:"ツインのお団子、龍のプリントの黒い武術服、ピンクのシューズ。低く腰を落とした構えから、跳んで、回って、着地する。舞踏のようで、芯は武術だった。"},
{sp:"narr", t:"再生数はうなぎ上り。だが武クラの反応は、素直な称賛では終わらない。『この動き、長拳のどの套路が元だ』『いや、あれは現代の編排だ』――出典を巡る査定が、深夜まで続いていた。"},
{sp:"narr", t:"綾瀬莉央。華やかさの裏で、界隈のおじさんたちを本気にさせる何かを持っている。"},
{week:true},
],
},
cam1_shinohara: {
title: "元王者の配信",
steps: [
{sp:"narr", t:"夜の自主練の合間、先輩に勧められた配信を開く。元キック王者の篠原悠真が、現役時代の試合を振り返りながら解説していた。"},
{ep:"shinohara"},
{sp:"shinohara", t:"この試合の3ラウンド、俺の右ストレートが当たった瞬間、全員立ったんですよ。……いや、本当ですよ？ 映像、巻き戻します？"},
{sp:"narr", t:"コメント欄は即座に査定班に変わった。『当たってはいる』『効いてはいない』『立ち上がったのは前の席の酔っ払いでは』。武勇伝は、界隈では盛れば盛るほど検証される。"},
{sp:"narr", t:"それでも篠原は笑って話し続ける。この図太さも、元王者の実力のうちなのかもしれない。"},
{week:true},
],
},
cam1_akai: {
title: "赤い男の目撃談",
steps: [
{sp:"narr", t:"地区大会の観戦に来た。すると会場のざわめきが一段大きくなった。入場してきた選手の姿に、全員が二度見していた。"},
{ep:"akai"},
{sp:"narr", t:"真っ赤な道着、黒帯、派手な金髪のウィッグ。往年の格闘ゲームの主人公そのままの格好で、男はリングに上がった。赤井ケン――コスプレ格闘家として話題の男だ。"},
{sp:"narr", t:"審判が近づき、しげしげとウィッグを見た。『……その髪は、規定内かね』『はい！ 気合です！』。会場がどっと沸いた。"},
{sp:"narr", t:"だが笑いは、試合開始30秒で止んだ。突きの速さも、受けの堅さも、紛れもなく本物だった。魅せることと強いことは、両立するらしい。"},
{fx:{attention:1}},
{week:true},
],
},
cam1_bushika: {
title: "馬の予告編",
steps: [
{sp:"narr", t:"道場のテレビで、新作アクション映画の予告編が流れた。主演は、馬の仮面のアクション俳優・武鹿。"},
{ep:"bushika"},
{sp:"narr", t:"予告編の中で武鹿は、大剣を振るい、敵をなぎ倒し、最後にカメラ目線で言い放った。『筋肉は、裏切らない』。共演者のインタビューでは、素顔を聞かれた瞬間に『秘密です』と即答していた。"},
{sp:"narr", t:"予告編のコメント欄には、映画の感想と同じくらい『まずスクワット』の書き込みがあった。あの男の持論は、出演作より先に広まっている。"},
{sp:"narr", t:"道場の先輩が呟いた。『……あの馬、ベンチプレス何キロ挙がるんだろうな』。誰も、映画の内容には触れなかった。"},
{week:true},
],
},
});

// ---------- BOTY（武クラ・オブ・ザ・イヤー）年末発表イベント ----------
// 各年の終わり（年が明けた直後の週）に CLASH 上で発表される年中行事。その年に実際に起きたエピソード
// （論争・カメオ・スペシャル・掲示板騒動など、S.seenEvents / S.beatsDone の発火週で判定）から候補を拾い、
// 足りない分は実在モデル組の持ちネタ固定候補で補う混成方式。
// 結果分岐: 主人公の名場面が大賞→清名+1・注目+2（ご祝儀）／主人公の笑われ役が大賞→悪名+1・注目+2／
// 実在モデル組や あるある が大賞→注目+1（界隈の賑わい）。
const BOTY_FIXED_CANDS = [
  {slug:"metsuking", label:"メツキング『目突きこそ最強』", blurb:"今年も証明はならなかった。だがゴーグルの規格は、また一つ厳しくなった"},
  {slug:"takeru", label:"殴られ屋タケルの鉄の笑顔", blurb:"年間被弾数は自己ベスト更新。それでも最後まで、笑顔は崩れなかった"},
  {slug:"bushika", label:"武鹿の『まずスクワット』", blurb:"どんな相談にもまずスクワット。気づけば界隈の合言葉になっていた"},
  {slug:"shiina", label:"椎名駆の短時間マッチ企画", blurb:"1分間の祭りは今年も大盛況。コメント欄の論争は、その100倍の長さだった"},
  {slug:"kusakabe", label:"草壁明弘の一喝コレクション", blurb:"『最近の若いのは』で始まる名調子。切り抜き動画は今年も伸び続けた"},
  {slug:"akai", label:"赤井ケンの赤い軍団（結成準備中）", blurb:"『弟子は全員、赤い道着』の宣言が独り歩き。本人はまだ一人も取っていない"},
  {slug:"minato", label:"椎名湊、解説を黙らせたカウンター", blurb:"実況の語彙が尽きた一戦。兄の煽り投稿だけが、やたらと元気だった"},
  {slug:"namioka", label:"綾瀬莉央の演武バズり", blurb:"舞うような長拳。今年も武クラのおじさんたちが出典査定で夜更かしした"},
];
function botyPlayCandidates(yearIdx){
  const w0 = yearIdx * 48 + 1, w1 = (yearIdx + 1) * 48;
  const inYear = w => typeof w === "number" && w >= w0 && w <= w1;
  const out = [];
  const seen = S.seenEvents || {};
  for (const key of Object.keys(seen)){
    if (!inYear(seen[key])) continue;
    if (key.indexOf("debate:") === 0){
      const did = key.slice(7);
      const def = (typeof DEBATE_POOL_DEFS !== "undefined") && DEBATE_POOL_DEFS[did];
      out.push({kind:"hero", label:"CLASH論争『" + (def ? def.title : did) + "』", blurb:"今年の論争の燃料その1。主人公の返しが切り抜かれて回った"});
    } else if (key === "sp_bbs_write" || key === "sp_bbs_expose" || key === "sp_bbs_court" || key === "sp_dojo_raid"){
      out.push({kind:"laugh", label:"匿名掲示板の書き込み騒動", blurb:"書いた、バレた、訴えた／訴えられた。界隈の年末らしい総括がこれだ"});
    } else if (key === "sp_rankfraud"){
      out.push({kind:"hero", label:"段位・経歴詐称の追及", blurb:"盛られた経歴は暴かれた。査定の厳しさに、界隈が少しだけ引き締まった"});
    } else if (key === "sp_bushika"){
      out.push({kind:"model", slug:"bushika", label:"武鹿との公開組手", blurb:"馬の仮面と本気の組手。『筋肉は裏切らない』は本当だったのか"});
    } else if (key === "sp_metsuking"){
      out.push({kind:"model", slug:"metsuking", label:"メツキングとの目突き決着", blurb:"ゴーグル着用の特別ルール。証明と安全、その両方を懸けた一戦だった"});
    } else if (key.indexOf("cam_") === 0 || key.indexOf("aru_") === 0){
      const ev = (typeof CAMEO_EVENTS !== "undefined") && CAMEO_EVENTS.find(e => e.id === key);
      if (!ev) continue;
      const slug = key.replace(/^cam_/, "").replace(/^aru_/, "").replace(/\d+$/, "");
      const c = CAST_BY_ID[slug];
      if (key.indexOf("aru_") === 0) out.push({kind:"aruaru", label:"武クラあるある『" + key.replace(/^aru_/, "") + "』", blurb:"誰の身にも覚えがある。それが あるある の怖さであり、面白さだ"});
      else if (c) out.push({kind:"model", slug:slug, label:c.name + "の登場場面", blurb:"今年の界隈に、あの人の持ちネタがまた一つ刻まれた"});
    }
  }
  // 第1章の固定ビート（カメオ目撃）も、その年の出来事として候補に入れる
  for (const bk of Object.keys(S.beatsDone || {})){
    const m = bk.match(/^(\d+):(cam1_.+)$/);
    if (!m || !inYear(Number(m[1]))) continue;
    const slug = m[2].replace(/^cam1_/, "");
    const c = CAST_BY_ID[slug];
    if (c) out.push({kind:"model", slug:slug, label:c.name + "の目撃談", blurb:"まだ画面や会場の向こうの人だった頃の、鮮烈な第一印象"});
  }
  if (S.flags.courtDone && inYear(S.flags.courtWeek)) out.push({kind:"laugh", label:"裁判バトル", blurb:"法廷でも戦った一年。結果より、そこに至る流れが全部ネタになった"});
  // 重複ラベルを除く
  const uniq = []; const used = {};
  for (const c of out){ if (!used[c.label]){ used[c.label] = true; uniq.push(c); } }
  return uniq;
}
function buildBotySteps(yearIdx){
  const age = 19 + yearIdx;
  const cands = botyPlayCandidates(yearIdx);
  const fixed = BOTY_FIXED_CANDS.slice(yearIdx % BOTY_FIXED_CANDS.length).concat(BOTY_FIXED_CANDS.slice(0, yearIdx % BOTY_FIXED_CANDS.length));
  for (const f of fixed){ if (cands.length >= 4) break; if (!cands.some(c => c.label === f.label)) cands.push({kind:"model", slug:f.slug, label:f.label, blurb:f.blurb}); }
  while (cands.length > 5) cands.splice(2 + Math.floor(_rng() * (cands.length - 2)), 1);
  const weights = cands.map(c => (c.kind === "hero" || c.kind === "laugh") ? 3 : 2);
  let tot = 0; for (const w of weights) tot += w;
  let r = _rng() * tot, wi = 0;
  for (let i = 0; i < cands.length; i++){ r -= weights[i]; if (r <= 0){ wi = i; break; } }
  const win = cands[wi];
  const steps = [
    {sp:"narr", t:"――年末。CLASHに、今年もあのスレッドが立った。『BOTY（武クラ・オブ・ザ・イヤー）』。" + age + "歳の年、界隈を最も沸かせたエピソードを決める、年末恒例の大騒ぎだ。"},
    {img:"otowa"},
    {sp:"otowa", t:"今年も実況はこの音羽響がお送りします！ 候補の発表です。……今年は例年にも増して、濃い候補が揃いました"},
  ];
  cands.forEach((c, i) => steps.push({sp:"narr", t:"【候補" + (i + 1) + "】" + c.label + " ―― " + c.blurb}));
  steps.push({img:"mira"});
  steps.push({sp:"mira", t:"集計は私のTier表チームが担当しました。異論は認めます。毎年のことですから"});
  if (win.slug) steps.push({ep:win.slug});
  steps.push({sp:"otowa", t:"では、発表します。今年のBOTYは――【" + win.label + "】！"});
  if (win.kind === "hero"){
    steps.push({sp:"narr", t:"コメント欄が沸いた。『文句なし』『あの場面は今年一番』。主人公の名場面が、年末の大賞をさらった。"});
    steps.push({fx:{attention:2, sei:1}});
    steps.push({choice:[
      {label:"受賞コメント「来年は試合で取ります」", say:[{sp:"narr", t:"謙虚な受賞コメントは、好感度を静かに押し上げた。"}], fx:{sei:1}},
      {label:"受賞コメント「当然の結果です」", say:[{sp:"narr", t:"堂々たる受賞コメント。賛否は割れたが、注目は集まった。"}], fx:{attention:1}},
      {label:"受賞コメント「まずスクワット、だそうです」", say:[{sp:"narr", t:"なぜか武鹿の持論で締めた。意味は不明だが、コメント欄は大いに沸いた。"}], fx:{attention:1, aku:1}},
    ]});
  } else if (win.kind === "laugh"){
    steps.push({sp:"narr", t:"コメント欄が沸いた。ただし、称賛というより爆笑で。『これは外せない』『今年一番笑った』。主人公は、笑われ役として年末の大賞をさらってしまった。"});
    steps.push({fx:{attention:2, aku:1}});
    steps.push({choice:[
      {label:"受賞コメント「笑ってもらえたなら本望です」", say:[{sp:"narr", t:"笑いを笑いで返す余裕に、かえって評価が上がった気配もある。"}], fx:{attention:1}},
      {label:"受賞コメント「来年は名場面で取り返します」", say:[{sp:"narr", t:"雪辱宣言は切り抜かれて拡散した。来年の候補は、もう一つ決まった。"}], fx:{attention:1}},
    ]});
  } else if (win.kind === "model"){
    steps.push({sp:"narr", t:"コメント欄が沸いた。『妥当』『あの持ちネタは別格』。今年の界隈の主役は、やはりあの人だった。"});
    steps.push({fx:{attention:1}});
    steps.push({sp:"narr", t:"自分の名前は呼ばれなかった。だが、この賑わいの輪の中にいることが、来年への燃料になる。"});
  } else {
    steps.push({sp:"narr", t:"コメント欄が沸いた。『全員に覚えがある』『うちの道場でも起きた』。誰か一人の話ではなく、界隈みんなの一年が大賞になった。"});
    steps.push({fx:{attention:1}});
  }
  steps.push({sp:"narr", t:"こうして" + age + "歳の年のBOTYは幕を閉じた。――なお、発表から30分後には『では本当の最強は誰か』の論争が始まっていた。来年の燃料は、もう仕込まれている。"});
  return steps;
}
function tryBotyScene(){
  if (!S || !S.flags) return false;
  if (!S.flags.botyDone || typeof S.flags.botyDone !== "object") S.flags.botyDone = {};
  const yearIdx = Math.floor((S.absWeek - 1) / 48);
  if (yearIdx <= 0) return false;
  const target = yearIdx - 1;
  if (S.flags.botyDone[target]) return false;
  for (let y = 0; y < target; y++){ if (!S.flags.botyDone[y]) S.flags.botyDone[y] = "skip"; }
  const intoYear = S.absWeek - yearIdx * 48; // 新年に入って何週目か（1〜48）
  if (intoYear > 4){ S.flags.botyDone[target] = "skip"; return false; }
  S.flags.botyDone[target] = true;
  if (typeof logEventFire === "function") logEventFire("boty", {id:"boty_" + target});
  startScene(buildBotySteps(target), () => goWeek());
  return true;
}

// ---------- 週末ランダム抽選のカメオプール（game.js の pickEndWeekEvent から引かれる） ----------
const CAMEO_EVENTS = [
// ===== 第1章（映像・噂・記事のカメオ）＋第2章でも拾える達人枠 =====
{id:"cam_makabe", category:"cameo", weight:2, chapters:[1,2], steps:[
  {sp:"narr", t:"武術雑誌の特集記事がCLASHで回ってきた。『消える動きの宗家』――古流武術の真壁鉄厳、74歳。"},
  {ep:"makabe"},
  {sp:"narr", t:"記事によれば、取材班が稽古場を訪ねた日、記者は三度、背後に立たれたことに気づかなかったという。一度目は挨拶の直後。二度目はカメラを構えた時。三度目は、『消える動きなど無い』と原稿に書きかけた、まさにその時だった。"},
  {sp:"narr", t:"コメント欄は案の定、『今の総合の選手に通じるのか』で割れた。通じるかどうかは誰にも分からない。ただ一つ確かなのは、誰も彼の前では、その質問を口に出せないということだ。"},
  {fx:{attention:1}},
]},
{id:"cam_shiramine", category:"cameo", weight:2, chapters:[1,2], steps:[
  {img:"genda"},
  {sp:"genda", t:"……白峰玄海という男を知っているか。合気の『神技』と呼ばれた人だ。小柄でな、握手すれば、こっちの腕がどこかへ行く"},
  {ep:"shiramine"},
  {sp:"me", t:"今の選手と戦ったら、どっちが強いんですか？"},
  {sp:"genda", t:"…………その質問が、この界隈を何十年も回り続けている答えだ。出た試しがないのにな"},
  {sp:"narr", t:"源田は遠くを見る目をした。伝説は、証明されないから伝説のままでいられる。最強論争とは、答えが出ないことを全員で楽しむ儀式なのかもしれない。"},
]},
{id:"cam_uema", category:"cameo", weight:2, chapters:[1,2], steps:[
  {sp:"narr", t:"CLASHで、沖縄の老師・上間巌の試し割り動画が拡散していた。赤瓦の束が、手刀一つで静かに割れる。"},
  {ep:"uema"},
  {sp:"narr", t:"動画は10秒。だがコメント欄の戦いは、その100倍の長さになった。争点は技の内容ではない。『瓦は何枚だったか』だ。"},
  {sp:"narr", t:"『4枚』『いや5枚だ、影を見ろ』『スロー再生した、私は6枚と見る』――誰も割った男の話をしていない。枚数の査定だけで、夜が更けていった。"},
  {fx:{attention:1}},
]},
{id:"cam_kumagai", category:"cameo", weight:2, chapters:[1,2], steps:[
  {sp:"narr", t:"バイト先の休憩中、先輩が武勇伝ならぬ『聞いた話』を始めた。古流合気柔術の熊谷源蔵――『透明な力』と呼ばれた怪物がいる、という噂話だ。"},
  {ep:"kumagai"},
  {sp:"narr", t:"「触れた瞬間、相手の力が消えるんだと」「弟子が百人、束になっても止められなかったらしい」「……それ、先月聞いた時は五十人だったぞ」"},
  {sp:"narr", t:"伝説は、語られるたびに少しずつ大きくなる。それでも全員が聞き入ってしまうのは、その巨躯と厳しい顔つきの写真が、噂に妙な説得力を与えているからだった。"},
]},
{id:"cam_namikawa", category:"cameo", weight:2, chapters:[1,2], steps:[
  {sp:"narr", t:"商店街をナンバ歩きで颯爽と歩く男の動画が話題になっていた。並河宗助。同じ側の手と足を同時に出す、古い日本の歩き方を広める伝道者だ。"},
  {ep:"namikawa"},
  {sp:"narr", t:"動画の何が面白いって、その後に続く『真似してみた』投稿の数々だ。若手選手から一般の人まで、全員がぎこちなくロボットのように歩いている。本人だけが、涼しい顔で滑るように進んでいく。"},
  {sp:"narr", t:"「歩き方一つでここまで違うのか」――最強論争の外側にも、武術の深い沼は広がっていた。"},
]},
{id:"cam_morioka", category:"cameo", weight:2, chapters:[1,2], steps:[
  {sp:"narr", t:"運動科学の研究者・森岡俊平の『ゆる』の体操動画を、ケアの参考に開いてみた。"},
  {ep:"morioka"},
  {sp:"narr", t:"眼鏡の研究者は、手帳片手に淡々と語る。曰く、力みを抜くことが、あらゆる動きの土台になるのだと。本人は終始いたって真面目で、穏やかだ。"},
  {sp:"narr", t:"だがコメント欄だけがざわついていた。『ゆるい動きで本当に強くなれるのか』――結局、この界隈はどんな話題も最後は強さの話になる。それが、少しだけ可笑しかった。"},
]},
// ===== 第2章（言葉を交わす・絡む） =====
{id:"cam_sakai", category:"cameo", weight:2, chapters:[2], steps:[
  {sp:"narr", t:"大会の解説ブースの前で、元トップ選手の解説者・堺聡志に声をかけられた。提げたグローブが、解説者の勲章みたいに見えた。"},
  {ep:"sakai"},
  {fx:{meet:["sakai"]}},
  {img:"sakai"},
  {sp:"sakai", t:"あんたの試合、解説席から見てたよ。……悪くない。ただ、3ラウンドの入り方、あれは若さじゃなくて癖だ。直せるうちに直しな"},
  {sp:"narr", t:"毒舌で知られる男の言葉は、意外なほど具体的で、全部が図星だった。大きな寝耳を間近で見ながら、解説の席に座る者の目の確かさを思い知った。"},
  {fx:{attention:1}},
]},
{id:"cam_kusakabe", category:"cameo", weight:2, chapters:[2], steps:[
  {sp:"narr", t:"レジェンドご意見番・草壁明弘の配信が切り抜かれて回ってきた。今週の標的は――俺だった。"},
  {ep:"kusakabe"},
  {sp:"kusakabe", t:"最近の若いのはな、まず構えが甘い。甘い構えで何を語る。……だがな、あの小僧の目だけは悪くない。目だけは、黎明期の連中に似ておる"},
  {sp:"narr", t:"一喝、二喝、最後に小さく褒める。コメント欄は『今日も三段活用が冴えてる』『褒めた！ 今の褒めたぞ！』と祭り状態だった。斬られるのも、界隈では勲章のうちらしい。"},
  {fx:{attention:1}},
]},
{id:"cam_misaki", category:"cameo", weight:2, chapters:[2], steps:[
  {sp:"narr", t:"格闘技の歴史を辿る特集番組で、黎明期のレジェンド・岬宗久の往年の映像が流れた。"},
  {ep:"misaki"},
  {sp:"narr", t:"若いファイターの打撃を、穏やかな笑顔で受け止め続ける映像だった。スタジオの解説陣が口を揃えた。『この人の前では、みんな少しだけ、いい選手になるんですよ』"},
  {sp:"narr", t:"CLASHの反応も珍しく穏やかだった。たまには論争のない夜もある。……と思った矢先、『では現代の王者と戦えば』の投稿が伸び始めていた。やっぱり通常運転だった。"},
]},
{id:"cam_minato", category:"cameo", weight:2, chapters:[2], steps:[
  {sp:"narr", t:"椎名湊の試合映像が回ってきた。椎名駆の弟。兄と違って無駄な煽りを一切せず、ただ静かに、正確に勝つ。"},
  {ep:"minato"},
  {sp:"narr", t:"解説が言葉を失う場面が三度あった。カウンターが決まるたび、実況の語彙が減っていく。最後は『……いや、今のは、はい』になっていた。"},
  {sp:"narr", t:"そして極めつけは兄の投稿だった。『弟は俺より強い。異論は認める。かかってこい』――煽りの矛先が、なぜか全方向に向いている。兄弟で界隈の燃料を担っていた。"},
  {fx:{attention:1}},
]},
{id:"cam_amaha", category:"cameo", weight:2, chapters:[2], steps:[
  {sp:"narr", t:"CLASHで、人気ファイターの天羽琉聖に名指しで絡まれた。派手な入場と煽りで知られる男だ。"},
  {ep:"amaha"},
  {fx:{meet:["amaha"]}},
  {sp:"amaha", t:"おい、正統派の看板さんよ。地味な試合運びだな？ 客は退屈してるぜ。次やる時は、俺みたいに魅せてみせろ"},
  {choice:[
    {label:"「魅せるのは結構。だが最後に立っているのは俺だ」と返す", say:[
      {sp:"amaha", t:"はっ、言うじゃねえか！ その返し、嫌いじゃないぜ"},
      {fx:{attention:2, aku:1}},
      {sp:"narr", t:"応酬は切り抜かれて拡散した。煽り合いは、界隈の名刺代わりだった。"},
    ]},
    {label:"「勉強させてもらいます」と丁寧に返す", say:[
      {sp:"amaha", t:"……なんだ、つまんねえ返しだな。まあ、真面目なのは嫌いじゃないけどよ"},
      {fx:{sei:1, attention:1}},
      {sp:"narr", t:"煽りは不発に終わったが、『煽りを丁寧に受け止める男』として、別の意味で切り抜かれていた。"},
    ]},
  ]},
]},
{id:"cam_kiryu", category:"cameo", weight:2, chapters:[2], steps:[
  {sp:"narr", t:"CLASHの論争に割って入ってきた男がいる。アウトロー出身の人気ファイター、霧生恭也。三白眼の睨みは、画面越しでも圧があった。"},
  {ep:"kiryu"},
  {fx:{meet:["kiryu"]}},
  {sp:"kiryu", t:"ごちゃごちゃ言う前に、一つ聞く。……お前、路上で本気でやったことあるか？"},
  {sp:"narr", t:"返答に詰まっていると、霧生は急に笑った。『冗談だ。リングの外の話は、リングの外に置いておけ』。怖い顔の男の、案外まっとうな線引きだった。"},
  {fx:{attention:1}},
]},
{id:"cam_kurose", category:"cameo", weight:2, chapters:[2], steps:[
  {sp:"narr", t:"最強論争のスレッドに、アウトロー系論客の黒瀬豪が現れた。太いゴールドチェーンと開襟シャツ。登場しただけで、場の空気が変わった。"},
  {ep:"kurose"},
  {fx:{meet:["kurose"]}},
  {sp:"kurose", t:"お前ら、型だのルールだの、机の上の話が好きだな。いいか、強さってのはな……まあ、続きは俺の配信で話す"},
  {sp:"narr", t:"持論の核心は語らず、宣伝だけ残して去っていった。コメント欄は『掴まれた』『場を全部持っていった』と騒然。物言いで場を掴むとは、こういうことらしい。"},
  {fx:{attention:1}},
]},
{id:"cam_shinohara2", category:"cameo", weight:2, chapters:[2], steps:[
  {sp:"narr", t:"大会の控室で、解説席帰りの篠原悠真と居合わせた。第1章の頃、配信で見ていた元王者だ。"},
  {ep:"shinohara"},
  {fx:{meet:["shinohara"]}},
  {img:"shinohara"},
  {sp:"shinohara", t:"お、君か。今日の試合、解説してたよ。……俺の現役時代の3ラウンド目に、ちょっと似てたな。いや本当だって。信じてない顔だな？"},
  {sp:"narr", t:"武勇伝の査定で盛り上がるコメント欄を思い出し、思わず笑ってしまった。だがその目の確かさは本物で、試合の要点を二つ、三つ、的確に挙げてみせた。"},
  {fx:{attention:1}},
]},
{id:"cam_sugiura", category:"cameo", weight:1, chapters:[2], steps:[
  {sp:"narr", t:"身体操法の研究者・杉浦玄道の対談記事が回ってきた。『触れていないのに、相手が動く』――その実演の話だった。"},
  {ep:"sugiura"},
  {sp:"narr", t:"記事の翌日、道場の若手がさっそく再現に挑んでいた。結果は、挑んだ本人がそのまま畳に転がった。『違う、そうじゃない』と、周りは大爆笑だった。"},
  {sp:"narr", t:"理屈は記事で読める。だが体は、記事では動かない。当たり前のことを、転がった後輩が身をもって教えてくれた。"},
]},
{id:"cam_miyake", category:"cameo", weight:1, chapters:[2], steps:[
  {sp:"narr", t:"物理学者でもある合気の達人・三宅理一郎の対談が、界隈で小さな騒ぎになっていた。"},
  {ep:"miyake"},
  {sp:"narr", t:"『合気は物理で説明できる』という師の言葉を巡って、門下の受け止めが真っ二つに割れたのだ。説明できる派と、説明してほしくない派。"},
  {sp:"narr", t:"結局、どちらの派も師の稽古には皆勤している。理屈で揉めて、体では全員が納得している。それが武術の面白いところだった。"},
]},
{id:"cam_saeki", category:"cameo", weight:1, chapters:[2], steps:[
  {sp:"narr", t:"当身と殺活法の研究家・佐伯宗一郎のコラムがCLASHで回ってきた。古い巻物をもとに、急所の伝承を検証する内容だ。"},
  {ep:"saeki"},
  {sp:"narr", t:"だがコメント欄の争点は、コラムの結論ではなかった。『その急所、本当はこっちじゃないのか』――場所を巡る査定合戦が始まっていた。"},
  {sp:"narr", t:"誰も試せない。試したら大事になる。だからこそ永遠に揉められる。急所論争は、界隈で最も安全な戦場だった。"},
]},
{id:"cam_asahina", category:"cameo", weight:1, chapters:[2], steps:[
  {sp:"narr", t:"合気柔術の師範・朝比奈義久の演武映像が回ってきた。大きな門人の突進を、閉じた扇子を手に、柔らかく流してみせる。"},
  {ep:"asahina"},
  {sp:"narr", t:"コメント欄が沸いたのは、技そのものより所作のほうだった。『扇子の畳み方が美しい』『あの余裕が格だ』。"},
  {sp:"narr", t:"強い、の手前にある『格好いい』。それもまた、人が武術に惹かれる立派な理由だった。"},
]},
{id:"cam_higa", category:"cameo", weight:1, chapters:[2], steps:[
  {sp:"narr", t:"沖縄で中国武術を伝える老師・比嘉康雄の稽古映像が届いた。海辺のテラスで、門人たちが型をそろえる。"},
  {ep:"higa"},
  {sp:"narr", t:"のどかな景色と、笑い皺の深い穏やかな顔。その所作だけが、恐ろしく鋭い。落差に、思わず見入ってしまった。"},
  {sp:"narr", t:"コメント欄も珍しく和やかだった。『こういう歳の取り方をしたい』が最上位。論争の絶えない界隈にも、みんなが同じ景色を見る日はある。"},
]},
{id:"cam_aragaki", category:"cameo", weight:2, chapters:[2], steps:[
  {sp:"narr", t:"沖縄空手出身の総合格闘家・新垣翔太の試合映像が話題だった。ケージの中で、空手着の上衣を開けて構える異色のスタイル。"},
  {ep:"aragaki"},
  {sp:"narr", t:"決着は、教科書どおりの前蹴り一発だった。解説が思わず叫んだ。『空手だ……！ 今のはまごうことなき、空手の蹴りだ……！』"},
  {sp:"narr", t:"CLASHでは『伝統派は終わった』の常連たちまで静かだった。一発の説得力は、千の論より重い。"},
  {fx:{attention:1}},
]},
// ===== 第3章（直接対面。達人は映像・噂のまま格を保つ） =====
{id:"cam_shiina3", category:"cameo", weight:3, chapters:[3], steps:[
  {sp:"narr", t:"興行の打ち合わせの場に、椎名駆本人が現れた。短時間マッチ企画の仕掛け人。第1章の頃、画面越しに見ていた男が、今は同じテーブルにいる。"},
  {ep:"shiina"},
  {fx:{meet:["shiina"]}},
  {img:"shiina"},
  {sp:"shiina", t:"あんたの試合、見てるよ。正統派で、地味で、強い。……だからこそだ。俺の企画に出てみないか？ 1分間、あんたの正統を全開にしてみせろ"},
  {choice:[
    {label:"「面白そうだ。出場を前向きに考える」と答える", say:[
      {sp:"shiina", t:"決まりだな。……人差し指は、こうやるんだ。練習しておけよ"},
      {fx:{attention:2}},
      {sp:"narr", t:"決めポーズを真顔で指南された。界隈の中心にいる男は、爪痕の残し方まで設計していた。"},
    ]},
    {label:"「自分の戦いに集中したい」と丁寧に断る", say:[
      {sp:"shiina", t:"堅いな。……まあ、その堅さがあんたの商品だ。気が変わったら言え。枠は空けておく"},
      {fx:{sei:1}},
      {sp:"narr", t:"引き際も鮮やかだった。売れる企画屋は、断られ方まで計算のうちなのかもしれない。"},
    ]},
  ]},
]},
{id:"cam_minato3", category:"cameo", weight:2, chapters:[3], steps:[
  {sp:"narr", t:"兄の企画の控室で、椎名湊と居合わせた。言葉数は少ない。だが、座っているだけの男から、目が離せなかった。"},
  {ep:"minato"},
  {fx:{meet:["minato"]}},
  {img:"minato"},
  {sp:"minato", t:"……兄の煽りは、気にしなくていい。あれは仕事だ。俺たちは、リングの中で全部やる"},
  {sp:"narr", t:"それだけ言って、湊は静かに目を閉じた。試合前のルーティンらしい。喋る兄と、黙る弟。対象的な二人が、同じ時代の中心にいた。"},
  {fx:{attention:1}},
]},
{id:"cam_kurose3", category:"cameo", weight:3, chapters:[3], steps:[
  {sp:"narr", t:"黒瀬豪から、公開討論の誘いが届いた。第2章の論争の続きを、今度は観客の前でやろうというのだ。"},
  {ep:"kurose"},
  {fx:{meet:["kurose"]}},
  {img:"kurose"},
  {sp:"kurose", t:"いいか、討論に勝ち負けはねえ。場を掴んだほうが勝ちだ。……お前、掴めるか？"},
  {choice:[
    {label:"「掴みにいく。リングでも、言葉でも」と答える", say:[
      {sp:"kurose", t:"はっ、いい目だ。その意気やよし。……当日は手加減しねえぞ"},
      {fx:{attention:2, aku:1}},
      {sp:"narr", t:"公開討論の日程が決まった。言葉のリングも、立ってみれば意外と熱い場所だった。"},
    ]},
    {label:"「言葉より、試合で語りたい」と断る", say:[
      {sp:"kurose", t:"……ふん、つまらねえ男だ。だが、そういう頑固な奴が一番長く残るのも知ってる"},
      {fx:{sei:1}},
      {sp:"narr", t:"断ったはずなのに、なぜか評価が上がっていた。論客の物差しは、最後まで掴めなかった。"},
    ]},
  ]},
]},
{id:"cam_amaha3", category:"cameo", weight:2, chapters:[3], steps:[
  {sp:"narr", t:"計量会場で天羽琉聖と鉢合わせた。派手な笑みは、間近で見ると宣材写真の三倍増しだった。"},
  {ep:"amaha"},
  {fx:{meet:["amaha"]}},
  {img:"amaha"},
  {sp:"amaha", t:"よお、正統派。今日も地味に勝つつもりか？ 客はな、勝ち方にも金を払ってんだぜ"},
  {sp:"me", t:"あんたの派手さは認める。だが、派手なだけじゃ立てない場所がある"},
  {sp:"amaha", t:"……っは！ 言うようになったじゃねえか。その調子で来い。退屈な相手は御免だ"},
  {sp:"narr", t:"煽り合いは、界隈流の挨拶だった。言い合える相手がいることも、実力の証明のうちだった。"},
  {fx:{attention:1}},
]},
{id:"cam_kiryu3", category:"cameo", weight:2, chapters:[3], steps:[
  {sp:"narr", t:"大会後の通路で、霧生恭也とすれ違った。三白眼が、まっすぐこちらを見た。"},
  {ep:"kiryu"},
  {fx:{meet:["kiryu"]}},
  {img:"kiryu"},
  {sp:"kiryu", t:"……いい試合だった。特に最後、引かなかったとこ"},
  {sp:"narr", t:"それだけ言って、霧生は手を差し出した。睨み合いのような出会いから数年。握手の手は、思いのほか温かかった。"},
  {sp:"narr", t:"怖い顔と、まっとうな中身。その落差を知っている者が、界隈では少しずつ増えている。"},
  {fx:{attention:1}},
]},
{id:"cam_ando3", category:"cameo", weight:1, chapters:[3], steps:[
  {sp:"narr", t:"78歳の老師・安藤歩の講習会のレポートが回ってきた。徒歩で各地を巡る、小柄な身体操法の達人だ。"},
  {ep:"ando"},
  {sp:"narr", t:"今回の逸話は『会場まで、電車賃を惜しんで三県分歩いた』だった。前回は二県分。その前は『そもそも招いた側が、到着日を計算できなかった』。"},
  {sp:"narr", t:"継ぎ当てのある道着と、明るい笑顔。強さの話を誰もしないのに、全員がこの人の話になると笑顔になる。そういう達人も、いる。"},
]},
{id:"cam_kiyose3", category:"cameo", weight:1, chapters:[3], steps:[
  {sp:"narr", t:"『美しい合気道』の若手実力者、清瀬涼介の演武映像が回ってきた。投げられる側の受け身まで含めて、一幅の絵のようだった。"},
  {ep:"kiyose"},
  {sp:"narr", t:"コメント欄では『美しさは強さに含まれるのか』という、珍しく上品な論争が起きていた。結論は出なかったが、珍しく誰も荒れなかった。"},
  {sp:"narr", t:"交流稽古の誘いがあるという噂も流れている。いつか同じ畳に立つ日が来るのかもしれない。"},
]},
{id:"cam_sakakibara3", category:"cameo", weight:1, chapters:[3], steps:[
  {sp:"narr", t:"伝統派空手の第一人者・榊原剛の特集が組まれていた。『型は嘘をつかない』――その言葉が、見出しになって独り歩きしている。"},
  {ep:"sakakibara"},
  {sp:"narr", t:"CLASHでは、さっそくその名言を掲げた論争が始まっていた。『では組手は何だ』『嘘をつくのは人間のほうだ』。言葉は本人の手を離れ、界隈の共有物になっていく。"},
  {sp:"narr", t:"当の本人は、記事について何も語っていない。ただ黙って、今日も正拳を突いているのだろう。"},
]},
{id:"cam_iwaki3", category:"cameo", weight:1, chapters:[3], steps:[
  {sp:"narr", t:"剛心会館長・岩城章吾の『百人組手』の特集記事を読んだ。フルコンタクト空手の伝説的な荒行だ。"},
  {ep:"iwaki"},
  {sp:"narr", t:"記事の隅の小さなコラムが面白かった。達成当時、対戦者の数を数える係が途中で混乱し、最後は全員で数え直したという。伝説の裏側には、いつも人間のうっかりがある。"},
  {sp:"narr", t:"それでも百人と戦い抜いた事実は、数え直しても変わらない。逸話の可笑しさと、実績の重さは、両立する。"},
]},
{id:"cam_kazama3", category:"cameo", weight:1, chapters:[3], steps:[
  {sp:"narr", t:"古流合気体術の風間俊樹の演武映像が届いた。宗家直伝を継ぐ若手の実力者。黒の稽古着の所作に、一切の無駄がない。"},
  {ep:"kazama"},
  {sp:"narr", t:"映像の再生回数より、止めた回数のほうが多いに違いない。何が起きたのか分からず、巻き戻して、首を傾げる。解説の投稿がつくまで、コメント欄は『？』で埋まっていた。"},
  {sp:"narr", t:"分からない、は古流の入口だ。その『？』の向こうに、何百年分の蓄積がある。"},
]},
{id:"cam_kurashina3", category:"cameo", weight:1, chapters:[3], steps:[
  {sp:"narr", t:"俳優でもある古武道家・倉科尚人の時代劇映画が話題になっていた。見所は主演の殺陣だという。"},
  {ep:"kurashina"},
  {sp:"narr", t:"武クラの反応は速かった。『あの居合の所作は本物だ』『腰の入り方が違う』。映画の感想より先に、型の査定が始まっていた。"},
  {sp:"narr", t:"演技と本物。その境界の話で盛り上がれるのも、この界隈の楽しみ方の一つだった。"},
]},
// ===== 武クラあるある小ネタ（全章共通。既存の論争・日常の空気に接続） =====
{id:"aru_loop", category:"aruaru", weight:2, chapters:[1,2,3], steps:[
  {sp:"narr", t:"CLASHの最強論争を何気なく眺めていた。打撃派、組技派、寝技派。三人の主張が、完璧な円を描いて回っている。"},
  {sp:"narr", t:"「距離が開けば打撃」「組み付けば終わり」「寝技に持ち込めば」――30分後、まったく同じ三つの文が、まったく同じ順番で流れてきた。誰も譲らず、誰も飽きず、誰も結論を欲しがっていない。"},
  {img:"mira"},
  {sp:"mira", t:"この論争、私が中学生の頃から同じ形で回ってるんですよ。……もはや伝統芸能ですね"},
  {sp:"narr", t:"伝統芸能。なるほど、それで全員、型どおりに楽しそうなわけだ。"},
  {fx:{attention:1}},
]},
{id:"aru_seminar", category:"aruaru", weight:2, chapters:[1,2,3], steps:[
  {sp:"narr", t:"他流派のセミナーに参加した。講師の実演は素晴らしかった。ただ、質疑応答の時間が、静かに侵食されていった。"},
  {sp:"narr", t:"最前列の常連さんの質問が長い。『先生、私の場合はですね、前に一度、道場で――』。それは質問ではなく、もはや体験談の発表会だった。"},
  {sp:"narr", t:"講師は笑顔で受け止め、時計は静かに進み、予定していた実技は最後の10分に圧縮された。セミナーあるあるとは、全国共通の様式美である。"},
  {fx:{attention:1}},
]},
{id:"aru_dan_i", category:"aruaru", weight:2, chapters:[1,2,3], steps:[
  {sp:"narr", t:"交流会で、年配の参加者の自己紹介を聞いていた。『○○流、七段をいただいております』"},
  {sp:"narr", t:"去年会った時は、五段だった気がする。一昨年は、四段だった気がする。昇段の速度が、稽古量ではなく暦に比例している人というのは、どこの界隈にもいる。"},
  {sp:"narr", t:"本当の段位は、帯や証書ではなく、動きの最初の一歩でばれる。本人も周りも、本当は分かっている。だから誰も、口には出さないのだった。"},
]},
{id:"aru_dojo", category:"aruaru", weight:2, chapters:[1,2,3], steps:[
  {sp:"narr", t:"稽古前の道場。入門したばかりの若者が、壁の鏡の前で、誰も見ていないと思って決めポーズの練習をしていた。"},
  {sp:"narr", t:"先輩たちは全員、見て見ぬふりをした。なぜなら全員、入門したての頃に同じことをしていたからだ。鏡の前の儀式は、道場の隠れた通過礼である。"},
  {sp:"narr", t:"若者はこちらの視線に気づいて真っ赤になった。『……おつかれさまです！』。大丈夫だ。その恥ずかしさも含めて、稽古のうちだ。"},
  {fx:{attention:1}},
]},
{id:"aru_kata", category:"aruaru", weight:2, chapters:[1,2,3], steps:[
  {sp:"narr", t:"道場の給湯室で、型派の先輩と実戦派の先輩が、お茶を片手に火花を散らしていた。"},
  {sp:"narr", t:"「型は約束事の反復だ。本番で出るわけがない」「その約束事を千回やった体の動きが、本番で出るんだ」――水掛け論とは、水を掛け合うからそう呼ぶのだと、今日ほど実感した日はない。"},
  {sp:"narr", t:"結局、二人ともお茶をお代わりして解散した。決着は、来週の給湯室に持ち越された。それでいいのだと思う。"},
]},
];
