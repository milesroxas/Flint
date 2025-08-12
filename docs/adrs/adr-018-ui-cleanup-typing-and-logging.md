# ADR-018: UI cleanup, typing hardening, and logging policy

Date: 2025-08-11

## Status

Accepted

## Context

The UI layer contained some technical debt that impacted scalability and clarity:

- CommonJS `require` in ESM React code for optional cache reset
- Console logging without environment gating in UI components
- Repeated label-formatting logic across components
- Loose typing in UI (double `unknown` casts) and severity casting
- `setTimeout` timers in the copy-to-clipboard UX contrary to team guidance
- Minor inconsistency using raw `<button>` over shared `Button` and ad-hoc class concatenation

## Decision

We made small, targeted edits to remove the debt while preserving behavior:

- Replace `require()` with dynamic `import()` in `PresetSwitcher` for style cache reset
- When preset changes, automatically re-lint the current view (page or element) by wiring `PresetSwitcher` → `ActionBar` → current view lint action
- Gate UI console logs with `import.meta.env.DEV` in `ExtensionWrapper` and `ViolationItem`
- Centralize label formatting in `src/features/linter/lib/labels.ts` and reuse
- Tighten types in UI by removing `unknown` casts and using domain unions
- Narrow `Badge` severity type and remove casts
- Remove `setTimeout`-based auto-reset in `Badge` copy UX; keep state until next interaction
- Use shared `Button` in `ModeToggle` for styling/accessibility
- Use `cn()` instead of template concatenation for `LintPageButton`

## Consequences

- Cleaner, strictly-typed UI; easier to maintain and extend
- No change to public API; behavior preserved with reduced console noise in prod
- Slightly improved accessibility and consistency across controls
- Preset switching now immediately reflects results under the new preset without extra clicks

## Affected Files

- `src/features/linter/ui/controls/PresetSwitcher.tsx`
- `src/features/window/components/ExtensionWrapper.tsx`
- `src/features/linter/ui/violations/ViolationItem.tsx`
- `src/shared/ui/badge.tsx`
- `src/features/linter/ui/controls/ModeToggle.tsx`
- `src/features/linter/ui/controls/LintPageButton.tsx`
- `src/features/linter/ui/panel/LintPanelHeader.tsx`
- `src/features/linter/lib/labels.ts` (new)

## Alternatives Considered

- Introducing a logger utility; deferred to keep changes minimal
- Debouncing/collapsing clipboard toasts; deferred until needed
