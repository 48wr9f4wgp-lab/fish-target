# FISH TARGET V23 Release Candidate QA Checklist

Use with `RC_V23_SCOPE_LOCK.md`. A box may be checked only after the named verification is actually performed.

## Build / deployment
- [ ] Syntax checks pass.
- [ ] Full automated test suite passes.
- [ ] Production-style `dist/` build succeeds.
- [ ] Pages artifact contains only intended release assets.
- [ ] Direct `fish-real-v7.avif` integrity matches the verified SHA-256.
- [ ] No runtime Base64/gzip reconstruction path remains.
- [ ] FIELD LIVE is off in first paint and runtime.

## Core flow
- [ ] Fish selection opens the correct target.
- [ ] Recommended method and FIRST CAST render correctly.
- [ ] Required tackle renders correctly.
- [ ] MY TACKLE check works with no saved tackle.
- [ ] MY TACKLE check works with partial tackle.
- [ ] MY TACKLE check works with manual/catalog-mixed tackle.
- [ ] Three field steps render correctly.
- [ ] FIELD MODE opens and remains usable.
- [ ] Plan save and resume work after reload.

## Persistence / compatibility
- [ ] `fish_target_v17_tackle` legacy records remain readable.
- [ ] Catalog-backed records preserve canonical product identity/specs.
- [ ] Editing catalog-backed ownership changes only user-owned fields.
- [ ] Reel catalog specs never populate the user's current line automatically.
- [ ] Corrupt/missing optional data does not create a false green compatibility result.

## Mobile visual / behavior
- [ ] 375 px: no major overflow, clipped CTA, or blocked content.
- [ ] 390 px: no major overflow, clipped CTA, or blocked content.
- [ ] 430 px: no major overflow, clipped CTA, or blocked content.
- [ ] Fish list illustrations remain sharp and correctly mapped.
- [ ] Result illustration remains sharp and unclipped.
- [ ] Bottom navigation does not cover required controls/content.
- [ ] Detail accordion states are clear and operable.

## PWA / offline
- [ ] Safari normal launch works.
- [ ] Home-screen launch works.
- [ ] Offline launch supports the documented baseline.
- [ ] Save/resume remains available offline where designed.
- [ ] Reconnection does not corrupt state.
- [ ] Service-worker update reaches the current build without stale-version lock.

## Accessibility
- [ ] Primary tap targets are approximately 44 px or larger.
- [ ] Text/controls have readable contrast.
- [ ] Status meaning is not communicated by color alone.
- [ ] Reduced-motion preference is respected.
- [ ] Focus/labels/accessible names are reasonable for interactive controls.

## Performance / diagnostics
- [ ] No release-blocking console errors on the core flow.
- [ ] Initial load and fish-list scrolling are acceptable on target iPhone Safari.
- [ ] Catalog search remains responsive at the tested data scale.
- [ ] No obvious long-session memory/DOM growth regression.

## Release/legal
- [ ] Manufacturer catalog production gates remain off unless separately approved.
- [ ] Image/data rights and required attribution/licensing are reviewed.
- [ ] Privacy/analytics disclosure is reviewed before formal release.
- [ ] Safety/disclaimer copy is reviewed.

## RC exit
RC may be proposed for formal release only when there are zero known launch/input/progression/save/PWA blockers and all unresolved checklist items are explicitly classified as non-blocking.
