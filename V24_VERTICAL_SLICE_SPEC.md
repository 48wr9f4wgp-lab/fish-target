# V24 Vertical Slice Spec — MY SET / TRIP READY

Last decided: 2026-08-26
Status: implementation-ready product/engineering spec; code must wait for V23 final-QA Merge Gate
Depends on: `V24_PRODUCT_DIRECTION.md`, V23 MY TACKLE, existing `rodFit()` / `reelFit()` behavior

## 1. Goal

Turn the current passive `MY TACKLE CHECK` into an immediate answer to:

**「今回、手持ちのどのロッドとリールを持っていけばいい？」**

without creating a second incompatible recommendation engine.

---

## 2. Existing behavior to preserve

Current `tackle.js` already provides:
- `rodFit(rod,p,r)`
- `reelFit(reel,p)`
- levels:
  - `0` = そのまま使いやすい
  - `1` = 条件付きで候補
  - `2` = 推奨から外れ気味
- owned-tackle persistence: `fish_target_v17_tackle`
- manual + catalog ownership
- reel current line as user-owned state
- unit-safe rules for lure weight and Japanese line `号`

V24 extends these semantics; it must not fork them.

---

## 3. Minimal architecture change

### Current

`owned items -> rodFit/reelFit -> sorted best item -> MY TACKLE CHECK`

### V24

`owned items -> structured fit evidence -> candidate ranking -> MY SET -> locked Trip Snapshot`

Recommended new pure logic boundary inside or adjacent to tackle logic:

```text
rodFitDetailed()
reelFitDetailed()
rankOwnedCandidates()
selectMySet()
readinessForSet()
```

Existing `rodFit()` and `reelFit()` public behavior should remain backward-compatible, ideally delegating to the detailed result.

Do not move compatibility logic into UI rendering code.

---

## 4. Structured fit result

Conceptual shape:

```js
{
  level: 0 | 1 | 2,
  label,
  checks: [
    {
      key: 'rod_length' | 'rod_power' | 'cast_weight' | 'reel_size' | 'line_type' | 'line_no',
      state: 'fit' | 'edge' | 'mismatch' | 'unknown' | 'not_applicable',
      required: true | false,
      actual,
      recommended,
      reason
    }
  ]
}
```

Rules:
- `unknown` must remain distinguishable from `fit`.
- `not_applicable` must not reduce readiness.
- no unit conversion beyond conversions already explicitly safe in current logic.
- no manufacturer certification language.

---

## 5. Critical dimensions for Vertical Slice

Use only dimensions already represented safely in the current compatibility logic.

### Rod
Potential critical checks when parseable/applicable:
- rod length
- rod power
- FIRST CAST / lure weight capability for lure-style plans

### Reel
Potential critical checks when parseable/applicable:
- reel size
- recommended line type
- current user-entered line `号` when recommendation is also safely represented in `号`

### Important line rule
If the plan recommendation is expressed in `lb` and owned user line is stored in Japanese `号`, do **not** convert it.

The line-number check remains `unknown` / `要確認`, not READY evidence.

---

## 6. Candidate ranking

Do not use a fake public numeric score.

Internally use a stable tuple comparator.

Recommended tuple, lower is better:

```text
[
  hardMismatchCount,
  requiredUnknownCount,
  edgeWarningCount,
  totalFitLevel,
  safeRangeDistance,
  stableOwnedIndex
]
```

### `hardMismatchCount`
Number of required detailed checks with `state=mismatch`.

### `requiredUnknownCount`
Number of required checks with `state=unknown`.

### `edgeWarningCount`
Number of required checks with `state=edge`.

### `totalFitLevel`
Existing compatibility level as a compatibility/backward-stability signal.

### `safeRangeDistance`
Optional tie-break only where:
- both values use the same known-safe unit
- range parsing succeeded
- the distance is meaningful under existing rules

Do not compare arbitrary normalized percentages across unrelated dimensions.

### `stableOwnedIndex`
Final deterministic tie-break so the same input produces the same result.

---

## 7. MY SET selection

Select rod and reel independently through the same candidate ranking rules, then evaluate the resulting pair.

Conceptual output:

```js
{
  rod: {owned, fit},
  reel: {owned, fit},
  readiness: 'ready' | 'review' | 'missing',
  reasons: [],
  alternatives: {
    rods: [],
    reels: []
  }
}
```

### `READY`
Allowed only when:
- required rod and reel candidates both exist
- no required mismatch exists
- no required unknown exists
- relevant current-line evidence is known where the current recommendation requires it

`READY` means “the app's known recommendation fields are covered”, not manufacturer certification.

### `要確認`
Use when:
- no required hard mismatch exists
- but at least one required field is unknown / cannot be safely compared

Main CTA:
`情報を確認する`

If the unknown is caused by MY TACKLE data, deep-link to editing the selected item.

### `不足`
Use when:
- no rod or reel is registered for a required component, or
- the best available candidate has a required hard mismatch

Main CTA:
- `手持ちを追加` when ownership is absent
- `不足を見る` when known compatibility is the blocker

---

## 8. UI — result page

Reuse the existing `MY TACKLE CHECK` location immediately after required tackle.

### New first block

```text
MY SET
今回持っていく候補

[ READY / 要確認 / 不足 ]

ROD
<owned tackle name>
<short reason>

REEL
<owned tackle name>
<current line>
<short reason>

[ このセットで行く ]
```

