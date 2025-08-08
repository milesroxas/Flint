# ADR-002: Unified registry bootstrap for page and element parity

## Context

`unified-plan.md` calls out a parity gap: the element flow initialized default + context-aware rules, while the page flow only registered default rules. This created inconsistent findings between scanning a selected element vs the entire page.

## Decision

- Introduced a single bootstrap at `src/features/linter/model/linter.factory.ts`:
  - `ensureLinterInitialized()` initializes rule registry once by delegating to `features/linter/services/registry` which registers default + context-aware rules and merges persisted configuration from `localStorage`.
  - `getRuleRegistry()` exposes the shared registry instance.
- Updated flows to use the shared bootstrap:
  - `element-lint-service.ts` now calls `ensureLinterInitialized()` and constructs the rule runner with `getRuleRegistry()`.
  - `usePageLintStore.ts` calls `ensureLinterInitialized()` once and constructs its rule runner with `getRuleRegistry()`.

## Consequences

- Both page and element scans now operate against the exact same registry and configuration, eliminating parity gaps.
- Registry initialization is idempotent and centralized, simplifying future preset wiring.

## Validation

- Touched files compile with no linter errors.
- Element and page scans now share rule registration code paths.

## Next Step

Proceed to relocate stable services to their FSD destinations without logic changes (ADR-003), then introduce scan processes (ADR-004).
