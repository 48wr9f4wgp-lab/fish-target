# FISH TARGET v18 QA

## Scope
Explain MY TACKLE compatibility instead of showing only a coarse result.

## Local / synthetic checks
- `fit-explain.js` syntax: pass
- Version badge/title updates to V18: pass
- iPhone-width horizontal overflow: 0
- Page errors: 0
- Representative existing-device case reproduced:
  - Rod 9.6ft / MH / MAX60g vs recommended 8.6–9.6ft / ML–M and 14–30g
  - Length: pass
  - Power: caution (`推奨より1段強め`)
  - Lure max: pass
  - Reel 3500 / PE1.2 vs 3000–4000 / PE0.8–1.2: pass
  - NEXT BUY: `買い足し必須ではない`
- Deliberately undersized 7.6ft / L / MAX10g + 2000 / PE0.4 case:
  - Lure max: fail
  - Overall next buy prioritizes rod review
- Bait plans continue to skip lure-weight evaluation.
- Core fish/product recommendation logic is unchanged.

## Product rule
The breakdown is a simplified spec comparison, not manufacturer certification. It does not validate blank strength, drag performance, spool capacity, guide limits, or model-specific safety margins.

## Device gate
GitHub Pages / iPhone device verification required after merge.
Offline airplane-mode QA remains pending separately.

Status: LOCAL QA PASS / DEVICE QA PENDING
