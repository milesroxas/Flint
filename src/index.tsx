import "./styles/globals.css";
import React from "react";
import { createRoot } from "react-dom/client";
import Header from "@/components/Header";
import ExtensionWrapper from "@/features/window/components/ExtensionWrapper";

import { LinterPanel } from "@/features/linter/view/LinterPanel";

const Root: React.FC = () => (
  <ExtensionWrapper>
    <div>
      <Header />
      {/* LinterPanel orchestrates page/element views with a mode switch */}
      <LinterPanel />
    </div>
  </ExtensionWrapper>
);

const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);

// Render the extension UI
root.render(<Root />);
