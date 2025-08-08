# ADR-011: UI improvements for compact extension window

## Context

The Webflow extension panel has limited space. We need to optimize the UX to focus on actionable issues and provide a quick way to see passed classes without overwhelming the layout. Remove verbose element context debug info.

## Decision

- ViolationsList now supports a two-tab view: Issues and Passed.
  - Issues: existing accordion list of violations.
  - Passed: compact list of class names that did not produce violations.
- Removed the element context debug block from `ViolationItem` to reduce noise and save space.
- Header shows current opinion mode for clarity.

## Consequences

- Cleaner, focused UI optimized for extension dimensions.
- Quick feedback on both problems and what’s already correct.

## Validation

- Build passes and UI compiles.

## Next Step

Optional: add a preset/mode selector in-panel and remember the selection across sessions.
