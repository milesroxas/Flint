## Webflow Designer Linter

A linting system for Webflow Designer that validates class naming, flags duplicate utility properties, and applies context-aware rules to elements within the current page or the currently selected element. This document reflects the current implementation across services, rules, UI, and state.

### Key capabilities

- **Class type detection**: custom, utility, combo (combo prefers Webflow API `style.isComboClass()` with fallback to `is-` prefix)
- **Naming validation**: format rules for each class type
- **Duplicate detection**: exact duplicate utility detection (full property set). Overlap-only checks are disabled by default.
- **Canonical roles + graph**: rules analyze elements using detected roles and element graph helpers
- **Role identification**: parses the first custom class using a preset GrammarAdapter and maps it to an ElementRole via a RoleResolver (e.g., title, text, actions, container). Services attach `metadata.role` on violations for UI badges.
- **Config persistence**: per-rule settings merged from schemas and stored in localStorage

## Class types and conventions

- **custom**: underscore-separated, lowercase alphanumeric, 2–3 segments
- **utility**: starts with `u-`, dash-delimited
- **combo**: starts with `is-`, dash-delimited (or flagged by Webflow API)

The rule runner derives `ClassType` from the name/prefix; combo classification piggybacks on the `isCombo` flag from the Style Service.

## Roles and element graph

Roles are computed via `services/role-detection.service.ts` using the active preset's grammar and detectors. Canonical element rules use `getRoleForElement`, `getParentId`, `getChildrenIds`, and `getAncestorIds` from services to analyze structure.

## Architecture overview

### Services (in `features/linter/services/`)

- `element-lint-service.ts`

  - Orchestrates selected-element scans; reuses cached site styles and detected roles

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
  - `initializeRuleRegistry(mode, presetId?)` resolves the active preset from the dynamic registry (`src/presets/index.ts`), registers its rules, and applies persisted configs
  - `addCustomRule()` registers a rule dynamically

- `rule-runner.ts`

  - Filters rules by class type and executes naming/property rules, and element-level `analyzeElement`
  - Integrates utility duplicate handling and includes formatted metadata in results
  - Entry point: `runRulesOnStylesWithContext(stylesWithElement, contextsMap, allStyles)`

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

- `src/features/linter/model/rule.types.ts`
  - `RuleResult` includes `metadata` (e.g., role, parentId)
  - `BaseRule` supports `analyzeElement` for element-level role/graph-based checks
- `src/entities/element/model/element-context.types.ts`
  - Defines legacy context types (deprecated) retained for minimal compatibility

### View, UI, hooks, and store

#### View

- `view/LinterPanel.tsx`: entry container for page/element modes with a mode toggle, status banners, toolbar, and results list.

#### UI

- `ui/violations/ViolationsList.tsx`, `ui/violations/ViolationItem.tsx` (composes `ui/violations/ViolationHeader` + `ui/violations/ViolationDetails`): reusable rendering of violations; supports highlight-on-open in page mode.
- `ui/controls/ModeToggle.tsx`: page/element toggle buttons.
- `ui/controls/PresetSwitcher.tsx`: preset picker wired to registry re-init and cache reset.
- `ui/controls/ActionBar.tsx` and `ui/controls/LintPageButton.tsx`: bottom toolbar and primary actions.
- `ui/panel/LintPanelHeader.tsx` (LintSummary): shared header for counts and roles.

#### Hooks

- `hooks/useElementLint.ts`: re-exports the new Zustand store hook for backward compatibility.
- `hooks/usePageLint.ts`: thin wrapper around the page store.

#### Store

- `store/usePageLintStore.ts`: Zustand store exposing `lintPage`, results, and status.
- `store/elementLint.store.ts`: Zustand store for selected-element lint; mirrors page store state shape and provides `refresh`.

## Runtime flows

- Selected element lint

  - `createElementLintService()` ensures `initializeRuleRegistry()` runs (preset + persisted configs)
  - Builds utility property maps from cached site styles
  - Retrieves applied styles for the selected element
  - Detects roles for the page snapshot and runs `runRulesOnStylesWithContext` with roles and graph helpers

- Full page lint
  - `usePageLintStore.lintPage()` fetches all elements, builds utility maps, then calls `createPageLintService().lintCurrentPage(elements)`
  - Detects roles once for the page, builds an element graph, executes canonical page rules, then runs class-level rules with roles/graph

## Configuration

- Rule registration seeds defaults from each rule’s `config` schema
- `RuleConfigurationService` stores enabled set and `ruleConfigs` keyed by `ruleId`
- Loading merges stored values with schema defaults and drops unknown keys
- The global registry loads and applies persisted configs during initialization

## Rule execution details

- Class type detection: resolved by the active grammar via a resolver passed into the rule runner (`utility`, `combo`, else `custom`); when the resolver is unavailable the runner falls back to the previous `u-`/`is-` heuristic
- Naming rule execution order: `evaluate` (if present) else `test`
- Utility duplicate handling: single-property exact matches include formatted metadata consumed by the UI
- Results include: rule identifiers, severity (effective from configuration), class name, optional `metadata`

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
- `entities/style/model/style.service.ts`
- `rules/*` (naming, property, context-aware)
- `hooks/useElementLint.ts`, `hooks/usePageLint.ts`
- `store/usePageLintStore.ts`, `store/elementLint.store.ts`
- `view/LinterPanel.tsx`, `ui/controls/LintPageButton.tsx`, `ui/violations/ViolationsList.tsx`, `ui/violations/ViolationItem.tsx`, `ui/controls/ModeToggle.tsx`, `ui/controls/PresetSwitcher.tsx`, `ui/controls/ActionBar.tsx`, `ui/panel/LintPanelHeader.tsx`

## Notes and limitations

- Webflow Designer APIs are expected to provide `getAllElements`, `getAllStyles`, `getStyles`, `getName`, `getProperties`, and `getChildren` where referenced.
