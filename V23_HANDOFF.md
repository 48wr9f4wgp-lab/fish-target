# V23 MY TACKLE Catalog — Handoff

## Branch
- ChatGPT implementation branch: `chatgpt/feature-v23-tackle-catalog`
- Base: `codex/release-rc1`
- Draft PR: `#16`
- Do not merge `main` from this workstream until RC integration is handled separately.

## Scope implemented through DEV2
- `catalog-providers.js`: explicit provider boundary. DAIWA is PoC-only; SHIMANO is fixture-only. Both are production-disabled.
- `catalog-adapters.js`: manufacturer adapter contract. Raw maker rows are normalized into canonical rod/reel shapes without enabling production publication.
- `catalog-fixtures.js`: development-only synthetic DAIWA/SHIMANO rows flow through the manufacturer adapters, including discontinued/unknown lifecycle fixtures.
- `catalog.js`: provider-agnostic catalog core, schema validation, source/license gates, Unicode-safe stable product IDs, ownership snapshots, lifecycle metadata, index metadata and paged query contract.
- `catalog.search(...)`: bounded `{items,total,offset,limit,hasMore}` result.
- `catalog.loadPage(...)`: async selector contract so future chunk/provider loading can replace the current in-memory fixture backing without changing MY TACKLE selector semantics.
- `catalog.index(...)`: maker/series metadata without forcing UI code to scan the full catalog.
- `catalog.statusInfo(...)`: current/discontinued/legacy/unknown metadata; discontinued/unknown remain selectable but require user review.
- `tackle.js`: catalog-first registration plus legacy/manual fallback.
- MY TACKLE selector reads through async `loadPage()` and uses catalog index metadata.
- Search can span series within the selected maker while normal browsing remains maker → series → model.
- Selector and preview surface lifecycle state for discontinued/legacy/unknown products.
- Catalog-backed ownership can be edited without mutating catalog identity/specs: nickname and reel current-line values are persisted in `user_overrides`.
- Catalog reel registration/editing intentionally asks for the line actually spooled on the reel instead of inferring it from manufacturer line-capacity specs.
- Existing records without `source` are interpreted as `manual`; the storage key remains `fish_target_v17_tackle` and no destructive migration is performed.
- Catalog-backed ownership snapshots retain `catalog_status`, provenance/license state and isolated `user_overrides`.
- Responsive CSS includes dedicated ownership edit layout and <=390px fallback.
- `pwa.js` loads providers → adapters → fixtures → catalog → tackle in order and the build/offline shell includes the adapter asset.
- Build identifier is `V23-DEV2`; FIELD LIVE remains off.
- `pages.yml` temporarily allows `chatgpt/feature-v23-tackle-catalog` deployment for device QA.

## Device QA status
- GitHub Pages deploy run #11 succeeded from feature branch commit `162bd2e460ce41e5dd3f52fd44ace83684a15e2c`.
- Manual iPhone Safari smoke QA was performed on the deployed `V23-DEV2` build.
- User visually confirmed no obvious problems in the tested flow.
- Screenshots confirm the MY TACKLE ownership sheet rendered with catalog rods/reels and edit/delete controls, and the result screen rendered MY TACKLE CHECK / NEXT BUY without visible horizontal overflow or major layout breakage.
- Treat this as a manual smoke pass, not a substitute for Codex browser E2E at 375/390/430 widths, offline regression, persistence regression, or performance testing.

## Data policy
- Current catalog rows are synthetic development fixtures only.
- They are explicitly `license_status: synthetic` and production validation rejects them.
- Provider gates also reject DAIWA/SHIMANO production output even if a record is mislabeled with a publishable license while the provider is disabled.
- No DAIWA/SHIMANO production catalog data has been scraped or redistributed.
- SHIMANO production importer/data remains blocked pending permission/licensed source.
- DAIWA official-source work remains PoC-only until redistribution rights are resolved.

## Compatibility invariants
- Existing manual MY TACKLE entries remain usable.
- Missing tackle fields must never become a green fit.
- `lb` is not converted to Japanese line `号`.
- cm/inch/egi/hook sizes are not interpreted as grams.
- Catalog reel model does not imply the user's current line type/size.
- Discontinued/legacy/unknown products are not silently removed from ownership or search; lifecycle state is separate from compatibility specs.
- Catalog edit cannot rewrite maker/series/model/product_id/spec snapshots through the UI.
- Manufacturer adapters normalize input but cannot bypass provider/license production gates.

## Tests added / updated
- Development catalog schema validation.
- Production gate rejects synthetic data.
- Provider gates remain production-disabled.
- Manufacturer adapter normalization and maker-mismatch rejection.
- Unicode/Japanese stable product ID collision regression.
- Rod ownership snapshot mapping.
- Reel line non-inference regression.
- Legacy record defaults to manual.
- Catalog search boundaries.
- Paged query / async `loadPage` contract.
- Maker/series index metadata.
- Discontinued/unknown lifecycle search and status metadata.
- Catalog ownership edit isolation.
- Invalid reel line edits become unspecified instead of creating a false numeric fit.
- GitHub Actions `rc-qa` run #58: SUCCESS on code head `ffa5fb836dff36c8f335d000578faa7b5bb957dc`.
- GitHub Pages deploy run #11: SUCCESS on feature branch head `162bd2e460ce41e5dd3f52fd44ace83684a15e2c`.

## Next Codex phase
- Use `CODEX_TASK_V23_FINAL_QA.md` as the execution contract.
- Primary mission: browser E2E + responsive width matrix + persistence/offline regression + catalog-scale performance audit.
- Fix only validated defects, add regression coverage, and report evidence.
- Do not merge any PR or publish real manufacturer catalog data.

## Codex rejoin procedure
1. `git status`
2. `git fetch origin --prune`
3. Inspect `origin/chatgpt/feature-v23-tackle-catalog`, PR #16, this file, and `CODEX_TASK_V23_FINAL_QA.md`.
4. Preserve any local Codex branch with unique commits; do not reset or delete it.
5. Create a fresh QA/fix branch from the current ChatGPT feature branch unless there is a proven reason to reuse a clean local Codex branch.
6. Run syntax/unit/build first, then browser E2E, width regression, offline/persistence and performance checks.
