import React from "react";
import { useWebflowLinting } from "@/features/linter/hooks/use-webflow-linting";
import { LintPanelHeader } from "./LintPanelHeader";
import { ViolationsList } from "./ViolationsList";

export const LintPanel: React.FC = () => {
  const { violations, isLoading } = useWebflowLinting();

  if (!violations.length && !isLoading) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="p-1">
        <div className="text-[12px] text-muted-foreground">
          Analyzing styles...
        </div>
      </div>
    );
  }

  return (
    <div className="p-1">
      <LintPanelHeader violationCount={violations.length} />
      <ViolationsList violations={violations} />
    </div>
  );
};
