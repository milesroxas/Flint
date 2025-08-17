## Linter Services

- `element-lint-service.ts`

  - Orchestrates element scans; builds property maps and runs rules
  - Selects grammar and provides a class kind resolver from the active preset (see `linter.factory.ts`)
  - Detects roles using active preset detectors; passes `rolesByElement` into the rule runner
  - Exposes `lintElement(element)` and `lintElementWithMeta(element)` (includes `appliedClassNames` and `roles`)
  - Does not manually stamp role metadata; the rule runner attaches `metadata.role` when `rolesByElement` is provided

- `page-lint-service.ts`

  - Orchestrates full page scans; gathers styles per element and runs rules across all elements
  - Detects roles once per page using `role-detection.service.ts` with active preset grammar and detectors
  - Builds a lightweight element graph (`element-graph.service.ts`) and executes page‑scope canonical rules via `page-rule-runner.ts` (e.g., main singleton/content rules)
  - Invokes the rule runner with `rolesByElement` and parent/children/ancestor helpers; role metadata is not post‑stamped here

- `rule-runner.ts`

  - Primary API: `runRulesOnStylesWithContext(styles, elementContextsMap, allStyles, rolesByElement?, getParentId?, getChildrenIds?, getAncestorIds?, parseClass?)`
  - Filters by resolved class type; executes naming/property rules and element-level analysis
  - Accepts an optional class kind resolver (from active grammar); falls back to heuristics and combo‑like detection when not provided
  - Supports element‑level analysis via per‑rule `analyzeElement` hook before class‑level checks
  - Handles duplicate detection for any class type using `utility-class-analyzer`
  - Emits structured metadata:
    - Exact duplicates: `metadata.formattedProperty`, `metadata.exactMatches`, `metadata.exactMatchProperties`
    - Execution context: `metadata.elementId`, `metadata.role` (if available), `metadata.parentId`, and `detectionSource`

- `role-detection.service.ts`

  - Scores roles per element using active preset grammar and detectors with a configurable threshold (default 0.6)
  - Enforces singleton `main` by keeping the highest‑scoring candidate and setting others to `unknown`
  - API: `detectRolesForPage(elementsWithClassNames) => RolesByElement`

- `element-graph.service.ts`

  - Builds parent/children/ancestor relationships for a page snapshot to support page and element rules
  - API: `getParentId(id)`, `getChildrenIds(id)`, `getAncestorIds(id)`

- `page-rule-runner.ts`

  - Executes page‑scope rules that analyze multiple elements and relationships (e.g., canonical page rules)
  - API: `run(rules, { rolesByElement, getParentId, getChildrenIds })`

- `rule-registry.ts`, `registry.ts`, `rule-configuration-service.ts`

  - Global registry management, opinion mode application, and persistence/merge of user configurations
  - Initializes rules from the active preset and then applies opinion and user overrides

- `utility-class-analyzer.ts`
  - Indexes all classes (not only `u-*`) and ignores classes with zero unique (non‑inherited) properties
  - Builds property maps and full‑property fingerprints to detect duplicates across any class type
  - Surfaces:
    - Per‑property duplicates via `propertyToClassesMap`
    - Full‑property duplicates via class fingerprinting and `analyzeDuplicates()`
