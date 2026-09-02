# FISH TARGET V23 Visual Pass 1

Status: implementation direction
Date: 2026-08-27

## Adopted concept
A. Field Guide Clean

## Goals
- Make the fish list readable at a glance on iPhone.
- Make each target visually identifiable without reading the name.
- Keep the primary product flow: fish -> method -> FIRST CAST -> tackle -> 3 steps.
- Improve MY TACKLE readability without changing compatibility behavior.

## Non-goals
- No compatibility-engine change.
- No persistence/schema change.
- No FIELD LIVE enablement.
- No new navigation model.
- No public-release claim.

## Art rule
Existing per-species SVG silhouettes remain as offline fallback. Visual Pass 1 adds species-specific field-guide palettes, stronger outlines/pattern contrast, and larger art presentation. Every one of the 19 current targets has an explicit palette entry.

## Mobile layout
- 1-column fish list at phone widths.
- Artwork left, primary identity and recommendation right.
- Larger name/method/difficulty hierarchy.
- Result hero artwork enlarged and species-colored.
- Result sections use clearer spacing and type hierarchy.

## Verification
- syntax/unit/build through CI
- iPhone Safari real-device visual confirmation required before considering the visual pass accepted
- 375/390/430 Browser E2E remains Codex final-QA territory
