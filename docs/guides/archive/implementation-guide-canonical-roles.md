## Implementation Guide: Canonical Roles, Detection Layer, and Role‑Driven Rules

This guide describes the minimal, strictly typed implementation to deliver the PRD: Canonical Roles, Detection Layer, and Role‑Driven Rules. It emphasizes zero technical debt, no redundant code, and no unused files. Follow steps in order. Do not add features beyond the PRD.

---

## Principles

- **Strict typing**: No `any` in public APIs; exhaustive unions; defensive guards.
- **Separation of concerns**: Detectors map elements → roles; rules validate structure; presets configure detectors and grammar.
- **Minimal change**: Reuse existing services, caches, and bootstrap paths; extend where needed.
- **Performance budgets**: Page ≤ 250 ms for ~500 elements; Element ≤ 80 ms.
- **Determinism**: Stable results given same DOM/styles.
- **No legacy carryover**: Remove deprecated and unused code at the end.

---

## Milestones and Steps

### 1) Types and Scaffolding

- Edit `src/features/linter/model/linter.types.ts`:
  - Ensure `ElementRole` includes: `main | section | componentRoot | childGroup | unknown`.
  - Stage (type‑only) roles: `container | layout | content` (reserved, not used yet).
  - Add types:
    - `RoleScore = { elementId: string; role: ElementRole; score: number }`
    - `RolesByElement = Record<string, ElementRole>`
    - `RoleDetector = (input: { element: WebflowElement; classNames: string[]; parsedFirstCustom?: ParsedClass; ancestry: string[]; }) => RoleScore | null`
    - `RoleDetectionConfig = { threshold: number }`

### 2) Detection Layer Service

- Add `src/features/linter/services/role-detection.service.ts` (factory function):
  - `createRoleDetectionService({ grammar, detectors, config })`
  - `detectRolesForPage(elements: ElementWithClassNames[]): RolesByElement`
  - Behavior:
    - Parse the first custom class per element using `grammar`.
    - Run all `detectors`; collect `RoleScore`s; select highest score per element above `threshold`.
    - Enforce singleton `main`: keep highest‑scoring candidate; demote others to `unknown`.
    - Return a role for every element id (`unknown` below threshold).
  - Defensive error handling; strict types only.

### 3) Preset Wiring (No Feature Changes)

- Extend `Preset` in `linter.types.ts` with optional:
  - `roleDetectors?: RoleDetector[]`
  - `roleDetectionConfig?: RoleDetectionConfig`
- Update `src/presets/lumos.preset.ts` and `src/presets/client-first.preset.ts`:
  - Provide minimal detector arrays for `main`, `section`, `componentRoot`, `childGroup` following the PRD/alignment doc signals.
  - Set `roleDetectionConfig.threshold = 0.6`.
  - Keep existing grammar adapters as‑is; do not duplicate grammar logic in detectors.

### 4) Rule Runner Extension (Non‑Breaking)

- Edit `src/features/linter/services/rule-runner.ts`:
  - Extend `runRulesOnStylesWithContext` to accept optional `rolesByElement?: RolesByElement` and optional element graph helpers.
  - Provide helper callbacks in the rule execution context:
    - `getRoleForElement(elementId): ElementRole` (defaults to `unknown`).
    - `getParentId(elementId): string | null` (injected from services; optional).
  - Do not change existing rule semantics; only add optional accessors for new rules.

### 5) Structural Rules (Exactly Four)

- Create `src/rules/context-aware/roles/` and add:
  1. `main-singleton.ts`: page‑scope check; flag duplicates and absence.
  2. `main-children.ts`: `main` must contain at least one `section` or `componentRoot` child.
  3. `section-parent.ts`: `section` must be a direct child of `main`; must not be under a `componentRoot`.
  4. `component-root-structure.ts`: `componentRoot` must be under a `section` and contain `layout` or `content` or `childGroup` descendant (treat presence of `childGroup` as sufficient until `layout/content` are staged in).
  5. `child-group-key-match.ts`: `childGroup` must share `componentKey` with nearest `componentRoot` ancestor (derive `componentKey` via grammar tokens).
- Register these rules in the relevant presets’ `rules` arrays. Do not add any other new rules.

### 6) Services Integration and Shared Bootstrap

