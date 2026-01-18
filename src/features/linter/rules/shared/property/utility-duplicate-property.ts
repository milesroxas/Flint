import type { ElementAnalysisArgs, RuleResult, StructureRule } from "@/features/linter/model/rule.types";

/**
 * Configuration for utility duplicate property detection.
 */
type UtilityDuplicatePropertyConfig = {
  /** Ignored aliases that are intentionally equivalent */
  ignoredAliases?: string[][];
  /** Minimum class count to report duplicates */
  minClassCount?: number;
  /** Only report single-property utilities */
  onlySingleProperty?: boolean;
  /** Optional list of properties to check */
  propertyAllowlist?: string[];
  /** Properties to skip checking */
  propertyBlocklist?: string[];
};

const DEFAULT_CONFIG: UtilityDuplicatePropertyConfig = {
  ignoredAliases: [],
  minClassCount: 2,
  onlySingleProperty: false, // Allow both single and multi-property duplicate detection
  propertyAllowlist: undefined,
  propertyBlocklist: undefined,
};

/**
 * Rule: flags utility classes that duplicate the same property/value as other utilities.
 * This helps teams identify and consolidate alias utilities.
 */
export const createUtilityDuplicatePropertyRule = (): StructureRule => ({
  id: "canonical:utility-duplicate-property",
  name: "Consolidate duplicate utility properties",
  description:
    "Detects utility classes that declare the same CSS property/value as other utilities. Teams should consolidate aliases to avoid redundancy.",
  category: "structure",
  type: "structure",
  severity: "warning",
  enabled: true,
  targetClassTypes: ["utility"],

  analyzeElement: (args: ElementAnalysisArgs): RuleResult[] => {
    const { classes = [], allStyles = [], getClassType, getRuleConfig } = args;

    // Get rule configuration
    const ruleConfig = getRuleConfig("canonical:utility-duplicate-property");
    const userConfig = ruleConfig?.customSettings || {};

    // Merge with default config
    const config: UtilityDuplicatePropertyConfig = {
      ...DEFAULT_CONFIG,
      ...userConfig,
    };

    // Build a site-wide property map from allStyles for duplicate detection
    const propertyToClassesMap = new Map<string, Map<string, Set<string>>>();

    // Build map of all utility classes and their properties
    for (const style of allStyles) {
      if (!style.name || !style.properties) continue;

      // Only analyze utility classes
      const classType = getClassType(style.name);
      if (classType !== "utility") continue;

      const propEntries = Object.entries(style.properties);

      // Skip if onlySingleProperty is true and this utility has multiple properties
      if (config.onlySingleProperty && propEntries.length !== 1) {
        continue;
      }

      for (const [property, value] of propEntries) {
        // Apply property filters
        if (config.propertyAllowlist && !config.propertyAllowlist.includes(property)) {
          continue;
        }
        if (config.propertyBlocklist?.includes(property)) {
          continue;
        }

        const valueKey = JSON.stringify(value);

        if (!propertyToClassesMap.has(property)) {
          propertyToClassesMap.set(property, new Map<string, Set<string>>());
        }

        const propertyMap = propertyToClassesMap.get(property);
        if (!propertyMap) continue;

        if (!propertyMap.has(valueKey)) {
          propertyMap.set(valueKey, new Set<string>());
        }

        propertyMap.get(valueKey)?.add(style.name);
      }
    }

    const results: RuleResult[] = [];

    // Check each utility class on this element for duplicates
    for (const classItem of classes) {
      const className = classItem.className;
      const classType = getClassType(className);

      // Only analyze utility classes
      if (classType !== "utility") continue;

      // Find the style info for this class
      const styleInfo = allStyles.find((s) => s.name === className);
      if (!styleInfo || !styleInfo.properties) continue;

      const propEntries = Object.entries(styleInfo.properties);
      if (propEntries.length === 0) continue;

      // Skip if onlySingleProperty is true and this utility has multiple properties
      if (config.onlySingleProperty && propEntries.length !== 1) {
        continue;
      }

      // For multi-property utilities, check if entire property set matches others
      if (propEntries.length > 1) {
        // Create a fingerprint of all properties for exact match detection
        const propertyFingerprint = JSON.stringify(
          Object.fromEntries(
            propEntries.sort(([a], [b]) => a.localeCompare(b)) // Sort for consistent comparison
          )
        );

        // Find all utilities with the exact same property set
        const utilitiesWithSameProperties = allStyles
          .filter((s) => s.name && getClassType(s.name) === "utility")
          .filter((s) => {
            if (!s.properties) return false;
            const otherEntries = Object.entries(s.properties);
            if (otherEntries.length !== propEntries.length) return false;

            const otherFingerprint = JSON.stringify(
              Object.fromEntries(otherEntries.sort(([a], [b]) => a.localeCompare(b)))
            );
            return otherFingerprint === propertyFingerprint;
          });

        const minClassCountForMulti = config.minClassCount ?? DEFAULT_CONFIG.minClassCount ?? 2;
        if (utilitiesWithSameProperties.length >= minClassCountForMulti) {
          // Remove ignored aliases
          const ignoredAliases = Array.isArray(config.ignoredAliases)
            ? (config.ignoredAliases as string[][])
            : DEFAULT_CONFIG.ignoredAliases || [];
          const filteredUtilities = utilitiesWithSameProperties.filter(
            (s) => !ignoredAliases.some((group) => group.includes(s.name))
          );

          if (filteredUtilities.length >= minClassCountForMulti) {
            // Sort by order to find newest
            filteredUtilities.sort((a, b) => a.order - b.order);
            const newestUtility = filteredUtilities[filteredUtilities.length - 1];

            // Only flag if current utility is the newest
            if (newestUtility.name === className) {
              const oldestUtility = filteredUtilities[0];
              const otherUtilityNames = filteredUtilities.slice(0, -1).map((s) => s.name);

              const propertyList = propEntries
                .map(([prop, val]) => `${prop}: ${typeof val === "string" ? val : JSON.stringify(val)}`)
                .join(", ");

              results.push({
                ruleId: "canonical:utility-duplicate-property",
                name: "Consolidate duplicate utility properties",
                message: `This utility duplicates the complete property set (${propertyList}) provided by ${otherUtilityNames.join(
                  ", "
                )}. Consider using the existing "${oldestUtility.name}" instead.`,
                severity: "warning",
                className,
                isCombo: false,
                metadata: {
                  properties: Object.fromEntries(propEntries),
                  duplicates: otherUtilityNames,
                  canonicalSuggestion: oldestUtility.name,
                  isNewestDuplicate: true,
                  isCompletePropertySetDuplicate: true,
                  allDuplicates: filteredUtilities.map((s) => ({
                    name: s.name,
                    order: s.order,
                  })),
                },
              });

              // Skip individual property checks for multi-property complete duplicates
              break;
            }
          }
        }
      }

      // Check each property/value pair in this utility class (for single-property utilities or partial matches)
      for (const [property, value] of propEntries) {
        // Apply property filters
        if (config.propertyAllowlist && !config.propertyAllowlist.includes(property)) {
          continue;
        }
        if (config.propertyBlocklist?.includes(property)) {
          continue;
        }

        const valueStr = typeof value === "string" ? value : JSON.stringify(value);
        const classesWithSameProperty = propertyToClassesMap.get(property)?.get(JSON.stringify(value));

        const minClassCount = config.minClassCount ?? DEFAULT_CONFIG.minClassCount ?? 2;
        if (!classesWithSameProperty || classesWithSameProperty.size < minClassCount) {
          continue;
        }

        // Get all utility classes with this property/value (including current one)
        const allDuplicateUtilities = Array.from(classesWithSameProperty)
          .filter((cls): cls is string => typeof cls === "string")
          .filter((cls) => getClassType(cls) === "utility");

        if (allDuplicateUtilities.length < minClassCount) {
          continue;
        }

        // Remove ignored aliases
        const ignoredAliases = Array.isArray(config.ignoredAliases)
          ? (config.ignoredAliases as string[][])
          : DEFAULT_CONFIG.ignoredAliases || [];
        const filteredAllDuplicates = allDuplicateUtilities.filter(
          (cls) => !ignoredAliases.some((group) => group.includes(cls))
        );

        if (filteredAllDuplicates.length < minClassCount) {
          continue;
        }

        // Get style info for all duplicates to compare order (creation time)
        const duplicateStyleInfos = filteredAllDuplicates
          .map((cls) => allStyles.find((s) => s.name === cls))
          .filter((s): s is NonNullable<typeof s> => s !== undefined);

        // Sort by order to find newest (highest order = most recently created)
        duplicateStyleInfos.sort((a, b) => a.order - b.order);

        // Only flag the NEWEST utility (last in sorted order)
        const newestStyle = duplicateStyleInfos[duplicateStyleInfos.length - 1];

        // Only create violation if current class is the newest one
        if (newestStyle.name !== className) {
          continue;
        }

        // Use the OLDEST utility as the canonical suggestion
        const oldestStyle = duplicateStyleInfos[0];
        const otherUtilities = duplicateStyleInfos
          .slice(0, -1) // Remove the newest (current) one
          .map((s) => s.name);

        results.push({
          ruleId: "canonical:utility-duplicate-property",
          name: "Consolidate duplicate utility properties",
          message: `This utility duplicates ${property}: ${valueStr} provided by ${otherUtilities.join(
            ", "
          )}. Consider using the existing "${oldestStyle.name}" instead.`,
          severity: "warning",
          className,
          isCombo: false,
          metadata: {
            property,
            value: valueStr,
            duplicates: otherUtilities,
            canonicalSuggestion: oldestStyle.name,
            isNewestDuplicate: true,
            allDuplicates: duplicateStyleInfos.map((s) => ({
              name: s.name,
              order: s.order,
            })),
          },
        });

        // Only report the first duplicate found per utility to avoid noise
        break;
      }
    }

    return results;
  },
});
