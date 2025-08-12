import React from "react";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/lib/utils";
import { RuleResult, Severity } from "@/features/linter/model/rule.types";
import {
  severityDot,
  severityText,
} from "@/features/linter/lib/severity-styles";
import { contextToLabel, roleToLabel } from "@/features/linter/lib/labels";

interface ViolationHeaderProps {
  violation: RuleResult;
}

export const ViolationHeader: React.FC<ViolationHeaderProps> = ({
  violation,
}) => {
  const sev = violation.severity as Severity;

  const role = violation.metadata?.role as string | undefined;
  const context = violation.context as string | undefined;
  const isDuplicateRole = role && context && role === context;

  return (
    <div className="flex min-w-0 items-center gap-2 w-full">
      <span
        className={cn("h-2 w-2 rounded-full flex-shrink-0", severityDot[sev])}
        aria-hidden
        title={violation.severity}
      />
      <span className={cn("font-semibold truncate text-sm", severityText[sev])}>
        {violation.name}
      </span>
      {violation.metadata?.unrecognizedElement && (
        <Badge
          variant="outline"
          className="ml-2 text-orange-600 border-orange-300 bg-orange-50 text-[10px]"
        >
          Unknown
        </Badge>
      )}
      {violation.context && (
        <Badge
          variant="outline"
          className="ml-2 text-blue-600 border-blue-300 bg-blue-50 text-[10px]"
        >
          {contextToLabel(violation.context)}
        </Badge>
      )}
      {!isDuplicateRole && role && (
        <Badge
          variant="outline"
          className="ml-1 text-violet-700 border-violet-300 bg-violet-50 text-[10px]"
        >
          {roleToLabel(role as any)}
        </Badge>
      )}
    </div>
  );
};

export default ViolationHeader;
