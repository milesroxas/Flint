import React, { useMemo } from "react";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Badge } from "@/shared/ui/badge";

import { RuleResult } from "@/features/linter/model/rule.types";
import { ViolationsSection } from "./ViolationsSection";

interface ViolationsListProps {
  violations: RuleResult[];
  passedClassNames?: string[]; // optional: when provided, enables Passed tab
  showHighlight?: boolean; // controls highlight element button in items
  onScrollStateChange?: (isScrolled: boolean) => void; // notify parent when list scrolled from top
  onScrollDirectionChange?: (direction: "up" | "down") => void; // notify parent of scroll direction
}

export const ViolationsList: React.FC<ViolationsListProps> = ({
  violations,
  passedClassNames = [],
  showHighlight = true,
  onScrollStateChange,
  onScrollDirectionChange,
}) => {
  const errors = useMemo(
    () => violations.filter((v) => v.severity === "error"),
    [violations]
  );
  const warnings = useMemo(
    () => violations.filter((v) => v.severity === "warning"),
    [violations]
  );
  const suggestions = useMemo(
    () => violations.filter((v) => v.severity === "suggestion"),
    [violations]
  );

  // auto-open when exactly one violation exists across all sections
  const totalCount = errors.length + warnings.length + suggestions.length;
  let defaultOpenIds: string[] = [];
  if (totalCount === 1) {
    const only = errors[0] || warnings[0] || suggestions[0];
    defaultOpenIds = [`${only.ruleId}-${only.className || "unknown"}-0`];
  }

  // Passed-only list (deduped)
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
    <div className="h-full flex flex-col min-h-0 pt-2">
      <ScrollArea
        className="h-full flex-1 min-h-0"
        onIsScrolledChange={onScrollStateChange}
        onScrollDirectionChange={onScrollDirectionChange}
      >
        <div className="pr-4">
          <ViolationsSection
            title="Errors"
            items={errors}
            showHighlight={showHighlight}
            defaultOpenIds={defaultOpenIds}
          />
          <ViolationsSection
            title="Warnings"
            items={warnings}
            showHighlight={showHighlight}
            defaultOpenIds={defaultOpenIds}
          />
          <ViolationsSection
            title="Suggestions"
            items={suggestions}
            showHighlight={showHighlight}
            defaultOpenIds={defaultOpenIds}
          />
          {passedOnly.length > 0 && (
            <div className="mt-2 space-y-1">
              <div className="text-[11px] text-green-700">
                Passed ({passedOnly.length})
              </div>
              <div className="grid grid-cols-1 gap-1 pr-2">
                {passedOnly.map((cls) => (
                  <Badge
                    key={cls}
                    variant="secondary"
                    className="justify-start whitespace-normal break-words"
                  >
                    <code className="font-mono break-all">{cls}</code>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
