import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type WindowPreset = "large" | "medium" | "compact";

const STORAGE_KEY = "flint.linter.settings.v1";

interface StoredSettings {
  autoSelectElement: boolean;
  ignoreThirdPartyClasses: boolean;
  windowPreset: WindowPreset;
}

function loadFromStorage(): StoredSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredSettings>;
      return {
        autoSelectElement: parsed.autoSelectElement ?? true,
        ignoreThirdPartyClasses: parsed.ignoreThirdPartyClasses ?? true,
        windowPreset: parsed.windowPreset ?? "compact",
      };
    }
  } catch {
    // ignore parse errors
  }
  return { autoSelectElement: true, ignoreThirdPartyClasses: true, windowPreset: "compact" };
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
}

interface LinterSettingsActions {
  setAutoSelectElement: (enabled: boolean) => void;
  setIgnoreThirdPartyClasses: (enabled: boolean) => void;
  setWindowPreset: (preset: WindowPreset) => void;
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
    }),
    { name: "linter-settings-store", serialize: { options: true } }
  )
);

export const useLinterSettings = useLinterSettingsStore;
