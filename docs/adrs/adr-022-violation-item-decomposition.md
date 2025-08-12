# ADR-022: Decompose `ViolationItem` into `ViolationHeader` and `ViolationDetails`

- Status: Accepted
- Date: 2025-08-12
- Supersedes: None

## Context

`src/features/linter/components/ViolationItem.tsx` had grown to encapsulate multiple responsibilities:

- Rendering header information (severity dot/text, name, context/role/unknown badges)
- Rendering details (parsed duplicate/format messages, suggested name, order/combos, highlight action, class badge)

This made the component lengthy and harder to evolve. The UI logic was cohesive but not segmented, which reduced maintainability and discoverability. We wanted to align with Feature-Sliced Design (FSD) while keeping the change minimal, avoiding new utilities or behaviors, and preserving existing contracts.

## Decision

Split `ViolationItem` into two presentational components within the same feature folder:

- `ViolationHeader.tsx`: displays the header row with severity, rule name, and badges.
- `ViolationDetails.tsx`: displays the message body, optional metadata sections, highlight button, and class badge.

Then simplify `ViolationItem.tsx` to compose these two:

- Preserve item id construction and `AccordionItem` shape
- No behavior changes (IDs, highlight behavior, message parsing, styles remain intact)
- Keep files under `features/linter/components/` to minimize churn

## Consequences

- Smaller, clearer files with single responsibilities
- Easier to test and reason about header vs details concerns
- Enables future tweaks (e.g., header badge logic) without touching details rendering
- No impact on services, rules, presets, or stores; UI parity verified by tests

## Notes

- Lints pass and existing tests remain green after the refactor.
- This ADR documents a focused UI decomposition and does not introduce new patterns beyond FSD-aligned component segmentation.
