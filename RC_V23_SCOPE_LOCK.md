# FISH TARGET V23 / Visual8 Release Candidate Scope Lock

Status: RC candidate preparation
Canonical code baseline: `chatgpt/v23-visual-pass1`

## Included in initial release candidate
- 19 target groups
- fish search and filtering
- recommended method and FIRST CAST
- required tackle
- MY TACKLE registration/editing and compatibility judgment
- three field steps and FIELD MODE
- plan save/resume and continuity
- detail/reference information
- PWA/offline baseline
- Visual8 UI and high-resolution fish illustrations

## Explicitly out of scope for this RC
- FIELD LIVE (`fieldLive=false` remains a hard gate)
- production publication of unapproved manufacturer catalog data
- V24 MY SET / TRIP READY
- new major visual passes or unrelated feature expansion

## Catalog release boundary
- Manual MY TACKLE entry is release-capable.
- DAIWA/SHIMANO catalog work remains preview/PoC unless provider/license production gates are explicitly approved.
- Reel product specifications must never imply the line currently spooled by the user.

## RC hard gates
1. Launch/input/core-flow blockers: zero known.
2. Fish → FIRST CAST → tackle → MY TACKLE → 3 steps → FIELD MODE → save/resume completes.
3. Save/backward compatibility and offline/PWA regression pass.
4. 375 / 390 / 430 px layouts have no major overflow or blocked controls.
5. Deployment policy is obeyed: generated `dist/`, direct binary assets, no runtime Base64/gzip reconstruction.
6. Accessibility baseline passes: tap targets, readable contrast/text, reduced-motion behavior, non-color-only status communication.
7. Performance/console audit has no release-blocking issue.
8. Privacy/legal/content review is complete before formal release.

## Change discipline after scope lock
Only validated release blockers, regressions, accessibility failures, data correctness defects, deployment-policy violations, or performance defects may change RC scope. New features move to post-release work.

No merge to `main` and no formal release without explicit approval and reviewed device QA.
