import React from "react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RuleResult } from "@/features/linter/model/rule.types";
import { ViolationHeader } from "./ViolationHeader";
import { ViolationDetails } from "./ViolationDetails";

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

  return (
    <AccordionItem key={id} value={id} className="border-b last:border-b-0 ">
      <AccordionTrigger className="py-1 px-1.5 text-[12px] font-medium w-full">
        <ViolationHeader violation={violation} />
      </AccordionTrigger>
      <AccordionContent className="px-2 pb-2 pt-0 w-full overflow-hidden">
        <ViolationDetails violation={violation} showHighlight={showHighlight} />
      </AccordionContent>
    </AccordionItem>
  );
};
