// src/features/linter/rules/shared/property/utility-duplicate-properties.ts
import type {
  Rule,
  RuleResult,
  RuleContext,
  Severity,
} from "@/features/linter/model/rule.types";

type DuplicateRuleConfig = {
  reportExactMatches?: boolean;
  reportPropertyDuplicates?: boolean;
  ignoreClasses?: string[];
  minSharedPropsForExact?: number; // default 1
};

const SEVERITY: Severity = "warning"; // align with your rule.severity

export const createUtilityDuplicatePropertiesRule = (): Rule => ({
  id: "utility:duplicate-properties",
  name: "Utility duplicate properties",
  description:
    "Flags exact duplicates of utility classes and per-property duplication across utilities.",
  category: "maintainability",
  type: "property",
  severity: SEVERITY,
  enabled: true,
  targetClassTypes: ["utility"],

  analyze(
    className: string,
    properties: Record<string, unknown>,
    context: RuleContext & { config?: DuplicateRuleConfig }
  ): RuleResult[] {
    const cfg = context.config ?? {};
    const reportExact = cfg.reportExactMatches !== false;
    const reportProps = cfg.reportPropertyDuplicates !== false;
    const ignore = new Set(cfg.ignoreClasses ?? []);
    const minShared = Math.max(cfg.minSharedPropsForExact ?? 1, 1);

    if (ignore.has(className)) return [];

    // Use passed-in `properties` so the parameter is meaningful
    const serialize = (k: string, v: unknown) =>
      `${k}:${typeof v === "string" ? v : JSON.stringify(v)}`;

    const thisPropKeys = new Set<string>(
      Object.entries(properties ?? {}).map(([k, v]) => serialize(k, v))
    );

    // Build class -> Set<propKey> from your propertyToClassesMap (declared in RuleContext)
    const propToClasses =
      context.propertyToClassesMap ?? new Map<string, Set<string>>();
    const classToPropKeys = new Map<string, Set<string>>();
    for (const [propKey, classes] of propToClasses) {
      for (const cn of classes) {
        let set = classToPropKeys.get(cn);
        if (!set) {
          set = new Set<string>();
          classToPropKeys.set(cn, set);
        }
        set.add(propKey);
      }
    }

    const results: RuleResult[] = [];

    // Exact duplicate detection
    if (reportExact && thisPropKeys.size >= minShared) {
      const exactMatches: string[] = [];
      for (const [other, keys] of classToPropKeys) {
        if (other === className || ignore.has(other)) continue;
        if (keys.size !== thisPropKeys.size) continue;

        let equal = true;
        for (const k of thisPropKeys) {
          if (!keys.has(k)) {
            equal = false;
            break;
          }
        }
        if (equal) exactMatches.push(other);
      }

      if (exactMatches.length) {
        results.push({
          ruleId: "utility:duplicate-properties",
          name: "Utility duplicate properties",
          message: `This class has an identical set of utility properties as: ${exactMatches.join(
            ", "
          )}. Consolidate these utilities.`,
          severity: SEVERITY,
          className,
          isCombo: false,
          metadata: {
            exactMatches,
            properties: Array.from(thisPropKeys),
          },
        });
      }
    }

    // Per-property duplication
    if (reportProps) {
      const dupDetails: Array<{ propKey: string; classes: string[] }> = [];

      for (const key of thisPropKeys) {
        const classes = propToClasses.get(key);
        if (!classes) continue;
        const others = Array.from(classes).filter(
          (c) => c !== className && !ignore.has(c)
        );
        if (others.length) dupDetails.push({ propKey: key, classes: others });
      }

      if (dupDetails.length) {
        const firstTwo = dupDetails
          .slice(0, 2)
          .map((d) => d.propKey)
          .join(", ");
        const more = Math.max(dupDetails.length - 2, 0);

        results.push({
          ruleId: "utility:duplicate-properties",
          name: "Utility duplicate properties",
          message:
            dupDetails.length === 1
              ? `This class duplicates utility property ${
                  dupDetails[0].propKey
                } used in: ${dupDetails[0].classes.join(
                  ", "
                )}. Prefer a single utility per property.`
              : `This class duplicates multiple utility properties (${firstTwo}${
                  more ? `, +${more} more` : ""
                }). Consolidate where possible.`,
          severity: SEVERITY,
          className,
          isCombo: false,
          metadata: { duplicateProperties: dupDetails },
        });
      }
    }

    return results;
  },
});
