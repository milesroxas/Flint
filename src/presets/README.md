## Presets

Presets declare the rule set and connect grammar and role resolvers used for role identification. Presets can also supply element-context classifier configuration.

- `*.preset.ts`
  - `id: string`
  - `grammar?: GrammarAdapter`
  - `roles?: RoleResolver`
  - `rules: Rule[]` including naming, property, and context‑aware rules
  - `contextConfig?`: `Partial<ElementContextConfig>` for the classifier

Dynamic discovery

- All presets under `src/presets/*.preset.ts` are auto‑discovered at build time via `src/presets/index.ts`. The UI switcher lists available preset IDs dynamically.

Initialization

- Call `ensureLinterInitialized(mode, presetId?)` from `src/features/linter/model/linter.factory.ts`. Under the hood, `initializeRuleRegistry(mode, presetId)` resolves the preset from the dynamic registry, registers its rules, applies opinion mode, and merges persisted configuration. Services resolve `grammar`, `roles`, and `contextConfig` from the active preset (falling back to Lumos grammar/roles if omitted).
