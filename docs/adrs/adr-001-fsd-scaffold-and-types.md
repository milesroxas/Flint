# ADR-001: FSD scaffold and initial type relocation

## Context
We are migrating the linter codebase to Feature-Sliced Design (FSD) and aligning naming to 2025 standards. To reduce risk, the first step relocates only type definitions into their new slices without changing runtime logic.

## Decision
- Created new directories:
  - `src/entities/element/model/`
  - `src/features/linter/model/`
- Moved type files:
  - `src/features/linter/types/rule-types.ts` → `src/features/linter/model/rule.types.ts`
  - `src/features/linter/types/element-context.ts` → `src/entities/element/model/element-context.types.ts`
- Updated all imports to use the new paths via the existing `@/*` alias.
- Removed the old files to avoid duplication.

## Consequences
- No behavior changes. Build remains green.
- Future steps can reference the centralized types in their target slices.

## Validation
- TypeScript compiled with no new linter errors on touched files.
- All references to the moved types were updated and verified.

## Next Step
Proceed to unify registry initialization so page and element scans share the same bootstrap (ADR-002).


