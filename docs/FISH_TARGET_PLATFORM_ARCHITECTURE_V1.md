# FISH TARGET Platform Architecture v1

Status: Architecture baseline / migration plan
Base SHA: 4080f509db63e2dcd03d1480cbc5a427f1cb0bbc
Branch: chatgpt/platform-architecture-v1
Date: 2026-08-30

## 1. Goal

FISH TARGETを、商品・魚種・釣法を追加するたびに個別コードを増やす構造から、データ投入中心で拡張できる意思決定プラットフォームへ移行する。

最終導線は維持する。

Species -> Method/AUTO -> FIRST CAST -> Requirements -> MY TACKLE fit -> Real products -> Field steps -> FIELD MODE

## 2. Non-goals

- mainへ直接mergeしない
- 現行UIを全面作り直さない
- PHOTO27R3の挙動をこのArchitecture commitで変更しない
- restricted manufacturer dataをproduction公開しない
- manufacturer native unitを推測変換しない

## 3. Current-state audit

### 3.1 Strengths to preserve

- `scripts/catalog-ingest.mjs` already provides a useful ingestion boundary: maker/category/status/license checks, source requirements, JAN format checks, duplicate detection, numeric range checks and deterministic rendering.
- `catalog-batch-manifest.json` already gives batch-level inventory and expected row counts.
- `catalog-loader.js` already lazy-loads catalog assets rather than boot-loading all catalog data.
- `catalog-adapters.js` already preserves important raw fields such as sinker load, standard sinker load, application, drag type, PE capacity and native power text.
- Catalog publication policy is separated through provider/license checks.
- Species/method expansion tests and catalog regression tests already exist.

### 3.2 Structural debt

1. `catalog-fixtures.js` mixes synthetic development fixtures and factual catalog rows into one runtime composition. The name and responsibility no longer match the production-scale role.
2. Product data exists in a mixed migration state: some batches have JSON source inputs, while many catalog files are hand-authored JS modules without a common raw-source file path.
3. Maker/product-specific browser QA files have multiplied. This does not scale linearly to thousands of SKUs.
4. `data.js` contains species identity, search aliases, method recommendation, tackle requirements, field procedure and seasonal guidance in large inline objects. Species addition therefore risks touching too many concerns at once.
5. `target-method-data-v1..v4-part*.js` is version-layered expansion data rather than one canonical method registry. This increases duplicate/precedence risk.
6. `app.js` is large enough that additional domain logic should not continue accumulating there.
7. Fish image identity is currently split between local sprite mapping and runtime remote resolution. This is not a stable asset contract for future species growth.

## 4. Target architecture

### 4.1 Domain registries

Create canonical registries with stable IDs.

#### Species Registry

Owns only species identity and stable biological/product-facing metadata.

Required fields:
- `species_id`
- `display_name_ja`
- `aliases`
- `water_type`
- `tags`
- `difficulty_default`
- `asset_id`
- `method_ids`
- `status`

Must not directly own product SKUs.

#### Method Registry

Owns reusable fishing-method definitions.

Required fields:
- `method_id`
- `display_name_ja`
- `style`
- `water_type`
- `requirements`
- `first_cast_template`
- `field_steps`
- `common_mistakes`
- `applicable_place_types`

A species links to one or more method IDs; shared requirements are not duplicated per species unless an override is necessary.

#### Species-Method Overrides

Only exceptional species-specific changes belong here.

Examples:
- lure weight override
- leader strength override
- season-specific note
- target-specific first-cast change

### 4.2 Catalog pipeline

Canonical flow:

`raw source -> normalized candidate -> schema validation -> anomaly checks -> review state -> approved research catalog -> runtime build`

Keep production publication as a separate gate.

Directory target:

- `catalog/raw/<maker>/...json`
- `catalog/normalized/...json`
- `catalog/runtime/...generated.js`
- `catalog/manifests/catalog-batches.json`
- `catalog/schemas/product.schema.json`

Transition can be incremental; existing assets do not need to move in one destructive refactor.

### 4.3 Catalog states

Every factual row should have explicit ingestion state separate from product lifecycle.

Suggested values:
- `candidate`
- `validated`
- `reviewed`
- `rejected`

This is distinct from product lifecycle:
- `current`
- `discontinued`
- `legacy`
- `unknown`

And distinct from publication rights:
- `restricted`
- `permitted`
- `licensed`
- etc.

### 4.4 Resolver Engine

Separate recommendation logic from UI.

Target API contracts:

- `resolveSpecies(speciesId)`
- `resolveMethods(speciesId, context)`
- `resolveFirstCast(speciesId, methodId, context)`
- `resolveRequirements(speciesId, methodId, context)`
- `evaluateOwnedTackle(requirements, ownedTackle)`
- `matchCatalog(requirements, catalogContext)`
- `rankCatalogMatches(matches, context)`

