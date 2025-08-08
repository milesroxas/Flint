---
title: ADR-012 — Remove legacy rule aggregations and deprecated APIs
status: accepted
date: 2025-08-08
---

Context

- We completed the migration to preset-driven rule registration per the unified plan.
- Legacy aggregations `features/linter/rules/default-rules.ts` and `features/linter/rules/context-aware-rules.ts` were retained temporarily and a deprecated `runRulesOnStyles` API remained in `rule-runner.ts`.

Decision

- Delete legacy aggregation files and references.
- Remove deprecated `runRulesOnStyles` and require `runRulesOnStylesWithContext` everywhere.
- Update parity tests to assert preset rule IDs directly.
- Maintain cache invalidation on registry changes; no behavioral change to rules.

Consequences

- Single source of truth for rules via presets (`presets/lumos.preset.ts`, `presets/client-first.preset.ts`).
- Tests and docs updated to avoid drift with removed files.
- Smaller bundle and simpler mental model; no dual paths.

Alternatives considered

- Keep legacy files as shims. Rejected to avoid ongoing maintenance and confusion.
