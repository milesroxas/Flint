## Architecture Overview

This document describes the current, implemented architecture of the Webflow Designer Linting extension. It reflects the real code paths, runtime wiring, and module boundaries in this repository.

### Runtime and bootstrapping

- Entry HTML: `index.html` mounts a root container and loads `src/index.tsx`.
- Root render: `src/index.tsx` renders the extension UI via React 18 `createRoot`, wrapping the app in `ExtensionWrapper` and mounting `Header` and the unified `LinterPanel`.
- Webflow wrapper: `src/features/window/components/ExtensionWrapper.tsx` performs a safe Designer‑API resize on mount using `webflow.setExtensionSize`, with dev‑only logs and a graceful no‑API fallback.
- Dev integration: `vite.config.ts` registers a custom plugin that injects Webflow’s designer extension scripts in development and serves extension metadata at `/__webflow`. Aliases `@ → ./src` are configured for imports.

### Project layout (FSD)

- `src/entities`
  - `style/model/style.service.ts`: site style IO and caching. Provides `getAllStylesWithProperties`, `getAppliedStyles(element)`, `sortStylesByType`, and a convenience `getAppliedClassNames` used by classifiers.
  - `element/model/element-context-classifier.ts`: builds a parent map from Designer elements and classifies each element into contexts using preset‑provided `contextConfig`. Caches parent maps by element‑count signature.
  - `element/model/element-context.types.ts`: contracts for classifier, contexts, and Webflow types.
- `src/features/linter`
- `model/linter.factory.ts`: lifecycle for the linter. Exposes `ensureLinterInitialized(mode, preset)`, `setPreset`, `getCurrentPreset`, and a global `ruleRegistry`. On (re)initialize, resets style caches.
- `services/`
  - `registry.ts`: composes the global `ruleRegistry` and `ruleConfigService`, and `initializeRuleRegistry` which registers a preset’s rules, applies opinion mode, and merges persisted configuration.
  - `rule-registry.ts`: in‑memory rule store and configuration API (enable/disable, severity, per‑rule custom settings, import/export/merge).
  - `rule-configuration-service.ts`: persistence to `localStorage` with schema merge and unknown‑key drops.
  - `utility-class-analyzer.ts`: builds utility property maps to detect exact duplicates and overlapping property sets; provides formatted metadata for UI.
  - `rule-runner.ts`: executes rules with element context. Also performs element‑level ordering checks (utilities/combos after base custom), combo‑count limits, and variant base checks. Attaches `metadata.elementId` and, when available, `metadata.role` for UI.
  - `page-lint-service.ts`: orchestration for full‑page scans. Loads all styles, maps elements to applied styles, classifies contexts in batch, runs rules, and attaches role metadata per element.
  - `element-lint-service.ts`: orchestration for selected‑element scans. Builds/reuses utility maps and a cached page‑wide context snapshot, then runs rules and computes role(s) for the element.
- `grammar/*` and `roles/*`: per‑preset `GrammarAdapter` and `RoleResolver` used to parse the first custom class and map it to an `ElementRole`.
- `hooks/`: `useElementLint` (re-exports the Zustand hook), and `usePageLint` (thin store wrapper).
- `store/`: `usePageLintStore.ts` (Zustand + devtools) and `elementLint.store.ts` unify page/element state and actions.
- `view/`: `LinterPanel` orchestrates page/element views with a mode toggle.
- `components/`: presentational pieces: `ViolationsList`, `ViolationItem`, `ModeToggle`, `PresetSwitcher`, etc.
- `src/presets`: `*.preset.ts` files define rule packs, grammar/role resolvers, and optional `contextConfig` for the classifier. A dynamic registry in `src/presets/index.ts` auto‑discovers all presets at build time.
- `src/rules`: rule implementations grouped by category: `naming`, `property`, and `context-aware`.
- `src/processes/scan`: process orchestrators for page and element scans used by hooks and store.
- `src/components/ui`: shared UI primitives (Accordion, Button, Card, etc.).

### Webflow Designer integration

- Global Designer API is consumed where available; all integrations degrade safely when the API is absent:
  - Element selection/highlight: `src/features/window/select-element.ts` prefers `webflow.setSelectedElement` and falls back to dispatching `flowlint:highlight` if unavailable.
  - Element queries: services expect Designer elements implementing `getStyles()` and, where needed, `getChildren()`.
  - Resizing: `ExtensionWrapper` sizes the extension window using `webflow.setExtensionSize`.
  - Dev HTML/script injection and extension metadata endpoint are handled by the Vite plugin.

