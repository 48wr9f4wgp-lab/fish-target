# V24 Product Direction — MY SET / TRIP READY

Last decided: 2026-08-26
Status: product direction / implementation not started

## 1. Product decision

V24 should not expand FISH TARGET into a generic fishing map, social network, catch log, or weather super-app.

V24 should deepen the existing core promise:

`釣りたい魚 -> 何で釣る -> 最初に何を投げる -> 手持ちでいける -> 今回持っていくセットが決まる -> 現場で迷わない`

Working feature name: **MY SET / TRIP READY**.

The V24 job is to turn MY TACKLE from a passive compatibility list into an active pre-trip decision engine.

---

## 2. Competitive signal — 2026-08-26 snapshot

Recent competitor review shows four strong clusters:

### Fishbrain
Strengths:
- catch-location/map network
- community scale
- forecast
- BiteGuide condition advice
- bait/lure recommendations
- logbook

### FishAngler
Strengths:
- maps / verified catches
- weather/tide/solunar
- detailed catch log
- personalized AI game plans based on user catch history
- bait/lure intelligence

### Omnia Fishing
Strengths:
- waterbody + species + season + fishing reports -> techniques/products
- tackle discovery and commerce
- map layers
- lake-specific recommendations

### BassForecast
Strengths:
- location + weather -> fishing rating
- top baits
- strategy recommendations

### Strategic inference for FISH TARGET
Do not try to beat these products by building a bigger map/community/weather data network.

FISH TARGET's strongest existing wedge is:

**target fish -> FIRST CAST -> exact required tackle -> owned-tackle compatibility -> immediate field plan**

The V24 differentiation should therefore be:

**“Among the tackle I already own, what exact set should I take for this target, and what is still missing?”**

This is narrower than a fishing super-app but more decisive at the moment of preparation.

---

## 3. V24 Success Definition

### Repeat
The user repeatedly prepares a fishing trip by choosing a target and confirming the exact setup they will take.

### Delight
The app removes tackle-choice uncertainty and produces a clear, usable setup in seconds.

### Progress
MY TACKLE becomes more valuable as the user registers more owned rods/reels and improves incomplete entries.

### Return
Before the next trip, the user reopens the app to recall or rebuild the saved setup instead of reconstructing it from memory.

### Revenue
V24 itself does not require monetization. It creates a future high-intent commerce surface only when a setup is incomplete and a lawful commerce/catalog source exists.

### Category convention
Preserve the expected fishing-app value of species/conditions/technique guidance, but do not require map/community complexity for the primary flow.

### Differentiation
FISH TARGET gives a **decision using the user's own tackle**, not only generic lure/product recommendations.

---

## 4. Primary V24 flow

### Step 1 — Target
User selects fish as today.

### Step 2 — Game Plan
Existing method + FIRST CAST remain the top result.

### Step 3 — MY SET
New primary card directly after required tackle / MY TACKLE fit:

- Recommended owned rod
- Recommended owned reel
- User's current reel line
- Overall state:
  - `READY`
  - `要確認`
  - `不足`
- short reasons per component

Primary CTA:
`このセットで行く`

### Step 4 — Missing / uncertain
If no clean owned setup can be established:

- show the exact blocker
- distinguish `不足` from `情報不足`
- link to MY TACKLE edit when missing fields are the reason
- connect real equipment gaps to NEXT BUY

Do not turn unknown information into green fit.

### Step 5 — TRIP READY card
After the user locks a set, create a compact trip snapshot:

- target fish
- method
- FIRST CAST
- chosen rod
- chosen reel + current line
- leader/main terminal requirement
- essential pack checklist
- three field steps

CTA:
`FIELD MODEで使う`

### Step 6 — Return
Home/continuity layer should make the most recent locked setup immediately resumable.

The app should answer:
`前回のセットをそのまま見る / 今日の条件で作り直す`

---

## 5. Selection semantics — no false precision

V24 must not invent a fake 0–100 compatibility score.

Use the existing compatibility engine and categorical evidence.

### Eligible recommendation
A MY SET recommendation may be labeled `READY` only when:
- no known critical field is outside the recommended range
- critical required dimensions used by the current method are present
- reel current line is user-owned data, not inferred from manufacturer specs

### `要確認`
Use when:
- no known hard mismatch exists
- but one or more critical fields required for confidence are missing/unknown

### `不足`
Use when:
- one or more known critical dimensions are materially outside the method recommendation
- or no suitable owned item exists for a required component

### Tie-break
When multiple owned items are valid candidates, prefer:
1. fewer unknown critical fields
2. fewer edge-of-range warnings
3. more central fit within known recommended ranges only where the units are already safely comparable
4. stable deterministic ordering

Do not compare incompatible units and do not invent conversions.

The UI should explain why the recommendation won instead of showing false numeric precision.

