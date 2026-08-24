
const PRODUCT_DB={
'ショアジギング':[
{type:'ロッド',brand:'DAIWA',name:'DRAGGER X 100MH',tier:'ENTRY',fit:'ショアジギング専用の入門候補。100MHは中型青物の基準タックルに合わせやすい。',url:'https://www.daiwa.com/jp/product/b1vam0h',rank:'第一候補'},
{type:'ロッド',brand:'SHIMANO',name:'コルトスナイパー BB S96MH',tier:'VALUE',fit:'ジグMAX80g・PE MAX3号のショアジギング候補。',url:'https://fish.shimano.com/ja-JP/product/rod/shoresalt/shorejigging/a075f00003e2chxqay_p.html',rank:'比較候補'}],
'ジギング':[
{type:'ロッド',brand:'DAIWA',name:'OUTRAGE XV J 60S-3',tier:'ENTRY',fit:'180g以下・PE3号以下を想定した中型青物向けジギングモデル。',url:'https://www.daiwa.com/jp/product/hlts7np',rank:'第一候補'},
{type:'ロッド',brand:'SHIMANO',name:'グラップラー BB タイプ J',tier:'VALUE',fit:'オフショアジギングのハイコストパフォーマンス候補。',url:'https://fish.shimano.com/ja-JP/product/rod/offshoresalt/jigging/a075f00003e2ccwqay.html',rank:'比較候補'}],
'ブレードジギング':[
{type:'ロッド',brand:'DAIWA',name:'OUTRAGE XV BLJ 68HS',tier:'ENTRY',fit:'オフショアのブレードジギング専用候補。高速巻き主体のサワラに合わせやすい。',url:'https://www.daiwa.com/jp/product/9wiczq9',rank:'第一候補'},
{type:'ロッド',brand:'SHIMANO',name:'グラップラー BB タイプ ブレード',tier:'VALUE',fit:'サワラ・青物向けブレードジギング専用の比較候補。',url:'https://fish.shimano.com/ja-JP/product/rod/offshoresalt/lightjigging/a075f00004cgapsqap.html',rank:'比較候補'}],
'ルアーシーバス':[
{type:'ロッド',brand:'DAIWA',name:'LATEO 96ML/M',tier:'STANDARD',fit:'河口・港湾・サーフまで幅広く使いやすいシーバスの基準候補。',url:'https://www.daiwa.com/jp/product/ye9mr5u',rank:'第一候補'},
{type:'リール',brand:'DAIWA',name:'CALDIA LT4000-CXH',tier:'STANDARD',fit:'シーバス・サーフ系で使いやすい4000番ハイギア候補。',url:'https://www.daiwa.com/jp/product/lsej2uh',rank:'比較候補'}],
'サーフルアー':[
{type:'ロッド',brand:'DAIWA',name:'OVERTHERE 106M',tier:'STANDARD',fit:'ヒラメ・マゴチ・青物を含むサーフのマルチルアー候補。',url:'https://www.daiwa.com/jp/product/6u2yoeo',rank:'第一候補'},
{type:'リール',brand:'SHIMANO',name:'ナスキー 4000XG',tier:'VALUE',fit:'サーフ用途に合わせやすい4000XGの比較候補。',url:'https://fish.shimano.com/ja-JP/product/reel/hanyouspinning/a075f00003slx0xqac.html',rank:'比較候補'}],
'ワームゲーム':[
{type:'ロッド',brand:'DAIWA',name:'OVERTHERE 106M',tier:'STANDARD',fit:'サーフのフラットフィッシュを広く探るロッド候補。',url:'https://www.daiwa.com/jp/product/6u2yoeo',rank:'第一候補'},
{type:'リール',brand:'DAIWA',name:'CALDIA LT4000-CXH',tier:'STANDARD',fit:'PE0.8〜1.2号クラスのサーフゲームに合わせやすい。',url:'https://www.daiwa.com/jp/product/lsej2uh',rank:'比較候補'}],
'サビキ釣り':[
{type:'ロッド',brand:'DAIWA',name:'リバティクラブ 磯風 2-39',tier:'ENTRY',fit:'メーカーがサビキ釣り対応を明示する堤防万能竿。',url:'https://www.daiwa.com/jp/product/d1jdu8h',rank:'第一候補'},
{type:'ロッド',brand:'SHIMANO',name:'ホリデー イソ',tier:'VALUE',fit:'サビキ・チョイ投げを含む防波堤の定番候補。',url:'https://fish.shimano.com/ja-JP/product/rod/isobouhatei/other/a075f00002ltl7gqaq.html',rank:'比較候補'}],
'船サビキ/コマセ釣り':[
{type:'ロッド',brand:'DAIWA',name:'ライトゲーム X',tier:'ENTRY',fit:'幅広い船釣りに対応する汎用ライトゲーム候補。船宿指定の錘号数を優先。',url:'https://www.daiwa.com/jp/product/h9awa4c',rank:'第一候補'},
{type:'ロッド',brand:'SHIMANO',name:'ライトゲーム BB',tier:'VALUE',fit:'コマセ・胴突きなど近海船釣りを広くカバーする比較候補。',url:'https://fish.shimano.com/ja-JP/product/rod/funehanyou/lightgame/a075f00003rgsqmqak.html',rank:'比較候補'}],
'メバリング':[
{type:'ロッド',brand:'SHIMANO',name:'ソアレ BB',tier:'VALUE',fit:'アジ・メバルを含むライトソルトゲームの入門〜標準候補。',url:'https://fish.shimano.com/ja-JP/product/rod/lightsalt/a075f00003xgh7lqaq.html',rank:'第一候補'},
{type:'ロッド',brand:'DAIWA',name:'リバティクラブ ルアー 5105TLFS',tier:'ENTRY',fit:'メバル等のライトSWにも用途を広げられる携帯性重視候補。',url:'https://www.daiwa.com/jp/product/74aza7d',rank:'比較候補'}],
'エギング':[
{type:'ロッド',brand:'DAIWA',name:'EMERALDAS MX 86M',tier:'STANDARD',fit:'2026年モデル。2.5〜4.0号を扱うオールラウンドなエギング候補。',url:'https://www.daiwa.com/jp/product/825fa80',rank:'第一候補'},
{type:'ロッド',brand:'SHIMANO',name:'セフィア BB S86M',tier:'VALUE',fit:'8ft6inのエギング用オールラウンド候補。',url:'https://fish.shimano.com/ja-JP/product/rod/egisutte/eging/a075f00003e2h9qqaa.html',rank:'比較候補'}],
'ティップラン':[
{type:'ロッド',brand:'DAIWA',name:'EMERALDAS X BOAT 65MLS-S',tier:'ENTRY',fit:'2026年8月発売。ティップランの最初の1本向けに設計された候補。',url:'https://www.daiwa.com/jp/product/i287ax4',rank:'第一候補'}],
'テンヤ釣り':[
{type:'仕掛け',brand:'DAIWA',name:'波止タチウオテンヤSS早掛',tier:'ENTRY',fit:'2026年6月発売。堤防の引き釣り用テンヤで、遠投向けノーマルとレンジキープ向けチャターを選べる。',url:'https://www.daiwa.com/jp/product/suk5zmt',rank:'第一候補'}],
'船テンヤ':[
{type:'ロッド',brand:'DAIWA',name:'タチウオ X MH-180',tier:'ENTRY',fit:'片天秤餌仕掛け・テンヤ仕掛けに対応する船タチウオ専用候補。',url:'https://www.daiwa.com/jp/product/6rsgiqg',rank:'第一候補'},
{type:'ロッド',brand:'SHIMANO',name:'サーベルマスター BB 82MH180',tier:'VALUE',fit:'テンヤを含む船タチウオ用エントリーモデル。',url:'https://fish.shimano.com/ja-JP/product/rod/funesenyou/tachiuo/a075f000031utcaqaw.html',rank:'比較候補'}],
'フカセ釣り':[
{type:'ロッド',brand:'DAIWA',name:'銀狼 1-53',tier:'STANDARD',fit:'クロダイのウキフカセ専用。標準パワーの基準候補。',url:'https://www.daiwa.com/jp/product/34fw52o',rank:'第一候補'},
{type:'ロッド',brand:'SHIMANO',name:'ホリデー イソ 1.5-530',tier:'ENTRY',fit:'フカセから堤防釣りまで始めやすい汎用候補。',url:'https://fish.shimano.com/ja-JP/product/rod/isobouhatei/other/a075f00002ltl7gqaq.html',rank:'比較候補'}],
'遠投カゴ釣り':[
{type:'ロッド',brand:'DAIWA',name:'リバティクラブ 磯風 4-53 遠投',tier:'ENTRY',fit:'10〜15号錘・遠投ガイド仕様。遠投カゴの基準に合わせやすい。',url:'https://www.daiwa.com/jp/product/d1jdu8h',rank:'第一候補'},
{type:'ロッド',brand:'SHIMANO',name:'ホリデー イソ 4-530PTS',tier:'VALUE',fit:'メーカーが遠投モデルでマダイ・青物まで射程と明示。',url:'https://fish.shimano.com/ja-JP/product/rod/isobouhatei/other/a075f00002ltl7gqaq.html',rank:'比較候補'}],
'タイラバ':[
{type:'ロッド',brand:'DAIWA',name:'紅牙 X 69MHB-S',tier:'ENTRY',fit:'150gクラスまでを想定するスタンダードなタイラバ候補。',url:'https://www.daiwa.com/jp/product/r2yzcsa',rank:'第一候補'},
{type:'リール',brand:'DAIWA',name:'紅牙 X IC',tier:'ENTRY',fit:'ICカウンター搭載のタイラバ用小型両軸候補。',url:'https://www.daiwa.com/jp/product/23djpmj',rank:'比較候補'}],
'投げ釣り':[
{type:'ロッド',brand:'DAIWA',name:'プライムサーフ T',tier:'VALUE',fit:'シロギス等の投げ釣り向けスタンダード候補。',url:'https://www.daiwa.com/jp/product/gmag55c',rank:'第一候補'},
{type:'ロッド',brand:'SHIMANO',name:'サーフリーダー 405DX-T',tier:'STANDARD',fit:'軽快なキャストを狙った定番振出投げ竿。',url:'https://fish.shimano.com/ja-JP/product/rod/nage/furidashi/a075f00003cwatyqac.html',rank:'比較候補'}],
'胴突き釣り':[
{type:'ロッド',brand:'SHIMANO',name:'ボーダレス BB',tier:'VALUE',fit:'サビキやカワハギの胴突き仕掛けまで幅広く対応可能な汎用候補。',url:'https://fish.shimano.com/ja-JP/product/rod/freestyle/borderlesswithguide/a075f00003xhaeeqa2.html',rank:'第一候補'}],
'船カワハギ':[
{type:'ロッド',brand:'DAIWA',name:'カワハギ X MH-180',tier:'ENTRY',fit:'底〜宙までバランス良く対応する専用オールラウンド候補。',url:'https://www.daiwa.com/jp/product/pgsuntk',rank:'第一候補'},
{type:'ロッド',brand:'SHIMANO',name:'カワハギ BB MH180',tier:'VALUE',fit:'底から宙まで対応するカワハギ専用オールラウンド候補。',url:'https://fish.shimano.com/ja-JP/product/rod/funesenyou/kawahagi/a075f000032akkwqai.html',rank:'比較候補'}],
'ワーム':[
{type:'ロッド',brand:'DAIWA',name:'TATULA XT 682LFS',tier:'ENTRY',fit:'陸っぱり〜ボートまで使えるバス用スピニング候補。',url:'https://www.daiwa.com/jp/product/995wk7u',rank:'第一候補'},
{type:'ロッド',brand:'SHIMANO',name:'ゾディアス',tier:'STANDARD',fit:'幅広いバスフィッシングに対応するスタンダード候補。',url:'https://fish.shimano.com/ja-JP/product/rod/bass/shimano/a075f00003yfzrsqam.html',rank:'比較候補'}],
'スプーン':[
{type:'ロッド',brand:'DAIWA',name:'イプリミ 62UL',tier:'VALUE',fit:'スプーンを中心に幅広く使えるエリアトラウトのベーシック候補。',url:'https://www.daiwa.com/jp/product/ffterhn',rank:'第一候補'},
{type:'リール',brand:'DAIWA',name:'イプリミ LT2000S-P',tier:'STANDARD',fit:'スプーンの定速巻きに向くエリアトラウト専用リール。',url:'https://www.daiwa.com/jp/product/1ji0m3b',rank:'比較候補'},
{type:'ロッド',brand:'SHIMANO',name:'トラウトワン AS S60UL',tier:'VALUE',fit:'スプーンからプラグまで扱えるエリアトラウトの基本候補。',url:'https://fish.shimano.com/ja-JP/product/rod/trout/areatrout/a075f00003ajffgqaq.html',rank:'比較候補'}],
'友釣り':[
{type:'ロッド',brand:'DAIWA',name:'プライム アユ 72',tier:'ENTRY',fit:'友釣りを始めやすく、小河川や風対策にも使いやすいエントリー候補。',url:'https://www.daiwa.com/jp/product/3j5fk08',rank:'第一候補'}],
'ぶっ込み釣り':[
{type:'仕掛け',brand:'OWNER',name:'楽投 池川ぶっ込み仕掛 M',tier:'ENTRY',fit:'メーカーがMサイズをバス・コイ対象として明示。5号オモリ付きで手軽に始めやすい。',url:'https://www.owner.co.jp/products/34930/',rank:'第一候補'}],
'渓流ルアー':[
{type:'ロッド',brand:'DAIWA',name:'Silver Creek Trad 48UL',tier:'STANDARD',fit:'渓流域の軽量ミノーを扱いやすいネイティブトラウト候補。',url:'https://www.daiwa.com/jp/product/am9pxu2',rank:'第一候補'},
{type:'ロッド',brand:'SHIMANO',name:'カーディフ NX',tier:'STANDARD',fit:'源流〜中流まで幅広いネイティブトラウト向け候補。',url:'https://fish.shimano.com/ja-JP/product/rod/trout/nativetrout/a075f00003k1js6qaf.html',rank:'比較候補'}],
'泳がせ釣り':[
{type:'ロッド',brand:'SHIMANO',name:'ライトゲーム BB 73MH230',tier:'VALUE',fit:'公式適合表でライトヒラメ用途を明示する汎用船竿候補。',url:'https://fish.shimano.com/ja-JP/product/rod/funehanyou/lightgame/a075f00003rgsqmqak.html',rank:'第一候補'}]
};

