import React from "react";
import { LintPageButton } from "@/features/linter/components/LintPageButton";
import { PresetSwitcher } from "./PresetSwitcher";

interface ActionBarProps {
  loading: boolean;
  mode: "element" | "page";
  issueCount: number;
  onLint: () => Promise<void> | void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  loading,
  mode,
  issueCount,
  onLint,
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
              className="bg-blue-700 text-slate-100 hover:bg-slate-800/90 h-full rounded-sm text-base"
              label={mode === "page" ? "Lint Page" : "Re‑lint"}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
