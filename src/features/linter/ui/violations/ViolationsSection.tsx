import React from "react";
import { Accordion } from "@/shared/ui/accordion";
import { RuleResult } from "@/features/linter/model/rule.types";
import { ViolationItem } from "./ViolationItem";
import { selectElementById } from "@/features/window/select-element";

export interface ViolationsSectionProps {
  title: string;
  items: RuleResult[];
  showHighlight?: boolean;
  defaultOpenIds?: string[];
  animationDelay?: number;
  shouldAnimate?: boolean;
}

export const ViolationsSection: React.FC<ViolationsSectionProps> = ({
  // title,
  items,
  showHighlight = true,
  defaultOpenIds = [],
  animationDelay = 0,
  shouldAnimate = false,
}) => {
  const prevOpenSetRef = React.useRef<Set<string>>(new Set<string>());
  const [openValues, setOpenValues] = React.useState<string[]>(defaultOpenIds);
  const prevDefaultOpenSetRef = React.useRef<Set<string>>(
    new Set(defaultOpenIds)
  );
  const [isVisible, setIsVisible] = React.useState(false);

  // Keep open state in sync when the caller provides a new default set
  // This restores the auto-open behavior when switching modes or lists change
  React.useEffect(() => {
    const nextDefaultSet = new Set(defaultOpenIds);
    const prevDefaultSet = prevDefaultOpenSetRef.current;
    const isSameSize = nextDefaultSet.size === prevDefaultSet.size;
    let isEqual = isSameSize;
    if (isEqual) {
      for (const id of nextDefaultSet) {
        if (!prevDefaultSet.has(id)) {
          isEqual = false;
          break;
        }
      }
    }
    if (!isEqual) {
      setOpenValues(defaultOpenIds);
      prevOpenSetRef.current = new Set(defaultOpenIds);
      prevDefaultOpenSetRef.current = nextDefaultSet;
    }
  }, [defaultOpenIds]);

  // Trigger animation based on shouldAnimate prop
  React.useEffect(() => {
    if (shouldAnimate && items.length > 0) {
      setIsVisible(true);
    } else if (!shouldAnimate) {
      setIsVisible(false);
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
        type="multiple"
        value={openValues}
        className="w-full"
        onValueChange={async (values: string[]) => {
          setOpenValues(values);

          if (!showHighlight) return;
          const prevSet = prevOpenSetRef.current;
          const newlyOpened = values.filter((v) => !prevSet.has(v));
          prevOpenSetRef.current = new Set(values);
          if (newlyOpened.length === 0) return;
          const lastOpenedId = newlyOpened[newlyOpened.length - 1];

          const indexById = new Map<string, number>();
          items.forEach((violation, index) => {
            indexById.set(getItemId(violation, index), index);
          });
          const idx = indexById.get(lastOpenedId);
          if (idx === undefined) return;
          const violation = items[idx];
          const elementId = violation?.elementId;
          if (!elementId) return;
          try {
            await selectElementById(elementId);
          } catch {
            // ignore highlighting errors
          }
        }}
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
