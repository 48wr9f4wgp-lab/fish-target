# Visual fish-art QA note

## VISUAL3 device failure
Manual iPhone Safari QA showed that the realistic fish layer did not activate; the app displayed the existing SVG fallback only.

## Root cause
The binary `fish-real-sprite.webp` stored in the deployed GitHub Pages artifact was truncated/corrupted. Safari correctly failed the image probe, so the implementation kept the SVG fallback by design.

## Repair
The binary upload path was removed. VISUAL5 ships the realistic fish artwork as small Base64 text chunks, reconstructs four WebP rows in-browser, and only hides the SVG fallback after all four rows successfully decode.

Artifact-level verification for VISUAL5:
- build: `V23-DEV2-DAIWA-VISUAL5`
- fish renderer: `V23-REAL3`
- all 4 reconstructed rows have exact SHA256 matches against the verified local source assets
- all 4 rows decode as WebP at 500x100
- old corrupt `fish-real-sprite.webp`, `fish-real-row2.b64`, and `fish-real-row3.b64` are excluded from the build and removed from the source branch

## Remaining gate
Artifact-level repair is verified. iPhone visual QA is still required before calling the realistic fish-art pass complete.