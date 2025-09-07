import React, { useMemo, useState, useEffect } from "react";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/utils";

import { RuleResult } from "@/features/linter/model/rule.types";
import { ViolationsSection } from "./ViolationsSection";
import { useAnimationStore } from "@/features/linter/store/animation.store";
import { selectElementById } from "@/features/window/select-element";

interface ViolationsListProps {
  violations: RuleResult[];
  passedClassNames?: string[]; // optional: when provided, enables Passed tab
  showHighlight?: boolean; // controls highlight element button in items
  onScrollStateChange?: (isScrolled: boolean) => void; // notify parent when list scrolled from top
  onScrollDirectionChange?: (direction: "up" | "down") => void; // notify parent of scroll direction
  bypassAnimation?: boolean; // when true, show immediately (used in element mode)
}

export const ViolationsList: React.FC<ViolationsListProps> = ({
  violations,
  passedClassNames = [],
  showHighlight = true,
  onScrollStateChange,
  onScrollDirectionChange,
  bypassAnimation = false,
}) => {
  // Subscribe to animation store
  const violationsVisible = useAnimationStore(
    (state) => state.violationsVisible
  );
  // Initialize visibility to avoid a mount-time entrance animation in element mode
  const [isVisible, setIsVisible] = useState<boolean>(
    bypassAnimation || useAnimationStore.getState().violationsVisible
  );

  useEffect(() => {
    const next = bypassAnimation || violationsVisible;
    setIsVisible((prev) => (prev === next ? prev : next));
  }, [bypassAnimation, violationsVisible]);

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

  // Global single-open id across all sections
  const [openId, setOpenId] = useState<string | undefined>(undefined);
  const lastAutoOpenSignatureRef = React.useRef<string | null>(null);

  // Compute id map for selection and list signature
  const { idToViolation, signature, totalCount, onlyId } = useMemo(() => {
    const map = new Map<string, RuleResult>();
    const parts: string[] = [];
    const add = (arr: RuleResult[]) =>
      arr.forEach((v, i) => {
        const id = `${v.ruleId}-${v.className || "unknown"}-${i}`;
        map.set(id, v);
        parts.push(id);
      });
    add(errors);
    add(warnings);
    add(suggestions);
    const sig = parts.join("|");
    const total = errors.length + warnings.length + suggestions.length;
    const only = total === 1 ? errors[0] || warnings[0] || suggestions[0] : undefined;
    const onlyId = only
      ? `${only.ruleId}-${only.className || "unknown"}-0`
      : undefined;
    return { idToViolation: map, signature: sig, totalCount: total, onlyId };
  }, [errors, warnings, suggestions]);

  // Clear openId if it no longer exists in the current list
  useEffect(() => {
    if (openId && !idToViolation.has(openId)) {
      setOpenId(undefined);
    }
  }, [idToViolation, openId]);

  // Auto-open when exactly one violation exists, but allow manual close.
  // Triggers only once per unique list signature.
  useEffect(() => {
    if (totalCount === 1 && !openId) {
      if (lastAutoOpenSignatureRef.current !== signature) {
        if (onlyId) setOpenId(onlyId);
        lastAutoOpenSignatureRef.current = signature;
      }
    }
  }, [totalCount, signature, onlyId, openId]);

  const handleOpenChange = async (nextId: string | undefined) => {
    setOpenId(nextId || undefined);
    if (!nextId) return;
    const violation = idToViolation.get(nextId);
    const elementId = violation?.elementId;
    if (!elementId) return;
    try {
      await selectElementById(elementId);
    } catch {
      // ignore selection errors
    }
  };

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
    <div
      className={cn(
        "h-full flex flex-col min-h-0 pt-2 transition-all duration-700 ease-spring",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      )}
    >
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
            openId={openId}
            onOpenChange={handleOpenChange}
            animationDelay={0}
            shouldAnimate={isVisible}
          />
          <ViolationsSection
            title="Warnings"
            items={warnings}
            showHighlight={showHighlight}
            openId={openId}
            onOpenChange={handleOpenChange}
            animationDelay={200}
            shouldAnimate={isVisible}
          />
          <ViolationsSection
            title="Suggestions"
            items={suggestions}
            showHighlight={showHighlight}
            openId={openId}
            onOpenChange={handleOpenChange}
            animationDelay={400}
            shouldAnimate={isVisible}
          />
          {passedOnly.length > 0 && (
            <div
              className={cn(
                "mt-2 space-y-1 transition-all duration-700 ease-spring",
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2"
              )}
              style={{ transitionDelay: "600ms" }}
            >
              <div className="text-[11px] text-muted-foreground">
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
