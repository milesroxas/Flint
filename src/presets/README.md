## Presets

Presets declare the rule set and connect grammar and role resolvers used for role identification. Presets can also supply element-context classifier configuration.

- `lumos.preset.ts`
  - `id: "lumos"`
  - `grammar: lumosGrammar`
  - `roles: lumosRoles`
  - `rules: Rule[]` including naming, property, and context‑aware rules
- `client-first.preset.ts`
  - `id: "client-first"`
  - `grammar: clientFirstGrammar`
  - `roles: clientFirstRoles`
  - `rules: Rule[]` focused on Client‑first naming and structure
  - `contextConfig` (optional): supplies `wrapSuffix`, `parentClassPatterns`, and child-group tokenization/validation settings

Initialization

- The active preset is set via `ensureLinterInitialized(mode, preset)` in `linter.factory.ts` and drives grammar/role selection at runtime. Services instantiate the element-context classifier with the active preset’s `contextConfig`.
