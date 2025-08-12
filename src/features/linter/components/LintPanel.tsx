import React from "react";
import { useElementLint } from "@/features/linter/hooks/useElementLint";
import { LintPanelHeader } from "./LintPanelHeader";
import { ViolationsList } from "./ViolationsList";

export const LintPanel: React.FC = () => {
  const { violations, isLoading, contexts, classNames, roles } =
    useElementLint();
  // Element-level "passed" list is not available here without extra API calls; we keep the compact view.
  const mode: "strict" | "balanced" | "lenient" = "balanced";

  if (isLoading) {
    return (
      <div className="px-1.5 py-4 border-b">
        <div className="text-sm text-muted-foreground">Analyzing styles...</div>
      </div>
    );
  }

  const derivedRoles = roles && roles.length > 0 ? roles : [];

  const errorCount = violations.filter((v) => v.severity === "error").length;
  const warningCount = violations.filter(
    (v) => v.severity === "warning"
  ).length;
  const suggestionCount = violations.filter(
    (v) => v.severity === "suggestion"
  ).length;

  return (
    <div className="px-2 py-3 border-b">
      <h2 className="text-sm font-semibold text-muted-foreground mb-2">
        Selected Element
      </h2>
      <LintPanelHeader
        violationCount={violations.length}
        errorCount={errorCount}
        warningCount={warningCount}
        suggestionCount={suggestionCount}
        mode={mode}
        contexts={contexts}
        roles={derivedRoles}
      />
      {classNames && classNames.length > 0 && (
        <div className="mb-2 text-[11px] text-muted-foreground">
          <div className="flex flex-wrap items-center gap-1">
            <span className="opacity-80">Classes:</span>
            <span className="font-mono break-words whitespace-normal">
              {Array.from(new Set(classNames)).join(" ")}
            </span>
          </div>
        </div>
      )}
      <ViolationsList violations={violations} showHighlight={false} />
    </div>
  );
};
