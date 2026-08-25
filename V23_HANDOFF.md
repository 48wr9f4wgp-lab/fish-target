# V23 MY TACKLE Catalog — Handoff

## Branch
- ChatGPT implementation branch: `chatgpt/feature-v23-tackle-catalog`
- Base: `codex/release-rc1`
- Draft PR: `#16`
- Do not merge `main` from this workstream until RC1 device QA and stacked RC integration are handled separately.

## Scope implemented in DEV1
- `catalog-providers.js`: explicit provider boundary. DAIWA is PoC-only; SHIMANO is fixture-only. Both are production-disabled.
- `catalog-fixtures.js`: development-only synthetic DAIWA/SHIMANO fixture rows isolated from the catalog core.
- `catalog.js`: provider-agnostic catalog core, schema validation, source/license gates, Unicode-safe stable product IDs, search and ownership snapshots.
- `tackle.js`: catalog-first registration flow plus legacy/manual input fallback.
- Catalog reel registration intentionally asks for the line actually spooled on the reel instead of inferring it from manufacturer line-capacity specs.
- Existing records without `source` are interpreted as `manual`; the storage key remains `fish_target_v17_tackle` and no destructive migration is performed.
- Catalog provider/fixture/core assets load before `tackle.js` and are included in the offline shell.
- `V23-DEV1` identifies this feature build. FIELD LIVE remains off.

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

## Tests added / updated
- Development catalog schema validation.
- Production gate rejects synthetic data.
- Provider gates remain production-disabled.
- Unicode/Japanese stable product ID collision regression.
- Rod ownership snapshot mapping.
- Reel line non-inference regression.
- Legacy record defaults to manual.
- Catalog search boundaries.
- Public artifact version regression now reads `build.config.json` instead of hardcoding V22-RC1.
- GitHub Actions `rc-qa` run #40: SUCCESS on head `fc02d747...` before this documentation-only update.

## Still to do
- Browser interaction regression for the new bottom-sheet selector at 375/390/430 widths.
- Add chunk/index lazy loading before scaling beyond the small DEV fixture.
- Add discontinued/unknown product browser behavior.
- Add edit flow for catalog-backed tackle.
- Add importer PoC/fixture adapters behind the existing provider boundary without production publishing.
- Codex final E2E/performance review after Codex limits reset.

## Codex rejoin procedure
1. `git status`
2. `git fetch origin`
3. Inspect `origin/chatgpt/feature-v23-tackle-catalog`, PR #16 and this file.
4. If the local `codex/feature-v23-tackle-catalog` has no unique commits, fast-forward it to the ChatGPT branch.
5. If it has unique work, do not reset it; compare commits and merge/cherry-pick intentionally.
6. Run `npm run test:syntax`, `npm test`, browser E2E and iPhone-width regression before continuing.
