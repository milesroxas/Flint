import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { normalizeIgnoredClassList } from "@/features/linter/lib/class-lint-ignore";

export type WindowPreset = "large" | "medium" | "compact";

const STORAGE_KEY = "flint.linter.settings.v1";

interface StoredSettings {
  autoSelectElement: boolean;
  ignoreThirdPartyClasses: boolean;
  windowPreset: WindowPreset;
  globalIgnoredClasses: string[];
  presetIgnoredClasses: Record<string, string[]>;
}

function loadFromStorage(): StoredSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredSettings>;
      const globalIgnoredClasses = normalizeIgnoredClassList(parsed.globalIgnoredClasses ?? []);
      const rawPreset = parsed.presetIgnoredClasses;
      const presetIgnoredClasses: Record<string, string[]> = {};
      if (rawPreset && typeof rawPreset === "object") {
        for (const [k, v] of Object.entries(rawPreset)) {
          if (Array.isArray(v)) {
            presetIgnoredClasses[k] = normalizeIgnoredClassList(v);
          }
        }
      }
      return {
        autoSelectElement: parsed.autoSelectElement ?? true,
        ignoreThirdPartyClasses: parsed.ignoreThirdPartyClasses ?? true,
        windowPreset: parsed.windowPreset ?? "compact",
        globalIgnoredClasses,
        presetIgnoredClasses,
      };
    }
  } catch {
    // ignore parse errors
  }
  return {
    autoSelectElement: true,
    ignoreThirdPartyClasses: true,
    windowPreset: "compact",
    globalIgnoredClasses: [],
    presetIgnoredClasses: {},
  };
}

function saveToStorage(settings: StoredSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore write errors
  }
}

interface LinterSettingsState {
  autoSelectElement: boolean;
  ignoreThirdPartyClasses: boolean;
  windowPreset: WindowPreset;
  globalIgnoredClasses: string[];
  presetIgnoredClasses: Record<string, string[]>;
}

interface LinterSettingsActions {
  setAutoSelectElement: (enabled: boolean) => void;
  setIgnoreThirdPartyClasses: (enabled: boolean) => void;
  setWindowPreset: (preset: WindowPreset) => void;
  setGlobalIgnoredClasses: (classes: string[]) => void;
  setPresetIgnoredClasses: (presetId: string, classes: string[]) => void;
}

type LinterSettingsStore = LinterSettingsState & LinterSettingsActions;

const initial = loadFromStorage();

export const useLinterSettingsStore = create<LinterSettingsStore>()(
  devtools(
    (set, get) => ({
      ...initial,

      setAutoSelectElement: (enabled: boolean) => {
        set({ autoSelectElement: enabled });
        saveToStorage({ ...get(), autoSelectElement: enabled });
      },

      setIgnoreThirdPartyClasses: (enabled: boolean) => {
        set({ ignoreThirdPartyClasses: enabled });
        saveToStorage({ ...get(), ignoreThirdPartyClasses: enabled });
      },

      setWindowPreset: (preset: WindowPreset) => {
        set({ windowPreset: preset });
        saveToStorage({ ...get(), windowPreset: preset });
      },

      setGlobalIgnoredClasses: (classes: string[]) => {
        const globalIgnoredClasses = normalizeIgnoredClassList(classes);
        set({ globalIgnoredClasses });
        saveToStorage({ ...get(), globalIgnoredClasses });
      },

      setPresetIgnoredClasses: (presetId: string, classes: string[]) => {
        const normalized = normalizeIgnoredClassList(classes);
        const nextMap = { ...get().presetIgnoredClasses, [presetId]: normalized };
        set({ presetIgnoredClasses: nextMap });
        saveToStorage({ ...get(), presetIgnoredClasses: nextMap });
      },
    }),
    { name: "linter-settings-store", serialize: { options: true } }
  )
);

export const useLinterSettings = useLinterSettingsStore;
