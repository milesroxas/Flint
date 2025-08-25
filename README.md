## Audit Tool — Webflow Designer Extension

Lint Webflow classes in real time. Validates naming, detects duplicate utilities, and applies context‑aware rules so teams keep sites clean while they work.

### Table of Contents

- Overview
- Features
- Quick start
- Development
- Architecture overview
- Documentation index (guides, module READMEs, ADRs)
- Testing
- Project structure

### Overview

React + Vite extension that integrates with the Webflow Designer API. Preset‑driven linter (Lumos, Client‑first) analyzes class naming, order, and style properties, with element‑context awareness and role identification.

### Features

- Class type detection: custom, utility, combo (combo prefers Webflow API `style.isComboClass()` with fallback to variant-like heuristic such as `is-`, `is_`, or `isCamelCase`)
- Naming validation per class type
- Utility exact-duplicate detection (identical full property sets). Overlap-only checks are disabled by default.
- Element‑context classification (componentRoot, childGroup, childGroupInvalid)
- Role identification from the first custom class per preset
- Presets and opinion modes with persisted rule configuration
- Page and selected‑element scanning, highlighting in Designer
- **🎨 Enhanced Message Color Coding**: Intelligent color coding system that automatically applies appropriate colors to different content types in lint messages for improved readability

### Quick start

- Install: `pnpm i`
- Dev server:
  ```bash
  pnpm dev
  ```
  Use the printed URL as your Webflow “Development URL”.
- Build (development bundle.zip):
  ```bash
  pnpm build:dev
  ```
- Build (production bundle.zip):
  ```bash
  pnpm build:prod
  ```
- Lint code:
  ```bash
  pnpm lint
  ```

### Development

- Tooling: Vite, TypeScript (strict), ESLint, Vitest
- Path alias: `@/* → src/*` (see `tsconfig.json`)
- Webflow integration:
  - Dev: custom Vite plugin injects Webflow extension scripts and serves `/__webflow` from `webflow.json`
  - Runtime: defensive access to Designer APIs (`getAllElements`, `getAllStyles`, `getStyles`, `getChildren`, `setSelectedElement`); combo detection uses `style.isComboClass()` when available with heuristic fallback

### Architecture overview

- See `docs/guides/architecture.md` for a full, up‑to‑date description of runtime wiring, services, presets, and flows.
- **Core Services**: `src/features/linter/services/` contains the shared context service architecture with intelligent caching and redundancy elimination.
- **Enhanced UI**: `src/shared/ui/` contains enhanced components with intelligent color coding for improved message readability.
- Key modules: `src/entities/*`, `src/features/linter/*`, `src/processes/scan/*`, `src/presets/*`, `src/rules/*`, `src/features/window/*`. The linter UI entry is `src/features/linter/view/LinterPanel.tsx`.
  - Auto-highlight on violation open in page mode is implemented in `src/features/linter/ui/violations/ViolationsSection.tsx` via `selectElementById` with a fallback `flowlint:highlight` event.
  - **New**: Context service (`lint-context.service.ts`) centralizes bootstrap logic with 57% overall code reduction in linting services.
  - **New**: Enhanced message formatter (`message-formatter.ts`) provides intelligent color coding based on message structure and content type.

### Documentation index

- Guides

  - `docs/guides/architecture.md`
  - `docs/guides/how-it-all-works.md`
  - `docs/guides/element-role-identification-feature.md`
  - `docs/guides/unified-plan.md`
  - `docs/guides/product-technical-plan.md`
  - `docs/guides/user-stories.md`

- Module READMEs

  - Linter (feature overview): `src/features/linter/README.md`
  - **Linter services**: `src/features/linter/services/README.md` ✨ _Updated with context service architecture_
  - **Shared UI components**: `src/shared/ui/README.md` ✨ _New documentation for enhanced Badge component and color coding_
  - **Linter library functions**: `src/features/linter/lib/README.md` ✨ _New documentation for enhanced message formatter and color coding system_
  - Linter grammar adapters: `src/features/linter/grammar/README.md`
  - Linter role resolvers: `src/features/linter/roles/README.md`
  - Linter store: `src/features/linter/store/README.md`
  - Presets: `src/presets/README.md`
  - Element types: `src/entities/element/model/element.types.ts`
  - Style service: `src/entities/style/model/README.md`

- ADRs (Architecture Decision Records)

  - Folder: `docs/adrs/`
  - Template: `docs/adrs/template.md`
  - Create a new ADR
    1. Copy the template to a new file in `docs/adrs/` using the next sequential number and a short kebab‑case title, for example: `adr-020-short-title.md`.
    2. Fill the sections from the template:
       - Title
       - Status (e.g., Proposed, Accepted, Superseded)
       - Context (problem and constraints)
       - Decision (what and why)
       - Consequences (tradeoffs, follow‑ups)
    3. Commit the ADR with the code changes that implement the decision where possible.
    4. Do not modify existing ADRs; add a new one and link with “Supersedes”/“Superseded by” when changing a decision.

- RFCs (Requests for Comments)
  - Folder: `docs/rfcs/`
  - Template: `docs/rfcs/template.md`
  - Create a new RFC
    1. Copy `docs/rfcs/template.md` into `docs/rfcs/` with a descriptive filename (kebab‑case), e.g., `improve-lint-performance.md`.
    2. Fill the sections from the template:
       - Summary
       - Motivation
       - Detailed Design
       - Drawbacks
       - Alternatives
       - Adoption Strategy
    3. Open a PR with the RFC for review before implementation.

### Testing

- Run tests:
  ```bash
  pnpm exec vitest
  ```
- Unit, parity, and snapshot tests: `src/features/linter/services/__tests__/`
- Style service tests: `src/entities/style/model/__tests__/`

### Project structure

```
src/
  app/
  entities/
    element/model/
    style/model/
  features/
    linter/
      model/ services/ grammar/ roles/ store/ view/
      ui/
        controls/
        violations/
        panel/
      lib/
    window/
  lib/
  presets/
  processes/scan/
  rules/
  shared/
    ui/
    utils/
styles/
docs/
```
