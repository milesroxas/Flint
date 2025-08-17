## Presets

Presets declare the rule set and connect grammar and role resolvers used for role identification.

- `*.preset.ts`
  - `id: string`
  - `grammar?: GrammarAdapter`
  - `roles?: RoleResolver`
  - `rules: Rule[]` including naming, property, and role‑aware rules

Dynamic discovery

- All presets under `src/presets/*.preset.ts` are auto‑discovered at build time via `src/presets/index.ts`. The UI switcher lists available preset IDs dynamically.

Initialization

- Call `ensureLinterInitialized(mode, presetId?)` from `src/features/linter/model/linter.factory.ts`. Under the hood, `initializeRuleRegistry(mode, presetId)` resolves the preset from the dynamic registry, registers its rules, applies opinion mode, and merges persisted configuration. Services resolve `grammar` and `roles` from the active preset (falling back to Lumos grammar/roles if omitted).
