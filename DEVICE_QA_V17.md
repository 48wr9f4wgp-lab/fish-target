# FISH TARGET v17 Device QA

Verified on iPhone Home Screen / GitHub Pages on 2026-08-24.

- V17 rendered from the fixed DEV URL
- Fish grid rendered without layout breakage
- MY TACKLE result card rendered on device
- Registered rod/reel were read from local storage
- Example device result showed rod as `条件付きで候補`, reel as `そのまま使いやすい`, and overall as `一部条件を確認`
- No visible script leakage or fatal render failure in supplied screenshots

Not yet verified on device:
- add/remove every tackle field combination
- airplane-mode relaunch / offline shell

Status: DEVICE SMOKE PASS / OFFLINE QA PENDING
