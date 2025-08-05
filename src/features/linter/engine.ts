// src/features/linter/engine.ts
import { RuleResult, Severity } from "@/features/linter/types"
import { NamingRule } from "@/features/linter/rules/types"
import { lumosCustomClassRule } from "@/features/linter/rules/lumosCustomClassRule"

const rules: NamingRule[] = [lumosCustomClassRule]

export async function runLint(element: any): Promise<RuleResult[]> {
  const results: RuleResult[] = []

  const styles = await element.getStyles?.()
  if (!styles || styles.length === 0) return results

  type StyleInfo = { name: string; isCombo: boolean; index: number; order: number }
  const collected: StyleInfo[] = []

  let comboCounter = 0
  for (let order = 0; order < styles.length; order++) {
    const style = styles[order]
    try {
      const [name, isCombo] = await Promise.all([
        style.getName?.(),
        // Webflow Designer Extensions API:
        // style.isComboClass()
        // docs: developers.webflow.com/designer/reference/style/is-combo-class
        style.isComboClass?.(),
      ])

      if (typeof name === "string" && name.trim()) {
        collected.push({
          name: name.trim(),
          isCombo,
          index: isCombo ? ++comboCounter : 0,
          order,
        })
      }
    } catch {
      // Skip styles that fail to resolve name/combo flag
    }
  }

  // De-dupe by class name (case-insensitive), keep first occurrence
  const seen = new Set<string>()
  const unique = collected.filter((s) => {
    const key = s.name.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Sort: base first, then combos; within each group keep original order
  unique.sort((a, b) => {
    if (a.isCombo !== b.isCombo) return Number(a.isCombo) - Number(b.isCombo)
    return a.order - b.order
  })

  for (const { name, isCombo, index } of unique) {
    for (const rule of rules) {
      if (!rule.enabled) continue
      // If your rule signature accepts context, pass it here:
      const ok = rule.test(name, { isCombo, comboIndex: index })

      if (!ok) {
        results.push({
          ruleId: rule.id,
          name: rule.name,
          message: rule.description,
          severity: rule.severity as Severity,
          className: name,
          isCombo,
          comboIndex: isCombo ? index : undefined,
        } as RuleResult)
      }
    }
  }

  return results
}