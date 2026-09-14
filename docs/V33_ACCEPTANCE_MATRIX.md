# V33 Persona Acceptance Matrix

| Scenario | Required answer | Must not happen |
|---|---|---|
| Fresh user, no MY TACKLE | METHOD + FIRST CAST immediately; setup registration remains optional | setup registration blocks first useful answer |
| Returning user, valid MY TACKLE | automatic `今回のセット` decision | user must press a calculation button to learn the owned-set answer |
| Returning user, incomplete MY TACKLE | `確認が必要` with named issue | uncertain data shown as READY/green |
| Returning user, incompatible/missing set | `足りない` and direct edit/add action | false confidence or generic unexplained failure |
| Experienced user | answer first, evidence/alternates on demand | mandatory long explanations before result |
| At water, one-handed | FIRST CAST + range/action + fallback + `現場の3手` + current set visible at a glance | critical 7–10px text, horizontal hunt, competing CTAs |
| Offline | fish/method/FIRST CAST/MY SET core remains usable | Catalog/network becomes a core blocker |
| Corrupt storage | fish -> result still completes with sanitized reads | startup/result progression stalls |
| Catalog race after fish change | late result is discarded; new fish owns current decision | previous fish candidate data revives |

## V33 wording contract

Primary user-facing state language is limited to:
- このセットで行ける
- 確認が必要
- 足りない

Engineering labels (`ideal`, `good`, `usable`, `poor`, `incompatible`, resolver scores) remain internal/detail-only.

## V33 field hierarchy

This matrix follows the canonical order in `PRODUCT_HUMAN_FACTORS_GOAL_V33.md`.

1. FIRST CAST
2. size/range/action
3. 反応がなければ
4. 現場の3手
5. 今回のセット
6. conditions/detail
