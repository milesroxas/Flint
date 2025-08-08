# ADR-010: Relocate linter libs to target slice

## Context

Per the target FSD layout, non-domain UI helpers and formatters should live under `features/linter/lib`.

## Decision

- Moved:
  - `message-parser.ts` → `src/features/linter/lib/message-parser.ts`
  - `severity-styles.ts` → `src/features/linter/lib/severity-styles.ts`
- Updated consumers (`ViolationItem.tsx`) to import from the new locations.

## Consequences

- No behavior changes; imports updated only.

## Validation

- Linter clean; dev build previously green.

## Next Step

Remove transitional shims when no longer referenced and continue preset/preset-selector work.
