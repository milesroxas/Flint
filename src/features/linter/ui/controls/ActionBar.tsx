import React from "react";
import { LintPageButton } from "@/features/linter/ui/controls/LintPageButton";
import { PresetSwitcher } from "@/features/linter/ui/controls/PresetSwitcher";

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
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-t">
      <div className="mx-auto max-w-[420px] px-4 py-2">
        <div className="flex items-stretch gap-2 h-8">
          <PresetSwitcher onPresetChange={() => void onLint()} />
          <div className="flex-1 flex items-stretch">
            <LintPageButton
              onClick={() => void onLint()}
              loading={loading}
              issueCount={issueCount}
              fullWidth
              className="bg-accent text-accent-foreground hover:bg-slate-800 h-full rounded-sm text-base"
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
