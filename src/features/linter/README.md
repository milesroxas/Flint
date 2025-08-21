## Webflow Designer Linter

A linting system for Webflow Designer that validates class naming, flags duplicate utility properties, and applies context-aware rules to elements within the current page or the currently selected element. This document reflects the current implementation across services, rules, UI, and state.

### Key capabilities

- **Class type detection**: custom, utility, combo (combo prefers Webflow API `style.isComboClass()` with fallback to `is-` prefix)
- **Naming validation**: format rules for each class type
- **Duplicate detection**: exact duplicate utility detection (full property set). Overlap-only checks are disabled by default.
- **Canonical roles + graph**: rules analyze elements using detected roles and element graph helpers
- **Role identification**: parses the first custom class using a preset GrammarAdapter and maps it to an ElementRole via a RoleResolver (e.g., title, text, actions, container). Services attach `metadata.role` on violations for UI badges.
- **Config persistence**: per-rule settings merged from schemas and stored in localStorage
- **Structural element linting**: when enabled, analyzes the selected element and all its descendants using the same logic as page scans

## Class types and conventions

- **custom**: underscore-separated, lowercase alphanumeric, 2–3 segments
- **utility**: starts with `u-`, dash-delimited
- **combo**: starts with `is-`, dash-delimited (or flagged by Webflow API)

The rule runner derives `ClassType` from the name/prefix; combo classification piggybacks on the `isCombo` flag from the Style Service.

## Roles and element graph

Roles are computed via `services/role-detection.service.ts` using the active preset's grammar and detectors. Canonical element rules use `getRoleForElement`, `getParentId`, `getChildrenIds`, and `getAncestorIds` from services to analyze structure.

## Architecture overview

### Services (in `features/linter/services/`) ✨ **Context Service Architecture**

- **`lint-context.service.ts`** 🆕

  - **Shared context builder** that consolidates all bootstrap logic (200+ lines of redundancy removed)
  - Creates page contexts with intelligent DJB2-hashed caching for performance
  - Supports both isolated element contexts and rich page contexts for future context-aware linting
  - Handles preset resolution, style collection, parent relationships, role detection, and element graph creation
  - **Structural element contexts**: builds subtree-based contexts from selected element boundary, fetches real styles for all descendants

- **`element-lint-service.ts`** ✨ _Enhanced with Structural Mode_

  - Streamlined from 104 to 49 lines by delegating bootstrap logic to context service
  - **Structural mode**: when enabled, collects styles from selected element + all descendants via graph traversal
  - **Standard mode**: analyzes only the selected element (original behavior)
  - Enhanced API: `lintElement(element, pageContext?, useStructuralContext)` supports structural subtree analysis
  - Focuses purely on element-specific linting logic

- **`page-lint-service.ts`** ✨ _Simplified (77% reduction)_

  - Streamlined from 200 to 45 lines by delegating bootstrap logic to context service
  - All caching and optimization handled by shared context service

- **`lightweight-context.service.ts`** 🆕 _Structural Element Support_

  - Creates subtree contexts starting from selected element as component boundary
  - Gathers all descendants via `getChildren()` API and builds parent-child maps
  - Provides `elementById` lookup for style resolution and `getDescendantIds` for complete subtree coverage
  - Enables structural role detection within element boundaries

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
  - **Structural support**: receives styles for all subtree elements, enabling child-group rules to run on descendants

- **`linter-service-factory.ts`** ✨ _Enhanced_

  - Now creates and exposes the shared `contextService` for future use
  - Maintains zero breaking changes while preparing for context-aware features

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
  - **Canonical**: `rules/canonical/*` - structural rules like `child-group-key-match` that analyze element hierarchies

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
- `ui/controls/StructuralContextToggle.tsx`: toggle for structural context in element mode - enables subtree analysis vs. single-element analysis.
- `ui/controls/PresetSwitcher.tsx`: preset picker wired to registry re-init and cache reset.
- `ui/controls/ActionBar.tsx` and `ui/controls/LintPageButton.tsx`: bottom toolbar and primary actions.
- `ui/panel/LintPanelHeader.tsx` (LintSummary): shared header for counts and roles.

#### Hooks

