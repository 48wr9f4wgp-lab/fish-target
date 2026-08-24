# FISH TARGET

Fish-first fishing setup advisor. Choose a target fish and get a recommended method, FIRST CAST, required tackle, owned-tackle compatibility, and a field-use plan.

## Current build

- Canonical working version: v20 accuracy candidate
- DEV / device test: GitHub Pages from `main`
- Primary target: iPhone Safari / Home Screen PWA-style usage
- Production candidate: Vercel only at release checkpoints; one project / one fixed URL
- Offline device verification is still pending; do not mark offline support complete until iPhone airplane-mode QA passes

## Product rule

The default experience must answer one question as fast as possible:

`釣りたい魚 -> 何で釣る -> 最初に何を投げる -> 手持ちでいける -> 現場で何をする`

Anything outside that path is secondary and should be collapsed, hidden from first view, or removed if it does not materially improve the decision.

## Current product layers

- v13 — 3-second result hierarchy: method -> FIRST CAST -> tackle -> three steps
- v14 — FIELD MODE for on-the-water use
- v15 — PWA shell / network-first offline fallback
- v16 — last-plan resume, favorite targets, recent targets
- v17 — MY TACKLE: owned rod/reel registration and simple compatibility matching
- v18 — fit explanation: per-spec ○/△/× breakdown and NEXT BUY guidance
- v19 — simplification pass: compact home, collapsed filters, compressed fish cards, one condition group, one details group
- v20 — recommendation accuracy pass: unit-aware MY TACKLE matching, shore/boat lure-bait consistency, and high-risk species corrections

## Main files

- `index.html` — stable core markup
- `style.css` / `quick-plan.css` / `field-mode.css` — core UI
- `data.js` — fish/method data
- `products.js` — product recommendation data
- `app.js` — rendering, recommendation state, live-condition logic, persistence
- `field-mode.js` — FIELD MODE
- `pwa.js` / `sw.js` — PWA and offline shell
- `continuity.js` / `continuity.css` — retention/continuity layer
- `tackle.js` / `tackle.css` — MY TACKLE and compatibility checks
- `fit-explain.js` / `fit-explain.css` — compatibility reasoning and buy guidance
- `simplify.js` / `simplify.css` — information hierarchy and progressive disclosure
- `accuracy.js` — v20 high-risk recommendation and unit-semantics corrections
- `ACCURACY_AUDIT_V20.md` — 19-species accuracy audit and release caveats

## Release workflow

1. Create a feature branch from `main`.
2. Implement without changing unrelated core logic.
3. Run syntax, mobile-width, behavior, and regression QA.
4. Open a PR and inspect the diff.
5. Merge to `main` only after QA passes.
6. GitHub Pages automatically updates the DEV URL for iPhone testing.
7. Vercel is updated only at production checkpoints.

## Critical regression flows

- Home renders all 19 target fish.
- Search and filters work.
- Fish -> result renders method, FIRST CAST, tackle, MY TACKLE, and three field steps before optional detail.
- Shore/boat changes update method, LURE/BAIT metadata, and products where applicable.
- Manual FIRST CAST is not overwritten until AUTO is restored.
- Saltwater marine state does not leak into freshwater targets.
- FIELD MODE opens and returns correctly.
- Save/restore survives unavailable localStorage.
- MY TARGETS resume/favorites/recent flows do not block first-use UX.
- MY TACKLE compares only compatible units: g/oz for lure weight, 号 for line号; cm/inch/egi号/hook号/lb must not be silently reinterpreted.
- Fit explanation must distinguish `推奨内`, `要確認`, and `差が大きい` without presenting manufacturer certification.
- Optional live/detail content remains collapsed by default.
- No horizontal overflow at iPhone widths.
