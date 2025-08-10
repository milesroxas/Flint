## Element Context Classifier

`element-context-classifier.ts` builds a parent map and classifies elements into contexts.

- Contexts: currently `componentRoot`
- Defaults: `wrapSuffix: "_wrap"`, `parentClassPatterns: ["section_contain", /^u-section/, /^c-/]`
- Behavior: element with a `_wrap` class that has an ancestor matching any parent pattern is considered a `componentRoot`
- Batch API: `classifyPageElements(elementsWithClassNames)` returns a map of elementId → contexts[]
- Caching: in‑memory parent map keyed by element count (page snapshot)
