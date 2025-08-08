import React, { useMemo, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

import { Accordion } from "@/components/ui/accordion";
import { RuleResult } from "@/features/linter/model/rule.types";
import { ViolationItem } from "./ViolationItem";

interface ViolationsListProps {
  violations: RuleResult[];
  passedClassNames?: string[]; // optional: when provided, enables Passed tab
}

export const ViolationsList: React.FC<ViolationsListProps> = ({
  violations,
  passedClassNames = [],
}) => {
  const suggestions = useMemo(
    () => violations.filter((v) => v.severity === "suggestion"),
    [violations]
  );
  const nonSuggestions = useMemo(
    () => violations.filter((v) => v.severity !== "suggestion"),
    [violations]
  );

  // If there's exactly one non-suggestion violation, auto-open that item
  const singleOpenId =
    nonSuggestions.length === 1
      ? `${nonSuggestions[0].ruleId}-${
          nonSuggestions[0].className || "unknown"
        }-0`
      : undefined;
  const defaultOpenIds = singleOpenId ? [singleOpenId] : [];

  // Optional Passed view
  const [tab, setTab] = useState<"issues" | "suggestions" | "passed">("issues");
  const showPassedTab = passedClassNames.length > 0;
  const showSuggestionsTab = suggestions.length > 0;

  const failedSet = useMemo(
    () =>
      new Set(violations.map((v) => v.className).filter(Boolean) as string[]),
    [violations]
  );
  const passedOnly = useMemo(
    () =>
      Array.from(new Set(passedClassNames)).filter(
        (name) => name && !failedSet.has(name)
      ),
    [passedClassNames, failedSet]
  );

  return (
    <div className="w-full">
      {(showSuggestionsTab || showPassedTab) && (
        <div className="mb-2 flex items-center gap-1">
          <button
            className={`text-xs px-2 py-0.5 rounded ${
              tab === "issues" ? "bg-slate-200" : "bg-transparent"
            }`}
            onClick={() => setTab("issues")}
          >
            Issues ({nonSuggestions.length})
          </button>
          {showSuggestionsTab && (
            <button
              className={`text-xs px-2 py-0.5 rounded ${
                tab === "suggestions" ? "bg-slate-200" : "bg-transparent"
              }`}
              onClick={() => setTab("suggestions")}
            >
              Suggestions ({suggestions.length})
            </button>
          )}
          {showPassedTab && (
            <button
              className={`text-xs px-2 py-0.5 rounded ${
                tab === "passed" ? "bg-slate-200" : "bg-transparent"
              }`}
              onClick={() => setTab("passed")}
            >
              Passed ({passedOnly.length})
            </button>
          )}
        </div>
      )}

      {tab === "issues" && (
        <Accordion
          key={`issues-${nonSuggestions.length}`}
          type="multiple"
          defaultValue={defaultOpenIds}
          className="w-full"
        >
          {nonSuggestions.map((violation, index) => (
            <ViolationItem
              key={`${violation.ruleId}-${
                violation.className || "unknown"
              }-${index}`}
              violation={violation}
              index={index}
            />
          ))}
        </Accordion>
      )}

      {tab === "suggestions" && (
        <Accordion
          key={`suggestions-${suggestions.length}`}
          type="multiple"
          className="w-full"
        >
          {suggestions.map((violation, index) => (
            <ViolationItem
              key={`${violation.ruleId}-${
                violation.className || "unknown"
              }-${index}`}
              violation={violation}
              index={index}
            />
          ))}
        </Accordion>
      )}

      {tab === "passed" && showPassedTab && (
        <div className="space-y-1">
          <div className="text-[11px] text-green-700">All good here:</div>
          <ScrollArea className="h-40">
            <div className="grid grid-cols-1 gap-1 pr-2">
              {passedOnly.length === 0 ? (
                <div className="text-xs text-muted-foreground">
                  No passed classes to show.
                </div>
              ) : (
                passedOnly.map((cls) => (
                  <Badge
                    key={cls}
                    variant="secondary"
                    className="justify-start"
                  >
                    <code className="font-mono">{cls}</code>
                  </Badge>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};
