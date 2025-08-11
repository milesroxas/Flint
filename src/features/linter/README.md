## Webflow Designer Linter

A linting system for Webflow Designer that validates class naming, flags duplicate utility properties, and applies context-aware rules to elements within the current page or the currently selected element. This document reflects the current implementation across services, rules, UI, and state.

### Key capabilities

- **Class type detection**: custom, utility, combo (combo prefers Webflow API `style.isComboClass()` with fallback to `is-` prefix)
- **Naming validation**: format rules for each class type
- **Duplicate detection**: utility class duplicate and overlap checks
- **Context-aware rules**: rules scoped to element contexts (e.g., component roots)
- **Role identification**: parses the first custom class using a preset GrammarAdapter and maps it to an ElementRole via a RoleResolver (e.g., title, text, actions, container). Services attach `metadata.role` on violations for UI badges.
- **Config persistence**: per-rule settings merged from schemas and stored in localStorage

## Class types and conventions

- **custom**: underscore-separated, lowercase alphanumeric, 2–3 segments
- **utility**: starts with `u-`, dash-delimited
- **combo**: starts with `is-`, dash-delimited (or flagged by Webflow API)

The rule runner derives `ClassType` from the name/prefix; combo classification piggybacks on the `isCombo` flag from the Style Service.

## Element contexts and roles

The system assigns element contexts to support context-aware rules.

- Supported context values: `componentRoot`, `childGroup`, `childGroupInvalid`
- Classification defaults (see `element-context-classifier.ts`):
  - `wrapSuffix`: `_wrap`
  - `parentClassPatterns`: `section_contain`, `/^u-section/`, `/^c-/`, `/^page_main/`
- Behavior:
  - `componentRoot`: element has a class ending in `_wrap` and its immediate parent matches a configured container pattern (default: `section_contain`, `/^u-section/`, `/^c-/`, `/^page_main/`).
  - `childGroup`: element has a class ending in `_wrap` and is nested under a root wrap; by default it must share the same type prefix token with the nearest root wrap (configurable in the classifier).
  - `childGroupInvalid`: nested under a root wrap but fails prefix/group name validation per classifier config.

### Roles

- Roles are computed in `services/element-lint-service.ts` with the active preset’s grammar and role resolver
- We parse the first custom class using the active preset's grammar (skip `utility` and `combo` kinds)
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
  - Defines `ElementContext` (`'componentRoot' | 'childGroup'`) and classifier interfaces

### Hooks, store, and UI

- Hooks

- `hooks/useElementLint.ts`: subscribes to Webflow `selectedelement`, runs element lint, returns `violations`, `contexts`, `classNames`, `roles`, and `isLoading`
- `hooks/usePageLint.ts`: thin wrapper around the store

-- Store

- `store/usePageLintStore.ts`: Zustand store exposing `lintPage`, results, and status
- Uses shared registry initialization so page and element flows are aligned

- UI
- `components/LintPanel.tsx`: renders current selected element violations, contexts, and roles (header + per‑violation badge)
- `components/PageLintSection.tsx`: full-page lint trigger and results; supports switching between page and element view
- `components/LintPageButton.tsx`: action button with loading/issue count state
- `components/ViolationsList.tsx` and `components/ViolationItem.tsx`: render violations; structured duplicate details displayed when available
- `components/ModeToggle.tsx`: uses shared `Button` variants for consistent a11y and focus
- `components/PresetSwitcher.tsx`: uses dynamic `import()` for cache reset and clears results

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
  - Uses the same registry initialization as element lint (parity ensured by `ensureLinterInitialized()`)

## Configuration

- Rule registration seeds defaults from each rule’s `config` schema
- `RuleConfigurationService` stores enabled set and `ruleConfigs` keyed by `ruleId`
- Loading merges stored values with schema defaults and drops unknown keys
- The global registry loads and applies persisted configs during initialization

## Rule execution details

- Class type detection: resolved by the active grammar via a resolver passed into the rule runner (`utility`, `combo`, else `custom`); when the resolver is unavailable the runner falls back to the previous `u-`/`is-` heuristic
- Context filtering: rules with a `context` apply only when the element’s contexts include that value
- Naming rule execution order: `evaluate` (if present) else `test`
- Utility duplicate handling: single-property exact matches include formatted metadata consumed by the UI
- Results include: rule identifiers, severity (effective from configuration), class name, optional `context`, and optional `metadata`

## UI behavior specifics

- Violations list auto-expands when there is exactly one violation
- Duplicate utility issues display structured properties with expandable lists of other classes that share those properties
- Badges highlight unrecognized elements (from metadata) and the presence of an element context
- Labels for contexts and roles are centralized in `lib/labels.ts`
- Clipboard copy badges avoid timers and reflect state until the next interaction

### Highlight behavior

- Page mode: when a violation accordion item is opened, the extension automatically highlights the corresponding Designer element using `selectElementById` (falls back to the `flowlint:highlight` custom event when the Designer API is unavailable).
- The manual "Highlight element" button remains available in each violation item.

## File map (key files)

- `services/element-lint-service.ts`, `services/utility-class-analyzer.ts`, `services/rule-runner.ts`
- `services/rule-registry.ts`, `services/rule-configuration-service.ts`, `services/registry.ts`
- `entities/style/model/style.service.ts`, `entities/element/model/element-context-classifier.ts`
- `rules/*` (naming, property, context-aware)
- `hooks/useElementLint.ts`, `hooks/usePageLint.ts`
- `store/usePageLintStore.ts`
- `components/LintPanel.tsx`, `components/PageLintSection.tsx`, `components/LintPageButton.tsx`, `components/ViolationsList.tsx`, `components/ViolationItem.tsx`

## Notes and limitations

- Webflow Designer APIs are expected to provide `getAllElements`, `getAllStyles`, `getStyles`, `getName`, `getProperties`, and `getChildren` where referenced.
