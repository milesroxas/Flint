import React from "react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";
import { RuleResult, Severity } from "@/features/linter/model/rule.types";
import { ViolationHeader } from "./ViolationHeader";
import { ViolationDetails, ClassBadge } from "./ViolationDetails";
import { cn } from "@/lib/utils";

interface ViolationItemProps {
  violation: RuleResult;
  index: number;
  showHighlight?: boolean;
}

export const ViolationItem: React.FC<ViolationItemProps> = ({
  violation,
  index,
  showHighlight = true,
}) => {
  const id = `${violation.ruleId}-${violation.className || "unknown"}-${index}`;

  const sev = violation.severity as Severity;
  const severityLeftBorder: Record<Severity, string> = {
    error: "border-l-error",
    warning: "border-l-warning",
    suggestion: "border-l-suggestion",
  };
  const borderColorClass = severityLeftBorder[sev];

  return (
    <AccordionItem key={id} value={id} className="border-b last:border-b-0">
      <AccordionTrigger className="py-2 px-1.5 w-full">
        <div className="flex flex-col items-start gap-1 w-full min-w-0">
          <ViolationHeader violation={violation} />
          {violation.ruleId !== "no-styles-or-classes" && (
            <div
              className={cn("w-full ml-0.5 pl-1 border-l-2", borderColorClass)}
            >
              <ClassBadge violation={violation} />
            </div>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-2 pb-2 pt-0 w-full overflow-hidden">
        <ViolationDetails violation={violation} showHighlight={showHighlight} />
      </AccordionContent>
    </AccordionItem>
  );
};
