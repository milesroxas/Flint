## ADR-016: Move Element Context Configuration into Presets and Use Grammar for Class Kind Resolution

Date: 2025-08-11

### Status

Accepted

### Context

The linter classifies elements into contexts (e.g., `componentRoot`, `childGroup`) via `createElementContextClassifier`. Prior to this change, the classifier shipped framework-specific defaults (`wrapSuffix`, `parentClassPatterns`) and was instantiated without overrides in `element-lint-service`. Additionally, class kind detection (custom/utility/combo) relied on hard-coded prefixes (`u-`, `is-`) in services and the rule runner, despite grammars defining these concerns.

This leaked framework assumptions outside of presets, making the system less adaptable to other naming frameworks.

### Decision

1. Preset-driven context configuration

- Extend `Preset` with an optional `contextConfig?: Partial<ElementContextConfig>`.
- Populate `contextConfig` in `lumos.preset.ts` and `client-first.preset.ts` with values equivalent to the prior defaults.
- Update `element-lint-service` and `page-lint-service` to instantiate the classifier with the active preset’s `contextConfig`.

2. Grammar-driven class kind resolution

- Update `createRuleRunner` to accept an optional `classKindResolver` to determine `ClassType` based on the active grammar.
- Update `element-lint-service` to pass a resolver derived from the active preset’s grammar.
- Update `page-lint-service` role computation to use grammar-kind checks instead of hard-coded prefix checks.

3. Configurable child-group logic

- Add `groupNamePattern` and `childGroupPrefixJoiner` to `ElementContextConfig` and wire them into the classifier so the child-group suffix validation is configurable.
- Respect existing `typePrefixSeparator` and `typePrefixSegmentIndex` to compute the type prefix used for child-group matching.

### Consequences

- Framework assumptions are encapsulated within presets; switching presets now switches classifier behavior without code edits.
- Class type determination for rules and ordering relies on the active grammar, aligning with preset expectations.
- Child-group detection is more flexible across frameworks that vary token separators or group naming.

### Alternatives considered

- Keep defaults in the classifier and override selectively in services. Rejected because it risks drift and hidden coupling.
- Push all logic into rules. Rejected because context classification is cross-cutting and best centralized.

### Migration

- No user action required. Existing presets have been seeded with `contextConfig` matching prior behavior.
- Custom presets can provide `contextConfig` to tailor wrapper suffix, container patterns, and child-group tokenization/validation.

### Affected files

- `src/features/linter/model/linter.types.ts`: add `Preset.contextConfig`.
- `src/entities/element/model/element-context.types.ts`: add `groupNamePattern`, `childGroupPrefixJoiner`.
- `src/entities/element/model/element-context-classifier.ts`: consume new fields and remove hard-coded checks.
- `src/presets/lumos.preset.ts`, `src/presets/client-first.preset.ts`: supply `contextConfig`.
- `src/features/linter/services/element-lint-service.ts`: wire preset `contextConfig`; pass grammar-based resolver to rule runner; use grammar for role custom-kind detection.
- `src/features/linter/services/page-lint-service.ts`: wire preset `contextConfig`; use grammar for custom-kind detection.
- `src/features/linter/services/rule-runner.ts`: accept optional `classKindResolver` with safe fallback.
