// src/features/linter/hooks/use-page-lint.ts
import { useState, useCallback } from "react";
import type { RuleResult } from "@/features/linter/types/rule-types";
import { createPageLintService } from "@/features/linter/lib/page-lint-service";
import { StyleService } from "@/features/linter/lib/style-service";
import { RuleRunner } from "@/features/linter/lib/rule-runner";
import { RuleRegistry } from "@/features/linter/lib/rule-registry";
import { UtilityClassAnalyzer } from "@/features/linter/lib/utility-class-analyzer";
import { defaultRules } from "@/features/linter/rules/default-rules";

declare global {
  interface Window {
    webflow: {
      getAllElements: () => Promise<any[]>;
      getAllStyles: () => Promise<any[]>;
    };
  }
}

// Initialize dependencies
const styleService = new StyleService();
const utilityAnalyzer = new UtilityClassAnalyzer();
const ruleRegistry = new RuleRegistry();
ruleRegistry.registerRules(defaultRules);
const ruleRunner = new RuleRunner(ruleRegistry, utilityAnalyzer);

// Create the page lint service
const pageLintService = createPageLintService(styleService, ruleRunner);

export function usePageLint() {
  const [results, setResults] = useState<RuleResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lintPage = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const elements = await window.webflow.getAllElements();
      const res = await pageLintService.lintCurrentPage(elements);
      setResults(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, error, lintPage };
}
