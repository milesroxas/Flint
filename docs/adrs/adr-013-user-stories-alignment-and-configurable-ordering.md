# ADR-013: Align linter with User Stories; add configurable ordering and combo limits

## Status

Accepted

## Context

The `docs/guides/user-stories.md` identified UX requirements:

- Show suggested corrected name for format errors
- Support highlighting the offending element
- Report combo class count and ordering (after base custom), with limit display
- Keep configurability and preset switching (Lumos/Client‑first) intact

The current implementation had partial coverage (unknown element warnings, duplicate utilities) but lacked suggestion metadata, explicit element‑level ordering/limit checks wired through the registry, and a highlight action.

## Decision

- Add minimal, non‑breaking enhancements:

  - Lumos custom class rule now includes `metadata.suggestedName` when a safe correction is derivable.
  - New Lumos naming rules (config seeds) registered via preset, evaluated in runner:
    - `lumos-utilities-after-custom-ordering`
    - `lumos-combos-after-custom-ordering`
    - `lumos-combo-class-limit` (with `maxCombos` option; default 2)
  - Runner emits these as violations based on element class order; violations include `metadata.elementId`.
  - UI renders suggested names, ordered combo list with limit, and a "Highlight element" button.
  - Empty class wording aligned with user story.
  - Page lint path hardened: only Designer elements with `getStyles()` are scanned; IDs normalized for highlight.

- Preserve core configurability:
  - New rules are registered only in `lumos` preset; switching to `client-first` remains unaffected.
  - Rule enablement, severity, and `maxCombos` are controlled via the existing registry and persisted configuration service.
  - Opinion modes continue to apply post‑registration.

## Consequences

- User stories are satisfied with minimal edits and no changes to existing rule IDs/messages.
- Preset switching and user overrides keep working; no coupling to a specific framework beyond preset composition.

## Alternatives Considered

- Implementing ordering checks as separate property rules: rejected to avoid redundant property plumbing; the logic depends on per‑element class order available in the runner.

## Validation

- Manual checks across both presets:
  - Lumos: format error shows suggestion; ordering/limit rules fire and can be muted via config.
  - Client‑first: behavior unchanged.
  - Page lint no longer logs "Element does not have getStyles method"; highlight works when Designer API is available and falls back to a custom `flowlint:highlight` event.
