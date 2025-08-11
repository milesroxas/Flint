import React, { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

import { Accordion } from "@/components/ui/accordion";
import { RuleResult } from "@/features/linter/model/rule.types";
import { ViolationItem } from "./ViolationItem";
import { selectElementById } from "@/features/window/select-element";

interface ViolationsListProps {
  violations: RuleResult[];
  passedClassNames?: string[]; // optional: when provided, enables Passed tab
  showHighlight?: boolean; // controls highlight element button in items
}

export const ViolationsList: React.FC<ViolationsListProps> = ({
  violations,
  passedClassNames = [],
  showHighlight = true,
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

  const Section: React.FC<{ title: string; items: RuleResult[] }> = ({
    title,
    items,
  }) => {
    const prevOpenSetRef = React.useRef<Set<string>>(new Set<string>());
    const [openValues, setOpenValues] =
      React.useState<string[]>(defaultOpenIds);

    const getItemId = (violation: RuleResult, index: number): string =>
      `${violation.ruleId}-${violation.className || "unknown"}-${index}`;

    return items.length === 0 ? null : (
      <div className="mb-2">
        <div className="text-xs font-semibold text-muted-foreground mb-1">
          {title} ({items.length})
        </div>
        <Accordion
          type="multiple"
          value={openValues}
          className="w-full"
          onValueChange={async (values: string[]) => {
            // Ensure UI opens regardless of highlight side effects
            setOpenValues(values);

            if (!showHighlight) return;
            const prevSet = prevOpenSetRef.current;
            const newlyOpened = values.filter((v) => !prevSet.has(v));
            prevOpenSetRef.current = new Set(values);
            if (newlyOpened.length === 0) return;
            const lastOpenedId = newlyOpened[newlyOpened.length - 1];

            const indexById = new Map<string, number>();
            items.forEach((violation, index) => {
              indexById.set(getItemId(violation, index), index);
            });
            const idx = indexById.get(lastOpenedId);
            if (idx === undefined) return;
            const violation = items[idx];
            const elementId = violation?.metadata?.elementId as
              | string
              | undefined;
            if (!elementId) return;
            try {
              await selectElementById(elementId);
            } catch {
              // ignore highlighting errors
            }
          }}
        >
          {items.map((violation, index) => (
            <ViolationItem
              key={getItemId(violation, index)}
              violation={violation}
              index={index}
              showHighlight={showHighlight}
            />
          ))}
        </Accordion>
      </div>
    );
  };

  return (
    <div className="w-full">
      <Section title="Errors" items={errors} />
      <Section title="Warnings" items={warnings} />
      <Section title="Suggestions" items={suggestions} />

      {passedOnly.length > 0 && (
        <div className="mt-2 space-y-1">
          <div className="text-[11px] text-green-700">
            Passed ({passedOnly.length})
          </div>
          <ScrollArea className="h-40">
            <div className="grid grid-cols-1 gap-1 pr-2">
              {passedOnly.map((cls) => (
                <Badge key={cls} variant="secondary" className="justify-start">
                  <code className="font-mono">{cls}</code>
                </Badge>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};
