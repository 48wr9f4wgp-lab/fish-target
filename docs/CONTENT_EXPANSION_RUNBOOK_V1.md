# FISH TARGET Content Expansion Runbook v1

Status: **実データ追加の直前（Doorstep Ready）を作るための運用正本**

このRunbookは、魚種・既存魚への釣法・ロッド/リールCatalogを追加する際の入口を一本化する。現在のRCを壊さず、候補調査→レビュー→authoring→QAをbatch単位で行う。

## 1. 追加前の原則

- 思いつきで1件ずつruntimeへ直書きしない。
- `authoring/content-expansion-queue.v1.json` は優先順位と根拠を置くresearch queueであり、runtimeではない。
- 新魚種/釣法のruntime入口は既存 `authoring/species-methods.v1.json`。
- 市販商品Catalogは現在 **rod / reel** が正式schema。ルアー、フック、ライン等の商品Catalog追加は別schema/UI拡張が必要で、このRunbookでは「簡単な商品追加」と扱わない。
- manufacturer-native unitを維持し、EGI↔g、oz↔g、lb↔PE、オモリ号数↔gを推測変換しない。
- JAN、lifecycle、spool capacity/current lineを推測しない。
- Catalog candidateは必ず `stage: research` から開始。publicationを推測で有効化しない。
- 魚画像taxonomyと画像rightsは別Gate。安全なSVG fallbackがある限り、画像不足だけを理由に誤種/無許諾binaryを採用しない。

## 2. 現在の追加入口

### 魚種

1. `authoring/content-expansion-queue.v1.json` の `species_candidates` に候補を置く。
2. P0/P1/P2、追加理由、https根拠URLを記録する。
3. taxonomy、表示名、aliases、water、difficulty、季節、代表釣法をレビューする。
4. `authoring/templates/species-method-entry.v1.json` を複製して全placeholderを根拠で置換する。
5. vetted payloadだけを `authoring/species-methods.v1.json` の `targets` へ移す。
6. `node scripts/species-method-authoring.mjs` でgenerated runtimeを作る。
7. `node scripts/content-expansion-gate.mjs` を通す。
8. Browser QAで一覧→魚→釣法→FIRST CAST→MY TACKLE→FIELD MODEを確認する。

通常の魚種追加でUIコードを編集してはいけない。UI変更が必要なら「普通のデータ追加」ではなくarchitecture gapとして扱う。

### 既存魚への釣法

1. `method_candidates` に既存魚名、stable `method_id`、表示名、P0/P1/P2、根拠URLを置く。
2. `authoring/templates/species-method-entry.v1.json` の `existing_species_method_template` を使う。
3. rod/reel/line/leader/rig、FIRST CAST、3 steps、場所、失敗例、source evidenceを埋める。
4. vetted payloadを `authoring/species-methods.v1.json` の `existing` へ移す。
5. authoring generate → content expansion gate → Browser regression。

同一魚で似た釣法を名前違いだけで増やさない。FIRST CAST、requirements、場所、操作が実際に異なる場合だけ独立Methodにする。

### ロッド / リールCatalog

1. `catalog_candidates` にbatch候補を置く。`stage=research`、`publication_ready=false`固定。
2. メーカー公式sourceを収集し、`authoring/templates/catalog-batch.v1.json` を複製してplaceholderを全置換する。
3. lifecycleは根拠がなければ `unknown`。JANは公式/信頼できる一次情報がなければ空欄。
4. source JSONを `catalog-batches/<batch-id>.json` に保存する。
5. 例：

```bash
node scripts/catalog-ingest.mjs \
  --input catalog-batches/<batch-id>.json \
  --output catalog-<batch-id>.js \
  --batch-id <batch-id> \
  --expected-maker <MAKER> \
  --require-official
```

6. `catalog-batch-manifest.json` に `stage: research` と expected_rows/source_inputを追加する。
7. `node scripts/content-expansion-gate.mjs` を通す。
8. Catalog Browser smoke / Resolver regressionを通す。
9. production publicationは別rights Gate。研究Catalogに入ったことを公開許可と解釈しない。

## 3. Coverage Auditの優先順位

### P0 — Launch blocker

- 主要ターゲットなのに検索できない。
- 既存の主要魚で、現役市場における代表釣法が欠落し、意思決定体験を明確に弱くしている。
- 現行recommendation/MY TACKLEの成立を妨げる重大なrod/reel Catalog gap。
- 安全性、誤認、進行不能に関係する欠落。

### P1 — Depth

- `content-expansion-readiness` で1プラン、または2プラン以下の魚。
- 既存魚の岸/船、エサ/ルアー等で明確に異なる有力釣法。
- 使用頻度の高いrod/reel familyでresearch coverageが薄い。

### P2 — Long tail

- 地域限定・季節限定・専門性が高い魚種/釣法。
- 市場性や利用頻度の根拠が弱い追加。
- visual completenessだけを目的にした追加。

**件数を増やすこと自体をKPIにしない。** 「その候補が無いことで、次の1投を決める体験が弱くなるか」を優先する。

## 4. 2026-09-02 Current Market Signal

これは追加候補の確定リストではなく、Coverage Auditの軸を更新するための外部確認。

- Fishbrainはspecies filter、catch/local context、bait/lure recommendation、gear情報を意思決定体験の中心に置いている。Custom Gear追加も提供している。したがってFISH TARGETでも「魚種数だけ」ではなく、species→method→gearの密度を見る。
  - https://fishbrain.com/features
  - https://fishbrain.com/blog/fishing-tips/whats-new-on-fishbrain
- SHIMANOの現行初心者向け釣り方導線では、サビキ、チョイ投げ、ライトショアジギング、ライトゲームを入口として提示し、ウキ、胴突、カゴ、泳がせ、穴釣り、エギング、ロックフィッシュ、チニング等へ広げている。主要魚のMethod depth監査に使う。
  - https://fish.shimano.com/ja-JP/content/beginners/fishingstyle/index.html
- DAIWAの初心者導線は場所→釣れる魚→釣り方で整理している。Coverage Auditではspecies×place×methodの欠落を見る。
  - https://www.daiwa.com/jp/beginner/place

1作品/1社を模倣しない。複数の現役導線から「検索性、釣法密度、道具への接続」を抽象化する。

## 5. 1コマンドGate

候補をruntimeへ移した後のNode/build/data契約は次でまとめて実行する。

```bash
node scripts/content-expansion-gate.mjs
```

内部で以下を実行する。

1. Content Expansion Readiness / queue / baseline contract
2. Generic Catalog Contract
3. full `npm test`（authoring / fish assets / build / Node regression）

その後、変更内容に応じてfull Browser QAとpublication Browser QAを必ず実施する。

## 6. 現在の停止位置

Doorstep Readyでは以下を満たす。

- current runtimeは60魚種 / 150 plansのまま。
- `authoring/species-methods.v1.json` に新規追加0件。
- content queueのspecies/method/catalog候補0件。
- templatesはruntimeから未参照。
- Catalog production batch 0。
- 次の作業は **候補を調査してqueueへ1行目を入れること**。

ここより先が「実際の追加」。Launch Coverage Auditで候補を確定するまでは進めない。
