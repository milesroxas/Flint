// src/hooks/use-element-lint.ts
import { useEffect, useState } from "react"
import type { RuleResult } from "@/features/linter/model/rule.types"
import { scanSelectedElement } from "@/processes/scan/scan-selected-element"

declare const webflow: {
  subscribe: (event: "selectedelement", cb: (el: any) => void) => () => void
}

// process orchestrator wraps service creation

/**
 * Subscribes to Webflow’s selected-element event and lints that element.
 * @returns violations and loading state
 */
export function useElementLint() {
  const [violations, setViolations] = useState<RuleResult[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    const unsubscribe = webflow.subscribe("selectedelement", async (el) => {
      if (!el) {
        setViolations([])
        return
      }

      setIsLoading(true)
      try {
        const results = await scanSelectedElement(el)
        setViolations(results)
      } catch (err: unknown) {
        console.error("Error linting element:", err)
        setViolations([])
      } finally {
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  return { violations, isLoading }
}
