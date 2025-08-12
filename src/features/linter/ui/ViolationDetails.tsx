import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { RuleResult } from "@/features/linter/model/rule.types";
import {
  parseDuplicateMessage,
  ParsedDuplicateMessage,
} from "@/features/linter/lib/message-parser";
import { selectElementById } from "@/features/window/select-element";

interface ViolationDetailsProps {
  violation: RuleResult;
  showHighlight?: boolean;
}

export const ViolationDetails: React.FC<ViolationDetailsProps> = ({
  violation,
  showHighlight = true,
}) => {
  const parsedMessage = parseDuplicateMessage(violation.message);
  const formattedProperty = violation.metadata?.formattedProperty;

  return (
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

      {violation.metadata?.suggestedName && (
        <div className="mt-1 text-[11px]">
          <span className="opacity-80 mr-2">Suggested:</span>
          <Badge
            isCombo={false}
            copyable
            className="truncate max-w-full align-middle"
          >
            <span className="text-left flex items-center">
              <code className="font-mono text-[10px]">
                {violation.metadata.suggestedName}
              </code>
            </span>
          </Badge>
        </div>
      )}

      {Array.isArray(violation.metadata?.currentOrder) &&
        Array.isArray(violation.metadata?.properOrder) && (
          <div className="mt-1 space-y-1 text-[11px]">
            <div>
              <strong>Current order:</strong>{" "}
              {violation.metadata.currentOrder.join(" → ")}
            </div>
            <div>
              <strong>Proper order:</strong>{" "}
              {violation.metadata.properOrder.join(" → ")}
            </div>
          </div>
        )}

      {Array.isArray(violation.metadata?.combos) && (
        <div className="mt-1 text-[11px]">
          Combos (in order):{" "}
          {violation.metadata.combos.map((c: string, i: number) => (
            <Badge key={`${c}-${i}`} className="ml-1">
              {c}
            </Badge>
          ))}
          {typeof violation.metadata?.maxCombos === "number" && (
            <span className="ml-2 text-muted-foreground">
              Limit: {violation.metadata.maxCombos}
            </span>
          )}
        </div>
      )}

      {showHighlight && violation.metadata?.elementId && (
        <div className="mt-1.5">
          <Button
            variant="outline"
            size="sm"
            className="text-[11px]"
            onClick={async () => {
              const id = violation.metadata?.elementId as string | undefined;
              if (!id) return;
              if (import.meta.env.DEV) {
                // eslint-disable-next-line no-console
                console.debug("[flowlint] click highlight", {
                  ruleId: violation.ruleId,
                  className: violation.className,
                  elementId: id,
                });
              }
              await selectElementById(id);
            }}
          >
            Highlight element
          </Button>
        </div>
      )}

      {violation.ruleId !== "no-styles-or-classes" && (
        <ClassBadge violation={violation} />
      )}
    </div>
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
              className="break-words whitespace-normal"
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
          <CollapsibleContent className="mt-2 space-y-1 pl-2 border-l pb-4">
            {property.classes.map((cls, clsIdx) => (
              <div key={clsIdx} className="flex flex-col gap-2">
                <Badge isCombo={false} copyable>
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
    <Badge isCombo={violation.isCombo} className="truncate max-w-full">
      <span className="text-left flex items-center">
        <code className="font-mono text-[10px]">
          {violation.className || "—"}
        </code>
      </span>
    </Badge>
  </div>
);

export default ViolationDetails;
