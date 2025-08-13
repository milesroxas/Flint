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
}

export const ViolationsSection: React.FC<ViolationsSectionProps> = ({
  // title,
  items,
  showHighlight = true,
  defaultOpenIds = [],
}) => {
  const prevOpenSetRef = React.useRef<Set<string>>(new Set<string>());
  const [openValues, setOpenValues] = React.useState<string[]>(defaultOpenIds);
  const prevDefaultOpenSetRef = React.useRef<Set<string>>(
    new Set(defaultOpenIds)
  );

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

  const getItemId = (violation: RuleResult, index: number): string =>
    `${violation.ruleId}-${violation.className || "unknown"}-${index}`;

  if (items.length === 0) return null;

  return (
    <div className="mb-2 pt-2">
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
          const elementId = violation?.metadata?.elementId as
            | string
            | undefined;
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
          />
        ))}
      </Accordion>
    </div>
  );
};

export default ViolationsSection;
