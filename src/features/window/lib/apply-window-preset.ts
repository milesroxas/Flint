import type { WindowPreset } from "@/features/linter/store/linterSettings.store";
import { WINDOW_PRESETS } from "@/features/window/components/HeightSwitcher";

const MIN_HEIGHT = 360;
const MAX_HEIGHT = 800;

export async function applyWindowPreset(id: WindowPreset): Promise<void> {
  try {
    const wf = (window as any).webflow;
    if (typeof wf?.setExtensionSize !== "function") return;

    const width = window.innerWidth || 400;
    const requested = WINDOW_PRESETS[id].height;
    const clampedHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, requested));

    await wf.setExtensionSize({ width, height: clampedHeight });
  } catch {
    // ignore
  }
}
