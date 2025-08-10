## Webflow Designer Linter

A linting system for Webflow Designer that validates class naming, flags duplicate utility properties, and applies context-aware rules to elements within the current page or the currently selected element. This document reflects the current implementation across services, rules, UI, and state.

### Key capabilities

- **Class type detection**: custom, utility, combo (by prefix/format)
- **Naming validation**: format rules for each class type
- **Duplicate detection**: utility class duplicate and overlap checks
- **Context-aware rules**: rules scoped to element contexts (e.g., component roots)
- **Role identification**: parses the first custom class using a preset GrammarAdapter and maps it to an ElementRole via a RoleResolver (e.g., title, text, actions, container). Services attach `metadata.role` on violations for UI badges.
- **Config persistence**: per-rule settings merged from schemas and stored in localStorage

## Class types and conventions

- **custom**: underscore-separated, lowercase alphanumeric, 2–3 segments
- **utility**: starts with `u-`, dash-delimited
- **combo**: starts with `is-`, dash-delimited

The rule runner derives `ClassType` from the class name prefix and uses it to select applicable rules.

## Element contexts and roles

The system assigns element contexts to support context-aware rules.

- Supported context values: `componentRoot`
- Classification defaults (see `element-context-classifier.ts`):
  - `wrapSuffix`: `_wrap`
  - `parentClassPatterns`: `section_contain`, `/^u-section/`, `/^c-/`
- Behavior: an element with a class ending in `_wrap` that has an ancestor matching any parent pattern is classified as `componentRoot`.

### Roles

- Roles are computed in `services/element-lint-service.ts` with the active preset’s grammar and role resolver
- We parse the first custom class only (skip `u-`, `is-`, `c-`)
- Typical tokens → roles:
  - `wrap` → `componentRoot` (or `childGroup` when not at the root)
  - `contain`, `container` → `container`
  - `layout` (and Client‑first structural wrappers) → `layout`
  - `content`, `title`, `text`, `actions`, `button`, `link`, `icon`, `list`, `item`

## Architecture overview

### Services (in `features/linter/services/`)

- `element-lint-service.ts`

  - Orchestrates selected-element scans; reuses cached site styles and page contexts

- `utility-class-analyzer.ts`

  - Builds a utility class → properties map and a property → classes map
  - Detects exact duplicates (single-property) and overlapping properties
  - Exposes formatted property metadata for exact matches (used by UI)

- `rule-registry.ts`

  - Registers rules and seeds default `customSettings` from each rule's schema
  - Stores `RuleConfiguration` (enabled, severity, customSettings)
  - Exposes getters and filter helpers by class type and category
  - Supports export/import and in-place configuration updates (with nested merge)

- `rule-configuration-service.ts`

  - Persists configurations to `localStorage` under `webflow-linter-rules-config`
  - Merges with rule schemas and drops unknown keys upon load/import

- `registry.ts`

  - Global `ruleRegistry` and `ruleConfigService`
  - `initializeRuleRegistry()` registers preset rules (e.g., Lumos, Client‑first) and applies persisted configs
  - `addCustomRule()` registers a rule dynamically

- `rule-runner.ts`

  - Filters rules by class type and context
  - Executes naming rules (`test`/`evaluate`) and property rules (`analyze`)
  - Integrates utility duplicate handling and includes formatted metadata in results
  - Entry point: `runRulesOnStylesWithContext(stylesWithElement, contextsMap, allStyles)`

- `element-context-classifier.ts`

  - Builds a parent map via `getChildren()` traversal
  - Classifies elements with their class names into contexts (batched processing)

- Grammar and role mapping (per preset)

  - `grammar/lumos.grammar.ts`, `roles/lumos.roles.ts`
  - `grammar/client-first.grammar.ts`, `roles/client-first.roles.ts`

- `message-parser.ts`, `severity-styles.ts`
  - Parse duplicate-properties messages and map severities to CSS classes for UI

### Rules

