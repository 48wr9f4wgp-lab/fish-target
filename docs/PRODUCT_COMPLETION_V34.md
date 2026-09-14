# FISH TARGET — PRODUCT COMPLETION V34

Status: Canonical product-completion scope
Baseline: `f6d195fd25436a44dec16b5a44aecabe6409c667`
Branch: `chatgpt/product-completion-v34`

V34 does not replace `PRODUCT_HUMAN_FACTORS_GOAL_V33.md`. V33 remains canonical for the core decision flow and human-factors gates.

## 1. Executive verdict

The V33 engineering baseline is stable enough to preserve, but product/content completeness is not release-ready.

Current strengths:
- 63 canonical targets / 158 method plans
- TARGET -> METHOD -> FIRST CAST -> MY SET -> FIELD MODE is established
- MY TACKLE set resolution is local and Catalog-independent
- Chromium, iOS WebKit, publication and resilience gates are green at the baseline
- offline/PWA, save resilience and progressive disclosure are established

Current product-completion gaps:
1. Product knowledge is deep in rod/reel research, but not complete across the full trip setup.
2. Only 19/63 targets currently have bundled fish art, and the legacy bundled sheet is rights-unverified.
3. Packing is a generic editable eight-item checklist rather than a plan-aware trip-readiness system.
4. The repository has accumulated versioned UI wrappers; new V34 work must use focused modules rather than more render-wrapper accretion.
5. Physical-iPhone timing, full launch observability and final publication-rights gates remain open.

## 2. North-star completion metric

Do not optimize for raw SKU count, raw image count or feature count.

Optimize for this question:

> For each supported fishing plan, can the user decide what to cast, what owned setup to take, what else to pack, and what to do at the water — with trustworthy visuals and without a dead end?

Primary completion unit: **plan readiness**, not catalog row count.

## 3. V34 three-lane program

### Lane A — Product / gear knowledge

Purpose: turn the current Catalog from a research-heavy rod/reel database into decision support for a complete fishing setup.

Canonical layers:
- Technical requirement layer: rod, reel, main line, leader, FIRST CAST/bait/lure, terminal/rig.
- Trip-support layer: landing/handling, safety, accessory/consumable requirements where context supports them.
- Commercial product layer: optional factual product candidates only; never required for the core answer.

Rules:
- MY TACKLE remains primary.
- Commercial product data never overrides technical requirements or owned-user data.
- Do not add SKUs merely to increase count.
- Each product batch remains research until publication rights/source policy explicitly allows production.
- Maker neutrality is a release gate.

V34 acceptance:
- 100% of 158 plans retain complete technical requirement semantics.
- A coverage audit reports which plans lack useful commercial candidates by component/category.
- Core high-frequency clusters receive product depth before long-tail expansion.
- No plan becomes dependent on Catalog/network.

### Lane B — Fish visual completion

Purpose: make target selection immediately legible, coherent and trustworthy offline.

Rules:
- One coherent Art Bible for all targets.
- Species identity beats decorative realism.
- Product labels that represent multiple taxa must not be illustrated as one falsely-specific species.
- Bundled-first / provenance-preserving pipeline remains mandatory.
- External third-party binary intake/redistribution remains an explicit approval boundary.

V34 acceptance:
- 63/63 target cards have an intentional visual treatment.
- No unresolved target silently receives a taxonomically false image.
- Every publication-bundled external asset has provenance, accepted license, receipt and hash evidence.
- Offline cards and detail views remain visually coherent at 375/390/430 CSS px.

### Lane C — TRIP READY / packing

Purpose: convert the generic packing list into a non-blocking, context-aware pre-trip readiness tool.

The primary V33 flow remains:
`TARGET -> METHOD -> FIRST CAST -> MY SET -> FIELD MODE`

TRIP READY is parallel/optional. It must not add a mandatory step before FIELD MODE.

Packing sources:
- universal preparation
- selected plan requirements
- selected MY SET
- FIRST CAST / terminal requirements
- method/field context
- daypart/conditions when trustworthy data exists
- user custom items

Priority states:
- required
- recommended
- optional

Rules:
- "owned" is not the same as "packed".
- Never auto-check an item merely because it exists in MY TACKLE.
- Safety-critical items must not become READY through unknown data.
- Every automatic item should have a human-readable reason.

V34 acceptance:
- current plan can produce a deterministic contextual checklist offline.
- selected owned rod/reel appear by name when available.
- required line/leader/rig/FIRST CAST needs are represented.
- night/boat/rock safety cues can be added from explicit plan context.
- custom items and existing storage remain backward-compatible.
- packing remains independently usable with no selected plan.

## 4. Execution order

### Phase 0 — Baseline lock
- preserve `f6d195fd` as the verified engineering baseline
- do all product-completion work on `chatgpt/product-completion-v34`

### Phase 1 — Completion instrumentation
- product coverage taxonomy + audit
- fish visual Art Bible + 63-target status audit
- TRIP READY rule engine + backward-compatible UI foundation

### Phase 2 — High-value cluster completion
Complete end-to-end setup for the most common decision families before long-tail work:
- shore jigging / bluefish
- ajing / mebaring / light game
- eging / squid
- seabass
- surf flatfish
- sabiki / bait harbor
- bass / trout
- offshore/boat plans already represented in the product

### Phase 3 — 158-plan / 63-target expansion
- close remaining plan-coverage gaps
- complete visual target coverage
- resolve ambiguous taxonomy before visual promotion
- verify maker-neutral recommendations

### Phase 4 — Product polish
- result/TRIP READY/packing information hierarchy
- visual consistency and transitions
- architecture consolidation where wrapper accretion materially increases risk
- performance budget with expanded bundled assets

### Phase 5 — Release candidate
- full automated suite
- physical iPhone 15s planning / 3s FIELD observation
- offline cold launch and old-cache upgrade
- persistence regression
- privacy/store/publication-rights review
- analytics funnel and crash/performance observability

## 5. Release hard gates added by V34

No public GO while any of these remain true:
- essential plan setup terminates in an unexplained product/gear gap
- a critical fish visual is missing, misleading or rights-unsafe
- pack READY can be achieved while a required generated item is unchecked
- owned gear is silently treated as physically packed
- commercial Catalog changes core recommendations or creates maker bias
- product images/specs have unclear publication rights
- physical iPhone usability has not been recorded against the exact release SHA

## 6. Explicit non-goals

V34 does not add a social feed, catch-location network, generic map super-app, direct marketplace, price tracker, or forced account system.

The competitive wedge remains:

**target fish -> FIRST CAST -> the user's actual set -> trip-ready preparation -> immediate field action**.
