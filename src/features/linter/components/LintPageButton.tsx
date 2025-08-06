// src/components/LintPageButton.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { usePageLint } from "@/features/linter/hooks/use-page-lint";

export const LintPageButton: React.FC = () => {
  const { results, loading, error, lintPage } = usePageLint();

  return (
    <div className="space-y-4">
      <Button onClick={lintPage} disabled={loading}>
        {loading ? "Linting page…" : "Lint Current Page"}
      </Button>

      {error && <p className="text-sm text-destructive">Error: {error}</p>}

      {!loading && results.length === 0 && !error && (
        <p className="text-sm text-muted-foreground">
          No issues found on this page.
        </p>
      )}

      {results.length > 0 && (
        <div className="border p-4 rounded-md bg-background">
          <h3 className="font-medium mb-2">
            {results.length} issue{results.length > 1 && "s"} found
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {results.map((r, i) => (
              <li key={r.ruleId ?? i}>
                <strong>{r.name}</strong>: {r.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
