import type {
  Rule,
  RuleResult,
  ClassType,
  Severity,
} from "@/features/linter/model/rule.types";
import type { ElementRole } from "@/features/linter/model/linter.types";

import type { RuleConfigurationService } from "@/features/linter/services/rule-configuration-service";

// Deps injected by the runner
export type ExecutionDeps = {
  getRoleForElement?: (id: string) => ElementRole;
  getClassType: (name: string, isCombo?: boolean) => ClassType;
  suggestName?: (name: string, role?: ElementRole) => string | null;
  ruleConfigService?: RuleConfigurationService;
  resolveSeverity?: (ruleId: string) => Severity | undefined;
};

export type NamingExecInput = {
  elementId?: string;
  className: string;
  isCombo?: boolean;
  comboIndex?: number;
  severityDefault: Severity;
  configForRule?: Record<string, unknown>;
};

export type NamingRule = Extract<Rule, { type: "naming" }>;

export type NamingRuleExecutor = (
  rule: NamingRule,
  input: NamingExecInput,
  deps: ExecutionDeps
) => RuleResult[];

export const createNamingRuleExecutor = (): NamingRuleExecutor => {
  return (rule, input, deps) => {
    const {
      elementId,
      className,
      isCombo,
      comboIndex,
      severityDefault,
      configForRule,
    } = input;
    const { getRoleForElement, getClassType, suggestName, resolveSeverity } =
      deps;

    const role: ElementRole =
      elementId && getRoleForElement
        ? getRoleForElement(elementId) ?? "unknown"
        : "unknown";

    const classType = getClassType(className, isCombo);

    // Most naming rules should ignore utilities
    if (classType === "utility") return [];

    // Normalize severity via injected resolver
    const severity: Severity = resolveSeverity?.(rule.id) ?? severityDefault;

    // Preferred rich API
    if ("evaluate" in rule && typeof rule.evaluate === "function") {
      const evaluated = rule.evaluate(className, {
        allStyles: [],
        utilityClassPropertiesMap: new Map(),
        propertyToClassesMap: new Map(),
        config: configForRule,
      });
      if (evaluated) {
        const result: RuleResult = {
          // ensure required RuleResult fields are present
          ruleId: evaluated.ruleId ?? rule.id,
          name: evaluated.name ?? rule.name,
          message: evaluated.message ?? rule.description,
          severity: evaluated.severity ?? severity,
          className, // for naming rules, this is the one we tested
          isCombo: evaluated.isCombo ?? Boolean(isCombo),
          // keep all extra diagnostics in metadata to avoid type conflicts
          metadata: {
            ...(evaluated.metadata ?? {}),
            elementId,
            role,
            classType,
            comboIndex,
          },
          // example is optional in many shapes; include only if present
          ...(evaluated.example ? { example: evaluated.example } : {}),
          // preserve expanded view capabilities from rule evaluation
          ...(evaluated.expandedViewCapabilities ? { expandedViewCapabilities: evaluated.expandedViewCapabilities } : {}),
        };
        return [result];
      }
    }

    // Fallback boolean API
    if (
      "test" in rule &&
      typeof rule.test === "function" &&
      !rule.test(className)
    ) {
      const baseMessage =
        ("message" in rule && typeof (rule as any).message !== "undefined"
          ? typeof (rule as any).message === "function"
            ? (rule as any).message(className)
            : (rule as any).message
          : rule.description) || `Invalid class format for "${className}".`;

      const suggestion = suggestName?.(className, role);

      const violation: RuleResult = {
        ruleId: rule.id,
        name: rule.name,
        message: baseMessage,
        severity,
        className,
        isCombo: Boolean(isCombo),
        metadata: {
          elementId,
          role,
          classType,
          comboIndex,
          // tuck auto-fix inside metadata to keep RuleResult strict
          fix:
            suggestion && suggestion !== className
              ? {
                  kind: "rename-class",
                  from: className,
                  to: suggestion,
                  scope: "element",
                }
              : undefined,
        },
        ...(rule.example ? { example: rule.example } : {}),
      };

      return [violation];
    }

    return [];
  };
};
