# ADR-006: Introduce Lumos preset and registry wiring

## Context

Per `docs/guides/unified-plan.md` Phase 2, rules should be packaged via presets to enable opinion modes and future multiple presets. For now, we introduce `lumos.preset.ts` and wire the registry to load it, preserving current behavior.

## Decision

- Added `src/presets/lumos.preset.ts` exporting `id` and `rules` (the previously split naming, property, and context-aware rules).
- Updated `features/linter/services/registry.ts` to register rules from the Lumos preset instead of direct module arrays.
- Persisted configuration merge behavior remains unchanged via `RuleConfigurationService`.

## Consequences

- No behavior change; rule set is equivalent to previous default + context-aware combination.
- Future presets (e.g., Client‑First) can be added without internal rewrites.

## Validation

- Linter clean on touched files.
- Registry logs confirm preset rule count on initialization.

## Next Step

Add parity tests for Lumos preset vs legacy outputs and prepare for additional presets/opinion modes (ADR‑007/ADR‑008).
