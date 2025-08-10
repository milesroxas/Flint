# Role Identification via GrammarAdapter and RoleResolver

## Status

Accepted — 2025-08-10

## Context

- The linter previously exposed only `componentRoot` context via `element-context-classifier.ts`.
- The codebase defined contracts for roles (`ElementRole`) and parsing (`ParsedClass`, `GrammarAdapter`, `RoleResolver`) but lacked runtime implementations and wiring.
- We need robust, preset-driven role identification that is type-safe, composable, and performant, without duplicating logic across rules.

## Decision

- Introduce preset-bound grammar and role resolver components:
  - `src/features/linter/grammar/*.grammar.ts` implement `GrammarAdapter` per preset (Lumos, Client-first).
  - `src/features/linter/roles/*.roles.ts` implement `RoleResolver` per preset.
- Extend presets to include grammar and roles:
  - `src/presets/lumos.preset.ts` and `src/presets/client-first.preset.ts` export `{ id, rules, grammar, roles }`.
- Compute roles in `element-lint-service.ts` by:
  - Selecting the active preset’s grammar/resolver.
  - Parsing the first custom class on the element (skip `u-`, `is-`, `c-`).
  - Mapping the parsed class to an `ElementRole`.
  - Reconciling `wrap` with DOM context: if `wrap` token is present but the element isn’t classified as a root by the context classifier, treat it as `childGroup`.
- Expose `roles` to the UI through `scanSelectedElementWithMeta` and `useElementLint`.
- Stamp `metadata.role` on violations in both element and page lint services so role badges can be rendered per violation item.

## Consequences

- Clear separation of concerns: presets own parsing and role semantics; the service orchestrates and caches.
- Minimal impact on existing rules and runner; rules can opt-in to role-sensitive behavior later without architecture changes.
- Performance remains aligned with existing flows: role computation is O(1) per element (first custom class) and reuses cached context maps.
- Documentation updated in root and linter READMEs; directory READMEs added for grammar, roles, presets, services, and entities.

## Alternatives Considered

- Embedding role heuristics directly in rules or the runner: rejected due to duplication and tight coupling.
- Inferring roles from UI heuristics only: rejected due to preset variance and lack of type guarantees.

## Follow-ups

- Add role-aware rules as needed (e.g., role-scoped naming/structure checks).
- Optional: feature‑flag custom role aliasing in project configuration.
