@@

# ADR-017: Vite plugin for Webflow Designer dev and deterministic bundling

## Status

Accepted — 2025-08-11

## Context

Running the extension locally requires injecting Webflow’s Designer extension boot scripts into the Vite dev server HTML and serving the `webflow.json` manifest for the Designer to read. We also need deterministic `bundle.js` and `styles.css` artifact names for the `webflow extension bundle` step and timestamped archives for dev/prod.

## Decision

- Add a custom Vite plugin (`wfDesignerExtensionPlugin`) in `vite.config.ts` that:
  - Fetches the Designer extension HTML template based on `apiVersion` from `webflow.json` and injects its script tags into the dev `index.html` head.
  - Serves `webflow.json` at `/.well-known`-style endpoint `/__webflow` for local development.
  - Restarts the dev server when `src/**/*.ts(x)` and CSS files change to keep Designer in sync.
- Configure build output names to be deterministic:
  - `entryFileNames: 'bundle.js'`, `assetFileNames: 'styles.css'`.
- Provide `pnpm build:dev` and `pnpm build:prod` scripts to run `tsc`, build with mode, bundle via `webflow extension bundle`, and move the resulting archive into timestamped paths under `bundle/development/` or `bundle/prod/`.

## Consequences

- Local dev mirrors Designer runtime closely without manual HTML edits.
- Build artifacts are predictable for Webflow’s bundler and archived for traceability.

## Alternatives Considered

- Manually editing `index.html` per boot script change: error‑prone and not scalable.
- Relying on hash‑based filenames: conflicts with Webflow bundling expectations.

## References

- `vite.config.ts` plugin `wfDesignerExtensionPlugin`
- `package.json` scripts `build:dev`, `build:prod`
- `webflow.json` manifest
