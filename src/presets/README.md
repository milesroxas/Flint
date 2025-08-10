## Presets

Presets declare the rule set and connect grammar and role resolvers used for role identification.

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

Initialization

- The active preset is set via `ensureLinterInitialized(mode, preset)` in `linter.factory.ts` and drives grammar/role selection at runtime
