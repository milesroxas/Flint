// src/features/linter/components/PageLintSection.tsx
import { usePageLint } from "@/features/linter/hooks/usePageLint";
import { LintPageButton } from "@/features/linter/components/LintPageButton";
import { ViolationsList } from "@/features/linter/components/ViolationsList";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function PageLintSection() {
  const { results, loading, error, lintPage } = usePageLint();
  const count = results.length;

  return (
    <section className="pt-4 pb-2 border-b">
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

        {!error && !loading && count === 0 && (
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
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
