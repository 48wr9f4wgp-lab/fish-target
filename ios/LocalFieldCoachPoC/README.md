# Local FIELD COACH iOS PoC

This folder is the native half of fish-target's offline local-LLM experiment.

## Goal

Keep all fishing decisions deterministic in the existing web app. The local model only rewrites already-decided facts into a short Japanese field explanation.

- Web side: `local-field-coach-v30.js`
- Native bridge name: `fishTargetLocalLLM`
- Expected model: GGUF instruction model such as LFM2.5 1.2B
- Target device used for the initial benchmark: iPhone 14 Pro Max class, 6 GB RAM
- No cloud API is required after the model file is installed.

## Xcode wiring

1. Create an iOS app target that hosts fish-target in `WKWebView`.
2. Add the llama.cpp XCFramework to the target. The official llama.cpp repository documents both prebuilt XCFramework use and the SwiftUI iPhone example.
3. Add the Swift files in this folder to the target.
4. Instantiate `FieldCoachController` with a local GGUF model URL.
5. Call `makeWebView()` and load the fish-target URL or bundled web build.
6. Keep the model outside the app bundle for production. `ModelStore` provides a simple first-download helper.

## Contract

The web app sends JSON like:

```json
{
  "schema": 1,
  "task": "render_field_coach",
  "request_id": "ft-...",
  "facts": {
    "species": "ショゴ",
    "method": "メタルジグ",
    "requirements": {},
    "first_cast": {},
    "selected_tackle": {}
  },
  "rules": {
    "max_sentences": 3,
    "use_only_facts": true,
    "do_not_calculate": true,
    "do_not_select_products": true,
    "do_not_invent_numbers": true,
    "plain_text_only": true
  }
}
```

The native side returns by evaluating:

```js
globalThis.FISH_TARGET_LOCAL_FIELD_COACH.resolve(requestId, { text: "..." })
```

## Safety boundary

The LLM must not:
- choose rods, reels, lines, rigs, or products;
- calculate fit or safety thresholds;
- invent wind, wave, weight, price, size, or other numbers;
- override the existing Resolver/Catalog decision.

If inference fails, the web UI falls back to deterministic text built from existing plan facts.
