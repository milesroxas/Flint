# ADR-021: FSD refactor of linter UI and state

- Status: Accepted
- Date: 2025-08-12
- Supersedes: None

## Context

The linter feature UI mixed concerns: `PageLintSection` rendered both page and element results and owned the mode switch, while `LintPanel` duplicated an element-only view. This created naming confusion, redundancy, and made future views harder to add. State was asymmetric: page used a Zustand store, element used a custom hook.

Constraints:

- Keep minimal UI change and avoid redundant code.
- Follow Feature-Sliced Design (FSD) for scalability.
- Preserve existing services, presets, rules, and grammar/roles.

## Decision

Adopt an FSD-aligned structure separating containers (view), presentational UI, and stores:

- `features/linter/view/LinterPanel.tsx`: single container orchestrating view mode (page/element), banners, toolbar, and rendering shared UI.
- `features/linter/ui/*`: presentational components grouped as of ADR‑023:
  - `ui/controls/*` (`ModeToggle`, `PresetSwitcher`, `ActionBar`, `LintPageButton`)
  - `ui/violations/*` (`ViolationsList`, `ViolationsSection`, `ViolationItem`, `ViolationHeader`, `ViolationDetails`)
  - `ui/panel/*` (`LintPanelHeader`)
- `features/linter/store/elementLint.store.ts`: new Zustand store mirroring `pageLint.store.ts` shape and semantics, replacing the bespoke `useElementLint` logic. A compatibility re-export is provided at `hooks/useElementLint.ts`.

The entry UI uses `LinterPanel` instead of `PageLintSection`.

## Consequences

- Clear responsibilities and naming; no duplicated element panel logic.
- Consistent state contracts for page and element flows using Zustand, simplifying composition and future selectors.
- Future views (e.g., site-wide or rule-centric) can be added by extending `LinterPanel` without touching shared UI.

## Follow-ups

- Consider relocating remaining components from `features/linter/components/` to `features/linter/ui/` for full alignment.
- Update module READMEs to reflect new locations (tracked below). Initial updates performed in `src/features/linter/README.md`, `docs/guides/architecture.md`, and `docs/guides/how-it-all-works.md`.
