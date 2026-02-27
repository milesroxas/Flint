import { Scaling } from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { WindowPreset } from "@/features/linter/store/linterSettings.store";
import { useLinterSettings } from "@/features/linter/store/linterSettings.store";
import { applyWindowPreset } from "@/features/window/lib/apply-window-preset";
import { trackWindowPresetChanged } from "@/shared/lib/analytics";
import { Button } from "@/shared/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/ui/collapsible";

export const WINDOW_PRESETS: Record<WindowPreset, { label: string; height: number }> = {
  large: { label: "Large", height: 800 },
  compact: { label: "Compact", height: 360 },
  medium: { label: "Medium", height: 560 },
};

export const HeightSwitcher: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { windowPreset, setWindowPreset } = useLinterSettings();

  const presetLabel = WINDOW_PRESETS[windowPreset].label;

  async function applyPreset(id: WindowPreset) {
    trackWindowPresetChanged({ from_preset: windowPreset, to_preset: id });
    await applyWindowPreset(id);
    setWindowPreset(id);
    setOpen(false);
  }

  return (
    <div className="relative">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" className="group transition-colors">
            <Scaling aria-hidden className="size-4 transition-transform duration-200 ease-out group-hover:scale-110" />
            <span className="sr-only">Change height: {presetLabel}</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent asChild>
          <div className="absolute top-full left-0 mt-1 w-40 rounded-md border bg-popover text-popover-foreground shadow-md p-1 z-30 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            {(Object.keys(WINDOW_PRESETS) as Array<WindowPreset>).map((id: WindowPreset) => (
              <button
                type="button"
                key={id}
                onClick={() => {
                  void applyPreset(id);
                }}
                className={`block w-full text-left rounded-sm px-2 py-1.5 text-[11px] hover:bg-accent hover:text-accent-foreground ${
                  windowPreset === id ? "bg-accent/60 text-accent-foreground" : ""
                }`}
              >
                {WINDOW_PRESETS[id].label}
              </button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default HeightSwitcher;
