# PRD: Canonical Roles, Detection Layer, and Role-Driven Rules

## 1. Overview

Refactor the linter to use a stable, preset-agnostic ontology of element roles, a preset-aware detection layer, and a rule layer that validates structure using those roles. This aligns the current codebase with the provided design document, while preserving performance and developer ergonomics inside Webflow Designer.

## 2. Problem Statement

Rules and UI currently infer structure from naming and scattered context. This mixes preset logic with validation, reduces testability, and makes support for multiple presets brittle. We need a clear separation of concerns so rules operate on canonical roles, while preset naming lives in a thin detection layer.

## 3. Vision

A reliable, extensible Webflow Designer linter that:

- Understands site structure via canonical roles.
- Supports Lumos, Client-First, and custom presets by swapping detectors, not rules.
- Produces consistent, fast results in both element and page scans.
- Is fully typed, factory-based, and straightforward to test.

## 4. Goals

- Define and adopt canonical roles: `main`, `section`, `componentRoot`, `childGroup`, with `container`, `layout`, `content` staged next.
- Build a preset-aware, score-based detector service that outputs `rolesByElement`.
- Update rule runner to consume roles instead of preset grammar.
- Implement core structural rules for the four canonical roles.
- Share one bootstrap and caching strategy for page and element scans.
- Improve testability with positive, negative, and conflict tests per role.

### Non-Goals

- Visual editor changes beyond current notifications and highlight patterns.
- Deep semantic analysis of content beyond class naming and element graph.
- Full accessibility audits.

## 5. Users and Use Cases

- Webflow developers using Lumos, Client-First, or custom conventions.
- Teams auditing page structure consistency and preventing technical debt.
- New developers onboarding to an existing project with defined presets.

## 6. Scope

- Type-safe services implemented as factory functions.
- Integration with Webflow Designer Extension APIs for elements, styles, and notifications.
- Role detection, rule runner extensions, structural rules, stores, and caching.

### Out of Scope

- Standalone web app features and cross-site historical reports.
- Non-Designer environments.

## 7. Functional Requirements

1. **Canonical ontology**

   - Roles: `main`, `section`, `componentRoot`, `childGroup` are first-class in types.
   - Future roles staged: `container`, `layout`, `content`.

2. **Detection layer**

   - Per-preset grammar adapter parses class names to tokens.
   - Small, composable detectors emit role candidates with scores 0 to 1.
   - Threshold-based selection, singleton enforcement for `main`.
   - Uses element graph signals: tag name, class tokens, ancestry.

3. **Rule layer**

   - Rules consume `rolesByElement` and element graph. No preset logic inside rules.
   - Core rules:

     - `main` singleton and content constraints.
     - `section` parent must be `main`. First meaningful child should be `container`, `layout`, or `componentRoot`.
     - `componentRoot` must be descendant of `section`. Must contain `layout`, `content`, or `childGroup`.
     - `childGroup` must share component key with nearest `componentRoot` ancestor. Avoid utility-only.

4. **API surface**

   - `createRoleDetectionService().detectRolesForPage(pairs) -> rolesByElement`.
   - `createRuleRunner().runRulesOnStylesWithContext(styles, contextsMap, allStyles, rolesByElement)`.
   - Page and element lint services compute or reuse `rolesByElement` and pass it to the runner.

5. **Parity**

   - Page scan and element scan share the same bootstrap, grammar, detectors, and caches where sensible.

6. **Stores and UX**

   - Element selection and page scan code paths both enrich results with role context.
   - Errors surfaced via Designer notifications with actionable messages.

## 8. Non-Functional Requirements

- **Performance**: Page scan of 500 elements completes within 250 ms on a typical project in local testing. Element scan completes within 80 ms.
- **Determinism**: Given the same DOM and styles, detection and rule outcomes are stable.
- **Type safety**: Full TypeScript coverage for services, detectors, rules, and stores.
- **Factory pattern**: All services exposed as factory functions to enable injection and testing.
- **Caching**: Page signature hashing for role and context caches. No stale reuse with element count changes only.
- **Logging**: Structured logs in development mode for detector scores and rule decisions.

## 9. Success Metrics

- Classification precision for curated fixtures of Lumos and Client-First: ≥ 95% for the four initial roles.
- Page and element scan parity tests pass on all fixtures.
- CPU time for scans within the performance budgets above.
- Zero runtime type errors in integration tests.
- Reduction in false positives from structure rules by at least 50% compared to pre-refactor baselines.

