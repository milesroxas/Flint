# Extending Presets

Single source of truth for creating or extending linter presets. All paths are relative to `src/features/linter/` unless noted.

## Preset Interface

```typescript
// model/preset.types.ts
interface Preset {
  readonly id: string;
  readonly name?: string;
  readonly description?: string;
  readonly grammar?: GrammarAdapter;
  readonly roleDetectors?: readonly RoleDetector[];
  readonly roleDetectionConfig?: { threshold: number; fallbackRole?: ElementRole };
  readonly rules: readonly Rule[];
}
```

Presets can extend with `elementsConfig` for the Recognized Elements UI:

```typescript
Preset & { rules: Rule[]; elementsConfig: PresetElementsConfig }
```

## 1. Create a preset file

Create `presets/<id>.preset.ts`. Auto-discovery picks up any `*.preset.ts` in that directory.

```typescript
// presets/my-preset.preset.ts
import type { Preset } from "@/features/linter/model/preset.types";
import type { PresetElementsConfig } from "@/features/linter/model/preset-elements.types";
import type { Rule } from "@/features/linter/model/rule.types";

export const myPreset: Preset & { rules: Rule[]; elementsConfig?: PresetElementsConfig } = {
  id: "my-preset",
  grammar: myGrammar,
  roleDetectors: myRoleDetectors,
  roleDetectionConfig: { threshold: 0.6 },
  rules: [/* ... */],
  elementsConfig: myElementsConfig, // optional
};
```

## 2. Grammar

Implement `GrammarAdapter` in `grammar/<id>.grammar.ts`:

```typescript
// model/linter.types.ts
interface GrammarAdapter {
  id: string;
  parse(name: string): ParsedClass;
  isCustomFirstRequired?: boolean;
  utilityPrefix?: string;
  componentPrefix?: string;
  comboPrefix?: string;
}

interface ParsedClass {
  raw: string;
  kind: ClassType;  // "custom" | "utility" | "combo" | "unknown"
  type?: string;
  variation?: string;
  elementToken?: string;
  tokens?: string[];
  componentKey?: string | null;
}
```

Reference implementations: `grammar/lumos.grammar.ts`, `grammar/client-first.grammar.ts`.

- `u-` → utility, `is-*` / `is_*` / `isCamelCase` → combo, `c-` → component, else custom
- For custom: split by separator (`_` or `-`), set `type`, `variation`, `elementToken`, `componentKey` as needed

## 3. Role detectors

Implement `RoleDetector[]` in `detectors/<id>.detectors.ts`:

```typescript
// model/preset.types.ts
interface RoleDetector {
  readonly id: string;
  readonly description?: string;
  detect(element: ElementSnapshot, context: DetectionContext): RoleDetectionResult | null;
}

interface RoleDetectionResult {
  readonly role: ElementRole;  // "main" | "section" | "componentRoot" | "childGroup" | "container" | "layout" | "content" | "unknown"
  readonly score: number;      // 0–1
  readonly reasoning?: string;
}
```

Reference implementations: `detectors/lumos.detectors.ts`, `detectors/client-first.detectors.ts`. Shared helpers: `detectors/shared/wrapper-detection.ts` (`classifyWrapName`, `createWrapperDetector`).

## 4. Rules

### Rule types

| Type | Interface | Key fields |
|------|-----------|------------|
| naming | `NamingRule` | `test(className)`, `evaluate?(className, context)` |
| property | `PropertyRule` | `analyze(className, properties, context)` |
| structure | `StructureRule` | `analyzeElement(args)` |
| composition | `CompositionRule` | `analyzeElement(args)` |

### Where to put rules

- Preset-specific: `rules/<preset-id>/naming/`, `rules/<preset-id>/property/`, `rules/<preset-id>/composition/`
- Shared across presets: `rules/shared/property/`, `rules/shared/structure/`
- Canonical (page/element structure): `rules/canonical/` — **do not add to preset**; they are registered in `services/registry.ts`

### Shared rules (reusable)

Import from `rules/shared/property` and `rules/shared/structure`:

- `createColorVariableRule()`
- `createDuplicateOfUtilityRule()`
- `createUtilityDuplicatePropertyRule()`
- `createMissingClassOnDivRule()`

### Registering rules

Add rule factories to the preset `rules` array in `presets/<id>.preset.ts`.

## 5. PresetElementsConfig (optional)

For the Recognized Elements expanded view:

```typescript
// model/preset-elements.types.ts
interface PresetElementsConfig {
  getElements: () => string[];  // Known element tokens, e.g. from naming rule
  categoryMap: Record<string, string[]>;
  separator: string;
  metadata?: { displayName?: string; description?: string };
}
```

`getElements` is typically exported from the preset’s naming rule (e.g. `getLumosKnownElements` in `rules/lumos/naming/naming-class-format.ts`).

## 6. Environment-based filtering (optional)

`presets/index.ts` filters `client-first` and `lumos` via `VITE_ENABLE_CLIENT_FIRST` and `VITE_ENABLE_LUMOS`. New presets are included by default. To gate a new preset by env:

1. Add `VITE_ENABLE_MY_PRESET` to `.env.development` / `.env.production`
2. In `presets/index.ts`, add a check before `presets.set()`:

```typescript
if (candidate.id === "my-preset" && import.meta.env.VITE_ENABLE_MY_PRESET === "false") {
  continue;
}
```

## Checklist: New preset

1. `grammar/<id>.grammar.ts` — `GrammarAdapter`
2. `detectors/<id>.detectors.ts` — `RoleDetector[]`
3. `rules/<id>/` — preset-specific rules (naming, property, composition)
4. `presets/<id>.preset.ts` — preset config, import shared rules where needed
5. (Optional) `PresetElementsConfig` with `getElements` from naming rule

## Checklist: Extend existing preset

1. Add rules under `rules/<preset-id>/` or reuse from `rules/shared/`
2. Add rule to `rules` array in `presets/<preset-id>.preset.ts`
3. For new detectors or grammar changes, edit `detectors/<id>.detectors.ts` or `grammar/<id>.grammar.ts`
