# FISH TARGET Platform Architecture v1

Status: core migration layers implemented; latest implementation checkpoint dual-Green
Date: 2026-08-30

## Goal
Turn FISH TARGET from feature-by-feature growth into a scalable decision-engine platform where product, species, method, asset, and resolver changes can be added through validated data pipelines instead of repeated UI/code surgery.

Canonical decision flow:

`Species -> Method/AUTO -> FIRST CAST -> Requirements -> MY TACKLE fit -> Product Match -> Field steps -> FIELD MODE`

## Baseline and boundaries
- Rollback baseline: `4080f509db63e2dcd03d1480cbc5a427f1cb0bbc`
- Work branch: `chatgpt/platform-architecture-v1`
- PR: #17, Draft
- `main` merge is prohibited without explicit approval.
- Manufacturer-official catalog rows remain research/internal-testing data unless rights/terms are separately cleared.
- Third-party fish-image binary download + commit/re-distribution requires explicit approval.
- Automated browser Green does not replace 390x844 iPhone/PWA visual verification.

## Completed migration layers

### A. Architecture audit
Repository responsibilities and scalability risks were inventoried. The main risks were large legacy domain files, staged method generations, per-vendor catalog growth, UI/domain coupling, and unstable fish-image provenance.

### B. Catalog boundary cleanup
- `catalog-research.js`: factual research rows only.
- `catalog-fixtures.js`: synthetic development fixtures only.
- `catalog.js`: development runtime composition without re-mixing the source boundary.
- `catalog-loader.js`: lazy runtime; catalog data does not boot-load with the PWA shell.
- Legacy direct-load compatibility remains available.

Current composition:
- 41 batches
- 19 makers
- 946 factual research rows
- 14 synthetic fixtures
- 960 development runtime products
- 516 JAN values

### C. Generic Catalog Contract Gate
`scripts/catalog-contract-qa.mjs` centrally validates:
- manifest/batch integrity
- expected row counts
- source and license metadata
- maker consistency
- stable product IDs
- duplicate canonical product keys
- JAN format and uniqueness
- provider-policy leakage
- current/installed-line leakage into product facts
- factual/fixture/runtime composition
- publication fail-closed behavior

Scale QA remains Green at 1k / 5k / 10k products.

### D. Species Registry
`species-registry.js` exposes the current product targets as immutable resolver-facing records.

Contract:
- 60 canonical targets
- stable `species_id`
- canonical name + aliases
- exact canonical name/ID wins
- ambiguous aliases fail closed
- deterministic generated IDs with explicit-ID override support

### E. Method Registry
`method-registry.js` projects the current Fishing Plans into immutable records.

Stable identity:

`plan_id = species_id + ':' + method_id`

Current contract:
- 150 linked plans
- globally unique plan IDs
- requirements
- FIRST CAST
- steps / places / mistakes
- source evidence

### F. Resolver Engine
`resolver-engine.js` now owns the compatibility boundary for:
- `resolveSpecies`
- `resolveMethods`
- `resolvePlan`
- `resolveFirstCast`
- `resolveRequirements`
- `evaluateOwnedTackle`
- `matchCatalog`
- `rankCatalogMatches`

MY TACKLE migration:
- legacy fit remains the behavioral oracle
- Resolver shadow parity is enforced
- visible MY TACKLE candidate selection is Resolver-backed through `RESOLVER-TACKLE-UI-2`
- current runtime plan/rotation context is preserved so goal/method/FIRST CAST changes do not drift

Catalog Match shadow:
- Catalog remains lazy; shadow does not trigger boot-time loading
- default matching exposes production-eligible rows only
- restricted research requires explicit `includeResearch:true`
- synthetic fixtures require a separate explicit `includeSynthetic:true`
- existing `rodFit` / `reelFit` logic is reused rather than creating a second fit engine
- existing visible `PRODUCT_DB` cards are unchanged

