FISH TARGET V34 MASTER FISH VISUAL GENERATION BRIEF
generated_at: 2026-09-15
generator: OpenAI image_gen
model: image_gen (tool-managed)
generation_id: 3b839f20-0bb0-421a-b35f-aa6c19b568c0

PROMPT BASIS
FISH TARGET V34 master asset pilot review sheet: four species ブリ・ワラサ, ニジマス, ヒラメ, アオリイカ; realistic premium field-guide illustration, whole-body diagnostic anatomy visible, natural coloration, clean light background, app-readable silhouettes, four-species comparison sheet with identification context.

prompt_basis_sha256: 7ffee6ddbcc0c746a38ebf45beb614238ce050602640a6327d49141dd08bfc50

SOURCE REVIEW COMPOSITE
source_file: fish-masters-review.png
source_sha256: 2a18f67fd6b466e2457b4b54b44339bac67d06450dda3716e57c74eaf3558543
source_character: project-generated, text-free four-species review composite

NOTE ON PROMPT PROVENANCE
The image generation tool does not expose its exact internal prompt string. The prompt hash above is the SHA-256 of the canonical project-side prompt basis recorded here, not a claim about hidden tool internals.

TRANSFORMATION RECIPE
1. crop-species-quadrant-from-text-free-project-generated-review-composite
2. resize-to-1200x768-white-canvas
3. reframe-subject-to-95pct-scale-for-minimum-8pct-horizontal-safe-margin
4. encode-avif-ffmpeg-libaom-crf56-yuv420p

No semantic repainting was applied after generation. Final runtime assets contain no fish-name label, branding, metadata text, logo, watermark, hook, or human hand.

ASSET OUTPUTS
- ブリ・ワラサ: fish-master-v34-buri-warasa.avif
  sha256: 2b4a0e685ab52bcb32cc387c0c4cf73983a84162ce4dee98c3ace3ce7545cb33
- ニジマス: fish-master-v34-nijimasu.avif
  sha256: 52503c251545271a92bdca7c0a3c9bac1015386c509db2db889b3d4bdc5fede3
- ヒラメ: fish-master-v34-hirame.avif
  sha256: 6f3736ab006a932d411cf5673d95e51fe17af4660de3e3bb7e26a89a0dcc36e4
- アオリイカ: fish-master-v34-aoriika.avif
  sha256: 9bcf5ab43250c0abfaf24d004cde80fcf0123d03869dff4d9a0c6a4dad0ce4b1

FRAME / MOBILE VERIFICATION
- All four outputs are 1200x768 AVIF, yuv420p.
- Each subject is reframed to 95% scale on the 1200x768 white canvas; measured horizontal margins are all >=9.3%, exceeding the >=8% contract.
- 390px human review was performed on the final safe-frame CRF56 exports.
- Diagnostic cues remain readable at mobile review size: yellow stripe/forked tail (ブリ・ワラサ), pink lateral band/spots (ニジマス), asymmetric flat body/left-eye anatomy (ヒラメ), broad mantle/lateral fins/tentacles (アオリイカ).

REVIEW STATUS
- User explicitly approved implementation of the generated master set on 2026-09-15.
- Visual art-direction / 390px implementation review passed for these four pilot assets.
- This is not an ichthyologist or scientific certification. Species-identity QA remains governed by the V34 human identity review contract.
