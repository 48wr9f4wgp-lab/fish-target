# GEAR COMPARE V1 / audit and implementation

Date: 2026-09-27. Base: `1b850e301e1fea4171dbd86eb31039fa5e742ca1` on `chatgpt/v34-integration-review` (PR #65).
Scope: fishing-support PWA, not game production. No merge, deployment, contract, paid API or production distribution approved by this change.

## Decision

Implement a manufacturer-independent comparison surface, without requiring a target fish or MY TACKLE registration. Reuse the canonical catalog; do not create a second product master. Price bands are **not** manufacturer grades or quality scores. A manufacturer's flagship position, durability, feel, sensitivity, sealing and cross-brand power equivalence remain unassessed.

The two supported paths are: (a) requirements or product name -> select 2–3 rods/reels -> source-labelled table and numeric differences; (b) a checked reel -> nearby specifications from other manufacturers. The latter is an explicitly limited heuristic, not a promise of the same capability.

## Findings in the inherited data

- 985 runtime records: 971 non-synthetic products (254 reels, 717 rods, 19 manufacturers), plus 14 test fixtures. Fixtures are excluded from comparison.
- Existing functionality is catalog selection / owned-gear compatibility, not a manufacturer comparison table.
- The canonical schema has no verified common price field. A missing price must not become zero or an entry-grade label.
- 245 generations are unknown; their year is not guessed. NASCI supplemental evidence is bound to the exact canonical ID/JAN, retaining `generation=unknown`.
- Some rod `length_ft` values, such as 9.6 with no authoritative metre value, cannot safely be treated as decimal feet. Use `length_m`, or an explicitly formatted feet/inches value; otherwise show a unit-verification warning. After normalization, 136 rod lengths remain unknown. No source catalog is silently corrected.
- Some line capacities lack a PE gauge-specific field. After limited supplements, 119 reels still have no parsed PE capacity. No conversion from lb/mm/nylon, or extrapolation between PE gauges.
- Rod lure ranges and jig maxima are separate; neither power letters nor reel size labels establish cross-brand equivalence. Max drag does not establish durability.

Counts describe this catalog snapshot, not manufacturer market coverage or verification of every record.

## Added source evidence

Only 9 exact SKUs received a comparison-only supplement (JPY maker list price excluding tax, PE capacity, retrieve length, and available spool dimensions). These fields were checked on 2026-09-27; inherited fields keep their earlier source date. JAN mismatch disables the supplement.

- DAIWA LEGALIS: LT4000-CXH / LT5000-CXH / LT6000D-H. https://www.daiwa.com/jp/product/cx5krwk
- DAIWA CALDIA: LT4000-CXH / LT5000-CXH. https://www.daiwa.com/jp/product/lsej2uh
- SHIMANO NASCI: 4000XG / C5000XG. https://fish.shimano.com/ja-JP/product/reel/hanyouspinning/a075f00003slx0xqac.html
- SHIMANO STELLA: 4000XG / C5000XG. https://fish.shimano.com/ja-JP/product/reel/hanyouspinning/a075f00003e22p2qaa.html

Other prices are unknown. Abu's earlier source redirects to a new official collection: that is not evidence for a current exact-SKU price. No seller offer or old release price was substituted. Rod price bands therefore remain unpopulated in this slice.

## Behaviour and limits

- Preview entries: Home shortcut and MY TACKLE sheet -> manufacturer comparison. No extra global tab.
- Same-category selection, maximum three. Categories cannot silently mix. A category change asks before clearing an existing selection.
- Filter by maker, name, lifecycle, maker-price band, budget, weight; reel exact PE gauge/metres and retrieve; rod confirmed metre length and lure range. Unknowns are explicitly opt-in when a required specification is absent.
- Side-by-side table has a named baseline, signed differences, difference-only switch, source links and check dates. A numeric difference is not a winner badge.
- Automatic reel alternatives are currently limited to the nine additionally checked general-spinning models. Same family, same published PE gauge, capacity and weight ratios 0.6–1.67, retrieve ratio 0.75–1.34. These are V1 retrieval tolerances, not technical equivalence standards. No diameter/number/drag-only matching. Search/maker constraints are reset for cross-maker lookup, while numeric requirements remain active.
- Comparison selection is in memory only and clears on reload. Existing owned gear is read-only and untouched. Catalog load failure is visible with retry.
- Reuses the existing focus manager. Back/forward/reload supports an optional `compare` modal, including returning to MY TACKLE. Published builds cannot restore an unavailable compare modal.

## Distribution and verification

The existing `V23_CATALOG_DATA_SOURCE_DECISION.md` remains binding. Technical data and commerce/offers stay separate. No manufacturer imagery, live offer API or analytics was added. Research-only comparison assets are excluded from `FISH_TARGET_PUBLICATION_BUILD=1`, not merely hidden. The feature is developed on a new non-deploy branch; Pages workflow unchanged.

Completed locally: JavaScript syntax checks; 33 executable unit tests; actual comparison component with the real catalog snapshot and shared focus manager in installed Chromium; 375/390/430px overflow, selection limit, two-maker differences, PE filtering, alternatives, ambiguous rod length and Escape/focus checks; screenshot review. Local browser URL navigation was blocked by the environment, so this was a component harness, not a full deployed-PWA validation.

Added CI: actual bootstrap, catalog retry, comparison, history/reload, MY TACKLE preservation, Chromium and WebKit, and publication build/asset isolation. CI outcome is recorded on the PR; it is not assumed here. Physical iPhone validation and release approval remain outstanding.

## Next boundary

Broader price/grade coverage requires additional exact-SKU evidence and publication rights, not invented price tiers. Production source licensing and any live-price integration are separate decisions. This change does not replace the trip dashboard or automatically recommend a purchase.
