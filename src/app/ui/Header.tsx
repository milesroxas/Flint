import { Settings } from "lucide-react";
import { useExpandedView } from "@/features/linter/store/expandedView.store";
import HeightSwitcher from "@/features/window/components/HeightSwitcher";
import { Button } from "@/shared/ui/button";

export default function Header() {
  const { openExpandedView } = useExpandedView();

  return (
    <div className="relative flex flex-row items-center justify-between px-2 py-0 m-0 bg-muted text-foreground">
      <HeightSwitcher />
      <h1 className="text-lg font-medium leading-widest absolute left-1/2 -translate-x-1/2">
        <img src="./images/flint-app-logo-light.svg" alt="Flint" className="h-4 w-auto dark:hidden" />
        <img src="./images/flint-app-logo-dark.svg" alt="Flint" className="h-4 w-auto hidden dark:block" />
      </h1>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => openExpandedView({ type: "settings", title: "Settings" })}
        aria-label="Open settings"
      >
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  );
}
