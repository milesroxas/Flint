# ADR-005: Split rules into category folders (behavior preserved)

## Context

Per `docs/guides/unified-plan.md` Phase 1, rules should be split into category folders to align with the target FSD architecture and prepare for preset packaging. This step must preserve behavior and rule IDs/messages to maintain parity.

## Decision

- Created rule category folders under `src/rules/`:
  - `src/rules/naming/*`
  - `src/rules/property/*`
  - `src/rules/context-aware/*`
- Moved existing rule logic into dedicated files while keeping IDs and messages identical.
- Updated aggregators to import from the new locations:
  - `src/features/linter/rules/default-rules.ts`
  - `src/features/linter/rules/context-aware-rules.ts`
- No logic changes were made; only file organization and import paths.

## Consequences

- No user-visible changes; outputs remain the same.
- Rules are now modular and easier to compose into presets (next step).
- Clearer ownership and easier unit testing per rule.

## Validation

- TypeScript/linter clean on all touched files.
- Rule IDs and messages unchanged; parity maintained.

## Next Step

Introduce `presets/lumos.preset.ts` and wire the registry to load it, maintaining behavior parity (ADR‑006).
