# ADR-020: Dynamic Preset Discovery and Removal of Hardcoded Preset IDs

## Status

Accepted

## Context

Earlier implementations assumed a fixed set of presets (e.g., `lumos`, `client-first`). This required hardcoding preset IDs in multiple places (UI switcher, registry bootstrap, and services), increasing friction and risk whenever a new preset was added. The new preset creation guide targets a streamlined developer experience and scalability.

## Decision

Adopt a dynamic preset registry that auto-discovers all presets at build time and removes hardcoded preset IDs from the app.

- Add `src/presets/index.ts` to auto-discover all `*.preset.ts` files via `import.meta.glob` (eager):
  - Expose `getPresetIds()`, `getAllPresets()`, `getPresetById()`, `getDefaultPresetId()`, and `resolvePresetOrFallback()`.
- Update registry bootstrap to resolve presets dynamically:
  - `initializeRuleRegistry(mode, presetId?)` resolves the active preset via the registry and registers its `rules`; applies opinion mode and merges persisted configuration.
- Update linter factory:
  - Preset is now `string` (not a union); default preset comes from `getDefaultPresetId()`.
  - Expose `getAvailablePresetIds()` for UI.
- Update the UI preset switcher:
  - List available presets dynamically from `getAvailablePresetIds()`.
  - Switch presets by calling `ensureLinterInitialized(mode, presetId)`; clear results and reset style cache.
- Update services to resolve grammar/roles/contextConfig from the active preset:
  - `element-lint-service.ts`, `page-lint-service.ts` use `resolvePresetOrFallback(getCurrentPreset())` and fall back to Lumos grammar/roles when omitted.

This ADR supersedes the hardcoded-preset aspects implied by ADR‑006 and ADR‑002, without changing their core outcomes.

## Consequences

- Adding a new preset is zero-touch beyond creating `*.preset.ts` that exports a `Preset`.
- UI automatically lists new presets; no code edits required for discovery.
- Stronger type safety: centralized preset resolution functions and explicit fallbacks.
- Clear error on empty registry (no presets): `getDefaultPresetId()` throws with actionable guidance.

## Alternatives Considered

- Keep hardcoded unions and update switch statements per preset: rejected due to scaling and maintenance overhead.
- Runtime import by naming convention only: rejected; eager discovery with explicit type guards is simpler and safer for the extension environment.

## Migration

- Remove hardcoded preset unions and switch statements from factory, registry, and UI.
- Introduce `src/presets/index.ts` and route all preset resolution through it.
- Ensure services pick grammar/roles/contextConfig from the resolved preset with stable Lumos fallback.

## Validation

- TypeScript build succeeds; ESLint passes with no warnings.
- Preset switching works at runtime; UI lists preset IDs discovered from the registry.
- Lint results remain stable for existing presets; new presets can be added without touching core code.
