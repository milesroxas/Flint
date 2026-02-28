import type { NamingRule, RuleResult } from "@/features/linter/model/rule.types";

/**
 * Client-First: Sections should use `section_[identifier]` format.
 *
 * From the Client-First docs, sections are named `section_[identifier]` using
 * the underscore folder convention. A common mistake is using `section-[identifier]`
 * which makes it look like a utility class instead of a custom section folder.
 *
 * This rule targets utility-classified classes (dash-only) that match the
 * `section-*` pattern and suggests the underscore convention.
 */
const SECTION_DASH_RE = /^section-[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

export const createCFSectionFormatRule = (): NamingRule => ({
  id: "cf:naming:section-format",
  name: "Client-First: Section naming format",
  description:
    "Sections should use the underscore folder convention: section_[identifier]. Avoid section-[identifier] which loses the folder grouping.",
  example: "section_about, section_testimonials, section_hero",
  type: "naming",
  severity: "warning",
  enabled: true,
  category: "format",
  targetClassTypes: ["utility"],

  test: (className: string): boolean => !SECTION_DASH_RE.test(className),

  evaluate: (className: string): RuleResult | null => {
    if (!SECTION_DASH_RE.test(className)) return null;

    // Extract the identifier part after "section-"
    const identifier = className.slice("section-".length);
    const suggested = `section_${identifier}`;

    return {
      ruleId: "cf:naming:section-format",
      name: "Client-First: Section naming format",
      message: `Section class "${className}" uses a dash. Use the folder convention: "${suggested}".`,
      severity: "warning",
      className,
      isCombo: false,
      fix: {
        kind: "rename-class",
        from: className,
        to: suggested,
        scope: "global",
      },
    };
  },
});
