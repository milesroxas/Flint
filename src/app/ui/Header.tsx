import HeightSwitcher from "@/features/window/components/HeightSwitcher";
import { ThemeToggle } from "@/shared/ui/theme-toggle";

export default function Header() {
  return (
    <div className="flex flex-row items-center justify-between px-2 py-0 m-0 bg-muted text-foreground">
      <h1 className="text-lg font-medium leading-widest absolute left-1/2 -translate-x-1/2">
        FlowLint
      </h1>
      <div className="flex items-center gap-2 ml-auto">
        <ThemeToggle />
        <HeightSwitcher />
      </div>
    </div>
  );
}
