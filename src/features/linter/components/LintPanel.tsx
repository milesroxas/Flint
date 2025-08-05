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
      <Accordion type="single" collapsible>
        <AccordionItem value="violations" className="border-none">
          {/* Ensure your AccordionTrigger renders a button with aria-controls/expanded.
             See a11y tips in the sources. */}
          <AccordionTrigger className="py-1 px-1.5 text-[12px] font-medium justify-items-start relative">
            <span>Lint Issues Found</span>
            <span
              className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive/10 px-1 text-[10px] font-semibold tabular-nums text-destructive"
              aria-hidden="true"
            >
              {violations.length}
            </span>
          </AccordionTrigger>

          <AccordionContent>
            <ScrollArea className="max-h-40">
              <ul className="divide-y divide-border/70">
                {violations.map((v, i) => {
                  const sev = v.severity as Severity;
                  return (
                    <li
                      key={i}
                      className={cn(
                        "group grid grid-cols-[auto,1fr,auto] gap-x-2 px-2 py-1.5",
                        "text-[12px] leading-5"
                      )}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "mt-[2px] h-2 w-2 rounded-full",
                              sevDot[sev]
                            )}
                            aria-hidden
                            title={v.severity}
                          />
                          <span className={cn("font-semibold", sevText[sev])}>
                            {v.name}
                          </span>
                        </div>

                        <p className="mt-0.5 text-muted-foreground">
                          {v.message}
                        </p>

                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="opacity-80">Class:</span>
                          <code className="rounded bg-muted px-1 py-[1px] font-mono text-[10px]">
                            {v.className || "—"}
                          </code>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
