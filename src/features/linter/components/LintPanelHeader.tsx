import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { ElementContext } from "@/entities/element/model/element-context.types";
import type { ElementRole } from "@/features/linter/model/linter.types";
import {
  ensureLinterInitialized,
  getCurrentPreset,
} from "@/features/linter/model/linter.factory";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface LintPanelHeaderProps {
  violationCount: number;
  errorCount: number;
  warningCount: number;
  suggestionCount: number;
  mode?: "strict" | "balanced" | "lenient";
  contexts?: ElementContext[];
  roles?: ElementRole[];
}

const toTitle = (s: string) =>
  s.replace(/(^|[_-])(\w)/g, (_, p1, p2) => (p1 ? " " : "") + p2.toUpperCase());

const contextLabel = (ctx: ElementContext) => {
  if (ctx === "componentRoot") return "Component Root";
  return toTitle(ctx);
};

const roleLabel = (role: ElementRole) => {
  if (role === "componentRoot") return "Component Root";
  return toTitle(role);
};

export const LintPanelHeader: React.FC<LintPanelHeaderProps> = ({
  violationCount,
  errorCount,
  warningCount,
  suggestionCount,
  mode,
  contexts = [],
  roles = [],
}) => {
  const [open, setOpen] = useState(false);
  const active = getCurrentPreset();
  const presets: Array<{ id: "lumos" | "client-first"; label: string }> = [
    { id: "lumos", label: "Lumos" },
    { id: "client-first", label: "Client‑first" },
  ];

  const handleSelect = (id: "lumos" | "client-first") => {
    ensureLinterInitialized("balanced", id);
    setOpen(false);
  };

  return (
    <div className="relative mb-1 flex items-center justify-between">
      <span className="text-[12px] font-medium flex items-center gap-2">
        {violationCount > 0
          ? `Found ${violationCount} issues`
          : "No issues found"}
        {mode && (
          <span className="text-[11px] text-muted-foreground">
            ({mode} mode)
          </span>
        )}
        <span className="text-[11px] text-muted-foreground ml-1">
          {`errors: ${errorCount}, warnings: ${warningCount}, suggestions: ${suggestionCount}`}
        </span>
        {contexts.length > 0 && (
          <span className="ml-1 flex items-center gap-1">
            {contexts.map((c) => (
              <Badge
                key={`ctx-${c}`}
                variant="outline"
                className="text-blue-600 border-blue-300 bg-blue-50 text-[10px]"
              >
                {contextLabel(c)}
              </Badge>
            ))}
          </span>
        )}
        {roles.length > 0 && (
          <span className="ml-1 flex items-center gap-1">
            {roles.map((r) => (
              <Badge
                key={`role-${r}`}
                variant="outline"
                className="text-violet-700 border-violet-300 bg-violet-50 text-[10px]"
              >
                {roleLabel(r)}
              </Badge>
            ))}
          </span>
        )}
      </span>
      <span className="flex items-center gap-2">
        <div className="relative">
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="text-[11px]">
                {active === "client-first" ? "Client‑first" : "Lumos"}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent asChild>
              <div className="absolute right-0 top-full mt-1 w-40 rounded-md border bg-popover shadow-md p-1 z-10">
                {presets.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(p.id)}
                    className={`block w-full text-left rounded-sm px-2 py-1.5 text-[11px] hover:bg-accent ${
                      active === p.id ? "bg-accent/60" : ""
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
        <span
          className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive/10 px-1.5 text-[10px] font-semibold tabular-nums text-destructive"
          aria-label="Total lint issues"
        >
          {violationCount}
        </span>
      </span>
    </div>
  );
};
