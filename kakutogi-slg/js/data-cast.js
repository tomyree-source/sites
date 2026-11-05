// キャストデータ（正本：~/workspace/new-game/cast.md 全44名）
// 全員架空の成人。img は ~/workspace/new-game/cast-art/cast-<id>-sera.webp に対応。
// pref（口説きの好み条件）: "sei"=清名型 / "aku"=悪名型 / "power"=実力型
const CAST_DATA = [
  // 主人公と身近な人々
  {id:"hayato", name:"ハヤト", age:19, sex:"M", style:"（プレイヤーの流派）", role:"主人公", debut:1},
  {id:"genda", name:"源田 巌", age:62, sex:"M", style:"源田道場", role:"師範", debut:1},
  {id:"tamura", name:"田村 康太", age:26, sex:"M", style:"―", role:"倉庫バイトの現場リーダー", debut:1},
  {id:"satake", name:"佐竹 剛", age:33, sex:"M", style:"自衛隊徒手格闘術", role:"警備バイトの先輩", debut:3},
  // 女性キャスト（全員が口説き対象。pref は好み条件）
  {id:"aizawa", name:"相沢 凛", age:20, sex:"F", style:"講道館柔道", role:"同世代のライバル", debut:1, pref:"power"},
  {id:"takase", name:"高瀬 美咲", age:27, sex:"F", style:"護身志望", role:"最初の道場生", debut:1, pref:"sei"},
  {id:"miyoshi", name:"三好 涼子", age:34, sex:"F", style:"―", role:"レフェリー", debut:1, pref:"sei"},
  {id:"mira", name:"ミラ", age:26, sex:"F", style:"―", role:"インフルエンサー（Tier表職人）", debut:1, pref:"aku"},
  {id:"kujo", name:"九条 沙織", age:38, sex:"F", style:"―", role:"プロモーター", debut:1, pref:"power"},
  {id:"shiratori", name:"白鳥 恵", age:29, sex:"F", style:"―", role:"ケアトレーナー", debut:1, pref:"sei"},
  {id:"ryuno", name:"龍野 舞", age:24, sex:"F", style:"ムエタイ", role:"蹴りの名手", debut:2, pref:"power"},
  {id:"elena", name:"エレナ・コワルスキ", age:27, sex:"F", style:"レスリング（フリースタイル）", role:"組みの強豪", debut:2, pref:"power"},
  {id:"chen", name:"陳 美玲", age:31, sex:"F", style:"詠春拳", role:"師匠枠（厳格型）", debut:2, pref:"sei"},
  {id:"todo", name:"藤堂 静", age:45, sex:"F", style:"空手", role:"師匠枠（寛容型）", debut:2, pref:"sei"},
  {id:"kurozaki", name:"黒崎 ラン", age:28, sex:"F", style:"裏の指導者", role:"師匠枠（無法歓迎型）", debut:2, pref:"aku"},
  {id:"jinguji", name:"神宮寺 澪", age:23, sex:"F", style:"カポエイラ・ヘジョナル", role:"トリッキーな使い手", debut:2, pref:"aku"},
  {id:"aisha", name:"アイシャ・ラーマン", age:26, sex:"F", style:"ペンチャック・シラット", role:"至近の手技の使い手", debut:2, pref:"sei"},
  {id:"saotome", name:"早乙女 楓", age:19, sex:"F", style:"弟子世代", role:"星弟子（第3章入門）", debut:3, pref:"power"},
  {id:"jiyun", name:"ソン・ジユン", age:23, sex:"F", style:"テコンドー（WT）", role:"韓国の蹴りの代表格", debut:1, pref:"power"},
  {id:"yan", name:"劉 燕", age:26, sex:"F", style:"北少林拳", role:"SNS映えの大技使い", debut:2, pref:"aku"},
  {id:"mariana", name:"マリアナ・ドス・サントス", age:29, sex:"F", style:"ブラジリアン柔術", role:"寝技の壁", debut:2, pref:"power"},
  {id:"anna", name:"アンナ・ヴォルコワ", age:32, sex:"F", style:"サンボ（スポーツサンボ）", role:"師匠枠（実力主義型）", debut:2, pref:"power"},
  {id:"miura", name:"三浦 梓", age:36, sex:"F", style:"合気道（合気会）", role:"護身セミナー主催者", debut:2, pref:"sei"},
  {id:"otowa", name:"音羽 響", age:30, sex:"F", style:"―", role:"実況アナウンサー", debut:1, pref:"aku"},
  {id:"kirishima", name:"霧島 沙耶", age:35, sex:"F", style:"―", role:"スポーツジャーナリスト", debut:2, pref:"power"},
  {id:"ono", name:"大野 千鶴", age:47, sex:"F", style:"―", role:"定食屋の女将・管理栄養士", debut:2, pref:"sei"},
  {id:"shiraishi", name:"白石 遥", age:41, sex:"F", style:"―", role:"スポーツドクター", debut:3, pref:"sei"},
  {id:"katori", name:"香取 冴子", age:44, sex:"F", style:"八極拳", role:"ライバル道場の師範", debut:3, pref:"power"},
  {id:"lihua", name:"王 麗華", age:58, sex:"F", style:"陳式太極拳", role:"師匠枠（厳格型）", debut:4, pref:"sei"},
  {id:"ingrid", name:"イングリッド・ラーセン", age:52, sex:"F", style:"キャッチレスリング", role:"後半章の同世代ライバル", debut:5, pref:"power"},
  {id:"kohinata", name:"小日向 葵", age:19, sex:"F", style:"クラヴマガ", role:"弟子世代（第5章入門）", debut:5, pref:"sei"},
  {id:"asakura", name:"朝倉 唯", age:19, sex:"F", style:"ジークンドー（截拳道）", role:"最後の弟子（第6章入門）", debut:6, pref:"aku"},
  // ライバル・強敵
  {id:"oba", name:"大場 鉄平", age:19, sex:"M", style:"極真空手", role:"同世代のライバル", debut:1},
  {id:"onizuka", name:"鬼塚 徹", age:50, sex:"M", style:"空道（大道塾）", role:"師匠枠（実力主義型）", debut:2},
  {id:"gunnar", name:"グンナル・シグルドソン", age:33, sex:"M", style:"アーマードバトル（ブフルト）", role:"甲冑の重戦車", debut:3},
  {id:"raijin", name:"ザ・グレート雷神", age:48, sex:"M", style:"プロレス", role:"ショー格闘のベテラン", debut:3},
  {id:"kuze", name:"久世 怜", age:19, sex:"M", style:"総合格闘技（MMA）", role:"最終章の若き王者", debut:7},
  {id:"ozeki", name:"大関 豊", age:28, sex:"M", style:"相撲", role:"「組」の圧力の壁", debut:1},
  {id:"raio", name:"エル・ライオ", age:39, sex:"M", style:"ルチャ・リブレ", role:"ショー枠の第2の顔", debut:2},
  {id:"sergei", name:"セルゲイ・コズロフ", age:45, sex:"M", style:"システマ", role:"怪しいトレーナー", debut:3},
  {id:"takamura", name:"高村 蒼太", age:19, sex:"M", style:"サバット", role:"若手の星（第4章登場）", debut:4},
  {id:"mamiya", name:"間宮 健一", age:55, sex:"M", style:"散打（さんだ）", role:"ライバル道場の師範", debut:4},
  {id:"zhiqiang", name:"呉 志強", age:61, sex:"M", style:"酔拳", role:"師匠枠（寛容型）", debut:4},
  {id:"umezu", name:"梅津 久", age:63, sex:"M", style:"高専柔道", role:"源田の旧友・晩年の相談役", debut:5},
];
const CAST_BY_ID = {};
for (const c of CAST_DATA) CAST_BY_ID[c.id] = c;
