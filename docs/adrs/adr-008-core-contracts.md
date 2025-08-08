# ADR-008: Introduce core contracts (types-only scaffold)

## Context

Per `docs/guides/unified-plan.md` §5, define stable contracts (GrammarAdapter, RoleResolver, Preset, ProjectConfig) to decouple rule packaging and future presets, while avoiding runtime change during migration.

## Decision

- Added `src/features/linter/model/linter.types.ts` containing:
  - `ClassKind`, `ElementRole`, `ParsedClass`, `GrammarAdapter`, `RoleResolver`
  - `Preset`, `ProjectConfig`
- Kept types broad to avoid forcing refactors; no runtime logic wired yet.

## Consequences

- No behavior changes.
- Provides a foundation for future preset expansion and opinion modes.

## Validation

- Linter clean.

## Next Step

Align naming for store files and finish relocating remaining services into their target slices (per guides), then add Client‑First preset scaffolding.
