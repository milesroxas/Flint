import React, { useState, useEffect } from "react";
import { LintPageButton } from "@/features/linter/ui/controls/LintPageButton";
import { PresetSwitcher } from "@/features/linter/ui/controls/PresetSwitcher";
import { cn } from "@/shared/utils";

interface ActionBarProps {
  loading: boolean;
  mode: "element" | "page";
  issueCount: number;
  onLint: () => Promise<void> | void;
  hasRun?: boolean;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  loading,
  mode,
  issueCount,
  onLint,
  hasRun = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [prevIssueCount, setPrevIssueCount] = useState(issueCount);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (prevIssueCount !== issueCount) {
      setPrevIssueCount(issueCount);
    }
  }, [issueCount, prevIssueCount]);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-t transition-all duration-700 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      <div className="mx-auto max-w-[420px] px-4 py-2">
        <div className="flex items-stretch gap-2 h-8">
          <PresetSwitcher onPresetChange={() => void onLint()} />
          <div className="flex-1 flex items-stretch">
            <LintPageButton
              onClick={() => void onLint()}
              loading={loading}
              issueCount={issueCount}
              fullWidth
              className="h-full rounded-sm text-base transition-all duration-300 ease-out"
              label={
                mode === "page" ? (hasRun ? "Re-Lint" : "Lint Page") : "Re-Lint"
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};
