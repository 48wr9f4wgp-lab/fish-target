# FISH TARGET v16 QA

## Scope
Continuity / retention layer on top of v15: resume last plan, favorites, recent targets.

## Automated / local checks
- `continuity.js` syntax: pass
- `pwa.js` syntax: pass
- `sw.js` syntax: pass
- Dynamic v16 markup injection: pass
- Version badge/title update to v16: pass
- Last-plan snapshot and resume with restored state: pass
- Favorite add/remove persistence flow: pass
- Recent target history flow: pass
- iPhone-width horizontal overflow: 0
- Page errors in synthetic integration QA: 0
- Service Worker cache bumped to `fish-target-shell-v16`
- v16 continuity CSS/JS added to offline shell cache

## Regression boundary
- Core fish database, product database, recommendation engine, FIELD LIVE logic, and FIELD MODE logic are unchanged.
- Existing index markup remains unchanged; v16 loads as a small post-core extension from `pwa.js`.

## Device verification
- GitHub Pages reflects V16 on iPhone Home Screen: pass (2026-08-24)
- MY TARGETS / last-plan card renders on iPhone: pass
- Recent target renders on iPhone: pass
- Favorite add/remove on device: not yet explicitly verified
- Offline airplane-mode relaunch: still pending

Status: DEVICE UI QA PASS / FAVORITE + OFFLINE DEVICE QA PENDING
