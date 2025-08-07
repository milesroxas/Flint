import React from "react";

interface LintPanelHeaderProps {
  violationCount: number;
}

export const LintPanelHeader: React.FC<LintPanelHeaderProps> = ({
  violationCount,
}) => (
  <div className="relative mb-1 flex items-center justify-between">
    <span className="text-[12px] font-medium">
      Found {violationCount} issues
    </span>
    <span
      className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive/10 px-1.5 text-[10px] font-semibold tabular-nums text-destructive"
      aria-label="Total lint issues"
    >
      {violationCount}
    </span>
  </div>
);
