import type { Preset } from "@/features/linter/model/preset.types";

type PresetMap = Map<string, Preset>;

function isPreset(value: unknown): value is Preset {
  const v = value as any;
  return v && typeof v === "object" && typeof v.id === "string" && Array.isArray(v.rules);
}

// Eagerly import all preset modules under this directory
const presetModules = import.meta.glob("./*.preset.ts", {
  eager: true,
}) as Record<string, any>;

const presets: PresetMap = new Map();

for (const mod of Object.values(presetModules)) {
  // Collect any export that looks like a Preset
  for (const candidate of Object.values(mod)) {
    if (isPreset(candidate)) {
      presets.set(candidate.id, candidate);
    }
  }
}

export function getAllPresets(): Preset[] {
  return Array.from(presets.values());
}

export function getPresetIds(): string[] {
  return Array.from(presets.keys());
}

export function getPresetById(id: string | undefined): Preset | undefined {
  if (!id) return undefined;
  return presets.get(id);
}

export function getDefaultPresetId(): string {
  // Prefer lumos when available for stable defaults; else first available; else throw
  if (presets.has("lumos")) return "lumos";
  const first = getPresetIds()[0];
  if (first) return first;
  throw new Error("No presets found. Ensure at least one *.preset.ts exports a Preset object.");
}

export function resolvePresetOrFallback(id?: string): Preset {
  const byId = getPresetById(id ?? "");
  if (byId) return byId;
  const fallback = getPresetById(getDefaultPresetId());
  if (!fallback) {
    throw new Error("Preset resolution failed and no default preset available.");
  }
  return fallback;
}
