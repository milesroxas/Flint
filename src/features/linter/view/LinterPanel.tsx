import { useEffect, useMemo, useState } from "react";
import { cn } from "@/shared/utils";
import type { RuleResult } from "@/features/linter/model/rule.types";
import { ViolationsList } from "@/features/linter/ui/violations/ViolationsList";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import {
  ModeToggle,
  type LintViewMode,
} from "@/features/linter/ui/controls/ModeToggle";
import { ActionBar } from "@/features/linter/ui/controls/ActionBar";
import { useElementLint } from "@/features/linter/store/elementLint.store";
import { usePageLint } from "@/features/linter/store/pageLint.store";
import SeverityFilter, {
  type SeverityFilterValue,
} from "@/features/linter/ui/controls/SeverityFilter";
import { StructuralContextToggle } from "@/features/linter/ui/controls/StructuralContextToggle";

export function LinterPanel() {
  const { results, passedClassNames, loading, error, hasRun, lintPage } =
    usePageLint();
  // const opinionMode: "strict" | "balanced" | "lenient" = "balanced";
  const count = results.length;
  const [mode, setMode] = useState<LintViewMode>("page");

  // Track mode internally without noisy logging
  useEffect(() => {
    void mode;
  }, [mode]);
  const [severityFilter, setSeverityFilter] =
    useState<SeverityFilterValue>("all");
  const [filtersCondensed, setFiltersCondensed] = useState(false);
  const [hideModeToggle, setHideModeToggle] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  // Ensure element mode never auto-hides the mode toggle.
  useEffect(() => {
    if (mode !== "page") {
      setHideModeToggle(false);
    }
  }, [mode]);

  // Panel entrance animation
  useEffect(() => {
    setIsPanelVisible(true);
  }, []);

  const {
    results: elementResults,
    classNames: elementClassNames,
    loading: elementLoading,
    refresh: refreshElementLint,
    structuralContext,
    setStructuralContext,
  } = useElementLint();

  // Auto-enter/exit is handled centrally in the store's selection subscription

  const activeViolations: RuleResult[] = useMemo(
    () => (mode === "page" ? results : elementResults),
    [mode, results, elementResults]
  );
  const filteredViolations: RuleResult[] = useMemo(() => {
    if (mode !== "page") return activeViolations;
    if (severityFilter === "all") return activeViolations;
    return activeViolations.filter((v) => v.severity === severityFilter);
  }, [mode, activeViolations, severityFilter]);
  const activePassedClassNames: string[] = useMemo(
    () => (mode === "page" ? passedClassNames : elementClassNames),
    [mode, passedClassNames, elementClassNames]
  );
  const isBusy = mode === "page" ? loading : elementLoading;

  const errorCount = useMemo(
    () =>
      mode === "page"
        ? results.filter((v) => v.severity === "error").length
        : 0,
    [mode, results]
  );
  const warningCount = useMemo(
    () =>
      mode === "page"
        ? results.filter((v) => v.severity === "warning").length
        : 0,
    [mode, results]
  );
  const suggestionCount = useMemo(
    () =>
      mode === "page"
        ? results.filter((v) => v.severity === "suggestion").length
        : 0,
    [mode, results]
  );

  // ESC handling moved to store to avoid duplicates

  return (
    <section
      className={cn(
        "h-full flex flex-col transition-all duration-700 ease-spring",
        isPanelVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      )}
    >
      <div className="pl-4 pr-0 pb-14 flex-1 min-h-0 flex flex-col">
        {error && (
          <div className="flex items-center gap-2 py-2 text-sm text-destructive">
            <AlertCircle className="h-3 w-3" />
            {error}
          </div>
        )}

        {!error && !loading && hasRun && count === 0 && mode === "page" && (
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-3 w-3" />
            No issues found
          </div>
        )}

        {!error && (
          <div className="flex flex-col min-h-0 ">
            <div
              className={cn(
                "pt-4 transition-[opacity,transform,height,margin] duration-300 ease-gentle will-change-[opacity,transform]",
                hideModeToggle
                  ? "opacity-0 -translate-y-2 h-0 -mb-2"
                  : "opacity-100 translate-y-0 h-auto mb-4"
              )}
            >
              <div className="flex gap-3 items-center justify-between">
                <ModeToggle
                  mode={mode}
                  onChange={(next) => {
                    setMode(next);
                  }}
                />
                {mode === "element" && (
                  <div className="flex pr-2 items-center gap-2">
                    <StructuralContextToggle
                      enabled={structuralContext}
                      onChange={setStructuralContext}
                    />
                  </div>
                )}
              </div>
            </div>

            {mode === "page" && !loading && !hasRun ? (
              <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                <AlertCircle className="h-3 w-3" />
                Click the button to lint this page
              </div>
            ) : (
              <div className="flex-1 min-h-0 flex flex-col">
                {mode === "page" && (
                  <div className="pr-4 sticky top-0 z-10 bg-gradient-to-b from-background to-transparent w-full">
                    <SeverityFilter
                      filter={severityFilter}
                      counts={{
                        error: errorCount,
                        warning: warningCount,
                        suggestion: suggestionCount,
                      }}
                      onChange={setSeverityFilter}
                      condensed={filtersCondensed}
                    />
                  </div>
                )}
                <div className="flex-1 min-h-0">
                  <ViolationsList
                    violations={filteredViolations}
                    passedClassNames={activePassedClassNames}
                    showHighlight={
                      mode === "page" ||
                      (mode === "element" && structuralContext)
                    }
                    bypassAnimation={mode === "element"}
                    onScrollStateChange={
                      mode === "page" ? setFiltersCondensed : undefined
                    }
                    onScrollDirectionChange={
                      mode === "page"
                        ? (dir) => {
                            setHideModeToggle(dir === "down");
                          }
                        : undefined
                    }
                  />
                </div>
                {/* <div className="mt-2 text-[10px] text-muted-foreground px-4">
                  Opinion: {opinionMode} · View: {mode}
                </div> */}
              </div>
            )}
          </div>
        )}
      </div>
      <ActionBar
        loading={isBusy}
        mode={mode}
        issueCount={activeViolations.length}
        hasRun={mode === "page" ? hasRun : false}
        onLint={async () => {
          if (mode === "page") {
            await lintPage();
          } else {
            await refreshElementLint();
          }
        }}
      />
    </section>
  );
}
