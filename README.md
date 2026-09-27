# FISH TARGET

**LOCKED: owner-only personal fishing utility.** This app is for its owner's fishing decisions, gear comparison and trip preparation, not a general-release product.

Canonical product intent: `build.config.json` -> `productIntent`.
Decision and acceptance scope: [個人専用の確定方針](docs/PERSONAL_USE_LOCK_2026-09-27.md).
Contributor instructions: `AGENTS.md`.

App Store submission, general distribution, monetization, advertising, multi-user accounts and market-wide catalog completion are out of scope unless the owner explicitly changes this decision. Earlier release-oriented checklists are historical where they conflict with this scope; their accuracy, data-safety and usability findings are not automatically resolved.

## Current build

- Canonical build version: `build.config.json`.
- Primary target: iPhone Safari / Home Screen PWA-style usage.
- Current hosted preview route: GitHub Pages. Deployment is a separate, explicitly approved action.
- Multiple branches automatically deploy Pages, including `chatgpt/v34-integration-review`; inspect `.github/workflows/pages.yml` before pushing or merging.
- The product-intent flag is not authentication. The repository was observed public on 2026-09-27; owner-only site access has not been verified. Do not embed personal inventory, locations, credentials or tokens in code or CI artifacts.
- Physical-iPhone offline verification is pending. Do not mark offline support complete from desktop or WebKit simulation alone.

## Product rule

The fish-first path remains:

`釣りたい魚 -> 何で釣る -> 最初に何を投げる -> 手持ちでいける -> 現場で何をする`

Gear comparison, MY TACKLE, trip conditions and packing may also be entered independently. A fish selection or owned-gear registration must not be required merely to compare products.
Prioritize the owner's actual uses, accurate source-labelled data and low operation count. Broad product coverage is not a completion gate.

## Main files

- `index.html`: stable core markup.
- `style.css` / `quick-plan.css` / `field-mode.css`: core UI.
- `data.js` / `products.js`: fish, method and recommendation data.
- `app.js` / `field-mode.js`: UI, recommendation state, live conditions and field mode.
- `pwa.js` / `sw.js`: bootstrap and offline shell.
- `continuity.js`: last-plan, favorite and recent-target utilities.
- `tackle.js` / `fit-explain.js`: owned tackle and compatibility reasoning.
- `gear-compare-v1.js` / `.css`: optional manufacturer-independent comparison; no owned-data writes.
- `navigation-history-v34.js`: view and modal history.
- `scripts/build.mjs`: generates version-consistent `dist/index.html` and `dist/sw.js`.
- `docs/GEAR_COMPARE_V1_AUDIT_2026-09-27.md`: comparison evidence and limits at implementation time.

## Personal development and validation

1. Confirm the working branch, commit and recovery state. Work on a non-deploy branch.
2. Implement the owner's requested improvement without unrelated rewrites.
3. Run syntax, unit, browser and data-preservation checks. Inspect the diff and screenshots.
4. Record exact-commit CI results separately from physical-device validation.
5. Only after explicit approval, update the chosen device-test destination. A merge into a Pages-triggering branch is a deployment action.

Local verification: run `npm test`, then `npm run serve` and open `/dist/`.
`FISH_TARGET_PUBLICATION_BUILD=1` and publication CI are retained as data-isolation regression tests, not an active public-launch milestone or proof of distribution permission.
Personal use does not grant third-party content rights or external-service access; retain provenance and existing fail-closed data boundaries.

## Critical regression flows

- Home, target search and filters derive their coverage from runtime registries.
- Fish -> result exposes method, FIRST CAST, tackle, MY TACKLE and field steps before optional detail.
- Shore/boat changes update the correct method and lure/bait context.
- Manual FIRST CAST remains until AUTO is explicitly restored.
- Saltwater conditions do not leak into freshwater targets.
- FIELD MODE and independent utilities open and return correctly.
- Save/restore tolerates unavailable storage without destroying existing data.
- Product specs and the line actually spooled by the owner remain separate.
- Units and missing values are explicit; same size labels or price bands are not cross-maker performance equivalence.
- Comparison supports 2-3 products, sources, numeric differences, filtering, retry and history without changing MY TACKLE.
- Optional content stays collapsed, with no unintended page overflow at iPhone widths.
