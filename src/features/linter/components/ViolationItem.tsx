import React, { useState } from "react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { RuleResult, Severity } from "@/features/linter/types/rule-types";
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
  console.log("ViolationItem severity:", violation.severity, violation);
  const sev = violation.severity as Severity;
  const id = `${violation.ruleId}-${violation.className || "unknown"}-${index}`;
  const parsedMessage = parseDuplicateMessage(violation.message);
  const formattedProperty = violation.metadata?.formattedProperty;

  return (
    <AccordionItem key={id} value={id} className="border-b last:border-b-0 ">
      <AccordionTrigger className="py-1 px-1.5 text-[12px] font-medium w-full">
        <div className="flex min-w-0 items-center gap-2 w-full">
          <span
            className={cn(
              "h-2 w-2 rounded-full flex-shrink-0",
              severityDot[sev]
            )}
            aria-hidden
            title={violation.severity}
          />
          <span className={cn("font-semibold truncate", severityText[sev])}>
            {violation.name}
          </span>
          {violation.metadata?.unrecognizedElement && (
            <Badge
              variant="outline"
              className="ml-2 text-orange-600 border-orange-300 bg-orange-50 text-[10px]"
            >
              Unrecognized Element
            </Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-2 pb-2 pt-0 w-full overflow-hidden">
        <div className="text-[12px] leading-5 w-full min-w-0 overflow-hidden">
          {formattedProperty ? (
            <FormattedPropertyMessage property={formattedProperty} />
          ) : parsedMessage ? (
            <DuplicatePropertiesMessage parsedMessage={parsedMessage} />
          ) : (
            <DefaultMessage
              message={violation.message}
              example={violation.example}
            />
          )}
          {violation.ruleId !== "no-styles-or-classes" && (
            <ClassBadge violation={violation} />
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

interface FormattedPropertyMessageProps {
  property: {
    property: string;
    value: string;
    classes: string[];
  };
}

const FormattedPropertyMessage: React.FC<FormattedPropertyMessageProps> = ({
  property,
}) => (
  <div className="space-y-2  min-w-0 overflow-hidden">
    <p className="text-muted-foreground">
      This utility class is an exact duplicate of another single-property class:
    </p>
    <div className="space-y-1.5 pl-2 border-l-2 border-muted w-full min-w-0 overflow-hidden">
      <PropertyDuplicate property={property} />
    </div>
    <p className="text-[11px] text-muted-foreground italic">
      Consolidate these classes.
    </p>
  </div>
);

interface DuplicatePropertiesMessageProps {
  parsedMessage: ParsedDuplicateMessage;
}

const DuplicatePropertiesMessage: React.FC<DuplicatePropertiesMessageProps> = ({
  parsedMessage,
}) => (
  <div className="space-y-2 w-full min-w-0 overflow-hidden">
    <p className="text-muted-foreground">{parsedMessage.intro}</p>
    <div className="space-y-1.5 pl-2 border-l-2 border-muted w-full min-w-0 overflow-hidden">
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

const PropertyDuplicate: React.FC<PropertyDuplicateProps> = ({ property }) => {
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);

  return (
    <div className="text-[11px] w-full min-w-0">
      <div className="flex flex-col items-start gap-1 w-full">
        <Collapsible
          open={isPropertiesOpen}
          onOpenChange={setIsPropertiesOpen}
          className="w-full"
        >
          <CollapsibleTrigger className="flex items-start gap-1 hover:opacity-80 transition-opacity w-full">
            <Badge
              variant="inheritedProperty"
              className="break-words whitespace-normal max-w-full"
            >
              <span className="text-left">
                {property.property}: {property.value}
              </span>
            </Badge>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200 flex-shrink-0 mt-0.5",
                isPropertiesOpen ? "rotate-180" : ""
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-1 w-full pl-2 border-l pb-4">
            {property.classes.map((cls, clsIdx) => (
              <div key={clsIdx} className="flex flex-col gap-2 w-full min-w-0 ">
                <Badge
                  isCombo={false}
                  copyable
                  className="break-words whitespace-normal max-w-full"
                >
                  {cls}
                </Badge>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

interface DefaultMessageProps {
  message: string;
  example?: string;
}

const DefaultMessage: React.FC<DefaultMessageProps> = ({
  message,
  example,
}) => (
  <div>
    <p className="text-muted-foreground">{message}</p>
    {example && (
      <p className="mt-1 font-mono text-[11px] bg-muted/30 px-2 py-1 rounded inline-block">
        {example}
      </p>
    )}
  </div>
);

interface ClassBadgeProps {
  violation: RuleResult;
}

const ClassBadge: React.FC<ClassBadgeProps> = ({ violation }) => (
  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground w-full min-w-0">
    <span className="opacity-80 flex-shrink-0">Class:</span>
    <Badge
      isCombo={violation.isCombo}
      comboIndex={violation.comboIndex}
      className="truncate max-w-full"
    >
      <span className="text-left flex items-center">
        <code className="font-mono text-[10px]">
          {violation.className || "—"}
        </code>
      </span>
    </Badge>
  </div>
);
