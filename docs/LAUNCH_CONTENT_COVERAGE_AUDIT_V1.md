# FISH TARGET Launch Content Coverage Audit v1

Reviewed: **2026-09-02 JST**
Status: **research shortlist only — queue intake STOP**

## 1. Current baseline

Machine-audited from the current RC content model:

- 60 species
- 150 Fishing Plans
- salt 43 / fresh 17
- bait plans 100 / lure plans 50
- 18 species have exactly 1 plan
- 34 species have 2 plans or fewer
- Catalog: 44 research batches / 19 makers / 964 factual expected rows
- Catalog production batches: 0
- `authoring/content-expansion-queue.v1.json`: **0 species / 0 methods / 0 catalog**

A low plan count is an audit signal, not an automatic reason to add content.

## 2. Broad species coverage verdict

**No broad pre-launch species expansion wave is justified.**

DAIWA's current beginner place→fish index covers major freshwater, harbor, surf, rock and boat targets. The current FISH TARGET 60-species set covers almost all of that primary target surface directly or by a deliberate product label/family:

- メジナ → current グレ
- イナダ → current ブリ・ワラサ family
- ソイ類 → current specific rockfish targets such as ムラソイ / タケノコメバル
- ツツイカ → current squid targets such as スルメイカ / ヤリイカ / マルイカ / ヒイカ

Primary evidence:
- DAIWA beginner place/fish index: https://www.daiwa.com/jp/beginner/place/

Therefore species count itself is **not** a launch KPI. Add only a target whose absence weakens the decision loop.

## 3. Pre-intake species shortlist

### P0 candidate — カマス

**Decision: first species candidate for the next content batch. Not yet queued.**

Why:
- missing from the current 60;
- accessible shore/harbor target;
- SHIMANO maintains a dedicated current beginner fish page;
- it supports multiple materially distinct decisions: lure / float / sabiki;
- SHIMANO also includes it in light-game coverage, giving it a strong beginner/shore discovery role.

Evidence:
- https://fish.shimano.com/ja-JP/content/beginners/fish/kamasu/index.html
- https://fish.shimano.com/ja-JP/content/beginners/fishingstyle/lurefishing/lightgame/index.html
- https://fish.shimano.com/ja-JP/content/beginners/season/index.html

Next intake shape if approved later:
1. new species `カマス`;
2. default method should be selected only after detailed method research;
3. likely distinct method set to research: lure / float / sabiki;
4. taxonomy and aliases must be defined before fish-image lookup is enabled.

### P1 — オオモンハタ / アカハタ

**Decision: depth candidates, not launch blockers.**

Why:
- current FISH TARGET already covers substantial rockfish intent through キジハタ, カサゴ, アイナメ, ムラソイ, タケノコメバル;
- however current SHIMANO beginner rockfish guidance explicitly treats オオモンハタ and アカハタ as major rockfish targets;
- useful for future southern/coastal depth rather than required for launch coverage.

Evidence:
- https://fish.shimano.com/ja-JP/content/beginners/fishingstyle/lurefishing/rockfish/index.html
- https://fish.shimano.com/ja-JP/content/beginners/fish/oomonhata/index.html

### P1/P2 research hold — メッキ

SHIMANO includes メッキ in current light-game targets, but `メッキ` is a product/common angling category rather than a single unambiguous species label. Taxonomy/product semantics must be resolved before intake.

Evidence:
- https://fish.shimano.com/ja-JP/content/beginners/fishingstyle/lurefishing/lightgame/index.html

### P2 — キハダ / マグロ類

Large-pelagic extension only. DAIWA positions カツオ/シイラ as a progression toward tuna/hiramasa, so this is not a core launch omission.

Evidence:
- https://www.daiwa.com/jp/beginner/place/shiira_katuo_toplure

## 4. Method-depth shortlist

### P0 candidate — サワラ：ボート・ブレードジギング

**Decision: first method candidate for the next content batch. Not yet queued.**

Current FISH TARGET coverage:
- サワラ: `ショアジギング` only.

Why it is materially different:
- shore vs boat field decision is different;
- current SHIMANO product is explicitly a boat-sawara blade jig;
- the method centers on compact blade jig, range keeping and high-speed retrieve rather than the current shore-jig plan.

