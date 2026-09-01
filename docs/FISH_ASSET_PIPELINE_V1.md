# FISH TARGET — Fish Asset Pipeline V1

Status: architecture / research pipeline
Date: 2026-08-30

## Goal

Move FISH TARGET from runtime-dependent fish imagery to a bundled-first, license-gated asset pipeline without allowing taxonomy guesses, silent rights promotion, or untraceable transformed files.

Current product composition:
- 60 canonical fishing targets
- 19 currently bundled sprite targets
- 41 non-bundled targets in the derived rights queue
- 35 reviewed image candidates eligible for intake planning
- 6 targets blocked by taxonomy review

The first safe image milestone is therefore 54/60 bundled targets: current 19 plus 35 verified candidates. The 6 taxonomy-review targets remain remote/fallback until their product taxon is explicitly resolved.

## Canonical pipeline

1. `Species Registry`
   - canonical product target name and stable `species_id`
2. `Rights Queue`
   - derived automatically from the 60-target composition minus currently bundled authoring
   - queue IDs are species-stable, never position-based
3. `Candidate Registry`
   - research-only
   - records source taxon, source page, author, license, attribution, review date
   - cannot assert `rights_status` or `publication_ready`
   - taxonomy ambiguity blocks intake
4. `Intake Plan`
   - side-effect free
   - maps verified candidate to `assets/fish/<species_id>.avif`
   - performs no download, write, publication, or branch mutation
5. `Intake Receipt`
   - created only after an actual source file has been obtained and transformed
   - records source-file URL, source SHA-256, output SHA-256, transformation list, transformation notice, output license, and import date
   - must exactly match the reviewed candidate metadata
6. `Promotion Plan`
   - side-effect free
   - maps a verified receipt to a provenance-preserving fish asset authoring record
   - does not mutate authoring or publish files
7. `Fish Asset Authoring`
   - verified direct files require complete provenance
   - build contract verifies the committed output bytes against the declared output SHA-256
   - only then can generated runtime metadata derive `publication_ready=true`
8. `Manifest / Runtime`
   - bundled files win over remote fallback
   - provenance remains available in the manifest for audit/debug
9. `QA`
   - syntax / unit / contract
   - build
   - browser regression including direct-file fixture
   - iPhone/PWA device verification remains mandatory for visual completion

## Hard gates

A direct bundled fish image must not become publication-ready unless all of the following hold:
- target resolves to a canonical registered species
- candidate status is `verified-candidate`
- license is on the accepted allowlist
- source page is HTTPS
- attribution fields required by the license are present
- intake receipt matches the candidate
- source file URL is HTTPS
- source SHA-256 is present
- generated output SHA-256 is present
- output license preserves the source license in the automated path
- transformation history and a human-readable transformation notice are present
- committed output file exists
- committed output bytes match the declared output SHA-256
- full automated regression remains green

## Taxonomy-review targets

Do not bind one arbitrary species image to these product labels until product intent is resolved:
- カレイ
- エソ
- オニカサゴ
- マルイカ
- ヒイカ
- タナゴ

These are intentionally fail-closed. A visually plausible image is not sufficient evidence.

Resolved candidate taxonomy notes:
- アナゴ is treated as マアナゴ (`Conger myriaster`) for candidate research based on the DAIWA Fish Field Guide.
- ベラ is treated as キュウセン (`Parajulis poecilepterus`) for candidate research: DAIWA lists ベラ as a vernacular name for キュウセン, FishBase accepts `Parajulis poecilepterus`, and the selected Commons photo is author-released public domain.

## External-impact approval boundary

Research, validation, dry-run planning, tests, and pipeline code may proceed autonomously.

Actual third-party image download plus committing/re-distributing those image binaries in the public repository is an external publication/re-distribution action. Do not execute that step without explicit user approval.

Likewise, do not merge PR #17 or `main` without explicit approval.

## First execution batch after approval

Prefer the 35 verified candidates first. Do not block the first device-quality pass on the 6 ambiguous labels.

After the first binary intake:
1. verify every receipt and file hash
2. generate authoring/runtime
3. run rc-qa
4. run full browser QA
5. verify 390×844 iPhone/PWA views for species identity, crop/readability, load behavior, attribution behavior, and fallback regression
6. only then continue taxonomy resolution or remaining image intake
