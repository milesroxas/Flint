import { ExternalLink, Eye } from "lucide-react";
import type React from "react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { parseIgnoredClassesInput } from "@/features/linter/lib/class-lint-ignore";
import { getCurrentPreset, subscribePresetChanged } from "@/features/linter/model/linter.factory";
import { getPresetIds } from "@/features/linter/presets";
import { useExpandedView } from "@/features/linter/store/expandedView.store";
import type { WindowPreset } from "@/features/linter/store/linterSettings.store";
import { useLinterSettings } from "@/features/linter/store/linterSettings.store";
import { WINDOW_PRESETS } from "@/features/window/components/HeightSwitcher";
import { applyWindowPreset } from "@/features/window/lib/apply-window-preset";
import { trackIgnoredClassListsViewed, trackSettingChanged } from "@/shared/lib/analytics";
import { buildInfo } from "@/shared/lib/build-info";
import { useTheme } from "@/shared/providers/theme-provider";
import { Button } from "@/shared/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Switch } from "@/shared/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

interface SettingsRowProps {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id: string;
}

const SettingsRow: React.FC<SettingsRowProps> = ({ label, description, checked, onCheckedChange, id }) => (
  <div className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
    <label htmlFor={id} className="flex flex-col gap-0.5 cursor-pointer flex-1 min-w-0">
      <span className="text-xs font-medium text-foreground">{label}</span>
      <span className="text-[11px] text-muted-foreground leading-snug">{description}</span>
    </label>
    <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);

interface SettingsSelectRowProps {
  label: string;
  description: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
}

