import React from "react";
import { Badge } from "@/shared/ui/badge";
import type { ElementRole } from "@/features/linter/model/linter.types";
import { roleToLabel } from "@/features/linter/lib/labels";

interface LintSummaryProps {
  total: number;
  errors: number;
  warnings: number;
  suggestions: number;
  mode?: "strict" | "balanced" | "lenient";
  roles?: ElementRole[];
}

export const LintPanelHeader: React.FC<LintSummaryProps> = ({
  total,
  errors,
  warnings,
  suggestions,
  mode,
  roles = [],
}) => {
  const uniqueRoles: ElementRole[] = Array.from(new Set(roles));
  const filteredRoles = uniqueRoles;

  return (
    <div className="relative mb-2 rounded-md border bg-card px-2 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-semibold text-foreground">
              {total > 0 ? `Found ${total} issues` : "No issues found"}
            </span>
            {mode && (
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                {mode}
              </span>
            )}
            <span className="inline-flex items-center gap-1 flex-wrap">
              <span className="inline-flex items-center rounded-full bg-destructive/10 text-destructive px-1.5 py-0.5 text-[10px]">
                {errors}
                <span className="ml-1 opacity-80">errors</span>
              </span>
              <span className="inline-flex items-center rounded-full bg-warning/20 text-warning-foreground px-1.5 py-0.5 text-[10px]">
                {warnings}
                <span className="ml-1 opacity-80">warnings</span>
              </span>
              <span className="inline-flex items-center rounded-full bg-muted text-foreground/80 px-1.5 py-0.5 text-[10px]">
                {suggestions}
                <span className="ml-1 opacity-80">suggestions</span>
              </span>
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {filteredRoles.map((r) => (
              <Badge
                key={`role-${r}`}
                variant="secondary"
                className="text-[10px]"
              >
                {roleToLabel(r)}
              </Badge>
            ))}
          </div>
        </div>
        <span className="flex items-center gap-2 flex-shrink-0" />
      </div>
    </div>
  );
};
