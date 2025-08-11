# ADR-015: Context Classifier configurability and Combo detection alignment with Webflow

## Status

Accepted — 2025-08-11

## Context

- The original context classifier only emitted `componentRoot` and inferred roots when any ancestor matched container patterns.
- The system relied on naming conventions (`is-`) to identify combo classes, which can diverge from Webflow’s canonical definition.
- We introduced Lumos-specific behavior (e.g., only first custom gets custom‑naming checks) and needed to ensure Client‑first remained unaffected.

## Decision

- Enhance the element context classifier with preset‑tunable options via `ElementContextConfig`:
  - `requireDirectParentContainerForRoot` (default true): root requires its immediate parent to match container patterns; when false, any ancestor suffices.
  - `childGroupRequiresSharedTypePrefix` (default true): child group must share the same type prefix token as the nearest root wrap.
  - `typePrefixSeparator` (default `_`) and `typePrefixSegmentIndex` (default 0) control tokenization.
- Detect combo classes using Webflow’s `style.isComboClass()` when available, falling back to the `is-` prefix otherwise. Store the result on `StyleInfo.isCombo` and prefer it throughout the runner.
- Scope Lumos‑specific rule behavior by ID prefix: in the runner, skipping custom naming rules for non‑base customs applies only to rules whose IDs start with `lumos-`.

## Consequences

- Presets can alter context semantics without duplicating classifier logic.
- Combo detection is authoritative to Webflow when possible; naming fallback maintains compatibility.
- Client‑first behavior remains unchanged; Lumos refinements are isolated to `lumos-*` rules.

## Alternatives Considered

- Duplicating classifiers per preset: rejected to avoid drift and code duplication.
- Hardcoding `is-` for combos: rejected to align with official Webflow API behavior.

## Implementation Notes

- Files: `src/entities/element/model/element-context.types.ts`, `src/entities/element/model/element-context-classifier.ts`, `src/entities/style/model/style.service.ts`, `src/features/linter/services/rule-runner.ts`.
- README updates reflect API‑based combo detection and new contexts.
