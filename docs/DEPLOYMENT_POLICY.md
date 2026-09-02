# Deployment Policy

GitHub is canonical. GitHub Pages is the only current delivery route for DEV and release-candidate verification.

- Deploy from the generated `dist/` artifact only after syntax, build, behavior, visual, offline, and regression checks pass.
- `main` push is the normal automatic Pages deployment trigger; routine operation must not depend on manual workflow runs.
- Keep `build.config.json` as the sole build-version source.
- Do not use Base64/gzip reconstruction, runtime HTML post-processing loaders, or a second hosting provider.
- Do not merge release branches into `main` until PR checks and required device QA are reviewed.
