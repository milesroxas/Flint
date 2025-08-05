import React from "react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RuleResult, Severity } from "@/features/linter/types";
import {
  severityDot,
  severityText,
} from "@/features/linter/lib/severity-styles";
import {
  parseDuplicateMessage,
  ParsedDuplicateMessage,
} from "@/features/linter/lib/message-parser";

interface ViolationItemProps {
  violation: RuleResult;
  index: number;
}

export const ViolationItem: React.FC<ViolationItemProps> = ({
  violation,
  index,
}) => {
  const sev = violation.severity as Severity;
  const id = `${violation.ruleId}-${violation.className || "unknown"}-${index}`;
  const parsedMessage = parseDuplicateMessage(violation.message);

  return (
    <AccordionItem key={id} value={id} className="border-b last:border-b-0">
      <AccordionTrigger className="py-1 px-1.5 text-[12px] font-medium">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn("h-2 w-2 rounded-full", severityDot[sev])}
            aria-hidden
            title={violation.severity}
          />
          <span className={cn("font-semibold", severityText[sev])}>
            {violation.name}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-2 pb-2 pt-0">
        <div className="text-[12px] leading-5">
          {parsedMessage ? (
            <DuplicatePropertiesMessage parsedMessage={parsedMessage} />
          ) : (
            <DefaultMessage message={violation.message} />
          )}
          <ClassBadge violation={violation} />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

interface DuplicatePropertiesMessageProps {
  parsedMessage: ParsedDuplicateMessage;
}

const DuplicatePropertiesMessage: React.FC<DuplicatePropertiesMessageProps> = ({
  parsedMessage,
}) => (
  <div className="space-y-2">
    <p className="text-muted-foreground">{parsedMessage.intro}</p>
    <div className="space-y-1.5 pl-2 border-l-2 border-muted">
      {parsedMessage.properties.map((prop, idx) => (
        <PropertyDuplicate key={idx} property={prop} />
      ))}
    </div>
    <p className="text-[11px] text-muted-foreground italic">
      Consider consolidating.
    </p>
  </div>
);

interface PropertyDuplicateProps {
  property: {
    property: string;
    value: string;
    classes: string[];
  };
}

const PropertyDuplicate: React.FC<PropertyDuplicateProps> = ({ property }) => (
  <div className="text-[11px]">
    <div className="flex items-start gap-1">
      <code className="font-mono font-semibold text-foreground">
        {property.property}:
      </code>
      <code className="font-mono text-muted-foreground">{property.value}</code>
    </div>
    <div className="mt-0.5 text-[10px] text-muted-foreground">
      <span className="opacity-70">also in: </span>
      {property.classes.map((cls, clsIdx) => (
        <React.Fragment key={clsIdx}>
          <code className="font-mono bg-muted/30 px-1 py-0.5 rounded">
            {cls}
          </code>
          {clsIdx < property.classes.length - 1 && ", "}
        </React.Fragment>
      ))}
    </div>
  </div>
);

interface DefaultMessageProps {
  message: string;
}

const DefaultMessage: React.FC<DefaultMessageProps> = ({ message }) => (
  <p className="text-muted-foreground">{message}</p>
);

interface ClassBadgeProps {
  violation: RuleResult;
}

const ClassBadge: React.FC<ClassBadgeProps> = ({ violation }) => (
  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
    <span className="opacity-80">Class:</span>
    <Badge isCombo={violation.isCombo} comboIndex={violation.comboIndex}>
      <code className="font-mono text-[10px]">
        {violation.className || "—"}
      </code>
    </Badge>
  </div>
);