- Rules are defined under `src/rules/` and registered via presets in `src/presets/`.
  - Naming: `rules/naming/*`
  - Property: `rules/property/*`
  - Context‑aware: `rules/context-aware/*`

### Types

- `rule-types.ts`
  - `RuleResult` includes `context` and optional `metadata`
  - `BaseRule` optionally declares `context` to target specific element contexts
  - `RuleConfiguration` stores enabled, severity, and `customSettings`
- `element-context.ts`
  - Defines `ElementContext` (`'componentRoot'`) and classifier interfaces

### Hooks, store, and UI

- Hooks

- `hooks/useElementLint.ts`: subscribes to Webflow `selectedelement`, runs element lint, returns `violations`, `contexts`, `classNames`, `roles`, and `isLoading`
- `hooks/usePageLint.ts`: thin wrapper around the store

-- Store

- `store/usePageLintStore.ts`: Zustand store exposing `lintPage`, results, and status
- Uses shared registry initialization so page and element flows are aligned

- UI
  - `components/LintPanel.tsx`: renders current selected element violations, contexts, and roles (header + per‑violation badge)
  - `components/PageLintSection.tsx`: full-page lint trigger and results; per‑violation role badges supported
  - `components/PageLintSection.tsx`: full-page lint trigger and results
  - `components/LintPageButton.tsx`: action button with loading/issue count state
  - `components/ViolationsList.tsx` and `components/ViolationItem.tsx`: render violations; structured duplicate details displayed when available

## Runtime flows

- Selected element lint

  - `createElementLintService()` ensures `initializeRuleRegistry()` runs (preset + persisted configs)
  - Builds utility property maps from cached site styles
  - Retrieves applied styles for the selected element
  - Builds or reuses page contexts (cached parent map + class names)
  - Runs `runRulesOnStylesWithContext` with element-context mapping and all styles

- Full page lint
  - `usePageLintStore.lintPage()` fetches all elements, builds utility maps, then calls `createPageLintService().lintCurrentPage(elements)`
  - Extracts class names for context classification, produces the contexts map, and runs `runRulesOnStylesWithContext`
  - Uses the same registry initialization as element lint

## Configuration

- Rule registration seeds defaults from each rule’s `config` schema
- `RuleConfigurationService` stores enabled set and `ruleConfigs` keyed by `ruleId`
- Loading merges stored values with schema defaults and drops unknown keys
- The global registry loads and applies persisted configs during initialization

## Rule execution details

- Class type detection by prefix: `is-` → combo, `u-` → utility, otherwise custom
- Context filtering: rules with a `context` apply only when the element’s contexts include that value
- Naming rule execution order: `evaluate` (if present) else `test`
- Utility duplicate handling: single-property exact matches include formatted metadata consumed by the UI
- Results include: rule identifiers, severity (effective from configuration), class name, optional `context`, and optional `metadata`

## UI behavior specifics

- Violations list auto-expands when there is exactly one violation
- Duplicate utility issues display structured properties with expandable lists of other classes that share those properties
- Badges highlight unrecognized elements (from metadata) and the presence of an element context

## File map (key files)

- `services/element-lint-service.ts`, `services/utility-class-analyzer.ts`, `services/rule-runner.ts`
- `services/rule-registry.ts`, `services/rule-configuration-service.ts`, `services/registry.ts`
- `entities/style/model/style.service.ts`, `entities/element/model/element-context-classifier.ts`
- `rules/*` (naming, property, context-aware)
- `hooks/useElementLint.ts`, `hooks/usePageLint.ts`
- `store/usePageLintStore.ts`
- `components/LintPanel.tsx`, `components/PageLintSection.tsx`, `components/LintPageButton.tsx`, `components/ViolationsList.tsx`, `components/ViolationItem.tsx`

## Notes and limitations

- Full-page lint currently registers default rules in the store-level registry; context-aware rules are registered only by the element-lint flow via global initialization.
- Webflow Designer APIs are expected to provide `getAllElements`, `getAllStyles`, `getStyles`, `getName`, `getProperties`, and `getChildren` where referenced.
