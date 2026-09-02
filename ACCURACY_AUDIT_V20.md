# FISH TARGET — Recommendation Accuracy Audit V20

Date: 2026-08-24

## Scope

This pass checks whether the default recommendation is a defensible Japan-first starting plan, not whether it covers every regional variation. `PASS` means the core method / tackle direction / FIRST CAST is suitable as an initial recommendation. `WATCH` means the concept is valid but local rules, size, depth, season, or charter instructions can materially change the exact spec. `FIX` means V20 changes the previous behavior because it could mislead the user.

## 19-species audit

| Target | Status | Release judgment |
|---|---|---|
| ブリ・ワラサ | PASS / WATCH | Shore jigging baseline is valid. Heavy-end jig/line choice remains field-dependent; boat override remains jigging. |
| カンパチ | PASS / WATCH | Shore jigging from bottom/structure is valid. Exact PE/jig weight is strongly size/depth dependent; boat override remains heavier jigging. |
| サワラ | **FIX** | Previous default called shore and boat both `ブレードジギング`. V20 uses shore jigging/casting as the shore baseline and reserves blade jigging for the boat override. |
| シーバス | PASS | 8.6–9.6ft ML–M / 3000–4000 / PE0.8–1.2 and minnow-first flow are a defensible general baseline. |
| ヒラメ | PASS + **FIX metadata** | Shore surf-lure baseline is valid. Boat override remains live-bait fishing and is now correctly classified as BAIT in the plan metadata. |
| マゴチ | PASS | Bottom-oriented jighead/worm approach and mobile search strategy are valid. |
| アジ | PASS | Sabiki is a strong beginner default; rod/reel/nylon range and depth-search flow are reasonable. |
| メバル | PASS | Light jighead/worm, slow retrieve and top-to-deeper range search are valid. |
| アオリイカ | **FIX minor** | Eging baseline is valid. V20 adjusts leader baseline to fluorocarbon 2.5–3号; 3.5号 remains the core reference while seasonal smaller egi remain valid. |
| タチウオ | **FIX** | Shore tenya itself is valid, but it is bait-assisted rather than generic lure-only. V20 classifies it as BAIT and changes the shore-tenya baseline from 3–8号 to 2–6号. Boat tenya is also BAIT. |
| クロダイ | PASS / WATCH | Fukase is a valid representative method. Exact float, sinker and leader setup is tide/field dependent. |
| マダイ | PASS / WATCH + **FIX metadata** | Shore basket fishing is a valid shore default and boat Tai-rubber is valid. Boat Tai-rubber is now correctly classified as LURE. Exact basket/float and Tai-rubber weight are field/depth dependent. |
| シロギス | PASS / WATCH | Bottom-search casting with bait is valid. A generic 3000–4000 reel is usable but dedicated surf reels may be preferable for full-distance surf casting. |
| カワハギ | PASS / WATCH | Bottom/branch-rig bait fishing is valid; boat-specific setup remains separate. Hook/sinker choices vary strongly by field and charter. |
| ブラックバス | PASS + **FIX legal note** | Worm-first approach is defensible. V20 adds a clear warning that live transport/storage of designated invasive bass is regulated/prohibited in principle and local rules must be checked. |
| ニジマス | PASS / WATCH | Spoon-first managed-fishery plan is valid. Natural rivers follow local fishing periods/rules. Mixed nylon-lb / PE-go line recommendations are no longer falsely converted by MY TACKLE. |
| アユ | PASS / WATCH | Tomozuri is representative. Rod length is field/preference dependent, and opening/closing dates and river rules remain mandatory checks. |
| コイ | PASS / WATCH | Bottom bait /ぶっ込み is a valid simple baseline. Hooks, sinkers and line vary with current, structure and fish size. |
| ヤマメ・イワナ | PASS / WATCH | Short light lure tackle and minnow-first stream approach are valid. Closed seasons, fishing tickets and section rules remain mandatory checks. |

