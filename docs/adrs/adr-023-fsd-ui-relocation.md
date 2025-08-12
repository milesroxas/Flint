---
title: Relocate shared primitives to src/shared/ui and feature UI to src/features/linter/ui
status: Accepted
date: 2025-08-12
---

## Context

The list of UI components has grown and will continue to expand. We need a clear Feature‑Sliced Design (FSD) placement to keep shared primitives separate from feature‑specific UI and to stabilize import paths.

Constraints:

- Path aliasing uses `@/* → src/*`.
- Existing code imported shared primitives from `@/components/ui/*` and linter feature UI from `src/features/linter/ui/*` (formerly `components/`).
- We do not modify past ADRs; we document new decisions in new ADRs.

## Decision

- Move shared, reusable UI primitives from `src/components/ui/*` to `src/shared/ui/*`.
- Move app‑shell `Header` to `src/app/ui/Header.tsx`.
- Keep feature UI under `src/features/linter/ui/*`.
- Update imports across the codebase to reference `@/shared/ui/*` and `@/app/ui/Header`.
- Update `components.json` aliases to:
  - `components: "@/shared"`
  - `ui: "@/shared/ui"`

## Consequences

- All references to `@/components/ui/*` are replaced with `@/shared/ui/*`.
- `Header` now imports from `@/app/ui/Header` in `src/index.tsx`.
- Documentation and READMEs are updated to reference `src/shared/ui` and `src/features/linter/ui`.
- Previous ADRs that mention old paths remain historical; this ADR records the relocation.

## Affected Code

- Moved:
  - `src/components/ui/*` → `src/shared/ui/*`
  - `src/components/Header.tsx` → `src/app/ui/Header.tsx`
- Updated imports in linter UI files under `src/features/linter/ui/*` and in `src/index.tsx`.
- Updated `components.json` aliases.

## Alternatives Considered

- Leave shared primitives under `src/components/ui`. Rejected to align with FSD’s `shared/ui` convention and avoid ambiguity with feature components.

## Follow‑ups

- None currently. Future shared widgets can live under `src/widgets/*` if needed.

