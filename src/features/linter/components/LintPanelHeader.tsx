import React from "react";
import { Badge } from "@/components/ui/badge";
import type { ElementContext } from "@/entities/element/model/element-context.types";
import type { ElementRole } from "@/features/linter/model/linter.types";
// preset switching handled elsewhere
// removed preset switch from element header

interface LintPanelHeaderProps {
  violationCount: number;
  errorCount: number;
  warningCount: number;
  suggestionCount: number;
  mode?: "strict" | "balanced" | "lenient";
  contexts?: ElementContext[];
  roles?: ElementRole[];
}

const toTitle = (s: string) =>
  s.replace(/(^|[_-])(\w)/g, (_, p1, p2) => (p1 ? " " : "") + p2.toUpperCase());

const contextLabel = (ctx: ElementContext) => {
  if (ctx === "componentRoot") return "Component Root";
  return toTitle(ctx);
};

const roleLabel = (role: ElementRole) => {
  if (role === "componentRoot") return "Component Root";
  return toTitle(role);
};

export const LintPanelHeader: React.FC<LintPanelHeaderProps> = ({
  violationCount,
  errorCount,
  warningCount,
  suggestionCount,
  mode,
  contexts = [],
  roles = [],
}) => {
  // De-duplicate contexts and roles to reduce visual noise
  const uniqueContexts = Array.from(new Set(contexts));
  const uniqueRoles = Array.from(new Set(roles));
  // If a role equals a shown context (e.g., "childGroup"), hide the duplicate role chip
  const contextSet = new Set<string>(uniqueContexts as unknown as string[]);
  const filteredRoles = uniqueRoles.filter((r) => {
    const label = String(r);
    return !contextSet.has(label);
  });

  return (
    <div className="relative mb-2 rounded-md border bg-card px-2 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-semibold text-foreground">
              {violationCount > 0
                ? `Found ${violationCount} issues`
                : "No issues found"}
            </span>
            {mode && (
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                {mode}
              </span>
            )}
            <span className="inline-flex items-center gap-1 flex-wrap">
              <span className="inline-flex items-center rounded-full bg-destructive/10 text-destructive px-1.5 py-0.5 text-[10px]">
                {errorCount}
                <span className="ml-1 opacity-80">errors</span>
              </span>
              <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-1.5 py-0.5 text-[10px]">
                {warningCount}
                <span className="ml-1 opacity-80">warnings</span>
              </span>
              <span className="inline-flex items-center rounded-full bg-muted text-foreground/80 px-1.5 py-0.5 text-[10px]">
                {suggestionCount}
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
                {contextLabel(c)}
              </Badge>
            ))}
            {filteredRoles.map((r) => (
              <Badge
                key={`role-${r}`}
                variant="outline"
                className="text-violet-700 border-violet-300 bg-violet-50 text-[10px]"
              >
                {roleLabel(r)}
              </Badge>
            ))}
          </div>
        </div>
        <span className="flex items-center gap-2 flex-shrink-0" />
      </div>
    </div>
  );
};
