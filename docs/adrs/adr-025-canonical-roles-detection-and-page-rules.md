# ADR-025: Canonical Roles, Detection Layer, Runner Extensions, and Page Rules

## Status

Accepted — 2025-08-16

## Context

The linter previously mixed preset-specific naming logic with structural validation. Role semantics leaked into rules via ad‑hoc parsing and resolvers, and we had no clean way to run page‑scope assertions (e.g., main singleton). We also lacked a unified element graph abstraction and a clear separation between detection (mapping elements → roles) and validation (rules consuming roles + graph). This created technical debt, reduced testability, and made multi‑preset support brittle.

## Decision

Adopt a canonical, preset‑agnostic ontology of roles and introduce a preset‑aware detection layer. Extend the runner to pass roles and element‑graph helpers to rules. Create a page rule runner for page‑scope assertions. Remove deprecated role resolver code and legacy per‑element role stamping.

## Details

### Canonical roles (Type system)

- `ElementRole` now includes: `main | section | componentRoot | childGroup | unknown`.
- Staged/reserved roles (type‑only, not enforced yet): `container | layout | content`.
- New types:
  - `RoleDetector` → scored, preset‑aware detectors
  - `RolesByElement = Record<string, ElementRole>`
  - `RoleDetectionConfig = { threshold: number }`

### Detection layer

- New service: `src/features/linter/services/role-detection.service.ts`
  - Factory `createRoleDetectionService({ grammar, detectors, config })`
  - `detectRolesForPage(elementsWithClassNames)` returns `RolesByElement`
  - Applies thresholding and enforces `main` singleton (highest score wins; others demoted to `unknown`).
- Presets supply detectors:
  - `src/features/linter/detectors/lumos.detectors.ts`
  - `src/features/linter/detectors/client-first.detectors.ts`
  - `src/presets/*.preset.ts` export `roleDetectors` and `roleDetectionConfig`

### Runner extensions

- `src/features/linter/services/rule-runner.ts`
  - `runRulesOnStylesWithContext(..., rolesByElement?, getParentId?, getChildrenIds?, getAncestorIds?, parseClass?)`
  - Passes new helpers to `analyzeElement` args:
    - `rolesByElement`, `getRoleForElement`
    - `getParentId`, `getChildrenIds`, `getAncestorIds`
    - `getClassNamesForElement`, `parseClass`
  - Attaches `metadata.elementId`, `metadata.role`, and `metadata.parentId` to violations.

### Element graph and page rules

- New graph service: `src/features/linter/services/element-graph.service.ts`
  - Exposes `getParentId`, `getChildrenIds`, `getAncestorIds` built from the page parent map.
- New page rule runner: `src/features/linter/services/page-rule-runner.ts`
  - Executes page‑scope rules with `{ rolesByElement, getParentId, getChildrenIds }`.

### Canonical rules

- Page‑scope:
  - `main-singleton.page.ts`: Exactly one `main` per page
  - `main-children.page.ts`: `main` must contain at least one `section` or `componentRoot`
- Element‑scope:
  - `section-parent-is-main.ts`: `section` must be a direct child of `main`
  - `component-root-structure.ts`: `componentRoot` is under `section` and contains `layout`/`content`/`childGroup`
  - `child-group-key-match.ts`: `childGroup` shares component key with nearest `componentRoot` (derived via `parseClass`)

### Services integration

- `page-lint-service.ts`
  - Computes sorted‑ID page signature; detects roles once per page; builds parent map and graph; runs page rules then element rules; merges results.
- `element-lint-service.ts`
  - Reuses cached page signature, contexts, and `rolesByElement`. No ad‑hoc role computation; passes roles to the runner.

### Presets

- `lumos.preset.ts`
  - Provides `roleDetectors` and `roleDetectionConfig` (default threshold 0.6)
  - Registers the canonical element rules (page rules are executed in page service)
- `client-first.preset.ts`
  - Provides `roleDetectors` and `roleDetectionConfig`; canonical rules can be registered analogously.

### UI

- No UI API changes required. `ViolationHeader` renders `metadata.role` as a badge; the runner now stamps roles, so canonical roles appear in the panel automatically.

## Consequences

- Separation of concerns: detectors classify; rules validate structure on canonical roles.
- Determinism and performance: O(n) detection and graph build; budgets preserved.
- Simpler testability: detectors and rules can be unit‑tested with synthetic trees and class names.
- Migration cost: role resolver files removed; presets adopt detectors; minor runner signature extensions.

## Alternatives considered

- Keep `RoleResolver` + ad‑hoc parsing inside rules: rejected due to coupling, duplication, and poor testability.
- Compute roles per element during rule execution: rejected; repeated work and inconsistent results.

## Migration

- Removed deprecated files:
  - `src/features/linter/roles/lumos.roles.ts`
  - `src/features/linter/roles/client-first.roles.ts`
  - `src/rules/context-aware/roles/main-singleton.ts` (placeholder)
- Removed per‑element role stamping and legacy helpers from services.
- Updated presets to detector-based roles; `roles` resolver removed.
- Ensured imports and registry initialization reflect new wiring.

## Rollout

1. Ship detectors, runner changes, graph, and canonical rules (behind development if desired).
2. Validate parity and performance on curated pages (Lumos first, then Client‑First).
3. Enable canonical path by default once parity and budgets hold.

## Performance & Reliability

- Detection, graph creation, and page rules are linear in number of elements.
- Page signature uses sorted element IDs to avoid stale caches.
- Threshold‑based detection with singleton enforcement yields stable classifications.

## Security

- No new external IO or network. All logic runs within Designer extension APIs.

## References

- PRD: `docs/guides/prd-canonical-roles.md`
- Implementation Guide: `docs/guides/implementation-guide-canonical-roles.md`
- Feedback Notes: `docs/guides/implementation-feedback-notes.md`
