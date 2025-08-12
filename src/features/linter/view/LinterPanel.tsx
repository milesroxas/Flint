import { useMemo, useState } from "react";
import type { RuleResult } from "@/features/linter/model/rule.types";
import { ViolationsList } from "@/features/linter/ui/ViolationsList";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { ModeToggle, type LintViewMode } from "@/features/linter/ui/ModeToggle";
import { ActionBar } from "@/features/linter/ui/ActionBar";
import { useElementLint } from "@/features/linter/store/elementLint.store";
import { usePageLint } from "@/features/linter/store/pageLint.store";

export function LinterPanel() {
  const { results, passedClassNames, loading, error, hasRun, lintPage } =
    usePageLint();
  const opinionMode: "strict" | "balanced" | "lenient" = "balanced";
  const count = results.length;
  const [mode, setMode] = useState<LintViewMode>("page");

  const {
    results: elementResults,
    classNames: elementClassNames,
    loading: elementLoading,
    refresh: refreshElementLint,
  } = useElementLint();

  const activeViolations: RuleResult[] = useMemo(
    () => (mode === "page" ? results : elementResults),
    [mode, results, elementResults]
  );
  const activePassedClassNames: string[] = useMemo(
    () => (mode === "page" ? passedClassNames : elementClassNames),
    [mode, passedClassNames, elementClassNames]
  );
  const isBusy = mode === "page" ? loading : elementLoading;

  return (
    <section className="pb-20">
      <div>
        {error && (
          <div className="flex items-center gap-2 py-2 text-sm text-destructive">
            <AlertCircle className="h-3 w-3" />
            {error}
          </div>
        )}

        {!error && !loading && hasRun && count === 0 && mode === "page" && (
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-green-600">
            <CheckCircle2 className="h-3 w-3" />
            No issues found
          </div>
        )}

        {!error && (
          <div className="p-4">
            <ModeToggle
              mode={mode}
              onChange={(next) => {
                try {
                  usePageLint.getState().clearResults();
                } catch (err: unknown) {
                  if ((import.meta as any)?.env?.DEV) {
                    // eslint-disable-next-line no-console
                    console.debug("[LinterPanel] clearResults failed", err);
                  }
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
