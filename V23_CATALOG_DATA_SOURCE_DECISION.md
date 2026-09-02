# V23 Production Catalog Data Source Decision

Last researched: 2026-08-26
Status: decision record / no external contract entered

## Decision

FISH TARGET must keep **canonical tackle compatibility data** separate from **commerce/search data**.

Production target architecture:

`Licensed Product Identity -> Licensed/Permitted Technical Specs -> Normalize/Validate -> Canonical Catalog -> MY TACKLE / Compatibility`

and separately:

`Commerce API -> Live Offer/Search Adapter -> Price/Stock/Affiliate Link`

Commerce listings must not silently become the source of truth for rod/reel technical compatibility.

## Why

FISH TARGET needs more than a product name. Compatibility requires trustworthy structured fields such as rod length/power/lure range/PE range and reel size, while the user's actually spooled line remains user-owned state.

A source that legally supplies JAN/name/price is therefore not automatically sufficient as the canonical compatibility source.

## Source decisions

### 1. Manufacturer official websites: DAIWA / SHIMANO

Status: **BLOCKED for production ingestion unless permission/license is obtained**.

Both official sites visibly expose useful current product information, but public availability is not treated as redistribution permission. Do not mass scrape, cache, or republish official-site product specifications into the production catalog without an explicit license/permission or an approved feed.

Recommended use now:
- human research / PoC only
- direct permission inquiry
- accept a manufacturer-provided API/CSV/feed if terms explicitly allow FISH TARGET's public display and storage

### 2. Verified by GS1

Status: **NO-GO as a public catalog source**.

Verified by GS1 is useful for checking GTIN/product identity, but its terms prohibit diversion/reuse or provision of information to third parties. It should not be used as a backend for a public FISH TARGET product catalog.

Use only for manual verification where permitted by its terms.

### 3. GS1 Japan cross-industry registry

Status: **NO-GO for public FISH TARGET catalog under currently published draft terms; re-check only if GS1 provides explicit permission**.

The service began in 2026 and provides brand-owner-originated data through an API, but the published draft terms state that:
- users are retailers;
- obtained product information is for the user's own business only;
- sale, lending, publication, public disclosure or other provision is prohibited;
- third-party provision is prohibited.

That does not fit a consumer-facing public product catalog without a separate explicit agreement.

### 4. JICFS/IFDB through a JDP

Status: **STRONG CANDIDATE for product identity/master enrichment; insufficient alone for fishing compatibility specs**.

GS1 Japan states JICFS/IFDB data is supplied through JICFS Database Providers (JDPs), and internet/service companies can participate as JDPs depending on business/use case. JDPs include LINE Yahoo, Rakuten, Lazuli and others.

JICFS is primarily a common merchandise master: JAN/GTIN, product names, classifications and other retail-master fields. Public documentation does not show the detailed fishing-specific fields FISH TARGET needs for rod/reel compatibility.

Therefore JICFS/JDP can solve:
- stable JAN/GTIN identity
- brand/product naming
- de-duplication / master matching

but probably cannot alone solve:
- rod lure-weight range
- rod PE range
- power-specific interpretation
- reel technical compatibility fields

These fields require a richer licensed source or manufacturer/distributor feed.

### 5. Lazuli PDP

Status: **TOP JDP/PIM inquiry candidate; contract/coverage must be confirmed before use**.

Lazuli publicly describes:
- JAN-keyed product master enrichment
- GS1 JICFS/IFDB enrichment
- normalization and product master management
- output/integration into external tools

This is architecturally close to FISH TARGET's provider boundary. However, no public evidence found in this research proves that Lazuli has sufficient fishing-tackle coverage or that its license permits public consumer redistribution of the exact fields FISH TARGET needs.

Before any contract, ask:
1. DAIWA/SHIMANO fishing-tackle coverage by JAN/model.
2. Rod/reel technical field coverage.
3. API/export availability.
4. Public consumer-app display rights.
5. Persistent storage/cache rights.
6. Derived compatibility/recommendation rights.
7. Image rights.
8. update/deletion/discontinued lifecycle handling.
9. price/minimum contract/PoC cost.

No contact or paid contract is authorized by this decision record.

### 6. Rakuten Product Search / Item Search API

Status: **GOOD live commerce/discovery layer; DO NOT use as canonical compatibility master**.

Rakuten Product Search can return product ID, JAN/product code, product name, model number, brand, image and product URLs. This is useful for product discovery and purchase links.

However Rakuten Web Service terms constrain use of Product Information, prohibit use/copying beyond separately defined purposes, restrict storing data where it can be shared with unspecified/many people, and generally restrict monetization through the Web Service to Rakuten Affiliate unless explicitly permitted.

Decision:
- possible future live search/offer adapter after exact compliance design
- do not import/cache Rakuten data into the permanent canonical compatibility catalog
- do not treat marketplace seller descriptions as authoritative technical specs

### 7. Yahoo! Shopping item search API

Status: **GOOD live commerce/discovery candidate; DO NOT use as canonical compatibility master**.

