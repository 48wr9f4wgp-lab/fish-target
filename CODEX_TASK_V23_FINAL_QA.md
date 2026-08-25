# CODEX TASK — V23 FINAL QA / PERFORMANCE / FIX PASS

## Mission
Take the current FISH TARGET `V23-DEV2` MY TACKLE Product Catalog implementation through a **Codex final QA + performance + validated-fix pass**.

This is not a redesign task and not a release/merge task. The goal is to prove the current implementation under browser/device-like conditions, fix only real defects, add regression coverage, and return an evidence-backed branch/PR for review.

## Canonical repository state
- Repo: `48wr9f4wgp-lab/fish-target`
- Source feature branch: `origin/chatgpt/feature-v23-tackle-catalog`
- Existing draft PR: `#16`
- PR #16 base: `codex/release-rc1`
- Build: `V23-DEV2`
- FIELD LIVE: OFF
- GitHub Pages feature preview is temporarily enabled for device QA.
- Manual iPhone Safari smoke QA has passed with no obvious issue reported by the user.
- This manual pass does **not** replace the E2E/width/offline/performance work below.

## Mandatory startup — do not skip
1. `git status`
2. `git fetch origin --prune`
3. Inspect:
   - `origin/chatgpt/feature-v23-tackle-catalog`
   - PR #16
   - `V23_HANDOFF.md`
   - this file
4. Inspect local Codex branches before changing anything.
5. If any existing local Codex branch has unique commits, preserve it. **Do not reset/delete unique work.**
6. Create a fresh working branch from the latest ChatGPT feature branch, recommended:
   - `codex/v23-final-qa`
7. Do not work directly on `main`, `codex/release-rc1`, or `chatgpt/feature-v23-tackle-catalog`.

## Baseline verification first
Before fixing anything, establish the baseline:

```bash
npm run test:syntax
npm test
```

Then record:
- exact starting commit SHA
- Node/browser versions
- test result counts
- any console warnings/errors

If baseline fails, diagnose before continuing. Do not claim later failures are regressions without proving the baseline.

---

# A. Browser E2E — mandatory

Run real browser interaction tests against a local built/served app. Use Browser E2E, not DOM-only unit tests.

## Width matrix
Run the core flow at:
- 375 px
- 390 px
- 430 px

Use mobile-like viewport heights and touch-capable emulation where practical.

## Core scenario
For every width, verify at minimum:
1. App loads and visibly reports `V23-DEV2`.
2. No uncaught console errors.
3. Home screen is usable and no horizontal page overflow exists.
4. Open `MY TACKLE` registration/edit bottom sheet.
5. Sheet opens, closes, scrolls, and does not trap content under unsafe viewport/safe-area regions.
6. Catalog registration mode is reachable.
7. Manufacturer selector works.
8. Series selector works.
9. Model selector works.
10. Catalog search works.
11. Current product state renders.
12. Discontinued product is searchable/selectable and visibly marked for review.
13. Unknown-status product is searchable/selectable and visibly marked for review.
14. Register one catalog rod.
15. Register one catalog reel.
16. Reel registration requires the user's current line input and does not infer it from product specs.
17. Register one manual/legacy item.
18. Catalog + manual ownership rows coexist correctly.
19. Edit a catalog-backed item.
20. Editing can change nickname/user-owned reel line fields only.
21. Catalog identity/spec fields cannot be mutated through the edit UI.
22. Remove one owned item and verify only that item is removed.
23. Duplicate same-model ownership must not crash or corrupt persistence; identical owned products may legitimately exist more than once.
24. Select a fish and verify `MY TACKLE CHECK` renders.
25. Fit result does not overflow horizontally.
26. `NEXT BUY` / fit-explain area renders without overlap.
27. Navigate back/home/saved and confirm MY TACKLE UI remains functional.

## Responsive failure criteria
Treat as defect if any of these occur:
- horizontal document overflow
- clipped actionable control
- button rendered outside sheet/card
- content hidden permanently below fixed navigation/safe-area
- text overlap that prevents reading
- sheet cannot be closed
- input/select unusable under mobile viewport
- keyboard interaction causes permanent inaccessible state

Capture screenshots for 375/390/430 at:
- MY TACKLE sheet
- ownership list/editor
- MY TACKLE CHECK result

---

# B. Persistence / backward compatibility — mandatory

Storage key must remain:
`fish_target_v17_tackle`

Test all of the following:
1. Catalog rod/reel survive reload.
2. Catalog nickname survives reload.
3. Reel current line type/number survive reload.
4. Manual item survives reload.
5. Mixed manual + catalog records survive reload.
6. Legacy source-less stored records are still interpreted as `manual`.
7. Invalid or partial stored data fails safely rather than breaking app startup.
8. Deleting one item does not corrupt other records.
9. No destructive migration of existing user data.

Add/extend automated regression tests for every defect found here.

---

# C. Offline / PWA regression — mandatory

Verify the actual PWA loading path:
`pwa.js → catalog-providers → catalog-adapters → catalog-fixtures → catalog → tackle`