### Secondary disclosure
Below the primary set:

`他の手持ち候補を見る`

Expand to show the current per-item fit list.

This preserves existing information without forcing the user to interpret every row before getting an answer.

### No MY TACKLE registered
Do not block the normal fish-first flow.

Show:

`MY TACKLEを登録すると、今回持っていくロッド/リールまで自動で絞れます。`

CTA:
`手持ちを登録`

---

## 9. Lock behavior — `このセットで行く`

On tap:
1. capture the current target/game-plan identity
2. capture the current FIRST CAST selection
3. reference the selected owned rod/reel IDs
4. capture the visible readiness/reasons needed to reconstruct the snapshot safely
5. save an additive Trip Snapshot
6. show a short confirmation
7. expose `FIELD MODEで使う`

Locking must **not** mutate catalog specs or MY TACKLE records.

If the plan or owned records change later, the app may offer to rebuild; it must not silently rewrite the historical locked snapshot.

---

## 10. Persistence

Recommended new key:

`fish_target_v24_trip_ready`

Envelope:

```js
{
  schema_version: 1,
  latest: { ...tripSnapshot },
  recent: []
}
```

Vertical Slice may keep only `latest` if that is materially simpler. Do not build a full trip-history system unless required.

Trip Snapshot conceptual minimum:

```js
{
  id,
  created_at,
  target,
  method,
  place,
  season,
  goal,
  first_cast,
  owned_rod_id,
  owned_reel_id,
  readiness,
  reasons,
  plan_version
}
```

### Save Safety
- no destructive migration of `fish_target_v17_tackle`
- parse failure must fall back safely
- missing referenced owned item after later deletion must degrade to `要確認`, not crash
- schema version required

---

## 11. Home / continuity

Only show a TRIP READY resume block when a locked snapshot exists.

Suggested hierarchy:

```text
前回のTRIP READY
ヒラメ · サーフ · ルアー
ROD: <name>
REEL: <name>

[ そのまま見る ] [ 今日の条件で作り直す ]
```

Do not put this above the first-use fish selection for a new user.

For returning users, it may appear near the existing continuity/favorites area.

---

## 12. FIELD MODE integration

FIELD MODE must visibly show the locked MY SET near the required-tackle block:

- rod
- reel
- current user line
- readiness if not READY

If no locked trip exists, current FIELD MODE behavior remains unchanged.

No FIELD LIVE dependency.

---

## 13. Alternative candidates

P0 does not need a complex optimizer UI.

When multiple valid items exist:
- show selected candidate
- allow `他の候補` disclosure
- each alternative keeps the existing fit label/reasons

P1 can add one-tap candidate switching if real-device UX shows value.

---

## 14. Required automated tests

### Logic
1. one clean rod + one clean reel -> READY
2. no owned items -> missing
3. clean rod + no reel -> missing
4. no mismatch but missing critical rod field -> review
5. no mismatch but missing reel current line -> review when line comparison is required
6. known hard mismatch -> missing
7. lb recommendation vs owned `号` -> review, never converted
8. cm/inch/egi/hook units never become cast grams
9. deterministic selection with equal candidates
10. better-known candidate beats equal-level unknown candidate
11. hard mismatch never beats review candidate
12. manual and catalog entries participate equally when their typed data is equivalent

### Persistence
13. lock survives reload
14. corrupt trip snapshot fails safely
15. deleting referenced owned tackle after lock does not crash
16. MY TACKLE key/content is unchanged by trip lock

### UI/behavior
17. no ownership does not block normal result flow
18. CTA locks current selected set
19. FIELD MODE shows locked set
20. alternative disclosure works
21. 375/390/430 no horizontal overflow

---

## 15. Lightweight telemetry contract

Use existing local/internal tracking during development if useful; do not add a new SDK just for this slice.

Events:
- `my_set_view`
- `my_set_ready`
- `my_set_review`
- `my_set_missing`
- `my_set_select`
- `trip_ready_lock`
- `trip_ready_resume`
- `field_mode_from_trip_ready`

Do not send free-form tackle names or other unnecessary user-entered text to production analytics without a separate privacy decision.

---

## 16. Files expected to change after V23 Merge Gate

Likely:
- `tackle.js`
- `tackle.css`
- `continuity.js`
- `continuity.css`
- `field-mode.js`
- `field-mode.css`
- targeted tests
- possibly one small dedicated trip-ready module if `tackle.js` growth would otherwise become excessive

Architecture preference:
If MY SET + trip snapshot would materially bloat `tackle.js`, create a focused module rather than continuing one-file growth.

Do not decide this solely by line count; decide by responsibility boundary.

---

## 17. Rollback

V24 should be additive.

Rollback strategy:
- remove/disable MY SET/TRIP READY UI/module
- ignore the additive `fish_target_v24_trip_ready` key
- retain untouched V23 `fish_target_v17_tackle`
- existing result/MY TACKLE/FIELD MODE continue functioning

No rollback should require restoring user tackle data from backup.

---

## 18. Vertical Slice DoD

The slice is done only when:
- the app chooses a defensible owned rod/reel pair
- readiness cannot falsely turn green on missing information
- selection reasons are visible
- user can lock the set
- reload preserves it
- FIELD MODE uses it
- non-MY-TACKLE users retain the normal flow
- automated regression passes
- browser/device widths pass
- V23 behavior remains intact

Do not call V24 complete based only on rendering the card.