Yahoo! Shopping supports product search by JAN, brand and other fields and is explicitly positioned for content enrichment and affiliate monetization. API use requires the Yahoo Developer Network rules and credit requirements.

Decision:
- possible live search/price/availability/affiliate layer
- not a technical-spec source of truth because listings are commerce/seller data
- exact storage/display/commercial terms must be checked for the final implementation before enabling production

## Production source priority

1. **Direct manufacturer permission/feed** for technical specs — best source of truth.
2. **Licensed JDP/PIM provider** (Lazuli or equivalent) for identity/master data, if public-app rights and tackle coverage are confirmed.
3. **Authorized distributor/wholesaler feed** for technical specs if manufacturer direct feed is unavailable and redistribution rights are explicit.
4. **Rakuten/Yahoo live commerce adapters** only for current offers/search/affiliate links, not compatibility truth.
5. **Manual entry** remains permanent fallback for old/discontinued/unlisted tackle.

## Architecture consequence

Keep the existing V23 provider/license gates.

Recommended canonical split:

```text
ProductIdentity
- product_id
- gtin/jan
- maker
- series
- model
- generation
- lifecycle
- identity_source
- identity_license

TechnicalSpecs
- rod/reel typed fields
- specs_source
- specs_license
- last_verified
- confidence

CommerceOffer (non-canonical)
- provider
- seller
- price
- stock
- product_url / affiliate_url
- fetched_at
- expiry/cache policy

OwnedTackle
- product_id reference when available
- nickname
- current reel line
- user_overrides
```

Do not merge `CommerceOffer` fields into `TechnicalSpecs` automatically.

## Immediate development plan

While Codex owns Browser E2E/PWA/performance scope:

1. Keep synthetic fixtures as the only bundled V23 catalog data.
2. Do not add real DAIWA/SHIMANO mass data yet.
3. Treat `gtin/jan` as an optional future identity field in the provider contract, but avoid broad schema churn until Codex final QA returns unless required.
4. After Codex QA, implement one isolated **live commerce provider PoC** or a **licensed provider adapter PoC**, not both at once.
5. Any external provider contract, paid PoC, manufacturer permission request sent on the user's behalf, or production publication requires explicit user approval.

## Go / No-Go matrix

| Source | Identity | Technical compatibility specs | Public redistribution confidence | Production decision |
|---|---:|---:|---:|---|
| Manufacturer direct licensed feed | High | High | High if agreement says so | GO target |
| JICFS via licensed JDP | High | Low/unknown | Contract-dependent | Candidate |
| Lazuli PDP | High potential | Unknown | Contract-dependent | Top inquiry candidate |
| GS1 Cross-Industry Registry | High | Low/varies | Poor under published draft terms | NO-GO |
| Verified by GS1 | Verification | Low | Poor | NO-GO |
| Rakuten Product/Item Search | Medium-high | Low/untrusted | API-terms constrained | Commerce only |
| Yahoo Shopping Search | Medium-high | Low/untrusted | API-terms constrained | Commerce only |
| Manufacturer website scraping | High | High | Not established | NO-GO |
| User manual entry | User supplied | User supplied | User-owned input | Permanent fallback |

## Key conclusion

The product blocker is **not obtaining product names**. The blocker is obtaining **publicly redistributable, persistent, trustworthy fishing-specific technical specifications**.

Therefore FISH TARGET should not spend engineering time building a large ingestion pipeline until a rights-cleared technical-spec source is identified. V23's provider/adapter/license architecture is the correct foundation and should remain source-agnostic.

## Research sources

- GS1 Japan database services: https://www.gs1jp.org/database_service/
- JICFS/IFDB data-user model: https://www.gs1jp.org/database_service/jicfsifdb/future_user.html
- JICFS/IFDB overview: https://www.gs1jp.org/database_service/jicfsifdb/
- Verified by GS1: https://www.gs1jp.org/database_service/vbg/
- GS1 Japan cross-industry registry: https://www.gs1jp.org/database_service/gjcipr/
- Cross-industry registry published draft terms: https://www.gs1jp.org/assets/img/pdf/20251205_gjcipr_terms_of_use.pdf
- Lazuli PDP: https://lazuli.ninja/pdp
- Lazuli features/JICFS enrichment: https://corporate.lazuli.ninja/features/
- Rakuten Product Search API: https://webservice.rakuten.co.jp/documentation/ichiba-product-search
- Rakuten Item Search API: https://webservice.rakuten.co.jp/documentation/ichiba-item-search
- Rakuten Web Service terms: https://webservice.rakuten.co.jp/index.php/guide/rule
- Yahoo Shopping API: https://developer.yahoo.co.jp/webapi/shopping/
- Yahoo Shopping item search v3: https://developer.yahoo.co.jp/webapi/shopping/v3/itemsearch.html
- Yahoo Developer Network guideline: https://developer.yahoo.co.jp/guideline/
- DAIWA products: https://www.daiwa.com/jp/product
- SHIMANO products: https://fish.shimano.com/ja-JP/product.html
