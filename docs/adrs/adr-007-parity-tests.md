# ADR-007: Parity tests for Lumos preset

## Context

We need confidence that migrating to a preset-based registry preserves behavior. Parity tests compare the legacy (default + context-aware) aggregation against the new `lumos.preset.ts` rule pack.

## Decision

- Added tests:
  - `src/features/linter/services/__tests__/lumos.preset.parity.test.ts` ensures rule IDs match between legacy aggregation and preset.
  - `src/features/linter/services/__tests__/rule.messages.snapshot.test.ts` records a stable snapshot of rule ids and names to detect unintended changes.

## Consequences

- Any accidental rule ID/name change will surface in CI via snapshot diffs.
- Provides a baseline while we continue refactors.

## Validation

- Test suite passes locally.

## Next Step

Add more integration tests around scan processes to validate end-to-end outputs under mocked Designer data (ADR‑009).
