// src/features/linter/components/PageLintSection.tsx
import { usePageLint } from "@/features/linter/store/pageLint.store";
import { useMemo, useState } from "react";
import type { RuleResult } from "@/features/linter/model/rule.types";
import { ViolationsList } from "@/features/linter/components/ViolationsList";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { ModeToggle, type LintViewMode } from "./ModeToggle";
import { ActionBar } from "./ActionBar";
import { useElementLint } from "@/features/linter/hooks/useElementLint";

export function PageLintSection() {
  const { results, passedClassNames, loading, error, hasRun, lintPage } =
    usePageLint();
  const opinionMode: "strict" | "balanced" | "lenient" = "balanced";
  const count = results.length;
  const [mode, setMode] = useState<LintViewMode>("page");

  // Element lint data via hook
  const {
    violations: elementViolations,
    classNames: elementClassNames,
    isLoading: elementLoading,
    refresh: refreshElementLint,
  } = useElementLint();

  const activeViolations: RuleResult[] = useMemo(
    () => (mode === "page" ? results : elementViolations),
    [mode, results, elementViolations]
  );
  const activePassedClassNames: string[] = useMemo(
    () => (mode === "page" ? passedClassNames : elementClassNames),
    [mode, passedClassNames, elementClassNames]
  );
  const isBusy = mode === "page" ? loading : elementLoading;

  // Severity-grouped lists for consistent UI (element or page)
  // keep for potential badges/counters; not used directly in rendering currently
  // const grouped = useMemo(() => ({
  //   errors: results.filter((v) => v.severity === "error"),
  //   warnings: results.filter((v) => v.severity === "warning"),
  //   suggestions: results.filter((v) => v.severity === "suggestion"),
  // }), [results]);

  return (
    <section className="pb-20 border-b bg-muted/50">
      <div className="bg-muted/50">
        {error && (
          <div className="flex items-center gap-2 py-2 text-sm text-destructive">
            <AlertCircle className="h-3 w-3" />
            {error}
          </div>
        )}

        {/* CTA will be rendered below the ModeToggle to ensure the toggle is always visible */}

        {!error && !loading && hasRun && count === 0 && (
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-green-600">
            <CheckCircle2 className="h-3 w-3" />
            No issues found
          </div>
        )}

        {!error && (
          <div className="p-2">
            <ModeToggle
              mode={mode}
              onChange={(next) => {
                try {
                  usePageLint.getState().clearResults();
                } catch (err) {
                  /* ignore store errors */
                }
                setMode(next);
              }}
              className="mb-2"
            />

            {mode === "page" && !loading && !hasRun ? (
              <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600">
                <AlertCircle className="h-3 w-3" />
                Click the button to lint this page
              </div>
            ) : (
              <>
                <ViolationsList
                  violations={activeViolations}
                  passedClassNames={activePassedClassNames}
                  showHighlight={mode === "page"}
                />
                <div className="mt-2 text-[10px] text-muted-foreground">
                  Opinion: {opinionMode} · View: {mode}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <ActionBar
        loading={isBusy}
        mode={mode}
        issueCount={activeViolations.length}
        onLint={async () => {
          if (mode === "page") {
            await lintPage();
          } else {
            await refreshElementLint();
          }
        }}
      />
    </section>
  );
}
