import React from "react";
import type { RuleResult } from "@/features/linter/model/rule.types";
import { Accordion } from "@/shared/ui/accordion";
import { ViolationItem } from "./ViolationItem";

export interface ViolationsSectionProps {
  title: string;
  items: RuleResult[];
  showHighlight?: boolean;
  // Controlled open id (global single-open behavior)
  openId?: string;
  // Notify parent when open id changes
  onOpenChange?: (id: string | undefined) => void;
  animationDelay?: number;
  shouldAnimate?: boolean;
}

export const ViolationsSection: React.FC<ViolationsSectionProps> = ({
  // title,
  items,
  showHighlight = true,
  openId,
  onOpenChange,
  animationDelay = 0,
  shouldAnimate = false,
}) => {
  // Determine if the controlled openId belongs to this section
  const sectionIds = React.useMemo(() => {
    const ids = new Set<string>();
    items.forEach((violation, index) => {
      ids.add(`${violation.ruleId}-${violation.className || "unknown"}-${index}`);
    });
    return ids;
  }, [items]);
  // Initialize to current animation intent to avoid duplicate entrance animations
  const [isVisible, setIsVisible] = React.useState<boolean>(shouldAnimate);

  // Trigger animation based on shouldAnimate prop
  React.useEffect(() => {
    if (shouldAnimate && items.length > 0) {
      setIsVisible((prev) => (prev ? prev : true));
    } else if (!shouldAnimate) {
      setIsVisible((prev) => (prev ? false : prev));
    }
  }, [shouldAnimate, items.length]);

  const getItemId = (violation: RuleResult, index: number): string =>
    `${violation.ruleId}-${violation.className || "unknown"}-${index}`;

  if (items.length === 0) return null;

  return (
    <div
      className={`mb-2 pt-2 transition-all duration-700 ease-spring ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
      style={{ transitionDelay: `${animationDelay}ms` }}
    >
      {/* <div className="text-xs text-muted-foreground mb-1">
        {title} ({items.length})
      </div> */}
      <Accordion
        type="single"
        collapsible
        // Only control value for ids in this section; otherwise keep closed
        value={openId && sectionIds.has(openId) ? openId : undefined}
        className="w-full"
        onValueChange={(val) => onOpenChange?.(val || undefined)}
      >
        {items.map((violation, index) => (
          <ViolationItem
            key={getItemId(violation, index)}
            violation={violation}
            index={index}
            showHighlight={showHighlight}
            animationDelay={animationDelay + index * 80} // Stagger each item by 80ms
            shouldAnimate={isVisible}
          />
        ))}
      </Accordion>
    </div>
  );
};

export default ViolationsSection;
