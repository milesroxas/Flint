import React, { useEffect } from "react";

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

  return <div className="overflow-y-auto overflow-x-hidden">{children}</div>;
}
