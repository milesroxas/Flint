import React from "react";
import { Badge } from "@/shared/ui/badge";
import type { ElementContext } from "@/entities/element/model/element-context.types";
import type { ElementRole } from "@/features/linter/model/linter.types";
import { contextToLabel, roleToLabel } from "@/features/linter/lib/labels";

interface LintSummaryProps {
  total: number;
  errors: number;
  warnings: number;
  suggestions: number;
  mode?: "strict" | "balanced" | "lenient";
  contexts?: ElementContext[];
  roles?: ElementRole[];
}

export const LintPanelHeader: React.FC<LintSummaryProps> = ({
  total,
  errors,
  warnings,
  suggestions,
  mode,
  contexts = [],
  roles = [],
}) => {
  const uniqueContexts: ElementContext[] = Array.from(new Set(contexts));
  const uniqueRoles: ElementRole[] = Array.from(new Set(roles));
  const contextSet = new Set<ElementContext>(uniqueContexts);
  const filteredRoles = uniqueRoles.filter(
    (r) => !contextSet.has(r as ElementContext)
  );

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
              <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-1.5 py-0.5 text-[10px]">
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
            {uniqueContexts.map((c) => (
              <Badge
                key={`ctx-${c}`}
                variant="outline"
                className="text-blue-600 border-blue-300 bg-blue-50 text-[10px]"
              >
                {contextToLabel(c)}
              </Badge>
            ))}
            {filteredRoles.map((r) => (
              <Badge
                key={`role-${r}`}
                variant="outline"
                className="text-violet-700 border-violet-300 bg-violet-50 text-[10px]"
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