## 10. Milestones

1. **Types and scaffolding**
   ElementRole update, new detector and role service, runner signature extension.

2. **Detectors**
   Implement detectors for `main`, `section`, `componentRoot`, `childGroup`. Add singleton enforcement.

3. **Rules**
   Implement the four core structural rules. Add page-scope aggregation if needed.

4. **Integration**
   Wire roles into page and element lint services. Add caching by page signature. Unify bootstrap.

5. **Tests and fixtures**
   Add positive, negative, conflict tests per role and cross-role tests. Add real-world fixture snapshots for Lumos and Client-First.

6. **Polish**
   Developer logs, UX messages, and documentation.

## 11. Acceptance Criteria

- **Ontology**

  - `ElementRole` includes `main`, `section`, `componentRoot`, `childGroup`. Staged roles defined and reserved in types.

- **Detection**

  - `detectRolesForPage` returns a role for every element id. Unknown when below threshold.
  - Singleton `main` enforced. If multiple candidates, highest score wins and others demoted to unknown.
  - Detectors use tag, class tokens, and ancestry signals. No rule logic inside detectors.
  - Implemented for Lumos and Client-First. A “Custom” preset path exists with scaffolding tests.

- **Rule Runner**

  - Runner accepts `rolesByElement`. Rules can call `getRoleForElement(elementId)`.
  - No preset parsing inside rules. Only canonical roles and graph checks.

- **Structural Rules**

  - `main` singleton rule flags duplicates and absence.
  - `main` children rule validates presence of at least one `section` or `componentRoot`.
  - `section` parent rule flags non-`main` parents.
  - `componentRoot` descendant rule ensures it lives under a `section` and contains layout or content or child group.
  - `childGroup` key-matching rule confirms it shares component key with nearest `componentRoot`.

- **Performance**

  - Page and element scans meet the budgets stated in Non-Functional Requirements.

- **Parity**

  - Element scan vs page scan parity tests show identical violations for the same target element.

- **Caching**

  - Page signature hashing implemented using sorted element ids. Cache invalidates when ids change, not only counts.

- **Type Safety**

  - All new services are strictly typed. No `any` in public signatures.

- **Tests**

  - Role tests: positive, negative, conflict for each role.
  - Cross-role tests: `componentRoot` outside section is rejected, `childGroup` key mismatch is rejected, `main` singleton enforcement.
  - Preset fixtures for Lumos and Client-First pass with ≥ 95% role precision.

- **Docs**

  - Developer docs updated to describe canonical roles, detection, rules, and extension points for new presets.

## 12. Test Plan

- **Unit**

  - Detector unit tests with synthetic trees and class names.
  - Rule unit tests with minimal graphs and role maps.

- **Integration**

  - Page scan on curated Lumos and Client-First pages. Snapshot expected roles and violations.
  - Element scan parity for randomly sampled elements from the same page.

- **Performance**

  - Benchmark harness with 100, 250, 500 element pages.

- **Regression**

  - Lockfile snapshots for detector outputs and rule results per fixture.

## 13. Risks and Mitigations

- **Ambiguous naming in the wild**
  Mitigate with a conservative threshold and explicit fallbacks to `unknown`.

- **Preset drift**
  Keep preset logic in small detectors behind a stable GrammarAdapter interface. Version adapters with tests.

- **Performance regressions**
  Enforce budgets in CI with perf tests. Maintain O(n) page detection using a prebuilt parent map.

## 14. Rollout Plan

- Phase 1: Ship detectors and runner changes behind a feature flag. Run both legacy and new paths in development and compare.
- Phase 2: Enable new path by default. Keep legacy path as fallback for one release.
- Phase 3: Remove legacy path once parity checks hold for two consecutive releases.

## 15. Open Questions

- Do we want a page-scope aggregator rule that evaluates multi-element constraints in a single pass to reduce duplicate findings.
- Should threshold be configurable per preset or fixed at 0.6 globally.
- Do we enforce tag constraints in rules or report them as warnings from detectors.

---

If you want, I can generate a matching technical spec with exact TypeScript signatures, minimal detector implementations for Lumos and Client-First, and the four structural rules as ready-to-register modules.
