import React, { useState } from "react";

import { Badge } from "@/shared/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/utils";
import { RuleResult, Severity } from "@/features/linter/model/rule.types";
import { ExpandViewButton } from "../controls/ExpandViewButton";

import {
  parseDuplicateMessage,
  ParsedDuplicateMessage,
} from "@/features/linter/lib/message-parser";
import { formatViolationMessage } from "@/features/linter/lib/message-formatter";
import { ViolationMessage } from "./ViolationMessage";

type TextConfig = {
  suggestedFixLabel: string;
  currentOrderLabel: string;
  properOrderLabel: string;
  propertiesLabel: string;
  detectionLabel: string;
  detectionApi: string;
  detectionHeuristic: string;
  duplicateClassMessage: string;
  duplicateClassFooter: string;
  exactMatchMessage: string;
  exactMatchFooter: string;
  consolidateMessage: string;
};

interface ViolationDetailsProps {
  violation: RuleResult;
  showHighlight?: boolean;
  onExpandedViewClick?: () => void;
  expandedViewConfig?: {
    showButton: boolean;
    buttonText: string;
    buttonClassName?: string;
  };
  textConfig?: Partial<TextConfig>;
}

export const ViolationDetails: React.FC<ViolationDetailsProps> = ({
  violation,
  // showHighlight = true,
  onExpandedViewClick,
  expandedViewConfig,
  textConfig,
}) => {
  const parsedMessage = parseDuplicateMessage(violation.message);
  const formattedProperty = violation.metadata?.formattedProperty;
  const sev = violation.severity as Severity;
  const severityLeftBorder: Record<Severity, string> = {
    error: "border-l-error",
    warning: "border-l-warning",
    suggestion: "border-l-suggestion",
  };

  // Default text configuration
  const defaultTextConfig: TextConfig = {
    suggestedFixLabel: "Suggested Fix:",
    currentOrderLabel: "Current order:",
    properOrderLabel: "Proper order:",
    propertiesLabel: "Properties:",
    detectionLabel: "Detection:",
    detectionApi: "API",
    detectionHeuristic: "Heuristic",
    duplicateClassMessage:
      "This class is an exact duplicate of another single-property class:",
    duplicateClassFooter: "Consolidate these classes.",
    exactMatchMessage:
      "This class has an identical set of properties as these classes:",
    exactMatchFooter: "Consolidate these classes.",
    consolidateMessage: "Consider consolidating.",
  };

  const finalTextConfig = { ...defaultTextConfig, ...textConfig };

  return (
    <div className="text-[12px] leading-5 w-full min-w-0 overflow-hidden py-2 bg-accent/10 px-2 rounded-sm">
      {Array.isArray(violation.metadata?.exactMatches) &&
      violation.metadata.exactMatches.length > 0 ? (
        <ExactMatchesMessage
          classes={violation.metadata.exactMatches}
          properties={(violation.metadata as any)?.exactMatchProperties}
          textConfig={finalTextConfig}
        />
      ) : formattedProperty ? (
        <FormattedPropertyMessage
          property={formattedProperty}
          textConfig={finalTextConfig}
        />
      ) : parsedMessage ? (
        <DuplicatePropertiesMessage
          parsedMessage={parsedMessage}
          textConfig={finalTextConfig}
        />
      ) : (
        <DefaultMessage
          message={violation.message}
          example={violation.example}
        />
      )}

      {violation.metadata?.suggestedName && (
        <>
          <div className="mt-2 text-[11px]">
            <span className="text-muted-foreground mr-2 font-medium">
              {finalTextConfig.suggestedFixLabel}
            </span>
            <Badge
              variant="suggestionContent"
              isCombo={false}
              copyable
              className="whitespace-normal break-words max-w-full align-middle"
            >
              <span className="text-left flex items-center">
                <code className="font-mono text-[10px] break-words break-all">
                  {violation.metadata.suggestedName}
                </code>
              </span>
            </Badge>
          </div>
          {expandedViewConfig?.showButton && onExpandedViewClick && (
            <div className="flex mt-2">
              <ExpandViewButton
                onClick={onExpandedViewClick}
                isExpanded={false}
                text={expandedViewConfig.buttonText}
                className={
                  expandedViewConfig.buttonClassName || "cursor-pointer w-full"
                }
              />
            </div>
          )}
        </>
      )}

      {Array.isArray(violation.metadata?.currentOrder) &&
        Array.isArray(violation.metadata?.properOrder) && (
          <div className="mt-1 space-y-1 text-[11px]">
            <div>
              <strong>{finalTextConfig.currentOrderLabel}</strong>{" "}
              {violation.metadata.currentOrder.join(" → ")}
            </div>
            <div>
              <strong>{finalTextConfig.properOrderLabel}</strong>{" "}
              {violation.metadata.properOrder.join(" → ")}
            </div>
          </div>
        )}

      {Array.isArray(violation.metadata?.combos) && (
        <div
          className={cn(
            "mt-1 text-[11px] border-l pl-2",
            severityLeftBorder[sev]
          )}
        >
          <div className="mb-2">
            <Badge
              className="whitespace-normal break-words max-w-full"
              variant="webflowClassMuted"
            >
              <span className="text-left flex items-center">
                <code className="font-mono text-xs px-1 break-all ">
                  {(violation.metadata as any)?.baseCustomClass ||
                    violation.className ||
                    "—"}
                </code>
              </span>
            </Badge>
          </div>

          <div className={cn("mb-2 border-l pl-2", severityLeftBorder[sev])}>
            {violation.metadata.combos.map((c: string, i: number) => (
              <div className="mb-2">
                <div className="flex items-center" key={`${c}-${i}`}>
                  <Badge className="ml-1  break-words" isCombo={true}>
                    {c}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {violation.metadata?.detectionSource &&
        violation.metadata.detectionSource !== "api" && (
          <div className="mt-1 text-[10px] text-muted-foreground">
            {finalTextConfig.detectionLabel}{" "}
            {violation.metadata.detectionSource === "api"
              ? finalTextConfig.detectionApi
              : finalTextConfig.detectionHeuristic}
          </div>
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

const FormattedPropertyMessage: React.FC<
  FormattedPropertyMessageProps & { textConfig: TextConfig }
> = ({ property, textConfig }) => (
  <ViolationMessage
    variant="list"
    message={textConfig.duplicateClassMessage}
    footer={textConfig.duplicateClassFooter}
  >
    <PropertyDuplicate property={property} />
  </ViolationMessage>
);

interface DuplicatePropertiesMessageProps {
  parsedMessage: ParsedDuplicateMessage;
}

const DuplicatePropertiesMessage: React.FC<
  DuplicatePropertiesMessageProps & { textConfig: TextConfig }
> = ({ parsedMessage, textConfig }) => (
  <ViolationMessage
    variant="list"
    message={parsedMessage.intro}
    footer={textConfig.consolidateMessage}
  >
    {parsedMessage.properties.map((prop, idx) => (
      <PropertyDuplicate key={idx} property={prop} />
    ))}
  </ViolationMessage>
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
                <Badge variant="webflowClassMuted" isCombo={false} copyable>
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

interface ExactMatchesMessageProps {
  classes: string[];
  properties?: { property: string; value: string }[];
}

const ExactMatchesMessage: React.FC<
  ExactMatchesMessageProps & { textConfig: TextConfig }
> = ({ classes, properties, textConfig }) => (
  <ViolationMessage
    variant="list"
    message={textConfig.exactMatchMessage}
    footer={textConfig.exactMatchFooter}
  >
    <div className="mt-1 space-y-1">
      {classes.map((cls, idx) => (
        <div className="flex flex-col gap-2" key={idx}>
          <Badge variant="webflowClassMuted" isCombo={false} copyable>
            {cls}
          </Badge>
        </div>
      ))}
    </div>
    {Array.isArray(properties) && properties.length > 0 && (
      <div className="mt-2 space-y-1">
        <h3 className="text-xs text-muted-foreground">
          {textConfig.propertiesLabel}
        </h3>
        {properties.map((p, i) => (
          <Badge
            key={i}
            variant="inheritedProperty"
            className="break-words whitespace-normal font-normal text-xs flex gap-1"
          >
            <span className="text-left">
              <strong>{p.property}:</strong> {p.value}
            </span>
          </Badge>
        ))}
      </div>
    )}
  </ViolationMessage>
);

interface DefaultMessageProps {
  message: string;
  example?: string;
}

const DefaultMessage: React.FC<DefaultMessageProps> = ({
  message,
  example,
}) => (
  <ViolationMessage
    variant="plain"
    message={formatViolationMessage(message)}
    example={example}
  />
);

export interface ClassBadgeProps {
  violation: RuleResult;
}

export const ClassBadge: React.FC<ClassBadgeProps> = ({ violation }) => (
  <div className="mt-1.5 pl-2">
    <Badge
      isCombo={violation.isCombo}
      variant="webflowClass"
      className="whitespace-normal break-words max-w-full"
    >
      <span className="text-left flex items-center">
        <code className="font-mono text-xs font-normal break-all">
          {violation.className || "—"}
        </code>
      </span>
    </Badge>
  </div>
);

export default ViolationDetails;
