# V23 MY TACKLE Catalog — Handoff

## Branch
- ChatGPT implementation branch: `chatgpt/feature-v23-tackle-catalog`
- Base: `codex/release-rc1`
- Draft PR: `#16`
- Do not merge `main` from this workstream until RC1 device QA and stacked RC integration are handled separately.

## Scope implemented through DEV2
- `catalog-providers.js`: explicit provider boundary. DAIWA is PoC-only; SHIMANO is fixture-only. Both are production-disabled.
- `catalog-fixtures.js`: development-only synthetic DAIWA/SHIMANO fixture rows isolated from the catalog core. DEV2 also includes synthetic discontinued/unknown lifecycle fixtures.
- `catalog.js`: provider-agnostic catalog core, schema validation, source/license gates, Unicode-safe stable product IDs, ownership snapshots, lifecycle metadata, index metadata and a paged query contract.
- `catalog.search(...)`: bounded `{items,total,offset,limit,hasMore}` result for scalable selectors.
- `catalog.loadPage(...)`: async selection contract so future chunk/provider loading can replace the current in-memory fixture backing without changing MY TACKLE selector semantics.
- `catalog.index(...)`: maker/series metadata without forcing UI code to scan the entire catalog.
- `catalog.statusInfo(...)`: explicit current/discontinued/legacy/unknown UI metadata; discontinued/unknown remain selectable but flagged for review.
- `tackle.js`: catalog-first registration flow plus legacy/manual input fallback.
- Catalog reel registration intentionally asks for the line actually spooled on the reel instead of inferring it from manufacturer line-capacity specs.
- Existing records without `source` are interpreted as `manual`; the storage key remains `fish_target_v17_tackle` and no destructive migration is performed.
- Catalog-backed ownership snapshots retain `catalog_status`, provenance/license state and an isolated `user_overrides` object.
- Catalog provider/fixture/core assets load before `tackle.js` and are included in the offline shell.
- FIELD LIVE remains off.

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
- Discontinued/legacy/unknown products are not silently removed from ownership or search; lifecycle state is carried separately from compatibility specs.

## Tests added / updated
- Development catalog schema validation.
- Production gate rejects synthetic data.
- Provider gates remain production-disabled.
- Unicode/Japanese stable product ID collision regression.
- Rod ownership snapshot mapping.
- Reel line non-inference regression.
- Legacy record defaults to manual.
- Catalog search boundaries.
- Paged query / async `loadPage` contract.
- Maker/series index metadata.
- Discontinued/unknown lifecycle search and status metadata.
- Public artifact version regression reads `build.config.json` instead of hardcoding V22-RC1.
- GitHub Actions `rc-qa` run #44: SUCCESS on code head `6f7e188174875c5f626daabb2fe91147fc45ecec` before this documentation-only update.

## Still to do
- Wire MY TACKLE selector UI to `loadPage()` rather than direct `list()` before catalog volume scales.
- Browser interaction regression for the bottom-sheet selector at 375/390/430 widths.
- Surface discontinued/legacy/unknown status visibly in the selector preview.
- Add edit flow for catalog-backed tackle; catalog identity remains immutable while nickname/current-line/user overrides are editable.
- Split real permitted/licensed catalog data into index + chunks once a lawful source exists.
- Add importer PoC/fixture adapters behind the existing provider boundary without production publishing.
- Codex final E2E/performance review after Codex limits reset.

## Codex rejoin procedure
1. `git status`
2. `git fetch origin`
3. Inspect `origin/chatgpt/feature-v23-tackle-catalog`, PR #16 and this file.
4. If the local `codex/feature-v23-tackle-catalog` has no unique commits, fast-forward it to the ChatGPT branch.
5. If it has unique work, do not reset it; compare commits and merge/cherry-pick intentionally.
6. Run `npm run test:syntax`, `npm test`, browser E2E and iPhone-width regression before continuing.
