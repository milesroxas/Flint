import type React from "react";
import type { WindowPreset } from "@/features/linter/store/linterSettings.store";
import { useLinterSettings } from "@/features/linter/store/linterSettings.store";
import { WINDOW_PRESETS } from "@/features/window/components/HeightSwitcher";
import { applyWindowPreset } from "@/features/window/lib/apply-window-preset";
import { useTheme } from "@/shared/providers/theme-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Switch } from "@/shared/ui/switch";

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
  const {
    autoSelectElement,
    ignoreThirdPartyClasses,
    windowPreset,
    setAutoSelectElement,
    setIgnoreThirdPartyClasses,
    setWindowPreset,
  } = useLinterSettings();

  const isDark = theme === "dark";

  const windowPresetOptions = (Object.keys(WINDOW_PRESETS) as WindowPreset[]).map((key) => ({
    value: key,
    label: WINDOW_PRESETS[key].label,
  }));

  return (
    <div className="px-4 py-2">
      <SettingsRow
        id="settings-dark-mode"
        label="Dark mode"
        description="Switch between light and dark appearance."
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      />
      <SettingsRow
        id="settings-third-party"
        label="Ignore third-party classes"
        description="Skip known library classes (e.g. Swiper, Splide) during linting."
        checked={ignoreThirdPartyClasses}
        onCheckedChange={setIgnoreThirdPartyClasses}
      />
      <SettingsRow
        id="settings-auto-select"
        label="Auto-select on canvas"
        description="Automatically select the canvas element when opening a violation."
        checked={autoSelectElement}
        onCheckedChange={setAutoSelectElement}
      />
      <SettingsSelectRow
        label="Window size"
        description="Set the default height of the extension panel."
        value={windowPreset}
        onValueChange={(v) => {
          const preset = v as WindowPreset;
          void applyWindowPreset(preset);
          setWindowPreset(preset);
        }}
        options={windowPresetOptions}
      />
    </div>
  );
};
