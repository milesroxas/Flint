// src/features/linter/components/PageLintSection.tsx
import { usePageLint } from "@/features/linter/store/pageLint.store";
import { LintPageButton } from "@/features/linter/components/LintPageButton";
import { ViolationsList } from "@/features/linter/components/ViolationsList";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function PageLintSection() {
  const { results, loading, error, hasRun, lintPage } = usePageLint();
  const count = results.length;

  return (
    <section className="pt-4 pb-2 border-b bg-muted/50">
      <div className="flex items-center justify-between px-1.5">
        <h2 className="text-sm font-semibold text-muted-foreground mb-2">
          Current Page
        </h2>
        <div className="flex items-center gap-2">
          {count > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive/10 text-[10px] font-medium text-destructive px-1">
              {count}
            </span>
          )}
          <LintPageButton
            onClick={lintPage}
            loading={loading}
            issueCount={count}
          />
        </div>
      </div>

      <div className="bg-muted/50">
        {error && (
          <div className="flex items-center gap-2 py-2 text-sm text-destructive">
            <AlertCircle className="h-3 w-3" />
            {error}
          </div>
        )}

        {!error && !loading && !hasRun && (
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600">
            <AlertCircle className="h-3 w-3" />
            Click the button to lint this page
          </div>
        )}

        {!error && !loading && hasRun && count === 0 && (
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-green-600">
            <CheckCircle2 className="h-3 w-3" />
            No issues found
          </div>
        )}

        {!error && count > 0 && (
          <div className="p-2">
            <ViolationsList violations={results} />
          </div>
        )}
      </div>
    </section>
  );
}
