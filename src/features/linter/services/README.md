## Linter Services

- `element-lint-service.ts`

  - Orchestrates element scans; computes element contexts and roles; runs rules via the rule runner
  - Selects grammar and role resolver from the active preset (see `linter.factory.ts`)
  - Creates the element-context classifier with the active preset’s `contextConfig`
  - Exposes `lintElement(element)` and `lintElementWithMeta(element)` (includes `appliedClassNames`, `contextsMap`, and `roles`)
  - Attaches `metadata.role` to violations when resolvable so the UI can render per‑item role badges

- `page-lint-service.ts`

  - Orchestrates page scans; builds element contexts and runs rules across all elements
  - Computes per‑element roles and stamps `metadata.role` on violations for page‑level role badges
  - Creates the element-context classifier with the active preset’s `contextConfig`

- `rule-runner.ts`

  - Filters by class type and context; executes naming and property rules
  - Accepts an optional class kind resolver derived from the active grammar; falls back to prefix heuristics when not provided
  - Handles utility duplicate detection with formatted metadata in results
  - Emits ordering violations per element: utilities before base custom, combos before base custom, combo limit, and variant requires base; includes `metadata.elementId` and `detectionSource` when applicable

- `rule-registry.ts`, `registry.ts`, `rule-configuration-service.ts`

  - Global registry management, configuration persistence and merging, and opinion mode application

- `utility-class-analyzer.ts`
  - Detects exact duplicate utilities by comparing the full property set (key/value pairs)
  - Emits `metadata.exactMatches` for full‑property identical utilities and a formatted property payload for single‑property exact matches
