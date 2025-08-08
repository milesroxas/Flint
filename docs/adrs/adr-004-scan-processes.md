# ADR-004: Introduce scan processes as orchestration points

## Context

Per `docs/guides/unified-plan.md` Phase 1, centralize element/page scan orchestration to:

- Ensure both flows share the same bootstrap and service setup
- Create clear seams for integration tests and future preset-driven configuration

## Decision

- Added process modules:
  - `src/processes/scan/scan-selected-element.ts`
  - `src/processes/scan/scan-current-page.ts`
- Updated consumers to use the processes:
  - `useElementLint.ts` uses `scanSelectedElement`
  - `usePageLintStore.ts` uses `scanCurrentPage`
- `scanCurrentPage` builds property maps once per scan to support duplicate-property rules.

## Consequences

- No user-visible behavior changes; orchestration is centralized.
- Easier parity testing and future migration to presets/config.

## Validation

- Linter clean on touched files.
- Both page and element flows run through the new processes successfully.

## Next Step

Split rules into category folders and prepare preset structure (ADR-005/ADR-006).
