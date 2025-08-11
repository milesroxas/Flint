import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ensureLinterInitialized,
  getCurrentPreset,
} from "@/features/linter/model/linter.factory";
import { usePageLint } from "@/features/linter/store/pageLint.store";

export type PresetId = "lumos" | "client-first";

interface PresetSwitcherProps {
  onPresetChange?: (preset: PresetId) => void;
}

export const PresetSwitcher: React.FC<PresetSwitcherProps> = ({
  onPresetChange,
}) => {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<PresetId>(
    getCurrentPreset() as PresetId
  );

  const presetLabel = preset === "client-first" ? "Client‑first" : "Lumos";
  const presetInitial = presetLabel.slice(0, 1).toUpperCase();

  return (
    <div className="rounded-sm border bg-card flex items-stretch h-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" className="h-full w-8">
            <span
              aria-hidden
              className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-white text-[10px] font-semibold"
            >
              {presetInitial}
            </span>
            <span className="sr-only">Preset: {presetLabel}</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent asChild>
          <div className="absolute bottom-full left-0 mb-1 w-40 rounded-md border bg-popover shadow-md p-1 z-30">
            {(["lumos", "client-first"] as const).map((id) => (
              <button
                key={id}
                onClick={() => {
                  ensureLinterInitialized("balanced", id);
                  setPreset(id);
                  try {
                    if (typeof localStorage !== "undefined") {
                      localStorage.removeItem("webflow-linter-rules-config");
                    }
                  } catch (err) {
                    /* intentionally ignore storage errors */
                  }
                  try {
                    const store = usePageLint.getState();
                    store.clearResults();
                  } catch (err) {
                    /* intentionally ignore store errors */
                  }
                  void (async () => {
                    try {
                      const mod = await import(
                        "@/entities/style/model/style.service"
                      );
                      if (mod?.resetStyleServiceCache) {
                        mod.resetStyleServiceCache();
                      }
                    } catch (err) {
                      /* intentionally ignore style cache errors */
                    }
                  })();
                  setOpen(false);
                  onPresetChange?.(id);
                }}
                className={`block w-full text-left rounded-sm px-2 py-1.5 text-[11px] hover:bg-accent ${
                  preset === id ? "bg-accent/60" : ""
                }`}
              >
                {id === "client-first" ? "Client‑first" : "Lumos"}
              </button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
