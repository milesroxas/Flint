## Style Service

`style.service.ts` provides access to site styles and element‑applied styles in Webflow Designer.

- `getAllStylesWithProperties()` caches site styles and returns `{ name, order, properties }[]`
- `getAppliedStyles(element)` returns the styles applied to a Designer element
- `sortStylesByType(styles)` sorts styles with custom before combo before utility
- `getAppliedClassNames(element)` extracts clean class names for classification
- Cache invalidation occurs when the linter registry/preset changes
