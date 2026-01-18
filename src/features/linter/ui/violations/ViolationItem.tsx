import React from "react";
import { getCurrentPreset } from "@/features/linter/model/linter.factory";
import type { RuleResult, Severity } from "@/features/linter/model/rule.types";
import { expandedViewCapabilitiesService } from "@/features/linter/services/expanded-view-capabilities.service";
import { useExpandedView } from "@/features/linter/store/expandedView.store";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/ui/accordion";
import { cn } from "@/shared/utils";
import { ClassBadge, ViolationDetails } from "./ViolationDetails";
import { ViolationHeader } from "./ViolationHeader";

interface ViolationItemProps {
  violation: RuleResult;
  index: number;
  showHighlight?: boolean;
  animationDelay?: number;
  shouldAnimate?: boolean;
}

export const ViolationItem: React.FC<ViolationItemProps> = ({
  violation,
  index,
  showHighlight = true,
  animationDelay = 0,
  shouldAnimate = false,
}) => {
  const id = `${violation.ruleId}-${violation.className || "unknown"}-${index}`;
  const { openExpandedView } = useExpandedView();
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (shouldAnimate) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [shouldAnimate]);

  const sev = violation.severity as Severity;
  const severityLeftBorder: Record<Severity, string> = {
    error: "border-l-error",
    warning: "border-l-warning",
    suggestion: "border-l-suggestion",
  };
  const borderColorClass = severityLeftBorder[sev];

  // Check if this violation has expanded view capabilities
  const primaryCapability = expandedViewCapabilitiesService.getPrimaryCapability(violation);

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
    <AccordionItem
      key={id}
      value={id}
      className={cn(
        "border-b last:border-b-0 transition-all duration-700 ease-spring",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      )}
      style={{ transitionDelay: `${animationDelay}ms` }}
    >
      <AccordionTrigger className="py-2 px-1.5 w-full">
        <div className="flex flex-col items-start gap-1 w-full min-w-0">
          <ViolationHeader violation={violation} />
          {violation.ruleId !== "no-styles-or-classes" && (
            <div className={cn("w-full ml-0.5 pl-1 border-l-2", borderColorClass)}>
              <ClassBadge violation={violation} />
            </div>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-2 pb-2 pt-0 w-full overflow-hidden">
        <ViolationDetails
          violation={violation}
          showHighlight={showHighlight}
          onExpandedViewClick={handleExpandedViewClick}
          expandedViewConfig={
            primaryCapability
              ? {
                  showButton: true,
                  buttonText: primaryCapability.title || "View Details",
                  buttonClassName: "cursor-pointer w-full",
                }
              : undefined
          }
        />
      </AccordionContent>
    </AccordionItem>
  );
};
