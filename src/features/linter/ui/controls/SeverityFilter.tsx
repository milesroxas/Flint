import React from "react";
import type { Severity } from "@/features/linter/model/rule.types";
import { cn } from "@/shared/utils";
import { SeverityButton } from "@/shared/ui/severity-button";

export type SeverityFilterValue = Severity | "all";

interface SeverityFilterProps {
  filter: SeverityFilterValue;
  counts: { error: number; warning: number; suggestion: number };
  onChange: (next: SeverityFilterValue) => void;
  className?: string;
  condensed?: boolean;
}

export const SeverityFilter: React.FC<SeverityFilterProps> = ({
  filter,
  counts,
  onChange,
  className,
  condensed = false,
}) => {
  const toggle = (level: Severity) => {
    onChange(filter === level ? "all" : level);
  };

  return (
    <div
      className={cn(
        "grid grid-cols-3 transition-all duration-300 ease-in-out",
        condensed ? "gap-2" : "gap-3",
        className
      )}
    >
      <SeverityButton
        severity="error"
        count={counts.error}
        condensed={condensed}
        active={filter === "error"}
        expandedLabel={condensed ? "Errors" : "Issues"}
        onClick={() => toggle("error")}
      />
      <SeverityButton
        severity="warning"
        count={counts.warning}
        condensed={condensed}
        active={filter === "warning"}
        expandedLabel="Warnings"
        onClick={() => toggle("warning")}
      />
      <SeverityButton
        severity="suggestion"
        count={counts.suggestion}
        condensed={condensed}
        active={filter === "suggestion"}
        expandedLabel="Suggestions"
        onClick={() => toggle("suggestion")}
      />
    </div>
  );
};

export default SeverityFilter;
