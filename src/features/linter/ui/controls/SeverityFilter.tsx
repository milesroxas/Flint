import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/shared/utils";
import type { Severity } from "@/features/linter/model/rule.types";
import { SeverityButton } from "@/shared/ui/severity-button";
import { useAnimationStore } from "@/features/linter/store/animation.store";

export type SeverityFilterValue = Severity | "all";

interface SeverityFilterProps {
  filter: SeverityFilterValue;
  counts: { error: number; warning: number; suggestion: number };
  onChange: (next: SeverityFilterValue) => void;
  className?: string;
  condensed?: boolean;
}

export const SeverityFilter: React.FC<SeverityFilterProps> = ({
  filter,
  counts,
  onChange,
  className,
  condensed = false,
}) => {
  // Subscribe to animation store
  const severityTilesVisible = useAnimationStore(
    (state) => state.severityTilesVisible
  );
  const severityCountsAnimating = useAnimationStore(
    (state) => state.severityCountsAnimating
  );
  const startSeverityCounts = useAnimationStore(
    (state) => state.startSeverityCounts
  );
  const completeSeverityAnimation = useAnimationStore(
    (state) => state.completeSeverityAnimation
  );
  const showViolations = useAnimationStore((state) => state.showViolations);

  const [displayCounts, setDisplayCounts] = useState({
    error: 0,
    warning: 0,
    suggestion: 0,
  });
  const [hasAnimated, setHasAnimated] = useState(false);
  const tilesAnimationRef = useRef<HTMLDivElement>(null);
  const countAnimationCompleteRef = useRef(0);
  const targetAnimationCountRef = useRef(0);

  // React to animation store changes
  useEffect(() => {
    // Reset hasAnimated when tiles become invisible (new lint cycle)
    if (!severityTilesVisible) {
      setHasAnimated(false);
      // Also clear visible counts for next cycle
      setDisplayCounts({ error: 0, warning: 0, suggestion: 0 });
    }
  }, [
    severityTilesVisible,
    severityCountsAnimating,
    counts,
    hasAnimated,
    startSeverityCounts,
  ]);

  // Handle tile entrance animation complete
  const handleTileAnimationEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    // Only respond to the container's own transition end, not children
    if (e.target !== e.currentTarget) return;
    if (severityTilesVisible && !severityCountsAnimating && !hasAnimated) {
      setHasAnimated(true);
      setDisplayCounts(counts);
      countAnimationCompleteRef.current = 0;
      const target =
        (counts.error > 0 ? 1 : 0) +
        (counts.warning > 0 ? 1 : 0) +
        (counts.suggestion > 0 ? 1 : 0);
      targetAnimationCountRef.current = target;
      if (target === 0) {
        // No counts to animate; immediately complete and reveal violations
        completeSeverityAnimation();
        requestAnimationFrame(() => {
          showViolations();
        });
      } else {
        startSeverityCounts();
      }
    }
  };

  // If tiles are already visible (no transition end fires), initialize counts
  useEffect(() => {
    if (severityTilesVisible && !severityCountsAnimating && !hasAnimated) {
      setHasAnimated(true);
      setDisplayCounts(counts);
      countAnimationCompleteRef.current = 0;
      const target =
        (counts.error > 0 ? 1 : 0) +
        (counts.warning > 0 ? 1 : 0) +
        (counts.suggestion > 0 ? 1 : 0);
      targetAnimationCountRef.current = target;
      if (target === 0) {
        completeSeverityAnimation();
        requestAnimationFrame(() => {
          showViolations();
        });
      } else {
        startSeverityCounts();
      }
    }
  }, [
    severityTilesVisible,
    severityCountsAnimating,
    hasAnimated,
    counts,
    completeSeverityAnimation,
    showViolations,
    startSeverityCounts,
  ]);

  // Handle count animation complete
  const handleCountAnimationComplete = () => {
    countAnimationCompleteRef.current += 1;
    // Wait for all three tiles to complete their count animation
    if (
      targetAnimationCountRef.current > 0 &&
      countAnimationCompleteRef.current >= targetAnimationCountRef.current
    ) {
      completeSeverityAnimation();
      // Trigger violations animation
      requestAnimationFrame(() => {
        showViolations();
      });
    }
  };

  const toggle = (level: Severity) => {
    onChange(filter === level ? "all" : level);
  };

  return (
    <div
      ref={tilesAnimationRef}
      className={cn(
        "grid grid-cols-3 transition-all duration-500 ease-gentle",
        severityTilesVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2",
        condensed ? "gap-2" : "gap-3",
        className
      )}
      onTransitionEnd={handleTileAnimationEnd}
    >
      <SeverityButton
        severity="error"
        count={displayCounts.error}
        condensed={condensed}
        active={filter === "error"}
        expandedLabel={condensed ? "Errors" : "Issues"}
        onClick={() => toggle("error")}
        shouldStartCounting={severityCountsAnimating}
        staggerDelay={0}
        onCountAnimationComplete={handleCountAnimationComplete}
      />
      <SeverityButton
        severity="warning"
        count={displayCounts.warning}
        condensed={condensed}
        active={filter === "warning"}
        expandedLabel="Warnings"
        onClick={() => toggle("warning")}
        shouldStartCounting={severityCountsAnimating}
        staggerDelay={150}
        onCountAnimationComplete={handleCountAnimationComplete}
      />
      <SeverityButton
        severity="suggestion"
        count={displayCounts.suggestion}
        condensed={condensed}
        active={filter === "suggestion"}
        expandedLabel="Suggestions"
        onClick={() => toggle("suggestion")}
        shouldStartCounting={severityCountsAnimating}
        staggerDelay={300}
        onCountAnimationComplete={handleCountAnimationComplete}
      />
    </div>
  );
};

export default SeverityFilter;
