import { LintPageButton } from "@/features/linter/components/LintPageButton";

export default function Header() {
  return (
    <div className="flex flex-row justify-between p-2 m-0 bg-slate-900">
      <h1 className="text-xs text-slate-100 font-medium leading-widest">
        FlowLint
      </h1>

      <div className="flex flex-row gap-2">
        <LintPageButton />
      </div>
    </div>
  );
}
