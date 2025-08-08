import { Severity } from "@/features/linter/model/rule.types"

export const severityDot: Record<Severity, string> = {
  error: "bg-red-500",
  warning: "bg-amber-500",
  suggestion: "bg-slate-400",
}

export const severityText: Record<Severity, string> = {
  error: "text-red-700 dark:text-red-300",
  warning: "text-amber-800 dark:text-amber-200",
  suggestion: "text-slate-700 dark:text-slate-200",
}