## Cross-spec accuracy fixes in V20

### Canonical shore Tachiuo baseline

The RC baseline is **BAIT / テンヤ釣り / FIRST CAST 2〜6号**. The species data, FIRST CAST rotation, place override behavior, result UI and this audit use the same 2〜6号 range. The former 3〜8号 range is not a valid RC fallback.

### 1. Unit-aware MY TACKLE matching

Previous logic could read the first number in a size string as grams or line号. That could misread `9〜14cm`, `3〜5inch`, `2.5〜3.5号`, `フロロ4〜8lb`, or `ナイロン3〜4lb / PE0.2〜0.4号`.

V20 rules:
- Rod lure-limit comparison runs only when FIRST CAST contains an explicit `g` or `oz` weight.
- cm / inch / egi号 / hook号 are never silently converted to grams.
- Line alternatives are parsed independently.
- `号` is compared only with `号`.
- `lb` is shown as a manual strength check; no pseudo-conversion to号.
- Missing required owned-tackle fields remain `要確認`, never an automatic green result.

### 2. Weight adjustment guard

Strong-wind / rough-condition `上限寄り` adjustment now applies only to actual gram/ounce weights or weight-based tenya号. It must not enlarge sabiki hooks, chinu hooks, egi sizes, or other non-weight号 values.

### 3. Place override style consistency

When a place override changes the fishing method across lure/bait categories, result metadata now follows the active plan, not the fish's original default category.

Examples:
- ヒラメ shore = LURE / boat live bait = BAIT
- マダイ shore basket bait = BAIT / boat Tai-rubber = LURE
- タチウオ shore tenya = BAIT / boat tenya = BAIT

## Official references used in this pass

- SHIMANO — Eging beginner guide: https://fish.shimano.com/ja-JP/content/beginners/fishingstyle/lurefishing/egging/index.html
- SHIMANO — Eging preparation: https://fish.shimano.com/ja-JP/content/fishingstyle/article/salt_beginner/eging/preparation.html
- SHIMANO — Seabass ENCOUNTER specifications: https://fish.shimano.com/ja-JP/product/rod/shoresalt/seabass/a075f000041qg9sqas.html
- SHIMANO — Sabiki beginner guide: https://fish.shimano.com/ja-JP/content/beginners/fishingstyle/baitfishing/sabiki/index
- SHIMANO — Kago fishing beginner guide: https://fish.shimano.com/ja-JP/content/beginners/fishingstyle/baitfishing/kago/index.html
- SHIMANO — Madai guide: https://fish.shimano.com/ja-JP/content/beginners/fish/madai/index.html
- SHIMANO — Tai-rubber preparation: https://fish.shimano.com/ja-JP/content/fishingstyle/article/salt_beginner/tairaba/preparation.html
- SHIMANO — Tachiuo guide: https://fish.shimano.com/ja-JP/content/beginners/fish/tachiuo/index.html
- DAIWA — Shore Tachiuo Tenya SS current specs: https://www.daiwa.com/jp/product/yuccy67
- SHIMANO — Magochi guide: https://fish.shimano.com/ja-JP/content/beginners/fish/magochi/index.html
- SHIMANO — Black bass guide: https://fish.shimano.com/ja-JP/content/beginners/fish/blackbass/index.html
- SHIMANO — Managed trout guide: https://fish.shimano.com/ja-JP/content/beginners/fishingstyle/lurefishing/areatrout/index.html
- Ministry of the Environment — Invasive Alien Species Act guidance: https://www.env.go.jp/content/000127434.pdf

## Release gate

V20 can pass the recommendation-accuracy gate when:
1. JS syntax/static shell QA passes on the exact GitHub branch.
2. Synthetic cases confirm unit separation and shore/boat category switching.
3. iPhone device test confirms the corrected cases render without regression.

This audit does **not** certify local regulations, charter rules, wave safety, or manufacturer-specific load tolerance. Those remain explicit field checks.
