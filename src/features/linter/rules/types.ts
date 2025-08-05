import { Severity } from "../types";

export interface NamingRule {
    id: string;
    name: string;
    description: string;
    test: (className: string) => boolean;
    severity: Severity;
    enabled: boolean;
  }