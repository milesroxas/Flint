## Element Context Classifier

`element-context-classifier.ts` builds a parent map and classifies elements into contexts.

- Contexts: `componentRoot`, `childGroup`, `childGroupInvalid`
- Configuration (via preset `contextConfig`):
  - `wrapSuffix` (string)
  - `parentClassPatterns` (string | RegExp [])
  - `requireDirectParentContainerForRoot` (boolean)
  - `childGroupRequiresSharedTypePrefix` (boolean)
  - `typePrefixSeparator` (string), `typePrefixSegmentIndex` (number)
  - `groupNamePattern` (RegExp), `childGroupPrefixJoiner` (string)
- Behavior:
  - `componentRoot`: element has a class ending in `wrapSuffix` and its immediate parent (or ancestor when configured) matches any `parentClassPatterns`.
  - `childGroup`: element has a `wrapSuffix` class nested under a root wrap and, when required, shares the configured type prefix with the nearest root wrap; group name must match `groupNamePattern` with `childGroupPrefixJoiner`.
  - `childGroupInvalid`: nested under a root wrap but fails prefix/group name validation.
- Batch API: `classifyPageElements(elementsWithClassNames)` returns a map of elementId → contexts[]
  - Keys are normalized Designer element IDs, typically `element.id.element`.
- Caching: in‑memory parent map keyed by element count (page snapshot)
- Ownership of defaults: Presets supply `contextConfig`; the services instantiate the classifier with the active preset’s configuration.
