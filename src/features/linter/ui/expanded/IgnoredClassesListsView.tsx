import type React from "react";
import { useSyncExternalStore } from "react";
import { THIRD_PARTY_LIBRARIES } from "@/features/linter/lib/third-party-libraries";
import { getCurrentPreset, subscribePresetChanged } from "@/features/linter/model/linter.factory";
import { resolvePresetOrFallback } from "@/features/linter/presets";
import { useLinterSettingsStore } from "@/features/linter/store/linterSettings.store";
import { Badge } from "@/shared/ui/badge";

function ClassBadgeList({ items }: { items: readonly string[] }) {
  if (items.length === 0) {
    return <p className="text-[11px] text-muted-foreground italic">None</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-1">
      {items.map((cls) => (
        <Badge key={cls} variant="secondary" className="justify-start font-mono text-xs">
          {cls}
        </Badge>
      ))}
    </div>
  );
}

export const IgnoredClassesListsView: React.FC = () => {
  const presetId = useSyncExternalStore(subscribePresetChanged, getCurrentPreset, getCurrentPreset);
  const globalIgnoredClasses = useLinterSettingsStore((s) => s.globalIgnoredClasses);
  const presetIgnoredClasses = useLinterSettingsStore((s) => s.presetIgnoredClasses);
  const ignoreThirdPartyClasses = useLinterSettingsStore((s) => s.ignoreThirdPartyClasses);

  const preset = resolvePresetOrFallback(presetId);
  const builtin = preset.ignoredLintClasses ?? [];
  const userForPreset = presetIgnoredClasses[presetId] ?? [];

  const thirdPartyClassCount = THIRD_PARTY_LIBRARIES.reduce((n, lib) => n + lib.classes.length, 0);

  return (
    <div className="p-4 space-y-6">
      <p className="text-sm text-muted-foreground">
        These class names are skipped during linting when they match exactly. Global and per-preset lists are merged
        with the active framework preset&apos;s built-in terms. Third-party classes apply only when that option is
        enabled in settings.
      </p>

      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <h3 className="text-xs font-medium uppercase tracking-wide">Global (all presets)</h3>
          <span className="text-[10px] text-muted-foreground">{globalIgnoredClasses.length} classes</span>
        </div>
        <ClassBadgeList items={globalIgnoredClasses} />
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <h3 className="text-xs font-medium uppercase tracking-wide">Active preset: {presetId}</h3>
        </div>
        <p className="text-[11px] text-muted-foreground">Built into this preset</p>
        <ClassBadgeList items={builtin} />
        <p className="text-[11px] text-muted-foreground pt-1">Your list for this preset</p>
        <ClassBadgeList items={userForPreset} />
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <h3 className="text-xs font-medium uppercase tracking-wide">Third-party libraries</h3>
          <span className="text-[10px] text-muted-foreground">
            {ignoreThirdPartyClasses ? `${thirdPartyClassCount} classes when enabled` : "Disabled in settings"}
          </span>
        </div>
        {ignoreThirdPartyClasses ? (
          THIRD_PARTY_LIBRARIES.map((library) => (
            <div key={library.id} className="space-y-2">
              <div className="flex items-baseline gap-2">
                <h4 className="text-[11px] font-medium">{library.name}</h4>
                <span className="text-[10px] text-muted-foreground">{library.classes.length} classes</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{library.description}</p>
              <ClassBadgeList items={library.classes} />
            </div>
          ))
        ) : (
          <p className="text-[11px] text-muted-foreground italic">
            Turn on &quot;Ignore third-party classes&quot; in settings to skip these.
          </p>
        )}
      </div>
    </div>
  );
};
