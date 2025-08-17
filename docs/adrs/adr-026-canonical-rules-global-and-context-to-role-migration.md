# Canonical Element Rules Registered Globally; Context-Aware Rules Migrated to Role-Gated Element Analysis

## Status

Accepted

## Context

- Prior to canonical roles, we introduced Context-Aware rules that gated execution using `ElementContext` (e.g., `componentRoot`, `childGroup`).
- With the canonical roles detection layer in place (see ADR-025), structural correctness should be enforced via canonical roles and the element graph, independent of preset naming.
- Element-scope canonical rules were previously registered only in the Lumos preset, despite documentation stating they are preset-agnostic.
- Several context-aware rules overlapped with canonical intent or relied on element context when role/graph signals were available.

## Decision

- Register canonical element rules globally during registry initialization so they apply to all presets:
  - `canonical:section-parent-is-main`
  - `canonical:component-root-structure`
  - `canonical:childgroup-key-match`
- Remove canonical element rules from preset files (e.g., `lumos.preset.ts`) to avoid duplication and ensure preset-agnostic behavior.
- Migrate selected context-aware rules to role-gated element-level analysis using `analyzeElement` with `getRoleForElement`, `allStyles`, and graph helpers:
  - `component-root-no-display-utilities`: role `componentRoot`, flag utilities that set `display`.
  - `cf-no-utilities-on-root`: role `componentRoot`, flag any `u-*` class.
  - `cf-containers-clean`: role `componentRoot`, flag spacing utilities via actual computed properties (padding/margin/gap).
  - `cf-no-padding-on-inner`: role `childGroup`, flag padding utilities via computed properties.
  - `component-root-semantic-naming`: suggest on role `componentRoot` only when naming fails validation.
- Remove the redundant `cf-inner-wrapper-recommended` rule (superseded by canonical structural guidance).

## Consequences

- Canonical rules now execute consistently across presets, matching the PRD/ADR-025 intent of preset-agnostic structural enforcement.
- Context-aware rules no longer rely on `ElementContext` gating for these cases; they use canonical roles and `analyzeElement`, reducing false positives and preset coupling.
- The Lumos and Client-First presets retain their naming/format/property rules where they are truly preset-specific.
- No UI changes were required; the panel continues to show role and context badges, while violations generated from `analyzeElement` carry `metadata.role` and optional `context` for grouping.

## Related

- ADR-025: Canonical roles, detection layer, and page rules
- Rules and files updated:
  - Global registration: `src/features/linter/services/registry.ts`
  - Preset cleanup: `src/presets/lumos.preset.ts`, `src/presets/client-first.preset.ts`
  - Role-gated rules:
    - `src/features/linter/rules/role-aware/component-root-no-display-utilities.ts`
    - `src/features/linter/rules/role-aware/cf-no-utilities-on-root.ts`
    - `src/features/linter/rules/role-aware/cf-containers-clean.ts`
    - `src/features/linter/rules/role-aware/cf-no-padding-on-inner.ts`
    - `src/features/linter/rules/role-aware/component-root-semantic-naming.ts`
  - Removed: `src/features/linter/rules/context-aware/*`
