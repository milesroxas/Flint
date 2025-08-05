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

  return (
    <div className="p-1">
      {/* Header with total count */}
      <div className="relative mb-1 flex items-center justify-between">
        <span className="text-[12px] font-medium">Lint Issues Found</span>
        <span
          className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive/10 px-1 text-[10px] font-semibold tabular-nums text-destructive"
          aria-label="Total lint issues"
        >
          {violations.length}
        </span>
      </div>

      {/* Multiple so users can open more than one violation at once */}
      <Accordion type="multiple" className="w-full">
        <ScrollArea className="max-h-40">
          {violations.map((v, i) => {
            const sev = v.severity as Severity;
            const id = `${v.ruleId}-${v.className || "unknown"}-${i}`;
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
                    <p className="text-muted-foreground">{v.message}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="opacity-80">Class:</span>
                      <Badge isCombo={v.isCombo} comboIndex={v.comboIndex}>
                        <code className="font-mono text-[10px]">
                          {" "}
                          {v.className || "—"}
                        </code>
                      </Badge>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </ScrollArea>
      </Accordion>
    </div>
  );
};
