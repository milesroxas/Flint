# ADR-003: Relocate stable services to FSD slices (no logic changes)

## Context

Per `docs/guides/unified-plan.md` (Phase 1), stable services are to be moved into their Feature‑Sliced Design destinations without altering behavior. This clarifies ownership boundaries and reduces future migration risk.

## Decision

- Moved style service to entity slice:
  - `src/entities/style/model/style.service.ts` (new home)
  - Left a thin re-export shim at `src/features/linter/services/style-service.ts` for backwards imports during the transition.
- Moved element context classifier to entity slice:
  - `src/entities/element/model/element-context-classifier.ts` (new home)
- Updated imports across linter services/components to use the new entity paths via the `@/*` alias.

## Consequences

- No runtime behavior changes.
- Clearer ownership:
  - Style domain under `entities/style`
  - Element context under `entities/element`
- The shim can be safely removed once all imports point only to the entity paths.

## Validation

- TypeScript/linter clean on all touched files.
- Existing flows (element and page scans) continue to function with updated imports.

## Next Step

Introduce scan process orchestrators and route hooks/store through them (see ADR‑004):

- `src/processes/scan/scan-selected-element.ts`
- `src/processes/scan/scan-current-page.ts`
