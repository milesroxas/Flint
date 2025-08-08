# ADR-009: Naming alignment (stores) and relocation follow-ups

## Context

Per `docs/guides/unified-plan.md` Phase 1 and naming standards 2025, stores should be `camelCase` with `.store.ts` suffix and services should live in their target slices. This step begins alignment with minimal risk.

## Decision

- Added `src/features/linter/store/pageLint.store.ts` that re-exports `usePageLintStore` to align naming while keeping the original file for now.
- Updated imports in `usePageLint.ts` and `PageLintSection.tsx` to use `pageLint.store.ts`.
- Deferred relocation of remaining services (e.g., `message-parser.ts`, `severity-styles.ts`) to a later incremental step.

## Consequences

- No behavior changes; only import paths updated.
- Provides a transition path to remove `usePageLintStore.ts` once all imports are migrated.

## Validation

- Linter clean on touched files.

## Next Step

Complete service relocations to target slices and remove the re-export shim after updating all imports.
