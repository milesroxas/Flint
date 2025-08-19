# ADR-019: Auto-highlight violation element on accordion open (Page mode)

Date: 2025-08-11

## Status

Accepted

## Context

Users reviewing page-wide violations frequently click into a violation and immediately click the highlight button to find the element in Webflow Designer. This is a repetitive action that can be streamlined without changing the underlying contracts. We already expose a safe element selection helper (`selectElementById`) with a Designer API path and a fallback custom event (`flowlint:highlight`).

## Decision

- In page view, when a violation accordion item is opened, automatically trigger highlight of the corresponding element using `selectElementById(violation.elementId)`.
- Keep the existing manual "Highlight element" button for explicit user control.
- Scope the behavior to page mode only by reusing the existing `showHighlight` flag passed from `PageLintSection` → `ViolationsList`.

## Consequences

- Reduces clicks during page audits while preserving explicit controls.
- No API contract changes: relies on existing `elementId` and selection helper.
- Fallback remains intact when Designer APIs are unavailable.

## Affected Files

- `src/features/linter/ui/violations/ViolationsList.tsx` (added `onValueChange` to auto-highlight newly opened items in page mode)

## Alternatives Considered

- Adding per-item toggles/preferences: rejected to keep the UX minimal and aligned with current patterns.
- Global setting to opt out: deferred until there is user demand.

## Validation

- Build passes; manual verification confirms that opening a violation item in page mode triggers element selection/highlight via the Designer API (or dispatches the fallback event when unavailable).
