export type Severity = "suggestion" | "warning" | "error";

export type RuleTestCtx = { isCombo?: boolean; comboIndex?: number };


export interface RuleResult {
    ruleId: string
    name: string
    message: string
    severity: Severity
    className: string
    isCombo: boolean
    comboIndex?: number
  }