# FISH TARGET V23 — RC QA EVIDENCE

Date: 2026-08-27
Automated QA evidence SHA: `3d4fae50c78fc1d30c51fe5d8cbe31b735450895`
Branch: `chatgpt/rc-v23-v8`
Build: `V23-DEV2-DAIWA-RC0`
FIELD LIVE: OFF

## Current decision

Automated RC QA: **PASS** for the covered browser, persistence, offline, catalog, scale, privacy/network, version-contract, and regression scopes.

Physical iPhone RC QA: **PARTIAL PASS** for the directly observed standalone/update/core-flow/offline/FIELD MODE states below.

Release certification: **NOT COMPLETE**. Remaining physical iPhone/Safari checks in `DEVICE_QA_RC1.md` are still required. No merge to `main`, Store submission, or production catalog enablement is authorized by this document.

## GitHub Actions evidence

All three workflows completed successfully on the same QA evidence SHA:

- `rc-browser-qa` run `33065251466` — success
- `rc-qa` run `33065251508` — success
- `deploy-pages` run `33065251482` — success

The later documentation-only HEAD also reran all three workflows successfully before physical-device QA continued.

## Automated regression

Node test suite: **50 / 50 PASS**.

Covered critical invariants include:

- DAIWA official-spec PoC remains preview-only; production publication blocked.
- DAIWA and SHIMANO provider production gates remain disabled.
- Manufacturer adapters cannot implicitly enable production.
- Reel product specifications never infer the user's currently spooled line.
- Catalog rod/reel ownership snapshots preserve the product/user-data boundary.
- Legacy source-less MY TACKLE records remain manual.
- Catalog lifecycle state remains independently searchable/selectable.
- Catalog edits modify only user-owned fields.
- Invalid reel line numbers become unspecified rather than producing false numeric fit.
- MY TACKLE keeps weight and line units separate.
- Current shell removes stale V19 cache and does not fall back to stale V19 when origin is unavailable.
- FIELD LIVE is off from first paint and network-backed live features remain disabled.
- Analytics remain local-only in RC0.
- Release shell contains no third-party executable/resource tags.
- Direct AVIF fish assets are used without runtime Base64 reconstruction.
- All 19 canonical targets have complete recommendation plans.

## Browser QA

Chromium / Playwright, mobile-like viewports:

- 375px: PASS
- 390px: PASS
- 430px: PASS

Measured initial resource payload at each tested width:

- encoded resource bytes: `276,486`
- largest encoded resource: `55,307`
- resource count: `30`

Browser coverage passed for:

- all 19 targets render
- direct AVIF renderer for all 19 fish cards
- no tested horizontal document overflow
- fish selection → recommendation → FIRST CAST → required tackle → 3 steps
- FIELD MODE open/back
- saved plan persistence and reload restore
- 390px offline reload after Service Worker install
- saved plan and FIRST CAST available offline
- legacy plan migration is non-destructive
- visible controls in tested states have accessible names
- no page errors / console errors in tested core scenarios
- no third-party requests with FIELD LIVE off

## MY TACKLE / Catalog browser QA

Full Catalog flow: **PASS**.

Verified through the actual UI:

- current `.v19TackleShortcut` opens MY TACKLE
- manufacturer → series → model selection
- catalog search
- discontinued row visibly marked `廃番`
- unknown-status row visibly marked `状態不明`
- catalog rod registration
- catalog reel registration
- current reel line starts unspecified and is only populated by explicit user input
- duplicate same-model ownership works with unique ownership IDs and stable canonical product ID
- manual and catalog records coexist
- catalog nickname/current-line edit persists
- catalog identity/spec snapshot remains immutable through the ownership editor
- deleting one duplicate leaves the other ownership records intact
- MY TACKLE CHECK remains usable after mixed ownership edits
- catalog + manual ownership survives reload
- nickname and current reel line survive reload
- source-less legacy ownership is interpreted as manual
- malformed MY TACKLE JSON fails safely without page crash
- offline reload retains saved MY TACKLE data
- DEV fixture selector remains usable offline
- 375px and 430px catalog/manual sheet states have no tested horizontal overflow and close controls remain reachable

## Catalog scale QA

Synthetic/test-only data against the actual `catalog.js` contract:

