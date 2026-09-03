# TACKLE AUTO BUILD v31 Decision

## Goal
Move FISH TARGET from independent product suggestions toward a coherent tackle decision:

**Fish → Method → Ideal Set → MY TACKLE best set → gaps → FIELD MODE**

## Context Lock
- Platform: iPhone/Safari/PWA first, portrait baseline around 390×844
- Region: Japan
- Product type: fishing decision/support app
- Offline: core diagnosis and owned-tackle decision should remain usable
- Save: local browser/PWA storage; no save schema change in v31
- Privacy: MY TACKLE is read-only during AUTO BUILD; no external analytics or automatic ownership mutation
- Monetization/LiveOps: none in this change

## Decision
1. Keep existing `rodFit` / `reelFit` as the component-fit source of truth.
2. Add isolated set rules and resolver modules for rod × reel combination scoring.
3. Return a normalized result:
   - `idealSet`
   - `myBestSet`
   - `gaps`
   - `compatibility`
   - `reasons`
4. Evaluate all owned rod × reel combinations rather than blindly pairing individually best components.
5. Product Catalog is secondary. Catalog OFF must not disable Ideal Set / MY SET / gaps.
6. UI hierarchy is `IDEAL SET → MY SET → MISSING`; product candidates are collapsed detail.
7. Do not change fish/method content, Catalog data, MY TACKLE save schema, FIELD LIVE, publication rights boundaries, or main/public deployment.

## Combination score
Lower is better:

```text
max(rodLevel, reelLevel, pairLevel) * 100
+ (rodLevel + reelLevel) * 20
+ pairLevel * 40
```

Tie-break: original MY TACKLE order.

## Pair coherence
Where recommendation and owned data are available, compare rod power direction and reel-size direction around the recommendation target. Opposite drift increases pair penalty. Missing data does not invent incompatibility, but prevents a false `ideal` result.

## Compatibility
- `ideal`
- `good`
- `usable`
- `poor`
- `incompatible`

## Gap types
- `missing_component`
- `acceptable_substitution`
- `underspec`
- `overspec`
- `incompatible`

## Safety
- AUTO BUILD reads `fish_target_v17_tackle` but never writes, removes, or migrates it.
- No lb↔号, oz↔g, m↔ft, or unrelated Japanese size-notation inference is introduced by set rules.
- Existing Catalog publication fail-closed behavior stays intact.
- Codex local commit `27488dd...` is not modified or discarded; this remote implementation is isolated for review and later reconciliation if that local work becomes available.
