import HeightSwitcher from "@/features/window/components/HeightSwitcher";

export default function Header() {
  return (
    <div className="flex flex-row items-center justify-between p-2 m-0 bg-foreground">
      <h1 className="text-xl text-background font-medium leading-widest absolute left-1/2 -translate-x-1/2">
        FlowLint
      </h1>
      <div className="flex items-center ml-auto">
        <HeightSwitcher />
      </div>
    </div>
  );
}