UI consumes resolver output; UI should not encode product-fit rules.

### 4.5 Fish Asset Manifest

Move toward bundled-first for release quality.

Required asset metadata:
- `asset_id`
- `species_id`
- `path`
- `source_url`
- `author`
- `license`
- `attribution`
- `verified_at`
- `crop_policy`
- `orientation`

Remote resolution may remain as research/fallback tooling, not the primary release contract if device QA remains unstable.

## 5. Automation design

### Product addition

1. Fetch/collect manufacturer official source.
2. Extract candidate rows.
3. Preserve manufacturer-native units and raw context.
4. Run ingest/schema validation.
5. Run anomaly checks.
6. Generate review report/diff.
7. Human/AI approval for factual correctness and rights metadata.
8. Generate runtime batch.
9. Generic catalog contract tests.
10. Targeted smoke test only when a new schema pattern is introduced.

Do not create a new maker-specific browser test for every product family unless the family introduces new rendering/fit behavior.

### Species addition

1. Add Species Registry row.
2. Link existing Method IDs or add a new Method Registry row if truly new.
3. Add species-method override only when required.
4. Add bundled image manifest row and asset.
5. Run schema and cross-reference validation.
6. Auto-generate list/detail smoke cases.
7. Run resolver regression.

Target outcome: normal species additions should not require editing UI code.

## 6. Validation gates

### Catalog generic gates

- schema validity
- stable product ID
- duplicate product key
- duplicate JAN/UPC
- source metadata required
- official-source requirement where requested
- native-unit preservation
- MAX-only remains min=null
- multi-context ranges are not collapsed
- spool capacity never becomes installed/current line
- lifecycle is never inferred without source support
- fixture/factual separation
- manifest expected row count

### Registry generic gates

- unique stable ID
- no dangling species->method reference
- no dangling species->asset reference
- every active species has at least one method
- every release species has a safe fallback asset
- aliases do not ambiguously collide without explicit resolution

## 7. Benchmark policy

Do not freeze one permanent benchmark title list.

Freeze the comparison framework instead:
- decision speed
- search/findability
- recommendation clarity
- trust/explainability
- tackle fit UX
- field usability
- visual species identification
- offline behavior
- catalog freshness/coverage

Maintain two benchmark layers:

1. `Standing Reference Set` — 3 to 5 strong products retained temporarily for continuity.
2. `Live Challenger Set` — refreshed before major UX/Visual/RC decisions.

If a standing reference becomes stale or a better challenger appears, replace it. The benchmark axis remains stable.

## 8. Migration phases

### Phase A — Architecture lock

- Add this architecture baseline.
- Inventory current domain/data ownership.
- No behavior change.

### Phase B — Catalog boundary cleanup

- Separate factual rows from synthetic fixtures in runtime composition.
- Keep compatibility facade so UI does not break.
- Standardize generated batch registration.

### Phase C — Generic catalog validation

- Expand ingest validation for project-specific invariants.
- Replace unnecessary per-family QA with data-driven contract cases.

### Phase D — Species Registry extraction

- Extract species identity/search metadata from `data.js` behind compatibility adapter.
- Preserve existing 60-species behavior.

### Phase E — Method Registry extraction

- Collapse v1-v4 method expansions into one canonical method registry + overrides.
- Add cross-reference tests.

### Phase F — Resolver extraction

- Move FIRST CAST / requirement / fit / ranking rules behind explicit resolver APIs.
- Keep UI output contract stable.

### Phase G — Asset manifest

- Move fish imagery toward bundled-first manifest.
- Keep SVG fallback.

### Phase H — Addition tooling

- One command/report for product candidate ingestion.
- One command/report for species addition validation.

## 9. Immediate priorities

P0: preserve current SHA as rollback baseline.
P0: finish Browser Gate observation for PHOTO27R3; do not call it complete while the workflow remains unresolved.
P0: implement Phase B without touching user-visible behavior.
P1: implement generic catalog invariant tests.
P1: extract Species Registry behind compatibility adapter.
P1: converge method data into canonical registry.
P1: bundled-first fish asset manifest if PHOTO27R3 device QA is still inadequate.

## 10. Definition of success

The platform architecture is successful when:

- adding a normal product family requires data + source metadata, not new UI logic;
- adding a normal species requires registry + asset + method links, not edits across multiple UI files;
- factual catalog and synthetic fixtures are structurally separated;
- schema/invariant failures block generated runtime data before browser QA;
- recommendation logic can be tested without rendering UI;
- catalog scale can grow from ~1k to several thousand SKUs without one-off QA files multiplying at the same rate;
- release publication rights remain a separate explicit gate.