Verified Browser evidence at implementation checkpoint `173bdf4c7cb6d4d3efe7e1db813d3269b7050bd6`:
- `rc-qa #565`: PASS
- `rc-browser-qa #474`: PASS
- Resolver Catalog Shadow for the ヒラメ test path evaluated 946 candidates
- top shadow rod: `daiwa:rod:lateo:unknown:96m-k`
- top shadow reel: `daiwa:reel:bg-sw:unknown:5000-h`
- research-only candidates: 946
- synthetic matches: 0
- overlap with current static rod/reel recommendations: 1

Interpretation:
The resolver/catalog boundary works, but a visible Catalog consumer switch is intentionally blocked. The current factual catalog is research-only and the low overlap shows that product recommendation semantics still need an approved coverage/ranking policy before replacing the current static recommendation surface.

### G. Validated species/method authoring pipeline
The authoring/generation scaffold is implemented:
- source validation
- duplicate and cross-reference checks
- generated runtime
- registry/browser verification

This does **not** mean the legacy 150-plan source set has been fully migrated out of staged `target-method-data-v1..v4` files. Migration remains incremental; new work should prefer the validated authoring path where practical.

### H. Fish Asset Manifest and intake pipeline
Bundled-first architecture is implemented with:
- Species Registry linkage
- Fish Asset Authoring
- generated runtime
- Fish Asset Manifest
- stable Rights Queue IDs
- research Candidate Registry
- side-effect-free Intake Planner
- Intake Receipt contract
- source/output SHA-256 provenance
- transformation history
- Promotion Planner
- publication-ready fail-closed checks
- direct-file build hash verification

Current image state:
- 60 canonical targets
- 19 currently bundled targets
- 41 non-bundled rights-queue targets
- 35 verified image candidates
- 6 taxonomy-review targets
- first approved binary-intake milestone: 54/60 bundled candidates (19 + 35)

No third-party candidate binary has been downloaded, committed, redistributed, or promoted by this architecture work.

## CI architecture
- `rc-qa`: syntax, authoring contracts, build, regression, catalog contract, scale QA.
- `rc-browser-qa`: boot, result UX, visual regression, asset manifest/photo, target/domain registry, Resolver, lazy Catalog, and manufacturer-specific regressions.
- PR routing uses `GITHUB_HEAD_REF`.
- Workflow concurrency cancels superseded PR runs.

## Current blockers / external gates

### Catalog publication
The 946 factual manufacturer research rows are not production eligible. Do not expose them as approved runtime recommendations until rights/terms and product recommendation policy are cleared.

### Fish-image binary intake
Research metadata and intake machinery may proceed autonomously. Actual third-party binary acquisition plus commit/re-distribution requires explicit approval.

### Device acceptance
PHOTO27R3 / bundled imagery is not visually complete until verified on the 390x844 iPhone/PWA path.

## Next execution gates
1. Keep the Resolver Catalog Shadow as evidence; do not switch visible product recommendations yet.
2. Resolve/clear Catalog publication rights and ranking/coverage policy before a consumer migration.
3. Continue species/method legacy-source migration only where it reduces future authoring cost; avoid destructive big-bang rewrite.
4. After explicit approval, intake the 35 verified fish-image candidates through receipt/hash/provenance gates.
5. Run rc-qa + full Browser QA on every new exact HEAD.
6. Perform iPhone/PWA device QA before image/PHOTO acceptance.
7. Only after Release Candidate audit and explicit approval may `main` merge/public release be considered.

## Hard invariants
- no fabricated unit conversions
- no EGI/oz/lb/sinker conversion unless the manufacturer explicitly provides it
- no spool-capacity/current-line mixing
- no guessed lifecycle or JAN
- MAX-only remains min=null / max=value
- multi-context manufacturer ranges remain separate
- restricted manufacturer rows never become production-publishable by inference
- ambiguous species aliases/taxonomy never guess
- no duplicate species IDs or plan IDs
- no `main` merge without explicit approval
- no unverified claim of completion/fix/Green
