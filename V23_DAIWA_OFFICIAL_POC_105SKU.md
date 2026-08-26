# V23 DAIWA Official Spec PoC — 105 SKU

Last verified: 2026-08-26
Status: research/normalization PoC only
Production enabled: NO

## Result

DAIWA official product pages were used as primary sources to confirm that model-level factual specifications can be normalized at useful scale without copying product images or descriptive marketing copy.

Current normalized DAIWA PoC coverage: **105 SKU**.

Existing DAIWA PoC rows:
- LATEO: 27
- OVER THERE: 9
- BG SW: 8

Additional rows verified in this pass:
- LEGALIS: 11
- REVROS: 11
- FREAMS: 12
- CALDIA: 15
- LEXA: 12

Total: 105 DAIWA SKU.

A combined research dataset also contains 34 SHIMANO research-only rows, for 139 total PoC rows.

## Fields normalized

Rod rows, where the official table exposes them:
- maker / series / model
- length
- pieces
- weight
- lure range
- jig range
- PE range
- JAN

Reel rows, where the official table exposes them:
- maker / series / model
- reel size derived from model identifier for adapter input
- weight
- gear ratio
- retrieve cm / handle turn
- max drag
- PE capacity reference
- JAN

## V23 adapter candidate

A 105-row DAIWA adapter-input candidate was generated to match the current `catalog-adapters.js` contract.

Important safeguards:
- `source_provider = daiwa-official-poc`
- `license_status = unknown`
- existing provider remains `productionEnabled: false`
- no public catalog wiring was performed
- no product images or descriptive copy were imported
- reel line capacity is reference data only and must never be treated as the user's actually spooled line

## Validation performed

- 105 DAIWA adapter candidate rows generated
- 139 total research rows generated
- all JAN values unique across the combined PoC
- all DAIWA candidate rows use the DAIWA PoC provider
- all DAIWA candidate rows retain `license_status: unknown`
- production gate remains authoritative

## Official source pages used in the 61-SKU expansion

- LEGALIS: https://www.daiwa.com/jp/product/cx5krwk
- REVROS: https://www.daiwa.com/jp/product/hlz949j
- FREAMS: https://www.daiwa.com/jp/product/w7t57lq
- CALDIA: https://www.daiwa.com/jp/product/lsej2uh
- LEXA: https://www.daiwa.com/jp/product/w9f5h6n

## Decision

Technical feasibility is no longer the blocker for DAIWA catalog scale. The current blocker is the production-use/redistribution decision, not extraction or normalization capability.

Do not import these PoC rows into the public Pages catalog until the production-rights decision is explicitly changed and the provider gate is intentionally enabled.
