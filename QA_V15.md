# FISH TARGET v15 QA

## Scope
PWA shell and offline fallback for GitHub Pages / iPhone home-screen usage.

## Automated / static checks
- `pwa.js` syntax: pass
- `sw.js` syntax: pass
- `manifest.webmanifest` JSON parse: pass
- All 13 Service Worker shell-cache paths exist on the v15 branch
- Network strategy: online/network first, cache fallback on failure
- External LIVE APIs are not cached by the Service Worker
- Existing fish/product/recommendation logic unchanged

## Intended offline behavior
- Home / fish database: available after first online load
- Basic result plan: available after first online load
- FIELD MODE: available after first online load
- Saved plans: local storage behavior unchanged
- FIELD LIVE / place search: online only

## Pending hard verification
- iPhone Safari / Home Screen: first online load installs Service Worker
- Airplane mode relaunch works
- Offline indicator appears
- Fish -> result -> FIELD MODE works offline
- Reconnect returns to live mode

Status: STATIC QA PASS / DEVICE OFFLINE QA PENDING
