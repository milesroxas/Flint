## Audit Tool — Webflow Designer Extension

Lint Webflow classes in real time. The extension validates naming, detects duplicate utilities, and applies context‑aware rules so teams can keep sites clean as they work.

### Quick start

- **Install**: `npm i`
- **Dev server**:
  ```bash
  npm run dev
  ```
  Use the printed URL as your Webflow “Development URL”.
- **Build (development bundle.zip)**:
  ```bash
  npm run build:dev
  ```
- **Build (production bundle.zip)**:
  ```bash
  npm run build:prod
  ```
- **Lint code**:
  ```bash
  npm run lint
  ```

### Architecture (FSD overview)

- `src/entities`
  - `style/model/style.service.ts`: reads site styles and element styles. Caches site‑wide styles for the session and offers a lightweight `getAppliedClassNames` for classification.
  - `element/model/element-context-classifier.ts`: builds a parent map and classifies elements (e.g., `componentRoot`). Caches per page snapshot.
- `src/features/linter`
  - `model/`: `linter.factory.ts` bootstraps the rule registry (presets + opinion mode), exposes the global registry.
  - `services/`:
    - `element-lint-service.ts` (singleton): orchestrates element scans, reuses cached styles and contexts.
    - `rule-runner.ts`: executes rules per class with context via `runRulesOnStylesWithContext`.
    - `rule-registry.ts`, `rule-configuration-service.ts`.
    - `utility-class-analyzer.ts`: builds maps for utility property duplicates (memoized).
  - `hooks/`: `useElementLint.ts`, `usePageLint.ts`.
  - `store/`: `usePageLintStore.ts` (Zustand) for page scans.
  - `components/`: compact UI for results (`LintPanel`, `ViolationsList`, `ViolationItem`, etc.).
- `src/processes/scan`: orchestrators for element and page scanning.
- `src/presets`: `lumos.preset.ts`, `client-first.preset.ts` define rule packs (single source of truth).
- `src/rules`: naming, property, and context‑aware rule implementations.

### What’s new (User stories alignment)

- Suggested corrected names for Lumos custom class format violations (shown in results)
- Configurable element-level checks (Lumos):
  - Utilities and combos must follow the base custom class
  - Combo class count limit (default 2; configurable)
- “Highlight element” action from a violation when supported by Webflow

### How element linting works

1. Selection event triggers `useElementLint`.
2. `ensureLinterInitialized()` builds/loads the registry from a preset and persisted config.
3. `element-lint-service` fetches cached site styles, builds utility maps, gets the element’s applied styles, and classifies page contexts.
4. `rule-runner` filters applicable rules (by class type and context) and returns results.
5. UI renders issues, suggestions, and duplicates with structured details.

### Presets and configuration

- Presets: `lumos` (default) and `client-first` define the rule set.
- Opinion mode: `balanced` by default; initialization path supports other modes.
- Config persistence: `rule-configuration-service` stores per‑rule settings and merges with schema defaults on load.
  - New option: `lumos-combo-class-limit.maxCombos` (number; default 2)

### Performance

- Site styles are cached for the session and invalidated on preset/mode changes.
- Page parent map and element class lists are cached per snapshot.
- Utility property maps rebuild only when the style list changes.
- Logging in hot loops is minimized for responsiveness.

### Testing

- Run tests with:
  ```bash
  npx vitest
  ```
- Integration and snapshot tests live under `src/features/linter/services/__tests__/`.

### Key files

- `src/features/linter/model/linter.factory.ts`
- `src/features/linter/services/element-lint-service.ts`
- `src/features/linter/services/rule-runner.ts`
- `src/entities/style/model/style.service.ts`
- `src/entities/element/model/element-context-classifier.ts`
- `src/presets/lumos.preset.ts`, `src/presets/client-first.preset.ts`
- `src/processes/scan/scan-selected-element.ts`, `src/processes/scan/scan-current-page.ts`

### Further reading

- Guides: `docs/guides/unified-plan.md`, `docs/guides/architecture.md`.
- ADRs: see `docs/adrs/` (notably ADR‑012 for legacy cleanup).