const SettingsSelectRow: React.FC<SettingsSelectRowProps> = ({ label, description, value, onValueChange, options }) => (
  <div className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
      <span className="text-xs font-medium text-foreground">{label}</span>
      <span className="text-[11px] text-muted-foreground leading-snug">{description}</span>
    </div>
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-7 w-28 text-[11px] px-2 py-1">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-[11px]">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export const SettingsPanel: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { openExpandedView } = useExpandedView();
  const {
    autoSelectElement,
    ignoreThirdPartyClasses,
    windowPreset,
    globalIgnoredClasses,
    presetIgnoredClasses,
    setAutoSelectElement,
    setIgnoreThirdPartyClasses,
    setWindowPreset,
    setGlobalIgnoredClasses,
    setPresetIgnoredClasses,
  } = useLinterSettings();

  const activePresetId = useSyncExternalStore(subscribePresetChanged, getCurrentPreset, getCurrentPreset);
  const presetIds = getPresetIds();
  const [editingPresetId, setEditingPresetId] = useState(activePresetId);
  const [globalDraft, setGlobalDraft] = useState(() => globalIgnoredClasses.join("\n"));
  const [presetDraft, setPresetDraft] = useState(() => (presetIgnoredClasses[editingPresetId] ?? []).join("\n"));

  useEffect(() => {
    setEditingPresetId(activePresetId);
  }, [activePresetId]);

  useEffect(() => {
    setGlobalDraft(globalIgnoredClasses.join("\n"));
  }, [globalIgnoredClasses]);

  useEffect(() => {
    setPresetDraft((presetIgnoredClasses[editingPresetId] ?? []).join("\n"));
  }, [editingPresetId, presetIgnoredClasses]);

  const isDark = theme === "dark";

  const windowPresetOptions = (Object.keys(WINDOW_PRESETS) as WindowPreset[]).map((key) => ({
    value: key,
    label: WINDOW_PRESETS[key].label,
  }));

  return (
    <Tabs defaultValue="linting" className="gap-0">
      <div className="sticky top-0 z-10 border-b border-border bg-background px-4 py-2">
        <TabsList className="grid h-8 w-full grid-cols-3">
          <TabsTrigger value="linting">Linting</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="linting" className="mt-0 px-4 py-2">
        <SettingsRow
          id="settings-third-party"
          label="Ignore third-party classes"
          description="Skip known library classes (e.g. Swiper, Splide) during linting."
          checked={ignoreThirdPartyClasses}
          onCheckedChange={(checked) => {
            trackSettingChanged({
              setting: "ignore_third_party_classes",
              value: checked,
            });
            setIgnoreThirdPartyClasses(checked);
          }}
        />
        <SettingsRow
          id="settings-auto-select"
          label="Auto-select on canvas"
          description="Automatically select the canvas element when opening a violation."
          checked={autoSelectElement}
          onCheckedChange={(checked) => {
            trackSettingChanged({
              setting: "auto_select_on_canvas",
              value: checked,
            });
            setAutoSelectElement(checked);
          }}
        />
        <div className="py-3 border-b border-border space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-xs font-medium text-foreground">Ignored classes (global)</span>
              <span className="text-[11px] text-muted-foreground leading-snug">
                One class name per line or comma-separated. Applied for every framework preset.
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 shrink-0 px-2 text-[10px] text-muted-foreground"
              onClick={() => {
                trackIgnoredClassListsViewed({ source: "settings" });
                openExpandedView({
                  type: "ignored-classes-lists",
                  title: "Ignored class lists",
                  backTo: { type: "settings", title: "Settings" },
                });
              }}
            >
              View terms
            </Button>
          </div>
          <textarea
            id="settings-global-ignored-classes"
            className="w-full min-h-[72px] rounded-md border border-input bg-background px-2 py-1.5 text-[11px] font-mono leading-snug resize-y"
            value={globalDraft}
            onChange={(e) => setGlobalDraft(e.target.value)}
            onBlur={() => setGlobalIgnoredClasses(parseIgnoredClassesInput(globalDraft))}
            spellCheck={false}
          />
        </div>
        <div className="py-3 border-b border-border last:border-0 space-y-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-foreground">Ignored classes (per preset)</span>
            <span className="text-[11px] text-muted-foreground leading-snug">
              Extra class names to skip when a preset is active, in addition to global and built-in preset terms.
            </span>
          </div>
          <Select value={editingPresetId} onValueChange={setEditingPresetId}>
            <SelectTrigger className="h-7 w-full text-[11px] px-2 py-1">
              <SelectValue placeholder="Preset" />
            </SelectTrigger>
            <SelectContent>
              {presetIds.map((id) => (
                <SelectItem key={id} value={id} className="text-[11px]">
                  {id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <textarea
            id="settings-preset-ignored-classes"
            className="w-full min-h-[72px] rounded-md border border-input bg-background px-2 py-1.5 text-[11px] font-mono leading-snug resize-y"
            value={presetDraft}
            onChange={(e) => setPresetDraft(e.target.value)}
            onBlur={() => setPresetIgnoredClasses(editingPresetId, parseIgnoredClassesInput(presetDraft))}
            spellCheck={false}
          />
        </div>
        <div className="rounded-md border border-border bg-muted/40 p-3 mt-3 space-y-2">
          <p className="text-[11px] font-medium text-foreground">Recognized elements</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            View all element names that Flint recognizes for the active framework preset. Useful for understanding which
            class name segments are valid.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="h-7 w-full"
            onClick={() =>
              openExpandedView({
                type: "recognized-elements",
                title: "Recognized Elements",
                data: { presetId: activePresetId, projectElements: [] },
                backTo: { type: "settings", title: "Settings" },
              })
            }
          >
            <Eye />
            View recognized elements
          </Button>
        </div>
      </TabsContent>
      <TabsContent value="general" className="mt-0 px-4 py-2">
        <SettingsRow
          id="settings-dark-mode"
          label="Dark mode"
          description="Switch between light and dark appearance."
          checked={isDark}
          onCheckedChange={(checked) => {
            trackSettingChanged({ setting: "dark_mode", value: checked });
            setTheme(checked ? "dark" : "light");
          }}
        />
        <SettingsSelectRow
          label="Window size"
          description="Set the default height of the extension panel."
          value={windowPreset}
          onValueChange={(v) => {
            const preset = v as WindowPreset;
            trackSettingChanged({ setting: "window_size", value: preset });
            void applyWindowPreset(preset);
            setWindowPreset(preset);
          }}
          options={windowPresetOptions}
        />
      </TabsContent>
      <TabsContent value="about" className="mt-0 px-4 py-3 space-y-4">
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-foreground">Flint</h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            A Webflow Designer Extension that checks your project against framework best practices. It catches naming
            issues, structural problems, and style conflicts so you can ship cleaner sites with confidence.
          </p>
        </div>

        <div className="rounded-md border border-border bg-muted/40 p-3 space-y-2">
          <p className="text-[11px] font-medium text-foreground">Help us improve Flint</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Found a bug, have a feature request, or just want to share how things are going? We'd love to hear from you.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="w-full bg-[oklch(0.65_0.17_55)] text-white hover:bg-[oklch(0.6_0.17_55)] active:bg-[oklch(0.55_0.17_55)] dark:bg-[oklch(0.72_0.15_55)] dark:hover:bg-[oklch(0.67_0.15_55)] dark:active:bg-[oklch(0.62_0.15_55)]"
            asChild
          >
            <a href="https://www.milesroxas.com/flint-feedback" target="_blank" rel="noopener noreferrer">
              Send feedback
              <ExternalLink className="size-3" />
            </a>
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
          v{buildInfo.version} &middot; {buildInfo.channel} &middot; {buildInfo.recipient}
          <br />
          Built {new Date(buildInfo.buildTime).toLocaleString()}
        </p>
      </TabsContent>
    </Tabs>
  );
};
