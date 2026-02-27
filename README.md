## Flint — Webflow Designer Extension

Lint Webflow classes in real time. Validates naming, detects duplicate utilities, and applies context-aware rules so teams keep sites clean while they work.

### Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick start](#quick-start)
- [Development](#development)
- [Architecture overview](#architecture-overview)
- [Documentation index](#documentation-index)
- [Testing](#testing)
- [Project structure](#project-structure)

### Overview

Flint is a React + Vite Designer extension written in strict TypeScript. It attaches to the Webflow Designer API, loads preset-driven linting rules for Lumos and Client-first, and renders results inside `src/features/linter/view/LinterPanel.tsx`. Grammar adapters (`src/features/linter/presets/*.preset.ts`) parse the first custom class on each element to determine its role, while context-aware services map DOM relationships so rules understand root wrappers, child groups, and invalid combinations. Utility duplicate detection is powered by `src/features/linter/services/analyzers/utility-class-analyzer.ts`, and UI state is managed with Zustand stores.

### Features

- Preset-aware linting: `src/features/linter/presets/client-first.preset.ts` and `lumos.preset.ts` register grammar, rule, and role resolvers. Enable/disable them per environment via `VITE_ENABLE_CLIENT_FIRST` / `VITE_ENABLE_LUMOS` in `.env.*`.
- Context + role detection: `lint-context.service.ts` builds cached page contexts (element graphs, parent relationships, tags, and role maps) so rules know when wraps or child groups violate the preset conventions.
- Duplicate utilities and metadata: `createUtilityClassAnalyzer()` fingerprints utility classes, surfaces full-property `exactMatches`, and produces formatted payloads for single-property duplicates consumed by `ViolationDetails`.
- Element vs structural scans: `useElementLintStore` supports a structural-context toggle that reuses the page context to lint a component boundary, while `usePageLintStore` runs a full `scanCurrentPageWithMeta()` across all Designer elements.
- UI feedback and Designer highlight: `ViolationsList.tsx` filters by severity, animates counts via `useAnimationStore`, and calls `selectElementById()` so opening a violation (page mode or structural element lint) highlights the element in Designer with a `flowlint:highlight` fallback event.
- Enhanced messaging and badges: `message-formatter.ts` and the shared `Badge` variants colorize quoted fragments (class names, suggestions, dynamic placeholders) for high-signal lint messages without sacrificing accessibility.

### Quick start

- Install dependencies:
  ```bash
  pnpm install
  ```
- Start the Designer dev server (prints the URL you set as your Webflow “Development URL”):
  ```bash
  pnpm dev
  ```
- Build timestamped bundles:
  ```bash
  pnpm build       # Interactive CLI: pick channel (prod/dev) and recipient
  pnpm build:dev   # Direct: development mode → bundle/development/internal/
  pnpm build:prod  # Direct: production mode → bundle/prod/internal/
  ```
  Output goes to `bundle/<channel>/<recipient>/` (e.g. `bundle/prod/group-a/`).
- Preview the compiled extension locally:
  ```bash
  pnpm preview
  ```
- Lint and type-check:
  ```bash
  pnpm lint        # Biome
  pnpm lint:all    # tsc --noEmit + Biome
  pnpm format      # Biome formatter
  ```

### Development

- Tooling: Vite, strict TypeScript, Biome (lint + format), Vitest, Zustand, Radix UI (via shadcn). Scripts live in `package.json`.
- Path aliases: `@/* → src/*` (`tsconfig.json`) aligned with Vite (`vite.config.ts`).
- Framework toggles: `.env.development` / `.env.production` expose `VITE_ENABLE_CLIENT_FIRST` and `VITE_ENABLE_LUMOS` (see `docs/guides/framework_config.md`).
- Webflow integration: `vite.config.ts` registers a `wf-vite-extension-plugin` that injects the Designer boot scripts, watches TS/TSX/CSS files, and serves `webflow.json` via `/__webflow` for the CLI.
- Build pipeline: `pnpm build` runs an interactive CLI; `pnpm build:dev` / `pnpm build:prod` run `tsc`, Vite build, `webflow extension bundle`, and move the zip into `bundle/<channel>/<recipient>/`. `scripts/post-build.js` can mirror `dist/` into `public/` for manual distribution.

### Architecture overview

- **Services and analyzers**
  - `src/features/linter/services/lint-context.service.ts` caches hashed page contexts, builds element graphs, gathers slot class names, and stores role/tag/element-type maps reused by page + structural scans.
  - `element-lint-service.ts` and `page-lint-service.ts` wrap `RuleRunner` to lint a selected element (optionally using the structural context) or an entire page; the element service filters results to the selected element unless structural context is on.
  - `linter-service-factory.ts` and `linter-service-singleton.ts` expose shared instances (style service, analyzer, context service, preset element service) that are reset whenever `ensureLinterInitialized()` or preset changes occur.
  - `rule-runner.ts` orchestrates page rules, element rules, and property rules, respecting registry configuration and class type resolution derived from the active grammar.
  - `src/entities/style/services/style.service.ts` fronts the Designer API (`getAllStyles`, `getStyles`, `style.isComboClass()`), caches sitewide styles, and annotates detection sources for combos.
  - `src/features/linter/services/analyzers/utility-class-analyzer.ts` and `preset-elements.service.ts` provide duplicate detection metadata and preset-driven element catalogs for expanded-view UI.
- **Use cases and stores**
  - `src/features/linter/use-cases/scan-selected-element.ts` / `scan-current-page.ts` ensure the registry is initialized, build property maps, and funnel elements to the appropriate service.
  - `elementLint.store.ts` subscribes to Designer `selectedelement` events, tracks the last selection, exposes structural-context toggles, and triggers scans via `scanSelectedElement`.
  - `usePageLintStore.ts` coordinates page-wide scans (`scanCurrentPageWithMeta`), invalidates cached contexts, stores “passed” class names, and triggers animation phases.
  - `store/animation.store.ts` sequences severity tile animations, count-up effects, and violation reveals via Zustand.
- **UI and Designer integration**
  - `src/features/linter/view/LinterPanel.tsx` renders the mode toggle, severity filter, action bar, and wires up stores for live counts.
  - `ui/violations/ViolationsList.tsx` groups violations by severity, applies staggered animations, and calls `selectElementById()` on accordion changes so Designer highlights stay in sync.
  - `src/features/window/select-element.ts` encapsulates Designer selection APIs with DOM traversal fallbacks before dispatching the `flowlint:highlight` custom event.
  - `src/features/linter/lib/message-formatter.ts`, `message-parser.ts`, and `src/shared/ui/badge.tsx` implement the color-coded badges, copy-to-clipboard helpers, and parsing logic used inside `ViolationDetails`.

### Documentation index

- **Guides**
  - `docs/guides/how-it-all-works.md` — walkthrough of the runtime lifecycle, registry, and UI flow.
  - `docs/guides/framework_config.md` — environment variable switches for enabling Client-first vs Lumos presets.
  - `docs/guides/linting.md` — Biome + TypeScript lint/type-check practices (`pnpm lint:all`, `pnpm format`).
- **Notes**
  - `docs/notes/rules.md` — catalog of rule categories and Lumos rule behavior.
- **Module READMEs & references**
  - `src/features/linter/README.md` — feature overview and contracts.
  - `src/features/linter/presets/README.md` — preset structure and grammar expectations.
  - `src/features/linter/services/README.md` — context service, analyzer, and runner docs.
  - `src/features/linter/lib/README.md` — formatter, parser, label helpers.
  - `src/features/linter/rules/README.md` (plus `rules/lumos`, `rules/client-first`, `rules/shared`) — rule catalogs.
  - `src/features/linter/store/README.md` — animation store sequencing.
  - `src/shared/ui/README.md` and `src/shared/ui/badge/README.md` — Badge + UI system details.
  - `src/shared/utils/README.md` — debug utilities.
  - `src/styles/README.md` — animation tokens and easing utilities.
  - `src/entities/element/model/element.types.ts` — element + role typing.
  - `src/entities/style/services/style.service.ts` — single source of truth for Designer style IO.
- **RFCs**
  - Folder: `docs/rfcs/`
  - Template: `docs/rfcs/template.md`
  - Create a new RFC:
    1. Copy the template into `docs/rfcs/<topic>.md`.
    2. Complete Summary → Adoption Strategy sections.
    3. Open a PR with the RFC for review before implementing changes.

### Testing

- Run the full suite (Vitest):
  ```bash
  pnpm test        # interactive
  pnpm test:run    # one-off CI run
  pnpm test:watch  # watch mode
  ```
- Current coverage focuses on rule behavior:
  - Lumos naming + composition suites under `src/features/linter/rules/lumos/**/__tests__/`.
  - Canonical page rules under `src/features/linter/rules/canonical/__tests__/`.
  - There are no dedicated `src/features/linter/services/__tests__` or `src/entities/style/services/__tests__` directories today; service changes should be validated manually or by adding new Vitest suites alongside the affected modules.

### Project structure

```
├── docs/
│   ├── guides/ (framework_config.md, how-it-all-works.md, linting.md)
│   ├── notes/rules.md
│   └── rfcs/template.md
├── src/
│   ├── app/ui/…                       # shell + header
│   ├── entities/
│   │   ├── element/…                 # id helpers, model/types, services
│   │   └── style/…                   # style service + cache
│   ├── features/
│   │   ├── linter/
│   │   │   ├── lib/                  # message formatter, labels, parser
│   │   │   ├── model/                # preset + registry types
│   │   │   ├── presets/              # lumos + client-first definitions
│   │   │   ├── rules/                # canonical + preset rules
│   │   │   ├── services/             # context, runner, analyzer, lint services
│   │   │   ├── store/                # element/page/animation Zustand stores
│   │   │   ├── ui/                   # violation UI, controls
│   │   │   ├── use-cases/            # scan-selected-element/current-page
│   │   │   └── view/LinterPanel.tsx  # panel entrypoint
│   │   └── window/                   # Designer window helpers (select-element)
│   ├── shared/
│   │   ├── lib/                      # stable JSON helpers
│   │   ├── ui/                       # shadcn-based primitives
│   │   └── utils/                    # cn(), debugger, etc.
│   └── styles/                       # globals + animation docs
├── scripts/post-build.js             # dist → public copier
├── bundle/                           # timestamped bundle archives
├── public/ & dist/                   # Vite outputs
├── webflow.json                      # Designer manifest for bundling
├── components.json                   # shadcn ui config
├── biome.json, tsconfig.json, vite.config.ts
└── package.json, pnpm-lock.yaml
```
