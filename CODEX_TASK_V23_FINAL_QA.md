# CODEX TASK — V23 FINAL QA / PERFORMANCE / FIX PASS

## Mission
Take FISH TARGET `V23-DEV2` through the **PC-local work that is specifically worth spending Codex capacity on**: real Browser E2E, PWA/offline verification, scale/performance measurement, complex defect debugging, and final regression.

This is NOT a redesign, product-planning, documentation, broad refactor, legal-research, or release task.

---

# 0. Codex Capacity Policy — HARD RULE

Codex capacity is finite. Follow these rules throughout this task.

## Codex should spend time on
- Browser E2E / real interaction
- viewport/device regression
- PWA / Service Worker / offline behavior
- persistence behavior that requires browser state
- synthetic catalog scale/performance
- complex debugging of defects actually reproduced
- final integrated regression

## Do NOT spend Codex capacity on
- market research
- product/spec redesign
- copywriting / README cleanup
- broad architecture review without a reproduced problem
- broad code-quality/aesthetic refactors
- speculative cleanup
- re-documenting already-known behavior
- repeated full-repository scans
- repeated Remote Intelligence / broad remote analysis when local repo, browser and tests are sufficient

Use local repository inspection, local browser tooling and targeted tests first.

## Execution efficiency rules
1. Run the full baseline test suite once at the start.
2. During fixes, run only the smallest relevant targeted test/E2E scenario.
3. Run the full suite once again at the end.
4. Do not repeat the same full 375/390/430 scenario after every small edit.
5. Fix only defects that are reproduced or supported by concrete evidence.
6. If a test passes, do not keep re-investigating it without a new failure signal.
7. Stop expanding scope when the required evidence is sufficient.

---

# 1. Canonical state
- Repo: `48wr9f4wgp-lab/fish-target`
- Source branch: `origin/chatgpt/feature-v23-tackle-catalog`
- Existing draft PR: `#16`
- PR #16 base: `codex/release-rc1`
- Build: `V23-DEV2`
- FIELD LIVE: OFF
- Manual iPhone Safari smoke QA: passed with no obvious visible issue in tested MY TACKLE flow
- Feature preview deployment: enabled temporarily for device QA

The manual iPhone pass does not replace Browser E2E/offline/performance verification.

---

# 2. Mandatory startup
1. `git status`
2. `git fetch origin --prune`
3. Inspect:
   - `origin/chatgpt/feature-v23-tackle-catalog`
   - PR #16
   - `V23_HANDOFF.md`
   - this file
4. Preserve any existing local Codex branch that has unique commits. Do not reset/delete unique work.
5. Create a fresh branch from the latest ChatGPT feature branch:
   - recommended: `codex/v23-final-qa`
6. Do not work directly on `main`, `codex/release-rc1`, or `chatgpt/feature-v23-tackle-catalog`.

Record the exact starting SHA.

---

# 3. Baseline — ONCE
Run:

```bash
npm run test:syntax
npm test
```

Record:
- starting SHA
- Node version
- browser version
- test pass/fail count
- console errors/warnings relevant to V23

If baseline fails, diagnose before proceeding.

Do not rerun the complete suite after every small edit. Use targeted tests until final verification.

---

# 4. Browser E2E — PRIMARY CODEX WORK

Use a real browser against the locally built/served app.

## 4A. Full scenario — 390px only
Run the complete end-to-end flow at a 390px mobile-like viewport first. This is the main functional pass.

Verify:
1. App reports `V23-DEV2`.
2. No uncaught console errors.
3. No horizontal document overflow.
4. Open/close/scroll MY TACKLE bottom sheet.
5. Catalog mode works.
6. Manufacturer → series → model works.
7. Catalog search works.
8. Current status renders.
9. Discontinued item is searchable/selectable and visibly marked.
10. Unknown-status item is searchable/selectable and visibly marked.
11. Register one catalog rod.
12. Register one catalog reel.
13. Reel current line is explicitly user-entered and not inferred from product specs.
14. Register one manual/legacy item.
15. Catalog + manual rows coexist.
16. Duplicate same-model ownership does not crash/corrupt data.
17. Edit a catalog-backed item.
18. Edit may change nickname and current reel line only.
19. Product identity/spec fields remain immutable through the UI.
20. Remove one item; other records remain intact.
21. Select a fish and render `MY TACKLE CHECK`.
22. Fit result / NEXT BUY area does not overlap or overflow.
23. Back/home/saved navigation leaves MY TACKLE functional.

Capture only the screenshots needed as evidence:
- MY TACKLE sheet
- ownership list/editor
- MY TACKLE CHECK result

## 4B. Responsive extreme smoke — 375px and 430px
Do NOT repeat every functional action unless needed.

At both 375 and 430 verify the critical responsive states:
- home has no horizontal overflow
- MY TACKLE sheet opens/closes/scrolls
- catalog selectors/search are usable
- ownership editor controls remain reachable
- MY TACKLE CHECK / NEXT BUY do not overflow
- fixed navigation / safe area does not permanently hide actionable content

If a defect appears at either extreme, expand testing only around that failing flow and rerun the affected width(s) after the fix.

Responsive defect criteria:
- horizontal document overflow
- clipped actionable control
- button outside sheet/card
- permanently hidden content under fixed nav/safe-area
- unreadable overlap
- sheet cannot close
- mobile input/select becomes unusable
- keyboard leaves an inaccessible permanent state

---

# 5. Persistence / backward compatibility — run once in browser
Use the 390px run unless a width-specific defect requires otherwise.