Evidence:
- SHIMANO OCEA Metal Shot TG Boat Sawara: https://fish.shimano.com/ja-JP/product/lure/offshorejigging/jig/a155f00000cpdkhqa5.html

This passes the “not just another name” test and is a strong P0 method-depth candidate.

### P1 candidate — カツオ：オフショアジギング

Current coverage:
- `オフショアキャスティング` only.

DAIWA's current jigging beginner guide lists カツオ among fish caught alongside the major offshore jig targets. This is a distinct vertical/offshore decision path, but current casting coverage already provides a strong core experience, so it is P1 rather than P0.

Evidence:
- https://www.daiwa.com/jp/beginner/place/kanpachi_buri_jigging
- https://www.daiwa.com/jp/beginner/place/shiira_katuo_toplure

### Research hold — イカメタル / メタルスッテ

Do **not** queue yet.

Reason:
- current マルイカ already has `船マルイカ・スッテ`;
- current 2026 product ecosystems clearly support metal-sutte, but adding an “イカメタル” method without comparing requirements / FIRST CAST / field procedure could create semantic duplication.

Before intake, compare the existing マルイカ plan to current metal-sutte intent and add only if the player decision is materially different.

Reference:
- https://fish.shimano.com/ja-JP/product/new_product/2026ss/egisutte.html

## 5. One-plan species that do NOT automatically need expansion

Examples where one current plan may already represent the product intent sufficiently:

- イワシ — サビキ釣り
- コノシロ — サビキ釣り
- サッパ — サビキ釣り
- オニカサゴ — 片テンビン釣り
- シログチ — 船胴突き
- タナゴ — タナゴウキ釣り
- マブナ — ウキ釣り
- マルイカ — 船マルイカ・スッテ

Do not add methods only to make plan counts symmetrical.

## 6. Tackle Catalog coverage verdict

**No P0 rod/reel Catalog batch is required before launch.**

Reasons:
- recommendation semantic coverage is already 34/34 unique and 62/62 plan links;
- manual MY TACKLE fallback works in the publication build;
- Catalog currently has 44 research batches / 19 makers / 964 factual rows;
- production publication remains rights-gated at 0 batches.

### P1 research candidate — SHIMANO NASCI 2026

Current SHIMANO positions the new NASCI from 500 to C5000 for broad fresh/salt use and explicitly as a first reel for entry users. A dedicated source-first 2026 batch would improve practical MY TACKLE/Catalog depth, but only after duplicate-model identity is checked against existing SHIMANO POC rows.

Evidence:
- https://fish.shimano.com/ja-JP/product/reel/hanyouspinning/a075f00003slx0xqac.html
- https://fish.shimano.com/ja-JP/product/new_product/2026ss.html

### P2 — SHIMANO STELLA SW 2026

High-end big-game depth. Not a launch blocker. Consider only with future large-pelagic expansion.

Reference:
- https://fish.shimano.com/ja-JP/product/new_product/2026ss.html

### Future-release watch — DAIWA BG SW 2026

Do not ingest as a released current product before its actual release state is verified. Recheck after release rather than inferring lifecycle from an announcement/product page.

## 7. Recommended first content batch — research target only

If/when actual intake is authorized, research in this order:

1. **P0 new species: カマス**
2. **P0 existing-species method: サワラ / ボート・ブレードジギング**
3. **P1 method: カツオ / オフショアジギング**
4. **P1 species depth: オオモンハタ**, then アカハタ if evidence/market coverage still supports it
5. **P1 Catalog research: SHIMANO NASCI 2026**, only after duplicate audit

This is a shortlist, not an implementation authorization.

## 8. STOP boundary — Doorstep Ready

At completion of this audit:

- runtime remains 60 species / 150 plans;
- `authoring/species-methods.v1.json` has **0 new entries**;
- `authoring/content-expansion-queue.v1.json` remains **0 / 0 / 0**;
- no new Catalog rows are ingested;
- no publication policy changes;
- no fish-image binary is downloaded or committed.

**The next action is literally the first queue intake. That is the point where actual content addition begins.**
