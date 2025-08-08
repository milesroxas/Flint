# FlowLint Product & Technical Plan

## 1. Problem Statement
Webflow empowers rapid website creation but lacks guardrails for long-term maintainability. FlowLint prevents technical debt by enforcing naming, structure, and utility standards.

## 2. Solution
- Designer Extension: Real-time linting inside Webflow.
- Standalone App: Full-site audits, historical tracking, CI/CD gating.

## 3. Target Users
Agencies, in-house developers, freelancers.

## 4. Architecture (FSD)
- entities/: Core domain models.
- features/: Business logic (linter, rules, presets).
- processes/: Cross-feature workflows (scans).
- shared/: Utils and types.

## 5. Roadmap
Phase 1: Lumos preset, page/element scans.
Phase 2: Client-First preset, context-aware rules.
Phase 3: Standalone app with dashboards, API integration.

## 6. Success Metrics
Adoption, Quality Impact, Retention, Conversion, Agency penetration.

---
