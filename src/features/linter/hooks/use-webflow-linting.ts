import { useEffect, useState } from "react"
import { runLint } from "@/features/linter/engine"
import { RuleResult } from "@/features/linter/types/rule-types"

declare const webflow: {
  subscribe: (event: "selectedelement", cb: (el: any) => void) => () => void
}

export function useWebflowLinting() {
  const [violations, setViolations] = useState<RuleResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const unsubscribe = webflow.subscribe("selectedelement", async (el) => {
      if (!el) {
        setViolations([])
        return
      }
      
      setIsLoading(true)
      try {
        const results = await runLint(el)
        setViolations(results)
      } catch (error) {
        console.error('Error running lint:', error)
        setViolations([])
      } finally {
        setIsLoading(false)
      }
    })
    
    return () => unsubscribe()
  }, [])

  return { violations, isLoading }
}