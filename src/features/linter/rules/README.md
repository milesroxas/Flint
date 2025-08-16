## Linter Rules

This directory contains all rules that the linter executes. It includes:

- Canonical, preset‑agnostic structural rules (shared by all presets)
- Preset‑specific naming and property rules (e.g., Lumos, Client‑First)
- A small set of legacy‑compatible, context‑aware rules that do not conflict with the canonical role rules

This document reflects the current implementation and how to extend it safely.

---

## Directory structure

```txt
src/features/linter/rules/
  canonical/
    child-group-key-match.ts
    component-root-structure.ts
    section-parent-is-main.ts
    main-children.page.ts
    main-singleton.page.ts
  naming/
    lumos-custom-class-format.ts
    lumos-component-class-format.ts
    lumos-utility-class-format.ts
    lumos-combo-class-format.ts
    lumos-class-ordering.ts
    cf-variant-is-prefix.ts
    cf-unknown-utility-family.ts
    cf-custom-kebab-case.ts
  property/
    lumos-utility-class-exact-duplicate.ts
    lumos-utility-class-duplicate-properties.ts
  context-aware/
    component-root-semantic-naming.ts
    component-root-no-display-utilities.ts
    cf-no-utilities-on-root.ts
    cf-inner-wrapper-recommended.ts
    cf-containers-clean.ts
    cf-no-padding-on-inner.ts
```

Notes:

- The two legacy structural files that duplicated canonical behavior were removed:
  - `component-root-required-structure.ts` (replaced by canonical `component-root-structure.ts`)
  - `lumos-child-group-references-parent.ts` (replaced by canonical `child-group-key-match.ts`)

---

## Execution model

- Rules are executed by the rule runner: `src/features/linter/services/rule-runner.ts`.
- The runner provides element‑level analysis inputs (`analyzeElement(args)`) to rules with:
  - `classes: { name, order, elementId, isCombo, detectionSource }[]`
  - `contexts: ElementContext[]` (legacy classifier contexts)
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
- Page‑scope rules (e.g., main singleton) live under `canonical/*.page.ts` and are executed by the page rule runner in `page-lint-service.ts` before element rules.
- Each violation has `metadata.elementId` and, when available, `metadata.role` to power UI labels and grouping.

---

## Canonical rules (preset‑agnostic)

These use canonical roles and the element graph. They apply to any preset.

- `main-singleton.page.ts` (page): Enforces exactly one `main` per page.
- `main-children.page.ts` (page): Requires `main` to contain at least one `section` or `componentRoot` child.
- `section-parent-is-main.ts` (element): `section` must be a direct child of `main`.
- `component-root-structure.ts` (element): `componentRoot` must live under a `section` and contain `layout`, `content`, or `childGroup` descendants.
- `child-group-key-match.ts` (element): `childGroup` must share the component key with its nearest `componentRoot` ancestor (derived via `parseClass`).

Do not duplicate these in presets. If a preset needs stronger/different behavior, extend detectors or add additional role‑aware rules that complement (not replace) the canonical set.

---

## Preset‑specific rules

### Lumos (naming, ordering, property)

- Naming/formatting: `lumos-custom-class-format.ts`, `lumos-component-class-format.ts`, `lumos-utility-class-format.ts`, `lumos-combo-class-format.ts`
- Ordering/variants (element‑level checks): `lumos-class-ordering.ts`
- Property duplicate detection: `lumos-utility-class-exact-duplicate.ts`, `lumos-utility-class-duplicate-properties.ts`
- Legacy‑compatible, non‑conflicting context‑aware:
  - `component-root-semantic-naming.ts`
  - `component-root-no-display-utilities.ts`

These are registered in `src/presets/lumos.preset.ts` after the canonical rules.

### Client‑First (naming and lightweight structure hints)

- Naming: `cf-variant-is-prefix.ts`, `cf-unknown-utility-family.ts`, `cf-custom-kebab-case.ts`
- Lightweight context‑aware suggestions (kept compatible with role approach):
  - `cf-no-utilities-on-root.ts`
  - `cf-inner-wrapper-recommended.ts`
  - `cf-containers-clean.ts`
  - `cf-no-padding-on-inner.ts`

These are registered in `src/presets/client-first.preset.ts`.

---

## Role‑first guidance for writing rules

- Prefer canonical roles + element graph over classifier contexts:
  - Use `getRoleForElement`, `getParentId`, `getChildrenIds`, `getAncestorIds`.
  - Use `parseClass` for token/key derivation; avoid ad‑hoc string parsing.
- Keep rules strictly typed and defensive. Return an empty array when a precondition fails.
- Avoid recomputing site‑wide data in rules; use inputs provided by the runner.
- Canonical rules must remain preset‑agnostic; do not reference preset‑specific conventions inside them.
- Preset rules should be cohesive to that preset’s grammar/conventions and must not duplicate canonical checks.

---

## Adding or registering rules

1. Place your rule under the appropriate folder:

   - Shared structural checks → `canonical/`
   - Preset naming/format/property → `naming/` or `property/`
   - Legacy‑compatible context checks (only when necessary) → `context-aware/`

2. Register in a preset:

   - Edit `src/presets/<preset>.preset.ts`
   - Add the rule in the `rules` array (canonical first, then preset naming/property, then compatible context‑aware)

3. If your rule needs class parsing or graph helpers, use the provided `analyzeElement` args.

---

## Page vs element rules

- Page‑scope: add rules in `canonical/*.page.ts` and they will be executed by the page rule runner inside `page-lint-service.ts`.
- Element‑scope: use the standard `Rule` shape with `analyzeElement` and register in the preset as usual.

---

## Testing

See `docs/guides/testing-rules.md`. Prefer small unit tests for detectors and rules with focused positive/negative fixtures. Ensure no duplication with canonical rules.

---

## Performance

- The runner aggregates inputs once per element; avoid site‑wide work inside rules.
- Canonical detection and graph building are O(n) and cached per page signature (sorted element IDs).

---

## Compatibility & removals

- Removed duplicates: `component-root-required-structure.ts` and `lumos-child-group-references-parent.ts`.
- Avoid re‑introducing preset rules that implement canonical behavior; extend canonical rules if changes are needed.
