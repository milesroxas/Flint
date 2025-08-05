// File: src/features/linter/components/LintPanel.tsx

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { runLint } from "@/features/linter/engine";
import { RuleResult } from "@/features/linter/types";

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
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">
            Lint Issues ({violations.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-64">
            {violations.map((v, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-3 p-2 border-b last:border-b-0",
                  v.severity === "error"
                    ? "bg-red-50"
                    : v.severity === "warning"
                    ? "bg-yellow-50"
                    : "bg-blue-50"
                )}
              >
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{v.message}</p>
                  <p className="mt-1 text-xs text-gray-600">
                    Class: <code>{v.className}</code>
                  </p>
                </div>
                <span
                  className={cn(
                    "flex-shrink-0 w-3 h-3 rounded-full mt-1",
                    v.severity === "error"
                      ? "bg-red-600"
                      : v.severity === "warning"
                      ? "bg-yellow-600"
                      : "bg-blue-600"
                  )}
                />
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
