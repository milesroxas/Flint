# Linter Rules

This directory contains all rules that the linter executes. It includes:

- Canonical, preset‑agnostic structural rules (shared by all presets)
- Preset‑specific rules (e.g., Lumos, Client‑First) organized by Rule Type
- Shared rules that can be used across multiple presets

---

## Taxonomy

- **Structure**: element graph and roles
- **Naming**: lexical patterns and tokens for individual class names
- **Composition**: rules about the class list on an element, including count, ordering, and the presence of a single base
- **Property**: rules that inspect computed style declarations or utilities' property effects

## Directory Structure

```txt
src/features/linter/rules/
├── canonical/                    # Preset-agnostic structural rules
│   ├── __tests__/
│   ├── child-group-key-match.ts
│   ├── main-children.page.ts
│   ├── main-singleton.page.ts
│   ├── section-parent-is-main.ts
│   └── index.ts
├── shared/                       # Rules shared across presets
│   ├── property/
│   │   ├── __tests__/
│   │   ├── color-variable.ts
│   │   ├── utility-duplicate-properties.ts
│   │   └── index.ts
│   ├── structure/
│   │   ├── missing-class-on-div.ts
│   │   └── index.ts
│   └── index.ts
├── lumos/                        # Lumos preset-specific rules
│   ├── composition/
│   │   ├── __tests__/
│   │   ├── class-order.element.ts
│   │   ├── combo-limit.element.ts
│   │   ├── variant-requires-base.element.ts
│   │   └── index.ts
│   ├── naming/
│   │   ├── __tests__/
│   │   ├── combo-class-format.element.ts
│   │   ├── naming-class-format.ts
│   │   └── index.ts
│   ├── property/
│   │   ├── utility-class-duplicate-properties.ts
│   │   ├── utility-class-exact-duplicate.ts
│   │   └── index.ts
│   ├── structure/
│   │   └── utility-style-order.page.ts
│   ├── README.md
│   └── index.ts
├── client-first/                  # Client-First preset-specific rules
│   ├── naming/
│   │   ├── naming-class-format.ts
│   │   └── index.ts
│   ├── role-aware/
│   ├── README.md
│   └── index.ts
└── README.md
```

---

## Execution Model

- Rules are executed by the rule runner: `src/features/linter/services/rule-runner.ts`
- The runner provides element‑level analysis inputs (`analyzeElement(args)`) to rules with:
  - `classes: { name, order, elementId, isCombo, detectionSource }[]`
  - `allStyles: StyleInfo[]`
  - `getClassType(name, isCombo?)`
  - `getRuleConfig(ruleId)`
  - Role/graph helpers (from the detection + graph layers):
    - `rolesByElement?`
    - `getRoleForElement?(elementId) → ElementRole`
    - `getParentId?(elementId) → string | null`
    - `getChildrenIds?(elementId) → string[]`
    - `getAncestorIds?(elementId) → string[]`
    - `getClassNamesForElement?(elementId) → string[]`
    - `parseClass?(name) → ParsedClass`
- Page‑scope rules (e.g., main singleton) live under `canonical/*.page.ts` and are executed by the page rule runner in `page-lint-service.ts` before element rules
- Each violation has `metadata.elementId` and, when available, `metadata.role` to power UI labels and grouping

---

## Canonical Rules (Preset‑agnostic)

These use canonical roles and the element graph. They apply to any preset.

- `main-singleton.page.ts` (page): Enforces exactly one `main` per page
- `main-children.page.ts` (page): Requires `main` to contain at least one `section` or `componentRoot` child
- `section-parent-is-main.ts` (element): `section` must be a direct child of `main`
- `child-group-key-match.ts` (element): `childGroup` must share the component key with its nearest `componentRoot` ancestor (derived via `parseClass`)

Do not duplicate these in presets. If a preset needs stronger/different behavior, extend detectors or add additional role‑aware rules that complement (not replace) the canonical set.

---

## Shared Rules

### Property Rules

- `color-variable.ts`: Detects color values that should use CSS variables
- `utility-duplicate-properties.ts`: Identifies duplicate CSS properties from utility classes

### Structure Rules

- `missing-class-on-div.ts`: Suggests adding semantic classes to div elements

These shared rules are imported and used by multiple presets to avoid duplication.

---

## Preset‑specific Rules

### Lumos (naming, composition, property)

- **Naming**: `naming-class-format.ts`, `combo-class-format.element.ts`
- **Composition**: `class-order.element.ts`, `variant-requires-base.element.ts`, `combo-limit.element.ts`
- **Property**: `utility-class-duplicate-properties.ts`, `utility-class-exact-duplicate.ts`
- **Structure**: `utility-style-order.page.ts`

### Client‑First (naming)

- **Naming**: `naming-class-format.ts`

---

## Role‑first Guidance for Writing Rules

- Prefer canonical roles + element graph over classifier contexts:
  - Use `getRoleForElement`, `getParentId`, `getChildrenIds`, `getAncestorIds`
  - Use `parseClass` for token/key derivation; avoid ad‑hoc string parsing
- Keep rules strictly typed and defensive. Return an empty array when a precondition fails
- Avoid recomputing site‑wide data in rules; use inputs provided by the runner
- Canonical rules must remain preset‑agnostic; do not reference preset‑specific conventions inside them
- Preset rules should be cohesive to that preset's grammar/conventions and must not duplicate canonical checks

---

## Adding or Registering Rules

1. Place your rule under the appropriate folder:

   - Shared structural checks → `canonical/`
   - Preset naming/format/property → `naming/` or `property/`
   - Role‑aware checks → `role-aware/`
   - Rules used by multiple presets → `shared/`

2. Register in a preset:

   - Edit `src/features/linter/presets/<preset>.preset.ts`
   - Add the rule in the `rules` array (canonical first, then preset naming/property, then shared)

3. If your rule needs class parsing or graph helpers, use the provided `analyzeElement` args

---

## Page vs Element Rules

- **Page‑scope**: add rules in `canonical/*.page.ts` and they will be executed by the page rule runner inside `page-lint-service.ts`
- **Element‑scope**: use the standard `Rule` shape with `analyzeElement` and register in the preset as usual

---

## Testing

See `docs/guides/testing-rules.md`. Prefer small unit tests for detectors and rules with focused positive/negative fixtures. Ensure no duplication with canonical rules.

---

## Performance

- The runner aggregates inputs once per element; avoid site‑wide work inside rules
- Canonical detection and graph building are O(n) and cached per page signature (sorted element IDs)

---

## Compatibility & Removals

- Removed duplicates: `component-root-required-structure.ts` and `lumos-child-group-references-parent.ts`
- Avoid re‑introducing preset rules that implement canonical behavior; extend canonical rules if changes are needed
