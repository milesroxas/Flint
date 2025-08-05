export type Severity = "suggestion" | "warning" | "error";

export interface RuleResult {
    ruleId: string
    message: string
    severity: Severity
    className: string
  }