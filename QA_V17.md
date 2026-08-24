# FISH TARGET v17 QA

## Scope
MY TACKLE: register owned rods/reels and compare them against the current fish plan.

## Automated / local checks
- `tackle.js` syntax: pass
- `pwa.js` syntax: pass
- `sw.js` syntax: pass
- GitHub `tackle.js` blob matches the QA-tested local file
- GitHub `tackle.css` content matches the QA-tested local file (newline-only local normalization)
- v17 title / version injection: pass
- Empty-state MY TACKLE CTA: pass
- Rod registration persistence flow: pass
- Reel registration persistence flow: pass
- Result compatibility card rendering: pass
- iPhone-width horizontal overflow: 0
- Page errors in synthetic integration QA: 0

## Representative compatibility checks
### Hirame / surf lure
Recommended: 9.6–11ft M–MH, 4000 reel, PE 1–1.5, 20–30g first cast.
- 10ft MH / max 40g + 4000 / PE 1.2 => `手持ちで組みやすい`: pass
- 7.6ft L / max 12g + 2000 / PE 0.4 => `買い足し候補あり`: pass

### Bait rod parsing
- `磯竿 2〜3号 / 3〜4.5m` is not interpreted as a 2–3ft lure rod.
- Sabiki hook size is not treated as lure-weight compatibility.
- Representative bait-plan render: no error.

## Matching boundary
Current v17 matching uses only user-entered / plan-readable values:
- Rod: length (ft when applicable), power, lure max weight for lure plans
- Reel: size, line type, line number

Not yet evaluated:
- Manufacturer-specific lure tolerance
- Drag performance
- Spool capacity / exact line length
- Rod action / taper
- Actual product model database lookup

## Device verification pending
- GitHub Pages shows V17 on iPhone Home Screen.
- MY TACKLE sheet opens and closes normally.
- Rod/reel entries persist after app relaunch.
- Result screen shows compatibility judgment.

Status: LOCAL QA PASS / DEVICE QA PENDING
