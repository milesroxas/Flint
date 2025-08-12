## Style Service

`style.service.ts` provides access to site styles and element‑applied styles in Webflow Designer.

- `getAllStylesWithProperties()` caches site styles and returns `{ name, order, properties, isCombo, detectionSource }[]`. Combo detection is API‑first via Webflow `style.isComboClass()` when available, with a safe fallback to a variant‑like name heuristic (e.g., `is-`, `is_`, `isCamelCase`). `detectionSource` is `"api" | "heuristic"` for minimal debug.
- `getAppliedStyles(element)` returns the styles applied to a Designer element, including `isCombo` and `detectionSource` per style using the same API‑first approach.
- `sortStylesByType(styles)` sorts styles by `isCombo` (combos after custom) and preserves original application order within groups. Utilities are not specially sorted here; element-level ordering checks run in the rule runner.
- `getAppliedClassNames(element)` extracts clean class names for classification.
- Cache invalidation occurs when the linter registry/preset changes via `resetStyleServiceCache()`.