---

## 6. Required product rules

1. `FIRST CAST` stays above MY SET. The app is fish-first, not inventory-first.
2. MY SET must reuse the current recommendation/compatibility engine; do not create a competing independent rules engine.
3. Missing data never becomes READY.
4. `lb` is never converted to Japanese `号`.
5. cm/inch/egi/hook sizes are never treated as grams.
6. Manufacturer reel specs never imply the user's currently spooled line.
7. Manual/legacy MY TACKLE remains a permanent fallback.
8. Catalog product identity and technical specs remain separate from user-owned overrides.
9. Commerce offers must not become canonical technical specs.
10. A trip snapshot must not destructively mutate MY TACKLE records.

---

## 7. Minimal data model

Prefer a small additive snapshot rather than a new broad persistence system.

Conceptual shape:

```js
{
  id,
  created_at,
  target,
  method,
  first_cast,
  owned_rod_id,
  owned_reel_id,
  readiness: 'ready' | 'review' | 'missing',
  reasons: [],
  checklist_state: {},
  source_plan_version
}
```

Exact persistence design must be decided after V23 final QA and save-safety review.

Do not migrate or overwrite `fish_target_v17_tackle` merely to add trip snapshots.

---

## 8. V24 scope

### P0 — must ship in V24 vertical slice
- owned rod candidate ranking
- owned reel candidate ranking
- READY / 要確認 / 不足 state
- reasons for recommendation/blocker
- `このセットで行く`
- compact TRIP READY snapshot
- resume latest locked setup
- FIELD MODE consumes locked setup
- automated tests for selection invariants

### P1 — after P0 proves useful
- quick switch between 2 valid candidate sets
- prompt to complete missing MY TACKLE fields
- show exactly which missing component would unlock READY
- lightweight analytics events

### P2 — later, not V24 core
- lawful live product offers
- price/stock
- affiliate links
- richer product imagery
- trip history/statistics

---

## 9. Explicit non-goals

Do not add in V24 core:
- social feed
- community posting
- public catch map
- catch-photo AI identification
- large map stack
- GPS tracking
- detailed catch journal
- chat/AI assistant shell
- FIELD LIVE re-enable
- subscriptions/IAP
- mass manufacturer catalog import
- generic 0–100 bite score

These features increase scope without strengthening the owned-tackle decision wedge.

---

## 10. UX hierarchy

Result page target order for V24:

1. Recommended method
2. FIRST CAST
3. **MY SET / TRIP READY**
4. required tackle details / compatibility explanation
5. three field steps
6. FIELD MODE
7. optional deeper detail

Goal: the user should not need to interpret a long list of fit cards before knowing what to take.

---

## 11. Analytics proposal — minimal

Do not install a new analytics SDK solely for V24 during development.

Prepare event names so production telemetry can be added later:

- `my_set_view`
- `my_set_ready`
- `my_set_review`
- `my_set_missing`
- `my_set_select`
- `my_set_edit_tackle`
- `trip_ready_lock`
- `trip_ready_resume`
- `field_mode_from_trip_ready`
- `next_buy_from_missing`

Primary product questions:
- What percentage of MY TACKLE users reach READY?
- What percentage of review/missing states lead to MY TACKLE completion?
- Does locking a trip setup increase FIELD MODE use?
- Do users resume a prior setup before a later trip?

---

## 12. Acceptance criteria for V24 vertical slice

1. With multiple owned rods/reels, the app selects a defensible candidate set deterministically.
2. Known mismatch cannot be labeled READY.
3. Missing critical data cannot be labeled READY.
4. Reel current line is never inferred.
5. User can inspect why each component was selected.
6. User can lock the selected set in one action.
7. Locked plan survives reload without changing MY TACKLE records.
8. FIELD MODE can display the locked setup.
9. Existing fish-first path remains usable without registering MY TACKLE.
10. Manual/legacy owned items remain supported.
11. No horizontal overflow at 375/390/430.
12. Existing V23 regression suite continues passing.

---

## 13. Implementation gate

Do not begin V24 code until the V23 Codex final-QA branch/PR is returned and reviewed.

Reason:
- V24 touches MY TACKLE selection, persistence and FIELD MODE surfaces that overlap the V23 final-QA reserved scope.
- Product/spec work can proceed now; code should wait for the V23 Merge Gate.

After V23 QA review:
1. lock exact selection inputs and critical fields
2. decide additive trip-snapshot persistence key/schema
3. create V24 feature branch
4. implement MY SET vertical slice
5. device/browser QA

---

## 14. Product judgment

V24 should make FISH TARGET more decisive, not broader.

The strongest user-facing sentence should become:

**「釣りたい魚を選べば、最初の1投と、手持ちの中から今回持っていくセットまで決まる。」**

If a proposed feature does not improve that sentence, it is not V24 priority.
