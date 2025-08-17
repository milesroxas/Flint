import React, { useEffect, useState } from "react";

export default function ExtensionWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // skip if Designer API is not injected
    if (typeof webflow?.setExtensionSize !== "function") {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn("Webflow Designer API not available; skipping resize");
      }
      return;
    }

    async function resizeExtension() {
      try {
        // custom size (clamped to min 240×360, max 1200×800)
        await webflow.setExtensionSize({ width: 400, height: 360 });
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.log("Extension UI resized to 400×360");
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error("Error resizing extension UI", err);
        }
      }
    }

    void resizeExtension();
  }, []);

  // Maintain a concrete pixel height so descendant h-full/min-h-0 and
  // ScrollArea measurements remain stable for animations and sticky UI.
  const [height, setHeight] = useState<number>(() => {
    const h = typeof window !== "undefined" ? window.innerHeight || 360 : 360;
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
    <div
      className="overflow-x-hidden overflow-y-visible flex flex-col"
      style={{ height: `${height}px` }}
    >
      {children}
    </div>
  );
}
