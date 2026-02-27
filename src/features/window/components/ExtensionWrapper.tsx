import type React from "react";
import { useEffect, useState } from "react";
import { useLinterSettingsStore } from "@/features/linter/store/linterSettings.store";
import { applyWindowPreset } from "@/features/window/lib/apply-window-preset";

export default function ExtensionWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // skip if Designer API is not injected
    if (typeof webflow?.setExtensionSize !== "function") {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn("Webflow Designer API not available; skipping resize");
      }
      return;
    }

    const preset = useLinterSettingsStore.getState().windowPreset;
    void applyWindowPreset(preset);
  }, []);

  // Maintain a concrete pixel height so descendant h-full/min-h-0 and
  // ScrollArea measurements remain stable for animations and sticky UI.
  const [height, setHeight] = useState<number>(() => {
    const h = typeof window !== "undefined" ? window.innerHeight || 800 : 800;
    return Math.max(360, Math.min(800, h));
  });

  useEffect(() => {
    const onResize = () => {
      const next = Math.max(360, Math.min(800, window.innerHeight || 360));
      setHeight(next);
    };
    window.addEventListener("resize", onResize, { passive: true } as any);
    onResize();
    return () => window.removeEventListener("resize", onResize as any);
  }, []);

  return (
    <div className="overflow-x-hidden overflow-y-visible flex flex-col" style={{ height: `${height}px` }}>
      {children}
    </div>
  );
}
