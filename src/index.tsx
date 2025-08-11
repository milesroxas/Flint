import "./styles/globals.css";
import React from "react";
import { createRoot } from "react-dom/client";
import Header from "@/components/Header";
import ExtensionWrapper from "@/features/window/components/ExtensionWrapper";

import { PageLintSection } from "./features/linter/components/PageLintSection";

const Root: React.FC = () => (
  <ExtensionWrapper>
    <div>
      <Header />
      {/* Element/Page results are unified under PageLintSection with a mode switch */}
      <PageLintSection />
    </div>
  </ExtensionWrapper>
);

const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);

// Render the extension UI
root.render(<Root />);
