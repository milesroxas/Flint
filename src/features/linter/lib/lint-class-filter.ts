import { buildClassLintFilter, buildMergedIgnoredClassSet } from "@/features/linter/lib/class-lint-ignore";
import { getCurrentPreset } from "@/features/linter/model/linter.factory";
import { resolvePresetOrFallback } from "@/features/linter/presets";
import { useLinterSettingsStore } from "@/features/linter/store/linterSettings.store";

/** Same merged set as the class filter uses (global + preset built-in + per-preset user list). */
export function getMergedIgnoredLintClassSet(): Set<string> {
  const { globalIgnoredClasses, presetIgnoredClasses } = useLinterSettingsStore.getState();
  const preset = resolvePresetOrFallback(getCurrentPreset());
  return buildMergedIgnoredClassSet({
    globalIgnored: globalIgnoredClasses,
    presetBuiltinIgnored: preset.ignoredLintClasses,
    presetUserIgnored: presetIgnoredClasses[preset.id],
  });
}

/**
 * Class filter for element/page lint: keeps classes that should be analyzed.
 * Combines third-party ignore toggle, global user list, preset built-ins, and per-preset user list.
 */
export function getLintClassFilter(): ((name: string) => boolean) | undefined {
  const { ignoreThirdPartyClasses, globalIgnoredClasses, presetIgnoredClasses } = useLinterSettingsStore.getState();
  const preset = resolvePresetOrFallback(getCurrentPreset());
  const mergedIgnoredSet = buildMergedIgnoredClassSet({
    globalIgnored: globalIgnoredClasses,
    presetBuiltinIgnored: preset.ignoredLintClasses,
    presetUserIgnored: presetIgnoredClasses[preset.id],
  });
  return buildClassLintFilter({
    ignoreThirdPartyClasses,
    mergedIgnoredSet,
  });
}
