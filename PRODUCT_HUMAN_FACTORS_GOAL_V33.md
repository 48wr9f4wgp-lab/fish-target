# FISH TARGET — PRODUCT HUMAN FACTORS GOAL V33

Status: Canonical product/UX goal for the current RC branch

This document refines product behavior and usability. It does not replace fishing-data accuracy, publication-rights, save integrity, privacy, performance, or release safety gates.

## 1. Product promise

FISH TARGET is not primarily a fishing map, community feed, weather dashboard, or product catalog.

Its core value is **decision compression using the angler's actual tackle**:

> Pick the fish → understand the first cast → know which owned set to bring → at the water, see the next action immediately.

Canonical consumer flow:

`TARGET → METHOD → FIRST CAST → MY SET → FIELD MODE`

The system may contain deeper evidence, catalog data, compatibility details, packing tools, and planning data, but those must not delay the core decision.

## 2. North-star usability targets

These are FISH TARGET internal usability acceptance targets, not claims about universal human performance.

- From target selection to understanding FIRST CAST and the recommended owned set: **about 15 seconds** in human device testing.
- In FIELD MODE, identify the immediate next action: **about 3 seconds** in human device testing.
- Automated QA does **not** prove these time targets. CI only verifies the prerequisites: hierarchy, visibility, target size, progressive disclosure, local decision availability, responsive layout, and absence of blocking errors.

## 3. Decision-state personas

### A. Weekend executor — primary
Knows the target fish and owns multiple pieces of tackle. Main question: **“What do I bring today?”**

Success:
- FIRST CAST appears before optional detail.
- MY SET is resolved automatically from owned tackle.
- A compatible set has a direct path to FIELD MODE.

### B. Beginner / re-entry angler — entry persona
May not know terminology and may have no saved MY TACKLE.

Success:
- Can understand FIRST CAST without registering tackle or loading Catalog.
- Missing MY TACKLE is a recoverable next step, not a dead end.
- Engineering labels such as IDEAL/MISSING are not required to understand the primary answer.

### C. Experienced angler — trust persona
Wants the conclusion first, but must be able to inspect rationale and alternatives.

Success:
- Consumer answer is visible before evidence.
- Evidence/details are progressive disclosure and closed by default.
- Product candidates are optional and explicitly requested.
- The app remains maker-neutral in its core decision.

### D. At-the-water angler — critical situational persona
One-handed use, wet hands, glare, wind, divided attention, and potentially weak connectivity.

Success:
- FIELD MODE works from local/core data.
- Immediate action is visually dominant.
- Actual owned rod/reel/line is shown when available.
- Nonessential evidence is not required to act.

## 4. Interaction principle

Every core surface follows:

**ANSWER → PRIMARY ACTION → EXPLANATION**

Do not reverse this order merely to expose more system capability.

### Result priority
1. Selected method
2. FIRST CAST
3. MY SET decision
4. Primary next action
5. Optional evidence / alternatives / product candidates

### FIELD MODE priority
1. Target + method context
2. FIRST CAST
3. Immediate field actions
4. Current/required set
5. Conditions / supporting context

Static setup information must not outrank immediate field actions.

## 5. V33 consumer language

Primary MY SET states:
- `このセットで行ける`
- `確認が必要`
- `足りない`

Primary compatible actions:
- `このセットで現場へ`
- `確認して現場へ`

Missing ownership actions:
- `MY TACKLEを追加`
- `MY TACKLEを編集`

FIELD MODE language:
- `反応がなければ`
- `現場の3手`
- `今回のセット` when an owned set is selected

Internal engineering vocabulary may remain in code/tests/evidence where necessary, but must not be required for the main consumer decision.

## 6. Human-factors hard gates

### Touch
- General critical touch targets: **>= 44 CSS px** in both dimensions where applicable.
- Main forward CTA: **>= 48 CSS px height**.
- Motion/transform effects must not transiently shrink a critical CTA below its target floor.

### Type
- Primary MY SET decision: **>= 17 CSS px**.
- FIELD immediate action step text: **>= 15 CSS px**.
- FIELD supporting condition text: **>= 12 CSS px**.
- Critical information must not depend on tiny auxiliary labels.

### Responsive layout
Required RC browser widths:
- 375 px
- 390 px
- 430 px

At those widths:
- no horizontal page overflow;
- METHOD → FIRST CAST → MY SET visual order is preserved;
- critical CTA remains reachable and legible.

### Progressive disclosure
- Evidence/details closed by default.
- Catalog stays cold until explicit user intent.
- Local MY SET decision must not require Catalog/network hydration.
- Publication build keeps local MY SET but hides unavailable research product-candidate actions.

## 7. FIELD MODE rules

FIELD MODE is a glance surface, not a second result page.

It must prioritize:
1. FIRST CAST
2. `現場の3手`
3. `今回のセット` / required set
4. condition/support context

When MY TACKLE produced the selected set, FIELD MODE must show the actual owned rod/reel and current-line information available in the saved record instead of silently replacing them with generic recommendation text.

## 8. Anti-goals

Do not optimize V33 for:
- maximum information density;
- exposing every feature on first view;
- forcing Catalog hydration to make a basic decision;
- copying one competitor's information architecture;
- adding screens or taps to showcase internal sophistication;
- using a successful automated test as proof of the 15-second / 3-second human time targets.

## 9. Verification ladder

### Automated
- syntax/build/regression
- Catalog/content/publication gates
- Chromium RC suite
- V33 human-factors browser gate at 375/390/430
- iOS WebKit gate
- malformed-storage / persistence resilience

### Physical iPhone — required before public GO
Record exact commit SHA, iPhone model, iOS version, and Safari vs installed PWA.

1. Home → target → method → FIRST CAST → MY SET → FIELD MODE → back.
2. Close/reopen: plan, MY TACKLE, and possessions persist.
3. Online once → offline cold launch → FIELD MODE.
4. Upgrade an older cached build without clearing local data; new build launches and owned data remains.
5. Human timing observation for the ~15s planning target and ~3s FIELD glance target.

Automated Green is necessary but not sufficient for public release.
