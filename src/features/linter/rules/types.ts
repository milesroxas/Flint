import { RuleTestCtx, Severity } from "../types";

export interface NamingRule {
    id: string;
    name: string;
    description: string;
    test: (className: string, ctx?: RuleTestCtx) => boolean;
    severity: Severity;
    enabled: boolean;
    isCombo: boolean;
  }