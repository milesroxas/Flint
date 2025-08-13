import React from "react";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/lib/utils";
import { RuleResult, Severity } from "@/features/linter/model/rule.types";
import { contextToLabel, roleToLabel } from "@/features/linter/lib/labels";

interface ViolationHeaderProps {
  violation: RuleResult;
}

export const ViolationHeader: React.FC<ViolationHeaderProps> = ({
  violation,
}) => {
  const sev = violation.severity as Severity;
  const dotBySeverity: Record<Severity, string> = {
    error: "bg-error",
    warning: "bg-warning",
    suggestion: "bg-suggestion",
  };
  const textBySeverity: Record<Severity, string> = {
    error: "text-error",
    warning: "text-warning",
    suggestion: "text-suggestion",
  };

  const role = violation.metadata?.role as string | undefined;
  const context = violation.context as string | undefined;
  const isDuplicateRole = role && context && role === context;

  return (
    <div className="flex min-w-0 items-center gap-2 w-full">
      <span
        className={cn("h-2 w-2 rounded-full flex-shrink-0", dotBySeverity[sev])}
        aria-hidden
        title={violation.severity}
      />
      <span className={cn("font-medium truncate text-xs", textBySeverity[sev])}>
        {violation.name}
      </span>
      {violation.metadata?.unrecognizedElement && (
        <Badge variant="secondary" className="ml-2 text-[10px]">
          Unknown
        </Badge>
      )}
      {violation.context && (
        <Badge variant="newProperty" className="ml-2 text-[10px]">
          {contextToLabel(violation.context)}
        </Badge>
      )}
      {!isDuplicateRole && role && (
        <Badge variant="secondary" className="ml-1 text-[10px]">
          {roleToLabel(role as any)}
        </Badge>
      )}
    </div>
  );
};

export default ViolationHeader;