### Linter architecture

- Presets and roles

- Presets define `rules`, a `grammar` parser, an optional `roles` resolver, and an optional `contextConfig` for the element‑context classifier. Presets are discovered dynamically via `src/presets/index.ts` and the default selection prefers `lumos` when available.

  - Roles: The first custom class is parsed via the active `GrammarAdapter`; `RoleResolver` maps to an `ElementRole` (e.g., `componentRoot`, `childGroup`, `container`, `layout`, `content`, etc.). If grammar yields `componentRoot` but the classifier did not mark `componentRoot`, the role is downgraded to `childGroup`.

- Element contexts

  - Contexts include: `componentRoot`, `childGroup`, `childGroupInvalid`.
  - Classifier uses configurable rules (e.g., `wrapSuffix` `_wrap`, parent container patterns, type‑prefix matching) to categorize wraps and child wraps. It builds a parent map via breadth‑first traversal using `getChildren()` when available. Parent maps are cached by element‑count signature.

- Rule registry and configuration

- `rule-registry.ts` stores rules and per‑rule configuration. `registry.ts` exposes a singleton registry and `initializeRuleRegistry(presetId)` which:

  - Clears prior rules, registers the active preset’s rules (seeding default settings), applies opinion mode, and merges persisted user config.
  - Configuration supports enabling/disabling rules, changing severity, and custom settings (e.g., `lumos-combo-class-limit.maxCombos`).

- Rule types and execution
  - Rule kinds: `naming` and `property`, each targeting `custom`, `utility`, or `combo` classes and optionally a specific element context.
  - `rule-runner.ts` filters rules by class type, enabled state, and element context; then executes:
    - Naming rules via `test` or optional `evaluate` (which receives merged custom settings).
    - Property rules via `analyze`, with a context containing `allStyles` and utility property maps from `utility-class-analyzer`.
  - Element‑level checks (in the runner) implement:
    - Utilities/combos must follow the base custom class order.
    - Combo count limit per element.
    - Variants require a base custom/component class.
  - Duplicate‑utility detection is handled by `utility-class-analyzer` with formatted metadata for exact matches.

### Scanning processes

- Selected element: `src/processes/scan/scan-selected-element.ts`

  - Ensures the linter is initialized, invokes the element service’s `lintElement`/`lintElementWithMeta`, and returns violations plus metadata (`classNames`, `contexts`, `roles`).

- Current page: `src/processes/scan/scan-current-page.ts`
  - Ensures initialization, creates services, builds property maps from all styles once, classifies contexts for all valid elements, runs rules, and returns results. The `WithMeta` variant also aggregates unique class names discovered during the scan.

### State, hooks, and UI

- Store: `usePageLintStore.ts` (Zustand) holds page‑scan results and exposes `lintPage()` which fetches elements via the Designer API, calls the page scan process, and stores results and the set of passed class names.
- Hooks:
  - `useElementLint`: subscribes to `selectedelement`, calls the selected‑element scan, and exposes `violations`, `contexts`, `classNames`, `roles`, and `isLoading`.
  - `usePageLint`: thin wrapper returning the Zustand store.
- UI: `features/linter/components/*` renders the panel, list, items, headers, mode/preset toggles, and role/context badges. Opening an accordion row can trigger a highlight selection in the Designer.

### Build, packaging, and tooling

- Scripts: see `package.json`.
  - `pnpm dev`: Vite dev server with the Webflow plugin and `/__webflow` metadata.
  - `pnpm build:development` / `pnpm build:prod`: TypeScript compile, Vite build, `webflow extension bundle`, and move `bundle.zip` into timestamped folders under `bundle/development` or `bundle/prod`.
  - `pnpm lint`: ESLint across the repo.
- Vite build outputs `dist/bundle.js` and `dist/styles.css` (see `rollupOptions.output`).
- `webflow.json` configures the extension name, `publicDir`, custom size, and Designer API version.
- TypeScript: strict mode, bundler module resolution, `@/*` path alias.
- Styling: Tailwind/PostCSS pipeline feeds `src/styles/globals.css`.

### Testing

- Tests run with Vitest; integration and snapshot tests live under `src/features/linter/services/__tests__/`.

### Key constraints and behavior

- Only Designer elements that implement `getStyles()` are linted; non‑Designer elements are ignored gracefully.
- All Webflow integrations are defensive with dev‑only logging; the UI continues to function even when Designer APIs are unavailable.
- Style and context computations are cached to avoid recomputation within a session or page snapshot.
