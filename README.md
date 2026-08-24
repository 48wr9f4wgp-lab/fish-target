# FISH TARGET

Fish-first fishing setup advisor. Choose a target fish and get a recommended method, tackle, rig, first cast, products, live-condition adjustment, and a field-use plan.

## Current build

- Canonical working version: v16
- DEV / device test: GitHub Pages from `main`
- Primary target: iPhone Safari / Home Screen PWA-style usage
- Production candidate: Vercel only at release checkpoints; one project / one fixed URL
- v15 offline device verification is still pending; do not mark offline support complete until iPhone airplane-mode QA passes

## Current product layers

- v13 — 3-second result hierarchy: method → FIRST CAST → tackle → three steps
- v14 — FIELD MODE for on-the-water use
- v15 — PWA shell / network-first offline fallback
- v16 — last-plan resume, favorite targets, recent targets

## Main files

- `index.html` — stable core markup
- `style.css` / `quick-plan.css` / `field-mode.css` — core UI
- `data.js` — fish/method data
- `products.js` — product recommendation data
- `app.js` — rendering, recommendation state, live-condition logic, persistence
- `field-mode.js` — FIELD MODE
- `pwa.js` / `sw.js` — PWA and offline shell
- `continuity.js` / `continuity.css` — v16 retention/continuity layer

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
- Fish → result renders method, FIRST CAST, tackle, rig, and pack list.
- Shore/boat changes update method and products where applicable.
- Manual FIRST CAST is not overwritten until AUTO is restored.
- Saltwater marine state does not leak into freshwater targets.
- FIELD MODE opens and returns correctly.
- Save/restore survives unavailable localStorage.
- MY TARGETS resume/favorites/recent flows do not block first-use UX.
- No horizontal overflow at iPhone widths.
