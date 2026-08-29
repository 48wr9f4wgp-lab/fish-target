# FISH TARGET Platform Architecture v1

## Goal
Turn FISH TARGET from feature-by-feature growth into a scalable decision-engine platform where product, species, method, asset, and resolver changes can be added through validated data pipelines instead of repeated UI/code surgery.

## Baseline
- Rollback baseline: `4080f509db63e2dcd03d1480cbc5a427f1cb0bbc`
- Work branch: `chatgpt/platform-architecture-v1`
- Production/main merge: prohibited until explicit approval and full quality gates
- Manufacturer official catalog rows: research/internal testing only; production publication remains blocked

## Target architecture

### Catalog
`source/raw -> normalize -> validate -> review -> approved runtime -> resolver`

Boundaries:
- provider policy
- adapters/normalization
- factual research rows
- synthetic development fixtures
- runtime composition
- production eligibility

### Decision domain
`Species Registry -> Method Registry -> Requirements -> Resolver -> MY TACKLE/Product Match -> UI`

### Assets
`Species Registry -> Asset Manifest -> bundled verified asset -> attribution/license -> safe fallback`

## Completed migration layers

### A. Architecture audit
- Repository structure inventoried.
- Main scalability risks identified: large legacy `data.js`, staged target-method generations, catalog files/tests growing per vendor/series, runtime/domain responsibilities mixed with UI.

### B. Catalog boundary cleanup
- Factual research catalog separated from synthetic fixtures.
- `catalog-research.js` owns factual research composition.
- `catalog-fixtures.js` owns synthetic development fixtures only.
- `catalog.js` composes both for the current development runtime.
- Legacy direct-load compatibility retained without repopulating fixture boundary with factual rows.
- `catalog-research.js` is now shipped as a lazy runtime asset and remains outside install-time PWA shell.

### C. Generic Catalog Contract Gate
`scripts/catalog-contract-qa.mjs` now validates all catalog batches through one central contract:
- manifest/batch integrity
- expected row counts
- maker consistency
- source/license requirements
- duplicate canonical product keys
- JAN format/uniqueness
- provider-policy leakage
- user-owned/current-line leakage into catalog facts
- research/fixture/runtime composition consistency
- runtime validation
- production publication remains fail-closed

Verified scale baseline:
- 41 batches
- 19 makers
- 946 factual research rows
- 14 synthetic fixtures
- 960 runtime products
- 516 JAN values
- 1k / 5k / 10k scale QA passes

### D. Species Registry compatibility layer
`species-registry.js` exposes current targets as immutable records without changing legacy `F` authoring yet.

Stable lookup fields:
- `species_id`
- canonical name
- aliases
- water
- styles
- tags
- difficulty
- default method
- method IDs
- plan count

Rules:
- exact canonical name/ID wins
- ambiguous aliases never guess
- generated IDs are deterministic; future explicit IDs can override them
- registry is shipped in the offline shell

Current contract target: 60 species / 150 linked plans.

### E. Method Registry compatibility layer
`method-registry.js` projects current Fishing Plans into immutable resolver-facing records.

Stable identity:
`plan_id = species_id + ':' + method_id`

Each record exposes:
- species identity
- method identity
- style/difficulty
- rationale
- tackle requirements
- FIRST CAST fields
- steps
- places
- mistakes
- source evidence

Current contract target: 150 globally unique plan IDs.

## CI architecture
- Regression/build/catalog contract run in `rc-qa`.
- Current browser suite routes PRs using `GITHUB_HEAD_REF`, avoiding stale branch detection from `refs/pull/*/merge`.
- Domain registry browser QA validates actual 60-species / 150-plan runtime.
- Workflow concurrency cancels superseded future runs so rapid data/import commits do not accumulate redundant CI work.

## Next migration phases

### F. Resolver Engine boundary
Extract pure resolver functions from UI mutation/render code:
1. species + context -> selected plan
2. plan -> requirements
3. owned gear -> fit result
4. catalog -> candidate products
5. candidates -> ranked result

No UI redesign during extraction. Existing FIRST CAST/MY TACKLE behavior remains the regression oracle.

### G. Authoring pipeline for species/method additions
Move from staged `target-method-data-v1..v4` growth to validated source records + generated runtime modules.

Desired addition path:
`new species/method source record -> schema/contract validation -> duplicate/alias/source checks -> generated registry/runtime -> regression/browser QA`

Do not hand-edit multiple generation files for every future fish.

### H. Fish Asset Manifest
For each species maintain:
- species_id
- bundled asset
- source
- author
- license
- attribution
- verification date

Bundled-first remains the likely production architecture; SVG stays safe fallback.

## Hard invariants
- no fabricated unit conversions
- no product spool-capacity/current-line mixing
- no guessed lifecycle/JAN
- restricted manufacturer rows do not become production-publishable
- no ambiguous species alias guessing
- no duplicate species IDs or plan IDs
- no main merge without explicit approval
- automated pass does not replace iPhone/device verification for visual/photo acceptance
