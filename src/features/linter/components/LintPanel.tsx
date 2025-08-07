import React from "react";
import { useElementLint } from "@/features/linter/hooks/useElementLint";
import { LintPanelHeader } from "./LintPanelHeader";
import { ViolationsList } from "./ViolationsList";

export const LintPanel: React.FC = () => {
  const { violations, isLoading } = useElementLint();

  if (!violations.length && !isLoading) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="px-1.5 py-4 border-b">
        <div className="text-sm text-muted-foreground">Analyzing styles...</div>
      </div>
    );
  }

  return (
    <div className="px-1.5 py-4 border-b">
      <h2 className="text-sm font-semibold text-muted-foreground mb-2">
        Selected Element
      </h2>
      <LintPanelHeader violationCount={violations.length} />
      <ViolationsList violations={violations} />
    </div>
  );
};
