# ADR-024: Broader combo detection heuristics and variant base requirement in runner; classifier emits childGroupInvalid

## Status

Accepted — 2025-08-13

## Context

- ADR-015 aligned combo detection with Webflow’s API (`style.isComboClass()`) and kept `is-` as the heuristic fallback. In practice, variant-like classes also appear as `is_*` and `isCamelCase`.
- ADR-013 introduced element-level ordering checks and a combo count limit, but did not specify a rule requiring variants to modify an existing base custom/component class.
- ADR-016 moved context configuration into presets and added child-group validation knobs, but did not explicitly document the new emitted `childGroupInvalid` context value.

## Decision

1. Combo detection heuristics broadened

- Treat variant-like names as combos when they match any of:
  - `is-*` (dash), `is_*` (underscore), or `is[A-Z]` (camelCase)
- Apply this uniformly in:
  - Grammar (Lumos): classify such names as `combo`
  - Style IO: when API is unavailable, set `StyleInfo.isCombo = true` and `detectionSource = "heuristic"`
  - Runner: prefer `combo` when the heuristic indicates variant-like even if a resolver returns otherwise
- Continue to prefer Webflow `style.isComboClass()`; stamp `metadata.detectionSource` on results when available for transparency.

2. Variant requires base custom/component

- Add an element-level check in the runner: the first variant on an element must follow a base non-utility class (custom or component). Emit violation `lumos-variant-requires-base` when a variant precedes any base.

3. Classifier emits `childGroupInvalid`

- When a nested wrap under a root fails shared type-prefix or group-name pattern validation, emit `childGroupInvalid` instead of `childGroup`.

## Consequences

- Variant-like combos are detected more accurately across naming styles even without API support, while still preferring official API signals when present.
- The runner reports misuse of variants applied without a base, improving correctness for Lumos-style composition.
- The UI can distinguish valid vs invalid child groups using the new context value, aiding rules and labeling.

## Affected files

- `src/features/linter/grammar/lumos.grammar.ts` (combo-like regex)
- `src/entities/style/model/style.service.ts` (API-first combo detection; heuristic fallback, detectionSource)
- `src/features/linter/services/rule-runner.ts` (combo-like helper; variant-requires-base; detectionSource in metadata)
- `src/entities/element/model/element-context-classifier.ts` (emits `childGroupInvalid`)

## Related ADRs

- Extends ADR-015 (combo detection alignment) and ADR-016 (context classifier configuration)
- Complements ADR-013 (ordering and combo limit) with the variant-base requirement

## Validation

- Build and tests pass.
- Manual verification confirms:
  - `is_*` and `isCamelCase` names are treated as combos when API is unavailable.
  - `lumos-variant-requires-base` fires when a variant appears before any base custom/component class.
  - Classifier returns `childGroupInvalid` for improperly named child wraps under a root.