- `hooks/useElementLint.ts`: re-exports the new Zustand store hook for backward compatibility.
- `hooks/usePageLint.ts`: thin wrapper around the page store.

#### Store

- `store/usePageLintStore.ts`: Zustand store exposing `lintPage`, results, and status.
- `store/elementLint.store.ts`: Zustand store for selected-element lint; mirrors page store state shape and provides `refresh` and `structuralContext` toggle.

## Runtime flows ✨ **Updated with Context Service and Structural Element Linting**

- **Selected element lint**

  - `ElementLintService.lintElement()` uses shared `LintContextService` for consistent bootstrap
  - **Standard mode**: analyzes only the selected element (original behavior)
  - **Structural mode**: creates subtree context from selected element boundary, fetches styles for all descendants
  - Context service handles all complexity: preset resolution, style collection, role detection, graph creation
  - Optional page context parameter enables future context-aware element linting
  - Intelligent caching avoids redundant computation when scanning multiple elements

- **Full page lint**
  - `PageLintService.lintCurrentPage()` delegates to shared `LintContextService` for page context creation
  - Context service creates comprehensive page context with DJB2-hashed signature caching
  - All services now use the same bootstrap logic with zero code duplication
  - Future context-aware features can leverage rich page context across all services

## Configuration

- Rule registration seeds defaults from each rule's `config` schema
- `RuleConfigurationService` stores enabled set and `ruleConfigs` keyed by `ruleId`
- Loading merges stored values with schema defaults and drops unknown keys
- The global registry loads and applies persisted configs during initialization

## Rule execution details

- Class type detection: resolved by the active grammar via a resolver passed into the rule runner (`utility`, `combo`, else `custom`); when the resolver is unavailable the runner falls back to the previous `u-`/`is-` heuristic
- Naming rule execution order: `evaluate` (if present) else `test`
- Utility duplicate handling: single-property exact matches include formatted metadata consumed by the UI
- **Structural element rules**: receive styles for all subtree elements, enabling rules like `canonical:child-group-key-match` to analyze nested children
- Results include: rule identifiers, severity (effective from configuration), class name, optional `metadata`

## UI behavior specifics

- Violations list auto-expands when there is exactly one violation
- Duplicate utility issues display structured properties with expandable lists of other classes that share those properties
- Badges highlight unrecognized elements (from metadata) and the presence of an element context
- Labels for contexts and roles are centralized in `lib/labels.ts`
- Clipboard copy badges avoid timers and reflect state until the next interaction
- **Structural toggle**: in element mode, shows "Structure" toggle that enables/disables subtree analysis

### Highlight behavior

- Page mode: when a violation accordion item is opened, the extension automatically highlights the corresponding Designer element using `selectElementById` (falls back to the `flowlint:highlight` custom event when the Designer API is unavailable).
- The manual "Highlight element" button remains available in each violation item.

## File map (key files)

- `services/element-lint-service.ts`, `services/utility-class-analyzer.ts`, `services/rule-runner.ts`
- `services/rule-registry.ts`, `services/rule-configuration-service.ts`, `services/registry.ts`
- `services/lightweight-context.service.ts`, `services/lint-context.service.ts`
- `entities/style/model/style.service.ts`
- `rules/*` (naming, property, context-aware, canonical)
- `hooks/useElementLint.ts`, `hooks/usePageLint.ts`
- `store/usePageLintStore.ts`, `store/elementLint.store.ts`
- `view/LinterPanel.tsx`, `ui/controls/LintPageButton.tsx`, `ui/controls/StructuralContextToggle.tsx`, `ui/violations/ViolationsList.tsx`, `ui/violations/ViolationItem.tsx`, `ui/controls/ModeToggle.tsx`, `ui/controls/PresetSwitcher.tsx`, `ui/controls/ActionBar.tsx`, `ui/panel/LintPanelHeader.tsx`

## Notes and limitations

- Webflow Designer APIs are expected to provide `getAllElements`, `getAllStyles`, `getStyles`, `getName`, `getProperties`, and `getChildren` where referenced.
- **Structural element linting**: requires `getChildren()` API to work properly for subtree traversal. Falls back to single-element analysis if structural context creation fails.
