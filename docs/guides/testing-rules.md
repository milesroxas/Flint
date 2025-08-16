## Testing Rules and Presets

This guide shows how to quickly test a single rule or an entire preset using the built-in Vitest template and helpers.

### Prerequisites

- Tests use Vitest and live under `src/features/linter/services/__tests__/`.
- Run tests:

```bash
pnpm exec vitest
```

### Quick start

1. Copy the template test:

- File: `src/features/linter/services/__tests__/rule.template.test.ts`
- Duplicate it next to other tests and unskip the `describe` block.

2. Replace the commented sections with your rule or preset imports and expectations.
3. Assign properties to any class you want considered in duplicate checks (utilities, combos, or customs). Classes with no properties are ignored as they have no unique values.

### Helper functions (from the template)

- `runRuleOnClasses(rule, classNames, options?)`:
  - Registers the rule in a fresh registry, builds utility maps, and runs the rule runner.
  - Returns `RuleResult[]` for easy assertions.
- `toAllStyles(classNames, propertiesByClass?)` and `toStylesWithElement(elementId, classNames, propertiesByClass?)`:
  - Build `StyleInfo[]` and `StyleWithElement[]` with sane defaults.
  - Any class can carry `properties` via `propertiesByClass` (not limited to `u-*`).
  - Classes with an empty property object are treated as having no unique properties and are ignored by duplicate analysis.
  - Variant-like combo names (`is-*`, `is_*`, `isCamelCase`) are auto-marked as combos.

### Naming rule: minimal check

```ts
// import { yourRule } from '@/rules/naming/your-rule';
// const results = runRuleOnClasses(yourRule, ['bad', 'good_custom-name']);
// expect(results.some(r => r.ruleId === yourRule.id)).toBe(true);
```

### Property rule: duplicate classes

```ts
// import { yourPropertyRule } from '@/rules/property/your-rule';
// const props = { 'u-red': { color: 'red' }, 'is-Red': { color: 'red' } };
// const results = runRuleOnClasses(yourPropertyRule, ['u-red', 'is-Red'], { propertiesByClass: props });
// expect(results.some(r => r.ruleId === yourPropertyRule.id)).toBe(true);
```

### Preset smoke test (optional)

```ts
// import { lumosPreset } from '@/presets/lumos.preset';
// const registry = createRuleRegistry();
// registry.registerRules(lumosPreset.rules);
// const analyzer = createUtilityClassAnalyzer();
// const runner = createRuleRunner(registry as any, analyzer);
// const allStyles = toAllStyles(['foo', 'is-active']);
// analyzer.buildPropertyMaps(allStyles);
// const results = runner.runRulesOnStylesWithContext(
//   toStylesWithElement('el-1', ['foo', 'is-active']),
//   { 'el-1': [] },
//   allStyles
// );
// expect(results.length).toBeGreaterThan(0);
```

### Current suites

- Linter services tests: `src/features/linter/services/__tests__/`
  - `lumos.grammar.test.ts`, `lumos.roles.test.ts`, `rule.messages.snapshot.test.ts`
- Style service tests: `src/entities/style/model/__tests__/`
  - `style.service.combo.test.ts`

### Tips

- Prefer small, focused tests per rule. Use the preset smoke only as a sanity check.
- For context-aware rules, pass `options.contexts` to `runRuleOnClasses` to simulate `ElementContext[]`.
- Keep rule IDs and names stable; snapshot tests may assert them.
