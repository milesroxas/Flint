import { convertColorToHex } from "@/features/linter/lib/color-utils";
import type { PropertyRule, RuleConfigSchema, RuleContext, RuleResult } from "@/features/linter/model/rule.types";

interface ColorVariableConfig {
  targetProperties: string[];
}

const colorVariableConfigSchema: RuleConfigSchema = {
  targetProperties: {
    label: "Target Color Properties",
    type: "string[]",
    description: "CSS properties that must use color variables",
    default: ["background-color", "color"],
  },
};

const DEFAULT_CONFIG: ColorVariableConfig = {
  targetProperties: ["background-color", "color"],
};

/**
 * Checks if a property value is a Webflow color variable.
 * Variables are represented as objects with an "id" field in the properties.
 */
const isColorVariable = (value: unknown): boolean => {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as any).id === "string" &&
    (value as any).id.startsWith("variable-")
  );
};

/**
 * Shared rule: ensures color properties use Webflow variables instead of hardcoded values.
 * Supports configurable list of color properties to check.
 */
export const createColorVariableRule = (): PropertyRule => ({
  id: "shared:property:color-variable",
  name: "Use Color Variables",
  description:
    "Color properties should use Webflow variables instead of hardcoded color values for better maintainability and design system consistency.",
  example: "Use a variable instead of #ff4444",
  severity: "error",
  category: "maintainability",
  type: "property",
  config: colorVariableConfigSchema,
  targetClassTypes: ["custom", "utility", "combo"],
  enabled: true,
  analyze: (
    className: string,
    properties: Record<string, unknown>,
    context: RuleContext & { config?: Record<string, unknown> }
  ): RuleResult[] => {
    try {
      // Merge config with defaults
      const ruleConfig: ColorVariableConfig = {
        ...DEFAULT_CONFIG,
      };

      // Override with custom config if provided
      if (context.config?.targetProperties) {
        ruleConfig.targetProperties = context.config.targetProperties as string[];
      }

      const results: RuleResult[] = [];

      // Check each target property
      for (const propertyName of ruleConfig.targetProperties) {
        const propertyValue = properties[propertyName];

        // Skip if property is not set
        if (propertyValue === undefined || propertyValue === null) {
          continue;
        }

        // Check if the property value is NOT a color variable
        if (!isColorVariable(propertyValue)) {
          // Only flag if it's a color value (string starting with color formats)
          if (
            typeof propertyValue === "string" &&
            (propertyValue.startsWith("hsla(") ||
              propertyValue.startsWith("rgba(") ||
              propertyValue.startsWith("rgb(") ||
              propertyValue.startsWith("hsl(") ||
              propertyValue.startsWith("#") ||
              /^[a-z]+$/i.test(propertyValue)) // named colors like 'red', 'blue'
          ) {
            results.push({
              ruleId: "shared:property:color-variable",
              name: "Use Color Variables",
              message: `Property "${propertyName}" uses hardcoded color "${convertColorToHex(
                propertyValue
              )}". Consider using a Webflow color variable for better maintainability.`,
              severity: "warning",
              className,
              isCombo: false, // Will be set correctly by the rule runner
              metadata: {
                propertyName,
                currentValue: convertColorToHex(propertyValue),
                suggestion: "Replace with a Webflow color variable",
              },
            });
          }
        }
      }

      return results;
    } catch (error) {
      console.error(`Error analyzing color variables for class "${className}":`, error);
      return [];
    }
  },
});
