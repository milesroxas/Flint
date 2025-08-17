import React, { useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible";
import {
  ensureLinterInitialized,
  getCurrentPreset,
  getAvailablePresetIds,
} from "@/features/linter/model/linter.factory";
import { usePageLint } from "@/features/linter/store/pageLint.store";

export type PresetId = string;

interface PresetSwitcherProps {
  onPresetChange?: (preset: PresetId) => void;
}

export const PresetSwitcher: React.FC<PresetSwitcherProps> = ({
  onPresetChange,
}) => {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<PresetId>(getCurrentPreset());
  const available = getAvailablePresetIds();

  const presetLabel = preset;
  const presetInitial = (presetLabel || "").slice(0, 1).toUpperCase();

  return (
    <div className="rounded-sm border bg-card flex items-stretch h-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" className="h-full w-8 rounded-xs">
            <span
              aria-hidden
              className="inline-flex h-5 w-5 items-center justify-center rounded-xs bg-foreground text-background text-[10px] font-semibold"
            >
              {presetInitial}
            </span>
            <span className="sr-only">Preset: {presetLabel}</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent asChild>
          <div className="absolute bottom-full left-0 mb-2 ml-2 w-40 rounded-xs border bg-popover shadow-md p-1 z-30">
            {available.map((id) => (
              <button
                key={id}
                onClick={() => {
                  ensureLinterInitialized("balanced", id);
                  setPreset(id);
                  try {
                    if (typeof localStorage !== "undefined") {
                      localStorage.removeItem("webflow-linter-rules-config");
                    }
                  } catch (err: unknown) {
                    if ((import.meta as any)?.env?.DEV) {
                      // eslint-disable-next-line no-console
                      console.debug(
                        "[PresetSwitcher] localStorage cleanup failed",
                        err
                      );
                    }
                  }
                  try {
                    const store = usePageLint.getState();
                    if (store && typeof store.clearResults === "function") {
                      store.clearResults();
                    }
                  } catch (err: unknown) {
                    if ((import.meta as any)?.env?.DEV) {
                      // eslint-disable-next-line no-console
                      console.debug(
                        "[PresetSwitcher] store.clearResults failed",
                        err
                      );
                    }
                  }
                  void (async () => {
                    try {
                      const mod = await import(
                        "@/features/linter/entities/style/model/style-cache"
                      );
                      if (
                        mod &&
                        typeof mod.resetStyleServiceCache === "function"
                      ) {
                        mod.resetStyleServiceCache();
                      }
                    } catch (err: unknown) {
                      if ((import.meta as any)?.env?.DEV) {
                        // eslint-disable-next-line no-console
                        console.debug(
                          "[PresetSwitcher] resetStyleServiceCache failed",
                          err
                        );
                      }
                    }
                  })();
                  setOpen(false);
                  onPresetChange?.(id);
                }}
                className={`w-full text-left rounded-xs px-2 py-1.5 mb-1 text-[11px] hover:bg-accent hover:text-accent-foreground ${
                  preset === id ? "bg-accent/60 text-accent-foreground" : ""
                }`}
              >
                {id}
              </button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
