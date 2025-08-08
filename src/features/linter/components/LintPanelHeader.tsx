import React from "react";

interface LintPanelHeaderProps {
  violationCount: number;
  mode?: "strict" | "balanced" | "lenient";
}

export const LintPanelHeader: React.FC<LintPanelHeaderProps> = ({
  violationCount,
  mode,
}) => (
  <div className="relative mb-1 flex items-center justify-between">
    <span className="text-[12px] font-medium flex items-center gap-2">
      Found {violationCount} issues
      {mode && (
        <span className="text-[11px] text-muted-foreground">({mode} mode)</span>
      )}
    </span>
    <span
      className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive/10 px-1.5 text-[10px] font-semibold tabular-nums text-destructive"
      aria-label="Total lint issues"
    >
      {violationCount}
    </span>
  </div>
);
