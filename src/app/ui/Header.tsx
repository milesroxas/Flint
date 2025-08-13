import HeightSwitcher from "@/features/window/components/HeightSwitcher";

export default function Header() {
  return (
    <div className="flex flex-row items-center justify-between p-2 m-0 bg-foreground">
      <h1 className="text-xs text-background font-medium leading-widest">
        FlowLint
      </h1>
      <div className="flex items-center">
        <HeightSwitcher />
      </div>
    </div>
  );
}
