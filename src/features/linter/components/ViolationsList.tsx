import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion } from "@/components/ui/accordion";
import { RuleResult } from "@/features/linter/types/rule-types";
import { ViolationItem } from "./ViolationItem";

interface ViolationsListProps {
  violations: RuleResult[];
}

export const ViolationsList: React.FC<ViolationsListProps> = ({
  violations,
}) => {
  // If there's exactly one violation, auto-open that item
  const singleOpenId =
    violations.length === 1
      ? `${violations[0].ruleId}-${violations[0].className || "unknown"}-0`
      : undefined;
  const defaultOpenIds = singleOpenId ? [singleOpenId] : [];

  return (
    <ScrollArea className="max-h-40">
      <Accordion
        key={violations.length}
        type="multiple"
        defaultValue={defaultOpenIds}
        className="w-full"
      >
        {violations.map((violation, index) => (
          <ViolationItem
            key={`${violation.ruleId}-${
              violation.className || "unknown"
            }-${index}`}
            violation={violation}
            index={index}
          />
        ))}
      </Accordion>
    </ScrollArea>
  );
};
