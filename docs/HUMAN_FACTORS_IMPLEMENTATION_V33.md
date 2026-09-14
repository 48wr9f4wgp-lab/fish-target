# Human Factors Implementation v33

This file converts `PRODUCT_HUMAN_FACTORS_GOAL_V33.md` into a narrow implementation contract.

## P0 code changes

1. STEP 3 becomes answer-first consumer language.
   - title: `今回のセット`
   - canonical states: `このセットで行ける / 確認が必要 / 足りない`
   - Ideal/gap/product detail moves behind disclosure.

2. Local set resolution becomes automatic.
   - Fish/method change immediately resolves Ideal + MY TACKLE locally.
   - Catalog hydration remains user-triggered and optional.
   - No MY TACKLE write/migration.

3. FIELD MODE consumes the current MY SET when one exists.
   - owned rod/reel/current line shown instead of generic requirement-only output
   - generic requirement remains fallback when MY TACKLE is absent.

4. Critical typography is raised.
   - no essential FIELD MODE meaning in 7–10px text
   - AUTO BUILD decision and next action use phone-readable sizes
   - 44px+ frequent controls remain protected.

5. FIELD MODE wording is glance-oriented.
   - `反応がなければ` replaces vague `次の候補`
   - setup heading becomes `今回のセット`
   - field steps become `現場の3手`

## Regression contract

- Catalog stays cold at startup and during automatic local set resolution.
- User-triggered product candidate action is the only AUTO BUILD Catalog hydration path.
- Fish/method change invalidates any in-flight Catalog result.
- New fish automatically resolves its own local set after a race.
- No ownership write.
- No primary horizontal overflow at 390px.
- Field mode receives the current owned set when available.
