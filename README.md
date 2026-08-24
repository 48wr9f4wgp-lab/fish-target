# FISH TARGET

Fish-first fishing setup advisor. Choose a target fish and get a recommended method, tackle, rig, first cast, products, and a pack list.

## Current build

- Canonical working version: v12 source
- Primary target: iPhone Safari / PWA-style web usage
- Deployment: Vercel, but only after local QA
- Production URL policy: one project / one fixed URL; do not create per-version Vercel projects

## Files

- `index.html` — markup only
- `style.css` — UI styles
- `data.js` — fish/method data
- `products.js` — product recommendation data
- `app.js` — rendering, state, live-condition logic, persistence

## Release rules

1. Edit source files locally/GitHub.
2. Run JS syntax checks and local HTTP smoke test.
3. Verify iPhone-width layout and critical flows.
4. Only then deploy to the existing Vercel project.
5. Do not use Base64 loaders, gzip reconstruction, inline file-path placeholders, or HTML post-processing at deploy time.
6. Do not create a new Vercel project for every version.

## Critical regression flows

- Home renders all 19 target fish.
- Search and filters work.
- Fish -> result renders tackle, rig, first cast, pack list.
- Shore/boat changes update method and products where applicable.
- LIVE data only influences recommendations after successful fetch.
- Manual first-cast choice must not be overwritten until AUTO is restored.
- Saltwater marine cards must disappear for freshwater fish.
- Save/restore must not crash if localStorage is unavailable.
- No horizontal overflow at iPhone widths.