const FIELD_PRODUCT_DB={
'ショアジギング':[
{type:'ルアー',brand:'DAIWA',name:'サムライジグR',role:'FIRST CAST候補',fit:'ショアジギング用メタルジグ。遠投性とハイ/スローピッチ双方の応答性をメーカーが訴求。',url:'https://www.daiwa.com/jp/product/7c5pl9f',spec:'40〜80g帯を状況に合わせる'}],
'ルアーシーバス':[
{type:'ルアー',brand:'DAIWA',name:'ショアラインシャイナーZ バーティス R',role:'ミノー基準',fit:'125F/S・140F/Sなどを展開。河口・サーフ・磯まで遠投ミノーの基準候補。',url:'https://www.daiwa.com/jp/product/0ia3b6l',spec:'125mm級から開始'}],
'サーフルアー':[
{type:'ルアー',brand:'DAIWA',name:'フラットジャンキー ロデム R シャッド',role:'FIRST CAST候補',fit:'ヒラメ・マゴチ用のジグヘッド+ワームセット。食い渋りを意識したリアルシェイプ。',url:'https://www.daiwa.com/jp/product/ugs6moo',spec:'サーフの底上を引く基準'}],
'ワームゲーム':[
{type:'ルアー',brand:'DAIWA',name:'フラットジャンキー ロデム R シャッド',role:'FIRST CAST候補',fit:'ヒラメ・マゴチを対象としたジグヘッド+シャッドワーム。ボトム攻略の入口にしやすい。',url:'https://www.daiwa.com/jp/product/ugs6moo',spec:'底取りできる重さを選択'}],
'サビキ釣り':[
{type:'仕掛け',brand:'OWNER',name:'家族で楽ちんサビキ日和ピンクギジ',role:'入門仕掛け',fit:'ハリがらみを抑えた1.3mのショート設計。3〜8号を展開する堤防サビキ候補。',url:'https://www.owner.co.jp/search/1651/',spec:'魚サイズに合わせ3〜8号'}],
'メバリング':[
{type:'ワーム',brand:'DAIWA',name:'月下美人 ビームスティック',role:'FIRST CAST候補',fit:'アジ・メバル向けライトゲーム定番ワーム。1.5/2.2inchを展開。',url:'https://www.daiwa.com/jp/product/epecxf5',spec:'1.5〜2.2inch'}],
'エギング':[
{type:'エギ',brand:'DAIWA',name:'エメラルダス フォールLC ラトル',role:'基準エギ',fit:'磁着式重心移動で飛距離と安定フォールを両立。2.0〜3.5号を展開。',url:'https://www.daiwa.com/jp/product/nzk2oqu',spec:'秋2.5〜3号 / 春3.5号目安'}],
'テンヤ釣り':[
{type:'テンヤ',brand:'DAIWA',name:'波止タチウオテンヤSS早掛',role:'FIRST CAST候補',fit:'2026年6月発売。堤防の引き釣り用で早掛親針を搭載。ノーマル/チャターを選べる。',url:'https://www.daiwa.com/jp/product/suk5zmt',spec:'水深・潮流で3S〜M'}],
'船テンヤ':[
{type:'テンヤ',brand:'OWNER',name:'掛獲船太刀魚テンヤ',role:'船テンヤ候補',fit:'掛けスタイルから追わせ掛けまでを想定した船太刀魚テンヤ。',url:'https://www.owner.co.jp/search/20163/',spec:'船宿指定号数を最優先'}],
'遠投カゴ釣り':[
{type:'仕掛け',brand:'OWNER',name:'遠投カゴ大物2本 2.5m',role:'大物仕掛け',fit:'波止からのマダイ・青物を想定した太ハリス2本仕掛け。',url:'https://www.owner.co.jp/search/1663/',spec:'ハリス3〜6号'}],
'タイラバ':[
{type:'ルアー',brand:'DAIWA',name:'紅牙ベイラバーフリーβ',role:'FIRST DROP候補',fit:'45〜250gまで展開するタイラバ。ラウンドタイプでフック・ネクタイまで組み上がった候補。',url:'https://www.daiwa.com/jp/product/j59lrk3',spec:'船長指示・水深・潮で重量選択'}],
'投げ釣り':[
{type:'仕掛け',brand:'OWNER',name:'マシーンキス3本',role:'キス基準仕掛け',fit:'ショートロッドでの手返しと多点掛けを意識した3本鈎のキス仕掛け。',url:'https://www.owner.co.jp/search/1639/',spec:'6〜9号'}],
'胴突き釣り':[
{type:'仕掛け',brand:'OWNER',name:'波止カワハギ完全セット',role:'堤防入門仕掛け',fit:'オモリ付きでそのまま使える45cmショート設計の波止カワハギ仕掛け。',url:'https://www.owner.co.jp/search/1712/',spec:'3〜5号 / オモリ5号'}],
'船カワハギ':[
{type:'仕掛け',brand:'OWNER',name:'誇高カワハギシリーズ',role:'船カワハギ候補',fit:'早掛・ワイド・吸わせなど釣り方別に交換鈎を選べる現行シリーズ。',url:'https://www.owner.co.jp/search/category/owner/list/?c=463',spec:'船宿・食わせ方で鈎型を選択'}],
'ワーム':[
{type:'ワーム',brand:'DAIWA',name:'スティーズ ネコストレート',role:'食わせ基準',fit:'ネコリグ等を想定したストレートワーム。タフなフィールド向けに素材・形状を再設計。',url:'https://www.daiwa.com/jp/product/2024/09/18/03/29/yqp2suq',spec:'3.75〜5.8inch中心'}],
'スプーン':[
{type:'ルアー',brand:'DAIWA',name:'プレッソ ムーバー',role:'放流/高活性基準',fit:'高活性のエリアトラウトに強いワイドアクション系スプーン。1.8g等を展開。',url:'https://www.daiwa.com/jp/product/xsu4cdw',spec:'1.8〜2.4gから開始'}],
'渓流ルアー':[
{type:'ルアー',brand:'DAIWA',name:'シルバークリークミノー',role:'渓流ミノー基準',fit:'流れ攻略用に設計された40S〜61Sのシンキングミノーシリーズ。',url:'https://www.daiwa.com/jp/product/qu68qjg',spec:'40〜55mm中心'}],
'泳がせ釣り':[
{type:'仕掛け',brand:'OWNER',name:'船ヒラメの基本 シングル',role:'船ヒラメ基準',fit:'固定式でタナを取りやすく、活きイワシの泳ぎを活かすシングル孫鈎仕様。',url:'https://www.owner.co.jp/search/1659/',spec:'ハリス5〜8号'}]
};
function productsForPlan(p){return PRODUCT_DB[p.method]||[]}
function fieldProductsForPlan(p){return FIELD_PRODUCT_DB[p.method]||[]}
