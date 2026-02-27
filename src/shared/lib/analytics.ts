/**
 * Centralized analytics event catalog.
 * All PostHog tracking calls go through here for consistency and easy maintenance.
 */
import posthog from "posthog-js";

// ─── Linting ──────────────────────────────────────────────────────────────────

export function trackLintPageCompleted(props: {
  preset: string;
  error_count: number;
  warning_count: number;
  suggestion_count: number;
  total_violations: number;
  passed_count: number;
  ignored_count: number;
}) {
  posthog.capture("lint_page_completed", props);
}

export function trackLintElementCompleted(props: {
  preset: string;
  violation_count: number;
  ignored_count: number;
  structural_context: boolean;
}) {
  posthog.capture("lint_element_completed", props);
}

// ─── Mode & Filter ─────────────────────────────────────────────────────────────

export function trackModeSwitched(props: { from_mode: string; to_mode: string }) {
  posthog.capture("mode_switched", props);
}

export function trackSeverityFilterChanged(props: { filter: string }) {
  posthog.capture("severity_filter_changed", props);
}

export function trackStructuralContextToggled(props: { enabled: boolean }) {
  posthog.capture("structural_context_toggled", props);
}

// ─── Presets ───────────────────────────────────────────────────────────────────

export function trackPresetSwitched(props: { from_preset: string; to_preset: string }) {
  posthog.capture("preset_switched", props);
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function trackSettingChanged(props: { setting: string; value: boolean | string }) {
  posthog.capture("setting_changed", props);
}

export function trackWindowPresetChanged(props: { from_preset: string; to_preset: string }) {
  posthog.capture("window_preset_changed", props);
}

// ─── Expanded Views ────────────────────────────────────────────────────────────

export function trackExpandedViewOpened(props: { type: string; source_rule_id?: string }) {
  posthog.capture("expanded_view_opened", props);
}

export function trackExpandedViewClosed(props: { type: string }) {
  posthog.capture("expanded_view_closed", props);
}

// ─── Violations ────────────────────────────────────────────────────────────────

export function trackViolationOpened(props: { rule_id: string; severity: string; class_name?: string }) {
  posthog.capture("violation_opened", props);
}

export function trackThirdPartyListViewed(props: { ignored_count: number }) {
  posthog.capture("third_party_list_viewed", props);
}

// ─── Docs ──────────────────────────────────────────────────────────────────────

export function trackDocsOpened(props: { preset: string }) {
  posthog.capture("docs_opened", props);
}

// ─── Group Identity ─────────────────────────────────────────────────────────────

export function identifySiteGroup(props: { siteId: string; siteName: string; shortName: string }) {
  posthog.group("site", props.siteId, {
    name: props.siteName,
    short_name: props.shortName,
  });
}

export function identifyWorkspaceGroup(props: { workspaceId: string; workspaceSlug: string }) {
  posthog.group("workspace", props.workspaceId, {
    slug: props.workspaceSlug,
  });
}
