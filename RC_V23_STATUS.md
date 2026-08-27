# FISH TARGET V23 RC Status

This file is a checkpoint, not a release declaration.

## Baseline
- Scope: `RC_V23_SCOPE_LOCK.md`
- QA contract: `RC_V23_QA_CHECKLIST.md`
- FIELD LIVE: OFF
- Manufacturer catalog production gates: OFF unless separately approved
- Formal release / merge to `main`: NOT approved

## Current transition
The accepted Visual8 build is being converted from temporary runtime Base64 fish-asset reconstruction to a direct verified binary AVIF asset, as required by `docs/DEPLOYMENT_POLICY.md`.

RC branch creation is blocked until that conversion passes build, automated tests, Pages deployment, and artifact verification.
