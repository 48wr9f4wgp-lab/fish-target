# FISH TARGET V22-RC1 — DEVICE QA REQUIRED

These checks require a physical iPhone and are not certified by desktop/browser emulation.

- Safari first load: safe-area top/bottom padding, status-bar contrast, no clipped controls.
- Add to Home Screen: 180px Apple touch icon appears correctly and the installed name is `FISH TARGET`.
- Standalone launch: opens inside the configured scope without Safari chrome or a blank transition.
- Existing installation upgrade: an iPhone previously carrying V15/V19 cache updates to V22-RC1 without showing an old recommendation as a valid result.
- Airplane-mode cold launch after one successful online V22-RC1 launch: 19 targets, result, saved plan, and FIELD MODE remain usable.
- Safari private/storage-restricted mode: search and recommendations work; save failure does not break the page.
- Touch QA at 375 / 390 / 430 class widths: search keyboard, filters, shore/boat choices, FIRST CAST rotation, AUTO restore, detail groups, save/restore, and FIELD MODE back controls.
- Home-screen icon masks: 192/512 standard and 512 maskable artwork remains recognizable under iOS icon treatment.
- Rotation/orientation behavior: portrait-primary launch and return from background do not lose the active plan.