| Products | Init | Index | Single search | loadPage | 100 selector ops | 100 searches | Heap delta |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1,000 | 26.87 ms | 0.37 ms | 2.15 ms | 0.35 ms | 18.77 ms | 117.47 ms | 2,147,144 B |
| 5,000 | 122.23 ms | 1.73 ms | 8.57 ms | 1.34 ms | 85.96 ms | 543.52 ms | 3,860,784 B |
| 10,000 | 225.79 ms | 2.68 ms | 13.25 ms | 2.77 ms | 185.27 ms | 1,117.49 ms | 2,756,000 B |

Result: **PASS through 10,000 products** under the current generous regression ceilings. No architecture change is justified by the measured V23 scale evidence.

## Accessibility fix found during Final QA

A real issue was found and fixed before the final pass:

- home fish search input lacked an accessible name
- `aria-label="魚を検索"` now applied
- FIELD LIVE location search also receives `aria-label="釣行地を検索"` for the future enabled state

## QA harness defect found during Final QA

A Browser QA failure was traced to the test harness, not application persistence: an init script removed `fish_target_v17_tackle` on every reload. The harness was corrected, then MY TACKLE reload persistence passed in CI.

## Dependency/audit note

`package.json` contains no product dependencies. Browser CI temporarily installs Playwright with `npm install --no-save`; the install log reports one high-severity audit item in that temporary QA runtime. This has not been established as a shipped product dependency vulnerability and must not be represented as one without separate evidence.

## Physical iPhone QA — observed PASS states

Observed on a physical iPhone using the existing Home Screen installation after the RC deployment:

- standalone launch shows no Safari address bar or bottom browser toolbar
- status bar / Dynamic Island safe area is not clipped at initial launch
- current build marker `V23-DEV2-DAIWA-RC0` is visible, confirming the installed app updated to the current RC shell
- previously saved/recent plan data remains present after the update (`シーバス` resume/history state observed)
- home screen layout has no observed fatal clipping or horizontal overflow
- high-resolution fish art loads in the installed app
- target selection → recommendation detail opens correctly
- `ブリ・ワラサ` detail header and fish art render without observed clipping
- FIRST CAST renders with metal jig, weight, color, range, action, alternates, and fallback guidance
- required tackle renders as four readable cards
- existing MY TACKLE data is present on-device (`ジグキャスター`, `bg3500` observed)
- MY TACKLE CHECK executes on-device and returns the non-green `一部条件を確認` state rather than a false green fit
- the NEXT BUY / confirmation guidance is visible and consistent with the partial-fit result
- `現場でやること 3つ` renders and remains readable in the installed app
- fixed bottom navigation remains reachable while scrolling through the tested detail states
- airplane mode with Wi-Fi off successfully cold-launches the Home Screen app
- offline launch explicitly shows the `OFFLINE・基本診断は利用可` state
- saved `ブリ・ワラサ` plan survives the real offline cold launch
- the 19-target home UI and fish art remain available during the real offline cold launch
- from that offline state, `ブリ・ワラサ` detail remains usable and FIELD MODE opens successfully
- FIELD MODE remains fully readable offline with FIRST CAST, required tackle, and all 3 field steps visible
- FIELD MODE back control is visible/reachable in the tested offline state

Observed non-blocking polish notes:

- the internal RC/build label is intentionally visible during QA and should not remain prominent in a public release
- the compact top brand/build line can wrap at phone width; this is a release-polish item, not a reproduced functional blocker

## Remaining physical-device hard gates

Still **not certified** on physical iPhone and required before release certification:

- physical-device FIELD MODE back action after opening FIELD MODE
- Safari private/storage-restricted behavior
- real search keyboard/filter interaction beyond the already observed core detail flow
- Add to Home Screen icon/name check if the current installation predates the latest icon/name assets
- actual iOS icon masking check
- orientation/background-return state retention
- final public-release polish decision for the visible RC/build label and wrapped brand/build line

## Restrictions still in force

- Do not merge this branch or PRs into `main` without explicit approval.
- Do not enable FIELD LIVE.
- Do not enable DAIWA/SHIMANO production catalog publication.
- Do not start Store submission, monetization, paid services, or other irreversible release operations.
- Do not destructively migrate `fish_target_v17_tackle`.

## RC status

**Automated QA: PASS**

**Physical iPhone release gate: PARTIAL PASS / PENDING remaining device checks**

The next release-candidate action is physical iPhone FIELD MODE back-action QA and background-return retention, followed by Safari private/storage-restricted and icon/name checks before release certification.
