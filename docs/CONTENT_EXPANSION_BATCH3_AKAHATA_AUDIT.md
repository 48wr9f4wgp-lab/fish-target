# FISH TARGET — Content Expansion Batch 3 / Akahata Decision Audit

Reviewed: 2026-09-02
Base: Batch 2 exact head `49583db5bdc79ef06e2065b2e7f200edfd7f7495`
Scope: decision audit + guarded branch implementation; no merge/release authorization

## Decision

**GO — アカハタをBatch 3の追加候補として採用する。**

採用理由は魚種数の水増しではない。既存のオオモンハタと比較したとき、FIRST CAST / FIELD MODEでプレイヤーに異なる判断を要求できるため。

## Material decision gap

### アカハタ

- 水深があり潮当たりの良い磯の**底付近**が主戦場。
- 甲殻類や底付近のベイトを意識する。
- ジグヘッドならボトム付近のスイミング / リフト&フォール。
- テキサス / フリーリグのように沈み根へタイトに入れる釣りも成立。
- 巻き物を使う場合も、オオモンハタやキジハタより**スロー**が基本。

### 既存オオモンハタ

- 岩礁だけでなく砂地が絡む場所を使う。
- 小魚を追い、**中層まで浮く**。
- スイミング中心で広いタナを探す。
- 2026年のSHIMANO実釣解説では、アカハタより速めのリトリーブで釣り分けている。

したがって両者は「同じロックフィッシュだから重複」ではない。

`アカハタ = 底・根へタイト・スロー`

`オオモンハタ = 中層まで広く・小魚・スイミング/速め`

この差は魚種選択後の釣法、レンジ、ルアー操作、ポイント選択を変えるため、FISH TARGETのCore Loopへ直接寄与する。

## Evidence

### Primary 1 — SHIMANO 2026 Akahata field article

https://fish.shimano.com/ja-JP/content/fishingstyle/article/2026/260113/index.html

確認事項:
- アカハタを明示的に対象化。
- 水深のある潮当たりの良い磯、底付近を攻略。
- シャッドテール + ジグヘッドでボトム付近のスイミング / リフト&フォール。
- 甲殻類や底付近のベイトを意識。
- テキサス / フリーリグを操作する展開を説明。
- 巻き物でもオオモンハタ / キジハタよりスローが基本と説明。

Confidence: A

### Primary 2 — SHIMANO 2026 Oomonhata field article

https://fish.shimano.com/ja-JP/content/fishingstyle/article/2026/260122/index.html

確認事項:
- アカハタとオオモンハタは対照的で、攻略法を釣り分ける必要があると明示。
- オオモンハタは小魚を追い、中層のスイミング中心。
- アカハタより速めのリトリーブを意識している。

Confidence: A

### Primary 3 — SHIMANO Rockfish beginner guide

https://fish.shimano.com/ja-JP/content/beginners/fishingstyle/lurefishing/rockfish/index.html

確認事項:
- アカハタを主要ロックフィッシュの一つとして掲載。
- ロックフィッシュの基本リグとしてジグヘッド、テキサス、フリーリグ等を説明。
- 甲殻類を捕食している場合はクロー / ホッグ系をボトムで使うという判断軸を説明。

Confidence: A

## Proposed Batch 3 content shape

Species: `アカハタ`

Target plan count: **2**

1. Default — `ボトム・ジグヘッド`
   - ボトム付近のスイミング / リフト&フォール
   - FIRST CASTはシャッド系ワーム + ジグヘッド
   - 地形把握と底付近のレンジ維持を優先

2. Alternative — `フリーリグ / テキサス`
   - 沈み根へタイトに入れる
   - 甲殻類系ワーム
   - 根掛かり回避とヒット直後の根離しを優先

## Guardrails

- オオモンハタの既存文面・プランを流用コピーしない。
- タックル数値は一次情報が直接支える範囲か、明示した保守的正規化に限定する。
- 季節を全国一律に断定しない。
- ロッド / リールCatalogは追加しない。現時点で商品Catalog追加の意思決定価値は証明されていない。
- lure Catalogも追加しない。まず魚種 / 方法のCore Loop価値を優先する。
- 魚画像binaryは追加しない。既存の第三者画像 intake prohibitionを維持する。

## Acceptance target for implementation

- 62 → **63 species**
- 156 → **158 plans**
- Catalog: **46 batches / 971 factual rows unchanged**
- lure Catalog: unchanged
- アカハタがtarget gridで選択可能
- 2 methodsがmethod pickerで明確に分離
- FIRST CAST / required tackle / FIELD MODEへ選択methodが一貫して伝播
- 390px viewport overflowなし
- publication buildでresearch Catalogを露出しない
- content expansion readiness / unit / browser / publication regression Green

## Execution gate

- canonical authoring JSONを唯一の入力とし、generated runtimeは既存generatorから再生成する。
- 一回適用Workflowは `node scripts/batch3-apply-once.mjs` → `npm test` の順で実行し、テスト成功時のみ生成結果をbranchへcommitする。
- 初回Workflowはrepositoryに `package-lock.json` が無い状態で不要な `npm ci` を実行して失敗した。製品コード起因ではないため、install stepを削除して再発火する。
- branch実装後は一回適用Workflow / applicatorを削除し、通常のexact-head CIで最終検証する。
- **この文書更新時点ではアカハタ実データ適用を完了扱いしない。**

## Non-goals

- main merge
- RC merge
- release / Store submission
- monetization
- paid service
- unverified fish image binary intake
