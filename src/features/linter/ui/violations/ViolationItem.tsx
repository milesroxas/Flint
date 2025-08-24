import React from "react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";
import { RuleResult, Severity } from "@/features/linter/model/rule.types";
import { ViolationHeader } from "./ViolationHeader";
import { ViolationDetails, ClassBadge } from "./ViolationDetails";
import { ExpandViewButton } from "../controls/ExpandViewButton";
import { useExpandedView } from "@/features/linter/store/expandedView.store";
import { expandedViewCapabilitiesService } from "@/features/linter/services/expanded-view-capabilities.service";
import { getCurrentPreset } from "@/features/linter/model/linter.factory";
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
  const { openExpandedView } = useExpandedView();

  const sev = violation.severity as Severity;
  const severityLeftBorder: Record<Severity, string> = {
    error: "border-l-error",
    warning: "border-l-warning",
    suggestion: "border-l-suggestion",
  };
  const borderColorClass = severityLeftBorder[sev];

  // Check if this violation has expanded view capabilities
  const primaryCapability =
    expandedViewCapabilitiesService.getPrimaryCapability(violation);

  const handleExpandedViewClick = () => {
    if (!primaryCapability) return;

    // Create appropriate content based on the capability type
    let contentData: unknown;
    if (primaryCapability.contentType === "recognized-elements") {
      contentData = {
        presetId: getCurrentPreset(),
        projectElements: [], // TODO: Get from configuration
      };
    }

    openExpandedView({
      type: primaryCapability.contentType,
      title: primaryCapability.title,
      data: contentData,
      sourceRuleId: violation.ruleId,
    });
  };

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
        {/* Show expand button only when violation has expanded view capabilities */}
        {primaryCapability && (
          <div className="flex justify-end mt-2">
            <ExpandViewButton
              onClick={handleExpandedViewClick}
              isExpanded={false}
            />
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
};
