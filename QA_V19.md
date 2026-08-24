# FISH TARGET v19 QA

## Scope
Simplification pass only. No new fishing capability is added.

## Product decisions
- Core promise remains: target fish -> method -> FIRST CAST -> required tackle -> MY TACKLE -> three field steps.
- FIELD MODE remains the primary action after the core answer.
- Home no longer gives full visual weight to MY TACKLE; it becomes a compact shortcut.
- Filters are collapsed by default.
- Fish cards are visually compressed for faster scanning.
- FIELD LIVE + LIVE AUTO ADJUST + manual condition controls are grouped under one `今日の条件を反映` disclosure.
- The redundant standalone NOW ASSIST block is hidden from the default UI.
- Evidence, products, pack list, rig, and mistakes are grouped under one `詳細を見る` disclosure.
- MY TACKLE ○/△/× itemized reasoning is collapsed behind `判定理由を見る`; NEXT BUY guidance stays visible.

## Automated / local checks
- `simplify.js` syntax: pass
- Dynamic DOM grouping: pass
- Repeated `renderResult()` does not duplicate groups: pass
- Recreated v18 fit breakdown is re-collapsed after render: pass
- FIELD LIVE is under `v19Conditions`: pass
- Evidence/details are under `v19Details`: pass
- Redundant NOW ASSIST hidden: pass
- Home MY TACKLE large card hidden; shortcut retained: pass
- Filter panel collapsed behind one control: pass
- iPhone-width horizontal overflow: 0
- Page errors in synthetic integration QA: 0
- Service Worker cache bumped to `fish-target-shell-v19`

## Regression boundary
- Fish database: unchanged
- Product database: unchanged
- Recommendation engine: unchanged
- FIELD LIVE fetch/logic: unchanged
- FIRST CAST logic: unchanged
- MY TACKLE matching logic: unchanged
- Fit explanation logic: unchanged
- Save/restore logic: unchanged

## Pending device verification
- GitHub Pages shows V19 on iPhone Home Screen.
- Home feels materially shorter: compact MY TARGETS, no large MY TACKLE card, collapsed filters, shorter fish cards.
- Fish result shows core answer first, then FIELD MODE.
- `今日の条件を反映` opens FIELD LIVE/AUTO/refine.
- `詳細を見る` opens rig/evidence/products/pack/mistakes.
- MY TACKLE shows NEXT BUY while ○/△/× details stay collapsed until requested.
- Offline airplane-mode QA remains separately pending.

Status: LOCAL QA PASS / DEVICE QA PENDING
