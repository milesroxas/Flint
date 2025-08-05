// src/features/linter/engine.ts

import { RuleResult, Severity } from "@/features/linter/types"
import { NamingRule } from "@/features/linter/rules/types"
import { lumosCustomClassRule } from "@/features/linter/rules/lumosCustomClassRule"

/** All of your naming rules */
const rules: NamingRule[] = [lumosCustomClassRule]

/**
 * Runs all enabled rules against the *first* style on the element.
 */
export async function runLint(element: any): Promise<RuleResult[]> {
  const results: RuleResult[] = []

  // 1. Retrieve all styles applied to this element :contentReference[oaicite:0]{index=0}
  const styles = await element.getStyles()
  if (styles.length === 0) return results

  // 2. Assume the *first* style object corresponds to the custom class :contentReference[oaicite:1]{index=1}
  const firstStyle = styles[0]
  const className = await firstStyle.getName()

  // 3. Test that className against each enabled rule
  for (const rule of rules) {
    if (!rule.enabled) continue
    if (!rule.test(className)) {
      results.push({
        ruleId:   rule.id,
        message:  rule.description,
        severity: rule.severity as Severity,
        className,
      })
    }
  }

  return results
}
