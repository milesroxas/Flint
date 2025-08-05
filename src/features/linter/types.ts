export type Severity = "suggestion" | "warning" | "error";

export interface RuleResult {
    ruleId: string
    name: string
    message: string
    severity: Severity
    className: string
  }