Test:
1. First online load succeeds.
2. Service worker installs the current shell.
3. Reload while offline still launches the basic app.
4. MY TACKLE assets required for the current build are available offline after an online install.
5. Catalog fixture selector can open offline in the current DEV fixture build.
6. Existing MY TACKLE saved data remains accessible offline.
7. Old cache version is not mixed into the current V23 shell.
8. No stale V15/V19/V22 asset mixture.
9. Reconnect and refresh updates normally.

Do not weaken current cache-version safety to make an offline test pass.

---

# D. Catalog scale / performance audit — mandatory

The current fixture is tiny. V23 architecture must be validated before thousands of SKUs are introduced.

## Test method
Create test-only/generated synthetic datasets; do not commit thousands of production-like manufacturer rows.

Exercise at approximately:
- 1,000 products
- 5,000 products
- 10,000 products if practical

Keep DAIWA/SHIMANO data synthetic. Do not scrape or import restricted production data.

Measure/report:
- catalog initialization time
- index generation time
- `search()` latency
- `loadPage()` latency
- maker/series selector update latency
- query typing responsiveness
- memory growth if observable
- page first-load impact

## Performance decision
If current in-memory implementation becomes visibly or measurably poor at realistic catalog sizes, implement the smallest architecture-correct improvement using the existing contracts:
- index metadata
- paged `loadPage()`
- chunk/lazy loading boundary

Do **not** replace the entire architecture or introduce a large framework solely for this task.

Prefer preserving:
`DataProvider → Manufacturer Adapter → Normalize → Validate → Canonical Catalog → MY TACKLE UI → Compatibility Engine`

Report the measured before/after numbers for any optimization.

---

# E. Compatibility engine invariants — mandatory regression

Do not regress these rules:
- missing fields never become green fit
- `lb` is never converted to Japanese `号`
- cm/inch/egi/hook sizes are never interpreted as grams
- reel product specs never imply the user's currently spooled line
- current line type/number must remain user-owned data
- catalog product identity/spec snapshot cannot be rewritten by nickname/current-line editing
- discontinued/legacy/unknown lifecycle state is independent of compatibility specs

Add tests if any invariant is currently unprotected.

---

# F. Data / legal gate — mandatory audit

Current policy is a hard gate:
- SHIMANO official-site production catalog: prohibited until permitted/licensed source exists
- DAIWA official-source work: PoC-only until redistribution rights are resolved
- synthetic: development/test only
- production allowed only for `internal`, `permitted`, `licensed`
- provider production gate remains authoritative

Verify automated tests still prove:
1. synthetic products fail production validation
2. restricted/unknown licenses cannot publish
3. DAIWA/SHIMANO disabled providers cannot publish even if input claims `licensed`
4. manufacturer adapter cannot bypass provider/license gates

Do not add real manufacturer catalog data in this task.

---

# G. Code-quality audit

Inspect touched code for:
- race conditions in async selector updates
- stale result overwrite when typing quickly
- event listener duplication
- invalid selection after maker/series/search changes
- edit state leaking between rows
- duplicate save handlers
- unsafe mutation of persisted objects
- excessive full-catalog scans in hot UI paths
- unnecessary large-file growth

Fix validated issues only. Do not perform broad aesthetic refactors with no user-visible or maintainability benefit.

---

# H. Required final verification

After all changes:

```bash
npm run test:syntax
npm test
```

Then rerun the complete browser matrix:
- 375
- 390
- 430

Also rerun:
- persistence
- offline/PWA
- catalog scale performance
- console error check

No statement such as "fixed", "complete", or "ready" unless the corresponding verification actually ran successfully.

---

# Must NOT do
- Do not merge PR #16.
- Do not merge any stacked PR #12–#15.
- Do not merge to `main`.
- Do not directly modify `codex/release-rc1`.
- Do not enable FIELD LIVE.
- Do not start monetization, store submission, external paid services, or other irreversible/external-release work.
- Do not scrape/publish DAIWA or SHIMANO production catalog data.
- Do not change `fish_target_v17_tackle` destructively.
- Do not remove manual entry fallback.
- Do not infer current reel line from manufacturer specs.
- Do not solve performance by dumping a huge static SKU file into the initial shell.

---

# Deliverables

## Branch
Push work to:
`codex/v23-final-qa`
(or another clearly named Codex branch if a preserved local branch must be used).

## PR
Open a **draft PR targeting**:
`chatgpt/feature-v23-tackle-catalog`

Do not target `main`.
Do not merge it.

## PR/report must include
1. Starting SHA and final SHA.
2. Exact files changed.
3. Bugs found, with reproduction steps.
4. Bugs fixed, with verification evidence.
5. 375/390/430 browser results.
6. Screenshots/artifacts where available.
7. Persistence results.
8. Offline/PWA results.
9. Performance results for synthetic scale tests.
10. Unit/syntax/build test results.
11. Remaining known issues ranked blocker/high/medium/low.
12. Explicit confirmation that real manufacturer restricted data was not added.
13. Recommendation: `ready for ChatGPT review` or `not ready`, with reason.

## Stop condition
Stop after the branch is pushed and the draft PR/report is created. Do not merge or publish further without user approval.
