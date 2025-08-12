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

export const severityBg: Record<Severity, string> = {
  error: "bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30",
  warning: "bg-amber-500/10 hover:bg-amber-500/20 active:bg-amber-500/30",
  suggestion: "bg-slate-400/10 hover:bg-slate-400/20 active:bg-slate-400/30",
}

export const severityBgActive: Record<Severity, string> = {
  error: "bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40",
  warning: "bg-amber-500/20 hover:bg-amber-500/30 active:bg-amber-500/40",
  suggestion: "bg-slate-400/20 hover:bg-slate-400/30 active:bg-slate-400/40",
}


