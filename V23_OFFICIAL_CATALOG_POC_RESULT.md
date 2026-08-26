# V23 Official Catalog Extraction PoC Result

Last run: 2026-08-26
Status: extraction feasibility proven / production publication not enabled

## Result

Official manufacturer product pages were sampled and normalized into a private PoC artifact without copying product images or descriptive marketing text.

Normalized rows: **78 SKU**

Breakdown:
- DAIWA LATEO rods: 27
- DAIWA OVER THERE rods: 9
- DAIWA BG SW reels: 8
- SHIMANO COLTSNIPER BB rods: 10
- SHIMANO DIALUNA rods: 12
- SHIMANO NASCI reels: 12

The PoC proved that current official pages expose enough structured model-level facts to populate FISH TARGET fields such as:
- maker / series / model
- JAN
- rod total length
- rod weight
- lure/jig range
- PE range
- reel size/model
- gear ratio
- maximum drag
- PE line-capacity examples

## Important distinction

**Extraction feasibility is proven. Production publication rights are a separate gate.**

### SHIMANO
SHIMANO's published site terms state that site components are for private use and restrict public/commercial reproduction or use without explicit permission. Therefore SHIMANO extracted rows remain `research_only` and are not wired into the public FISH TARGET catalog.

### DAIWA / GLOBERIDE
DAIWA official product pages expose structured facts and GLOBERIDE publishes an intellectual-property policy, but this PoC did not find an explicit public data-reuse license authorizing a third-party consumer catalog. DAIWA extracted rows remain `review_needed` rather than production-enabled.

## PoC artifact handling

The normalized 78-SKU dataset was generated outside the public repository for analysis. It deliberately contains:
- factual model/spec values only
- source URLs
- source check date
- per-row rights status

It deliberately excludes:
- manufacturer product images
- descriptive copy
- promotional text
- logos/assets

It is **not** part of the public Pages build and is **not** loaded by V23.

## Architecture implication

The current V23 provider/license gate remains correct.

Recommended flow:

`Official/Permitted Source -> Manufacturer Adapter -> Normalize -> Validate -> Canonical Catalog -> MY TACKLE`

A factual row should not become production-visible merely because extraction succeeded. `provider.productionEnabled` and `license_status` remain the final publication gate.

## Next development step

1. Keep the 78-SKU PoC as the normalization/test corpus.
2. Expand model coverage only after deciding the production-rights path for each maker/source.
3. Do not put marketing copy/images into the canonical compatibility dataset.
4. When a source is approved for production, promote only normalized factual fields through the existing provider gate.
