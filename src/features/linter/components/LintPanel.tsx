import React, { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { runLint } from "@/features/linter/engine";
import { RuleResult, Severity } from "@/features/linter/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

declare const webflow: {
  subscribe: (event: "selectedelement", cb: (el: any) => void) => () => void;
};

const sevDot: Record<Severity, string> = {
  error: "bg-red-500",
  warning: "bg-amber-500",
  suggestion: "bg-slate-400",
};

const sevText: Record<Severity, string> = {
  error: "text-red-700 dark:text-red-300",
  warning: "text-amber-800 dark:text-amber-200",
  suggestion: "text-slate-700 dark:text-slate-200",
};

// Helper function to parse duplicate properties message
function parseDuplicateMessage(message: string) {
  // Check if this is a duplicate properties message
  if (!message.includes("duplicate properties:")) {
    return null;
  }

  // Extract the main message and properties section
  const [intro, propertiesSection] = message.split("duplicate properties:");
  if (!propertiesSection) return null;

  // Split by semicolon to get individual properties
  // Remove the final "Consider consolidating." part
  const propertyParts = propertiesSection
    .replace(/\.\s*Consider consolidating\.$/, "")
    .split(";")
    .filter((part) => part.trim());

  // Parse each property
  const properties = propertyParts
    .map((part) => {
      const match = part.match(/^\s*([^:]+):(.*?)\s*\(also in:\s*(.*?)\)\s*$/);
      if (match) {
        const [, property, value, classes] = match;
        return {
          property: property.trim(),
          value: value.trim(),
          classes: classes.split(",").map((c) => c.trim()),
        };
      }
      return null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return {
    intro: intro.trim(),
    properties,
  };
}

export const LintPanel: React.FC = () => {
  const [violations, setViolations] = useState<RuleResult[]>([]);

  useEffect(() => {
    const unsubscribe = webflow.subscribe("selectedelement", async (el) => {
      if (!el) {
        setViolations([]);
        return;
      }
      const results = await runLint(el);
      setViolations(results);
    });
    return () => unsubscribe();
  }, []);

  if (!violations.length) return null;

  const singleOpenId =
    violations.length === 1
      ? `${violations[0].ruleId}-${violations[0].className || "unknown"}-0`
      : undefined;
  const defaultOpenIds = singleOpenId ? [singleOpenId] : [];

  return (
    <div className="p-1">
      {/* Header with total count */}
      <div className="relative mb-1 flex items-center justify-between">
        <span className="text-[12px] font-medium">
          Found {violations.length} issues
        </span>
        <span
          className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive/10 px-1 text-[10px] font-semibold tabular-nums text-destructive"
          aria-label="Total lint issues"
        >
          {violations.length}
        </span>
      </div>

      <ScrollArea className="max-h-40">
        {/* key on violations.length forces a fresh mount whenever count changes */}
        <Accordion
          key={violations.length}
          type="multiple"
          defaultValue={defaultOpenIds}
          className="w-full"
        >
          {violations.map((v, i) => {
            const sev = v.severity as Severity;
            const id = `${v.ruleId}-${v.className || "unknown"}-${i}`;
            const parsedMessage = parseDuplicateMessage(v.message);

            return (
              <AccordionItem
                key={id}
                value={id}
                className="border-b last:border-b-0"
              >
                <AccordionTrigger className="py-1 px-1.5 text-[12px] font-medium">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={cn("h-2 w-2 rounded-full", sevDot[sev])}
                      aria-hidden
                      title={v.severity}
                    />
                    <span className={cn("font-semibold", sevText[sev])}>
                      {v.name}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-2 pb-2 pt-0">
                  <div className="text-[12px] leading-5">
                    {parsedMessage ? (
                      // Structured display for duplicate properties
                      <div className="space-y-2">
                        <p className="text-muted-foreground">
                          {parsedMessage.intro}
                        </p>
                        <div className="space-y-1.5 pl-2 border-l-2 border-muted">
                          {parsedMessage.properties.map((prop, idx) => (
                            <div key={idx} className="text-[11px]">
                              <div className="flex items-start gap-1">
                                <code className="font-mono font-semibold text-foreground">
                                  {prop.property}:
                                </code>
                                <code className="font-mono text-muted-foreground">
                                  {prop.value}
                                </code>
                              </div>
                              <div className="mt-0.5 text-[10px] text-muted-foreground">
                                <span className="opacity-70">also in: </span>
                                {prop.classes.map((cls, clsIdx) => (
                                  <React.Fragment key={clsIdx}>
                                    <code className="font-mono bg-muted/30 px-1 py-0.5 rounded">
                                      {cls}
                                    </code>
                                    {clsIdx < prop.classes.length - 1 && ", "}
                                  </React.Fragment>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-[11px] text-muted-foreground italic">
                          Consider consolidating.
                        </p>
                      </div>
                    ) : (
                      // Default display for other message types
                      <p className="text-muted-foreground">{v.message}</p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="opacity-80">Class:</span>
                      <Badge isCombo={v.isCombo} comboIndex={v.comboIndex}>
                        <code className="font-mono text-[10px]">
                          {v.className || "—"}
                        </code>
                      </Badge>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </ScrollArea>
    </div>
  );
};
