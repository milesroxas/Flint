## Style Service

`style.service.ts` provides access to site styles and element‑applied styles in Webflow Designer.

- `getAllStylesWithProperties()` caches site styles and returns `{ name, order, properties, isCombo }[]`. For now, combo detection uses the `is-` prefix; if Webflow's `style.isComboClass()` becomes reliably available, it can be used to refine `isCombo`.
- `getAppliedStyles(element)` returns the styles applied to a Designer element, including `isCombo` per style based on the same heuristic.
- `sortStylesByType(styles)` sorts styles by `isCombo` (combos after custom) and preserves original application order within groups. Utilities are not specially sorted here; element-level ordering checks run in the rule runner.
- `getAppliedClassNames(element)` extracts clean class names for classification.
- Cache invalidation occurs when the linter registry/preset changes via `resetStyleServiceCache()`.
