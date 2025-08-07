import React, { useEffect } from "react";

export default function ExtensionWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // skip if Designer API is not injected
    if (typeof webflow?.setExtensionSize !== "function") {
      console.warn("Webflow Designer API not available; skipping resize");
      return;
    }

    async function resizeExtension() {
      try {
        // custom size (clamped to min 240×360, max 1200×800)
        await webflow.setExtensionSize({ width: 400, height: 360 });
        console.log("Extension UI resized to 600×500");
      } catch (err) {
        console.error("Error resizing extension UI", err);
      }
    }

    void resizeExtension();
  }, []);

  return <div className="overflow-hidden">{children}</div>;
}
