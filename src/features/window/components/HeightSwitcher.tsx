import React, { useState } from "react";
import { MoveVertical } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible";

type HeightPreset = "default" | "medium" | "large";

const PRESETS: Record<HeightPreset, { label: string; height: number }> = {
  default: { label: "Default", height: 360 },
  medium: { label: "Medium", height: 560 },
  large: { label: "Large", height: 800 },
};

export const HeightSwitcher: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<HeightPreset>("default");

  const presetLabel = PRESETS[preset].label;

  async function applyPreset(id: HeightPreset) {
    try {
      const wf: any = (window as any).webflow;
      if (typeof wf?.setExtensionSize !== "function") return;

      const MIN_HEIGHT = 360;
      const MAX_HEIGHT = 800;

      const width =
        typeof window !== "undefined" ? window.innerWidth || 400 : 400;
      const requested = PRESETS[id].height;
      const clampedHeight = Math.min(
        MAX_HEIGHT,
        Math.max(MIN_HEIGHT, requested)
      );

      await wf.setExtensionSize({ width, height: clampedHeight });
      setPreset(id);
      setOpen(false);
    } catch {
      // ignore
    }
  }

  return (
    <div className="relative rounded-sm border bg-card flex items-stretch h-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="group h-full w-7 rounded-sm focus-visible:ring-0 transition-colors text-foreground"
          >
            <MoveVertical
              aria-hidden
              className="size-4 transition-transform duration-200 ease-out group-hover:scale-110"
            />
            <span className="sr-only">Change height: {presetLabel}</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent asChild>
          <div className="absolute top-full right-0 mt-1 w-40 rounded-md border bg-popover text-popover-foreground shadow-md p-1 z-30 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            {(Object.keys(PRESETS) as Array<HeightPreset>).map(
              (id: HeightPreset) => (
                <button
                  key={id}
                  onClick={() => {
                    void applyPreset(id);
                  }}
                  className={`block w-full text-left rounded-sm px-2 py-1.5 text-[11px] hover:bg-accent hover:text-accent-foreground ${
                    preset === id ? "bg-accent/60 text-accent-foreground" : ""
                  }`}
                >
                  {PRESETS[id].label}
                </button>
              )
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default HeightSwitcher;
