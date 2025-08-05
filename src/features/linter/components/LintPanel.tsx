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
    <div className="p-2">
      <Accordion type="single" collapsible>
        <AccordionItem value="violations">
          <AccordionTrigger>Lint Issues ({violations.length})</AccordionTrigger>
          <AccordionContent>
            <ScrollArea className="h-48">
              {violations.map((v, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-start gap-4 p-4 border-b last:border-b-0 transition-colors",
                    v.severity === "error"
                      ? "bg-destructive/5 "
                      : v.severity === "warning"
                      ? "bg-yellow-50 border-yellow-200"
                      : "bg-muted/50 border-muted"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-1 mb-2">
                      <Badge severity={v.severity as Severity}>
                        {v.severity}
                      </Badge>
                      <div className="text-xs text-muted-foreground font-mono">
                        {v.name}
                      </div>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed mb-2">
                      {v.message}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Class:</span>
                      <code className="bg-muted px-2 py-1 rounded font-mono text-xs">
                        {v.className}
                      </code>
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
