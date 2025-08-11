// src/hooks/use-element-lint.ts
import { useEffect, useState } from "react"
import type { RuleResult } from "@/features/linter/model/rule.types"
import { scanSelectedElementWithMeta } from "@/processes/scan/scan-selected-element"
import type { SelectedElementMeta } from "@/processes/scan/scan-selected-element"
import { ensureLinterInitialized } from "@/features/linter/model/linter.factory"
import type { ElementContext } from "@/entities/element/model/element-context.types"
import type { ElementRole } from "@/features/linter/model/linter.types"

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
  const [contexts, setContexts] = useState<ElementContext[]>([])
  const [classNames, setClassNames] = useState<string[]>([])
  const [roles, setRoles] = useState<ElementRole[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const refresh = async () => {
    try {
      ensureLinterInitialized("balanced")
      const wf: any = (window as any).webflow
      if (!wf || typeof wf.getSelectedElement !== "function") return
      const el = await wf.getSelectedElement()
      if (!el || typeof (el as any).getStyles !== "function") return
      setIsLoading(true)
      const meta = (await scanSelectedElementWithMeta(el)) as SelectedElementMeta
      const { results, classNames, contexts, roles } = meta
      setViolations(results)
      setClassNames(classNames || [])
      setContexts(contexts || [])
      setRoles(roles || [])
    } catch (err: unknown) {
      console.error("Error refreshing element lint:", err)
      setViolations([])
      setContexts([])
      setClassNames([])
      setRoles([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    ensureLinterInitialized("balanced")
    const unsubscribe = webflow.subscribe("selectedelement", async (el) => {
      // Optional: ignore synthetic selection triggered by our highlight action to preserve UI expansion state
      const g: any = window as any
      if (g.__flowlint_ignoreNextSelectedEvent) {
        g.__flowlint_ignoreNextSelectedEvent = false
        return
      }
      if (!el || typeof (el as any).getStyles !== "function") {
        // Ignore non-designer elements; wait for a valid element payload
        setViolations([])
        setContexts([])
        setClassNames([])
        return
      }

      setIsLoading(true)
      try {
        const meta = (await scanSelectedElementWithMeta(el)) as SelectedElementMeta
        const { results, classNames, contexts, roles } = meta
        setViolations(results)
        setClassNames(classNames || [])
        setContexts(contexts || [])
        setRoles(roles || [])
      } catch (err: unknown) {
        console.error("Error linting element:", err)
        setViolations([])
        setContexts([])
        setClassNames([])
        setRoles([])
      } finally {
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  return { violations, contexts, classNames, roles, isLoading, refresh }
}
