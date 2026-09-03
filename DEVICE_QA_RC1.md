# FISH TARGET V23 RC — DEVICE QA REQUIRED

These checks require a physical iPhone and are not certified by desktop/browser emulation.

## 2026-08-27 physical iPhone session

- [x] Safari / Home Screen safe-area check: status bar and bottom home-indicator areas remain usable with no fatal clipping observed.
- [~] Add to Home Screen icon/name check: the new fish + target production icon was explicitly confirmed visible on the physical iPhone. The installed label itself was not separately transcribed after re-install, although the release manifest/iOS title is `FISH TARGET`.
- [x] Standalone launch: current Home Screen installation opens without Safari chrome.
- [x] Existing installation upgrade: the installed app updated to `V23-DEV2-DAIWA-RC0` while prior saved/recent plan state remained present.
- [x] Real airplane-mode + Wi-Fi-off cold launch: current RC shell, 19-target home UI, fish art, and saved `ブリ・ワラサ` plan state load successfully; `OFFLINE・基本診断は利用可` is shown.
- [x] Offline FIELD MODE: opened successfully from the real offline cold-launch state, remained readable, and the physical-device back control returned correctly.
- [~] Safari private/storage-restricted mode: private Safari search for `ヒラメ`, recommendation detail, and plan save completed without page failure; normal-profile MY TACKLE data was not exposed in the private session. A forced storage-denial/failure case has not been directly reproduced on-device.
- [~] Real touch QA: target selection, search keyboard, FIRST CAST, required tackle, MY TACKLE CHECK, scrolling, bottom navigation, FIELD MODE open/back were observed working; filter controls remain for explicit physical-device confirmation.
- [x] Home-screen icon masks: the new fish + target artwork is visible and recognizable under actual iOS Home Screen treatment.
- [x] Background return: while in `ブリ・ワラサ` FIELD MODE, backgrounding the Home Screen app and returning after a short wait preserved the same active plan and FIELD MODE state.
- [ ] Orientation rotation: portrait-primary behavior through an actual orientation change still needs explicit confirmation if rotation is allowed by the installed shell.

## Original required checks

- Safari first load: safe-area top/bottom padding, status-bar contrast, no clipped controls.
- Add to Home Screen: 180px Apple touch icon appears correctly and the installed name is `FISH TARGET`.
- Standalone launch: opens inside the configured scope without Safari chrome or a blank transition.
- Existing installation upgrade: an iPhone previously carrying an older V15/V19/V22 cache updates to the current V23 RC without showing an old recommendation as a valid result.
- Airplane-mode cold launch after one successful online V23 RC launch: 19 targets, result, saved plan, and FIELD MODE remain usable.
- Safari private/storage-restricted mode: search and recommendations work; save failure does not break the page.
- Touch QA at 375 / 390 / 430 class widths: search keyboard, filters, shore/boat choices, FIRST CAST rotation, AUTO restore, detail groups, save/restore, and FIELD MODE back controls.
- Home-screen icon masks: 192/512 standard and 512 maskable artwork remains recognizable under iOS icon treatment.
- Rotation/orientation behavior: portrait-primary launch and return from background do not lose the active plan.