Storage key must remain:
`fish_target_v17_tackle`

Verify:
1. Catalog rod/reel survive reload.
2. Catalog nickname survives reload.
3. Reel current line type/number survive reload.
4. Manual item survives reload.
5. Mixed manual + catalog survives reload.
6. Legacy source-less records are interpreted as `manual`.
7. Invalid/partial stored data fails safely.
8. Deleting one item does not corrupt others.
9. No destructive migration.

Add automated regression only for defects found or currently-unprotected critical invariants.

---

# 6. Offline / PWA — run once
Verify actual runtime order:
`pwa.js → catalog-providers → catalog-adapters → catalog-fixtures → catalog → tackle`

Test:
1. First online load succeeds.
2. Current Service Worker installs.
3. Reload offline launches the basic app.
4. V23 MY TACKLE assets are available offline after online install.
5. DEV fixture selector opens offline.
6. Existing MY TACKLE saved data remains accessible offline.
7. Old cache versions are not mixed into V23.
8. No stale V15/V19/V22 asset mixture.
9. Reconnect + refresh updates normally.

Do not weaken cache/version safety to force a pass.

---

# 7. Catalog scale/performance — STAGED to save capacity
Use generated/test-only synthetic data. Do not add real manufacturer catalog data.

## Stage 1
Run approximately 1,000 products and record:
- catalog init time
- index generation time
- `search()` latency
- `loadPage()` latency
- selector update latency
- query typing responsiveness
- observable memory/page-load impact

## Stage 2
If Stage 1 is healthy, run approximately 5,000 products.

## Stage 3 — conditional
Run approximately 10,000 only if one of these is true:
- 5,000 remains healthy and 10,000 evidence is useful for confidence, OR
- the architecture/performance decision remains unresolved.

If 5,000 already exposes a clear bottleneck, do not waste capacity running 10,000 before addressing that bottleneck.

If optimization is required, make the smallest architecture-correct change using existing contracts:
- index metadata
- paged `loadPage()`
- chunk/lazy-loading boundary

Do not introduce a large framework.
Preserve:
`DataProvider → Manufacturer Adapter → Normalize → Validate → Canonical Catalog → MY TACKLE UI → Compatibility Engine`

Record before/after measurements for any performance fix.

---

# 8. Critical invariants — targeted regression only
Ensure tests/evidence cover these; do not perform a broad conceptual audit if existing tests already prove them.

- missing fields never become green fit
- `lb` is never converted to Japanese `号`
- cm/inch/egi/hook sizes are never treated as grams
- reel product specs never imply the user's current spooled line
- current line remains user-owned data
- catalog identity/spec snapshot cannot be rewritten by nickname/current-line edit
- discontinued/legacy/unknown lifecycle state stays independent from compatibility specs
- synthetic/restricted/unknown production publication remains blocked
- disabled DAIWA/SHIMANO providers cannot publish even if an input claims `licensed`
- manufacturer adapters cannot bypass provider/license gates

If current automated tests already prove an invariant, count that as evidence and move on.

Do not research legal policy again in Codex and do not add real manufacturer data.

---

# 9. Defect handling
When an actual defect is reproduced:
1. capture minimal reproduction
2. identify the smallest root cause
3. implement the smallest safe fix
4. add/extend a targeted regression test when practical
5. rerun only the relevant scenario/test

Do not perform broad refactors around a localized defect.
Do not rewrite large files unless the defect genuinely requires it.

Architecture/diff cleanup review will be handled by ChatGPT after the Codex PR returns.

---

# 10. Final verification — ONCE
After all validated fixes:

```bash
npm run test:syntax
npm test
```

Then run:
- 390px full Browser E2E once
- 375px critical responsive smoke once
- 430px critical responsive smoke once
- persistence once
- offline/PWA once
- final relevant scale/performance level once
- console error check

Do not repeat successful passes without a new failure signal.

No claim of fixed/complete/ready unless corresponding verification actually passed.

---

# 11. Must NOT do
- Do not merge PR #16.
- Do not merge stacked PR #12–#15.
- Do not merge to `main`.
- Do not directly modify `codex/release-rc1`.
- Do not enable FIELD LIVE.
- Do not redesign product/UI unless required to fix a reproduced blocker.
- Do not start monetization, Store submission, paid services, or external release work.
- Do not scrape/publish DAIWA or SHIMANO production catalog data.
- Do not change `fish_target_v17_tackle` destructively.
- Do not remove manual fallback.
- Do not infer current reel line from manufacturer specs.
- Do not dump a huge static SKU file into the initial shell.
- Do not spend time on README/copy/TODO cleanup beyond what is required for the PR report.

---

# 12. Deliverables

## Branch
Push to:
`codex/v23-final-qa`
(or a clearly named preserved Codex branch if unique local work requires it).

## PR
Open a **draft PR targeting**:
`chatgpt/feature-v23-tackle-catalog`

Do not target `main`.
Do not merge.

## Keep the PR report concise but include
1. Starting SHA / final SHA.
2. Files changed.
3. Reproduced defects and fixes.
4. 390 full E2E result.
5. 375/430 responsive smoke results.
6. Persistence result.
7. Offline/PWA result.
8. Performance numbers at the stages actually run.
9. Final test results.
10. Remaining blocker/high/medium issues only; low cosmetic notes may be omitted unless actionable.
11. Confirmation no restricted real manufacturer data was added.
12. `ready for ChatGPT review` or `not ready`, with one-line reason.

## Stop condition
Stop after push + draft PR/report. Do not merge or publish further without user approval.
