import React from "react";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/utils";
import { RuleResult, Severity } from "@/features/linter/model/rule.types";
import { roleToLabel } from "@/features/linter/lib/labels";

interface ViolationHeaderProps {
  violation: RuleResult;
}

export const ViolationHeader: React.FC<ViolationHeaderProps> = ({
  violation,
}) => {
  const sevForUi: Severity = violation.severity as Severity;
  const sevForUiLabel = violation.severity;
  const dotBySeverity: Record<Severity, string> = {
    error: "bg-error",
    warning: "bg-warning",
    suggestion: "bg-suggestion",
  };

  const role = violation.metadata?.role as string | undefined;
  const isDuplicateRole = false;

  const isUnknownRole = role === "unknown";

  return (
    <div className="flex min-w-0 w-full overflow-hidden">
      <span
        className={cn(
          "h-2 w-2 rounded-full flex-shrink-0 mt-1.5 mr-2",
          dotBySeverity[sevForUi]
        )}
        aria-hidden
        title={sevForUiLabel}
      />
      <div className="flex flex-wrap min-w-0 items-center gap-2 gap-y-1 flex-1">
        <span className="font-medium text-xs min-w-0 whitespace-normal break-words text-foreground">
          {violation.name}
        </span>
        {violation.metadata?.unrecognizedElement && (
          <Badge variant="secondary" className="ml-2 text-[10px]">
            Unknown
          </Badge>
        )}
        {/* Context badges removed; roles only */}
        {!isDuplicateRole && role && !isUnknownRole && (
          <Badge variant="secondary" className="ml-1 text-[10px]">
            {roleToLabel(role as any)}
          </Badge>
        )}
      </div>
    </div>
  );
};

export default ViolationHeader;