- Edit `src/features/linter/services/page-lint-service.ts`:

  - Compute a stable page signature using sorted element IDs (not just count).
  - Build `elementsWithClassNames` once (already present) and a reusable parent/children map.
  - Instantiate `roleDetectionService` with active preset `grammar`, `roleDetectors`, and `roleDetectionConfig`.
  - Compute and cache `rolesByElement` per page signature.
  - Call `ruleRunner.runRulesOnStylesWithContext(allAppliedStyles, elementContexts, allStyles, rolesByElement)`.
  - Set UI metadata role from `rolesByElement` instead of re‑parsing per element.

- Edit `src/features/linter/services/element-lint-service.ts`:
  - Reuse cached page signature, element contexts, and `rolesByElement` when unchanged.
  - For single‑element scans, pass cached `rolesByElement` to the runner.

### 7) Element Graph Helpers

- In page/element services, build and cache:
  - `ParentMap = Record<string, string | null>`
  - `ChildrenMap = Record<string, string[]>`
- Provide accessors to the runner/rules via optional parameters.

### 8) Tests and Parity

- Detectors (per preset): `src/features/linter/services/__tests__/roles/`
  - For each role: Positive, Negative, Conflict.
- Cross‑role tests:
  - `componentRoot` outside `section` rejected.
  - `childGroup` key mismatch rejected.
  - `main` singleton enforcement with multiple candidates.
- Runner integration:
  - Page vs Element parity snapshots on curated Lumos and Client‑First fixtures.
- Performance harness:
  - Benchmarks for 100/250/500 elements; assert budgets.

### 9) Documentation

- Update `docs/guides/how-it-all-works.md` and `docs/guides/alignment-doc.md` with:
  - Canonical roles, detection layer, runner roles API, structural rules, preset extension points.
- Add a short ADR for the detection layer and runner roles API (do not modify existing accepted ADRs).

### 10) Logging and Error Handling

- Gate structured logs behind `DEBUG` and development checks; avoid noisy logs in production bundles.
- Use narrow `catch` blocks with safe fallbacks to `unknown` role; do not suppress rule outcomes.

---

## Cleanup: Removal of Deprecated/Unused/Legacy Code

Remove these after the new path is wired and tests are green:

- `src/features/linter/services/element-lint-service.ts`

  - Remove `computeElementRoles` and any ad‑hoc role parsing.
  - Remove metadata stamping that re‑parses classes for role inference; use `rolesByElement` instead.

- `src/features/linter/services/page-lint-service.ts`

  - Remove `computeElementRoleForList` and related role stamping logic; use `rolesByElement`.

- Preset role resolver overlap

  - If `src/features/linter/roles/*.roles.ts` are only used for `mapToRole(parsed)` and become redundant, delete them and their imports.
  - Remove `roles` from preset exports if detectors fully replace role resolvers.

- Legacy docs

  - Keep `docs/guides/archive/` as the canonical place for legacy docs. Ensure deleted top‑level guides remain archived and not referenced by new docs.

- Dead code and drift
  - Remove unused exports, unreferenced helpers, and vestigial constants related to the old role resolver path.
  - Re‑run type checking to ensure no stale imports remain.

Run a final sweep:

- Type and lint: `pnpm run typecheck && pnpm run lint`
- Tests: `pnpm run test`
- Optional perf/bench: `pnpm run bench`

All should pass with no linter warnings introduced by new code.

---

## Acceptance Checklist (Map to PRD)

- **Ontology**: Canonical roles typed; staged roles reserved.
- **Detection**: `detectRolesForPage` returns role per element; `main` singleton enforced; detectors use tag/class/ancestry signals.
- **Runner**: Accepts `rolesByElement`; rules can query `getRoleForElement`.
- **Rules**: Four structural rules implemented as specified.
- **Performance**: Budgets met on local benchmarks.
- **Parity**: Element vs Page parity snapshots match.
- **Caching**: Page signature uses sorted element IDs; caches invalidate when IDs change.
- **Type Safety**: No `any` in public signatures; strict mode clean.
- **Docs**: Guides updated; ADR added for detection layer and runner roles API.

---

## Rollout and Removal

1. Land detectors, runner extension, services integration, and new rules behind a development flag (if needed).
2. Run parity and perf checks; fix regressions.
3. Remove deprecated functions and legacy role resolver files.
4. Ship with the new path as default once parity holds.
